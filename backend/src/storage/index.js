import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '../../builds');

await fs.mkdir(STORAGE_DIR, { recursive: true });

export const storage = {
  async saveCode(compilationId, code) {
    const dir = path.join(STORAGE_DIR, compilationId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'input.portul'), code, 'utf-8');
  },

  async getCode(compilationId) {
    try {
      return await fs.readFile(path.join(STORAGE_DIR, compilationId, 'input.portul'), 'utf-8');
    } catch {
      return null;
    }
  },

  async saveExe(compilationId, exeBuffer) {
    const dir = path.join(STORAGE_DIR, compilationId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'output.exe'), exeBuffer);
  },

  async getExe(compilationId) {
    const file = path.join(STORAGE_DIR, compilationId, 'output.exe');
    try {
      await fs.access(file);
      return file;
    } catch {
      return null;
    }
  },

  async saveIR(compilationId, ir) {
    const dir = path.join(STORAGE_DIR, compilationId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'output.ll'), ir, 'utf-8');
  },

  async getCompilation(compilationId) {
    try {
      const metaPath = path.join(STORAGE_DIR, compilationId, 'meta.json');
      const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
      return meta;
    } catch {
      return null;
    }
  },

  async saveCompilation(compilationId, metadata) {
    const dir = path.join(STORAGE_DIR, compilationId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, 'meta.json'),
      JSON.stringify(metadata, null, 2)
    );
  },

  async saveProject(projectId, project) {
    const dir = path.join(STORAGE_DIR, 'projects');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${projectId}.json`),
      JSON.stringify(project, null, 2)
    );
  },

  async saveUser(userId, user) {
    const dir = path.join(STORAGE_DIR, 'users');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${userId}.json`),
      JSON.stringify(user, null, 2)
    );
  },

  async getUser(userId) {
    try {
      return JSON.parse(
        await fs.readFile(
          path.join(STORAGE_DIR, 'users', `${userId}.json`),
          'utf-8'
        )
      );
    } catch {
      return null;
    }
  },

  async getUserByEmail(email) {
    try {
      const dir = path.join(STORAGE_DIR, 'users');
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const user = JSON.parse(
          await fs.readFile(path.join(dir, file), 'utf-8')
        );
        if (user.email === email) return user;
      }
      return null;
    } catch {
      return null;
    }
  },

  async getProject(projectId) {
    try {
      return JSON.parse(
        await fs.readFile(
          path.join(STORAGE_DIR, 'projects', `${projectId}.json`),
          'utf-8'
        )
      );
    } catch {
      return null;
    }
  },

  async deleteProject(projectId) {
    try {
      await fs.rm(path.join(STORAGE_DIR, 'projects', `${projectId}.json`));
    } catch {
      // Ignore
    }
  },

  async cleanup(compilationId, keepDays = 7) {
    // Limpia builds viejos
    const dir = path.join(STORAGE_DIR, compilationId);
    try {
      const stat = await fs.stat(dir);
      const age = Date.now() - stat.mtimeMs;
      if (age > keepDays * 24 * 60 * 60 * 1000) {
        await fs.rm(dir, { recursive: true });
      }
    } catch {
      // Ignore
    }
  }
};