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
      users: {
        Row: {
          id: string
          nickname: string
          email: string
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname: string
          email: string
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          email?: string
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: number
          user_id: string
          address_text: string
          latitude: number | null
          longitude: number | null
          rent: number | null
          layout: string
          period_lived: string
          pros_text: string
          cons_text: string
          rating_location: number | null
          rating_sunlight: number | null
          rating_soundproof: number | null
          rating_environment: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          address_text: string
          latitude?: number | null
          longitude?: number | null
          rent?: number | null
          layout?: string
          period_lived?: string
          pros_text?: string
          cons_text?: string
          rating_location?: number | null
          rating_sunlight?: number | null
          rating_soundproof?: number | null
          rating_environment?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          address_text?: string
          latitude?: number | null
          longitude?: number | null
          rent?: number | null
          layout?: string
          period_lived?: string
          pros_text?: string
          cons_text?: string
          rating_location?: number | null
          rating_sunlight?: number | null
          rating_soundproof?: number | null
          rating_environment?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      review_images: {
        Row: {
          id: number
          review_id: number
          image_url: string
          created_at: string
        }
        Insert: {
          id?: number
          review_id: number
          image_url: string
          created_at?: string
        }
        Update: {
          id?: number
          review_id?: number
          image_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: number
          user_id: string
          review_id: number
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          review_id: number
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          review_id?: number
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          user_id: string
          review_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          review_id: number
          created_at?: string
        }
        Update: {
          user_id?: string
          review_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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