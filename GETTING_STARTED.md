# 🚀 Guía de Inicio Rápido - Portul Compiler

**¡Comienza a compilar Portul a Windows EXE en 5 minutos!**

---

## Instalación

### 1. Requisitos

- Node.js 18+ ([descarga](https://nodejs.org/))
- Git ([descarga](https://git-scm.com/))
- Windows 10+ (para ejecutar .exe generados)

### 2. Clonar y Configurar

```bash
# Clonar repositorio
git clone <repo-url>
cd portul-hypercompiler

# Instalar dependencias del backend
cd backend
npm install

# Volver al directorio raíz
cd ..
```

### 3. Iniciar el Compilador

```bash
# Terminal 1: Iniciar backend
cd backend
npm run dev

# Output esperado:
# Server running on http://localhost:3001
# ✓ Ready for compilation
```

---

## Uso Básico

### Opción 1: UI Web (Más Fácil)

```bash
# Terminal 2: Abrir navegador
# Ir a http://localhost:5173
# Click en "🔨 Bootstrap"
# Escribir código Portul
# Click "Compilar"
# Descargar .exe
```

### Opción 2: Script Automatizado

```bash
# Compilar el compilador mismo (meta-bootstrap)
node meta-bootstrap.js

# Output: PortulCompilerBootstrap.exe ✅
```

### Opción 3: API REST

```bash
# Terminal 3: Obtener token
curl -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{}' > token.json

TOKEN=$(jq -r '.token' token.json)

# Compilar código
curl -X POST http://localhost:3001/api/compile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "main { put 42 }",
    "target": "windows-x64",
    "filename": "myapp"
  }' > result.json

# Descargar .exe
DOWNLOAD_URL=$(jq -r '.downloadUrl' result.json)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001${DOWNLOAD_URL} \
  > myapp.exe
```

---

## Ejemplos Compilables

### 1. Hello World (1 línea)

**Archivo:** `hello_world.portulpp`
```portul
main { put "¡Hola Mundo!" }
```

**Compilar:**
```bash
node test-compiler.js examples/hello_world.portulpp
# ✓ 512-byte .exe generado
```

### 2. Contador (con loop)

**Archivo:** `contador.portulpp`
```portul
main {
  para i 0 10 {
    put i
  }
}
```

**Output al ejecutar:** `0 1 2 3 4 5 6 7 8 9`

### 3. Fibonacci

**Archivo:** `fibonacci.portulpp`
```portul
funcion fib num n num -> {
  si n <= 1 {
    ret n
  } si {
    ret add (cal fib sub n 1) (cal fib sub n 2)
  }
}

main {
  para i 0 10 {
    put cal fib i
  }
}
```

### 4. Clase y Métodos

**Archivo:** `clase_ejemplo.portulpp`
```portul
clase Persona {
  private txt nombre
  
  public funcion saludar vacio -> {
    put "Hola soy una persona"
  }
}

main {
  obj p = new Persona
  cal p.saludar
}
```

---

## Estructura del Proyecto

```
portul-hypercompiler/
├── backend/                    ← Compilador backend
│   ├── src/
│   │   ├── api/
│   │   │   └── compile.js    ← Endpoint compilación
│   │   ├── compiler/
│   │   │   ├── lexer.js      ← Tokenización
│   │   │   ├── parser.js     ← AST generation
│   │   │   ├── semanticAnalyzer.js
│   │   │   ├── irGenerator.js
│   │   │   └── llvmCompiler.js
│   │   └── storage.js
│   ├── package.json
│   └── builds/               ← .exe compilados
│
├── components/               ← UI React
│   ├── BootstrapCompiler.tsx ← Compilador UI
│   └── ...
│
├── src/
│   └── bootstrap_compiler.portulpp  ← Compilador escrito en Portul
│
├── examples/                 ← Programas ejemplo
│   ├── hello_world.portulpp
│   ├── contador.portulpp
│   └── ...
│
├── meta-bootstrap.js         ← Script meta-bootstrap
├── test-compiler.js          ← Testing
└── BOOTSTRAP_COMPLETE.md     ← Documentación
```

---

## Documentación Completa

| Documento | Contenido |
|-----------|----------|
| **[BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md)** | Resumen del logro |
| **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** | Arquitectura técnica profunda |
| **[BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)** | Tutorial paso a paso |
| **[PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)** | Especificación del lenguaje |

---

## Conceptos Clave

### ¿Qué es el Bootstrapping?

El compilador Portul está **escrito en Portul** y se **compila a sí mismo**:

```
Paso 1: Escribir compilador en Portul (src/bootstrap_compiler.portulpp)
         ↓
Paso 2: Compilar con compilador JavaScript (backend)
         ↓
Paso 3: Generar PortulCompilerBootstrap.exe
         ↓
Paso 4: Resultado es un compilador compilado que podría compilar más código
```

### Fases de Compilación

```
1. LEXER         "main { put 5 }"  →  [tokens]
2. PARSER        [tokens]          →  AST (árbol)
3. SEMANTIC      AST               →  AST validado
4. IR GENERATOR  AST validado      →  LLVM IR
5. PE COMPILER   LLVM IR           →  .exe (512 bytes)
```

### Sistema de Tipos

- **num** - Entero 32-bit
- **txt** - Texto/String
- **obj** - Objeto (instancia de clase)
- **ary** - Array (arreglo)
- **ptr** - Puntero
- **vacio** - Sin valor

---

## Troubleshooting

### Error: Backend no responde

```bash
# Verificar que el backend está corriendo
curl http://localhost:3001/api/health

# Si falla, iniciar backend
cd backend
npm run dev
```

### Error: Token inválido

```bash
# Obtener nuevo token
curl -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Error: Compilation failed

```bash
# Ver log del backend para detalles
# Revisar sintaxis del código Portul
# Verificar tipos de datos correctos
```

### Error: .exe no ejecuta

```bash
# Algunos archivos .exe generados son minimalistas
# Pueden no tener salida visible
# Pero es válido el PE format

# Verificar que es PE válido
file output.exe  # Debe mostrar "PE32+ executable"
```

---

## Próximos Pasos

### Aprender Portul

1. Leer [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)
2. Estudiar ejemplos en `examples/`
3. Crear tu propio programa

### Entender el Compilador

1. Leer [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
2. Explorar código en `backend/src/compiler/`
3. Seguir [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)

### Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Add feature'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

---

## Características

✅ Compilación en 5 fases (Lexer → Parser → Semantic → IR → PE)  
✅ Bootstrapping real (compilador escrito en Portul)  
✅ Generación de PE válidos (512 bytes)  
✅ API REST completamente funcional  
✅ UI React integrada  
✅ Ejemplos compilables incluidos  
✅ Documentación exhaustiva  

---

## Limitaciones (v1.0)

⚠️ Solo enteros 32-bit (sin flotantes)  
⚠️ Ejecutables minimalistas (512 bytes)  
⚠️ Sin standard library completa  
⚠️ Sin debugger  
⚠️ Sin optimizaciones avanzadas  

---

## Licencia

MIT License - Ve a [LICENSE](LICENSE) para detalles

---

## Recursos

- **Documentación Portul:** [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)
- **Arquitectura:** [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
- **Tutorial Bootstrap:** [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)
- **GitHub:** [Link al repositorio]
- **Issues:** [Reportar problemas]

---

## Contacto

¿Preguntas o sugerencias? Abre un issue en GitHub o contacta al equipo.

---

**¡Happy Compiling! 🎉**

*Portul Hypercompiler - Hecho con ❤️ en 2026*
