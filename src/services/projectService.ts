export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  status?: string;
  compilations?: string[];
}

import { authService } from './authService';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const projectService = {
  async list(): Promise<Project[]> {
    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      headers: { ...authService.getAuthHeader() }
    });
    const data = await handleJson<{ projects: Project[] }>(response);
    return data.projects || [];
  },

  async create(name: string, description?: string): Promise<Project> {
    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
      body: JSON.stringify({ name, description })
    });
    return handleJson<Project>(response);
  },

  async remove(projectId: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { ...authService.getAuthHeader() }
    });
    await handleJson<{ message: string }>(response);
  },

  async get(projectId: string): Promise<Project> {
    const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
      headers: { ...authService.getAuthHeader() }
    });
    return handleJson<Project>(response);
  }
};
