// backend/src/compiler/lexer.js

export class Lexer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.current = 0;
    this.start = 0;
    this.line = 1;
    this.column = 1;

    // Keywords de Portul Nativo (Español)
    this.keywords = {
      'si': 'SI',
      'si_no': 'SI_NO',
      'para': 'PARA',
      'mientras': 'MIENTRAS',
      'hacer': 'HACER',
      'saltar': 'SALTAR',
      'continuar': 'CONTINUAR',
      'regresa': 'REGRESA',
      'funcion': 'FUNCION',
      'clase': 'CLASE',
      'nuevo': 'NUEVO',
      'esto': 'ESTO',
      'nulo': 'NULO',
      'verdadero': 'VERDADERO',
      'falso': 'FALSO',
      'num': 'NUM',
      'txt': 'TXT',
      'obj': 'OBJ',
      'ary': 'ARY',
      'ptr': 'PTR',
      'vacio': 'VACIO',
      'flg': 'FLG',
      'own': 'OWN',
      'raw': 'RAW',
      
      // Keywords de PortulScript (Inglés)
      'def': 'DEF',
      'return': 'RETURN',
      'class': 'CLASS',
      'true': 'TRUE',
      'false': 'FALSE',
      'in': 'IN',
      'while': 'WHILE',
      'if': 'IF',
      'else': 'ELSE',
      'for': 'FOR',
      'try': 'TRY',
      'err': 'ERR',
      'fin': 'FIN',
      'print': 'PRINT'
    };
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column });
    return this.tokens;
  }

  scanToken() {
    const c = this.advance();

    switch (c) {
      // Espacios en blanco
      case ' ':
      case '\r':
      case '\t':
        this.column++;
        break;
      
      case '\n':
        this.line++;
        this.column = 1;
        break;

      // Comentarios
      case '#':
        this.skipLineComment();
        break;
      
      case '/':
        if (this.match('/')) {
          this.skipLineComment();
        } else if (this.match('*')) {
          this.skipBlockComment();
        } else {
          this.addToken('SLASH');
        }
        break;

      // Operadores de un solo carácter
      case '(':
        this.addToken('LPAREN');
        break;
      case ')':
        this.addToken('RPAREN');
        break;
      case '{':
        this.addToken('LBRACE');
        break;
      case '}':
        this.addToken('RBRACE');
        break;
      case '[':
        this.addToken('LBRACKET');
        break;
      case ']':
        this.addToken('RBRACKET');
        break;
      case ',':
        this.addToken('COMMA');
        break;
      case '.':
        if (this.match('.')) {
          this.addToken('RANGE'); // ..
        } else {
          this.addToken('DOT');
        }
        break;
      case ';':
        this.addToken('SEMICOLON');
        break;
      case ':':
        this.addToken('COLON');
        break;

      // Operadores matemáticos
      case '+':
        if (this.match('=')) {
          this.addToken('PLUS_EQUAL');
        } else if (this.match('+')) {
          this.addToken('PLUS_PLUS');
        } else {
          this.addToken('PLUS');
        }
        break;
      
      case '-':
        if (this.match('=')) {
          this.addToken('MINUS_EQUAL');
        } else if (this.match('-')) {
          this.addToken('MINUS_MINUS');
        } else {
          this.addToken('MINUS');
        }
        break;
      
      case '*':
        if (this.match('=')) {
          this.addToken('STAR_EQUAL');
        } else if (this.match('*')) {
          this.addToken('POWER');
        } else {
          this.addToken('STAR');
        }
        break;
      
      case '%':
        this.addToken('MOD');
        break;

      // Operadores de comparación y asignación
      case '=':
        if (this.match('=')) {
          this.addToken('EQUAL_EQUAL');
        } else {
          this.addToken('EQUAL');
        }
        break;
      
      case '!':
        if (this.match('=')) {
          this.addToken('BANG_EQUAL');
        } else {
          this.addToken('BANG');
        }
        break;
      
      case '<':
        if (this.match('=')) {
          this.addToken('LESS_EQUAL');
        } else if (this.match('<')) {
          this.addToken('SHIFT_LEFT');
        } else {
          this.addToken('LESS');
        }
        break;
      
      case '>':
        if (this.match('=')) {
          this.addToken('GREATER_EQUAL');
        } else if (this.match('>')) {
          this.addToken('SHIFT_RIGHT');
        } else {
          this.addToken('GREATER');
        }
        break;

      // Operadores lógicos
      case '&':
        if (this.match('&')) {
          this.addToken('AND');
        } else {
          this.addToken('AMPERSAND');
        }
        break;
      
      case '|':
        if (this.match('|')) {
          this.addToken('OR');
        } else if (this.match('>')) {
          this.addToken('PIPE'); // |>
        } else {
          this.addToken('PIPE_CHAR');
        }
        break;

      // Macros de PortulScript (@)
      case '@':
        this.scanMacro();
        break;

      // Cadenas de texto
      case '"':
        this.scanString('"');
        break;
      
      case "'":
        this.scanString("'");
        break;

      default:
        // Números
        if (this.isDigit(c)) {
          this.scanNumber();
        }
        // Identificadores y keywords
        else if (this.isAlpha(c)) {
          this.scanIdentifier();
        }
        else {
          this.error(`Carácter inesperado: '${c}'`);
        }
        break;
    }
  }

  scanMacro() {
    let macro = '@';
    while (this.isAlpha(this.peek()) && !this.isAtEnd()) {
      macro += this.advance();
    }

    const macroTypes = ['@fast_mode', '@safe_mode', '@hot'];
    if (macroTypes.includes(macro)) {
      this.addToken('MACRO', macro);
    } else {
      this.error(`Macro desconocida: ${macro}`);
    }
  }

  scanString(quote) {
    let value = '';
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error('Cadena sin cerrar');
      return;
    }

    this.advance(); // Consumir comilla de cierre
    this.addToken('STRING', value);
  }

  scanNumber() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Parte decimal
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Consumir '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(this.start, this.current);
    this.addToken('NUMBER', parseFloat(value));
  }

  scanIdentifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = this.keywords[text] || 'IDENTIFIER';
    
    // Manejar booleanos
    if (text === 'verdadero' || text === 'true') {
      this.addToken('BOOLEAN', true);
    } else if (text === 'falso' || text === 'false') {
      this.addToken('BOOLEAN', false);
    } else {
      this.addToken(type, text);
    }
  }

  skipLineComment() {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
  }

  skipBlockComment() {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        return;
      }
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
    this.error('Comentario de bloque sin cerrar');
  }

  // --- Utilidades ---

  advance() {
    const c = this.source[this.current];
    this.current++;
    this.column++;
    return c;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  isAlpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  addToken(type, value = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({
      type: type,
      value: value !== null ? value : text,
      line: this.line,
      column: this.column - text.length
    });
  }

  error(message) {
    throw new Error(`[Lexer Error] Línea ${this.line}, Columna ${this.column}: ${message}`);
  }
}

export function tokenize(source) {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
