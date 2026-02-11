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
      admins: {
        Row: {
          id: string
          email: string
          role: 'SUPER_ADMIN' | 'ADMIN'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'SUPER_ADMIN' | 'ADMIN'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'SUPER_ADMIN' | 'ADMIN'
          created_at?: string
        }
      }
      surveys: {
        Row: {
          id: string
          title: string
          description: string | null
          category: 'INDUSTRIAL' | 'PROFESSIONAL' | 'SKILL_ASSESSMENT'
          status: 'DRAFT' | 'PUBLISHED'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: 'INDUSTRIAL' | 'PROFESSIONAL' | 'SKILL_ASSESSMENT'
          status?: 'DRAFT' | 'PUBLISHED'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: 'INDUSTRIAL' | 'PROFESSIONAL' | 'SKILL_ASSESSMENT'
          status?: 'DRAFT' | 'PUBLISHED'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          survey_id: string
          question_text: string
          question_type: 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING'
          options: Json | null
          order_index: number
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          question_text: string
          question_type: 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING'
          options?: Json | null
          order_index: number
          is_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          question_text?: string
          question_type?: 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING'
          options?: Json | null
          order_index?: number
          is_required?: boolean
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          survey_id: string
          submitted_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          submitted_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          submitted_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          response_id: string
          question_id: string
          answer_value: Json
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          question_id: string
          answer_value: Json
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          question_id?: string
          answer_value?: Json
          created_at?: string
        }
      }
    }
  }
}
