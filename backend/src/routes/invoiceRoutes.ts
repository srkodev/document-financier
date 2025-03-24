import express, { RequestHandler } from 'express';
import { 
  getAllInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoiceStatus, 
  updateInvoice, 
  deleteInvoice,
  exportInvoicesToCSV
} from '../controllers/invoiceController';
import { authenticateToken, isRespPole, isAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// Toutes les routes d'invoice nécessitent d'être authentifié
router.use(authenticateToken as unknown as RequestHandler);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', getAllInvoices as unknown as RequestHandler);
router.get('/export', exportInvoicesToCSV as unknown as RequestHandler);
router.get('/:id', getInvoiceById as unknown as RequestHandler);
router.post('/', createInvoice as unknown as RequestHandler);

// Routes nécessitant des droits de responsable de pôle ou d'administrateur
router.put('/:id/status', isRespPole as unknown as RequestHandler, updateInvoiceStatus as unknown as RequestHandler);
router.put('/:id', isRespPole as unknown as RequestHandler, updateInvoice as unknown as RequestHandler);

// Routes nécessitant des droits d'administrateur
router.delete('/:id', isAdmin as unknown as RequestHandler, deleteInvoice as unknown as RequestHandler);

export default router; 