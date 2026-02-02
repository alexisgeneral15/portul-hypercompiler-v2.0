import React, { useState } from 'react';
import { PlayIcon } from './icons/PlayIcon';

interface CompilationResult {
  id: string;
  status: 'completed' | 'error';
  message: string;
  filename?: string;
  downloadUrl?: string;
  exeSize?: number;
  sourceSize?: number;
  error?: string;
  details?: string;
}

interface BootstrapCompilerProps {
  code: string;
  filename?: string;
}

export const BootstrapCompiler: React.FC<BootstrapCompilerProps> = ({ code, filename = 'portul_program' }) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [progress, setProgress] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Obtener token de desarrollo en el primer render
  React.useEffect(() => {
    const getToken = async () => {
      const stored = localStorage.getItem('auth_token');
      if (stored) {
        setToken(stored);
        return;
      }
      
      try {
        const response = await fetch('http://localhost:3001/api/auth/dev-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('auth_token', data.token);
          setToken(data.token);
        }
      } catch (error) {
        console.warn('No se pudo obtener token dev:', error);
        // El token será solicitado al compilar
      }
    };
    
    getToken();
  }, []);

  const handleCompile = async () => {
    if (!code.trim()) {
      alert('No hay código para compilar');
      return;
    }

    setIsCompiling(true);
    setResult(null);
    setProgress('Autenticando...');

    try {
      let authToken = token;
      
      // Si no tenemos token, intentar obtenerlo
      if (!authToken) {
        setProgress('Obteniendo credenciales...');
        try {
          const authResponse = await fetch('http://localhost:3001/api/auth/dev-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            authToken = authData.token;
            localStorage.setItem('auth_token', authToken);
            setToken(authToken);
          }
        } catch (authError) {
          console.error('Error de autenticación:', authError);
        }
      }
      
      setProgress('Enviando código al compilador...');
      
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || 'dev-token'}`
        },
        body: JSON.stringify({
          code,
          target: 'windows-x64',
          filename,
          projectId: 'bootstrap-demo'
        })
      });

      const data: CompilationResult = await response.json();

      if (data.status === 'completed') {
        setProgress('✓ Compilación exitosa!');
        setResult(data);
        setTimeout(() => setProgress(''), 2000);
      } else {
        setProgress(`✗ Error: ${data.error || 'Error desconocido'}`);
        setResult(data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      setProgress(`✗ ${errorMsg}`);
      setResult({
        id: '',
        status: 'error',
        message: 'Error de compilación',
        error: errorMsg
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownload = async (downloadUrl: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token');
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${authToken || 'dev-token'}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error descargando archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.exe`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Error descargando: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔨 Compilador Portul Real</h3>
        <p style={styles.subtitle}>Compila código Portul a ejecutables Windows (.exe)</p>
      </div>

      <button
        onClick={handleCompile}
        disabled={isCompiling}
        style={{
          ...styles.button,
          opacity: isCompiling ? 0.6 : 1,
          cursor: isCompiling ? 'not-allowed' : 'pointer'
        }}
      >
        {isCompiling ? '⏳ Compilando...' : <><PlayIcon /> Compilar a .exe</>}
      </button>

      {progress && (
        <div style={styles.progress}>
          {progress}
        </div>
      )}

      {result && (
        <div style={{
          ...styles.resultBox,
          borderColor: result.status === 'completed' ? '#22c55e' : '#ef4444'
        }}>
          <h4 style={styles.resultTitle}>
            {result.status === 'completed' ? '✓ Éxito' : '✗ Error'}
          </h4>
          
          <p style={styles.resultMessage}>{result.message}</p>

          {result.status === 'completed' && result.exeSize && (
            <div style={styles.stats}>
              <div>📝 Código: {result.sourceSize} bytes</div>
              <div>💾 Ejecutable: {result.exeSize} bytes</div>
              <div>📦 Archivo: {result.filename}</div>
            </div>
          )}

          {result.error && (
            <div style={styles.errorDetails}>
              <strong>Error:</strong>
              <p>{result.error}</p>
              {result.details && (
                <details>
                  <summary>Detalles técnicos</summary>
                  <pre style={styles.detailsPre}>{result.details}</pre>
                </details>
              )}
            </div>
          )}

          {result.status === 'completed' && result.downloadUrl && (
            <button
              onClick={() => handleDownload(result.downloadUrl!)}
              style={styles.downloadButton}
            >
              ⬇️ Descargar {result.filename}
            </button>
          )}
        </div>
      )}

      <div style={styles.info}>
        <h4>Información:</h4>
        <ul>
          <li>Código fuente: {code.length} bytes</li>
          <li>Fase 1: Lexer + Parser</li>
          <li>Fase 2: Análisis Semántico</li>
          <li>Fase 3: Generación IR (LLVM)</li>
          <li>Fase 4: Compilación a Ejecutable</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    border: '1px solid #0f3460',
    marginBottom: '20px'
  } as React.CSSProperties,
  header: {
    marginBottom: '20px'
  } as React.CSSProperties,
  title: {
    margin: '0 0 5px 0',
    color: '#00d4ff',
    fontSize: '18px'
  } as React.CSSProperties,
  subtitle: {
    margin: '0',
    color: '#888',
    fontSize: '12px'
  } as React.CSSProperties,
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#0f3460',
    color: '#00d4ff',
    border: '2px solid #00d4ff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  } as React.CSSProperties,
  progress: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#0f3460',
    color: '#00d4ff',
    borderRadius: '4px',
    fontSize: '12px'
  } as React.CSSProperties,
  resultBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#0a0a1a',
    border: '2px solid',
    borderRadius: '6px'
  } as React.CSSProperties,
  resultTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px'
  } as React.CSSProperties,
  resultMessage: {
    margin: '0 0 8px 0',
    color: '#ccc',
    fontSize: '12px'
  } as React.CSSProperties,
  stats: {
    backgroundColor: '#1a1a2e',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#888',
    marginBottom: '12px'
  } as React.CSSProperties,
  errorDetails: {
    backgroundColor: '#1a0000',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#ff6b6b',
    marginBottom: '12px'
  } as React.CSSProperties,
  detailsPre: {
    margin: '4px 0 0 0',
    padding: '4px',
    backgroundColor: '#0a0a0a',
    borderRadius: '2px',
    overflowX: 'auto',
    fontSize: '10px'
  } as React.CSSProperties,
  downloadButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#22c55e',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  } as React.CSSProperties,
  info: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#0f3460',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#888'
  } as React.CSSProperties
};
