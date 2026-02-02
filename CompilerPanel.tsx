/**
 * CLIENTE REACT PARA COMPILADOR
 * Componente listo para usar en la IDE Portul
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface CompilationState {
    jobId: string | null;
    status: 'idle' | 'queued' | 'compiling' | 'completed' | 'failed';
    progress: number;
    stage: string;
    output: string[];
    error: string | null;
    downloadUrl: string | null;
    duration: number;
}

interface CompilerPanelProps {
    code: string;
    onCompilationStart?: () => void;
    onCompilationEnd?: () => void;
    backendUrl?: string;
}

export const CompilerPanel: React.FC<CompilerPanelProps> = ({
    code,
    onCompilationStart,
    onCompilationEnd,
    backendUrl = 'http://localhost:3000'
}) => {
    const [state, setState] = useState<CompilationState>({
        jobId: null,
        status: 'idle',
        progress: 0,
        stage: '',
        output: [],
        error: null,
        downloadUrl: null,
        duration: 0
    });

    const [target, setTarget] = useState<'windows' | 'linux' | 'macos' | 'wasm'>('windows');
    const [projectId, setProjectId] = useState('portul-project');
    const [autoScroll, setAutoScroll] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const timingRef = useRef<number>(0);

    // Inicializar WebSocket
    useEffect(() => {
        socketRef.current = io(backendUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socketRef.current.on('connect', () => {
            console.log('✓ Connected to compiler server');
            setState(s => ({
                ...s,
                error: null
            }));
        });

        socketRef.current.on('disconnect', () => {
            console.log('✗ Disconnected from compiler server');
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [backendUrl]);

    // Auto-scroll en output
    useEffect(() => {
        if (autoScroll && outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [state.output, autoScroll]);

    const handleCompile = useCallback(async () => {
        if (!code.trim()) {
            setState(s => ({
                ...s,
                error: 'Please enter some code to compile'
            }));
            return;
        }

        try {
            setState(s => ({
                ...s,
                status: 'queued',
                progress: 0,
                output: ['Submitting compilation request...'],
                error: null,
                duration: 0
            }));

            timingRef.current = Date.now();
            onCompilationStart?.();

            // Enviar al servidor
            const response = await fetch(`${backendUrl}/api/compile/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceCode: code,
                    target,
                    projectId,
                    userId: 'user-1'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const { jobId, statusUrl } = await response.json();

            setState(s => ({
                ...s,
                jobId,
                output: [
                    ...s.output,
                    `✓ Job ID: ${jobId}`,
                    `✓ Queued for compilation...`
                ]
            }));

            // Escuchar actualizaciones en tiempo real
            if (socketRef.current) {
                socketRef.current.emit('watch-compilation', jobId);

                socketRef.current.on(`compilation-${jobId}`, (data) => {
                    const duration = Date.now() - timingRef.current;

                    setState(s => ({
                        ...s,
                        status: data.status,
                        progress: data.progress || 0,
                        stage: data.stage || '',
                        error: data.error || null,
                        duration,
                        output: [
                            ...s.output,
                            `[${data.stage}] Progress: ${data.progress}%`
                        ]
                    }));

                    if (data.status === 'completed') {
                        setState(s => ({
                            ...s,
                            output: [
                                ...s.output,
                                '✓ Compilation completed successfully!',
                                `Duration: ${(duration / 1000).toFixed(2)}s`
                            ],
                            downloadUrl: `${backendUrl}/api/compile/${jobId}/download`
                        }));
                        onCompilationEnd?.();
                    } else if (data.status === 'failed') {
                        setState(s => ({
                            ...s,
                            output: [
                                ...s.output,
                                `✗ Compilation failed: ${data.error}`
                            ]
                        }));
                        onCompilationEnd?.();
                    }
                });
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setState(s => ({
                ...s,
                status: 'failed',
                error: errorMsg,
                output: [
                    ...s.output,
                    `✗ Error: ${errorMsg}`
                ]
            }));
            onCompilationEnd?.();
        }
    }, [code, target, projectId, backendUrl, onCompilationStart, onCompilationEnd]);

    const handleDownload = useCallback(() => {
        if (state.downloadUrl) {
            const link = document.createElement('a');
            link.href = state.downloadUrl;
            link.download = `program.${target === 'windows' ? 'exe' : ''}`;
            link.click();
        }
    }, [state.downloadUrl, target]);

    const handleClear = useCallback(() => {
        setState(s => ({
            ...s,
            output: [],
            error: null
        }));
    }, []);

    const getStatusColor = (status: string): string => {
        const colors: { [key: string]: string } = {
            'idle': '#999',
            'queued': '#FFA500',
            'compiling': '#2196F3',
            'completed': '#4CAF50',
            'failed': '#F44336'
        };
        return colors[status] || '#999';
    };

    const getStageIcon = (stage: string): string => {
        const icons: { [key: string]: string } = {
            'queued': '⏳',
            'parsing': '📝',
            'semantic-analysis': '🔍',
            'codegen': '⚡',
            'compilation': '🔨',
            'complete': '✓',
            'pending': '•'
        };
        return icons[stage] || '•';
    };

    return (
        <div className="compiler-panel" style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>🔨 Portul Compiler</h2>
                <div style={{ ...styles.statusBadge, backgroundColor: getStatusColor(state.status) }}>
                    {state.status.toUpperCase()}
                </div>
            </div>

            <div style={styles.controls}>
                <div style={styles.controlRow}>
                    <select
                        value={target}
                        onChange={(e) => setTarget(e.target.value as any)}
                        disabled={state.status === 'compiling' || state.status === 'queued'}
                        style={styles.select}
                    >
                        <option value="windows">🪟 Windows 64-bit (.exe)</option>
                        <option value="linux">🐧 Linux 64-bit</option>
                        <option value="macos">🍎 macOS ARM64</option>
                        <option value="wasm">🌐 WebAssembly</option>
                    </select>

                    <input
                        type="text"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        placeholder="Project ID"
                        style={styles.input}
                    />
                </div>

                <div style={styles.controlRow}>
                    <button
                        onClick={handleCompile}
                        disabled={state.status === 'compiling' || state.status === 'queued'}
                        style={{
                            ...styles.button,
                            ...styles.buttonPrimary,
                            opacity: (state.status === 'compiling' || state.status === 'queued') ? 0.6 : 1
                        }}
                    >
                        {state.status === 'compiling' ? '⏳ Compiling...' : '▶ Compile'}
                    </button>

                    {state.status === 'completed' && (
                        <button
                            onClick={handleDownload}
                            style={{ ...styles.button, ...styles.buttonSuccess }}
                        >
                            📥 Download
                        </button>
                    )}

                    <button
                        onClick={handleClear}
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {state.status === 'compiling' && (
                <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                        <div
                            style={{
                                ...styles.progressFill,
                                width: `${state.progress}%`,
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                    <div style={styles.progressText}>
                        <span>{getStageIcon(state.stage)} {state.stage}</span>
                        <span>{state.progress}%</span>
                    </div>
                </div>
            )}

            {state.error && (
                <div style={styles.errorBox}>
                    <strong>✗ Error:</strong> {state.error}
                </div>
            )}

            <div style={styles.outputContainer} ref={outputRef}>
                {state.output.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>Ready to compile...</p>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                            Enter Portul code and click Compile
                        </p>
                    </div>
                ) : (
                    state.output.map((line, idx) => (
                        <pre key={idx} style={styles.outputLine}>{line}</pre>
                    ))
                )}
            </div>

            {state.duration > 0 && state.status === 'completed' && (
                <div style={styles.footer}>
                    ✓ Completed in {(state.duration / 1000).toFixed(2)}s
                </div>
            )}
        </div>
    );
};

// ==================== ESTILOS ====================
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #333'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526'
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '600'
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        color: 'white',
        backgroundColor: '#999'
    },
    controls: {
        padding: '12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    controlRow: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    select: {
        flex: 1,
        padding: '8px',
        backgroundColor: '#3c3c3c',
        color: '#d4d4d4',
        border: '1px solid #555',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer'
    },
    input: {
        padding: '8px',
        backgroundColor: '#3c3c3c',
        color: '#d4d4d4',
        border: '1px solid #555',
        borderRadius: '4px',
        fontSize: '12px',
        minWidth: '120px'
    },
    button: {
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    buttonPrimary: {
        backgroundColor: '#0e639c',
        color: 'white'
    },
    buttonSuccess: {
        backgroundColor: '#4CAF50',
        color: 'white'
    },
    buttonSecondary: {
        backgroundColor: '#555',
        color: '#d4d4d4'
    },
    progressContainer: {
        padding: '12px',
        borderBottom: '1px solid #333'
    },
    progressBar: {
        height: '4px',
        backgroundColor: '#333',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '6px'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0e639c',
        borderRadius: '2px'
    },
    progressText: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#999'
    },
    errorBox: {
        padding: '8px 12px',
        backgroundColor: '#5f1f1f',
        color: '#ff6b6b',
        fontSize: '12px',
        borderBottom: '1px solid #333'
    },
    outputContainer: {
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        backgroundColor: '#1e1e1e',
        fontFamily: 'monospace',
        fontSize: '12px'
    },
    outputLine: {
        margin: 0,
        marginBottom: '4px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: '#ce9178'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#666',
        textAlign: 'center'
    },
    footer: {
        padding: '8px 12px',
        borderTop: '1px solid #333',
        backgroundColor: '#252526',
        fontSize: '11px',
        color: '#4CAF50',
        textAlign: 'center'
    }
};

export default CompilerPanel;
