import { describe, it, expect } from 'vitest';
import { getLanguageServer } from '../services/languageServer';

describe('LanguageServer', () => {
    it('provides keyword/type completions', () => {
        const ls = getLanguageServer();
        const code = 'num x = 0\n';
        const items = ls.provideCompletionItems(code, { line: 0, character: 0 });
        const labels = items.map(i => i.label);
        expect(labels.length).toBeGreaterThan(0);
        expect(labels.some(l => l === 'class' || l === 'num')).toBe(true);
    });

    it('provides hover info for types', () => {
        const ls = getLanguageServer();
        const code = 'num x = 0\n';
        const hover = ls.provideHover(code, { line: 0, character: 1 });
        expect(hover).not.toBeNull();
        expect(hover?.contents).toContain('num');
    });
});
