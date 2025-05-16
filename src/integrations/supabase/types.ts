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
      app_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
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
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "image_descriptions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "v_files_most_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_descriptions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "v_files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_descriptions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "v_project_images"
            referencedColumns: ["files_id"]
          },
        ]
      }
      note_file_relationships: {
        Row: {
          created_at: string
          file_id: string
          id: string
          match_score: number | null
          note_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          match_score?: number | null
          note_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          match_score?: number | null
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
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_files_most_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["files_id"]
          },
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "v_project_notes_excluding_template"
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
          last_edited_at: string | null
          metadata: Json | null
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
          last_edited_at?: string | null
          metadata?: Json | null
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
          last_edited_at?: string | null
          metadata?: Json | null
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
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
          business_logo_link: string | null
          business_name: string | null
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
          business_logo_link?: string | null
          business_name?: string | null
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
          business_logo_link?: string | null
          business_name?: string | null
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
          {
            foreignKeyName: "project_transcript_insights_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_files_most_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_transcript_insights_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_transcript_insights_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["files_id"]
          },
        ]
      }
      project_workflow: {
        Row: {
          created_at: string
          id: string
          last_edited_at: string | null
          project_id: string
          user_id: string | null
          workflow_state: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_edited_at?: string | null
          project_id: string
          user_id?: string | null
          workflow_state: number
        }
        Update: {
          created_at?: string
          id?: string
          last_edited_at?: string | null
          project_id?: string
          user_id?: string | null
          workflow_state?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_workflow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workflow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          domain_id: string | null
          id: string
          last_edited_at: string | null
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
          last_edited_at?: string | null
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
          last_edited_at?: string | null
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
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
          last_invited_at: string | null
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
          last_invited_at?: string | null
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
          last_invited_at?: string | null
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
          position: number | null
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          custom_content?: string | null
          id?: string
          name: string
          position?: number | null
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          custom_content?: string | null
          id?: string
          name?: string
          position?: number | null
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
          is_default: boolean | null
          is_public: boolean | null
          last_edited_at: string | null
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
          is_default?: boolean | null
          is_public?: boolean | null
          last_edited_at?: string | null
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
          is_default?: boolean | null
          is_public?: boolean | null
          last_edited_at?: string | null
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
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "v_project_notes_excluding_template"
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
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
          },
        ]
      }
      v_files_most_current: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          position: number | null
          project_id: string | null
          size: number | null
          title: string | null
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
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
      v_files_not_processed: {
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
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
      v_image_descriptions_related_to_note: {
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
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "v_project_notes_excluding_template"
            referencedColumns: ["id"]
          },
        ]
      }
      v_lower_priority_related_notes_with_images: {
        Row: {
          created_at: string | null
          file_id: string | null
          id: string | null
          match_score: number | null
          note_id: string | null
          projects_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["projects_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["projects_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
          },
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
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_files_most_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_files_not_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["files_id"]
          },
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "v_project_notes_excluding_template"
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
            foreignKeyName: "note_file_relationships_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "v_project_notes_excluding_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
          },
        ]
      }
      v_project_images: {
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
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
          },
        ]
      }
      v_project_notes_excluding_template: {
        Row: {
          analysis: string | null
          content: string | null
          created_at: string | null
          files_relationships_is_locked: boolean | null
          id: string | null
          last_edited_at: string | null
          metadata: Json | null
          name: string | null
          position: number | null
          project_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          analysis?: string | null
          content?: string | null
          created_at?: string | null
          files_relationships_is_locked?: boolean | null
          id?: string | null
          last_edited_at?: string | null
          metadata?: Json | null
          name?: string | null
          position?: number | null
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          analysis?: string | null
          content?: string | null
          created_at?: string | null
          files_relationships_is_locked?: boolean | null
          id?: string | null
          last_edited_at?: string | null
          metadata?: Json | null
          name?: string | null
          position?: number | null
          project_id?: string | null
          title?: string | null
          user_id?: string | null
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
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects_last_update"
            referencedColumns: ["project_id"]
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
      v_projects_last_update: {
        Row: {
          last_update: string | null
          project_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
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
