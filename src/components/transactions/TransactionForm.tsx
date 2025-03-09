
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { createTransaction, getTransactionById, updateTransaction } from "@/services/transactionService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBudgetAfterTransaction } from "@/services/budgetService";

const formSchema = z.object({
  amount: z.coerce.number().min(0, "Le montant doit être positif"),
  description: z.string().nonempty("La description est requise"),
  category: z.string().nonempty("La catégorie est requise"),
});

type FormData = z.infer<typeof formSchema>;

export interface TransactionFormProps {
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transactionId?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSuccess,
  open,
  onOpenChange,
  transactionId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
    },
  });

  useEffect(() => {
    if (transactionId) {
      const loadTransaction = async () => {
        try {
          const transaction = await getTransactionById(transactionId);
          if (transaction) {
            form.reset({
              amount: parseFloat(transaction.amount.toString()),
              description: transaction.description,
              category: transaction.category || "",
            });
          }
        } catch (error) {
          console.error("Error loading transaction:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les détails de la transaction",
            variant: "destructive",
          });
        }
      };
      
      loadTransaction();
    }
  }, [transactionId, form, toast]);

  const onSubmit = async (data: FormData) => {
    try {
      const transactionData = {
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: new Date().toISOString(),
        status: "completed" as const,
      };

      let result;
      
      if (transactionId) {
        result = await updateTransaction(transactionId, transactionData);
      } else {
        result = await createTransaction(transactionData);
        
        // Update budget after new transaction
        if (result) {
          await updateBudgetAfterTransaction({
            id: result.id,
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: result.date,
            status: result.status,
          });
        }
      }
      
      toast({
        title: transactionId ? "Transaction mise à jour" : "Transaction créée",
        description: "Opération effectuée avec succès.",
      });
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const categories = ["Matériel", "Fournitures", "Événement", "Transport", "Autre"];

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">Montant</label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...form.register("amount", { valueAsNumber: true })}
            className="w-full pr-8"
            placeholder="0.00"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
        </div>
        {form.formState.errors.amount && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.amount.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">Catégorie</label>
        <Select
          value={form.watch("category")}
          onValueChange={(value) => form.setValue("category", value)}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <Input
          id="description"
          {...form.register("description")}
          className="w-full"
          placeholder="Description de la transaction"
        />
        {form.formState.errors.description && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full">
        {transactionId ? "Mettre à jour" : "Enregistrer la transaction"}
      </Button>
    </form>
  );

  // If open and onOpenChange are provided, render as a dialog
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {transactionId ? "Modifier la transaction" : "Nouvelle transaction"}
            </DialogTitle>
            <DialogDescription>
              {transactionId 
                ? "Modifier les détails de la transaction" 
                : "Créer une nouvelle transaction qui impactera le budget"}
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise render as a standalone form
  return formContent;
};

export default TransactionForm;
