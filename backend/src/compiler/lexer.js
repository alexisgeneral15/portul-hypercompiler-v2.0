// backend/src/compiler/lexer.js

const KEYWORDS = new Set([
  // Portul v1.0A3 Nativo
  'num', 'txt', 'flg', 'ary', 'obj', 'ptr', 'own',
  'add', 'sub', 'mul', 'div', 'mod', 'inc', 'dec',
  'equ', 'neq', 'gt', 'lt', 'gte', 'lte',
  'and', 'or', 'xor', 'not',
  'if', 'for', 'whl', 'try', 'err', 'fin', 'jump', 'ret',
  'new', 'cal', 'use', 'exp', 'get', 'put', 'set', 'len', 'del', 'chk',
  'fast', 'safe', 'cache', 'loop', 'data', 'code', 'heap', 'pin', 'core',
  'pipe', 'sync', 'task', 'pool', 'work', 'done',
  
  // ➕ NUEVO: Keywords de PortulScript (PTS)
  'class', 'fn', 'in', 'true', 'false', 'print', 'return',
  'elif', 'else', 'while', 'break', 'continue'
]);

const PTS_MACROS = new Set(['@fast_mode', '@safe_mode', '@hot']);

export function tokenize(source) {
  const tokens = [];
  let current = 0;

  while (current < source.length) {
    let char = source[current];

    // Ignorar espacios y saltos de línea
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // ➕ NUEVO: Macros de PTS (@fast_mode, etc.)
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
        throw new Error(`Macro desconocida: ${macro}`);
      }
      continue;
    }

    // Identificadores y Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let identifier = '';
      while (current < source.length && /[a-zA-Z0-9_]/.test(source[current])) {
        identifier += source[current];
        current++;
      }
      
      if (KEYWORDS.has(identifier)) {
        tokens.push({ type: 'KEYWORD', value: identifier });
      } else if (identifier === 'true' || identifier === 'false') {
        tokens.push({ type: 'BOOLEAN', value: identifier === 'true' ? '1' : '0' });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: identifier });
      }
      continue;
    }

    // ➕ NUEVO: Operador de Rango (..) y Pipeline (|>)
    if (char === '.' && source[current + 1] === '.') {
      tokens.push({ type: 'RANGE', value: '..' });
      current += 2;
      continue;
    }
    if (char === '|' && source[current + 1] === '>') {
      tokens.push({ type: 'PIPE', value: '|>' });
      current += 2;
      continue;
    }

    // ... (mantener el resto de tu lógica de lexer para números, strings, operadores infijos +, -, *, /, ==, etc.)
    // Asegúrate de agregar tokens para: 'PLUS', 'MINUS', 'STAR', 'SLASH', 'EQUALS', 'EQ' (==)
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}
