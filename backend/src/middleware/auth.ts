import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token di accesso richiesto' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Verifica che l'utente esista ancora
    const user = await prisma.utente.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        nome: true, 
        cognome: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Utente non valido' 
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      error: 'Token non valido' 
    });
  }
};
