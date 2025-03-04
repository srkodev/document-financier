
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DataCard from "@/components/ui-custom/DataCard";
import StatusBadge from "@/components/ui-custom/StatusBadge";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FilterX,
  FileDown
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InvoiceStatus, Invoice } from "@/types";
import { fetchInvoices, updateInvoiceStatus, deleteInvoice, exportInvoicesToCSV } from "@/services/invoiceService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const InvoicesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  const { isRespPole, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const categories = ["Matériel", "Fournitures", "Événement", "Transport", "Remboursement", "Autre"];
  const statusTab = searchParams.get("status") || "all";

  useEffect(() => {
    loadInvoices();
  }, [statusTab, selectedCategory, searchTerm]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const status = statusTab !== "all" ? statusTab as InvoiceStatus : undefined;
      const data = await fetchInvoices(status, searchTerm, selectedCategory !== "all" ? selectedCategory : undefined);
      setInvoices(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les factures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ status: value });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleApprove = async (id: string) => {
    try {
      await updateInvoiceStatus(id, InvoiceStatus.APPROVED);
      toast({
        title: "Facture approuvée",
        description: "La facture a été approuvée avec succès.",
      });
      loadInvoices();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'approuver la facture",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateInvoiceStatus(id, InvoiceStatus.REJECTED);
      toast({
        title: "Facture refusée",
        description: "La facture a été refusée.",
      });
      loadInvoices();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de refuser la facture",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoiceId) return;

    try {
      await deleteInvoice(selectedInvoiceId);
      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
      setDeleteDialogOpen(false);
      loadInvoices();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la facture",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  };

  const handleExport = () => {
    const csvContent = exportInvoicesToCSV(invoices);
    if (!csvContent) {
      toast({
        title: "Export impossible",
        description: "Aucune facture à exporter.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `factures_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSearchParams({ status: "all" });
  };
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Factures</h1>
              <p className="text-muted-foreground">Gérer et suivre toutes les factures</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" />
                <span>Nouvelle facture</span>
              </Button>
            </div>
          </div>
          
          <DataCard title="Liste des factures">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <Tabs defaultValue={statusTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value={InvoiceStatus.PENDING}>En attente</TabsTrigger>
                  <TabsTrigger value={InvoiceStatus.APPROVED}>Approuvées</TabsTrigger>
                  <TabsTrigger value={InvoiceStatus.REJECTED}>Refusées</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Réinitialiser les filtres" onClick={resetFilters}>
                    <FilterX className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" size="icon" title="Exporter en CSV" onClick={handleExport}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Numéro</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Montant</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted-foreground">
                        Aucune facture trouvée
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {invoice.number}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="line-clamp-1">{invoice.description}</p>
                            <p className="text-xs text-muted-foreground">{invoice.category}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {parseFloat(invoice.amount.toString()).toLocaleString('fr-FR')} €
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            {invoice.pdf_url && (
                              <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" title="Voir">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            
                            {isAdmin && (
                              <Button variant="ghost" size="icon" title="Supprimer" onClick={() => confirmDelete(invoice.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            
                            {isRespPole && invoice.status === InvoiceStatus.PENDING && (
                              <>
                                <Button variant="ghost" size="icon" title="Approuver" onClick={() => handleApprove(invoice.id)}>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Refuser" onClick={() => handleReject(invoice.id)}>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </DataCard>
        </div>
        
        <InvoiceForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          onSuccess={loadInvoices}
        />
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cette facture sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default InvoicesPage;
