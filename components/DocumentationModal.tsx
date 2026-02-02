import React, { useState, useMemo } from 'react';
import { Translation } from '../utils/translations';
import { DOCUMENTATION_MARKDOWN } from '../utils/documentationContent';
import { SearchIcon } from './icons/SearchIcon';

interface DocumentationModalProps {
  onClose: () => void;
  t: Translation;
}

const DocumentationContent: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const highlightedContent = useMemo(() => {
    if (!searchTerm.trim()) {
      return DOCUMENTATION_MARKDOWN;
    }
    // A simple way to highlight: wrap search term in a <mark> tag.
    // This is case-insensitive.
    const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
    return DOCUMENTATION_MARKDOWN.replace(regex, `<mark class="bg-yellow-400/50 text-yellow-200 rounded-sm px-0.5">$1</mark>`);
  }, [searchTerm]);

  return (
    <div
      className="prose prose-invert prose-slate max-w-none prose-pre:bg-slate-800 prose-pre:text-lime-300 prose-headings:text-cyan-400 prose-strong:text-slate-200"
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
    />
  );
};

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ onClose, t }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-title"
    >
      <div 
        className="bg-slate-900/95 border-2 border-cyan-500/30 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 id="doc-title" className="text-xl font-bold text-cyan-400">{t.documentation}</h2>
          <div className="relative w-1/3">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
               <SearchIcon />
             </div>
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search documentation..."
               className="w-full bg-slate-800 border border-slate-600 rounded-md py-1.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
             />
           </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"
            aria-label="Close documentation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          <DocumentationContent searchTerm={searchTerm} />
        </main>
      </div>
    </div>
  );
};