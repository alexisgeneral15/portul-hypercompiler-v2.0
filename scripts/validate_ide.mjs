import fs from 'fs';
import { PortulLexer } from '../backend/src/compiler/lexer.js';
import { PortulParser } from '../backend/src/compiler/parser.js';
import { SemanticAnalyzer } from '../backend/src/compiler/semanticAnalyzer.js';

const files = [
  'src/sys/winapi.portul',
  'src/memory/arena.portul',
  'src/ui/editor.portul',
  'src/ui/window.portul',
  'src/main.portul'
];

let allOk = true;
for (const file of files) {
  try {
    const src = fs.readFileSync(file, 'utf8');
    const lexer = new PortulLexer();
    const tokens = lexer.tokenize(src);
    const parser = new PortulParser();
    const ast = parser.parse(tokens);
    const analyzer = new SemanticAnalyzer();
    const errors = analyzer.analyze(ast);
    if (errors && errors.length) {
      console.error(`❌ ${file}: ${errors.length} errores`);
      for (const e of errors) {
        console.error(`   - [${e.line}:${e.column}] ${e.message}`);
      }
      allOk = false;
    } else {
      console.log(`✅ ${file}`);
    }
  } catch (e) {
    console.error(`❌ ${file}: ${e.message}`);
    if (e.stack) console.error(e.stack.split('\n').slice(0,3).join('\n'));
    allOk = false;
  }
}
console.log(allOk ? '\n🎉 Todos los archivos del IDE son válidos en Portul.' : '\n⚠️ Revisa los errores anteriores.');
