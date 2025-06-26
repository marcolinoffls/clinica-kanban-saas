
/**
 * Edge Function para criar sessões de checkout do Stripe
 * 
 * O que faz:
 * - Cria sessões de checkout para assinaturas recorrentes
 * - Gerencia planos: Básico (R$ 97/mês) e Premium (R$ 197/mês)
 * - Cria ou utiliza clientes existentes no Stripe
 * - Retorna URL de checkout para redirecionamento
 * 
 * Como usar:
 * - POST /create-stripe-checkout
 * - Body: { clinicaId: string, priceId: string }
 * - Retorna: { checkoutUrl: string }
 * 
 * Planos disponíveis:
 * - price_basic: R$ 97/mês
 * - price_premium: R$ 197/mês
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  clinicaId: string;
  priceId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 [create-stripe-checkout] Iniciando criação de sessão de checkout');

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
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

    // Parse request body
    const { clinicaId, priceId }: CheckoutRequest = await req.json();

    if (!clinicaId || !priceId) {
      return new Response(
        JSON.stringify({ error: 'clinicaId e priceId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🏥 [create-stripe-checkout] Processando checkout para clínica: ${clinicaId}, preço: ${priceId}`);

    // Buscar dados da clínica
    const { data: clinica, error: clinicaError } = await supabase
      .from('clinicas')
      .select('id, nome, email, stripe_customer_id')
      .eq('id', clinicaId)
      .single();

    if (clinicaError || !clinica) {
      console.error('❌ [create-stripe-checkout] Erro ao buscar clínica:', clinicaError);
      return new Response(
        JSON.stringify({ error: 'Clínica não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar ou buscar cliente no Stripe
    let stripeCustomerId = clinica.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log('👤 [create-stripe-checkout] Criando novo cliente no Stripe');
      const customer = await stripe.customers.create({
        email: clinica.email,
        name: clinica.nome,
        metadata: {
          clinica_id: clinica.id,
        },
      });

      stripeCustomerId = customer.id;

      // Salvar o ID do cliente no banco
      await supabase
        .from('clinicas')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', clinicaId);

      console.log(`✅ [create-stripe-checkout] Cliente criado no Stripe: ${stripeCustomerId}`);
    } else {
      console.log(`🔄 [create-stripe-checkout] Usando cliente existente: ${stripeCustomerId}`);
    }

    // Mapear priceId para valores em reais (para metadata)
    const planoInfo = {
      price_basic: { nome: 'Plano Básico', valor: 97.00 },
      price_premium: { nome: 'Plano Premium', valor: 197.00 }
    }[priceId] || { nome: 'Plano Personalizado', valor: 0 };

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?checkout=success`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?checkout=canceled`,
      metadata: {
        clinica_id: clinicaId,
        plano_nome: planoInfo.nome,
        plano_valor: planoInfo.valor.toString(),
      },
      subscription_data: {
        metadata: {
          clinica_id: clinicaId,
        },
        trial_period_days: 14, // 14 dias de teste grátis
      },
      allow_promotion_codes: true, // Permite códigos promocionais
    });

    console.log(`✅ [create-stripe-checkout] Sessão de checkout criada: ${session.id}`);

    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ [create-stripe-checkout] Erro:', error);
    
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
