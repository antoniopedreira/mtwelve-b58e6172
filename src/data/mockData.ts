// MTwelve Sports Manager - Mock Data
// TODO: Supabase Integration - Replace with real API calls

import { Client, Contract, Transaction, Employee, KPIData, PipelineColumn } from '@/types';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Lucas Silva',
    email: 'lucas@email.com',
    phone: '(11) 99999-0001',
    sport: 'Futebol',
    position: 'Atacante',
    team: 'Santos FC',
    status: 'radar',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Gabriel Santos',
    email: 'gabriel@email.com',
    phone: '(11) 99999-0002',
    sport: 'Futebol',
    position: 'Meia',
    team: 'Corinthians',
    status: 'contato',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro@email.com',
    phone: '(11) 99999-0003',
    sport: 'Basquete',
    position: 'Armador',
    status: 'negociacao',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '4',
    name: 'André Costa',
    email: 'andre@email.com',
    phone: '(11) 99999-0004',
    sport: 'Futebol',
    position: 'Zagueiro',
    team: 'Palmeiras',
    status: 'fechado',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '5',
    name: 'Matheus Lima',
    email: 'matheus@email.com',
    phone: '(11) 99999-0005',
    sport: 'Vôlei',
    position: 'Levantador',
    status: 'perdido',
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '6',
    name: 'Rafael Mendes',
    email: 'rafael@email.com',
    phone: '(11) 99999-0006',
    sport: 'Futebol',
    position: 'Lateral',
    status: 'radar',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
];

export const mockEmployees: Employee[] = [
  { id: '1', name: 'João Martins', role: 'Agente Senior', email: 'joao@mtwelve.com' },
  { id: '2', name: 'Maria Souza', role: 'Agente', email: 'maria@mtwelve.com' },
  { id: '3', name: 'Carlos Ferreira', role: 'Analista', email: 'carlos@mtwelve.com' },
];

export const mockContracts: Contract[] = [
  {
    id: '1',
    clientId: '4',
    clientName: 'André Costa',
    totalValue: 500000,
    installments: [
      { id: '1-1', contractId: '1', value: 166666.67, dueDate: new Date('2024-02-01'), status: 'paid', paidAt: new Date('2024-02-01') },
      { id: '1-2', contractId: '1', value: 166666.67, dueDate: new Date('2024-03-01'), status: 'pending' },
      { id: '1-3', contractId: '1', value: 166666.66, dueDate: new Date('2024-04-01'), status: 'pending' },
    ],
    commissions: [
      { id: 'c1', contractId: '1', employeeId: '1', employeeName: 'João Martins', percentage: 5, value: 25000 },
      { id: 'c2', contractId: '1', employeeId: '2', employeeName: 'Maria Souza', percentage: 3, value: 15000 },
    ],
    status: 'active',
    createdAt: new Date('2024-01-20'),
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    contractId: '1',
    clientName: 'André Costa',
    type: 'income',
    category: 'Contrato',
    value: 166666.67,
    date: new Date('2024-02-01'),
    description: 'Parcela 1/3 - Contrato André Costa',
    status: 'completed',
  },
  {
    id: 't2',
    contractId: '1',
    clientName: 'André Costa',
    type: 'expense',
    category: 'Comissão',
    value: 25000,
    date: new Date('2024-02-01'),
    description: 'Comissão João Martins - André Costa',
    status: 'completed',
  },
  {
    id: 't3',
    contractId: '1',
    clientName: 'André Costa',
    type: 'expense',
    category: 'Comissão',
    value: 15000,
    date: new Date('2024-02-01'),
    description: 'Comissão Maria Souza - André Costa',
    status: 'completed',
  },
  {
    id: 't4',
    contractId: '1',
    clientName: 'André Costa',
    type: 'income',
    category: 'Contrato',
    value: 166666.67,
    date: new Date('2024-03-01'),
    description: 'Parcela 2/3 - Contrato André Costa',
    status: 'pending',
  },
];

export const mockKPIData: KPIData = {
  monthlyRevenue: 166666.67,
  burnRate: 45000,
  profit: 121666.67,
  activeClients: 4,
  pendingDeals: 2,
  closedDeals: 1,
};

export const getInitialPipelineData = (): PipelineColumn[] => [
  {
    id: 'radar',
    title: 'Radar',
    clients: mockClients.filter(c => c.status === 'radar'),
  },
  {
    id: 'contato',
    title: 'Contato',
    clients: mockClients.filter(c => c.status === 'contato'),
  },
  {
    id: 'negociacao',
    title: 'Negociação',
    clients: mockClients.filter(c => c.status === 'negociacao'),
  },
  {
    id: 'fechado',
    title: 'Fechado',
    clients: mockClients.filter(c => c.status === 'fechado'),
  },
  {
    id: 'perdido',
    title: 'Perdido',
    clients: mockClients.filter(c => c.status === 'perdido'),
  },
];
