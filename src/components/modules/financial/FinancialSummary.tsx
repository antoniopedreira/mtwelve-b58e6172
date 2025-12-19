import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
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
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FinancialRecord {
  id: string;
  title: string;
  type: string;
  direction: "entrada" | "saida";
  amount: number;
  date: string;
  status: string | null;
}

type MatrixData = {
  [category: string]: {
    totalByMonth: Record<string, number>;
    items: Record<
      string,
      {
        [month: string]: {
          amount: number;
          status: string[];
        };
      }
    >;
  };
};

export function FinancialSummary() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ALTERAÇÃO AQUI: Agora 'receitas' começa como false (fechado)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    receitas: false,
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

  // --- PROCESSAMENTO ---
  const { matrix, months, totals } = useMemo(() => {
    const matrix: MatrixData = {
      receitas: { totalByMonth: {}, items: {} },
      despesas: { totalByMonth: {}, items: {} },
      comissoes: { totalByMonth: {}, items: {} },
    };

    const uniqueMonths = new Set<string>();
    const grandTotals: Record<string, number> = {};

    records.forEach((record) => {
      // Ajuste de fuso: T12:00:00 para garantir dia correto
      const dateStr = record.date.includes("T") ? record.date : `${record.date}T12:00:00`;
      const dateObj = new Date(dateStr);
      const monthKey = format(startOfMonth(dateObj), "yyyy-MM");
      uniqueMonths.add(monthKey);

      let categoryKey = "despesas";
      if (record.direction === "entrada") categoryKey = "receitas";
      else if (record.type === "comissao") categoryKey = "comissoes";

      const catGroup = matrix[categoryKey];
      if (!catGroup.totalByMonth[monthKey]) catGroup.totalByMonth[monthKey] = 0;

      const title = record.title || "Sem descrição";
      if (!catGroup.items[title]) catGroup.items[title] = {};
      if (!catGroup.items[title][monthKey]) {
        catGroup.items[title][monthKey] = { amount: 0, status: [] };
      }

      const val = Number(record.amount);
      catGroup.totalByMonth[monthKey] += val;
      catGroup.items[title][monthKey].amount += val;
      if (record.status) {
        catGroup.items[title][monthKey].status.push(record.status);
      }

      if (!grandTotals[monthKey]) grandTotals[monthKey] = 0;
      if (categoryKey === "receitas") grandTotals[monthKey] += val;
      else grandTotals[monthKey] -= val;
    });

    return { matrix, months: Array.from(uniqueMonths).sort(), totals: grandTotals };
  }, [records]);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = format(date, "MMM yy", { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const calculateVariation = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const VariationCell = ({
    current,
    previous,
    type,
  }: {
    current: number;
    previous: number;
    type: "good_is_up" | "good_is_down";
  }) => {
    if (!previous) return <TableCell className="w-[60px] p-1 text-center text-xs text-muted-foreground">-</TableCell>;

    const variation = calculateVariation(current, previous);
    if (variation === 0)
      return (
        <TableCell className="w-[60px] p-1 text-center text-xs text-muted-foreground">
          <Minus className="w-3 h-3 mx-auto" />
        </TableCell>
      );

    let colorClass = "text-muted-foreground";
    if (type === "good_is_up") {
      colorClass = variation > 0 ? "text-emerald-500 font-bold" : "text-red-400 font-bold";
    } else {
      colorClass = variation > 0 ? "text-red-400 font-bold" : "text-emerald-500 font-bold";
    }

    return (
      <TableCell className="w-[60px] p-1 text-center border-l border-dashed border-border/30 bg-muted/5">
        <div className={cn("text-[10px] flex items-center justify-center gap-0.5", colorClass)}>
          {variation > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(variation).toFixed(0)}%
        </div>
      </TableCell>
    );
  };

  const StatusIcon = ({ statuses }: { statuses: string[] }) => {
    if (!statuses || statuses.length === 0) return null;
    const allPaid = statuses.every((s) => s === "paid");
    const hasPending = statuses.some((s) => s === "pending");

    if (allPaid) return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    if (hasPending) return <Clock className="h-3 w-3 text-yellow-500" />;
    return <AlertCircle className="h-3 w-3 text-red-400" />;
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (records.length === 0)
    return (
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 opacity-50">
          <DollarSign className="h-10 w-10 mb-2" />
          <p>Sem dados.</p>
        </CardContent>
      </Card>
    );

  const totalReceitas = Object.values(matrix.receitas.totalByMonth).reduce((a, b) => a + b, 0);
  const totalDespesas = Object.values(matrix.despesas.totalByMonth).reduce((a, b) => a + b, 0);
  const totalComissoes = Object.values(matrix.comissoes.totalByMonth).reduce((a, b) => a + b, 0);
  const totalLucro = totalReceitas - (totalDespesas + totalComissoes);

  return (
    <div className="space-y-6">
      {/* KPIs */}
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

      {/* MATRIZ COM ANÁLISE HORIZONTAL */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <CardHeader>
          <CardTitle>DRE Gerencial - Análise Horizontal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[200px] font-bold text-primary pl-6 sticky left-0 bg-muted/30 z-10">
                    Item
                  </TableHead>
                  {months.map((m, i) => (
                    <>
                      <TableHead key={m} className="text-right min-w-[100px] font-semibold">
                        {getMonthLabel(m)}
                      </TableHead>
                      {i > 0 && (
                        <TableHead
                          key={`${m}-var`}
                          className="w-[60px] text-center text-[10px] text-muted-foreground p-1"
                        >
                          AH%
                        </TableHead>
                      )}
                    </>
                  ))}
                  <TableHead className="text-right font-bold pr-6">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* --- RECEITAS --- */}
                <TableRow className="cursor-pointer group" onClick={() => toggleRow("receitas")}>
                  <TableCell className="font-bold text-emerald-500 flex items-center gap-2 pl-4 sticky left-0 bg-card z-10">
                    {expandedRows.receitas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{" "}
                    Receitas
                  </TableCell>
                  {months.map((m, i) => (
                    <>
                      <TableCell key={m} className="text-right font-bold text-emerald-500/80">
                        {formatCurrency(matrix.receitas.totalByMonth[m] || 0)}
                      </TableCell>
                      {i > 0 && (
                        <VariationCell
                          current={matrix.receitas.totalByMonth[m] || 0}
                          previous={matrix.receitas.totalByMonth[months[i - 1]] || 0}
                          type="good_is_up"
                        />
                      )}
                    </>
                  ))}
                  <TableCell className="text-right font-bold text-emerald-500 pr-6">
                    {formatCurrency(totalReceitas)}
                  </TableCell>
                </TableRow>

                {expandedRows.receitas &&
                  Object.keys(matrix.receitas.items).map((title) => (
                    <TableRow key={title} className="bg-muted/5 text-sm">
                      <TableCell className="pl-10 text-muted-foreground flex items-center gap-2 sticky left-0 bg-muted/5 z-10">
                        <div className="w-1 h-1 rounded-full bg-emerald-500/50" /> {title}
                      </TableCell>
                      {months.map((m, i) => (
                        <>
                          <TableCell key={m} className="text-right">
                            {matrix.receitas.items[title][m] ? (
                              <div className="flex items-center justify-end gap-2">
                                <span>{formatCurrency(matrix.receitas.items[title][m].amount)}</span>
                                <StatusIcon statuses={matrix.receitas.items[title][m].status} />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/20">-</span>
                            )}
                          </TableCell>
                          {i > 0 && (
                            <VariationCell
                              current={matrix.receitas.items[title][m]?.amount || 0}
                              previous={matrix.receitas.items[title][months[i - 1]]?.amount || 0}
                              type="good_is_up"
                            />
                          )}
                        </>
                      ))}
                      <TableCell className="text-right font-medium pr-6">
                        {formatCurrency(Object.values(matrix.receitas.items[title]).reduce((s, x) => s + x.amount, 0))}
                      </TableCell>
                    </TableRow>
                  ))}

                {/* --- COMISSÕES --- */}
                <TableRow className="cursor-pointer group" onClick={() => toggleRow("comissoes")}>
                  <TableCell className="font-bold text-muted-foreground flex items-center gap-2 pl-4 sticky left-0 bg-card z-10">
                    {expandedRows.comissoes ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}{" "}
                    (-) Comissões
                  </TableCell>
                  {months.map((m, i) => (
                    <>
                      <TableCell key={m} className="text-right font-bold text-muted-foreground">
                        {formatCurrency(matrix.comissoes.totalByMonth[m] || 0)}
                      </TableCell>
                      {i > 0 && (
                        <VariationCell
                          current={matrix.comissoes.totalByMonth[m] || 0}
                          previous={matrix.comissoes.totalByMonth[months[i - 1]] || 0}
                          type="good_is_down"
                        />
                      )}
                    </>
                  ))}
                  <TableCell className="text-right font-bold text-muted-foreground pr-6">
                    {formatCurrency(totalComissoes)}
                  </TableCell>
                </TableRow>

                {expandedRows.comissoes &&
                  Object.keys(matrix.comissoes.items).map((title) => (
                    <TableRow key={title} className="bg-muted/5 text-sm">
                      <TableCell className="pl-10 text-muted-foreground flex items-center gap-2 sticky left-0 bg-muted/5 z-10">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/50" /> {title}
                      </TableCell>
                      {months.map((m, i) => (
                        <>
                          <TableCell key={m} className="text-right">
                            {matrix.comissoes.items[title][m] ? (
                              <div className="flex items-center justify-end gap-2">
                                <span>{formatCurrency(matrix.comissoes.items[title][m].amount)}</span>
                                <StatusIcon statuses={matrix.comissoes.items[title][m].status} />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/20">-</span>
                            )}
                          </TableCell>
                          {i > 0 && (
                            <VariationCell
                              current={matrix.comissoes.items[title][m]?.amount || 0}
                              previous={matrix.comissoes.items[title][months[i - 1]]?.amount || 0}
                              type="good_is_down"
                            />
                          )}
                        </>
                      ))}
                      <TableCell className="text-right font-medium pr-6">
                        {formatCurrency(Object.values(matrix.comissoes.items[title]).reduce((s, x) => s + x.amount, 0))}
                      </TableCell>
                    </TableRow>
                  ))}

                {/* --- DESPESAS --- */}
                <TableRow className="cursor-pointer group" onClick={() => toggleRow("despesas")}>
                  <TableCell className="font-bold text-red-400 flex items-center gap-2 pl-4 sticky left-0 bg-card z-10">
                    {expandedRows.despesas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{" "}
                    (-) Despesas
                  </TableCell>
                  {months.map((m, i) => (
                    <>
                      <TableCell key={m} className="text-right font-bold text-red-400/80">
                        {formatCurrency(matrix.despesas.totalByMonth[m] || 0)}
                      </TableCell>
                      {i > 0 && (
                        <VariationCell
                          current={matrix.despesas.totalByMonth[m] || 0}
                          previous={matrix.despesas.totalByMonth[months[i - 1]] || 0}
                          type="good_is_down"
                        />
                      )}
                    </>
                  ))}
                  <TableCell className="text-right font-bold text-red-400 pr-6">
                    {formatCurrency(totalDespesas)}
                  </TableCell>
                </TableRow>

                {expandedRows.despesas &&
                  Object.keys(matrix.despesas.items).map((title) => (
                    <TableRow key={title} className="bg-muted/5 text-sm">
                      <TableCell className="pl-10 text-muted-foreground flex items-center gap-2 sticky left-0 bg-muted/5 z-10">
                        <div className="w-1 h-1 rounded-full bg-red-400/50" /> {title}
                      </TableCell>
                      {months.map((m, i) => (
                        <>
                          <TableCell key={m} className="text-right">
                            {matrix.despesas.items[title][m] ? (
                              <div className="flex items-center justify-end gap-2">
                                <span>{formatCurrency(matrix.despesas.items[title][m].amount)}</span>
                                <StatusIcon statuses={matrix.despesas.items[title][m].status} />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/20">-</span>
                            )}
                          </TableCell>
                          {i > 0 && (
                            <VariationCell
                              current={matrix.despesas.items[title][m]?.amount || 0}
                              previous={matrix.despesas.items[title][months[i - 1]]?.amount || 0}
                              type="good_is_down"
                            />
                          )}
                        </>
                      ))}
                      <TableCell className="text-right font-medium pr-6">
                        {formatCurrency(Object.values(matrix.despesas.items[title]).reduce((s, x) => s + x.amount, 0))}
                      </TableCell>
                    </TableRow>
                  ))}

                {/* --- RESULTADO --- */}
                <TableRow className="bg-muted/10 border-t-2 border-border/50">
                  <TableCell className="font-bold text-[#E8BD27] pl-4 sticky left-0 bg-muted/10 z-10">
                    (=) RESULTADO
                  </TableCell>
                  {months.map((m, i) => (
                    <>
                      <TableCell
                        key={m}
                        className={cn(
                          "text-right font-bold",
                          (totals[m] || 0) >= 0 ? "text-[#E8BD27]" : "text-red-500",
                        )}
                      >
                        {formatCurrency(totals[m] || 0)}
                      </TableCell>
                      {i > 0 && (
                        <VariationCell
                          current={totals[m] || 0}
                          previous={totals[months[i - 1]] || 0}
                          type="good_is_up"
                        />
                      )}
                    </>
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
