
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Save, AlertTriangle } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { fetchCategories } from "@/services/categoryService";
import { fetchBudget, updateBudget, saveBudgetHistoryEntry } from "@/services/budgetService";
import { useToast } from "@/hooks/use-toast";
import { Category, Budget, BudgetCategory } from "@/types";

const formSchema = z.object({
  totalBudget: z.coerce.number().min(0, "Le budget total doit être positif"),
  categories: z.record(z.object({
    allocated: z.coerce.number().min(0, "Le budget alloué doit être positif"),
    description: z.string().optional(),
  })),
});

type FormValues = z.infer<typeof formSchema>;

const BudgetManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalBudget: 0,
      categories: {},
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [categoriesData, budgetData] = await Promise.all([
          fetchCategories(),
          fetchBudget(),
        ]);
        
        setCategories(categoriesData);
        setBudget(budgetData);
        
        // Set form values based on fetched budget
        form.setValue("totalBudget", budgetData.total_available);
        
        // Create categories form values
        const categoriesFormValues: Record<string, { allocated: number, description: string }> = {};
        categoriesData.forEach(category => {
          const budgetCategory = budgetData.categories[category.name] || { allocated: 0, spent: 0, description: '' };
          categoriesFormValues[category.name] = {
            allocated: budgetCategory.allocated,
            description: budgetCategory.description || '',
          };
        });
        
        form.setValue("categories", categoriesFormValues);
      } catch (error) {
        console.error("Error loading budget data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du budget",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Prepare budget data
      const updatedBudget: Budget = {
        ...(budget || { id: '', total_spent: 0, categories: {} }),
        total_available: values.totalBudget,
        categories: {},
      };
      
      // Prepare updated categories
      Object.entries(values.categories).forEach(([categoryName, value]) => {
        const existingCategory = budget?.categories[categoryName] || { spent: 0 };
        updatedBudget.categories[categoryName] = {
          allocated: value.allocated,
          spent: existingCategory.spent,
          description: value.description,
          lastUpdated: new Date().toISOString(),
        };
      });
      
      // Save budget
      await updateBudget(updatedBudget);
      await saveBudgetHistoryEntry("Mise à jour du budget", `Budget total mis à jour: ${values.totalBudget}€`);
      
      toast({
        title: "Succès",
        description: "Budget mis à jour avec succès",
      });
      
      // Refresh data
      const updatedBudgetData = await fetchBudget();
      setBudget(updatedBudgetData);
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le budget",
        variant: "destructive",
      });
    }
  };

  const calculateTotalAllocated = () => {
    const values = form.getValues();
    return Object.values(values.categories).reduce((sum, cat) => sum + cat.allocated, 0);
  };

  const calculateUsage = (categoryName: string) => {
    if (!budget?.categories[categoryName]) return 0;
    const { allocated, spent } = budget.categories[categoryName];
    if (allocated === 0) return 0;
    return Math.min(100, Math.round((spent / allocated) * 100));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion du Budget</CardTitle>
          <CardDescription>Gérez votre budget par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAllocated = calculateTotalAllocated();
  const totalBudget = form.watch("totalBudget");
  const isOverAllocated = totalAllocated > totalBudget;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion du Budget</CardTitle>
        <CardDescription>Gérez votre budget par catégorie</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="totalBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget total</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input {...field} type="number" min="0" />
                      <span className="ml-2 flex items-center">€</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Définissez le budget global disponible
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-secondary/30 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span>Budget alloué par catégories:</span>
                <span className={`font-bold ${isOverAllocated ? 'text-destructive' : ''}`}>
                  {totalAllocated} € / {totalBudget} €
                </span>
              </div>
              <Progress value={(totalAllocated / Math.max(totalBudget, 1)) * 100} 
                className={isOverAllocated ? "bg-destructive/50" : ""}
              />
              {isOverAllocated && (
                <div className="flex items-center mt-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>Attention: Le budget alloué dépasse le budget total disponible!</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Allocation par catégorie</h3>
              
              {categories.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Aucune catégorie trouvée</p>
                  <Button className="mt-4" variant="outline" type="button">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter une catégorie
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {categories.map((category) => (
                    <div key={category.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{category.name}</h4>
                      {budget?.categories[category.name] && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Utilisé: {budget.categories[category.name].spent || 0} €</span>
                            <span>
                              {calculateUsage(category.name)}% du budget alloué
                            </span>
                          </div>
                          <Progress value={calculateUsage(category.name)} />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-1">
                          <FormField
                            control={form.control}
                            name={`categories.${category.name}.allocated`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget alloué</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Input {...field} type="number" min="0" />
                                    <span className="ml-2 flex items-center">€</span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <FormField
                            control={form.control}
                            name={`categories.${category.name}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (optionnelle)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Enregistrer le budget
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BudgetManagement;
