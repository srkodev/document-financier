
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

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  priceHT: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0"),
  vatRate: z.coerce.number().min(0, "Le taux de TVA ne peut pas être négatif").default(20),
});

type FormValues = z.infer<typeof formSchema>;

interface ArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  article?: {
    id: string;
    name: string;
    description?: string;
    priceHT: number;
    vatRate: number;
  };
}

const ArticleForm: React.FC<ArticleFormProps> = ({ open, onOpenChange, onSuccess, article }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditing = !!article;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: article?.name || "",
      description: article?.description || "",
      priceHT: article?.priceHT || undefined,
      vatRate: article?.vatRate || 20,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isEditing) {
        // Mettre à jour un article existant
        const { error } = await supabase
          .from("articles")
          .update({
            name: values.name,
            description: values.description,
            price_ht: values.priceHT,
            vat_rate: values.vatRate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", article.id);
          
        if (error) throw error;
        
        toast({
          title: "Article mis à jour",
          description: "Votre article a été mis à jour avec succès.",
        });
      } else {
        // Créer un nouvel article
        const { error } = await supabase.from("articles").insert({
          name: values.name,
          description: values.description,
          price_ht: values.priceHT,
          vat_rate: values.vatRate,
          user_id: user.id,
        });
        
        if (error) throw error;
        
        toast({
          title: "Article créé",
          description: "Votre article a été créé avec succès.",
        });
      }
      
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
          <DialogTitle>{isEditing ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'article..." {...field} />
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
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description de l'article..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priceHT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix HT (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taux de TVA (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="20" {...field} />
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
                    {isEditing ? "Mise à jour..." : "Création en cours..."}
                  </>
                ) : (
                  isEditing ? "Mettre à jour" : "Créer l'article"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleForm;
