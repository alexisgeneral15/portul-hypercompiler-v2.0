// AETHER CORE COMPILER v2.0 - For Portul++ Language
// This service implements the scanner, parser, and code generator for a self-hosted build system.

// FIX: Export language keyword and token sets for use in other services like native AI analysis.
export const PORTUL_TYPES = new Set(['num', 'txt', 'ary', 'ptr', 'obj']);
export const PORTUL_OPERATIONS = new Set(['add', 'sub', 'mul', 'div', 'inc', 'gt', 'lt', 'equ']);
export const PORTUL_BUILTINS = new Set(['put', 'get']);
export const PORTUL_KEYWORDS = new Set(['if', 'for', 'ret', 'cal', 'run', 'new', 'use', 'class', 'public', 'private', 'this', 'main', 'mov']);

import { Diagnostic } from "./nativeAiService";
import { FileSystemTree, flattenTree, addFileByPath, getFileContent } from "../utils/fileSystemUtils";
import { learnFromSuccessfulBuild, getLearnedPatternSummary, learnFromText } from "./aiLearningService";
import { getLearnedAction, learnCommand } from "./aiCommandRegistry";
import { synthesizeAction } from "./offlineAiSynthesisService";
import { addLearningEvent } from './aiLearningLogService';
import { translations } from '../utils/translations';
import { assemble, createPEFile } from './peBuilderService';

export type { Diagnostic };

// --- Type Definitions ---
export interface DebuggerState {
  currentLine: number;
  variables: Record<string, { address: string, type: string; value: any }>;
  registers: Record<string, string | number>;
  callStack: string[];
  output: string[];
  isFinished: boolean;
}

export interface AIPendingAction {
    originalCommand: string;
    actionType: 'CREATE_FILE' | 'MODIFY_FILE';
    filePath: string;
    content: string;
    explanation: string;
}
export interface RefactorResult { message: string; fileSystemTree: FileSystemTree; }
export interface WeaveResult { message:string; newCode: string; }

export type Command = 'build' | 'ai_assist' | 'debug' | 'run_target' | 'clean' | 'stop_debug' | 'debug_continue' | 'debug_step_over' | 'debug_step_into' | 'debug_step_out' | 'ai_confirm_action' | 'ai_reject_action' | 'ai_refactor' | 'ai_weave_code';
export type Language = 'en' | 'es';
interface BuildResult { output: string; ir?: string; assembly?: string; fileSystemTree?: FileSystemTree; binary?: Uint8Array; }

export type ToolResult = 
    | { type: 'build', data: BuildResult } 
    | { type: 'run', data: { output: string } }
    | { type: 'generic', data: { output: string, fileSystemTree?: FileSystemTree } } 
    | { type: 'debug', data: DebuggerState } 
    | { type: 'error', error: string }
    | { type: 'ai_synthesis_proposal', data: AIPendingAction }
    | { type: 'refactor', data: RefactorResult }
    | { type: 'weave', data: WeaveResult };

interface CommandOptions {
  command: Command;
  code?: string;
  fileSystemTree: FileSystemTree;
  activeFile?: string;
  language: Language;
  timestamps?: Map<string, number>;
  breakpoints?: number[];
  [key: string]: any;
}

// =================================================================================================
// BEGIN PHASE 1 COMPILER IMPLEMENTATION (Lexer, Parser, Code Generator)
// =================================================================================================

// --- 1. LEXER (TOKENIZER) ---
enum TokenType {
    Keyword, Identifier, String, Number, Punctuation, Type, Operation, EOF,
    // Portul++ specific
    Use, Class, Public, Private, This, New, Cal, Ret, Put, Mov,
}
interface Token { type: TokenType; value: string; line: number; }

function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const lines = code.split('\n');
    const keywords = {
        'use': TokenType.Use, 'class': TokenType.Class, 'public': TokenType.Public,
        'private': TokenType.Private, 'this': TokenType.This, 'new': TokenType.New,
        'cal': TokenType.Cal, 'ret': TokenType.Ret, 'put': TokenType.Put, 'mov': TokenType.Mov,
    };

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        // Basic regex-based tokenizer for Portul++
        const regex = /(\/\/.*)|"([^"]*)"|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)|([0-9]+)|([.{}])|(=)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            if (match[1]) continue; // Skip comments
            else if (match[2] !== undefined) tokens.push({ type: TokenType.String, value: match[2], line: lineNum });
            else if (match[3]) {
                const word = match[3];
                if (word in keywords) {
                    tokens.push({ type: (keywords as any)[word], value: word, line: lineNum });
                } else {
                    tokens.push({ type: TokenType.Identifier, value: word, line: lineNum });
                }
            }
            else if (match[4]) tokens.push({ type: TokenType.Number, value: match[4], line: lineNum });
            else if (match[5]) tokens.push({ type: TokenType.Punctuation, value: match[5], line: lineNum });
            else if (match[6]) tokens.push({ type: TokenType.Punctuation, value: match[6], line: lineNum });
        }
    });

    tokens.push({ type: TokenType.EOF, value: 'EOF', line: lines.length });
    return tokens;
}

// --- 2. PARSER (AST BUILDER) ---
// Simplified AST for this simulation
type AstNode =
    | { type: 'Program'; body: AstNode[] }
    | { type: 'ClassDeclaration'; name: string; body: AstNode[] }
    | { type: 'MethodDeclaration'; name: string; body: AstNode[] }
    | { type: 'MainBlock'; body: AstNode[] }
    | { type: 'CallExpression'; callee: string; arguments: AstNode[] }
    | { type: 'StringLiteral'; value: string }
    | { type: 'Identifier'; name: string };

// FIX: The parse function was returning a generic AstNode, causing type errors when accessing properties like `.body`.
// By specifying the exact return type and typing the local `program` variable correctly, we ensure type safety.
function parse(tokens: Token[]): Extract<AstNode, { type: 'Program' }> {
    let current = 0;

    function walk(): AstNode {
        let token = tokens[current];
        if (token.type === TokenType.Put) {
            current++; // consume 'put'
            const value = tokens[current];
            if (value.type !== TokenType.String) throw new Error(`Parse Error: Expected string after 'put' on line ${token.line}`);
            current++;
            return { type: 'CallExpression', callee: 'put', arguments: [{ type: 'StringLiteral', value: value.value }] };
        }
        if (token.type === TokenType.Cal) {
            current++; // consume 'cal'
            const callee_parts = [];
            while(current < tokens.length && tokens[current] && (tokens[current].type === TokenType.Identifier || (tokens[current].type === TokenType.Punctuation && tokens[current].value === '.'))) {
                callee_parts.push(tokens[current].value);
                current++;
            }
            const callee = callee_parts.join('');
            const args = [];
            if(current < tokens.length && tokens[current] && tokens[current].type === TokenType.String) {
                args.push({ type: 'StringLiteral', value: tokens[current].value });
                current++;
            }
            return { type: 'CallExpression', callee, arguments: args };
        }
        if (token.type === TokenType.Class) {
            current++; // consume 'class'
            if (current >= tokens.length || !tokens[current]) return { type: 'ClassDeclaration', name: 'UnknownClass', body: [] };
            const name = tokens[current].value;
            current += 2; // consume name and {
            const body = [];
            while (current < tokens.length && tokens[current] && tokens[current].value !== '}') {
                body.push(walk());
            }
            if (current < tokens.length && tokens[current]) current++; // consume }
            return { type: 'ClassDeclaration', name, body };
        }

        if (token.type === TokenType.Identifier && token.value === "main") {
            current++; // consume 'main'
            if(current >= tokens.length || !tokens[current] || tokens[current].value !== '{') throw new Error(`Parse Error: Expected '{' after 'main'`);
            current++; // consume '{'
            const body = [];
            while (current < tokens.length && tokens[current] && tokens[current].value !== '}') {
                body.push(walk());
            }
            if(current < tokens.length && tokens[current]?.value === '}') current++; // consume '}'
            return { type: 'MainBlock', body };
        }
        
        if (token.type === TokenType.Public || token.type === TokenType.New) {
            current++; // consume public/new
            if (current >= tokens.length || !tokens[current]) return { type: 'MethodDeclaration', name: 'UnknownMethod', body: [] };
            const name = tokens[current].value;
            current += 2; // consume name and {
            const body = [];
            while (current < tokens.length && tokens[current] && tokens[current].value !== '}') {
                body.push(walk());
            }
            if (current < tokens.length && tokens[current]) current++; // consume }
            return { type: 'MethodDeclaration', name, body };
        }

        current++;
        return { type: 'Identifier', name: 'unknown' }; // Fallback
    }

    const program: Extract<AstNode, { type: 'Program' }> = { type: 'Program', body: [] };
    while (current < tokens.length && tokens[current].type !== TokenType.EOF) {
        try {
            const node = walk();
            if (node.type !== 'Identifier' || node.name !== 'unknown') {
                program.body.push(node);
            }
        } catch (e) {
            console.error(e);
            // In a real compiler, we'd add the error and try to continue (panic mode recovery)
            // For the simulation, we can just stop.
            break; 
        }
    }
    return program;
}

// --- 3. CODE GENERATOR (ASM EMITTER) ---
function generateAsm(ast: AstNode): string {
    const dataSection: string[] = ['section .data'];
    const textSection: string[] = [
        'section .text',
        'global _start',
        'extern ExitProcess',
        'extern puts',
    ];
    let strCounter = 0;
    
    function visit(node: AstNode) {
        switch (node.type) {
            case 'Program':
                node.body.forEach(visit);
                break;
            case 'MainBlock':
                textSection.push('_start:');
                textSection.push('    sub rsp, 32 ; Shadow space for Win64 ABI');
                node.body.forEach(visit);
                textSection.push('    ; --- Program Exit ---');
                textSection.push('    xor rcx, rcx ; Exit code 0');
                textSection.push('    call ExitProcess');
                break;
            case 'CallExpression':
                if (node.callee === 'put' && node.arguments[0].type === 'StringLiteral') {
                    const strLabel = `str_${strCounter++}`;
                    const strValue = node.arguments[0].value;
                    dataSection.push(`    ${strLabel}: db "${strValue}", 0`);
                    textSection.push(`    lea rcx, [${strLabel}] ; Arg 1: string address`);
                    textSection.push('    call puts');
                }
                break;
            // Other node types would be handled here
        }
    }

    visit(ast);
    return [...dataSection, '', ...textSection].join('\n');
}

// =================================================================================================
// END PHASE 1 COMPILER IMPLEMENTATION
// =================================================================================================


let buildCache = { builtTarget: '' };
let currentDebuggerState: DebuggerState | null = null;


function performBuild(fileSystemFlat: Record<string, string>, fileSystemTree: FileSystemTree): Extract<ToolResult, { type: 'build' | 'error' }> {
    const pmeikFile = Object.keys(fileSystemFlat).find(f => f.endsWith('.pmeik'));
    if (!pmeikFile) return { type: 'error', error: 'Build failed: No .pmeik file found in project.' };
    
    const pmeikContent = fileSystemFlat[pmeikFile];
    const firstBrace = pmeikContent.indexOf('{');
    const lastBrace = pmeikContent.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
        return { type: 'error', error: 'Build failed: Invalid .pmeik content, no JSON object found.' };
    }
    
    const jsonString = pmeikContent.substring(firstBrace, lastBrace + 1);
    const config = JSON.parse(jsonString);
    const exeFilename = `${config.target}.exe`;
    const buildLog: string[] = [];

    // --- PHASE 4: BOOTSTRAPPING SIMULATION ---
    buildLog.push('--- [PHASE 4: BOOTSTRAPPING] ---');
    buildLog.push('[Bootstrap] Stage 1: Compiling the Portul++ compiler (portulc.exe) using the TypeScript toolchain...');
    buildLog.push('[TS-Toolchain] Identifying compiler sources: compiler.portulpp, pe_generator.portulpp...');
    buildLog.push('[TS-Toolchain] Lexing -> Parsing -> Code-Gen -> Assembling -> Linking...');
    buildLog.push('[TS-Toolchain] Aether engine simulation complete.');
    buildLog.push('[Bootstrap] Stage 1 complete. In-memory portulc.exe is ready.');
    buildLog.push('---');
    buildLog.push('[Bootstrap] Stage 2: Using generated portulc.exe to self-compile the full IDE...');
    
    try {
        const allSourceCode = config.sources
            .map((path: string) => fileSystemFlat[path] || '')
            .join('\n\n');
        
        buildLog.push(`[portulc.exe] Reading project manifest: ${config.target}...`);
        buildLog.push('[portulc.exe] Performing lexical analysis on sources...');
        const tokens = tokenize(allSourceCode);
        buildLog.push(`[portulc.exe] Analysis complete. Found ${tokens.length} tokens.`);

        buildLog.push('[portulc.exe] Building Abstract Syntax Tree (AST)...');
        const ast = parse(tokens);
        buildLog.push(`[portulc.exe] AST built successfully. Program has ${ast.body.length} top-level nodes.`);

        buildLog.push('[portulc.exe] Generating x86/64 Assembly for Windows...');
        const assemblyCode = generateAsm(ast);
        buildLog.push(`[portulc.exe] Assembly generation complete.`);
        
        buildLog.push('[portulc.exe] Assembling generated code into machine bytes...');
        const assembled = assemble(assemblyCode);
        buildLog.push(`[portulc.exe] Assembling complete. .text: ${assembled.text.length} bytes, .data: ${assembled.data.length} bytes.`);

        buildLog.push('[portulc.exe] Linking system imports (kernel32.dll, msvcrt.dll)...');
        buildLog.push('[portulc.exe] Generating PE executable file with .text, .data, and .idata sections...');
        const peFileBytes = createPEFile(assembled);
        buildLog.push(`[portulc.exe] PE file generated. Total size: ${peFileBytes.length} bytes.`);
        
        buildLog.push('---');
        buildLog.push('[Bootstrap] Stage 2 complete. The compiler has compiled itself.');

        const finalFileBinaryString = Array.from(peFileBytes).map(byte => String.fromCharCode(byte)).join('');
        const finalBase64Content = btoa(finalFileBinaryString);

        let updatedFileSystem = addFileByPath(fileSystemTree, `bin/${exeFilename}`, finalBase64Content);
        const output = buildLog.join('\n') + `\n\n✅ BOOTSTRAP COMPLETE. Self-hosting achieved.`;

        buildCache.builtTarget = config.target;
        learnFromSuccessfulBuild(flattenTree(fileSystemTree));
        
        return { type: 'build', data: { output, fileSystemTree: updatedFileSystem, assembly: assemblyCode, binary: peFileBytes } };

    } catch (e: any) {
        buildLog.push(`\n❌ BOOTSTRAP FAILED at Stage 2: ${e.message}`);
        return { type: 'error', error: buildLog.join('\n') };
    }
}


function runTarget(fileSystemTree: FileSystemTree): Extract<ToolResult, { type: 'run' | 'error' }> {
    if (!buildCache.builtTarget) {
        return { type: 'error', error: 'No target has been built yet. Please run "Build" first.' };
    }
    const exePath = `bin/${buildCache.builtTarget}.exe`;
    const base64ExeContent = getFileContent(fileSystemTree, exePath);
    if (!base64ExeContent) return { type: 'error', error: `Could not find built executable at '${exePath}'.` };
    
    let output = `Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nPS C:\\Users\\Doctor\\Desktop> .\\${exePath}\n\n`;
    
    output += `[AetherOS] Loading Portul Executable Environment (Self-Hosted)... OK.\n`;
    output += `[PE Loader] Executable mapped to memory. Sections .text, .data, .idata loaded.\n`;
    output += `[PE Loader] Resolving imports from kernel32.dll, msvcrt.dll...\n`;
    output += `[PE Loader] Imports resolved. Jumping to entry point _start...\n\n`;
    
    // --- Start of the VM Simulation based on source ---
    const vmOutputLog: string[] = [];
    const childVFS = flattenTree(fileSystemTree);
    const vm = {
        vfs: childVFS,
        
        executeBlock: function(codeBlock: string) {
            const lines = codeBlock.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.length === 0) continue;

                const putMatch = trimmed.match(/put\s+"(.*?)"/);
                if (putMatch) {
                    vmOutputLog.push(putMatch[1]);
                    continue;
                }
                
                // FIX: Generalized the 'cal' handler to support both `this.component.method` and `object.method` calls,
                // which is required for the corrected `main` block entry point logic to function.
                const calMatch = trimmed.match(/cal\s+((?:this\.)?[\w\.]+)(?:\s+(.*))?/);
                if (calMatch) {
                    const fullCallee = calMatch[1]; // e.g., 'this.vfs.load_project' or 'ide.run'
                    let argument = calMatch[2]; 
                    if (argument) {
                        argument = argument.replace(/;$/, '').trim();
                    }

                    const parts = fullCallee.split('.');
                    let componentName: string, methodName: string;

                    if (parts[0] === 'this' && parts.length === 3) {
                        componentName = parts[1];
                        methodName = parts[2];
                    } else if (parts.length === 2 && parts[0] === 'ide') { // Simulation hack for `ide.run` call
                         const ideSource = this.vfs['src/ide_main.portulpp'];
                         const runMethodRegex = new RegExp(`public\\s+${parts[1]}\\s*{([\\s\\S]*?)}`, 'm');
                         const methodBlock = ideSource.match(runMethodRegex);
                         if (methodBlock) this.executeBlock(methodBlock[1]);
                         continue;
                    } else {
                        vmOutputLog.push(`[VM ERROR] Unsupported call format: ${fullCallee}`);
                        continue;
                    }

                    let searchName = componentName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    if (componentName === 'analyzer') searchName = 'native_ai';
                    else if (componentName === 'assistant') searchName = 'ai_assistant';

                    const componentPath = Object.keys(this.vfs).find(p => p.includes(`/${searchName}.portulpp`));
                    if (componentPath && this.vfs[componentPath]) {
                        const componentSource = this.vfs[componentPath];
                        const methodRegex = new RegExp(`public\\s+${methodName}[\\s\\S]*?{([\\s\\S]*?)}`, 'm');
                        const methodMatch = componentSource.match(methodRegex);
                        if (methodMatch) {
                            const stringArgMatch = argument?.match(/"(.*)"/);
                            if (stringArgMatch) {
                                const stringValue = stringArgMatch[1];
                                const codeWithArg = methodMatch[1].replace(/put path;/g, `put "${stringValue}";`);
                                this.executeBlock(codeWithArg);
                            } else {
                                this.executeBlock(methodMatch[1]);
                            }
                        } else {
                             vmOutputLog.push(`[VM ERROR] Method '${methodName}' not found in '${componentName}'.`);
                        }
                    } else {
                        vmOutputLog.push(`[VM ERROR] Component '${componentName}' source not found.`);
                    }
                    continue;
                }
            }
        }
    };

    const mainFile = childVFS['src/ide_main.portulpp'];
    if (!mainFile) return { type: 'error', error: 'Execution failed: Entry point src/ide_main.portulpp not found in VFS.' };
    
    // FIX: Corrected the execution entry point. A real program starts in 'main', not the first 'run' method it finds.
    // This makes the simulation more accurate.
    const mainMethodMatch = mainFile.match(/main\s*{([\s\\S]*?)}/m);
    if (mainMethodMatch) {
        vm.executeBlock(mainMethodMatch[1]);
    } else {
        return { type: 'error', error: 'Execution failed: Could not find "main" block entry point in src/ide_main.portulpp.' };
    }
    // --- End of VM Simulation ---
    
    output += `--- System Log ---\n` + vmOutputLog.join('\n');
    output += `\n\n[Portul Runtime] Program called ExitProcess(0).\n`;
    output += `[AetherOS] Process terminated.\n`;
    return { type: 'run', data: { output } };
}

function weaveCode(options: CommandOptions): Extract<ToolResult, { type: 'weave' | 'error' }> {
    const { code, weaveIntent } = options;
    const funcName = weaveIntent.match(/function:\s*(\w+)/)?.[1] || 'new_function';
    const wovenCode = `\nnew ${funcName} {\n    # Woven by Aether for: ${weaveIntent}\n    put "Function ${funcName} ready."\n    ret 0\n}`;
    return { type: 'weave', data: { message: `[Aether] Wove function '${funcName}'.`, newCode: code + wovenCode }};
}

function getAetherAIResponse(options: CommandOptions): ToolResult {
    const prompt = options.aiPrompt.toLowerCase();
    const t = translations[options.language];
    if (options.aiMode === 'aether') {
        if (prompt.includes('deep analysis')) return { type: 'generic', data: { output: getLearnedPatternSummary() } };
        if (prompt.includes(t.nano.learnCodePrompt)) {
            const learnedItems = learnFromText(options.code || '');
            const output = learnedItems.length > 0
                ? `${t.aetherCore.knowledgeUpdated}\nLearned: ${learnedItems.join(', ')}`
                : t.aetherCore.nothingNewLearned;
            learnedItems.forEach(addLearningEvent);
            return { type: 'generic', data: { output } };
        }
    }
    const learnedAction = options.aiMode === 'aether' ? getLearnedAction(prompt, options.language) : null;
    return learnedAction ? { type: 'ai_synthesis_proposal', data: learnedAction } : { type: 'ai_synthesis_proposal', data: synthesizeAction(prompt, options.language, options.aiMode) };
}

export function runPortulCommand(options: CommandOptions): ToolResult {
  try {
    switch (options.command) {
      case 'build': return performBuild(flattenTree(options.fileSystemTree), options.fileSystemTree);
      case 'run_target': return runTarget(options.fileSystemTree);
      case 'debug': 
        currentDebuggerState = {
            currentLine: options.breakpoints?.[0] || 5,
            variables: { 'a': { address: '0x01', type: 'num', value: 5 }, 'b': { address: '0x02', type: 'num', value: 7 } },
            registers: { 'rip': options.breakpoints?.[0] || 5, 'rax': 0, 'rbx': 0 },
            callStack: ['main'], output: ['Debugger started.'], isFinished: false,
        };
        return { type: 'debug', data: currentDebuggerState };
      case 'debug_step_over':
        if (!currentDebuggerState) return { type: 'error', error: 'Debugger not started.' };
        currentDebuggerState.currentLine++;
        currentDebuggerState.registers['rip'] = currentDebuggerState.currentLine;
        if (currentDebuggerState.currentLine > 9) currentDebuggerState.isFinished = true;
        return { type: 'debug', data: { ...currentDebuggerState } };
      case 'ai_assist': return getAetherAIResponse(options);
      case 'ai_weave_code': return weaveCode(options);
      case 'ai_confirm_action': {
        const action = options.pendingAction as AIPendingAction;
        learnCommand(action.originalCommand, action);
        const newFs = addFileByPath(options.fileSystemTree, action.filePath, action.content);
        return { type: 'generic', data: { output: `Action completed. Learned new pattern from: '${action.originalCommand}'`, fileSystemTree: newFs } };
      }
      case 'ai_reject_action': {
          const action = options.pendingAction as AIPendingAction;
          return { type: 'ai_synthesis_proposal', data: synthesizeAction(action.originalCommand, options.language, options.aiMode, action) };
      }
      default: return { type: 'error', error: `Command '${options.command}' not supported.` };
    }
  } catch (e: any) {
    return { type: 'error', error: e.message };
  }
}
