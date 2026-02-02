# 🎮 DEMO CODE - Prueba las Características Profesionales

Este archivo contiene ejemplos de código Portul diseñados específicamente para demostrar todas las nuevas características profesionales integradas.

---

## 📝 INSTRUCCIONES

1. Copia cada bloque de código
2. Pégalo en el editor Portul
3. Sigue las instrucciones de cada sección
4. Observa las características en acción

---

## 🔥 DEMO 1: IntelliSense Básico

**Copia este código y luego escribe más:**

```portul
num counter = 0
txt message = "Hello Portul"

# Ahora escribe "num " y presiona Ctrl+Space
# Verás sugerencias de variables y tipos

# Escribe "for " y presiona Ctrl+Space
# Verás template de loop automático
```

**Qué probar:**
- Escribe `num ` y presiona `Ctrl+Space`
- Escribe `for ` y presiona `Ctrl+Space`
- Pasa el mouse sobre `num` o `txt`

---

## 🔍 DEMO 2: Hover Documentation

**Copia y pasa el mouse sobre las palabras clave:**

```portul
# Pasa el mouse sobre cada keyword para ver documentación

num x = 10        # Hover sobre "num"
txt name = "AI"   # Hover sobre "txt"
obj data = null   # Hover sobre "obj"

for i 0 10 {      # Hover sobre "for"
    put i         # Hover sobre "put"
}

if equ x 10 {     # Hover sobre "if" y "equ"
    inc x         # Hover sobre "inc"
}
```

**Qué verás:**
- Documentación completa de cada keyword
- Ejemplos de uso
- Descripción de parámetros

---

## 🎨 DEMO 3: Análisis Semántico (Errores Intencionados)

**Copia este código CON ERRORES para ver el análisis:**

```portul
# ERROR 1: Variable no inicializada
num x
add x 5
# Verás: E003 - Variable 'x' not initialized before use

# ERROR 2: Variable no definida
num y = 10
add y z
# Verás: E003 - Undefined variable 'z'

# WARNING 1: Variable no usada
num unused = 42
# Verás: H002 - Variable 'unused' is declared but never used

# WARNING 2: Condición siempre verdadera
if equ x x {
    put "always true"
}
# Verás: W003 - Condition is always true

# INFO: Sugerencia de optimización
add x 1
# Verás: I001 - Use 'inc x' instead for better performance
```

**Qué observar:**
- Líneas rojas para errores
- Líneas amarillas para warnings
- Iconos de sentinela a la derecha
- Panel "Axiom Analysis" abajo

---

## 🤖 DEMO 4: IA Local (Modo Aether)

**Instrucciones:**
1. Cambia al panel de **AI Assistant** (icono ⭐)
2. Cambia a modo **Aether** (botón morado con átomo)
3. Escribe estos prompts:

### Prompt 1:
```
necesito un loop que cuente hasta 100
```

### Prompt 2:
```
crea una variable llamada suma y inicialízala en cero
```

### Prompt 3:
```
quiero una función que calcule el factorial
```

**Qué observar:**
- La IA responde SIN usar internet
- Genera código basado en patterns aprendidos
- Muestra sugerencias con explicación
- Puedes aceptar o rechazar

---

## 🔧 DEMO 5: Refactoring - Extract Method

**Copia este código y sigue los pasos:**

```portul
num area = 0
num length = 10
num width = 5
mul length width
mov area length
put area
```

**Pasos:**
1. Selecciona las líneas 3-5 (desde `mul` hasta `mov area`)
2. Click derecho → "Extract Method"
3. El código se refactoriza automáticamente

**Resultado esperado:**
```portul
num area = 0
cal calculateArea 10 5 area

public calculateArea num length num width num result {
    mul length width
    mov result length
}
```

---

## 📦 DEMO 6: Refactoring - Extract Variable

**Copia este código:**

```portul
if equ x 42 {
    put "answer"
}
```

**Pasos:**
1. Selecciona el `42`
2. Click derecho → "Extract Variable"
3. Se crea una variable automáticamente

**Resultado esperado:**
```portul
num magicNumber = 42
if equ x magicNumber {
    put "answer"
}
```

---

## ⚡ DEMO 7: Refactoring - Optimize Performance

**Copia este código NO OPTIMIZADO:**

```portul
num x = 10
add x 1
add x 1
mul x 8
div x 4
```

**Pasos:**
1. Selecciona todo el código
2. Click derecho → "Optimize Performance"

**Resultado esperado:**
```portul
num x = 10
inc x
inc x
shl x 3  # shift left es más rápido que mul 8
shr x 2  # shift right es más rápido que div 4
```

---

## 🏗️ DEMO 8: Build Profesional

**Copia este código completo:**

```portul
class Calculator {
    private num result;
    
    new Calculator num initial {
        mov this.result initial;
    }
    
    public add num value {
        add this.result value;
    }
    
    public getResult num {
        ret this.result;
    }
}

obj calc = Calculator.new 0
calc.add 10
calc.add 20
calc.add 30

num final = calc.getResult
put final
```

**Pasos:**
1. Click en botón **⚡ Build** (con rayo)
2. Observa el panel "Build Output"

**Qué verás:**
```
✅ Build Successful!

Generated 67 lines of assembly
Optimization passes: 4
IR instructions: 45

🎯 Professional build completed with LLVM-style optimization
```

---

## 🎯 DEMO 9: Signature Help

**Escribe este código LETRA POR LETRA:**

```portul
class Logger {
    public log txt message num level {
        put message
    }
}

obj logger = Logger.new
logger.log
```

**Pasos:**
1. Escribe `logger.log(`
2. Después de escribir `(`, verás ayuda de parámetros
3. Muestra qué parámetros espera el método

---

## 🔄 DEMO 10: Error Recovery

**Copia este código CON MÚLTIPLES ERRORES:**

```portul
class MyClass {
    public method
        num x = 10
        add x
    }
    
    num y = 
}

for i 0 10
    put i

if equ x {
    put "broken"
```

**Qué observar:**
- El parser detecta TODOS los errores
- Se recupera de cada error y continúa
- Genera AST parcial usable
- Muestra ubicaciones exactas de errores
- Panel "Build Output" muestra lista completa

---

## 💾 DEMO 11: Move Semantics

**Copia y observa el análisis:**

```portul
num value = 10
txt name = "Portul"

mov other_value value
put other_value  # ✅ OK

put value        # ❌ ERROR: Cannot use 'value' because it was moved
```

**Qué verás:**
- Error E005: Use after move
- El análisis detecta ownership violations
- Similar a Rust ownership

---

## 🌐 DEMO 12: Código Completo Fibonacci

**Copia este ejemplo completo para probar TODO:**

```portul
# Fibonacci con todas las características profesionales

class Fibonacci {
    private num a;
    private num b;
    
    # Constructor - Signature help disponible
    new Fibonacci num first num second {
        mov this.a first;
        mov this.b second;
    }
    
    # Método next - IntelliSense al usarlo
    public next num {
        num temp = this.a
        add this.a this.b
        mov this.b temp
        ret this.a
    }
}

# Uso con IntelliSense completo
obj fib = Fibonacci.new 0 1

for i 0 10 {
    num current = fib.next
    put current
}
```

**Pasos para probar TODO:**
1. Copia el código
2. Pasa el mouse sobre `class`, `new`, `for`, etc. (Hover)
3. Escribe `fib.` y presiona Ctrl+Space (IntelliSense)
4. Click en botón **⚡ Build** (Build profesional)
5. Observa el panel "Build Output" - verás IR + Assembly
6. Selecciona código y click derecho (Refactoring menu)
7. Cambia a modo Aether y pregunta algo (IA local)

---

## 📊 CHECKLIST DE PRUEBAS

Usa este checklist para verificar que todo funciona:

### IntelliSense
- [ ] Ctrl+Space muestra sugerencias
- [ ] Sugerencias se pueden navegar con ↑↓
- [ ] Enter inserta la sugerencia
- [ ] Esc cierra el menú

### Hover
- [ ] Mouse sobre keywords muestra docs
- [ ] Tooltip aparece en <500ms
- [ ] Documentación es clara y útil

### Análisis Semántico
- [ ] Errores se muestran en rojo
- [ ] Warnings se muestran en amarillo
- [ ] Panel "Axiom Analysis" lista todos los diagnósticos
- [ ] Iconos de sentinela aparecen en el gutter

### IA Local (Aether)
- [ ] Modo Aether funciona sin internet
- [ ] Genera código basado en prompts
- [ ] Muestra pending actions
- [ ] Puedes aceptar/rechazar sugerencias

### Refactoring
- [ ] Click derecho muestra menú
- [ ] Extract Method funciona
- [ ] Extract Variable funciona
- [ ] Optimize Performance mejora código

### Build Profesional
- [ ] Botón Build tiene rayo ⚡
- [ ] Build muestra IR generado
- [ ] Build muestra Assembly
- [ ] Build reporta estadísticas
- [ ] Errores se muestran claramente

---

## 🎉 CONCLUSIÓN

Si completaste todas las demos, has verificado que:

✅ **IntelliSense** funciona perfectamente
✅ **Análisis semántico** detecta errores en tiempo real
✅ **IA local** genera código sin internet
✅ **Refactoring** transforma código automáticamente
✅ **Build profesional** genera IR + Assembly optimizado

**¡Tu compilador Portul es ahora de NIVEL PROFESIONAL!** 🚀

---

**Tip Final:** Experimenta libremente. El sistema es robusto y puede manejar errores. ¡Diviértete programando en Portul! 🎨
