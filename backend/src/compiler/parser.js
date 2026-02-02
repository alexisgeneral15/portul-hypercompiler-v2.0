/**
 * PortulParser: Construye AST desde tokens
 */

import { TOKEN_TYPES } from './lexer.js';

export class PortulParser {
  constructor() {
    this.tokens = [];
    this.current = 0;
  }

  parse(tokens) {
    this.tokens = tokens;
    this.current = 0;

    const statements = [];
    while (!this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) statements.push(stmt);
    }

    return {
      type: 'Program',
      statements
    };
  }

  statement() {
    try {
      // Main entry point block
      if (this.check('IDENTIFIER') && this.peek().value === 'main' && this.peekAhead(1)?.type === 'LBRACE') {
        return this.mainBlock();
      }
      
      if (this.match('KEYWORD', 'funcion')) return this.functionDeclaration();
      if (this.match('KEYWORD', 'clase')) return this.classDeclaration();
      if (this.match('KEYWORD', 'si')) return this.ifStatement();
      if (this.match('KEYWORD', 'para')) return this.forStatement();
      if (this.match('KEYWORD', 'mientras')) return this.whileStatement();
      if (this.match('KEYWORD', 'regresa')) return this.returnStatement();
      if (this.check('KEYWORD') && ['num', 'txt', 'obj', 'ary', 'ptr', 'vacio'].includes(this.peek().value)) {
        return this.variableDeclaration();
      }
      return this.expressionStatement();
    } catch (e) {
      this.synchronize();
      return null;
    }
  }

  mainBlock() {
    this.consume('IDENTIFIER', 'main esperado');
    this.consume('LBRACE', '{ esperado');
    
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }
    this.consume('RBRACE', '} esperado');

    return {
      type: 'MainBlock',
      body
    };
  }

  functionDeclaration() {
    const name = this.consume('IDENTIFIER', 'nombre de función esperado').value;
    this.consume('LPAREN', '( esperado');
    
    const params = [];
    if (!this.check('RPAREN')) {
      do {
        const type = this.consume('KEYWORD', 'tipo esperado').value;
        const paramName = this.consume('IDENTIFIER', 'nombre parámetro esperado').value;
        params.push({ name: paramName, type });
      } while (this.match('COMMA'));
    }
    
    this.consume('RPAREN', ') esperado');
    
    const returnType = this.check('ARROW') ? (this.advance(), this.peek().value) : 'num';
    
    this.consume('LBRACE', '{ esperado');
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.statement());
    }
    this.consume('RBRACE', '} esperado');

    return {
      type: 'FunctionDeclaration',
      name,
      params,
      returnType,
      body
    };
  }

  classDeclaration() {
    const name = this.consume('IDENTIFIER', 'nombre de clase esperado').value;
    this.consume('LBRACE', '{ esperado');

    const properties = [];
    const methods = [];

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      if (this.check('KEYWORD') && ['num', 'txt', 'obj', 'ary', 'ptr'].includes(this.peek().value)) {
        const type = this.advance().value;
        const propName = this.consume('IDENTIFIER', 'nombre propiedad esperado').value;
        this.consume('SEMICOLON', '; esperado');
        properties.push({ name: propName, type });
      } else if (this.match('KEYWORD', 'funcion')) {
        methods.push(this.functionDeclaration());
      } else {
        this.advance();
      }
    }

    this.consume('RBRACE', '} esperado');

    return {
      type: 'ClassDeclaration',
      name,
      properties,
      methods
    };
  }

  ifStatement() {
    this.consume('LPAREN', '( esperado');
    const test = this.expression();
    this.consume('RPAREN', ') esperado');

    this.consume('LBRACE', '{ esperado');
    const consequent = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      consequent.push(this.statement());
    }
    this.consume('RBRACE', '} esperado');

    let alternate = null;
    if (this.match('KEYWORD', 'si_no')) {
      if (this.check('KEYWORD', 'si')) {
        alternate = [this.ifStatement()];
      } else {
        this.consume('LBRACE', '{ esperado');
        alternate = [];
        while (!this.check('RBRACE') && !this.isAtEnd()) {
          alternate.push(this.statement());
        }
        this.consume('RBRACE', '} esperado');
      }
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    };
  }

  forStatement() {
    // Soportar dos estilos:
    // 1. C-style: for (init; test; update) { body }
    // 2. Portul-style: for i 0 10 { body }
    
    if (this.check('LPAREN')) {
      // C-style
      this.consume('LPAREN', '( esperado');
      
      const init = this.check('SEMICOLON') ? null : this.expressionStatement();
      this.consume('SEMICOLON', '; esperado');
      
      const test = this.check('SEMICOLON') ? null : this.expression();
      this.consume('SEMICOLON', '; esperado');
      
      const update = this.check('RPAREN') ? null : this.expression();
      this.consume('RPAREN', ') esperado');

      this.consume('LBRACE', '{ esperado');
      const body = [];
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        body.push(this.statement());
      }
      this.consume('RBRACE', '} esperado');

      return {
        type: 'ForStatement',
        init,
        test,
        update,
        body
      };
    } else {
      // Portul-style: for variable start end { body }
      const variable = this.consume('IDENTIFIER', 'variable esperada').value;
      const start = this.expression();
      const end = this.expression();

      this.consume('LBRACE', '{ esperado');
      const body = [];
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        body.push(this.statement());
      }
      this.consume('RBRACE', '} esperado');

      return {
        type: 'ForStatement',
        variable,
        start,
        end,
        body,
        isPortulStyle: true
      };
    }
  }

  whileStatement() {
    this.consume('LPAREN', '( esperado');
    const test = this.expression();
    this.consume('RPAREN', ') esperado');

    this.consume('LBRACE', '{ esperado');
    const body = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      body.push(this.statement());
    }
    this.consume('RBRACE', '} esperado');

    return {
      type: 'WhileStatement',
      test,
      body
    };
  }

  returnStatement() {
    let argument = null;
    if (!this.check('SEMICOLON') && !this.check('RBRACE')) {
      argument = this.expression();
    }
    this.consume('SEMICOLON', '; esperado');

    return {
      type: 'ReturnStatement',
      argument
    };
  }

  variableDeclaration() {
    const type = this.advance().value; // num, txt, etc.
    const name = this.consume('IDENTIFIER', 'nombre variable esperado').value;
    
    let init = null;
    if (this.match('ASSIGN')) {
      init = this.expression();
    }
    
    this.consume('SEMICOLON', '; esperado');

    return {
      type: 'VariableDeclaration',
      name,
      dataType: type,
      init
    };
  }

  expressionStatement() {
    const expr = this.expression();
    if (this.match('SEMICOLON')) {
      // Ok
    }
    return {
      type: 'ExpressionStatement',
      expression: expr
    };
  }

  expression() {
    return this.assignment();
  }

  assignment() {
    let expr = this.logicalOr();

    if (this.match('ASSIGN')) {
      const value = this.assignment();
      if (expr.type === 'Identifier') {
        return {
          type: 'AssignmentExpression',
          left: expr,
          operator: '=',
          right: value
        };
      }
    }

    return expr;
  }

  logicalOr() {
    let expr = this.logicalAnd();

    while (this.match('OR')) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  logicalAnd() {
    let expr = this.equality();

    while (this.match('AND')) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  equality() {
    let expr = this.comparison();

    while (this.match('EQ', 'NEQ')) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  comparison() {
    let expr = this.additive();

    while (this.match('LT', 'GT', 'LTE', 'GTE')) {
      const operator = this.previous().value;
      const right = this.additive();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  additive() {
    let expr = this.multiplicative();

    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.multiplicative();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  multiplicative() {
    let expr = this.power();

    while (this.match('MULTIPLY', 'DIVIDE', 'MODULO')) {
      const operator = this.previous().value;
      const right = this.power();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  power() {
    let expr = this.unary();

    while (this.match('POWER')) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  unary() {
    if (this.match('NOT', 'MINUS')) {
      const operator = this.previous().value;
      const argument = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        argument
      };
    }

    return this.postfix();
  }

  postfix() {
    let expr = this.primary();

    while (true) {
      if (this.match('LPAREN')) {
        const args = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.expression());
          } while (this.match('COMMA'));
        }
        this.consume('RPAREN', ') esperado');
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args
        };
      } else if (this.match('DOT')) {
        const property = this.consume('IDENTIFIER', 'nombre propiedad esperado');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: false
        };
      } else if (this.match('LBRACKET')) {
        const index = this.expression();
        this.consume('RBRACKET', '] esperado');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: index,
          computed: true
        };
      } else {
        break;
      }
    }

    return expr;
  }

  primary() {
    if (this.match('NUMBER')) {
      return {
        type: 'Literal',
        value: this.previous().value
      };
    }

    if (this.match('STRING')) {
      return {
        type: 'Literal',
        value: this.previous().value
      };
    }

    if (this.match('KEYWORD', 'verdadero')) {
      return {
        type: 'Literal',
        value: true
      };
    }

    if (this.match('KEYWORD', 'falso')) {
      return {
        type: 'Literal',
        value: false
      };
    }

    if (this.match('IDENTIFIER')) {
      return {
        type: 'Identifier',
        name: this.previous().value
      };
    }

    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.consume('RPAREN', ') esperado');
      return expr;
    }

    throw new Error(`Token inesperado: ${this.peek().value}`);
  }

  // Helper methods
  match(...types) {
    for (const type of types) {
      if (typeof type === 'string' && this.check(type)) {
        this.advance();
        return true;
      } else if (typeof type === 'string' && typeof types[types.length - 1] === 'string') {
        // Value match
        if (this.check('KEYWORD') && this.peek().value === type) {
          this.advance();
          return true;
        }
      }
    }
    return false;
  }

  check(type, value) {
    if (this.isAtEnd()) return false;
    if (value) return this.peek().type === type && this.peek().value === value;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === 'EOF';
  }

  peek() {
    return this.tokens[this.current];
  }

  peekAhead(n) {
    const index = this.current + n;
    if (index >= this.tokens.length) return null;
    return this.tokens[index];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} en línea ${this.peek().line}`);
  }

  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === 'SEMICOLON') return;

      this.advance();
    }
  }
}
