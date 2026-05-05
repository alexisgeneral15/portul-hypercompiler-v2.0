# Portul Hypercompiler + Aether IA

Suite de compilacion y entorno de desarrollo para Portul:
- Frontend React + Vite
- Desktop app con Electron
- Backend Node.js para compilacion y streaming IA

## Inicio rapido

### Opcion 1: flujo desktop (recomendado en desarrollo)

```bash
npm install
npm run start:dev
```

Esto levanta Vite, backend y Electron en un solo comando.

### Opcion 2: flujo web + backend separado

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:web
```

Frontend: http://localhost:5173
Backend: http://localhost:3001/health

## Scripts principales

- `npm run start:dev`: Vite + backend + Electron (entorno integrado)
- `npm run dev:web`: solo frontend Vite
- `npm run dev:backend`: backend con nodemon
- `npm run start:backend`: backend con Node
- `npm run build`: build de frontend
- `npm run build:desktop`: empaquetado desktop con electron-builder

## Arquitectura (resumen)

- `src/`: UI y servicios frontend
- `backend/src/`: API, compilacion, auth y Socket.IO
- `electron/portultro/`: proceso principal y preload de Electron
- `scripts/dev-electron.cjs`: orquestador de desarrollo integrado

## Aether IA streaming

El backend expone eventos Socket.IO para streaming de tokens IA (`generate-ia` -> `stream_chunk`).

Si trabajas con artefactos Portul IA, revisa:
- `AETHER_AI_GUIDE.md`
- `AETHER_PORTUL_QUICKSTART.md`
- `AETHER_PORTUL_INTEGRACION.md`

## Documentacion recomendada

- `COMIENZA_AQUI.md`
- `IMPLEMENTACION_COMPLETA.md`
- `ARQUITECTURA_COMPLETA.md`
- `GUIA_RAPIDA.md`

## Requisitos

- Node.js 18+
- npm 9+
- Windows 10/11 (objetivo principal del flujo de compilacion a .exe)
