import { Request, Response } from 'express';
import { loginUser, registerUser, logoutUser } from '../services/authService';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, mot de passe et nom requis' });
    }

    const result = await registerUser(email, password, name, role);
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const result = await logoutUser(token);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getUserProfile = (req: Request, res: Response) => {
  try {
    // L'utilisateur est attaché à la requête par le middleware d'authentification
    return res.status(200).json({ user: req.user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}; 