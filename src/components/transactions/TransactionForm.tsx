import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createReimbursementRequest } from "@/services/reimbursementService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  invoiceId: z.string().nonempty("L'ID de la facture est requis"),
  amount: z.coerce.number().min(0, "Le montant doit être positif"),
  description: z.string().nonempty("La description est requise"),
  category: z.string().optional(),
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
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceId: "",
      amount: 0,
      description: "",
      category: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createReimbursementRequest({
        invoiceId: data.invoiceId,
        amount: data.amount,
        description: data.description,
        category: data.category || "Remboursement"
      }, "user-id"); // Remplacez "user-id" par l'ID de l'utilisateur actuel
      
      toast({
        title: "Demande de remboursement créée",
        description: "Votre demande a été créée avec succès.",
      });
      onSuccess();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la demande.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (transactionId) {
      // Ajouter la logique pour charger les données si transactionId existe
      console.log("Loading transaction data for", transactionId);
      // fetchTransactionData(transactionId).then(data => form.reset(data))
    }
  }, [transactionId, form]);

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...form.register("invoiceId")}
        placeholder="ID de la facture"
        className="w-full"
      />
      <Input
        type="number"
        {...form.register("amount", { valueAsNumber: true })}
        placeholder="Montant"
        className="w-full"
      />
      <Input
        {...form.register("description")}
        placeholder="Description"
        className="w-full"
      />
      <Input
        {...form.register("category")}
        placeholder="Catégorie (optionnel)"
        className="w-full"
      />
      <Button type="submit">Soumettre</Button>
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
