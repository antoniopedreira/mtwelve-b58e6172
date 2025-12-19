import { supabase } from "@/integrations/supabase/client";
import { Installment, Commission } from "@/types";

interface CreateContractInput {
  clientId: string;
  totalValue: number;
  installments: Omit<Installment, "id" | "contract_id">[];
  commissions: Omit<Commission, "id" | "contract_id" | "value" | "installment_id">[];
}

export async function createContract({ clientId, totalValue, installments, commissions }: CreateContractInput) {
  // 1. Criar o contrato (Cabeçalho)
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
    // 2. Inserir parcelas
    if (installments.length > 0) {
      const installmentsData = installments.map((inst) => ({
        contract_id: contract.id,
        value: inst.value,
        due_date: inst.due_date, // Espera-se YYYY-MM-DD aqui
        status: inst.status || "pending",
      }));

      const { error: installmentsError } = await supabase.from("installments").insert(installmentsData);

      if (installmentsError) throw installmentsError;
    }

    // 3. Buscar parcelas criadas (para pegar os IDs gerados)
    const { data: createdInstallments, error: fetchInstError } = await supabase
      .from("installments")
      .select("id, value")
      .eq("contract_id", contract.id);

    if (fetchInstError) throw fetchInstError;

    // 4. Inserir comissões por parcela (se houver)
    // A lógica é: Dividir a comissão proporcionalmente entre as parcelas
    if (commissions.length > 0 && createdInstallments && createdInstallments.length > 0) {
      const commissionsData = commissions.flatMap((comm) =>
        createdInstallments.map((inst) => ({
          contract_id: contract.id,
          installment_id: inst.id,
          employee_name: comm.employee_name,
          percentage: comm.percentage,
          // Calcula valor proporcional: (Valor da Parcela * % Comissão)
          value: (Number(inst.value) * comm.percentage) / 100,
        })),
      );

      const { error: commissionsError } = await supabase.from("commissions").insert(commissionsData);

      if (commissionsError) throw commissionsError;
    }

    // 5. Atualizar estágio do cliente para "fechado"
    await supabase.from("clients").update({ stage: "fechado" }).eq("id", clientId);

    return contract;
  } catch (error) {
    console.error("Erro durante a criação do contrato. Revertendo...", error);

    // ROLLBACK MANUAL: Se algo falhou nos passos 2, 3 ou 4, apagamos o contrato criado no passo 1.
    await supabase.from("contracts").delete().eq("id", contract.id);

    // Repassa o erro para o frontend mostrar o toast
    throw error;
  }
}

// ... (Mantenha as outras funções: deleteContract, updateInstallmentStatus, etc. iguais)
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

export async function updateInstallmentValue(installmentId: string, newValue: number) {
  const { error: instError } = await supabase.from("installments").update({ value: newValue }).eq("id", installmentId);
  if (instError) throw instError;

  const { data: commissions, error: commError } = await supabase
    .from("commissions")
    .select("id, percentage")
    .eq("installment_id", installmentId);
  if (commError) throw commError;

  if (commissions && commissions.length > 0) {
    for (const comm of commissions) {
      const newCommValue = (newValue * comm.percentage) / 100;
      await supabase.from("commissions").update({ value: newCommValue }).eq("id", comm.id);
    }
  }
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

  return { contract, installments: installments || [], commissions: commissions || [] };
}
