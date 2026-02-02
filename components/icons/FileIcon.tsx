
import React from 'react';
import { PortulIcon } from './PortulIcon';
import { CogIcon } from './CogIcon';
import { WindowsIcon } from './WindowsIcon';
import { AndroidIcon } from './AndroidIcon';
import { WasmIcon } from './WasmIcon';
import { DocumentIcon } from './DocumentIcon';

interface FileIconProps {
    filename: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ filename }) => {
    if (filename.endsWith('.portul')) return <PortulIcon />;
    if (filename.endsWith('.pmeik')) return <DocumentIcon isBuildFile />;
    if (filename.endsWith('.portulscript')) return <DocumentIcon isScriptFile />;
    if (filename.endsWith('.pll')) return <DocumentIcon isLibraryFile />;
    if (filename.endsWith('.ph') || filename.endsWith('.phpp')) return <DocumentIcon isHeaderFile />;
    if (filename.endsWith('.portulpp')) return <DocumentIcon isPortulPlusFile />;
    if (filename.endsWith('.exe') || filename.endsWith('.apk') || filename.endsWith('.wasm')) return <DocumentIcon isExecutableFile />;
    if (filename.endsWith('.md')) return <CogIcon />;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m9 12.75A2.25 2.25 0 0119.5 18v-2.625m0-10.5V18M7.5 6H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
        </svg>
    );
};
