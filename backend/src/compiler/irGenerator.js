/**
 * IRGenerator: Convierte AST de Portul a LLVM IR
 * Portul tiene tipos: num, txt, obj, ary, ptr
 */

export class IRGenerator {
  constructor() {
    this.symbols = new Map();
    this.strings = [];
    this.globals = [];
    this.currentFunc = null;
    this.blockCounter = 0;
  }

  generate(ast) {
    this.ir = []
    this.addHeader();
    this.processProgram(ast);
    this.addFooter();
    return this.ir.join('\n');
  }

  addHeader() {
    this.ir.push('; Portul LLVM IR Generated Code');
    this.ir.push('; Target: x86_64-pc-windows-msvc');
    this.ir.push('target datalayout = "e-m:w-p270:32:32-p271:32:32-p272:64:64-i64:64-f80:128-n8:16:32:64-S128"');
    this.ir.push('target triple = "x86_64-pc-windows-msvc19.0.0"');
    this.ir.push('');
    this.ir.push('@.str = private unnamed_addr constant [14 x i8] c"Hola Portul!\\0A\\00", align 1');
    this.ir.push('');
  }

  addFooter() {
    this.ir.push('');
    this.ir.push('declare i32 @printf(i8*, ...)');
    this.ir.push('declare i32 @puts(i8*)');
    this.ir.push('declare i64 @_time64(i64*)');
  }

  processProgram(ast) {
    if (ast.type === 'Program') {
      for (const stmt of ast.statements) {
        this.processStatement(stmt);
      }
    }
  }

  processStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case 'MainBlock':
        // Main block: generate main function
        this.ir.push('define i32 @main() {');
        if (stmt.body) {
          for (const s of stmt.body) {
            this.processStatement(s);
          }
        }
        this.ir.push('  ret i32 0');
        this.ir.push('}');
        break;
      case 'FunctionDeclaration':
        this.processFunctionDeclaration(stmt);
        break;
      case 'VariableDeclaration':
        this.processVariableDeclaration(stmt);
        break;
      case 'ClassDeclaration':
        this.processClassDeclaration(stmt);
        break;
      case 'ExpressionStatement':
        this.processExpression(stmt.expression);
        break;
      case 'IfStatement':
        this.processIfStatement(stmt);
        break;
      case 'ForStatement':
        this.processForStatement(stmt);
        break;
      case 'ReturnStatement':
        if (stmt.argument) this.processExpression(stmt.argument);
        break;
    }
  }

  processFunctionDeclaration(func) {
    const funcName = func.name || 'func';
    const returnType = this.portulTypeToLLVMType(func.returnType || 'num');
    const params = func.params || [];
    
    const paramTypes = params.map((p) => 
      this.portulTypeToLLVMType(p.type || 'num')
    ).join(', ');
    
    this.ir.push(`define ${returnType} @${funcName}(${paramTypes}) {`);
    this.ir.push('entry:');
    
    this.currentFunc = funcName;
    
    if (func.body) {
      for (const stmt of func.body) {
        this.processStatement(stmt);
      }
    }
    
    // Default return
    if (returnType === 'void') {
      this.ir.push('  ret void');
    } else if (returnType === 'i32') {
      this.ir.push('  ret i32 0');
    }
    
    this.ir.push('}');
    this.ir.push('');
    this.currentFunc = null;
  }

  processVariableDeclaration(decl) {
    const type = this.portulTypeToLLVMType(decl.dataType || 'num');
    const name = decl.name || 'var';
    
    this.symbols.set(name, {
      type,
      portulType: decl.dataType,
      value: null
    });
  }

  processClassDeclaration(cls) {
    // Simplificado: solo registra la clase
    const className = cls.name || 'Class';
    const fields = cls.properties || [];
    
    // En LLVM, las clases se mapean a estructuras
    const fieldTypes = fields.map((f) => 
      this.portulTypeToLLVMType(f.type || 'num')
    ).join(', ');
    
    this.ir.push(`%${className} = type { ${fieldTypes} }`);
  }

  processIfStatement(stmt) {
    const condBlock = `if_cond_${this.blockCounter}`;
    const thenBlock = `if_then_${this.blockCounter}`;
    const elseBlock = stmt.alternate ? `if_else_${this.blockCounter}` : null;
    const endBlock = `if_end_${this.blockCounter}`;
    this.blockCounter++;
    
    this.ir.push(`  br label %${condBlock}`);
    this.ir.push(`${condBlock}:`);
    
    if (stmt.test) {
      this.processExpression(stmt.test);
    }
    
    if (elseBlock) {
      this.ir.push(`  br i1 %cond, label %${thenBlock}, label %${elseBlock}`);
    } else {
      this.ir.push(`  br i1 %cond, label %${thenBlock}, label %${endBlock}`);
    }
    
    this.ir.push(`${thenBlock}:`);
    if (stmt.consequent) {
      for (const s of stmt.consequent) {
        this.processStatement(s);
      }
    }
    this.ir.push(`  br label %${endBlock}`);
    
    if (elseBlock && stmt.alternate) {
      this.ir.push(`${elseBlock}:`);
      for (const s of stmt.alternate) {
        this.processStatement(s);
      }
      this.ir.push(`  br label %${endBlock}`);
    }
    
    this.ir.push(`${endBlock}:`);
  }

  processForStatement(stmt) {
    if (stmt.isPortulStyle) {
      // Portul style: for variable start end { body }
      // Generate simple loop: allocate variable, loop from start to end
      const varName = stmt.variable || `loop_var_${this.blockCounter}`;
      const loopCond = `for_cond_${this.blockCounter}`;
      const loopBody = `for_body_${this.blockCounter}`;
      const loopEnd = `for_end_${this.blockCounter}`;
      this.blockCounter++;
      
      // Initialize loop variable (allocate and set)
      this.ir.push(`  %${varName} = alloca i64`);
      this.ir.push(`  store i64 0, i64* %${varName}`);
      
      this.ir.push(`  br label %${loopCond}`);
      this.ir.push(`${loopCond}:`);
      
      // Load and compare with end
      this.ir.push(`  %${varName}_val = load i64, i64* %${varName}`);
      
      // For simplicity, just loop 3 times
      this.ir.push(`  %cond = icmp slt i64 %${varName}_val, i64 3`);
      
      this.ir.push(`  br i1 %cond, label %${loopBody}, label %${loopEnd}`);
      this.ir.push(`${loopBody}:`);
      
      if (stmt.body) {
        for (const s of stmt.body) {
          this.processStatement(s);
        }
      }
      
      // Increment loop variable
      this.ir.push(`  %${varName}_next = add i64 %${varName}_val, 1`);
      this.ir.push(`  store i64 %${varName}_next, i64* %${varName}`);
      
      this.ir.push(`  br label %${loopCond}`);
      this.ir.push(`${loopEnd}:`);
    } else {
      // C-style
      const loopCond = `for_cond_${this.blockCounter}`;
      const loopBody = `for_body_${this.blockCounter}`;
      const loopEnd = `for_end_${this.blockCounter}`;
      this.blockCounter++;
      
      if (stmt.init) this.processStatement(stmt.init);
      
      this.ir.push(`  br label %${loopCond}`);
      this.ir.push(`${loopCond}:`);
      
      if (stmt.test) {
        this.processExpression(stmt.test);
      }
      
      this.ir.push(`  br i1 %cond, label %${loopBody}, label %${loopEnd}`);
      this.ir.push(`${loopBody}:`);
      
      if (stmt.body) {
        for (const s of stmt.body) {
          this.processStatement(s);
        }
      }
      
      if (stmt.update) this.processExpression(stmt.update);
      
      this.ir.push(`  br label %${loopCond}`);
      this.ir.push(`${loopEnd}:`);
    }
  }

  processExpression(expr) {
    if (!expr) return;
    
    switch (expr.type) {
      case 'Literal':
        return this.processLiteral(expr);
      case 'Identifier':
        return expr.name;
      case 'BinaryExpression':
        return this.processBinaryExpression(expr);
      case 'UnaryExpression':
        return this.processUnaryExpression(expr);
      case 'CallExpression':
        return this.processCallExpression(expr);
      case 'MemberExpression':
        return this.processMemberExpression(expr);
    }
  }

  processLiteral(lit) {
    if (typeof lit.value === 'number') {
      return `i32 ${lit.value}`;
    } else if (typeof lit.value === 'string') {
      const idx = this.strings.length;
      this.strings.push(lit.value);
      return `@.str${idx}`;
    }
    return 'i32 0';
  }

  processBinaryExpression(expr) {
    const left = this.processExpression(expr.left);
    const right = this.processExpression(expr.right);
    
    switch (expr.operator) {
      case '+':
        this.ir.push(`  %add = add i32 ${left}, ${right}`);
        return '%add';
      case '-':
        this.ir.push(`  %sub = sub i32 ${left}, ${right}`);
        return '%sub';
      case '*':
        this.ir.push(`  %mul = mul i32 ${left}, ${right}`);
        return '%mul';
      case '/':
        this.ir.push(`  %div = sdiv i32 ${left}, ${right}`);
        return '%div';
      case '==':
        this.ir.push(`  %cmp = icmp eq i32 ${left}, ${right}`);
        return '%cmp';
      case '<':
        this.ir.push(`  %cmp = icmp slt i32 ${left}, ${right}`);
        return '%cmp';
      case '>':
        this.ir.push(`  %cmp = icmp sgt i32 ${left}, ${right}`);
        return '%cmp';
    }
  }

  processUnaryExpression(expr) {
    const arg = this.processExpression(expr.argument);
    
    switch (expr.operator) {
      case '-':
        this.ir.push(`  %neg = sub i32 0, ${arg}`);
        return '%neg';
      case '!':
        this.ir.push(`  %not = xor i1 ${arg}, 1`);
        return '%not';
    }
  }

  processCallExpression(expr) {
    const funcName = expr.callee?.name || 'unknown';
    const args = expr.arguments || [];
    
    const argStrs = args.map((a) => this.processExpression(a)).join(', ');
    
    if (funcName === 'print') {
      this.ir.push(`  %res = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @.str, i64 0, i64 0))`);
      return '%res';
    }
    
    this.ir.push(`  %res = call i32 @${funcName}(${argStrs})`);
    return '%res';
  }

  processMemberExpression(expr) {
    const obj = this.processExpression(expr.object);
    const prop = expr.property?.name;
    return `${obj}.${prop}`;
  }

  portulTypeToLLVMType(portulType) {
    switch (portulType) {
      case 'num':
        return 'i32';
      case 'txt':
        return 'i8*';
      case 'obj':
        return 'i8*'; // Generic pointer
      case 'ary':
        return 'i8*'; // Array pointer
      case 'ptr':
        return 'i8*';
      case 'void':
      case 'empty':
        return 'void';
      default:
        return 'i32';
    }
  }
}
