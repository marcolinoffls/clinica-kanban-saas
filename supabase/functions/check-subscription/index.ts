
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Edge Function: check-subscription
 * 
 * DESCRIÇÃO:
 * Verifica o status da assinatura de um usuário no Stripe e atualiza
 * as informações no banco de dados Supabase. Esta função é chamada:
 * - No login do usuário
 * - Após checkout bem-sucedido
 * - Periodicamente para sincronização
 * 
 * FUNCIONAMENTO:
 * 1. Autentica o usuário
 * 2. Busca cliente no Stripe pelo email
 * 3. Verifica assinaturas ativas
 * 4. Determina tier da assinatura baseado no preço
 * 5. Atualiza dados no Supabase (tabelas clinicas e stripe_subscriptions)
 * 
 * RETORNO:
 * - subscribed: boolean (se tem assinatura ativa)
 * - subscription_tier: string (basic, premium, enterprise)
 * - subscription_end: string (data de fim do período atual)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para logs detalhados
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Usar service role key para operações de escrita no Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Função iniciada");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não está configurada");
    logStep("Chave do Stripe verificada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Header de autorização não fornecido");
    logStep("Header de autorização encontrado");

    const token = authHeader.replace("Bearer ", "");
    logStep("Autenticando usuário com token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Erro na autenticação: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("Usuário não autenticado ou email não disponível");
    logStep("Usuário autenticado", { userId: user.id, email: user.email });

    // Buscar perfil do usuário para obter clinica_id
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('clinica_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile?.clinica_id) {
      logStep("Perfil do usuário ou clínica não encontrados", { error: profileError });
      return new Response(JSON.stringify({ 
        subscribed: false, 
        error: "Perfil do usuário não encontrado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const clinicaId = userProfile.clinica_id;
    logStep("Clínica encontrada", { clinicaId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("Nenhum cliente encontrado, atualizando estado não assinado");
      
      // Atualizar clínica para estado free
      await supabaseClient
        .from("clinicas")
        .update({
          plano_atual: 'free',
          stripe_customer_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clinicaId);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Cliente Stripe encontrado", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Assinatura ativa encontrada", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determinar tier da assinatura baseado no preço
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // Lógica para determinar tier baseado no valor (ajuste conforme seus preços)
      if (amount <= 999) { // até R$ 9,99
        subscriptionTier = "basic";
      } else if (amount <= 2999) { // até R$ 29,99
        subscriptionTier = "premium";
      } else {
        subscriptionTier = "enterprise";
      }
      
      logStep("Tier da assinatura determinado", { priceId, amount, subscriptionTier });
    } else {
      logStep("Nenhuma assinatura ativa encontrada");
    }

    // Atualizar tabela clinicas
    await supabaseClient
      .from("clinicas")
      .update({
        stripe_customer_id: customerId,
        plano_atual: hasActiveSub ? subscriptionTier : 'free',
        plano_expira_em: subscriptionEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clinicaId);

    // Atualizar/inserir na tabela stripe_subscriptions
    if (hasActiveSub && stripeSubscriptionId) {
      const { data: existingSubscription } = await supabaseClient
        .from('stripe_subscriptions')
        .select('id')
        .eq('clinica_id', clinicaId)
        .single();

      const subscriptionData = {
        clinica_id: clinicaId,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active',
        plano: subscriptionTier,
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      };

      if (existingSubscription) {
        await supabaseClient
          .from('stripe_subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id);
      } else {
        await supabaseClient
          .from('stripe_subscriptions')
          .insert([subscriptionData]);
      }
    }

    logStep("Banco de dados atualizado com informações da assinatura", { 
      subscribed: hasActiveSub, 
      subscriptionTier 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERRO na check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
