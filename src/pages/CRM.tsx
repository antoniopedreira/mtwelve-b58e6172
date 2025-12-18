import { useState } from "react";
import { Search, Globe } from "lucide-react";
import { PipelineBoard } from "@/components/modules/crm/PipelineBoard";
import { NewClientDialog } from "@/components/modules/crm/NewClientDialog"; // Importe o novo modal
import { ContractBuilder } from "@/components/modules/financial/ContractBuilder";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function CRM() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");

  // Estado para forçar atualização do Board
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { toast } = useToast();

  const handleClientMoveToFechado = (client: Client) => {
    setSelectedClient(client);
    setIsContractModalOpen(true);
  };

  const handleSaveContract = (data: { totalValue: number; installments: any[]; commissions: any[] }) => {
    console.log("Contract data:", { client: selectedClient, ...data });

    toast({
      title: "Contrato Salvo!",
      description: `Contrato de ${selectedClient?.name} cadastrado com sucesso.`,
    });

    setIsContractModalOpen(false);
    setSelectedClient(undefined);
  };

  // Função chamada quando um novo atleta é criado com sucesso
  const handleClientCreated = () => {
    setRefreshTrigger((prev) => prev + 1); // Força o PipelineBoard a recarregar
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu pipeline de atletas</p>
        </div>

        {/* AQUI ESTÁ A MUDANÇA: O botão agora abre o Modal de Cadastro */}
        <NewClientDialog onSuccess={handleClientCreated} />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="relative flex-1 md:max-w-xs">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nacionalidade..."
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Pipeline Board */}
      {/* Passamos uma key baseada no refreshTrigger para forçar o componente a remontar e buscar dados novos */}
      <PipelineBoard
        key={refreshTrigger}
        onClientMoveToFechado={handleClientMoveToFechado}
        searchTerm={searchTerm}
        nationalityFilter={nationalityFilter}
      />

      {/* Contract Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              <span className="gold-text">Novo Contrato</span>
            </DialogTitle>
          </DialogHeader>
          <ContractBuilder
            client={selectedClient}
            onSave={handleSaveContract}
            onCancel={() => {
              setIsContractModalOpen(false);
              setSelectedClient(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
