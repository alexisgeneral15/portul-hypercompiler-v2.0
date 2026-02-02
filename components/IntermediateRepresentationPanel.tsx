
import React from 'react';

interface IntermediateRepresentationPanelProps {
  irCode: string;
}

const highlightIr = (code: string) => {
  return code.split('\n').map((line, index) => {
    let highlightedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments
    highlightedLine = highlightedLine.replace(/;.*/g, match => `<span class="text-slate-500">${match}</span>`);

    // Labels and function names
    highlightedLine = highlightedLine.replace(/^(\w+:)|(@\w+)/g, match => `<span class="text-cyan-400">${match}</span>`);

    // Opcodes
    highlightedLine = highlightedLine.replace(/\b(define|alloca|store|load|add|call|ret)\b/g, match => `<span class="text-yellow-400 font-semibold">${match}</span>`);
    
    // Types
    highlightedLine = highlightedLine.replace(/\b(num|void|ptr|txt)\b/g, match => `<span class="text-sky-400">${match}</span>`);

    // Registers/Variables
    highlightedLine = highlightedLine.replace(/%\w+/g, match => `<span class="text-lime-400">${match}</span>`);

    return `<div key=${index} class="flex"><span class="w-8 text-slate-600 select-none">${index + 1}</span><div class="flex-1">${highlightedLine || '&nbsp;'}</div></div>`;
  }).join('');
};


export const IntermediateRepresentationPanel: React.FC<IntermediateRepresentationPanelProps> = ({ irCode }) => {
  return (
    <div className="flex flex-col h-full bg-slate-800 p-4 font-mono text-xs overflow-auto">
      <pre className="whitespace-pre">
        <code dangerouslySetInnerHTML={{ __html: highlightIr(irCode) }} />
      </pre>
    </div>
  );
};
