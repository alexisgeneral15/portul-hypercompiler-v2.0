import fs from 'fs';
import { PortulLexer } from './backend/src/compiler/lexer.js';
import { PortulParser } from './backend/src/compiler/parser.js';
import { SemanticAnalyzer } from './backend/src/compiler/semanticAnalyzer.js';

const files = [
  'src/sys/types.portul',
  'src/sys/winapi.portul', 
  'src/memory/arena.portul',
  'src/ui/editor.portul',
  'src/ui/window.portul',
  'src/main.portul'
];

let allOk = true;
for (const file of files) {
  try {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  ${file} no existe, saltando...`);
      continue;
    }
    
    const src = fs.readFileSync(file, 'utf8');
    const lexer = new PortulLexer();
    const tokens = lexer.tokenize(src);
    const parser = new PortulParser();
    const ast = parser.parse(tokens);
    const analyzer = new SemanticAnalyzer();
    const errors = analyzer.analyze(ast);
    
    if (errors && errors.length > 0) {
      console.error(`❌ ${file}: ${errors.length} errores semánticos`);
      errors.slice(0,3).forEach(e => console.error(`   - ${e.message || e}`));
      allOk = false;
    } else {
      console.log(`✅ ${file}`);
    }
  } catch (e) {
    console.error(`❌ ${file}: ${e.message}`);
    allOk = false;
  }
}

console.log(allOk ? '\n🎉 Todos los archivos del IDE son válidos en Portul v1.0A3' : '\n⚠️ Revisa los errores arriba');
process.exit(allOk ? 0 : 1);
