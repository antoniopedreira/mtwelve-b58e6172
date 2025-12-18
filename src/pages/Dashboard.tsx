import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  CheckCircle 
} from 'lucide-react';
import { KPICard } from '@/components/modules/dashboard/KPICard';
import { mockKPIData } from '@/data/mockData';

export default function Dashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do seu negócio esportivo
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Receita Mensal"
          value={formatCurrency(mockKPIData.monthlyRevenue)}
          icon={DollarSign}
          variant="primary"
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Burn Rate"
          value={formatCurrency(mockKPIData.burnRate)}
          subtitle="Despesas operacionais"
          icon={TrendingDown}
          variant="warning"
        />
        <KPICard
          title="Lucro"
          value={formatCurrency(mockKPIData.profit)}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 8.3, isPositive: true }}
        />
        <KPICard
          title="Clientes Ativos"
          value={mockKPIData.activeClients.toString()}
          subtitle="No pipeline"
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Negociações Pendentes"
          value={mockKPIData.pendingDeals.toString()}
          subtitle="Em andamento"
          icon={Target}
          variant="default"
        />
        <KPICard
          title="Deals Fechados"
          value={mockKPIData.closedDeals.toString()}
          subtitle="Este mês"
          icon={CheckCircle}
          variant="default"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold text-lg mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            {[
              { action: 'Novo cliente adicionado', client: 'Lucas Silva', time: 'Há 2 horas' },
              { action: 'Contrato fechado', client: 'André Costa', time: 'Há 5 horas' },
              { action: 'Pagamento recebido', client: 'André Costa', time: 'Ontem' },
            ].map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.client}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold text-lg mb-4">Próximos Vencimentos</h2>
          <div className="space-y-4">
            {[
              { description: 'Parcela 2/3 - André Costa', value: 'R$ 166.666', date: '01/03/2024' },
              { description: 'Parcela 3/3 - André Costa', value: 'R$ 166.666', date: '01/04/2024' },
            ].map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{item.description}</p>
                  <p className="text-xs text-primary">{item.value}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
