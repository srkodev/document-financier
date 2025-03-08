
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TransactionStatus, Transaction } from '@/types';
import { createTransaction, updateTransaction } from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { fetchCategories } from '@/services/categoryService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

const transactionSchema = z.object({
  amount: z.coerce.number().refine(val => val !== 0, {
    message: "Le montant ne peut pas être égal à 0",
  }),
  description: z.string().min(3, {
    message: "La description doit contenir au moins 3 caractères",
  }),
  category: z.string().optional(),
  date: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  status: z.enum([
    TransactionStatus.COMPLETED, 
    TransactionStatus.PENDING, 
    TransactionStatus.CANCELLED, 
    TransactionStatus.PROCESSING
  ]),
  transactionType: z.enum(["income", "expense"]),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  transaction
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!transaction;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
      date: new Date(),
      status: TransactionStatus.COMPLETED,
      transactionType: "expense",
    },
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData.map(c => c.name));
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, []);

  // Set form values when editing
  useEffect(() => {
    if (transaction) {
      form.reset({
        amount: Math.abs(transaction.amount),
        description: transaction.description,
        category: transaction.category || "",
        date: new Date(transaction.date),
        status: transaction.status,
        transactionType: transaction.amount > 0 ? "income" : "expense",
      });
    } else {
      form.reset({
        amount: 0,
        description: "",
        category: "",
        date: new Date(),
        status: TransactionStatus.COMPLETED,
        transactionType: "expense",
      });
    }
  }, [transaction, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une transaction",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Adjust amount based on transaction type
      const adjustedAmount = values.transactionType === "expense" 
        ? -Math.abs(values.amount) 
        : Math.abs(values.amount);

      const transactionData: Partial<Transaction> = {
        amount: adjustedAmount,
        description: values.description,
        category: values.category,
        date: values.date,
        status: values.status,
      };

      if (isEditing && transaction) {
        await updateTransaction(transaction.id, transactionData);
        toast({
          title: "Transaction mise à jour",
          description: "La transaction a été mise à jour avec succès",
        });
      } else {
        await createTransaction(transactionData);
        toast({
          title: "Transaction créée",
          description: "La transaction a été créée avec succès",
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la transaction" : "Créer une transaction"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les détails de la transaction ci-dessous." 
              : "Remplissez les détails de la nouvelle transaction."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Type de transaction</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="expense" />
                        <label htmlFor="expense" className="text-sm font-medium">
                          Dépense
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="income" />
                        <label htmlFor="income" className="text-sm font-medium">
                          Revenu
                        </label>
                      </div>
                    </RadioGroup>
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
                  <FormLabel>Montant (€)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      {...field}
                    />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la transaction"
                      className="resize-none"
                      {...field}
                    />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
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
                        disabled={(date) => date > new Date()}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionStatus.COMPLETED}>Terminée</SelectItem>
                      <SelectItem value={TransactionStatus.PENDING}>En attente</SelectItem>
                      <SelectItem value={TransactionStatus.PROCESSING}>En cours</SelectItem>
                      <SelectItem value={TransactionStatus.CANCELLED}>Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <FormDescription>
                    Seules les transactions avec le statut "Terminée" affectent le budget
                  </FormDescription>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Traitement...
                  </span>
                ) : isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
