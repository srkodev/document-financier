
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InvoiceStatus, Article } from "@/types";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createInvoiceWithPDF } from "@/services/invoiceService";
import ArticleForm from "@/components/articles/ArticleForm";

interface InvoiceItem {
  article_id: string;
  quantity: number;
  name: string;
  priceHT: number;
  vatRate: number;
}

const formSchema = z.object({
  description: z.string().min(3, "La description doit contenir au moins 3 caractères"),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  status: z.string().default(InvoiceStatus.PENDING),
  items: z.array(
    z.object({
      article_id: z.string(),
      quantity: z.number().min(1, "La quantité doit être d'au moins 1"),
      name: z.string(),
      priceHT: z.number(),
      vatRate: z.number()
    })
  ).optional().default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const fetchArticles = async (userId: string) => {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceHT: item.price_ht,
    vatRate: item.vat_rate,
    created_at: item.created_at,
    updated_at: item.updated_at,
    user_id: item.user_id,
  })) as Article[];
};

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des catégories", error);
    return [];
  }

  return data.map(cat => cat.name) || [];
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(["Matériel", "Fournitures", "Événement", "Transport", "Remboursement", "Autre"]);

  const { data: articles = [] } = useQuery({
    queryKey: ["user-articles"],
    queryFn: () => fetchArticles(user?.id || ""),
    enabled: !!user && open,
  });

  // Charger les catégories depuis la base de données
  useEffect(() => {
    if (open) {
      fetchCategories().then(fetchedCategories => {
        if (fetchedCategories && fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
        }
      });
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: "",
      status: InvoiceStatus.PENDING,
      items: [],
    },
  });

  // Mettre à jour le formulaire quand les items changent
  useEffect(() => {
    form.setValue("items", items);
  }, [items, form]);

  const addItem = () => {
    if (!selectedArticleId) return;
    
    const article = articles.find(a => a.id === selectedArticleId);
    if (!article) return;
    
    const newItem: InvoiceItem = {
      article_id: article.id,
      quantity: quantity,
      name: article.name,
      priceHT: article.priceHT,
      vatRate: article.vatRate
    };
    
    setItems([...items, newItem]);
    setSelectedArticleId("");
    setQuantity(1);
  };
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const totalHT = items.reduce((sum, item) => sum + (item.priceHT * item.quantity), 0);
    const totalTVA = items.reduce((sum, item) => sum + (item.priceHT * item.quantity * item.vatRate / 100), 0);
    const totalTTC = totalHT + totalTVA;
    
    return { totalHT, totalTVA, totalTTC };
  };

  const handleArticleCreated = async () => {
    setIsArticleFormOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["user-articles"] });
    toast({
      title: "Article créé",
      description: "L'article a été créé avec succès et est disponible pour la facture.",
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    // Vérifier qu'au moins un article a été ajouté
    if (items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un article à la facture",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Calculer le montant total
      const { totalTTC } = calculateTotal();
      
      // Générer un numéro de facture
      const invoiceNumber = `INV-${Date.now().toString().substring(6)}`;
      
      // Créer la facture avec génération de PDF automatique
      await createInvoiceWithPDF({
        number: invoiceNumber,
        user_id: user.id,
        description: values.description,
        amount: totalTTC,
        status: values.status,
        category: values.category,
      }, items);
      
      toast({
        title: "Facture créée",
        description: "Votre facture a été créée avec succès et le PDF a été généré.",
      });
      
      form.reset();
      setItems([]);
      onOpenChange(false);
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la facture",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nouvelle facture</DialogTitle>
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
                      <Textarea placeholder="Description de la facture..." {...field} />
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
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Articles</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsArticleFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Nouvel article
                  </Button>
                </div>
                
                <div className="flex flex-col space-y-2 mt-2">
                  <div className="flex space-x-2">
                    <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner un article" />
                      </SelectTrigger>
                      <SelectContent>
                        {articles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            {article.name} - {article.priceHT.toFixed(2)}€ HT
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      min="1"
                      max="100"
                      className="w-20"
                    />
                    
                    <Button type="button" onClick={addItem} disabled={!selectedArticleId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {articles.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Vous n'avez pas encore créé d'articles. Cliquez sur "Nouvel article" pour en créer un.
                    </p>
                  )}
                  
                  {items.length > 0 && (
                    <Card className="p-3 mt-3">
                      <ScrollArea className="max-h-40">
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium">{item.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {item.quantity} x {item.priceHT.toFixed(2)}€ HT
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  TVA: {item.vatRate}% | Total: {((item.priceHT * item.quantity) * (1 + item.vatRate / 100)).toFixed(2)}€ TTC
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <Separator className="my-3" />
                      
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Total HT:</span>
                          <span>{calculateTotal().totalHT.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total TVA:</span>
                          <span>{calculateTotal().totalTVA.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total TTC:</span>
                          <span>{calculateTotal().totalTTC.toFixed(2)}€</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={loading || items.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    "Créer la facture et générer le PDF"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ArticleForm 
        open={isArticleFormOpen} 
        onOpenChange={setIsArticleFormOpen} 
        onSuccess={handleArticleCreated}
      />
    </>
  );
};

export default InvoiceForm;
