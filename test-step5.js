#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🧪 PASO 5: Validación de ui/window.portul y src/main.portul ║');
console.log('║  WndProc, message loop y entrypoint                        ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

const files = [
  { path: path.join(__dirname, 'src/ui/window.portul'), name: 'ui/window.portul' },
  { path: path.join(__dirname, 'src/main.portul'), name: 'src/main.portul' }
];

let failed = false;

for (const file of files) {
  if (!fs.existsSync(file.path)) {
    console.error(`❌ No se encontró ${file.name}: ${file.path}`);
    failed = true;
    continue;
  }

  const source = fs.readFileSync(file.path, 'utf8');
  console.log(`✓ ${file.name} leído: ${source.length} bytes`);

  const checks = file.name === 'ui/window.portul'
    ? [
        'use "sys/types";',
        'use "sys/winapi";',
        'use "memory/arena";',
        'use "ui/editor";',
        'new WndProc ptr hwnd, num msg, u64 wParam, i64 lParam i64 {',
        'new RunIDE num hInst, ptr cmdLine err {',
        'exp WndProc;',
        'exp RunIDE;'
      ]
    : [
        'use "sys/types";',
        'use "sys/winapi";',
        'use "ui/window";',
        'new main num argc, ptr argv num {',
        'exp main;'
      ];

  const missing = checks.filter(check => !source.includes(check));
  if (missing.length > 0) {
    console.error(`❌ Faltan declaraciones en ${file.name}:`);
    missing.forEach(m => console.error(`  • ${m}`));
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('\n✅ PASO 5 COMPLETADO: ui/window.portul y src/main.portul contienen las declaraciones requeridas');
process.exit(0);
