# 🚀 Portul Hypercompiler - Referencia Rápida

## ⚡ 5 Minutos para Empezar

### Windows
```bash
# 1. Doble-click quickstart.bat
# Eso es todo - se instala todo automáticamente

# Luego en 2 terminales diferentes:
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
npm run dev

# Abre: http://localhost:5173
```

### Linux/macOS
```bash
# 1. Ejecuta setup
bash quickstart.sh

# 2. Terminal 1: Backend
cd backend && npm run dev

# 3. Terminal 2: Frontend  
npm run dev

# 4. Abre navegador
open http://localhost:5173
```

## 📝 Compilar tu Primer Programa

### 1. Escribe código Portul
```portul
funcion suma(num a, num b) -> num {
  regresa a + b;
}

funcion main() {
  num resultado = suma(10, 20);
  regresa resultado;
}
```

### 2. Haz click en "Compilar"

### 3. Espera (2-5 segundos)

### 4. Descarga .exe

### 5. ¡Ejecútalo en Windows!

## 📡 API Reference

### Compilar
```bash
POST /api/compile
{
  "code": "funcion...",
  "target": "windows-x64"
}

← { "id": "abc123", "status": "queued" }
```

### Estado
```bash
GET /api/compile/abc123

← { "id": "abc123", "status": "compiled", "progress": 100 }
```

### Descargar
```bash
GET /api/compile/abc123/download

← [Binary .exe file]
```

### Health
```bash
GET /health

← { "status": "healthy", "uptime": 3600 }
```

## 🎯 Lenguaje Portul - Sintaxis

### Tipos
```portul
num      // Número (32-bit)
txt      // String/Texto
obj      // Objeto genérico
ary      // Array
ptr      // Puntero
```

### Variables
```portul
num x = 42;
txt mensaje = "Hola";
```

### Funciones
```portul
funcion nombre(num param1, txt param2) -> num {
  regresa 0;
}
```

### Control de Flujo
```portul
si (x > 10) {
  // ...
} si_no {
  // ...
}

para (num i = 0; i < 10; i = i + 1) {
  // ...
}

mientras (verdadero) {
  // ...
}
```

### Clases
```portul
clase Persona {
  txt nombre;
  num edad;
  
  funcion saludar() {
    // ...
  }
}
```

## 🔧 Configuración

### Backend (.env)
```
NODE_ENV=development
PORT=3001
REDIS_URL=redis://127.0.0.1:6379
STORAGE_DIR=./builds
```

### Frontend (.env.local)
```
VITE_BACKEND_URL=http://localhost:3001
```

## 📂 Estructura Proyecto

```
.
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── services/           # Lógica
│   └── index.tsx
├── backend/                # Backend Node.js
│   ├── src/
│   │   ├── api/            # Rutas REST
│   │   ├── compiler/       # Compilador
│   │   ├── queue/          # Job queue
│   │   └── storage/        # Almacenamiento
│   └── package.json
└── components/             # Componentes adicionales
```

## 🐛 Troubleshooting

### "Backend desconectado"
```bash
# Verificar que backend está corriendo
http://localhost:3001/health

# Si no responde:
cd backend
npm run dev
```

### "Redis not available"
```bash
# Optional - para desarrollo sin queue:
# Edita backend/.env:
# REDIS_URL=mock://localhost:6379
```

### "LLVM not found"
```bash
# Optional - fallback automático
# El sistema genera un PE válido sin LLVM
```

### Limpiar builds
```bash
rm -rf backend/builds/*
```

## ⚙️ Desarrollo

### Agregar nueva funcionalidad al compilador

1. **Lexer** (`backend/src/compiler/lexer.js`)
   ```javascript
   // Agregar nuevo token type
   const TOKEN_TYPES = { ..., NEWTOKEN: 'NEWTOKEN' }
   ```

2. **Parser** (`backend/src/compiler/parser.js`)
   ```javascript
   // Agregar parsing logic
   statement() {
     if (this.match('KEYWORD', 'newkeyword')) {
       return this.parseNewFeature();
     }
   }
   ```

3. **Semantic** (`backend/src/compiler/semanticAnalyzer.js`)
   ```javascript
   // Agregar validación
   analyzeNewFeature(feature) {
     // type checking, etc.
   }
   ```

4. **IR** (`backend/src/compiler/irGenerator.js`)
   ```javascript
   // Generar LLVM IR
   processNewFeature(feature) {
     this.ir.push(`; Nueva feature`);
   }
   ```

### Testing

```bash
# Manual test
curl -X POST http://localhost:3001/api/compile \
  -H "Content-Type: application/json" \
  -d '{"code":"funcion main(){regresa 0;}"}'

# Obtener resultado
curl http://localhost:3001/api/compile/{id}

# Descargar
curl http://localhost:3001/api/compile/{id}/download > output.exe
```

## 🚀 Deploy a Producción

### Opción 1: Servidor Linux
```bash
# SSH a servidor
ssh user@server

# Clonar repo
git clone repo-url
cd portul-hypercompiler

# Frontend
npm install
npm run build

# Backend
cd backend
npm install --production
NODE_ENV=production npm start
```

### Opción 2: Docker
```bash
# Build
docker build -t portul .

# Run
docker run -p 5173:5173 -p 3001:3001 portul

# Con docker-compose
docker-compose up -d
```

## 📊 Performance Tips

1. **Usar LLVM para compilación real**
   ```bash
   sudo apt install llvm-17
   ```

2. **Redis para producción**
   ```bash
   sudo systemctl start redis-server
   ```

3. **Nginx reverse proxy**
   ```
   location /api { proxy_pass http://localhost:3001; }
   ```

4. **PM2 para process manager**
   ```bash
   pm2 start backend/src/index.js
   pm2 start npm -- run dev
   ```

## 📚 Documentación Completa

- **ARQUITECTURA_COMPLETA.md** - Arquitectura detallada
- **backend/README.md** - Docs del backend
- **RESUMEN_CAMBIOS.md** - Qué se cambió
- **CHECKLIST_VERIFICACION.md** - Validación

## 🔗 Enlaces Útiles

- [LLVM Docs](https://llvm.org/docs)
- [Express.js](https://expressjs.com)
- [Bull Queue](https://docs.bullmq.io)
- [React Docs](https://react.dev)

## 💡 Examples

### Factorial
```portul
funcion factorial(num n) -> num {
  si (n <= 1) {
    regresa 1;
  }
  regresa n * factorial(n - 1);
}
```

### Fibonacci
```portul
funcion fib(num n) -> num {
  si (n <= 1) {
    regresa n;
  }
  regresa fib(n - 1) + fib(n - 2);
}
```

### Clase Simple
```portul
clase Punto {
  num x;
  num y;
  
  funcion distancia() -> num {
    regresa x * x + y * y;
  }
}
```

## ⏱️ Command Cheatsheet

```bash
# Desarrollo
npm run dev              # Frontend
cd backend && npm run dev # Backend

# Build
npm run build            # Frontend production

# Testing
npm test

# Cleaning
rm -rf backend/builds/*  # Limpiar compilados
rm -rf node_modules      # Reset

# Logs
tail -f backend.log

# Kill process
pkill -f "node src/index.js"
pkill -f "npm run dev"
```

## 🎓 Aprende Más

1. Lee `ARQUITECTURA_COMPLETA.md` para entender toda la stack
2. Modifica `lexer.js` para agregar nuevos tokens
3. Extiende `semanticAnalyzer.js` con más validaciones
4. Compila tus propios programas Portul
5. Deploy a producción

## 🙌 Soporte

Si algo no funciona:

1. Verificar que Node.js 18+ está instalado
2. Limpiar node_modules: `rm -rf node_modules`
3. Reinstalar: `npm install`
4. Revisar logs del backend
5. Verificar backend connectivity: `curl http://localhost:3001/health`

---

**¡Listo para compilar!** 🚀

Escribe código Portul → Haz click Compilar → Descarga .exe → ¡Ejecuta en Windows!
