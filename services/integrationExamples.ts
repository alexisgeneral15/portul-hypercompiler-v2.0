// INTEGRATION GUIDE - Cómo usar todos los servicios profesionales
// Este archivo muestra ejemplos prácticos de integración

import { getLanguageServer, CompletionItem } from './languageServer';
import { getSemanticAnalyzer, SemanticDiagnostic } from './semanticAnalyzer';
import { getLocalAIEngine, CodeSuggestion } from './localAiEngine';
import { getRefactoringEngine, RefactoringAction } from './refactoringEngine';
import { parsePortulCode, ParseError } from './advancedParser';
import { getCodeGenerator, OptimizationResult } from './codeGenerator';

/**
 * EJEMPLO 1: Pipeline completo de compilación con todos los servicios
 */
export async function fullCompilationPipeline(sourceCode: string) {
    console.log('🚀 Iniciando pipeline de compilación profesional...\n');

    // ============ FASE 1: PARSING ============
    console.log('📝 FASE 1: Advanced Parsing');
    const { ast, errors: parseErrors } = parsePortulCode(sourceCode);
    
    if (parseErrors.length > 0) {
        console.log('⚠️  Errores de parsing encontrados:');
        parseErrors.forEach(err => {
            console.log(`   Línea ${err.line}: ${err.message}`);
            if (err.expected) {
                console.log(`   Esperado: ${err.expected.join(', ')}`);
            }
        });
    } else {
        console.log('✅ Parsing completado sin errores');
    }
    console.log(`   AST Nodes: ${ast.body.length}`);
    console.log(`   Comments: ${ast.comments.length}\n`);

    // ============ FASE 2: SEMANTIC ANALYSIS ============
    console.log('🔍 FASE 2: Semantic Analysis');
    const analyzer = getSemanticAnalyzer();
    const diagnostics = analyzer.analyze(sourceCode);
    
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    const hints = diagnostics.filter(d => d.severity === 'hint' || d.severity === 'info');
    
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Hints: ${hints.length}`);
    
    if (diagnostics.length > 0) {
        console.log('\n   Diagnósticos detallados:');
        diagnostics.slice(0, 5).forEach(d => {
            const icon = d.severity === 'error' ? '❌' : 
                        d.severity === 'warning' ? '⚠️' : '💡';
            console.log(`   ${icon} [${d.code}] Línea ${d.line}: ${d.message}`);
            if (d.fix) {
                console.log(`      🔧 Quick Fix: ${d.fix.title}`);
            }
        });
    }
    console.log();

    // ============ FASE 3: AI ANALYSIS ============
    console.log('🧠 FASE 3: AI-Powered Analysis');
    const aiEngine = getLocalAIEngine();
    const aiResponse = await aiEngine.processQuery(
        'analiza este código',
        sourceCode,
        { cursorLine: 0 }
    );
    
    console.log(`   Intent: ${aiResponse.intent.intent}`);
    console.log(`   Confidence: ${(aiResponse.intent.confidence * 100).toFixed(0)}%`);
    console.log(`   Suggestions: ${aiResponse.suggestions.length}`);
    
    if (aiResponse.suggestions.length > 0) {
        console.log('\n   Top AI Suggestions:');
        aiResponse.suggestions.slice(0, 3).forEach((sugg, idx) => {
            console.log(`   ${idx + 1}. [${sugg.type}] ${sugg.title}`);
            console.log(`      ${sugg.description}`);
            console.log(`      Confidence: ${(sugg.confidence * 100).toFixed(0)}%`);
        });
    }
    console.log();

    // ============ FASE 4: REFACTORING OPPORTUNITIES ============
    console.log('🔄 FASE 4: Refactoring Opportunities');
    const refactoring = getRefactoringEngine();
    const unusedCode = refactoring.findUnusedCode(sourceCode);
    const optimizations = refactoring.findOptimizations(sourceCode);
    
    console.log(`   Unused code items: ${unusedCode.length}`);
    console.log(`   Optimization opportunities: ${optimizations.length}`);
    
    if (optimizations.length > 0) {
        console.log('\n   Optimizaciones disponibles:');
        optimizations.forEach((opt, idx) => {
            console.log(`   ${idx + 1}. ${opt.title}`);
            console.log(`      ${opt.description}`);
        });
    }
    console.log();

    // ============ FASE 5: CODE GENERATION & OPTIMIZATION ============
    console.log('⚡ FASE 5: Code Generation & Optimization');
    const codeGen = getCodeGenerator();
    const result = codeGen.compile(ast, true); // true = enable optimizations
    
    console.log('   Optimization Stats:');
    console.log(`   - Instructions Eliminated: ${result.stats.instructionsEliminated}`);
    console.log(`   - Loops Optimized: ${result.stats.loopsOptimized}`);
    console.log(`   - Code Size: ${result.stats.codeSize} bytes`);
    console.log();

    console.log('📊 RESULTADOS FINALES:');
    console.log('   ✅ Pipeline completado exitosamente');
    console.log(`   📄 Líneas procesadas: ${sourceCode.split('\n').length}`);
    console.log(`   🎯 Calidad del código: ${getCodeQuality(diagnostics)}`);
    console.log(`   ⚡ Nivel de optimización: ${getOptimizationLevel(result.stats)}`);
    
    return {
        ast,
        parseErrors,
        diagnostics,
        aiResponse,
        refactoringOps: { unusedCode, optimizations },
        compilationResult: result
    };
}

/**
 * EJEMPLO 2: IntelliSense en acción
 */
export function demonstrateIntelliSense(code: string, line: number, character: number) {
    console.log('💡 IntelliSense Demo\n');
    
    const languageServer = getLanguageServer();
    
    // 1. Code Completion
    console.log('1️⃣ Code Completion:');
    const completions = languageServer.provideCompletionItems(code, { line, character });
    console.log(`   Sugerencias disponibles: ${completions.length}`);
    completions.slice(0, 5).forEach(comp => {
        console.log(`   - ${comp.label} (${comp.kind})`);
        if (comp.detail) console.log(`     ${comp.detail}`);
    });
    console.log();

    // 2. Hover Information
    console.log('2️⃣ Hover Information:');
    const hover = languageServer.provideHover(code, { line, character });
    if (hover) {
        console.log(`   ${hover.contents}`);
    } else {
        console.log('   No hover info available');
    }
    console.log();

    // 3. Signature Help
    console.log('3️⃣ Signature Help:');
    const sigHelp = languageServer.provideSignatureHelp(code, { line, character });
    if (sigHelp) {
        const sig = sigHelp.signatures[sigHelp.activeSignature];
        console.log(`   ${sig.label}`);
        if (sig.documentation) {
            console.log(`   ${sig.documentation}`);
        }
    } else {
        console.log('   No signature help available');
    }
    console.log();

    // 4. Semantic Tokens
    console.log('4️⃣ Semantic Tokens:');
    const tokens = languageServer.provideSemanticTokens(code);
    console.log(`   Total tokens: ${tokens.length}`);
    
    // Group by type
    const byType = tokens.reduce((acc, token) => {
        acc[token.tokenType] = (acc[token.tokenType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    Object.entries(byType).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
    });
}

/**
 * EJEMPLO 3: AI-Powered Code Understanding
 */
export async function demonstrateAI() {
    console.log('🧠 AI Engine Demo\n');
    
    const aiEngine = getLocalAIEngine();
    
    // Test various natural language intents
    const intents = [
        'crea un loop que cuente hasta 10',
        'necesito una clase para guardar datos',
        'haz un acumulador que sume números',
        'quiero una función que imprima un mensaje'
    ];
    
    for (const intent of intents) {
        console.log(`📝 Intent: "${intent}"`);
        const aiEngine = getLocalAIEngine();
        const understanding = aiEngine['codeUnderstanding'].understandIntent(intent);
        
        console.log(`   ✅ Detected: ${understanding.intent}`);
        console.log(`   📊 Confidence: ${(understanding.confidence * 100).toFixed(0)}%`);
        console.log(`   💻 Suggested Code:`);
        console.log(understanding.suggestedCode.split('\n').map(l => `      ${l}`).join('\n'));
        console.log();
    }
}

/**
 * EJEMPLO 4: Refactoring Workflow
 */
export function demonstrateRefactoring() {
    console.log('🔄 Refactoring Demo\n');
    
    const code = `
num x = 10
add x 1
add x 1
mul x 8

num unused = 5

num y = 20
add y 1
`;

    const refactoring = getRefactoringEngine();
    
    // 1. Find optimizations
    console.log('1️⃣ Performance Optimizations:');
    const opts = refactoring.findOptimizations(code);
    opts.forEach((opt, idx) => {
        console.log(`   ${idx + 1}. ${opt.title}`);
        console.log(`      Before: ${opt.description}`);
        console.log(`      After:  ${opt.newCode.trim()}`);
    });
    console.log();

    // 2. Find unused code
    console.log('2️⃣ Unused Code:');
    const unused = refactoring.findUnusedCode(code);
    unused.forEach(item => {
        console.log(`   - ${item.type} '${item.name}' at line ${item.range.startLine + 1}`);
    });
    console.log();

    // 3. Apply optimizations
    console.log('3️⃣ Applying Optimizations:');
    let optimizedCode = code;
    opts.forEach(opt => {
        const result = refactoring.applyOptimization(optimizedCode, opt.range, opt.newCode);
        if (result.success) {
            optimizedCode = result.code;
            console.log(`   ✅ ${result.message}`);
        }
    });
    
    console.log('\n   Optimized Code:');
    console.log(optimizedCode.split('\n').map(l => `   ${l}`).join('\n'));
}

/**
 * EJEMPLO 5: Error Recovery en Parsing
 */
export function demonstrateErrorRecovery() {
    console.log('🔧 Error Recovery Demo\n');
    
    // Código con errores intencionales
    const badCode = `
class MyClass {
    public method
        num x = 10
        add x
    }
    
    num y = 
}

for i 0 10
    put i
`;

    const { ast, errors } = parsePortulCode(badCode);
    
    console.log('Código con errores:');
    console.log(badCode);
    console.log();
    
    console.log(`Errores encontrados: ${errors.length}`);
    errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Línea ${err.line}, Col ${err.column}`);
        console.log(`   Mensaje: ${err.message}`);
        console.log(`   Severidad: ${err.severity}`);
        if (err.expected) {
            console.log(`   Esperado: ${err.expected.join(', ')}`);
        }
        if (err.got) {
            console.log(`   Encontrado: ${err.got}`);
        }
        console.log(`   Recuperable: ${err.recoverable ? '✅' : '❌'}`);
    });
    
    console.log(`\n✅ AST parcial generado con ${ast.body.length} nodos`);
    console.log('   (El parser se recuperó y continuó)');
}

/**
 * EJEMPLO 6: Compilación completa con stats
 */
export function compileWithDetailedStats(code: string) {
    console.log('📊 Compilation with Detailed Stats\n');
    
    const startTime = performance.now();
    
    // Parse
    const parseStart = performance.now();
    const { ast, errors: parseErrors } = parsePortulCode(code);
    const parseTime = performance.now() - parseStart;
    
    // Analyze
    const analyzeStart = performance.now();
    const analyzer = getSemanticAnalyzer();
    const diagnostics = analyzer.analyze(code);
    const analyzeTime = performance.now() - analyzeStart;
    
    // Generate & Optimize
    const genStart = performance.now();
    const codeGen = getCodeGenerator();
    const result = codeGen.compile(ast, true);
    const genTime = performance.now() - genStart;
    
    const totalTime = performance.now() - startTime;
    
    console.log('⏱️  Performance Metrics:');
    console.log(`   Parsing:          ${parseTime.toFixed(2)}ms`);
    console.log(`   Semantic Analysis: ${analyzeTime.toFixed(2)}ms`);
    console.log(`   Code Generation:   ${genTime.toFixed(2)}ms`);
    console.log(`   Total Time:        ${totalTime.toFixed(2)}ms`);
    console.log();
    
    console.log('📈 Compilation Stats:');
    console.log(`   Lines of Code:     ${code.split('\n').length}`);
    console.log(`   AST Nodes:         ${ast.body.length}`);
    console.log(`   Parse Errors:      ${parseErrors.length}`);
    console.log(`   Diagnostics:       ${diagnostics.length}`);
    console.log(`   - Errors:          ${diagnostics.filter(d => d.severity === 'error').length}`);
    console.log(`   - Warnings:        ${diagnostics.filter(d => d.severity === 'warning').length}`);
    console.log(`   Instructions Elim: ${result.stats.instructionsEliminated}`);
    console.log(`   Code Size:         ${result.stats.codeSize} bytes`);
    console.log();
    
    const linesPerSec = (code.split('\n').length / (totalTime / 1000)).toFixed(0);
    console.log(`🚀 Throughput: ${linesPerSec} lines/sec`);
    
    return { parseTime, analyzeTime, genTime, totalTime, result };
}

// ==================== UTILITY FUNCTIONS ====================

function getCodeQuality(diagnostics: SemanticDiagnostic[]): string {
    const errors = diagnostics.filter(d => d.severity === 'error').length;
    const warnings = diagnostics.filter(d => d.severity === 'warning').length;
    
    if (errors > 0) return '❌ Errores críticos';
    if (warnings > 3) return '⚠️  Necesita mejoras';
    if (warnings > 0) return '✅ Buena (con advertencias)';
    return '🌟 Excelente';
}

function getOptimizationLevel(stats: any): string {
    const eliminated = stats.instructionsEliminated;
    if (eliminated === 0) return '❌ Sin optimizaciones';
    if (eliminated < 5) return '⚠️  Bajo';
    if (eliminated < 10) return '✅ Medio';
    return '🚀 Alto';
}

// ==================== EXAMPLES ====================

export const EXAMPLE_CODE = {
    simple: `
# Simple counter program
num count = 0

for i 0 10 {
    inc count
    put count
}
`,
    
    withClass: `
class Counter {
    private num value;
    
    new Counter num initial {
        mov this.value initial;
    }
    
    public increment {
        inc this.value;
    }
    
    public getValue num {
        ret this.value;
    }
}

num counter = Counter.new 0
counter.increment
put counter.getValue
`,
    
    withErrors: `
num x
add x 1

num y = 10
add y z  # z no está definido

for i 0 5 {
    put "loop"
}

# Variable no usada
num unused = 99
`,
    
    withOptimizations: `
num x = 10
add x 1  # Debería ser inc x
add x 1  # Debería ser inc x
mul x 8  # Debería ser shl x 3

num y = 5
add y 2
add y 2  # Operaciones repetidas
`
};

// ==================== EXPORT FUNCTIONS ====================

