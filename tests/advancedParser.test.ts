import { describe, it, expect } from 'vitest';
import { parsePortulCode } from '../services/advancedParser';

describe('AdvancedParser', () => {
    it('parses valid code without errors', () => {
        const code = 'num x = 1\nput x\n';
        const { ast, errors } = parsePortulCode(code);
        expect(errors.length).toBe(0);
        expect(ast.body.length).toBeGreaterThan(0);
    });
});
