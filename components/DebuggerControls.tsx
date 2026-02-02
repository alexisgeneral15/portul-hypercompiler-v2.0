
import React from 'react';
import { Translation } from '../utils/translations';
import { ContinueIcon } from './icons/ContinueIcon';
import { StepOverIcon } from './icons/StepOverIcon';
import { StepIntoIcon } from './icons/StepIntoIcon';
import { StepOutIcon } from './icons/StepOutIcon';
import { StopIcon } from './icons/StopIcon';

interface DebuggerControlsProps {
  onStep: (stepType: 'continue' | 'step_over' | 'step_into' | 'step_out') => void;
  onStop: () => void;
  isFinished: boolean;
  t: Translation;
}

export const DebuggerControls: React.FC<DebuggerControlsProps> = ({ onStep, onStop, isFinished, t }) => {
  const controls = [
    { type: 'continue', label: t.debug.controls.continue, icon: <ContinueIcon /> },
    { type: 'step_over', label: t.debug.controls.stepOver, icon: <StepOverIcon /> },
    { type: 'step_into', label: t.debug.controls.stepInto, icon: <StepIntoIcon /> },
    { type: 'step_out', label: t.debug.controls.stepOut, icon: <StepOutIcon /> },
  ];

  return (
    <div className="flex-shrink-0 bg-slate-900/50 p-1 flex items-center gap-2 border-b border-slate-700">
      {controls.map(control => (
        <button
          key={control.type}
          title={control.label}
          onClick={() => onStep(control.type as 'continue' | 'step_over' | 'step_into' | 'step_out')}
          disabled={isFinished}
          className="p-1.5 rounded-md hover:bg-slate-700 disabled:text-slate-600 disabled:hover:bg-transparent text-slate-300 transition-colors"
        >
          {control.icon}
        </button>
      ))}
      <div className="h-6 w-px bg-slate-700 mx-2"></div>
      <button
        title={t.debug.controls.stop}
        onClick={onStop}
        className="p-1.5 rounded-md hover:bg-slate-700 text-red-400 hover:text-red-300 transition-colors"
      >
        <StopIcon />
      </button>
    </div>
  );
};
