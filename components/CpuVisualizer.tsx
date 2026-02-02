
import React from 'react';
import { DebuggerState } from '../services/portulToolchainService';
import { CpuChipIcon } from './icons/CpuChipIcon';

interface CpuVisualizerProps {
    state: DebuggerState;
}

const Register: React.FC<{ name: string; value: string | number }> = ({ name, value }) => (
    <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
        <span className="font-bold text-sky-300">{name.toUpperCase()}</span>
        <span className="text-amber-300 font-mono text-lg">{String(value).padStart(2, '0')}</span>
    </div>
);

export const CpuVisualizer: React.FC<CpuVisualizerProps> = ({ state }) => {
    return (
        <div className="p-4 flex items-center justify-center h-full">
            <div className="w-full max-w-sm border-2 border-slate-700 rounded-lg bg-slate-950/50 p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <CpuChipIcon />
                    <h3 className="text-xl font-bold text-cyan-400">Axiom Core (1MHz)</h3>
                </div>
                <div className="space-y-2">
                    <Register name="rip" value={state.registers.rip || 0} />
                    <Register name="rax" value={state.registers.rax || 0} />
                    <Register name="rbx" value={state.registers.rbx || 0} />
                </div>
                 <div className="text-xs text-slate-500 mt-4 text-center">
                    RIP: Instruction Pointer | RAX: Accumulator | RBX: Base
                 </div>
            </div>
        </div>
    );
};
