import { describe, it, expect } from 'vitest';
import { RefactoringEngine } from '../services/refactoringEngine';

describe('RefactoringEngine', () => {
    it('suggests increment optimization for add x 1', () => {
        const engine = new RefactoringEngine();
        const code = 'num x = 0\nadd x 1\n';
        const opts = engine.findOptimizations(code);
        expect(opts.length).toBeGreaterThan(0);
        expect(opts.some(o => o.newCode.includes('inc x'))).toBe(true);
    });
});
