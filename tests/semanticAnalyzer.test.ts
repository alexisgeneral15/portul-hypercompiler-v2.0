import { describe, it, expect } from 'vitest';
import { SemanticAnalyzer } from '../services/semanticAnalyzer';

describe('SemanticAnalyzer', () => {
    it('reports undefined variable use (E003)', () => {
        const analyzer = new SemanticAnalyzer();
        const code = 'add x 1\n';
        const diagnostics = analyzer.analyze(code);
        const hasE003 = diagnostics.some(d => d.code === 'E003');
        expect(hasE003).toBe(true);
    });
});
