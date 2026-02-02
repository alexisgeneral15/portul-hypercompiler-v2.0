
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { FileExplorer } from './FileExplorer';
import { CodeEditorEnhanced } from './CodeEditorEnhanced';
import { StatusBar } from './StatusBar';
import { TabbedPanel } from './TabbedPanel';
import { AxiomAnalysisPanel } from './AxiomAnalysisPanel';
import { GenericOutputPanel } from './GenericOutputPanel';
import { DebuggerPanel } from './DebuggerPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { DocumentationModal } from './DocumentationModal';
import { AetherLensPanel } from './AetherLensPanel';
import { NetworkAxiomPanel, NetworkEntry } from './NetworkAxiomPanel';
import { AetherCorePanel } from './AetherCorePanel';
import { initialFileSystem, FileSystemTree, getFileContent, setFileContent as setFsContent, flattenTree, addFileByPath, addDirectoryByPath, deleteNodeByPath, renameNodeByPath } from '../utils/fileSystemUtils';
import { runPortulCommand, ToolResult, Diagnostic, Language, Command, DebuggerState, AIPendingAction } from '../services/portulToolchainService';
import { runNativeAiAnalysis } from '../services/nativeAiService';
import { translateCodeToPortul } from '../services/geminiService';
import { translations, Translation } from '../utils/translations';
import { addHistoryEntry, HistoryEntry } from '../utils/replHistory';
import { BugIcon } from './icons/BugIcon';
import { BookIcon } from './icons/BookIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { AtomIcon } from './icons/AtomIcon';
import { EditorTabs } from './EditorTabs';
import { innovateCode, clearLearnedPatterns, learnFromText } from '../services/aiLearningService';
import { clearLearnedCommands } from '../services/aiCommandRegistry';
import { addLearningEvent, clearLearningLog } from '../services/aiLearningLogService';
import { PlayIcon } from './icons/PlayIcon';
import { AssemblyPanel } from './AssemblyPanel';

// PROFESSIONAL SERVICES - Visual Studio Grade
import { LanguageServer } from '../services/languageServer';
import { SemanticAnalyzer } from '../services/semanticAnalyzer';
import { getLocalAIEngine } from '../services/localAiEngine';
import { RefactoringEngine } from '../services/refactoringEngine';
import { PortulParser } from '../services/advancedParser';
import { CodeGenerator } from '../services/codeGenerator';
import { CompilationPanel } from './CompilationPanel';
import { ProjectsPanel } from './ProjectsPanel';
import { BootstrapCompiler } from './BootstrapCompiler';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { KeyIcon } from './icons/KeyIcon';
import { AuthPanel } from './AuthPanel';

const App: React.FC = () => {
    // Core State
    const [fileSystem, setFileSystem] = useState<FileSystemTree>(initialFileSystem);
    const [activeFile, setActiveFile] = useState<string>('examples/hello_world.portulpp');
    const [openFiles, setOpenFiles] = useState<string[]>(['examples/hello_world.portulpp']);
    const [code, setCode] = useState<string>('');
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [timestamps, setTimestamps] = useState(() => new Map<string, number>());
    const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [activeBottomTab, setActiveBottomTab] = useState('axiom_analysis');
    const [activeSideTab, setActiveSideTab] = useState('file_explorer');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [faradayMode, setFaradayMode] = useState<boolean>(false);
    const [showDocs, setShowDocs] = useState(false);
    const [language, setLanguage] = useState<Language>('es');
    const t = useMemo(() => translations[language], [language]);

    // Resource Simulation State
    const [cpuUsage, setCpuUsage] = useState(0.01); // in MHz
    const [ramUsage, setRamUsage] = useState(1.4); // in KB
    const [networkLog, setNetworkLog] = useState<NetworkEntry[]>([]);

    // Tooling State
    const [buildResult, setBuildResult] = useState<{ output: string, ir?: string, assembly?: string } | null>(null);
    const [isDebugging, setIsDebugging] = useState(false);
    const [debuggerState, setDebuggerState] = useState<DebuggerState | null>(null);
    const [lastBuildBinary, setLastBuildBinary] = useState<Uint8Array | null>(null);
    
    // AI State
    const [aiHistory, setAiHistory] = useState<HistoryEntry[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [pendingAiAction, setPendingAiAction] = useState<AIPendingAction | null>(null);
    const [knowledgeVersion, setKnowledgeVersion] = useState(0);
    const [aiMode, setAiMode] = useState<'gemini' | 'aether'>('gemini');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);

    // Professional Services State
    const [completionItems, setCompletionItems] = useState<any[]>([]);
    const [hoverInfo, setHoverInfo] = useState<string | null>(null);
    const [cursorPosition, setCursorPosition] = useState<{ line: number; character: number }>({ line: 0, character: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            const baseRam = 1.2; // KB for the OS/IDE - OPTIMIZED
            const codeRam = code.length / 1024; // Rough estimate
            const totalRam = baseRam + codeRam;
            setRamUsage(parseFloat(totalRam.toFixed(2)));

            if (isLoading) {
                const randomUsage = 0.8 + Math.random() * 0.2; // 80% to 100% of 1MHz
                setCpuUsage(parseFloat(randomUsage.toFixed(2)));
            } else {
                const randomIdle = 0.01 + Math.random() * 0.02; // 1% to 3%
                setCpuUsage(parseFloat(randomIdle.toFixed(2)));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLoading, code]);

    const handleFileSelect = (path: string) => {
      if (!openFiles.includes(path)) setOpenFiles(prev => [...prev, path]);
      setActiveFile(path);
    };

    const handleCloseFile = (path: string) => {
        const newOpenFiles = openFiles.filter(f => f !== path);
        setOpenFiles(newOpenFiles);
        if (activeFile === path) setActiveFile(newOpenFiles[0] || '');
    };

    useEffect(() => {
        const content = activeFile ? getFileContent(fileSystem, activeFile) : '';
        setCode(content || '');
        if(activeFile) setTimestamps(prev => new Map(prev).set(activeFile, Date.now()));
    }, [activeFile, fileSystem]);

    useEffect(() => {
        if (!activeFile || !code) { setDiagnostics([]); return; }
        
        // Use PROFESSIONAL semantic analyzer instead of basic native AI
        try {
            const languageServer = LanguageServer.getInstance();
            const semanticAnalyzer = SemanticAnalyzer.getInstance();
            const parser = new PortulParser(code);
            
            // Parse code
            const ast = parser.parse();
            
            if (ast) {
                // Run semantic analysis (5-phase professional analysis)
                const semanticDiagnostics = semanticAnalyzer.analyze(ast);
                
                // Convert professional diagnostics to UI format
                const convertedDiagnostics: Diagnostic[] = semanticDiagnostics.map(d => ({
                    line: d.line,
                    message: d.message,
                    severity: d.severity as any,
                    code: d.code
                }));
                
                setDiagnostics(convertedDiagnostics);
            } else {
                // Fallback to basic analysis if parsing fails
                setDiagnostics(runNativeAiAnalysis(code, activeFile));
            }
        } catch (error) {
            console.error('Semantic analysis error:', error);
            // Fallback to basic analysis
            setDiagnostics(runNativeAiAnalysis(code, activeFile));
        }
    }, [code, activeFile]);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        setFileSystem(fs => setFsContent(fs, activeFile, newCode));
        if(activeFile) setTimestamps(prev => new Map(prev).set(activeFile, Date.now()));
    };

    const processToolResult = (result: ToolResult) => {
        if (result.type === 'build') {
            setBuildResult(result.data);
            if (result.data.fileSystemTree) setFileSystem(result.data.fileSystemTree);
            setKnowledgeVersion(v => v + 1); // Trigger knowledge update
            setLastBuildBinary(result.data.binary || null);
        } else if (result.type === 'run') {
            setBuildResult(prev => ({ ...prev!, output: result.data.output }));
        } else if (result.type === 'generic' || result.type === 'refactor' || result.type === 'weave') {
             let message = '';
             if (result.type === 'refactor') message = result.data.message;
             else if (result.type === 'weave') { handleCodeChange(result.data.newCode); message = result.data.message; }
             else message = result.data.output;
             setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: message, aiMode }));
             if ('fileSystemTree' in result.data && result.data.fileSystemTree) setFileSystem(result.data.fileSystemTree);
        } else if (result.type === 'debug') {
            setDebuggerState(result.data);
            if(result.data.isFinished) setIsDebugging(false);
        } else if (result.type === 'error') {
            setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `Error: ${result.error}`, aiMode }));
        } else if (result.type === 'ai_synthesis_proposal') {
            setPendingAiAction(result.data);
            setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: result.data.explanation, pendingAction: result.data, aiMode }));
        }
    };
    
    const executeCommand = useCallback(async (command: Command, options: Record<string, any> = {}) => {
        setIsLoading(true);

        const newLogEntry: NetworkEntry = {
            id: Date.now(),
            status: faradayMode ? 'blocked' : 'ok',
            method: 'POST',
            protocol: 'AXIOM/7.0',
            target: `/core/command/${command}`,
            time: faradayMode ? 0 : Math.floor(Math.random() * 45) + 5
        };
        setNetworkLog(prev => [newLogEntry, ...prev].slice(0, 50));
        if (faradayMode) {
            setIsLoading(false);
            return;
        }

        if (command === 'build' || command === 'run_target' || command === 'clean') setActiveBottomTab('build_output');
        if (command === 'debug') { setActiveBottomTab('debugger'); setIsDebugging(true); }
        await new Promise(resolve => setTimeout(resolve, 50)); 
        const result = runPortulCommand({ command, code, fileSystemTree: fileSystem, activeFile, language, timestamps, breakpoints: Array.from(breakpoints), ...options });
        
        // FIX: Handle build/run errors specifically to show them in the build panel for immediate user feedback.
        // Previously, these errors were silently routed to the AI panel.
        if (result.type === 'error' && (command === 'build' || command === 'run_target')) {
            const commandName = command === 'build' ? t.commands.build : t.commands.run;
            setBuildResult({ output: `❌ ${commandName} Failed:\n\n${result.error}` });
        } else {
            processToolResult(result);
        }
        
        setIsLoading(false);
    }, [code, fileSystem, activeFile, language, timestamps, breakpoints, faradayMode, t]);

    // PROFESSIONAL BUILD: Use advanced parser and code generator
    const handleProfessionalBuild = useCallback(async () => {
        setIsLoading(true);
        setActiveBottomTab('build_output');
        
        try {
            const parser = new PortulParser(code);
            const ast = parser.parse();
            
            if (!ast) {
                setBuildResult({ output: '❌ Build Failed: Parsing errors\n\n' + parser.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n') });
                setIsLoading(false);
                return;
            }
            
            // Semantic analysis
            const semanticAnalyzer = SemanticAnalyzer.getInstance();
            const semanticErrors = semanticAnalyzer.analyze(ast).filter(d => d.severity === 'error');
            
            if (semanticErrors.length > 0) {
                setBuildResult({ output: '❌ Build Failed: Semantic errors\n\n' + semanticErrors.map(e => `Line ${e.line}: ${e.message}`).join('\n') });
                setIsLoading(false);
                return;
            }
            
            // Code generation with LLVM-style optimization
            const codeGen = CodeGenerator.getInstance();
            const generatedCode = codeGen.generate(ast);
            
            setBuildResult({
                output: `✅ Build Successful!\n\nGenerated ${generatedCode.assembly.split('\n').length} lines of assembly\nOptimization passes: 4\nIR instructions: ${generatedCode.ir.split('\n').length}\n\n🎯 Professional build completed with LLVM-style optimization`,
                ir: generatedCode.ir,
                assembly: generatedCode.assembly
            });
            
            setKnowledgeVersion(v => v + 1);
        } catch (error: any) {
            setBuildResult({ output: `❌ Build Failed:\n\n${error.message || error}` });
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    const handleAiSend = useCallback(async (promptOverride?: string) => {
        const currentPrompt = (promptOverride ?? aiPrompt ?? '');
        if (!currentPrompt.trim() || pendingAiAction) return;
        setIsAiLoading(true);
        setPendingAiAction(null);
        setAiHistory(prev => addHistoryEntry(prev, { type: 'input', content: currentPrompt }));
        setAiPrompt('');
        
        // Use PROFESSIONAL Local AI Engine when in Aether mode
        if (aiMode === 'aether') {
            try {
                const localAI = getLocalAIEngine();
                const aiResponse = await localAI.processQuery(currentPrompt, code, {
                    activeFile,
                    cursorLine: code.split('\n').length,
                    diagnostics
                });
                
                // Check if the intent suggests code generation
                if (aiResponse.intent.intent === 'refactor' || aiResponse.intent.intent === 'optimize' || aiResponse.intent.intent === 'fix') {
                    // Get best suggestion if available
                    const bestSuggestion = aiResponse.suggestions.length > 0 
                        ? aiResponse.suggestions[0].code 
                        : null;
                    
                    if (bestSuggestion) {
                        // AI generated code - show as pending action
                        const action: AIPendingAction = {
                            type: 'code_generation',
                            content: bestSuggestion,
                            targetPath: activeFile,
                            explanation: aiResponse.explanation
                        };
                        setPendingAiAction(action);
                        setAiHistory(prev => addHistoryEntry(prev, { 
                            type: 'output', 
                            content: aiResponse.explanation + '\n\n💡 Sugerencia generada - revisa y confirma abajo.', 
                            pendingAction: action, 
                            aiMode 
                        }));
                    } else {
                        // No code generated, just explanation
                        setAiHistory(prev => addHistoryEntry(prev, { 
                            type: 'output', 
                            content: aiResponse.explanation, 
                            aiMode 
                        }));
                    }
                } else {
                    // Just an explanation or help
                    let responseText = aiResponse.explanation;
                    
                    // Add suggestions if available
                    if (aiResponse.suggestions.length > 0) {
                        responseText += '\n\n📝 Sugerencias:\n';
                        aiResponse.suggestions.slice(0, 3).forEach((sugg, idx) => {
                            responseText += `${idx + 1}. ${sugg.description}\n`;
                        });
                    }
                    
                    setAiHistory(prev => addHistoryEntry(prev, { 
                        type: 'output', 
                        content: responseText, 
                        aiMode 
                    }));
                }
            } catch (error) {
                console.error('Local AI error:', error);
                setAiHistory(prev => addHistoryEntry(prev, { 
                    type: 'output', 
                    content: `❌ Error en Aether AI: ${error instanceof Error ? error.message : String(error)}`, 
                    aiMode 
                }));
            }
        } else {
            // Use Gemini API for online mode
            const result = runPortulCommand({ command: 'ai_assist', code, fileSystemTree: fileSystem, activeFile, language, timestamps, aiPrompt: currentPrompt, aiMode });
            processToolResult(result);
        }
        
        setIsAiLoading(false);
        setKnowledgeVersion(v => v + 1); // Trigger knowledge update
    }, [aiPrompt, code, fileSystem, activeFile, language, timestamps, pendingAiAction, aiMode]);
    
    const handleAiActionConfirm = useCallback(async (action: AIPendingAction) => {
        setIsAiLoading(true);
        setPendingAiAction(null);
        setAiHistory(prev => addHistoryEntry(prev, { type: 'input', content: t.aiResponses.confirm }));
        
        // This part handles the file system change and learns the user's command pattern
        processToolResult(runPortulCommand({ command: 'ai_confirm_action', pendingAction: action, fileSystemTree: fileSystem, language, aiMode }));
        
        // Aether Core learns from confirmed Gemini actions (the "tutoring" part)
        if (aiMode === 'gemini') {
            const learnedItems = learnFromText(action.content);
            if (learnedItems.length > 0) {
                learnedItems.forEach(item => {
                    addLearningEvent(item);
                });
                // Create the specific feedback message for the user
                const learningSummary = learnedItems.join(', ');
                const feedbackMessage = t.aetherCore.tutoringComplete.replace('{summary}', learningSummary);
                
                // Add the feedback message to the history from Aether Core's perspective
                setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: feedbackMessage, aiMode: 'aether' }));
            }
        }

        setIsAiLoading(false);
        setKnowledgeVersion(v => v + 1); // Trigger knowledge update for Aether Core panel
    }, [fileSystem, language, t, aiMode]);

    const handleAiActionReject = useCallback(async (action: AIPendingAction) => {
        setIsAiLoading(true);
        setPendingAiAction(null);
        setAiHistory(prev => addHistoryEntry(prev, { type: 'input', content: t.aiResponses.reject }));
        processToolResult(runPortulCommand({ command: 'ai_reject_action', pendingAction: action, fileSystemTree: fileSystem, language, aiMode }));
        setIsAiLoading(false);
    }, [fileSystem, language, t, aiMode]);

    const handleWeaveIntent = useCallback((intent: string) => {
        setIsAiLoading(true);
        setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `[Aether] Weaving intent: "${intent}"...`, aiMode: 'aether' }));
        processToolResult(runPortulCommand({ command: 'ai_weave_code', code, weaveIntent: intent, activeFile, fileSystemTree: fileSystem, language }));
        setIsAiLoading(false);
    }, [code, activeFile, fileSystem, language]);

    const handleFilesDrop = useCallback(async (files: File[]) => {
        setIsAiLoading(true);
        setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `[Aether] Ingestion Portal: Processing ${files.length} file(s)...`, aiMode: 'aether' }));
        let newFs = fileSystem;
        const translatedFilePaths = [];
        for (const file of files) {
            try {
                const content = await file.text();
                setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `[Gemini] Translating ${file.name}...`, aiMode: 'gemini' }));
                const { translatedCode, newFilename } = await translateCodeToPortul(content, file.name);
                const newPath = `imports/${newFilename}`;
                newFs = addDirectoryByPath(newFs, 'imports');
                newFs = addFileByPath(newFs, newPath, translatedCode);
                translatedFilePaths.push(newPath);
                setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `✅ Translation complete: ${file.name} -> ${newFilename}`, aiMode: 'gemini' }));
            } catch (error: any) {
                setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `❌ Error translating ${file.name}: ${error.message}`, aiMode: 'gemini' }));
            }
        }
        if (translatedFilePaths.length > 0) {
            processToolResult(runPortulCommand({ command: 'ai_assist', fileSystemTree: newFs, language, aiPrompt: `generate pmeik for files: ${translatedFilePaths.join(', ')}`, aiMode: 'gemini' }));
        }
        setFileSystem(newFs);
        setIsAiLoading(false);
    }, [fileSystem, language]);

    const handleExportProject = useCallback(async () => {
        setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: t.fileExplorer.exporting, aiMode: 'aether' }));
        const zip = new JSZip();
        const flatFileSystem = flattenTree(fileSystem);

        // If a build has been run, use the actual generated binary
        if (lastBuildBinary) {
            const exePath = `bin/AxiomIDE_v2.exe`;
            // JSZip can handle Uint8Array directly
            zip.file(exePath, lastBuildBinary);
            // Remove the placeholder from the flat map to avoid duplication
            delete flatFileSystem[exePath];
        }

        for (const path in flatFileSystem) {
            // The content of binary files is base64 encoded, need to decode first.
            if (path.endsWith('.bin')) {
                 zip.file(path, flatFileSystem[path], { base64: true });
            } else {
                 zip.file(path, flatFileSystem[path]);
            }
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'portul-project.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    }, [fileSystem, t, lastBuildBinary]);

    const handleCreateNode = (type: 'file' | 'directory') => {
        const path = prompt(type === 'file' ? t.fileExplorer.newFilePrompt : t.fileExplorer.newDirPrompt);
        if (path) {
            const newFs = type === 'file' ? addFileByPath(fileSystem, path, '') : addDirectoryByPath(fileSystem, path);
            setFileSystem(newFs);
        }
    };

    const handleInnovate = useCallback(() => {
        const { newCode, newFilePath } = innovateCode();
        setFileSystem(fs => addFileByPath(fs, newFilePath, newCode));
        setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: `[Aether] Innovation synthesized into ${newFilePath}`, aiMode: 'aether' }));
        setActiveFile(newFilePath);
        if (!openFiles.includes(newFilePath)) {
            setOpenFiles(prev => [...prev, newFilePath]);
        }
    }, [openFiles]);

    const handleClearKnowledge = useCallback(() => {
        if (confirm(t.aetherCore.confirmClear)) {
            clearLearnedPatterns();
            clearLearnedCommands();
            clearLearningLog();
            setKnowledgeVersion(v => v + 1);
            setAiHistory(prev => addHistoryEntry(prev, { type: 'output', content: '[Aether] Knowledge axiom has been reset.', aiMode: 'aether' }));
        }
    }, [t]);

    const renderPanelContent = (tabId: string) => {
        switch (tabId) {
            case 'axiom_analysis': return <AxiomAnalysisPanel diagnostics={diagnostics.filter(d => d.severity !== 'intent')} />;
            case 'compiler': return <CompilationPanel code={code} projectId={activeProjectId} />;
            case 'bootstrap': return <BootstrapCompiler code={code} filename={activeFile.replace(/\//g, '_').replace(/\..*$/, '')} />;
            case 'build_output': return <GenericOutputPanel content={isLoading ? t.status.compiling : buildResult?.output || t.pressToStart} />;
            case 'debugger': return <DebuggerPanel state={debuggerState} onStep={(type) => executeCommand(`debug_${type}`)} onStop={() => executeCommand('stop_debug')} isDebugging={isDebugging} t={t} />;
            case 'aether_lens': return <AetherLensPanel code={code} activeFile={activeFile} debuggerState={debuggerState} t={t} />;
            case 'asm': return <AssemblyPanel asmCode={buildResult?.assembly || t.asm.notGenerated} />;
            case 'network_axiom': return <NetworkAxiomPanel log={networkLog} faradayMode={faradayMode} onToggleFaradayMode={setFaradayMode} t={t} />;
            default: return null;
        }
    };
    
    const renderSidePanel = () => {
        switch (activeSideTab) {
            case 'file_explorer': return <FileExplorer fileSystem={fileSystem} onFileSelect={handleFileSelect} onFilesDrop={handleFilesDrop} onCreateNode={handleCreateNode} onExportProject={handleExportProject} t={t} />;
            case 'projects': return <ProjectsPanel activeProjectId={activeProjectId} onSelectProject={setActiveProjectId} />;
            case 'auth': return <AuthPanel onUserChange={setCurrentUser} />;
            case 'ai_assistant': return <AIAssistantPanel t={t} history={aiHistory} prompt={aiPrompt} setPrompt={setAiPrompt} onSend={handleAiSend} isLoading={isAiLoading || !!pendingAiAction} onConfirm={handleAiActionConfirm} onReject={handleAiActionReject} aiMode={aiMode} onAiModeChange={setAiMode} />;
            case 'aether_core': return <AetherCorePanel t={t} onInnovate={handleInnovate} onClearKnowledge={handleClearKnowledge} knowledgeVersion={knowledgeVersion} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[--bg-color-darkest] text-[--text-color-light] overflow-hidden">
             {showDocs && <DocumentationModal onClose={() => setShowDocs(false)} t={t} />}
            <header className="flex-shrink-0 bg-[--bg-color-dark] border-b border-[--border-color] p-2 flex justify-between items-center">
                <h1 className="font-bold text-lg text-[--accent-color]">Portul Axiom IDE</h1>
                <div className="flex items-center gap-4">
                    {currentUser && (
                        <div className="text-xs text-[--text-color-medium]">Sesión: {currentUser.name || currentUser.email}</div>
                    )}
                    <div className="relative">
                        <button onClick={() => setIsLangDropdownOpen(v => !v)} className="p-2 hover:bg-slate-700 rounded-md"><LanguageIcon /></button>
                        {isLangDropdownOpen && (
                             <div className="absolute right-0 mt-2 w-28 bg-[--bg-color-medium] border border-[--border-color] rounded-md shadow-lg z-10">
                                <button onClick={() => { setLanguage('es'); setIsLangDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-[--accent-color]/20">Español</button>
                                <button onClick={() => { setLanguage('en'); setIsLangDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-[--accent-color]/20">English</button>
                            </div>
                        )}
                    </div>
                     <button onClick={() => setShowDocs(true)} className="p-2 hover:bg-slate-700 rounded-md" title={t.documentation}><BookIcon /></button>
                    <div className="flex items-center gap-1">
                        <button onClick={handleProfessionalBuild} disabled={isLoading} className="bg-sky-600 text-white font-bold px-3 py-1 text-sm rounded-md hover:bg-sky-500 transition-all active:scale-95 disabled:bg-slate-700 disabled:cursor-wait" title="Professional Build with LLVM Optimizer">⚡ {t.commands.build}</button>
                        <button onClick={() => executeCommand('run_target')} disabled={isLoading || !buildResult} className="flex items-center gap-2 bg-green-600 text-white font-bold px-3 py-1 text-sm rounded-md hover:bg-green-500 transition-all active:scale-95 disabled:bg-slate-700 disabled:cursor-not-allowed"><PlayIcon /> {t.commands.run}</button>
                        <button onClick={() => executeCommand('debug')} disabled={isLoading || isDebugging} className="flex items-center gap-2 bg-purple-600 text-white font-bold px-3 py-1 text-sm rounded-md hover:bg-purple-500 transition-all active:scale-95 disabled:bg-slate-700 disabled:cursor-wait"><BugIcon /> {t.commands.debug}</button>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex overflow-hidden">
                <div className="w-16 bg-[--bg-color-dark] border-r border-[--border-color] flex flex-col items-center pt-4 gap-4">
                    <button onClick={() => setActiveSideTab('file_explorer')} className={`p-2 rounded-md ${activeSideTab === 'file_explorer' ? 'bg-accent-color/20' : 'hover:bg-slate-700'}`} title={t.fileExplorer.title}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-1.5a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5h16.5a1.5 1.5 0 0 1 1.5 1.5v6.75a1.5 1.5 0 0 1-1.5 1.5H3.75Z" /></svg></button>
                    <button onClick={() => setActiveSideTab('projects')} className={`p-2 rounded-md ${activeSideTab === 'projects' ? 'bg-accent-color/20' : 'hover:bg-slate-700'}`} title={t.projects}><FolderPlusIcon /></button>
                    <button onClick={() => setActiveSideTab('auth')} className={`p-2 rounded-md ${activeSideTab === 'auth' ? 'bg-accent-color/20' : 'hover:bg-slate-700'}`} title={t.auth}><KeyIcon /></button>
                    <button onClick={() => setActiveSideTab('ai_assistant')} className={`p-2 rounded-md ${activeSideTab === 'ai_assistant' ? 'bg-accent-color/20' : 'hover:bg-slate-700'}`} title={t.aiAssistant}><SparklesIcon className="w-5 h-5" /></button>
                    <button onClick={() => setActiveSideTab('aether_core')} className={`p-2 rounded-md ${activeSideTab === 'aether_core' ? 'bg-accent-color/20' : 'hover:bg-slate-700'}`} title={t.aetherCore.title}><AtomIcon className="w-5 h-5" /></button>
                </div>
                {renderSidePanel()}
                <div className="flex-grow flex flex-col">
                    <EditorTabs openFiles={openFiles} activeFile={activeFile} onSelect={setActiveFile} onClose={handleCloseFile} executeCommand={executeCommand} />
                    <div className="flex-grow h-3/5">
                        <CodeEditorEnhanced code={code} onCodeChange={handleCodeChange} diagnostics={diagnostics} breakpoints={new Set(breakpoints)} activeLine={debuggerState?.currentLine} onBreakpointToggle={(line) => setBreakpoints(p => p.has(line) ? new Set([...p].filter(l => l !== line)) : new Set([...p, line]))} onWeaveIntent={handleWeaveIntent} />
                    </div>
                    <div className="flex-shrink-0 h-2/5 border-t-2 border-[--border-color]"><TabbedPanel activeTab={activeBottomTab} onTabChange={setActiveBottomTab} renderPanelContent={renderPanelContent} t={t} /></div>
                </div>
            </main>
            <StatusBar isLoading={isLoading} target={'windows-x64'} faradayMode={faradayMode} t={t} cpuUsage={cpuUsage} ramUsage={ramUsage} />
        </div>
    );
};

export default App;