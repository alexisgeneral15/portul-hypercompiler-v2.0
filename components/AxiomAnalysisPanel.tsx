
import React from 'react';
import { Diagnostic } from '../services/portulToolchainService';
import { ErrorIcon } from './icons/ErrorIcon';
import { WarningIcon } from './icons/WarningIcon';
import { InfoIcon } from './icons/InfoIcon';
import { BrainIcon } from './icons/BrainIcon';
import { LinkIcon } from './icons/LinkIcon';

interface AxiomAnalysisPanelProps {
    diagnostics: Diagnostic[];
}

const DiagnosticCard: React.FC<{ diagnostic: Diagnostic }> = ({ diagnostic }) => {
    const getIconAndColor = () => {
        switch (diagnostic.severity) {
            case 'error':
            case 'memory':
                return { 
                    icon: <ErrorIcon />, 
                    color: 'border-l-red-500', 
                    bg: 'bg-red-500/10', 
                    badge: 'ERROR',
                    badgeColor: 'bg-red-500 text-white' 
                };
            case 'warning':
                return { 
                    icon: <WarningIcon />, 
                    color: 'border-l-yellow-500', 
                    bg: 'bg-yellow-500/10', 
                    badge: 'WARNING',
                    badgeColor: 'bg-yellow-500 text-slate-900' 
                };
            case 'info':
            case 'logic':
                return { 
                    icon: <InfoIcon />, 
                    color: 'border-l-sky-500', 
                    bg: 'bg-sky-500/10', 
                    badge: 'INFO',
                    badgeColor: 'bg-sky-500 text-white' 
                };
            case 'performance':
                return { 
                    icon: <InfoIcon />, 
                    color: 'border-l-purple-500', 
                    bg: 'bg-purple-500/10', 
                    badge: 'HINT',
                    badgeColor: 'bg-purple-500 text-white' 
                };
        }
    };
    const { icon, color, bg, badge, badgeColor } = getIconAndColor();

    return (
        <div className={`${bg} border ${color} border-slate-700/50 rounded-lg p-4 flex items-start gap-3 hover:border-slate-600 transition-all cursor-pointer group`}>
            <div className="flex-shrink-0 mt-1 group-hover:scale-110 transition-transform">{icon}</div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                        {badge}
                    </span>
                    {diagnostic.code && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {diagnostic.code}
                        </span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">Line {diagnostic.line}</span>
                </div>
                <p className="font-semibold text-slate-200 leading-relaxed">{diagnostic.message}</p>
                 {diagnostic.relations && diagnostic.relations.length > 0 && (
                     <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 bg-slate-800/50 rounded px-2 py-1 border border-slate-700/50">
                        <LinkIcon /> Related: {diagnostic.relations.map(r => `L${r}`).join(', ')}
                    </p>
                 )}
            </div>
        </div>
    );
};

export const AxiomAnalysisPanel: React.FC<AxiomAnalysisPanelProps> = ({ diagnostics }) => {
    const errorCount = diagnostics.filter(d => d.severity === 'error' || d.severity === 'memory').length;
    const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
    const infoCount = diagnostics.filter(d => d.severity === 'info' || d.severity === 'logic' || d.severity === 'performance').length;
    
    if (diagnostics.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
                <div className="bg-green-500/10 border border-green-500/30 rounded-full p-6 mb-4">
                    <BrainIcon />
                </div>
                <p className="mt-2 font-bold text-lg text-green-400">All Clear!</p>
                <p className="text-sm text-slate-400">No issues detected in your code.</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
            <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BrainIcon />
                    <span className="font-bold text-slate-300">Axiom Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    {errorCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                            {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold">
                            {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                        </span>
                    )}
                    {infoCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                            {infoCount} {infoCount === 1 ? 'Hint' : 'Hints'}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-grow p-4 overflow-auto space-y-3 custom-scrollbar">
                {diagnostics.map((diag, index) => (
                    <DiagnosticCard key={index} diagnostic={diag} />
                ))}
            </div>
        </div>
    );
};
