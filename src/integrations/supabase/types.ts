export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          nationality: string | null;
          notes: string | null;
          phone: string | null;
          school: string | null;
          stage: Database["public"]["Enums"]["pipeline_stage"];
          updated_at: string;
          value: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          nationality?: string | null;
          notes?: string | null;
          phone?: string | null;
          school?: string | null;
          stage?: Database["public"]["Enums"]["pipeline_stage"];
          updated_at?: string;
          value?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          nationality?: string | null;
          notes?: string | null;
          phone?: string | null;
          school?: string | null;
          stage?: Database["public"]["Enums"]["pipeline_stage"];
          updated_at?: string;
          value?: number | null;
        };
      };
      commissions: {
        Row: {
          contract_id: string;
          created_at: string;
          employee_name: string;
          id: string;
          installment_id: string | null;
          percentage: number;
          value: number;
          status: Database["public"]["Enums"]["transaction_status"];
        };
        Insert: {
          contract_id: string;
          created_at?: string;
          employee_name: string;
          id?: string;
          installment_id?: string | null;
          percentage: number;
          value: number;
          status?: Database["public"]["Enums"]["transaction_status"];
        };
        Update: {
          contract_id?: string;
          created_at?: string;
          employee_name?: string;
          id?: string;
          installment_id?: string | null;
          percentage?: number;
          value?: number;
          status?: Database["public"]["Enums"]["transaction_status"];
        };
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
          transaction_fee_percentage: number | null;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          total_value: number;
          updated_at?: string;
          transaction_fee_percentage?: number | null;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          total_value?: number;
          updated_at?: string;
          transaction_fee_percentage?: number | null;
        };
      };
      installments: {
        Row: {
          contract_id: string;
          created_at: string;
          due_date: string;
          id: string;
          status: Database["public"]["Enums"]["transaction_status"];
          value: number;
          transaction_fee: number;
        };
        Insert: {
          contract_id: string;
          created_at?: string;
          due_date: string;
          id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          value: number;
          transaction_fee?: number;
        };
        Update: {
          contract_id?: string;
          created_at?: string;
          due_date?: string;
          id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          value?: number;
          transaction_fee?: number;
        };
      };
      // ... (Outras tabelas mantidas simplificadas para brevidade se não usadas)
      expenses: {
        Row: {
          amount: number;
          category: Database["public"]["Enums"]["expense_category"];
          created_at: string | null;
          description: string;
          due_date: string;
          id: string;
          is_recurring: boolean | null;
          paid_at: string | null;
          recurrence_period: string | null;
          status: Database["public"]["Enums"]["transaction_status"] | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          category?: Database["public"]["Enums"]["expense_category"];
          created_at?: string | null;
          description: string;
          due_date: string;
          id?: string;
          is_recurring?: boolean | null;
          paid_at?: string | null;
          recurrence_period?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"] | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          category?: Database["public"]["Enums"]["expense_category"];
          created_at?: string | null;
          description?: string;
          due_date?: string;
          id?: string;
          is_recurring?: boolean | null;
          paid_at?: string | null;
          recurrence_period?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"] | null;
          updated_at?: string | null;
        };
      };
      financial_overview: {
        Row: {
          amount: number | null;
          contract_id: string | null;
          created_at: string | null;
          date: string | null;
          direction: string | null;
          id: string | null;
          status: string | null;
          title: string | null;
          type: string | null;
        };
      };
    };
    Enums: {
      contract_status: "draft" | "active" | "completed" | "cancelled";
      expense_category: "fixo" | "variavel" | "extra" | "imposto" | "comissao";
      pipeline_stage: "radar" | "contato" | "negociacao" | "fechado" | "perdido";
      transaction_status: "pending" | "paid" | "overdue" | "cancelled";
      transaction_type: "income" | "expense";
    };
  };
};
