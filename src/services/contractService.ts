import { supabase } from "@/integrations/supabase/client";
import { Installment, Commission } from "@/types";

interface CreateContractInput {
  clientId: string;
  totalValue: number;
  installments: Omit<Installment, "id" | "contract_id">[];
  commissions: Omit<Commission, "id" | "contract_id" | "value" | "installment_id">[];
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

// Excluir contrato (cascade deleta parcelas e comissões via FK)
export async function deleteContract(contractId: string) {
  // Primeiro deletar comissões manualmente (não tem FK com cascade no banco)
  await supabase.from("commissions").delete().eq("contract_id", contractId);
  
  // Deletar parcelas
  await supabase.from("installments").delete().eq("contract_id", contractId);
  
  // Deletar contrato
  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId);

  if (error) throw error;
}

// Atualizar status da parcela
export async function updateInstallmentStatus(
  installmentId: string,
  status: "pending" | "paid" | "overdue" | "cancelled"
) {
  const { error } = await supabase
    .from("installments")
    .update({ status })
    .eq("id", installmentId);

  if (error) throw error;
}

// Atualizar valor da parcela e comissões vinculadas (apenas se não paga)
export async function updateInstallmentValue(
  installmentId: string,
  newValue: number
) {
  // 1. Atualizar valor da parcela
  const { error: instError } = await supabase
    .from("installments")
    .update({ value: newValue })
    .eq("id", installmentId);

  if (instError) throw instError;

  // 2. Buscar comissões vinculadas a esta parcela
  const { data: commissions, error: commError } = await supabase
    .from("commissions")
    .select("id, percentage")
    .eq("installment_id", installmentId);

  if (commError) throw commError;

  // 3. Atualizar valor de cada comissão
  if (commissions && commissions.length > 0) {
    for (const comm of commissions) {
      const newCommValue = (newValue * comm.percentage) / 100;
      await supabase
        .from("commissions")
        .update({ value: newCommValue })
        .eq("id", comm.id);
    }
  }
}

// Verificar se todas parcelas estão pagas e marcar contrato como concluído
export async function checkAndCompleteContract(contractId: string) {
  const { data: installments, error } = await supabase
    .from("installments")
    .select("status")
    .eq("contract_id", contractId);

  if (error) throw error;

  const allPaid = installments?.every((i) => i.status === "paid");

  if (allPaid) {
    await supabase
      .from("contracts")
      .update({ status: "completed" })
      .eq("id", contractId);
    return true;
  }
  return false;
}

// Buscar detalhes completos do contrato
export async function getContractDetails(contractId: string) {
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      *,
      clients (
        id,
        name,
        school,
        avatar_url
      )
    `)
    .eq("id", contractId)
    .maybeSingle();

  if (contractError) throw contractError;
  if (!contract) throw new Error("Contrato não encontrado");

  const { data: installments, error: instError } = await supabase
    .from("installments")
    .select("*")
    .eq("contract_id", contractId)
    .order("due_date", { ascending: true });

  if (instError) throw instError;

  const { data: commissions, error: commError } = await supabase
    .from("commissions")
    .select("*")
    .eq("contract_id", contractId);

  if (commError) throw commError;

  return {
    contract,
    installments: installments || [],
    commissions: commissions || [],
  };
}
