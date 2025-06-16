export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          actor_description: string
          clinica_id: string | null
          created_at: string | null
          details: string | null
          id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          actor_description: string
          clinica_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          actor_description?: string
          clinica_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_aliases: {
        Row: {
          ad_alias: string
          ad_name_original: string
          clinica_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          ad_alias: string
          ad_name_original: string
          clinica_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          ad_alias?: string
          ad_name_original?: string
          clinica_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          cliente_id: string | null
          clinica_id: string | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          status: string | null
          titulo: string
          updated_at: string | null
          usuario_id: string | null
          valor: number | null
        }
        Insert: {
          cliente_id?: string | null
          clinica_id?: string | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          status?: string | null
          titulo: string
          updated_at?: string | null
          usuario_id?: string | null
          valor?: number | null
        }
        Update: {
          cliente_id?: string | null
          clinica_id?: string | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          status?: string | null
          titulo?: string
          updated_at?: string | null
          usuario_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      buffer: {
        Row: {
          created_at: string
          id: number
          id_mensagem: string | null
          Mensagem: string | null
          Mensagem_audio: string | null
          Nome: string | null
          timestamp_webhook: number | null
          Whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_mensagem?: string | null
          Mensagem?: string | null
          Mensagem_audio?: string | null
          Nome?: string | null
          timestamp_webhook?: number | null
          Whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          id_mensagem?: string | null
          Mensagem?: string | null
          Mensagem_audio?: string | null
          Nome?: string | null
          timestamp_webhook?: number | null
          Whatsapp?: string | null
        }
        Relationships: []
      }
      chat_mensagens: {
        Row: {
          anexo_url: string | null
          clinica_id: string
          conteudo: string
          created_at: string | null
          enviado_por: string
          id: string
          lead_id: string
          lida: boolean | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          anexo_url?: string | null
          clinica_id: string
          conteudo: string
          created_at?: string | null
          enviado_por: string
          id?: string
          lead_id: string
          lida?: boolean | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          anexo_url?: string | null
          clinica_id?: string
          conteudo?: string
          created_at?: string | null
          enviado_por?: string
          id?: string
          lead_id?: string
          lida?: boolean | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_mensagens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_mensagens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      clinica_servicos: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string | null
          id: string
          nome_servico: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string | null
          id?: string
          nome_servico: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string | null
          id?: string
          nome_servico?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinica_servicos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinica_servicos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          admin_prompt: string | null
          ai_active_for_ad_leads_only: boolean | null
          ai_active_for_all_new_leads: boolean | null
          ai_active_saturday: boolean | null
          ai_active_sunday: boolean | null
          ai_business_hours_end_weekday: string | null
          ai_business_hours_start_weekday: string | null
          ai_chat_suggestions_active: boolean | null
          ai_clinica_prompt: string | null
          ai_name: string | null
          ai_operating_mode: string | null
          ai_restricted_topics_prompt: string | null
          ai_saturday_hours_end: string | null
          ai_saturday_hours_start: string | null
          ai_sunday_hours_end: string | null
          ai_sunday_hours_start: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string | null
          email: string
          endereco: string | null
          endereco_completo: string | null
          estado: string | null
          evolution_api_key: string | null
          evolution_instance_name: string | null
          horario_funcionamento: Json | null
          id: string
          instagram_api_token: string | null
          instagram_user_handle: string | null
          instagram_webhook_type: string | null
          instagram_webhook_url: string | null
          integracao_instance_id: string | null
          nome: string
          plano_contratado: string | null
          razao_social: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          webhook_usuario: string | null
        }
        Insert: {
          admin_prompt?: string | null
          ai_active_for_ad_leads_only?: boolean | null
          ai_active_for_all_new_leads?: boolean | null
          ai_active_saturday?: boolean | null
          ai_active_sunday?: boolean | null
          ai_business_hours_end_weekday?: string | null
          ai_business_hours_start_weekday?: string | null
          ai_chat_suggestions_active?: boolean | null
          ai_clinica_prompt?: string | null
          ai_name?: string | null
          ai_operating_mode?: string | null
          ai_restricted_topics_prompt?: string | null
          ai_saturday_hours_end?: string | null
          ai_saturday_hours_start?: string | null
          ai_sunday_hours_end?: string | null
          ai_sunday_hours_start?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string | null
          email: string
          endereco?: string | null
          endereco_completo?: string | null
          estado?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          horario_funcionamento?: Json | null
          id?: string
          instagram_api_token?: string | null
          instagram_user_handle?: string | null
          instagram_webhook_type?: string | null
          instagram_webhook_url?: string | null
          integracao_instance_id?: string | null
          nome: string
          plano_contratado?: string | null
          razao_social?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          webhook_usuario?: string | null
        }
        Update: {
          admin_prompt?: string | null
          ai_active_for_ad_leads_only?: boolean | null
          ai_active_for_all_new_leads?: boolean | null
          ai_active_saturday?: boolean | null
          ai_active_sunday?: boolean | null
          ai_business_hours_end_weekday?: string | null
          ai_business_hours_start_weekday?: string | null
          ai_chat_suggestions_active?: boolean | null
          ai_clinica_prompt?: string | null
          ai_name?: string | null
          ai_operating_mode?: string | null
          ai_restricted_topics_prompt?: string | null
          ai_saturday_hours_end?: string | null
          ai_saturday_hours_start?: string | null
          ai_sunday_hours_end?: string | null
          ai_sunday_hours_start?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string | null
          email?: string
          endereco?: string | null
          endereco_completo?: string | null
          estado?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          horario_funcionamento?: Json | null
          id?: string
          instagram_api_token?: string | null
          instagram_user_handle?: string | null
          instagram_webhook_type?: string | null
          instagram_webhook_url?: string | null
          integracao_instance_id?: string | null
          nome?: string
          plano_contratado?: string | null
          razao_social?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          webhook_usuario?: string | null
        }
        Relationships: []
      }
      etapas_kanban: {
        Row: {
          clinica_id: string | null
          created_at: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          clinica_id?: string | null
          created_at?: string | null
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          clinica_id?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "etapas_kanban_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_kanban_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_campaigns: {
        Row: {
          apenas_dias_uteis: boolean | null
          ativo: boolean
          clinica_id: string
          created_at: string
          descricao: string | null
          dias_inatividade: number
          horario_envio: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          apenas_dias_uteis?: boolean | null
          ativo?: boolean
          clinica_id: string
          created_at?: string
          descricao?: string | null
          dias_inatividade?: number
          horario_envio?: string | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          apenas_dias_uteis?: boolean | null
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          descricao?: string | null
          dias_inatividade?: number
          horario_envio?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_campaigns_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_campaigns_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_execucoes: {
        Row: {
          campaign_id: string
          created_at: string
          data_agendada: string
          data_enviado: string | null
          erro_detalhes: string | null
          id: string
          lead_id: string
          mensagem_id: string | null
          status: string
          template_id: string
          tipo_execucao: string
          updated_at: string
          user_id_manual: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          data_agendada: string
          data_enviado?: string | null
          erro_detalhes?: string | null
          id?: string
          lead_id: string
          mensagem_id?: string | null
          status?: string
          template_id: string
          tipo_execucao?: string
          updated_at?: string
          user_id_manual?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          data_agendada?: string
          data_enviado?: string | null
          erro_detalhes?: string | null
          id?: string
          lead_id?: string
          mensagem_id?: string | null
          status?: string
          template_id?: string
          tipo_execucao?: string
          updated_at?: string
          user_id_manual?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_execucoes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "follow_up_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_execucoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_execucoes_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "chat_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_execucoes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "follow_up_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_execucoes_user_id_manual_fkey"
            columns: ["user_id_manual"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      follow_up_templates: {
        Row: {
          ativo: boolean
          campaign_id: string
          conteudo: string
          created_at: string
          id: string
          intervalo_dias: number
          sequencia: number
          tipo_mensagem: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          campaign_id: string
          conteudo: string
          created_at?: string
          id?: string
          intervalo_dias?: number
          sequencia: number
          tipo_mensagem?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          campaign_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          intervalo_dias?: number
          sequencia?: number
          tipo_mensagem?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_templates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "follow_up_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ad_ink: string | null
          ad_name: string | null
          ai_conversation_enabled: boolean | null
          anotacoes: string | null
          anuncio: string | null
          avatar_url: string | null
          clinica_id: string | null
          convertido: boolean | null
          created_at: string | null
          data_ultimo_contato: string | null
          data_ultimo_followup: string | null
          email: string | null
          etapa_kanban_id: string | null
          follow_up_pausado: boolean | null
          id: string
          id_direct: string | null
          ltv: number | null
          meu_id_direct: string | null
          name: string | null
          nome: string | null
          nome_clinica: string | null
          notes: string | null
          origem_lead: string | null
          phone: string | null
          servico_interesse: string | null
          status_conversao: string | null
          tag_id: string | null
          tag_id_alias: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ad_ink?: string | null
          ad_name?: string | null
          ai_conversation_enabled?: boolean | null
          anotacoes?: string | null
          anuncio?: string | null
          avatar_url?: string | null
          clinica_id?: string | null
          convertido?: boolean | null
          created_at?: string | null
          data_ultimo_contato?: string | null
          data_ultimo_followup?: string | null
          email?: string | null
          etapa_kanban_id?: string | null
          follow_up_pausado?: boolean | null
          id?: string
          id_direct?: string | null
          ltv?: number | null
          meu_id_direct?: string | null
          name?: string | null
          nome?: string | null
          nome_clinica?: string | null
          notes?: string | null
          origem_lead?: string | null
          phone?: string | null
          servico_interesse?: string | null
          status_conversao?: string | null
          tag_id?: string | null
          tag_id_alias?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_ink?: string | null
          ad_name?: string | null
          ai_conversation_enabled?: boolean | null
          anotacoes?: string | null
          anuncio?: string | null
          avatar_url?: string | null
          clinica_id?: string | null
          convertido?: boolean | null
          created_at?: string | null
          data_ultimo_contato?: string | null
          data_ultimo_followup?: string | null
          email?: string | null
          etapa_kanban_id?: string | null
          follow_up_pausado?: boolean | null
          id?: string
          id_direct?: string | null
          ltv?: number | null
          meu_id_direct?: string | null
          name?: string | null
          nome?: string | null
          nome_clinica?: string | null
          notes?: string | null
          origem_lead?: string | null
          phone?: string | null
          servico_interesse?: string | null
          status_conversao?: string | null
          tag_id?: string | null
          tag_id_alias?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_etapa_kanban_id_fkey"
            columns: ["etapa_kanban_id"]
            isOneToOne: false
            referencedRelation: "etapas_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          cliente_id: string | null
          clinica_id: string | null
          conteudo: string
          created_at: string | null
          enviado_por: string
          id: string
          lida: boolean | null
          tipo: string | null
          usuario_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          clinica_id?: string | null
          conteudo: string
          created_at?: string | null
          enviado_por: string
          id?: string
          lida?: boolean | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          clinica_id?: string | null
          conteudo?: string
          created_at?: string | null
          enviado_por?: string
          id?: string
          lida?: boolean | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories_crm: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      respostas_prontas: {
        Row: {
          atalho: string | null
          ativo: boolean | null
          categoria: string | null
          clinica_id: string
          conteudo: string
          created_at: string | null
          id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          clinica_id: string
          conteudo: string
          created_at?: string | null
          id?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          clinica_id?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_prontas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_prontas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          clinica_id: string | null
          cor: string | null
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          clinica_id?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          clinica_id?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          clinica_id: string | null
          created_at: string | null
          id: string
          nome_completo: string | null
          profile_type: Database["public"]["Enums"]["user_profile_type"]
          status_usuario: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinica_id?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string | null
          profile_type?: Database["public"]["Enums"]["user_profile_type"]
          status_usuario?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinica_id?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string | null
          profile_type?: Database["public"]["Enums"]["user_profile_type"]
          status_usuario?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          clinica_id: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          clinica_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          clinica_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          clinica_id: string
          created_at: string | null
          enviado_em: string | null
          erro: string | null
          id: string
          lead_id: string
          mensagem_id: string
          resposta: string | null
          status_code: number | null
          tentativas: number | null
          webhook_url: string
        }
        Insert: {
          clinica_id: string
          created_at?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          lead_id: string
          mensagem_id: string
          resposta?: string | null
          status_code?: number | null
          tentativas?: number | null
          webhook_url: string
        }
        Update: {
          clinica_id?: string
          created_at?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          lead_id?: string
          mensagem_id?: string
          resposta?: string | null
          status_code?: number | null
          tentativas?: number | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "chat_mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clinicas_stats: {
        Row: {
          admin_prompt: string | null
          created_at: string | null
          email: string | null
          endereco_completo: string | null
          evolution_instance_name: string | null
          id: string | null
          integracao_instance_id: string | null
          leads_anuncios_count: number | null
          leads_convertidos: number | null
          nome: string | null
          plano_contratado: string | null
          razao_social: string | null
          status: string | null
          taxa_conversao: number | null
          telefone: string | null
          tempo_medio_resposta_minutos: number | null
          total_leads: number | null
          total_usuarios: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_clinica_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_profile_type: "admin" | "clinica" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_profile_type: ["admin", "clinica", "usuario"],
    },
  },
} as const
