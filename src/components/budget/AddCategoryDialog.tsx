
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BudgetCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (name: string, category: BudgetCategory) => void;
  existingCategories: string[];
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  open,
  onOpenChange,
  onAddCategory,
  existingCategories,
}) => {
  const { toast } = useToast();
  const [categoryName, setCategoryName] = React.useState("");
  const [allocated, setAllocated] = React.useState<number>(0);
  const [description, setDescription] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!categoryName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie est requis",
        variant: "destructive",
      });
      return;
    }

    if (existingCategories.includes(categoryName)) {
      toast({
        title: "Erreur",
        description: "Cette catégorie existe déjà",
        variant: "destructive",
      });
      return;
    }

    if (allocated <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant alloué doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    // Création de la catégorie
    const newCategory: BudgetCategory = {
      allocated,
      spent: 0,
      description,
      lastUpdated: new Date().toISOString(),
    };

    onAddCategory(categoryName, newCategory);
    
    // Réinitialisation des champs
    setCategoryName("");
    setAllocated(0);
    setDescription("");
    
    // Fermeture du dialogue
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie budgétaire avec un montant alloué.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="ex: Matériel informatique"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allocated" className="text-right">
                Montant
              </Label>
              <Input
                id="allocated"
                type="number"
                value={allocated}
                onChange={(e) => setAllocated(Number(e.target.value))}
                className="col-span-3"
                min={0}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Description optionnelle"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
