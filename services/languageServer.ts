// PORTUL LANGUAGE SERVER v2.0
// Professional IntelliSense, code completion, and semantic analysis
// Inspired by Microsoft's Language Server Protocol (LSP)

import { PORTUL_KEYWORDS, PORTUL_BUILTINS, PORTUL_TYPES, PORTUL_OPERATIONS } from './portulToolchainService';

export interface Position {
    line: number;      // 0-based
    character: number; // 0-based
}

export interface Range {
    start: Position;
    end: Position;
}

export interface CompletionItem {
    label: string;
    kind: CompletionItemKind;
    detail?: string;
    documentation?: string;
    insertText?: string;
    sortText?: string;
    filterText?: string;
}

export enum CompletionItemKind {
    Text = 1,
    Method = 2,
    Function = 3,
    Constructor = 4,
    Field = 5,
    Variable = 6,
    Class = 7,
    Interface = 8,
    Module = 9,
    Property = 10,
    Unit = 11,
    Value = 12,
    Enum = 13,
    Keyword = 14,
    Snippet = 15,
    Color = 16,
    File = 17,
    Reference = 18,
    Folder = 19,
    EnumMember = 20,
    Constant = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25,
}

export interface Hover {
    contents: string;
    range?: Range;
}

export interface SignatureHelp {
    signatures: SignatureInformation[];
    activeSignature: number;
    activeParameter: number;
}

export interface SignatureInformation {
    label: string;
    documentation?: string;
    parameters: ParameterInformation[];
}

export interface ParameterInformation {
    label: string;
    documentation?: string;
}

export interface SymbolInformation {
    name: string;
    kind: SymbolKind;
    location: Range;
    containerName?: string;
    type?: string;
    value?: any;
    scope: 'local' | 'global' | 'class';
    isConst?: boolean;
    isMoved?: boolean;
}

export enum SymbolKind {
    File = 1,
    Module = 2,
    Namespace = 3,
    Package = 4,
    Class = 5,
    Method = 6,
    Property = 7,
    Field = 8,
    Constructor = 9,
    Enum = 10,
    Interface = 11,
    Function = 12,
    Variable = 13,
    Constant = 14,
    String = 15,
    Number = 16,
    Boolean = 17,
    Array = 18,
    Object = 19,
    Key = 20,
    Null = 21,
    EnumMember = 22,
    Struct = 23,
    Event = 24,
    Operator = 25,
    TypeParameter = 26,
}

export interface SemanticToken {
    line: number;
    startChar: number;
    length: number;
    tokenType: string;
    tokenModifiers: string[];
}

// ==================== SYMBOL TABLE ====================

export class SymbolTable {
    private symbols: Map<string, SymbolInformation> = new Map();
    private parent?: SymbolTable;
    private children: SymbolTable[] = [];

    constructor(parent?: SymbolTable) {
        this.parent = parent;
    }

    define(symbol: SymbolInformation): void {
        this.symbols.set(symbol.name, symbol);
    }

    resolve(name: string): SymbolInformation | undefined {
        const symbol = this.symbols.get(name);
        if (symbol) return symbol;
        if (this.parent) return this.parent.resolve(name);
        return undefined;
    }

    getAllSymbols(): SymbolInformation[] {
        return Array.from(this.symbols.values());
    }

    createChild(): SymbolTable {
        const child = new SymbolTable(this);
        this.children.push(child);
        return child;
    }
}

// ==================== LANGUAGE SERVER ====================

export class PortulLanguageServer {
    private symbolTable: SymbolTable = new SymbolTable();
    private documentSymbols: Map<string, SymbolInformation[]> = new Map();

    constructor() {
        this.initializeBuiltins();
    }

    private initializeBuiltins(): void {
        // Register built-in types
        PORTUL_TYPES.forEach(type => {
            this.symbolTable.define({
                name: type,
                kind: SymbolKind.TypeParameter,
                location: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                scope: 'global',
                type: 'builtin-type'
            });
        });

        // Register built-in functions
        PORTUL_BUILTINS.forEach(builtin => {
            this.symbolTable.define({
                name: builtin,
                kind: SymbolKind.Function,
                location: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                scope: 'global',
                type: 'builtin-function'
            });
        });
    }

    // ==================== CODE COMPLETION ====================

    provideCompletionItems(code: string, position: Position): CompletionItem[] {
        const lines = code.split('\n');
        const currentLine = lines[position.line] || '';
        const textBeforeCursor = currentLine.substring(0, position.character);
        const lastWord = this.getLastWord(textBeforeCursor);

        const completions: CompletionItem[] = [];

        // Context-aware completion
        const context = this.analyzeContext(textBeforeCursor, lines, position);

        if (context.expectingType) {
            // Complete types
            PORTUL_TYPES.forEach(type => {
                completions.push({
                    label: type,
                    kind: CompletionItemKind.TypeParameter,
                    detail: `Type: ${type}`,
                    documentation: this.getTypeDocumentation(type),
                    sortText: `0_${type}`
                });
            });
        } else if (context.expectingOperation) {
            // Complete operations
            PORTUL_OPERATIONS.forEach(op => {
                completions.push({
                    label: op,
                    kind: CompletionItemKind.Operator,
                    detail: `Operation: ${op}`,
                    documentation: this.getOperationDocumentation(op),
                    insertText: `${op} `,
                    sortText: `0_${op}`
                });
            });
        } else {
            // General keyword completion
            PORTUL_KEYWORDS.forEach(keyword => {
                if (keyword.startsWith(lastWord)) {
                    completions.push({
                        label: keyword,
                        kind: CompletionItemKind.Keyword,
                        detail: `Keyword: ${keyword}`,
                        documentation: this.getKeywordDocumentation(keyword),
                        sortText: `1_${keyword}`
                    });
                }
            });

            // Variable completion
            const visibleSymbols = this.symbolTable.getAllSymbols();
            visibleSymbols.forEach(symbol => {
                if (symbol.name.startsWith(lastWord) && symbol.kind === SymbolKind.Variable) {
                    completions.push({
                        label: symbol.name,
                        kind: CompletionItemKind.Variable,
                        detail: `${symbol.type || 'unknown'}`,
                        documentation: `Variable: ${symbol.name}`,
                        sortText: `2_${symbol.name}`
                    });
                }
            });

            // Snippet completion
            completions.push(...this.getSnippets(context));
        }

        return completions;
    }

    private analyzeContext(textBeforeCursor: string, lines: string[], position: Position): {
        expectingType: boolean;
        expectingOperation: boolean;
        inClass: boolean;
        inFunction: boolean;
    } {
        const trimmed = textBeforeCursor.trim();
        
        // Check if we're in a class definition
        let inClass = false;
        let inFunction = false;
        for (let i = 0; i <= position.line; i++) {
            if (lines[i].match(/^\s*class\s+/)) inClass = true;
            if (lines[i].match(/^\s*public\s+/) || lines[i].match(/^\s*private\s+/)) inFunction = true;
        }

        return {
            expectingType: /^\s*(num|txt|obj|ary|ptr)?\s*$/.test(trimmed) || /^\s*$/.test(trimmed),
            expectingOperation: /^\s*\w+\s+$/.test(trimmed),
            inClass,
            inFunction
        };
    }

    private getSnippets(context: any): CompletionItem[] {
        const snippets: CompletionItem[] = [];

        snippets.push({
            label: 'for-loop',
            kind: CompletionItemKind.Snippet,
            detail: 'For loop snippet',
            insertText: 'for i 0 ${1:10} {\n    ${2:// body}\n}',
            documentation: 'Creates a for loop',
            sortText: '3_for'
        });

        snippets.push({
            label: 'if-condition',
            kind: CompletionItemKind.Snippet,
            detail: 'If condition snippet',
            insertText: 'if ${1:equ} ${2:var1} ${3:var2} {\n    ${4:// body}\n}',
            documentation: 'Creates an if statement',
            sortText: '3_if'
        });

        snippets.push({
            label: 'class-definition',
            kind: CompletionItemKind.Snippet,
            detail: 'Class definition snippet',
            insertText: 'class ${1:ClassName} {\n    private ${2:type} ${3:field};\n\n    new ${1:ClassName} ${2:type} ${3:field} {\n        mov this.${3:field} ${3:field};\n    }\n}',
            documentation: 'Creates a class definition',
            sortText: '3_class'
        });

        return snippets;
    }

    // ==================== HOVER INFORMATION ====================

    provideHover(code: string, position: Position): Hover | null {
        const word = this.getWordAtPosition(code, position);
        if (!word) return null;

        // Check if it's a keyword
        if (PORTUL_KEYWORDS.has(word)) {
            return {
                contents: this.getKeywordDocumentation(word),
                range: this.getWordRange(code, position)
            };
        }

        // Check if it's a type
        if (PORTUL_TYPES.has(word)) {
            return {
                contents: this.getTypeDocumentation(word),
                range: this.getWordRange(code, position)
            };
        }

        // Check if it's an operation
        if (PORTUL_OPERATIONS.has(word)) {
            return {
                contents: this.getOperationDocumentation(word),
                range: this.getWordRange(code, position)
            };
        }

        // Check symbol table
        const symbol = this.symbolTable.resolve(word);
        if (symbol) {
            return {
                contents: `**${symbol.name}**: ${symbol.type || 'unknown'}\n\nScope: ${symbol.scope}`,
                range: this.getWordRange(code, position)
            };
        }

        return null;
    }

    // ==================== SIGNATURE HELP ====================

    provideSignatureHelp(code: string, position: Position): SignatureHelp | null {
        const lines = code.split('\n');
        const currentLine = lines[position.line];
        
        // Find the operation being typed
        const beforeCursor = currentLine.substring(0, position.character);
        const match = beforeCursor.match(/(\w+)\s+([^\s]*)\s*$/);
        
        if (!match) return null;

        const operation = match[1];
        
        if (PORTUL_OPERATIONS.has(operation)) {
            return {
                signatures: [{
                    label: `${operation} <var> <value>`,
                    documentation: this.getOperationDocumentation(operation),
                    parameters: [
                        { label: '<var>', documentation: 'Target variable' },
                        { label: '<value>', documentation: 'Value or source variable' }
                    ]
                }],
                activeSignature: 0,
                activeParameter: match[2] ? 1 : 0
            };
        }

        return null;
    }

    // ==================== SYMBOL ANALYSIS ====================

    analyzeDocument(code: string, documentUri: string): SymbolInformation[] {
        const symbols: SymbolInformation[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // Variable declarations
            const varMatch = line.match(/^\s*(num|txt|obj|ary|ptr)\s+(\w+)/);
            if (varMatch) {
                const symbol: SymbolInformation = {
                    name: varMatch[2],
                    kind: SymbolKind.Variable,
                    type: varMatch[1],
                    scope: 'local',
                    location: {
                        start: { line: index, character: line.indexOf(varMatch[2]) },
                        end: { line: index, character: line.indexOf(varMatch[2]) + varMatch[2].length }
                    }
                };
                symbols.push(symbol);
                this.symbolTable.define(symbol);
            }

            // Class declarations
            const classMatch = line.match(/^\s*class\s+(\w+)/);
            if (classMatch) {
                const symbol: SymbolInformation = {
                    name: classMatch[1],
                    kind: SymbolKind.Class,
                    scope: 'global',
                    location: {
                        start: { line: index, character: line.indexOf(classMatch[1]) },
                        end: { line: index, character: line.indexOf(classMatch[1]) + classMatch[1].length }
                    }
                };
                symbols.push(symbol);
                this.symbolTable.define(symbol);
            }

            // Method declarations
            const methodMatch = line.match(/^\s*(public|private)\s+(\w+)/);
            if (methodMatch) {
                const symbol: SymbolInformation = {
                    name: methodMatch[2],
                    kind: SymbolKind.Method,
                    scope: 'class',
                    location: {
                        start: { line: index, character: line.indexOf(methodMatch[2]) },
                        end: { line: index, character: line.indexOf(methodMatch[2]) + methodMatch[2].length }
                    }
                };
                symbols.push(symbol);
            }
        });

        this.documentSymbols.set(documentUri, symbols);
        return symbols;
    }

    // ==================== SEMANTIC TOKENS ====================

    provideSemanticTokens(code: string): SemanticToken[] {
        const tokens: SemanticToken[] = [];
        const lines = code.split('\n');

        lines.forEach((line, lineIndex) => {
            // Tokenize keywords
            PORTUL_KEYWORDS.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                let match;
                while ((match = regex.exec(line)) !== null) {
                    tokens.push({
                        line: lineIndex,
                        startChar: match.index,
                        length: keyword.length,
                        tokenType: 'keyword',
                        tokenModifiers: []
                    });
                }
            });

            // Tokenize types
            PORTUL_TYPES.forEach(type => {
                const regex = new RegExp(`\\b${type}\\b`, 'g');
                let match;
                while ((match = regex.exec(line)) !== null) {
                    tokens.push({
                        line: lineIndex,
                        startChar: match.index,
                        length: type.length,
                        tokenType: 'type',
                        tokenModifiers: []
                    });
                }
            });

            // Tokenize operations
            PORTUL_OPERATIONS.forEach(op => {
                const regex = new RegExp(`\\b${op}\\b`, 'g');
                let match;
                while ((match = regex.exec(line)) !== null) {
                    tokens.push({
                        line: lineIndex,
                        startChar: match.index,
                        length: op.length,
                        tokenType: 'operator',
                        tokenModifiers: []
                    });
                }
            });

            // Tokenize strings
            const stringRegex = /"([^"]*)"/g;
            let stringMatch;
            while ((stringMatch = stringRegex.exec(line)) !== null) {
                tokens.push({
                    line: lineIndex,
                    startChar: stringMatch.index,
                    length: stringMatch[0].length,
                    tokenType: 'string',
                    tokenModifiers: []
                });
            }

            // Tokenize numbers
            const numberRegex = /\b\d+\b/g;
            let numberMatch;
            while ((numberMatch = numberRegex.exec(line)) !== null) {
                tokens.push({
                    line: lineIndex,
                    startChar: numberMatch.index,
                    length: numberMatch[0].length,
                    tokenType: 'number',
                    tokenModifiers: []
                });
            }
        });

        return tokens;
    }

    // ==================== UTILITY METHODS ====================

    private getLastWord(text: string): string {
        const match = text.match(/(\w+)$/);
        return match ? match[1] : '';
    }

    private getWordAtPosition(code: string, position: Position): string | null {
        const lines = code.split('\n');
        const line = lines[position.line];
        if (!line) return null;

        const beforeCursor = line.substring(0, position.character);
        const afterCursor = line.substring(position.character);

        const beforeMatch = beforeCursor.match(/(\w+)$/);
        const afterMatch = afterCursor.match(/^(\w+)/);

        const before = beforeMatch ? beforeMatch[1] : '';
        const after = afterMatch ? afterMatch[1] : '';

        return before + after || null;
    }

    private getWordRange(code: string, position: Position): Range {
        const lines = code.split('\n');
        const line = lines[position.line];
        const word = this.getWordAtPosition(code, position);
        
        if (!word) {
            return { start: position, end: position };
        }

        const start = line.indexOf(word, Math.max(0, position.character - word.length));
        
        return {
            start: { line: position.line, character: start },
            end: { line: position.line, character: start + word.length }
        };
    }

    // ==================== DOCUMENTATION ====================

    private getKeywordDocumentation(keyword: string): string {
        const docs: Record<string, string> = {
            'if': '**if** - Conditional statement\n\nUsage: `if <condition> <var1> <var2> { ... }`\n\nExample: `if equ x 10 { put "equal" }`',
            'for': '**for** - Loop construct\n\nUsage: `for <var> <start> <end> { ... }`\n\nExample: `for i 0 10 { put i }`',
            'class': '**class** - Define a class\n\nUsage: `class <ClassName> { ... }`',
            'new': '**new** - Constructor method\n\nUsage: `new <ClassName> <params> { ... }`',
            'public': '**public** - Public method/field\n\nUsage: `public <name> <params> { ... }`',
            'private': '**private** - Private method/field\n\nUsage: `private <name> <params> { ... }`',
            'put': '**put** - Output function\n\nUsage: `put <value>`\n\nExample: `put "Hello"`',
            'use': '**use** - Import module\n\nUsage: `use "<module>"`',
            'ret': '**ret** - Return from function\n\nUsage: `ret <value>`',
            'mov': '**mov** - Move ownership\n\nUsage: `mov <dest> <source>`'
        };
        return docs[keyword] || `**${keyword}** - Portul keyword`;
    }

    private getTypeDocumentation(type: string): string {
        const docs: Record<string, string> = {
            'num': '**num** - Numeric type\n\nStores integer or floating-point numbers.\n\nExample: `num x = 42`',
            'txt': '**txt** - Text/String type\n\nStores text data.\n\nExample: `txt name = "Portul"`',
            'obj': '**obj** - Object type\n\nStores object instances.\n\nExample: `obj logger = Logger.new`',
            'ary': '**ary** - Array type\n\nStores arrays of values.\n\nExample: `ary numbers = [1, 2, 3]`',
            'ptr': '**ptr** - Pointer type\n\nStores memory addresses.\n\nExample: `ptr ref = &x`'
        };
        return docs[type] || `**${type}** - Portul type`;
    }

    private getOperationDocumentation(op: string): string {
        const docs: Record<string, string> = {
            'add': '**add** - Addition operation\n\nUsage: `add <target> <value>`\n\nAdds value to target (target = target + value)\n\nExample: `add x 5`',
            'sub': '**sub** - Subtraction operation\n\nUsage: `sub <target> <value>`\n\nSubtracts value from target (target = target - value)',
            'mul': '**mul** - Multiplication operation\n\nUsage: `mul <target> <value>`\n\nMultiplies target by value (target = target * value)',
            'div': '**div** - Division operation\n\nUsage: `div <target> <value>`\n\nDivides target by value (target = target / value)',
            'inc': '**inc** - Increment operation\n\nUsage: `inc <var>`\n\nIncrements variable by 1 (var = var + 1)\n\n⚡ More efficient than `add var 1`',
            'gt': '**gt** - Greater than comparison\n\nUsage: `if gt <var1> <var2> { ... }`\n\nReturns true if var1 > var2',
            'lt': '**lt** - Less than comparison\n\nUsage: `if lt <var1> <var2> { ... }`\n\nReturns true if var1 < var2',
            'equ': '**equ** - Equality comparison\n\nUsage: `if equ <var1> <var2> { ... }`\n\nReturns true if var1 == var2'
        };
        return docs[op] || `**${op}** - Portul operation`;
    }

    // ==================== DIAGNOSTICS ====================

    provideDiagnostics(code: string): Array<{ line: number; message: string; severity: string }> {
        // This will be integrated with nativeAiService
        return [];
    }
}

// ==================== SINGLETON INSTANCE ====================

let languageServerInstance: PortulLanguageServer | null = null;

export function getLanguageServer(): PortulLanguageServer {
    if (!languageServerInstance) {
        languageServerInstance = new PortulLanguageServer();
    }
    return languageServerInstance;
}

// Export class with alias for compatibility
export { PortulLanguageServer as LanguageServer };
export type HoverInfo = Hover;
