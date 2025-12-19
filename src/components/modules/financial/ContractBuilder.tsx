import { useState, useEffect } from "react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Installment, Commission } from "@/types";
import { Separator } from "@/components/ui/separator";
import { useEmployees } from "@/hooks/useEmployees";

interface ContractBuilderProps {
  client?: { id: string; name: string };
  onSave: (data: {
    totalValue: number;
    installments: Omit<Installment, "id" | "contract_id">[];
    commissions: Omit<Commission, "id" | "contract_id" | "value">[];
  }) => void;
  onCancel: () => void;
}

export function ContractBuilder({ client, onSave, onCancel }: ContractBuilderProps) {
  const [totalValue, setTotalValue] = useState<string>("");
  const [installmentsCount, setInstallmentsCount] = useState<string>("1");
  const [startDate, setStartDate] = useState<Date>(new Date());

  const [installments, setInstallments] = useState<Omit<Installment, "id" | "contract_id">[]>([]);
  const [commissions, setCommissions] = useState<Omit<Commission, "id" | "contract_id" | "value">[]>([]);

  const { data: employees } = useEmployees();

  // CSS para esconder os spinners (setinhas) dos inputs numéricos
  const noSpinnerClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  // Função para gerar parcelas automaticamente
  const generateInstallments = () => {
    const value = Number(totalValue);
    const count = Number(installmentsCount);

    if (!value || !count) return;

    const installmentValue = value / count;
    const newInstallments = Array.from({ length: count }).map((_, index) => ({
      value: Number(installmentValue.toFixed(2)),
      // CORREÇÃO: Usar format(yyyy-MM-dd) em vez de ISOString para evitar problemas de fuso
      due_date: format(addMonths(startDate, index), "yyyy-MM-dd"),
      status: "pending" as const,
    }));

    // Ajusta centavos na última parcela para bater o valor exato
    const currentSum = newInstallments.reduce((acc, curr) => acc + curr.value, 0);
    const diff = value - currentSum;
    if (diff !== 0) {
      newInstallments[newInstallments.length - 1].value += diff;
    }

    setInstallments(newInstallments);
  };

  // Atualiza uma parcela específica e RECALCULA O TOTAL
  const updateInstallment = (index: number, field: keyof (typeof installments)[0], value: any) => {
    const newInstallments = [...installments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    setInstallments(newInstallments);

    // Se alterou o valor, atualiza o Total Geral lá em cima
    if (field === "value") {
      const newTotal = newInstallments.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
      setTotalValue(newTotal.toFixed(2));
    }
  };

  const addCommission = () => {
    setCommissions([...commissions, { employee_name: "", percentage: 0 }]);
  };

  const updateCommission = (index: number, field: keyof (typeof commissions)[0], value: any) => {
    const newCommissions = [...commissions];
    newCommissions[index] = { ...newCommissions[index], [field]: value };
    setCommissions(newCommissions);
  };

  const removeCommission = (index: number) => {
    setCommissions(commissions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      totalValue: Number(totalValue),
      installments,
      commissions,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Resumo do Cliente */}
      {client && (
        <div className="bg-muted/30 p-4 rounded-lg border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Cliente Selecionado</p>
            <p className="font-semibold text-lg">{client.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <span className="text-emerald-500 font-medium text-sm">Novo Contrato</span>
          </div>
        </div>
      )}

      {/* Configuração Inicial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Valor Total do Contrato (R$)</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            className={`text-lg font-medium ${noSpinnerClass}`}
          />
        </div>
        <div className="space-y-2">
          <Label>Quantidade de Parcelas</Label>
          <Input
            type="number"
            min="1"
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
            className={noSpinnerClass}
          />
        </div>
        <div className="space-y-2">
          <Label>Data da 1ª Parcela</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={generateInstallments} variant="secondary" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Gerar Parcelas
        </Button>
      </div>

      <Separator />

      {/* Lista de Parcelas */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full" />
          Parcelamento
        </h3>

        {installments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            Configure os valores acima e clique em "Gerar Parcelas"
          </div>
        ) : (
          <div className="grid gap-3">
            {installments.map((inst, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 bg-card border rounded-lg hover:border-primary/30 transition-colors"
              >
                <div className="md:col-span-1 text-sm font-medium text-muted-foreground text-center md:text-left">
                  #{index + 1}
                </div>
                <div className="md:col-span-5">
                  {/* Date Picker da Parcela */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {inst.due_date ? (
                          format(new Date(inst.due_date + "T12:00:00"), "dd/MM/yyyy")
                        ) : (
                          <span>Data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        // Adiciona T12:00:00 para garantir a visualização correta no calendário
                        selected={new Date(inst.due_date + "T12:00:00")}
                        onSelect={(date) => date && updateInstallment(index, "due_date", format(date, "yyyy-MM-dd"))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="md:col-span-6">
                  <Input
                    type="number"
                    value={inst.value}
                    onChange={(e) => updateInstallment(index, "value", Number(e.target.value))}
                    className={`font-medium ${noSpinnerClass}`}
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-2 text-sm text-muted-foreground">
              Total Parcelado:{" "}
              <span className="font-bold text-foreground ml-2">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  installments.reduce((a, b) => a + b.value, 0),
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Comissões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Comissões & Parceiros
          </h3>
          <Button onClick={addCommission} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {commissions.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">Nenhuma comissão configurada para este contrato.</div>
        ) : (
          <div className="space-y-3">
            {commissions.map((comm, index) => (
              <div key={index} className="flex gap-4 items-end bg-muted/20 p-3 rounded-lg border">
                <div className="flex-1 space-y-2">
                  <Label>Beneficiário</Label>
                  <Select
                    value={comm.employee_name}
                    onValueChange={(val) => updateCommission(index, "employee_name", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.name}>
                          {emp.name} ({emp.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>% Comissão</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={comm.percentage}
                      onChange={(e) => updateCommission(index, "percentage", Number(e.target.value))}
                      className={`pr-6 ${noSpinnerClass}`}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="w-40 space-y-2">
                  <Label>Valor Estimado</Label>
                  <div className="h-10 px-3 py-2 bg-muted rounded-md text-sm font-medium flex items-center text-muted-foreground border">
                    R$ {((Number(totalValue) * comm.percentage) / 100).toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mb-0.5 text-muted-foreground hover:text-red-500"
                  onClick={() => removeCommission(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="gold-gradient text-primary-foreground font-bold min-w-[150px]"
          disabled={!totalValue || installments.length === 0}
        >
          Salvar Contrato
        </Button>
      </div>
    </div>
  );
}
