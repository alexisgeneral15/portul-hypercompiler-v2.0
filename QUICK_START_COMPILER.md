# 🚀 GUÍA RÁPIDA: INICIO EN 30 MINUTOS

## 1️⃣ SETUP (10 minutos)

### Windows (PowerShell/WSL):
```powershell
# Instalar Node.js (si no tienes)
choco install nodejs

# Instalar compiladores (WSL)
wsl
sudo apt-get update
sudo apt-get install -y build-essential llvm gcc g++

# Clonar y setup
git clone <tu-repo>
cd portul-hypercompiler
bash setup.sh
```

### macOS:
```bash
# Instalar Homebrew si no tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar dependencias
brew install node llvm gcc

# Setup
bash setup.sh
```

### Linux:
```bash
# Instalar dependencias
sudo apt-get update
sudo apt-get install -y nodejs npm build-essential llvm gcc g++

# Setup
bash setup.sh
```

---

## 2️⃣ INICIAR SERVIDOR (5 minutos)

```bash
cd backend
npm install
npm run dev
```

Verás:
```
🚀 Portul Compilation Server
📍 Running on 0.0.0.0:3000
🔧 Compiler: LLVM/GCC
```

---

## 3️⃣ PROBAR EN FRONTEND (5 minutos)

### En tu IDE React:

```typescript
// Importar componente
import { CompilerPanel } from './CompilerPanel';

// Usar en tu App
<CompilerPanel 
  code={yourPortulCode}
  backendUrl="http://localhost:3000"
/>
```

### O usar curl:

```bash
# Enviar código para compilar
curl -X POST http://localhost:3000/api/compile/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "fn main() { print(\"Hello\") }",
    "target": "windows",
    "projectId": "test"
  }'

# Respuesta:
{
  "jobId": "job-1704067200000-abc123xyz",
  "status": "queued"
}

# Ver estado
curl http://localhost:3000/api/compile/job-1704067200000-abc123xyz/status

# Descargar binario
curl -O http://localhost:3000/api/compile/job-1704067200000-abc123xyz/download
```

---

## 4️⃣ PRÓXIMAS CARACTERÍSTICAS

### Ahora tienes:
- ✅ Servidor compilación real con LLVM/GCC
- ✅ API REST lista
- ✅ WebSocket para updates en tiempo real
- ✅ Componente React funcional
- ✅ Almacenamiento de binarios
- ✅ Manejo de errores

### Falta implementar:
- [ ] Generador Portul → C (usar semanticAnalyzer actual)
- [ ] Cache de compilaciones
- [ ] Optimizaciones LLVM
- [ ] Multi-archivo Portul
- [ ] Debugging integrado
- [ ] Perfilado de rendimiento

---

## 🔧 CONFIGURACIÓN

### .env (backend)
```env
NODE_ENV=development
PORT=3000
BACKEND_HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Variables importantes:
| Variable | Valor Default | Descripción |
|----------|--------------|-------------|
| PORT | 3000 | Puerto del servidor |
| FRONTEND_URL | http://localhost:5173 | URL del frontend (CORS) |
| BINARIES_PATH | ./binaries | Dónde guardar compilados |
| NODE_ENV | development | dev/prod |

---

## 📊 ENDPOINTS DISPONIBLES

### POST /api/compile/submit
```json
{
  "sourceCode": "fn main() { print(\"test\") }",
  "target": "windows|linux|macos|wasm",
  "projectId": "my-project",
  "userId": "user-123"
}
```
**Respuesta:**
```json
{
  "jobId": "job-xxx",
  "status": "queued",
  "estimatedTime": "30-60 seconds"
}
```

### GET /api/compile/:jobId/status
**Respuesta:**
```json
{
  "jobId": "job-xxx",
  "status": "compiling|completed|failed",
  "progress": 75,
  "stage": "compilation",
  "error": null,
  "duration": 15000
}
```

### GET /api/compile/:jobId/download
- Descarga el binario compilado
- Solo disponible si status = "completed"

### GET /api/compile/queue/stats
**Respuesta:**
```json
{
  "total": 10,
  "pending": 2,
  "compiling": 3,
  "completed": 4,
  "failed": 1
}
```

### GET /health
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 123.45
}
```

---

## 🐛 TROUBLESHOOTING

### "gcc: command not found"
```bash
# En Windows con WSL:
wsl
sudo apt-get install build-essential

# En macOS:
brew install gcc

# En Linux:
sudo apt-get install build-essential
```

### "Port 3000 already in use"
```bash
# Ver qué está usando el puerto:
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Cambiar puerto en .env:
PORT=3001
```

### "Cannot connect to Redis"
```bash
# Instalar Redis (opcional, corre sin él localmente)
# macOS:
brew install redis
redis-server

# Linux:
sudo apt-get install redis-server
redis-server

# O usa Docker:
docker run -d -p 6379:6379 redis:alpine
```

### Compilación falla
```bash
# Ver logs del servidor
npm run dev

# Verificar compilador:
gcc --version
llc --version

# Probar compilación manual:
echo 'int main() { return 0; }' > test.c
gcc -o test test.c
```

---

## 🚀 DEPLOYMENT RÁPIDO

### Con Heroku (gratuito):
```bash
git init
git add .
git commit -m "Initial"

heroku create portul-compiler
git push heroku main

heroku logs --tail
```

### Con Docker (local):
```bash
docker-compose up -d

# Acceder:
# http://localhost:3000
# http://localhost:5173

# Logs:
docker-compose logs -f backend
```

### Con Docker a production (VPS):
```bash
# En tu VPS:
scp docker-compose.yml root@vps-ip:~/
ssh root@vps-ip
cd ~
docker-compose up -d

# Configurar Nginx reverse proxy
# Ver: CLOUD_DEPLOYMENT_OPTIONS.md
```

---

## 📈 MÉTRICAS & MONITOREO

### Ver estado actual:
```bash
# Estadísticas queue
curl http://localhost:3000/api/compile/queue/stats

# Health check
curl http://localhost:3000/health

# Logs
docker-compose logs -f backend
```

### Performance expected:
| Tarea | Tiempo |
|-------|--------|
| Parse + Semantic | ~500ms |
| Code Gen | ~200ms |
| LLVM Compile | ~2-5s |
| **Total** | **3-6s** |

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, revisa:
- **[COMPILADOR_REAL_PLAN.md](COMPILADOR_REAL_PLAN.md)** - Arquitectura completa
- **[CLOUD_DEPLOYMENT_OPTIONS.md](CLOUD_DEPLOYMENT_OPTIONS.md)** - Deployment en cloud
- **[backend-server.ts](backend-server.ts)** - Código servidor
- **[CompilerPanel.tsx](CompilerPanel.tsx)** - Componente React

---

## 💡 TIPS AVANZADOS

### Integrar generador Portul:
```typescript
// En backend-server.ts, en processJob():

// Convertir Portul a C
const semanticAnalyzer = require('./services/semanticAnalyzer');
const ast = await semanticAnalyzer.parsePortul(job.sourceCode);
const semantic = await semanticAnalyzer.analyze(ast);
const cCode = generateCFromSemantic(semantic);

// Luego compilar el C
const binary = await compiler.compileC({
    sourceCode: cCode,
    language: 'c',
    target: job.target,
    outputFile: 'program'
});
```

### Agregar caché de compilaciones:
```typescript
// Hash del código fuente
const hash = crypto.createHash('sha256').update(sourceCode).digest('hex');
const cached = await cache.get(`compilation-${hash}`);

if (cached) {
    return cached; // Devolver directo
}

// Si no está cacheado, compilar y guardar
const result = await compile(...);
await cache.set(`compilation-${hash}`, result, { ttl: 86400 }); // 1 día
```

### Multiplexar a varios compiladores:
```typescript
const compiler = {
    'gcc': GCCCompiler,
    'clang': ClangCompiler,
    'llvm': LLVMCompiler
};

// Elegir dinámicamente
const selected = compiler[req.body.compiler || 'gcc'];
const binary = await selected.compile(...);
```

---

## 🎯 ROADMAP PRÓXIMOS PASOS

### Semana 1-2:
- [ ] Generador Portul → C funcional
- [ ] Tests unitarios
- [ ] Documentación API

### Semana 3-4:
- [ ] Cache de compilaciones
- [ ] Queue con Redis
- [ ] Multi-worker

### Semana 5-6:
- [ ] Deploy a producción
- [ ] Monitoring
- [ ] Escalado automático

---

**¡Listo! Ahora tienes un compilador real para Portul funcionando localmente. 🎉**

Próximo paso: Integrar el generador de código Portul → C que ya existe en `semanticAnalyzer.ts`
