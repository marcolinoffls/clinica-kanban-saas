
# Configuração do Supabase Realtime para Mensagens

## Passo a passo para habilitar atualizações em tempo real:

### 1. Acessar o Painel do Supabase
- Faça login no [Supabase Dashboard](https://supabase.com/dashboard)
- Selecione seu projeto (wabnuxerjnecrjynyyfo)

### 2. Habilitar Realtime para a tabela chat_mensagens
- No menu lateral, clique em **"Database"**
- Clique em **"Replication"**
- Localize a tabela **"chat_mensagens"** na lista
- Clique no **toggle** ao lado da tabela para habilitá-la
- Certifique-se de que as opções **INSERT**, **UPDATE** e **DELETE** estão marcadas
- Clique em **"Save"** para confirmar

### 3. Verificar as configurações
- A tabela `chat_mensagens` deve aparecer com status **"Enabled"**
- Verifique se todas as operações (INSERT, UPDATE, DELETE) estão ativas

### 4. Configuração alternativa via SQL (se necessário)
Se a interface não estiver funcionando, você pode executar este SQL:

```sql
-- Habilitar replica identity para capturar dados completos
ALTER TABLE public.chat_mensagens REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_mensagens;
```

### 5. Testar a configuração
Após a configuração:
1. Abra a interface de chat no seu SaaS
2. Use uma ferramenta como Postman para enviar uma mensagem via webhook para `/functions/v1/receive-message`
3. A mensagem deve aparecer automaticamente na interface sem necessidade de recarregar a página

## Estrutura do payload para teste:

```json
{
  "sender": "5583999998888",
  "content": "Teste de mensagem em tempo real",
  "message_type": "text",
  "clinica_id": "00000000-0000-0000-0000-000000000001",
  "timestamp": "2025-05-26T12:00:00Z"
}
```

## Headers necessários para o teste:
```
Authorization: Bearer [SEU_JWT_TOKEN]
Content-Type: application/json
```

## Troubleshooting:
- Se as mensagens não aparecerem em tempo real, verifique o console do navegador
- Certifique-se de que a tabela está corretamente configurada na replicação
- Verifique se o JWT está sendo validado corretamente na Edge Function
