import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction } from '@/types';
import { mockTransactions } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function TransactionsTable() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredTransactions = useMemo(() => {
    // TODO: Supabase Integration - Fetch transactions from database
    return mockTransactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.value, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.value, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-[160px] text-center">
            {months[selectedMonth]} {selectedYear}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="font-semibold text-success">{formatCurrency(totals.income)}</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="font-semibold text-destructive">{formatCurrency(totals.expense)}</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="font-semibold text-primary">{formatCurrency(totals.balance)}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada para este período
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="group">
                  <TableCell>
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      transaction.type === 'income' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    )}>
                      {transaction.type === 'income' 
                        ? <ArrowUpRight className="w-4 h-4" />
                        : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell className="text-muted-foreground">{transaction.clientName}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-md bg-muted text-xs">
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-semibold',
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.value)}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      transaction.status === 'completed' && 'bg-success/10 text-success',
                      transaction.status === 'pending' && 'bg-warning/10 text-warning',
                      transaction.status === 'cancelled' && 'bg-destructive/10 text-destructive'
                    )}>
                      {transaction.status === 'completed' && 'Concluído'}
                      {transaction.status === 'pending' && 'Pendente'}
                      {transaction.status === 'cancelled' && 'Cancelado'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
