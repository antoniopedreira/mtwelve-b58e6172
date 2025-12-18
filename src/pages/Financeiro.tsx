import { useState, useEffect } from "react";
import { Plus, FileText, Loader2, Users } from "lucide-react";
import { FinancialSummary } from "@/components/modules/financial/FinancialSummary";
import { ContractBuilder } from "@/components/modules/financial/ContractBuilder";
import { ClientSelectorDialog } from "@/components/modules/financial/ClientSelectorDialog";
import { ContractDetailDialog } from "@/components/modules/financial/ContractDetailDialog";
import { NewExpenseDialog } from "@/components/modules/financial/NewExpenseDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useActiveContracts, useCompletedContracts, ContractWithClient } from "@/hooks/useContracts";
import { createContract } from "@/services/contractService";
import { Client, Installment, Commission } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewClientForm } from "@/components/modules/crm/NewClientDialog";

export default function Financeiro() {
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { data: activeContracts, isLoading: contractsLoading, refetch: refetchContracts } = useActiveContracts();
  const { data: completedContracts, isLoading: completedLoading, refetch: refetchCompleted } = useCompletedContracts();

  // Estado para progresso de cada contrato
  const [contractProgress, setContractProgress] = useState<Record<string, { paid: number; total: number }>>({});

  // Buscar progresso dos contratos
  useEffect(() => {
    const fetchProgress = async () => {
      if (!activeContracts || activeContracts.length === 0) return;

      const progressMap: Record<string, { paid: number; total: number }> = {};

      for (const contract of activeContracts) {
        const { data } = await supabase
          .from("installments")
          .select("value, status")
          .eq("contract_id", contract.id);

        if (data) {
          const total = data.reduce((sum, i) => sum + Number(i.value), 0);
          const paid = data
            .filter((i) => i.status === "paid")
            .reduce((sum, i) => sum + Number(i.value), 0);
          progressMap[contract.id] = { total, paid };
        }
      }

      setContractProgress(progressMap);
    };

    fetchProgress();
  }, [activeContracts]);

  const handleDataRefresh = () => {
    refetchContracts();
    refetchCompleted();
  };

  const handleOpenNewContract = () => {
    setIsClientSelectorOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientSelectorOpen(false);
    setIsContractModalOpen(true);
  };

  const handleCreateNewClient = () => {
    setIsClientSelectorOpen(false);
    setIsNewClientDialogOpen(true);
  };

  const handleNewClientCreated = (client?: Client) => {
    setIsNewClientDialogOpen(false);
    if (client) {
      // Se cliente foi criado, abre direto o contrato
      setSelectedClient(client);
      setIsContractModalOpen(true);
    } else {
      // Senão, reabre seletor
      setIsClientSelectorOpen(true);
    }
  };

  const handleSaveContract = async (data: {
    totalValue: number;
    installments: Omit<Installment, "id" | "contract_id">[];
    commissions: Omit<Commission, "id" | "contract_id" | "value">[];
  }) => {
    if (!selectedClient) {
      toast({
        title: "Erro",
        description: "Nenhum cliente selecionado.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await createContract({
        clientId: selectedClient.id,
        totalValue: data.totalValue,
        installments: data.installments,
        commissions: data.commissions,
      });

      toast({
        title: "Contrato Salvo!",
        description: `Contrato de ${selectedClient.name} cadastrado com sucesso.`,
      });

      setIsContractModalOpen(false);
      setSelectedClient(null);
      handleDataRefresh();
    } catch (error) {
      console.error("Erro ao salvar contrato:", error);
      toast({
        title: "Erro ao salvar contrato",
        description: "Ocorreu um erro ao cadastrar o contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenContractDetail = (contractId: string) => {
    setSelectedContractId(contractId);
    setIsDetailOpen(true);
  };

  const renderContractCard = (contract: ContractWithClient) => {
    const progress = contractProgress[contract.id] || { paid: 0, total: Number(contract.total_value) };
    const percentage = progress.total > 0 ? (progress.paid / progress.total) * 100 : 0;

    return (
      <div
        key={contract.id}
        onClick={() => handleOpenContractDetail(contract.id)}
        className="p-5 rounded-xl bg-card border border-border/50 hover:border-[#E8BD27]/30 transition-colors group cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={contract.clients?.avatar_url || undefined} />
            <AvatarFallback className="bg-[#E8BD27]/10 text-[#E8BD27]">
              {contract.clients ? getInitials(contract.clients.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
            Ativo
          </span>
        </div>
        <h3 className="font-semibold mb-1 text-lg">{contract.clients?.name || "Cliente"}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {contract.clients?.school || "Sem clube definido"}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor Total</span>
            <span className="font-bold text-foreground">
              {formatCurrency(Number(contract.total_value))}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recebido</span>
            <span className="text-emerald-500 font-medium">
              {formatCurrency(progress.paid)} ({percentage.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#E8BD27] h-1.5 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            DRE Gerencial, Fluxo de Caixa e Gestão de Contratos.
          </p>
        </div>

        {/* Área de Ações (Botões) */}
        <div className="flex items-center gap-3">
          <NewExpenseDialog onSuccess={handleDataRefresh} />

          <Button
            className="gold-gradient text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={handleOpenNewContract}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="dre" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger
            value="dre"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            DRE & Resultados
          </TabsTrigger>
          <TabsTrigger
            value="contracts"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Contratos Ativos
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Concluídos
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: A Nova Matriz Financeira */}
        <TabsContent value="dre" className="space-y-4 focus-visible:outline-none">
          <FinancialSummary />
        </TabsContent>

        {/* Aba 2: Gestão de Contratos */}
        <TabsContent value="contracts" className="space-y-4 focus-visible:outline-none">
          {contractsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeContracts && activeContracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeContracts.map(renderContractCard)}

              {/* Card para Adicionar Novo Contrato */}
              <button
                onClick={handleOpenNewContract}
                className="p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-[#E8BD27]/50 hover:bg-muted/5 transition-all flex flex-col items-center justify-center min-h-[240px] text-muted-foreground hover:text-[#E8BD27] gap-3"
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-[#E8BD27]/10 transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium">Novo Contrato</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum contrato ativo</h3>
              <p className="text-sm mb-6">Comece criando seu primeiro contrato.</p>
              <Button
                className="gold-gradient text-primary-foreground font-semibold"
                onClick={handleOpenNewContract}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Contrato
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Aba 3: Contratos Concluídos */}
        <TabsContent value="completed" className="space-y-4 focus-visible:outline-none">
          {completedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : completedContracts && completedContracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedContracts.map((contract) => (
                <div
                  key={contract.id}
                  onClick={() => handleOpenContractDetail(contract.id)}
                  className="p-5 rounded-xl bg-card border border-border/50 hover:border-blue-500/30 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contract.clients?.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-500/10 text-blue-500">
                        {contract.clients ? getInitials(contract.clients.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                      Concluído
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 text-lg">{contract.clients?.name || "Cliente"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {contract.clients?.school || "Sem clube definido"}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor Total</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(Number(contract.total_value))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-1.5 rounded-full w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum contrato concluído</h3>
              <p className="text-sm">Os contratos aparecerão aqui quando todas as parcelas forem pagas.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Seletor de Cliente */}
      <ClientSelectorDialog
        open={isClientSelectorOpen}
        onOpenChange={setIsClientSelectorOpen}
        onSelectClient={handleSelectClient}
        onCreateNewClient={handleCreateNewClient}
      />

      {/* Modal: Novo Cliente */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Atleta</DialogTitle>
          </DialogHeader>
          <NewClientForm onSuccess={handleNewClientCreated} />
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Contrato */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border p-0 gap-0">
          <DialogHeader className="p-6 pb-2 border-b border-border/50">
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className="w-1 h-6 bg-[#E8BD27] rounded-full inline-block"></span>
              Novo Contrato
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <ContractBuilder
              client={selectedClient ? { id: selectedClient.id, name: selectedClient.name } : undefined}
              onSave={handleSaveContract}
              onCancel={() => {
                setIsContractModalOpen(false);
                setSelectedClient(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhes do Contrato */}
      <ContractDetailDialog
        contractId={selectedContractId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onContractUpdated={handleDataRefresh}
      />
    </div>
  );
}
