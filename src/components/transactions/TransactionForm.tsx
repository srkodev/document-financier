
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TransactionStatus } from "@/types";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
  description: z.string().min(3, "La description doit contenir au moins 3 caractères"),
  amount: z.string().refine(value => !isNaN(Number(value)), {
    message: "Le montant doit être un nombre valide",
  }),
  category: z.string().optional(),
  date: z.date({
    required_error: "Une date est requise.",
  }),
  status: z.string().default(TransactionStatus.PENDING),
  invoiceId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  transactionId?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  transactionId, 
  onSuccess, 
  open, 
  onOpenChange 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>(["Matériel", "Fournitures", "Événement", "Transport", "Remboursement", "Autre"]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      status: TransactionStatus.PENDING,
      invoiceId: "",
    },
  });

  useEffect(() => {
    if (transactionId) {
      fetchTransactionData(transactionId);
    }
  }, [transactionId]);

  const fetchTransactionData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Format the date to a Date object
        const formattedDate = new Date(data.date);

        // Fix: Use setValue on each field individually instead of passing an object
        form.setValue("description", data.description);
        form.setValue("amount", String(data.amount));
        form.setValue("category", data.category || "");
        form.setValue("date", formattedDate);
        form.setValue("status", data.status);
        form.setValue("invoiceId", data.invoice_id || "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load transaction data",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const transactionData = {
        description: values.description,
        amount: Number(values.amount),
        category: values.category || null,
        date: format(values.date, "yyyy-MM-dd'T'HH:mm:ss"),
        status: values.status as TransactionStatus, // Conversion explicite en TransactionStatus
        invoice_id: values.invoiceId || null
      };

      if (transactionId) {
        // Update existing transaction
        const { error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", transactionId);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        // Create new transaction
        const { error } = await supabase.from("transactions").insert([
          {
            ...transactionData,
            user_id: user.id,
          },
        ]);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Transaction created successfully",
        });
      }

      // Mise à jour du budget global
      if (values.category) {
        try {
          // Récupérer le budget actuel
          const { data: budgetData, error: budgetError } = await supabase
            .from("budgets")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (!budgetError && budgetData) {
            // Mettre à jour le budget de la catégorie
            const categories = budgetData.categories || {};
            if (categories[values.category]) {
              categories[values.category].spent = 
                (parseFloat(categories[values.category].spent) || 0) + Number(values.amount);
              categories[values.category].lastUpdated = new Date().toISOString();
            }

            // Mettre à jour le budget total dépensé
            const totalSpent = (parseFloat(budgetData.total_spent) || 0) + Number(values.amount);

            // Enregistrer les modifications
            await supabase
              .from("budgets")
              .update({
                total_spent: totalSpent,
                categories: categories
              })
              .eq("id", budgetData.id);
          }
        } catch (budgetError) {
          console.error("Erreur lors de la mise à jour du budget:", budgetError);
        }
      }

      form.reset();
      if (onSuccess) {
        onSuccess();
      }
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        navigate("/transactions");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si c'est utilisé comme une modal
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{transactionId ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description de la transaction..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TransactionStatus.PENDING}>En attente</SelectItem>
                        <SelectItem value={TransactionStatus.COMPLETED}>Complété</SelectItem>
                        <SelectItem value={TransactionStatus.CANCELLED}>Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Facture (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Entrez l'ID de la facture" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Veuillez patienter
                  </>
                ) : (
                  "Soumettre"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Rendu normal pour une page complète
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description de la transaction..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TransactionStatus.PENDING}>En attente</SelectItem>
                  <SelectItem value={TransactionStatus.COMPLETED}>Complété</SelectItem>
                  <SelectItem value={TransactionStatus.CANCELLED}>Annulé</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Facture (Optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Entrez l'ID de la facture" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Veuillez patienter
            </>
          ) : (
            "Soumettre"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default TransactionForm;
