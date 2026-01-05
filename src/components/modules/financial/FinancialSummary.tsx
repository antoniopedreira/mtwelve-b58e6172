import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, subMonths, parseISO } from "date-fns";
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
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Controle de estado
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
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

      // Se houver dados, tenta selecionar o ano mais recente automaticamente se o atual não tiver dados
      if (data && data.length > 0) {
        const years = Array.from(new Set(data.map((d: any) => d.date.substring(0, 4))))
          .sort()
          .reverse();
        if (!years.includes(new Date().getFullYear().toString()) && years.length > 0) {
          setSelectedYear(years[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar financeiro:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- PROCESSAMENTO ---
  const { matrix, availableYears, displayMonths, totals } = useMemo(() => {
    const matrix: MatrixData = {
      receitas: { totalByMonth: {}, items: {} },
      despesas: { totalByMonth: {}, items: {} },
      comissoes: { totalByMonth: {}, items: {} },
    };

    const uniqueMonths = new Set<string>();
    const uniqueYears = new Set<string>();
    const grandTotals: Record<string, number> = {};

    records.forEach((record) => {
      // Ajuste de fuso: T12:00:00 para garantir dia correto
      const dateStr = record.date.includes("T") ? record.date : `${record.date}T12:00:00`;
      const dateObj = new Date(dateStr);

      const year = format(dateObj, "yyyy");
      uniqueYears.add(year);

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

    const allMonths = Array.from(uniqueMonths).sort();
    const sortedYears = Array.from(uniqueYears).sort().reverse();

    // Filtra os meses para mostrar apenas o ano selecionado
    const displayMonths = allMonths.filter((m) => m.startsWith(selectedYear));

    return { matrix, availableYears: sortedYears, displayMonths, totals: grandTotals };
  }, [records, selectedYear]);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = format(date, "MMM", { locale: ptBR }); // Ex: Jan
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  // Helper para buscar o mês anterior matematicamente (permite calcular Jan comparado com Dez do ano anterior)
  const getPrevMonthKey = (currentMonthKey: string) => {
    const [year, month] = currentMonthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1); // Dia 1 do mês atual
    const prevDate = subMonths(date, 1);
    return format(prevDate, "yyyy-MM");
  };

  const calculateVariation = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Componente de Variação (Célula AH) - Agora busca na Matrix Global
  const VariationCell = ({
    current,
    monthKey,
    dataSource,
    type,
  }: {
    current: number;
    monthKey: string;
    dataSource: Record<string, number> | undefined; // Passamos o objeto de totais completo
    type: "good_is_up" | "good_is_down";
  }) => {
    const prevMonthKey = getPrevMonthKey(monthKey);
    const previous = dataSource ? dataSource[prevMonthKey] || 0 : 0;

    if (!previous)
      return <TableCell className="w-[50px] p-1 text-center text-[10px] text-muted-foreground">-</TableCell>;

    const variation = calculateVariation(current, previous);
    if (variation === 0)
      return (
        <TableCell className="w-[50px] p-1 text-center text-[10px] text-muted-foreground">
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
      <TableCell className="w-[50px] p-1 text-center border-l border-dashed border-border/30 bg-muted/5">
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
          <p>Sem dados financeiros.</p>
        </CardContent>
      </Card>
    );

  // Calcula totais do ANO SELECIONADO para os cards
  const yearTotalReceitas = displayMonths.reduce((sum, m) => sum + (matrix.receitas.totalByMonth[m] || 0), 0);
  const yearTotalDespesas = displayMonths.reduce((sum, m) => sum + (matrix.despesas.totalByMonth[m] || 0), 0);
  const yearTotalComissoes = displayMonths.reduce((sum, m) => sum + (matrix.comissoes.totalByMonth[m] || 0), 0);
  const yearTotalLucro = yearTotalReceitas - (yearTotalDespesas + yearTotalComissoes);

  return (
    <div className="space-y-6">
      {/* HEADER E FILTROS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* KPI CARDS (Resumo do Ano) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto flex-1">
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Receita ({selectedYear})</p>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(yearTotalReceitas)}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Despesas ({selectedYear})</p>
                <p className="text-lg font-bold text-red-500">
                  {formatCurrency(yearTotalDespesas + yearTotalComissoes)}
                </p>
              </div>
              <TrendingDown className="h-4 w-4 text-red-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Resultado ({selectedYear})</p>
                <p className={cn("text-lg font-bold", yearTotalLucro >= 0 ? "text-[#E8BD27]" : "text-red-500")}>
                  {formatCurrency(yearTotalLucro)}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-[#E8BD27] opacity-50" />
            </CardContent>
          </Card>
        </div>

        {/* FILTRO DE ANO */}
        <div className="w-full md:w-[180px] flex-shrink-0">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione o Ano" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MATRIZ COM ANÁLISE HORIZONTAL */}
      <Card className="border-border/50 bg-card overflow-hidden shadow-md">
        <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">Matriz DRE - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[200px] font-bold text-primary pl-6 sticky left-0 bg-muted/30 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Item
                  </TableHead>
                  {displayMonths.map((m) => (
                    <>
                      <TableHead key={m} className="text-right min-w-[110px] font-semibold">
                        {getMonthLabel(m)}
                      </TableHead>
                      <TableHead
                        key={`${m}-var`}
                        className="w-[50px] text-center text-[10px] text-muted-foreground p-1"
                      >
                        AH%
                      </TableHead>
                    </>
                  ))}
                  <TableHead className="text-right font-bold pr-6 min-w-[120px] bg-muted/10">
                    TOTAL {selectedYear}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* --- RECEITAS --- */}
                <TableRow
                  className="cursor-pointer group hover:bg-muted/50 transition-colors"
                  onClick={() => toggleRow("receitas")}
                >
                  <TableCell className="font-bold text-emerald-500 flex items-center gap-2 pl-4 sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/50 transition-colors">
                    {expandedRows.receitas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{" "}
                    Receitas
                  </TableCell>
                  {displayMonths.map((m) => (
                    <>
                      <TableCell key={m} className="text-right font-bold text-emerald-500/80">
                        {formatCurrency(matrix.receitas.totalByMonth[m] || 0)}
                      </TableCell>
                      <VariationCell
                        current={matrix.receitas.totalByMonth[m] || 0}
                        monthKey={m}
                        dataSource={matrix.receitas.totalByMonth}
                        type="good_is_up"
                      />
                    </>
                  ))}
                  <TableCell className="text-right font-bold text-emerald-500 pr-6 bg-muted/10">
                    {formatCurrency(yearTotalReceitas)}
                  </TableCell>
                </TableRow>

                {expandedRows.receitas &&
                  Object.keys(matrix.receitas.items).map((title) => (
                    <TableRow key={title} className="bg-muted/5 text-sm hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-10 text-muted-foreground flex items-center gap-2 sticky left-0 bg-muted/5 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/10">
                        <div className="w-1 h-1 rounded-full bg-emerald-500/50" /> {title}
                      </TableCell>
                      {displayMonths.map((m) => (
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
                          <TableCell className="border-l border-dashed border-border/30 bg-muted/5"></TableCell>
                        </>
                      ))}
                      <TableCell className="text-right font-medium pr-6 bg-muted/10">
                        {formatCurrency(
                          displayMonths.reduce((sum, m) => sum + (matrix.receitas.items[title][m]?.amount || 0), 0),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                {/* --- COMISSÕES --- */}
                <TableRow
                  className="cursor-pointer group hover:bg-muted/50 transition-colors"
                  onClick={() => toggleRow("comissoes")}
                >
                  <TableCell className="font-bold text-muted-foreground flex items-center gap-2 pl-4 sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/50 transition-colors">
                    {expandedRows.comissoes ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}{" "}
                    (-) Comissões
                  </TableCell>
                  {displayMonths.map((m) => (
                    <>
                      <TableCell key={m} className="text-right font-bold text-muted-foreground">
                        {formatCurrency(matrix.comissoes.totalByMonth[m] || 0)}
                      </TableCell>
                      <VariationCell
                        current={matrix.comissoes.totalByMonth[m] || 0}
                        monthKey={m}
                        dataSource={matrix.comissoes.totalByMonth}
                        type="good_is_down"
                      />
                    </>
                  ))}
                  <TableCell className="text-right font-bold text-muted-foreground pr-6 bg-muted/10">
                    {formatCurrency(yearTotalComissoes)}
                  </TableCell>
                </TableRow>

                {expandedRows.comissoes &&
                  Object.keys(matrix.comissoes.items).map((title) => (
                    <TableRow key={title} className="bg-muted/5 text-sm hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-10 text-muted-foreground flex items-center gap-2 sticky left-0 bg-muted/5 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/10">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/50" /> {title}
                      </TableCell>
                      {displayMonths.map((m) => (
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
                          <TableCell className="border-l border-dashed border-border/30 bg-muted/5"></TableCell>
                        </>
                      ))}
                      <TableCell className="text-right font-medium pr-6 bg-muted/10">
                        {formatCurrency(
                          displayMonths.reduce((sum, m) => sum + (matrix.comissoes.items[title][m]?.amount || 0), 0),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                {/* --- DESPESAS --- */}
                <TableRow
                  className="cursor-pointer group hover:bg-muted/50 transition-colors"
                  onClick={() => toggleRow("despesas")}
                >
                  <TableCell className="font-bold text-red-400 flex items-center gap-2 pl-4 sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/50 transition-colors">
                    {expandedRows.despesas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{" "}
                    (-) Despesas
                  </TableCell>
                  {displayMonths.map((m) => (
                    <>
                      <TableCell key={m} className="text-right font-bold text-red-400/80">
                        {formatCurrency(matrix.despesas.totalByMonth[m] || 0)}
                      </TableCell>
                      <VariationCell
                        current={matrix.despesas.totalByMonth[m] || 0}
                        monthKey={m}
                        dataSource={matrix.despesas.totalByMonth}
                        type="good_is_down"
                      />
                    </>
                  ))}
                  <TableCell className="text-right font-bold text-red-400 pr-6 bg-muted/10">
                    {formatCurrency(yearTotalDespesas)}
                  </TableCell>
                </TableRow>

                {expandedRows.despesas &&
                  Object.keys(matrix.despesas.items).map((title) => (
                    <TableRow key={title} className="bg-muted/5 text-sm hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-10 text-muted-foreground flex items-center gap-2 sticky left-0 bg-muted/5 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/10">
                        <div className="w-1 h-1 rounded-full bg-red-400/50" /> {title}
                      </TableCell>
                      {displayMonths.map((m) => (
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
                          <TableCell className="border-l border-dashed border-border/30 bg-muted/5"></TableCell>
                        </>
                      ))}
                      <TableCell className="text-right font-medium pr-6 bg-muted/10">
                        {formatCurrency(
                          displayMonths.reduce((sum, m) => sum + (matrix.despesas.items[title][m]?.amount || 0), 0),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                {/* --- RESULTADO --- */}
                <TableRow className="bg-muted/10 border-t-2 border-border/50">
                  <TableCell className="font-bold text-[#E8BD27] pl-4 sticky left-0 bg-muted/10 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    (=) RESULTADO
                  </TableCell>
                  {displayMonths.map((m) => (
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
                      <VariationCell current={totals[m] || 0} monthKey={m} dataSource={totals} type="good_is_up" />
                    </>
                  ))}
                  <TableCell
                    className={cn(
                      "text-right font-bold text-lg pr-6 bg-muted/20",
                      yearTotalLucro >= 0 ? "text-[#E8BD27]" : "text-red-500",
                    )}
                  >
                    {formatCurrency(yearTotalLucro)}
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
