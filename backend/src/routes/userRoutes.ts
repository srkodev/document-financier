import express, { RequestHandler } from 'express';
import { 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole
} from '../controllers/userController';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authenticateToken as unknown as RequestHandler);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/profile/:id', getUserById as unknown as RequestHandler);
router.put('/profile/:id', updateUser as unknown as RequestHandler);

// Routes accessibles uniquement aux administrateurs
router.get('/', isAdmin as unknown as RequestHandler, getAllUsers as unknown as RequestHandler);
router.delete('/:id', isAdmin as unknown as RequestHandler, deleteUser as unknown as RequestHandler);
router.put('/:id/role', isAdmin as unknown as RequestHandler, updateUserRole as unknown as RequestHandler);

export default router; 