// backend/src/compiler/ptsLowerer.js

export class PTSLowerer {
  constructor() {
    this.tempVarCounter = 0;
  }

  getTempVar() {
    return `__pts_tmp_${this.tempVarCounter++}`;
  }

  // Punto de entrada principal
  lower(programAst) {
    const loweredBody = [];
    for (const node of programAst.body) {
      loweredBody.push(this.lowerNode(node));
    }
    return { type: 'Program', body: loweredBody };
  }

  lowerNode(node) {
    switch (node.type) {
      case 'VariableDeclaration':
        return this.lowerVariableDeclaration(node);
      case 'BinaryExpression':
        return this.lowerBinaryExpression(node);
      case 'ForInStatement':
        return this.lowerForInStatement(node);
      case 'ClassDeclaration':
        return this.lowerClassDeclaration(node);
      case 'MacroAnnotation':
        return this.lowerMacroAnnotation(node);
      case 'TryCatchFinally': // Mapeo directo, solo asegurar nombres
        return {
          type: 'TryBlock',
          body: node.body.map(n => this.lowerNode(n)),
          errVar: node.errVar,
          errBody: node.errBody.map(n => this.lowerNode(n)),
          finBody: node.finBody.map(n => this.lowerNode(n))
        };
      default:
        // Si ya es un nodo nativo de Portul, pasarlo tal cual
        return node;
    }
  }

  // 1. Inferencia de Tipos: x = 42 -> num x = 42;
  lowerVariableDeclaration(node) {
    let portulType = 'num'; // default
    if (typeof node.init.value === 'string' && node.init.value.startsWith('"')) {
      portulType = 'txt';
    } else if (node.init.type === 'ArrayExpression') {
      portulType = 'ary';
    } else if (node.init.type === 'BooleanLiteral') {
      portulType = 'flg';
    }

    // Si usa 'own' o 'raw', mapearlo
    const storage = node.storage || 'num'; // 'own', 'raw', o tipo inferido

    return {
      type: 'VariableDeclaration',
      varType: storage === 'own' ? 'own' : portulType,
      identifier: node.identifier,
      init: this.lowerNode(node.init)
    };
  }

  // 2. Notación Infija a Prefija: a + b -> add a b;
  lowerBinaryExpression(node) {
    const left = this.lowerNode(node.left);
    const right = this.lowerNode(node.right);

    // Optimización de costo cero: a * 2 -> shl a 1
    if (node.operator === '*' && node.right.type === 'NumericLiteral' && node.right.value === 2) {
      return { type: 'CallExpression', callee: 'shl', arguments: [left, { type: 'NumericLiteral', value: 1 }] };
    }

    const opMap = {
      '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'mod',
      '==': 'equ', '!=': 'neq', '>': 'gt', '<': 'lt', '>=': 'gte', '<=': 'lte',
      '&&': 'and', '||': 'or'
    };

    const portulOp = opMap[node.operator];
    if (!portulOp) throw new Error(`Operador no soportado en PTS: ${node.operator}`);

    return { type: 'CallExpression', callee: portulOp, arguments: [left, right] };
  }

  // 3. Bucles de Rango: for i in 0..10 -> for i 0 10 { ... }
  lowerForInStatement(node) {
    if (node.right.type === 'RangeExpression') {
      return {
        type: 'ForStatement',
        iterator: node.iterator,
        start: this.lowerNode(node.right.start),
        end: this.lowerNode(node.right.end),
        body: node.body.map(n => this.lowerNode(n))
      };
    }
    // TODO: Manejar for i in array (requiere iterador de PTS)
    throw new Error("Bucle 'in' solo soportado para rangos por ahora");
  }

  // 4. Clases a Prototipos Portul: class X { fn init(){} } -> new X { new init(){} }
  lowerClassDeclaration(node) {
    const methods = node.body.map(method => {
      if (method.name === 'init' || method.name === 'constructor') {
        return { type: 'FunctionDeclaration', name: 'init', params: method.params, body: method.body.map(n => this.lowerNode(n)) };
      }
      return { type: 'FunctionDeclaration', name: method.name, params: method.params, body: method.body.map(n => this.lowerNode(n)) };
    });

    return {
      type: 'ObjectDeclaration', // Mapeado a 'new Name { ... }' en Portul
      name: node.name,
      members: methods
    };
  }

  // 5. Macros a Directivas de Hardware
  lowerMacroAnnotation(node) {
    if (node.name === '@fast_mode') {
      return { type: 'Directive', name: 'fast', arg: 'code' };
    }
    if (node.name === '@safe_mode') {
      return { type: 'Directive', name: 'safe', arg: 'code' };
    }
    if (node.name.startsWith('@hot')) {
      return { type: 'Directive', name: 'cache', arg: 'hot' }; // Simplificado
    }
    return node;
  }
}
