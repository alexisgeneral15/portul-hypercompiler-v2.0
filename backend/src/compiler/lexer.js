// backend/src/compiler/lexer.js

// 1. Diccionario de Keywords (Mezcla de PTS y Portul Nativo para compatibilidad)
const KEYWORDS = new Set([
  // --- PortulScript (Alto Nivel) ---
  'class', 'fn', 'return', 'true', 'false', 'in', 'while', 
  'break', 'continue', 'elif', 'else', 'try', 'err', 'fin', 
  'print', 'own', 'raw',
  
  // --- Portul v1.0A3 (Bajo Nivel - por si se mezclan) ---
  'num', 'txt', 'flg', 'ary', 'obj', 'ptr', 
  'add', 'sub', 'mul', 'div', 'mod', 'inc', 'dec',
  'equ', 'neq', 'gt', 'lt', 'gte', 'lte', 
  'and', 'or', 'xor', 'not',
  'if', 'for', 'whl', 'jump', 'ret', 
  'new', 'cal', 'use', 'exp', 'get', 'put', 'set', 'len', 'del', 'chk',
  'fast', 'safe', 'cache', 'loop', 'data', 'code', 'heap', 'pin', 'core', 
  'pipe', 'sync', 'task', 'pool', 'work', 'done'
]);

// 2. Macros reconocidas
const PTS_MACROS = new Set(['@fast_mode', '@safe_mode', '@hot']);

export function tokenize(source) {
  const tokens = [];
  let current = 0;

  while (current < source.length) {
    let char = source[current];

    // --- 1. Espacios en blanco y saltos de línea ---
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // --- 2. Comentarios (// y /* */) ---
    if (char === '/' && source[current + 1] === '/') {
      while (current < source.length && source[current] !== '\n') {
        current++;
      }
      continue;
    }
    if (char === '/' && source[current + 1] === '*') {
      current += 2;
      while (current < source.length - 1 && !(source[current] === '*' && source[current + 1] === '/')) {
        current++;
      }
      current += 2; // Saltar el */
      continue;
    }

    // --- 3. Macros de PortulScript (@) ---
    if (char === '@') {
      let macro = '@';
      current++;
      while (current < source.length && /[a-zA-Z_]/.test(source[current])) {
        macro += source[current];
        current++;
      }
      if (PTS_MACROS.has(macro)) {
        tokens.push({ type: 'PTS_MACRO', value: macro });
      } else {
        throw new Error(`Macro desconocida: '${macro}' en la posición ${current}`);
      }
      continue;
    }

    // --- 4. Cadenas de texto ("..." o '...') ---
    if (char === '"' || char === "'") {
      let str = '';
      const quote = char;
      current++; // Saltar comilla de apertura
      while (current < source.length && source[current] !== quote) {
        // Soporte básico para escapes (\")
        if (source[current] === '\\' && source[current + 1] === quote) {
          str += quote;
          current += 2;
        } else {
          str += source[current];
          current++;
        }
      }
      current++; // Saltar comilla de cierre
      tokens.push({ type: 'STRING', value: `"${str}"` }); // Mantenemos las comillas para el parser
      continue;
    }

    // --- 5. Números (Enteros y Flotantes) ---
    if (/[0-9]/.test(char)) {
      let num = '';
      while (current < source.length && /[0-9.]/.test(source[current])) {
        num += source[current];
        current++;
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // --- 6. Identificadores y Keywords ---
    if (/[a-zA-Z_]/.test(char)) {
      let identifier = '';
      while (current < source.length && /[a-zA-Z0-9_]/.test(source[current])) {
        identifier += source[current];
        current++;
      }
      
      if (KEYWORDS.has(identifier)) {
        tokens.push({ type: 'KEYWORD', value: identifier });
      } else if (identifier === 'true' || identifier === 'false') {
        tokens.push({ type: 'BOOLEAN', value: identifier });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: identifier });
      }
      continue;
    }

    // --- 7. Operadores Multi-carácter (¡DEBEN IR ANTES QUE LOS DE UN SOLO CARÁCTER!) ---
    if (char === '|' && source[current + 1] === '>') {
      tokens.push({ type: 'PIPE', value: '|>' });
      current += 2;
      continue;
    }
    if (char === '.' && source[current + 1] === '.') {
      tokens.push({ type: 'RANGE', value: '..' });
      current += 2;
      continue;
    }
    if (char === '=' && source[current + 1] === '=') {
      tokens.push({ type: 'EQ', value: '==' });
      current += 2;
      continue;
    }
    if (char === '!' && source[current + 1] === '=') {
      tokens.push({ type: 'NEQ', value: '!=' });
      current += 2;
      continue;
    }
    if (char === '>' && source[current + 1] === '=') {
      tokens.push({ type: 'GTE', value: '>=' });
      current += 2;
      continue;
    }
    if (char === '<' && source[current + 1] === '=') {
      tokens.push({ type: 'LTE', value: '<=' });
      current += 2;
      continue;
    }
    if (char === '&' && source[current + 1] === '&') {
      tokens.push({ type: 'AND', value: '&&' });
      current += 2;
      continue;
    }
    if (char === '|' && source[current + 1] === '|') {
      tokens.push({ type: 'OR', value: '||' });
      current += 2;
      continue;
    }

    // --- 8. Operadores y Puntuación de Un Solo Carácter ---
    switch (char) {
      case '+': tokens.push({ type: 'PLUS', value: '+' }); break;
      case '-': tokens.push({ type: 'MINUS', value: '-' }); break;
      case '*': tokens.push({ type: 'STAR', value: '*' }); break;
      case '/': tokens.push({ type: 'SLASH', value: '/' }); break;
      case '%': tokens.push({ type: 'MOD', value: '%' }); break;
      case '!': tokens.push({ type: 'NOT', value: '!' }); break;
      case '>': tokens.push({ type: 'GT', value: '>' }); break;
      case '<': tokens.push({ type: 'LT', value: '<' }); break;
      case '=': tokens.push({ type: 'EQUALS', value: '=' }); break;
      case '(': tokens.push({ type: 'LPAREN', value: '(' }); break;
      case ')': tokens.push({ type: 'RPAREN', value: ')' }); break;
      case '{': tokens.push({ type: 'LBRACE', value: '{' }); break;
      case '}': tokens.push({ type: 'RBRACE', value: '}' }); break;
      case '[': tokens.push({ type: 'LBRACKET', value: '[' }); break;
      case ']': tokens.push({ type: 'RBRACKET', value: ']' }); break;
      case ',': tokens.push({ type: 'COMMA', value: ',' }); break;
      
      default:
        throw new Error(`Carácter inesperado: '${char}' en la posición ${current}`);
    }
    
    current++;
  }

  // Token de fin de archivo
  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}
