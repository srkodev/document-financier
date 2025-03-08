
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

// Create a temporary invoice to link with the reimbursement
const createTemporaryInvoice = async (userId: string, amount: number, description: string, category: string) => {
  const invoiceNumber = `TEMP-${Date.now().toString().substring(6)}`;
  
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      number: invoiceNumber,
      amount: amount,
      description: `Temporary invoice for reimbursement: ${description}`,
      status: "pending",
      user_id: userId,
      category: category
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return data.id;
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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
    const fileName = files[index].name;
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
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
      // 1. First create a temporary invoice to link with the reimbursement
      const invoiceId = await createTemporaryInvoice(
        user.id, 
        values.amount, 
        values.description,
        values.category
      );
      
      // 2. Create the reimbursement request
      const { data: request, error: requestError } = await supabase
        .from("reimbursement_requests")
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          amount: values.amount,
          description: values.description,
          status: "pending",
          category: values.category
        })
        .select()
        .single();
      
      if (requestError) throw requestError;
      
      // 3. Upload files
      const attachments = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${request.id}/${crypto.randomUUID()}.${fileExt}`;
        
        // Créer un objet FormData pour suivre la progression
        const formData = new FormData();
        formData.append('file', file);
        
        // Suivre la progression de l'upload
        const uploadFile = async () => {
          try {
            // Initialiser la progression
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: 0
            }));
            
            // Simuler la progression de l'upload (car Supabase ne fournit pas d'API de progression)
            const interval = setInterval(() => {
              setUploadProgress(prev => {
                const currentProgress = prev[file.name] || 0;
                if (currentProgress < 90) {
                  return { ...prev, [file.name]: currentProgress + 10 };
                }
                return prev;
              });
            }, 300);
            
            // Effectuer l'upload réel
            const { error: uploadError } = await supabase.storage
              .from('reimbursement_attachments')
              .upload(filePath, file);
              
            clearInterval(interval);
            
            if (uploadError) {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: -1 // -1 pour indiquer une erreur
              }));
              throw new Error(`Erreur lors de l'upload du fichier ${file.name}`);
            }
            
            // Marquer comme terminé
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: 100
            }));
            
            const { data: urlData } = supabase.storage
              .from('reimbursement_attachments')
              .getPublicUrl(filePath);
              
            return {
              reimbursement_id: request.id,
              file_name: file.name,
              file_type: file.type,
              file_path: filePath,
              file_url: urlData.publicUrl
            };
          } catch (err) {
            console.error(`Erreur d'upload pour ${file.name}:`, err);
            throw err;
          }
        };
        
        const attachment = await uploadFile();
        attachments.push(attachment);
      }
      
      // 4. Save file references
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
          <DialogDescription>
            Remplissez le formulaire et joignez les justificatifs nécessaires pour votre demande.
          </DialogDescription>
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
                  {files.map((file, index) => {
                    const progress = uploadProgress[file.name] || 0;
                    return (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <FileUp className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(0)} KB
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {progress > 0 && progress < 100 && (
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  progress < 0 ? 'bg-red-500' : 'bg-primary'
                                }`}
                                style={{ width: `${progress < 0 ? 100 : progress}%` }}
                              ></div>
                            </div>
                          )}
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
