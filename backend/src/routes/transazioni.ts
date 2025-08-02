import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Applica l'autenticazione a tutte le route
router.use(authenticateToken);

// Schema di validazione per le transazioni
const transazioneSchema = z.object({
  tipo: z.enum(['ENTRATA', 'SPESA', 'TRASFERIMENTO']),
  importo: z.number().positive('L\'importo deve essere positivo'),
  descrizione: z.string().min(1, 'La descrizione è obbligatoria'),
  luogo: z.string().optional(),
  fonteId: z.string().min(1, 'La fonte è obbligatoria'),
  fonteDestinazioneId: z.string().optional(),
  data: z.string().datetime().optional(),
});

// GET /api/transazioni - Ottieni tutte le transazioni dell'utente
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { limit = '20', offset = '0', tipo } = req.query;

    // Assumendo che il tipo enum sia esportato da Prisma come TipoTransazione
    // e che req.query.tipo sia una stringa valida per l'enum
    const whereClause = {
      utenteId: req.userId!,
      ...(tipo ? { tipo: tipo as any } : {})
    };

    const transazioni = await prisma.transazione.findMany({
      where: whereClause,
      include: {
        fonte: true,
        fonteDestinazione: true
      },
      orderBy: { data: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });
    
    const totale = await prisma.transazione.count({ where: whereClause });
    
    res.json({
      success: true,
      data: transazioni,
      pagination: {
        total: totale,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transazioni/:id - Ottieni una transazione specifica dell'utente
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const transazione = await prisma.transazione.findUnique({
      where: { 
        id,
        utenteId: req.userId!
      },
      include: {
        fonte: true,
        fonteDestinazione: true
      }
    });
    
    if (!transazione) {
      throw new AppError('Transazione non trovata', 404);
    }
    
    res.json({
      success: true,
      data: transazione
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/transazioni - Crea una nuova transazione per l'utente autenticato
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const validatedData = transazioneSchema.parse(req.body);
    
    // Verifica che le fonti appartengano all'utente
    const fonte = await prisma.fonte.findUnique({
      where: { 
        id: validatedData.fonteId,
        utenteId: req.userId!
      }
    });
    
    if (!fonte) {
      throw new AppError('Fonte non trovata o non autorizzata', 404);
    }
    
    // Se è un trasferimento, verifica anche la fonte destinazione
    if (validatedData.tipo === 'TRASFERIMENTO' && validatedData.fonteDestinazioneId) {
      const fonteDestinazione = await prisma.fonte.findUnique({
        where: { 
          id: validatedData.fonteDestinazioneId,
          utenteId: req.userId!
        }
      });
      
      if (!fonteDestinazione) {
        throw new AppError('Fonte destinazione non trovata o non autorizzata', 404);
      }
    }
    
    // Inizio transazione database per garantire consistenza
    const result = await prisma.$transaction(async (tx) => {
      // Crea la transazione
      const transazione = await tx.transazione.create({
        data: {
          ...validatedData,
          utenteId: req.userId!,
          data: validatedData.data ? new Date(validatedData.data) : new Date()
        },
        include: {
          fonte: true,
          fonteDestinazione: true
        }
      });
      
      // Aggiorna i saldi delle fonti
      if (validatedData.tipo === 'ENTRATA') {
        await tx.fonte.update({
          where: { id: validatedData.fonteId },
          data: { saldo: { increment: validatedData.importo } }
        });
      } else if (validatedData.tipo === 'SPESA') {
        await tx.fonte.update({
          where: { id: validatedData.fonteId },
          data: { saldo: { decrement: validatedData.importo } }
        });
      } else if (validatedData.tipo === 'TRASFERIMENTO' && validatedData.fonteDestinazioneId) {
        // Decrementa dalla fonte origine
        await tx.fonte.update({
          where: { id: validatedData.fonteId },
          data: { saldo: { decrement: validatedData.importo } }
        });
        // Incrementa nella fonte destinazione
        await tx.fonte.update({
          where: { id: validatedData.fonteDestinazioneId },
          data: { saldo: { increment: validatedData.importo } }
        });
      }
      
      return transazione;
    });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/transazioni/:id - Aggiorna una transazione dell'utente
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = transazioneSchema.partial().parse(req.body);
    
    // Verifica che la transazione appartenga all'utente
    const existingTransazione = await prisma.transazione.findUnique({
      where: { id },
      select: { utenteId: true }
    });
    
    if (!existingTransazione || existingTransazione.utenteId !== req.userId) {
      throw new AppError('Transazione non trovata', 404);
    }
    
    const transazione = await prisma.transazione.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.data && { data: new Date(validatedData.data) })
      },
      include: {
        fonte: true,
        fonteDestinazione: true
      }
    });
    
    res.json({
      success: true,
      data: transazione
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transazioni/:id - Elimina una transazione dell'utente
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    
    // Verifica che la transazione appartenga all'utente
    const existingTransazione = await prisma.transazione.findUnique({
      where: { id },
      select: { utenteId: true }
    });
    
    if (!existingTransazione || existingTransazione.utenteId !== req.userId) {
      throw new AppError('Transazione non trovata', 404);
    }
    
    await prisma.transazione.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Transazione eliminata con successo'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transazioni/statistiche/riepilogo - Statistiche generali dell'utente
router.get('/statistiche/riepilogo', async (req: AuthRequest, res, next) => {
  try {
    const { mese, anno } = req.query;
    
    const dataInizio = new Date(parseInt(anno as string || '2024'), parseInt(mese as string || '0') - 1, 1);
    const dataFine = new Date(parseInt(anno as string || '2024'), parseInt(mese as string || '0'), 0);
    
    const whereClause = {
      utenteId: req.userId!,
      ...(mese && anno ? {
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      } : {})
    };
    
    const [entrate, spese, trasferimenti] = await Promise.all([
      prisma.transazione.aggregate({
        where: { ...whereClause, tipo: 'ENTRATA' },
        _sum: { importo: true },
        _count: true
      }),
      prisma.transazione.aggregate({
        where: { ...whereClause, tipo: 'SPESA' },
        _sum: { importo: true },
        _count: true
      }),
      prisma.transazione.aggregate({
        where: { ...whereClause, tipo: 'TRASFERIMENTO' },
        _sum: { importo: true },
        _count: true
      })
    ]);
    
    res.json({
      success: true,
      data: {
        entrate: {
          totale: entrate._sum.importo || 0,
          numero: entrate._count
        },
        spese: {
          totale: spese._sum.importo || 0,
          numero: spese._count
        },
        trasferimenti: {
          totale: trasferimenti._sum.importo || 0,
          numero: trasferimenti._count
        },
        bilancio: (entrate._sum.importo || 0) - (spese._sum.importo || 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
