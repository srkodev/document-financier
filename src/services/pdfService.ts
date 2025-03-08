
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice, InvoiceStatus } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type InvoiceItem = {
  name: string;
  description?: string;
  quantity: number;
  priceHT: number;
  vatRate: number;
};

export const generateInvoicePDF = (
  invoice: Invoice,
  items: InvoiceItem[],
  companyInfo: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone?: string;
    email?: string;
    website?: string;
    siret: string;
    vatNumber?: string;
    logoUrl?: string;
  },
  clientInfo: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    email?: string;
    vatNumber?: string;
  }
): string => {
  // Créer un nouveau document PDF avec orientation portrait, unité mm, format A4
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Définir les couleurs et styles
  const primaryColor = [41, 98, 255]; // RGB pour le bleu primary
  const textColor = [51, 51, 51]; // Gris foncé
  const secondaryColor = [243, 244, 246]; // Gris très clair pour les fonds

  // Dimensions et marges
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Ajouter un en-tête avec le logo si disponible
  if (companyInfo.logoUrl) {
    try {
      doc.addImage(companyInfo.logoUrl, "JPEG", margin, margin, 40, 20);
    } catch (error) {
      console.error("Error adding logo:", error);
    }
  }

  // En-tête - Informations de l'entreprise
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, pageWidth - margin, margin, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "normal");
  doc.text(companyInfo.address, pageWidth - margin, margin + 7, { align: "right" });
  doc.text(
    `${companyInfo.postalCode} ${companyInfo.city}`,
    pageWidth - margin,
    margin + 12,
    { align: "right" }
  );
  if (companyInfo.phone) {
    doc.text(`Tél: ${companyInfo.phone}`, pageWidth - margin, margin + 17, {
      align: "right",
    });
  }
  if (companyInfo.email) {
    doc.text(`Email: ${companyInfo.email}`, pageWidth - margin, margin + 22, {
      align: "right",
    });
  }
  doc.text(`SIRET: ${companyInfo.siret}`, pageWidth - margin, margin + 27, {
    align: "right",
  });
  if (companyInfo.vatNumber) {
    doc.text(`TVA: ${companyInfo.vatNumber}`, pageWidth - margin, margin + 32, {
      align: "right",
    });
  }

  // Titre du document
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", margin, margin + 40);

  // Numéro de facture et date
  doc.setFontSize(12);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Facture N° ${invoice.number}`, margin, margin + 50);
  doc.text(
    `Date: ${format(new Date(invoice.created_at), "dd MMMM yyyy", { locale: fr })}`,
    margin,
    margin + 56
  );
  
  // Statut de la facture
  let statusText = "En attente";
  if (invoice.status === InvoiceStatus.APPROVED) {
    statusText = "Approuvée";
  } else if (invoice.status === InvoiceStatus.REJECTED) {
    statusText = "Rejetée";
  } else if (invoice.status === InvoiceStatus.PROCESSING) {
    statusText = "En traitement";
  }
  
  doc.text(`Statut: ${statusText}`, margin, margin + 62);

  // Informations du client
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Informations client", margin, margin + 75);
  doc.setFont("helvetica", "normal");
  doc.text(clientInfo.name, margin, margin + 82);
  doc.text(clientInfo.address, margin, margin + 88);
  doc.text(`${clientInfo.postalCode} ${clientInfo.city}`, margin, margin + 94);
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, margin, margin + 100);
  }
  if (clientInfo.vatNumber) {
    doc.text(`TVA: ${clientInfo.vatNumber}`, margin, margin + 106);
  }

  // Tableau des articles
  const tableStartY = margin + 120;
  const tableData = items.map((item) => [
    item.name,
    item.description || "",
    item.quantity.toString(),
    `${item.priceHT.toFixed(2)} €`,
    `${item.vatRate}%`,
    `${(item.priceHT * item.quantity).toFixed(2)} €`,
    `${((item.priceHT * item.quantity * item.vatRate) / 100).toFixed(2)} €`,
    `${(item.priceHT * item.quantity * (1 + item.vatRate / 100)).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [
      [
        "Article",
        "Description",
        "Qté",
        "Prix HT",
        "TVA",
        "Total HT",
        "Montant TVA",
        "Total TTC",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 10 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
  });

  // Récupérer la position finale du tableau
  const finalY = (doc as any).lastAutoTable.finalY;

  // Calculer les totaux
  const totalHT = items.reduce(
    (sum, item) => sum + item.priceHT * item.quantity,
    0
  );
  const totalTVA = items.reduce(
    (sum, item) =>
      sum + (item.priceHT * item.quantity * item.vatRate) / 100,
    0
  );
  const totalTTC = totalHT + totalTVA;

  // Afficher les totaux
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total HT:", pageWidth - margin - 60, finalY + 15, {
    align: "right",
  });
  doc.text("Total TVA:", pageWidth - margin - 60, finalY + 22, {
    align: "right",
  });
  doc.text("Total TTC:", pageWidth - margin - 60, finalY + 29, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.text(`${totalHT.toFixed(2)} €`, pageWidth - margin, finalY + 15, {
    align: "right",
  });
  doc.text(`${totalTVA.toFixed(2)} €`, pageWidth - margin, finalY + 22, {
    align: "right",
  });
  doc.setFont("helvetica", "bold");
  doc.text(`${totalTTC.toFixed(2)} €`, pageWidth - margin, finalY + 29, {
    align: "right",
  });

  // Mentions légales obligatoires en France
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const legalText = [
    "En cas de retard de paiement, indemnité forfaitaire pour frais de recouvrement : 40 euros (art. L.441-6 du Code de Commerce).",
    "Pas d'escompte pour paiement anticipé. Pénalités de retard: trois fois le taux d'intérêt légal.",
    `TVA acquittée sur les encaissements. RCS ${companyInfo.city} - SIRET: ${companyInfo.siret} ${
      companyInfo.vatNumber ? `- N° TVA Intracom: ${companyInfo.vatNumber}` : ""
    }`,
  ].join("\n");
  doc.text(legalText, pageWidth / 2, pageHeight - margin - 10, {
    align: "center",
    maxWidth: pageWidth - 2 * margin,
  });

  // Convertir en base64
  return doc.output("datauristring");
};
