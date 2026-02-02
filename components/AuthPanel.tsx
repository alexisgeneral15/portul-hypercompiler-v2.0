import React, { useEffect, useState } from 'react';
import { authService, AuthUser } from '../src/services/authService';

interface AuthPanelProps {
  onUserChange?: (user: AuthUser | null) => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ onUserChange }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authService.getToken()) {
      authService.me().then((u) => {
        setUser(u);
        onUserChange?.(u);
      }).catch(() => {
        // token inválido
        authService.logout();
        setUser(null);
        onUserChange?.(null);
      });
    }
  }, [onUserChange]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email y password requeridos');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let currentUser: AuthUser;
      if (mode === 'login') {
        currentUser = await authService.login(email.trim(), password.trim());
      } else {
        currentUser = await authService.register(email.trim(), password.trim(), name.trim() || undefined);
      }
      setUser(currentUser);
      onUserChange?.(currentUser);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    onUserChange?.(null);
  };

  return (
    <div style={{ padding: '16px', color: '#f3f4f6' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Acceso</h3>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Autenticación segura para proyectos</div>
      </div>

      {user ? (
        <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontWeight: 600 }}>{user.name || user.email}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{user.email}</div>
          <button
            onClick={handleLogout}
            style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setMode('login')}
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid #374151',
                backgroundColor: mode === 'login' ? '#1f2937' : 'transparent',
                color: '#e5e7eb',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid #374151',
                backgroundColor: mode === 'register' ? '#1f2937' : 'transparent',
                color: '#e5e7eb',
                cursor: 'pointer'
              }}
            >
              Registro
            </button>
          </div>

          {mode === 'register' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', marginBottom: '8px' }}
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', marginBottom: '8px' }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', marginBottom: '12px' }}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '8px', width: '100%', borderRadius: '6px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '6px', fontSize: '12px' }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
};

export default AuthPanel;
