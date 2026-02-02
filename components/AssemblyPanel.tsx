
import React from 'react';

interface AssemblyPanelProps {
  asmCode: string;
}

const highlightAsm = (code: string): string => {
  return code.split('\n').map((line, index) => {
    let highlightedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments
    highlightedLine = highlightedLine.replace(/;.*/g, match => `<span class="text-slate-500 italic">${match}</span>`);

    // Labels
    highlightedLine = highlightedLine.replace(/^(\w+:)/g, match => `<span class="text-cyan-400 font-bold">${match}</span>`);

    // Mnemonics (instructions)
    highlightedLine = highlightedLine.replace(/\b(mov|add|sub|mul|div|call|ret|jmp|syscall|xor|push|pop|lea)\b/g, match => `<span class="text-yellow-400 font-semibold">${match}</span>`);

    // Registers
    highlightedLine = highlightedLine.replace(/\b(rax|rdi|rsi|rdx|rcx|r8|r9|eax|ebx|ecx|edx|dword|qword|ptr)\b/g, match => `<span class="text-orange-400 font-medium">${match}</span>`);

    // Directives
    highlightedLine = highlightedLine.replace(/\b(section|global|db|resd|equ|extern|times)\b/g, match => `<span class="text-fuchsia-400 font-semibold">${match}</span>`);

    // Strings
    highlightedLine = highlightedLine.replace(/"(.*?)"/g, (match, group) => `<span class="text-amber-400">"${group}"</span>`);
    
    // Numbers
    highlightedLine = highlightedLine.replace(/\b(0x[0-9a-fA-F]+|\d+)\b/g, match => `<span class="text-green-400">${match}</span>`);

    return `<div key=${index} class="flex hover:bg-slate-800/50 transition-colors group"><span class="w-12 text-slate-600 select-none text-right pr-3 group-hover:text-slate-400 transition-colors">${index + 1}</span><div class="flex-1 pl-2 border-l border-slate-700/50 group-hover:border-cyan-500/30 transition-colors">${highlightedLine || '&nbsp;'}</div></div>`;
  }).join('');
};

export const AssemblyPanel: React.FC<AssemblyPanelProps> = ({ asmCode }) => {
  const lineCount = asmCode.split('\n').length;
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-bold text-yellow-400">x86-64 Assembly</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
            {lineCount} lines
          </span>
        </div>
      </div>
      <div className="flex-grow overflow-auto p-4 font-mono text-sm custom-scrollbar">
        <pre className="whitespace-pre bg-slate-900/50 rounded-lg border border-slate-700/50 p-4">
          <code dangerouslySetInnerHTML={{ __html: highlightAsm(asmCode) }} />
        </pre>
      </div>
    </div>
  );
};
