
import React from 'react';
import { Translation } from '../utils/translations';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

export interface NetworkEntry {
    id: number;
    status: 'ok' | 'blocked';
    method: 'POST' | 'GET';
    protocol: string;
    target: string;
    time: number;
}

interface NetworkAxiomPanelProps {
    log: NetworkEntry[];
    faradayMode: boolean;
    onToggleFaradayMode: (enabled: boolean) => void;
    t: Translation;
}

const FaradayToggle: React.FC<{ enabled: boolean; onToggle: (e: boolean) => void; t: Translation; }> = ({ enabled, onToggle, t }) => (
    <div className="flex items-center gap-4">
        <label className="text-sm font-bold text-slate-300">{t.network.faradayMode}</label>
        <button
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-red-500' : 'bg-slate-700'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
        <span className={`text-xs font-bold ${enabled ? 'text-red-400' : 'text-green-400'}`}>
            {enabled ? t.network.enabled : t.network.disabled}
        </span>
    </div>
);

export const NetworkAxiomPanel: React.FC<NetworkAxiomPanelProps> = ({ log, faradayMode, onToggleFaradayMode, t }) => {
    return (
        <div className="flex flex-col h-full bg-slate-800 text-sm">
            <header className="flex-shrink-0 p-3 border-b border-slate-700 bg-slate-900/50">
                <FaradayToggle enabled={faradayMode} onToggle={onToggleFaradayMode} t={t} />
            </header>
            
            <div className="flex-grow p-2 overflow-auto relative">
                {faradayMode && (
                    <div className="absolute inset-0 bg-red-900/20 backdrop-blur-sm flex flex-col items-center justify-center text-center z-10">
                         <ShieldCheckIcon />
                        <p className="mt-2 font-bold text-red-300">{t.network.blocked}</p>
                    </div>
                )}
                {log.length === 0 && !faradayMode ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        {t.network.noRequests}
                    </div>
                ) : (
                    <table className="w-full font-mono text-xs">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="p-1 font-semibold">{t.network.status}</th>
                                <th className="p-1 font-semibold">{t.network.method}</th>
                                <th className="p-1 font-semibold">{t.network.protocol}</th>
                                <th className="p-1 font-semibold">{t.network.target}</th>
                                <th className="p-1 font-semibold text-right">{t.network.time}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {log.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-700/50">
                                    <td className="p-1">
                                        <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-bold ${entry.status === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>
                                            {entry.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-1 text-sky-300">{entry.method}</td>
                                    <td className="p-1 text-purple-300">{entry.protocol}</td>
                                    <td className="p-1 text-slate-300 truncate">{entry.target}</td>
                                    <td className="p-1 text-amber-300 text-right">{entry.time}ms</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
