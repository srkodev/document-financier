
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
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
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
      invoiceNumber: invoiceData.number || '',
      date: new Date().toISOString(),
      description: invoiceData.description || '',
      amount: invoiceData.amount || 0,
      category: invoiceData.category || '',
      status: invoiceData.status || InvoiceStatus.PENDING,
      items: items
    });
    
    // Sauvegarder le PDF dans Supabase Storage
    const pdfUrl = await saveInvoicePDF({
      ...invoiceData,
      id: '',
      user_id: invoiceData.user_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      number: invoiceData.number || '',
      description: invoiceData.description || '',
      amount: invoiceData.amount || 0,
      status: invoiceData.status || InvoiceStatus.PENDING
    }, pdfBlob);
    
    // Créer la facture dans la base de données avec l'URL du PDF
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        pdf_url: pdfUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Invoice;
  } catch (error: any) {
    console.error("Erreur lors de la création de la facture avec PDF:", error);
    throw error;
  }
};
