
import { supabase } from "@/integrations/supabase/client";
import { TransactionStatus } from "@/types";
import { updateBudgetAfterTransaction } from "@/services/budgetService";

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
