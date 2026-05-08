#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🧪 PASO 3: Validación de memory/arena.portul            ║');
console.log('║  Allocador determinista para Portul                      ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

try {
  const arenaPath = path.join(__dirname, 'src/memory/arena.portul');
  if (!fs.existsSync(arenaPath)) {
    console.error('❌ Error: Archivo no encontrado:', arenaPath);
    process.exit(1);
  }

  const sourceCode = fs.readFileSync(arenaPath, 'utf8');
  console.log(`✓ Archivo leído: ${sourceCode.length} bytes\n`);

  const lines = sourceCode.split('\n');
  const newCount = (sourceCode.match(/^new\s+/gm) || []).length;
  const expCount = (sourceCode.match(/^exp\s+/gm) || []).length;
  const useCount = (sourceCode.match(/^use\s+/gm) || []).length;

  console.log('📊 Estadísticas del archivo:');
  console.log(`  • Líneas: ${lines.length}`);
  console.log(`  • Funciones (new): ${newCount}`);
  console.log(`  • Exports: ${expCount}`);
  console.log(`  • Imports (use): ${useCount}\n`);

  const required = [
    'ArenaInit', 'alloc', 'own_track', 'scope_enter', 'scope_exit', 'ArenaReset',
    'alloc_txt', 'alloc_num_ary', 'alloc_obj', 'clone_buf'
  ];

  let missing = [];
  required.forEach(name => {
    if (!sourceCode.includes(`new ${name}`) && !sourceCode.includes(`exp ${name}`)) {
      missing.push(name);
    }
  });

  const hasUse = sourceCode.includes('use "sys/types"');
  if (!hasUse) missing.push('use "sys/types"');

  if (missing.length > 0) {
    console.error('❌ Faltan declaraciones requeridas:');
    missing.forEach(m => console.error(`  • ${m}`));
    process.exit(1);
  }

  if (!sourceCode.includes('num ARENA_SIZE = 65536') || !sourceCode.includes('num ALIGN_MASK = 0xFFFFFFFFFFFFFFF8')) {
    console.warn('⚠️  Verifica valores de configuración ARENA_SIZE/ALIGN_MASK.');
  }

  console.log('✅ PASO 3 COMPLETADO: memory/arena.portul tiene todas las declaraciones requeridas');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Error durante la validación:', err.message);
  process.exit(1);
}
