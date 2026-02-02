# 🔗 INTEGRACIÓN: Compilador Real con Portul Existente

> Cómo conectar el compilador real con los servicios existentes del proyecto Portul

---

## 🎯 OBJETIVO

Convertir el **análisis semántico existente** (semanticAnalyzer.ts) en un **compilador real** que genere .exe ejecutables.

```
AST + Semantic Analysis (YA EXISTE)
              ↓
    Generador Portul → C (CREAR)
              ↓
    GCC/LLVM Compilation (YA EXISTE EN backend-server.ts)
              ↓
        .exe ejecutable ← RESULTADO
```

---

## 📁 ESTRUCTURA ACTUAL VS NUEVA

### Estructura Actual
```
services/
  ├─ semanticAnalyzer.ts    ✅ Parse + Analysis
  ├─ advancedParser.ts      ✅ Parsing
  ├─ languageServer.ts      ✅ LSP
  └─ portulCompiler.ts      (vacío - será reemplazado)
```

### Estructura Nueva (Propuesta)
```
services/
  ├─ semanticAnalyzer.ts    ✅ Parse + Analysis (SIN CAMBIOS)
  ├─ portulToC.ts           🆕 Generador C
  ├─ portulToLLVMIR.ts      🆕 Generador LLVM IR
  ├─ portulCompilationPipeline.ts  🆕 Pipeline completo
  └─ compilerService.ts     🆕 LLVM/GCC integration

backend/
  └─ services/
     ├─ compilerService.ts   (del backend-server.ts)
     └─ compilationQueue.ts   (del backend-server.ts)
```

---

## 📊 MAPEO DE DATOS

### De SemanticAnalyzer → PortulToC

```typescript
// semanticAnalyzer.ts ACTUAL
export interface SemanticDiagnostic {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export interface TypeInfo {
    type: string;
    isConst: boolean;
    isNullable: boolean;
}

// ↓ CONVERTIR A ↓

// portulToC.ts NUEVO
interface PortulAST {
    functions: FunctionDef[];
    variables: VarDef[];
    types: TypeDef[];
    imports: string[];
}

interface FunctionDef {
    name: string;
    parameters: Parameter[];
    returnType: TypeInfo;
    body: Statement[];
}

interface TypeDef {
    name: string;
    kind: 'struct' | 'enum' | 'primitive';
    fields?: Record<string, TypeInfo>;
}
```

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Crear Portul → C Generator

**Archivo: `services/portulToC.ts`**

```typescript
import { SemanticAnalyzer } from './semanticAnalyzer';

export class PortulToCGenerator {
    private typeMapping: Map<string, string> = new Map([
        ['int', 'int'],
        ['float', 'float'],
        ['double', 'double'],
        ['bool', 'int'],
        ['string', 'char*'],
        ['u8', 'uint8_t'],
        ['u16', 'uint16_t'],
        ['u32', 'uint32_t'],
        ['u64', 'uint64_t'],
        ['i8', 'int8_t'],
        ['i16', 'int16_t'],
        ['i32', 'int32_t'],
        ['i64', 'int64_t'],
    ]);

    /**
     * Genera código C desde AST del SemanticAnalyzer
     */
    generate(
        sourceCode: string,
        semanticAnalyzer: SemanticAnalyzer
    ): string {
        // 1. Parse usando semanticAnalyzer
        const ast = semanticAnalyzer.parse(sourceCode);
        
        // 2. Verificar tipos
        const errors = semanticAnalyzer.checkTypes(ast);
        if (errors.length > 0) {
            throw new Error(`Type errors:\n${errors.map(e => e.message).join('\n')}`);
        }

        // 3. Generar C
        let cCode = this.generateHeader();
        cCode += this.generateTypes(ast);
        cCode += this.generateFunctionDeclarations(ast);
        cCode += this.generateFunctions(ast);
        cCode += this.generateMain(ast);

        return cCode;
    }

    private generateHeader(): string {
        return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <math.h>

// Auto-generated from Portul
// DO NOT EDIT MANUALLY

`;
    }

    private generateTypes(ast: any): string {
        let code = '';
        
        // Generar tipos custom (structs, enums)
        for (const typedef of ast.types || []) {
            code += this.generateTypeDefinition(typedef);
        }

        return code ? code + '\n' : '';
    }

    private generateTypeDefinition(typedef: any): string {
        if (typedef.kind === 'struct') {
            let code = `typedef struct {\n`;
            
            for (const [fieldName, fieldType] of Object.entries(typedef.fields || {})) {
                code += `    ${this.portulTypeToCType(fieldType as any)} ${fieldName};\n`;
            }
            
            code += `} ${typedef.name};\n`;
            return code;
        }

        if (typedef.kind === 'enum') {
            let code = `typedef enum {\n`;
            
            for (const value of typedef.values || []) {
                code += `    ${value},\n`;
            }
            
            code += `} ${typedef.name};\n`;
            return code;
        }

        return '';
    }

    private generateFunctionDeclarations(ast: any): string {
        let code = '';
        
        for (const func of ast.functions || []) {
            if (!func.isBuiltin) {
                code += this.generateFunctionSignature(func) + ';\n';
            }
        }

        return code ? code + '\n' : '';
    }

    private generateFunctions(ast: any): string {
        let code = '';
        
        for (const func of ast.functions || []) {
            if (!func.isBuiltin) {
                code += this.generateFunction(func) + '\n';
            }
        }

        return code;
    }

    private generateFunction(func: any): string {
        const signature = this.generateFunctionSignature(func);
        let body = ' {\n';

        // Generar cuerpo
        if (func.body) {
            body += this.generateStatements(func.body, 1);
        }

        body += '}\n';

        return signature + body;
    }

    private generateFunctionSignature(func: any): string {
        const returnType = this.portulTypeToCType(func.returnType);
        const params = (func.parameters || [])
            .map((p: any) => `${this.portulTypeToCType(p.type)} ${p.name}`)
            .join(', ');

        return `${returnType} ${func.name}(${params})`;
    }

    private generateStatements(statements: any[], indent: number): string {
        const prefix = '  '.repeat(indent);
        let code = '';

        for (const stmt of statements) {
            code += this.generateStatement(stmt, indent);
        }

        return code;
    }

    private generateStatement(stmt: any, indent: number): string {
        const prefix = '  '.repeat(indent);

        switch (stmt.type) {
            case 'VarDeclaration':
                return this.generateVarDeclaration(stmt, prefix);

            case 'Assignment':
                return `${prefix}${stmt.target} = ${this.generateExpression(stmt.value)};\n`;

            case 'IfStatement':
                return this.generateIfStatement(stmt, prefix, indent);

            case 'WhileLoop':
                return this.generateWhileStatement(stmt, prefix, indent);

            case 'ForLoop':
                return this.generateForStatement(stmt, prefix, indent);

            case 'Return':
                return `${prefix}return${stmt.value ? ' ' + this.generateExpression(stmt.value) : ''};\n`;

            case 'FunctionCall':
                return `${prefix}${this.generateExpression(stmt)};\n`;

            case 'Block':
                return this.generateStatements(stmt.statements || [], indent);

            default:
                console.warn(`Unknown statement type: ${stmt.type}`);
                return '';
        }
    }

    private generateVarDeclaration(stmt: any, prefix: string): string {
        const type = this.portulTypeToCType(stmt.varType);
        let code = `${prefix}${type} ${stmt.name}`;

        if (stmt.initialValue) {
            code += ` = ${this.generateExpression(stmt.initialValue)}`;
        }

        code += ';\n';
        return code;
    }

    private generateIfStatement(stmt: any, prefix: string, indent: number): string {
        let code = `${prefix}if (${this.generateExpression(stmt.condition)}) {\n`;
        
        if (stmt.thenBranch) {
            code += this.generateStatements(stmt.thenBranch, indent + 1);
        }

        if (stmt.elseBranch) {
            code += `${prefix}} else {\n`;
            code += this.generateStatements(stmt.elseBranch, indent + 1);
        }

        code += `${prefix}}\n`;
        return code;
    }

    private generateWhileStatement(stmt: any, prefix: string, indent: number): string {
        let code = `${prefix}while (${this.generateExpression(stmt.condition)}) {\n`;
        
        if (stmt.body) {
            code += this.generateStatements(stmt.body, indent + 1);
        }

        code += `${prefix}}\n`;
        return code;
    }

    private generateForStatement(stmt: any, prefix: string, indent: number): string {
        let code = `${prefix}for (`;
        
        code += `${this.generateExpression(stmt.init)}; `;
        code += `${this.generateExpression(stmt.condition)}; `;
        code += `${this.generateExpression(stmt.update)}`;
        
        code += `) {\n`;
        
        if (stmt.body) {
            code += this.generateStatements(stmt.body, indent + 1);
        }

        code += `${prefix}}\n`;
        return code;
    }

    private generateExpression(expr: any): string {
        // Expresiones simples
        if (typeof expr === 'string') return expr;
        if (typeof expr === 'number') return expr.toString();
        if (typeof expr === 'boolean') return expr ? '1' : '0';

        // Expresiones complejas
        switch (expr.type) {
            case 'BinaryOp':
                return `(${this.generateExpression(expr.left)} ${expr.operator} ${this.generateExpression(expr.right)})`;

            case 'UnaryOp':
                return `${expr.operator}${this.generateExpression(expr.operand)}`;

            case 'FunctionCall':
                const args = (expr.arguments || [])
                    .map((arg: any) => this.generateExpression(arg))
                    .join(', ');
                return `${expr.name}(${args})`;

            case 'ArrayAccess':
                return `${expr.array}[${this.generateExpression(expr.index)}]`;

            case 'PropertyAccess':
                return `${expr.object}.${expr.property}`;

            case 'Identifier':
                return expr.name;

            case 'Literal':
                if (typeof expr.value === 'string') {
                    return `"${expr.value}"`;
                }
                return expr.value.toString();

            default:
                return '0';
        }
    }

    private portulTypeToCType(type: string): string {
        return this.typeMapping.get(type) || type;
    }
}
```

---

### Paso 2: Integrar con Backend

**Modificar: `backend-server.ts`**

```typescript
// Agregar import
import { PortulToCGenerator } from '../services/portulToC';
import { SemanticAnalyzer } from '../services/semanticAnalyzer';

// En la clase CompilationQueueManager, agregar:

private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)!;
    
    try {
        this.updateJob(jobId, {
            status: 'compiling',
            stage: 'parsing',
            progress: 10
        });
        
        // ✨ NUEVO: Usar SemanticAnalyzer + PortulToCGenerator
        const semanticAnalyzer = new SemanticAnalyzer();
        const codeGenerator = new PortulToCGenerator();
        
        // Parse y análisis
        const ast = semanticAnalyzer.parse(job.sourceCode);
        
        this.updateJob(jobId, {
            stage: 'semantic-analysis',
            progress: 25
        });
        
        // Verificar tipos
        const errors = semanticAnalyzer.checkTypes(ast);
        if (errors.length > 0) {
            throw new Error(`Semantic errors: ${errors[0].message}`);
        }
        
        this.updateJob(jobId, {
            stage: 'codegen',
            progress: 50
        });
        
        // Generar C
        const cCode = codeGenerator.generate(job.sourceCode, semanticAnalyzer);
        
        this.updateJob(jobId, {
            stage: 'compilation',
            progress: 75
        });
        
        // Compilar con GCC/LLVM
        const binary = await this.compiler.compileC({
            sourceCode: cCode,
            language: 'c',
            target: 'windows',
            outputFile: 'program.exe',
            optimizationLevel: '-O2'
        });
        
        // ... resto del código
        
    } catch (error) {
        // manejo de errores
    }
}
```

---

### Paso 3: Crear Pipeline Unificado

**Nuevo archivo: `services/portulCompilationPipeline.ts`**

```typescript
import { SemanticAnalyzer } from './semanticAnalyzer';
import { PortulToCGenerator } from './portulToC';
import { PortulToLLVMIRGenerator } from './portulToLLVMIR';
import { CompilerService } from '../backend/services/compilerService';

/**
 * Pipeline completo Portul → Ejecutable
 */
export class PortulCompilationPipeline {
    private semanticAnalyzer = new SemanticAnalyzer();
    private codeGenerator = new PortulToCGenerator();
    private llvmGenerator = new PortulToLLVMIRGenerator();
    private compiler = new CompilerService();

    /**
     * Compilar Portul a ejecutable
     */
    async compilePortul(
        sourceCode: string,
        target: 'windows' | 'linux' | 'macos' = 'windows',
        optimization: '-O0' | '-O1' | '-O2' | '-O3' = '-O2',
        onProgress?: (stage: string, progress: number) => void
    ): Promise<Buffer> {
        try {
            // Stage 1: Parse
            onProgress?.('parsing', 10);
            const ast = this.semanticAnalyzer.parse(sourceCode);

            // Stage 2: Semantic Analysis
            onProgress?.('semantic-analysis', 25);
            const errors = this.semanticAnalyzer.checkTypes(ast);
            if (errors.length > 0) {
                throw new Error(`${errors[0].message}`);
            }

            // Stage 3: Code Generation
            onProgress?.('codegen', 50);
            const cCode = this.codeGenerator.generate(sourceCode, this.semanticAnalyzer);

            // Stage 4: Compilation
            onProgress?.('compilation', 75);
            const binary = await this.compiler.compileC({
                sourceCode: cCode,
                language: 'c',
                target: this.mapTarget(target),
                outputFile: `program.${target === 'windows' ? 'exe' : ''}`,
                optimizationLevel: optimization
            });

            onProgress?.('complete', 100);
            return binary;

        } catch (error) {
            throw new Error(`Compilation failed: ${error.message}`);
        }
    }

    /**
     * Generar LLVM IR (para optimizaciones avanzadas)
     */
    async generateLLVMIR(sourceCode: string): Promise<string> {
        const ast = this.semanticAnalyzer.parse(sourceCode);
        this.semanticAnalyzer.checkTypes(ast);
        return this.llvmGenerator.generateIR(ast);
    }

    private mapTarget(target: 'windows' | 'linux' | 'macos'): string {
        const mapping = {
            'windows': 'x86_64-pc-windows-gnu',
            'linux': 'x86_64-unknown-linux-gnu',
            'macos': 'aarch64-apple-darwin'
        };
        return mapping[target];
    }
}
```

---

## 🎯 INTEGRACIÓN EN App.tsx

```typescript
import React from 'react';
import { CompilerPanel } from './components/CompilerPanel';
import { CodeEditor } from './components/CodeEditor';

export const App: React.FC = () => {
    const [portulCode, setPortulCode] = React.useState(`
fn hello(name: string) {
    print("Hello " + name)
}

fn main() {
    hello("World")
}
    `);

    return (
        <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
            <div style={{ flex: 1 }}>
                <h2>Portul Editor</h2>
                <CodeEditor 
                    code={portulCode}
                    onChange={setPortulCode}
                    language="portul"
                />
            </div>
            
            <div style={{ flex: 1 }}>
                <CompilerPanel 
                    code={portulCode}
                    backendUrl="http://localhost:3000"
                />
            </div>
        </div>
    );
};
```

---

## 🧪 TESTING LA INTEGRACIÓN

### Test 1: Verificar semantic analyzer existente

```bash
cd your-project
npm test -- services/semanticAnalyzer.test.ts
```

### Test 2: Probar generador C

```typescript
// test.ts
import { SemanticAnalyzer } from './services/semanticAnalyzer';
import { PortulToCGenerator } from './services/portulToC';

const code = `
fn add(a: int, b: int) -> int {
    return a + b
}

fn main() {
    let result: int = add(5, 3)
    print(result)
}
`;

const analyzer = new SemanticAnalyzer();
const generator = new PortulToCGenerator();

try {
    const ast = analyzer.parse(code);
    const errors = analyzer.checkTypes(ast);
    
    if (errors.length === 0) {
        const cCode = generator.generate(code, analyzer);
        console.log('Generated C:');
        console.log(cCode);
    } else {
        console.error('Errors:', errors);
    }
} catch (error) {
    console.error('Error:', error);
}
```

### Test 3: Full pipeline

```bash
# Backend corriendo
cd backend && npm run dev

# En otra terminal:
npm run test:integration
```

---

## 📊 ESTRUCTURA DE ARCHIVOS FINAL

```
portul-hypercompiler/
├─ services/
│  ├─ semanticAnalyzer.ts      ✅ (sin cambios)
│  ├─ advancedParser.ts        ✅ (sin cambios)
│  ├─ portulToC.ts             🆕 (CREAR)
│  ├─ portulToLLVMIR.ts        🆕 (CREAR)
│  └─ portulCompilationPipeline.ts  🆕 (CREAR)
│
├─ backend/
│  ├─ src/
│  │  ├─ server.ts             (backend-server.ts)
│  │  ├─ services/
│  │  │  ├─ compilerService.ts
│  │  │  └─ compilationQueue.ts
│  │  └─ routes/
│  │     └─ compilation.ts
│  └─ package.json
│
├─ components/
│  ├─ CompilerPanel.tsx        🆕 (CREAR/agregar)
│  ├─ CodeEditor.tsx           ✅ (existente)
│  └─ App.tsx                  (modificar)
│
├─ tests/
│  ├─ portulToC.test.ts        🆕 (CREAR)
│  └─ pipeline.integration.ts  🆕 (CREAR)
│
└─ documentation/
   ├─ COMPILADOR_REAL_PLAN.md
   ├─ CLOUD_DEPLOYMENT_OPTIONS.md
   ├─ QUICK_START_COMPILER.md
   └─ INDICE_MAESTRO_COMPILADOR.md
```

---

## ✅ CHECKLIST INTEGRACIÓN

- [ ] Crear `services/portulToC.ts` (copiar código arriba)
- [ ] Crear `services/portulCompilationPipeline.ts`
- [ ] Copiar `backend-server.ts` a `backend/src/server.ts`
- [ ] Copiar `CompilerPanel.tsx` a `components/`
- [ ] Modificar `App.tsx` para usar nuevo CompilerPanel
- [ ] Instalar dependencias: `npm install express socket.io cors`
- [ ] Probar backend: `cd backend && npm run dev`
- [ ] Probar compilación: `npm test`
- [ ] Deploy local: Docker compose
- [ ] Deploy production: Cloud opción elegida

---

## 🚀 PRÓXIMOS PASOS

1. **Copiar archivos**: Usar código de arriba para crear portulToC.ts
2. **Integrar**: Modificar backend-server.ts con nueva lógica
3. **Probar**: Test simple con función add()
4. **Escalar**: Agregar más tipos y características Portul
5. **Optimizar**: Caching, LLVM IR, multi-worker

---

**Crédito:** Documentación de Integración - Compilador Real Portul v1.0
