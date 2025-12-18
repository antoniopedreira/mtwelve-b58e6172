// MTwelve Sports Manager - Core Types

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  sport: string;
  position?: string;
  team?: string;
  avatarUrl?: string;
  status: PipelineStage;
  createdAt: Date;
  updatedAt: Date;
}

export type PipelineStage = 'radar' | 'contato' | 'negociacao' | 'fechado' | 'perdido';

export interface PipelineColumn {
  id: PipelineStage;
  title: string;
  clients: Client[];
}

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  totalValue: number;
  installments: Installment[];
  commissions: Commission[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  startDate: Date;
  endDate: Date;
}

export interface Installment {
  id: string;
  contractId: string;
  value: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Commission {
  id: string;
  contractId: string;
  employeeId: string;
  employeeName: string;
  percentage: number;
  value: number;
}

export interface Transaction {
  id: string;
  contractId: string;
  clientName: string;
  type: 'income' | 'expense';
  category: string;
  value: number;
  date: Date;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface KPIData {
  monthlyRevenue: number;
  burnRate: number;
  profit: number;
  activeClients: number;
  pendingDeals: number;
  closedDeals: number;
}
