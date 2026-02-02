
import React from 'react';
import { HistoryEntry } from '../utils/replHistory';
import { Translation } from '../utils/translations';
import { AIPendingAction } from '../services/portulToolchainService';
import { AtomIcon } from './icons/AtomIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { highlightPortulCode } from '../utils/syntaxHighlighter';
import { SparklesIcon } from './icons/SparklesIcon';

interface AIAssistantResponseProps {
  entry: HistoryEntry;
  onConfirm: (action: AIPendingAction) => void;
  onReject: (action: AIPendingAction) => void;
  t: Translation;
}

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const safeCode = code ?? '';
  const lines = safeCode.split('\n');
  return (
    <pre className="mt-2 bg-slate-950/70 p-3 rounded-md border border-slate-700 text-xs overflow-x-auto">
      <code>
        {lines.map((line, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: highlightPortulCode(line) || ' ' }} />
        ))}
      </code>
    </pre>
  );
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const processLine = (line: string) => {
        return line
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-700/80 text-amber-300 rounded px-1 py-0.5 font-semibold text-xs">$1</code>');
    };
    
  const safeText = text ?? '';
  const lines = safeText.split('\n');
    let inList = false;
    const htmlElements: string[] = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ')) {
            if (!inList) {
                htmlElements.push('<ul class="space-y-1 mt-2 list-inside">');
                inList = true;
            }
            htmlElements.push(`<li class="list-disc ml-4">${processLine(trimmedLine.substring(2))}</li>`);
        } else {
            if (inList) {
                htmlElements.push('</ul>');
                inList = false;
            }
            htmlElements.push(processLine(line));
        }
    });

    if (inList) {
        htmlElements.push('</ul>');
    }

    const html = htmlElements.join('<br />').replace(/<br \/>(<ul|<\/ul>)/g, '$1').replace(/(<ul|<\/ul>)<br \/>/g, '$1').replace(/<br \/><li/g, '<li');

    return <div className="whitespace-pre-wrap text-slate-300 break-words" dangerouslySetInnerHTML={{ __html: html }} />;
};


export const AIAssistantResponse: React.FC<AIAssistantResponseProps> = ({ entry, onConfirm, onReject, t }) => {
  const isAether = entry.aiMode === 'aether';
  
  return (
    <div className={`flex gap-3 ${entry.type === 'input' ? 'justify-end' : ''}`}>
      {entry.type === 'output' && (
        <div className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center mt-1 ${isAether ? 'bg-purple-900/50 border-purple-500/30' : 'bg-cyan-900/50 border-cyan-500/30'}`}>
            {isAether ? <AtomIcon className="w-3 h-3 text-purple-400" /> : <SparklesIcon className="w-3 h-3 text-cyan-400" />}
        </div>
      )}
      <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed border ${
        entry.type === 'input' 
          ? 'bg-slate-700 text-slate-100 border-slate-600' 
          : isAether
            ? 'bg-slate-900/50 text-slate-300 border-purple-500/10'
            : 'bg-slate-900/50 text-slate-300 border-cyan-500/10'
      }`}>
        <SimpleMarkdown text={entry.content} />
        
        {entry.pendingAction && (
          <div className="mt-4 border-t border-slate-700 pt-3">
            <p className="text-xs font-bold text-slate-400 mb-2">Acción Propuesta:</p>
            <CodeBlock code={entry.pendingAction.content} />
            <p className="text-xs text-yellow-400 mt-3 font-semibold">{t.aiResponses.confirmation}</p>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => onConfirm(entry.pendingAction!)}
                className="flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-md transition-colors"
              >
                <CheckIcon /> {t.aiResponses.confirm}
              </button>
              <button 
                onClick={() => onReject(entry.pendingAction!)}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-md transition-colors"
              >
                <XIcon /> {t.aiResponses.reject}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
