import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { compileRoute, statusRoute, downloadRoute, historyRoute } from './api/compile.js';
import { projectRouter } from './api/projects.js';
import { authRouter } from './api/auth.js';
import { healthRoute } from './api/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middlewares de seguridad y performance
app.use(helmet());
app.use(compression());
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.1.15:5173'
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', healthRoute);

// Auth
app.use('/api/auth', authRouter);

// API Routes
app.post('/api/compile', requireAuth, compileRoute);
app.get('/api/compile/:id', requireAuth, statusRoute);
app.get('/api/download/:id', requireAuth, downloadRoute);
app.get('/api/history', requireAuth, historyRoute);
app.use('/api/projects', requireAuth, projectRouter);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Portul Compiler Backend v1.0                              ║
║  Ambiente: ${NODE_ENV.toUpperCase().padEnd(40)}║
║  Puerto: ${PORT.toString().padEnd(49)}║
║  URL: http://localhost:${PORT}${' '.repeat(32)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando...');
  process.exit(0);
});
