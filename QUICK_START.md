# 🚀 QUICK START - Instalación y Ejecución

## ⚡ Inicio Rápido (2 minutos)

### Paso 1: Instalar Dependencias
```powershell
cd portul-hypercompiler
npm install
```

### Paso 2: Ejecutar
```powershell
npm run dev
```

### Paso 3: Abrir Navegador
Abre: `http://localhost:5173`

---

## 🔍 Verificación de Instalación

### Si hay errores de TypeScript:
```powershell
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar compilación
npx tsc --noEmit
```

### Si el navegador no abre:
1. Verifica que el puerto 5173 esté libre
2. O abre manualmente: `http://localhost:5173`

---

## 🎮 Primeras Pruebas

### 1. Probar IntelliSense
1. Escribe: `num `
2. Presiona: `Ctrl+Space`
3. ✅ Deberías ver sugerencias

### 2. Probar IA Local
1. Click en panel AI Assistant (⭐)
2. Cambia a modo Aether (botón morado)
3. Escribe: "necesito un loop que cuente hasta 100"
4. ✅ Deberías ver código generado

### 3. Probar Build
1. Escribe cualquier código Portul
2. Click en botón **⚡ Build**
3. ✅ Deberías ver IR + Assembly

---

## 📚 Documentación

Lee en orden:
1. `INTEGRATION_COMPLETE.md` - Guía completa
2. `DEMO_GUIDE.md` - 12 demos paso a paso
3. `EXAMPLES.md` - Ejemplos de código
4. `RESUMEN_EJECUTIVO.md` - Overview técnico

---

## ✅ TODO LISTO

Si los 3 tests funcionan, ¡tu sistema está 100% operativo! 🎉

**Siguiente paso:** Lee `DEMO_GUIDE.md` para ver todas las características.
