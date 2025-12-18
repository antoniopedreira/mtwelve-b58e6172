import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import { Client, Installment, Commission } from '@/types';
import { mockEmployees } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ContractBuilderProps {
  client?: Client;
  onSave: (data: {
    totalValue: number;
    installments: Omit<Installment, 'id' | 'contractId'>[];
    commissions: Omit<Commission, 'id' | 'contractId' | 'value'>[];
  }) => void;
  onCancel: () => void;
}

export function ContractBuilder({ client, onSave, onCancel }: ContractBuilderProps) {
  const [totalValue, setTotalValue] = useState<number>(0);
  const [installments, setInstallments] = useState<Array<{
    value: number;
    dueDate: string;
  }>>([{ value: 0, dueDate: '' }]);
  const [commissions, setCommissions] = useState<Array<{
    employeeId: string;
    employeeName: string;
    percentage: number;
  }>>([]);

  const installmentsSum = useMemo(() => {
    return installments.reduce((sum, inst) => sum + (inst.value || 0), 0);
  }, [installments]);

  const difference = totalValue - installmentsSum;
  const isBalanced = Math.abs(difference) < 0.01;

  const totalCommissionPercent = useMemo(() => {
    return commissions.reduce((sum, c) => sum + (c.percentage || 0), 0);
  }, [commissions]);

  const addInstallment = () => {
    setInstallments([...installments, { value: 0, dueDate: '' }]);
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== index));
    }
  };

  const updateInstallment = (index: number, field: 'value' | 'dueDate', value: string | number) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  const distributeEvenly = () => {
    if (installments.length === 0 || totalValue === 0) return;
    const valuePerInstallment = totalValue / installments.length;
    setInstallments(
      installments.map((inst) => ({ ...inst, value: Number(valuePerInstallment.toFixed(2)) }))
    );
  };

  const addCommission = () => {
    setCommissions([...commissions, { employeeId: '', employeeName: '', percentage: 0 }]);
  };

  const removeCommission = (index: number) => {
    setCommissions(commissions.filter((_, i) => i !== index));
  };

  const updateCommission = (index: number, employeeId: string) => {
    const employee = mockEmployees.find((e) => e.id === employeeId);
    if (employee) {
      const updated = [...commissions];
      updated[index] = { ...updated[index], employeeId, employeeName: employee.name };
      setCommissions(updated);
    }
  };

  const updateCommissionPercent = (index: number, percentage: number) => {
    const updated = [...commissions];
    updated[index] = { ...updated[index], percentage };
    setCommissions(updated);
  };

  const handleSave = () => {
    // TODO: Supabase Integration - Save contract to database
    onSave({
      totalValue,
      installments: installments.map((inst) => ({
        value: inst.value,
        dueDate: new Date(inst.dueDate),
        status: 'pending' as const,
      })),
      commissions: commissions.filter((c) => c.employeeId),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Client Info */}
      {client && (
        <div className="p-4 rounded-lg bg-surface border border-border/50">
          <p className="text-sm text-muted-foreground">Cliente</p>
          <p className="font-semibold text-lg">{client.name}</p>
          <p className="text-sm text-primary">{client.sport} • {client.position}</p>
        </div>
      )}

      {/* Total Value */}
      <div className="space-y-2">
        <Label htmlFor="totalValue">Valor Total do Contrato</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
          <Input
            id="totalValue"
            type="number"
            value={totalValue || ''}
            onChange={(e) => setTotalValue(Number(e.target.value))}
            className="pl-10 text-lg font-semibold"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Split Payments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Parcelas</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={distributeEvenly}>
              Distribuir Igualmente
            </Button>
            <Button variant="outline" size="sm" onClick={addInstallment}>
              <Plus className="w-4 h-4 mr-1" />
              Parcela
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {installments.map((inst, index) => (
            <div key={index} className="flex items-center gap-3 animate-slide-up">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    value={inst.value || ''}
                    onChange={(e) => updateInstallment(index, 'value', Number(e.target.value))}
                    className="pl-10"
                    placeholder="Valor"
                  />
                </div>
                <Input
                  type="date"
                  value={inst.dueDate}
                  onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeInstallment(index)}
                disabled={installments.length === 1}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Validation Feedback */}
        <div className={cn(
          'p-3 rounded-lg flex items-center gap-2 transition-colors',
          isBalanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        )}>
          {isBalanced ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isBalanced
              ? 'Parcelas balanceadas!'
              : difference > 0
              ? `Faltam ${formatCurrency(difference)}`
              : `Excede em ${formatCurrency(Math.abs(difference))}`}
          </span>
        </div>
      </div>

      {/* Commissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Comissões</Label>
          <Button variant="outline" size="sm" onClick={addCommission}>
            <UserPlus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma comissão cadastrada
          </p>
        ) : (
          <div className="space-y-3">
            {commissions.map((comm, index) => (
              <div key={index} className="flex items-center gap-3 animate-slide-up">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Select
                    value={comm.employeeId}
                    onValueChange={(value) => updateCommission(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      type="number"
                      value={comm.percentage || ''}
                      onChange={(e) => updateCommissionPercent(index, Number(e.target.value))}
                      placeholder="Percentual"
                      min={0}
                      max={100}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCommission(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {totalCommissionPercent > 0 && (
              <p className="text-sm text-muted-foreground">
                Total: <span className="text-primary font-medium">{totalCommissionPercent}%</span>
                {totalValue > 0 && (
                  <span> ({formatCurrency(totalValue * totalCommissionPercent / 100)})</span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!isBalanced || totalValue === 0}
          className="gold-gradient text-primary-foreground"
        >
          Salvar Contrato
        </Button>
      </div>
    </div>
  );
}
