# Portul Hypercompiler - Arquitectura Completa

## 📋 Descripción General

El Portul Hypercompiler es un sistema completo de compilación para el lenguaje Portul, con arquitectura de tres capas:

1. **Frontend**: IDE web interactivo (React + TypeScript + Vite)
2. **Backend**: Servidor de compilación Node.js (Express)
3. **Compilador Real**: LLVM 17 con cadena de compilación completa

```
┌─────────────────────────────────────────────────────────────┐
│                    Portul IDE Web                            │
│                  (React + TypeScript)                        │
│          localhost:5173 (desarrollo) o :3000 (prod)         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Compilation Server                      │
│                 (Node.js + Express)                          │
│                   localhost:3001                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Lexer        │→ │ Parser       │→ │ AST          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│       ↓                    ↓                    ↓             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Symbol Table │→ │ Type Check   │→ │ IR Generator │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│       ↓                    ↓                    ↓             │
│  ┌─────────────────────────────────────────────┐            │
│  │         LLVM IR (Intermediate Representation)            │
│  └────────────────────┬────────────────────────┘            │
│                       ↓                                       │
│  ┌─────────────────────────────────────────────┐            │
│  │   LLVM Compiler: llc (IR → Assembly)        │            │
│  └────────────────────┬────────────────────────┘            │
│                       ↓                                       │
│  ┌─────────────────────────────────────────────┐            │
│  │   Assembler: ml64/as (ASM → Object Code)    │            │
│  └────────────────────┬────────────────────────┘            │
│                       ↓                                       │
│  ┌─────────────────────────────────────────────┐            │
│  │   Linker: link/ld (Objeto → Ejecutable)     │            │
│  └────────────────────┬────────────────────────┘            │
│                       ↓                                       │
│  ┌─────────────────────────────────────────────┐            │
│  │     Windows PE Executable (.exe)            │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
          ↓
  ┌──────────────────┐
  │  Archivo .exe    │
  │  Descargable     │
  │  En Windows      │
  └──────────────────┘
```

## 🏗️ Arquitectura por Componentes

### Frontend (IDE)

**Ubicación**: `/`

**Tecnologías**:
- React 18
- TypeScript
- Vite (bundler)
- Glass morphism UI

**Componentes principales**:
```
App.tsx (Orquestador principal)
├── EditorTabs.tsx (Editor de código)
├── AIAssistantPanel.tsx (Asistente IA Aether)
├── CompilationPanel.tsx (Nuevo: Control de compilación)
└── OutputConsole.tsx (Resultado + descarga)
```

**Conexión con Backend**:
```typescript
// src/services/compilerClient.ts
const compilerService = CompilerService.getInstance();

// Uso
const { blob, compilationId } = await compilerService.compileAndDownload({
  code: editor.getValue(),
  target: 'windows-x64'
});
```

### Backend (Servidor de Compilación)

**Ubicación**: `/backend`

**Tecnologías**:
- Node.js 20
- Express.js
- Bull (job queue)
- Redis (job storage)

**Estructura de carpetas**:
```
backend/
├── src/
│   ├── index.js (Servidor Express)
│   ├── api/
│   │   ├── compile.js (POST /api/compile, GET /api/compile/:id)
│   │   ├── health.js (GET /health)
│   │   └── projects.js (Projects API)
│   ├── compiler/
│   │   ├── index.js (Clase PortulCompiler)
│   │   ├── lexer.js (Tokenizer)
│   │   ├── parser.js (AST builder)
│   │   ├── semanticAnalyzer.js (Type checking)
│   │   ├── irGenerator.js (LLVM IR)
│   │   └── llvmCompiler.js (LLVM wrapper)
│   ├── queue/
│   │   └── index.js (Bull processor)
│   ├── storage/
│   │   └── index.js (File storage)
│   └── middleware/
│       └── errorHandler.js (Error middleware)
├── package.json
├── .env.example
└── README.md
```

**API REST**:

```
POST /api/compile
  Body: { code: string, target: 'windows-x64', projectId?: string }
  Response: { id: string, status: 'queued', pollUrl: string }

GET /api/compile/:id
  Response: { id, status, progress, exeSize, error?, completedAt? }

GET /api/compile/:id/download
  Response: Binary .exe file

GET /api/compilations/history
  Response: { compilations: CompilationStatus[] }

GET /health
  Response: { status: 'healthy', uptime, version }
```

### Compilador (LLVM)

**Cadena de compilación**:

```
Código Portul
     ↓
   LEXER (lexer.js)
   - Tokeniza entrada
   - Recogniza palabras clave: si, para, funcion, etc.
   - Maneja literales: números, strings, booleanos
     ↓
   PARSER (parser.js)
   - Construye AST (Abstract Syntax Tree)
   - Precedencia de operadores
   - Estructura de sentencias
     ↓
   SEMANTIC ANALYZER (semanticAnalyzer.js)
   - Table de símbolos
   - Type checking
   - Detección de variables no definidas
   - Análisis de flujo de control
     ↓
   IR GENERATOR (irGenerator.js)
   - Convierte AST a LLVM IR
   - Manejo de tipos Portul (num, txt, obj, ary, ptr)
   - Generación de bloques básicos
   - Manejo de funciones y clases
     ↓
   LLVM IR (.ll file)
   
; Ejemplo IR generado
define i32 @main() {
entry:
  %add = add i32 5, 3
  ret i32 %add
}
     ↓
   LLVM COMPILER (llc command)
   - Compila IR a assembly x86-64
   - Optimizaciones
   - Output: .s file
     ↓
   ASSEMBLER (ml64 o as)
   - Convierte assembly a object code
   - Output: .obj file
     ↓
   LINKER (link.exe o ld)
   - Linkea object files a ejecutable
   - Resuelve símbolos
   - Output: .exe file
     ↓
   Windows PE Executable
   - Headers PE válidos
   - Secciones: .text, .data, .reloc
   - Entry point: main()
```

## 🛠️ Instalación y Setup

### Requisitos

- Node.js 18+ 
- npm o yarn
- LLVM 17 (opcional, con fallback)
- Redis (para queue, opcional en dev)
- Windows 10+ (para ml64) o Linux (para as/ld)

### Backend Setup

```bash
# 1. Navega al directorio backend
cd backend

# 2. Instala dependencias
npm install

# 3. Configura variables de entorno
cp .env.example .env
# Edita .env según tu setup

# 4. Inicia el servidor (desarrollo)
npm run dev

# O producción
npm start
```

**Variables de entorno (.env)**:
```
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000,http://localhost:5173
REDIS_URL=redis://127.0.0.1:6379
STORAGE_DIR=./builds
LLVM_PATH=/usr/bin
LOG_LEVEL=debug
```

### Frontend Setup

```bash
# En el directorio raíz

# 1. Instala dependencias
npm install

# 2. Crea .env.local
echo 'VITE_BACKEND_URL=http://localhost:3001' > .env.local

# 3. Inicia en desarrollo
npm run dev

# Frontend estará en http://localhost:5173
```

### LLVM Setup (Opcional)

**Windows**:
```powershell
# Descarga LLVM desde https://releases.llvm.org
# O usa package manager
choco install llvm
```

**Linux**:
```bash
sudo apt-get install llvm-17 llvm-17-tools
```

**macOS**:
```bash
brew install llvm@17
```

## 📝 Ejemplo de Compilación Completa

### 1. Código Portul en Frontend
```portul
funcion suma(num a, num b) -> num {
  regresa a + b;
}

funcion principal() {
  num resultado = suma(5, 3);
  imprime resultado;
}
```

### 2. Request Frontend → Backend
```typescript
const result = await compilerService.compile({
  code: `funcion suma(num a, num b) -> num { regresa a + b; }`,
  target: 'windows-x64'
});

console.log(result.id); // "abc123def456"
```

### 3. Backend Processing

**Lexer tokeniza:**
```
TOKEN(KEYWORD, 'funcion')
TOKEN(IDENTIFIER, 'suma')
TOKEN(LPAREN, '(')
TOKEN(KEYWORD, 'num')
TOKEN(IDENTIFIER, 'a')
...
```

**Parser construye AST:**
```json
{
  "type": "Program",
  "statements": [{
    "type": "FunctionDeclaration",
    "name": "suma",
    "params": [
      {"name": "a", "type": "num"},
      {"name": "b", "type": "num"}
    ],
    "returnType": "num",
    "body": [...]
  }]
}
```

**Semantic analyzer valida:**
```
✓ Función 'suma' registrada
✓ Parámetros 'a', 'b' de tipo 'num'
✓ Return de tipo 'num' válido
✓ No hay errores
```

**IR generator produce:**
```llvm
define i32 @suma(i32 %a, i32 %b) {
entry:
  %add = add i32 %a, %b
  ret i32 %add
}
```

**LLVM toolchain compila:**
```bash
# IR → Assembly
llc -march=x86-64 input.ll -o output.s

# Assembly → Object
ml64 /c /Fo output.obj output.s

# Object → Executable
link /out:output.exe output.obj
```

### 4. Frontend descarga .exe
```typescript
const { blob } = await compilerService.downloadExecutable(result.id);
// Descarga suma.exe a la computadora del usuario
```

## 🔄 Flujo de Compilación en Paralelo

El backend usa **Bull + Redis** para procesar múltiples compilaciones:

```
Frontend          Backend           Queue              Worker Pool
   │                 │                 │                    │
   ├─ POST compile ──→ │                 │                    │
   │                 ├─ Enqueue job ────→ │                    │
   │                 ├─ Return ID       │ Job #1 ─────────→ Worker 1
   │                 │                 │ Job #2 ─────────→ Worker 2
   │ (poll /status)  │ GET status   ←─── │ Job #3 ─────────→ Worker 3
   │←─ In progress ──┤                 │ Job #4 ─────────→ Worker 4
   │                 │ (processing...)  │ Job #5 ─────────→ Worker 5
   │ (poll /status)  │ GET status   ←─── │ ...
   │←─ 50% progress ─┤                 │                    │
   │                 │                 │                    │
   │ (poll /status)  │ GET status   ←─── Job #1 finished
   │←─ Compiled! ────┤                 │                    │
   │                 │ File saved     │                    │
   ├─ Download ──────→ │                 │                    │
   │←─ .exe blob ─────┤                 │                    │
```

**Características**:
- ✅ 8 workers paralelos por defecto
- ✅ Retry automático (3 intentos)
- ✅ Timeout configurable (2 minutos default)
- ✅ Persistencia en Redis
- ✅ Logs de cada job

## 📊 Métricas y Monitoreo

### Endpoints de Monitoreo

```
GET /health
  - Status del servidor
  - Uptime
  - Versión

GET /api/compilations/history
  - Últimas 20 compilaciones
  - Estado de cada una
```

### Logs del Backend

```
[2024-01-15T10:30:45.123Z] POST /api/compile
[Queue] Compilación encolada: abc123def456
[Worker] Compilando abc123def456...
[Worker] Lexer: 42 tokens
[Worker] Parser: AST válido
[Worker] Semantic: 0 errores
[Worker] IR generated: 1250 bytes
[Worker] Assembly: output.s
[Worker] Object: output.obj
[LLVM] Executable: output.exe (2048 bytes)
[Queue] Compilación completada: abc123def456
```

## 🐳 Docker Deployment

### Dockerfile Backend

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001
CMD ["node", "src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "5173:5173"
    environment:
      VITE_BACKEND_URL: http://backend:3001

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 🚀 Despliegue a Producción

### AWS EC2

```bash
# 1. Launch Ubuntu 22.04 instance
# 2. SSH to instance

# 3. Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm redis-server llvm-17

# 4. Clone repo
git clone https://github.com/tu-org/portul-hypercompiler
cd portul-hypercompiler

# 5. Build frontend
npm install
npm run build

# 6. Setup backend
cd backend
npm install
cp .env.example .env
nano .env  # Edita configuración

# 7. Start services
sudo systemctl start redis-server
node src/index.js

# 8. Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name "portul-backend"
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name portul.example.com;

    # Frontend (SPA)
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
    }
}
```

## 🎓 Tutoriales

### Tutorial 1: Agregar Soporte para Nuevo Tipo de Dato

1. **Actualiza el Lexer** (`lexer.js`):
   ```javascript
   case 'lista': return TOKEN_TYPES.KEYWORD;
   ```

2. **Actualiza el Parser** (`parser.js`):
   ```javascript
   case 'lista':
     // Parse array type
     this.consume('LBRACKET');
     const elementType = this.type();
     this.consume('RBRACKET');
     return 'lista<' + elementType + '>';
   ```

3. **Actualiza IR Generator** (`irGenerator.js`):
   ```javascript
   case 'lista':
     return '[100 x i32]*'; // Array de hasta 100 i32
   ```

### Tutorial 2: Agregar Nueva Instrucción Nativa

1. **Define en Lexer**
2. **Parse en Parser**
3. **Type-check en Semantic Analyzer**
4. **Genera IR en IRGenerator**
5. **Test end-to-end**

## ⚠️ Limitaciones Actuales

1. **Portul tiene tipos limitados**: num, txt, obj, ary, ptr
2. **Sin genéricos**: Todas las funciones monomorpher
3. **Sin módulos**: Un solo archivo de compilación
4. **Sin debugging**: No hay breakpoints/step-through
5. **Sin optimizaciones LLVM**: Solo O0 (sin optimizar)

## 📚 Referencias

- [LLVM Language Reference](https://llvm.org/docs/LangRef/)
- [LLVM IR Syntax](https://llvm.org/docs/LangRef/#ir-structure)
- [Express.js Docs](https://expressjs.com/)
- [Bull Queue Docs](https://docs.bullmq.io/)

## 📄 Licencia

MIT - Ver LICENSE

## 👨‍💻 Desarrollo

Para contribuir:

1. Fork el repo
2. Crea una rama: `git checkout -b feature/tu-feature`
3. Commit cambios: `git commit -m 'Add tu-feature'`
4. Push: `git push origin feature/tu-feature`
5. Crea Pull Request

---

**Portul Hypercompiler © 2024** - Compilador de lenguaje Portul a Windows .exe
