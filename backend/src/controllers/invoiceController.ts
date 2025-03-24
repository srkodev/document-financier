import { Request, Response } from 'express';
import * as invoiceService from '../services/invoiceService';

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const { status, search, category } = req.query;
    
    const invoices = await invoiceService.fetchInvoices(
      status as invoiceService.InvoiceStatus | undefined,
      search as string | undefined,
      category as string | undefined
    );
    
    return res.status(200).json(invoices);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id);
    return res.status(200).json(invoice);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body;
    
    // Ajouter l'ID de l'utilisateur connecté
    const completeInvoiceData = {
      ...invoiceData,
      user_id: req.user.id,
      status: invoiceService.InvoiceStatus.PENDING,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const newInvoice = await invoiceService.createInvoice(completeInvoiceData);
    return res.status(201).json(newInvoice);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!Object.values(invoiceService.InvoiceStatus).includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    await invoiceService.updateInvoiceStatus(id, status);
    return res.status(200).json({ message: 'Statut de la facture mis à jour avec succès' });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceData = req.body;
    
    const updatedInvoice = await invoiceService.updateInvoice(id, invoiceData);
    return res.status(200).json(updatedInvoice);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await invoiceService.deleteInvoice(id);
    return res.status(200).json({ message: 'Facture supprimée avec succès' });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const exportInvoicesToCSV = async (req: Request, res: Response) => {
  try {
    const { status, search, category } = req.query;
    
    const invoices = await invoiceService.fetchInvoices(
      status as invoiceService.InvoiceStatus | undefined,
      search as string | undefined,
      category as string | undefined
    );
    
    const csvContent = invoiceService.exportInvoicesToCSV(invoices);
    
    if (!csvContent) {
      return res.status(404).json({ message: 'Aucune facture à exporter' });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=factures_export_${new Date().toISOString().split('T')[0]}.csv`);
    
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}; 