export type PipelineStage = "radar" | "contato" | "negociacao" | "fechado" | "perdido";

export type ContractStatus = "draft" | "active" | "completed" | "cancelled";

export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";

export type TransactionType = "income" | "expense";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;

  // Novos campos atualizados
  school: string | null;
  nationality: string | null;

  // Campos do Banco de Dados (snake_case)
  stage: PipelineStage;
  value: number | null;
  avatar_url: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  client_id: string;
  total_value: number;
  status: ContractStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Join opcional
  clients?: Client;
}

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
