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

  // 3. Buscar parcelas criadas para vincular comissões
  const { data: createdInstallments, error: fetchInstError } = await supabase
    .from("installments")
    .select("id, value")
    .eq("contract_id", contract.id);

  if (fetchInstError) throw fetchInstError;

  // 4. Inserir comissões por parcela (se houver)
  if (commissions.length > 0 && createdInstallments && createdInstallments.length > 0) {
    const commissionsData = commissions.flatMap((comm) =>
      createdInstallments.map((inst) => ({
        contract_id: contract.id,
        installment_id: inst.id,
        employee_name: comm.employee_name,
        percentage: comm.percentage,
        value: (Number(inst.value) * comm.percentage) / 100,
      }))
    );

    const { error: commissionsError } = await supabase
      .from("commissions")
      .insert(commissionsData);

    if (commissionsError) throw commissionsError;
  }

  // 5. Atualizar estágio do cliente para "fechado"
  await supabase
    .from("clients")
    .update({ stage: "fechado" })
    .eq("id", clientId);

  return contract;
}
