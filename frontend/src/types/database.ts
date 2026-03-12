// JSON type for Supabase JSONB columns
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          model: string
          current_template: Json | null
          system_prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          model?: string
          current_template?: Json | null
          system_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          model?: string
          current_template?: Json | null
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          project_id: string
          role: string
          content: string | null
          template_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          role: string
          content?: string | null
          template_json?: Json | null
          created_at?: string
        }
        Update: {
          content?: string | null
          template_json?: Json | null
        }
        Relationships: []
      }
      message_images: {
        Row: {
          id: string
          message_id: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          storage_path: string
          created_at?: string
        }
        Update: {
          storage_path?: string
        }
        Relationships: []
      }
      template_versions: {
        Row: {
          id: string
          project_id: string
          version_number: number
          title: string | null
          template: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          version_number: number
          title?: string | null
          template: Json
          created_at?: string
        }
        Update: {
          title?: string | null
          template?: Json
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
