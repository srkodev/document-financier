
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Article, Invoice, Profile } from "@/types";

// Ajouter la déclaration du module pour TypeScript
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  priceHT: number;
  vatRate: number;
}

interface InvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  seller: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
    siret?: string;
    tva?: string;
  };
  buyer: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    email?: string;
  };
}

/**
 * Génère un PDF de facture conforme aux normes françaises
 */
export const generateInvoicePDF = async (
  invoiceId: string, 
  userId: string,
  companyInfo: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
    siret?: string;
    tva?: string;
  }
): Promise<Blob> => {
  // Récupérer les données de la facture
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error("Facture introuvable");
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profil utilisateur introuvable");
  }

  // Pour l'exemple, on va simuler des articles
  // Dans un cas réel, il faudrait récupérer les articles associés à la facture
  const items: InvoiceItem[] = [
    {
      name: "Article 1",
      description: "Description de l'article 1",
      quantity: 2,
      priceHT: 100,
      vatRate: 20
    },
    {
      name: "Article 2",
      description: "Description de l'article 2",
      quantity: 1,
      priceHT: 50,
      vatRate: 5.5
    }
  ];

  // Préparer les données pour le PDF
  const invoiceData: InvoiceData = {
    invoice: {
      id: invoice.id,
      number: invoice.number,
      user_id: invoice.user_id,
      amount: invoice.amount,
      status: invoice.status,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      pdf_url: invoice.pdf_url,
      description: invoice.description,
      category: invoice.category
    },
    items,
    seller: companyInfo,
    buyer: {
      name: profile.name || "Client",
      email: profile.email
    }
  };

  // Générer le PDF
  return createInvoicePDF(invoiceData);
};

/**
 * Crée un PDF de facture à partir des données fournies
 */
const createInvoicePDF = (data: InvoiceData): Blob => {
  // Créer un nouveau document PDF
  const doc = new jsPDF();
  
  // Configurer les polices et les couleurs
  const primaryColor = [41, 98, 255]; // Bleu primaire en RGB
  
  // Ajouter l'en-tête
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("FACTURE", 20, 20);
  
  // Ajouter les informations de base
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Facture N° : ${data.invoice.number}`, 20, 30);
  doc.text(`Date : ${new Date(data.invoice.created_at).toLocaleDateString("fr-FR")}`, 20, 35);
  
  // Informations du vendeur
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Vendeur :", 20, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.seller.name, 20, 50);
  doc.text(data.seller.address, 20, 55);
  doc.text(`${data.seller.postalCode} ${data.seller.city}`, 20, 60);
  doc.text(data.seller.country, 20, 65);
  doc.text(`Email : ${data.seller.email}`, 20, 70);
  if (data.seller.phone) doc.text(`Tél : ${data.seller.phone}`, 20, 75);
  if (data.seller.siret) doc.text(`SIRET : ${data.seller.siret}`, 20, 80);
  if (data.seller.tva) doc.text(`N° TVA : ${data.seller.tva}`, 20, 85);
  
  // Informations du client
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Client :", 120, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.buyer.name || "Client", 120, 50);
  if (data.buyer.address) doc.text(data.buyer.address, 120, 55);
  if (data.buyer.postalCode && data.buyer.city) doc.text(`${data.buyer.postalCode} ${data.buyer.city}`, 120, 60);
  if (data.buyer.country) doc.text(data.buyer.country, 120, 65);
  if (data.buyer.email) doc.text(`Email : ${data.buyer.email}`, 120, 70);
  
  // Description de la facture
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Description :", 20, 100);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.invoice.description, 20, 105, { maxWidth: 170 });
  
  // Tableau des articles
  const tableHeaders = [
    ["Article", "Description", "Quantité", "Prix HT", "TVA", "Total HT", "Total TTC"]
  ];
  
  const tableData = data.items.map(item => [
    item.name,
    item.description || "",
    item.quantity.toString(),
    `${item.priceHT.toFixed(2)} €`,
    `${item.vatRate.toFixed(2)} %`,
    `${(item.quantity * item.priceHT).toFixed(2)} €`,
    `${(item.quantity * item.priceHT * (1 + item.vatRate / 100)).toFixed(2)} €`
  ]);
  
  // Calculer les totaux
  const totalHT = data.items.reduce((sum, item) => sum + (item.quantity * item.priceHT), 0);
  const totalTVA = data.items.reduce((sum, item) => sum + (item.quantity * item.priceHT * (item.vatRate / 100)), 0);
  const totalTTC = totalHT + totalTVA;
  
  // Ajouter le tableau
  doc.autoTable({
    head: tableHeaders,
    body: tableData,
    startY: 120,
    theme: "grid",
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 15, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
    }
  });
  
  // Récupérer la position Y après le tableau
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Ajouter le résumé des totaux
  doc.setFontSize(10);
  doc.text("Total HT :", 130, finalY);
  doc.text(`${totalHT.toFixed(2)} €`, 170, finalY, { align: "right" });
  
  doc.text("Total TVA :", 130, finalY + 5);
  doc.text(`${totalTVA.toFixed(2)} €`, 170, finalY + 5, { align: "right" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total TTC :", 130, finalY + 12);
  doc.text(`${totalTTC.toFixed(2)} €`, 170, finalY + 12, { align: "right" });
  
  // Ajouter les mentions légales
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  const legalText = "En vertu de l'article L441-6 du Code de commerce, des pénalités de retard au taux annuel de 12% et une indemnité de 40€ sont dues à défaut de paiement le jour suivant la date d'échéance.";
  
  doc.text(legalText, 20, 250, { maxWidth: 170 });
  
  // Retourner le PDF sous forme de Blob
  return doc.output("blob");
};

export default {
  generateInvoicePDF
};
