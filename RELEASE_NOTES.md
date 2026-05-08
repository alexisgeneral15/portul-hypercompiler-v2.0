# Release Notes

## V2.1 - 2026-05-06

### Overview
Esta rama `V2.1` trae la validación completa del IDE nativo de Portul en la versión `v1.0A3`.
El código del IDE ahora pasa lexer, parser y análisis semántico con la gramática española usada por el backend.

### Cambios clave
- Añadido `src/sys/types.portul` para las definiciones de tipos base Win32.
- Corregido `src/ui/window.portul` al dialecto español del parser (`usa`, `nuevo`, `si`, `regresa`, `pon`, `mientras`).
- Renombrado `compile-bootstrap-real.js` → `compile-bootstrap-real.cjs` para cumplir con `package.json` ESM.
- Añadido `scripts/validate_ide.mjs` para validar el conjunto principal de archivos del IDE.

### Estado de validación
- ✅ `src/sys/winapi.portul` validado
- ✅ `src/memory/arena.portul` validado
- ✅ `src/ui/editor.portul` validado
- ✅ `src/ui/window.portul` validado
- ✅ `src/main.portul` validado

### Nota importante
La generación de `PortulCompilerBootstrap-REAL.exe` en Linux/Codespace produce actualmente un PE mínimo de 512 bytes debido a la falta de linker Windows nativo.

Para obtener un ejecutable Windows completo, compila en un entorno Windows con LLVM/MSVC o `llvm-mingw`.

### Comandos útiles
```bash
node scripts/validate_ide.mjs
node compile-bootstrap-real.cjs
ls -lh PortulCompilerBootstrap-REAL.exe
file PortulCompilerBootstrap-REAL.exe
```

### Próximos pasos
1. Probar `compile-bootstrap-real.cjs` en Windows nativo.
2. Generar el IDE completo `.exe` con toolchain Windows.
3. Publicar release con notas claras sobre el stub PE y el estado del bootstrap.
