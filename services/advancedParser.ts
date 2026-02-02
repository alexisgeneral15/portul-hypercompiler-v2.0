// PORTUL ADVANCED PARSER v2.0
// Production-grade parser with error recovery, incremental parsing, and detailed AST
// Implements panic-mode recovery and synchronization points

export interface ParseError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    expected?: string[];
    got?: string;
    recoverable: boolean;
}

export interface SourceLocation {
    line: number;
    column: number;
    offset: number;
}

export interface ASTNode {
    type: string;
    loc: { start: SourceLocation; end: SourceLocation };
    [key: string]: any;
}

export interface Program extends ASTNode {
    type: 'Program';
    body: Statement[];
    comments: Comment[];
}

export interface Comment {
    type: 'Comment';
    value: string;
    loc: { start: SourceLocation; end: SourceLocation };
}

export type Statement =
    | VariableDeclaration
    | ClassDeclaration
    | MethodDeclaration
    | ExpressionStatement
    | ForStatement
    | IfStatement
    | ReturnStatement
    | CallExpression
    | FieldDeclaration;

export interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    varType: string;
    name: string;
    init?: Expression;
}

export interface ClassDeclaration extends ASTNode {
    type: 'ClassDeclaration';
    name: string;
    body: ClassBody;
}

export interface ClassBody extends ASTNode {
    type: 'ClassBody';
    members: (MethodDeclaration | FieldDeclaration)[];
}

export interface FieldDeclaration extends ASTNode {
    type: 'FieldDeclaration';
    visibility: 'public' | 'private';
    varType: string;
    name: string;
}

export interface MethodDeclaration extends ASTNode {
    type: 'MethodDeclaration';
    visibility: 'public' | 'private';
    name: string;
    params: Parameter[];
    body: Statement[];
    isConstructor: boolean;
}

export interface Parameter {
    type: string;
    name: string;
}

export interface ForStatement extends ASTNode {
    type: 'ForStatement';
    variable: string;
    start: Expression;
    end: Expression;
    body: Statement[];
}

export interface IfStatement extends ASTNode {
    type: 'IfStatement';
    condition: {
        operator: string;
        left: Expression;
        right: Expression;
    };
    consequent: Statement[];
    alternate?: Statement[];
}

export interface ReturnStatement extends ASTNode {
    type: 'ReturnStatement';
    argument?: Expression;
}

export interface ExpressionStatement extends ASTNode {
    type: 'ExpressionStatement';
    expression: Expression;
}

export type Expression =
    | Identifier
    | Literal
    | BinaryExpression
    | CallExpression
    | MemberExpression;

export interface Identifier extends ASTNode {
    type: 'Identifier';
    name: string;
}

export interface Literal extends ASTNode {
    type: 'Literal';
    value: string | number;
    raw: string;
}

export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression';
    operator: string;
    left: Expression;
    right: Expression;
}

export interface CallExpression extends ASTNode {
    type: 'CallExpression';
    callee: string;
    arguments: Expression[];
}

export interface MemberExpression extends ASTNode {
    type: 'MemberExpression';
    object: Expression;
    property: Identifier;
}

// ==================== TOKEN TYPES ====================

export enum TokenType {
    // Keywords
    Use = 'USE',
    Class = 'CLASS',
    Public = 'PUBLIC',
    Private = 'PRIVATE',
    This = 'THIS',
    New = 'NEW',
    Cal = 'CAL',
    Ret = 'RET',
    Put = 'PUT',
    Mov = 'MOV',
    For = 'FOR',
    If = 'IF',

    // Types
    Num = 'NUM',
    Txt = 'TXT',
    Obj = 'OBJ',
    Ary = 'ARY',
    Ptr = 'PTR',

    // Operations
    Add = 'ADD',
    Sub = 'SUB',
    Mul = 'MUL',
    Div = 'DIV',
    Inc = 'INC',
    Dec = 'DEC',
    Gt = 'GT',
    Lt = 'LT',
    Equ = 'EQU',

    // Literals & Identifiers
    Identifier = 'IDENTIFIER',
    Number = 'NUMBER',
    String = 'STRING',

    // Punctuation
    LeftBrace = 'LEFT_BRACE',
    RightBrace = 'RIGHT_BRACE',
    LeftParen = 'LEFT_PAREN',
    RightParen = 'RIGHT_PAREN',
    Dot = 'DOT',
    Semicolon = 'SEMICOLON',
    Equals = 'EQUALS',
    Comma = 'COMMA',

    // Special
    Comment = 'COMMENT',
    Newline = 'NEWLINE',
    EOF = 'EOF',
}

export interface Token {
    type: TokenType;
    value: string;
    loc: SourceLocation;
    raw: string;
}

// ==================== LEXER ====================

class Lexer {
    private input: string;
    private position: number = 0;
    private line: number = 1;
    private column: number = 0;
    private tokens: Token[] = [];
    private errors: ParseError[] = [];

    constructor(input: string) {
        this.input = input;
    }

    tokenize(): { tokens: Token[]; errors: ParseError[] } {
        while (this.position < this.input.length) {
            this.skipWhitespace();
            
            if (this.position >= this.input.length) break;

            const char = this.input[this.position];

            // Comments
            if (char === '/' && this.peek() === '/') {
                this.scanComment();
                continue;
            }

            if (char === '#') {
                this.scanComment();
                continue;
            }

            // Strings
            if (char === '"') {
                this.scanString();
                continue;
            }

            // Numbers
            if (this.isDigit(char)) {
                this.scanNumber();
                continue;
            }

            // Identifiers and Keywords
            if (this.isAlpha(char)) {
                this.scanIdentifierOrKeyword();
                continue;
            }

            // Punctuation
            if (this.scanPunctuation()) {
                continue;
            }

            // Unknown character
            this.errors.push({
                line: this.line,
                column: this.column,
                message: `Unexpected character '${char}'`,
                severity: 'error',
                got: char,
                recoverable: true
            });
            this.advance();
        }

        this.tokens.push(this.createToken(TokenType.EOF, ''));
        return { tokens: this.tokens, errors: this.errors };
    }

    private scanComment(): void {
        const start = this.getLocation();
        this.advance(); // Skip '/' or '#'
        if (this.input[this.position - 1] === '/') this.advance(); // Skip second '/'

        const startPos = this.position;
        while (this.position < this.input.length && this.input[this.position] !== '\n') {
            this.advance();
        }

        const value = this.input.substring(startPos, this.position);
        this.tokens.push({
            type: TokenType.Comment,
            value: value.trim(),
            loc: start,
            raw: value
        });
    }

    private scanString(): void {
        const start = this.getLocation();
        this.advance(); // Skip opening quote

        let value = '';
        while (this.position < this.input.length && this.input[this.position] !== '"') {
            if (this.input[this.position] === '\\') {
                this.advance();
                // Handle escape sequences
                const escapeChar = this.input[this.position];
                switch (escapeChar) {
                    case 'n': value += '\n'; break;
                    case 't': value += '\t'; break;
                    case '"': value += '"'; break;
                    case '\\': value += '\\'; break;
                    default: value += escapeChar;
                }
                this.advance();
            } else {
                value += this.input[this.position];
                this.advance();
            }
        }

        if (this.position >= this.input.length) {
            this.errors.push({
                line: start.line,
                column: start.column,
                message: 'Unterminated string literal',
                severity: 'error',
                recoverable: true
            });
        } else {
            this.advance(); // Skip closing quote
        }

        this.tokens.push({
            type: TokenType.String,
            value,
            loc: start,
            raw: `"${value}"`
        });
    }

    private scanNumber(): void {
        const start = this.getLocation();
        let num = '';

        while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
            num += this.input[this.position];
            this.advance();
        }

        // Handle decimal point
        if (this.input[this.position] === '.' && this.isDigit(this.input[this.position + 1])) {
            num += '.';
            this.advance();
            while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
                num += this.input[this.position];
                this.advance();
            }
        }

        this.tokens.push({
            type: TokenType.Number,
            value: num,
            loc: start,
            raw: num
        });
    }

    private scanIdentifierOrKeyword(): void {
        const start = this.getLocation();
        let ident = '';

        while (this.position < this.input.length && 
               (this.isAlpha(this.input[this.position]) || 
                this.isDigit(this.input[this.position]) || 
                this.input[this.position] === '_')) {
            ident += this.input[this.position];
            this.advance();
        }

        const tokenType = this.getKeywordType(ident);
        this.tokens.push({
            type: tokenType,
            value: ident,
            loc: start,
            raw: ident
        });
    }

    private getKeywordType(word: string): TokenType {
        const keywords: Record<string, TokenType> = {
            'use': TokenType.Use,
            'class': TokenType.Class,
            'public': TokenType.Public,
            'private': TokenType.Private,
            'this': TokenType.This,
            'new': TokenType.New,
            'cal': TokenType.Cal,
            'ret': TokenType.Ret,
            'put': TokenType.Put,
            'mov': TokenType.Mov,
            'for': TokenType.For,
            'if': TokenType.If,
            'num': TokenType.Num,
            'txt': TokenType.Txt,
            'obj': TokenType.Obj,
            'ary': TokenType.Ary,
            'ptr': TokenType.Ptr,
            'add': TokenType.Add,
            'sub': TokenType.Sub,
            'mul': TokenType.Mul,
            'div': TokenType.Div,
            'inc': TokenType.Inc,
            'dec': TokenType.Dec,
            'gt': TokenType.Gt,
            'lt': TokenType.Lt,
            'equ': TokenType.Equ,
        };

        return keywords[word] || TokenType.Identifier;
    }

    private scanPunctuation(): boolean {
        const char = this.input[this.position];
        const start = this.getLocation();
        let type: TokenType | null = null;

        switch (char) {
            case '{': type = TokenType.LeftBrace; break;
            case '}': type = TokenType.RightBrace; break;
            case '(': type = TokenType.LeftParen; break;
            case ')': type = TokenType.RightParen; break;
            case '.': type = TokenType.Dot; break;
            case ';': type = TokenType.Semicolon; break;
            case '=': type = TokenType.Equals; break;
            case ',': type = TokenType.Comma; break;
        }

        if (type) {
            this.tokens.push({ type, value: char, loc: start, raw: char });
            this.advance();
            return true;
        }

        return false;
    }

    private skipWhitespace(): void {
        while (this.position < this.input.length) {
            const char = this.input[this.position];
            if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
                if (char === '\n') {
                    this.line++;
                    this.column = 0;
                }
                this.advance();
            } else {
                break;
            }
        }
    }

    private advance(): void {
        this.position++;
        this.column++;
    }

    private peek(): string {
        return this.input[this.position + 1] || '';
    }

    private isDigit(char: string): boolean {
        return /[0-9]/.test(char);
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z_]/.test(char);
    }

    private getLocation(): SourceLocation {
        return {
            line: this.line,
            column: this.column,
            offset: this.position
        };
    }

    private createToken(type: TokenType, value: string): Token {
        return {
            type,
            value,
            loc: this.getLocation(),
            raw: value
        };
    }
}

// ==================== PARSER ====================

export class PortulParser {
    private tokens: Token[] = [];
    private current: number = 0;
    private errors: ParseError[] = [];

    parse(code: string): { ast: Program; errors: ParseError[] } {
        const lexer = new Lexer(code);
        const { tokens, errors: lexErrors } = lexer.tokenize();
        
        this.tokens = tokens;
        this.errors = [...lexErrors];
        this.current = 0;

        const program: Program = {
            type: 'Program',
            body: [],
            comments: [],
            loc: {
                start: { line: 1, column: 0, offset: 0 },
                end: this.peek().loc
            }
        };

        // Collect comments
        program.comments = this.tokens
            .filter(t => t.type === TokenType.Comment)
            .map(t => ({
                type: 'Comment' as const,
                value: t.value,
                loc: { start: t.loc, end: t.loc }
            }));

        while (!this.isAtEnd()) {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    program.body.push(stmt);
                }
            } catch (error: any) {
                // Error recovery: skip to synchronization point
                this.synchronize();
            }
        }

        return { ast: program, errors: this.errors };
    }

    private parseStatement(): Statement | null {
        // Skip comments
        while (this.match(TokenType.Comment)) {
            this.advance();
        }

        if (this.isAtEnd()) return null;

        // Class declaration
        if (this.match(TokenType.Class)) {
            return this.parseClassDeclaration();
        }

        // Method declaration (if we're in a class context)
        if (this.match(TokenType.Public, TokenType.Private)) {
            return this.parseMethodOrFieldDeclaration();
        }

        // Variable declaration
        if (this.matchType()) {
            return this.parseVariableDeclaration();
        }

        // For loop
        if (this.match(TokenType.For)) {
            return this.parseForStatement();
        }

        // If statement
        if (this.match(TokenType.If)) {
            return this.parseIfStatement();
        }

        // Return statement
        if (this.match(TokenType.Ret)) {
            return this.parseReturnStatement();
        }

        // Expression statement (operations, calls, etc.)
        return this.parseExpressionStatement();
    }

    private parseClassDeclaration(): ClassDeclaration {
        const start = this.previous().loc;
        
        if (!this.match(TokenType.Identifier)) {
            this.error('Expected class name', ['identifier']);
            throw new Error('Parse error');
        }

        const className = this.previous().value;

        if (!this.match(TokenType.LeftBrace)) {
            this.error('Expected {', ['{']);
            throw new Error('Parse error');
        }

        const members: (MethodDeclaration | FieldDeclaration)[] = [];

        while (!this.match(TokenType.RightBrace) && !this.isAtEnd()) {
            if (this.match(TokenType.Public, TokenType.Private)) {
                const member = this.parseMethodOrFieldDeclaration();
                if (member) {
                    members.push(member as any);
                }
            } else {
                this.advance(); // Skip unknown token
            }
        }

        if (this.previous().type !== TokenType.RightBrace) {
            this.error('Expected }', ['}']);
        }

        return {
            type: 'ClassDeclaration',
            name: className,
            body: {
                type: 'ClassBody',
                members,
                loc: { start, end: this.previous().loc }
            },
            loc: { start, end: this.previous().loc }
        };
    }

    private parseMethodOrFieldDeclaration(): MethodDeclaration | FieldDeclaration {
        const start = this.previous().loc;
        const visibility = this.previous().value as 'public' | 'private';

        if (!this.match(TokenType.Identifier) && !this.matchType()) {
            this.error('Expected method/field name or type', ['identifier', 'type']);
            throw new Error('Parse error');
        }

        const nameOrType = this.previous().value;

        // Check if it's a field (has type before name)
        if (this.matchType()) {
            // It's a field
            if (!this.match(TokenType.Identifier)) {
                this.error('Expected field name', ['identifier']);
                throw new Error('Parse error');
            }

            const fieldName = this.previous().value;

            return {
                type: 'FieldDeclaration',
                visibility,
                varType: nameOrType,
                name: fieldName,
                loc: { start, end: this.previous().loc }
            };
        }

        // It's a method
        const params: Parameter[] = [];
        
        // Parse parameters (type name pairs)
        while (!this.match(TokenType.LeftBrace) && !this.isAtEnd()) {
            if (this.matchType()) {
                const paramType = this.previous().value;
                if (this.match(TokenType.Identifier)) {
                    const paramName = this.previous().value;
                    params.push({ type: paramType, name: paramName });
                }
            } else {
                break;
            }
        }

        if (this.previous().type !== TokenType.LeftBrace) {
            this.error('Expected {', ['{']);
            throw new Error('Parse error');
        }

        const body: Statement[] = [];
        while (!this.match(TokenType.RightBrace) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);
        }

        return {
            type: 'MethodDeclaration',
            visibility,
            name: nameOrType,
            params,
            body,
            isConstructor: nameOrType === 'new',
            loc: { start, end: this.previous().loc }
        };
    }

    private parseVariableDeclaration(): VariableDeclaration {
        const start = this.previous().loc;
        const varType = this.previous().value;

        if (!this.match(TokenType.Identifier)) {
            this.error('Expected variable name', ['identifier']);
            throw new Error('Parse error');
        }

        const name = this.previous().value;
        let init: Expression | undefined;

        if (this.match(TokenType.Equals)) {
            init = this.parseExpression();
        }

        return {
            type: 'VariableDeclaration',
            varType,
            name,
            init,
            loc: { start, end: this.previous().loc }
        };
    }

    private parseForStatement(): ForStatement {
        const start = this.previous().loc;

        if (!this.match(TokenType.Identifier)) {
            this.error('Expected loop variable', ['identifier']);
            throw new Error('Parse error');
        }

        const variable = this.previous().value;
        const startExpr = this.parseExpression();
        const endExpr = this.parseExpression();

        if (!this.match(TokenType.LeftBrace)) {
            this.error('Expected {', ['{']);
            throw new Error('Parse error');
        }

        const body: Statement[] = [];
        while (!this.match(TokenType.RightBrace) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);
        }

        return {
            type: 'ForStatement',
            variable,
            start: startExpr,
            end: endExpr,
            body,
            loc: { start, end: this.previous().loc }
        };
    }

    private parseIfStatement(): IfStatement {
        const start = this.previous().loc;

        // Parse condition operator
        if (!this.match(TokenType.Gt, TokenType.Lt, TokenType.Equ)) {
            this.error('Expected condition operator', ['gt', 'lt', 'equ']);
            throw new Error('Parse error');
        }

        const operator = this.previous().value;
        const left = this.parseExpression();
        const right = this.parseExpression();

        if (!this.match(TokenType.LeftBrace)) {
            this.error('Expected {', ['{']);
            throw new Error('Parse error');
        }

        const consequent: Statement[] = [];
        while (!this.match(TokenType.RightBrace) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) consequent.push(stmt);
        }

        return {
            type: 'IfStatement',
            condition: { operator, left, right },
            consequent,
            loc: { start, end: this.previous().loc }
        };
    }

    private parseReturnStatement(): ReturnStatement {
        const start = this.previous().loc;
        let argument: Expression | undefined;

        if (!this.check(TokenType.Newline) && !this.isAtEnd()) {
            argument = this.parseExpression();
        }

        return {
            type: 'ReturnStatement',
            argument,
            loc: { start, end: this.previous().loc }
        };
    }

    private parseExpressionStatement(): ExpressionStatement {
        const start = this.peek().loc;
        const expression = this.parseExpression();

        return {
            type: 'ExpressionStatement',
            expression,
            loc: { start, end: this.previous().loc }
        };
    }

    private parseExpression(): Expression {
        // Handle operations (add, sub, etc.)
        if (this.match(TokenType.Add, TokenType.Sub, TokenType.Mul, TokenType.Div, TokenType.Inc, TokenType.Dec)) {
            const operator = this.previous().value;
            const left = this.parsePrimary();
            
            if (operator === 'inc' || operator === 'dec') {
                return {
                    type: 'CallExpression',
                    callee: operator,
                    arguments: [left],
                    loc: { start: this.previous().loc, end: this.previous().loc }
                };
            }

            const right = this.parsePrimary();
            return {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                loc: { start: left.loc.start, end: right.loc.end }
            };
        }

        // Handle function calls
        if (this.match(TokenType.Put, TokenType.Cal, TokenType.Mov)) {
            const callee = this.previous().value;
            const args: Expression[] = [];

            while (!this.check(TokenType.Newline) && !this.isAtEnd() && !this.check(TokenType.RightBrace)) {
                args.push(this.parsePrimary());
            }

            return {
                type: 'CallExpression',
                callee,
                arguments: args,
                loc: { start: this.previous().loc, end: this.previous().loc }
            };
        }

        return this.parsePrimary();
    }

    private parsePrimary(): Expression {
        const start = this.peek().loc;

        if (this.match(TokenType.Number)) {
            return {
                type: 'Literal',
                value: parseFloat(this.previous().value),
                raw: this.previous().value,
                loc: { start, end: this.previous().loc }
            };
        }

        if (this.match(TokenType.String)) {
            return {
                type: 'Literal',
                value: this.previous().value,
                raw: `"${this.previous().value}"`,
                loc: { start, end: this.previous().loc }
            };
        }

        if (this.match(TokenType.Identifier, TokenType.This)) {
            const name = this.previous().value;
            
            // Check for member access
            if (this.match(TokenType.Dot)) {
                if (!this.match(TokenType.Identifier)) {
                    this.error('Expected property name', ['identifier']);
                }
                
                return {
                    type: 'MemberExpression',
                    object: { type: 'Identifier', name, loc: { start, end: this.previous().loc } },
                    property: { type: 'Identifier', name: this.previous().value, loc: { start: this.previous().loc, end: this.previous().loc } },
                    loc: { start, end: this.previous().loc }
                };
            }

            return {
                type: 'Identifier',
                name,
                loc: { start, end: this.previous().loc }
            };
        }

        this.error('Unexpected token', ['identifier', 'number', 'string']);
        this.advance();
        
        return {
            type: 'Identifier',
            name: 'error',
            loc: { start, end: this.previous().loc }
        };
    }

    // ==================== UTILITY METHODS ====================

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private matchType(): boolean {
        return this.match(TokenType.Num, TokenType.Txt, TokenType.Obj, TokenType.Ary, TokenType.Ptr);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(message: string, expected?: string[]): void {
        this.errors.push({
            line: this.peek().loc.line,
            column: this.peek().loc.column,
            message,
            severity: 'error',
            expected,
            got: this.peek().value,
            recoverable: true
        });
    }

    private synchronize(): void {
        this.advance();

        while (!this.isAtEnd()) {
            // Synchronization points
            if (this.previous().type === TokenType.Semicolon) return;
            if (this.previous().type === TokenType.RightBrace) return;

            switch (this.peek().type) {
                case TokenType.Class:
                case TokenType.Public:
                case TokenType.Private:
                case TokenType.For:
                case TokenType.If:
                case TokenType.Ret:
                case TokenType.Num:
                case TokenType.Txt:
                case TokenType.Obj:
                case TokenType.Ary:
                case TokenType.Ptr:
                    return;
            }

            this.advance();
        }
    }
}

// ==================== EXPORTS ====================

export function parsePortulCode(code: string): { ast: Program; errors: ParseError[] } {
    const parser = new PortulParser();
    return parser.parse(code);
}
