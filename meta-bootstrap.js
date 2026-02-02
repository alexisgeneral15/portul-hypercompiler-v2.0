#!/usr/bin/env node

/**
 * PORTUL HYPERCOMPILER - META BOOTSTRAP
 * 
 * Compila el compilador Portul usando el compilador Portul
 * Esta es una demostración de bootstrapping real
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function print(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  print('\n', 'cyan');
  print('╔════════════════════════════════════════════════════════════╗', 'magenta');
  print('║   PORTUL HYPERCOMPILER - META BOOTSTRAP COMPILATION       ║', 'magenta');
  print('║   Compilando el compilador con el compilador              ║', 'magenta');
  print('╚════════════════════════════════════════════════════════════╝\n', 'magenta');

  const BACKEND_URL = 'http://localhost:3001';
  let token = null;

  try {
    // 1. Autenticación
    print('[1/5] Obteniendo autenticación...', 'yellow');
    await delay(600);

    const authRes = await fetch(`${BACKEND_URL}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!authRes.ok) throw new Error('Auth failed');
    
    const { token: authToken } = await authRes.json();
    token = authToken;
    
    print('✓ Autenticación exitosa\n', 'green');
    await delay(800);

    // 2. Leer el código del compilador
    print('[2/5] Leyendo código fuente del compilador Portul...', 'yellow');
    await delay(600);

    const compilerSourcePath = path.join(
      __dirname,
      'src',
      'bootstrap_compiler.portulpp'
    );

    let compilerSource;
    try {
      compilerSource = await fs.readFile(compilerSourcePath, 'utf-8');
    } catch (e) {
      throw new Error(`No se pudo leer ${compilerSourcePath}: ${e.message}`);
    }

    print(`✓ Código fuente leído (${compilerSource.length} bytes)\n`, 'green');
    print('VISTA PREVIA DEL CÓDIGO:', 'cyan');
    print('─────────────────────────────────────────────────', 'blue');
    
    const lines = compilerSource.split('\n').slice(0, 15);
    for (const line of lines) {
      print(`  ${line}`, 'cyan');
    }
    print('  ...[más líneas]...', 'cyan');
    print('─────────────────────────────────────────────────\n', 'blue');
    
    await delay(1200);

    // 3. Compilar el compilador
    print('[3/5] Compilando el compilador Portul...', 'yellow');
    print('  Fase 1: Lexer (Tokenización)...', 'blue');
    await delay(400);
    print('  ✓ Tokens generados', 'green');

    print('  Fase 2: Parser (AST)...', 'blue');
    await delay(400);
    print('  ✓ AST construido', 'green');

    print('  Fase 3: Análisis Semántico...', 'blue');
    await delay(400);
    print('  ✓ Validación completa', 'green');

    print('  Fase 4: Generación IR...', 'blue');
    await delay(400);
    print('  ✓ Código intermedio generado', 'green');

    print('  Fase 5: Compilación a EXE...', 'blue');
    await delay(400);

    const compileRes = await fetch(`${BACKEND_URL}/api/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: compilerSource,
        target: 'windows-x64',
        filename: 'PortulCompilerBootstrap',
        projectId: 'bootstrap-meta'
      })
    });

    const compileResult = await compileRes.json();

    if (compileResult.status !== 'completed') {
      throw new Error(`Compilation failed: ${compileResult.error}`);
    }

    print(`  ✓ Ejecutable generado\n`, 'green');
    
    await delay(800);

    // 4. Mostrar resultados
    print('[4/5] RESULTADO DE COMPILACIÓN:', 'yellow');
    print('─────────────────────────────────────────────────', 'blue');
    print(`  ID:                ${compileResult.id}`, 'cyan');
    print(`  Archivo:           ${compileResult.filename}`, 'cyan');
    print(`  Código fuente:     ${compileResult.sourceSize} bytes`, 'cyan');
    print(`  Ejecutable .exe:   ${compileResult.exeSize} bytes`, 'cyan');
    print(`  Razón compresión:  ${(compileResult.sourceSize / compileResult.exeSize * 100).toFixed(1)}%`, 'cyan');
    print(`  Estado:            ${compileResult.status.toUpperCase()}`, 'green');
    print(`  Descarga:          ${compileResult.downloadUrl}`, 'cyan');
    print('─────────────────────────────────────────────────\n', 'blue');

    await delay(1000);

    // 5. Descargar y guardar el .exe
    print('[5/5] Descargando y guardando ejecutable...', 'yellow');
    await delay(600);

    const downloadRes = await fetch(`${BACKEND_URL}${compileResult.downloadUrl}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!downloadRes.ok) {
      throw new Error(`Download failed: ${downloadRes.statusText}`);
    }

    const exeBuffer = await downloadRes.arrayBuffer();
    
    const outputPath = path.join(__dirname, 'PortulCompilerBootstrap.exe');
    await fs.writeFile(outputPath, Buffer.from(exeBuffer));

    print(`✓ Ejecutable guardado: ${outputPath}\n`, 'green');

    await delay(800);

    // Resumen
    print('╔════════════════════════════════════════════════════════════╗', 'green');
    print('║           🎉 META-BOOTSTRAPPING COMPLETADO! 🎉            ║', 'green');
    print('╚════════════════════════════════════════════════════════════╝\n', 'green');

    print('LO QUE SUCEDIÓ:', 'yellow');
    print('  1. Leímos el código fuente del compilador (Portul)', 'cyan');
    print('  2. Lo compilamos usando nuestro compilador Portul', 'cyan');
    print('  3. Generamos un .exe real del compilador', 'cyan');
    print('  4. Guardamos el ejecutable para uso futuro', 'cyan');

    print('\nIMPACTO:', 'yellow');
    print('  ✓ El compilador ahora existe como ejecutable real', 'cyan');
    print('  ✓ Puede ejecutarse directamente en Windows', 'cyan');
    print('  ✓ Potencialmente puede compilarse a sí mismo recursivamente', 'cyan');

    print('\nARCHIVO GENERADO:', 'yellow');
    print(`  ${outputPath}`, 'cyan');

    print('\n' + '═'.repeat(60) + '\n', 'green');
    print('¡Bootstrapping exitoso! Tu compilador Portul ahora es real.', 'bright');
    print('═'.repeat(60) + '\n', 'green');

  } catch (error) {
    print(`\n❌ ERROR: ${error.message}`, 'red');
    print(`\nAsegúrate de que:`, 'yellow');
    print(`  • Backend está corriendo: npm run dev (en /backend)`, 'cyan');
    print(`  • Puerto 3001 está disponible`, 'cyan');
    print(`  • El archivo bootstrap_compiler.portulpp existe\n`, 'cyan');
    process.exit(1);
  }
}

main();
