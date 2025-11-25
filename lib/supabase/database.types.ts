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
      drivers: {
        Row: {
          id: string
          user_id: string
          name: string
          driver_type: 'company_driver' | 'owner_operator'
          email: string | null
          phone: string | null
          license_number: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          driver_type: 'company_driver' | 'owner_operator'
          email?: string | null
          phone?: string | null
          license_number?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          driver_type?: 'company_driver' | 'owner_operator'
          email?: string | null
          phone?: string | null
          license_number?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          driver_id: string
          user_id: string
          trip_name: string
          trip_date: string
          file_name: string
          file_url: string | null
          total_loads: number
          total_invoice: number
          total_broker_fees: number
          driver_earnings: number
          company_earnings: number
          expenses_total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          user_id: string
          trip_name: string
          trip_date: string
          file_name: string
          file_url?: string | null
          total_loads: number
          total_invoice: number
          total_broker_fees: number
          driver_earnings: number
          company_earnings: number
          expenses_total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          user_id?: string
          trip_name?: string
          trip_date?: string
          file_name?: string
          file_url?: string | null
          total_loads?: number
          total_invoice?: number
          total_broker_fees?: number
          driver_earnings?: number
          company_earnings?: number
          expenses_total?: number
          created_at?: string
          updated_at?: string
        }
      }
      loads: {
        Row: {
          id: string
          trip_id: string
          load_id: string
          customer: string
          vehicle: string
          price: number
          broker_fee: number
          payment_method: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          load_id: string
          customer: string
          vehicle: string
          price: number
          broker_fee: number
          payment_method: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          load_id?: string
          customer?: string
          vehicle?: string
          price?: number
          broker_fee?: number
          payment_method?: string
          notes?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          category: string
          amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          category: string
          amount: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          category?: string
          amount?: number
          notes?: string | null
          created_at?: string
        }
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
  }
}
