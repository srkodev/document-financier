
-- Tables pour les articles (produits/services)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_ht NUMERIC NOT NULL,
  vat_rate NUMERIC NOT NULL DEFAULT 20,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Activer Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Politique permettant aux utilisateurs de gérer leurs propres articles
CREATE POLICY "Users can manage their own articles" 
ON public.articles 
FOR ALL 
USING (auth.uid() = user_id);

-- Table pour les demandes de remboursement
CREATE TABLE IF NOT EXISTS public.reimbursement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Activer Row Level Security
ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- Politique permettant aux utilisateurs de voir leurs propres demandes
CREATE POLICY "Users can see their own reimbursement requests" 
ON public.reimbursement_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Politique permettant aux utilisateurs de créer leurs propres demandes
CREATE POLICY "Users can create their own reimbursement requests" 
ON public.reimbursement_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique permettant aux utilisateurs de mettre à jour leurs propres demandes
CREATE POLICY "Users can update their own reimbursement requests" 
ON public.reimbursement_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Politique permettant aux utilisateurs de supprimer leurs propres demandes
CREATE POLICY "Users can delete their own reimbursement requests" 
ON public.reimbursement_requests 
FOR DELETE 
USING (auth.uid() = user_id AND status = 'pending');

-- Politique permettant aux administrateurs de voir toutes les demandes
CREATE POLICY "Admins can see all reimbursement requests" 
ON public.reimbursement_requests 
FOR SELECT 
USING (is_admin_or_higher(auth.uid()));

-- Politique permettant aux administrateurs de mettre à jour toutes les demandes
CREATE POLICY "Admins can update all reimbursement requests" 
ON public.reimbursement_requests 
FOR UPDATE 
USING (is_admin_or_higher(auth.uid()));
