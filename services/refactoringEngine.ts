// PORTUL REFACTORING ENGINE v2.0
// Automated code transformations and intelligent refactoring operations
// Professional-grade refactoring tools inspired by Visual Studio and ReSharper

import { SymbolTable, SymbolInformation, SymbolKind } from './languageServer';
import { SemanticAnalyzer } from './semanticAnalyzer';
import { PORTUL_KEYWORDS, PORTUL_TYPES, PORTUL_OPERATIONS } from './portulToolchainService';

export interface RefactoringAction {
    type: RefactoringType;
    title: string;
    description: string;
    range: CodeRange;
    newCode: string;
    preview: string;
    safety: 'safe' | 'warning' | 'dangerous';
}

export enum RefactoringType {
    ExtractMethod = 'extract-method',
    ExtractVariable = 'extract-variable',
    InlineVariable = 'inline-variable',
    Rename = 'rename',
    ChangeSignature = 'change-signature',
    MoveToClass = 'move-to-class',
    IntroduceParameter = 'introduce-parameter',
    RemoveUnusedCode = 'remove-unused',
    OptimizePerformance = 'optimize-performance',
    SimplifyExpression = 'simplify-expression',
    ConvertToLoop = 'convert-to-loop',
    InlineMethod = 'inline-method',
}

export interface CodeRange {
    startLine: number;
    startChar: number;
    endLine: number;
    endChar: number;
}

export interface RefactoringResult {
    success: boolean;
    code: string;
    message: string;
    changes: Change[];
}

export interface Change {
    range: CodeRange;
    oldText: string;
    newText: string;
    description: string;
}

// ==================== REFACTORING ENGINE ====================

export class RefactoringEngine {
    private semanticAnalyzer: SemanticAnalyzer;
    private symbolTable: SymbolTable;

    constructor() {
        this.semanticAnalyzer = new SemanticAnalyzer();
        this.symbolTable = new SymbolTable();
    }

    // ==================== AVAILABLE REFACTORINGS ====================

    getAvailableRefactorings(code: string, selection: CodeRange): RefactoringAction[] {
        const actions: RefactoringAction[] = [];
        const selectedText = this.getTextInRange(code, selection);

        // Extract Method
        if (this.canExtractMethod(selectedText)) {
            actions.push({
                type: RefactoringType.ExtractMethod,
                title: 'Extract Method',
                description: 'Extract selected code into a new method',
                range: selection,
                newCode: this.previewExtractMethod(selectedText),
                preview: 'Creates a new method with the selected code',
                safety: 'safe'
            });
        }

        // Extract Variable
        if (this.canExtractVariable(selectedText)) {
            actions.push({
                type: RefactoringType.ExtractVariable,
                title: 'Extract Variable',
                description: 'Extract expression into a variable',
                range: selection,
                newCode: this.previewExtractVariable(selectedText),
                preview: 'Creates a new variable with the expression',
                safety: 'safe'
            });
        }

        // Optimize Performance
        const optimizations = this.findOptimizations(code);
        optimizations.forEach(opt => {
            actions.push({
                type: RefactoringType.OptimizePerformance,
                title: opt.title,
                description: opt.description,
                range: opt.range,
                newCode: opt.newCode,
                preview: opt.preview,
                safety: 'safe'
            });
        });

        // Remove Unused Code
        const unused = this.findUnusedCode(code);
        unused.forEach(item => {
            actions.push({
                type: RefactoringType.RemoveUnusedCode,
                title: `Remove unused ${item.type}`,
                description: `Remove unused ${item.type} '${item.name}'`,
                range: item.range,
                newCode: '',
                preview: `Removes ${item.type} that is never used`,
                safety: 'warning'
            });
        });

        return actions;
    }

    // ==================== EXTRACT METHOD ====================

    extractMethod(code: string, selection: CodeRange, methodName: string): RefactoringResult {
        const lines = code.split('\n');
        const selectedLines = lines.slice(selection.startLine, selection.endLine + 1);
        const selectedCode = selectedLines.join('\n');

        // Analyze variables used in selection
        const analysis = this.analyzeSelection(selectedCode, lines, selection);

        // Generate method signature
        const parameters = analysis.inputVars.map(v => `${v.type} ${v.name}`).join(' ');
        const returnType = analysis.outputVars.length > 0 ? analysis.outputVars[0].type : 'void';

        // Generate new method
        const methodCode = this.generateMethodCode(methodName, parameters, selectedCode, returnType);

        // Generate method call
        const callArgs = analysis.inputVars.map(v => v.name).join(' ');
        const methodCall = `cal ${methodName} ${callArgs}`;

        // Replace selection with call
        const newLines = [
            ...lines.slice(0, selection.startLine),
            methodCall,
            ...lines.slice(selection.endLine + 1)
        ];

        // Insert method at appropriate location
        const insertPoint = this.findMethodInsertionPoint(lines);
        newLines.splice(insertPoint, 0, '', methodCode, '');

        return {
            success: true,
            code: newLines.join('\n'),
            message: `Extracted method '${methodName}'`,
            changes: [{
                range: selection,
                oldText: selectedCode,
                newText: methodCall,
                description: 'Replaced with method call'
            }]
        };
    }

    private generateMethodCode(name: string, params: string, body: string, returnType: string): string {
        const indentedBody = body.split('\n').map(line => '    ' + line).join('\n');
        return `public ${name} ${params} {\n${indentedBody}\n}`;
    }

    private findMethodInsertionPoint(lines: string[]): number {
        // Find the end of the current class or end of file
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '}') {
                return i;
            }
        }
        return lines.length;
    }

    private previewExtractMethod(code: string): string {
        return `public extractedMethod params {\n${code.split('\n').map(l => '    ' + l).join('\n')}\n}`;
    }

    private canExtractMethod(code: string): boolean {
        const lines = code.trim().split('\n');
        return lines.length > 0 && !lines[0].match(/^(class|public|private)/);
    }

    // ==================== EXTRACT VARIABLE ====================

    extractVariable(code: string, selection: CodeRange, varName: string): RefactoringResult {
        const lines = code.split('\n');
        const expression = this.getTextInRange(code, selection);

        // Infer type
        const type = this.inferType(expression, lines);

        // Generate variable declaration
        const declaration = `${type} ${varName} = ${expression}`;

        // Find insertion point (before current line)
        const insertLine = selection.startLine;
        const newLines = [
            ...lines.slice(0, insertLine),
            declaration,
            ...lines.slice(insertLine)
        ];

        // Replace all occurrences of expression with variable name
        const updatedLines = this.replaceExpression(newLines, expression, varName, insertLine + 1);

        return {
            success: true,
            code: updatedLines.join('\n'),
            message: `Extracted variable '${varName}'`,
            changes: [{
                range: { startLine: insertLine, startChar: 0, endLine: insertLine, endChar: 0 },
                oldText: '',
                newText: declaration,
                description: 'Added variable declaration'
            }]
        };
    }

    private previewExtractVariable(expression: string): string {
        const type = this.inferType(expression, []);
        return `${type} newVar = ${expression}`;
    }

    private canExtractVariable(code: string): boolean {
        return code.trim().length > 0 && !code.includes('\n') && !code.match(/^(num|txt|obj|ary|ptr)\s+/);
    }

    private inferType(expression: string, lines: string[]): string {
        // Simple type inference
        if (/^\d+$/.test(expression)) return 'num';
        if (/^".*"$/.test(expression)) return 'txt';
        
        // Check if it's a variable reference
        const varMatch = expression.match(/^(\w+)$/);
        if (varMatch) {
            const varName = varMatch[1];
            const declLine = lines.find(l => l.match(new RegExp(`(num|txt|obj|ary|ptr)\\s+${varName}`)));
            if (declLine) {
                const match = declLine.match(/(num|txt|obj|ary|ptr)/);
                if (match) return match[1];
            }
        }

        return 'num'; // Default
    }

    private replaceExpression(lines: string[], expression: string, varName: string, startLine: number): string[] {
        const regex = new RegExp(expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        return lines.map((line, idx) => {
            if (idx >= startLine) {
                return line.replace(regex, varName);
            }
            return line;
        });
    }

    // ==================== INLINE VARIABLE ====================

    inlineVariable(code: string, variableName: string): RefactoringResult {
        const lines = code.split('\n');
        let declarationLine = -1;
        let value = '';

        // Find declaration
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(new RegExp(`(num|txt|obj|ary|ptr)\\s+${variableName}\\s*=\\s*(.+)`));
            if (match) {
                declarationLine = i;
                value = match[2].trim();
                break;
            }
        }

        if (declarationLine === -1) {
            return {
                success: false,
                code,
                message: `Variable '${variableName}' not found`,
                changes: []
            };
        }

        // Replace all usages with value
        const newLines = lines.filter((_, idx) => idx !== declarationLine)
            .map(line => line.replace(new RegExp(`\\b${variableName}\\b`, 'g'), value));

        return {
            success: true,
            code: newLines.join('\n'),
            message: `Inlined variable '${variableName}'`,
            changes: []
        };
    }

    // ==================== RENAME ====================

    rename(code: string, oldName: string, newName: string): RefactoringResult {
        const lines = code.split('\n');
        
        // Validate new name
        if (!this.isValidIdentifier(newName)) {
            return {
                success: false,
                code,
                message: `Invalid identifier: ${newName}`,
                changes: []
            };
        }

        // Replace all occurrences
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        const newLines = lines.map(line => line.replace(regex, newName));

        return {
            success: true,
            code: newLines.join('\n'),
            message: `Renamed '${oldName}' to '${newName}'`,
            changes: []
        };
    }

    private isValidIdentifier(name: string): boolean {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && 
               !PORTUL_KEYWORDS.has(name) && 
               !PORTUL_TYPES.has(name);
    }

    // ==================== OPTIMIZE PERFORMANCE ====================

    findOptimizations(code: string): Array<{
        title: string;
        description: string;
        range: CodeRange;
        newCode: string;
        preview: string;
    }> {
        const optimizations: Array<any> = [];
        const lines = code.split('\n');

        lines.forEach((line, idx) => {
            // Optimize 'add x 1' to 'inc x'
            const addOneMatch = line.match(/^(\s*)add\s+(\w+)\s+1\s*$/);
            if (addOneMatch) {
                optimizations.push({
                    title: 'Optimize increment',
                    description: `Replace 'add ${addOneMatch[2]} 1' with 'inc ${addOneMatch[2]}'`,
                    range: {
                        startLine: idx,
                        startChar: 0,
                        endLine: idx,
                        endChar: line.length
                    },
                    newCode: `${addOneMatch[1]}inc ${addOneMatch[2]}`,
                    preview: 'Uses faster increment instruction'
                });
            }

            // Optimize 'sub x 1' to 'dec x' (if we add dec operation)
            const subOneMatch = line.match(/^(\s*)sub\s+(\w+)\s+1\s*$/);
            if (subOneMatch) {
                optimizations.push({
                    title: 'Optimize decrement',
                    description: `Replace 'sub ${subOneMatch[2]} 1' with 'dec ${subOneMatch[2]}'`,
                    range: {
                        startLine: idx,
                        startChar: 0,
                        endLine: idx,
                        endChar: line.length
                    },
                    newCode: `${subOneMatch[1]}dec ${subOneMatch[2]}`,
                    preview: 'Uses faster decrement instruction'
                });
            }

            // Optimize repeated operations
            if (idx > 0) {
                const prevLine = lines[idx - 1];
                if (line.match(/^add\s+(\w+)\s+(\w+)/) && prevLine.match(/^add\s+(\w+)\s+(\w+)/)) {
                    const currMatch = line.match(/^add\s+(\w+)\s+(\w+)/);
                    const prevMatch = prevLine.match(/^add\s+(\w+)\s+(\w+)/);
                    
                    if (currMatch && prevMatch && currMatch[1] === prevMatch[1]) {
                        // Could combine these
                        optimizations.push({
                            title: 'Combine operations',
                            description: 'Combine consecutive additions',
                            range: {
                                startLine: idx - 1,
                                startChar: 0,
                                endLine: idx,
                                endChar: line.length
                            },
                            newCode: `// Consider optimizing these operations`,
                            preview: 'Potential for optimization'
                        });
                    }
                }
            }
        });

        return optimizations;
    }

    applyOptimization(code: string, range: CodeRange, newCode: string): RefactoringResult {
        const lines = code.split('\n');
        
        // Replace the range with new code
        const newLines = [
            ...lines.slice(0, range.startLine),
            newCode,
            ...lines.slice(range.endLine + 1)
        ];

        return {
            success: true,
            code: newLines.join('\n'),
            message: 'Applied optimization',
            changes: [{
                range,
                oldText: this.getTextInRange(code, range),
                newText: newCode,
                description: 'Optimized code'
            }]
        };
    }

    // ==================== REMOVE UNUSED CODE ====================

    findUnusedCode(code: string): Array<{
        type: string;
        name: string;
        range: CodeRange;
    }> {
        const unused: Array<any> = [];
        const lines = code.split('\n');
        
        // Find all declarations
        const declarations = new Map<string, { line: number; type: string }>();
        const usages = new Set<string>();

        lines.forEach((line, idx) => {
            // Variable declarations
            const varMatch = line.match(/^(num|txt|obj|ary|ptr)\s+(\w+)/);
            if (varMatch) {
                declarations.set(varMatch[2], { line: idx, type: 'variable' });
            }

            // Class declarations
            const classMatch = line.match(/^class\s+(\w+)/);
            if (classMatch) {
                declarations.set(classMatch[1], { line: idx, type: 'class' });
            }

            // Find usages
            const words = line.split(/\s+/);
            words.forEach((word, wordIdx) => {
                if (wordIdx > 0 && /^\w+$/.test(word)) {
                    usages.add(word);
                }
            });
        });

        // Check which declarations are unused
        declarations.forEach((info, name) => {
            if (!usages.has(name)) {
                unused.push({
                    type: info.type,
                    name,
                    range: {
                        startLine: info.line,
                        startChar: 0,
                        endLine: info.line,
                        endChar: lines[info.line].length
                    }
                });
            }
        });

        return unused;
    }

    removeUnusedCode(code: string): RefactoringResult {
        const unused = this.findUnusedCode(code);
        const lines = code.split('\n');
        
        // Remove unused lines
        const linesToRemove = new Set(unused.map(u => u.range.startLine));
        const newLines = lines.filter((_, idx) => !linesToRemove.has(idx));

        return {
            success: true,
            code: newLines.join('\n'),
            message: `Removed ${unused.length} unused items`,
            changes: unused.map(u => ({
                range: u.range,
                oldText: lines[u.range.startLine],
                newText: '',
                description: `Removed unused ${u.type} '${u.name}'`
            }))
        };
    }

    // ==================== UTILITY METHODS ====================

    private getTextInRange(code: string, range: CodeRange): string {
        const lines = code.split('\n');
        const selectedLines = lines.slice(range.startLine, range.endLine + 1);
        
        if (selectedLines.length === 1) {
            return selectedLines[0].substring(range.startChar, range.endChar);
        }
        
        selectedLines[0] = selectedLines[0].substring(range.startChar);
        selectedLines[selectedLines.length - 1] = selectedLines[selectedLines.length - 1].substring(0, range.endChar);
        
        return selectedLines.join('\n');
    }

    private analyzeSelection(selectedCode: string, allLines: string[], selection: CodeRange): {
        inputVars: Array<{ name: string; type: string }>;
        outputVars: Array<{ name: string; type: string }>;
    } {
        const inputVars: Array<{ name: string; type: string }> = [];
        const outputVars: Array<{ name: string; type: string }> = [];
        
        // Find variables used in selection
        const usedVars = new Set<string>();
        const definedVars = new Set<string>();

        // Check lines before selection for declarations
        const declaredBefore = new Map<string, string>();
        for (let i = 0; i < selection.startLine; i++) {
            const match = allLines[i].match(/(num|txt|obj|ary|ptr)\s+(\w+)/);
            if (match) {
                declaredBefore.set(match[2], match[1]);
            }
        }

        // Analyze selected code
        selectedCode.split('\n').forEach(line => {
            const words = line.split(/\s+/);
            words.forEach(word => {
                if (/^\w+$/.test(word) && !PORTUL_KEYWORDS.has(word) && !PORTUL_TYPES.has(word)) {
                    usedVars.add(word);
                }
            });

            const defMatch = line.match(/(num|txt|obj|ary|ptr)\s+(\w+)/);
            if (defMatch) {
                definedVars.add(defMatch[2]);
            }
        });

        // Input vars are used but not defined in selection
        usedVars.forEach(varName => {
            if (!definedVars.has(varName) && declaredBefore.has(varName)) {
                inputVars.push({ name: varName, type: declaredBefore.get(varName)! });
            }
        });

        // Output vars are defined in selection and potentially used after
        // (simplified - would need deeper analysis)
        definedVars.forEach(varName => {
            if (declaredBefore.has(varName)) {
                outputVars.push({ name: varName, type: declaredBefore.get(varName)! });
            }
        });

        return { inputVars, outputVars };
    }
}

// ==================== SINGLETON ====================

let refactoringEngineInstance: RefactoringEngine | null = null;

export function getRefactoringEngine(): RefactoringEngine {
    if (!refactoringEngineInstance) {
        refactoringEngineInstance = new RefactoringEngine();
    }
    return refactoringEngineInstance;
}
