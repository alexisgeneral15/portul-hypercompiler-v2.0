
import React, { useState, useEffect } from 'react';
import { Translation } from '../utils/translations';
import { getKnowledgeAxiom, NAMING_STYLE_MASK, VAR_TYPE_MASK, PUT_KEYWORD_MASK, CAL_KEYWORD_MASK, INC_KEYWORD_MASK, ADD_KEYWORD_MASK } from '../services/aiLearningService';
import { getAllLearnedCommands, LearnedCommandTemplate } from '../services/aiCommandRegistry';
import { getLearningLog, LearningEvent } from '../services/aiLearningLogService';
import { FlaskIcon } from './icons/FlaskIcon';
import { TrashIcon } from './icons/TrashIcon';

interface AetherCorePanelProps {
    t: Translation;
    onInnovate: () => void;
    onClearKnowledge: () => void;
    knowledgeVersion: number;
}

const AxiomDecoder: React.FC<{ axiom: number, t: Translation }> = ({ axiom, t }) => {
    if (axiom === 0) {
        return <p className="text-xs text-slate-500">{t.aetherCore.noKnowledge}</p>;
    }

    const characteristics = [
        { label: 'Naming Style', value: (axiom & NAMING_STYLE_MASK) ? 'camelCase' : 'snake_case' },
        { label: 'Dominant Type', value: (axiom & VAR_TYPE_MASK) ? 'txt' : 'num' },
    ];
    const commonOps = [
        (axiom & PUT_KEYWORD_MASK) && 'put',
        (axiom & CAL_KEYWORD_MASK) && 'cal',
        (axiom & INC_KEYWORD_MASK) && 'inc',
        (axiom & ADD_KEYWORD_MASK) && 'add',
    ].filter(Boolean);

    return (
        <div className="text-xs space-y-1 font-mono">
            {characteristics.map(c => (
                <div key={c.label} className="flex justify-between">
                    <span className="text-slate-400">{c.label}:</span>
                    <span className="font-bold text-purple-300">{c.value}</span>
                </div>
            ))}
            {commonOps.length > 0 && (
                 <div className="flex justify-between">
                    <span className="text-slate-400">Common Ops:</span>
                    <span className="font-bold text-purple-300">{commonOps.join(', ')}</span>
                </div>
            )}
        </div>
    );
};


export const AetherCorePanel: React.FC<AetherCorePanelProps> = ({ t, onInnovate, onClearKnowledge, knowledgeVersion }) => {
    const [axiom, setAxiom] = useState(0);
    const [learnedCommands, setLearnedCommands] = useState<Record<string, LearnedCommandTemplate>>({});
    const [learningLog, setLearningLog] = useState<LearningEvent[]>([]);

    useEffect(() => {
        setAxiom(getKnowledgeAxiom());
        setLearnedCommands(getAllLearnedCommands());
        setLearningLog(getLearningLog().reverse());
    }, [knowledgeVersion]);
    
    return (
        <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
            <header className="flex-shrink-0 p-3 bg-slate-900 border-b border-slate-700">
                <h2 className="text-sm font-bold text-cyan-400 tracking-wider uppercase">{t.aetherCore.title}</h2>
            </header>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                {/* Knowledge Axiom Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t.aetherCore.knowledgeAxiom}</h3>
                    <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
                        <div className="flex justify-between items-baseline mb-3">
                            <span className="text-sm text-slate-400">{t.aetherCore.axiomValue}:</span>
                            <span className="font-mono text-lg text-lime-400">{axiom.toString(2).padStart(32, '0')}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-600 pt-2">
                             <h4 className="text-xs text-slate-500 mb-1">{t.aetherCore.decoded}</h4>
                             <AxiomDecoder axiom={axiom} t={t} />
                        </div>
                    </div>
                </div>

                {/* Learned Commands Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t.aetherCore.learnedCommands}</h3>
                     <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700 max-h-48 overflow-y-auto">
                        {Object.keys(learnedCommands).length === 0 ? (
                             <p className="text-xs text-slate-500 text-center">{t.aetherCore.noCommands}</p>
                        ) : (
                            <ul className="text-xs font-mono space-y-1">
                                {Object.values(learnedCommands).map((command: LearnedCommandTemplate) => (
                                    <li 
                                        key={command.pattern} 
                                        className="text-sky-300 cursor-help"
                                        title={`Learned from: "${command.originalCommand}"`}
                                    >
                                        <span className="text-slate-500 mr-2">&gt;</span>{command.pattern}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Learning Events Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t.aetherCore.learningEvents}</h3>
                     <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700 max-h-48 overflow-y-auto">
                        {learningLog.length === 0 ? (
                             <p className="text-xs text-slate-500 text-center">{t.aetherCore.noLearningEvents}</p>
                        ) : (
                            <ul className="text-xs font-mono space-y-2">
                                {learningLog.map(event => (
                                    <li key={event.timestamp} className="flex items-start gap-2 text-slate-400">
                                        <span className="text-slate-600 flex-shrink-0">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                        <span className="text-green-400">{event.message}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
            
            <footer className="flex-shrink-0 p-3 border-t border-slate-700 bg-slate-900/80 space-y-2">
                <button 
                    onClick={onInnovate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-500 transition-colors"
                >
                    <FlaskIcon /> {t.aetherCore.innovate}
                </button>
                 <button 
                    onClick={onClearKnowledge}
                    className="w-full flex items-center justify-center gap-2 px-4 py-1 bg-red-800/50 text-red-300 text-xs font-bold rounded-md hover:bg-red-800 transition-colors"
                >
                    <TrashIcon /> {t.aetherCore.clearKnowledge}
                </button>
            </footer>
        </div>
    );
};
