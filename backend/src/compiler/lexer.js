/**
 * PortulLexer: Tokeniza código Portul
 */

const KEYWORDS = new Set([
  'si', 'si_no', 'para', 'mientras', 'hacer', 'saltar', 'continuar',
  'regresa', 'funcion', 'clase', 'nuevo', 'esto', 'nulo', 'verdadero', 
  'falso', 'num', 'txt', 'obj', 'ary', 'ptr', 'vacio'
]);

const TOKEN_TYPES = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENTIFIER: 'IDENTIFIER',
  
  // Keywords
  KEYWORD: 'KEYWORD',
  
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  MODULO: 'MODULO',
  POWER: 'POWER',
  
  // Comparison
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  
  // Logical
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  
  // Assignment
  ASSIGN: 'ASSIGN',
  PLUS_ASSIGN: 'PLUS_ASSIGN',
  MINUS_ASSIGN: 'MINUS_ASSIGN',
  
  // Punctuation
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  SEMICOLON: 'SEMICOLON',
  COMMA: 'COMMA',
  DOT: 'DOT',
  COLON: 'COLON',
  ARROW: 'ARROW',
  
  EOF: 'EOF'
};

export class PortulLexer {
  constructor() {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.source = '';
  }

  tokenize(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.tokens = [];

    while (this.pos < this.source.length) {
      this.skipWhitespaceAndComments();
      
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];

      // Numbers
      if (/\d/.test(ch)) {
        this.scanNumber();
      }
      // Strings
      else if (ch === '"' || ch === "'") {
        this.scanString();
      }
      // Identifiers and keywords
      else if (/[a-zA-Z_]/.test(ch)) {
        this.scanIdentifierOrKeyword();
      }
      // Operators and punctuation
      else {
        this.scanOperator();
      }
    }

    this.tokens.push({
      type: TOKEN_TYPES.EOF,
      value: null,
      line: this.line,
      col: this.col
    });

    return this.tokens;
  }

  skipWhitespaceAndComments() {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      
      if (/\s/.test(ch)) {
        if (ch === '\n') {
          this.line++;
          this.col = 1;
        } else {
          this.col++;
        }
        this.pos++;
      } else if (ch === '/' && this.source[this.pos + 1] === '/') {
        // Line comment
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.pos++;
        }
      } else if (ch === '/' && this.source[this.pos + 1] === '*') {
        // Block comment
        this.pos += 2;
        while (this.pos < this.source.length - 1) {
          if (this.source[this.pos] === '*' && this.source[this.pos + 1] === '/') {
            this.pos += 2;
            break;
          }
          if (this.source[this.pos] === '\n') {
            this.line++;
            this.col = 1;
          } else {
            this.col++;
          }
          this.pos++;
        }
      } else {
        break;
      }
    }
  }

  scanNumber() {
    const startPos = this.pos;
    const startCol = this.col;

    while (this.pos < this.source.length && /\d/.test(this.source[this.pos])) {
      this.pos++;
      this.col++;
    }

    // Check for decimal
    if (this.source[this.pos] === '.' && /\d/.test(this.source[this.pos + 1])) {
      this.pos++;
      this.col++;
      while (this.pos < this.source.length && /\d/.test(this.source[this.pos])) {
        this.pos++;
        this.col++;
      }
    }

    const value = this.source.slice(startPos, this.pos);
    this.tokens.push({
      type: TOKEN_TYPES.NUMBER,
      value: parseFloat(value),
      line: this.line,
      col: startCol
    });
  }

  scanString() {
    const quote = this.source[this.pos];
    this.pos++;
    this.col++;
    const startCol = this.col;
    let value = '';

    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === '\\') {
        this.pos++;
        this.col++;
        const escaped = this.source[this.pos];
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case '\\': value += '\\'; break;
          case quote: value += quote; break;
          default: value += escaped;
        }
      } else {
        value += this.source[this.pos];
      }
      
      if (this.source[this.pos] === '\n') {
        this.line++;
        this.col = 1;
      } else {
        this.col++;
      }
      this.pos++;
    }

    if (this.source[this.pos] === quote) {
      this.pos++;
      this.col++;
    }

    this.tokens.push({
      type: TOKEN_TYPES.STRING,
      value,
      line: this.line,
      col: startCol
    });
  }

  scanIdentifierOrKeyword() {
    const startPos = this.pos;
    const startCol = this.col;

    while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.pos])) {
      this.pos++;
      this.col++;
    }

    const value = this.source.slice(startPos, this.pos);

    if (KEYWORDS.has(value)) {
      this.tokens.push({
        type: TOKEN_TYPES.KEYWORD,
        value,
        line: this.line,
        col: startCol
      });
    } else {
      this.tokens.push({
        type: TOKEN_TYPES.IDENTIFIER,
        value,
        line: this.line,
        col: startCol
      });
    }
  }

  scanOperator() {
    const ch = this.source[this.pos];
    const nextCh = this.source[this.pos + 1];
    const startCol = this.col;

    // Multi-character operators
    if (ch === '=' && nextCh === '=') {
      this.tokens.push({ type: TOKEN_TYPES.EQ, value: '==', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '!' && nextCh === '=') {
      this.tokens.push({ type: TOKEN_TYPES.NEQ, value: '!=', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '<' && nextCh === '=') {
      this.tokens.push({ type: TOKEN_TYPES.LTE, value: '<=', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '>' && nextCh === '=') {
      this.tokens.push({ type: TOKEN_TYPES.GTE, value: '>=', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '&' && nextCh === '&') {
      this.tokens.push({ type: TOKEN_TYPES.AND, value: '&&', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '|' && nextCh === '|') {
      this.tokens.push({ type: TOKEN_TYPES.OR, value: '||', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '+' && nextCh === '=') {
      this.tokens.push({ type: TOKEN_TYPES.PLUS_ASSIGN, value: '+=', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '-' && nextCh === '=') {
      this.tokens.push({ type: TOKEN_TYPES.MINUS_ASSIGN, value: '-=', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '-' && nextCh === '>') {
      this.tokens.push({ type: TOKEN_TYPES.ARROW, value: '->', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else if (ch === '*' && nextCh === '*') {
      this.tokens.push({ type: TOKEN_TYPES.POWER, value: '**', line: this.line, col: startCol });
      this.pos += 2;
      this.col += 2;
    } else {
      // Single character operators
      const typeMap = {
        '+': TOKEN_TYPES.PLUS,
        '-': TOKEN_TYPES.MINUS,
        '*': TOKEN_TYPES.MULTIPLY,
        '/': TOKEN_TYPES.DIVIDE,
        '%': TOKEN_TYPES.MODULO,
        '=': TOKEN_TYPES.ASSIGN,
        '<': TOKEN_TYPES.LT,
        '>': TOKEN_TYPES.GT,
        '!': TOKEN_TYPES.NOT,
        '(': TOKEN_TYPES.LPAREN,
        ')': TOKEN_TYPES.RPAREN,
        '{': TOKEN_TYPES.LBRACE,
        '}': TOKEN_TYPES.RBRACE,
        '[': TOKEN_TYPES.LBRACKET,
        ']': TOKEN_TYPES.RBRACKET,
        ';': TOKEN_TYPES.SEMICOLON,
        ',': TOKEN_TYPES.COMMA,
        '.': TOKEN_TYPES.DOT,
        ':': TOKEN_TYPES.COLON
      };

      if (typeMap[ch]) {
        this.tokens.push({
          type: typeMap[ch],
          value: ch,
          line: this.line,
          col: startCol
        });
      }

      this.pos++;
      this.col++;
    }
  }
}

export { TOKEN_TYPES, KEYWORDS };