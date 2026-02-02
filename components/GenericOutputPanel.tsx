
import React from 'react';

interface GenericOutputPanelProps {
  content: string;
}

export const GenericOutputPanel: React.FC<GenericOutputPanelProps> = ({ content }) => {
  // Parse and colorize output
  const formatOutput = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let className = 'text-slate-300';
      let icon = '';
      
      // Detect line types and add color/icons
      if (line.includes('✓') || line.includes('SUCCESS') || line.includes('Complete')) {
        className = 'text-green-400 font-semibold';
        icon = '✓';
      } else if (line.includes('ERROR') || line.includes('Failed')) {
        className = 'text-red-400 font-semibold';
        icon = '✗';
      } else if (line.includes('WARNING') || line.includes('warn')) {
        className = 'text-yellow-400';
        icon = '⚠';
      } else if (line.includes('INFO') || line.includes('Starting')) {
        className = 'text-blue-400';
        icon = 'ℹ';
      } else if (line.includes('[') && line.includes(']')) {
        className = 'text-cyan-400'; // Phase/stage markers
      } else if (line.match(/^\d+\s+(pass|optimization)/i)) {
        className = 'text-purple-400'; // Optimization passes
      } else if (line.includes('→') || line.includes('->')) {
        className = 'text-emerald-400'; // Transformations
      }
      
      return (
        <div key={idx} className="flex items-start gap-2 py-0.5 hover:bg-slate-800/30 transition-colors group">
          {icon && <span className="text-xs mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>}
          <span className={className}>{line}</span>
        </div>
      );
    });
  };
  
  return (
    <div className="p-4 h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 custom-scrollbar">
      <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 font-mono text-sm">
        {content ? formatOutput(content) : (
          <div className="text-slate-500 italic flex items-center gap-2">
            <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Ready to build...</span>
          </div>
        )}
      </div>
    </div>
  );
};
