# 📚 Índice Completo de Documentación - Portul Hypercompiler

**Tu guía para navegar toda la documentación del proyecto**

---

## 🎯 Inicio Rápido

Si tienes **5 minutos**, empieza aquí:

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Instalación y primeros pasos
   - Requisitos
   - Configuración
   - Ejemplos compilables
   - Troubleshooting

---

## 📖 Documentación Principal

### Para Entender QUÉ se logró

**[BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md)** ⭐ COMIENZA AQUÍ
- Resumen ejecutivo del proyecto
- Hitos y estadísticas
- 5 fases del bootstrapping
- Validación y testing
- Conclusiones

**Lectura recomendada:** 15 minutos

---

### Para Entender CÓMO funciona

**[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** 🏗️ ARQUITECTURA PROFUNDA
- Visión general del sistema
- Pipeline de compilación (5 fases)
- Componentes principales
  - Lexer (análisis léxico)
  - Parser (análisis sintáctico)
  - Semantic Analyzer (validación)
  - IR Generator (código intermedio)
  - PE Compiler (generación ejecutable)
- Especificación de Portul
- Formato PE Windows
- Flujo de bootstrapping

**Lectura recomendada:** 30 minutos

**Mejor para:** Desarrolladores, investigadores

---

### Para Aprender el PROCESO

**[BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)** 📚 TUTORIAL PASO A PASO
- Introducción al bootstrapping
- Configuración inicial
- Paso 1: Entender el compilador
- Paso 2: El código del compilador en Portul
- Paso 3: Compilar el compilador
- Paso 4: Verificar el resultado
- Paso 5: Testar el bootstrap
- Recursos adicionales

**Lectura recomendada:** 45 minutos (con experiencias prácticas)

**Mejor para:** Estudiantes, aspirantes a compiladores

---

### Para Usar EL LENGUAJE

**[PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)** 📖 ESPECIFICACIÓN DEL LENGUAJE
- Estructura léxica
- Tokens y palabras clave
- Sintaxis y semántica
- Variables y tipos
- Control de flujo (si, para, mientras)
- Funciones y clases
- Funciones integradas
- Sistema de tipos
- Scoping y visibilidad
- Ejemplos completos
- Gramática formal BNF

**Lectura recomendada:** 30 minutos (referencia)

**Mejor para:** Programadores, diseñadores de lenguajes

---

### Para Saber POR QUÉ importa

**[WHY_GITHUB.md](WHY_GITHUB.md)** 💡 IMPORTANCIA Y PRESERVACIÓN
- Resumen ejecutivo
- Importancia técnica
- Valor educativo
- Contribución a la comunidad
- Impacto histórico
- Sostenibilidad
- Plan de preservación
- Por qué AHORA es el momento

**Lectura recomendada:** 20 minutos

**Mejor para:** Decisiones, stakeholders, archivo histórico

---

## 🗂️ Estructura del Código Fuente

### Backend (Compilador)

```
backend/src/compiler/

├── lexer.js                    [300 líneas]
│   Convierte: Texto → Tokens
│   Entrada:    "main { put 5 }"
│   Salida:     [{type:'keyword',...}, ...]

├── parser.js                   [400 líneas]
│   Convierte: Tokens → AST
│   Entrada:    [{type:'keyword',...}, ...]
│   Salida:     {type:'MainBlock', children:[...]}

├── semanticAnalyzer.js         [350 líneas]
│   Valida:     AST
│   Entrada:    AST
│   Salida:     AST validado + symbol table

├── irGenerator.js              [300 líneas]
│   Genera:     LLVM IR
│   Entrada:    AST validado
│   Salida:     "define i32 @main() { ... }"

└── llvmCompiler.js             [250 líneas]
    Genera:    Ejecutable PE
    Entrada:   LLVM IR
    Salida:    Buffer PE 512 bytes
```

**Ver código:** `backend/src/compiler/`

---

### Frontend (UI)

```
components/

├── BootstrapCompiler.tsx       [Main UI para compilar]
│   Características:
│   • Editor de código
│   • Botón compilar
│   • Mostrar fases
│   • Descargar .exe
│   • Integración con backend

└── ... (componentes adicionales)
```

**Ver código:** `components/BootstrapCompiler.tsx`

---

### Meta-Bootstrap

```
src/

└── bootstrap_compiler.portulpp [3,908 bytes]
    El compilador escrito en Portul
    
    Estructura:
    ├── class Lexer { ... }
    ├── class Parser { ... }
    ├── class SemanticAnalyzer { ... }
    ├── class IRGenerator { ... }
    ├── class Linker { ... }
    ├── class PortulCompilerCore { ... }
    └── main { ... }
```

**Ver código:** `src/bootstrap_compiler.portulpp`

---

### Scripts y Testing

```
Project Root/

├── meta-bootstrap.js           [400 líneas]
│   Script para compilar el compilador
│   Uso: node meta-bootstrap.js
│   Resultado: PortulCompilerBootstrap.exe

├── test-compiler.js            [300 líneas]
│   Script para testar ejemplos
│   Uso: node test-compiler.js <archivo.portulpp>

└── validate_bootstrap.sh        [Bash script]
    Valida PE format del .exe
```

**Ver código:** Directorio raíz

---

## 💾 Ejemplos Compilables

Todos en `examples/`:

```
├── hello_world.portulpp        "¡Hola Mundo!" en 1 línea
├── contador.portulpp            Loop contador 0-9
├── fibonacci.portulpp           Secuencia Fibonacci
├── factorial.portulpp           Factorial recursivo
├── condicionales.portulpp       if/else logic
├── operaciones.portulpp         Variables y operaciones
├── bootstrap_test.portulpp      Test de bootstrap
├── clase_ejemplo.portulpp       Clases y objetos
└── ... (más ejemplos)
```

**Usar ejemplos:**
```bash
node test-compiler.js examples/hello_world.portulpp
```

---

## 📋 Matriz de Documentación

| Documento | Nivel | Duración | Mejor para |
|-----------|-------|----------|-----------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Principiante | 5 min | Comenzar |
| [BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md) | Intermedio | 15 min | Resumen |
| [WHY_GITHUB.md](WHY_GITHUB.md) | Ejecutivo | 20 min | Contexto |
| [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md) | Intermedio | 45 min | Aprender proceso |
| [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) | Avanzado | 30 min | Entender código |
| [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md) | Referencia | 30 min | Programar en Portul |

---

## 🎓 Rutas de Aprendizaje

### Ruta 1: "Quiero Aprender Compiladores" ⭐⭐⭐

Tiempo total: ~2 horas

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** (5 min)
   - Instalación y setup
   
2. **[PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)** (30 min)
   - Entender la sintaxis
   
3. **[BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)** (45 min)
   - Seguir paso a paso
   
4. **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** (30 min)
   - Profundizar en detalles
   
5. **Leer código:** `backend/src/compiler/` (10 min)
   - Ver implementación real

---

### Ruta 2: "Necesito Referencia Rápida" ⭐

Tiempo total: ~10 minutos

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Setup
2. **[PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)** - Sintaxis
3. **Ejemplos:** `examples/` - Copiar y adaptar

---

### Ruta 3: "Quiero Entender el Bootstrapping" ⭐⭐⭐⭐

Tiempo total: ~1.5 horas

1. **[BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md)** (15 min)
   - Qué se logró
   
2. **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** Sección 7 (15 min)
   - Flujo de bootstrapping
   
3. **[BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)** Paso 1-5 (45 min)
   - Tutorial completo
   
4. **Ejecutar:**
   ```bash
   node meta-bootstrap.js
   ```
   - Ver bootstrapping en vivo

---

### Ruta 4: "Voy a Investigar/Extender" ⭐⭐⭐⭐⭐

Tiempo total: ~3 horas

1. Todas las rutas anteriores
2. **Leer código completo:**
   - backend/src/compiler/ (2 horas)
   - src/bootstrap_compiler.portulpp (30 min)
3. **Modificar:**
   - Agregar función integrada
   - Agregar feature al lenguaje
   - Compilar y validar

---

## 🔗 Referencias Cruzadas

### Por Concepto

**Lexer / Tokenización:**
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#fase-1-lexer)
- [backend/src/compiler/lexer.js](backend/src/compiler/lexer.js)
- [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md#fase-1-lexer)

**Parser / Sintaxis:**
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#fase-2-parser)
- [backend/src/compiler/parser.js](backend/src/compiler/parser.js)
- [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md#9-gramática-formal-bnf)

**Semantic Analysis:**
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#fase-3-semantic-analyzer)
- [backend/src/compiler/semanticAnalyzer.js](backend/src/compiler/semanticAnalyzer.js)
- [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md#5-semantica-de-tipos)

**IR Generation:**
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#fase-4-ir-generator)
- [backend/src/compiler/irGenerator.js](backend/src/compiler/irGenerator.js)
- [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md#fase-4-ir-generation)

**PE Compilation:**
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#fase-5-pe-compiler)
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#8-formato-pe-windows)
- [backend/src/compiler/llvmCompiler.js](backend/src/compiler/llvmCompiler.js)

**Bootstrapping:**
- [BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md)
- [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md#flujo-de-bootstrapping)
- [WHY_GITHUB.md](WHY_GITHUB.md#lugar-en-historia-de-compiladores)

---

## 🎯 Uso Recomendado por Perfil

### Estudiante de Compiladores

Orden recomendado:
1. GETTING_STARTED
2. PORTUL_LANGUAGE_SPEC
3. BOOTSTRAP_TUTORIAL
4. TECHNICAL_ARCHITECTURE
5. Código fuente

**Resultado:** Comprensión completa de compilación

---

### Profesor/Educador

Usar para:
- Enseñanza de compiladores
- Proyectos estudiantiles
- Demostraciones en clase
- Base para extensiones

**Recurso:** Todo (documentación + código ejecutable)

---

### Investigador

Usar para:
- Estudio de bootstrapping
- Optimizaciones
- Nuevas características
- Benchmarking

**Punto de inicio:** TECHNICAL_ARCHITECTURE + código

---

### Profesional/Developer

Usar para:
- Crear DSLs (Domain Specific Languages)
- Herramientas personalizadas
- Extensiones

**Punto de inicio:** PORTUL_LANGUAGE_SPEC + ejemplos

---

## 📞 Preguntas Frecuentes (por documento)

### "¿Por dónde empiezo?"
→ [GETTING_STARTED.md](GETTING_STARTED.md)

### "¿Qué se logró?"
→ [BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md)

### "¿Cómo funciona?"
→ [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)

### "¿Cómo escribo código Portul?"
→ [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md)

### "¿Cómo compilo?"
→ [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md)

### "¿Por qué importa?"
→ [WHY_GITHUB.md](WHY_GITHUB.md)

---

## ✅ Checklist de Documentación

- ✅ [GETTING_STARTED.md](GETTING_STARTED.md) - Inicio rápido
- ✅ [BOOTSTRAPPING_COMPLETE.md](BOOTSTRAPPING_COMPLETE.md) - Resumen
- ✅ [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Profundo
- ✅ [BOOTSTRAP_TUTORIAL.md](BOOTSTRAP_TUTORIAL.md) - Paso a paso
- ✅ [PORTUL_LANGUAGE_SPEC.md](PORTUL_LANGUAGE_SPEC.md) - Referencia
- ✅ [WHY_GITHUB.md](WHY_GITHUB.md) - Importancia
- ✅ DOCUMENTATION_INDEX.md (este archivo) - Navegación

---

## 📚 Archivos Relacionados

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| backend/src/compiler/lexer.js | Código | Tokenización |
| backend/src/compiler/parser.js | Código | AST |
| backend/src/compiler/semanticAnalyzer.js | Código | Validación |
| backend/src/compiler/irGenerator.js | Código | IR |
| backend/src/compiler/llvmCompiler.js | Código | PE |
| components/BootstrapCompiler.tsx | UI | Frontend |
| src/bootstrap_compiler.portulpp | Portul | Meta-bootstrap |
| examples/*.portulpp | Ejemplos | Referencia |
| meta-bootstrap.js | Script | Compilar compilador |
| test-compiler.js | Script | Testing |
| package.json | Config | Dependencias |

---

## 🚀 Próximos Pasos Sugeridos

Después de leer la documentación:

1. **Instalar y ejecutar** (5 min)
   ```bash
   npm install
   cd backend && npm run dev
   node meta-bootstrap.js
   ```

2. **Compilar ejemplos** (10 min)
   ```bash
   node test-compiler.js examples/hello_world.portulpp
   ```

3. **Escribir tu propio programa** (20 min)
   - Crear archivo .portulpp
   - Compilar
   - Ejecutar

4. **Explorar código** (1-2 horas)
   - Leer y entender cada componente
   - Modificar y experimentar

5. **Extender** (variable)
   - Agregar features
   - Optimizar
   - Investigar

---

## 📖 Lectura Complementaria

### Sobre Compiladores
- "Compilers: Principles, Techniques, and Tools" (Dragon Book)
- https://en.wikipedia.org/wiki/Compiler

### Sobre Bootstrapping
- https://en.wikipedia.org/wiki/Bootstrapping_(compilers)
- https://www.gnu.org/software/gcc/gcc-4.1/bootstrap/

### Sobre PE Format
- https://docs.microsoft.com/en-us/windows/win32/debug/pe-format
- https://github.com/corkami/maldoc

### Lenguajes Auto-Hospedados
- Go: https://golang.org/
- Rust: https://www.rust-lang.org/
- TypeScript: https://www.typescriptlang.org/

---

**¡Comienza tu viaje en compiladores hoy!** 🚀

Elige tu ruta de aprendizaje y comienza con el documento correspondiente.

---

*Índice de Documentación - Portul Hypercompiler*  
*Última actualización: 2 de Febrero de 2026*
