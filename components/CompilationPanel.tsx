import React, { useState, useRef, useEffect } from 'react';
import { compilerService, CompilationStatus } from '../src/services/compilerClient';

interface CompilationPanelProps {
  code: string;
  projectId?: string | null;
  onCompilationComplete?: (status: CompilationStatus) => void;
}

export const CompilationPanel: React.FC<CompilationPanelProps> = ({ 
  code, 
  projectId: activeProjectId,
  onCompilationComplete 
}) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<CompilationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [target, setTarget] = useState<'windows-x64' | 'linux-x64' | 'macos-x64'>('windows-x64');
  const [projectId, setProjectId] = useState<string>('');
  const [history, setHistory] = useState<CompilationStatus[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Verificar conexión con backend
  useEffect(() => {
    const checkBackend = async () => {
      const connected = await compilerService.healthCheck();
      setBackendConnected(connected);
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check cada 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      setProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const items = await compilerService.getHistory();
      setHistory(items);
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCompile = async () => {
    if (!code.trim()) {
      setError('El código no puede estar vacío');
      return;
    }

    if (!backendConnected) {
      setError('Backend no disponible. Asegúrate de que el servidor está corriendo.');
      return;
    }

    setIsCompiling(true);
    setError(null);
    setProgress(0);
    setStatus(null);
    abortControllerRef.current = new AbortController();

    try {
      setProgress(10);
      
      // Compilar
      const compilation = await compilerService.compile({
        code,
        target,
        projectId: projectId || undefined,
      });

      setProgress(20);
      setStatus({
        id: compilation.id,
        status: 'queued',
        progress: 0,
        createdAt: new Date().toISOString(),
      });

      // Esperar a que termine
      const completedStatus = await compilerService.pollUntilComplete(
        compilation.id,
        (currentProgress, currentStatus) => {
          setProgress(20 + (currentProgress * 0.7));
          setStatus(currentStatus);
        }
      );

      setStatus(completedStatus);
      setProgress(100);
      await loadHistory();

      if (onCompilationComplete) {
        onCompilationComplete(completedStatus);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de compilación');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownload = async () => {
    if (!status?.id) return;

    try {
      const blob = await compilerService.downloadExecutable(status.id);

      // Crear descarga
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `program-${status.id.substring(0, 8)}.exe`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error descargando');
    }
  };

  const handleSelectHistory = async (item: CompilationStatus) => {
    setStatus(item);
    setProgress(item.progress || 0);
    setError(null);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'compiled':
        return '#10b981'; // green
      case 'failed':
        return '#ef4444'; // red
      case 'compiling':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusLabel = () => {
    switch (status?.status) {
      case 'compiled':
        return '✓ Compilado exitosamente';
      case 'failed':
        return '✗ Error de compilación';
      case 'compiling':
        return '⟳ Compilando...';
      case 'queued':
        return '⋯ En cola';
      default:
        return 'Listo para compilar';
    }
  };

  return (
    <div className="compilation-panel" style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#1f2937', color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0' }}>Compilador Portul</h3>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Frontend profesional para compilación real</div>
        </div>
        <div style={{ 
          padding: '6px 10px', 
          backgroundColor: backendConnected ? '#064e3b' : '#7f1d1d',
          borderRadius: '999px',
          fontSize: '12px'
        }}>
          {backendConnected ? '✓ Backend conectado' : '✗ Backend desconectado'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Target</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as typeof target)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
              >
                <option value="windows-x64">Windows x64 (.exe)</option>
                <option value="linux-x64">Linux x64</option>
                <option value="macos-x64">macOS x64</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Project ID</label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="opcional"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleCompile}
              disabled={isCompiling || !backendConnected}
              style={{
                padding: '8px 16px',
                backgroundColor: isCompiling || !backendConnected ? '#4b5563' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: isCompiling ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {isCompiling ? 'Compilando...' : 'Compilar'}
            </button>

            <button
              onClick={handleDownload}
              disabled={status?.status !== 'compiled'}
              style={{
                padding: '8px 16px',
                backgroundColor: status?.status === 'compiled' ? '#10b981' : '#4b5563',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: status?.status === 'compiled' ? 'pointer' : 'not-allowed',
                fontWeight: 600
              }}
            >
              Descargar .exe
            </button>

            <button
              onClick={loadHistory}
              disabled={historyLoading}
              style={{
                padding: '8px 12px',
                backgroundColor: '#374151',
                color: '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                cursor: historyLoading ? 'not-allowed' : 'pointer',
                fontWeight: 500
              }}
            >
              {historyLoading ? 'Actualizando...' : 'Actualizar historial'}
            </button>
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Estado actual</div>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: getStatusColor() }}>
            {getStatusLabel()}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>ID: {status?.id ? status.id.substring(0, 8) : '—'}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Progreso: {status?.progress ?? 0}%</div>
        </div>
      </div>

      {/* Barra de progreso */}
      {(isCompiling || progress > 0) && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#374151',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(progress, 100)}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px', color: '#9ca3af' }}>
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Estado detallado */}
      {status && (
        <div style={{
          padding: '12px',
          backgroundColor: '#111827',
          borderRadius: '8px',
          marginBottom: '12px',
          border: `1px solid ${getStatusColor()}`
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>{getStatusLabel()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#d1d5db' }}>
            <div>ID: {status.id.substring(0, 8)}</div>
            <div>Progreso: {status.progress ?? 0}%</div>
            <div>Creado: {formatDateTime(status.createdAt)}</div>
            <div>Completado: {formatDateTime(status.completedAt)}</div>
            <div>Tamaño: {status.exeSize ? `${(status.exeSize / 1024).toFixed(2)} KB` : '—'}</div>
            <div>Target: {target}</div>
          </div>
          {status.error && (
            <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '8px' }}>
              Error: {status.error}
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Historial reciente</div>
        {history.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Sin compilaciones recientes.</div>
        ) : (
          <div style={{ display: 'grid', gap: '6px' }}>
            {history.map(item => (
              <button
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: '6px', border: '1px solid #374151',
                  backgroundColor: status?.id === item.id ? '#1f2937' : '#0f172a',
                  color: '#e5e7eb', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '12px' }}>#{item.id.substring(0, 8)} • {item.status}</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{formatDateTime(item.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Errores */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#7f1d1d',
          borderRadius: '4px',
          color: '#fca5a5',
          fontSize: '12px'
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Info */}
      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '12px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
        <div>• Compila Portul a binarios nativos con pipeline LLVM</div>
        <div>• Historial y descarga directa desde el backend</div>
        {status?.id && <div>• ID completo: {status.id}</div>}
      </div>
    </div>
  );
};

export default CompilationPanel;
