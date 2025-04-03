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
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string
          id: string
          metadata: Json | null
          name: string
          position: number | null
          project_id: string
          size: number | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path: string
          id?: string
          metadata?: Json | null
          name: string
          position?: number | null
          project_id: string
          size?: number | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string
          id?: string
          metadata?: Json | null
          name?: string
          position?: number | null
          project_id?: string
          size?: number | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_descriptions: {
        Row: {
          created_at: string
          file_id: string | null
          id: string
          image_description: Json | null
        }
        Insert: {
          created_at?: string
          file_id?: string | null
          id?: string
          image_description?: Json | null
        }
        Update: {
          created_at?: string
          file_id?: string | null
          id?: string
          image_description?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "image_descriptions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_descriptions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_descriptions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "project_images"
            referencedColumns: ["files_id"]
          },
        ]
      }
      note_file_relationships: {
        Row: {
          created_at: string
          file_id: string
          id: string
          note_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          note_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_images"
            referencedColumns: ["files_id"]
          },
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          analysis: string | null
          content: string | null
          created_at: string | null
          files_relationships_is_locked: boolean | null
          id: string
          name: string
          position: number | null
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          analysis?: string | null
          content?: string | null
          created_at?: string | null
          files_relationships_is_locked?: boolean | null
          id?: string
          name: string
          position?: number | null
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          analysis?: string | null
          content?: string | null
          created_at?: string | null
          files_relationships_is_locked?: boolean | null
          id?: string
          name?: string
          position?: number | null
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          domain_id: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          domain_id?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          domain_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_transcript_insights: {
        Row: {
          created_at: string
          file_id: string
          id: number
          insights: Json | null
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: never
          insights?: Json | null
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: never
          insights?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_transcript_insights_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_transcript_insights_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_transcript_insights_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_images"
            referencedColumns: ["files_id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          domain_id: string | null
          id: string
          name: string
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain_id?: string | null
          id?: string
          name: string
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain_id?: string | null
          id?: string
          name?: string
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_progress: {
        Row: {
          created_at: string
          id: string
          job: string
          message: string
          progress: number | null
          report_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          job: string
          message?: string
          progress?: number | null
          report_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          job?: string
          message?: string
          progress?: number | null
          report_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_progress_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: string | null
          created_at: string | null
          doc_url: string | null
          id: string
          image_urls: Json | null
          last_edited_at: string | null
          project_id: string
          status: string
          template_id: string
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          doc_url?: string | null
          id?: string
          image_urls?: Json | null
          last_edited_at?: string | null
          project_id: string
          status?: string
          template_id: string
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          doc_url?: string | null
          id?: string
          image_urls?: Json | null
          last_edited_at?: string | null
          project_id?: string
          status?: string
          template_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          email: string
          id: string
          status: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          email: string
          id?: string
          status?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          status?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      template_notes: {
        Row: {
          created_at: string
          custom_content: string | null
          id: string
          name: string
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          custom_content?: string | null
          id?: string
          name: string
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          custom_content?: string | null
          id?: string
          name?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_notes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string | null
          description: string | null
          domain_id: string | null
          html_module: string | null
          id: string
          image_module: Json | null
          is_public: boolean | null
          layout_module: Json | null
          name: string
          parent_template_id: string | null
          report_module: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain_id?: string | null
          html_module?: string | null
          id?: string
          image_module?: Json | null
          is_public?: boolean | null
          layout_module?: Json | null
          name: string
          parent_template_id?: string | null
          report_module?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain_id?: string | null
          html_module?: string | null
          id?: string
          image_module?: Json | null
          is_public?: boolean | null
          layout_module?: Json | null
          name?: string
          parent_template_id?: string | null
          report_module?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dim_note_image_project: {
        Row: {
          image_descriptions_id: string | null
          image_group_name: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files_not_processed: {
        Row: {
          file_path: string | null
          id: string | null
          name: string | null
          project_id: string | null
          type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_descriptions_related_to_note: {
        Row: {
          content: string | null
          file_path: string | null
          image_description: Json | null
          name: string | null
          note_id: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_report_error_count: {
        Row: {
          count: number | null
          job: string | null
        }
        Relationships: []
      }
      project_images: {
        Row: {
          file_path: string | null
          files_id: string | null
          image_description: Json | null
          name: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_notes_with_image_relationships: {
        Row: {
          analysis: string | null
          content: string | null
          group_name: string | null
          note_id: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
