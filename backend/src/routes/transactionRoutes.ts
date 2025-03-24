import express, { RequestHandler } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Protéger toutes les routes
router.use(authenticateToken as unknown as RequestHandler);

// Route temporaire - à compléter avec les contrôleurs réels
router.get('/', (req, res) => {
  res.json({ message: 'Liste des transactions' });
});

export default router; 