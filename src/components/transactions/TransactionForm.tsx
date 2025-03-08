
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Transaction } from "@/types";
import { createTransaction, getTransactionById, updateTransaction } from "@/services/transactionService";
import { useToast } from "@/hooks/use-toast";
import { fetchCategories } from "@/services/categoryService";

interface TransactionFormProps {
  isEdit?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Omit<Transaction, "id" | "created_at">>();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        const categoryNames = categoriesData.map(cat => cat.name);
        setCategories(categoryNames);
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      }
    };
    
    loadCategories();

    if (isEdit && id) {
      const fetchTransaction = async () => {
        setLoading(true);
        try {
          const data = await getTransactionById(id);
          if (data) {
            setTransaction(data);
            reset({
              amount: data.amount,
              description: data.description,
              category: data.category,
              date: data.date,
              status: data.status,
            });
            
            if (data.date) {
              setDate(new Date(data.date));
            }
          }
        } catch (error) {
          console.error("Error fetching transaction:", error);
          toast({
            title: "Error",
            description: "Failed to fetch transaction details",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchTransaction();
    }
  }, [id, isEdit, reset, toast]);

  const onSubmit = async (data: Omit<Transaction, "id" | "created_at">) => {
    setLoading(true);
    try {
      const formattedData = {
        ...data,
        date: date.toISOString(),
      };

      if (isEdit && id) {
        await updateTransaction(id, formattedData);
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        await createTransaction(formattedData);
        toast({
          title: "Success",
          description: "Transaction created successfully",
        });
      }
      
      navigate("/transactions");
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {isEdit ? "Edit Transaction" : "Add New Transaction"}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { required: "Amount is required" })}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      setDate(date || new Date());
                      setValue("date", (date || new Date()).toISOString());
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => setValue("category", value)}
                defaultValue={transaction?.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => setValue("status", value)}
                defaultValue={transaction?.status || "completed"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description", { required: "Description is required" })}
              placeholder="Transaction description"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/transactions')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                ? "Update Transaction"
                : "Create Transaction"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TransactionForm;
