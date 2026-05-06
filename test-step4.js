#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🧪 PASO 4: Validación de ui/editor.portul              ║');
console.log('║  Editor nativo para Portul IDE                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

try {
  const editorPath = path.join(__dirname, 'src/ui/editor.portul');
  if (!fs.existsSync(editorPath)) {
    console.error('❌ Archivo no encontrado:', editorPath);
    process.exit(1);
  }

  const sourceCode = fs.readFileSync(editorPath, 'utf8');
  console.log(`✓ Archivo leído: ${sourceCode.length} bytes\n`);

  const requiredStrings = [
    'use "sys/types";',
    'use "sys/winapi";',
    'use "memory/arena";',
    'obj Editor {',
    'new EditorInit ptr ed, num max_bytes {',
    'new EditorReset ptr ed {',
    'new EditorRender ptr ed, ptr rect {',
    'new EditorInput ptr ed, num msg_type, num vk {',
    'new EditorKeyDown ptr ed, num vk {',
    'new EditorAttachWindow ptr ed, ptr hwnd {',
    'new EditorAttachDC ptr ed, ptr hdc {',
    'new EditorHighlight txt line num ret {',
    'new pos_in_line ptr ed, num idx num {',
    'new line_idx_to_y ptr ed, num idx num {',
    'exp EditorInit;',
    'exp EditorReset;',
    'exp EditorRender;',
    'exp EditorInput;',
    'exp EditorKeyDown;',
    'exp EditorAttachWindow;',
    'exp EditorAttachDC;',
    'exp EditorHighlight;',
    'exp pos_in_line;',
    'exp line_idx_to_y;'
  ];

  const missing = requiredStrings.filter(s => !sourceCode.includes(s));
  if (missing.length > 0) {
    console.error('❌ Faltan declaraciones requeridas:');
    missing.forEach(m => console.error(`  • ${m}`));
    process.exit(1);
  }

  console.log('✅ PASO 4 COMPLETADO: ui/editor.portul contiene las declaraciones requeridas');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Error durante la prueba:', err.message);
  process.exit(1);
}
