export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          avatar_url: string | null;
          club: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          position: string | null;
          stage: Database["public"]["Enums"]["pipeline_stage"];
          updated_at: string;
          value: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          club?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          position?: string | null;
          stage?: Database["public"]["Enums"]["pipeline_stage"];
          updated_at?: string;
          value?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          club?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          position?: string | null;
          stage?: Database["public"]["Enums"]["pipeline_stage"];
          updated_at?: string;
          value?: number | null;
        };
        Relationships: [];
      };
      commissions: {
        Row: {
          contract_id: string;
          created_at: string;
          employee_name: string;
          id: string;
          percentage: number;
          value: number;
        };
        Insert: {
          contract_id: string;
          created_at?: string;
          employee_name: string;
          id?: string;
          percentage: number;
          value: number;
        };
        Update: {
          contract_id?: string;
          created_at?: string;
          employee_name?: string;
          id?: string;
          percentage?: number;
          value?: number;
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
      contracts: {
        Row: {
          client_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          status: Database["public"]["Enums"]["contract_status"];
          total_value: number;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          total_value: number;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          total_value?: number;
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
      employees: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          role: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          role?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          role?: string | null;
        };
        Relationships: [];
      };
      installments: {
        Row: {
          contract_id: string;
          created_at: string;
          due_date: string;
          id: string;
          status: Database["public"]["Enums"]["transaction_status"];
          value: number;
        };
        Insert: {
          contract_id: string;
          created_at?: string;
          due_date: string;
          id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          value: number;
        };
        Update: {
          contract_id?: string;
          created_at?: string;
          due_date?: string;
          id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          value?: number;
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
      transactions: {
        Row: {
          contract_id: string | null;
          created_at: string;
          description: string;
          due_date: string;
          id: string;
          status: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          value: number;
        };
        Insert: {
          contract_id?: string | null;
          created_at?: string;
          description: string;
          due_date: string;
          id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          value: number;
        };
        Update: {
          contract_id?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string;
          id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          value?: number;
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
      // === ADICIONADO: TABELA DE DESPESAS ===
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          category: Database["public"]["Enums"]["expense_category"];
          due_date: string;
          status: Database["public"]["Enums"]["transaction_status"];
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
          category?: Database["public"]["Enums"]["expense_category"];
          due_date: string;
          status?: Database["public"]["Enums"]["transaction_status"];
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
          category?: Database["public"]["Enums"]["expense_category"];
          due_date?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          paid_at?: string | null;
          is_recurring?: boolean | null;
          recurrence_period?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      // ADICIONADO: Enum de Categorias
      expense_category: "fixo" | "variavel" | "extra" | "imposto" | "comissao";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
