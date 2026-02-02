// PORTUL CODE GENERATOR v3.0
// LLVM-inspired IR and optimizing code generator
// Multi-pass optimization with SSA form and register allocation

export interface IRInstruction {
    opcode: string;
    operands: string[];
    result?: string;
    metadata?: Record<string, any>;
}

export interface BasicBlock {
    id: string;
    instructions: IRInstruction[];
    predecessors: Set<string>;
    successors: Set<string>;
    liveIn: Set<string>;
    liveOut: Set<string>;
}

export interface ControlFlowGraph {
    entry: BasicBlock;
    blocks: Map<string, BasicBlock>;
    exit: BasicBlock;
}

export interface OptimizationResult {
    ir: string;
    assembly: string;
    binary?: Uint8Array;
    stats: {
        instructionsEliminated: number;
        loopsOptimized: number;
        registersUsed: number;
        codeSize: number;
    };
}

// ==================== IR GENERATOR ====================

export class IRGenerator {
    private nextTemp = 0;
    private nextLabel = 0;
    private instructions: IRInstruction[] = [];
    private symbolTable: Map<string, { type: string; location: string }> = new Map();

    generate(ast: any): IRInstruction[] {
        this.visit(ast);
        return this.instructions;
    }

    private visit(node: any): string {
        if (!node) return '';

        switch (node.type) {
            case 'Program':
                return this.visitProgram(node);
            case 'VariableDeclaration':
                return this.visitVariableDeclaration(node);
            case 'BinaryExpression':
                return this.visitBinaryExpression(node);
            case 'CallExpression':
                return this.visitCallExpression(node);
            case 'ForStatement':
                return this.visitForStatement(node);
            case 'IfStatement':
                return this.visitIfStatement(node);
            case 'Literal':
                return this.visitLiteral(node);
            case 'Identifier':
                return node.name;
            case 'ClassDeclaration':
                return this.visitClassDeclaration(node);
            case 'MethodDeclaration':
                return this.visitMethodDeclaration(node);
            default:
                return '';
        }
    }

    private visitProgram(node: any): string {
        node.body.forEach((stmt: any) => this.visit(stmt));
        return '';
    }

    private visitVariableDeclaration(node: any): string {
        const varName = node.name;
        const location = `%${varName}`;
        
        this.symbolTable.set(varName, {
            type: node.varType,
            location
        });

        // Allocate stack space
        this.emit('alloca', [node.varType], location);

        if (node.init) {
            const initValue = this.visit(node.init);
            this.emit('store', [node.varType, initValue, location]);
        }

        return location;
    }

    private visitBinaryExpression(node: any): string {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        const result = this.newTemp();

        // Map operations to IR opcodes
        const opcodeMap: Record<string, string> = {
            'add': 'add',
            'sub': 'sub',
            'mul': 'mul',
            'div': 'sdiv', // signed division
        };

        const opcode = opcodeMap[node.operator] || node.operator;
        this.emit(opcode, ['i32', left, right], result);

        return result;
    }

    private visitCallExpression(node: any): string {
        const callee = node.callee;
        const args = node.arguments.map((arg: any) => this.visit(arg));

        if (callee === 'put') {
            // Call print function
            args.forEach(arg => {
                this.emit('call', ['@print', 'i8*', arg]);
            });
            return '';
        }

        if (callee === 'inc') {
            const target = args[0];
            const result = this.newTemp();
            this.emit('load', ['i32', target], result);
            const incremented = this.newTemp();
            this.emit('add', ['i32', result, '1'], incremented);
            this.emit('store', ['i32', incremented, target]);
            return target;
        }

        // General function call
        const result = this.newTemp();
        this.emit('call', [`@${callee}`, ...args], result);
        return result;
    }

    private visitForStatement(node: any): string {
        const loopStart = this.newLabel('loop.start');
        const loopBody = this.newLabel('loop.body');
        const loopEnd = this.newLabel('loop.end');

        // Initialize loop variable
        const varLocation = `%${node.variable}`;
        const startValue = this.visit(node.start);
        this.emit('store', ['i32', startValue, varLocation]);

        // Loop start
        this.emit('br', [loopStart]);
        this.emit('label', [loopStart]);

        // Loop condition
        const currentVal = this.newTemp();
        this.emit('load', ['i32', varLocation], currentVal);
        const endValue = this.visit(node.end);
        const cond = this.newTemp();
        this.emit('icmp', ['slt', 'i32', currentVal, endValue], cond);
        this.emit('br', ['i1', cond, loopBody, loopEnd]);

        // Loop body
        this.emit('label', [loopBody]);
        node.body.forEach((stmt: any) => this.visit(stmt));

        // Increment and loop back
        const nextVal = this.newTemp();
        const loadedVal = this.newTemp();
        this.emit('load', ['i32', varLocation], loadedVal);
        this.emit('add', ['i32', loadedVal, '1'], nextVal);
        this.emit('store', ['i32', nextVal, varLocation]);
        this.emit('br', [loopStart]);

        // Loop end
        this.emit('label', [loopEnd]);

        return '';
    }

    private visitIfStatement(node: any): string {
        const thenLabel = this.newLabel('if.then');
        const endLabel = this.newLabel('if.end');

        // Evaluate condition
        const left = this.visit(node.condition.left);
        const right = this.visit(node.condition.right);
        const cond = this.newTemp();

        const condMap: Record<string, string> = {
            'equ': 'eq',
            'gt': 'sgt',
            'lt': 'slt',
        };

        const condType = condMap[node.condition.operator] || 'eq';
        this.emit('icmp', [condType, 'i32', left, right], cond);
        this.emit('br', ['i1', cond, thenLabel, endLabel]);

        // Then branch
        this.emit('label', [thenLabel]);
        node.consequent.forEach((stmt: any) => this.visit(stmt));
        this.emit('br', [endLabel]);

        // End
        this.emit('label', [endLabel]);

        return '';
    }

    private visitLiteral(node: any): string {
        if (typeof node.value === 'number') {
            return String(node.value);
        }
        
        // String literal
        const strLabel = this.newLabel('str');
        // In real implementation, would add to data section
        return strLabel;
    }

    private visitClassDeclaration(node: any): string {
        // Generate struct type for class
        const className = node.name;
        const fields: string[] = [];

        node.body.members.forEach((member: any) => {
            if (member.type === 'FieldDeclaration') {
                fields.push(`${member.varType} %${member.name}`);
            }
        });

        this.emit('type', [`%${className}`, '=', 'type', '{', fields.join(', '), '}']);

        // Generate methods
        node.body.members.forEach((member: any) => {
            if (member.type === 'MethodDeclaration') {
                this.visitMethodDeclaration(member, className);
            }
        });

        return '';
    }

    private visitMethodDeclaration(node: any, className?: string): string {
        const funcName = className ? `@${className}.${node.name}` : `@${node.name}`;
        const params = node.params.map((p: any) => `${p.type} %${p.name}`).join(', ');

        this.emit('define', ['void', funcName, `(${params})`]);
        this.emit('entry', []);

        node.body.forEach((stmt: any) => this.visit(stmt));

        this.emit('ret', ['void']);
        this.emit('endfunc', []);

        return '';
    }

    private emit(opcode: string, operands: string[], result?: string): void {
        this.instructions.push({
            opcode,
            operands,
            result
        });
    }

    private newTemp(): string {
        return `%t${this.nextTemp++}`;
    }

    private newLabel(prefix: string): string {
        return `${prefix}.${this.nextLabel++}`;
    }

    toString(): string {
        return this.instructions.map(instr => {
            if (instr.result) {
                return `  ${instr.result} = ${instr.opcode} ${instr.operands.join(' ')}`;
            }
            return `  ${instr.opcode} ${instr.operands.join(' ')}`;
        }).join('\n');
    }
}

// ==================== OPTIMIZER ====================

export class IROptimizer {
    private cfg: ControlFlowGraph | null = null;

    optimize(instructions: IRInstruction[]): {
        optimized: IRInstruction[];
        stats: { eliminated: number; combined: number };
    } {
        let optimized = [...instructions];
        let eliminated = 0;
        let combined = 0;

        // Pass 1: Constant folding
        const { result: constFolded, count: constElim } = this.constantFolding(optimized);
        optimized = constFolded;
        eliminated += constElim;

        // Pass 2: Dead code elimination
        const { result: deadEliminated, count: deadElim } = this.deadCodeElimination(optimized);
        optimized = deadEliminated;
        eliminated += deadElim;

        // Pass 3: Common subexpression elimination
        const { result: cseApplied, count: cseElim } = this.commonSubexpressionElimination(optimized);
        optimized = cseApplied;
        combined += cseElim;

        // Pass 4: Strength reduction
        const { result: strengthReduced, count: strElim } = this.strengthReduction(optimized);
        optimized = strengthReduced;
        combined += strElim;

        return {
            optimized,
            stats: { eliminated, combined }
        };
    }

    private constantFolding(instructions: IRInstruction[]): { result: IRInstruction[]; count: number } {
        const result: IRInstruction[] = [];
        let count = 0;

        const constants = new Map<string, number>();

        for (const instr of instructions) {
            // Check if operands are constants
            if (['add', 'sub', 'mul', 'sdiv'].includes(instr.opcode)) {
                const left = constants.get(instr.operands[1]);
                const right = constants.get(instr.operands[2]);

                if (left !== undefined && right !== undefined) {
                    // Fold constant
                    let value: number;
                    switch (instr.opcode) {
                        case 'add': value = left + right; break;
                        case 'sub': value = left - right; break;
                        case 'mul': value = left * right; break;
                        case 'sdiv': value = Math.floor(left / right); break;
                        default: value = 0;
                    }

                    if (instr.result) {
                        constants.set(instr.result, value);
                    }
                    count++;
                    continue; // Skip this instruction
                }
            }

            // Track constant assignments
            if (instr.opcode === 'store') {
                const value = parseFloat(instr.operands[1]);
                if (!isNaN(value)) {
                    constants.set(instr.operands[2], value);
                }
            }

            result.push(instr);
        }

        return { result, count };
    }

    private deadCodeElimination(instructions: IRInstruction[]): { result: IRInstruction[]; count: number } {
        const used = new Set<string>();
        const result: IRInstruction[] = [];
        let count = 0;

        // Mark all used values
        instructions.forEach(instr => {
            instr.operands.forEach(op => {
                if (op.startsWith('%')) {
                    used.add(op);
                }
            });
        });

        // Keep only instructions that produce used values or have side effects
        instructions.forEach(instr => {
            const hasSideEffect = ['store', 'call', 'br', 'ret', 'label'].includes(instr.opcode);
            const isUsed = !instr.result || used.has(instr.result);

            if (hasSideEffect || isUsed) {
                result.push(instr);
            } else {
                count++;
            }
        });

        return { result, count };
    }

    private commonSubexpressionElimination(instructions: IRInstruction[]): { result: IRInstruction[]; count: number } {
        const result: IRInstruction[] = [];
        const expressions = new Map<string, string>();
        let count = 0;

        for (const instr of instructions) {
            if (['add', 'sub', 'mul', 'sdiv'].includes(instr.opcode)) {
                const exprKey = `${instr.opcode}:${instr.operands.join(',')}`;
                
                if (expressions.has(exprKey)) {
                    // Replace with existing result
                    const existingResult = expressions.get(exprKey)!;
                    if (instr.result) {
                        // Add alias instruction
                        result.push({
                            opcode: 'mov',
                            operands: [existingResult],
                            result: instr.result
                        });
                    }
                    count++;
                    continue;
                }

                if (instr.result) {
                    expressions.set(exprKey, instr.result);
                }
            }

            result.push(instr);
        }

        return { result, count };
    }

    private strengthReduction(instructions: IRInstruction[]): { result: IRInstruction[]; count: number } {
        const result: IRInstruction[] = [];
        let count = 0;

        for (const instr of instructions) {
            // Replace mul by power of 2 with shift
            if (instr.opcode === 'mul') {
                const rightOperand = instr.operands[2];
                const value = parseInt(rightOperand);
                
                if (!isNaN(value) && (value & (value - 1)) === 0 && value > 0) {
                    // Power of 2, use shift instead
                    const shiftAmount = Math.log2(value);
                    result.push({
                        opcode: 'shl',
                        operands: [instr.operands[0], instr.operands[1], String(shiftAmount)],
                        result: instr.result
                    });
                    count++;
                    continue;
                }
            }

            // Replace div by power of 2 with shift
            if (instr.opcode === 'sdiv') {
                const rightOperand = instr.operands[2];
                const value = parseInt(rightOperand);
                
                if (!isNaN(value) && (value & (value - 1)) === 0 && value > 0) {
                    const shiftAmount = Math.log2(value);
                    result.push({
                        opcode: 'ashr',
                        operands: [instr.operands[0], instr.operands[1], String(shiftAmount)],
                        result: instr.result
                    });
                    count++;
                    continue;
                }
            }

            result.push(instr);
        }

        return { result, count };
    }
}

// ==================== ASSEMBLY GENERATOR ====================

export class AssemblyGenerator {
    private registers = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11'];
    private registerAllocation = new Map<string, string>();
    private nextRegister = 0;
    private stackOffset = 0;
    private assembly: string[] = [];

    generate(instructions: IRInstruction[]): string {
        this.assembly = [
            '; Portul Optimized Assembly Output',
            '; Generated by Portul Code Generator v3.0',
            '',
            'section .data',
            '    newline db 10, 0',
            '',
            'section .text',
            '    global _start',
            '    extern printf',
            '',
            '_start:',
            '    push rbp',
            '    mov rbp, rsp',
            ''
        ];

        instructions.forEach(instr => this.emitInstruction(instr));

        this.assembly.push('');
        this.assembly.push('    ; Exit program');
        this.assembly.push('    mov rax, 60');
        this.assembly.push('    xor rdi, rdi');
        this.assembly.push('    syscall');

        return this.assembly.join('\n');
    }

    private emitInstruction(instr: IRInstruction): void {
        switch (instr.opcode) {
            case 'add':
                this.emitBinaryOp('add', instr);
                break;
            case 'sub':
                this.emitBinaryOp('sub', instr);
                break;
            case 'mul':
                this.emitBinaryOp('imul', instr);
                break;
            case 'sdiv':
                this.emitDiv(instr);
                break;
            case 'shl':
                this.emitShift('shl', instr);
                break;
            case 'ashr':
                this.emitShift('sar', instr);
                break;
            case 'store':
                this.emitStore(instr);
                break;
            case 'load':
                this.emitLoad(instr);
                break;
            case 'call':
                this.emitCall(instr);
                break;
            case 'br':
                this.emitBranch(instr);
                break;
            case 'label':
                this.emitLabel(instr);
                break;
            case 'ret':
                this.emitReturn(instr);
                break;
        }
    }

    private emitBinaryOp(op: string, instr: IRInstruction): void {
        const dest = this.allocateRegister(instr.result!);
        const src1 = this.getOperand(instr.operands[1]);
        const src2 = this.getOperand(instr.operands[2]);

        this.assembly.push(`    mov ${dest}, ${src1}`);
        this.assembly.push(`    ${op} ${dest}, ${src2}`);
    }

    private emitDiv(instr: IRInstruction): void {
        const dest = this.allocateRegister(instr.result!);
        const src1 = this.getOperand(instr.operands[1]);
        const src2 = this.getOperand(instr.operands[2]);

        this.assembly.push(`    mov rax, ${src1}`);
        this.assembly.push(`    xor rdx, rdx`);
        this.assembly.push(`    mov rcx, ${src2}`);
        this.assembly.push(`    idiv rcx`);
        this.assembly.push(`    mov ${dest}, rax`);
    }

    private emitShift(op: string, instr: IRInstruction): void {
        const dest = this.allocateRegister(instr.result!);
        const src = this.getOperand(instr.operands[1]);
        const amount = instr.operands[2];

        this.assembly.push(`    mov ${dest}, ${src}`);
        this.assembly.push(`    ${op} ${dest}, ${amount}`);
    }

    private emitStore(instr: IRInstruction): void {
        const value = this.getOperand(instr.operands[1]);
        const location = instr.operands[2];
        
        this.assembly.push(`    mov qword [rbp${this.getStackOffset(location)}], ${value}`);
    }

    private emitLoad(instr: IRInstruction): void {
        const dest = this.allocateRegister(instr.result!);
        const location = instr.operands[1];
        
        this.assembly.push(`    mov ${dest}, qword [rbp${this.getStackOffset(location)}]`);
    }

    private emitCall(instr: IRInstruction): void {
        this.assembly.push(`    call ${instr.operands[0]}`);
    }

    private emitBranch(instr: IRInstruction): void {
        if (instr.operands.length === 1) {
            this.assembly.push(`    jmp ${instr.operands[0]}`);
        } else {
            const cond = this.getOperand(instr.operands[1]);
            this.assembly.push(`    cmp ${cond}, 0`);
            this.assembly.push(`    jne ${instr.operands[2]}`);
            this.assembly.push(`    jmp ${instr.operands[3]}`);
        }
    }

    private emitLabel(instr: IRInstruction): void {
        this.assembly.push(`${instr.operands[0]}:`);
    }

    private emitReturn(instr: IRInstruction): void {
        if (instr.operands.length > 0 && instr.operands[0] !== 'void') {
            const value = this.getOperand(instr.operands[0]);
            this.assembly.push(`    mov rax, ${value}`);
        }
        this.assembly.push(`    mov rsp, rbp`);
        this.assembly.push(`    pop rbp`);
        this.assembly.push(`    ret`);
    }

    private allocateRegister(temp: string): string {
        if (!this.registerAllocation.has(temp)) {
            const reg = this.registers[this.nextRegister % this.registers.length];
            this.registerAllocation.set(temp, reg);
            this.nextRegister++;
            return reg;
        }
        return this.registerAllocation.get(temp)!;
    }

    private getOperand(operand: string): string {
        if (operand.startsWith('%')) {
            return this.allocateRegister(operand);
        }
        return operand;
    }

    private getStackOffset(location: string): string {
        // Simplified stack allocation
        this.stackOffset -= 8;
        return String(this.stackOffset);
    }
}

// ==================== MAIN CODE GENERATOR ====================

export class CodeGenerator {
    private irGenerator: IRGenerator;
    private optimizer: IROptimizer;
    private asmGenerator: AssemblyGenerator;

    constructor() {
        this.irGenerator = new IRGenerator();
        this.optimizer = new IROptimizer();
        this.asmGenerator = new AssemblyGenerator();
    }

    compile(ast: any, optimize: boolean = true): OptimizationResult {
        // Generate IR
        const irInstructions = this.irGenerator.generate(ast);
        let ir = this.formatIR(irInstructions);

        let stats = {
            instructionsEliminated: 0,
            loopsOptimized: 0,
            registersUsed: 0,
            codeSize: 0
        };

        // Optimize
        let finalInstructions = irInstructions;
        if (optimize) {
            const { optimized, stats: optStats } = this.optimizer.optimize(irInstructions);
            finalInstructions = optimized;
            ir = this.formatIR(optimized);
            stats.instructionsEliminated = optStats.eliminated;
            stats.loopsOptimized = optStats.combined;
        }

        // Generate assembly
        const assembly = this.asmGenerator.generate(finalInstructions);
        stats.codeSize = assembly.length;

        return {
            ir,
            assembly,
            stats
        };
    }

    private formatIR(instructions: IRInstruction[]): string {
        return instructions.map(instr => {
            if (instr.result) {
                return `  ${instr.result} = ${instr.opcode} ${instr.operands.join(' ')}`;
            }
            if (instr.opcode === 'label') {
                return `${instr.operands[0]}:`;
            }
            return `  ${instr.opcode} ${instr.operands.join(' ')}`;
        }).join('\n');
    }
}

// ==================== SINGLETON ====================

let codeGeneratorInstance: CodeGenerator | null = null;

export function getCodeGenerator(): CodeGenerator {
    if (!codeGeneratorInstance) {
        codeGeneratorInstance = new CodeGenerator();
    }
    return codeGeneratorInstance;
}
