import { Request, Response } from 'express';
import * as userService from '../services/userService';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // Vérifier que l'utilisateur modifie son propre profil ou est un admin
    if (id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit: Vous ne pouvez modifier que votre propre profil' });
    }
    
    // Si un utilisateur normal essaie de modifier son rôle, bloquer
    if (req.user.role !== 'admin' && userData.role && userData.role !== req.user.role) {
      return res.status(403).json({ message: 'Accès interdit: Vous ne pouvez pas modifier votre rôle' });
    }
    
    const updatedUser = await userService.updateUser(id, userData);
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur ne supprime pas son propre compte
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    await userService.deleteUser(id);
    return res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Rôle requis' });
    }
    
    // Vérifier que les rôles sont valides
    const validRoles = ['admin', 'resp_pole', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    
    // Empêcher la modification de son propre rôle
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }
    
    const updatedUser = await userService.updateUserRole(id, role);
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}; 