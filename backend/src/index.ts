import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import delle route
import fontiRoutes from './routes/fonti.js';
import transazioniRoutes from './routes/transazioni.js';
import authRoutes from './routes/auth.js';

// Import dei middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Carica le variabili d'ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting - più permissivo in sviluppo
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 richieste al minuto
  message: 'Troppe richieste da questo IP, riprova più tardi.',
  skip: (req) => {
    // Salta il rate limiting per l'health check in sviluppo
    if (process.env.NODE_ENV === 'development' && req.path === '/health') {
      return true;
    }
    return false;
  },
});

// Middleware globali
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fonti', fontiRoutes);
app.use('/api/transazioni', transazioniRoutes);

// Middleware per errori
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione su http://localhost:${PORT}`);
  console.log(`📊 Health check disponibile su http://localhost:${PORT}/health`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
