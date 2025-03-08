
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
import { Loader2, FileUp, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0"),
  description: z.string().min(3, "La description doit contenir au moins 3 caractères"),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
});

type FormValues = z.infer<typeof formSchema>;

interface ReimbursementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

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

const ReimbursementForm: React.FC<ReimbursementFormProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>(["Matériel", "Fournitures", "Événement", "Transport", "Autre"]);

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
      amount: undefined,
      description: "",
      category: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    if (files.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez joindre au moins un justificatif",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // 1. Créer la demande de remboursement
      const { data: request, error: requestError } = await supabase
        .from("reimbursement_requests")
        .insert({
          user_id: user.id,
          amount: values.amount,
          description: values.description,
          category: values.category,
          status: "pending"
        })
        .select()
        .single();
      
      if (requestError) throw requestError;
      
      // 2. Upload des fichiers justificatifs
      const attachments = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${request.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('reimbursement_attachments')
          .upload(filePath, file);
          
        if (uploadError) {
          throw new Error(`Erreur lors de l'upload du fichier ${file.name}`);
        }
        
        const { data: urlData } = supabase.storage
          .from('reimbursement_attachments')
          .getPublicUrl(filePath);
          
        attachments.push({
          reimbursement_id: request.id,
          file_name: file.name,
          file_type: file.type,
          file_url: urlData.publicUrl
        });
      }
      
      // 3. Enregistrer les liens vers les fichiers
      if (attachments.length > 0) {
        const { error: attachError } = await supabase
          .from("reimbursement_attachments")
          .insert(attachments);
          
        if (attachError) throw attachError;
      }
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande de remboursement a été envoyée avec succès.",
      });
      
      form.reset();
      setFiles([]);
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
            
            <div className="space-y-2">
              <FormLabel>Pièces justificatives</FormLabel>
              <div className="flex items-center gap-2">
                <Input 
                  id="file" 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                  onChange={handleFileChange}
                  className="flex-1"
                  multiple
                />
                <FileUp className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <FileUp className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(0)} KB
                        </Badge>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Formats acceptés: PDF, JPG, PNG, DOC, DOCX</p>
            </div>
            
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
