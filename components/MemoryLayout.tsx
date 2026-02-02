import React from 'react';
import { DebuggerState } from '../services/portulToolchainService';

interface MemoryLayoutProps {
    state: DebuggerState;
}

const renderValue = (value: any): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (value === null) return 'nil';
    return String(value);
};

export const MemoryLayout: React.FC<MemoryLayoutProps> = ({ state }) => {
    return (
        <div className="font-mono text-xs text-slate-400 p-2">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">Stack Memory Layout</h3>
            <div className="border-2 border-slate-700 bg-slate-950/50 p-1 rounded-sm">
                <div className="flex justify-between items-center text-slate-500 px-1 border-b border-dashed border-slate-700">
                    <span>Address</span>
                    <span>Label</span>
                    <span>Type</span>
                    <span>Value</span>
                </div>
                {/* FIX: Use Object.keys to iterate, which provides stronger type inference than Object.entries for record types. */}
                {Object.keys(state.variables).map((name) => {
                    const data = state.variables[name];
                    return (
                        <div key={name} className="flex justify-between items-center px-1 py-0.5 hover:bg-slate-700/50">
                            <span className="text-lime-400">{data.address}</span>
                            <span className="text-sky-300">{name}</span>
                            <span className="text-purple-300">{data.type}</span>
                            <span className="text-amber-300">{renderValue(data.value)}</span>
                        </div>
                    );
                })}
                <div className="text-center text-slate-600 pt-2">...</div>
                <div className="flex justify-between items-center px-1 py-0.5 text-slate-600">
                    <span>0x00</span>
                    <span>[Stack Base]</span>
                    <span>-</span>
                    <span>-</span>
                </div>
            </div>
        </div>
    );
};