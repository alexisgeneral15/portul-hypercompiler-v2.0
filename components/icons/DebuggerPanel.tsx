
import React from 'react';

interface DebuggerPanelProps {
  trace: string[];
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ trace }) => {
  const renderTraceLine = (line: string, index: number) => {
    let classes = 'text-slate-400';
    if (line.startsWith('[VM]')) classes = 'text-purple-400 font-bold';
    if (line.startsWith('[L')) {
        if (line.includes('DECLARE')) classes = 'text-sky-400';
        if (line.includes('EXECUTE')) classes = 'text-lime-400';
        if (line.includes('OUTPUT')) classes = 'text-amber-400';
    }
    if (line.startsWith('---')) classes = 'text-slate-500 mt-2';
    
    return (
      <div key={index}>
        <span className={classes}>{line}</span>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-slate-800 p-4">
      <div className="flex-grow overflow-auto font-mono text-xs">
        {trace.map(renderTraceLine)}
      </div>
    </div>
  );
};
