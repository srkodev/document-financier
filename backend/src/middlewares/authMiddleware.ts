import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { supabase } from '../config/supabase';

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé: Token manquant' });
    }

    // Vérifier la validité du token JWT
    jwt.verify(token, config.jwtSecret, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Accès interdit: Token invalide' });
      }

      // Vérifier si l'utilisateur existe dans Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return res.status(403).json({ message: 'Accès interdit: Utilisateur non trouvé' });
      }

      // Attacher l'utilisateur à l'objet req
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur d\'authentification' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit: Droits d\'administrateur requis' });
  }
  next();
};

export const isRespPole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'resp_pole')) {
    return res.status(403).json({ message: 'Accès interdit: Droits de responsable de pôle requis' });
  }
  next();
}; 