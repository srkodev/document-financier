
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCategories } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@/types";

const BudgetManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion du Budget</CardTitle>
        <CardDescription>Gérez votre budget par catégorie</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune catégorie trouvée</p>
            <Button className="mt-4" variant="outline">
              Ajouter une catégorie
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Budget management UI will go here */}
            <p>Fonctionnalité en cours de développement</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetManagement;
