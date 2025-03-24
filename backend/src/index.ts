import express, { RequestHandler } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config/config';

// Routes
import invoiceRoutes from './routes/invoiceRoutes';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import budgetRoutes from './routes/budgetRoutes';
import reimbursementRoutes from './routes/reimbursementRoutes';
import articleRoutes from './routes/articleRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.json({ message: 'API de gestion financière fonctionnelle' });
});

// Gestion des erreurs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Une erreur est survenue',
    error: config.environment === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
}); 