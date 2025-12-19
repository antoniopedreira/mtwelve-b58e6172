import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, CircleDollarSign, Clock, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    if (contractId && open) {
      fetchContractDetails();
    }
  }, [contractId, open]);

  async function fetchContractDetails() {
    setIsLoading(true);
    try {
      // 1. Busca Contrato e Cliente
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          clients (name, school, email, phone)
        `,
        )
        .eq("id", contractId)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      // 2. Busca Parcelas (Installments)
      const { data: instData, error: instError } = await supabase
        .from("installments")
        .select("*")
        .eq("contract_id", contractId)
        .order("due_date", { ascending: true });

      if (instError) throw instError;
      setInstallments(instData || []);

      // 3. Busca Comissões Detalhadas (Com join na parcela para saber a data)
      const { data: commData, error: commError } = await supabase
        .from("commissions")
        .select(
          `
          *,
          installments (
            due_date,
            status
          )
        `,
        )
        .eq("contract_id", contractId)
        .order("created_at", { ascending: true }); // Pode ordenar por installment->due_date no front se quiser

      if (commError) throw commError;

      // Ordena comissões pela data da parcela (se existir)
      const sortedCommissions = (commData || []).sort((a: any, b: any) => {
        const dateA = a.installments?.due_date || a.created_at;
        const dateB = b.installments?.due_date || b.created_at;
        return dateA > dateB ? 1 : -1;
      });

      setCommissions(sortedCommissions);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar detalhes do contrato.");
    } finally {
      setIsLoading(false);
    }
  }

  // Função para marcar parcela como paga
  const handleMarkAsPaid = async (installmentId: string) => {
    try {
      const { error } = await supabase.from("installments").update({ status: "paid" }).eq("id", installmentId);

      if (error) throw error;

      toast.success("Parcela marcada como paga!");
      fetchContractDetails(); // Recarrega
      if (onContractUpdated) onContractUpdated();
    } catch (error) {
      toast.error("Erro ao atualizar parcela.");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Força time zone neutra para exibir a data correta
    const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border">
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

        <Tabs defaultValue="installments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installments">Parcelas & Pagamentos</TabsTrigger>
            <TabsTrigger value="commissions">Comissões & Repasses</TabsTrigger>
          </TabsList>

          {/* --- ABA 1: PARCELAS --- */}
          <TabsContent value="installments" className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50">
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

            <ScrollArea className="h-[300px] rounded-md border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">{formatDate(inst.due_date)}</TableCell>
                      <TableCell>{formatCurrency(inst.value)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right">
                        {inst.status !== "paid" && (
                          <button
                            onClick={() => handleMarkAsPaid(inst.id)}
                            className="text-xs font-medium text-emerald-500 hover:text-emerald-400 flex items-center justify-end gap-1 w-full"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Baixar
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* --- ABA 2: COMISSÕES --- */}
          <TabsContent value="commissions" className="mt-4 space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
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

            <ScrollArea className="h-[300px] rounded-md border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Referência (Parcela)</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status da Parcela</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                        Este contrato não possui comissões cadastradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell className="font-medium">
                          {comm.employee_name}
                          <span className="text-xs text-muted-foreground block">{comm.percentage}% do valor</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {comm.installments ? formatDate(comm.installments.due_date) : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-red-400 font-medium">{formatCurrency(comm.value)}</TableCell>
                        <TableCell>
                          {/* Inferimos o status da comissão baseando-se no status da parcela */}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
