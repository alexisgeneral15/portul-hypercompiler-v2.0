@echo off
REM Quick start script for Portul Hypercompiler (Windows)

setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║ Portul Hypercompiler - Quick Start Setup      ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not installed
    echo   Download from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%

REM Check npm
echo [2/8] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION%

REM Check LLVM (optional)
echo [3/8] Checking LLVM (optional)...
llc --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ LLVM not found - will use fallback
) else (
    echo ✓ LLVM found
)

REM Install frontend dependencies
echo [4/8] Installing frontend dependencies...
if not exist "node_modules" (
    call npm install --legacy-peer-deps
    echo ✓ Frontend dependencies installed
) else (
    echo ✓ Frontend dependencies already installed
)

REM Install backend dependencies
echo [5/8] Installing backend dependencies...
cd backend
if not exist "node_modules" (
    call npm install
    echo ✓ Backend dependencies installed
) else (
    echo ✓ Backend dependencies already installed
)
cd ..

REM Create frontend .env
echo [6/8] Creating frontend environment...
if not exist ".env.local" (
    (
        echo VITE_BACKEND_URL=http://localhost:3001
        echo VITE_API_TIMEOUT=120000
    ) > .env.local
    echo ✓ .env.local created
) else (
    echo ✓ .env.local already exists
)

REM Create backend .env
echo [7/8] Creating backend environment...
cd backend
if not exist ".env" (
    copy .env.example .env >nul
    echo ✓ backend\.env created
) else (
    echo ✓ backend\.env already exists
)
cd ..

REM Create startup batch files
echo [8/8] Creating convenience scripts...

(
    echo @echo off
    echo echo Starting Portul Hypercompiler Backend...
    echo cd backend
    echo npm run dev
    echo pause
) > start-backend.bat

(
    echo @echo off
    echo echo Starting Portul Hypercompiler Frontend...
    echo npm run dev
    echo pause
) > start-frontend.bat

echo ✓ Startup scripts created

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║ Setup Complete! 🎉                            ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo To start development:
echo.
echo Backend (Port 3001):
echo   - Double-click: start-backend.bat
echo   - Or: npm run dev (in backend folder^)
echo.
echo Frontend (Port 5173^):
echo   - Double-click: start-frontend.bat
echo   - Or: npm run dev (in root folder^)
echo.
echo Then open browser: http://localhost:5173
echo.
echo Tips:
echo  • Frontend auto-reloads on changes
echo  • Backend auto-restarts with nodemon
echo  • Check backend console for compilation details
echo  • API docs: http://localhost:3001
echo.
echo Documentation: See ARQUITECTURA_COMPLETA.md
echo.
pause
