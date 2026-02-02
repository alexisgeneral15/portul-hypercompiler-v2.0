#!/usr/bin/env node

/**
 * COMPILACIÓN REAL DEL BOOTSTRAP COMPILER
 * Desde el backend - usando require
 */

const fs = require('fs');
const path = require('path');

// Importar compilador
const Lexer = require('./src/compiler/lexer');
const Parser = require('./src/compiler/parser');
const SemanticAnalyzer = require('./src/compiler/semanticAnalyzer');
const IRGenerator = require('./src/compiler/irGenerator');
const LLVMCompiler = require('./src/compiler/llvmCompiler');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🚀 PORTUL REAL META-BOOTSTRAP COMPILATION               ║');
console.log('║  El compilador compilándose a sí mismo...                ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

try {
  // Leer código fuente del bootstrap
  console.log('📖 Leyendo bootstrap_compiler.portulpp...');
  const bootstrapPath = path.join(__dirname, '../src/bootstrap_compiler.portulpp');
  const bootstrapSource = fs.readFileSync(bootstrapPath, 'utf8');
  console.log(`   ✓ ${bootstrapSource.length} bytes\n`);

  // FASE 1
  console.log('FASE 1️⃣  Análisis Léxico...');
  const lexer = new Lexer(bootstrapSource);
  const tokens = lexer.tokenize();
  console.log(`   ✓ ${tokens.length} tokens\n`);

  // FASE 2
  console.log('FASE 2️⃣  Análisis Sintáctico...');
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(`   ✓ AST generado\n`);

  // FASE 3
  console.log('FASE 3️⃣  Análisis Semántico...');
  const semantic = new SemanticAnalyzer();
  semantic.analyze(ast);
  console.log(`   ✓ Validación completada\n`);

  // FASE 4
  console.log('FASE 4️⃣  Generación de IR...');
  const irGen = new IRGenerator();
  const irCode = irGen.generate(ast);
  console.log(`   ✓ ${irCode.split('\n').length} líneas LLVM\n`);

  // FASE 5
  console.log('FASE 5️⃣  Compilación a PE...');
  const compiler = new LLVMCompiler();
  const peBuffer = compiler.compile(irCode);
  console.log(`   ✓ ${peBuffer.length} bytes\n`);

  // Guardar
  const outPath = path.join(__dirname, '../PortulCompilerBootstrap-REAL.exe');
  fs.writeFileSync(outPath, peBuffer);

  console.log('✅ ÉXITO\n');
  console.log('📊 RESULTADO:');
  console.log(`   Archivo: PortulCompilerBootstrap-REAL.exe`);
  console.log(`   Tamaño: ${peBuffer.length} bytes`);
  console.log(`   Firma MZ: ${peBuffer.toString('hex', 0, 2) === '4d5a' ? '✓' : '✗'}`);
  console.log('\n🎉 ¡BOOTSTRAP COMPLETADO!\n');

} catch (error) {
  console.error('\n❌ ERROR:');
  console.error(`   ${error.message}\n`);
  process.exit(1);
}
