
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DataCard from "@/components/ui-custom/DataCard";
import { Budget, BudgetCategory } from '@/types';
import { fetchBudget, updateBudget, saveBudgetHistoryEntry } from '@/services/budgetService';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddCategoryDialog from './AddCategoryDialog';
import { fetchCategories } from '@/services/categoryService';

const BudgetManagement = () => {
  const [budget, setBudget] = useState<Budget>({
    id: "",
    totalAvailable: 0,
    totalSpent: 0,
    categories: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState("0");
  const [categoryAllocation, setCategoryAllocation] = useState<Record<string, string>>({});
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Load budget data
  useEffect(() => {
    loadBudget();
    loadCategories();
  }, []);

  const loadBudget = async () => {
    setLoading(true);
    try {
      const budgetData = await fetchBudget();
      setBudget(budgetData);
      setTotalAvailable(budgetData.totalAvailable.toString());
      
      // Initialize category allocation with current values
      const allocations: Record<string, string> = {};
      if (budgetData.categories) {
        Object.entries(budgetData.categories).forEach(([key, category]) => {
          allocations[key] = category.allocated.toString();
        });
      }
      setCategoryAllocation(allocations);
    } catch (error) {
      console.error("Error loading budget:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categories = await fetchCategories();
      setAvailableCategories(categories.map(c => c.name));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update budget categories with new allocations
      const updatedCategories: Record<string, BudgetCategory> = { ...budget.categories };
      
      Object.entries(categoryAllocation).forEach(([key, value]) => {
        const allocated = parseFloat(value) || 0;
        
        if (updatedCategories[key]) {
          updatedCategories[key] = {
            ...updatedCategories[key],
            allocated,
            lastUpdated: new Date().toISOString()
          };
        } else {
          updatedCategories[key] = {
            allocated,
            spent: 0,
            lastUpdated: new Date().toISOString()
          };
        }
      });
      
      // Create updated budget object
      const updatedBudget: Budget = {
        ...budget,
        totalAvailable: parseFloat(totalAvailable) || 0,
        categories: updatedCategories
      };
      
      // Save to database
      await updateBudget(updatedBudget);
      
      // Record in history
      await saveBudgetHistoryEntry(
        "Mise à jour du budget",
        `Budget total mis à jour à ${parseFloat(totalAvailable)} €`
      );
      
      toast({
        title: "Budget mis à jour",
        description: "Le budget a été mis à jour avec succès",
      });
      
      // Reload data
      loadBudget();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le budget",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = (categoryName: string) => {
    if (!categoryName) return;
    
    // Add category to allocation if it doesn't exist
    if (!categoryAllocation[categoryName]) {
      setCategoryAllocation({
        ...categoryAllocation,
        [categoryName]: "0"
      });
    }
    
    setAddCategoryDialogOpen(false);
  };

  const getUnallocatedCategories = () => {
    return availableCategories.filter(
      category => !Object.keys(categoryAllocation).includes(category)
    );
  };

  // Calculate total allocated
  const totalAllocated = Object.values(categoryAllocation)
    .reduce((sum, value) => sum + (parseFloat(value) || 0), 0);

  if (loading) {
    return (
      <DataCard title="Gestion du budget">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DataCard>
    );
  }

  return (
    <DataCard
      title="Gestion du budget"
      description="Configurez le budget total et répartissez-le entre les catégories"
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalBudget">Budget total disponible (€)</Label>
            <Input
              id="totalBudget"
              type="number"
              value={totalAvailable}
              onChange={(e) => setTotalAvailable(e.target.value)}
              placeholder="0.00"
              step="100"
            />
            <p className="text-sm text-muted-foreground">
              Définissez le montant total du budget disponible
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Montant total dépensé</Label>
            <div className="p-2 border rounded bg-muted/30">
              <p className="font-semibold">{budget.totalSpent.toLocaleString('fr-FR')} €</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Ce montant représente les dépenses totales à ce jour
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Solde restant</Label>
            <div className="p-2 border rounded bg-muted/30">
              <p className={`font-semibold ${
                parseFloat(totalAvailable) - budget.totalSpent > 0 
                  ? "text-status-approved" 
                  : "text-status-rejected"
              }`}>
                {(parseFloat(totalAvailable) - budget.totalSpent).toLocaleString('fr-FR')} €
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={loadBudget} disabled={saving}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Enregistrement...
                </span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Répartition du budget par catégorie</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAddCategoryDialogOpen(true)}
              disabled={getUnallocatedCategories().length === 0}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une catégorie
            </Button>
          </div>
          
          <Separator />
          
          {Object.keys(categoryAllocation).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune catégorie définie</p>
              <p className="text-sm">
                Ajoutez des catégories pour répartir votre budget
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryAllocation).map(([category, allocation]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={`category-${category}`}>{category}</Label>
                    <span className="text-sm text-muted-foreground">
                      Dépensé: {(budget.categories?.[category]?.spent || 0).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <Input
                    id={`category-${category}`}
                    type="number"
                    value={allocation}
                    onChange={(e) => setCategoryAllocation({
                      ...categoryAllocation,
                      [category]: e.target.value
                    })}
                    placeholder="0.00"
                    step="100"
                  />
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (budget.categories?.[category]?.spent || 0) > parseFloat(allocation)
                          ? "bg-status-rejected"
                          : "bg-primary"
                      }`}
                      style={{ 
                        width: `${Math.min(
                          ((budget.categories?.[category]?.spent || 0) / (parseFloat(allocation) || 1)) * 100,
                          100
                        )}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="font-medium">Total alloué:</p>
                  <p className={`text-sm ${
                    totalAllocated > parseFloat(totalAvailable)
                      ? "text-status-rejected"
                      : "text-muted-foreground"
                  }`}>
                    {totalAllocated > parseFloat(totalAvailable)
                      ? "Dépassement du budget total!"
                      : `${(parseFloat(totalAvailable) - totalAllocated).toLocaleString('fr-FR')} € non alloués`
                    }
                  </p>
                </div>
                <p className="font-semibold text-lg">
                  {totalAllocated.toLocaleString('fr-FR')} €
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={loadBudget} disabled={saving}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  variant={totalAllocated > parseFloat(totalAvailable) ? "destructive" : "default"}
                >
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Enregistrement...
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AddCategoryDialog
        open={addCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onSelect={handleAddCategory}
        categories={getUnallocatedCategories()}
      />
    </DataCard>
  );
};

export default BudgetManagement;
