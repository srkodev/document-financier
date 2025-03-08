
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Invoice } from "@/types";
import { FileText, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateInvoicePDF } from "@/services/pdfService";

interface InvoicePDFViewerProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoicePDFViewer: React.FC<InvoicePDFViewerProps> = ({ invoice, open, onOpenChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Informations de l'entreprise (à personnaliser)
      const companyInfo = {
        name: "Ma Société",
        address: "123 Rue de l'Exemple",
        city: "Paris",
        postalCode: "75001",
        country: "France",
        email: "contact@masociete.fr",
        phone: "01 23 45 67 89",
        siret: "123 456 789 00012",
        tva: "FR 123456789"
      };
      
      // Générer le PDF
      const pdfBlob = await generateInvoicePDF(invoice.id, user.id, companyInfo);
      
      // Créer une URL pour le blob
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      toast({
        title: "PDF généré",
        description: "Le PDF a été généré avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la génération du PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    // Créer un lien temporaire pour le téléchargement
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Facture_${invoice.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] sm:h-[80vh]">
        <DialogHeader>
          <DialogTitle>Facture {invoice.number}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {!pdfUrl ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Générez un PDF de cette facture conforme aux normes françaises.
              </p>
              <Button onClick={handleGeneratePDF} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  "Générer le PDF"
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
              <iframe
                src={pdfUrl}
                className="w-full flex-1 border rounded-md"
                title={`Facture ${invoice.number}`}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePDFViewer;
