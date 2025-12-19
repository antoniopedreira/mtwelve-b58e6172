import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Pencil, Search, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewExpenseDialog } from "./NewExpenseDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function ExpensesTable() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para edição
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados para exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("due_date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar despesas.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", deletingId);
      if (error) throw error;
      
      toast.success("Despesa removida.");
      fetchExpenses();
    } catch (error) {
      toast.error("Erro ao remover despesa.");
    } finally {
      setDeletingId(null);
    }
  }

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesa..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma despesa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/5">
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{expense.category}</TableCell>
                  <TableCell>
                    {/* Aqui usamos a data string pura YYYY-MM-DD para criar a data correta */}
                    {format(new Date(expense.due_date + 'T12:00:00'), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium text-red-500">
                    - {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'} 
                           className={expense.status === 'paid' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'}>
                      {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingId(expense.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A despesa será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Edição (Reaproveitado) */}
      <NewExpenseDialog 
        openProp={isEditModalOpen}
        onOpenChangeProp={setIsEditModalOpen}
        expenseToEdit={editingExpense}
        onSuccess={() => {
          fetchExpenses(); // Recarrega a lista após editar
        }}
      />
    </div>
  );
}
