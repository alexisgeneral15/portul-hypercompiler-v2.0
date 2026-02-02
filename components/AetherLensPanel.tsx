
import React, { useState } from 'react';
import { Translation } from '../utils/translations';
import { DebuggerState } from '../services/portulToolchainService';
import { CallGraph } from './CallGraph';
import { MemoryLayout } from './MemoryLayout';
import { CpuVisualizer } from './CpuVisualizer';

interface AetherLensPanelProps {
    code: string;
    activeFile: string;
    debuggerState: DebuggerState | null;
    t: Translation;
}

export const AetherLensPanel: React.FC<AetherLensPanelProps> = ({ code, activeFile, debuggerState, t }) => {
    const [activeTab, setActiveTab] = useState('callGraph');

    const renderContent = () => {
        if (activeTab === 'callGraph') {
            if (!activeFile.endsWith('.portulpp')) {
                return <div className="flex items-center justify-center h-full text-slate-500">{t.aetherLensTabs.selectFile}</div>
            }
            return <CallGraph code={code} />;
        }
        if (activeTab === 'memoryLayout') {
            if (!debuggerState) {
                return <div className="flex items-center justify-center h-full text-slate-500">{t.aetherLensTabs.debugToView}</div>
            }
            return <MemoryLayout state={debuggerState} />;
        }
        if (activeTab === 'cpuCore') {
             if (!debuggerState) {
                return <div className="flex items-center justify-center h-full text-slate-500">{t.aetherLensTabs.debugToView}</div>
            }
            return <CpuVisualizer state={debuggerState} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50">
            <div className="flex-shrink-0 flex items-center border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('callGraph')}
                    className={`px-4 py-2 text-xs font-bold ${activeTab === 'callGraph' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                    {t.aetherLensTabs.callGraph}
                </button>
                <button
                    onClick={() => setActiveTab('memoryLayout')}
                    className={`px-4 py-2 text-xs font-bold ${activeTab === 'memoryLayout' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                    {t.aetherLensTabs.memoryLayout}
                </button>
                 <button
                    onClick={() => setActiveTab('cpuCore')}
                    className={`px-4 py-2 text-xs font-bold ${activeTab === 'cpuCore' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                    {t.aetherLensTabs.cpuCore}
                </button>
            </div>
            <div className="flex-grow p-2 overflow-auto">
                {renderContent()}
            </div>
        </div>
    );
};
