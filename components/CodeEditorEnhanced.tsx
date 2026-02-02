
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Diagnostic } from '../services/portulToolchainService';
import { highlightPortulCode } from '../utils/syntaxHighlighter';
import { BreakpointIcon } from './icons/BreakpointIcon';
import { SentinelIcon } from './icons/SentinelIcon';
import { LanguageServer, CompletionItem, HoverInfo } from '../services/languageServer';
import { RefactoringEngine } from '../services/refactoringEngine';
import './EditorEnhancements.css';

interface CodeEditorEnhancedProps {
    code: string;
    onCodeChange: (newCode: string) => void;
    diagnostics: Diagnostic[];
    breakpoints: Set<number>;
    onBreakpointToggle: (line: number) => void;
    onWeaveIntent: (intent: string) => void;
    activeLine?: number;
}

interface CompletionListState {
    items: CompletionItem[];
    position: { line: number; character: number };
    selectedIndex: number;
}

interface ContextMenuState {
    x: number;
    y: number;
    selectedText: string;
    selectedRange: { start: number; end: number };
}

export const CodeEditorEnhanced: React.FC<CodeEditorEnhancedProps> = ({ 
    code, 
    onCodeChange, 
    diagnostics, 
    breakpoints, 
    onBreakpointToggle, 
    onWeaveIntent, 
    activeLine 
}) => {
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
    const completionRef = useRef<HTMLDivElement>(null);

    // IntelliSense State
    const [completionList, setCompletionList] = useState<CompletionListState | null>(null);
    const [hoverInfo, setHoverInfo] = useState<{ info: HoverInfo; x: number; y: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [showSignatureHelp, setShowSignatureHelp] = useState(false);

    const languageServer = useMemo(() => {
        const LS = LanguageServer as any;
        return LS.getInstance ? LS.getInstance() : new LanguageServer();
    }, []);
    const refactoringEngine = useMemo(() => {
        const RE = RefactoringEngine as any;
        return RE.getInstance ? RE.getInstance() : new RefactoringEngine();
    }, []);

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
        // Hide completion list on scroll
        setCompletionList(null);
        setHoverInfo(null);
    };

    const getCursorPosition = (): { line: number; character: number } => {
        if (!textareaRef.current) return { line: 0, character: 0 };
        
        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = code.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        
        return {
            line: lines.length,
            character: lines[lines.length - 1].length
        };
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle completion list navigation
        if (completionList) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCompletionList(prev => prev ? {
                    ...prev,
                    selectedIndex: Math.min(prev.selectedIndex + 1, prev.items.length - 1)
                } : null);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCompletionList(prev => prev ? {
                    ...prev,
                    selectedIndex: Math.max(prev.selectedIndex - 1, 0)
                } : null);
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (completionList.items[completionList.selectedIndex]) {
                    insertCompletion(completionList.items[completionList.selectedIndex]);
                }
                return;
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setCompletionList(null);
                return;
            }
        }

        // Trigger IntelliSense
        if (e.ctrlKey && e.key === ' ') {
            e.preventDefault();
            triggerCompletion();
        }

        // Trigger signature help
        if (e.key === '(' || (e.ctrlKey && e.shiftKey && e.key === ' ')) {
            setTimeout(() => triggerSignatureHelp(), 0);
        }
    };

    const triggerCompletion = useCallback(() => {
        const position = getCursorPosition();
        const completions = languageServer.provideCompletionItems(code, position);
        
        if (completions.length > 0 && textareaRef.current) {
            setCompletionList({
                items: completions,
                position,
                selectedIndex: 0
            });
        }
    }, [code, languageServer]);

    const triggerSignatureHelp = useCallback(() => {
        const position = getCursorPosition();
        const signature = languageServer.provideSignatureHelp(code, position);
        
        if (signature) {
            setShowSignatureHelp(true);
            setTimeout(() => setShowSignatureHelp(false), 5000);
        }
    }, [code, languageServer]);

    const insertCompletion = (item: CompletionItem) => {
        if (!textareaRef.current) return;
        
        const cursorPos = textareaRef.current.selectionStart;
        const textBefore = code.substring(0, cursorPos);
        const textAfter = code.substring(cursorPos);
        
        // Find the start of the current word
        const match = textBefore.match(/[\w.]*$/);
        const wordStart = match ? cursorPos - match[0].length : cursorPos;
        
        const newCode = 
            code.substring(0, wordStart) + 
            item.insertText + 
            textAfter;
        
        onCodeChange(newCode);
        setCompletionList(null);
        
        // Set cursor position after insertion
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = wordStart + item.insertText.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        // Debounce hover
        const position = getCursorPosition();
        
        setTimeout(() => {
            const hover = languageServer.provideHover(code, position);
            if (hover) {
                setHoverInfo({
                    info: hover,
                    x: e.clientX,
                    y: e.clientY
                });
            }
        }, 500);
    };

    const handleMouseLeave = () => {
        setHoverInfo(null);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selectedText = code.substring(start, end);
        
        if (selectedText) {
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                selectedText,
                selectedRange: { start, end }
            });
        }
    };

    const handleRefactoring = async (operation: string) => {
        if (!contextMenu) return;
        
        try {
            let result;
            const position = getCursorPosition();
            
            switch (operation) {
                case 'extract_method':
                    result = refactoringEngine.extractMethod(
                        code,
                        contextMenu.selectedRange.start,
                        contextMenu.selectedRange.end,
                        'extractedMethod'
                    );
                    break;
                case 'extract_variable':
                    result = refactoringEngine.extractVariable(
                        code,
                        contextMenu.selectedRange.start,
                        contextMenu.selectedRange.end,
                        'extractedVar'
                    );
                    break;
                case 'inline':
                    result = refactoringEngine.inline(code, position.line, position.character);
                    break;
                case 'optimize':
                    result = refactoringEngine.optimizePerformance(code);
                    break;
                default:
                    return;
            }
            
            if (result.success) {
                onCodeChange(result.newCode);
            }
        } catch (error) {
            console.error('Refactoring error:', error);
        } finally {
            setContextMenu(null);
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
                    onKeyDown={handleKeyDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onContextMenu={handleContextMenu}
                    spellCheck="false"
                    className="absolute inset-0 p-4 bg-transparent text-transparent caret-[--accent-color] resize-none outline-none whitespace-pre"
                    style={{ lineHeight: '1.5rem' }}
                />

                {/* Completion List */}
                {completionList && (
                    <div 
                        ref={completionRef}
                        className="absolute glass-panel rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar completion-list-enter"
                        style={{
                            left: `${textareaRef.current?.offsetLeft || 0}px`,
                            top: `${(completionList.position.line * 24) + 40}px`,
                            minWidth: '350px',
                            maxWidth: '500px'
                        }}
                    >
                        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-sm px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-xs font-semibold text-slate-300">IntelliSense</span>
                            <span className="ml-auto text-xs text-slate-500">{completionList.items.length} items</span>
                        </div>
                        {completionList.items.map((item, index) => {
                            const isSelected = index === completionList.selectedIndex;
                            const iconClass = item.kind === 14 ? 'completion-icon-keyword' : 
                                             item.kind === 6 ? 'completion-icon-variable' :
                                             item.kind === 3 ? 'completion-icon-function' : 
                                             'completion-icon-type';
                            const iconText = item.kind === 14 ? 'K' : 
                                           item.kind === 6 ? 'V' :
                                           item.kind === 3 ? 'F' : 
                                           'T';
                            
                            return (
                                <div
                                    key={index}
                                    className={`px-3 py-2.5 cursor-pointer flex items-center gap-3 completion-item-hover border-l-2 ${
                                        isSelected 
                                            ? 'completion-item-selected border-l-cyan-400' 
                                            : 'hover:bg-slate-800/50 border-l-transparent'
                                    }`}
                                    onClick={() => insertCompletion(item)}
                                >
                                    <span className={`completion-icon ${iconClass}`}>{iconText}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                {item.label}
                                            </span>
                                            {item.detail && (
                                                <span className={`text-xs ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>
                                                    {item.detail}
                                                </span>
                                            )}
                                        </div>
                                        {item.documentation && (
                                            <div className={`text-xs mt-0.5 ${isSelected ? 'text-cyan-50' : 'text-slate-500'}`}>
                                                {item.documentation.substring(0, 60)}...
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Hover Tooltip */}
                {hoverInfo && (
                    <div 
                        className="fixed hover-tooltip rounded-lg shadow-2xl p-4 z-50 max-w-md hover-tooltip-enter"
                        style={{
                            left: `${hoverInfo.x + 10}px`,
                            top: `${hoverInfo.y + 10}px`,
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {hoverInfo.info.contents}
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-1 left-6 w-2 h-2 bg-slate-900 transform rotate-45 border-r border-b border-cyan-500/30"></div>
                    </div>
                )}

                {/* Context Menu */}
                {contextMenu && (
                    <div 
                        className="fixed glass-panel rounded-lg shadow-2xl z-50 py-2 context-menu-enter"
                        style={{
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`,
                            minWidth: '240px'
                        }}
                        onMouseLeave={() => setContextMenu(null)}
                    >
                        <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-700/50">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                            </svg>
                            <span className="text-xs font-bold text-slate-300">Refactoring</span>
                        </div>
                        <div className="py-1">
                            <button 
                                className="w-full px-4 py-2.5 text-left text-sm context-menu-item text-slate-200 flex items-center gap-3"
                                onClick={() => handleRefactoring('extract_method')}
                            >
                                <span className="text-lg">🔧</span>
                                <div className="flex-1">
                                    <div className="font-semibold">Extract Method</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Create new method from selection</div>
                                </div>
                            </button>
                            <button 
                                className="w-full px-4 py-2.5 text-left text-sm context-menu-item text-slate-200 flex items-center gap-3"
                                onClick={() => handleRefactoring('extract_variable')}
                            >
                                <span className="text-lg">📦</span>
                                <div className="flex-1">
                                    <div className="font-semibold">Extract Variable</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Store expression in variable</div>
                                </div>
                            </button>
                            <button 
                                className="w-full px-4 py-2.5 text-left text-sm context-menu-item text-slate-200 flex items-center gap-3"
                                onClick={() => handleRefactoring('inline')}
                            >
                                <span className="text-lg">➡️</span>
                                <div className="flex-1">
                                    <div className="font-semibold">Inline</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Replace usage with value</div>
                                </div>
                            </button>
                        </div>
                        <div className="border-t border-slate-700/50 my-1"></div>
                        <div className="py-1">
                            <button 
                                className="w-full px-4 py-2.5 text-left text-sm context-menu-item text-slate-200 flex items-center gap-3"
                                onClick={() => handleRefactoring('optimize')}
                            >
                                <span className="text-lg">⚡</span>
                                <div className="flex-1">
                                    <div className="font-semibold text-yellow-400">Optimize Performance</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Apply code optimizations</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
