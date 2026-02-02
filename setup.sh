#!/bin/bash
# SETUP SCRIPT - Compilador Real para Portul
# Ejecutar: bash setup.sh

set -e

echo "🚀 Portul Compiler Setup"
echo "======================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir
print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ==================== VERIFICACIONES ====================

print_step "Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "  Descargar desde: https://nodejs.org"
    exit 1
fi
print_success "Node.js $(node -v)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm $(npm -v)"

# Verificar compiladores
if ! command -v gcc &> /dev/null; then
    print_step "GCC no encontrado. Intentando instalar..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y build-essential gcc g++ gfortran
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gcc
    elif [[ "$OSTYPE" == "msys" ]]; then
        echo "  En Windows, usa MinGW o WSL"
        echo "  https://www.mingw-w64.org/"
    fi
fi
print_success "gcc $(gcc --version | head -1)"

# Verificar LLVM (opcional pero recomendado)
if ! command -v llc &> /dev/null; then
    print_step "LLVM no encontrado (opcional). Intentando instalar..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y llvm clang llvm-dev
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install llvm
    fi
else
    print_success "LLVM $(llc --version | head -1)"
fi

# ==================== SETUP BACKEND ====================

print_step "Configurando backend..."

# Crear directorio si no existe
if [ ! -d "backend" ]; then
    mkdir backend
fi

cd backend

# Instalar dependencias si package.json no existe
if [ ! -f "package.json" ]; then
    npm init -y
    npm install express cors dotenv socket.io multer uuid
    npm install --save-dev typescript @types/node @types/express @types/socket.io ts-node nodemon
else
    npm install
fi

# Crear archivo .env
if [ ! -f ".env" ]; then
    cat > .env << EOF
NODE_ENV=development
PORT=3000
BACKEND_HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
BINARIES_PATH=./binaries
EOF
    print_success ".env created"
fi

# Crear directorios
mkdir -p binaries logs

print_success "Backend configurado"

cd ..

# ==================== SETUP FRONTEND ====================

print_step "Configurando frontend..."

if [ ! -d "frontend" ]; then
    mkdir frontend
fi

# El frontend ya existe en el proyecto Portul
print_success "Frontend listo (usa los componentes existentes)"

# ==================== DOCKER SETUP ====================

print_step "Verificando Docker..."

if command -v docker &> /dev/null; then
    print_success "Docker instalado"
    print_step "Creando docker-compose.yml..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      REDIS_HOST: redis
    depends_on:
      - redis
EOF
    
    print_success "docker-compose.yml creado"
else
    print_step "Docker no instalado (opcional)"
fi

# ==================== CREAR SCRIPTS NPM ====================

print_step "Creando scripts npm..."

cd backend

# Actualizar package.json con scripts
npm set-script "start" "node dist/server.js" 2>/dev/null || true
npm set-script "dev" "ts-node src/server.ts" 2>/dev/null || true
npm set-script "build" "tsc" 2>/dev/null || true
npm set-script "test" "echo 'Tests coming soon'" 2>/dev/null || true

# Crear tsconfig.json si no existe
if [ ! -f "tsconfig.json" ]; then
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
    print_success "tsconfig.json creado"
fi

# Crear estructura de directorios
mkdir -p src/{services,routes,middleware,utils}

print_success "Scripts npm configurados"

cd ..

# ==================== INSTRUCCIONES FINALES ====================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup completado correctamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "Próximos pasos:"
echo ""
echo "1. Desarrollar localmente:"
echo -e "   ${YELLOW}cd backend${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Con Docker:"
echo -e "   ${YELLOW}docker-compose up${NC}"
echo ""
echo "3. En navegador:"
echo -e "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "Archivos creados:"
echo "  ✓ backend/package.json"
echo "  ✓ backend/.env"
echo "  ✓ backend/tsconfig.json"
echo "  ✓ backend/binaries/ (para almacenar compilados)"
echo "  ✓ docker-compose.yml"
echo ""
echo "Documentación:"
echo "  📖 COMPILADOR_REAL_PLAN.md - Plan completo"
echo "  📖 CLOUD_DEPLOYMENT_OPTIONS.md - Opciones cloud"
echo "  📖 backend-server.ts - Servidor listo para usar"
echo "  📖 CompilerPanel.tsx - Componente React"
echo ""
