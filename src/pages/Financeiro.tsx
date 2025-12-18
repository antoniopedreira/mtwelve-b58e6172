import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { FinancialSummary } from "@/components/modules/financial/FinancialSummary"; // A Nova Matriz Poderosa
import { ContractBuilder } from "@/components/modules/financial/ContractBuilder";
import { NewExpenseDialog } from "@/components/modules/financial/NewExpenseDialog"; // Modal de Despesas
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Financeiro() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const { toast } = useToast();

  // Função para recarregar a tela quando uma nova despesa ou contrato for salvo
  const handleDataRefresh = () => {
    // Como o componente FinancialSummary busca os dados no useEffect,
    // podemos forçar uma atualização recarregando a página ou usando um estado de versão.
    // Por enquanto, um reload simples garante que o DRE esteja atualizado.
    window.location.reload();
  };

  const handleSaveContract = (data: { totalValue: number; installments: any[]; commissions: any[] }) => {
    // TODO: A integração real do ContractBuilder com Supabase será feita no próximo passo.
    // Por enquanto, apenas fecha o modal.
    console.log("Contract data:", data);

    toast({
      title: "Contrato Salvo!",
      description: "O contrato foi cadastrado com sucesso.",
    });

    setIsContractModalOpen(false);
    handleDataRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">DRE Gerencial, Fluxo de Caixa e Gestão de Contratos.</p>
        </div>

        {/* Área de Ações (Botões) */}
        <div className="flex items-center gap-3">
          {/* 1. Botão de Despesa (Vermelho) */}
          <NewExpenseDialog onSuccess={handleDataRefresh} />

          {/* 2. Botão de Contrato (Dourado) */}
          <Button
            className="gold-gradient text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => setIsContractModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="dre" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="dre" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            DRE & Resultados
          </TabsTrigger>
          <TabsTrigger
            value="contracts"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Contratos Ativos
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: A Nova Matriz Financeira (Substitui a tabela antiga) */}
        <TabsContent value="dre" className="space-y-4 focus-visible:outline-none">
          <FinancialSummary />
        </TabsContent>

        {/* Aba 2: Gestão de Contratos (Visualização em Cards) */}
        <TabsContent value="contracts" className="space-y-4 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Exemplo de Card de Contrato (Mock) */}
            <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-[#E8BD27]/30 transition-colors group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-[#E8BD27]/10 text-[#E8BD27]">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                  Ativo
                </span>
              </div>
              <h3 className="font-semibold mb-1 text-lg">André Costa</h3>
              <p className="text-sm text-muted-foreground mb-4">Futebol • Zagueiro</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-bold text-foreground">R$ 500.000</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recebido</span>
                  <span className="text-emerald-500 font-medium">R$ 165.000 (33%)</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#E8BD27] h-1.5 rounded-full" style={{ width: "33%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">Próx. vencimento: 15/Out</p>
              </div>
            </div>

            {/* Card para Adicionar Novo Contrato (Atalho Rápido) */}
            <button
              onClick={() => setIsContractModalOpen(true)}
              className="p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-[#E8BD27]/50 hover:bg-muted/5 transition-all flex flex-col items-center justify-center min-h-[240px] text-muted-foreground hover:text-[#E8BD27] gap-3"
            >
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-[#E8BD27]/10 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Novo Contrato</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Novo Contrato */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border p-0 gap-0">
          <DialogHeader className="p-6 pb-2 border-b border-border/50">
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className="w-1 h-6 bg-[#E8BD27] rounded-full inline-block"></span>
              Novo Contrato
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <ContractBuilder onSave={handleSaveContract} onCancel={() => setIsContractModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
