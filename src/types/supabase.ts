// Supabase Database type interface
// This matches the database schema for type safety

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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          total_earnings: number
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          total_earnings?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          total_earnings?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bank_deals: {
        Row: {
          id: string
          bank_name: string
          reward_amount: number
          requirements: Json
          expiry_date: string | null
          is_active: boolean
          min_pay_in: number
          required_direct_debits: number
          debit_card_transactions: number
          time_to_payout: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bank_name: string
          reward_amount: number
          requirements?: Json
          expiry_date?: string | null
          is_active?: boolean
          min_pay_in?: number
          required_direct_debits?: number
          debit_card_transactions?: number
          time_to_payout?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bank_name?: string
          reward_amount?: number
          requirements?: Json
          expiry_date?: string | null
          is_active?: boolean
          min_pay_in?: number
          required_direct_debits?: number
          debit_card_transactions?: number
          time_to_payout?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_switches: {
        Row: {
          id: string
          user_id: string
          deal_id: string
          status: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
          burner_account_details: Json
          started_at: string
          completed_at: string | null
          earnings_received: number
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          deal_id: string
          status?: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
          burner_account_details?: Json
          started_at?: string
          completed_at?: string | null
          earnings_received?: number
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          deal_id?: string
          status?: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
          burner_account_details?: Json
          started_at?: string
          completed_at?: string | null
          earnings_received?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_switches_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "bank_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_switches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      switch_steps: {
        Row: {
          id: string
          switch_id: string
          step_number: number
          step_name: string
          description: string | null
          completed: boolean
          due_date: string | null
          completed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          switch_id: string
          step_number: number
          step_name: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          switch_id?: string
          step_number?: number
          step_name?: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          completed_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "switch_steps_switch_id_fkey"
            columns: ["switch_id"]
            isOneToOne: false
            referencedRelation: "user_switches"
            referencedColumns: ["id"]
          }
        ]
      }
      direct_debits: {
        Row: {
          id: string
          user_id: string
          switch_id: string | null
          provider: string
          charity_name: string | null
          amount: number
          frequency: 'monthly' | 'one-time'
          status: 'pending' | 'active' | 'cancelled' | 'completed' | 'failed'
          setup_date: string
          next_collection_date: string | null
          last_collection_date: string | null
          auto_cancel_after_switch: boolean
          total_collected: number
          stripe_payment_method_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          switch_id?: string | null
          provider: string
          charity_name?: string | null
          amount: number
          frequency?: 'monthly' | 'one-time'
          status?: 'pending' | 'active' | 'cancelled' | 'completed' | 'failed'
          setup_date?: string
          next_collection_date?: string | null
          last_collection_date?: string | null
          auto_cancel_after_switch?: boolean
          total_collected?: number
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          switch_id?: string | null
          provider?: string
          charity_name?: string | null
          amount?: number
          frequency?: 'monthly' | 'one-time'
          status?: 'pending' | 'active' | 'cancelled' | 'completed' | 'failed'
          setup_date?: string
          next_collection_date?: string | null
          last_collection_date?: string | null
          auto_cancel_after_switch?: boolean
          total_collected?: number
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_debits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_debits_switch_id_fkey"
            columns: ["switch_id"]
            isOneToOne: false
            referencedRelation: "user_switches"
            referencedColumns: ["id"]
          }
        ]
      }
      dd_payments: {
        Row: {
          id: string
          direct_debit_id: string
          stripe_invoice_id: string | null
          amount: number
          status: string
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          direct_debit_id: string
          stripe_invoice_id?: string | null
          amount: number
          status: string
          payment_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          direct_debit_id?: string
          stripe_invoice_id?: string | null
          amount?: number
          status?: string
          payment_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dd_payments_direct_debit_id_fkey"
            columns: ["direct_debit_id"]
            isOneToOne: false
            referencedRelation: "direct_debits"
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
      switch_status: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
      dd_frequency: 'monthly' | 'one-time'
      dd_status: 'pending' | 'active' | 'cancelled' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
