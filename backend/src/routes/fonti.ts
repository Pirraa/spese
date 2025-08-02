import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Applica l'autenticazione a tutte le route
router.use(authenticateToken);

// Schema di validazione per le fonti
const fonteSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  tipo: z.enum(['CARTA', 'CONTANTI', 'DIGITALE']),
  saldo: z.number().min(0, 'Il saldo non può essere negativo'),
  ubicazione: z.string().optional(),
  codice: z.string().optional(),
});

// GET /api/fonti - Ottieni tutte le fonti dell'utente autenticato
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const fonti = await prisma.fonte.findMany({
      where: { 
        attiva: true,
        utenteId: req.userId! 
      },
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

// GET /api/fonti/:id - Ottieni una fonte specifica dell'utente
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const fonte = await prisma.fonte.findUnique({
      where: { 
        id,
        utenteId: req.userId! 
      },
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

// POST /api/fonti - Crea una nuova fonte per l'utente autenticato
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const validatedData = fonteSchema.parse(req.body);
    
    const fonte = await prisma.fonte.create({
      data: {
        ...validatedData,
        utenteId: req.userId!
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

// PUT /api/fonti/:id - Aggiorna una fonte dell'utente
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = fonteSchema.partial().parse(req.body);
    
    // Verifica che la fonte appartenga all'utente
    const existingFonte = await prisma.fonte.findUnique({
      where: { id },
      select: { utenteId: true }
    });
    
    if (!existingFonte || existingFonte.utenteId !== req.userId) {
      throw new AppError('Fonte non trovata', 404);
    }
    
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

// DELETE /api/fonti/:id - Elimina una fonte dell'utente (soft delete)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    
    // Verifica che la fonte appartenga all'utente
    const existingFonte = await prisma.fonte.findUnique({
      where: { id },
      select: { utenteId: true }
    });
    
    if (!existingFonte || existingFonte.utenteId !== req.userId) {
      throw new AppError('Fonte non trovata', 404);
    }
    
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
