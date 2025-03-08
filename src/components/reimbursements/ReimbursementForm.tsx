
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  invoice_id: z.string().uuid("Veuillez sélectionner une facture valide"),
  amount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0"),
  description: z.string().min(3, "La description doit contenir au moins 3 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

interface ReimbursementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  invoice_id?: string;
}

// Fonction pour récupérer les factures de l'utilisateur
const fetchUserInvoices = async (user_id: string) => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Invoice[];
};

const ReimbursementForm: React.FC<ReimbursementFormProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  invoice_id 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: invoices = [] } = useQuery({
    queryKey: ["user-invoices"],
    queryFn: () => fetchUserInvoices(user?.id || ""),
    enabled: !!user,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_id: invoice_id || "",
      amount: undefined,
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Créer une nouvelle demande de remboursement
      const { error } = await supabase
        .from("reimbursement_requests")
        .insert({
          invoice_id: values.invoice_id,
          user_id: user.id,
          amount: values.amount,
          description: values.description,
          status: "pending"
        });
      
      if (error) throw error;
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande de remboursement a été envoyée avec succès.",
      });
      
      form.reset();
      onOpenChange(false);
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de remboursement</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoice_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facture concernée</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une facture" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.number} - {invoice.description.substring(0, 30)}... - {invoice.amount}€
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Veuillez justifier votre demande de remboursement..." 
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer la demande"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReimbursementForm;
