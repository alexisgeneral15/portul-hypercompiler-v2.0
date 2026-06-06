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
    // 1. Macros (@fast_mode, etc.)
    if (this.check('PTS_MACRO')) {
      return this.parseMacroAnnotation();
    }
    // 2. Clases
    if (this.match('KEYWORD') && this.previous().value === 'class') {
      return this.parseClassDeclaration();
    }
    // 3. Funciones
    if (this.match('KEYWORD') && this.previous().value === 'fn') {
      return this.parseFunctionDeclaration();
    }
    // 4. Retorno
    if (this.match('KEYWORD') && this.previous().value === 'return') {
      return this.parseReturnStatement();
    }
    // 5. Condicionales
    if (this.match('KEYWORD') && this.previous().value === 'if') {
      return this.parseIfStatement();
    }
    // 6. Bucles
    if (this.match('KEYWORD') && this.previous().value === 'for') {
      return this.parseForStatement();
    }
    if (this.match('KEYWORD') && this.previous().value === 'while') {
      return this.parseWhileStatement();
    }
    // 7. Manejo de Errores
    if (this.match('KEYWORD') && this.previous().value === 'try') {
      return this.parseTryStatement();
    }
    // 8. Expresiones (Asignaciones, llamadas a funciones, etc.)
    return this.parseExpressionStatement();
  }

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
      body.push(this.parseFunctionDeclaration()); // Las clases solo contienen funciones en PTS
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
    this.consume('KEYWORD', "Se esperaba 'in'"); // Debe ser 'in'
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
    // Si es una asignación, la envolvemos en un nodo de declaración
    if (expr.type === 'AssignmentExpression') {
      return {
        type: 'VariableDeclaration',
        identifier: expr.left.name,
        init: expr.right,
        storage: expr.storage || null // Para manejar 'own' o 'raw'
      };
    }
    return expr;
  }

  parseReturnStatement() {
    const value = this.parseExpression();
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
    // Manejo especial para 'own x = 10' o 'raw x = 10'
    let storage = null;
    if (this.check('KEYWORD') && (this.peek().value === 'own' || this.peek().value === 'raw')) {
      storage = this.consume('KEYWORD', "Se esperaba 'own' o 'raw'").value;
    }

    const expr = this.parseLogicalOr();

    if (this.match('EQUALS')) { // '='
      const equals = this.previous();
      const right = this.parseAssignment(); // Asignación es right-associative

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

    // Si había 'own' o 'raw' pero no hay '=', es un error o una declaración de tipo especial
    if (storage) {
       throw new Error(`Se esperaba '=' después de '${storage}'`);
    }

    return expr;
  }

  parseLogicalOr() {
    let expr = this.parseLogicalAnd();
    while (this.match('OR')) { // '||'
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseLogicalAnd() {
    let expr = this.parseEquality();
    while (this.match('AND')) { // '&&'
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseRelational();
    while (this.match('EQ', 'NEQ')) { // '==', '!='
      const operator = this.previous().value;
      const right = this.parseRelational();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseRelational() {
    let expr = this.parseAdditive();
    while (this.match('GT', 'LT', 'GTE', 'LTE')) { // '>', '<', '>=', '<='
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.match('PLUS', 'MINUS')) { // '+', '-'
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parsePipeline(); // Pipeline tiene menor precedencia que * /
    while (this.match('STAR', 'SLASH', 'MOD')) { // '*', '/', '%'
      const operator = this.previous().value;
      const right = this.parsePipeline();
      expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right };
    }
    return expr;
  }

  parsePipeline() {
    let expr = this.parseUnary();
    while (this.match('PIPE')) { // '|>'
      const right = this.parseUnary(); // Asume llamada a función o identificador
      expr = { type: 'PipelineExpression', left: expr, right: right };
    }
    return expr;
  }

  parseUnary() {
    if (this.match('NOT', 'MINUS')) { // '!', '-'
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
      // Si es una llamada a función: miFuncion()
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
    if (this.match('LBRACKET')) { // Arrays: [1, 2, 3]
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
    if (this.match('LPAREN')) { // Agrupación: (a + b)
      const expr = this.parseExpression();
      this.consume('RPAREN', "Se esperaba ')' después de la expresión");
      return expr;
    }

    throw new Error(`Expresión inesperada: ${this.peek().value} (${this.peek().type})`);
  }
}

// Función de envoltura para mantener compatibilidad con el pipeline
export function parsePTS(tokens) {
  const parser = new PTSParser(tokens);
  return parser.parse();
}
