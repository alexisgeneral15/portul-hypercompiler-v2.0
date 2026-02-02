// PORTUL SEMANTIC ANALYZER v2.0
// Advanced type checking, control flow analysis, and semantic validation
// Professional-grade static analysis for Portul language

import { SymbolTable, SymbolInformation, SymbolKind } from './languageServer';
import { PORTUL_TYPES, PORTUL_OPERATIONS } from './portulToolchainService';

export interface SemanticDiagnostic {
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    code: string;
    fix?: CodeFix;
    relatedInformation?: RelatedInformation[];
}

export interface CodeFix {
    title: string;
    edits: TextEdit[];
}

export interface TextEdit {
    range: { startLine: number; startChar: number; endLine: number; endChar: number };
    newText: string;
}

export interface RelatedInformation {
    line: number;
    message: string;
}

export interface TypeInfo {
    type: string;
    isConst: boolean;
    isNullable: boolean;
    isReference: boolean;
}

export interface ControlFlowNode {
    type: 'entry' | 'exit' | 'statement' | 'branch' | 'loop' | 'return';
    line: number;
    children: ControlFlowNode[];
    parent?: ControlFlowNode;
    reachable: boolean;
}

// ==================== SEMANTIC ANALYZER ====================

export class SemanticAnalyzer {
    private symbolTable: SymbolTable;
    private diagnostics: SemanticDiagnostic[] = [];
    private typeMap: Map<string, TypeInfo> = new Map();
    private controlFlowGraph: ControlFlowNode | null = null;
    private currentScope: SymbolTable;

    constructor() {
        this.symbolTable = new SymbolTable();
        this.currentScope = this.symbolTable;
        this.initializeBuiltins();
    }

    private initializeBuiltins(): void {
        // Register built-in types
        PORTUL_TYPES.forEach(type => {
            this.typeMap.set(type, {
                type: 'builtin',
                isConst: true,
                isNullable: false,
                isReference: false
            });
        });
    }

    // ==================== MAIN ANALYSIS ENTRY POINT ====================

    analyze(code: string): SemanticDiagnostic[] {
        this.diagnostics = [];
        this.typeMap.clear();
        this.symbolTable = new SymbolTable();
        this.currentScope = this.symbolTable;

        const lines = code.split('\n');

        // Phase 1: Symbol collection (declarations)
        this.collectSymbols(lines);

        // Phase 2: Type checking
        this.checkTypes(lines);

        // Phase 3: Control flow analysis
        this.analyzeControlFlow(lines);

        // Phase 4: Data flow analysis
        this.analyzeDataFlow(lines);

        // Phase 5: Advanced checks
        this.performAdvancedChecks(lines);

        return this.diagnostics;
    }

    // ==================== PHASE 1: SYMBOL COLLECTION ====================

    private collectSymbols(lines: string[]): void {
        let currentClass: string | null = null;
        let currentMethod: string | null = null;
        let braceDepth = 0;

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();

            // Track brace depth
            braceDepth += (line.match(/{/g) || []).length;
            braceDepth -= (line.match(/}/g) || []).length;

            // Class declarations
            const classMatch = trimmed.match(/^class\s+(\w+)/);
            if (classMatch) {
                const className = classMatch[1];
                
                if (this.symbolTable.resolve(className)) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: line.indexOf(className),
                        length: className.length,
                        message: `Class '${className}' is already defined`,
                        severity: 'error',
                        code: 'E001'
                    });
                } else {
                    this.symbolTable.define({
                        name: className,
                        kind: SymbolKind.Class,
                        scope: 'global',
                        location: {
                            start: { line: index, character: line.indexOf(className) },
                            end: { line: index, character: line.indexOf(className) + className.length }
                        }
                    });
                    currentClass = className;
                }
            }

            // Variable declarations
            const varMatch = trimmed.match(/^(num|txt|obj|ary|ptr)\s+(\w+)(\s*=\s*(.+))?/);
            if (varMatch) {
                const [, type, name, , initializer] = varMatch;
                
                if (this.currentScope.resolve(name)) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: line.indexOf(name),
                        length: name.length,
                        message: `Variable '${name}' is already defined in this scope`,
                        severity: 'error',
                        code: 'E002'
                    });
                } else {
                    this.currentScope.define({
                        name,
                        kind: SymbolKind.Variable,
                        type,
                        scope: currentClass ? 'class' : 'local',
                        location: {
                            start: { line: index, character: line.indexOf(name) },
                            end: { line: index, character: line.indexOf(name) + name.length }
                        }
                    });

                    this.typeMap.set(name, {
                        type,
                        isConst: false,
                        isNullable: !initializer,
                        isReference: false
                    });
                }
            }

            // Method declarations
            const methodMatch = trimmed.match(/^(public|private)\s+(\w+)/);
            if (methodMatch && currentClass) {
                const [, visibility, methodName] = methodMatch;
                this.currentScope.define({
                    name: methodName,
                    kind: SymbolKind.Method,
                    scope: 'class',
                    containerName: currentClass,
                    location: {
                        start: { line: index, character: line.indexOf(methodName) },
                        end: { line: index, character: line.indexOf(methodName) + methodName.length }
                    }
                });
                currentMethod = methodName;
            }

            // Exit class/method scope
            if (braceDepth === 0 && currentClass) {
                currentClass = null;
                currentMethod = null;
            }
        });
    }

    // ==================== PHASE 2: TYPE CHECKING ====================

    private checkTypes(lines: string[]): void {
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();

            // Check operations
            const opMatch = trimmed.match(/^(add|sub|mul|div|inc)\s+(\w+)(?:\s+(\w+|\d+))?/);
            if (opMatch) {
                const [, operation, target, operand] = opMatch;

                // Check if target exists
                const targetSymbol = this.symbolTable.resolve(target);
                if (!targetSymbol) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: line.indexOf(target),
                        length: target.length,
                        message: `Undefined variable '${target}'`,
                        severity: 'error',
                        code: 'E003',
                        fix: {
                            title: `Declare '${target}' as num`,
                            edits: [{
                                range: { startLine: lineNum - 1, startChar: 0, endLine: lineNum - 1, endChar: 0 },
                                newText: `num ${target} = 0;\n`
                            }]
                        }
                    });
                } else {
                    // Check if target is numeric
                    const typeInfo = this.typeMap.get(target);
                    if (typeInfo && typeInfo.type !== 'num') {
                        this.addDiagnostic({
                            line: lineNum,
                            column: line.indexOf(target),
                            length: target.length,
                            message: `Cannot perform arithmetic operation on type '${typeInfo.type}'. Expected 'num'`,
                            severity: 'error',
                            code: 'E004'
                        });
                    }
                }

                // Check operand if present
                if (operand && !/^\d+$/.test(operand)) {
                    const operandSymbol = this.symbolTable.resolve(operand);
                    if (!operandSymbol) {
                        this.addDiagnostic({
                            line: lineNum,
                            column: line.indexOf(operand),
                            length: operand.length,
                            message: `Undefined variable '${operand}'`,
                            severity: 'error',
                            code: 'E003'
                        });
                    }
                }
            }

            // Check 'put' statements
            const putMatch = trimmed.match(/^put\s+(.+)/);
            if (putMatch) {
                const argument = putMatch[1].trim();
                
                // If it's not a string literal and not a number
                if (!argument.startsWith('"') && !/^\d+$/.test(argument)) {
                    const symbol = this.symbolTable.resolve(argument);
                    if (!symbol) {
                        this.addDiagnostic({
                            line: lineNum,
                            column: line.indexOf(argument),
                            length: argument.length,
                            message: `Undefined variable '${argument}'`,
                            severity: 'error',
                            code: 'E003'
                        });
                    }
                }
            }

            // Check 'mov' statements (ownership transfer)
            const movMatch = trimmed.match(/^mov\s+(\w+(?:\.\w+)?)\s+(\w+)/);
            if (movMatch) {
                const [, dest, source] = movMatch;
                
                const sourceSymbol = this.symbolTable.resolve(source);
                if (!sourceSymbol) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: line.indexOf(source),
                        length: source.length,
                        message: `Undefined variable '${source}'`,
                        severity: 'error',
                        code: 'E003'
                    });
                } else if (sourceSymbol.isMoved) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: line.indexOf(source),
                        length: source.length,
                        message: `Cannot move '${source}' because it was already moved`,
                        severity: 'error',
                        code: 'E005'
                    });
                } else {
                    // Mark as moved
                    sourceSymbol.isMoved = true;
                }
            }
        });
    }

    // ==================== PHASE 3: CONTROL FLOW ANALYSIS ====================

    private analyzeControlFlow(lines: string[]): void {
        const cfg = this.buildControlFlowGraph(lines);
        this.controlFlowGraph = cfg;

        // Check for unreachable code
        this.detectUnreachableCode(cfg, lines);

        // Check for infinite loops
        this.detectInfiniteLoops(cfg, lines);
    }

    private buildControlFlowGraph(lines: string[]): ControlFlowNode {
        const entry: ControlFlowNode = {
            type: 'entry',
            line: 0,
            children: [],
            reachable: true
        };

        let current = entry;
        let loopStack: ControlFlowNode[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const lineNum = index + 1;

            // Return statement
            if (trimmed.startsWith('ret')) {
                const returnNode: ControlFlowNode = {
                    type: 'return',
                    line: lineNum,
                    children: [],
                    parent: current,
                    reachable: current.reachable
                };
                current.children.push(returnNode);
                current = returnNode;
            }

            // For loop
            const forMatch = trimmed.match(/^for\s+\w+\s+\d+\s+\d+/);
            if (forMatch) {
                const loopNode: ControlFlowNode = {
                    type: 'loop',
                    line: lineNum,
                    children: [],
                    parent: current,
                    reachable: current.reachable
                };
                current.children.push(loopNode);
                loopStack.push(current);
                current = loopNode;
            }

            // If statement
            const ifMatch = trimmed.match(/^if\s+\w+/);
            if (ifMatch) {
                const branchNode: ControlFlowNode = {
                    type: 'branch',
                    line: lineNum,
                    children: [],
                    parent: current,
                    reachable: current.reachable
                };
                current.children.push(branchNode);
                current = branchNode;
            }

            // End of block
            if (trimmed === '}' && loopStack.length > 0) {
                current = loopStack.pop()!;
            }
        });

        return entry;
    }

    private detectUnreachableCode(cfg: ControlFlowNode, lines: string[]): void {
        const visited = new Set<number>();

        const traverse = (node: ControlFlowNode) => {
            if (visited.has(node.line)) return;
            visited.add(node.line);
            
            if (node.type === 'return') {
                node.reachable = true;
                return; // Don't traverse children after return
            }

            node.children.forEach(child => {
                child.reachable = node.reachable;
                traverse(child);
            });
        };

        traverse(cfg);

        // Report unreachable code (but only for actual unreachable statements, not false positives)
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            
            // Only report unreachable code if:
            // 1. Line was not visited
            // 2. Line is not empty
            // 3. Line is not a comment
            // 4. Line is a statement (not a closing brace or blank line)
            // 5. Previous line was a return/break/continue statement
            if (!visited.has(lineNum) && trimmed && !trimmed.startsWith('//') && trimmed !== '}') {
                const prevLine = index > 0 ? lines[index - 1].trim() : '';
                const isAfterControl = prevLine.match(/^\s*(ret|break|continue)\s*/) || prevLine.endsWith('}');
                
                // Only report if this line looks like a real statement that's after control flow
                if (isAfterControl && !trimmed.match(/^(else|catch|finally|}\s*else)/)) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: 0,
                        length: line.length,
                        message: 'Unreachable code detected - this line will never execute',
                        severity: 'warning',
                        code: 'W001'
                    });
                }
            }
        });
    }

    private detectInfiniteLoops(cfg: ControlFlowNode, lines: string[]): void {
        const loopNodes: ControlFlowNode[] = [];

        const findLoops = (node: ControlFlowNode) => {
            if (node.type === 'loop') {
                loopNodes.push(node);
            }
            node.children.forEach(findLoops);
        };

        findLoops(cfg);

        // Check if loop has exit condition
        loopNodes.forEach(loopNode => {
            const loopLine = lines[loopNode.line - 1];
            const match = loopLine.match(/for\s+\w+\s+(\d+)\s+(\d+)/);
            
            if (match) {
                const [, start, end] = match;
                if (parseInt(start) >= parseInt(end)) {
                    this.addDiagnostic({
                        line: loopNode.line,
                        column: 0,
                        length: loopLine.length,
                        message: 'Loop will never execute (start >= end)',
                        severity: 'warning',
                        code: 'W002'
                    });
                }
            }
        });
    }

    // ==================== PHASE 4: DATA FLOW ANALYSIS ====================

    private analyzeDataFlow(lines: string[]): void {
        const definedVars = new Set<string>();
        const usedVars = new Set<string>();
        const varFirstUse = new Map<string, number>();

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();

            // Variable definition
            const defMatch = trimmed.match(/^(num|txt|obj|ary|ptr)\s+(\w+)/);
            if (defMatch) {
                const varName = defMatch[2];
                definedVars.add(varName);
                
                // Check if initialized
                if (!trimmed.includes('=')) {
                    this.addDiagnostic({
                        line: lineNum,
                        column: line.indexOf(varName),
                        length: varName.length,
                        message: `Variable '${varName}' is declared but not initialized`,
                        severity: 'hint',
                        code: 'H001',
                        fix: {
                            title: `Initialize '${varName}'`,
                            edits: [{
                                range: { 
                                    startLine: lineNum - 1, 
                                    startChar: line.length, 
                                    endLine: lineNum - 1, 
                                    endChar: line.length 
                                },
                                newText: ` = ${defMatch[1] === 'num' ? '0' : '""'}`
                            }]
                        }
                    });
                }
            }

            // Variable usage
            const words = trimmed.split(/\s+/);
            words.forEach((word, wordIndex) => {
                if (wordIndex > 0 && /^\w+$/.test(word) && !PORTUL_TYPES.has(word) && !PORTUL_OPERATIONS.has(word)) {
                    usedVars.add(word);
                    if (!varFirstUse.has(word)) {
                        varFirstUse.set(word, lineNum);
                    }
                }
            });
        });

        // Check for unused variables
        definedVars.forEach(varName => {
            if (!usedVars.has(varName)) {
                const symbol = this.symbolTable.resolve(varName);
                if (symbol) {
                    this.addDiagnostic({
                        line: symbol.location.start.line + 1,
                        column: symbol.location.start.character,
                        length: varName.length,
                        message: `Variable '${varName}' is declared but never used`,
                        severity: 'hint',
                        code: 'H002'
                    });
                }
            }
        });

        // Check for used but undefined variables (covered in type checking)
    }

    // ==================== PHASE 5: ADVANCED CHECKS ====================

    private performAdvancedChecks(lines: string[]): void {
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();

            // Check for performance anti-patterns
            this.checkPerformanceIssues(trimmed, lineNum, line);

            // Check for logic issues
            this.checkLogicIssues(trimmed, lineNum, line);

            // Check for naming conventions
            this.checkNamingConventions(trimmed, lineNum, line);

            // Check for complexity
            this.checkComplexity(trimmed, lineNum);
        });
    }

    private checkPerformanceIssues(trimmed: string, lineNum: number, line: string): void {
        // Suggest 'inc' instead of 'add x 1'
        const addOneMatch = trimmed.match(/^add\s+(\w+)\s+1$/);
        if (addOneMatch) {
            this.addDiagnostic({
                line: lineNum,
                column: 0,
                length: line.length,
                message: `Use 'inc ${addOneMatch[1]}' instead of 'add ${addOneMatch[1]} 1' for better performance`,
                severity: 'info',
                code: 'I001',
                fix: {
                    title: `Replace with 'inc ${addOneMatch[1]}'`,
                    edits: [{
                        range: { startLine: lineNum - 1, startChar: 0, endLine: lineNum - 1, endChar: line.length },
                        newText: line.replace(trimmed, `inc ${addOneMatch[1]}`)
                    }]
                }
            });
        }

        // Detect repeated operations that could be simplified
        // This would require multi-line context, implemented later
    }

    private checkLogicIssues(trimmed: string, lineNum: number, line: string): void {
        // Check for tautologies
        const tautologyMatch = trimmed.match(/^if\s+equ\s+(\w+)\s+\1/);
        if (tautologyMatch) {
            this.addDiagnostic({
                line: lineNum,
                column: 0,
                length: line.length,
                message: `Condition 'equ ${tautologyMatch[1]} ${tautologyMatch[1]}' is always true`,
                severity: 'warning',
                code: 'W003'
            });
        }

        // Check for contradictions
        const contradictionMatch = trimmed.match(/^if\s+gt\s+(\w+)\s+\1/);
        if (contradictionMatch) {
            this.addDiagnostic({
                line: lineNum,
                column: 0,
                length: line.length,
                message: `Condition 'gt ${contradictionMatch[1]} ${contradictionMatch[1]}' is always false`,
                severity: 'warning',
                code: 'W004'
            });
        }
    }

    private checkNamingConventions(trimmed: string, lineNum: number, line: string): void {
        // Check class names (should be PascalCase)
        const classMatch = trimmed.match(/^class\s+([a-z]\w+)/);
        if (classMatch) {
            this.addDiagnostic({
                line: lineNum,
                column: line.indexOf(classMatch[1]),
                length: classMatch[1].length,
                message: `Class name '${classMatch[1]}' should start with uppercase letter (PascalCase)`,
                severity: 'info',
                code: 'I002'
            });
        }

        // Check variable names (should be lowercase or snake_case)
        const varMatch = trimmed.match(/^(num|txt|obj|ary|ptr)\s+([A-Z]\w+)/);
        if (varMatch) {
            this.addDiagnostic({
                line: lineNum,
                column: line.indexOf(varMatch[2]),
                length: varMatch[2].length,
                message: `Variable name '${varMatch[2]}' should use lowercase or snake_case`,
                severity: 'info',
                code: 'I003'
            });
        }
    }

    private checkComplexity(trimmed: string, lineNum: number): void {
        // Check line length
        if (trimmed.length > 80) {
            this.addDiagnostic({
                line: lineNum,
                column: 80,
                length: trimmed.length - 80,
                message: 'Line is too long (exceeds 80 characters)',
                severity: 'info',
                code: 'I004'
            });
        }
    }

    // ==================== UTILITY METHODS ====================

    private addDiagnostic(diagnostic: SemanticDiagnostic): void {
        this.diagnostics.push(diagnostic);
    }

    getSymbolTable(): SymbolTable {
        return this.symbolTable;
    }

    getTypeInfo(varName: string): TypeInfo | undefined {
        return this.typeMap.get(varName);
    }
}

// ==================== SINGLETON INSTANCE ====================

let semanticAnalyzerInstance: SemanticAnalyzer | null = null;

export function getSemanticAnalyzer(): SemanticAnalyzer {
    if (!semanticAnalyzerInstance) {
        semanticAnalyzerInstance = new SemanticAnalyzer();
    }
    return semanticAnalyzerInstance;
}
