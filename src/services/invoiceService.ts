
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceStatus } from "@/types";

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
