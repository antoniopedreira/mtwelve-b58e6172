// --- Enums & Tipos Básicos ---
export type PipelineStage = "radar" | "contato" | "negociacao" | "fechado" | "perdido";
export type ContractStatus = "draft" | "active" | "completed" | "cancelled";
export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";
export type TransactionType = "income" | "expense";

// --- Interfaces Principais ---

// Cliente (CRM)
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  school: string | null;
  nationality: string | null;
  stage: PipelineStage;
  value: number | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sport?: string;
  status?: string;
}

// Coluna do Pipeline (Kanban)
export interface PipelineColumn {
  id: PipelineStage;
  title: string;
  clients: Client[];
}

// Contrato
export interface Contract {
  id: string;
  client_id: string;
  total_value: number;
  status: ContractStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  transaction_fee_percentage?: number; // Agora opcional/legado, usamos o valor na parcela
  clients?: Client;
}

// Parcela (Financeiro)
export interface Installment {
  id: string;
  contract_id: string;
  value: number;
  due_date: string;
  status: TransactionStatus;
  transaction_fee: number; // <--- NOVO CAMPO
  created_at?: string;
}

// Comissão (Financeiro)
export interface Commission {
  id: string;
  contract_id: string;
  installment_id: string | null;
  employee_name: string;
  percentage: number;
  value: number;
  status: TransactionStatus; // <--- NOVO CAMPO
  created_at?: string;
}

// Transação Genérica (Extrato)
export interface Transaction {
  id: string;
  contract_id: string | null;
  type: TransactionType;
  description: string;
  value: number;
  due_date: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}
