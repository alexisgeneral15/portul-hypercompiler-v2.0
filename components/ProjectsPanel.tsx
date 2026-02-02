import React, { useEffect, useState } from 'react';
import { projectService, Project } from '../src/services/projectService';

interface ProjectsPanelProps {
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
}

export const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  activeProjectId,
  onSelectProject
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const items = await projectService.list();
      setProjects(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Nombre requerido');
      return;
    }
    try {
      setLoading(true);
      const project = await projectService.create(name.trim(), description.trim() || undefined);
      setProjects((prev) => [project, ...prev]);
      setName('');
      setDescription('');
      setError(null);
      onSelectProject(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      setLoading(true);
      await projectService.remove(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (activeProjectId === projectId) {
        onSelectProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', color: '#f3f4f6' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Proyectos</h3>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Gestión fullstack de proyectos</div>
      </div>

      <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del proyecto"
            style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Crear proyecto
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Lista</div>
        <button
          onClick={loadProjects}
          disabled={loading}
          style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Sin proyectos aún.</div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: activeProjectId === project.id ? '#1f2937' : '#0f172a',
                border: '1px solid #374151'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{project.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{project.description || 'Sin descripción'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onSelectProject(project.id)}
                    style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    style={{ padding: '4px 8px', backgroundColor: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                ID: {project.id.substring(0, 8)} • {project.status || 'active'}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '6px', fontSize: '12px' }}>
          ⚠ {error}
        </div>
      )}

      {activeProjectId && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '12px', color: '#9ca3af' }}>
          Proyecto activo: {activeProjectId.substring(0, 8)}
        </div>
      )}
    </div>
  );
};

export default ProjectsPanel;
