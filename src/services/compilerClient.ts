/**
 * CompilerService: Cliente para conectar con el backend de compilación
 */

export interface CompilationRequest {
  code: string;
  target?: 'windows-x64' | 'linux-x64' | 'macos-x64';
  projectId?: string;
}

export interface CompilationResponse {
  id: string;
  status: 'queued' | 'compiling' | 'compiled' | 'failed';
  message?: string;
  progress?: number;
  error?: string;
  exeSize?: number;
  pollUrl?: string;
}

export interface CompilationStatus {
  id: string;
  status: 'queued' | 'compiling' | 'compiled' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  exeSize?: number;
}

import { authService } from './authService';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

export class CompilerService {
  private static instance: CompilerService;
  private backendUrl: string;

  private constructor() {
    this.backendUrl = BACKEND_URL;
  }

  static getInstance(): CompilerService {
    if (!CompilerService.instance) {
      CompilerService.instance = new CompilerService();
    }
    return CompilerService.instance;
  }

  /**
   * Compila código Portul en el servidor backend
   */
  async compile(request: CompilationRequest): Promise<CompilationResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify({
          code: request.code,
          target: request.target || 'windows-x64',
          projectId: request.projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Compilation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Compilation error:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de una compilación
   */
  async getStatus(compilationId: string): Promise<CompilationStatus> {
    try {
      const response = await fetch(`${this.backendUrl}/api/compile/${compilationId}`, {
        headers: { ...authService.getAuthHeader() }
      });

      if (!response.ok) {
        throw new Error('Failed to get compilation status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get status error:', error);
      throw error;
    }
  }

  /**
   * Descarga el ejecutable compilado
   */
  async downloadExecutable(compilationId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.backendUrl}/api/download/${compilationId}`, {
        headers: { ...authService.getAuthHeader() }
      });

      if (!response.ok) {
        throw new Error('Failed to download executable');
      }

      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de compilaciones
   */
  async getHistory(): Promise<CompilationStatus[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/history`, {
        headers: { ...authService.getAuthHeader() }
      });

      if (!response.ok) {
        throw new Error('Failed to get history');
      }

      const data = await response.json();
      return data.compilations || [];
    } catch (error) {
      console.error('Get history error:', error);
      throw error;
    }
  }

  /**
   * Sondea el estado de compilación hasta completarse
   */
  async pollUntilComplete(
    compilationId: string,
    onProgress?: (progress: number, status: CompilationStatus) => void,
    maxAttempts = 120 // 2 minutos máximo
  ): Promise<CompilationStatus> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.getStatus(compilationId);

        if (onProgress) {
          onProgress(status.progress || 0, status);
        }

        if (status.status === 'compiled') {
          return status;
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'Compilation failed');
        }

        // Espera 1 segundo antes de siguiente intento
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('Poll error:', error);
        throw error;
      }
    }

    throw new Error('Compilation timeout');
  }

  /**
   * Compila y descarga el ejecutable en una sola operación
   */
  async compileAndDownload(
    request: CompilationRequest,
    onProgress?: (progress: number, message: string) => void
  ): Promise<{ blob: Blob; compilationId: string }> {
    try {
      // Paso 1: Compilar
      if (onProgress) onProgress(10, 'Enviando código al servidor...');
      
      const compilation = await this.compile(request);
      const compilationId = compilation.id;

      if (onProgress) onProgress(20, 'Compilando...');

      // Paso 2: Esperar a que termine
      await this.pollUntilComplete(compilationId, (progress) => {
        if (onProgress) onProgress(20 + (progress * 0.7), `Compilando... ${progress}%`);
      });

      if (onProgress) onProgress(90, 'Descargando ejecutable...');

      // Paso 3: Descargar
      const blob = await this.downloadExecutable(compilationId);

      if (onProgress) onProgress(100, 'Compilación completada');

      return { blob, compilationId };
    } catch (error) {
      console.error('Compile and download error:', error);
      throw error;
    }
  }

  /**
   * Verifica conectividad con el backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton
export const compilerService = CompilerService.getInstance();
