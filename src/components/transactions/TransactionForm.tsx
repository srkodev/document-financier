import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createReimbursementRequest } from "@/services/reimbursementService";

const formSchema = z.object({
  invoiceId: z.string().nonempty("L'ID de la facture est requis"),
  amount: z.number().min(0, "Le montant doit être positif"),
  description: z.string().nonempty("La description est requise"),
  category: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const TransactionForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceId: "",
      amount: 0,
      description: "",
      category: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Convertir la valeur number en string avant de l'assigner
      form.setValue("amount", String(data.amount));
      await createReimbursementRequest(data, "user-id"); // Remplacez "user-id" par l'ID de l'utilisateur actuel
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...form.register("invoiceId")}
        placeholder="ID de la facture"
        className="w-full"
      />
      <Input
        type="number"
        {...form.register("amount")}
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
};

export default TransactionForm;
