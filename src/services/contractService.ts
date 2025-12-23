import { supabase } from "@/integrations/supabase/client";
import { Installment, Commission } from "@/types";

// Atualizamos a interface para aceitar a taxa na parcela
interface CreateContractInput {
  clientId: string;
  totalValue: number;
  // Agora installment tem transaction_fee opcional no input
  installments: (Omit<Installment, "id" | "contract_id"> & { transaction_fee?: number })[];
  commissions: Omit<Commission, "id" | "contract_id" | "value" | "installment_id">[];
}

export async function createContract({ clientId, totalValue, installments, commissions }: CreateContractInput) {
  // 1. Criar Contrato
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

  try {
    // 2. Inserir Parcelas (Com a taxa individual)
    if (installments.length > 0) {
      const installmentsData = installments.map((inst) => ({
        contract_id: contract.id,
        value: inst.value,
        due_date: inst.due_date,
        status: inst.status || "pending",
        transaction_fee: inst.transaction_fee || 0, // Salva o valor da taxa
      }));

      const { error: installmentsError } = await supabase.from("installments").insert(installmentsData);
      if (installmentsError) throw installmentsError;
    }

    // 3. Buscar IDs das parcelas criadas (para as comissões)
    const { data: createdInstallments, error: fetchInstError } = await supabase
      .from("installments")
      .select("id, value")
      .eq("contract_id", contract.id);
    if (fetchInstError) throw fetchInstError;

    // 4. Inserir Comissões
    if (commissions.length > 0 && createdInstallments) {
      const commissionsData = commissions.flatMap((comm) =>
        createdInstallments.map((inst) => ({
          contract_id: contract.id,
          installment_id: inst.id,
          employee_name: comm.employee_name,
          percentage: comm.percentage,
          value: (Number(inst.value) * comm.percentage) / 100,
        })),
      );
      const { error: commissionsError } = await supabase.from("commissions").insert(commissionsData);
      if (commissionsError) throw commissionsError;
    }

    // 5. Atualizar Cliente
    await supabase.from("clients").update({ stage: "fechado" }).eq("id", clientId);

    return contract;
  } catch (error) {
    console.error("Erro, revertendo...", error);
    await supabase.from("contracts").delete().eq("id", contract.id);
    throw error;
  }
}

// ... (Mantenha as outras funções iguais)
export async function deleteContract(contractId: string) {
  await supabase.from("commissions").delete().eq("contract_id", contractId);
  await supabase.from("installments").delete().eq("contract_id", contractId);
  const { error } = await supabase.from("contracts").delete().eq("id", contractId);
  if (error) throw error;
}

export async function updateInstallmentStatus(
  installmentId: string,
  status: "pending" | "paid" | "overdue" | "cancelled",
) {
  const { error } = await supabase.from("installments").update({ status }).eq("id", installmentId);
  if (error) throw error;
}

// Atualizar valor e taxa se necessário (Opcional, mas útil)
export async function updateInstallmentValue(installmentId: string, newValue: number, newFee?: number) {
  const updateData: any = { value: newValue };
  if (newFee !== undefined) updateData.transaction_fee = newFee;

  const { error: instError } = await supabase.from("installments").update(updateData).eq("id", installmentId);
  if (instError) throw instError;
}

export async function checkAndCompleteContract(contractId: string) {
  const { data: installments, error } = await supabase
    .from("installments")
    .select("status")
    .eq("contract_id", contractId);
  if (error) throw error;
  const allPaid = installments?.every((i) => i.status === "paid");
  if (allPaid) {
    await supabase.from("contracts").update({ status: "completed" }).eq("id", contractId);
    return true;
  }
  return false;
}

export async function getContractDetails(contractId: string) {
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`*, clients (id, name, school, avatar_url)`)
    .eq("id", contractId)
    .maybeSingle();
  if (contractError) throw contractError;

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

  return { contract, installments: installments || [], commissions: commissions || [] };
}
