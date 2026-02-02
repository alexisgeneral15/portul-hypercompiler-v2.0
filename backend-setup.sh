#!/bin/bash

# Setup Backend para Portul Hypercompiler

echo "🚀 Instalando Backend de Portul Hypercompiler..."

# 1. Crear carpeta backend
mkdir -p backend/{src/{api,compiler,queue,storage},logs}

cd backend

# 2. Inicializar Node.js
cat > package.json << 'EOF'
{
  "name": "portul-compiler-backend",
  "version": "1.0.0",
  "type": "module",
  "description": "Backend compilador para Portul Hypercompiler",
  "main": "src/index.js",
  "scripts": {
    "dev": "NODE_ENV=development node src/index.js",
    "prod": "NODE_ENV=production node src/index.js",
    "start": "npm run prod"
  },
  "keywords": ["portul", "compiler", "backend"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "bull": "^4.14.1",
    "redis": "^4.6.12",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "multer": "^1.4.5-lts.1",
    "compression": "^1.7.4",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

# 3. Instalar dependencias
npm install

echo "✅ Backend instalado en $(pwd)"
echo ""
echo "Próximos pasos:"
echo "1. Actualiza .env con configuración"
echo "2. Ejecuta: npm run dev"
echo "3. Backend estará en http://localhost:3001"
