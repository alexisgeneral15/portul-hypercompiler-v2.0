#!/usr/bin/env node
/**
 * EJEMPLOS DE CÓDIGO - Compilador Portul
 * Archivos listos para copiar y usar
 */

// ============================================================
// EJEMPLO 1: Cliente curl básico
// ============================================================

/*
# Compilar código
curl -X POST http://localhost:3000/api/compile/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "fn fibonacci(n: int) -> int {\n  if n <= 1 { return n }\n  return fibonacci(n-1) + fibonacci(n-2)\n}",
    "target": "windows",
    "projectId": "fib-project"
  }'

Respuesta:
{
  "jobId": "job-1704067200000-xyz",
  "status": "queued"
}

# Poll para estado
while true; do
  curl http://localhost:3000/api/compile/job-1704067200000-xyz/status
  sleep 2
done

# Descargar
curl http://localhost:3000/api/compile/job-1704067200000-xyz/download -O
file program.exe
*/

// ============================================================
// EJEMPLO 2: Cliente JavaScript/Node.js
// ============================================================

import fetch from 'node-fetch';
import fs from 'fs';

class PortulCompilerClient {
    private serverUrl: string;
    
    constructor(serverUrl = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
    }
    
    async compile(
        sourceCode: string,
        target: 'windows' | 'linux' | 'macos' | 'wasm' = 'windows',
        projectId: string = 'default'
    ): Promise<{ jobId: string; binary: Buffer }> {
        console.log('📤 Enviando código para compilar...');
        
        // Paso 1: Enviar código
        const submitResponse = await fetch(`${this.serverUrl}/api/compile/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCode,
                target,
                projectId,
                userId: 'user-1'
            })
        });
        
        if (!submitResponse.ok) {
            throw new Error(`Submit failed: ${submitResponse.statusText}`);
        }
        
        const { jobId } = await submitResponse.json() as { jobId: string };
        console.log(`✓ Compilación en cola: ${jobId}`);
        
        // Paso 2: Poll hasta completar
        let completed = false;
        let attempts = 0;
        const maxAttempts = 120; // 2 minutos
        
        while (!completed && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 1000)); // Esperar 1s
            attempts++;
            
            const statusResponse = await fetch(
                `${this.serverUrl}/api/compile/${jobId}/status`
            );
            const status = await statusResponse.json() as {
                status: string;
                stage: string;
                progress: number;
                error?: string;
            };
            
            console.log(`  [${status.stage}] ${status.progress}%`);
            
            if (status.status === 'completed') {
                console.log('✓ Compilación completada');
                completed = true;
            } else if (status.status === 'failed') {
                throw new Error(`Compilation failed: ${status.error}`);
            }
        }
        
        if (!completed) {
            throw new Error('Compilation timeout');
        }
        
        // Paso 3: Descargar binario
        console.log('📥 Descargando binario...');
        const downloadResponse = await fetch(
            `${this.serverUrl}/api/compile/${jobId}/download`
        );
        
        if (!downloadResponse.ok) {
            throw new Error(`Download failed: ${downloadResponse.statusText}`);
        }
        
        const binary = await downloadResponse.buffer();
        console.log(`✓ Descargado (${binary.length} bytes)`);
        
        return { jobId, binary };
    }
    
    async compileFile(filePath: string, target?: string): Promise<Buffer> {
        const sourceCode = fs.readFileSync(filePath, 'utf-8');
        const projectId = filePath.split('/').pop()?.split('.')[0] || 'project';
        
        const { binary } = await this.compile(sourceCode, target as any, projectId);
        return binary;
    }
}

// Uso:
async function example1() {
    const client = new PortulCompilerClient();
    
    const code = `
        fn add(a: int, b: int) -> int {
            return a + b
        }
        
        fn main() {
            let result: int = add(5, 3)
            print(result)
        }
    `;
    
    try {
        const { jobId, binary } = await client.compile(code, 'windows', 'math-app');
        
        // Guardar binario
        const ext = 'exe';
        const outputFile = `./program.${ext}`;
        fs.writeFileSync(outputFile, binary);
        console.log(`✓ Guardado en: ${outputFile}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================================
// EJEMPLO 3: Wrapper para Portul REPL
// ============================================================

class PortulREPLCompiler {
    private client: PortulCompilerClient;
    private userCode: string[] = [];
    
    constructor() {
        this.client = new PortulCompilerClient();
    }
    
    /**
     * Ejecutar línea en REPL
     */
    async evalLine(line: string): Promise<string> {
        this.userCode.push(line);
        
        // Crear programa completo
        const program = [
            ...this.userCode.slice(0, -1), // Código anterior sin última línea
            `// Eval: ${line}`,
            line,
            'fn main() { }' // main vacío para compilar
        ].join('\n');
        
        try {
            // Validar compilando
            const { binary } = await this.client.compile(program, 'linux', 'repl-eval');
            
            if (binary.length > 0) {
                return `✓ OK (${binary.length} bytes)`;
            }
        } catch (error) {
            // Quittar última línea si falla
            this.userCode.pop();
            return `✗ Error: ${error}`;
        }
    }
    
    getHistory(): string[] {
        return this.userCode;
    }
}

// ============================================================
// EJEMPLO 4: Batch compiler para múltiples archivos
// ============================================================

class BatchPortulCompiler {
    private client: PortulCompilerClient;
    private maxConcurrent: number;
    
    constructor(maxConcurrent = 4) {
        this.client = new PortulCompilerClient();
        this.maxConcurrent = maxConcurrent;
    }
    
    async compileDirectory(
        dirPath: string,
        outputDir: string,
        target: 'windows' | 'linux' = 'linux'
    ): Promise<{ success: number; failed: number; results: any[] }> {
        const fs = require('fs/promises');
        const path = require('path');
        
        const files = (await fs.readdir(dirPath))
            .filter((f: string) => f.endsWith('.portul'));
        
        console.log(`📦 Compilando ${files.length} archivos...`);
        
        const results: any[] = [];
        let successCount = 0;
        let failCount = 0;
        
        // Compilar en lotes
        for (let i = 0; i < files.length; i += this.maxConcurrent) {
            const batch = files.slice(i, i + this.maxConcurrent);
            
            const promises = batch.map(async (file: string) => {
                try {
                    const filePath = path.join(dirPath, file);
                    const sourceCode = await fs.readFile(filePath, 'utf-8');
                    
                    console.log(`  Compilando: ${file}`);
                    
                    const { binary } = await this.client.compile(
                        sourceCode,
                        target,
                        file.replace('.portul', '')
                    );
                    
                    // Guardar binario
                    const outPath = path.join(
                        outputDir,
                        file.replace('.portul', target === 'windows' ? '.exe' : '')
                    );
                    
                    await fs.writeFile(outPath, binary);
                    
                    successCount++;
                    results.push({
                        file,
                        status: 'success',
                        output: outPath,
                        size: binary.length
                    });
                    
                } catch (error) {
                    failCount++;
                    results.push({
                        file,
                        status: 'failed',
                        error: error.message
                    });
                }
            });
            
            await Promise.all(promises);
        }
        
        console.log(`✓ Completado: ${successCount} éxito, ${failCount} fallos`);
        
        return { success: successCount, failed: failCount, results };
    }
}

// ============================================================
// EJEMPLO 5: CI/CD Integration
// ============================================================

class PortulCICD {
    private client: PortulCompilerClient;
    
    constructor() {
        this.client = new PortulCompilerClient();
    }
    
    /**
     * GitHub Actions compatible
     */
    async buildAndTest(
        sourceDir: string,
        outputDir: string
    ): Promise<{ passed: boolean; report: any }> {
        const fs = require('fs').promises;
        const path = require('path');
        
        const report = {
            timestamp: new Date().toISOString(),
            source: sourceDir,
            output: outputDir,
            results: [] as any[]
        };
        
        try {
            // 1. Compile todos los archivos
            console.log('🔨 [CI] Compilando...');
            const files = (await fs.readdir(sourceDir))
                .filter((f: string) => f.endsWith('.portul'));
            
            for (const file of files) {
                const filePath = path.join(sourceDir, file);
                const sourceCode = await fs.readFile(filePath, 'utf-8');
                
                try {
                    const { binary } = await this.client.compile(
                        sourceCode,
                        'linux',
                        file.replace('.portul', '')
                    );
                    
                    report.results.push({
                        file,
                        status: 'compiled',
                        size: binary.length
                    });
                    
                    console.log(`  ✓ ${file} (${binary.length} bytes)`);
                    
                } catch (error) {
                    report.results.push({
                        file,
                        status: 'failed',
                        error: error.message
                    });
                    
                    console.error(`  ✗ ${file}: ${error.message}`);
                    return { passed: false, report };
                }
            }
            
            console.log('✓ [CI] Build exitoso');
            return { passed: true, report };
            
        } catch (error) {
            report.results.push({
                status: 'error',
                error: error.message
            });
            
            return { passed: false, report };
        }
    }
}

// ============================================================
// EJEMPLO 6: WebSocket client (tiempo real)
// ============================================================

import { io, Socket } from 'socket.io-client';

class PortulCompilerWebSocket {
    private socket: Socket;
    private jobListeners: Map<string, (data: any) => void> = new Map();
    
    constructor(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
        
        this.socket.on('connect', () => {
            console.log('✓ WebSocket conectado');
        });
        
        this.setupListeners();
    }
    
    private setupListeners(): void {
        // Escuchar todas las compilaciones
        this.socket.onAny((event: string, data: any) => {
            if (event.startsWith('compilation-')) {
                const jobId = event.replace('compilation-', '');
                const listener = this.jobListeners.get(jobId);
                if (listener) {
                    listener(data);
                }
            }
        });
    }
    
    async compile(
        sourceCode: string,
        target: 'windows' | 'linux' = 'windows',
        onProgress?: (data: any) => void
    ): Promise<{ jobId: string; binary: Buffer }> {
        // Enviar código
        const response = await fetch('http://localhost:3000/api/compile/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCode,
                target,
                projectId: 'ws-project'
            })
        });
        
        const { jobId } = (await response.json()) as { jobId: string };
        console.log(`Compilation started: ${jobId}`);
        
        // Registrar listener
        if (onProgress) {
            this.jobListeners.set(jobId, onProgress);
            this.socket.emit('watch-compilation', jobId);
        }
        
        // Esperar completación
        return new Promise((resolve, reject) => {
            const listener = (data: any) => {
                console.log(`[${data.stage}] ${data.progress}%`);
                
                if (data.status === 'completed') {
                    this.jobListeners.delete(jobId);
                    // Descargar binario
                    fetch(`http://localhost:3000/api/compile/${jobId}/download`)
                        .then(r => r.buffer())
                        .then(binary => resolve({ jobId, binary }))
                        .catch(reject);
                } else if (data.status === 'failed') {
                    this.jobListeners.delete(jobId);
                    reject(new Error(data.error));
                }
            };
            
            this.jobListeners.set(jobId, listener);
            this.socket.emit('watch-compilation', jobId);
        });
    }
    
    close(): void {
        this.socket.disconnect();
    }
}

// ============================================================
// EJEMPLO 7: Uso práctico
// ============================================================

async function runExamples() {
    console.log('🚀 Portul Compiler - Ejemplos\n');
    
    // Ejemplo 1: Compilación simple
    console.log('Example 1: Simple compilation');
    console.log('================================\n');
    
    const client = new PortulCompilerClient();
    
    const code = `
        fn square(x: int) -> int {
            return x * x
        }
        
        fn main() {
            let result: int = square(5)
            print(result)
        }
    `;
    
    try {
        console.log('Code to compile:');
        console.log(code);
        console.log('\nCompiling...\n');
        
        const { jobId, binary } = await client.compile(code, 'windows', 'square-app');
        
        console.log(`\n✓ Success!`);
        console.log(`  Job ID: ${jobId}`);
        console.log(`  Binary size: ${binary.length} bytes`);
        
    } catch (error) {
        console.error('✗ Compilation failed:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runExamples().catch(console.error);
}

export {
    PortulCompilerClient,
    PortulREPLCompiler,
    BatchPortulCompiler,
    PortulCICD,
    PortulCompilerWebSocket
};

