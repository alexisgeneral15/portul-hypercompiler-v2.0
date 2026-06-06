// backend/src/compiler/compiler.js
import { tokenize } from './lexer.js';
import { parse } from './parser.js'; // Tu parser actual
import { PTSLowerer } from './ptsLowerer.js';
import { analyze } from './semanticAnalyzer.js';
import { generateIR } from './irGenerator.js';
import { compileLLVM } from './llvmCompiler.js';

export async function compilePortul(sourceCode, options = {}) {
  try {
    // 1. Tokenización
    const tokens = tokenize(sourceCode);
    
    // 2. Parseo a AST (El parser debe ser capaz de leer la sintaxis PTS)
    // Nota: Si tu parser actual solo lee Portul nativo, necesitaremos un 'ptsParser.js' 
    // o extender el actual para entender 'class', 'fn', '=', '==', etc.
    let ast = parse(tokens);

    // 3. ➕ NUEVO: FASE DE LOWERING (Abstracción de Costo Cero)
    // Si detectamos que es código PortulScript, lo bajamos a AST de Portul v1.0A3
    if (options.mode === 'portulscript' || detectPTSSyntax(ast)) {
      const lowerer = new PTSLowerer();
      ast = lowerer.lower(ast);
    }

    // 4. Análisis Semántico (Ahora solo ve AST de Portul v1.0A3 puro)
    const symbols = analyze(ast);

    // 5. Generación de IR (LLVM)
    const ir = generateIR(ast, symbols);

    // 6. Compilación a Binario
    const executablePath = await compileLLVM(ir, options);

    return { success: true, executablePath, ir, ast };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper simple para detectar si el AST viene de PTS
function detectPTSSyntax(ast) {
  const astString = JSON.stringify(ast);
  return astString.includes('BinaryExpression') || 
         astString.includes('ForInStatement') || 
         astString.includes('ClassDeclaration');
}
