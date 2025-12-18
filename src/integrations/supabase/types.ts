export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          club: string | null;
          position: string | null;
          stage: "radar" | "contato" | "negociacao" | "fechado" | "perdido";
          value: number | null;
          avatar_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          club?: string | null;
          position?: string | null;
          stage?: "radar" | "contato" | "negociacao" | "fechado" | "perdido";
          value?: number | null;
          avatar_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          club?: string | null;
          position?: string | null;
          stage?: "radar" | "contato" | "negociacao" | "fechado" | "perdido";
          value?: number | null;
          avatar_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          client_id: string;
          total_value: number;
          status: "draft" | "active" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          total_value: number;
          status?: "draft" | "active" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          total_value?: number;
          status?: "draft" | "active" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      installments: {
        Row: {
          id: string;
          contract_id: string;
          value: number;
          due_date: string;
          status: "pending" | "paid" | "overdue" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          value: number;
          due_date: string;
          status?: "pending" | "paid" | "overdue" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          value?: number;
          due_date?: string;
          status?: "pending" | "paid" | "overdue" | "cancelled";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "installments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          category: "fixo" | "variavel" | "extra" | "imposto" | "comissao";
          due_date: string;
          status: "pending" | "paid" | "overdue" | "cancelled";
          paid_at: string | null;
          is_recurring: boolean | null;
          recurrence_period: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          category?: "fixo" | "variavel" | "extra" | "imposto" | "comissao";
          due_date: string;
          status?: "pending" | "paid" | "overdue" | "cancelled";
          paid_at?: string | null;
          is_recurring?: boolean | null;
          recurrence_period?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          category?: "fixo" | "variavel" | "extra" | "imposto" | "comissao";
          due_date?: string;
          status?: "pending" | "paid" | "overdue" | "cancelled";
          paid_at?: string | null;
          is_recurring?: boolean | null;
          recurrence_period?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commissions: {
        Row: {
          id: string;
          contract_id: string;
          employee_name: string;
          percentage: number;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          employee_name: string;
          percentage: number;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          employee_name?: string;
          percentage?: number;
          value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commissions_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          contract_id: string | null;
          type: "income" | "expense";
          description: string;
          value: number;
          due_date: string;
          status: "pending" | "paid" | "overdue" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id?: string | null;
          type: "income" | "expense";
          description: string;
          value: number;
          due_date: string;
          status?: "pending" | "paid" | "overdue" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string | null;
          type?: "income" | "expense";
          description?: string;
          value?: number;
          due_date?: string;
          status?: "pending" | "paid" | "overdue" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      financial_overview: {
        Row: {
          id: string;
          contract_id: string | null;
          title: string;
          type: string;
          direction: "entrada" | "saida";
          amount: number;
          date: string;
          status: string | null;
          created_at: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      contract_status: "draft" | "active" | "completed" | "cancelled";
      pipeline_stage: "radar" | "contato" | "negociacao" | "fechado" | "perdido";
      transaction_status: "pending" | "paid" | "overdue" | "cancelled";
      transaction_type: "income" | "expense";
      expense_category: "fixo" | "variavel" | "extra" | "imposto" | "comissao";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
