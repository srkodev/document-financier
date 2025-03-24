import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { config } from '../config/config';

export const loginUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || !data.user) {
      throw new Error('Authentification échouée');
    }

    // Générer un JWT token
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Récupérer les informations complètes de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    return {
      token,
      user: userData
    };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur d\'authentification');
  }
};

export const registerUser = async (email: string, password: string, name: string, role: string = 'user') => {
  try {
    // Créer l'utilisateur dans l'authentification Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || !data.user) {
      throw new Error('Inscription échouée');
    }

    // Créer le profil utilisateur dans la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          name,
          role
        }
      ])
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    // Générer un JWT token
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: userData
    };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur d\'inscription');
  }
};

export const logoutUser = async (token: string) => {
  try {
    // Déconnecter l'utilisateur dans Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur de déconnexion');
  }
}; 