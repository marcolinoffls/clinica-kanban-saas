
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Edge Function: customer-portal
 * 
 * DESCRIÇÃO:
 * Cria uma sessão do Portal do Cliente do Stripe para permitir que
 * usuários gerenciem suas assinaturas. Agora suporta alternância entre
 * ambiente de teste e produção através da variável ENVIRONMENT.
 * 
 * FUNCIONAMENTO:
 * 1. Autentica o usuário
 * 2. Determina o ambiente (test/production) pela variável ENVIRONMENT
 * 3. Usa a chave Stripe apropriada para o ambiente
 * 4. Busca o cliente no Stripe pelo email
 * 5. Cria sessão do portal do cliente
 * 6. Retorna URL para redirecionamento
 * 
 * CONFIGURAÇÃO DE AMBIENTE:
 * - ENVIRONMENT=test: Usa STRIPE_SECRET_KEY_TESTE
 * - ENVIRONMENT=production: Usa STRIPE_SECRET_KEY
 * 
 * IMPORTANTE: Para usar o portal em modo teste, é necessário configurar
 * as configurações do portal no dashboard do Stripe em:
 * https://dashboard.stripe.com/test/settings/billing/portal
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para logs de debug com indicação do ambiente
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    // Obter chave Stripe e ambiente
    const { key: stripeKey, environment } = getStripeKey();

    // Inicializar cliente Supabase com service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Header de autorização não fornecido");
    logStep("Header de autorização encontrado");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Erro na autenticação: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("Usuário não autenticado ou email não disponível");
    logStep("Usuário autenticado", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new Error("Nenhum cliente Stripe encontrado para este usuário");
    }
    
    const customerId = customers.data[0].id;
    logStep("Cliente Stripe encontrado", { customerId });

    // Obter origem para URL de retorno
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    try {
      // Criar sessão do portal do cliente
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/billing`,
      });
      
      logStep("Sessão do portal do cliente criada", { 
        sessionId: portalSession.id, 
        url: portalSession.url,
        environment
      });

      return new Response(JSON.stringify({ 
        url: portalSession.url,
        environment: environment
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (portalError: any) {
      // Tratamento específico para erro de configuração do portal
      if (portalError.message?.includes("No configuration provided")) {
        const errorMsg = environment === "test" 
          ? "Portal do cliente não configurado em modo teste. Por favor, configure em: https://dashboard.stripe.com/test/settings/billing/portal"
          : "Portal do cliente não configurado. Por favor, configure em: https://dashboard.stripe.com/settings/billing/portal";
        
        logStep("Erro de configuração do portal", { 
          environment,
          configUrl: environment === "test" 
            ? "https://dashboard.stripe.com/test/settings/billing/portal"
            : "https://dashboard.stripe.com/settings/billing/portal"
        });
        
        return new Response(JSON.stringify({ 
          error: errorMsg,
          configUrl: environment === "test" 
            ? "https://dashboard.stripe.com/test/settings/billing/portal"
            : "https://dashboard.stripe.com/settings/billing/portal"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      
      throw portalError; // Re-throw se não for erro de configuração
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERRO no customer-portal", { 
      message: errorMessage,
      environment: Deno.env.get("ENVIRONMENT") || "test"
    });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
