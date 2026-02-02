
// AETHER NATIVE AI v1.0 - for Portul v1.0 Language
// This engine understands the new compact syntax and provides relevant feedback.
import { getIdiomaticSuggestion } from './aiLearningService';
import { PORTUL_KEYWORDS, PORTUL_BUILTINS, PORTUL_TYPES, PORTUL_OPERATIONS } from './portulToolchainService';

export interface Diagnostic {
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'performance' | 'logic' | 'memory' | 'intent';
    fix?: string;
    relations?: number[];
}

interface SymbolInfo {
    line: number;
    type: string;
    isMoved?: boolean;
    moveLine?: number;
}

const TYPO_CONFIDENCE_THRESHOLD = 0.70; 

const levenshteinDistance = (s1: string, s2: string): number => {
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i++) track[0][i] = i;
    for (let j = 0; j <= s2.length; j++) track[j][0] = j;
    for (let j = 1; j <= s2.length; j++) {
        for (let i = 1; i <= s1.length; i++) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
        }
    }
    return track[s2.length][s1.length];
};

function calculateConfidence(s1: string, s2: string): number {
    const distance = levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return distance === 0 ? 1 : 0;
    return 1 - (distance / maxLen);
}

export function runNativeAiAnalysis(code: string, activeFile: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = code.split('\n');
    
    const declaredVars = new Map<string, SymbolInfo>();

    lines.forEach((line, index) => {
        const varMatch = line.match(/^\s*(num|txt|obj)\s+(\w+)/);
        if (varMatch) declaredVars.set(varMatch[2], { line: index + 1, type: varMatch[1] });
    });

    const assignedVars = new Map<string, number>();

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // --- Weave Intent Sentinel ---
        const weaveMatch = trimmedLine.match(/^\/\/\s*weave\s+(.+)/);
        if (weaveMatch) {
            diagnostics.push({ line: lineNum, column: 0, length: trimmedLine.length, message: weaveMatch[1], severity: 'intent' });
        }

        // --- Performance Sentinel ---
        if (trimmedLine.match(/^add\s+\w+\s+1/)) {
            const addParts = trimmedLine.split(/\s+/);
            const varName = addParts.length > 1 ? addParts[1] : 'var';
            diagnostics.push({ line: lineNum, column: 0, length: trimmedLine.length, message: `Use 'inc ${varName}' for better performance.`, severity: 'performance' });
        }

        // --- Logic Sentinel ---
        const ifMatch = trimmedLine.match(/^if\s+equ\s+(\w+)\s+\1/);
        if (ifMatch) {
            diagnostics.push({ line: lineNum, column: 0, length: trimmedLine.length, message: `Condition 'if equ ${ifMatch[1]} ${ifMatch[1]}' is always true.`, severity: 'logic' });
        }

        const opMatch = line.match(/^\s*(\w+)\s+(\w+)/);
        if (opMatch) {
            const op = opMatch[1];
            const arg = opMatch[2];
            
            if ([...PORTUL_OPERATIONS, 'put'].includes(op)) {
                if (declaredVars.has(arg)) {
                    const symbolInfo = declaredVars.get(arg)!;
                    if (symbolInfo.isMoved) {
                        diagnostics.push({ line: lineNum, column: line.indexOf(arg), length: arg.length, message: `Memory Error: Variable '${arg}' was moved on line ${symbolInfo.moveLine} and cannot be used here.`, severity: 'memory', relations: [symbolInfo.moveLine!] });
                    }
                    if (op === 'mov') {
                        symbolInfo.isMoved = true;
                        symbolInfo.moveLine = lineNum;
                    }
                } else if (!arg.startsWith('"')) { 
                    let bestMatch: { name: string; info: SymbolInfo; confidence: number } | null = null;
                    
                    declaredVars.forEach((info, name) => {
                        const confidence = calculateConfidence(arg, name);
                        if (!bestMatch || confidence > bestMatch.confidence) {
                            bestMatch = { name, info, confidence };
                        }
                    });

                    if (bestMatch && bestMatch.confidence > TYPO_CONFIDENCE_THRESHOLD) {
                        diagnostics.push({ line: lineNum, column: line.indexOf(arg), length: arg.length, message: `Error: Use of undeclared variable '${arg}'. Did you mean '${bestMatch.name}'?`, severity: 'error', relations: [bestMatch.info.line] });
                    } else {
                        diagnostics.push({ line: lineNum, column: line.indexOf(arg), length: arg.length, message: `Error: Use of undeclared variable '${arg}'.`, severity: 'error' });
                    }
                }
            }
        }
    });

    return diagnostics;
}
