#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🧪 PASO 6: Validación de core/bridge.portul            ║');
console.log('║  I/O y compilación en caliente para Portul IDE          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

try {
  const bridgePath = path.join(__dirname, 'src/core/bridge.portul');
  if (!fs.existsSync(bridgePath)) {
    console.error('❌ No se encontró:', bridgePath);
    process.exit(1);
  }

  const source = fs.readFileSync(bridgePath, 'utf8');
  console.log(`✓ Archivo leído: ${source.length} bytes\n`);

  const required = [
    'txt compile_msg = "READY";',
    'num compiling = 0;',
    'new CompileProject ptr buf, num len, txt out_path {',
    'new OpenProject txt path, ptr ed {',
    'new GetCompileStatus txt { ret compile_msg; }',
    'exp CompileProject;',
    'exp OpenProject;',
    'exp GetCompileStatus;'
  ];

  const missing = required.filter(item => !source.includes(item));
  if (missing.length > 0) {
    console.error('❌ Faltan declaraciones en core/bridge.portul:');
    missing.forEach(item => console.error(`  • ${item}`));
    process.exit(1);
  }

  console.log('✅ PASO 6 COMPLETADO: core/bridge.portul contiene las declaraciones requeridas');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Error durante la prueba:', err.message);
  process.exit(1);
}
