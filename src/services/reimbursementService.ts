
import { supabase } from "@/integrations/supabase/client";
import { TransactionStatus } from "@/types";

export interface ReimbursementRequestForm {
  invoiceId: string;
  amount: number;
  description: string;
  category?: string;
}

export interface ReimbursementAttachment {
  id: string;
  reimbursement_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface ReimbursementRequest {
  id: string;
  invoice_id: string;
  amount: number;
  description: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  category?: string;
}

export const createReimbursementRequest = async (
  data: ReimbursementRequestForm,
  userId: string
): Promise<ReimbursementRequest> => {
  const { invoiceId, amount, description, category } = data;
  
  const { data: result, error } = await supabase
    .from("reimbursement_requests")
    .insert({
      invoice_id: invoiceId,
      amount,
      description,
      user_id: userId,
      category: category || "Remboursement", // Utiliser la catégorie fournie ou "Remboursement" par défaut
      status: "pending"
    })
    .select()
    .single();

  if (error) throw error;
  return result as ReimbursementRequest;
};

export const uploadReimbursementAttachment = async (
  reimbursementId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${reimbursementId}/${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('reimbursements')
    .upload(fileName, file);
    
  if (uploadError) {
    throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
  }
  
  const { data: urlData } = supabase.storage
    .from('reimbursements')
    .getPublicUrl(fileName);
    
  // Enregistrer les métadonnées du fichier dans la base de données
  const { error: dbError } = await supabase
    .from('reimbursement_attachments')
    .insert({
      reimbursement_id: reimbursementId,
      file_name: file.name,
      file_path: fileName,
      file_type: file.type
    });
    
  if (dbError) {
    throw new Error(`Erreur lors de l'enregistrement des métadonnées: ${dbError.message}`);
  }
    
  return urlData.publicUrl;
};

export const getReimbursementAttachments = async (reimbursementId: string): Promise<ReimbursementAttachment[]> => {
  const { data, error } = await supabase
    .from('reimbursement_attachments')
    .select('*')
    .eq('reimbursement_id', reimbursementId);
    
  if (error) throw error;
  return data as ReimbursementAttachment[];
};

// Mise à jour du budget après une transaction
const updateBudgetAfterTransaction = async (transaction: {
  amount: number;
  category: string;
  description: string;
  date: string;
  status: TransactionStatus;
  id: string;
}) => {
  // Récupérer le budget actuel
  const { data: budgetData, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .limit(1)
    .single();

  if (budgetError) throw budgetError;

  // Mettre à jour le montant dépensé
  const budget = budgetData;
  const updatedBudget = { ...budget };

  // Mise à jour du total dépensé
  updatedBudget.total_spent = Number(budget.total_spent) + Number(transaction.amount);

  // Mise à jour de la catégorie si elle existe
  if (transaction.category && budget.categories && budget.categories[transaction.category]) {
    const categoryBudget = budget.categories[transaction.category];
    categoryBudget.spent = Number(categoryBudget.spent) + Number(transaction.amount);
    categoryBudget.lastUpdated = new Date().toISOString();
    updatedBudget.categories[transaction.category] = categoryBudget;
  }

  // Enregistrer les modifications
  const { error: updateError } = await supabase
    .from("budgets")
    .update(updatedBudget)
    .eq("id", budget.id);

  if (updateError) throw updateError;

  // Enregistrer l'historique de la modification
  const { error: historyError } = await supabase
    .from("budget_history")
    .insert({
      action: "transaction_created",
      details: JSON.stringify({
        transaction_id: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description
      }),
      user_id: "system" // Remplacer par l'ID de l'utilisateur actuel si disponible
    });

  if (historyError) throw historyError;

  return updatedBudget;
};

export const approveReimbursementRequest = async (requestId: string) => {
  // 1. Obtenir les détails de la demande de remboursement
  const { data: request, error: requestError } = await supabase
    .from("reimbursement_requests")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("*, category")
    .single();

  if (requestError) throw requestError;

  // 2. Créer une transaction pour le remboursement
  const { data: transactionData, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      amount: request.amount,
      description: `Remboursement: ${request.description}`,
      status: TransactionStatus.COMPLETED,
      date: new Date().toISOString(),
      category: request.category || "Remboursement" // Utiliser la catégorie de la demande ou "Remboursement" par défaut
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  // 3. Mettre à jour le budget
  await updateBudgetAfterTransaction({
    amount: request.amount,
    category: request.category || "Remboursement",
    date: new Date().toISOString(),
    description: `Remboursement: ${request.description}`,
    status: TransactionStatus.COMPLETED,
    id: transactionData.id
  });

  return request;
};

export const rejectReimbursementRequest = async (requestId: string) => {
  const { data, error } = await supabase
    .from("reimbursement_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReimbursementRequest = async (requestId: string) => {
  // 1. Obtenir la liste des pièces jointes
  const { data: attachments, error: attachmentsError } = await supabase
    .from("reimbursement_attachments")
    .select("file_path")
    .eq("reimbursement_id", requestId);

  if (attachmentsError) throw attachmentsError;

  // 2. Supprimer les fichiers du stockage
  if (attachments && attachments.length > 0) {
    const filePaths = attachments.map(att => att.file_path);
    const { error: storageError } = await supabase.storage
      .from("reimbursements")
      .remove(filePaths);

    if (storageError) {
      console.error("Erreur lors de la suppression des fichiers:", storageError);
    }
  }

  // 3. Supprimer les entrées des pièces jointes
  const { error: attachmentDeleteError } = await supabase
    .from("reimbursement_attachments")
    .delete()
    .eq("reimbursement_id", requestId);

  if (attachmentDeleteError) throw attachmentDeleteError;

  // 4. Supprimer la demande de remboursement
  const { error: requestDeleteError } = await supabase
    .from("reimbursement_requests")
    .delete()
    .eq("id", requestId);

  if (requestDeleteError) throw requestDeleteError;

  return true;
};

export const searchReimbursementsByInvoice = async (search: string) => {
  const { data, error } = await supabase
    .from("reimbursement_requests")
    .select(`
      *,
      invoice:invoices (*)
    `)
    .or(`invoice.description.ilike.%${search}%,invoice.number.ilike.%${search}%`);

  if (error) throw error;
  return data;
};
