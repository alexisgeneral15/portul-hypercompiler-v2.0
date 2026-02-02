
import React from 'react';
import { BrainIcon } from './icons/BrainIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { BugIcon } from './icons/BugIcon';
import { AetherLensIcon } from './icons/AetherLensIcon';
import { SignalIcon } from './icons/SignalIcon';
import { CogIcon } from './icons/CogIcon';
import { Translation } from '../utils/translations';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { PlayIcon } from './icons/PlayIcon';

interface TabbedPanelProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    renderPanelContent: (tabId: string) => React.ReactNode;
    t: Translation;
}

export const TabbedPanel: React.FC<TabbedPanelProps> = ({ activeTab, onTabChange, renderPanelContent, t }) => {
    const TABS = [
        { id: 'axiom_analysis', label: t.axiomAnalysis, icon: <BrainIcon /> },
        { id: 'compiler', label: t.compiler, icon: <CogIcon /> },
        { id: 'bootstrap', label: '🔨 Bootstrap', icon: <PlayIcon /> },
        { id: 'build_output', label: t.genericOutput, icon: <TerminalIcon /> },
        { id: 'debugger', label: t.debugger, icon: <BugIcon /> },
        { id: 'aether_lens', label: t.aetherLens, icon: <AetherLensIcon /> },
        { id: 'asm', label: t.asm.tab, icon: <CodeBracketIcon /> },
        { id: 'network_axiom', label: t.networkAxiom, icon: <SignalIcon /> },
    ];
    return (
        <div className="flex flex-col h-full bg-[--bg-color-dark]">
            <div className="flex-shrink-0 flex items-center border-b border-[--border-color]">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === tab.id
                                ? 'text-[--accent-color] border-[--accent-color]'
                                : 'text-[--text-color-medium] border-transparent hover:bg-white/5'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-grow overflow-auto">
                {renderPanelContent(activeTab)}
            </div>
        </div>
    );
};
