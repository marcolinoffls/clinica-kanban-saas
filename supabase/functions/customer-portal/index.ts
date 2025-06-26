
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Edge Function: customer-portal
 * 
 * DESCRIÇÃO:
 * Cria uma sessão do Portal do Cliente do Stripe para permitir que
 * usuários gerenciem suas assinaturas (cancelar, alterar método de pagamento,
 * fazer upgrade/downgrade de planos, ver histórico de faturas).
 * 
 * FUNCIONAMENTO:
 * 1. Autentica o usuário
 * 2. Busca o cliente no Stripe pelo email
 * 3. Cria sessão do portal do cliente
 * 4. Retorna URL para redirecionamento
 * 
 * CARACTERÍSTICAS:
 * - Permite gerenciamento completo da assinatura
 * - Interface nativa do Stripe (confiável e segura)
 * - Retorno automático para a aplicação após ações
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para logs de debug
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não está configurada");
    logStep("Chave do Stripe verificada");

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
    
    // Criar sessão do portal do cliente
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    });
    
    logStep("Sessão do portal do cliente criada", { 
      sessionId: portalSession.id, 
      url: portalSession.url 
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERRO no customer-portal", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
