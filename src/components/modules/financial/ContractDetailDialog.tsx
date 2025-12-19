import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Trash2, Check, Pencil, X, Loader2, Calendar, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getContractDetails,
  deleteContract,
  updateInstallmentStatus,
  updateInstallmentValue,
  checkAndCompleteContract,
} from "@/services/contractService";
import { Installment, Commission } from "@/types";

interface ContractDetailDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContractUpdated: () => void;
}

interface ContractData {
  contract: {
    id: string;
    total_value: number;
    status: string;
    created_at: string;
    clients: {
      id: string;
      name: string;
      school: string | null;
      avatar_url: string | null;
    } | null;
  };
  installments: Installment[];
  commissions: (Commission & { installment_id: string | null })[];
}

export function ContractDetailDialog({ contractId, open, onOpenChange, onContractUpdated }: ContractDetailDialogProps) {
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (open && contractId) {
      loadContractDetails();
    }
  }, [open, contractId]);

  const loadContractDetails = async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      const result = await getContractDetails(contractId);
      setData(result as ContractData);
    } catch (error) {
      console.error("Erro ao carregar contrato:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do contrato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contractId) return;
    setActionLoading("delete");
    try {
      await deleteContract(contractId);
      toast({
        title: "Contrato Excluído",
        description: "O contrato foi removido com sucesso.",
      });
      onOpenChange(false);
      onContractUpdated();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setShowDeleteAlert(false);
    }
  };

  const handleTogglePaid = async (installment: Installment) => {
    if (!contractId) return;
    const newStatus = installment.status === "paid" ? "pending" : "paid";
    setActionLoading(installment.id);

    try {
      await updateInstallmentStatus(installment.id, newStatus);

      // Verificar se contrato foi concluído
      if (newStatus === "paid") {
        const completed = await checkAndCompleteContract(contractId);
        if (completed) {
          toast({
            title: "Contrato Concluído! 🎉",
            description: "Todas as parcelas foram pagas.",
          });
        }
      }

      await loadContractDetails();
      onContractUpdated();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartEdit = (installment: Installment) => {
    if (installment.status === "paid") {
      toast({
        title: "Parcela já paga",
        description: "Não é possível editar uma parcela já paga.",
        variant: "destructive",
      });
      return;
    }
    setEditingInstallment(installment.id);
    setEditValue(Number(installment.value));
  };

  const handleSaveEdit = async (installmentId: string) => {
    setActionLoading(installmentId);
    try {
      await updateInstallmentValue(installmentId, editValue);

      // Recalcular total do contrato
      if (data && contractId) {
        const newTotal = data.installments.reduce((sum, inst) => {
          if (inst.id === installmentId) return sum + editValue;
          return sum + Number(inst.value);
        }, 0);

        // Atualizar total do contrato
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("contracts").update({ total_value: newTotal }).eq("id", contractId);
      }

      toast({
        title: "Parcela Atualizada",
        description: "O valor foi atualizado e as comissões recalculadas.",
      });

      setEditingInstallment(null);
      await loadContractDetails();
      onContractUpdated();
    } catch (error) {
      console.error("Erro ao atualizar parcela:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a parcela.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Pago</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0">Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-500/10 text-red-500 border-0">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Ativo</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-500 border-0">Concluído</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-500 border-0">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Agrupar comissões por funcionário
  const getCommissionsByEmployee = () => {
    if (!data) return [];
    const grouped: Record<string, { name: string; total: number; percentage: number }> = {};

    data.commissions.forEach((comm) => {
      if (!grouped[comm.employee_name]) {
        grouped[comm.employee_name] = {
          name: comm.employee_name,
          total: 0,
          percentage: comm.percentage,
        };
      }
      grouped[comm.employee_name].total += Number(comm.value);
    });

    return Object.values(grouped);
  };

  const paidTotal =
    data?.installments.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.value), 0) || 0;

  const totalValue = Number(data?.contract.total_value || 0);
  const progress = totalValue > 0 ? (paidTotal / totalValue) * 100 : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className="w-1 h-6 bg-[#E8BD27] rounded-full inline-block"></span>
              Detalhes do Contrato
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <div className="p-6 space-y-6">
              {/* Info do Cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={data.contract.clients?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#E8BD27]/10 text-[#E8BD27] text-lg">
                      {data.contract.clients ? getInitials(data.contract.clients.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{data.contract.clients?.name || "Cliente"}</h3>
                    <p className="text-sm text-muted-foreground">{data.contract.clients?.school || "Sem clube"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getContractStatusBadge(data.contract.status)}
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Valor Total
                  </div>
                  <p className="font-bold text-xl">{formatCurrency(totalValue)}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
                    <Check className="w-4 h-4" />
                    Recebido
                  </div>
                  <p className="font-bold text-xl text-emerald-600">{formatCurrency(paidTotal)}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Pendente
                  </div>
                  <p className="font-bold text-xl text-amber-600">{formatCurrency(totalValue - paidTotal)}</p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-[#E8BD27] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Parcelas */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E8BD27]" />
                  Parcelas ({data.installments.length})
                </h4>
                <div className="space-y-2">
                  {data.installments.map((inst, index) => (
                    <div
                      key={inst.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        inst.status === "paid"
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
                        {editingInstallment === inst.id ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-32 h-8"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{formatCurrency(Number(inst.value))}</span>
                        )}
                        <span className="text-sm text-muted-foreground">{formatDate(inst.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inst.status)}

                        {editingInstallment === inst.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingInstallment(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-500"
                              onClick={() => handleSaveEdit(inst.id)}
                              disabled={actionLoading === inst.id}
                            >
                              {actionLoading === inst.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(inst)}
                              disabled={inst.status === "paid"}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${
                                inst.status === "paid"
                                  ? "text-emerald-500"
                                  : "text-muted-foreground hover:text-emerald-500"
                              }`}
                              onClick={() => handleTogglePaid(inst)}
                              disabled={actionLoading === inst.id}
                            >
                              {actionLoading === inst.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comissões */}
              {getCommissionsByEmployee().length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#E8BD27]" />
                    Comissões
                  </h4>
                  <div className="space-y-2">
                    {getCommissionsByEmployee().map((comm) => (
                      <div
                        key={comm.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(comm.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{comm.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-sm text-muted-foreground">{comm.percentage}%</span>
                          <span className="font-medium">{formatCurrency(comm.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">Contrato não encontrado.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert de Exclusão */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita e todas as parcelas e
              comissões serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading === "delete"}
            >
              {actionLoading === "delete" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
