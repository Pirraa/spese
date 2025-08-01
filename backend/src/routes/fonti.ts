import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Schema di validazione per le fonti
const fonteSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  tipo: z.enum(['CARTA', 'CONTANTI', 'DIGITALE']),
  saldo: z.number().min(0, 'Il saldo non può essere negativo'),
  ubicazione: z.string().optional(),
  codice: z.string().optional(),
});

// GET /api/fonti - Ottieni tutte le fonti
router.get('/', async (req, res, next) => {
  try {
    const fonti = await prisma.fonte.findMany({
      where: { attiva: true },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: fonti
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/fonti/:id - Ottieni una fonte specifica
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const fonte = await prisma.fonte.findUnique({
      where: { id },
      include: {
        transazioniOrigine: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!fonte) {
      throw new AppError('Fonte non trovata', 404);
    }
    
    res.json({
      success: true,
      data: fonte
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/fonti - Crea una nuova fonte
router.post('/', async (req, res, next) => {
  try {
    const validatedData = fonteSchema.parse(req.body);
    
    const fonte = await prisma.fonte.create({
      data: {
        ...validatedData,
        utenteId: 'temp-user-id' // Da sostituire con l'ID dell'utente autenticato
      }
    });
    
    res.status(201).json({
      success: true,
      data: fonte
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/fonti/:id - Aggiorna una fonte
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = fonteSchema.partial().parse(req.body);
    
    const fonte = await prisma.fonte.update({
      where: { id },
      data: validatedData
    });
    
    res.json({
      success: true,
      data: fonte
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/fonti/:id - Elimina una fonte (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.fonte.update({
      where: { id },
      data: { attiva: false }
    });
    
    res.json({
      success: true,
      message: 'Fonte eliminata con successo'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
