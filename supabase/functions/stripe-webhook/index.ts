
/**
 * Edge Function para processar webhooks do Stripe
 * 
 * O que faz:
 * - Processa eventos de webhooks do Stripe
 * - Atualiza status de assinaturas no banco de dados
 * - Gerencia mudanças de planos e cancelamentos
 * - Mantém sincronização entre Stripe e Supabase
 * 
 * Eventos processados:
 * - customer.subscription.created
 * - customer.subscription.updated  
 * - customer.subscription.deleted
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * 
 * Configuração no Stripe:
 * - URL: https://seu-projeto.supabase.co/functions/v1/stripe-webhook
 * - Eventos: subscription.*, checkout.session.completed, invoice.*
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎯 [stripe-webhook] Recebendo webhook do Stripe');

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    // Verify webhook signature (se o webhook secret estiver configurado)
    let event;
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('❌ [stripe-webhook] Webhook signature verification failed:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }
    } else {
      // Se não tem webhook secret configurado, parse o JSON diretamente
      event = JSON.parse(body);
    }

    console.log(`📨 [stripe-webhook] Processando evento: ${event.type}`);

    // Process different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`💳 [stripe-webhook] Checkout concluído: ${session.id}`);
        
        if (session.mode === 'subscription') {
          const clinicaId = session.metadata?.clinica_id;
          if (clinicaId) {
            // Atualizar clínica com informações do checkout
            await supabase
              .from('clinicas')
              .update({
                stripe_customer_id: session.customer,
                plano_atual: 'trial', // Inicia em trial
                plano_expira_em: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
              })
              .eq('id', clinicaId);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`🔄 [stripe-webhook] Assinatura ${event.type === 'customer.subscription.created' ? 'criada' : 'atualizada'}: ${subscription.id}`);
        
        const clinicaId = subscription.metadata?.clinica_id;
        if (!clinicaId) {
          console.warn('⚠️ [stripe-webhook] clinica_id não encontrado nos metadados da assinatura');
          break;
        }

        // Determinar plano baseado no price_id
        const priceId = subscription.items.data[0]?.price.id;
        let planoAtual = 'free';
        let valorMensal = 0;

        // Mapear price_id para plano (você precisa configurar estes IDs no Stripe)
        if (priceId === 'price_basic') {
          planoAtual = 'basic';
          valorMensal = 97.00;
        } else if (priceId === 'price_premium') {
          planoAtual = 'premium';
          valorMensal = 197.00;
        }

        // Atualizar ou criar registro de assinatura
        const { error: upsertError } = await supabase
          .from('stripe_subscriptions')
          .upsert({
            clinica_id: clinicaId,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status,
            plano: planoAtual,
            valor_mensal: valorMensal,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (upsertError) {
          console.error('❌ [stripe-webhook] Erro ao atualizar assinatura:', upsertError);
        }

        // Atualizar informações da clínica
        await supabase
          .from('clinicas')
          .update({
            plano_atual: planoAtual,
            plano_expira_em: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: subscription.customer,
          })
          .eq('id', clinicaId);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`❌ [stripe-webhook] Assinatura cancelada: ${subscription.id}`);
        
        const clinicaId = subscription.metadata?.clinica_id;
        if (clinicaId) {
          // Atualizar status da assinatura
          await supabase
            .from('stripe_subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          // Voltar clínica para plano gratuito
          await supabase
            .from('clinicas')
            .update({
              plano_atual: 'free',
              plano_expira_em: null,
            })
            .eq('id', clinicaId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`✅ [stripe-webhook] Pagamento aprovado: ${invoice.id}`);
        
        if (invoice.subscription) {
          // Buscar assinatura associada
          const { data: subscription } = await supabase
            .from('stripe_subscriptions')
            .select('clinica_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (subscription) {
            // Atualizar status para ativo se estava em trial
            await supabase
              .from('stripe_subscriptions')
              .update({ status: 'active' })
              .eq('stripe_subscription_id', invoice.subscription);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`❌ [stripe-webhook] Pagamento falhou: ${invoice.id}`);
        
        if (invoice.subscription) {
          // Atualizar status para past_due
          await supabase
            .from('stripe_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }

      default:
        console.log(`ℹ️ [stripe-webhook] Evento não processado: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ [stripe-webhook] Erro:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
