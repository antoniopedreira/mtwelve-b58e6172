import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Activity,
  CalendarClock,
  ArrowUpRight,
  ArrowDownLeft,
  FilePlus,
  CheckCircle2,
} from "lucide-react";
import { KPICard } from "@/components/modules/dashboard/KPICard";
import { useKPIData } from "@/hooks/useKPIData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Tipos para as listas
interface RecentActivity {
  id: string;
  type: "receita" | "despesa" | "contrato" | "comissao";
  title: string;
  subtitle?: string;
  amount?: number;
  date: string;
}

interface UpcomingInstallment {
  id: string;
  clientName: string;
  clientAvatar?: string;
  dueDate: string;
  value: number;
  contractTotal: number;
}

export default function Dashboard() {
  // 1. Dados de CRM (Clientes, Leads) via Hook existente
  const { data: kpiData, isLoading: kpiLoading } = useKPIData();

  // 2. Estados Financeiros e de Atividade
  const [financialTotals, setFinancialTotals] = useState({ receita: 0, despesa: 0, lucro: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        // A. Busca Totais Financeiros (usando a View Unificada)
        const { data: financialRecords } = await supabase.from("financial_overview").select("amount, direction, type");

        let receita = 0;
        let despesa = 0;

        financialRecords?.forEach((rec) => {
          if (rec.direction === "entrada") receita += Number(rec.amount);
          else despesa += Number(rec.amount); // Soma despesas e comissões
        });

        setFinancialTotals({
          receita,
          despesa,
          lucro: receita - despesa,
        });

        // B. Busca Atividades Recentes (Mix de várias tabelas)
        // 1. Últimos Contratos
        const { data: contracts } = await supabase
          .from("contracts")
          .select("created_at, total_value, clients(name)")
          .order("created_at", { ascending: false })
          .limit(5);

        // 2. Últimas Transações Financeiras (Pagamentos Recebidos/Pagos)
        const { data: finances } = await supabase
          .from("financial_overview")
          .select("*")
          .order("created_at", { ascending: false }) // Ou data de pagamento se tiver
          .limit(10);

        // Normaliza e combina
        const activities: RecentActivity[] = [];

        contracts?.forEach((c) => {
          activities.push({
            id: `new-contract-${c.created_at}`,
            type: "contrato",
            title: "Novo Contrato Assinado",
            subtitle: c.clients?.name,
            amount: c.total_value,
            date: c.created_at,
          });
        });

        finances?.forEach((f) => {
          // Evita duplicar se for um contrato criado que gerou parcela no mesmo segundo (raro, mas possível)
          // Aqui focamos no FINANCEIRO (Dinheiro se movendo)
          if (f.type === "installment") {
            activities.push({
              id: f.id || `inst-${f.date}`,
              type: "receita",
              title: "Parcela Recebida",
              subtitle: f.title || "Cliente",
              amount: f.amount || 0,
              date: f.date || new Date().toISOString(),
            });
          } else if (f.type === "comissao") {
            activities.push({
              id: f.id || `comm-${f.date}`,
              type: "comissao",
              title: "Comissão Gerada",
              subtitle: f.title,
              amount: f.amount || 0,
              date: f.date || new Date().toISOString(),
            });
          } else if (f.type === "expense") {
            activities.push({
              id: f.id || `exp-${f.date}`,
              type: "despesa",
              title: "Despesa Registrada",
              subtitle: f.title,
              amount: f.amount || 0,
              date: f.date || new Date().toISOString(),
            });
          }
        });

        // Ordena por data (mais recente primeiro) e pega os top 7
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivity(activities.slice(0, 7));

        // C. Busca Próximos Vencimentos (Parcelas Pendentes)
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const { data: installments } = await supabase
          .from("installments")
          .select(
            `
            id, 
            value, 
            due_date, 
            contracts (
              total_value,
              clients (name, avatar_url)
            )
          `,
          )
          .eq("status", "pending")
          .gte("due_date", today)
          .order("due_date", { ascending: true })
          .limit(5);

        const mappedUpcoming =
          installments?.map((inst: any) => ({
            id: inst.id,
            clientName: inst.contracts?.clients?.name || "Cliente",
            clientAvatar: inst.contracts?.clients?.avatar_url,
            dueDate: inst.due_date,
            value: inst.value,
            contractTotal: inst.contracts?.total_value,
          })) || [];

        setUpcoming(mappedUpcoming);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (dateStr: string) => {
    // Tratamento seguro de data para evitar problemas de fuso
    const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00");
    return format(date, "dd MMM", { locale: ptBR });
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOPO: KPIs FINANCEIROS E DE VENDAS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Financeiro */}
        <KPICard
          title="Receita Total"
          value={financialTotals.receita}
          icon={DollarSign}
          trend={10} // Exemplo estático ou calcule variação se quiser
          trendLabel="vs. mês anterior"
          type="currency"
        />
        <KPICard
          title="Despesa Total"
          value={financialTotals.despesa}
          icon={TrendingDown}
          trend={-5}
          trendLabel="vs. mês anterior"
          type="currency"
        />
        <KPICard
          title="Lucro Total"
          value={financialTotals.lucro}
          icon={TrendingUp}
          trend={15}
          trendLabel="Margem Saudável"
          type="currency"
        />

        {/* CRM / Operacional */}
        <KPICard
          title="Clientes Ativos"
          value={kpiData?.activeClients || 0}
          icon={Users}
          trend={kpiData?.activeClientsGrowth || 0}
          trendLabel="novos este mês"
        />
        <KPICard
          title="Negociações Pendentes"
          value={kpiData?.negotiationsCount || 0}
          icon={Briefcase}
          trend={0}
          trendLabel="em andamento"
        />
        <KPICard
          title="Deals Fechados"
          value={kpiData?.closedDealsCount || 0}
          icon={CheckCircle2}
          trend={0}
          trendLabel="total acumulado"
        />
      </div>

      {/* 2. MEIO: GRIDS DE ATIVIDADE E VENCIMENTOS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Coluna Esquerda: Atividade Recente (Maior) */}
        <Card className="col-span-4 bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Atividade Recente do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-6">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 group">
                    <div
                      className={`
                      mt-1 p-2 rounded-full ring-1 ring-border
                      ${item.type === "receita" ? "bg-emerald-500/10 text-emerald-500" : ""}
                      ${item.type === "despesa" ? "bg-red-500/10 text-red-500" : ""}
                      ${item.type === "contrato" ? "bg-[#E8BD27]/10 text-[#E8BD27]" : ""}
                      ${item.type === "comissao" ? "bg-blue-500/10 text-blue-500" : ""}
                    `}
                    >
                      {item.type === "receita" && <ArrowDownLeft className="h-4 w-4" />}
                      {item.type === "despesa" && <ArrowUpRight className="h-4 w-4" />}
                      {item.type === "contrato" && <FilePlus className="h-4 w-4" />}
                      {item.type === "comissao" && <Users className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                    </div>

                    {item.amount !== undefined && (
                      <div
                        className={`font-medium text-sm ${
                          item.type === "receita"
                            ? "text-emerald-500"
                            : item.type === "despesa" || item.type === "comissao"
                              ? "text-red-400"
                              : ""
                        }`}
                      >
                        {item.type === "despesa" || item.type === "comissao" ? "-" : "+"}
                        {formatCurrency(item.amount)}
                      </div>
                    )}
                  </div>
                ))}

                {recentActivity.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">Nenhuma atividade recente.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna Direita: Próximos Vencimentos */}
        <Card className="col-span-3 bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#E8BD27]" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {upcoming.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/5 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={item.clientAvatar} />
                      <AvatarFallback className="bg-muted text-xs">{getInitials(item.clientName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{item.clientName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Vence dia {formatDate(item.dueDate)}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 whitespace-nowrap"
                    >
                      {formatCurrency(item.value)}
                    </Badge>
                  </div>
                ))}

                {upcoming.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <CheckCircle2 className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Tudo em dia!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
