import { Router } from 'express';

const router = Router();

// Route placeholder per l'autenticazione
router.post('/login', async (req, res) => {
  res.json({
    success: true,
    message: 'Autenticazione non ancora implementata'
  });
});

router.post('/register', async (req, res) => {
  res.json({
    success: true,
    message: 'Registrazione non ancora implementata'
  });
});

export default router;
