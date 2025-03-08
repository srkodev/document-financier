
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataCard from "@/components/ui-custom/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddCategoryDialog from "@/components/budget/AddCategoryDialog";
import BudgetAnalytics from "@/components/budget/BudgetAnalytics";
import BudgetHistory from "@/components/budget/BudgetHistory";
import CategoryManager from "@/components/categories/CategoryManager";
import { Budget, BudgetCategory } from "@/types";
import { fetchBudget, updateBudget, saveBudgetHistoryEntry } from "@/services/budgetService";
import { 
  Plus, 
  Download, 
  Save,
  FileText,
  Trash2,
  BarChart4,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const BudgetPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [generalBudget, setGeneralBudget] = useState<number>(0);
  const [editingGeneralBudget, setEditingGeneralBudget] = useState(false);
  
  // Récupération des données de budget
  const { 
    data: budget = { id: "default", totalAvailable: 50000, totalSpent: 0, categories: {} },
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['budget'],
    queryFn: fetchBudget,
  });

  useEffect(() => {
    if (budget) {
      setGeneralBudget(budget.totalAvailable);
    }
  }, [budget]);

  // Mutation pour la mise à jour du budget
  const updateBudgetMutation = useMutation({
    mutationFn: updateBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast({
        title: "Budget sauvegardé",
        description: "Les modifications du budget ont été enregistrées avec succès.",
      });
      setEditMode(false);
      setEditingGeneralBudget(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le budget",
        variant: "destructive",
      });
    }
  });

  // Mutation pour sauvegarder l'historique
  const saveHistoryMutation = useMutation({
    mutationFn: ({ description, details }: { description: string, details: string }) => 
      saveBudgetHistoryEntry(description, details),
    onError: (error: any) => {
      console.error("Erreur lors de l'enregistrement de l'historique:", error);
    }
  });

  // État local pour le budget éditable
  const [editableBudget, setEditableBudget] = useState<Budget>(budget);

  // Mettre à jour l'état local quand les données de budget changent
  useEffect(() => {
    if (budget) {
      setEditableBudget(budget);
    }
  }, [budget]);

  // Gestion des modifications de catégorie
  const handleCategoryChange = (category: string, field: 'allocated' | 'description', value: number | string) => {
    if (!editableBudget.categories) return;

    setEditableBudget(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories![category],
          [field]: value,
          lastUpdated: new Date().toISOString()
        }
      }
    }));
  };

  // Ajouter une nouvelle catégorie
  const handleAddCategory = (name: string, category: BudgetCategory) => {
    setEditableBudget(prev => {
      const newCategories = {
        ...prev.categories,
        [name]: category
      };
      
      // Recalculer le total disponible
      const totalAllocated = Object.values(newCategories).reduce((sum, cat) => sum + cat.allocated, 0);
      
      return {
        ...prev,
        categories: newCategories,
        totalAvailable: generalBudget
      };
    });
    
    saveHistoryMutation.mutate({
      description: "Ajout de catégorie",
      details: `Nouvelle catégorie "${name}" créée avec un budget de ${category.allocated.toLocaleString('fr-FR')} €`
    });
    
    toast({
      title: "Catégorie ajoutée",
      description: `La catégorie "${name}" a été ajoutée avec succès.`
    });
  };

  // Supprimer une catégorie
  const handleDeleteCategory = (categoryName: string) => {
    if (!editableBudget.categories || !editableBudget.categories[categoryName]) return;
    
    const categoryAllocated = editableBudget.categories[categoryName].allocated;
    const categorySpent = editableBudget.categories[categoryName].spent;
    
    setEditableBudget(prev => {
      const newCategories = { ...prev.categories };
      delete newCategories[categoryName];
      
      return {
        ...prev,
        categories: newCategories,
        totalSpent: prev.totalSpent - categorySpent
      };
    });
    
    saveHistoryMutation.mutate({
      description: "Suppression de catégorie",
      details: `Catégorie "${categoryName}" supprimée (budget: ${categoryAllocated.toLocaleString('fr-FR')} €)`
    });
    
    toast({
      title: "Catégorie supprimée",
      description: `La catégorie "${categoryName}" a été supprimée avec succès.`
    });
  };

  // Mettre à jour le budget général
  const updateGeneralBudget = () => {
    setEditableBudget(prev => ({
      ...prev,
      totalAvailable: generalBudget
    }));
    
    saveHistoryMutation.mutate({
      description: "Mise à jour du budget général",
      details: `Budget général mis à jour: ${generalBudget.toLocaleString('fr-FR')} €`
    });
    
    setEditingGeneralBudget(false);
  };
  
  // Sauvegarder les modifications du budget
  const handleSaveBudget = async () => {
    try {
      // Calculer le total dépensé
      const totalSpent = Object.values(editableBudget.categories || {}).reduce(
        (sum, cat) => sum + cat.spent, 0
      );
      
      const updatedBudget = {
        ...editableBudget,
        totalAvailable: generalBudget,
        totalSpent
      };
      
      await updateBudgetMutation.mutateAsync(updatedBudget);
      
      saveHistoryMutation.mutate({
        description: "Mise à jour du budget",
        details: `Budget mis à jour (Total: ${generalBudget.toLocaleString('fr-FR')} €)`
      });
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du budget:", error);
    }
  };

  // Exporter le budget
  const handleExportBudget = () => {
    if (!budget) return;
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `budget_export_${dateStr}.json`;
    
    const dataStr = JSON.stringify(budget, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export réussi",
      description: `Le budget a été exporté dans le fichier ${fileName}`
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <h1 className="text-xl font-bold text-destructive">Erreur lors du chargement du budget</h1>
          <p className="text-muted-foreground">{(error as Error).message}</p>
          <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['budget'] })}>
            Réessayer
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budget</h1>
            <p className="text-muted-foreground">Gestion et suivi du budget</p>
          </div>
          
          <div className="flex gap-3">
            {editMode ? (
              <Button onClick={handleSaveBudget} className="gap-2">
                <Save className="h-4 w-4" />
                <span>Enregistrer</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={() => setEditMode(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Modifier le budget</span>
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleExportBudget}>
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart4 className="mr-2 h-4 w-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="management">
              <FileText className="mr-2 h-4 w-4" />
              Gestion
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Settings className="mr-2 h-4 w-4" />
              Catégories
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <DataCard
                title="Budget total"
                description="Budget disponible pour l'année en cours"
                className="lg:col-span-1"
              >
                <div className="flex flex-col justify-center items-center py-4">
                  {editingGeneralBudget ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        type="number"
                        value={generalBudget}
                        onChange={(e) => setGeneralBudget(Number(e.target.value))}
                        className="w-40 text-right"
                      />
                      <Button onClick={updateGeneralBudget}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="text-4xl font-bold text-primary mb-2 cursor-pointer" 
                      onClick={() => setEditingGeneralBudget(true)}
                    >
                      {generalBudget.toLocaleString('fr-FR')} €
                    </div>
                  )}
                  
                  <div className="text-lg text-muted-foreground">
                    Restant: {(generalBudget - editableBudget.totalSpent).toLocaleString('fr-FR')} €
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(editableBudget.totalSpent / generalBudget) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {Math.round((editableBudget.totalSpent / generalBudget) * 100)}% utilisé
                  </div>
                </div>
              </DataCard>
              
              <DataCard 
                title="Analyses budgétaires" 
                description="Visualisation des données budgétaires"
                className="lg:col-span-2"
              >
                <BudgetAnalytics budget={editableBudget} className="px-4 py-6" />
              </DataCard>
            </div>
            
            <DataCard
              title="Historique des modifications du budget"
              description="Dernières modifications apportées au budget"
            >
              <BudgetHistory className="mt-4" />
            </DataCard>
          </TabsContent>
          
          <TabsContent value="management">
            <DataCard
              title={editMode ? "Modifier l'allocation" : "Allocation du budget"}
              description={editMode ? "Modifier le budget alloué à chaque catégorie" : "Budget alloué à chaque catégorie"}
            >
              <div className="flex justify-end mb-4">
                {editMode && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setIsAddCategoryOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter une catégorie</span>
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {Object.entries(editableBudget.categories || {}).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune catégorie budgétaire définie
                  </div>
                ) : (
                  Object.entries(editableBudget.categories || {}).map(([category, { allocated, spent, description }]) => (
                    <div key={category} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{category}</h3>
                          {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                          )}
                        </div>
                        
                        {editMode ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Montant alloué:</span>
                        {editMode ? (
                          <Input
                            type="number"
                            value={allocated}
                            onChange={(e) => handleCategoryChange(category, 'allocated', Number(e.target.value))}
                            className="w-32 text-right"
                          />
                        ) : (
                          <span>{allocated.toLocaleString('fr-FR')} €</span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Dépensé: {spent.toLocaleString('fr-FR')} €</span>
                        <span>Restant: {(allocated - spent).toLocaleString('fr-FR')} €</span>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(spent / allocated) * 100}%` }}
                        />
                      </div>
                      
                      {editMode && (
                        <div className="mt-2">
                          <Input
                            placeholder="Description (optionnelle)"
                            value={description || ''}
                            onChange={(e) => handleCategoryChange(category, 'description', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DataCard>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>
        </Tabs>
        
        <AddCategoryDialog
          open={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
          onAddCategory={handleAddCategory}
          existingCategories={Object.keys(editableBudget.categories || {})}
        />
      </div>
    </DashboardLayout>
  );
};

export default BudgetPage;
