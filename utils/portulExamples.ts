import { addFileByPath } from './fileSystemUtils';

// Ejemplos simples para compilar
export const PORTUL_EXAMPLES = {
  'hello_world.portulpp': `// ¡Hola Mundo! - Ejemplo Portul básico
main {
    put "¡Hola Mundo desde Portul!";
}`,

  'counter.portulpp': `// Contador simple
main {
    num count = 0;
    
    for i 0 5 {
        inc count;
        put "Contador: ";
        put count;
    }
    
    put "Total: ";
    put count;
}`,

  'fibonacci.portulpp': `// Serie Fibonacci
main {
    num a = 0;
    num b = 1;
    
    for i 0 10 {
        put a;
        
        num temp = a;
        mov a b;
        add b temp;
    }
}`,

  'arithmetic.portulpp': `// Operaciones aritméticas
main {
    num x = 10;
    num y = 5;
    
    num suma = x;
    add suma y;
    
    num resta = x;
    sub resta y;
    
    num mult = x;
    mul mult y;
    
    num division = x;
    div division y;
    
    put "Suma: ";
    put suma;
    put "Resta: ";
    put resta;
    put "Multiplicación: ";
    put mult;
    put "División: ";
    put division;
}`,

  'conditionals.portulpp': `// Condicionales
main {
    num age = 25;
    
    if geq age 18 {
        put "Eres mayor de edad";
    } else {
        put "Eres menor de edad";
    }
    
    if equ age 25 {
        put "¡Tienes exactamente 25 años!";
    }
}`,

  'factorial.portulpp': `// Factorial recursivo
fun factorial num n -> num {
    if equ n 0 {
        ret 1;
    } else {
        num temp = sub n 1;
        num result = cal factorial temp;
        mul result n;
        ret result;
    }
}

main {
    num result = cal factorial 5;
    put "Factorial de 5: ";
    put result;
}`,

  'string_operations.portulpp': `// Operaciones con strings
main {
    txt name = "Portul";
    txt greeting = "Hola, ";
    
    put greeting;
    put name;
    put "!";
    
    txt message = "Compilando a ejecutable Windows";
    put message;
}`,

  'bootstrap_test.portulpp': `// Test de Bootstrapping Portul
main {
    put "═════════════════════════════════";
    put "  PORTUL BOOTSTRAP COMPILER TEST  ";
    put "═════════════════════════════════";
    put "";
    
    num test_num = 42;
    put "Test numérico: ";
    put test_num;
    
    txt test_str = "¡Bootstrapping funciona!";
    put "Test string: ";
    put test_str;
    
    for i 1 4 {
        put "Iteración: ";
        put i;
    }
    
    put "";
    put "✓ Compilación exitosa a .exe";
}`,

  'class_example.portulpp': `// Ejemplo de Clase en Portul
class Calculator {
    private num result;
    
    new Calculator {
        mov this.result 0;
    }
    
    public add num x {
        add this.result x;
    }
    
    public get_result num {
        ret this.result;
    }
}

main {
    obj calc = new Calculator;
    cal calc.add 10;
    cal calc.add 5;
    
    num final = cal calc.get_result;
    put "Resultado: ";
    put final;
}`
};

export function addExampleToFileSystem(tree: any, exampleKey: string) {
  const exampleName = exampleKey.split('/').pop() || exampleKey;
  return addFileByPath(tree, `examples/${exampleName}`, PORTUL_EXAMPLES[exampleKey as keyof typeof PORTUL_EXAMPLES] || '');
}
