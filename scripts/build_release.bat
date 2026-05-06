@echo off
setlocal
if not exist build mkdir build

echo [1/2] Compilando stage0 -> build\portul_ide_v1.exe
stage0.exe src/main.portul -o build\portul_ide_v1.exe --subsystem=WINDOWS --entry=main --no-crt --strip-debug --strip-reloc --align=4096 --merge=.rdata=.text
if %errorlevel% neq 0 (
    echo ERR: stage0 compilación falló.
    exit /b 1
)

echo [2/2] Compilando v1 -> build\portul_ide_v2.exe
build\portul_ide_v1.exe src/main.portul -o build\portul_ide_v2.exe --subsystem=WINDOWS --entry=main --no-crt --strip-debug --strip-reloc --align=4096 --merge=.rdata=.text
if %errorlevel% neq 0 (
    echo ERR: compilación de v2 falló.
    exit /b 1
)

echo ✅ Release build generado en build\portul_ide_v2.exe
pause
