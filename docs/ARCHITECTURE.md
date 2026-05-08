# Arquitectura del Portul IDE Native

Este documento describe la arquitectura mínima usada por el Portul IDE nativo y su pipeline de bootstrapping.

## Estructura principal

- `src/main.portul`
  - Punto de entrada de la aplicación nativa.
  - Crea la ventana Win32 y arranca el message loop.

- `src/ui/window.portul`
  - Registra la clase de ventana.
  - Maneja `WndProc` y atajos de teclado.
  - Intercepta `Ctrl+S` y `Ctrl+O`.

- `src/ui/editor.portul`
  - Buffer de texto en memoria.
  - Renderiza texto con GDI puro.
  - Dibuja barra de estado e indicador de cursor.

- `src/core/bridge.portul`
  - Puente entre el editor y el backend de compilación.
  - Implementa `CompileProject`, `OpenProject` y estado de compilación.

- `src/sys/winapi.portul`
  - Enlace directo a Win32 APIs: User32, Gdi32, Kernel32.
  - Contiene helpers de archivo y GDI.

- `src/sys/types.portul`
  - Tipos básicos y constantes Win32.
  - Definiciones de `RECT`, `MSG`, tipos `ptr/num/err`.

- `src/memory/arena.portul`
  - Allocator bump-pointer simple.
  - Gestión de arena para recursos temporales.

## Pipeline de compilation mínima

1. `stage0.exe` compila `src/main.portul` en un PE Win32 mínimo.
2. `build\portul_ide_v1.exe` se usa para compilar `build\portul_ide_v2.exe`.
3. El objetivo es un ejecutable GUI puro, sin CRT, con secciones compactas.

## Flags de optimización recomendados

- `--subsystem=WINDOWS`
- `--entry=main`
- `--no-crt`
- `--strip-debug`
- `--strip-reloc`
- `--align=4096`
- `--merge=.rdata=.text`

## Release final

- `build/portul_ide_v1.exe` : binario generado con el backend actual.
- `build/portul_ide_v2.exe` : binario auto-compilado usando `v1`.

## Publicación

La carpeta `scripts/` contiene los pasos necesarios para compilar y verificar el bootstrap.
La carpeta `docs/` recoge la guía de bootstrapping y la descripción arquitectural.
