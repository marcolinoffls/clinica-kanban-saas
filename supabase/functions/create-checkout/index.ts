
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Edge Function: create-checkout
 * 
 * DESCRIÇÃO:
 * Cria uma sessão de checkout do Stripe para usuários autenticados.
 * Esta função verifica se o usuário já existe como cliente no Stripe
 * e cria uma sessão de checkout com os produtos/preços configurados.
 * 
 * FUNCIONAMENTO:
 * 1. Autentica o usuário via token do Supabase
 * 2. Verifica se já existe um cliente Stripe para o email do usuário
 * 3. Cria a sessão de checkout com os parâmetros necessários
 * 4. Retorna a URL da sessão para redirecionamento
 * 
 * INTEGRAÇÃO:
 * - Usa STRIPE_SECRET_KEY dos secrets do Supabase
 * - Conecta com a tabela de clínicas para associar assinaturas
 * - Retorna URL para redirecionamento ao checkout do Stripe
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para logs detalhados
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Tratamento de CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    // Verificar se a chave do Stripe está configurada
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não está configurada");
    }
    logStep("Chave do Stripe verificada");

    // Criar cliente Supabase com service role para operações seguras
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Header de autorização não fornecido");
    }
    logStep("Header de autorização encontrado");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      throw new Error(`Erro na autenticação: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      throw new Error("Usuário não autenticado ou email não disponível");
    }
    logStep("Usuário autenticado", { userId: user.id, email: user.email });

    // Obter dados do corpo da requisição
    const { priceId, planType = "monthly" } = await req.json();
    logStep("Dados da requisição recebidos", { priceId, planType });

    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verificar se o cliente já existe no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Cliente Stripe existente encontrado", { customerId });
    } else {
      logStep("Nenhum cliente Stripe encontrado, será criado automaticamente no checkout");
    }

    // Definir preços padrão se não fornecido
    const defaultPrices = {
      basic_monthly: "price_basic_monthly", // Substitua pelos IDs reais do Stripe
      basic_yearly: "price_basic_yearly",
      premium_monthly: "price_premium_monthly", 
      premium_yearly: "price_premium_yearly"
    };

    const finalPriceId = priceId || defaultPrices.basic_monthly;

    // Criar sessão de checkout
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
        },
      },
    });

    logStep("Sessão de checkout criada", { sessionId: session.id, sessionUrl: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERRO na create-checkout", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
