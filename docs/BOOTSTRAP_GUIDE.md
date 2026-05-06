# Guía de Bootstrapping y Auto-Hosting

Este documento explica cómo usar los scripts de release y verificar que el IDE se compile a sí mismo.

## Requisitos

- `stage0.exe` debe existir y ser capaz de compilar `src/main.portul`.
- Windows con `cmd.exe` y `certutil`.
- El ejecutable `stage0.exe` debe tener soporte para los flags de `--subsystem`, `--entry`, `--no-crt`, `--strip-debug`, `--strip-reloc`, `--align`, `--merge`.

## Uso de `scripts/bootstrap.bat`

1. Abre una terminal de Windows.
2. Navega al directorio del repositorio.
3. Ejecuta:

```bat
scripts\bootstrap.bat
```

### Qué hace

- Compila `src/main.portul` con `stage0.exe` a `build\portul_ide_v1.exe`.
- Usa `portul_ide_v1.exe` para compilar `build\portul_ide_v2.exe`.
- Verifica hashes MD5 de ambos ejecutables.

## Uso de `scripts/build_release.bat`

Compila los binarios de release sin hacer la verificación de hashes:

```bat
scripts\build_release.bat
```

## Estructura de release

```
build/
  portul_ide_v1.exe
  portul_ide_v2.exe
scripts/
  bootstrap.bat
  build_release.bat
src/
  main.portul
  ui/editor.portul
  ui/window.portul
  core/bridge.portul
  sys/types.portul
  sys/winapi.portul
  memory/arena.portul
```

## Validación

Después de ejecutar el bootstrap:

- `build\portul_ide_v2.exe` debe ser ejecutable.
- `Ctrl+S` debe compilar a `output.exe`.
- `Ctrl+O` debe cargar `main.portul` en el editor.

## Consideraciones de tamaño

Si `portul_ide_v2.exe` supera los 80 KB, el siguiente paso es usar UPX:

```bat
upx --best --lzma build\portul_ide_v2.exe
```

> Nota: UPX es opcional. Para publicaciones en GitHub es preferible mantener el binario funcional y confiable, incluso sin compresión.
