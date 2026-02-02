
import React, { useRef, useEffect } from 'react';
import { Translation } from '../utils/translations';
import { HistoryEntry } from '../utils/replHistory';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { AIAssistantResponse } from './AIAssistantResponse';
import { AIPendingAction } from '../services/portulToolchainService';
import { AtomIcon } from './icons/AtomIcon';

interface AIAssistantPanelProps {
  t: Translation;
  history: HistoryEntry[];
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSend: (promptOverride?: string) => void;
  isLoading: boolean;
  onConfirm: (action: AIPendingAction) => void;
  onReject: (action: AIPendingAction) => void;
  aiMode: 'gemini' | 'aether';
  onAiModeChange: (mode: 'gemini' | 'aether') => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ t, history, prompt, setPrompt, onSend, isLoading, onConfirm, onReject, aiMode, onAiModeChange }) => {
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const safePrompt = prompt ?? '';

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSendInternal = () => {
    if (isLoading || !safePrompt.trim()) return;
    onSend();
  };

  const handleQuickAction = (promptText: string) => {
    if (!promptText || !promptText.trim()) return;
    onSend(promptText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendInternal();
      }
  };

  const isAetherMode = aiMode === 'aether';

  return (
    <div className="flex flex-col h-full bg-slate-800 border-l border-slate-700 w-96">
      <div className="flex-shrink-0 px-3 py-2 bg-slate-900 text-sm flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-200">{t.aiAssistant}</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md">
            <button 
                onClick={() => onAiModeChange('gemini')}
                className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${!isAetherMode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <SparklesIcon className="w-3 h-3"/> {t.aiModes.gemini}
            </button>
            <button 
                onClick={() => onAiModeChange('aether')}
                className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${isAetherMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <AtomIcon className="w-3 h-3"/> {t.aiModes.aether}
            </button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto overflow-x-auto space-y-4 scroll-smooth">
        {history.map((entry, index) => (
          <AIAssistantResponse 
            key={index}
            entry={entry}
            onConfirm={onConfirm}
            onReject={onReject}
            t={t}
          />
        ))}
        {isLoading && !history.some(h => h.pendingAction) && (
            <div className="flex gap-3">
                <div className={`w-6 h-6 rounded-full ${isAetherMode ? 'bg-purple-900/50 border-purple-500/30' : 'bg-cyan-900/50 border-cyan-500/30'} border flex-shrink-0 flex items-center justify-center`}>
                  {isAetherMode ? <AtomIcon className="w-3 h-3 text-purple-400 animate-spin-slow"/> : <SparklesIcon className="w-3 h-3 text-cyan-400 animate-spin-slow"/>}
                </div>
                <div className={`max-w-xl p-3 rounded-lg ${isAetherMode ? 'bg-slate-900/30 border-purple-500/5' : 'bg-slate-900/30 border-cyan-500/5'} border`}>
                    <p className={`animate-pulse text-xs font-mono ${isAetherMode ? 'text-purple-400' : 'text-cyan-500'}`}>{t.aiThinking}</p>
                </div>
            </div>
        )}
        <div ref={endOfHistoryRef} />
      </div>

      <div className="flex-shrink-0 p-3 border-t border-slate-700 bg-slate-900/80">
        {isAetherMode && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => handleQuickAction(t.nano.deepAnalysisPrompt)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded p-1.5 transition-colors">{t.nano.deepAnalysis}</button>
            <button onClick={() => handleQuickAction(t.nano.suggestImprovementsPrompt)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded p-1.5 transition-colors">{t.nano.suggestImprovements}</button>
            <button onClick={() => handleQuickAction(t.nano.learnCodePrompt)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded p-1.5 transition-colors">{t.nano.learnCode}</button>
            <button onClick={() => handleQuickAction(t.nano.fixErrorsPrompt)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded p-1.5 transition-colors">{t.nano.fixErrors}</button>
          </div>
        )}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={safePrompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? t.aiResponses.waitForResponse : (isAetherMode ? t.nano.placeholder : t.askAI)}
            disabled={isLoading}
            className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-12 text-sm text-slate-200 outline-none ${isAetherMode ? 'focus:border-purple-500/50' : 'focus:border-cyan-500/50'} transition-all resize-none font-mono disabled:opacity-50`}
            rows={1}
          />
          <button 
            onClick={handleSendInternal} 
            disabled={isLoading || !safePrompt.trim()} 
            className={`absolute right-2 bottom-2.5 p-2 rounded-md text-white ${isAetherMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-cyan-600 hover:bg-cyan-500'} disabled:bg-slate-800 disabled:text-slate-600 transition-colors shadow-lg`}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
