
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Edge Function: create-checkout
 * 
 * DESCRIÇÃO:
 * Cria uma sessão de checkout do Stripe para usuários autenticados.
 * Agora usa variáveis de ambiente para configurar os Price IDs,
 * permitindo configuração flexível entre teste e produção.
 * 
 * FUNCIONAMENTO:
 * 1. Autentica o usuário via token do Supabase
 * 2. Determina o ambiente (test/production) pela variável ENVIRONMENT
 * 3. Usa as variáveis de ambiente para obter os Price IDs corretos
 * 4. Verifica se já existe um cliente Stripe para o email do usuário
 * 5. Cria a sessão de checkout com os parâmetros necessários
 * 6. Retorna a URL da sessão para redirecionamento
 * 
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 * - ENVIRONMENT: 'test' ou 'production'
 * - STRIPE_SECRET_KEY_TESTE: Chave secreta do Stripe para teste
 * - STRIPE_SECRET_KEY: Chave secreta do Stripe para produção
 * - STRIPE_PRICE_BASIC_TEST: Price ID do plano básico para teste
 * - STRIPE_PRICE_PREMIUM_TEST: Price ID do plano premium para teste
 * - STRIPE_PRICE_BASIC_PROD: Price ID do plano básico para produção
 * - STRIPE_PRICE_PREMIUM_PROD: Price ID do plano premium para produção
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para logs detalhados com indicação do ambiente
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Função para obter Price IDs baseado no ambiente usando variáveis
const getPriceIds = (environment: string) => {
  if (environment === "production") {
    logStep("Carregando Price IDs de PRODUÇÃO das variáveis de ambiente");
    return {
      basic: Deno.env.get("STRIPE_PRICE_BASIC_PROD") || "price_PROD_basic_not_configured",
      premium: Deno.env.get("STRIPE_PRICE_PREMIUM_PROD") || "price_PROD_premium_not_configured"
    };
  } else {
    logStep("Carregando Price IDs de TESTE das variáveis de ambiente");
    return {
      basic: Deno.env.get("STRIPE_PRICE_BASIC_TEST") || "price_1ReLiFQAOfvkgjNZQkB2StTz",
      premium: Deno.env.get("STRIPE_PRICE_PREMIUM_TEST") || "price_1RcAXAQAOfvkgjNZRJA1kxug"
    };
  }
};

// Função para determinar o plano baseado no Price ID
const getPlanFromPriceId = (priceId: string, environment: string) => {
  const priceIds = getPriceIds(environment);
  if (priceId === priceIds.basic) return "basic";
  if (priceId === priceIds.premium) return "premium";
  return "unknown";
};

// Função para obter a chave Stripe baseada no ambiente
const getStripeKey = () => {
  const environment = Deno.env.get("ENVIRONMENT") || "test";
  logStep("Ambiente detectado", { environment });
  
  if (environment === "production") {
    const prodKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!prodKey) throw new Error("STRIPE_SECRET_KEY (produção) não está configurada");
    logStep("Usando chave de PRODUÇÃO");
    return { key: prodKey, environment };
  } else {
    const testKey = Deno.env.get("STRIPE_SECRET_KEY_TESTE");
    if (!testKey) throw new Error("STRIPE_SECRET_KEY_TESTE não está configurada");
    logStep("Usando chave de TESTE");
    return { key: testKey, environment };
  }
};

serve(async (req) => {
  // Tratamento de CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    // Obter chave Stripe e ambiente
    const { key: stripeKey, environment } = getStripeKey();

    // Obter Price IDs das variáveis de ambiente
    const availablePriceIds = getPriceIds(environment);
    logStep("Price IDs carregados", { environment, priceIds: availablePriceIds });

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
    logStep("Dados da requisição recebidos", { priceId, planType, environment });

    // Validar se o Price ID fornecido existe nas variáveis configuradas
    const plan = getPlanFromPriceId(priceId, environment);
    if (plan === "unknown") {
      logStep("AVISO: Price ID não reconhecido", { priceId, availablePriceIds });
    }

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

    // Usar o Price ID fornecido ou o básico como padrão
    const finalPriceId = priceId || availablePriceIds.basic;
    
    logStep("Price ID final determinado", { 
      requestedPriceId: priceId,
      finalPriceId, 
      environment,
      plan: getPlanFromPriceId(finalPriceId, environment)
    });

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
        environment: environment,
        plan: getPlanFromPriceId(finalPriceId, environment),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
          environment: environment,
          plan: getPlanFromPriceId(finalPriceId, environment),
        },
      },
    });

    logStep("Sessão de checkout criada", { 
      sessionId: session.id, 
      sessionUrl: session.url,
      environment,
      priceId: finalPriceId,
      plan: getPlanFromPriceId(finalPriceId, environment)
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      environment: environment,
      plan: getPlanFromPriceId(finalPriceId, environment)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERRO na create-checkout", { 
      message: errorMessage,
      environment: Deno.env.get("ENVIRONMENT") || "test"
    });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
