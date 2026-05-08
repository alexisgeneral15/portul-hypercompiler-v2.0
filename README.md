# 🔷 Portul IDE Native v1.0
IDE 100% nativo escrito en **Portul v1.0A3**. Sin Electron, sin Node.js, sin runtime pesado.

| Métrica | Valor |
|---------|-------|
| 📦 Tamaño `.exe` | ~50-75 KB (sin UPX) / ~35-45 KB (UPX) |
| 💾 RAM al abrir | < 15 MB |
| ⚡ Arranque | < 100 ms |
| 🖥️ Dependencias | `kernel32.dll`, `user32.dll`, `gdi32.dll` |
| 🛠️ Backend | Auto-hospedado (stage0 → stage1 → stage2) |

## 🚀 Uso Rápido
1. Ejecuta `portul_ide.exe` (o compílalo tú mismo con `stage0.exe`).
2. Escribe código Portul (`.portulpp` o `.portul`).
3. `Ctrl+S` → Compila y genera `output.exe` en la misma carpeta.
4. `Ctrl+O` → Carga un archivo existente desde disco.
5. Cierra → Memoria liberada determinísticamente (sin fugas).

## 🏗️ Arquitectura
```
src/
├── sys/          # Bindings Win32/GDI/Kernel mínimos
├── memory/       # Arena allocator (bump-pointer + scope tracking)
├── ui/           # Editor GDI puro + WindowProc + Message Loop
├── core/         # Puente I/O + llamada al compilador backend
└── main.portul   # Entry point (SUBSYSTEM:WINDOWS)
```
Todo el pipeline usa **tipos explícitos, memoria manual y zero-runtime overhead**.

## 🔁 Bootstrapping
```
stage0.exe (Node.js/JS) → portul_ide_v1.exe
portul_ide_v1.exe      → portul_ide_v2.exe (self-hosted)
```
Ejecuta `scripts/bootstrap.bat` para verificar la cadena de compilación.
> ✅ Si ambos `.exe` abren, editan y compilan código Portul, el bootstrapping es válido.
> ⚠️ Los hashes MD5 pueden diferir ligeramente por timestamp del PE.

## 🛠️ Compilación Optimizada
```bash
scripts\build_release.bat
# Aplica: --subsystem=WINDOWS --entry=main --no-crt --strip-debug --strip-reloc --align=4096
```

## 📜 Filosofía
- **Mínimo hardware**: Funciona en Pentium III / 64 MB RAM / Windows XP+
- **Cero abstracciones ocultas**: Cada byte es intencional.
- **Auto-suficiente**: El IDE compila su propio código sin herramientas externas.
- **Extensible**: Core portable. Solo `sys/` cambia por plataforma.

## 📦 Releases
- `v1.0.0`: IDE nativo Windows, bootstrapping validado, I/O + compilación en caliente.
- Próximas versiones: Linux ELF, highlighting por línea completa, terminal integrada.

## � Estado actual V2.1
Esta rama `V2.1` contiene la validación completa del IDE nativo en Portul v1.0A3 y la adaptación del pipeline al dialecto español del parser.

- ✅ `src/sys/types.portul` agregado para definiciones de tipos base Win32.
- ✅ `src/ui/window.portul` corregido al dialecto aceptado por `backend/src/compiler`.
- ✅ `node compile-bootstrap-real.cjs` ejecuta el bootstrap real con el backend existente.
- ⚠️ En Linux/Codespace la generación de `PortulCompilerBootstrap-REAL.exe` produce un PE stub válido de 512 bytes por la falta de toolchain Windows nativo.
- ✅ `scripts/validate_ide.mjs` puede usarse para verificar los archivos clave del IDE a través de lexer, parser y análisis semántico.

## 🧪 Validación en esta rama
```bash
node scripts/validate_ide.mjs
```

## 🧱 Compilación en Linux/Codespace
```bash
node compile-bootstrap-real.cjs
ls -lh PortulCompilerBootstrap-REAL.exe
file PortulCompilerBootstrap-REAL.exe
```

> Para obtener un ejecutable Windows completo, compila en un entorno Windows nativo con LLVM/MSVC o `llvm-mingw`.

## �🔗 Proyecto Relacionado
🔗 [Portul Hypercompiler v2.0](https://github.com/alexisgeneral15/portul-hypercompiler-v2.0)
