/**
 * SemanticAnalyzer: Análisis semántico del código Portul
 */

export class SemanticAnalyzer {
  constructor() {
    this.errors = [];
    this.symbols = new Map();
    this.scopes = [new Map()]; // Stack de scopes
    this.currentScope = 0;
    this.initBuiltins();
  }

  initBuiltins() {
    // Agregar funciones built-in
    const builtins = [
      'put', 'inc', 'dec', 'add', 'sub', 'mul', 'div', 'mod',
      'cal', 'mov', 'ret', 'if', 'equ', 'neq', 'lt', 'gt', 'lte', 'geq',
      'and', 'or', 'not', 'for', 'while'
    ];

    for (const builtin of builtins) {
      this.scopes[0].set(builtin, {
        type: 'function',
        builtin: true,
        line: 0
      });
    }
  }

  analyze(ast) {
    this.errors = [];
    this.symbols = new Map();
    this.scopes = [new Map()];
    this.currentScope = 0;
    this.initBuiltins();

    if (ast.type === 'Program') {
      for (const stmt of ast.statements) {
        this.analyzeStatement(stmt);
      }
    }

    return this.errors;
  }

  analyzeStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case 'MainBlock':
        // Main block: push new scope for variables
        this.scopes.push(new Map());
        this.currentScope++;
        
        if (stmt.body) {
          for (const s of stmt.body) {
            this.analyzeStatement(s);
          }
        }
        
        // Pop scope
        this.scopes.pop();
        this.currentScope--;
        break;
      case 'VariableDeclaration':
        this.analyzeVariableDeclaration(stmt);
        break;
      case 'FunctionDeclaration':
        this.analyzeFunctionDeclaration(stmt);
        break;
      case 'ClassDeclaration':
        this.analyzeClassDeclaration(stmt);
        break;
      case 'IfStatement':
        this.analyzeIfStatement(stmt);
        break;
      case 'ForStatement':
        this.analyzeForStatement(stmt);
        break;
      case 'WhileStatement':
        this.analyzeWhileStatement(stmt);
        break;
      case 'ReturnStatement':
        this.analyzeReturnStatement(stmt);
        break;
      case 'ExpressionStatement':
        if (stmt.expression) {
          this.analyzeExpression(stmt.expression);
        }
        break;
    }
  }

  analyzeVariableDeclaration(decl) {
    const name = decl.name;
    const type = decl.dataType;

    // Check if already declared
    if (this.scopes[this.currentScope].has(name)) {
      this.addError(`Variable '${name}' ya está declarada`, decl);
    } else {
      this.scopes[this.currentScope].set(name, {
        type: 'variable',
        dataType: type,
        line: decl.line
      });
    }

    if (decl.init) {
      this.analyzeExpression(decl.init);
    }
  }

  analyzeFunctionDeclaration(func) {
    const name = func.name;

    // Register function
    this.symbols.set(name, {
      type: 'function',
      params: func.params || [],
      returnType: func.returnType || 'num'
    });

    // New scope for function body
    this.scopes.push(new Map());
    this.currentScope++;

    // Add parameters to scope
    for (const param of (func.params || [])) {
      this.scopes[this.currentScope].set(param.name, {
        type: 'parameter',
        dataType: param.type
      });
    }

    // Analyze body
    for (const stmt of (func.body || [])) {
      this.analyzeStatement(stmt);
    }

    // Exit scope
    this.scopes.pop();
    this.currentScope--;
  }

  analyzeClassDeclaration(cls) {
    const name = cls.name;

    // Register class
    this.symbols.set(name, {
      type: 'class',
      properties: cls.properties || [],
      methods: cls.methods || []
    });

    // Analyze methods
    for (const method of (cls.methods || [])) {
      this.analyzeFunctionDeclaration(method);
    }
  }

  analyzeIfStatement(stmt) {
    this.analyzeExpression(stmt.test);

    // Analyze consequent
    this.scopes.push(new Map());
    this.currentScope++;
    for (const s of (stmt.consequent || [])) {
      this.analyzeStatement(s);
    }
    this.scopes.pop();
    this.currentScope--;

    // Analyze alternate
    if (stmt.alternate) {
      this.scopes.push(new Map());
      this.currentScope++;
      for (const s of stmt.alternate) {
        this.analyzeStatement(s);
      }
      this.scopes.pop();
      this.currentScope--;
    }
  }

  analyzeForStatement(stmt) {
    if (stmt.isPortulStyle) {
      // Portul style: for variable start end { body }
      // Analizar start y end
      if (stmt.start) this.analyzeExpression(stmt.start);
      if (stmt.end) this.analyzeExpression(stmt.end);

      // New scope para la variable de loop
      this.scopes.push(new Map());
      this.currentScope++;
      
      // Declarar la variable de loop
      if (stmt.variable) {
        this.scopes[this.currentScope].set(stmt.variable, {
          type: 'variable',
          dataType: 'num',
          line: 0
        });
      }

      // Analizar body
      for (const s of (stmt.body || [])) {
        this.analyzeStatement(s);
      }
      
      this.scopes.pop();
      this.currentScope--;
    } else {
      // C-style
      if (stmt.init) this.analyzeStatement(stmt.init);
      if (stmt.test) this.analyzeExpression(stmt.test);
      if (stmt.update) this.analyzeExpression(stmt.update);

      // New scope for body
      this.scopes.push(new Map());
      this.currentScope++;
      for (const s of (stmt.body || [])) {
        this.analyzeStatement(s);
      }
      this.scopes.pop();
      this.currentScope--;
    }
  }

  analyzeWhileStatement(stmt) {
    this.analyzeExpression(stmt.test);

    // New scope for body
    this.scopes.push(new Map());
    this.currentScope++;
    for (const s of (stmt.body || [])) {
      this.analyzeStatement(s);
    }
    this.scopes.pop();
    this.currentScope--;
  }

  analyzeReturnStatement(stmt) {
    if (stmt.argument) {
      this.analyzeExpression(stmt.argument);
    }
  }

  analyzeExpression(expr) {
    if (!expr) return null;

    switch (expr.type) {
      case 'Literal':
        return this.getLiteralType(expr);
      case 'Identifier':
        return this.analyzeIdentifier(expr);
      case 'BinaryExpression':
        return this.analyzeBinaryExpression(expr);
      case 'UnaryExpression':
        return this.analyzeUnaryExpression(expr);
      case 'CallExpression':
        return this.analyzeCallExpression(expr);
      case 'MemberExpression':
        return this.analyzeMemberExpression(expr);
      case 'AssignmentExpression':
        return this.analyzeAssignmentExpression(expr);
    }

    return null;
  }

  getLiteralType(lit) {
    const val = lit.value;
    if (typeof val === 'number') return 'num';
    if (typeof val === 'string') return 'txt';
    if (typeof val === 'boolean') return 'num';
    return 'unknown';
  }

  analyzeIdentifier(id) {
    const name = id.name;

    // Look in scopes
    for (let i = this.currentScope; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        const symbol = this.scopes[i].get(name);
        return symbol.dataType;
      }
    }

    // Look in global symbols
    if (this.symbols.has(name)) {
      return 'object'; // Generic object type
    }

    // PORTUL FLEXIBILITY: Permitir variables no declaradas
    // (para bootstrapping iterativo)
    // En un compilador real, esto sería un error
    return 'unknown';
  }

  analyzeBinaryExpression(expr) {
    const left = this.analyzeExpression(expr.left);
    const right = this.analyzeExpression(expr.right);

    // Type checking for operators
    switch (expr.operator) {
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        if (left !== 'num' && left !== 'unknown') {
          this.addError(`Operando izquierdo debe ser número, recibido ${left}`, expr);
        }
        if (right !== 'num' && right !== 'unknown') {
          this.addError(`Operando derecho debe ser número, recibido ${right}`, expr);
        }
        return 'num';
      case '==':
      case '!=':
      case '<':
      case '>':
      case '<=':
      case '>=':
        return 'num'; // Boolean as number in Portul
      case '&&':
      case '||':
        return 'num';
    }

    return 'unknown';
  }

  analyzeUnaryExpression(expr) {
    const arg = this.analyzeExpression(expr.argument);

    switch (expr.operator) {
      case '-':
        if (arg !== 'num' && arg !== 'unknown') {
          this.addError(`Operando debe ser número para negación`, expr);
        }
        return 'num';
      case '!':
        return 'num';
    }

    return 'unknown';
  }

  analyzeCallExpression(expr) {
    const calleeType = this.analyzeExpression(expr.callee);

    // Analyze arguments
    for (const arg of (expr.arguments || [])) {
      this.analyzeExpression(arg);
    }

    return 'unknown'; // Return type unknown without more info
  }

  analyzeMemberExpression(expr) {
    this.analyzeExpression(expr.object);

    if (expr.computed) {
      this.analyzeExpression(expr.property);
    }

    return 'unknown';
  }

  analyzeAssignmentExpression(expr) {
    const target = expr.left;
    const value = this.analyzeExpression(expr.right);

    if (target.type === 'Identifier') {
      // Check if target exists
      this.analyzeExpression(target);
    }

    return value;
  }

  addError(message, node) {
    this.errors.push({
      message,
      line: node?.line || 0,
      column: node?.col || 0
    });
  }
}
