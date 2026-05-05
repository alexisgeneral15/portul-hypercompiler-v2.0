console.log('[Backend] Iniciando backend Portul...');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { compileRoute, statusRoute, downloadRoute, historyRoute } from './api/compile.js';
import { projectRouter } from './api/projects.js';
import { authRouter } from './api/auth.js';
import { healthRoute } from './api/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth, requireAuthOrDev } from './middleware/auth.js';

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
  'http://192.168.1.15:5173',
  'http://192.168.1.11:5173'
].filter(Boolean));

const isDev = NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Always allow requests from Electron (localhost) and in development
    if (isDev) return callback(null, true);
    if (!origin) return callback(null, true);
    // Electron file:// pages send Origin: null (opaque origin) — allow them
    if (origin === 'null') return callback(null, true);
    if (origin.startsWith('file://')) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true);
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
app.post('/api/compile', requireAuthOrDev, compileRoute);
app.post('/api/compile/submit', requireAuthOrDev, compileRoute);
app.get('/api/compile/:id', requireAuthOrDev, statusRoute);
app.get('/api/download/:id', requireAuthOrDev, downloadRoute);
app.get('/api/history', requireAuthOrDev, historyRoute);
app.use('/api/projects', requireAuth, projectRouter);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// HTTP Server para Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io'
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

  socket.on('generate-ia', ({ prompt, code }) => {
    console.log(`[Socket.IO] generate-ia recibido: ${socket.id}`);
    // Simulación: enviar chunks con pequeños delays
    let seq = 0;
    const tokens = ['Este', ' es', ' un', ' token', ' de', ' prueba'];

    tokens.forEach((token, idx) => {
      setTimeout(() => {
        socket.emit('stream_chunk', {
          token,
          seq: idx,
          done: idx === tokens.length - 1
        });
      }, 100 * (idx + 1));
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════════════╗\n║  Portul Compiler Backend v1.0                              ║\n║  Ambiente: ${NODE_ENV.toUpperCase().padEnd(40)}║\n║  Puerto: ${PORT.toString().padEnd(49)}║\n║  URL: http://localhost:${PORT}${' '.repeat(32)}║\n╚════════════════════════════════════════════════════════════╝\n  `);
});

process.on('exit', (code) => {
  console.log(`[Backend] Backend Portul finalizado con código ${code}`);
  server.close();
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando...');
  server.close(() => {
    process.exit(0);
  });
});
