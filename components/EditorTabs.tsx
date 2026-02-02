
import React, { useState } from 'react';
import { FileIcon } from './icons/FileIcon';
import { XIcon } from './icons/XIcon';
import { RefactorIcon } from './icons/RefactorIcon';
import { Command } from '../services/portulToolchainService';

interface EditorTabsProps {
    openFiles: string[];
    activeFile: string;
    onSelect: (path: string) => void;
    onClose: (path: string) => void;
    executeCommand: (command: Command, options: Record<string, any>) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ openFiles, activeFile, onSelect, onClose, executeCommand }) => {
    const [isRefactorOpen, setIsRefactorOpen] = useState(false);

    const handleRefactor = (type: 'rename' | 'extract_function') => {
        setIsRefactorOpen(false);
        const symbol = prompt(`Enter symbol to ${type}:`);
        if (!symbol) return;
        
        if (type === 'rename') {
            const newSymbol = prompt(`Enter new name for '${symbol}':`);
            if (newSymbol) {
                executeCommand('ai_refactor', { refactorType: 'rename', symbol, newSymbol });
            }
        } else if (type === 'extract_function') {
            const selection = window.getSelection()?.toString();
            if (!selection) {
                alert("Please select code in the editor to extract.");
                return;
            }
            executeCommand('ai_refactor', { refactorType: 'extract_function', selection, newSymbol: symbol });
        }
    };

    if (openFiles.length === 0) {
        return <div className="h-10 bg-[--bg-color-darkest] border-b border-[--border-color]"></div>;
    }

    return (
        <div className="flex-shrink-0 flex items-center justify-between bg-[--bg-color-darkest] border-b border-[--border-color] select-none">
            <div className="flex items-center overflow-x-auto">
                {openFiles.map(path => {
                    const isActive = path === activeFile;
                    const filename = path.split('/').pop() || path;
                    return (
                        <div
                            key={path}
                            onClick={() => onSelect(path)}
                            className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-b-2 ${
                                isActive 
                                ? 'bg-[--bg-color-dark] text-white border-b-[--accent-color]' 
                                : 'text-slate-400 hover:bg-slate-800 border-b-transparent'
                            } border-r-slate-700`}
                        >
                            <FileIcon filename={filename} />
                            <span className="text-sm">{filename}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onClose(path); }}
                                className="p-0.5 rounded-full hover:bg-slate-700"
                            >
                                <XIcon />
                            </button>
                        </div>
                    );
                })}
            </div>
            <div className="relative pr-2">
                <button
                    onClick={() => setIsRefactorOpen(!isRefactorOpen)}
                    className="p-2 hover:bg-slate-700 rounded-md"
                    title="Aether Refactor"
                >
                    <RefactorIcon />
                </button>
                {isRefactorOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[--bg-color-medium] border border-[--border-color] rounded-md shadow-lg z-20">
                        <button onClick={() => handleRefactor('rename')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[--accent-color]/20">Rename Symbol...</button>
                        <button onClick={() => handleRefactor('extract_function')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[--accent-color]/20">Extract to Function...</button>
                    </div>
                )}
            </div>
        </div>
    );
};
