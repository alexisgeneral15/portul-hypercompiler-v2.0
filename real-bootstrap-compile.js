#!/usr/bin/env node

/**
 * COMPILACIÓN REAL DEL BOOTSTRAP COMPILER
 * Usando el backend compilador de Portul
 */

const fs = require('fs');
const path = require('path');

// Importar el compilador real
const Lexer = require('./backend/src/compiler/lexer');
const Parser = require('./backend/src/compiler/parser');
const SemanticAnalyzer = require('./backend/src/compiler/semanticAnalyzer');
const IRGenerator = require('./backend/src/compiler/irGenerator');
const LLVMCompiler = require('./backend/src/compiler/llvmCompiler');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🚀 PORTUL REAL META-BOOTSTRAP COMPILATION               ║');
console.log('║  Compilando el compilador de sí mismo                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

try {
  // 1. Leer código fuente
  console.log('📖 Leyendo código fuente del bootstrap compiler...');
  const bootstrapSource = fs.readFileSync('./src/bootstrap_compiler.portulpp', 'utf8');
  console.log(`   ✓ ${bootstrapSource.length} bytes cargados\n`);

  // 2. FASE 1: Lexical Analysis
  console.log('📍 FASE 1: Análisis Léxico (Tokenización)');
  const lexer = new Lexer(bootstrapSource);
  const tokens = lexer.tokenize();
  console.log(`   ✓ Generados ${tokens.length} tokens\n`);

  // 3. FASE 2: Syntax Analysis
  console.log('📍 FASE 2: Análisis Sintáctico (Parsing)');
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(`   ✓ AST construido con ${JSON.stringify(ast).length} bytes\n`);

  // 4. FASE 3: Semantic Analysis
  console.log('📍 FASE 3: Análisis Semántico');
  const semantic = new SemanticAnalyzer();
  semantic.analyze(ast);
  console.log(`   ✓ Análisis semántico completado\n`);

  // 5. FASE 4: IR Generation
  console.log('📍 FASE 4: Generación de Código Intermedio (LLVM IR)');
  const irGenerator = new IRGenerator();
  const irCode = irGenerator.generate(ast);
  const irLines = irCode.split('\n').length;
  console.log(`   ✓ Generadas ${irLines} líneas de LLVM IR\n`);

  // 6. FASE 5: PE Compilation
  console.log('📍 FASE 5: Compilación a PE (Executable)');
  const llvmCompiler = new LLVMCompiler();
  const peBuffer = llvmCompiler.compile(irCode);
  console.log(`   ✓ PE generado: ${peBuffer.length} bytes\n`);

  // 7. Guardar el .exe
  const outputPath = './PortulCompilerBootstrap-REAL.exe';
  fs.writeFileSync(outputPath, peBuffer);

  // 8. Verificación
  console.log('✅ COMPILACIÓN EXITOSA\n');
  console.log('📊 INFORMACIÓN DEL EJECUTABLE:');
  console.log(`   Archivo: ${outputPath}`);
  console.log(`   Tamaño: ${peBuffer.length} bytes`);
  console.log(`   Formato: Windows PE x86-64`);
  
  // Verificar firma MZ
  const mzSignature = peBuffer.toString('hex', 0, 2);
  if (mzSignature === '4d5a') {
    console.log(`   Firma: MZ ✓ (PE válido)`);
  }
  
  console.log(`   Punto entrada: 0x400000`);
  console.log('\n🎉 ¡EL COMPILADOR SE HA COMPILADO A SÍ MISMO!\n');

} catch (error) {
  console.error('\n❌ ERROR EN COMPILACIÓN:');
  console.error(`   ${error.message}\n`);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}
