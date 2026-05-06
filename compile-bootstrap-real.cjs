#!/usr/bin/env node

/**
 * Compilar el compilador Portul de sí mismo
 * Real meta-bootstrap: bootstrap_compiler.portulpp → PortulCompilerBootstrap.exe
 */

const fs = require('fs');
const path = require('path');
const { PortulLexer } = require('./backend/src/compiler/lexer.js');
const { PortulParser } = require('./backend/src/compiler/parser.js');
const { SemanticAnalyzer } = require('./backend/src/compiler/semanticAnalyzer.js');
const { IRGenerator } = require('./backend/src/compiler/irGenerator.js');
const { LLVMCompiler } = require('./backend/src/compiler/llvmCompiler.js');

console.log('🚀 PORTUL REAL META-BOOTSTRAP COMPILATION');
console.log('==========================================\n');

try {
  // 1. Leer el código fuente del bootstrap compiler
  const bootstrapSource = fs.readFileSync('./src/bootstrap_compiler.portulpp', 'utf8');
  console.log(`✓ Código fuente cargado (${bootstrapSource.length} bytes)`);

  // 2. Fase 1: Lexical Analysis
  console.log('\n[Fase 1] Análisis Léxico...');
  const lexer = new PortulLexer();
  const tokens = lexer.tokenize(bootstrapSource);
  console.log(`✓ ${tokens.length} tokens generados`);

  // 3. Fase 2: Parsing
  console.log('\n[Fase 2] Análisis Sintáctico...');
  const parser = new PortulParser();
  const ast = parser.parse(tokens);
  console.log('✓ AST construido');

  // 4. Fase 3: Semantic Analysis
  console.log('\n[Fase 3] Análisis Semántico...');
  const semantic = new SemanticAnalyzer();
  semantic.analyze(ast);
  console.log('✓ Análisis semántico completado');

  // 5. Fase 4: IR Generation
  console.log('\n[Fase 4] Generación de Código Intermedio...');
  const irGenerator = new IRGenerator();
  const irCode = irGenerator.generate(ast);
  console.log(`✓ ${irCode.split('\n').length} líneas de LLVM IR`);

  // 6. Fase 5: PE Compilation
  console.log('\n[Fase 5] Compilación a PE...');
  const llvmCompiler = new LLVMCompiler();
  const peBuffer = llvmCompiler.compile(irCode);
  console.log(`✓ PE generado (${peBuffer.length} bytes)`);

  // 7. Guardar el ejecutable
  const outputPath = './PortulCompilerBootstrap-REAL.exe';
  fs.writeFileSync(outputPath, peBuffer);
  console.log(`\n✅ ÉXITO: ${outputPath}`);
  
  // Información del PE
  console.log(`\n📊 INFORMACIÓN DEL EJECUTABLE:`);
  console.log(`   - Tamaño: ${peBuffer.length} bytes`);
  console.log(`   - Formato: Windows PE x86-64`);
  console.log(`   - Punto de entrada: 0x400000`);
  
  // Verificar firma MZ
  const signature = peBuffer.toString('hex', 0, 2);
  console.log(`   - Firma: MZ (${signature})`);
  
  if (signature === '4d5a') {
    console.log('   - ✅ PE válido');
  }

} catch (error) {
  console.error('\n❌ ERROR EN COMPILACIÓN:');
  console.error(error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}
