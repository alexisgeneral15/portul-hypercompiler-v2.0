# 📖 Especificación del Lenguaje Portul

**Versión:** 1.0 Bootstrap  
**Fecha:** 2 de Febrero de 2026  
**Estado:** Completamente especificado para bootstrapping

---

## 1. Introducción

Portul es un lenguaje de programación minimalista diseñado para demostrar conceptos de compilación y bootstrapping. Su sintaxis es clara y su semántica es directa, haciendo fácil la implementación de compiladores.

---

## 2. Estructura Léxica

### 2.1 Caracteres y Tokens

#### Espacios en Blanco
```portul
[ \t\n\r]+   // Ignorados (excepto en strings)
```

#### Comentarios
```portul
//  comentario de una línea
/* comentario de múltiples líneas */
```

#### Identificadores
```portul
[a-zA-Z_][a-zA-Z0-9_]*

Ejemplos válidos:
main, variable_nombre, _privado, x, myClass123
```

#### Palabras Clave (Reservadas)

```portul
main          // Bloque de entrada
si            // Condicional if
para          // Loop for (estilo Portul)
mientras      // Loop while
funcion       // Definición de función
clase         // Definición de clase
use           // Importar módulo
new           // Crear instancia
private       // Acceso privado
public        // Acceso público
ret           // Return (retornar)
this          // Referencia a objeto actual
null          // Valor nulo
true          // Booleano verdadero
false         // Booleano falso
```

#### Tipos Primitivos
```portul
num           // Número (32-bit signed integer)
txt           // Texto (Unicode string)
obj           // Objeto (instancia de clase)
ary           // Array (arreglo de elementos)
ptr           // Puntero a memoria
vacio         // Sin valor (void)
```

#### Literales

**Números:**
```portul
42            // Decimal
0xFF          // Hexadecimal
0b1010        // Binario (opcional)
0o755         // Octal (opcional)
```

**Strings:**
```portul
"Hello"       // String con comillas dobles
'World'       // String con comillas simples
"Multi\nline" // Con escape sequences
"Unicode: ñ"  // Soporta Unicode
```

**Booleanos:**
```portul
true          // Valor verdadero
false         // Valor falso
```

#### Operadores

**Aritméticos:**
```portul
+             // Suma
-             // Resta
*             // Multiplicación
/             // División entera
%             // Módulo (residuo)
```

**Comparación:**
```portul
==            // Igualdad
!=            // Desigualdad
<             // Menor que
>             // Mayor que
<=            // Menor o igual
>=            // Mayor o igual
```

**Lógicos:**
```portul
&&            // AND lógico
||            // OR lógico
!             // NOT lógico
```

**Asignación:**
```portul
=             // Asignación simple
+=            // Suma y asigna (num x = 5; x += 3; // x = 8)
-=            // Resta y asigna
*=            // Multiplica y asigna
/=            // Divide y asigna
```

**Acceso:**
```portul
.             // Acceso a miembro (obj.propiedad)
->            // Arrow para retorno de tipo
```

#### Puntuación

```portul
{     }       // Bloques de código
(     )       // Parámetros y expresiones
[     ]       // Arrays (futuro)
,             // Separador de argumentos
;             // Terminador de sentencia (opcional)
```

---

## 3. Sintaxis y Semántica

### 3.1 Programa Principal

```
program = (mainBlock | functionDef | classDef)*
```

### 3.2 Bloque Main

El punto de entrada del programa:

```portul
main {
  // Sentencias que se ejecutan al iniciar
  put "Program started"
  num x = 10
  put x
}
```

**Reglas:**
- Existe exactamente UN bloque `main` por programa
- Se ejecuta cuando el programa inicia
- Debe retornar implícitamente 0

### 3.3 Variables

#### Declaración

```portul
num age = 25
txt name = "John"
obj instance = new MyClass
ary list = [1, 2, 3]
ptr address = null
```

**Tipos de alcance:**

```portul
// Global (en nivel main)
num global_var = 100

main {
  // Local (en main)
  num local_var = 50
  
  para i 0 10 {
    // Block scope (en loop)
    num loop_var = i
  }
  // loop_var no accesible aquí
}
```

#### Inicialización

```portul
// Explícita
num x = 5

// Implícita (valores por defecto)
num y              // y = 0
txt name           // name = ""
obj obj_var        // obj_var = null
```

#### Mutabilidad

```portul
num x = 5
x = 10             // Permitido

txt const_str = "Hello"
const_str = "World"  // Permitido (por ahora sin 'const')
```

### 3.4 Control de Flujo

#### Condicional: si

```portul
si condición {
  // Si verdadero
}

si condición {
  // Si verdadero
} si otra_condición {
  // Si segunda condición (else if)
}

si condición {
  // Si verdadero
} si {
  // Si ninguna anterior fue verdadera (else)
}
```

**Ejemplos:**

```portul
num x = 10

si x > 5 {
  put "Mayor que 5"
} si x > 0 {
  put "Mayor que 0"
} si {
  put "Menor o igual a 0"
}
```

#### Loop: para

**Estilo Portul** (recomendado):

```portul
para i 0 10 {
  put i
}
// i: 0, 1, 2, ..., 9

para j 5 15 {
  put j
}
// j: 5, 6, 7, ..., 14
```

**Sintaxis:** `para variable inicio fin { body }`

Donde:
- `variable`: Identificador del contador
- `inicio`: Valor inicial (inclusivo)
- `fin`: Valor final (exclusivo)
- `body`: Sentencias a repetir

**Estilo C** (también soportado):

```portul
para(num i = 0; i < 10; i++) {
  put i
}
```

**Ejemplos avanzados:**

```portul
// Loop anidado
para i 0 3 {
  para j 0 3 {
    put "i=" + i + ", j=" + j
  }
}

// Loop con condicional
para k 0 20 {
  si k % 2 == 0 {
    put k
  }
}

// Loop con acumulador
num suma = 0
para n 1 11 {
  suma = add suma n  // suma += n
}
put suma  // 55
```

#### Loop: mientras

```portul
num x = 0
mientras x < 10 {
  put x
  x = add x 1  // x++
}
// x: 0, 1, 2, ..., 9
```

**Sintaxis:** `mientras condición { body }`

**Cuidado:**

```portul
mientras true {
  put "Infinite loop"
  // BREAK no existe, evitar infinito
}
```

### 3.5 Funciones

#### Definición

```portul
funcion suma num a num b num -> {
  ret add a b
}
```

**Sintaxis:**
```
funcion <nombre> <tipo> <param1> <tipo> <param2> ... <tipo_retorno> -> {
  <body>
}
```

#### Llamada

```portul
// Usando 'cal' (call)
num resultado = cal suma 5 3  // 8
put resultado

// Llamada directa
suma 10 20                     // 30 (resultado se descarta)
```

#### Ejemplos

```portul
// Factorial
funcion factorial num n num -> {
  si n <= 1 {
    ret 1
  } si {
    ret mul n cal factorial sub n 1
  }
}

// Fibonacci
funcion fib num n num -> {
  si n <= 1 {
    ret n
  } si {
    ret add (cal fib sub n 1) (cal fib sub n 2)
  }
}

main {
  put cal factorial 5   // 120
  put cal fib 10        // 55
}
```

### 3.6 Clases

#### Definición

```portul
clase Persona {
  private txt nombre
  private num edad
  public num sueldo

  public funcion getNombre txt -> {
    ret this.nombre
  }

  public funcion hacerMayor vacio -> {
    this.edad = add this.edad 1
  }
}
```

**Estructura:**
- Propiedades (private o public)
- Métodos (funciones dentro de la clase)
- Constructor implícito (inicializa propiedades)

#### Instanciación

```portul
obj persona = new Persona
// Crea instancia, inicializa propiedades en null/0

persona.nombre = "Carlos"
persona.edad = 30
persona.sueldo = 50000
```

#### Acceso a Miembros

```portul
// Leer propiedad
txt nombre = persona.nombre

// Llamar método
cal persona.hacerMayor

// Encadenamiento
nombre_mayor = cal persona.getNombre
```

#### Herencia (No soportado en v1.0)

```portul
// Futuro
clase Empleado extiende Persona {
  // ...
}
```

---

## 4. Funciones Integradas

### 4.1 I/O (Entrada/Salida)

```portul
put valor          // Imprime valor seguido de newline
```

**Ejemplos:**

```portul
put "Hello"        // Hello
put 42             // 42
put 3.14           // 3.14 (si soporta floats)
```

### 4.2 Operaciones Aritméticas

```portul
add a b            // a + b
sub a b            // a - b
mul a b            // a * b
div a b            // a / b (división entera)
mod a b            // a % b (módulo)
inc a              // a + 1
dec a              // a - 1
```

**Ejemplos:**

```portul
num x = add 5 3         // 8
num y = mul x 2         // 16
num z = mod 10 3        // 1
```

### 4.3 Comparación Lógica

```portul
if cond then else      // if condición ? then : else
eq a b                 // a == b
neq a b                // a != b
lt a b                 // a < b
gt a b                 // a > b
lte a b                // a <= b
gte a b                // a >= b
```

### 4.4 Gestión de Memoria

```portul
mov dst src            // Mover valor src a dst
cal func arg1 arg2     // Llamar función con argumentos
```

### 4.5 Tipo Query/Casting (Futuro)

```portul
typeof valor           // Retorna tipo (futuro)
cast valor tipo        // Convierte tipo (futuro)
```

---

## 5. Semantica de Tipos

### 5.1 Sistema de Tipos

Portul es **estáticamente tipado**. Todos los tipos se verifican en tiempo de compilación.

```portul
num x = 5
x = "texto"    // ERROR: No puede asignar txt a num

txt nombre = "Carlos"
nombre = 42    // ERROR: No puede asignar num a txt
```

### 5.2 Coerción de Tipos

La coerción automática es limitada:

```portul
// Permitido (números primitivos)
num a = 5
num b = add a 3     // OK

// No permitido (tipos diferentes)
txt s = "5"
num n = s           // ERROR

// Debes convertir explícitamente (futuro)
num n = int_from_str s  // (futuro feature)
```

### 5.3 Verificación de Tipos

```portul
funcion suma num a num b num -> {
  ret add a b
}

// Correcto
resultado = cal suma 5 3

// Error en compilación
resultado = cal suma "5" "3"  // ERROR: esperaba num, obtuvo txt

// Error en compilación
resultado = cal suma 5        // ERROR: faltan argumentos
```

---

## 6. Scope y Visibilidad

### 6.1 Scopes

```portul
// Global
num global = 100

main {
  // Scope principal (Main)
  num main_var = 50
  
  si true {
    // Scope del bloque if
    num if_var = 25
    put if_var         // OK
  }
  put if_var           // ERROR: if_var no definida en main scope
  
  para i 0 10 {
    // Scope del loop
    num loop_var = i
    put loop_var       // OK
  }
  put loop_var         // ERROR: loop_var no definida
}
```

### 6.2 Shadowing

```portul
num x = 10

main {
  num x = 20         // Nueva variable x (sombrea la global)
  put x              // 20
  
  si true {
    num x = 30       // Otra variable x
    put x            // 30
  }
  
  put x              // 20 (la de main)
}
```

### 6.3 Acceso a Miembros de Clase

```portul
clase Persona {
  private num edad
  public num sueldo
  
  public funcion getEdad num -> {
    ret this.edad      // Acceso a private dentro de clase
  }
}

main {
  obj p = new Persona
  put p.sueldo         // OK: public
  // put p.edad       // ERROR: private
  
  edad_actual = cal p.getEdad  // OK: llamar método público
}
```

---

## 7. Errores y Excepciones

### 7.1 Errores en Compilación

```portul
// ERROR: Variable no definida
put undefined_var

// ERROR: Tipo incorrecto
num x = "texto"

// ERROR: Función no definida
resultado = cal funccion_inexistente 5

// ERROR: Argumentos incorrectos
suma = cal add 1      // Faltan argumentos

// ERROR: Scope inválido
main { }
main { }  // Dos bloques main
```

### 7.2 Errores en Runtime

```portul
// División por cero (futuro: manejo de excepciones)
num x = div 10 0      // Puede causar error

// Array fuera de rango (futuro)
ary arr = [1, 2, 3]
put arr[10]           // Índice fuera de rango
```

---

## 8. Ejemplos Completos

### Ejemplo 1: Hello World

```portul
main {
  put "¡Hola Mundo!"
}
```

**Compilación:**
```
Lexer:      5 tokens
Parser:     MainBlock AST
Semantic:   ✓ Valid
IR:         Generated
PE:         512 bytes
```

### Ejemplo 2: Fibonacci

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

**Output esperado:**
```
0
1
1
2
3
5
8
13
21
34
```

### Ejemplo 3: Clase

```portul
clase Contador {
  private num valor
  
  public funcion incrementar vacio -> {
    this.valor = add this.valor 1
  }
  
  public funcion getValor num -> {
    ret this.valor
  }
}

main {
  obj contador = new Contador
  cal contador.incrementar
  cal contador.incrementar
  cal contador.incrementar
  put cal contador.getValor    // 3
}
```

### Ejemplo 4: Compilador en Portul

```portul
class PortulCompilerCore {
  private obj lexer
  private obj parser
  private obj semantic
  private obj ir_gen
  private obj linker

  public funcion compile txt source_code obj -> {
    obj tokens = cal this.lexer.tokenize source_code
    obj ast = cal this.parser.parse tokens
    obj semantic_ast = cal this.semantic.analyze ast
    obj ir = cal this.ir_gen.generate semantic_ast
    obj executable = cal this.linker.link ir
    ret executable
  }
}

main {
  obj compiler = new PortulCompilerCore
  put "✓ Portul Compiler Bootstrap Successful"
}
```

---

## 9. Gramática Formal (BNF)

```bnf
<program>       ::= ( <mainBlock> | <functionDef> | <classDef> )*

<mainBlock>     ::= 'main' '{' <statements> '}'

<statements>    ::= ( <statement> ';'? )*

<statement>     ::= <varDecl>
                 | <ifStatement>
                 | <forStatement>
                 | <whileStatement>
                 | <functionCall>
                 | <assignment>
                 | <returnStatement>

<varDecl>       ::= <type> <identifier> ( '=' <expression> )?

<type>          ::= 'num' | 'txt' | 'obj' | 'ary' | 'ptr' | 'vacio'

<ifStatement>   ::= 'si' <expression> '{' <statements> '}'
                   ( 'si' <expression> '{' <statements> '}' )*
                   ( 'si' '{' <statements> '}' )?

<forStatement>  ::= 'para' <identifier> <number> <number> '{' <statements> '}'
                 | 'para' '(' <statement> ';' <expression> ';' <statement> ')' '{' <statements> '}'

<whileStatement> ::= 'mientras' <expression> '{' <statements> '}'

<functionDef>   ::= 'funcion' <identifier> ( <type> <identifier> )* <type> '->' '{'
                   <statements>
                   '}'

<classDef>      ::= 'clase' <identifier> '{'
                   ( ( 'private' | 'public' ) <type> <identifier> ';' )*
                   ( 'public' <functionDef> )*
                   '}'

<expression>    ::= <term> ( ( '+' | '-' | '*' | '/' | '%' ) <term> )*
                 | <comparison>
                 | <logical>

<comparison>    ::= <expression> ( '==' | '!=' | '<' | '>' | '<=' | '>=' ) <expression>

<logical>       ::= <expression> ( '&&' | '||' ) <expression>

<term>          ::= <factor> ( '*' | '/' | '%' <factor> )*

<factor>        ::= <number>
                 | <string>
                 | <identifier>
                 | <identifier> '.' <identifier>
                 | 'new' <identifier>
                 | 'cal' <identifier> ( <expression> )*
                 | '(' <expression> ')'

<functionCall>  ::= 'cal' <identifier> ( <expression> )*
                 | <identifier> '(' ( <expression> ( ',' <expression> )* )? ')'

<assignment>    ::= <identifier> '=' <expression>
                 | <identifier> '.' <identifier> '=' <expression>

<returnStatement> ::= 'ret' <expression>

<number>        ::= [0-9]+

<string>        ::= '"' ( ~["\n] | '\\' . )* '"'

<identifier>    ::= [a-zA-Z_] [a-zA-Z0-9_]*
```

---

## 10. Notas de Implementación

### 10.1 Compilador

El compilador Portul sigue estas fases:

1. **Lexer:** Tokenización
2. **Parser:** Construcción de AST
3. **Semantic Analyzer:** Validación de tipos
4. **IR Generator:** Código intermedio LLVM
5. **PE Compiler:** Ejecutable Windows

### 10.2 Optimizaciones (Futuro)

```portul
// Constant folding
num x = add 2 3    // Podría optimizarse a num x = 5

// Dead code elimination
num y = 10
num z = 20         // Si y nunca se usa, puede eliminarse

// Inlining
funcion small num a num b num -> { ret add a b }
// El compilador podría inlinar this.small
```

### 10.3 Limitaciones v1.0

- Sin flotantes (solo enteros 32-bit)
- Sin arrays (solo referencias)
- Sin herencia
- Sin genéricos
- Sin excepciones
- Sin pattern matching
- Sin async/await

---

## 11. Referencias

- **LLVM:** https://llvm.org/
- **PE Format:** https://docs.microsoft.com/en-us/windows/win32/debug/pe-format
- **Bootstrap Compilers:** https://en.wikipedia.org/wiki/Bootstrapping_(compilers)

---

*Especificación del Lenguaje Portul v1.0*  
*Completado para Bootstrap: 2 de Febrero de 2026*
