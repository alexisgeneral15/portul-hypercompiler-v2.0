import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage } from '../storage/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password requeridos' });
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: crypto.randomUUID(),
      email,
      name: name || email.split('@')[0],
      passwordHash,
      createdAt: new Date().toISOString()
    };

    await storage.saveUser(user.id, user);

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password requeridos' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/dev-login (para desarrollo)
authRouter.post('/dev-login', (req, res) => {
  try {
    const token = signToken({ 
      id: 'dev-user', 
      email: 'dev@portul.local', 
      name: 'Developer' 
    });
    res.json({
      token,
      user: { 
        id: 'dev-user', 
        email: 'dev@portul.local', 
        name: 'Developer' 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generating dev token' });
  }
});
