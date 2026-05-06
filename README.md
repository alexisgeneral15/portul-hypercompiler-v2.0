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

## 🔗 Proyecto Relacionado
🔗 [Portul Hypercompiler v2.0](https://github.com/alexisgeneral15/portul-hypercompiler-v2.0)
