
import React, { useState, useCallback } from 'react';
import { FileSystemTree, FileSystemNode } from '../utils/fileSystemUtils';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { Translation } from '../utils/translations';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { ExportIcon } from './icons/ExportIcon';

interface FileExplorerProps {
    fileSystem: FileSystemTree;
    onFileSelect: (path: string) => void;
    onFilesDrop: (files: File[]) => void;
    onCreateNode: (type: 'file' | 'directory') => void;
    onExportProject: () => void;
    t: Translation;
}

const FileSystemEntry: React.FC<{
    name: string;
    node: FileSystemNode;
    path: string;
    level: number;
    onFileSelect: (path: string) => void;
}> = ({ name, node, path, level, onFileSelect }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (node.type === 'directory') {
        return (
            <div>
                <div 
                    className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                    <FolderIcon />
                    <span className="font-semibold text-slate-300">{name}</span>
                </div>
                {isOpen && (
                    <div>
                        {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([childName, childNode]) => (
                            <FileSystemEntry
                                key={childName}
                                name={childName}
                                node={childNode}
                                path={path ? `${path}/${childName}` : childName}
                                level={level + 1}
                                onFileSelect={onFileSelect}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => onFileSelect(path)}
            className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded-md transition-colors text-[--text-color-light] hover:bg-[--bg-color-medium]`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
            <FileIcon filename={name} />
            <span className={`truncate`}>{name}</span>
        </button>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ fileSystem, onFileSelect, onFilesDrop, onCreateNode, onExportProject, t }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesDrop(Array.from(e.dataTransfer.files));
        }
    }, [onFilesDrop]);

    return (
        <div 
            className="w-64 bg-[--bg-color-dark] border-r border-[--border-color] flex flex-col relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragOver && (
                <div className="absolute inset-0 bg-cyan-500/20 border-2 border-dashed border-cyan-400 rounded-md z-10 flex flex-col items-center justify-center p-4 text-center">
                    <UploadIcon />
                    <p className="text-cyan-200 font-bold mt-2">{t.fileExplorer.fileDrop}</p>
                </div>
            )}
             <div className="flex-shrink-0 flex justify-between items-center p-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.fileExplorer.title}</h2>
                <div className="flex items-center gap-1">
                    <button onClick={() => onCreateNode('file')} title={t.fileExplorer.newFile} className="p-1 hover:bg-slate-700 rounded"><DocumentPlusIcon /></button>
                    <button onClick={() => onCreateNode('directory')} title={t.fileExplorer.newDir} className="p-1 hover:bg-slate-700 rounded"><FolderPlusIcon /></button>
                    <button onClick={onExportProject} title={t.fileExplorer.exportProject} className="p-1 hover:bg-slate-700 rounded"><ExportIcon /></button>
                </div>
             </div>
            <div className="flex-grow overflow-auto p-2 pt-0 space-y-1">
                {Object.entries(fileSystem).sort(([a],[b]) => a.localeCompare(b)).map(([name, node]) => (
                    <FileSystemEntry
                        key={name}
                        name={name}
                        node={node}
                        path={name}
                        level={0}
                        onFileSelect={onFileSelect}
                    />
                ))}
            </div>
        </div>
    );
};
