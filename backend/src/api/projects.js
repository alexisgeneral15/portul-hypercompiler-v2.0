import express from 'express';
import { v4 as uuid } from 'uuid';
import { storage } from '../storage/index.js';

export const projectRouter = express.Router();

const projectsCache = new Map();

// GET /api/projects
projectRouter.get('/', async (req, res, next) => {
  try {
    const projects = Array.from(projectsCache.values());
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
projectRouter.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'nombre requerido' });
    }
    
    const projectId = uuid();
    const project = {
      id: projectId,
      name,
      description: description || '',
      createdAt: new Date(),
      compilations: [],
      status: 'active'
    };
    
    projectsCache.set(projectId, project);
    await storage.saveProject(projectId, project);
    
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id
projectRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = projectsCache.get(id) || await storage.getProject(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id
projectRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    projectsCache.delete(id);
    await storage.deleteProject(id);
    
    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    next(error);
  }
});