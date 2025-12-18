import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { TransactionsTable } from '@/components/modules/financial/TransactionsTable';
import { ContractBuilder } from '@/components/modules/financial/ContractBuilder';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function Financeiro() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveContract = (data: {
    totalValue: number;
    installments: any[];
    commissions: any[];
  }) => {
    // TODO: Supabase Integration - Save contract to database
    console.log('Contract data:', data);
    
    toast({
      title: 'Contrato Salvo!',
      description: 'O contrato foi cadastrado com sucesso.',
    });
    
    setIsContractModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Controle de contratos e transações
          </p>
        </div>
        <Button 
          className="gold-gradient text-primary-foreground"
          onClick={() => setIsContractModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-card">
            Transações
          </TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-card">
            Contratos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTable />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Contract Card Example */}
            <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  Ativo
                </span>
              </div>
              <h3 className="font-semibold mb-1">André Costa</h3>
              <p className="text-sm text-muted-foreground mb-3">Futebol • Zagueiro</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="font-semibold text-primary">R$ 500.000</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Parcelas</span>
                <span>1/3 pagas</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '33%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">33% concluído</p>
              </div>
            </div>

            {/* Add Contract Card */}
            <button
              onClick={() => setIsContractModalOpen(true)}
              className="p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-primary"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Adicionar Contrato</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contract Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              <span className="gold-text">Novo Contrato</span>
            </DialogTitle>
          </DialogHeader>
          <ContractBuilder
            onSave={handleSaveContract}
            onCancel={() => setIsContractModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
