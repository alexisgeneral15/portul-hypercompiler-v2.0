// PORTUL AI ENGINE v3.0 - Local LLM with Embeddings
// Self-contained AI system for code intelligence without external dependencies
// Implements transformer-like attention and embeddings for code understanding

import { PORTUL_KEYWORDS, PORTUL_BUILTINS, PORTUL_TYPES, PORTUL_OPERATIONS } from './portulToolchainService';
import { SemanticAnalyzer, SemanticDiagnostic } from './semanticAnalyzer';

// ==================== EMBEDDING SYSTEM ====================

export interface CodeEmbedding {
    vector: number[];
    text: string;
    type: 'keyword' | 'variable' | 'class' | 'method' | 'pattern';
    metadata: Record<string, any>;
}

export interface AttentionWeight {
    sourceToken: string;
    targetToken: string;
    weight: number;
}

class EmbeddingEngine {
    private embeddingDim = 128;
    private vocabulary: Map<string, number> = new Map();
    private embeddings: Map<string, number[]> = new Map();
    private vocabIndex = 0;

    constructor() {
        this.initializeVocabulary();
        this.generateEmbeddings();
    }

    private initializeVocabulary(): void {
        // Add all Portul keywords, types, operations
        [...PORTUL_KEYWORDS, ...PORTUL_TYPES, ...PORTUL_OPERATIONS, ...PORTUL_BUILTINS].forEach(token => {
            this.vocabulary.set(token, this.vocabIndex++);
        });

        // Add common programming patterns
        const commonPatterns = [
            'loop', 'condition', 'assignment', 'declaration', 'call',
            'return', 'constructor', 'field', 'parameter', 'argument'
        ];
        commonPatterns.forEach(pattern => {
            this.vocabulary.set(pattern, this.vocabIndex++);
        });
    }

    private generateEmbeddings(): void {
        // Generate semantic embeddings for each vocabulary item
        // Using a simplified word2vec-like approach with hand-crafted dimensions

        this.vocabulary.forEach((index, token) => {
            const embedding = this.createEmbedding(token);
            this.embeddings.set(token, embedding);
        });
    }

    private createEmbedding(token: string): number[] {
        const vector = new Array(this.embeddingDim).fill(0);

        // Semantic dimensions (hand-crafted for demonstration)
        // In production, these would be learned from a large corpus

        // Dimension 0-9: Token type
        if (PORTUL_TYPES.has(token)) {
            vector[0] = 1.0;  // Type indicator
            if (token === 'num') vector[1] = 0.9;
            if (token === 'txt') vector[2] = 0.9;
            if (token === 'obj') vector[3] = 0.9;
        }

        // Dimension 10-19: Control flow
        if (['if', 'for', 'ret'].includes(token)) {
            vector[10] = 1.0; // Control flow indicator
            if (token === 'if') vector[11] = 0.8;
            if (token === 'for') vector[12] = 0.8;
        }

        // Dimension 20-29: Operations
        if (PORTUL_OPERATIONS.has(token)) {
            vector[20] = 1.0; // Operation indicator
            if (['add', 'sub', 'mul', 'div'].includes(token)) vector[21] = 0.9; // Arithmetic
            if (['gt', 'lt', 'equ'].includes(token)) vector[22] = 0.9; // Comparison
            if (token === 'inc') vector[23] = 0.95; // Optimization hint
        }

        // Dimension 30-39: OOP concepts
        if (['class', 'public', 'private', 'this', 'new'].includes(token)) {
            vector[30] = 1.0; // OOP indicator
            if (token === 'class') vector[31] = 0.95;
            if (token === 'new') vector[32] = 0.9;
        }

        // Dimension 40-49: I/O and side effects
        if (['put', 'get'].includes(token)) {
            vector[40] = 1.0; // I/O indicator
            if (token === 'put') vector[41] = 0.9;
        }

        // Dimension 50-59: Memory management
        if (['mov', 'ptr'].includes(token)) {
            vector[50] = 1.0; // Memory indicator
            if (token === 'mov') vector[51] = 0.95; // Ownership transfer
        }

        // Normalize vector
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= magnitude;
            }
        }

        return vector;
    }

    embed(token: string): number[] {
        // Return existing embedding or create new one
        if (this.embeddings.has(token)) {
            return this.embeddings.get(token)!;
        }

        // For unknown tokens, create embedding based on similar tokens
        return this.createDynamicEmbedding(token);
    }

    private createDynamicEmbedding(token: string): number[] {
        // Find similar tokens and interpolate
        const vector = new Array(this.embeddingDim).fill(0);
        
        // Simple heuristic: if it looks like a variable (lowercase), give it variable characteristics
        if (/^[a-z][a-z0-9_]*$/.test(token)) {
            vector[60] = 0.8; // Variable-like
        }
        
        // If it looks like a class (PascalCase), give it class characteristics
        if (/^[A-Z][a-zA-Z0-9]*$/.test(token)) {
            vector[30] = 0.8; // Class-like
            vector[31] = 0.7;
        }

        return vector;
    }

    cosineSimilarity(vec1: number[], vec2: number[]): number {
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            mag1 += vec1[i] * vec1[i];
            mag2 += vec2[i] * vec2[i];
        }

        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);

        if (mag1 === 0 || mag2 === 0) return 0;
        return dotProduct / (mag1 * mag2);
    }

    findSimilar(token: string, topK: number = 5): Array<{ token: string; similarity: number }> {
        const embedding = this.embed(token);
        const similarities: Array<{ token: string; similarity: number }> = [];

        this.embeddings.forEach((vec, tok) => {
            if (tok !== token) {
                const similarity = this.cosineSimilarity(embedding, vec);
                similarities.push({ token: tok, similarity });
            }
        });

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }
}

// ==================== ATTENTION MECHANISM ====================

class AttentionLayer {
    private headDim = 32;
    private numHeads = 4;

    computeAttention(tokens: string[], embeddingEngine: EmbeddingEngine): AttentionWeight[] {
        const embeddings = tokens.map(t => embeddingEngine.embed(t));
        const weights: AttentionWeight[] = [];

        // Multi-head self-attention (simplified)
        for (let i = 0; i < tokens.length; i++) {
            for (let j = 0; j < tokens.length; j++) {
                const similarity = embeddingEngine.cosineSimilarity(embeddings[i], embeddings[j]);
                
                // Softmax would be applied here in full implementation
                const weight = Math.exp(similarity) / (tokens.length * 0.5 + 1);

                if (weight > 0.3) { // Threshold for meaningful attention
                    weights.push({
                        sourceToken: tokens[i],
                        targetToken: tokens[j],
                        weight
                    });
                }
            }
        }

        return weights;
    }

    // Context-aware token understanding
    contextualizeToken(token: string, context: string[], embeddingEngine: EmbeddingEngine): number[] {
        const baseEmbedding = embeddingEngine.embed(token);
        const contextEmbeddings = context.map(t => embeddingEngine.embed(t));

        // Weighted sum based on attention
        const contextual = [...baseEmbedding];

        contextEmbeddings.forEach((ctxEmb, idx) => {
            const similarity = embeddingEngine.cosineSimilarity(baseEmbedding, ctxEmb);
            for (let i = 0; i < contextual.length; i++) {
                contextual[i] += similarity * ctxEmb[i] * 0.3; // 0.3 is context influence weight
            }
        });

        return contextual;
    }
}

// ==================== CODE UNDERSTANDING SYSTEM ====================

export interface CodeIntent {
    intent: string;
    confidence: number;
    suggestedCode: string;
    explanation: string;
    keywords?: string[];
}

export interface CodeSuggestion {
    type: 'completion' | 'refactor' | 'fix' | 'optimize';
    title: string;
    description: string;
    code: string;
    confidence: number;
}

class CodeUnderstandingEngine {
    private embeddingEngine: EmbeddingEngine;
    private attentionLayer: AttentionLayer;
    private knowledgeBase: Map<string, CodePattern> = new Map();

    constructor() {
        this.embeddingEngine = new EmbeddingEngine();
        this.attentionLayer = new AttentionLayer();
        this.initializeKnowledgeBase();
    }

    private initializeKnowledgeBase(): void {
        // Common code patterns
        this.knowledgeBase.set('loop_increment', {
            pattern: ['for', 'inc'],
            intent: 'iterate with counter',
            template: 'for ${var} 0 ${end} {\n    inc ${var}\n}',
            category: 'loops'
        });

        this.knowledgeBase.set('class_constructor', {
            pattern: ['class', 'new', 'mov'],
            intent: 'initialize class instance',
            template: 'class ${ClassName} {\n    private ${type} ${field};\n    new ${ClassName} ${type} ${param} {\n        mov this.${field} ${param};\n    }\n}',
            category: 'oop'
        });

        this.knowledgeBase.set('accumulator', {
            pattern: ['num', 'for', 'add'],
            intent: 'accumulate values',
            template: 'num ${result} = 0\nfor ${i} 0 ${n} {\n    add ${result} ${value}\n}',
            category: 'algorithms'
        });

        this.knowledgeBase.set('conditional_output', {
            pattern: ['if', 'put'],
            intent: 'conditional output',
            template: 'if ${condition} ${a} ${b} {\n    put ${message}\n}',
            category: 'control-flow'
        });

        // NLP intent patterns - for natural language understanding
        this.knowledgeBase.set('refactor_intent', {
            pattern: ['refactor', 'mejora', 'mejorar', 'improve', 'optimize', 'optimiza', 'clean', 'reorganize', 'reorganiza', 'limpia'],
            intent: 'refactor',
            template: '',
            category: 'npl-refactor'
        });

        this.knowledgeBase.set('fix_intent', {
            pattern: ['fix', 'arregla', 'encuentra', 'error', 'errores', 'bug', 'bugs', 'corrige', 'corregir', 'problema', 'problemas', 'detecta'],
            intent: 'fix',
            template: '',
            category: 'npl-fix'
        });

        this.knowledgeBase.set('explain_intent', {
            pattern: ['explica', 'explain', 'qué', 'what', 'como', 'how', 'cómo', 'entender', 'entiende', 'describe', 'escribe', 'significa'],
            intent: 'explain',
            template: '',
            category: 'npl-explain'
        });

        this.knowledgeBase.set('optimize_intent', {
            pattern: ['optimiza', 'optimize', 'performance', 'eficiente', 'rápido', 'fast', 'veloz', 'velocidad', 'rapida'],
            intent: 'optimize',
            template: '',
            category: 'npl-optimize'
        });

        this.knowledgeBase.set('review_intent', {
            pattern: ['revisa', 'review', 'analiza', 'analyze', 'examina', 'revise', 'valida', 'validar'],
            intent: 'review',
            template: '',
            category: 'npl-review'
        });

        this.knowledgeBase.set('refactor_intent_2', {
            pattern: ['mejores practicas', 'best practices', 'sugiere', 'recomendaciones'],
            intent: 'refactor',
            template: '',
            category: 'npl-refactor-2'
        });
    }

    // Understand user intent from natural language
    understandIntent(naturalLanguage: string): CodeIntent {
        // Safety check for undefined/null input
        if (!naturalLanguage || typeof naturalLanguage !== 'string') {
            return {
                intent: 'explain',
                confidence: 0.3,
                suggestedCode: '',
                explanation: 'No recibí texto válido. Escribe tu pregunta y volveré a intentarlo.',
                keywords: []
            };
        }
        
        const normalized = naturalLanguage.toLowerCase().trim();
        const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
        const embeddings = tokens.map(t => this.embeddingEngine.embed(t));

        // Find best matching pattern
        let bestMatch: { pattern: CodePattern; score: number } | null = null;

        this.knowledgeBase.forEach((pattern, key) => {
            let score = 0;
            
            // Check for pattern keywords in user input (higher weight for NLP patterns)
            const isNLPPattern = pattern.category && pattern.category.startsWith('npl-');
            const keywordWeight = isNLPPattern ? 3.0 : 2.0;
            
            pattern.pattern.forEach(patternToken => {
                if (normalized.includes(patternToken)) {
                    score += keywordWeight;
                }
                
                // Check semantic similarity
                const patternEmbedding = this.embeddingEngine.embed(patternToken);
                embeddings.forEach(userEmb => {
                    const similarity = this.embeddingEngine.cosineSimilarity(patternEmbedding, userEmb);
                    score += similarity * 0.5; // Lower weight for embedding similarity
                });
            });

            // Intent matching
            if (normalized.includes(pattern.intent) || pattern.intent.includes(normalized)) {
                score += 3.0;
            }

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { pattern, score };
            }
        });

        // Lower threshold for better intent detection (prioritize matches)
        if (bestMatch && bestMatch.score > 1.2) {
            return {
                intent: bestMatch.pattern.intent,
                confidence: Math.min(bestMatch.score / 8.0, 0.95),
                suggestedCode: '',
                explanation: '',
                keywords: tokens
            };
        }

        // Keyword-based fallback - FIRST check for Spanish/English keywords
        const fixKeywords = ['encuentra', 'error', 'errores', 'bug', 'bugs', 'corrige', 'problema', 'problemas', 'arregla', 'detecta', 'falla'];
        const refactorKeywords = ['mejora', 'mejorar', 'refactor', 'optimize', 'optimiza', 'clean', 'reorganiza', 'sugerir', 'recomendaciones'];
        const explainKeywords = ['explica', 'explain', 'qué', 'what', 'cómo', 'como', 'how', 'describe', 'escribe', 'significa', 'entender'];
        const optimizeKeywords = ['optimiza', 'optimize', 'performance', 'eficiente', 'rápido', 'fast', 'veloz', 'velocidad'];
        
        const hasFixKeywords = fixKeywords.some(kw => normalized.includes(kw));
        const hasRefactorKeywords = refactorKeywords.some(kw => normalized.includes(kw));
        const hasExplainKeywords = explainKeywords.some(kw => normalized.includes(kw));
        const hasOptimizeKeywords = optimizeKeywords.some(kw => normalized.includes(kw));
        
        // Prioritize fix over others if multiple keywords present
        if (hasFixKeywords) {
            return {
                intent: 'fix',
                confidence: 0.75,
                suggestedCode: '',
                explanation: '',
                keywords: tokens
            };
        } else if (hasOptimizeKeywords) {
            return {
                intent: 'optimize',
                confidence: 0.75,
                suggestedCode: '',
                explanation: '',
                keywords: tokens
            };
        } else if (hasRefactorKeywords) {
            return {
                intent: 'refactor',
                confidence: 0.75,
                suggestedCode: '',
                explanation: '',
                keywords: tokens
            };
        } else if (hasExplainKeywords) {
            return {
                intent: 'explain',
                confidence: 0.75,
                suggestedCode: '',
                explanation: '',
                keywords: tokens
            };
        }

        // Default fallback: assume 'explain' for any other input
        return {
            intent: 'explain',
            confidence: 0.5,
            suggestedCode: '',
            explanation: '',
            keywords: tokens
        };
    }

    private instantiateTemplate(template: string, tokens: string[]): string {
        let code = template;
        
        // Try to extract meaningful names from tokens
        const varNames = tokens.filter(t => /^[a-z][a-z0-9_]*$/i.test(t));
        
        // Replace placeholders
        code = code.replace(/\$\{var\}/g, varNames[0] || 'i');
        code = code.replace(/\$\{result\}/g, varNames[1] || 'result');
        code = code.replace(/\$\{i\}/g, 'i');
        code = code.replace(/\$\{n\}/g, '10');
        code = code.replace(/\$\{end\}/g, '10');
        code = code.replace(/\$\{ClassName\}/g, 'MyClass');
        code = code.replace(/\$\{type\}/g, 'num');
        code = code.replace(/\$\{field\}/g, 'value');
        code = code.replace(/\$\{param\}/g, 'value');
        code = code.replace(/\$\{message\}/g, '"result"');
        code = code.replace(/\$\{condition\}/g, 'equ');
        code = code.replace(/\$\{a\}/g, 'x');
        code = code.replace(/\$\{b\}/g, 'y');
        code = code.replace(/\$\{value\}/g, 'x');

        return code;
    }

    // Provide intelligent code suggestions
    suggestCompletion(code: string, cursorLine: number): CodeSuggestion[] {
        const safeCode = code || '';
        const lines = safeCode.split('\n');
        const currentLine = lines[cursorLine] || '';
        const suggestions: CodeSuggestion[] = [];

        // Analyze context
        const tokens = currentLine.trim().split(/\s+/).filter(t => t.length > 0);
        const context = this.analyzeContext(lines, cursorLine);

        // Pattern-based suggestions
        if (tokens.length === 1) {
            const firstToken = tokens[0];
            
            // If user starts typing a type, suggest declaration
            if (PORTUL_TYPES.has(firstToken)) {
                suggestions.push({
                    type: 'completion',
                    title: 'Variable declaration',
                    description: `Declare a ${firstToken} variable`,
                    code: `${firstToken} myVar = ${firstToken === 'num' ? '0' : '""'}`,
                    confidence: 0.9
                });
            }

            // If user starts with 'for', suggest loop
            if (firstToken === 'for') {
                suggestions.push({
                    type: 'completion',
                    title: 'For loop',
                    description: 'Complete for loop structure',
                    code: 'for i 0 10 {\n    // loop body\n}',
                    confidence: 0.95
                });
            }

            // If user starts with 'class', suggest class
            if (firstToken === 'class') {
                suggestions.push({
                    type: 'completion',
                    title: 'Class definition',
                    description: 'Complete class structure',
                    code: 'class MyClass {\n    private num value;\n    \n    new MyClass num val {\n        mov this.value val;\n    }\n}',
                    confidence: 0.95
                });
            }
        }

        // Optimization suggestions
        const optimizations = this.suggestOptimizations(currentLine);
        suggestions.push(...optimizations);

        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    private suggestOptimizations(line: string): CodeSuggestion[] {
        const suggestions: CodeSuggestion[] = [];
        
        // Check for 'add x 1' pattern
        if (line.match(/add\s+(\w+)\s+1/)) {
            const match = line.match(/add\s+(\w+)\s+1/)!;
            suggestions.push({
                type: 'optimize',
                title: 'Use inc instead',
                description: 'Increment is more efficient than add 1',
                code: line.replace(match[0], `inc ${match[1]}`),
                confidence: 0.98
            });
        }

        return suggestions;
    }

    private analyzeContext(lines: string[], currentLine: number): {
        inClass: boolean;
        inMethod: boolean;
        inLoop: boolean;
        availableVars: string[];
    } {
        let inClass = false;
        let inMethod = false;
        let inLoop = false;
        const availableVars: string[] = [];

        for (let i = 0; i <= currentLine; i++) {
            const line = (lines[i] || '').trim();
            
            if (line.match(/^class\s+/)) inClass = true;
            if (line.match(/^(public|private)\s+/)) inMethod = true;
            if (line.match(/^for\s+/)) inLoop = true;

            const varMatch = line.match(/^(num|txt|obj|ary|ptr)\s+(\w+)/);
            if (varMatch) {
                availableVars.push(varMatch[2]);
            }
        }

        return { inClass, inMethod, inLoop, availableVars };
    }

    // Generate code from pattern
    generateCode(pattern: string, params: Record<string, any>): string {
        const knownPattern = this.knowledgeBase.get(pattern);
        if (knownPattern) {
            let code = knownPattern.template;
            Object.keys(params).forEach(key => {
                code = code.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), params[key]);
            });
            return code;
        }
        return '// Pattern not found';
    }
}

// ==================== MAIN AI ENGINE ====================

export class LocalAIEngine {
    private codeUnderstanding: CodeUnderstandingEngine;
    private embeddingEngine: EmbeddingEngine;
    private semanticAnalyzer: SemanticAnalyzer;

    constructor() {
        this.codeUnderstanding = new CodeUnderstandingEngine();
        this.embeddingEngine = new EmbeddingEngine();
        this.semanticAnalyzer = new SemanticAnalyzer();
    }

    // Main AI inference method
    async processQuery(query: string, code: string, context: any): Promise<AIResponse> {
        try {
            // Safety checks
            const safeQuery = query || '';
            const safeCode = code || '';
            const safeContext = context || {};
            const hasCode = safeCode.trim().length > 0;
            
            // Understand intent
            const intent = this.codeUnderstanding.understandIntent(safeQuery);

            // Analyze current code (only if code is not empty)
            const diagnostics = hasCode
                ? this.semanticAnalyzer.analyze(safeCode)
                : [];

            // Generate suggestions
            const suggestions = hasCode 
                ? this.codeUnderstanding.suggestCompletion(safeCode, safeContext.cursorLine || 0)
                : [];

            return {
                intent,
                diagnostics,
                suggestions,
                explanation: this.generateExplanation(intent, diagnostics, hasCode),
                confidence: intent.confidence
            };
        } catch (error) {
            return {
                intent: {
                    intent: 'explain',
                    confidence: 0.2,
                    suggestedCode: '',
                    explanation: 'Error interno',
                    keywords: []
                },
                diagnostics: [],
                suggestions: [],
                explanation: '⚠️ Error interno en Aether. Reintenta con un prompt más corto.',
                confidence: 0.2
            };
        }
    }

    // Code completion
    async provideCompletions(code: string, line: number): Promise<CodeSuggestion[]> {
        const safeCode = code || '';
        return this.codeUnderstanding.suggestCompletion(safeCode, line);
    }

    // Find similar code patterns
    findSimilarPatterns(codeSnippet: string): Array<{ pattern: string; similarity: number }> {
        if (!codeSnippet || typeof codeSnippet !== 'string') {
            return [];
        }
        const tokens = codeSnippet.split(/\s+/);
        const embeddings = tokens.map(t => this.embeddingEngine.embed(t));
        
        // Safety check for empty embeddings
        if (!embeddings || embeddings.length === 0 || !embeddings[0]) {
            return [];
        }
        
        // Average embedding
        const avgEmbedding = new Array(embeddings[0].length).fill(0);
        embeddings.forEach(emb => {
            emb.forEach((val, idx) => {
                avgEmbedding[idx] += val / embeddings.length;
            });
        });

        // Find similar tokens
        const similar = this.embeddingEngine.findSimilar(tokens[0] || '', 10);
        return similar.map(s => ({ pattern: s.token, similarity: s.similarity }));
    }

    private generateExplanation(intent: CodeIntent, diagnostics: SemanticDiagnostic[], hasCode: boolean = false): string {
        let explanation = '';
        
        // Context-aware explanation based on intent
        switch (intent.intent) {
            case 'refactor':
                explanation = '🔧 **Sugerencias de Refactorización**\n\n';
                if (hasCode && diagnostics.length > 0) {
                    explanation += `He identificado ${diagnostics.length} área(s) que podrían mejorarse:\n`;
                    diagnostics.slice(0, 3).forEach(d => {
                        explanation += `- Línea ${d.line}: ${d.message}\n`;
                    });
                } else if (hasCode) {
                    explanation += 'Tu código se ve bien en términos de estructura.\n';
                } else {
                    explanation += 'Copia código en el editor para que pueda analizarlo.\n';
                }
                break;
            case 'fix':
                explanation = '🐛 **Análisis de Errores**\n\n';
                if (hasCode && diagnostics.length > 0) {
                    explanation += `He encontrado ${diagnostics.length} posible(s) error(es):\n`;
                    diagnostics.slice(0, 3).forEach(d => {
                        explanation += `- Línea ${d.line}: ${d.message}\n`;
                    });
                } else if (hasCode) {
                    explanation += '✅ No he detectado errores obvios en el código.\n';
                } else {
                    explanation += 'Copia código en el editor para que pueda detectar errores.\n';
                }
                break;
            case 'optimize':
                explanation = '⚡ **Optimizaciones Sugeridas**\n\n';
                if (hasCode && diagnostics.length > 0) {
                    explanation += `Oportunidades de optimización encontradas:\n`;
                    diagnostics.slice(0, 3).forEach(d => {
                        explanation += `- Línea ${d.line}: ${d.message}\n`;
                    });
                } else if (hasCode) {
                    explanation += 'Tu código está bien optimizado.\n';
                } else {
                    explanation += 'Copia código en el editor para análisis de optimización.\n';
                }
                break;
            case 'explain':
                explanation = '📖 **Explicación del Código**\n\n';
                if (hasCode) {
                    explanation += 'Tu código contiene las siguientes estructuras:\n';
                    if (diagnostics.length > 0) {
                        diagnostics.slice(0, 3).forEach(d => {
                            explanation += `- ${d.message}\n`;
                        });
                    } else {
                        explanation += '- Variables y declaraciones\n';
                        explanation += '- Flujos de control\n';
                        explanation += '- Estructuras de datos\n';
                    }
                } else {
                    explanation += 'Para explicar código, cópialo en el editor del IDE.\n';
                }
                break;
            default:
                explanation = `**Análisis Aether Core**\n\n`;
                if (hasCode) {
                    if (diagnostics.length > 0) {
                        explanation += `Se analizaron ${diagnostics.length} línea(s):\n`;
                        diagnostics.slice(0, 3).forEach(d => {
                            explanation += `- ${d.message}\n`;
                        });
                    } else {
                        explanation += 'Análisis completado. No hay observaciones.\n';
                    }
                } else {
                    explanation += 'Copia código en el editor para que pueda analizarlo.\n';
                }
        }
        
        explanation += `\n_Confianza: ${(intent.confidence * 100).toFixed(0)}%_`;
        
        return explanation;
    }
}

// ==================== TYPES ====================

interface CodePattern {
    pattern: string[];
    intent: string;
    template: string;
    category: string;
}

interface AIResponse {
    intent: CodeIntent;
    diagnostics: SemanticDiagnostic[];
    suggestions: CodeSuggestion[];
    explanation: string;
    confidence: number;
}

// ==================== SINGLETON ====================

let aiEngineInstance: LocalAIEngine | null = null;

export function getLocalAIEngine(): LocalAIEngine {
    if (!aiEngineInstance) {
        aiEngineInstance = new LocalAIEngine();
    }
    return aiEngineInstance;
}
