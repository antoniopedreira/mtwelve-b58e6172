import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { KPICard } from '@/components/modules/dashboard/KPICard';
import { useKPIData } from '@/hooks/useKPIData';

export default function Dashboard() {
  const { data: kpiData, isLoading, error } = useKPIData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-destructive">
        Erro ao carregar dados
      </div>
    );
  }

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
          value={formatCurrency(kpiData?.monthlyRevenue || 0)}
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="Burn Rate"
          value={formatCurrency(kpiData?.burnRate || 0)}
          subtitle="Despesas operacionais"
          icon={TrendingDown}
          variant="warning"
        />
        <KPICard
          title="Lucro"
          value={formatCurrency(kpiData?.profit || 0)}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Clientes Ativos"
          value={(kpiData?.activeClients || 0).toString()}
          subtitle="No pipeline"
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Negociações Pendentes"
          value={(kpiData?.pendingDeals || 0).toString()}
          subtitle="Em andamento"
          icon={Target}
          variant="default"
        />
        <KPICard
          title="Deals Fechados"
          value={(kpiData?.closedDeals || 0).toString()}
          subtitle="Este mês"
          icon={CheckCircle}
          variant="default"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold text-lg mb-4">Atividade Recente</h2>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade recente
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold text-lg mb-4">Próximos Vencimentos</h2>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum vencimento próximo
          </div>
        </div>
      </div>
    </div>
  );
}
