
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';

// Fonction pour générer un PDF pour une facture
export const generateInvoicePDF = async (invoice: Invoice): Promise<Blob> => {
  try {
    const doc = new jsPDF();
    
    // Configuration de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 20;
    
    // En-tête du document
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("FACTURE", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`N° ${invoice.number}`, pageWidth / 2, yPos, { align: "center" });
    
    yPos += 15;
    
    // Informations de l'entreprise
    doc.setFontSize(10);
    doc.text("ÉMETTEUR", margin, yPos);
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Votre Entreprise", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("123 Rue de la Facturation", margin, yPos);
    yPos += 5;
    doc.text("75000 Paris, France", margin, yPos);
    yPos += 5;
    doc.text("contact@votreentreprise.fr", margin, yPos);
    yPos += 5;
    doc.text("SIRET: 123 456 789 00012", margin, yPos);
    yPos += 5;
    doc.text("TVA Intracom: FR12345678900", margin, yPos);
    
    // Informations du client
    yPos = 60;
    doc.setFontSize(10);
    doc.text("DESTINATAIRE", pageWidth - margin - 80, yPos);
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Client", pageWidth - margin - 80, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Prénom Nom", pageWidth - margin - 80, yPos);
    yPos += 5;
    doc.text("Adresse du client", pageWidth - margin - 80, yPos);
    yPos += 5;
    doc.text("Code postal, Ville", pageWidth - margin - 80, yPos);
    
    // Informations sur la facture
    yPos = 90;
    doc.setFontSize(10);
    
    const dateFacture = invoice.created_at ? formatDate(new Date(invoice.created_at)) : "N/A";
    const dateEcheance = invoice.created_at 
      ? formatDate(new Date(new Date(invoice.created_at).setMonth(new Date(invoice.created_at).getMonth() + 1)))
      : "N/A";
    
    doc.text(`Date de facturation: ${dateFacture}`, margin, yPos);
    yPos += 5;
    doc.text(`Date d'échéance: ${dateEcheance}`, margin, yPos);
    yPos += 5;
    doc.text(`Statut: ${translateStatus(invoice.status)}`, margin, yPos);
    
    yPos += 15;
    
    // Description de la facture
    doc.setFontSize(11);
    doc.text(`Description: ${invoice.description || "N/A"}`, margin, yPos);
    
    yPos += 15;
    
    // Tableau des détails
    const tableHeaders = [["Description", "Montant HT", "TVA", "Montant TTC"]];
    const tableRows = [[
      invoice.description || "Services",
      `${(invoice.amount / 1.2).toFixed(2)} €`,
      "20%",
      `${invoice.amount.toFixed(2)} €`
    ]];
    
    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { halign: "center" },
      columnStyles: { 0: { halign: "left" } }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
    
    // Récapitulatif des montants
    doc.setFontSize(10);
    doc.text("Total HT:", pageWidth - margin - 60, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(`${(invoice.amount / 1.2).toFixed(2)} €`, pageWidth - margin, yPos, { align: "right" });
    
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.text("TVA (20%):", pageWidth - margin - 60, yPos);
    doc.text(`${(invoice.amount - invoice.amount / 1.2).toFixed(2)} €`, pageWidth - margin, yPos, { align: "right" });
    
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Total TTC:", pageWidth - margin - 60, yPos);
    doc.text(`${invoice.amount.toFixed(2)} €`, pageWidth - margin, yPos, { align: "right" });
    
    // Conditions de paiement
    yPos += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Conditions de paiement:", margin, yPos);
    yPos += 5;
    doc.text("Paiement à effectuer sous 30 jours à compter de la date de facturation.", margin, yPos);
    yPos += 5;
    doc.text("Virement bancaire sur le compte: FR76 1234 5678 9012 3456 7890 123 - BIC: CEPAFRPP123", margin, yPos);
    
    // Mentions légales
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.text("En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.", margin, yPos);
    yPos += 4;
    doc.text("Une indemnité forfaitaire de 40€ pour frais de recouvrement sera due en cas de retard (Article L.441-6 du Code de Commerce).", margin, yPos);
    yPos += 4;
    doc.text("Dispensé d'immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM).", margin, yPos);
    
    // Convertir le document en blob
    const pdfBlob = doc.output('blob');
    
    // Si la facture n'a pas encore d'URL PDF, on peut l'enregistrer sur Supabase Storage
    // et mettre à jour l'enregistrement de la facture
    if (!invoice.pdf_url) {
      try {
        const user = await supabase.auth.getUser();
        if (!user.data.user) throw new Error("Utilisateur non authentifié");
        
        const filename = `factures/${user.data.user.id}/${invoice.id}.pdf`;
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filename, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (error) {
          console.error("Erreur lors de l'upload du PDF:", error);
        } else {
          // Obtenir l'URL du fichier
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filename);
          
          // Mettre à jour l'enregistrement de la facture avec l'URL du PDF
          const { error: updateError } = await supabase
            .from('invoices')
            .update({ pdf_url: urlData.publicUrl })
            .eq('id', invoice.id);
          
          if (updateError) {
            console.error("Erreur lors de la mise à jour de la facture:", updateError);
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du PDF:", error);
      }
    }
    
    return pdfBlob;
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw error;
  }
};

// Fonction pour traduire les statuts en français
function translateStatus(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.DRAFT:
      return "Brouillon";
    case InvoiceStatus.PENDING:
      return "En attente";
    case InvoiceStatus.APPROVED:
      return "Approuvée";
    case InvoiceStatus.REJECTED:
      return "Rejetée";
    case InvoiceStatus.PAID:
      return "Payée";
    case InvoiceStatus.CANCELLED:
      return "Annulée";
    default:
      return "Inconnu";
  }
}
