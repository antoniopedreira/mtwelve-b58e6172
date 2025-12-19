import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CircleDollarSign, FileText, Pencil, User, X, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ContractDetailDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContractUpdated?: () => void;
}

export function ContractDetailDialog({ contractId, open, onOpenChange, onContractUpdated }: ContractDetailDialogProps) {
  const [contract, setContract] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [editInstallmentForm, setEditInstallmentForm] = useState<any>({});

  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [editCommissionForm, setEditCommissionForm] = useState<any>({});

  useEffect(() => {
    if (contractId && open) {
      fetchContractDetails();
    }
  }, [contractId, open]);

  async function fetchContractDetails() {
    setIsLoading(true);
    try {
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select(`*, clients (name, school, email, phone)`)
        .eq("id", contractId)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      const { data: instData, error: instError } = await supabase
        .from("installments")
        .select("*")
        .eq("contract_id", contractId)
        .order("due_date", { ascending: true });

      if (instError) throw instError;
      setInstallments(instData || []);

      const { data: commData, error: commError } = await supabase
        .from("commissions")
        .select(`*, installments (due_date, status)`)
        .eq("contract_id", contractId)
        .order("created_at", { ascending: true });

      if (commError) throw commError;

      const sortedCommissions = (commData || []).sort((a: any, b: any) => {
        const dateA = a.installments?.due_date || a.created_at;
        const dateB = b.installments?.due_date || b.created_at;
        return dateA > dateB ? 1 : -1;
      });

      setCommissions(sortedCommissions);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar detalhes.");
    } finally {
      setIsLoading(false);
    }
  }

  // --- FUNÇÕES DE EDIÇÃO DE PARCELA (ATUALIZADO) ---

  const startEditingInstallment = (inst: any) => {
    setEditingInstallmentId(inst.id);
    const dateObj = new Date(inst.due_date.includes("T") ? inst.due_date : inst.due_date + "T12:00:00");
    setEditInstallmentForm({
      value: inst.value,
      due_date: dateObj,
      status: inst.status,
    });
  };

  const cancelEditingInstallment = () => {
    setEditingInstallmentId(null);
    setEditInstallmentForm({});
  };

  const saveInstallment = async (id: string) => {
    try {
      // 1. Atualiza a parcela específica
      const { error: updateError } = await supabase
        .from("installments")
        .update({
          value: Number(editInstallmentForm.value),
          due_date: format(editInstallmentForm.due_date, "yyyy-MM-dd"),
          status: editInstallmentForm.status,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. BUSCA TODAS AS PARCELAS PARA RECALCULAR O TOTAL
      const { data: allInstallments, error: fetchError } = await supabase
        .from("installments")
        .select("value")
        .eq("contract_id", contractId);

      if (fetchError) throw fetchError;

      // Soma os valores
      const newTotal = allInstallments.reduce((acc, curr) => acc + Number(curr.value), 0);

      // 3. ATUALIZA O VALOR TOTAL DO CONTRATO
      const { error: contractUpdateError } = await supabase
        .from("contracts")
        .update({ total_value: newTotal })
        .eq("id", contractId);

      if (contractUpdateError) throw contractUpdateError;

      toast.success("Parcela salva e Total do contrato atualizado!");
      setEditingInstallmentId(null);
      fetchContractDetails(); // Recarrega para mostrar o novo total na tela
      if (onContractUpdated) onContractUpdated();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar parcela.");
    }
  };

  // --- FUNÇÕES DE EDIÇÃO DE COMISSÃO ---

  const startEditingCommission = (comm: any) => {
    setEditingCommissionId(comm.id);
    setEditCommissionForm({
      value: comm.value,
      percentage: comm.percentage,
      employee_name: comm.employee_name,
    });
  };

  const cancelEditingCommission = () => {
    setEditingCommissionId(null);
    setEditCommissionForm({});
  };

  const saveCommission = async (id: string) => {
    try {
      const { error } = await supabase
        .from("commissions")
        .update({
          value: Number(editCommissionForm.value),
          percentage: Number(editCommissionForm.percentage),
          employee_name: editCommissionForm.employee_name,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Comissão atualizada!");
      setEditingCommissionId(null);
      fetchContractDetails();
      if (onContractUpdated) onContractUpdated();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar comissão.");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#E8BD27]" />
              Detalhes do Contrato
            </DialogTitle>
            <Badge variant="outline" className="mr-6 border-[#E8BD27] text-[#E8BD27]">
              {contract.status === "active" ? "Ativo" : "Concluído"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="installments" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="installments">Parcelas & Pagamentos</TabsTrigger>
            <TabsTrigger value="commissions">Comissões & Repasses</TabsTrigger>
          </TabsList>

          <TabsContent value="installments" className="flex-1 flex flex-col mt-4 gap-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50 shrink-0">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor Total do Contrato</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(contract.total_value)}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium flex items-center justify-end gap-2">
                  <User className="h-4 w-4" />
                  {contract.clients?.name}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border/50 flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="text-right w-[100px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((inst) => {
                    const isEditing = editingInstallmentId === inst.id;

                    return (
                      <TableRow key={inst.id}>
                        <TableCell>
                          {isEditing ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal h-8",
                                    !editInstallmentForm.due_date && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editInstallmentForm.due_date ? (
                                    format(editInstallmentForm.due_date, "dd/MM/yyyy")
                                  ) : (
                                    <span>Data</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editInstallmentForm.due_date}
                                  onSelect={(date) =>
                                    setEditInstallmentForm({ ...editInstallmentForm, due_date: date })
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="font-medium">{formatDate(inst.due_date)}</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editInstallmentForm.value}
                              onChange={(e) =>
                                setEditInstallmentForm({ ...editInstallmentForm, value: e.target.value })
                              }
                              className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            formatCurrency(inst.value)
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editInstallmentForm.status}
                              onValueChange={(val) => setEditInstallmentForm({ ...editInstallmentForm, status: val })}
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Atrasado</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={inst.status === "paid" ? "default" : "secondary"}
                              className={
                                inst.status === "paid"
                                  ? "bg-emerald-500 hover:bg-emerald-600"
                                  : "bg-yellow-500/10 text-yellow-600"
                              }
                            >
                              {inst.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-500"
                                onClick={() => saveInstallment(inst.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500"
                                onClick={cancelEditingInstallment}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEditingInstallment(inst)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="flex-1 flex flex-col mt-4 gap-4 overflow-hidden">
            {/* ... (código das comissões permanece igual) ... */}
            <div className="p-4 bg-muted/20 rounded-lg border border-border/50 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#E8BD27]/10 rounded-full text-[#E8BD27]">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Resumo de Comissões</h4>
                  <p className="text-sm text-muted-foreground">
                    Valores a serem repassados conforme o recebimento das parcelas.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border/50 flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead className="w-[100px]">%</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status Ref.</TableHead>
                    <TableHead className="text-right w-[100px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        Este contrato não possui comissões cadastradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((comm) => {
                      const isEditing = editingCommissionId === comm.id;

                      return (
                        <TableRow key={comm.id}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editCommissionForm.employee_name}
                                onChange={(e) =>
                                  setEditCommissionForm({ ...editCommissionForm, employee_name: e.target.value })
                                }
                                className="h-8"
                              />
                            ) : (
                              <div className="font-medium">{comm.employee_name}</div>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editCommissionForm.percentage}
                                onChange={(e) =>
                                  setEditCommissionForm({ ...editCommissionForm, percentage: e.target.value })
                                }
                                className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-muted-foreground">{comm.percentage}%</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editCommissionForm.value}
                                onChange={(e) =>
                                  setEditCommissionForm({ ...editCommissionForm, value: e.target.value })
                                }
                                className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-red-400 font-medium">{formatCurrency(comm.value)}</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {comm.installments ? (
                              <Badge
                                variant="outline"
                                className={
                                  comm.installments.status === "paid"
                                    ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                                    : "border-yellow-500 text-yellow-600 bg-yellow-500/10"
                                }
                              >
                                {comm.installments.status === "paid" ? "Liberado" : "Aguardando"}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-500"
                                  onClick={() => saveCommission(comm.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500"
                                  onClick={cancelEditingCommission}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => startEditingCommission(comm)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
