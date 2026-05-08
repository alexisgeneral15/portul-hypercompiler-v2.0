#!/usr/bin/env node

/**
 * TEST STEP 2: Validar sys/winapi.portul
 * Verifica bindings Win32 y helpers de alto nivel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  🧪 PASO 2: Validación de sys/winapi.portul             ║');
console.log('║  Bindings Win32 para Portul IDE                         ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

try {
  // Leer archivo
  const winapiPath = path.join(__dirname, 'src/sys/winapi.portul');
  
  if (!fs.existsSync(winapiPath)) {
    console.error('❌ Error: Archivo no encontrado:', winapiPath);
    process.exit(1);
  }

  const sourceCode = fs.readFileSync(winapiPath, 'utf8');
  console.log(`✓ Archivo leído: ${sourceCode.length} bytes\n`);

  // Análisis básico
  console.log('📊 Estadísticas del archivo:');
  const lines = sourceCode.split('\n');
  const useCount = (sourceCode.match(/^use\s+/gm) || []).length;
  const newCount = (sourceCode.match(/^new\s+/gm) || []).length;
  const numCount = (sourceCode.match(/^num\s+/gm) || []).length;
  const expCount = (sourceCode.match(/^exp\s+/gm) || []).length;

  console.log(`  • Líneas: ${lines.length}`);
  console.log(`  • Imports (use): ${useCount}`);
  console.log(`  • Definiciones de función: ${newCount}`);
  console.log(`  • Constantes: ${numCount}`);
  console.log(`  • Exportaciones: ${expCount}\n`);

  // Validaciones
  console.log('🔍 Validación estructural:');
  let errors = [];
  let warnings = [];

  // 1. Verificar que importa sys/types
  if (useCount === 0) {
    errors.push('❌ No se encontró: use "sys/types"');
  } else if (!sourceCode.includes('use "sys/types"')) {
    errors.push('❌ Import de sys/types no encontrado correctamente');
  } else {
    console.log('  ✓ Importa sys/types correctamente');
  }

  // 2. Verificar funciones WIN32
  console.log('\n📦 Funciones Win32:');

  const groups = {
    'USER32.DLL': [
      'RegisterClassExA', 'CreateWindowExA', 'DefWindowProcA',
      'GetMessageA', 'DispatchMessageA', 'PostQuitMessage',
      'InvalidateRect', 'GetClientRect', 'ShowWindow',
      'UpdateWindow', 'SetFocus', 'MessageBoxA'
    ],
    'GDI32.DLL': [
      'GetDC', 'ReleaseDC', 'TextOutA', 'SetTextColor', 'SetBkMode',
      'FillRect', 'GetStockObject', 'CreateSolidBrush', 'DeleteObject',
      'SelectObject'
    ],
    'KERNEL32.DLL': [
      'CreateFileA', 'ReadFile', 'WriteFile', 'CloseHandle',
      'GetModuleHandleA', 'GetProcAddress', 'LoadLibraryA',
      'FreeLibrary', 'GetTickCount'
    ]
  };

  const allWin32 = [];
  Object.entries(groups).forEach(([dllName, funcs]) => {
    let count = 0;
    funcs.forEach(f => {
      if (sourceCode.includes(`new ${f}`)) {
        count++;
        allWin32.push(f);
      }
    });
    console.log(`  • ${dllName}: ${count}/${funcs.length}`);
  });

  if (allWin32.length < 30) {
    errors.push(`❌ Se esperan al menos 30 funciones Win32, encontradas: ${allWin32.length}`);
  } else {
    console.log(`  ✓ Total de funciones Win32: ${allWin32.length}`);
  }

  // 3. Verificar helpers de alto nivel
  console.log('\n🔧 Helpers de alto nivel:');
  const helpers = ['WinCreate', 'GdiText', 'FileReadAll', 'FileWriteAll', 'ShowErr', 'WinClassInit'];
  let helperCount = 0;
  helpers.forEach(h => {
    if (sourceCode.includes(`new ${h}`)) {
      console.log(`  ✓ ${h}`);
      helperCount++;
    } else {
      console.log(`  ✗ ${h}`);
    }
  });

  if (helperCount < 5) {
    warnings.push(`⚠️  Se esperan al menos 5 helpers, encontrados: ${helperCount}`);
  }

  // 4. Verificar constantes Win32
  console.log('\n⚙️  Constantes Win32:');
  const constants = [
    'TRANSPARENT', 'OPAQUE', 'WHITE_BRUSH', 'BLACK_PEN', 'SYSTEM_FONT',
    'GENERIC_READ', 'GENERIC_WRITE', 'CREATE_ALWAYS', 'OPEN_ALWAYS',
    'FILE_ATTRIBUTE_NORMAL', 'IDC_ARROW'
  ];
  let constCount = 0;
  constants.forEach(c => {
    if (sourceCode.includes(`num ${c} =`) || sourceCode.includes(`exp ${c}`)) {
      constCount++;
    }
  });

  console.log(`  • Constantes definidas: ${constCount}/${constants.length}`);
  if (constCount >= 9) {
    console.log(`  ✓ Cobertura de constantes adecuada`);
  } else {
    warnings.push(`⚠️  Pocas constantes definidas: ${constCount}`);
  }

  // 5. Verificar exportaciones
  console.log('\n📡 Exportaciones:');
  if (expCount < 40) {
    warnings.push(`⚠️  Se esperan al menos 40 exports, encontrados: ${expCount}`);
  } else {
    console.log(`  ✓ ${expCount} símbolos exportados`);
  }

  // 6. Verificar comentarios y documentación
  const commentLines = sourceCode.split('\n').filter(l => l.trim().startsWith('#')).length;
  console.log('\n📝 Documentación:');
  console.log(`  • Líneas de comentarios: ${commentLines}`);
  if (commentLines > 50) {
    console.log('  ✓ Bien documentado');
  }

  // 7. Verificar hints de optimización
  if (sourceCode.includes('fast code') && sourceCode.includes('safe code')) {
    console.log('  ✓ Hints de compilador presentes');
  } else {
    warnings.push('⚠️  Faltan hints fast/safe para optimización');
  }

  // Resultados finales
  console.log('\n' + '='.repeat(60));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ PASO 2 COMPLETADO: sys/winapi.portul es válido\n');
    console.log('📦 Contenido verificado:');
    console.log(`  ✓ Import correcto: use "sys/types"`);
    console.log(`  ✓ ${allWin32.length} funciones Win32 (USER32/GDI32/KERNEL32)`);
    console.log(`  ✓ ${helperCount} helpers de alto nivel`);
    console.log(`  ✓ ${constCount} constantes Win32`);
    console.log(`  ✓ ${expCount} símbolos exportados`);
    console.log(`  ✓ Bien documentado (${commentLines} líneas de comentarios)`);
    console.log('\n📋 Grupos de funciones:');
    Object.entries(groups).forEach(([dll, funcs]) => {
      const available = funcs.filter(f => sourceCode.includes(`new ${f}`)).length;
      console.log(`  • ${dll}: ${available}/${funcs.length} funciones`);
    });
    console.log('\n➡️  PRÓXIMO PASO: Crear memory/arena.portul');
    console.log('   con allocador de memoria determinista\n');
    process.exit(0);
  } else if (errors.length === 0) {
    console.log('⚠️  PASO 2 CON ADVERTENCIAS:\n');
    warnings.forEach(e => console.log('  ' + e));
    console.log('\n✅ El archivo es válido pero puede mejorarse\n');
    process.exit(0);
  } else {
    console.log('❌ ERRORES DETECTADOS:\n');
    errors.forEach(e => console.log('  ' + e));
    warnings.forEach(e => console.log('  ' + e));
    console.log();
    process.exit(1);
  }

} catch (err) {
  console.error('\n❌ Error durante la prueba:');
  console.error(err.message);
  process.exit(1);
}
