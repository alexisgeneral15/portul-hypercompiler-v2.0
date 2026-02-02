# Portul Backend - Servidor de Compilación

Backend Node.js que compila código Portul a ejecutables Windows usando LLVM.

## 🚀 Quick Start

### Instalación

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend estará en `http://localhost:3001`

### Estructura

```
backend/
├── src/
│   ├── index.js              # Servidor Express
│   ├── api/
│   │   ├── compile.js        # Rutas de compilación
│   │   ├── health.js         # Health check
│   │   └── projects.js       # Gestión de proyectos
│   ├── compiler/
│   │   ├── index.js          # Orquestador de compilación
│   │   ├── lexer.js          # Tokenizer
│   │   ├── parser.js         # AST builder
│   │   ├── semanticAnalyzer.js
│   │   ├── irGenerator.js    # LLVM IR generator
│   │   └── llvmCompiler.js   # LLVM wrapper
│   ├── queue/
│   │   └── index.js          # Bull job processor
│   ├── storage/
│   │   └── index.js          # File storage
│   └── middleware/
│       └── errorHandler.js   # Error handling
├── package.json
├── .env.example
└── README.md
```

## 📡 API Endpoints

### Compilar Código

```bash
POST /api/compile
Content-Type: application/json

{
  "code": "funcion prueba(num x) { regresa x + 1; }",
  "target": "windows-x64",
  "projectId": "optional-project-id"
}

Response:
{
  "id": "abc123def456",
  "status": "queued",
  "message": "Compilación encolada",
  "pollUrl": "/api/compile/abc123def456",
  "estimatedTime": "30-60 segundos"
}
```

### Obtener Estado

```bash
GET /api/compile/:id

Response:
{
  "id": "abc123def456",
  "status": "compiled|compiling|failed|queued",
  "progress": 50,
  "createdAt": "2024-01-15T10:30:45.123Z",
  "completedAt": "2024-01-15T10:31:15.456Z",
  "exeSize": 2048,
  "error": null
}
```

### Descargar Ejecutable

```bash
GET /api/compile/:id/download

Response: Binary .exe file
```

### Historial de Compilaciones

```bash
GET /api/compilations/history

Response:
{
  "compilations": [
    { "id": "abc123", "status": "compiled", ... },
    { "id": "def456", "status": "compiled", ... }
  ]
}
```

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0"
}
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000,http://localhost:5173

# Redis (para queue en producción)
REDIS_URL=redis://127.0.0.1:6379

# Storage
STORAGE_DIR=./builds

# LLVM
LLVM_PATH=/usr/bin
LLVM_VERSION=17

# Logging
LOG_LEVEL=debug

# Build
BUILD_TIMEOUT=120000
MAX_BUILD_SIZE=50000000
```

## 🔧 Compilación Paso a Paso

### 1. Lexer (Tokenización)

Entrada: `funcion suma(num a, num b) { regresa a + b; }`

Salida: Tokens
```javascript
[
  { type: 'KEYWORD', value: 'funcion' },
  { type: 'IDENTIFIER', value: 'suma' },
  { type: 'LPAREN', value: '(' },
  ...
]
```

### 2. Parser (AST)

Entrada: Tokens

Salida: Abstract Syntax Tree
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
    "body": [...]
  }]
}
```

### 3. Semantic Analyzer (Validación)

- Comprueba variables definidas
- Type checking
- Detección de errores de flujo
- Symbol table

### 4. IR Generator (LLVM)

Genera código LLVM IR intermedio:
```llvm
define i32 @suma(i32 %a, i32 %b) {
entry:
  %add = add i32 %a, %b
  ret i32 %add
}
```

### 5. LLVM Toolchain

```bash
# IR → Assembly x86-64
llc -march=x86-64 input.ll -o output.s

# Assembly → Object file
ml64 /c /Fo output.obj output.s  # Windows
as -o output.obj output.s        # Linux

# Object → Executable
link /out:output.exe output.obj  # Windows
ld -o output output.obj          # Linux
```

### 6. Entrega

Archivo .exe descargable con 2KB minimo (PE válido)

## 🎯 Características

- ✅ Compilación en paralelo (8 workers)
- ✅ Job queue con Bull + Redis
- ✅ Timeout y retry automático
- ✅ Almacenamiento de artifacts
- ✅ Health checks
- ✅ Logging detallado
- ✅ CORS configurado
- ✅ Error handling robusto

## 📊 Monitoreo

### Logs del Backend

```
[2024-01-15T10:30:45] POST /api/compile
[Queue] Compilación encolada: abc123
[Worker] Compilando abc123...
[Worker] Lexer: 42 tokens
[Worker] Parser: AST válido  
[Worker] Semantic: 0 errores
[Worker] IR: 1250 bytes
[Worker] Assembly: output.s
[Worker] Linker: output.exe (2048 bytes)
[Queue] Compilada: abc123
```

### Métricas

```bash
# Ver estado de jobs en Redis
redis-cli
> KEYS bull:portul-compilations:*

# Ver logs de servidor
tail -f nohup.out
```

## 🐳 Docker

### Build

```bash
docker build -t portul-backend:latest .
```

### Run

```bash
docker run -d \
  -p 3001:3001 \
  -e REDIS_URL=redis://redis:6379 \
  --name portul-backend \
  portul-backend:latest
```

### Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testing

```bash
# Compilar un programa simple
curl -X POST http://localhost:3001/api/compile \
  -H "Content-Type: application/json" \
  -d '{"code":"funcion main(){regresa 0;}"}'

# Obtener estado
curl http://localhost:3001/api/compile/{compilationId}

# Descargar
curl http://localhost:3001/api/compile/{compilationId}/download > output.exe
```

## 🔗 Lenguaje Portul

### Tipos Soportados

- `num` - Número entero (i32)
- `txt` - String (i8*)
- `obj` - Objeto genérico (i8*)
- `ary` - Array (i8*)
- `ptr` - Puntero (i8*)

### Keywords

```portul
si           // if
si_no        // else
para         // for
mientras     // while
funcion      // function
clase        // class
nuevo        // new
regresa      // return
verdadero    // true
falso        // false
```

### Ejemplo

```portul
funcion factorial(num n) -> num {
  si (n <= 1) {
    regresa 1;
  }
  regresa n * factorial(n - 1);
}

funcion main() {
  num resultado = factorial(5);
  regresa resultado;
}
```

## 📈 Performance

- **Tiempo de compilación**: 2-5 segundos por programa típico
- **Throughput**: 8 compilaciones paralelas
- **Tamaño mínimo exe**: 2KB (PE válido)
- **Timeout**: 2 minutos por compilación

## 🐛 Troubleshooting

### Backend no responde

```bash
# Verificar que está corriendo
curl http://localhost:3001/health

# Ver logs
npm run dev  # Ver consola
```

### Redis no conecta

```bash
# Verificar Redis
redis-cli ping
# Debería responder: PONG

# Si no está instalado:
# Windows: choco install redis
# Linux: sudo apt install redis-server
```

### LLVM no encontrado

- Sistema fallback: Crea PE mínimo válido
- Opcional: Instalar LLVM 17
  ```bash
  # Windows
  choco install llvm
  
  # Linux
  sudo apt install llvm-17
  
  # macOS
  brew install llvm@17
  ```

### Permisos de escritura

```bash
# Asegurar que /backend/builds/ es escribible
chmod 755 builds/

# En Windows: Click derecho > Properties > Security > Edit
```

## 📚 Documentación Completa

Ver `ARQUITECTURA_COMPLETA.md` para:
- Arquitectura del sistema
- Diagramas de flujo
- Ejemplos de compilación end-to-end
- Deployment a producción
- Tutoriales avanzados

## 📄 Licencia

MIT

---

**Portul Backend © 2024**
