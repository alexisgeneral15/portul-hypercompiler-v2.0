#!/usr/bin/env node

/**
 * Script de prueba para el compilador Portul
 * Compila un ejemplo simple y descarga el .exe
 */

const BACKEND_URL = 'http://localhost:3001';

const HELLO_WORLD = `main {
    put "¡Hola Mundo desde Portul!";
}`;

async function main() {
  console.log('='.repeat(60));
  console.log('  PORTUL BOOTSTRAP COMPILER - TEST SCRIPT');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Obtener token dev
    console.log('[1/4] Autenticando en backend...');
    const authRes = await fetch(`${BACKEND_URL}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!authRes.ok) {
      throw new Error(`Auth failed: ${authRes.statusText}`);
    }

    const { token } = await authRes.json();
    console.log('✓ Token obtenido');
    console.log('');

    // 2. Compilar código Portul
    console.log('[2/4] Compilando código Portul...');
    console.log(`Código: ${HELLO_WORLD.length} bytes`);
    
    const compileRes = await fetch(`${BACKEND_URL}/api/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: HELLO_WORLD,
        target: 'windows-x64',
        filename: 'hello_world',
        projectId: 'bootstrap-test'
      })
    });

    if (!compileRes.ok) {
      const error = await compileRes.text();
      throw new Error(`Compilation failed: ${error}`);
    }

    const compileResult = await compileRes.json();
    console.log(`✓ Compilación exitosa`);
    console.log(`  - Status: ${compileResult.status}`);
    console.log(`  - ID: ${compileResult.id}`);
    console.log(`  - Tamaño EXE: ${compileResult.exeSize} bytes`);
    console.log(`  - Archivo: ${compileResult.filename}`);
    console.log('');

    // 3. Descargar el ejecutable
    if (compileResult.downloadUrl) {
      console.log('[3/4] Descargando ejecutable...');
      const downloadRes = await fetch(`${BACKEND_URL}${compileResult.downloadUrl}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!downloadRes.ok) {
        throw new Error(`Download failed: ${downloadRes.statusText}`);
      }

      const blob = await downloadRes.blob();
      console.log(`✓ Descargado: ${blob.size} bytes`);
      console.log(`  Tipo: ${blob.type || 'application/octet-stream'}`);
    }

    console.log('');
    console.log('[4/4] ✓ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('');
    console.log('='.repeat(60));
    console.log('Tu compilador Portul está funcionando correctamente.');
    console.log('Ahora puedes:');
    console.log('  1. Abrir http://localhost:5173 en tu navegador');
    console.log('  2. Seleccionar un archivo .portulpp del explorador');
    console.log('  3. Hacer clic en "🔨 Compilar a .exe"');
    console.log('  4. ¡Descargar el ejecutable!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Asegúrate de que:');
    console.error('  - Backend está corriendo: npm run dev (en /backend)');
    console.error('  - Puerto 3001 está disponible');
    process.exit(1);
  }
}

main();
