import { PortulLexer } from './lexer.js';
import { PortulParser } from './parser.js';
import { SemanticAnalyzer } from './semanticAnalyzer.js';
import { IRGenerator } from './irGenerator.js';
import { LLVMCompiler } from './llvmCompiler.js';

export class PortulCompiler {
  constructor() {
    this.lexer = new PortulLexer();
    this.parser = new PortulParser();
    this.analyzer = new SemanticAnalyzer();
    this.irGen = new IRGenerator();
    this.llvmCompiler = new LLVMCompiler();
  }

  parse(code) {
    // Lexer: Tokenizar
    const tokens = this.lexer.tokenize(code);
    
    // Parser: Build AST
    const ast = this.parser.parse(tokens);
    
    return ast;
  }

  semanticCheck(ast) {
    // Semantic analysis: symbol table, type checking, etc.
    const errors = this.analyzer.analyze(ast);
    
    if (errors.length > 0) {
      const errorMsg = errors.map(e => `${e.line}:${e.column} - ${e.message}`).join('\n');
      throw new Error(`Error semántico:\n${errorMsg}`);
    }
    
    return true;
  }

  generateIR(ast) {
    // Generate LLVM IR from AST
    const ir = this.irGen.generate(ast);
    return ir;
  }

  compile(ir, target = 'windows-x64') {
    // Compilar IR a ejecutable usando LLVM
    const exeBuffer = this.llvmCompiler.compile(ir, target);
    return exeBuffer;
  }
}
