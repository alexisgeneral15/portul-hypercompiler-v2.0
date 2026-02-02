# 🔄 Portul Hypercompiler - Flujos de Procesamiento

## 1️⃣ Flujo de Compilación Simple

```
ENTRADA: Código Portul
         │
         ↓
    ┌─────────────────┐
    │  LEXER          │ Tokenización
    │  lexer.js       │ (42 tipos de tokens)
    └────────┬────────┘
             │
         Token Stream
             │
             ↓
    ┌─────────────────┐
    │  PARSER         │ Análisis Sintáctico
    │  parser.js      │ (AST Construction)
    └────────┬────────┘
             │
         Abstract Syntax Tree
             │
             ↓
    ┌─────────────────┐
    │  SEMANTIC       │ Validación
    │  ANALYZER       │ • Symbol table
    │  analyzer.js    │ • Type checking
    └────────┬────────┘
             │
         Validated AST
             │
             ↓
    ┌─────────────────┐
    │  IR GENERATOR   │ LLVM IR
    │  irGenerator.js │ (Intermediate Rep.)
    └────────┬────────┘
             │
         LLVM IR Code (.ll)
             │
             ↓
    ┌─────────────────┐
    │  LLVM           │ Compilación
    │  COMPILER       │ • llc (IR→ASM)
    │  llvmCompiler.js│ • ml64 (ASM→OBJ)
    │                 │ • link (OBJ→EXE)
    └────────┬────────┘
             │
         SALIDA: .exe (Windows Executable)
```

## 2️⃣ Flujo de API Request-Response

```
CLIENT (Frontend)
    │
    ├─ Código Portul
    │
    ↓
POST /api/compile
    │
    ├─ { code: "...", target: "windows-x64" }
    │
    ↓
BACKEND (Express.js)
    │
    ├─ Validación de entrada
    ├─ Generación ID único (UUID)
    ├─ Guardado de código en storage
    │
    ↓
ENQUEUE (Bull)
    │
    ├─ Job creado
    ├─ Guardado en Redis
    ├─ En espera de worker disponible
    │
    ↓ (QUEUE)
    │
    ├─ Worker #1: Disponible ✓
    │
    ↓
COMPILATION WORKER
    │
    ├─ 1. Lexer: tokens
    ├─ 2. Parser: AST
    ├─ 3. Semantic: validación
    ├─ 4. IRGen: LLVM IR
    ├─ 5. LLVM: compilación
    ├─ Guardado en storage
    │
    ↓
RESPONSE
    │
    ├─ Status actualizado
    ├─ Progress: 100%
    ├─ exeSize: bytes
    │
    ↓
CLIENT (Frontend)
    │
    ├─ Mostrar "Compilado"
    ├─ Botón "Descargar"
    │
    ↓
GET /api/compile/:id/download
    │
    ├─ Lectura de archivo
    │
    ↓
DOWNLOAD
    │
    ├─ Binary .exe blob
    │
    ↓
CLIENTE
    │
    ├─ Archivo descargado
    ├─ Ejecutable en Windows
```

## 3️⃣ Flujo de Almacenamiento

```
storage/
├── {compilationId}/
│   ├── input.portul          ← Código fuente
│   ├── output.ll              ← LLVM IR
│   ├── output.s               ← Assembly
│   ├── output.obj             ← Object file
│   ├── output.exe             ← Ejecutable ✓
│   └── meta.json              ← Metadata
│
└── projects/
    ├── {projectId}.json
    └── {projectId}.json
```

## 4️⃣ Flujo de Worker Pool

```
Compilations Queue (Bull + Redis)
│
├─ Job #1: abc123 ────→ Worker 1  [Compilando...]
├─ Job #2: def456 ────→ Worker 2  [Compilando...]
├─ Job #3: ghi789 ────→ Worker 3  [Compilando...]
├─ Job #4: jkl012 ────→ Worker 4  [Compilando...]
├─ Job #5: mno345 ────→ Worker 5  [Compilando...]
├─ Job #6: pqr678 ────→ Worker 6  [Compilando...]
├─ Job #7: stu901 ────→ Worker 7  [Compilando...]
├─ Job #8: vwx234 ────→ Worker 8  [Compilando...]
│
└─ Job #9: yza567 ─→ [EN COLA - Esperando worker libre]
   Job #10: bcd890 ─→ [EN COLA - Esperando worker libre]
   ...

Cuando Worker 1 termina:
Worker 1 ←─ Job #9: yza567 [Empieza a compilar]

Timeline:
├─ T=0s:    Jobs 1-8 encolados, Workers asignados
├─ T=3s:    Job 1 completa, Job 9 asignado a Worker 1
├─ T=6s:    Job 2 completa, Job 10 asignado a Worker 2
├─ ...
└─ T=30s:   Todos los jobs completados
```

## 5️⃣ Flujo de Manejo de Errores

```
ENTRADA
   │
   ↓
¿Código válido?
   │
   ├─ No ──→ [ERROR: Syntax Error]
   │        └─ Response: 400 Bad Request
   │
   └─ Sí
      │
      ↓
¿Backend disponible?
   │
   ├─ No ──→ [ERROR: Backend Down]
   │        └─ Response: 503 Service Unavailable
   │
   └─ Sí
      │
      ↓
Queue → Worker
   │
   ↓
¿Lexer OK?
   │
   ├─ No ──→ [ERROR: Lexer Error]
   │        └─ Guardado en meta.json
   │
   └─ Sí
      │
      ↓
¿Parser OK?
   │
   ├─ No ──→ [ERROR: Syntax Error]
   │        └─ Guardado en meta.json
   │
   └─ Sí
      │
      ↓
¿Semantic OK?
   │
   ├─ No ──→ [ERROR: Type Error]
   │        └─ Guardado en meta.json
   │
   └─ Sí
      │
      ↓
¿IR Generation OK?
   │
   ├─ No ──→ [ERROR: Code Gen Error]
   │        └─ Guardado en meta.json
   │
   └─ Sí
      │
      ↓
¿LLVM Compilation OK?
   │
   ├─ No ──→ [ERROR: Compilation Error]
   │        └─ Usa fallback PE generator
   │
   └─ Sí
      │
      ↓
   SUCCESS: .exe generado
   └─ Response: status = "compiled"
```

## 6️⃣ Flujo de Polling Frontend

```
Frontend Component
│
├─ User clicks "Compilar"
│
├─ POST /api/compile
│  └─ Response: { id: "abc123" }
│
├─ State: isCompiling = true
│
├─ Loop: Cada 1 segundo
│  │
│  └─ GET /api/compile/abc123
│     │
│     ├─ Response: { status: "compiling", progress: 25 }
│     │  └─ Actualizar barra de progreso
│     │
│     ├─ Response: { status: "compiling", progress: 50 }
│     │  └─ Actualizar barra de progreso
│     │
│     ├─ Response: { status: "compiling", progress: 75 }
│     │  └─ Actualizar barra de progreso
│     │
│     └─ Response: { status: "compiled", progress: 100 }
│        └─ ¡Completado! Mostrar botón Descargar
│
└─ User clicks "Descargar .exe"
   │
   └─ GET /api/compile/abc123/download
      └─ Descarga archivo
```

## 7️⃣ Flujo de Tipos de Datos

```
Portul Type     →    LLVM Type       →    C Type
─────────────────────────────────────────────────
num              →    i32             →    int
txt              →    i8*             →    char*
obj              →    i8*             →    void*
ary              →    i8*             →    void*
ptr              →    i8*             →    void*

Example Conversion:
─────────────────────────────────────────────────
funcion suma(num a, num b) -> num
   ↓
define i32 @suma(i32 %a, i32 %b) {
  entry:
    %add = add i32 %a, %b
    ret i32 %add
}
```

## 8️⃣ Flujo de Precedencia de Operadores

```
Expression: a + b * c - d / e

Parser Parsing Tree:
         (-) [subtract]
        /  \
      (+)   (/)  [divide]
     / \   / \
    a   (*) d   e
       / \
      b   c

Evaluation (respeta precedencia):
1. b * c = bc
2. d / e = de
3. a + bc = abc
4. abc - de = RESULTADO
```

## 9️⃣ Flujo de Compilación Completa (Detallado)

```
┌────────────────────────────────────────────────────────┐
│                    INICIO                              │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │  LEXER             │ INPUT: "funcion suma(num a) { regresa a; }"
    └────────┬───────────┘
             │
             ↓
    TOKEN OUTPUT:
    KEYWORD(funcion), IDENTIFIER(suma), LPAREN((),
    KEYWORD(num), IDENTIFIER(a), RPAREN()),
    LBRACE({), KEYWORD(regresa), IDENTIFIER(a),
    SEMICOLON(;), RBRACE(})
             │
             ↓
    ┌────────────────────┐
    │  PARSER            │
    └────────┬───────────┘
             │
             ↓
    AST OUTPUT:
    {
      type: "Program",
      statements: [{
        type: "FunctionDeclaration",
        name: "suma",
        params: [{name: "a", type: "num"}],
        returnType: "num",
        body: [{
          type: "ReturnStatement",
          argument: {type: "Identifier", name: "a"}
        }]
      }]
    }
             │
             ↓
    ┌────────────────────┐
    │  SEMANTIC ANALYZER │
    └────────┬───────────┘
             │
             ↓
    SYMBOL TABLE:
    - suma: function, params: [a: num], returns: num
    - a: parameter, type: num
    
    VALIDATION:
    ✓ suma defined
    ✓ a defined
    ✓ return type matches
    ✓ No errors
             │
             ↓
    ┌────────────────────┐
    │  IR GENERATOR      │
    └────────┬───────────┘
             │
             ↓
    LLVM IR OUTPUT:
    ; Generated LLVM IR
    target datalayout = "e-m:w-p270:32:32-..."
    target triple = "x86_64-pc-windows-msvc19.0.0"
    
    define i32 @suma(i32 %a) {
    entry:
      ret i32 %a
    }
             │
             ↓
    ┌────────────────────┐
    │  LLVM COMPILER     │
    │  (3 steps)         │
    └────────┬───────────┘
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
   LLC               (Fallback)
   │                  │
   IR→ASM             PE Generator
   │                  │
   output.s           output.exe
   │                  │
   ↓                  └──────┬────────┐
   ML64/AS                    │        │
   │                          │        │
   ASM→OBJ                     │        │
   │                          │        │
   output.obj                 │        │
   │                          │        │
   ↓                          │        │
   LINK                       │        │
   │                          │        │
   OBJ→EXE                     │        │
   │                          │        │
   ↓                          ↓        │
   output.exe ←───────────────┴────────┘
             │
             ↓
    ┌────────────────────┐
    │  SAVE TO STORAGE   │
    └────────┬───────────┘
             │
             ├─ input.portul  ✓
             ├─ output.ll     ✓
             ├─ output.exe    ✓
             └─ meta.json     ✓
             │
             ↓
    ┌────────────────────┐
    │  UPDATE STATUS     │
    └────────┬───────────┘
             │
             ├─ status: "compiled"
             ├─ progress: 100
             ├─ exeSize: 2048
             └─ completedAt: timestamp
             │
             ↓
    ┌────────────────────┐
    │  FIN - SUCCESS ✓   │
    └────────────────────┘
```

---

Estos diagramas muestran el flujo completo del sistema Portul Hypercompiler desde la entrada de código hasta la generación del ejecutable final.
