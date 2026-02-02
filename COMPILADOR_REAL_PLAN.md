# 🔨 PLAN COMPLETO: Compilador Real para IDE Web Portul

## ÍNDICE
1. [Opciones de Compiladores](#opciones)
2. [Arquitectura Backend Recomendada](#arquitectura)
3. [Guía Paso a Paso](#pasos)
4. [Implementación Específica para Portul](#portul)
5. [Ejemplos de Código](#ejemplos)
6. [Roadmap](#roadmap)

---

## <a name="opciones"></a>1. OPCIONES DE COMPILADORES REALES

### A. LLVM (Recomendado para máxima compatibilidad)

**Ventajas:**
- Múltiples targets (Windows, Linux, macOS, WebAssembly)
- Genera código optimizado
- IR intermedio bien documentado
- Comunidad activa

**Integración en Node.js:**

```typescript
// Option 1: Usar llvm-node (binding nativo)
import { Module, Type, IRBuilder } from 'llvm-node';

// Option 2: Usar llvm-js (compilado a WebAssembly)
import { WebAssemblyLLVM } from 'llvm-js';

// Option 3: Child process (recomendado para producción)
import { spawn } from 'child_process';

async function compileWithLLVM(sourceCode: string, targetTriple: string) {
    return new Promise((resolve, reject) => {
        const llc = spawn('llc', [
            '-triple', targetTriple, // x86_64-pc-windows-gnu
            '-o', '/tmp/output.o',
            '-'
        ]);
        
        llc.stdin.write(sourceCode);
        llc.stdin.end();
        
        let output = '';
        llc.stderr.on('data', (data) => { output += data; });
        llc.on('close', (code) => {
            code === 0 ? resolve(output) : reject(new Error(output));
        });
    });
}
```

**Instalación en servidor:**
```bash
# Debian/Ubuntu
sudo apt-get install llvm llvm-dev llvm-tools

# macOS
brew install llvm

# Windows (en servidor)
choco install llvm
```

---

### B. GCC (Para máxima compatibilidad en Linux)

**Ventajas:**
- Disponible en casi todos los servidores
- Optimizaciones agresivas
- Genera .exe para Windows (MinGW)

**Integración:**
```typescript
async function compileWithGCC(
    sourceC: string, 
    outputFile: string,
    targetArch: 'x86_64' | 'i686'
) {
    const args = [
        '-O3', // Optimización máxima
        '-x', 'c', // Input es C
        '-',
        '-o', outputFile,
        '-m' + (targetArch === 'x86_64' ? '64' : '32'),
    ];
    
    if (process.platform === 'win32') {
        // Usar MinGW en Windows
        args.unshift('-fPIC'); // Position Independent Code
    }
    
    const gcc = spawn(process.platform === 'win32' ? 'x86_64-w64-mingw32-gcc' : 'gcc', args);
    
    // ... manejo de streams
}
```

---

### C. WebAssembly-based Compilers

**Opciones:**
1. **Emscripten** - Compila C/C++ a WebAssembly
2. **wasm-pack** - Para Rust a WebAssembly
3. **Clang WASM Target** - LLVM compilando a WASM

**Ventajas:**
- Ejecutar en navegador o server
- Compilaciones rápidas
- No requiere ejecutables del sistema

```typescript
// Usar clang para compilar a WebAssembly
async function compileToWasm(sourceC: string) {
    const clang = spawn('clang', [
        '--target=wasm32-unknown-unknown',
        '-nostdlib',
        '-Wl,--export-all',
        '-o', 'output.wasm',
        '-'
    ]);
    
    // retorna WebAssembly Module
}
```

---

### D. Soporte Multi-Target

```typescript
interface CompilationTarget {
    name: string;
    triple: string; // ej: x86_64-pc-windows-gnu
    osFamily: 'windows' | 'linux' | 'macos';
    arch: 'x86_64' | 'i686' | 'arm64';
    extension: string;
}

const SUPPORTED_TARGETS: CompilationTarget[] = [
    {
        name: 'Windows 64-bit',
        triple: 'x86_64-pc-windows-gnu',
        osFamily: 'windows',
        arch: 'x86_64',
        extension: '.exe'
    },
    {
        name: 'Linux 64-bit',
        triple: 'x86_64-unknown-linux-gnu',
        osFamily: 'linux',
        arch: 'x86_64',
        extension: ''
    },
    {
        name: 'macOS ARM64',
        triple: 'aarch64-apple-darwin',
        osFamily: 'macos',
        arch: 'arm64',
        extension: ''
    },
    {
        name: 'WebAssembly',
        triple: 'wasm32-unknown-unknown',
        osFamily: 'linux', // neutral
        arch: 'x86_64',
        extension: '.wasm'
    }
];
```

---

## <a name="arquitectura"></a>2. ARQUITECTURA BACKEND RECOMENDADA

### Opción 1: Node.js (Recomendado para esta IDE)

**Ventajas:**
- Mismo ecosistema que frontend
- Fácil comunicación con UI vía WebSockets
- Excelente manejo concurrencia con eventos

**Stack:**
```
┌─────────────────────────────────────────┐
│          Frontend React/Vite            │
│  (IDE Web con editor Portul)            │
└────────────┬────────────────────────────┘
             │ WebSocket/REST
             ▼
┌─────────────────────────────────────────┐
│   Node.js Express Backend                │
├─────────────────────────────────────────┤
│ • API REST endpoints                    │
│ • Queue de compilaciones (Bull/BullMQ)  │
│ • WebSocket para output en tiempo real  │
└────────────┬────────────────────────────┘
             │ Child Process
             ▼
┌─────────────────────────────────────────┐
│   LLVM/GCC/Clang                        │
│   (Compiladores reales)                 │
└─────────────────────────────────────────┘

Storage:
• Código fuente: Base datos (PostgreSQL)
• Binarios: MinIO / S3 / Disk
• Caché: Redis
```

---

### Opción 2: Python (Si necesitas análisis profundo)

**Mejor para:**
- Análisis AST complejos
- Machine Learning / optimizaciones
- Integración con herramientas de compilación

```python
# FastAPI + Celery para compilaciones async
from fastapi import FastAPI
from celery import Celery
import llvmlite
import llvmlite.binding as llvm

app = FastAPI()
celery_app = Celery('compiler', broker='redis://localhost:6379')

@app.post("/compile")
async def compile_endpoint(source_code: str, target: str):
    task = celery_app.send_task('compile_task', 
                                 args=[source_code, target])
    return {"task_id": task.id, "status": "pending"}
```

---

### Opción 3: Rust (Para máximo rendimiento)

**Mejor para:**
- Servidor de producción de alta carga
- Compilaciones muy frecuentes
- Bajo overhead de recursos

```rust
// Actix-web + tokio
use actix_web::{web, App, HttpServer};
use std::process::Command;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/compile", web::post().to(compile_handler))
    })
    .bind("0.0.0.0:3000")?
    .run()
    .await
}
```

---

### Exposición como API REST

```typescript
// Express API endpoints
import express from 'express';
import { CompilationQueue } from './compilationQueue';
import { FileStorage } from './fileStorage';

const app = express();
const queue = new CompilationQueue();
const storage = new FileStorage();

// POST /api/compile - Enviar código para compilar
app.post('/api/compile', async (req, res) => {
    const { sourceCode, target, projectId } = req.body;
    
    try {
        const jobId = await queue.addJob({
            sourceCode,
            target,
            projectId,
            timestamp: Date.now(),
            userId: req.user.id
        });
        
        res.json({ 
            jobId, 
            status: 'queued',
            estimatedTime: queue.estimateTime()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/compile/:jobId/status - Estado de compilación
app.get('/api/compile/:jobId/status', async (req, res) => {
    const job = await queue.getJob(req.params.jobId);
    res.json({
        jobId: req.params.jobId,
        status: job.status, // pending, compiling, completed, failed
        progress: job.progress,
        output: job.output,
        error: job.error,
        binary: job.binaryUrl // URL para descargar
    });
});

// GET /api/compile/:jobId/download - Descargar binario
app.get('/api/compile/:jobId/download', async (req, res) => {
    const job = await queue.getJob(req.params.jobId);
    if (job.status !== 'completed') {
        return res.status(400).json({ error: 'Not ready' });
    }
    
    const filePath = await storage.getBinaryPath(job.binaryId);
    res.download(filePath);
});

// WebSocket para output en tiempo real
const io = require('socket.io')(httpServer);

io.on('connection', (socket) => {
    socket.on('watch-compilation', (jobId) => {
        queue.on(`progress-${jobId}`, (data) => {
            socket.emit('compilation-update', data);
        });
    });
});
```

---

### Manejo de Compilaciones Concurrentes

```typescript
// compilationQueue.ts - Bull/BullMQ
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis();

interface CompilationJob {
    sourceCode: string;
    target: string;
    projectId: string;
    userId: string;
    timestamp: number;
}

export class CompilationQueue {
    private queue: Queue<CompilationJob>;
    private workers: Worker[] = [];
    
    constructor(concurrency: number = 4) {
        this.queue = new Queue('compilations', { connection: redis });
        
        // Crear N workers
        for (let i = 0; i < concurrency; i++) {
            const worker = new Worker(
                'compilations',
                this.processCompilation.bind(this),
                { connection: redis, concurrency: 1 }
            );
            
            worker.on('completed', (job) => {
                console.log(`✓ Job ${job.id} completado`);
            });
            
            worker.on('failed', (job, err) => {
                console.error(`✗ Job ${job.id} falló:`, err);
            });
            
            this.workers.push(worker);
        }
    }
    
    private async processCompilation(job: Job<CompilationJob>) {
        const { sourceCode, target } = job.data;
        
        job.updateProgress({ stage: 'parsing', percent: 10 });
        
        // 1. Parse
        const ast = await parsePortulCode(sourceCode);
        job.updateProgress({ stage: 'semantic-analysis', percent: 25 });
        
        // 2. Semantic analysis
        const semantic = await analyzeSemantics(ast);
        job.updateProgress({ stage: 'codegen', percent: 50 });
        
        // 3. Generar código C
        const cCode = await generateCCode(semantic);
        job.updateProgress({ stage: 'compilation', percent: 75 });
        
        // 4. Compilar a binario
        const binary = await compileToTarget(cCode, target);
        job.updateProgress({ stage: 'linking', percent: 90 });
        
        // 5. Guardar resultado
        const binaryId = await storage.saveBinary(binary);
        job.updateProgress({ stage: 'complete', percent: 100 });
        
        return {
            binaryId,
            binaryUrl: `/download/${binaryId}`,
            size: binary.length,
            target
        };
    }
    
    async addJob(data: CompilationJob) {
        const job = await this.queue.add(data, {
            priority: data.userId ? 1 : 10, // Premium users first
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false
        });
        
        return job.id;
    }
    
    async getJob(jobId: string) {
        return await this.queue.getJob(jobId);
    }
}
```

---

### Almacenamiento de Binarios

```typescript
// fileStorage.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { MinIO } from 'minio';

export interface StorageProvider {
    saveBinary(data: Buffer, metadata: any): Promise<string>;
    getBinary(id: string): Promise<Buffer>;
    deleteBinary(id: string): Promise<void>;
}

// Opción 1: Almacenamiento local
export class LocalStorage implements StorageProvider {
    private basePath: string;
    
    constructor(basePath = './binaries') {
        this.basePath = basePath;
    }
    
    async saveBinary(data: Buffer, metadata: any) {
        const id = `${metadata.projectId}-${Date.now()}.${metadata.ext}`;
        const filePath = path.join(this.basePath, id);
        
        await fs.writeFile(filePath, data);
        
        // Guardar metadata
        await fs.writeFile(
            `${filePath}.json`,
            JSON.stringify({
                id,
                created: new Date(),
                size: data.length,
                target: metadata.target,
                userId: metadata.userId
            })
        );
        
        return id;
    }
    
    async getBinary(id: string) {
        return await fs.readFile(path.join(this.basePath, id));
    }
}

// Opción 2: AWS S3
export class S3Storage implements StorageProvider {
    private s3: AWS.S3;
    private bucket: string;
    
    constructor(bucket: string) {
        this.s3 = new AWS.S3();
        this.bucket = bucket;
    }
    
    async saveBinary(data: Buffer, metadata: any) {
        const key = `binaries/${metadata.projectId}/${Date.now()}.${metadata.ext}`;
        
        await this.s3.putObject({
            Bucket: this.bucket,
            Key: key,
            Body: data,
            ServerSideEncryption: 'AES256',
            Metadata: {
                'project-id': metadata.projectId,
                'target': metadata.target
            }
        }).promise();
        
        return key;
    }
    
    async getBinary(id: string) {
        const result = await this.s3.getObject({
            Bucket: this.bucket,
            Key: id
        }).promise();
        
        return result.Body as Buffer;
    }
}

// Opción 3: MinIO (S3-compatible, local)
export class MinIOStorage implements StorageProvider {
    private client: MinIO.Client;
    private bucket: string;
    
    constructor(endpoint: string, bucket: string) {
        this.client = new MinIO.Client({
            endPoint: endpoint,
            port: 9000,
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
        });
        this.bucket = bucket;
    }
    
    async saveBinary(data: Buffer, metadata: any) {
        const key = `binaries/${metadata.projectId}/${Date.now()}.${metadata.ext}`;
        
        await this.client.putObject(this.bucket, key, data, data.length, {
            'Content-Type': 'application/octet-stream',
            'X-Amz-Meta-Project-Id': metadata.projectId,
            'X-Amz-Meta-Target': metadata.target
        });
        
        return key;
    }
}
```

---

## <a name="pasos"></a>3. GUÍA PASO A PASO DE IMPLEMENTACIÓN

### FASE 1: Configurar Servidor Node.js/Express

**Paso 1.1: Setup inicial**

```bash
mkdir portul-backend
cd portul-backend

# Crear proyecto
npm init -y

# Instalar dependencias
npm install express cors dotenv bull bullmq redis socket.io multer
npm install --save-dev typescript @types/node ts-node

# Crear estructura
mkdir -p src/{services,routes,middleware,utils}
```

**Paso 1.2: Crear servidor base (src/server.ts)**

```typescript
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rutas
import compilationRoutes from './routes/compilation';
app.use('/api/compile', compilationRoutes);

// WebSocket
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

export { httpServer, io };
```

---

### FASE 2: Integrar Compilador Real

**Paso 2.1: Instalar LLVM/GCC en servidor**

```bash
# En Linux/Ubuntu
sudo apt-get update
sudo apt-get install -y build-essential llvm clang llvm-dev

# Verificar
llc --version
gcc --version
clang --version

# Para compilar a Windows desde Linux
sudo apt-get install mingw-w64 mingw-w64-tools
```

**Paso 2.2: Servicio de compilación (src/services/compilerService.ts)**

```typescript
import { spawn, execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface CompilationOptions {
    sourceCode: string;
    language: 'portul' | 'c' | 'ir';
    target: string;
    outputFile: string;
    optimizationLevel?: '-O0' | '-O1' | '-O2' | '-O3' | '-Oz';
}

export class CompilerService {
    /**
     * Compila código usando LLVM IR
     */
    async compileLLVM(options: CompilationOptions): Promise<string> {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portul-'));
        const irFile = path.join(tempDir, 'code.ll');
        const objFile = path.join(tempDir, 'code.o');
        
        try {
            // Guardar IR
            await fs.writeFile(irFile, options.sourceCode);
            
            // Compilar con llc
            await this.runCommand('llc', [
                '-triple', options.target,
                '-relocation-model', 'pic',
                '-O' + (options.optimizationLevel || '2').charAt(1),
                irFile,
                '-o', objFile
            ]);
            
            const object = await fs.readFile(objFile);
            return object.toString('base64');
            
        } finally {
            // Limpiar
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }
    
    /**
     * Compila código C a binario ejecutable
     */
    async compileC(options: CompilationOptions): Promise<Buffer> {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portul-'));
        const cFile = path.join(tempDir, 'code.c');
        const outputPath = path.join(tempDir, options.outputFile);
        
        try {
            await fs.writeFile(cFile, options.sourceCode);
            
            const compiler = options.target.includes('mingw') ? 
                'x86_64-w64-mingw32-gcc' : 'gcc';
            
            const args = [
                '-x', 'c',
                cFile,
                '-o', outputPath,
                (options.optimizationLevel || '-O2'),
                '-lm', // Math library
                '-Wl,--subsystem,console',
                '-static' // Link everything statically
            ];
            
            await this.runCommand(compiler, args);
            
            return await fs.readFile(outputPath);
            
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }
    
    /**
     * Enlaza archivos objeto a ejecutable
     */
    async linkObjects(
        objectFiles: string[],
        outputFile: string,
        target: string
    ): Promise<Buffer> {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portul-'));
        const outputPath = path.join(tempDir, outputFile);
        
        try {
            const linker = target.includes('mingw') ? 
                'x86_64-w64-mingw32-ld' : 'ld';
            
            const args = [
                ...objectFiles,
                '-o', outputPath,
                '-lc', '-lm',
                '--entry=main'
            ];
            
            await this.runCommand(linker, args);
            
            return await fs.readFile(outputPath);
            
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }
    
    /**
     * Ejecuta comando del compilador
     */
    private runCommand(cmd: string, args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const process = spawn(cmd, args);
            
            let stdout = '';
            let stderr = '';
            
            process.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`${cmd} failed:\n${stderr}`));
                } else {
                    resolve();
                }
            });
            
            process.on('error', reject);
        });
    }
}

export default new CompilerService();
```

---

### FASE 3: Crear Endpoints API

**Paso 3.1: Ruta de compilación (src/routes/compilation.ts)**

```typescript
import { Router, Request, Response } from 'express';
import { CompilationQueue } from '../services/compilationQueue';
import { FileStorage } from '../services/fileStorage';
import { io } from '../server';

const router = Router();
const queue = new CompilationQueue(4); // 4 workers
const storage = new FileStorage('./binaries');

// POST /api/compile/submit
router.post('/submit', async (req: Request, res: Response) => {
    try {
        const { 
            sourceCode, 
            target = 'x86_64-pc-windows-gnu',
            projectId,
            userId
        } = req.body;
        
        if (!sourceCode || !projectId) {
            return res.status(400).json({ 
                error: 'Missing sourceCode or projectId' 
            });
        }
        
        const jobId = await queue.addJob({
            sourceCode,
            target,
            projectId,
            userId,
            timestamp: Date.now()
        });
        
        res.json({ 
            jobId, 
            status: 'queued',
            estimatedTime: queue.estimateWaitTime(),
            queuePosition: queue.getQueuePosition(jobId)
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// GET /api/compile/:jobId/status
router.get('/:jobId/status', async (req: Request, res: Response) => {
    try {
        const job = await queue.getJob(req.params.jobId);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json({
            jobId: req.params.jobId,
            status: job.getState(),
            progress: job.progress?.percent || 0,
            stage: job.progress?.stage || 'pending',
            output: job.logs || [],
            error: job.failedReason,
            result: job.returnvalue,
            attempts: job.attemptsMade
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// GET /api/compile/:jobId/download
router.get('/:jobId/download', async (req: Request, res: Response) => {
    try {
        const job = await queue.getJob(req.params.jobId);
        
        if (!job || job.getState() !== 'completed') {
            return res.status(400).json({ 
                error: 'Compilation not completed' 
            });
        }
        
        const { binaryId, target } = job.returnvalue;
        const binary = await storage.getBinary(binaryId);
        
        const extension = target.includes('mingw') ? 'exe' : 
                         target.includes('wasm') ? 'wasm' : '';
        
        res.download(binary, `program.${extension}`);
        
    } catch (error) {
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// GET /api/compile/queue/stats
router.get('/queue/stats', async (req: Request, res: Response) => {
    try {
        const stats = await queue.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

export default router;
```

**Paso 3.2: Cola de compilación (src/services/compilationQueue.ts)**

```typescript
import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';
import { CompilerService } from './compilerService';
import { FileStorage } from './fileStorage';
import { semanticAnalyzer } from './portulAnalyzer';
import { io } from '../server';

interface CompilationJob {
    sourceCode: string;
    target: string;
    projectId: string;
    userId: string;
    timestamp: number;
}

export class CompilationQueue {
    private queue: Queue<CompilationJob>;
    private workers: Worker[] = [];
    private queueEvents: QueueEvents;
    private compiler = CompilerService;
    private storage = new FileStorage('./binaries');
    
    constructor(numWorkers: number) {
        const connection = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379')
        });
        
        this.queue = new Queue('compilations', { connection });
        this.queueEvents = new QueueEvents('compilations', { connection });
        
        // Setup workers
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(
                'compilations',
                this.processJob.bind(this),
                { 
                    connection,
                    concurrency: 1,
                    limiter: {
                        max: 1,
                        duration: 100
                    }
                }
            );
            
            worker.on('completed', (job) => {
                console.log(`✓ Job ${job.id} completed`);
                io.emit(`compilation-${job.id}`, {
                    status: 'completed',
                    jobId: job.id
                });
            });
            
            worker.on('failed', (job, err) => {
                console.error(`✗ Job ${job.id} failed:`, err);
                io.emit(`compilation-${job.id}`, {
                    status: 'failed',
                    jobId: job.id,
                    error: err.message
                });
            });
            
            worker.on('progress', (job, progress) => {
                io.emit(`compilation-${job.id}`, {
                    status: 'compiling',
                    jobId: job.id,
                    progress
                });
            });
            
            this.workers.push(worker);
        }
    }
    
    private async processJob(job: Job<CompilationJob>) {
        const { sourceCode, target, projectId, userId } = job.data;
        const jobId = job.id!;
        
        try {
            // Stage 1: Parse & Semantic Analysis
            job.updateProgress({ stage: 'parsing', percent: 15 });
            const ast = await semanticAnalyzer.parsePortul(sourceCode);
            
            job.updateProgress({ stage: 'semantic-analysis', percent: 30 });
            const semantic = await semanticAnalyzer.analyze(ast);
            
            // Stage 2: Code Generation
            job.updateProgress({ stage: 'codegen', percent: 50 });
            const cCode = await semanticAnalyzer.generateC(semantic);
            
            // Stage 3: Compilation
            job.updateProgress({ stage: 'llvm-ir', percent: 60 });
            
            job.updateProgress({ stage: 'compilation', percent: 75 });
            const binary = await this.compiler.compileC({
                sourceCode: cCode,
                language: 'c',
                target,
                outputFile: `program.${target.includes('mingw') ? 'exe' : ''}`,
                optimizationLevel: '-O2'
            });
            
            // Stage 4: Storage
            job.updateProgress({ stage: 'storage', percent: 90 });
            const binaryId = await this.storage.saveBinary(binary, {
                projectId,
                userId,
                target,
                ext: target.includes('mingw') ? 'exe' : '',
                size: binary.length,
                timestamp: Date.now()
            });
            
            job.updateProgress({ stage: 'complete', percent: 100 });
            
            return {
                binaryId,
                size: binary.length,
                target,
                checksum: this.calculateChecksum(binary)
            };
            
        } catch (error) {
            throw new Error(
                `Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
    
    async addJob(data: CompilationJob) {
        const job = await this.queue.add(data, {
            priority: data.userId ? 1 : 10,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: { age: 3600 }, // 1 hour
            removeOnFail: false
        });
        
        return job.id;
    }
    
    async getJob(jobId: string) {
        return await this.queue.getJob(jobId);
    }
    
    async getStats() {
        const counts = await this.queue.getJobCounts();
        return {
            queued: counts.wait,
            active: counts.active,
            completed: counts.completed,
            failed: counts.failed
        };
    }
    
    getQueuePosition(jobId: string) {
        // Implementar búsqueda de posición
        return 0;
    }
    
    estimateWaitTime(): number {
        // 30 segundos por compilación promedio
        return 30000;
    }
    
    private calculateChecksum(data: Buffer): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
```

---

### FASE 4: Integración Frontend

**Paso 4.1: Componente React para compilación (components/CompilerPanel.tsx)**

```typescript
import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface CompilationState {
    jobId: string | null;
    status: 'idle' | 'queued' | 'compiling' | 'completed' | 'failed';
    progress: number;
    stage: string;
    output: string[];
    error: string | null;
    downloadUrl: string | null;
}

export const CompilerPanel: React.FC<{ code: string }> = ({ code }) => {
    const [state, setState] = useState<CompilationState>({
        jobId: null,
        status: 'idle',
        progress: 0,
        stage: '',
        output: [],
        error: null,
        downloadUrl: null
    });
    
    const [target, setTarget] = useState('x86_64-pc-windows-gnu');
    const socketRef = useRef<Socket | null>(null);
    
    useEffect(() => {
        socketRef.current = io('http://localhost:3000');
        return () => socketRef.current?.disconnect();
    }, []);
    
    const handleCompile = async () => {
        try {
            setState(s => ({ ...s, status: 'queued' }));
            
            const response = await fetch('http://localhost:3000/api/compile/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceCode: code,
                    target,
                    projectId: 'portul-project',
                    userId: 'user-1'
                })
            });
            
            const { jobId, queuePosition } = await response.json();
            setState(s => ({ ...s, jobId }));
            
            // Escuchar actualizaciones
            socketRef.current?.on(`compilation-${jobId}`, (data) => {
                setState(s => ({
                    ...s,
                    status: data.status,
                    progress: data.progress?.percent || 0,
                    stage: data.progress?.stage || '',
                    error: data.error
                }));
                
                if (data.status === 'completed') {
                    setState(s => ({
                        ...s,
                        downloadUrl: `http://localhost:3000/api/compile/${jobId}/download`
                    }));
                }
            });
            
        } catch (error) {
            setState(s => ({
                ...s,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    };
    
    return (
        <div className="compiler-panel">
            <h2>🔨 Compilador Portul</h2>
            
            <div className="controls">
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="x86_64-pc-windows-gnu">Windows 64-bit</option>
                    <option value="x86_64-unknown-linux-gnu">Linux 64-bit</option>
                    <option value="aarch64-apple-darwin">macOS ARM64</option>
                    <option value="wasm32-unknown-unknown">WebAssembly</option>
                </select>
                
                <button 
                    onClick={handleCompile}
                    disabled={state.status === 'compiling' || state.status === 'queued'}
                >
                    {state.status === 'compiling' ? '⏳ Compilando...' : '▶ Compilar'}
                </button>
            </div>
            
            {state.status === 'compiling' && (
                <div className="progress">
                    <div className="bar" style={{ width: `${state.progress}%` }}></div>
                    <p>{state.stage} ({state.progress}%)</p>
                </div>
            )}
            
            {state.status === 'completed' && (
                <div className="success">
                    ✓ Compilación exitosa
                    <a href={state.downloadUrl} download>
                        📥 Descargar ejecutable
                    </a>
                </div>
            )}
            
            {state.error && (
                <div className="error">
                    ✗ Error: {state.error}
                </div>
            )}
            
            <div className="output">
                {state.output.map((line, i) => (
                    <pre key={i}>{line}</pre>
                ))}
            </div>
        </div>
    );
};
```

---

## <a name="portul"></a>4. IMPLEMENTACIÓN ESPECÍFICA PARA PORTUL

### Paso 1: Convertir análisis semántico a generador de código

**src/services/portulToC.ts**

```typescript
import { AST, SemanticInfo } from './semanticAnalyzer';

export class PortulToCGenerator {
    /**
     * Convierte AST semántico de Portul a código C
     */
    generateC(semanticInfo: SemanticInfo): string {
        let code = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\n`;
        
        // 1. Generar definiciones de tipos
        code += this.generateTypeDefinitions(semanticInfo);
        
        // 2. Generar prototipos de funciones
        code += this.generateFunctionPrototypes(semanticInfo);
        
        // 3. Generar funciones
        code += this.generateFunctions(semanticInfo);
        
        // 4. Generar main
        code += this.generateMain(semanticInfo);
        
        return code;
    }
    
    private generateTypeDefinitions(semantic: SemanticInfo): string {
        let types = '';
        
        for (const [typeName, typeInfo] of semantic.types) {
            if (typeInfo.kind === 'struct') {
                types += `typedef struct {\n`;
                for (const [fieldName, fieldType] of typeInfo.fields) {
                    types += `    ${this.typeToC(fieldType)} ${fieldName};\n`;
                }
                types += `} ${typeName};\n\n`;
            }
        }
        
        return types;
    }
    
    private generateFunctionPrototypes(semantic: SemanticInfo): string {
        let protos = '';
        
        for (const [funcName, funcInfo] of semantic.functions) {
            if (!funcInfo.isBuiltin) {
                const returnType = this.typeToC(funcInfo.returnType);
                const params = funcInfo.parameters
                    .map(p => `${this.typeToC(p.type)} ${p.name}`)
                    .join(', ');
                
                protos += `${returnType} ${funcName}(${params});\n`;
            }
        }
        
        return protos + '\n';
    }
    
    private generateFunctions(semantic: SemanticInfo): string {
        let funcs = '';
        
        for (const func of semantic.functions.values()) {
            if (!func.isBuiltin) {
                funcs += this.generateFunction(func);
            }
        }
        
        return funcs;
    }
    
    private generateFunction(func: any): string {
        const returnType = this.typeToC(func.returnType);
        const params = func.parameters
            .map((p: any) => `${this.typeToC(p.type)} ${p.name}`)
            .join(', ');
        
        let code = `${returnType} ${func.name}(${params}) {\n`;
        
        // Generar cuerpo
        code += this.generateStatements(func.body, 1);
        
        code += `}\n\n`;
        
        return code;
    }
    
    private generateStatements(statements: any[], indent: number): string {
        const prefix = '  '.repeat(indent);
        let code = '';
        
        for (const stmt of statements) {
            switch (stmt.type) {
                case 'VarDeclaration':
                    code += `${prefix}${this.typeToC(stmt.varType)} ${stmt.name}`;
                    if (stmt.initialValue) {
                        code += ` = ${this.generateExpression(stmt.initialValue)}`;
                    }
                    code += ';\n';
                    break;
                    
                case 'Assignment':
                    code += `${prefix}${stmt.target} = ${this.generateExpression(stmt.value)};\n`;
                    break;
                    
                case 'IfStatement':
                    code += `${prefix}if (${this.generateExpression(stmt.condition)}) {\n`;
                    code += this.generateStatements(stmt.thenBranch, indent + 1);
                    if (stmt.elseBranch) {
                        code += `${prefix}} else {\n`;
                        code += this.generateStatements(stmt.elseBranch, indent + 1);
                    }
                    code += `${prefix}}\n`;
                    break;
                    
                case 'WhileLoop':
                    code += `${prefix}while (${this.generateExpression(stmt.condition)}) {\n`;
                    code += this.generateStatements(stmt.body, indent + 1);
                    code += `${prefix}}\n`;
                    break;
                    
                case 'ForLoop':
                    code += `${prefix}for (`;
                    code += this.generateExpression(stmt.init);
                    code += `; ${this.generateExpression(stmt.condition)}; `;
                    code += this.generateExpression(stmt.update);
                    code += `) {\n`;
                    code += this.generateStatements(stmt.body, indent + 1);
                    code += `${prefix}}\n`;
                    break;
                    
                case 'Return':
                    code += `${prefix}return`;
                    if (stmt.value) {
                        code += ` ${this.generateExpression(stmt.value)}`;
                    }
                    code += ';\n';
                    break;
                    
                case 'FunctionCall':
                    code += `${prefix}${this.generateExpression(stmt)};\n`;
                    break;
            }
        }
        
        return code;
    }
    
    private generateExpression(expr: any): string {
        if (typeof expr === 'string') return expr;
        if (typeof expr === 'number') return expr.toString();
        if (typeof expr === 'boolean') return expr ? 'true' : 'false';
        
        switch (expr.type) {
            case 'BinaryOp':
                return `(${this.generateExpression(expr.left)} ${expr.operator} ${this.generateExpression(expr.right)})`;
                
            case 'UnaryOp':
                return `${expr.operator}${this.generateExpression(expr.operand)}`;
                
            case 'FunctionCall':
                const args = expr.arguments
                    .map((arg: any) => this.generateExpression(arg))
                    .join(', ');
                return `${expr.name}(${args})`;
                
            case 'ArrayAccess':
                return `${expr.array}[${this.generateExpression(expr.index)}]`;
                
            case 'Literal':
                return expr.value.toString();
        }
        
        return '0';
    }
    
    private generateMain(semantic: SemanticInfo): string {
        const entryPoint = semantic.entryPoint || 'main';
        
        return `\nint main(int argc, char *argv[]) {\n    ${entryPoint}();\n    return 0;\n}\n`;
    }
    
    private typeToC(type: string): string {
        const mapping: { [key: string]: string } = {
            'int': 'int',
            'float': 'float',
            'double': 'double',
            'bool': 'int',
            'string': 'char*',
            'void': 'void',
            'u8': 'uint8_t',
            'u16': 'uint16_t',
            'u32': 'uint32_t',
            'u64': 'uint64_t',
            'i8': 'int8_t',
            'i16': 'int16_t',
            'i32': 'int32_t',
            'i64': 'int64_t',
            'f32': 'float',
            'f64': 'double'
        };
        
        return mapping[type] || type;
    }
}
```

---

### Paso 2: Generar LLVM IR directamente

**src/services/portulToLLVMIR.ts**

```typescript
/**
 * Genera LLVM IR intermedio desde Portul
 * Permite optimizaciones a nivel IR antes de compilar a código máquina
 */
export class PortulToLLVMIRGenerator {
    private stringCounter = 0;
    private functionCounter = 0;
    
    generateIR(ast: any): string {
        let ir = `; ModuleID = 'portul'\ntarget datalayout = "e-m:w-p270:32:32-p271:32:32-p272:64:64-i64:64-f80:128-n8:16:32:64-S128"\ntarget triple = "x86_64-pc-windows-gnu"\n\n`;
        
        // Generar declaraciones de tipos
        ir += this.generateTypeDeclarations(ast);
        
        // Generar declaraciones de funciones
        ir += this.generateFunctionDeclarations(ast);
        
        // Generar definiciones de funciones
        ir += this.generateFunctionDefinitions(ast);
        
        return ir;
    }
    
    private generateTypeDeclarations(ast: any): string {
        let ir = ''; // Tipos en LLVM
        return ir;
    }
    
    private generateFunctionDeclarations(ast: any): string {
        let ir = '';
        
        for (const func of ast.functions) {
            const returnLLVMType = this.portulTypeToLLVM(func.returnType);
            const paramTypes = func.parameters
                .map((p: any) => this.portulTypeToLLVM(p.type))
                .join(', ');
            
            ir += `declare ${returnLLVMType} @${func.name}(${paramTypes})\n`;
        }
        
        return ir + '\n';
    }
    
    private generateFunctionDefinitions(ast: any): string {
        let ir = '';
        
        for (const func of ast.functions) {
            ir += this.generateFunction(func);
        }
        
        return ir;
    }
    
    private generateFunction(func: any): string {
        const returnType = this.portulTypeToLLVM(func.returnType);
        const params = func.parameters
            .map((p: any, i: number) => `${this.portulTypeToLLVM(p.type)} %${p.name}`)
            .join(', ');
        
        let ir = `define ${returnType} @${func.name}(${params}) {\nentry:\n`;
        
        let blockCounter = 0;
        ir += this.generateBasicBlocks(func.body, blockCounter);
        
        ir += `}\n\n`;
        
        return ir;
    }
    
    private generateBasicBlocks(statements: any, blockId: number): string {
        let ir = '';
        let tempCounter = 0;
        
        for (const stmt of statements) {
            const { code, temps } = this.generateStatement(stmt, tempCounter);
            ir += code;
            tempCounter += temps;
        }
        
        return ir;
    }
    
    private generateStatement(stmt: any, tempCounter: number): { code: string, temps: number } {
        let code = '';
        let temps = 0;
        
        switch (stmt.type) {
            case 'BinaryOp':
                const llvmOp = this.getRelevantLLVMOp(stmt.operator);
                code = `  %${tempCounter} = ${llvmOp} ${this.portulTypeToLLVM(stmt.type)} %left, %right\n`;
                temps = 1;
                break;
                
            case 'Return':
                code = `  ret ${this.portulTypeToLLVM(stmt.type)} %value\n`;
                break;
        }
        
        return { code, temps };
    }
    
    private portulTypeToLLVM(type: string): string {
        const mapping: { [key: string]: string } = {
            'int': 'i32',
            'float': 'float',
            'double': 'double',
            'bool': 'i1',
            'void': 'void',
            'u8': 'i8',
            'u16': 'i16',
            'u32': 'i32',
            'u64': 'i64'
        };
        
        return mapping[type] || 'i32';
    }
    
    private getRelevantLLVMOp(op: string): string {
        const mapping: { [key: string]: string } = {
            '+': 'add',
            '-': 'sub',
            '*': 'mul',
            '/': 'sdiv',
            '%': 'srem',
            '&': 'and',
            '|': 'or',
            '^': 'xor',
            '<<': 'shl',
            '>>': 'ashr'
        };
        
        return mapping[op] || 'add';
    }
}
```

---

### Paso 3: Pipeline completo Portul → Ejecutable

**src/services/portulCompilationPipeline.ts**

```typescript
import { semanticAnalyzer } from './semanticAnalyzer';
import { PortulToCGenerator } from './portulToC';
import { PortulToLLVMIRGenerator } from './portulToLLVMIR';
import { CompilerService } from './compilerService';

export class PortulCompilationPipeline {
    private cGenerator = new PortulToCGenerator();
    private llvmGenerator = new PortulToLLVMIRGenerator();
    private compiler = CompilerService;
    
    async compilePortulToExecutable(
        sourceCode: string,
        target: 'windows' | 'linux' | 'macos' | 'wasm' = 'windows',
        optimization: 'fast' | 'balanced' | 'size' = 'balanced'
    ) {
        console.log('📝 Paso 1: Parsing Portul...');
        const ast = await semanticAnalyzer.parsePortul(sourceCode);
        
        console.log('🔍 Paso 2: Análisis Semántico...');
        const semantic = await semanticAnalyzer.analyze(ast);
        
        console.log('⚡ Paso 3: Generación de C...');
        const cCode = this.cGenerator.generateC(semantic);
        
        console.log('🔗 Paso 4: Compilación a ejecutable...');
        const binary = await this.compiler.compileC({
            sourceCode: cCode,
            language: 'c',
            target: this.getCompilerTarget(target),
            outputFile: `program.${target === 'windows' ? 'exe' : ''}`,
            optimizationLevel: this.getOptimizationLevel(optimization)
        });
        
        return {
            binary,
            size: binary.length,
            target,
            success: true
        };
    }
    
    async compilePortulToLLVMIR(
        sourceCode: string
    ): Promise<string> {
        const ast = await semanticAnalyzer.parsePortul(sourceCode);
        const semantic = await semanticAnalyzer.analyze(ast);
        
        return this.llvmGenerator.generateIR(semantic);
    }
    
    private getCompilerTarget(target: string): string {
        const mapping = {
            'windows': 'x86_64-pc-windows-gnu',
            'linux': 'x86_64-unknown-linux-gnu',
            'macos': 'aarch64-apple-darwin',
            'wasm': 'wasm32-unknown-unknown'
        };
        
        return mapping[target as keyof typeof mapping] || mapping.windows;
    }
    
    private getOptimizationLevel(opt: string): '-O0' | '-O1' | '-O2' | '-O3' | '-Oz' {
        const mapping = {
            'fast': '-O3' as const,
            'balanced': '-O2' as const,
            'size': '-Oz' as const
        };
        
        return mapping[opt as keyof typeof mapping] || '-O2';
    }
}

export default new PortulCompilationPipeline();
```

---

## <a name="ejemplos"></a>5. EJEMPLOS DE CÓDIGO COMPLETOS

### Ejemplo 1: Código Portul simple

**test.portul**
```portul
// Portul program
fn fibonacci(n: int) -> int {
    if n <= 1 {
        return n
    }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

fn main() {
    let result: int = fibonacci(10)
    print(result)
}
```

### Ejemplo 2: C generado

```c
#include <stdio.h>
#include <stdlib.h>

int fibonacci(int n) {
    if ((n <= 1)) {
        return n;
    }
    return ((fibonacci((n - 1))) + (fibonacci((n - 2))));
}

int main(int argc, char *argv[]) {
    fibonacci(10);
    return 0;
}
```

### Ejemplo 3: Cliente React para compilar

```typescript
const client = async () => {
    const portulCode = `
fn hello(name: string) {
    print("Hello " + name)
}

fn main() {
    hello("World")
}
    `;
    
    // Compilar
    const response = await fetch('http://localhost:3000/api/compile/submit', {
        method: 'POST',
        body: JSON.stringify({
            sourceCode: portulCode,
            target: 'x86_64-pc-windows-gnu',
            projectId: 'myproject'
        })
    });
    
    const { jobId } = await response.json();
    console.log('Compilation started:', jobId);
    
    // Esperar resultado
    let completed = false;
    while (!completed) {
        const status = await fetch(`http://localhost:3000/api/compile/${jobId}/status`)
            .then(r => r.json());
        
        console.log(status);
        
        if (status.status === 'completed') {
            completed = true;
            window.location.href = `http://localhost:3000/api/compile/${jobId}/download`;
        } else if (status.status === 'failed') {
            console.error(status.error);
            break;
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }
};
```

---

## <a name="roadmap"></a>6. ROADMAP PASO A PASO

### Semana 1-2: Setup Backend
- [ ] Configurar repo Node.js
- [ ] Instalar LLVM/GCC en servidor
- [ ] Crear servidor Express básico
- [ ] Implementar rutas API

### Semana 3-4: Compilación Local
- [ ] Implementar CompilerService
- [ ] Integrar con LLVM/GCC
- [ ] Pruebas de compilación C→binario
- [ ] Manejo de errores de compilación

### Semana 5-6: Cola de Compilación
- [ ] Setup Redis
- [ ] Implementar BullMQ queue
- [ ] Multi-worker processing
- [ ] WebSocket updates

### Semana 7-8: Generación de Código
- [ ] Convertir AST a C
- [ ] Generar LLVM IR
- [ ] Optimizaciones básicas
- [ ] Manejo de tipos Portul

### Semana 9-10: Integración Frontend
- [ ] Componente CompilerPanel
- [ ] Descarga de binarios
- [ ] Progress tracking
- [ ] Error display

### Semana 11-12: Producción
- [ ] Docker containerization
- [ ] Cloud deployment (AWS/Heroku)
- [ ] Load testing
- [ ] Optimizaciones finales

---

## Comandos útiles

```bash
# Iniciar servidor desarrollo
npm run dev

# Compilar TypeScript
npm run build

# Correr tests
npm run test

# Ver estadísticas queue
npm run stats

# Limpiar binarios antiguos
npm run cleanup
```

---

## Conclusión

Este plan proporciona una arquitectura profesional para compilar Portul a ejecutables reales. La clave es:

1. **Usar LLVM/GCC** - Compiladores probados en producción
2. **Queue de compilaciones** - BullMQ para manejar concurrencia
3. **Backend Node.js** - Fácil integración con React frontend
4. **Almacenamiento escalable** - MinIO/S3 para binarios
5. **Pipeline modular** - Parse → Semantic → CodeGen → Compile

¡Listo para implementar!
