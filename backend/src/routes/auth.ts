import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Schema di validazione
const registrationSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
  nome: z.string().min(1, 'Nome richiesto'),
  cognome: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta')
});

// POST /api/auth/register - Registrazione
router.post('/register', async (req, res) => {
  try {
    const validatedData = registrationSchema.parse(req.body);
    
    // Verifica se l'utente esiste già
    const existingUser = await prisma.utente.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email già registrata' 
      });
    }

    // Hash della password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

    // Crea l'utente
    const user = await prisma.utente.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        nome: validatedData.nome,
        cognome: validatedData.cognome || ''
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        createdAt: true
      }
    });

    // Genera token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configurato');
    }
    
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret
    );

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      user,
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dati non validi', 
        details: error.errors 
      });
    }
    console.error('Errore registrazione:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore interno del server' 
    });
  }
});

// POST /api/auth/login - Login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Trova l'utente
    const user = await prisma.utente.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenziali non valide' 
      });
    }

    // Verifica la password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenziali non valide' 
      });
    }

    // Genera token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configurato');
    }
    
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret
    );

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dati non validi', 
        details: error.errors 
      });
    }
    console.error('Errore login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore interno del server' 
    });
  }
});

// GET /api/auth/me - Verifica token
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ 
    success: true,
    message: 'Logout effettuato con successo' 
  });
});

export default router;
