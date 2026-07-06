export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          nickname: string
          birth_year: number | null
          profile_image_url: string | null
          accessibility_settings: Json
          notification_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          nickname?: string
          birth_year?: number | null
          profile_image_url?: string | null
          accessibility_settings?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          birth_year?: number | null
          profile_image_url?: string | null
          accessibility_settings?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      scanned_documents: {
        Row: {
          id: string
          user_id: string
          image_url: string | null
          ocr_text: string
          document_type: string
          title: string | null
          is_scam: boolean
          scam_risk_level: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          image_url?: string | null
          ocr_text: string
          document_type?: string
          title?: string | null
          is_scam?: boolean
          scam_risk_level?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string | null
          ocr_text?: string
          document_type?: string
          title?: string | null
          is_scam?: boolean
          scam_risk_level?: string
          created_at?: string
        }
      }
      document_explanations: {
        Row: {
          id: string
          document_id: string
          user_id: string
          simple_explanation: string
          key_points: Json
          action_items: Json
          warnings: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id?: string
          simple_explanation: string
          key_points?: Json
          action_items?: Json
          warnings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          simple_explanation?: string
          key_points?: Json
          action_items?: Json
          warnings?: Json
          created_at?: string
        }
      }
      family_caregivers: {
        Row: {
          id: string
          elderly_user_id: string
          caregiver_user_id: string | null
          caregiver_email: string
          caregiver_name: string | null
          relationship: string | null
          status: string
          can_view_documents: boolean
          can_view_conversations: boolean
          can_receive_alerts: boolean
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          elderly_user_id?: string
          caregiver_user_id?: string | null
          caregiver_email: string
          caregiver_name?: string | null
          relationship?: string | null
          status?: string
          can_view_documents?: boolean
          can_view_conversations?: boolean
          can_receive_alerts?: boolean
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          elderly_user_id?: string
          caregiver_user_id?: string | null
          caregiver_email?: string
          caregiver_name?: string | null
          relationship?: string | null
          status?: string
          can_view_documents?: boolean
          can_view_conversations?: boolean
          can_receive_alerts?: boolean
          invited_at?: string
          accepted_at?: string | null
        }
      }
      voice_conversations: {
        Row: {
          id: string
          user_id: string
          session_id: string
          document_id: string | null
          user_message: string
          ai_response: string
          is_follow_up: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          session_id?: string
          document_id?: string | null
          user_message: string
          ai_response: string
          is_follow_up?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          document_id?: string | null
          user_message?: string
          ai_response?: string
          is_follow_up?: boolean
          created_at?: string
        }
      }
      scam_reports: {
        Row: {
          id: string
          user_id: string
          document_id: string | null
          scam_type: string | null
          description: string | null
          phone_number: string | null
          website_url: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          document_id?: string | null
          scam_type?: string | null
          description?: string | null
          phone_number?: string | null
          website_url?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          scam_type?: string | null
          description?: string | null
          phone_number?: string | null
          website_url?: string | null
          verified?: boolean
          created_at?: string
        }
      }
    }
  }
}
