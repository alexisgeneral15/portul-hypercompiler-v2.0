# Changelog

Todas las novedades del proyecto se documentan aquí.

## [Unreleased] - 2026-05-06

### Added
- `src/sys/types.portul`: definición de tipos base Win32 compatibles con el parser.
- `scripts/validate_ide.mjs`: script de validación que recorre lexer/parser/análisis semántico para los archivos principales del IDE.

### Changed
- Renombrado `compile-bootstrap-real.js` → `compile-bootstrap-real.cjs` para cumplir con `package.json` ESM.
- Corregido `src/ui/window.portul` al dialecto español del parser: `usa`, `nuevo`, `si`, `regresa`, `pon`, `mientras`.
- Ajustado `src/ui/window.portul` para que la ventana, WndProc y el bucle de mensajes pasen validación.

### Notes
- `node compile-bootstrap-real.cjs` se ejecuta correctamente en Linux/Codespace. La salida actual es un PE válido mínimo de 512 bytes debido a la falta de linker Windows nativo.
- El compilado completo de `PortulCompilerBootstrap-REAL.exe` requiere un entorno Windows con LLVM/MSVC o `llvm-mingw`.
