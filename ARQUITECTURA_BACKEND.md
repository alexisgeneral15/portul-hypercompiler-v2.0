# 🏗️ Arquitectura Backend + Compilador Real para Portul

## 1. VISIÓN GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: React/Vite (IDE Web - YA EXISTE)                │
│  - Editor de código                                          │
│  - AI Aether (Análisis local)                               │
│  - UI con glass morphism                                     │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST API
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Node.js/Express (NUEVO)                           │
│  - API REST para compilación                                │
│  - Gestión de proyectos                                     │
│  - Queue de compilaciones                                   │
│  - Almacenamiento de binarios                               │
└────────────────┬────────────────────────────────────────────┘
                 │ Llama a compilador
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  COMPILADOR REAL: LLVM IR (NUEVO)                           │
│  - Recibe código Portul                                     │
│  - Genera LLVM IR                                           │
│  - Compila a código máquina (x86/x64)                       │
│  - Genera .exe para Windows                                 │
└─────────────────────────────────────────────────────────────┘
```

## 2. OPCIONES DE COMPILADOR

### Opción A: LLVM (Recomendado)
```
Ventajas:
✅ Compilador industrial, usado por Clang, Swift, Rust
✅ Genera código eficiente
✅ Soporta múltiples targets (Windows, Linux, macOS)
✅ Node.js bindings disponibles (node-llvm)

Desventajas:
❌ Instalación pesada (~500MB)
❌ Complejidad moderada

Stack: Node.js + LLVM + IR generado
```

### Opción B: GCC via Docker
```
Ventajas:
✅ Ligero de usar
✅ Portable

Stack: Node.js + Docker + GCC
```

### Opción C: AssemblyScript → WebAssembly
```
Ventajas:
✅ Corre en navegador (sin backend)
✅ Rápido

Desventajas:
❌ No genera .exe Windows real
❌ Limitado a WebAssembly

No recomendado para tu caso.
```

## 3. ARQUITECTURA RECOMENDADA

### Stack
```
Frontend:     React 18 + TypeScript + Vite (EXISTENTE)
Backend:      Node.js 20 + Express 4.x (NUEVO)
Compilador:   LLVM 17 (NUEVO)
Base Datos:   PostgreSQL (compilaciones históricas)
Storage:      AWS S3 o Local `/tmp/builds/` (NUEVO)
Deploy:       Docker + Docker Compose (NUEVO)
```

### Componentes Backend

#### 1. **API REST** (`backend/src/api/`)
```
POST   /api/compile              - Compilar código
GET    /api/compile/:id          - Estado de compilación
GET    /api/download/:id         - Descargar .exe
POST   /api/projects             - Crear proyecto
GET    /api/projects/:id         - Obtener proyecto
```

#### 2. **Servicio Compilador** (`backend/src/compiler/`)
```
- PortulParser: Parsea Portul → AST
- SemanticChecker: Valida tipos y variables
- IRGenerator: AST → LLVM IR
- CodeGenerator: LLVM IR → Objeto nativo
- Linker: Enlaza con librerías Windows
```

#### 3. **Queue de Compilaciones** (`backend/src/queue/`)
```
Usa Bull (Redis) para:
- Encolar compilaciones
- Ejecutar en paralelo (4-8 workers)
- Reintentos automáticos
- Historial de compilaciones
```

#### 4. **Almacenamiento** (`backend/src/storage/`)
```
/tmp/builds/
├── <compilation-id>/
│   ├── input.portul
│   ├── output.exe
│   ├── ir.ll
│   ├── asm.s
│   └── log.txt
```

## 4. FLUJO DE COMPILACIÓN

```
1. Frontend envía código
   POST /api/compile
   {
     code: "class Main { ... }",
     target: "windows-x64"
   }

2. Backend crea Job
   - Guarda código en /tmp/builds/<id>/
   - Enqueue en Redis
   - Retorna { id, status: "queued" }

3. Worker procesa Job
   a) Parse: Portul → AST
   b) Check: Validación semántica
   c) IR Gen: AST → LLVM IR
   d) Compile: IR → .obj
   e) Link: .obj + librerías → .exe

4. Frontend polling
   GET /api/compile/:id
   Retorna { status: "compiled", downloadUrl: "..." }

5. Descarga
   GET /api/download/:id
   → Descarga binary.exe
```

## 5. CÓDIGO INICIAL - BACKEND

### `backend/package.json`
```json
{
  "name": "portul-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node src/index.js",
    "prod": "NODE_ENV=production node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "bull": "^4.14.1",
    "redis": "^4.6.12",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### `backend/src/index.js`
```javascript
import express from 'express';
import cors from 'cors';
import { compileRoute, statusRoute, downloadRoute } from './api/compile.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Routes
app.post('/api/compile', compileRoute);
app.get('/api/compile/:id', statusRoute);
app.get('/api/download/:id', downloadRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});
```

### `backend/src/api/compile.js`
```javascript
import { v4 as uuid } from 'uuid';
import { compilationQueue } from '../queue/index.js';
import { storage } from '../storage/index.js';

export async function compileRoute(req, res) {
  const { code, target = 'windows-x64' } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'code es requerido' });
  }

  const compilationId = uuid();
  
  try {
    // Guarda código
    await storage.saveCode(compilationId, code);
    
    // Enqueue
    const job = await compilationQueue.add(
      { compilationId, code, target },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );

    res.json({
      id: compilationId,
      status: 'queued',
      pollUrl: `/api/compile/${compilationId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function statusRoute(req, res) {
  const { id } = req.params;
  const result = await storage.getCompilation(id);
  
  if (!result) {
    return res.status(404).json({ error: 'No encontrado' });
  }
  
  res.json(result);
}

export async function downloadRoute(req, res) {
  const { id } = req.params;
  const file = await storage.getExe(id);
  
  if (!file) {
    return res.status(404).json({ error: 'No compilado' });
  }
  
  res.download(file, 'program.exe');
}
```

## 6. INTEGRACIÓN CON PORTUL ACTUAL

### Cambios en Frontend
```typescript
// services/compilerClient.ts (NUEVO)
export async function compileToExe(code: string): Promise<CompilationResult> {
  const response = await fetch('http://localhost:3001/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, target: 'windows-x64' })
  });
  
  const { id, status } = await response.json();
  
  // Polling
  while (true) {
    const result = await fetch(`http://localhost:3001/api/compile/${id}`);
    const data = await result.json();
    
    if (data.status === 'compiled') {
      return {
        success: true,
        exeUrl: `/api/download/${id}`,
        ir: data.ir,
        asm: data.asm
      };
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}
```

### Cambios en UI
```typescript
// components/BuildPanel.tsx
const handleBuildExe = async () => {
  setIsBuilding(true);
  try {
    const result = await compileToExe(code);
    setExeUrl(result.exeUrl);
    setMessage('✅ .exe compilado exitosamente!');
  } catch (error) {
    setMessage(`❌ Error: ${error.message}`);
  } finally {
    setIsBuilding(false);
  }
};
```

## 7. INSTALACIÓN Y SETUP

### Paso 1: Instalar LLVM
```bash
# Windows (Chocolatey)
choco install llvm

# macOS
brew install llvm

# Linux (Ubuntu)
sudo apt-get install llvm-17 clang
```

### Paso 2: Crear Backend
```bash
mkdir backend
cd backend
npm init -y
npm install express bull redis cors dotenv uuid
```

### Paso 3: Crear Compilador
```bash
# Generar LLVM IR desde AST Portul
# Usar node-llvm bindings
npm install llvm-node
```

### Paso 4: Docker
```dockerfile
# backend/Dockerfile
FROM node:20-alpine

RUN apk add --no-cache llvm17 clang

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY src ./src

CMD ["npm", "start"]
```

### Paso 5: Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_BACKEND_URL=http://localhost:3001
```

## 8. TIMELINE DE IMPLEMENTACIÓN

| Fase | Tiempo | Tarea |
|------|--------|-------|
| 1 | 1 día | Setup Node.js + Express |
| 2 | 2 días | Generar LLVM IR desde Portul AST |
| 3 | 2 días | Linkaje y generación de .exe |
| 4 | 1 día | API REST y Queue |
| 5 | 1 día | Integración Frontend-Backend |
| 6 | 1 día | Docker y deploy |

**Total: 1 semana**

## 9. ALTERNATIVAS RÁPIDAS

### Plan B: Usar Go para Compilador
```
Ventajas:
✅ Más rápido que Node.js
✅ Compilación rápida
✅ Binary pequeño

Stack: Go + Express (Node.js frontend) + C FFI
```

### Plan C: Usar Serverless (AWS Lambda)
```
Ventajas:
✅ Sin servidor
✅ Escalable automáticamente

Desventajas:
❌ Timeout de 15 min (insuficiente para builds grandes)

Recomendación: Para compilaciones rápidas (<30s)
```

## 10. RECOMENDACIÓN FINAL

**Para Portul, recomiendo:**

```
✅ Node.js + Express (backend)
✅ LLVM 17 (compilador)
✅ Bull + Redis (queue)
✅ Docker (deploy)
✅ Generar LLVM IR desde AST Portul actual

Razones:
- Node.js ya lo usas (aprendizaje mínimo)
- LLVM es industrial-grade
- Portul AST existente reutilizable
- Deploy fácil con Docker
```

---

**Próximo paso:** ¿Quieres que cree los archivos del backend listo para usar?
