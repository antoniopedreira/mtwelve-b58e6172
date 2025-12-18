import { supabase } from "@/integrations/supabase/client";
import { Installment, Commission } from "@/types";

interface CreateContractInput {
  clientId: string;
  totalValue: number;
  installments: Omit<Installment, "id" | "contract_id">[];
  commissions: Omit<Commission, "id" | "contract_id" | "value">[];
}

export async function createContract({
  clientId,
  totalValue,
  installments,
  commissions,
}: CreateContractInput) {
  // 1. Criar o contrato
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      client_id: clientId,
      total_value: totalValue,
      status: "active",
    })
    .select()
    .single();

  if (contractError) throw contractError;

  // 2. Inserir parcelas
  if (installments.length > 0) {
    const installmentsData = installments.map((inst) => ({
      contract_id: contract.id,
      value: inst.value,
      due_date: inst.due_date,
      status: inst.status || "pending",
    }));

    const { error: installmentsError } = await supabase
      .from("installments")
      .insert(installmentsData);

    if (installmentsError) throw installmentsError;
  }

  // 3. Inserir comissões (se houver)
  if (commissions.length > 0) {
    const commissionsData = commissions.map((comm) => ({
      contract_id: contract.id,
      employee_name: comm.employee_name,
      percentage: comm.percentage,
      value: (totalValue * comm.percentage) / 100,
    }));

    const { error: commissionsError } = await supabase
      .from("commissions")
      .insert(commissionsData);

    if (commissionsError) throw commissionsError;
  }

  // 4. Atualizar estágio do cliente para "fechado"
  await supabase
    .from("clients")
    .update({ stage: "fechado" })
    .eq("id", clientId);

  return contract;
}
