
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataCard from "@/components/ui-custom/DataCard";
import StatusBadge from "@/components/ui-custom/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InvoiceStatus } from "@/types";

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data (in a real app, this would come from an API)
  const mockInvoices = [
    {
      id: "INV001",
      userId: "user1",
      amount: 2500,
      status: InvoiceStatus.APPROVED,
      createdAt: new Date(2023, 6, 15),
      pdfUrl: "#",
      description: "Achat matériel informatique",
      category: "Matériel"
    },
    {
      id: "INV002",
      userId: "user2",
      amount: 750,
      status: InvoiceStatus.PENDING,
      createdAt: new Date(2023, 6, 14),
      pdfUrl: "#",
      description: "Frais de déplacement",
      category: "Voyage"
    },
    {
      id: "INV003",
      userId: "user1",
      amount: 1200,
      status: InvoiceStatus.PROCESSING,
      createdAt: new Date(2023, 6, 12),
      pdfUrl: "#",
      description: "Remboursement client",
      category: "Remboursement"
    },
    {
      id: "INV004",
      userId: "user3",
      amount: 320,
      status: InvoiceStatus.REJECTED,
      createdAt: new Date(2023, 6, 10),
      pdfUrl: "#",
      description: "Fournitures de bureau",
      category: "Fournitures"
    },
    {
      id: "INV005",
      userId: "user2",
      amount: 890,
      status: InvoiceStatus.APPROVED,
      createdAt: new Date(2023, 6, 8),
      pdfUrl: "#",
      description: "Équipement de présentation",
      category: "Matériel"
    }
  ];
  
  // Filter invoices based on search term
  const filteredInvoices = mockInvoices.filter(invoice => 
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Factures</h1>
            <p className="text-muted-foreground">Gérer et suivre toutes les factures</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Nouvelle facture</span>
            </Button>
          </div>
        </div>
        
        <DataCard title="Liste des factures">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="approved">Approuvées</TabsTrigger>
              <TabsTrigger value="rejected">Refusées</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
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
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted-foreground">
                          Aucune facture trouvée
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              {invoice.id}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p>{invoice.description}</p>
                              <p className="text-xs text-muted-foreground">{invoice.category}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {invoice.amount.toLocaleString('fr-FR')} €
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(invoice.createdAt, 'dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <StatusBadge status={invoice.status} />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" title="Voir">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Télécharger">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              {/* Similar table structure for pending invoices */}
              <p className="py-4 text-center text-muted-foreground">Filtrage par status en attente d'implémentation.</p>
            </TabsContent>
            
            <TabsContent value="approved" className="mt-0">
              {/* Similar table structure for approved invoices */}
              <p className="py-4 text-center text-muted-foreground">Filtrage par status en attente d'implémentation.</p>
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-0">
              {/* Similar table structure for rejected invoices */}
              <p className="py-4 text-center text-muted-foreground">Filtrage par status en attente d'implémentation.</p>
            </TabsContent>
          </Tabs>
        </DataCard>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
