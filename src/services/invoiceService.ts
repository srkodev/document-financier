import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceStatus } from "@/types";
import { generateInvoicePDF } from "@/services/pdfService";

export const fetchInvoices = async (
  status?: InvoiceStatus | "all",
  search?: string,
  category?: string,
) => {
  let query = supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(`description.ilike.%${search}%,number.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Invoice[];
};

export const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

export const deleteInvoice = async (id: string) => {
  try {
    // Get invoice data
    const { data: invoice, error: getError } = await supabase
      .from("invoices")
      .select("pdf_url")
      .eq("id", id)
      .single();
      
    if (getError) {
      console.error("Error getting invoice:", getError);
      throw new Error(getError.message);
    }
    
    // Delete PDF if exists
    if (invoice?.pdf_url) {
      try {
        const url = new URL(invoice.pdf_url);
        const pathSegments = url.pathname.split('/');
        if (pathSegments.length >= 2) {
          const filePath = pathSegments[pathSegments.length - 1];
          
          const { error: deleteFileError } = await supabase.storage
            .from('invoices')
            .remove([filePath]);
            
          if (deleteFileError) {
            console.error("Error deleting file:", deleteFileError);
            // Continue with invoice deletion even if file deletion fails
          }
        }
      } catch (fileError) {
        console.error("Error processing file URL:", fileError);
        // Continue with invoice deletion even if there's an issue with the file URL
      }
    }
    
    // Update any related records before deletion
    
    // 1. Update transactions to remove invoice_id reference
    const { error: transactionError } = await supabase
      .from("transactions")
      .update({ invoice_id: null })
      .eq("invoice_id", id);
      
    if (transactionError) {
      console.error("Error updating transactions:", transactionError);
      // Continue anyway to try to delete the invoice
    }
    
    // 2. Update reimbursement requests to remove invoice_id reference
    const { error: reimbError } = await supabase
      .from("reimbursement_requests")
      .update({ invoice_id: null })
      .eq("invoice_id", id);
      
    if (reimbError) {
      console.error("Error updating reimbursements:", reimbError);
      // Continue anyway to try to delete the invoice
    }
    
    // Finally delete the invoice
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting invoice:", error);
      throw new Error(error.message);
    }

    return true;
  } catch (error: any) {
    console.error("Error in deleteInvoice:", error);
    throw error;
  }
};

export const exportInvoicesToCSV = (invoices: Invoice[]) => {
  if (!invoices.length) return null;

  const headers = ["Numéro", "Description", "Montant", "Catégorie", "Statut", "Date"];
  const csvRows = [
    headers.join(","),
    ...invoices.map(invoice => {
      const date = new Date(invoice.created_at);
      const formattedDate = date.toLocaleDateString('fr-FR');
      return [
        invoice.number,
        `"${invoice.description.replace(/"/g, '""')}"`,
        invoice.amount,
        invoice.category || '',
        invoice.status,
        formattedDate
      ].join(",");
    })
  ];

  const csvContent = csvRows.join('\n');
  return csvContent;
};

export const saveInvoicePDF = async (invoice: Invoice, pdfBlob: Blob): Promise<string> => {
  const fileExt = "pdf";
  const filePath = `${invoice.user_id}/${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(filePath, pdfBlob);
    
  if (uploadError) {
    throw new Error("Erreur lors de l'upload du fichier PDF");
  }
  
  const { data: urlData } = supabase.storage
    .from('invoices')
    .getPublicUrl(filePath);
    
  return urlData.publicUrl;
};

export const createInvoiceWithPDF = async (invoiceData: Partial<Invoice>, items: any[]): Promise<Invoice> => {
  try {
    // Générer le PDF de la facture
    const pdfBlob = await generateInvoicePDF({
      id: '',
      user_id: invoiceData.user_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      number: invoiceData.number || '',
      description: invoiceData.description || '',
      amount: invoiceData.amount || 0,
      status: invoiceData.status || InvoiceStatus.PENDING,
      category: invoiceData.category || '',
    });
    
    // Sauvegarder le PDF dans Supabase Storage
    const pdfUrl = await saveInvoicePDF({
      id: '',
      user_id: invoiceData.user_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      number: invoiceData.number || '',
      description: invoiceData.description || '',
      amount: invoiceData.amount || 0,
      status: invoiceData.status || InvoiceStatus.PENDING,
      category: invoiceData.category || '',
    }, pdfBlob);
    
    // Créer la facture dans la base de données avec l'URL du PDF
    const completeInvoiceData = {
      ...invoiceData,
      pdf_url: pdfUrl,
      number: invoiceData.number || '',
      description: invoiceData.description || '',
      amount: invoiceData.amount || 0,
      status: invoiceData.status || InvoiceStatus.PENDING,
      user_id: invoiceData.user_id || '',
    };
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(completeInvoiceData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Invoice;
  } catch (error: any) {
    console.error("Erreur lors de la création de la facture avec PDF:", error);
    throw error;
  }
};
