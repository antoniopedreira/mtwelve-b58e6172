import { useEffect, useState, useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Interface para os dados brutos do Supabase
interface FinancialRecord {
  id: string;
  title: string;
  type: string;
  direction: "entrada" | "saida";
  amount: number;
  date: string;
  status: string | null;
}

// Estrutura para nossa Matriz de Dados
type MatrixData = {
  [category: string]: {
    totalByMonth: Record<string, number>;
    items: Record<
      string,
      {
        // Agrupado por Título (Ex: Nome do Cliente)
        [month: string]: {
          amount: number;
          status: string[]; // Lista de status (caso haja >1 lançamento no mesmo mês/título)
        };
      }
    >;
  };
};

export function FinancialSummary() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Controle de quais linhas estão expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    receitas: true, // Começa aberto para melhor UX
    despesas: false,
    comissoes: false,
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  async function fetchFinancialData() {
    try {
      const { data, error } = await supabase.from("financial_overview").select("*").order("date", { ascending: true });

      if (error) throw error;
      setRecords(data as FinancialRecord[]);
    } catch (error) {
      console.error("Erro ao buscar financeiro:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- PROCESSAMENTO DOS DADOS (MATRIZ) ---
  const { matrix, months, totals } = useMemo(() => {
    const matrix: MatrixData = {
      receitas: { totalByMonth: {}, items: {} },
      despesas: { totalByMonth: {}, items: {} },
      comissoes: { totalByMonth: {}, items: {} },
    };

    const uniqueMonths = new Set<string>();
    const grandTotals: Record<string, number> = {};

    records.forEach((record) => {
      // Normaliza data para Mês (yyyy-MM)
      // Ajuste de fuso: Adiciona hora fixa para garantir o dia correto
      const dateStr = record.date.includes("T") ? record.date : `${record.date}T12:00:00`;
      const dateObj = new Date(dateStr);
      const monthKey = format(startOfMonth(dateObj), "yyyy-MM");
      uniqueMonths.add(monthKey);

      // Define categoria
      let categoryKey = "despesas";
      if (record.direction === "entrada") categoryKey = "receitas";
      else if (record.type === "comissao") categoryKey = "comissoes";

      // Inicializa estruturas se não existirem
      const catGroup = matrix[categoryKey];
      if (!catGroup.totalByMonth[monthKey]) catGroup.totalByMonth[monthKey] = 0;

      const title = record.title || "Sem descrição";
      if (!catGroup.items[title]) catGroup.items[title] = {};
      if (!catGroup.items[title][monthKey]) {
        catGroup.items[title][monthKey] = { amount: 0, status: [] };
      }

      // Soma valores
      const val = Number(record.amount);
      catGroup.totalByMonth[monthKey] += val;
      catGroup.items[title][monthKey].amount += val;
      if (record.status) {
        catGroup.items[title][monthKey].status.push(record.status);
      }

      // Totais Gerais (Resultado)
      if (!grandTotals[monthKey]) grandTotals[monthKey] = 0;
      if (categoryKey === "receitas") grandTotals[monthKey] += val;
      else grandTotals[monthKey] -= val;
    });

    const sortedMonths = Array.from(uniqueMonths).sort();

    return { matrix, months: sortedMonths, totals: grandTotals };
  }, [records]);

  // Função auxiliar para expandir/recolher
  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = format(date, "MMM yyyy", { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  // Renderiza o ícone de status (Pago/Pendente)
  const StatusIcon = ({ statuses }: { statuses: string[] }) => {
    if (!statuses || statuses.length === 0) return null;

    // Se todos forem 'paid' -> Verde
    const allPaid = statuses.every((s) => s === "paid");
    // Se algum for 'paid' mas não todos (parcial) -> Azul? Vamos simplificar:
    // Se tem algum pendente -> Amarelo
    const hasPending = statuses.some((s) => s === "pending");

    if (allPaid) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            </TooltipTrigger>
            <TooltipContent>Pago</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (hasPending) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Clock className="h-3 w-3 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent>Pendente</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <AlertCircle className="h-3 w-3 text-red-400" />
          </TooltipTrigger>
          <TooltipContent>{statuses[0]}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <DollarSign className="h-10 w-10 mb-2 opacity-20" />
          <p>Nenhuma movimentação financeira encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  // Totais KPI
  const totalReceitas = Object.values(matrix.receitas.totalByMonth).reduce((a, b) => a + b, 0);
  const totalDespesas = Object.values(matrix.despesas.totalByMonth).reduce((a, b) => a + b, 0);
  const totalComissoes = Object.values(matrix.comissoes.totalByMonth).reduce((a, b) => a + b, 0);
  const totalLucro = totalReceitas - (totalDespesas + totalComissoes);

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalReceitas)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas & Comissões</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesas + totalComissoes)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-[#E8BD27]" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalLucro >= 0 ? "text-[#E8BD27]" : "text-red-500")}>
              {formatCurrency(totalLucro)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. MATRIZ FINANCEIRA */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>DRE Gerencial - Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[250px] font-bold text-primary pl-6">Categoria / Item</TableHead>
                  {months.map((m) => (
                    <TableHead key={m} className="text-right min-w-[120px] font-semibold">
                      {getMonthLabel(m)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold pr-6">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* === GRUPO RECEITAS === */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => toggleRow("receitas")}
                >
                  <TableCell className="font-bold text-emerald-500 flex items-center gap-2 pl-4">
                    {expandedRows.receitas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Receitas
                  </TableCell>
                  {months.map((m) => (
                    <TableCell key={m} className="text-right font-bold text-emerald-500/80">
                      {formatCurrency(matrix.receitas.totalByMonth[m] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-emerald-500 pr-6">
                    {formatCurrency(totalReceitas)}
                  </TableCell>
                </TableRow>

                {expandedRows.receitas &&
                  Object.keys(matrix.receitas.items).map((title) => {
                    const itemData = matrix.receitas.items[title];
                    const itemTotal = Object.values(itemData).reduce((sum, d) => sum + d.amount, 0);

                    return (
                      <TableRow key={title} className="bg-muted/5 hover:bg-muted/10 text-sm">
                        <TableCell className="pl-10 text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                          {title}
                        </TableCell>
                        {months.map((m) => {
                          const cellData = itemData[m];
                          return (
                            <TableCell key={m} className="text-right">
                              {cellData ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-foreground/80">{formatCurrency(cellData.amount)}</span>
                                  <StatusIcon statuses={cellData.status} />
                                </div>
                              ) : (
                                <span className="text-muted-foreground/20">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-medium text-muted-foreground pr-6">
                          {formatCurrency(itemTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {/* === GRUPO COMISSÕES === */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => toggleRow("comissoes")}
                >
                  <TableCell className="font-bold text-muted-foreground flex items-center gap-2 pl-4">
                    {expandedRows.comissoes ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    (-) Comissões
                  </TableCell>
                  {months.map((m) => (
                    <TableCell key={m} className="text-right font-bold text-muted-foreground/80">
                      {formatCurrency(matrix.comissoes.totalByMonth[m] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-muted-foreground pr-6">
                    {formatCurrency(totalComissoes)}
                  </TableCell>
                </TableRow>

                {expandedRows.comissoes &&
                  Object.keys(matrix.comissoes.items).map((title) => {
                    const itemData = matrix.comissoes.items[title];
                    const itemTotal = Object.values(itemData).reduce((sum, d) => sum + d.amount, 0);

                    return (
                      <TableRow key={title} className="bg-muted/5 hover:bg-muted/10 text-sm">
                        <TableCell className="pl-10 text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          {title}
                        </TableCell>
                        {months.map((m) => {
                          const cellData = itemData[m];
                          return (
                            <TableCell key={m} className="text-right">
                              {cellData ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-foreground/80">{formatCurrency(cellData.amount)}</span>
                                  <StatusIcon statuses={cellData.status} />
                                </div>
                              ) : (
                                <span className="text-muted-foreground/20">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-medium text-muted-foreground pr-6">
                          {formatCurrency(itemTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {/* === GRUPO DESPESAS === */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => toggleRow("despesas")}
                >
                  <TableCell className="font-bold text-red-400 flex items-center gap-2 pl-4">
                    {expandedRows.despesas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    (-) Despesas
                  </TableCell>
                  {months.map((m) => (
                    <TableCell key={m} className="text-right font-bold text-red-400/80">
                      {formatCurrency(matrix.despesas.totalByMonth[m] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-red-400 pr-6">
                    {formatCurrency(totalDespesas)}
                  </TableCell>
                </TableRow>

                {expandedRows.despesas &&
                  Object.keys(matrix.despesas.items).map((title) => {
                    const itemData = matrix.despesas.items[title];
                    const itemTotal = Object.values(itemData).reduce((sum, d) => sum + d.amount, 0);

                    return (
                      <TableRow key={title} className="bg-muted/5 hover:bg-muted/10 text-sm">
                        <TableCell className="pl-10 text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-red-400/50" />
                          {title}
                        </TableCell>
                        {months.map((m) => {
                          const cellData = itemData[m];
                          return (
                            <TableCell key={m} className="text-right">
                              {cellData ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-foreground/80">{formatCurrency(cellData.amount)}</span>
                                  <StatusIcon statuses={cellData.status} />
                                </div>
                              ) : (
                                <span className="text-muted-foreground/20">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-medium text-muted-foreground pr-6">
                          {formatCurrency(itemTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {/* === RESULTADO === */}
                <TableRow className="bg-muted/10 border-t-2 border-border/50">
                  <TableCell className="font-bold text-[#E8BD27] pl-4">(=) RESULTADO LÍQUIDO</TableCell>
                  {months.map((m) => (
                    <TableCell
                      key={m}
                      className={cn("text-right font-bold", (totals[m] || 0) >= 0 ? "text-[#E8BD27]" : "text-red-500")}
                    >
                      {formatCurrency(totals[m] || 0)}
                    </TableCell>
                  ))}
                  <TableCell
                    className={cn(
                      "text-right font-bold text-lg pr-6",
                      totalLucro >= 0 ? "text-[#E8BD27]" : "text-red-500",
                    )}
                  >
                    {formatCurrency(totalLucro)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
