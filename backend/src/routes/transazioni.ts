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
  data: z.string().datetime().optional().refine(
    (date) => {
      if (!date) return true; // Se non è fornita, usa Today
      const dataTransazione = new Date(date);
      const oggi = new Date();
      oggi.setHours(23, 59, 59, 999);
      return dataTransazione <= oggi;
    },
    { message: 'La data non può essere nel futuro' }
  ),
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

    const limitValue = parseInt(limit as string);
    const offsetValue = parseInt(offset as string);
    const usePagination = Number.isFinite(limitValue) && limitValue > 0;

    const transazioni = await prisma.transazione.findMany({
      where: whereClause,
      include: {
        fonte: true,
        fonteDestinazione: true
      },
      orderBy: { data: 'desc' },
      ...(usePagination ? { take: limitValue, skip: offsetValue } : {})
    });
    
    const totale = await prisma.transazione.count({ where: whereClause });
    
    res.json({
      success: true,
      data: transazioni,
      pagination: {
        total: totale,
        limit: usePagination ? limitValue : totale,
        offset: usePagination ? offsetValue : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transazioni/statistiche/anni - Anni disponibili per le statistiche
router.get('/statistiche/anni', async (req: AuthRequest, res, next) => {
  try {
    const range = await prisma.transazione.aggregate({
      where: { utenteId: req.userId! },
      _min: { data: true },
      _max: { data: true }
    });

    if (!range._min.data || !range._max.data) {
      return res.json({
        success: true,
        data: { years: [] }
      });
    }

    const minYear = range._min.data.getFullYear();
    const maxYear = range._max.data.getFullYear();
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

    res.json({
      success: true,
      data: { years }
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
    
    if (validatedData.tipo !== 'TRASFERIMENTO' && validatedData.fonteDestinazioneId) {
      throw new AppError('La fonte destinazione è valida solo per i trasferimenti', 400);
    }

    // Se è un trasferimento, la fonte destinazione è obbligatoria e deve essere diversa
    if (validatedData.tipo === 'TRASFERIMENTO') {
      if (!validatedData.fonteDestinazioneId) {
        throw new AppError('Fonte destinazione obbligatoria per il trasferimento', 400);
      }

      if (validatedData.fonteDestinazioneId === validatedData.fonteId) {
        throw new AppError('La fonte destinazione deve essere diversa dalla fonte origine', 400);
      }

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
      // Correggi il parsing della data: estrai la data (YYYY-MM-DD) dalla stringa ISO
      let dataTransazione: Date;
      if (validatedData.data) {
        const dataString = validatedData.data.split('T')[0]; // Prendi YYYY-MM-DD
        dataTransazione = new Date(dataString + 'T00:00:00Z'); // Crea data UTC
      } else {
        // Se non fornita, usa oggi in UTC
        const oggi = new Date();
        const dataString = oggi.toISOString().split('T')[0];
        dataTransazione = new Date(dataString + 'T00:00:00Z');
      }

      const transazione = await tx.transazione.create({
        data: {
          ...validatedData,
          utenteId: req.userId!,
          data: dataTransazione
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
