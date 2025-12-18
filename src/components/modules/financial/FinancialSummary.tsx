import { useEffect, useState } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Interface para os dados vindos da View
interface FinancialRecord {
  id: string;
  title: string;
  type: string;
  direction: "entrada" | "saida";
  amount: number;
  date: string;
  status: string | null;
}

interface MonthlyData {
  month: string; // chave "YYYY-MM" para ordenação
  label: string; // Ex: "Jan 2025"
  receitas: number;
  despesas: number;
  comissoes: number;
  resultado: number;
}

export function FinancialSummary() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  async function fetchFinancialData() {
    try {
      // Busca dados da View unificada
      const { data: records, error } = await supabase
        .from("financial_overview")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;

      processData(records as FinancialRecord[]);
    } catch (error) {
      console.error("Erro ao buscar financeiro:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function processData(records: FinancialRecord[]) {
    const monthlyMap = new Map<string, MonthlyData>();

    records.forEach((record) => {
      // Normaliza a data para o primeiro dia do mês para agrupar
      const dateObj = parseISO(record.date);
      const monthKey = format(startOfMonth(dateObj), "yyyy-MM");
      const monthLabel = format(dateObj, "MMM yyyy", { locale: ptBR });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), // Capitalize
          receitas: 0,
          despesas: 0,
          comissoes: 0,
          resultado: 0,
        });
      }

      const entry = monthlyMap.get(monthKey)!;

      // Soma baseada no tipo e direção
      if (record.direction === "entrada") {
        entry.receitas += Number(record.amount);
      } else if (record.type === "comissao") {
        entry.comissoes += Number(record.amount);
      } else {
        // Outras saídas (Despesas fixas, variáveis, extras)
        entry.despesas += Number(record.amount);
      }

      // Atualiza o resultado (Receita - Tudo que saiu)
      entry.resultado = entry.receitas - (entry.despesas + entry.comissoes);
    });

    // Converte Mapa para Array e ordena por data
    const sortedData = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    setData(sortedData);
  }

  // Função auxiliar para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <DollarSign className="h-10 w-10 mb-2 opacity-20" />
          <p>Nenhuma movimentação financeira encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  // Totais Gerais (Somatório de todos os meses visíveis)
  const totalReceitas = data.reduce((acc, curr) => acc + curr.receitas, 0);
  const totalSaidas = data.reduce((acc, curr) => acc + curr.despesas + curr.comissoes, 0);
  const totalLucro = totalReceitas - totalSaidas;

  return (
    <div className="space-y-6">
      {/* 1. Cards de Resumo Geral (KPIs) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalReceitas)}</div>
            <p className="text-xs text-muted-foreground">Acumulado do período</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas & Comissões</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalSaidas)}</div>
            <p className="text-xs text-muted-foreground">Total de saídas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-[#E8BD27]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLucro >= 0 ? "text-[#E8BD27]" : "text-red-500"}`}>
              {formatCurrency(totalLucro)}
            </div>
            <p className="text-xs text-muted-foreground">Resultado operacional</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Matriz Mensal (O "Power BI") */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>DRE Gerencial - Visão Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px] font-bold text-primary">Categoria</TableHead>
                  {data.map((month) => (
                    <TableHead key={month.month} className="text-right min-w-[120px]">
                      {month.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold text-primary">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linha de Receitas */}
                <TableRow>
                  <TableCell className="font-medium text-emerald-500 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Receitas
                  </TableCell>
                  {data.map((month) => (
                    <TableCell key={month.month} className="text-right">
                      {formatCurrency(month.receitas)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-emerald-500">
                    {formatCurrency(totalReceitas)}
                  </TableCell>
                </TableRow>

                {/* Linha de Comissões */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">(-) Comissões</TableCell>
                  {data.map((month) => (
                    <TableCell key={month.month} className="text-right text-muted-foreground">
                      {formatCurrency(month.comissoes)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium text-muted-foreground">
                    {formatCurrency(data.reduce((acc, curr) => acc + curr.comissoes, 0))}
                  </TableCell>
                </TableRow>

                {/* Linha de Despesas */}
                <TableRow>
                  <TableCell className="font-medium text-red-400">(-) Despesas</TableCell>
                  {data.map((month) => (
                    <TableCell key={month.month} className="text-right text-red-400">
                      {formatCurrency(month.despesas)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium text-red-400">
                    {formatCurrency(data.reduce((acc, curr) => acc + curr.despesas, 0))}
                  </TableCell>
                </TableRow>

                {/* Linha de Resultado (LUCRO) */}
                <TableRow className="bg-muted/10 font-bold border-t-2 border-border">
                  <TableCell className="text-[#E8BD27]">(=) RESULTADO</TableCell>
                  {data.map((month) => (
                    <TableCell
                      key={month.month}
                      className={`text-right ${month.resultado >= 0 ? "text-[#E8BD27]" : "text-red-500"}`}
                    >
                      {formatCurrency(month.resultado)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right text-lg ${totalLucro >= 0 ? "text-[#E8BD27]" : "text-red-500"}`}>
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
