import express, { RequestHandler } from 'express';
import { login, register, logout, getUserProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Routes publiques
router.post('/login', login as unknown as RequestHandler);
router.post('/register', register as unknown as RequestHandler);
router.post('/logout', logout as unknown as RequestHandler);

// Routes protégées
router.get('/profile', authenticateToken as unknown as RequestHandler, getUserProfile as unknown as RequestHandler);

export default router; 