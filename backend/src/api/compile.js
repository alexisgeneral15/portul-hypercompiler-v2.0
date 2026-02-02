import { v4 as uuid } from 'uuid';
import { compilationQueue } from '../queue/index.js';
import { storage } from '../storage/index.js';
import { PortulCompiler } from '../compiler/index.js';

const compilationCache = new Map();

export async function compileRoute(req, res, next) {
  try {
    const { code, target = 'windows-x64', projectId, filename = 'output' } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'código es requerido' });
    }

    const compilationId = uuid();
    
    try {
      console.log(`\n[COMPILE] Starting compilation of ${filename}`);
      console.log(`[COMPILE] Code length: ${code.length} bytes`);
      
      // Compilar inmediatamente
      const compiler = new PortulCompiler();
      
      // Phase 1: Parse (Lexer + Parser)
      console.log('[COMPILE] Phase 1: Parsing...');
      const ast = compiler.parse(code);
      console.log('[COMPILE] Phase 1: ✓ Parsing complete');
      
      // Phase 2: Semantic Analysis
      console.log('[COMPILE] Phase 2: Semantic analysis...');
      compiler.semanticCheck(ast);
      console.log('[COMPILE] Phase 2: ✓ Semantic check passed');
      
      // Phase 3: Generate IR
      console.log('[COMPILE] Phase 3: IR generation...');
      const ir = compiler.generateIR(ast);
      console.log(`[COMPILE] Phase 3: ✓ IR generated (${ir.length} bytes)`);
      
      // Phase 4: LLVM Compilation
      console.log('[COMPILE] Phase 4: LLVM compilation...');
      const exeBuffer = compiler.compile(ir, target);
      console.log(`[COMPILE] Phase 4: ✓ EXE generated (${exeBuffer.length} bytes)`);
      
      // Save to storage
      await storage.saveCode(compilationId, code);
      await storage.saveExe(compilationId, exeBuffer);
      
      // Guarda metadata
      const metadata = {
        id: compilationId,
        projectId,
        filename,
        target,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 100,
        exeSize: exeBuffer.length,
        sourceSize: code.length,
        phases: {
          lexer: '✓',
          parser: '✓',
          semantic: '✓',
          ir: '✓',
          llvm: '✓'
        }
      };
      
      compilationCache.set(compilationId, metadata);
      
      console.log(`[COMPILE] ✓ SUCCESS - Compilation ${compilationId} completed\n`);
      
      res.status(200).json({
        id: compilationId,
        status: 'completed',
        message: 'Compilación exitosa',
        filename: `${filename}.exe`,
        downloadUrl: `/api/download/${compilationId}`,
        exeSize: exeBuffer.length,
        sourceSize: code.length
      });
      
    } catch (compileError) {
      console.error('[COMPILE] Compilation error:', compileError.message);
      
      const errorMetadata = {
        id: compilationId,
        status: 'error',
        error: compileError.message,
        createdAt: new Date()
      };
      
      compilationCache.set(compilationId, errorMetadata);
      
      return res.status(400).json({
        id: compilationId,
        status: 'error',
        message: 'Error de compilación',
        error: compileError.message,
        details: compileError.stack
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function statusRoute(req, res, next) {
  try {
    const { id } = req.params;
    
    // Primero check en cache
    let compilation = compilationCache.get(id);
    
    if (!compilation) {
      // Luego check en storage
      compilation = await storage.getCompilation(id);
    }
    
    if (!compilation) {
      return res.status(404).json({ error: 'Compilación no encontrada' });
    }
    
    res.json(compilation);
  } catch (error) {
    next(error);
  }
}

export async function downloadRoute(req, res, next) {
  try {
    const { id } = req.params;
    const file = await storage.getExe(id);
    
    if (!file) {
      return res.status(404).json({ error: 'Ejecutable no encontrado o aún compilando' });
    }
    
    res.download(file, `portul-program-${id.substring(0, 8)}.exe`);
  } catch (error) {
    next(error);
  }
}

export async function historyRoute(req, res, next) {
  try {
    const history = Array.from(compilationCache.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
    
    res.json({ compilations: history });
  } catch (error) {
    next(error);
  }
}