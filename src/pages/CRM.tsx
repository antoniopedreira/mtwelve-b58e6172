import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PipelineBoard } from '@/components/modules/crm/PipelineBoard';
import { ContractBuilder } from '@/components/modules/financial/ContractBuilder';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function CRM() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const { toast } = useToast();

  const handleClientMoveToFechado = (client: Client) => {
    setSelectedClient(client);
    setIsContractModalOpen(true);
  };

  const handleSaveContract = (data: {
    totalValue: number;
    installments: any[];
    commissions: any[];
  }) => {
    // TODO: Supabase Integration - Save contract to database
    console.log('Contract data:', { client: selectedClient, ...data });
    
    toast({
      title: 'Contrato Salvo!',
      description: `Contrato de ${selectedClient?.name} cadastrado com sucesso.`,
    });
    
    setIsContractModalOpen(false);
    setSelectedClient(undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu pipeline de atletas
          </p>
        </div>
        <Button className="gold-gradient text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Novo Atleta
        </Button>
      </div>

      {/* Pipeline Board */}
      <PipelineBoard onClientMoveToFechado={handleClientMoveToFechado} />

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
