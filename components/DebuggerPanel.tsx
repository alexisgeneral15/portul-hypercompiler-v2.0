
import React from 'react';
// FIX: Import the DebuggerState type to correctly type the component's state prop.
import { DebuggerState } from '../services/portulToolchainService';
import { Translation } from '../utils/translations';
import { DebuggerControls } from './DebuggerControls';

interface DebuggerPanelProps {
  state: DebuggerState | null;
  onStep: (stepType: 'continue' | 'step_over' | 'step_into' | 'step_out') => void;
  onStop: () => void;
  isDebugging: boolean;
  t: Translation;
}

const renderValue = (value: any): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (value === null) return 'nil';
    return String(value);
};

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ state, onStep, onStop, isDebugging, t }) => {

  if (!isDebugging) {
    return (
        <div className="flex h-full items-center justify-center text-slate-500 p-4 text-center">
            {t.debug.notStarted}
        </div>
    );
  }
  
  if (!state) {
    return <div className="flex h-full items-center justify-center text-slate-500">{t.status.compiling}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-800">
        <DebuggerControls onStep={onStep} onStop={onStop} isFinished={state.isFinished} t={t} />
        {state.isFinished ? (
            <div className="flex-grow flex items-center justify-center text-slate-400">{t.debug.finished}</div>
        ) : (
            <div className="flex-grow flex p-2 gap-2 overflow-hidden">
                <div className="w-1/3 flex flex-col gap-2">
                    {/* Variables */}
                    <div className="bg-slate-900/50 rounded-md p-2 flex-grow flex flex-col">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.debug.variables}</h3>
                        <div className="overflow-auto text-xs">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="p-1 font-semibold">Name</th>
                                        <th className="p-1 font-semibold">Type</th>
                                        <th className="p-1 font-semibold">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* FIX: Reworked iteration to use Object.keys to avoid type inference issues with Object.entries. This ensures the variable's properties are correctly typed. */}
                                    {Object.keys(state.variables).map((key) => {
                                        const variable = state.variables[key];
                                        return (
                                            <tr key={key} className="hover:bg-slate-700/50">
                                                <td className="p-1 text-sky-300">{key}</td>
                                                <td className="p-1 text-purple-300">{variable.type}</td>
                                                <td className="p-1 text-amber-300">{renderValue(variable.value)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Call Stack */}
                    <div className="bg-slate-900/50 rounded-md p-2 flex-shrink-0">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.debug.callStack}</h3>
                         <ul className="text-xs space-y-1">
                            {state.callStack.map((func, index) => (
                                <li key={index} className={`px-1 ${index === 0 ? 'text-lime-300 font-bold' : 'text-slate-400'}`}>
                                    {func}
                                </li>
                            ))}
                         </ul>
                    </div>
                </div>
                {/* Console */}
                <div className="w-2/3 bg-slate-900/50 rounded-md p-2 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.debug.console}</h3>
                    <div className="overflow-auto flex-grow text-xs text-slate-300 whitespace-pre-wrap">
                        {state.output.length > 0 ? state.output.join('\n') : <span className="text-slate-500">{t.debugStrings.noConsoleOutput}</span>}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
