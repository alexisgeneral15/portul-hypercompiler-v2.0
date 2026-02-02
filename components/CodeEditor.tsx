
import React, { useMemo, useRef, useEffect } from 'react';
import { Diagnostic } from '../services/portulToolchainService';
import { highlightPortulCode } from '../utils/syntaxHighlighter';
import { BreakpointIcon } from './icons/BreakpointIcon';
import { SentinelIcon } from './icons/SentinelIcon';

interface CodeEditorProps {
    code: string;
    onCodeChange: (newCode: string) => void;
    diagnostics: Diagnostic[];
    breakpoints: Set<number>;
    onBreakpointToggle: (line: number) => void;
    onWeaveIntent: (intent: string) => void;
    activeLine?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, diagnostics, breakpoints, onBreakpointToggle, onWeaveIntent, activeLine }) => {
    const lines = useMemo(() => code.split('\n'), [code]);
    const diagnosticsMap = useMemo(() => {
        const map = new Map<number, Diagnostic[]>();
        diagnostics.forEach(d => {
            if (!map.has(d.line)) map.set(d.line, []);
            map.get(d.line)!.push(d);
        });
        return map;
    }, [diagnostics]);

    const backdropRef = useRef<HTMLDivElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (activeLine && backdropRef.current) {
            const lineElement = backdropRef.current.children[activeLine - 1] as HTMLElement;
            if (lineElement) {
                lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeLine]);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (backdropRef.current) {
            backdropRef.current.scrollTop = e.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
        if (gutterRef.current) {
            gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const getLineHighlightClass = (lineDiagnostics?: Diagnostic[]): string => {
        if (!lineDiagnostics || lineDiagnostics.length === 0) return '';
        const hasError = lineDiagnostics.some(d => d.severity === 'error');
        if (hasError) return 'bg-red-500/10';
        return '';
    };

    const renderGutterIcons = (lineNum: number) => {
        const lineDiagnostics = diagnosticsMap.get(lineNum);
        const sentinel = lineDiagnostics?.find(d => d.severity === 'performance' || d.severity === 'logic' || d.severity === 'memory' || d.severity === 'intent');
        
        return (
            <>
                <button onClick={() => onBreakpointToggle(lineNum)} className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
                   {breakpoints.has(lineNum) ? <BreakpointIcon active={activeLine === lineNum} /> : <div className="w-4 h-4"><div className="w-2 h-2 rounded-full bg-slate-600 mt-1 ml-1 hover:bg-red-500/50"></div></div>}
                </button>
                {sentinel && (
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group">
                        <SentinelIcon 
                            severity={sentinel.severity} 
                            onClick={sentinel.severity === 'intent' ? () => onWeaveIntent(sentinel.message) : undefined}
                        />
                         <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max max-w-xs bg-slate-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700 shadow-lg`}>
                            <strong className={`capitalize font-bold ${sentinel.severity === 'intent' ? 'text-purple-400' : 'text-cyan-400'}`}>{sentinel.severity} Sentinel:</strong> {sentinel.message}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="relative flex flex-grow bg-[--bg-color-dark] w-full h-full font-mono text-base leading-relaxed overflow-hidden">
            <div ref={gutterRef} className="editor-gutter overflow-hidden select-none" style={{ paddingRight: '2.5rem' }}>
                {lines.map((_, index) => {
                    const lineNum = index + 1;
                    return (
                        <div key={index} className="h-[1.5rem] flex items-center justify-end relative">
                            <span>{lineNum}</span>
                            {renderGutterIcons(lineNum)}
                        </div>
                    );
                })}
            </div>
            <div className="relative flex-grow h-full">
                <div ref={backdropRef} className="absolute inset-0 p-4 overflow-auto pointer-events-none whitespace-pre">
                    {lines.map((line, index) => {
                         const lineNum = index + 1;
                         const lineDiagnostics = diagnosticsMap.get(lineNum);
                         let highlightClass = getLineHighlightClass(lineDiagnostics);
                         if (activeLine === lineNum) {
                            highlightClass = 'bg-lime-500/20';
                         }
                        return (
                            <div key={index} className={`h-[1.5rem] ${highlightClass}`} dangerouslySetInnerHTML={{ __html: highlightPortulCode(line) || ' ' }} />
                        );
                    })}
                </div>
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck="false"
                    className="absolute inset-0 p-4 bg-transparent text-transparent caret-[--accent-color] resize-none outline-none whitespace-pre"
                    style={{ lineHeight: '1.5rem' }}
                />
            </div>
        </div>
    );
};
