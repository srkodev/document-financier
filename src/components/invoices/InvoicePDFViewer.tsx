
import React, { useState, useEffect } from 'react';
import { Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { generateInvoicePDF } from '@/services/pdfService';
import { useToast } from '@/hooks/use-toast';

interface InvoicePDFViewerProps {
  invoice: Invoice;
}

const InvoicePDFViewer: React.FC<InvoicePDFViewerProps> = ({ invoice }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(invoice.pdf_url);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPdfUrl(invoice.pdf_url);
  }, [invoice]);

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      const pdfBlob = await generateInvoicePDF(invoice);
      
      // Créer une URL pour le blob
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      toast({
        title: "PDF généré avec succès",
        description: "Vous pouvez maintenant prévisualiser ou télécharger le PDF.",
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast({
        title: "Erreur de génération du PDF",
        description: "Une erreur est survenue lors de la génération du PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUrl) return;
    
    // Créer un lien pour télécharger le PDF
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `facture-${invoice.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewPDF = () => {
    if (!pdfUrl) return;
    
    // Ouvrir le PDF dans un nouvel onglet
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-medium">Document PDF</span>
      </div>
      
      {pdfUrl ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewPDF}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Prévisualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          size="sm"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          {isGenerating ? "Génération en cours..." : "Générer un PDF"}
        </Button>
      )}
    </div>
  );
};

export default InvoicePDFViewer;
