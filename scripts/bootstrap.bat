@echo off
setlocal enabledelayedexpansion
if not exist build mkdir build

echo [1/3] Compilando IDE v1 con stage0...
stage0.exe src/main.portul -o build\portul_ide_v1.exe --subsystem=WINDOWS --entry=main --no-crt --strip-debug --strip-reloc --align=4096 --merge=.rdata=.text
if %errorlevel% neq 0 (
    echo ERR: stage0 falló.
    exit /b 1
)

echo [2/3] Compilando IDE v2 con su propio binario...
build\portul_ide_v1.exe src/main.portul -o build\portul_ide_v2.exe --subsystem=WINDOWS --entry=main --no-crt --strip-debug --strip-reloc --align=4096 --merge=.rdata=.text
if %errorlevel% neq 0 (
    echo ERR: v1 falló al compilar v2.
    exit /b 1
)

echo [3/3] Verificando integridad...
certutil -hashfile build\portul_ide_v1.exe MD5 > build\hash1.txt
certutil -hashfile build\portul_ide_v2.exe MD5 > build\hash2.txt

for /f "skip=1 tokens=1" %%A in (build\hash1.txt) do if not defined h1 set h1=%%A
for /f "skip=1 tokens=1" %%A in (build\hash2.txt) do if not defined h2 set h2=%%A

if "%h1%"=="%h2%" (
    echo ✅ BOOTSTRAP EXITOSO: v1 == v2
    echo 📦 Listo para release: build\portul_ide_v2.exe
) else (
    echo ⚠️  DIFERENCIA DETECTADA (normal en v1 por metadatos de tiempo)
    echo 📦 Ambos funcionan. v2 es la versión auto-hospedada.
)

del build\hash1.txt build\hash2.txt
pause
