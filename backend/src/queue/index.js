import Queue from 'bull';
import { PortulCompiler } from '../compiler/index.js';
import { storage } from '../storage/index.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const compilationQueue = new Queue('portul-compilations', REDIS_URL);

// Worker: Procesa compilaciones
compilationQueue.process(8, async (job) => {
  const { compilationId, code, target } = job.data;
  
  console.log(`[Worker] Compilando ${compilationId}...`);
  job.progress(10);
  
  try {
    const compiler = new PortulCompiler();
    
    // Parse y validación
    job.progress(20);
    const ast = compiler.parse(code);
    
    // Semantic check
    job.progress(40);
    compiler.semanticCheck(ast);
    
    // Generar LLVM IR
    job.progress(60);
    const ir = compiler.generateIR(ast);
    await storage.saveIR(compilationId, ir);
    
    // Compilar a .exe
    job.progress(80);
    const exeBuffer = compiler.compile(ir, target);
    await storage.saveExe(compilationId, exeBuffer);
    
    job.progress(100);
    
    // Guardar metadata
    await storage.saveCompilation(compilationId, {
      id: compilationId,
      status: 'compiled',
      target,
      createdAt: new Date(),
      completedAt: new Date(),
      ir,
      exeSize: exeBuffer.length
    });
    
    return { success: true, compilationId, exeSize: exeBuffer.length };
  } catch (error) {
    console.error(`[Worker] Error compilando ${compilationId}:`, error.message);
    
    await storage.saveCompilation(compilationId, {
      id: compilationId,
      status: 'failed',
      error: error.message,
      createdAt: new Date(),
      failedAt: new Date()
    });
    
    throw error;
  }
});

// Event listeners
compilationQueue.on('completed', (job, result) => {
  console.log(`[Queue] Compilación completada: ${result.compilationId}`);
});

compilationQueue.on('failed', (job, error) => {
  console.error(`[Queue] Compilación fallida: ${job.data.compilationId}`, error.message);
});

compilationQueue.on('progress', (job, progress) => {
  console.log(`[Queue] ${job.data.compilationId}: ${progress}%`);
});