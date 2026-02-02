
const KEYWORDS = new Set(['if', 'for', 'new', 'ret', 'cal', 'run', 'put', 'use', 'mov', 'class', 'private', 'public', 'this', 'main', 'declare']);
const TYPES = new Set(['num', 'txt', 'ary', 'ptr', 'obj']);
const OPERATIONS = new Set(['add', 'sub', 'mul', 'div', 'inc', 'gt', 'lt', 'equ']);

export const highlightPortulCode = (line: string): string => {
    let escapedLine = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Comments
    escapedLine = escapedLine.replace(/(\/\/|#).*/, '<span class="text-slate-500">$&</span>');

    // Strings
    escapedLine = escapedLine.replace(/"(.*?)"/g, '<span class="text-amber-400">$&</span>');

    // Punctuation
    escapedLine = escapedLine.replace(/(\s*=\s*)/g, '<span class="text-red-400 font-bold">$1</span>');
    escapedLine = escapedLine.replace(/(\.)(\w+)/g, '$1<span class="text-teal-300">$2</span>'); // Property access
    escapedLine = escapedLine.replace(/;/g, '<span class="text-slate-500">;</span>');

    // Keywords, Types, Ops
    escapedLine = escapedLine.replace(/\b(\w+)\b/g, (match) => {
        if (KEYWORDS.has(match)) return `<span class="text-cyan-400 font-semibold">${match}</span>`;
        if (TYPES.has(match)) return `<span class="text-sky-400">${match}</span>`;
        if (OPERATIONS.has(match)) return `<span class="text-yellow-400">${match}</span>`;
        return match;
    });
    
    // Numbers
    escapedLine = escapedLine.replace(/\b(\d+)\b/g, '<span class="text-fuchsia-400">$1</span>');

    return escapedLine;
};
