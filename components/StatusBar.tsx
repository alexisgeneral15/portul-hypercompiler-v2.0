
import React from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { Translation } from '../utils/translations';
import { CpuChipIcon } from './icons/CpuChipIcon';
import { MemoryIcon } from './icons/MemoryIcon';

interface StatusBarProps {
    isLoading: boolean;
    target: string;
    faradayMode: boolean;
    t: Translation;
    cpuUsage: number;
    ramUsage: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isLoading, target, faradayMode, t, cpuUsage, ramUsage }) => {
    const TOTAL_RAM_KB = 236;
    const TOTAL_CPU_MHZ = 1.0;
    const statusText = isLoading ? t.status.compiling : t.status.hyperEfficientIdle;
    
    const cpuPercentage = (cpuUsage / TOTAL_CPU_MHZ) * 100;
    const ramPercentage = (ramUsage / TOTAL_RAM_KB) * 100;
    
    return (
        <footer className="flex-shrink-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-cyan-500/20 text-xs px-4 py-2 flex justify-between items-center text-slate-300 shadow-lg">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50' : 'bg-green-400 shadow-lg shadow-green-400/50'}`}></div>
                    <span className="font-medium">{statusText}</span>
                </div>
                {target && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-purple-500/30">
                        <span className="text-purple-400">🎯</span>
                        <span className="font-medium text-purple-300">{target}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-blue-500/30 hover:border-blue-400/50 transition-all cursor-help group" title="CPU Usage">
                    <CpuChipIcon />
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-blue-300">{cpuUsage.toFixed(2)} MHz</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-400">{TOTAL_CPU_MHZ.toFixed(1)}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                                style={{ width: `${Math.min(cpuPercentage, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                 </div>
                 <div className="h-6 w-px bg-slate-700"></div>
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-green-500/30 hover:border-green-400/50 transition-all cursor-help group" title="RAM Usage">
                    <MemoryIcon />
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-green-300">{ramUsage.toFixed(1)} KB</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-400">{TOTAL_RAM_KB}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                                style={{ width: `${Math.min(ramPercentage, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                 </div>
                {faradayMode && (
                    <>
                        <div className="h-6 w-px bg-slate-700"></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 hover:border-green-400/50 transition-all" title="Faraday Mode: All network activity is blocked">
                            <ShieldCheckIcon />
                            <span className="font-bold text-green-400">OFFLINE</span>
                        </div>
                    </>
                )}
            </div>
        </footer>
    );
};
