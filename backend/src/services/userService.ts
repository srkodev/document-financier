import { supabase } from '../config/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  return data as User[];
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as User;
};

export const updateUser = async (id: string, userData: Partial<User>) => {
  // Ne jamais permettre la mise à jour de l'ID
  const { id: _, ...updateData } = userData;
  
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as User;
};

export const deleteUser = async (id: string) => {
  // Supprimer l'utilisateur de Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  
  if (authError) {
    throw new Error(`Erreur lors de la suppression de l'utilisateur dans Auth: ${authError.message}`);
  }
  
  // La suppression du profil utilisateur sera gérée automatiquement par les triggers RLS de Supabase
  
  return true;
};

export const updateUserRole = async (id: string, role: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as User;
}; 