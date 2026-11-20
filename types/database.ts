export type TransactionType = 'income' | 'expense' | 'investment_out' | 'investment_in'
export type InvestmentStatus = 'active' | 'matured' | 'claimed'

export type TransactionRecord = {
  id: string
  user_id: string
  type: TransactionType
  category: string
  amount: string | number
  note: string | null
  transaction_date: string
  created_at: string
}

export type InvestmentRecord = {
  id: string
  user_id: string
  title: string
  principal_amount: string | number
  expected_return_pct: string | number
  expected_profit_amount: string | number
  duration_days: number
  start_date: string
  maturity_date: string
  status: InvestmentStatus
  reminder_generated: boolean
  created_at: string
}

export type NotificationRecord = {
  id: string
  user_id: string
  investment_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export type FinancialSummary = {
  liquidCash: string
  lockedPrincipal: string
  projectedProfit: string
  maturedProfit: string
  projectedNetWorth: string
  totalIncome: string
  totalExpense: string
  totalInvestmentIn: string
  totalInvestmentOut: string
  activeCount: number
  maturedCount: number
  claimedCount: number
  unreadNotifications: number
}

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: TransactionRecord
        Insert: {
          id?: string
          user_id: string
          type: TransactionType
          category: string
          amount: string | number
          note?: string | null
          transaction_date?: string
          created_at?: string
        }
        Update: {
          type?: TransactionType
          category?: string
          amount?: string | number
          note?: string | null
          transaction_date?: string
        }
        Relationships: []
      }
      investments: {
        Row: InvestmentRecord
        Insert: {
          id?: string
          user_id: string
          title: string
          principal_amount: string | number
          expected_return_pct: string | number
          duration_days: number
          start_date?: string
          maturity_date: string
          status?: InvestmentStatus
          reminder_generated?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          principal_amount?: string | number
          expected_return_pct?: string | number
          duration_days?: number
          start_date?: string
          maturity_date?: string
          status?: InvestmentStatus
          reminder_generated?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: NotificationRecord
        Insert: {
          id?: string
          user_id: string
          investment_id?: string | null
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          message?: string
          is_read?: boolean
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
