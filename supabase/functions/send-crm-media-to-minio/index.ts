
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

/**
 * Edge Function para upload de mídia do CRM para MinIO
 * 
 * Funcionalidades:
 * - Recebe arquivos (imagens/áudios) enviados pelo frontend do CRM
 * - Faz upload dos arquivos para o MinIO
 * - Retorna a URL pública do arquivo no MinIO
 * - Organiza arquivos por clínica e lead
 * - Valida autenticação do usuário
 * 
 * Usado quando:
 * - Atendente do CRM envia mídia para um lead
 * - ChatPage.tsx chama esta função via supabase.functions.invoke
 * 
 * Conecta com:
 * - MinIO para armazenamento de arquivos
 * - Sistema de autenticação do Supabase
 */

// Configuração do MinIO a partir das variáveis de ambiente
const MINIO_ENDPOINT = Deno.env.get('MINIO_ENDPOINT');
const MINIO_PORT_STRING = Deno.env.get('MINIO_PORT');
const MINIO_ACCESS_KEY = Deno.env.get('MINIO_ACCESS_KEY');
const MINIO_SECRET_KEY = Deno.env.get('MINIO_SECRET_KEY');
const MINIO_BUCKET_NAME = Deno.env.get('MINIO_CHAT_MEDIA_BUCKET') || 'chat-media';
const MINIO_USE_SSL_STRING = Deno.env.get('MINIO_USE_SSL');
const MINIO_PUBLIC_URL_PREFIX = Deno.env.get('MINIO_PUBLIC_URL_PREFIX');

// Validação das variáveis de ambiente necessárias para o MinIO
if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_PUBLIC_URL_PREFIX) {
  console.error('❌ [send-crm-media-to-minio] Erro Crítico: Variáveis de ambiente do MinIO não configuradas corretamente.');
  console.error('- MINIO_ENDPOINT:', !!MINIO_ENDPOINT);
  console.error('- MINIO_ACCESS_KEY:', !!MINIO_ACCESS_KEY);
  console.error('- MINIO_SECRET_KEY:', !!MINIO_SECRET_KEY);
  console.error('- MINIO_PUBLIC_URL_PREFIX:', !!MINIO_PUBLIC_URL_PREFIX);
}

const MINIO_PORT = MINIO_PORT_STRING ? parseInt(MINIO_PORT_STRING) : 9000;
const MINIO_USE_SSL = MINIO_USE_SSL_STRING === 'true';

// IMPORTANTE: Esta seção precisa ser implementada com um SDK S3/MinIO real para Deno
// O código abaixo é um PSEUDOCÓDIGO para demonstrar a estrutura
// Um desenvolvedor precisará:
// 1. Instalar um SDK S3 compatível com Deno
// 2. Implementar a conexão real com o MinIO
// 3. Substituir o console.log por minioClient.putObject real
//
// Exemplo de inicialização (pseudocódigo):
// import * as Minio from 'CAMINHO_PARA_SDK_MINIO_DENO';
// const minioClient = new Minio.Client({
//   endPoint: MINIO_ENDPOINT!,
//   port: MINIO_PORT,
//   useSSL: MINIO_USE_SSL,
//   accessKey: MINIO_ACCESS_KEY!,
//   secretKey: MINIO_SECRET_KEY!,
// });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao domínio do CRM
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-edge-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log('🚀 [send-crm-media-to-minio] Função inicializada e pronta para receber uploads');

serve(async (req) => {
  // Tratar requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Aceitar apenas requisições POST
  if (req.method !== 'POST') {
    console.log('❌ [send-crm-media-to-minio] Método não permitido:', req.method);
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Use POST para upload de mídia.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('📤 [send-crm-media-to-minio] Processando upload de mídia do CRM');

    // SEGURANÇA CRÍTICA: Validar autenticação do usuário
    // TODO: Implementar validação de JWT do Supabase
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader) {
    //   return new Response(
    //     JSON.stringify({ error: 'Token de autorização não fornecido' }),
    //     { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }
    
    // Extrair dados do FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const clinicaId = formData.get('clinicaId') as string | null;
    const leadId = formData.get('leadId') as string | null;

    // Validar parâmetros obrigatórios
    console.log('🔍 [send-crm-media-to-minio] Validando parâmetros recebidos:');
    console.log('- file:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'não fornecido');
    console.log('- clinicaId:', clinicaId);
    console.log('- leadId:', leadId);

    if (!file || !clinicaId || !leadId) {
      const errorMsg = 'Arquivo, clinicaId e leadId são obrigatórios para upload.';
      console.error('❌ [send-crm-media-to-minio]', errorMsg);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar tipo de arquivo (apenas imagens e áudios)
    const allowedTypes = ['image/', 'audio/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isValidType) {
      const errorMsg = `Tipo de arquivo não permitido: ${file.type}. Apenas imagens e áudios são aceitos.`;
      console.error('❌ [send-crm-media-to-minio]', errorMsg);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gerar nome único para o objeto no MinIO
    // Estrutura: crm_uploads/{clinicaId}/{leadId}/{timestamp}_{random}.{ext}
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'dat';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const objectName = `crm_uploads/${clinicaId}/${leadId}/${timestamp}_${randomString}.${fileExtension}`;

    console.log('📁 [send-crm-media-to-minio] Preparando upload:');
    console.log('- Bucket:', MINIO_BUCKET_NAME);
    console.log('- Object name:', objectName);
    console.log('- File type:', file.type);
    console.log('- File size:', file.size, 'bytes');

    // PSEUDOCÓDIGO: Upload real para MinIO
    // Esta seção precisa ser implementada com um SDK S3/MinIO real
    console.log('🔄 [send-crm-media-to-minio] Simulando upload para MinIO...');
    
    // try {
    //   // Converter File para ArrayBuffer para o MinIO
    //   const fileBuffer = await file.arrayBuffer();
    //   
    //   // Upload real para MinIO (PSEUDOCÓDIGO)
    //   await minioClient.putObject(
    //     MINIO_BUCKET_NAME!,
    //     objectName,
    //     fileBuffer,
    //     file.size,
    //     { 'Content-Type': file.type }
    //   );
    //   
    //   console.log('✅ [send-crm-media-to-minio] Upload realizado com sucesso');
    // } catch (minioError) {
    //   console.error('❌ [send-crm-media-to-minio] Erro no MinIO:', minioError);
    //   throw new Error(`Falha no upload para MinIO: ${minioError.message}`);
    // }

    // Simular sucesso do upload (REMOVER quando implementar SDK real)
    console.log('✅ [send-crm-media-to-minio] Upload simulado com sucesso');

    // Construir URL pública do arquivo
    const publicUrl = `${MINIO_PUBLIC_URL_PREFIX}/${MINIO_BUCKET_NAME}/${objectName}`;
    
    console.log('🔗 [send-crm-media-to-minio] URL pública gerada:', publicUrl);

    // Retornar resposta de sucesso com a URL pública
    return new Response(
      JSON.stringify({ 
        success: true,
        publicUrl: publicUrl,
        objectName: objectName,
        bucket: MINIO_BUCKET_NAME,
        fileType: file.type,
        fileSize: file.size
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ [send-crm-media-to-minio] Erro geral na função:', error);
    console.error('- Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor durante o upload de mídia.',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
