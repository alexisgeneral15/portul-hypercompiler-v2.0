# 🤝 Guía de Contribución - Portul Hypercompiler

Gracias por tu interés en contribuir al Portul Hypercompiler. Este documento explica cómo puedes ayudar.

---

## 🐛 Reportar Issues

### Encontraste un bug?

1. **Verifica que no exista** - Busca en [Issues](../../issues)
2. **Crea un nuevo issue** con:
   - Título descriptivo
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Tu sistema (OS, Node version, etc)

### Sugerencias de Features?

Abre un issue con etiqueta `enhancement` describiendo:
- Qué quieres agregar
- Por qué lo necesitas
- Cómo crees que debería funcionar

---

## 💻 Contribuir Código

### 1. Fork y Clonar

```bash
# Fork en GitHub, luego:
git clone https://github.com/TU_USER/portul-hypercompiler.git
cd portul-hypercompiler
git remote add upstream https://github.com/ORIGINAL_USER/portul-hypercompiler.git
```

### 2. Crear Rama Feature

```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/nombre-bug
```

**Nombres recomendados:**
- `feature/add-generics` - Agregar feature
- `fix/parser-bug` - Corregir bug
- `docs/update-spec` - Documentación
- `test/add-tests` - Tests
- `refactor/optimize-lexer` - Refactor

### 3. Hacer Cambios

```bash
# Editar archivos
# Probar cambios
npm run test
npm run dev

# Commit con mensaje descriptivo
git add .
git commit -m "feat: descripción clara del cambio"
```

**Formato de commits (Conventional Commits):**
- `feat:` - Nuevo feature
- `fix:` - Bug fix
- `docs:` - Cambios documentación
- `test:` - Agregar/modificar tests
- `refactor:` - Cambios de código sin funcionalidad nueva
- `perf:` - Optimizaciones
- `chore:` - Cambios build, deps, etc

### 4. Push y Pull Request

```bash
git push origin feature/nombre-descriptivo
```

Luego:
1. Ve a GitHub
2. Haz Pull Request
3. Describe qué cambios hiciste
4. Referencia issues relacionados (#123)

---

## 📋 Proceso de Review

Pull requests serán revisados para:

- ✅ Calidad de código
- ✅ Mensajes de commit claros
- ✅ Tests incluidos
- ✅ Documentación actualizada
- ✅ No rompe compilación existente

**Tiempo estimado de review:** 24-48 horas

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests específicos
npm test -- --grep "lexer"

# Con cobertura
npm run test:coverage
```

**Por favor incluye tests para:**
- Bugs que corriges
- Features nuevas
- Casos edge

---

## 📚 Actualizar Documentación

Cambios importantes deben actualizar documentación:

- `PORTUL_LANGUAGE_SPEC.md` - Si cambias sintaxis
- `TECHNICAL_ARCHITECTURE.md` - Si cambias arquitectura
- `BOOTSTRAP_TUTORIAL.md` - Si cambias proceso
- Ejemplos en `examples/` - Si cambias comportamiento

---

## 🔍 Criterios de Aceptación

Tu PR será aceptado si:

1. **Código**
   - ✅ Sigue estilo existente
   - ✅ Incluye tests
   - ✅ No rompe builds
   - ✅ Documentado

2. **Commits**
   - ✅ Mensajes claros
   - ✅ Historia lógica
   - ✅ Formato Conventional Commits

3. **Documentación**
   - ✅ README actualizado si aplica
   - ✅ Ejemplos incluidos si aplica
   - ✅ JSDoc/comentarios

---

## 📦 Áreas de Contribución

### Compilador (backend/)

```javascript
// backend/src/compiler/lexer.js
// backend/src/compiler/parser.js
// backend/src/compiler/semanticAnalyzer.js
// backend/src/compiler/irGenerator.js
// backend/src/compiler/llvmCompiler.js
```

**Oportunidades:**
- Agregar más built-in functions
- Optimizar fases
- Mejorar messages de error
- Soportar más tipos

### Lenguaje Portul

```portul
// Agregar features al lenguaje
// Generics, excepciones, etc.
```

**Oportunidades:**
- Nuevos tipos de datos
- Estructuras de control
- Pattern matching
- Módulos

### Documentación

```markdown
// PORTUL_LANGUAGE_SPEC.md
// TECHNICAL_ARCHITECTURE.md
// BOOTSTRAP_TUTORIAL.md
```

**Oportunidades:**
- Traducir a otros idiomas
- Agregar más ejemplos
- Mejorar claridad
- Videos tutoriales

### Tests

```bash
// test-compiler.js
// meta-bootstrap.js
// Agregar test suite completa
```

**Oportunidades:**
- Unit tests
- Integration tests
- Performance tests
- Fuzz testing

---

## 🚀 Setup de Desarrollo

```bash
# Instalar dependencias
npm install
cd backend
npm install
cd ..

# Iniciar backend (puerto 3001)
cd backend
npm run dev

# En otra terminal: frontend (puerto 5173)
npm run dev

# En otra terminal: compilar compilador
node meta-bootstrap.js
```

---

## 📝 Código de Conducta

- Sé respetuoso
- Sé inclusivo
- Sé constructivo
- Reporta problemas de conducta a [maintainers]

---

## 📞 Preguntas?

- Abre una **Discussion** en GitHub
- Comenta en **Issues**
- Revisa la **Documentación**

---

## 🎉 ¡Gracias!

Cada contribución (código, docs, ejemplos, reportes) ayuda a que Portul sea mejor.

**¡Bienvenido a la comunidad!** 🚀

---

*Guía de Contribución - Portul Hypercompiler*
