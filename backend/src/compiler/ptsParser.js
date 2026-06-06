// backend/src/compiler/ptsParser.js

export class PTSParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  // --- Utilidades del Parser ---
  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  consume(type, errorMessage) {
    if (this.check(type)) {
      this.current++;
      return this.previous();
    }
    throw new Error(`${errorMessage} Se esperaba '${type}', pero se encontró '${this.peek().type}'`);
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.current++;
        return true;
      }
    }
    return false;
  }

  isAtEnd() {
    return this.peek().type === 'EOF';
  }

  // --- Punto de Entrada ---
  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    return { type: 'Program', body: statements };
  }

  // --- Declaraciones (Statements) ---
  parseStatement() {
    // DETECCIÓN DE PORTUL v1.0A3 NATIVO
    if (this.check('KEYWORD') && ['num', 'txt', 'flg', 'ary', 'obj', 'ptr', 'own', 'raw'].includes(this.peek().value)) {
      return this.parseNativeVariableDeclaration();
    }
    
    if (this.check('KEYWORD') && ['add', 'sub', 'mul', 'div', 'mod', 'inc', 'dec', 'cal', 'put', 'set', 'del', 'chk', 'ret', 'jump'].includes(this.peek().value)) {
      return this.parseNativeCallExpression();
    }

    if (this.check('KEYWORD') && ['if', 'for', 'whl', 'try', 'new', 'use', 'exp'].includes(this.peek().value)) {
      return this.parseNativeControlFlow();
    }

    // DETECCIÓN DE PORTULSCRIPT (PTS) - ALTO NIVEL
    if (this.check('PTS_MACRO')) {
      return this.parseMacroAnnotation();
    }
    if (this.match('KEYWORD') && this.previous().value === 'class') {
      return this.parseClassDeclaration();
    }
    if (this.match('KEYWORD') && this.previous().value === 'fn') {
      return this.parseFunctionDeclaration();
    }
    if (this.match('KEYWORD') && this.previous().value === 'return') {
      return this.parseReturnStatement();
    }
    if (this.match('KEYWORD') && this.previous().value === 'if') {
      return this.parseIfStatement();
    }
    if (this.match('KEYWORD') && this.previous().value === 'for') {
      return this.parseForStatement();
    }
    if (this.match('KEYWORD') && this.previous().value === 'while') {
      return this.parseWhileStatement();
    }
    if (this.match('KEYWORD') && this.previous().value === 'try') {
      return this.parseTryStatement();
    }

    // DEFAULT: Expresión (Asignaciones, llamadas a funciones, etc.)
    return this.parseExpressionStatement();
  }

  // --- PORTUL v1.0A3 NATIVO ---
  parseNativeVariableDeclaration() {
    const type = this.consume('KEYWORD', "Tipo esperado").value;
    const name = this.consume('IDENTIFIER', "Nombre esperado").value;
    
    let init = null;
    if (this.match('EQUALS')) {
      init = this.parseExpression();
    }
    this.match('SEMICOLON');

    return {
      type: 'NativeVariableDeclaration',
      varType: type,
      identifier: name,
      init: init
    };
  }

  parseNativeCallExpression() {
    const callee = this.consume('KEYWORD', "Función nativa esperada").value;
    const args = [];
    
    while (!this.isAtEnd() && !this.check('SEMICOLON') && !this.check('RBRACE') && !this.check('EOF')) {
      args.push(this.parsePrimary());
    }
    this.match('SEMICOLON');

    return {
      type: 'NativeCallExpression',
      callee: callee,
      arguments: args
    };
  }

  parseNativeControlFlow() {
    const keyword = this.consume('KEYWORD', "Keyword de control esperada").value;
    
    if (keyword === 'if') {
      return this.parseNativeIf();
    }
    if (keyword === 'for') {
      return this.parseNativeFor();
    }
    if (keyword === 'whl') {
      return this.parseNativeWhile();
    }
    if (keyword === 'try') {
      return this.parseNativeTry();
    }
    if (keyword === 'new') {
      return this.parseNativeFunctionOrObject();
    }
    if (keyword === 'use' || keyword === 'exp') {
      return this.parseNativeImportExport(keyword);
    }

    throw new Error(`Keyword de control no soportada: ${keyword}`);
  }

  parseNativeIf() {
    const condition = this.parsePrimary();
    const comparator = this.consume('KEYWORD', "Comparador esperado (gt, lt, equ, etc.)").value;
    const value = this.parsePrimary();
    
    this.consume('LBRACE', "Se esperaba '{'");
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}'");

    return {
      type: 'NativeIfStatement',
      comparator: comparator,
      condition: condition,
      value: value,
      body: body
    };
  }

  parseNativeFor() {
    const iterator = this.consume('IDENTIFIER', "Iterador esperado").value;
    const start = this.parsePrimary();
    const end = this.parsePrimary();
    
    this.consume('LBRACE', "Se esperaba '{'");
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}'");

    return {
      type: 'NativeForStatement',
      iterator: iterator,
      start: start,
      end: end,
      body: body
    };
  }

  parseNativeWhile() {
    const condition = this.parsePrimary();
    const comparator = this.consume('KEYWORD', "Comparador esperado").value;
    const value = this.parsePrimary();
    
    this.consume('LBRACE', "Se esperaba '{'");
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}'");

    return {
      type: 'NativeWhileStatement',
      comparator: comparator,
      condition: condition,
      value: value,
      body: body
    };
  }

  parseNativeTry() {
    this.consume('LBRACE', "Se esperaba '{'");
    const body = [];
    while (!this.check('KEYWORD') || this.peek().value !== 'err') {
      body.push(this.parseStatement());
    }

    this.consume('KEYWORD', "Se esperaba 'err'");
    const errVar = this.consume('IDENTIFIER', "Variable de error esperada").value;
    this.consume('LBRACE', "Se esperaba '{'");
    const errBody = [];
    while (!this.check('KEYWORD') || this.peek().value !== 'fin') {
      errBody.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}'");

    this.consume('KEYWORD', "Se esperaba 'fin'");
    this.consume('LBRACE', "Se esperaba '{'");
    const finBody = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      finBody.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}'");

    return {
      type: 'NativeTryStatement',
      body: body,
      errVar: errVar,
      errBody: errBody,
      finBody: finBody
    };
  }

  parseNativeFunctionOrObject() {
    const name = this.consume('IDENTIFIER', "Nombre esperado").value;
    
    // Si tiene llave, es definición de función/objeto
    if (this.check('LBRACE')) {
      this.consume('LBRACE', "Se esperaba '{'");
      const body = [];
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        body.push(this.parseStatement());
      }
      this.consume('RBRACE', "Se esperaba '}'");
      
      return {
        type: 'NativeFunctionDeclaration',
        name: name,
        body: body
      };
    }
    
    // Si tiene '=', es instanciación
    if (this.match('EQUALS')) {
      const init = this.parsePrimary();
      this.match('SEMICOLON');
      
      return {
        type: 'NativeObjectInstantiation',
        name: name,
        init: init
      };
    }

    throw new Error("Sintaxis inválida después de 'new'");
  }

  parseNativeImportExport(keyword) {
    const path = this.consume('STRING', "Ruta de módulo esperada").value;
    this.match('SEMICOLON');
    
    return {
      type: keyword === 'use' ? 'NativeImport' : 'NativeExport',
      path: path
    };
  }

  // --- PORTULSCRIPT (PTS) - ALTO NIVEL ---
  parseMacroAnnotation() {
    const macroToken = this.consume('PTS_MACRO', "Se esperaba una macro");
    this.consume('LPAREN', "Se esperaba '(' después de la macro");
    
    const args = [];
    if (!this.check('RPAREN')) {
      args.push(this.parseExpression());
      while (this.match('COMMA')) {
        args.push(this.parseExpression());
      }
    }
    this.consume('RPAREN', "Se esperaba ')' para cerrar la macro");

    return {
      type: 'MacroAnnotation',
      name: macroToken.value,
      args: args
    };
  }

  parseClassDeclaration() {
    const name = this.consume('IDENTIFIER', "Se esperaba nombre de la clase").value;
    this.consume('LBRACE', "Se esperaba '{' después del nombre de la clase");

    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseFunctionDeclaration());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar la clase");

    return {
      type: 'ClassDeclaration',
      name: name,
      body: body
    };
  }

  parseFunctionDeclaration() {
    const name = this.consume('IDENTIFIER', "Se esperaba nombre de la función").value;
    this.consume('LPAREN', "Se esperaba '(' después del nombre de la función");

    const params = [];
    if (!this.check('RPAREN')) {
      params.push(this.consume('IDENTIFIER', "Se esperaba nombre de parámetro").value);
      while (this.match('COMMA')) {
        params.push(this.consume('IDENTIFIER', "Se esperaba nombre de parámetro").value);
      }
    }
    this.consume('RPAREN', "Se esperaba ')' para cerrar parámetros");
    this.consume('LBRACE', "Se esperaba '{' para iniciar el cuerpo de la función");

    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar la función");

    return {
      type: 'FunctionDeclaration',
      name: name,
      params: params,
      body: body
    };
  }

  parseForStatement() {
    const iterator = this.consume('IDENTIFIER', "Se esperaba variable iteradora").value;
    this.consume('KEYWORD', "Se esperaba 'in'");
    if (this.previous().value !== 'in') {
      throw new Error("Se esperaba la keyword 'in' en el bucle for");
    }

    const start = this.parseExpression();
    this.consume('RANGE', "Se esperaba '..' para el rango");
    const end = this.parseExpression();

    this.consume('LBRACE', "Se esperaba '{' para iniciar el bucle");
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar el bucle");

    return {
      type: 'ForInStatement',
      iterator: iterator,
      right: {
        type: 'RangeExpression',
        start: start,
        end: end
      },
      body: body
    };
  }

  parseIfStatement() {
    this.consume('LPAREN', "Se esperaba '(' después de 'if'");
    const condition = this.parseExpression();
    this.consume('RPAREN', "Se esperaba ')' después de la condición");
    this.consume('LBRACE', "Se esperaba '{' para el bloque if");
    
    const thenBranch = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      thenBranch.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar el bloque if");

    let elseBranch = null;
    if (this.match('KEYWORD') && this.previous().value === 'else') {
      this.consume('LBRACE', "Se esperaba '{' para el bloque else");
      elseBranch = [];
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        elseBranch.push(this.parseStatement());
      }
      this.consume('RBRACE', "Se esperaba '}' para cerrar el bloque else");
    }

    return {
      type: 'IfStatement',
      condition: condition,
      thenBranch: thenBranch,
      elseBranch: elseBranch
    };
  }

  parseWhileStatement() {
    this.consume('LPAREN', "Se esperaba '(' después de 'while'");
    const condition = this.parseExpression();
    this.consume('RPAREN', "Se esperaba ')' después de la condición");
    this.consume('LBRACE', "Se esperaba '{' para el bloque while");
    
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar el bloque while");

    return {
      type: 'WhileStatement',
      condition: condition,
      body: body
    };
  }

  parseTryStatement() {
    this.consume('LBRACE', "Se esperaba '{' después de 'try'");
    const body = [];
    while (!this.check('KEYWORD') || this.peek().value !== 'err') {
      body.push(this.parseStatement());
    }

    this.consume('KEYWORD', "Se esperaba 'err'");
    const errVar = this.consume('IDENTIFIER', "Se esperaba nombre de variable de error").value;
    this.consume('LBRACE', "Se esperaba '{' para el bloque err");
    const errBody = [];
    while (!this.check('KEYWORD') || this.peek().value !== 'fin') {
      errBody.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar el bloque err");

    this.consume('KEYWORD', "Se esperaba 'fin'");
    this.consume('LBRACE', "Se esperaba '{' para el bloque fin");
    const finBody = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      finBody.push(this.parseStatement());
    }
    this.consume('RBRACE', "Se esperaba '}' para cerrar el bloque fin");

    return {
      type: 'TryCatchFinally',
      body: body,
      errVar: errVar,
      errBody: errBody,
      finBody: finBody
    };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    if (expr.type === 'AssignmentExpression') {
      return {
        type: 'VariableDeclaration',
        identifier: expr.left.name,
        init: expr.right,
        storage: expr.storage || null
      };
    }
    return expr;
  }

  parseReturnStatement() {
    const value = this.parseExpression();
    this.match('SEMICOLON');
    return {
      type: 'ReturnStatement',
      value: value
    };
  }

  // --- Expresiones (Manejo de Precedencia) ---
  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let storage = null;
    if (this.check('KEYWORD') && (this.peek().value === 'own' || this.peek().value === 'raw')) {
      storage = this.consume('KEYWORD', "Se esperaba 'own' o 'raw'").value;
    }

    const expr = this.parseLogicalOr();

    if (this.match('EQUALS')) {
      const right = this.parseAssignment();

      if (expr.type === 'Identifier') {
        return {
          type: 'AssignmentExpression',
          storage: storage,
          left: { type: 'Identifier', name: expr.name },
          right: right
        };
      }
      throw new Error("Lado izquierdo de la asignación inválido");
    }

    if (storage) {
       throw new Error(`Se esperaba '=' después de '${storage}'`);
    }

    return expr;
  }

  parseLogicalOr() {
    let expr = this.parseLogicalAnd();
    while (this.match('OR')) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseLogicalAnd() {
    let expr = this.parseEquality();
    while (this.match('AND')) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseRelational();
    while (this.match('EQ', 'NEQ')) {
      const operator = this.previous().value;
      const right = this.parseRelational();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseRelational() {
    let expr = this.parseAdditive();
    while (this.match('GT', 'LT', 'GTE', 'LTE')) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parsePipeline();
    while (this.match('STAR', 'SLASH', 'MOD')) {
      const operator = this.previous().value;
      const right = this.parsePipeline();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parsePipeline() {
    let expr = this.parseUnary();
    while (this.match('PIPE')) {
      const right = this.parseUnary();
      expr = { type: 'PipelineExpression', left: expr, right: right };
    }
    return expr;
  }

  parseUnary() {
    if (this.match('NOT', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      return { type: 'UnaryExpression', operator: operator, right: right };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    if (this.match('NUMBER')) {
      return { type: 'NumericLiteral', value: Number(this.previous().value) };
    }
    if (this.match('STRING')) {
      return { type: 'StringLiteral', value: this.previous().value };
    }
    if (this.match('BOOLEAN')) {
      return { type: 'BooleanLiteral', value: this.previous().value === '1' };
    }
    if (this.match('IDENTIFIER')) {
      const name = this.previous().value;
      if (this.check('LPAREN')) {
        this.consume('LPAREN', "Se esperaba '('");
        const args = [];
        if (!this.check('RPAREN')) {
          args.push(this.parseExpression());
          while (this.match('COMMA')) {
            args.push(this.parseExpression());
          }
        }
        this.consume('RPAREN', "Se esperaba ')' después de los argumentos");
        return { type: 'CallExpression', callee: name, arguments: args };
      }
      return { type: 'Identifier', name: name };
    }
    if (this.match('LBRACKET')) {
      const elements = [];
      if (!this.check('RBRACKET')) {
        elements.push(this.parseExpression());
        while (this.match('COMMA')) {
          elements.push(this.parseExpression());
        }
      }
      this.consume('RBRACKET', "Se esperaba ']' para cerrar el array");
      return { type: 'ArrayExpression', elements: elements };
    }
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', "Se esperaba ')' después de la expresión");
      return expr;
    }

    throw new Error(`Expresión inesperada: ${this.peek().value} (${this.peek().type})`);
  }
}

export function parsePTS(tokens) {
  const parser = new PTSParser(tokens);
  return parser.parse();
}
