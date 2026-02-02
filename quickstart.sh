#!/bin/bash

# Quick start script for Portul Hypercompiler

set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║ Portul Hypercompiler - Quick Start Setup      ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
echo -e "${YELLOW}1. Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not installed${NC}"
    echo "  Install from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

# Check npm
echo -e "${YELLOW}2. Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"

# Check Redis (optional)
echo -e "${YELLOW}3. Checking Redis (optional)...${NC}"
if command -v redis-server &> /dev/null; then
    echo -e "${GREEN}✓ Redis found${NC}"
else
    echo -e "${YELLOW}⚠ Redis not found (optional, for production queue)${NC}"
fi

# Check LLVM (optional)
echo -e "${YELLOW}4. Checking LLVM (optional)...${NC}"
if command -v llc &> /dev/null; then
    LLC_VERSION=$(llc --version | head -n1)
    echo -e "${GREEN}✓ LLVM found: ${LLC_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ LLVM not found (optional, will use fallback)${NC}"
fi

# Install frontend dependencies
echo -e "${YELLOW}5. Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Install backend dependencies
echo -e "${YELLOW}6. Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi
cd ..

# Create frontend .env
echo -e "${YELLOW}7. Creating frontend environment...${NC}"
cat > .env.local << 'EOF'
VITE_BACKEND_URL=http://localhost:3001
VITE_API_TIMEOUT=120000
EOF
echo -e "${GREEN}✓ .env.local created${NC}"

# Create backend .env
echo -e "${YELLOW}8. Creating backend environment...${NC}"
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ backend/.env created${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi
cd ..

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║ Setup Complete! 🎉                            ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "To start development:"
echo ""
echo -e "${GREEN}Terminal 1 (Backend - Port 3001):${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo -e "${GREEN}Terminal 2 (Frontend - Port 5173):${NC}"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo -e "${YELLOW}Tips:${NC}"
echo "  • Frontend auto-reloads on changes (HMR)"
echo "  • Backend auto-restarts with nodemon"
echo "  • Check backend logs for compilation details"
echo "  • API docs: http://localhost:3001"
echo ""
echo "Documentation: see ARQUITECTURA_COMPLETA.md"
