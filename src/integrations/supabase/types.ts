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
            foreignKeyName: "agendamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "chat_mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          cnpj: string | null
          created_at: string | null
          email: string
          endereco: string | null
          evolution_instance_name: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
          webhook_usuario: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          email: string
          endereco?: string | null
          evolution_instance_name?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
          webhook_usuario?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          email?: string
          endereco?: string | null
          evolution_instance_name?: string | null
          id?: string
          nome?: string
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
        ]
      }
      leads: {
        Row: {
          anotacoes: string | null
          anuncio: string | null
          clinica_id: string | null
          created_at: string | null
          data_ultimo_contato: string | null
          email: string | null
          etapa_kanban_id: string | null
          id: string
          ltv: number | null
          name: string | null
          nome: string
          notes: string | null
          origem_lead: string | null
          phone: string | null
          servico_interesse: string | null
          tag_id: string | null
          tag_id_alias: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          anotacoes?: string | null
          anuncio?: string | null
          clinica_id?: string | null
          created_at?: string | null
          data_ultimo_contato?: string | null
          email?: string | null
          etapa_kanban_id?: string | null
          id?: string
          ltv?: number | null
          name?: string | null
          nome: string
          notes?: string | null
          origem_lead?: string | null
          phone?: string | null
          servico_interesse?: string | null
          tag_id?: string | null
          tag_id_alias?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          anotacoes?: string | null
          anuncio?: string | null
          clinica_id?: string | null
          created_at?: string | null
          data_ultimo_contato?: string | null
          email?: string | null
          etapa_kanban_id?: string | null
          id?: string
          ltv?: number | null
          name?: string | null
          nome?: string
          notes?: string | null
          origem_lead?: string | null
          phone?: string | null
          servico_interesse?: string | null
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
            foreignKeyName: "mensagens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
