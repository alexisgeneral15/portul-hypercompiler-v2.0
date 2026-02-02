import { IDE_SOURCE_CODE } from './mockFileSystem';
import { PORTUL_EXAMPLES } from './portulExamples';

// --- Type Definitions ---
export interface FileSystemFile { type: 'file'; name: string; content: string; }
export interface FileSystemDirectory { type: 'directory'; name: string; children: FileSystemTree; }
export type FileSystemNode = FileSystemFile | FileSystemDirectory;
export type FileSystemTree = Record<string, FileSystemNode>;

// --- Initial State ---
export const initialFileSystem: FileSystemTree = {
  'src': {
    type: 'directory',
    name: 'src',
    children: {
      'ide_main.portulpp': { type: 'file', name: 'ide_main.portulpp', content: IDE_SOURCE_CODE['ide_main.portulpp'] },
      'core': {
        type: 'directory',
        name: 'core',
        children: {
          'vfs.portulpp': { type: 'file', name: 'vfs.portulpp', content: IDE_SOURCE_CODE['core/vfs.portulpp'] },
          'vfs.phpp': { type: 'file', name: 'vfs.phpp', content: IDE_SOURCE_CODE['core/vfs.phpp'] },
          'compiler.portulpp': { type: 'file', name: 'compiler.portulpp', content: IDE_SOURCE_CODE['core/compiler.portulpp'] },
          'compiler.phpp': { type: 'file', name: 'compiler.phpp', content: IDE_SOURCE_CODE['core/compiler.phpp'] },
          'pe_generator.portulpp': { type: 'file', name: 'pe_generator.portulpp', content: IDE_SOURCE_CODE['core/pe_generator.portulpp'] },
          'pe_generator.phpp': { type: 'file', name: 'pe_generator.phpp', content: IDE_SOURCE_CODE['core/pe_generator.phpp'] },
        }
      },
      'services': {
        type: 'directory',
        name: 'services',
        children: {
          'native_ai.portulpp': { type: 'file', name: 'native_ai.portulpp', content: IDE_SOURCE_CODE['services/native_ai.portulpp'] },
          'native_ai.phpp': { type: 'file', name: 'native_ai.phpp', content: IDE_SOURCE_CODE['services/native_ai.phpp'] },
        }
      },
      'ui': {
        type: 'directory',
        name: 'ui',
        children: {
          'editor.portulpp': { type: 'file', name: 'editor.portulpp', content: IDE_SOURCE_CODE['ui/editor.portulpp'] },
          'editor.phpp': { type: 'file', name: 'editor.phpp', content: IDE_SOURCE_CODE['ui/editor.phpp'] },
          'sidebar.portulpp': { type: 'file', name: 'sidebar.portulpp', content: IDE_SOURCE_CODE['ui/sidebar.portulpp'] },
          'sidebar.phpp': { type: 'file', name: 'sidebar.phpp', content: IDE_SOURCE_CODE['ui/sidebar.phpp'] },
          'ai_assistant.portulpp': { type: 'file', name: 'ai_assistant.portulpp', content: IDE_SOURCE_CODE['ui/ai_assistant.portulpp'] },
          'ai_assistant.phpp': { type: 'file', name: 'ai_assistant.phpp', content: IDE_SOURCE_CODE['ui/ai_assistant.phpp'] },
          'status_bar.portulpp': { type: 'file', name: 'status_bar.portulpp', content: IDE_SOURCE_CODE['ui/status_bar.portulpp'] },
          'status_bar.phpp': { type: 'file', name: 'status_bar.phpp', content: IDE_SOURCE_CODE['ui/status_bar.phpp'] },
          'aether_core.portulpp': { type: 'file', name: 'aether_core.portulpp', content: IDE_SOURCE_CODE['ui/aether_core.portulpp'] },
          'aether_core.phpp': { type: 'file', name: 'aether_core.phpp', content: IDE_SOURCE_CODE['ui/aether_core.phpp'] },
          'aether_lens.portulpp': { type: 'file', name: 'aether_lens.portulpp', content: IDE_SOURCE_CODE['ui/aether_lens.portulpp'] },
          'aether_lens.phpp': { type: 'file', name: 'aether_lens.phpp', content: IDE_SOURCE_CODE['ui/aether_lens.phpp'] },
          'network_panel.portulpp': { type: 'file', name: 'network_panel.portulpp', content: IDE_SOURCE_CODE['ui/network_panel.portulpp'] },
          'network_panel.phpp': { type: 'file', name: 'network_panel.phpp', content: IDE_SOURCE_CODE['ui/network_panel.phpp'] },
        }
      }
    }
  },
  'examples': {
    type: 'directory',
    name: 'examples',
    children: {
      'hello_world.portulpp': { type: 'file', name: 'hello_world.portulpp', content: PORTUL_EXAMPLES['hello_world.portulpp'] },
      'counter.portulpp': { type: 'file', name: 'counter.portulpp', content: PORTUL_EXAMPLES['counter.portulpp'] },
      'fibonacci.portulpp': { type: 'file', name: 'fibonacci.portulpp', content: PORTUL_EXAMPLES['fibonacci.portulpp'] },
      'arithmetic.portulpp': { type: 'file', name: 'arithmetic.portulpp', content: PORTUL_EXAMPLES['arithmetic.portulpp'] },
      'conditionals.portulpp': { type: 'file', name: 'conditionals.portulpp', content: PORTUL_EXAMPLES['conditionals.portulpp'] },
      'factorial.portulpp': { type: 'file', name: 'factorial.portulpp', content: PORTUL_EXAMPLES['factorial.portulpp'] },
      'bootstrap_test.portulpp': { type: 'file', name: 'bootstrap_test.portulpp', content: PORTUL_EXAMPLES['bootstrap_test.portulpp'] },
    }
  },
  'runtime': {
    type: 'directory',
    name: 'runtime',
    children: {
        'portul_runtime.bin': { type: 'file', name: 'portul_runtime.bin', content: IDE_SOURCE_CODE['runtime/portul_runtime.bin'] },
    }
  },
  'project.pmeik': { type: 'file', name: 'project.pmeik', content: IDE_SOURCE_CODE['project.pmeik'] },
  'build.bat': { type: 'file', name: 'build.bat', content: IDE_SOURCE_CODE['build.bat'] },
  'run.bat': { type: 'file', name: 'run.bat', content: IDE_SOURCE_CODE['run.bat'] },
  'clean.bat': { type: 'file', name: 'clean.bat', content: IDE_SOURCE_CODE['clean.bat'] },
  'README.md': { type: 'file', name: 'README.md', content: IDE_SOURCE_CODE['README.md'] },
};

// --- Utility Functions ---

export function findNodeByPath(tree: FileSystemTree, path: string): FileSystemNode | null {
  const parts = path.split('/').filter(p => p);
  let currentLevel: FileSystemNode = { type: 'directory', name: 'root', children: tree };
  for (const part of parts) {
    if (currentLevel.type !== 'directory') return null;
    const nextNode = currentLevel.children[part];
    if (!nextNode) return null;
    currentLevel = nextNode;
  }
  return currentLevel;
}

export function getFileContent(tree: FileSystemTree, path: string): string | null {
  const node = findNodeByPath(tree, path);
  return node?.type === 'file' ? node.content : null;
}

export function setFileContent(tree: FileSystemTree, path: string, content: string): FileSystemTree {
  const newTree = JSON.parse(JSON.stringify(tree));
  const parts = path.split('/').filter(p => p);
  let currentLevel = newTree;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!currentLevel[part] || currentLevel[part].type !== 'directory') return tree;
    currentLevel = (currentLevel[part] as FileSystemDirectory).children;
  }
  const fileName = parts[parts.length - 1];
  if (currentLevel[fileName] && currentLevel[fileName].type === 'file') {
    (currentLevel[fileName] as FileSystemFile).content = content;
  }
  return newTree;
}

export function addDirectoryByPath(tree: FileSystemTree, path: string): FileSystemTree {
    const newTree = JSON.parse(JSON.stringify(tree));
    const parts = path.split('/').filter(p => p);
    let currentLevel = newTree;
    for (const part of parts) {
        if (!currentLevel[part]) currentLevel[part] = { type: 'directory', name: part, children: {} };
        if (currentLevel[part].type !== 'directory') return tree; // Path conflict
        currentLevel = (currentLevel[part] as FileSystemDirectory).children;
    }
    return newTree;
}

export function addFileByPath(tree: FileSystemTree, path: string, content: string): FileSystemTree {
    const newTree = JSON.parse(JSON.stringify(tree));
    const parts = path.split('/').filter(p => p);
    const fileName = parts.pop();
    if (!fileName) return tree;
    let currentLevel = newTree;
    for (const part of parts) {
        if (!currentLevel[part]) currentLevel[part] = { type: 'directory', name: part, children: {} };
        if (currentLevel[part].type !== 'directory') return tree;
        currentLevel = (currentLevel[part] as FileSystemDirectory).children;
    }
    currentLevel[fileName] = { type: 'file', name: fileName, content };
    return newTree;
}

export function deleteNodeByPath(tree: FileSystemTree, path: string): FileSystemTree {
    const newTree = JSON.parse(JSON.stringify(tree));
    const parts = path.split('/').filter(p => p);
    let currentLevel = newTree;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!currentLevel[part] || currentLevel[part].type !== 'directory') return tree;
        currentLevel = (currentLevel[part] as FileSystemDirectory).children;
    }
    delete currentLevel[parts[parts.length - 1]];
    return newTree;
}

export function renameNodeByPath(tree: FileSystemTree, oldPath: string, newName: string): FileSystemTree {
    const newTree = JSON.parse(JSON.stringify(tree));
    const parts = oldPath.split('/').filter(p => p);
    const oldName = parts.pop();
    if (!oldName) return tree;
    let parentLevel = newTree;
    for (const part of parts) {
        if (!parentLevel[part] || parentLevel[part].type !== 'directory') return tree;
        parentLevel = (parentLevel[part] as FileSystemDirectory).children;
    }
    const nodeToRename = parentLevel[oldName];
    if (!nodeToRename || parentLevel[newName]) return tree; // Does not exist or name collision
    delete parentLevel[oldName];
    nodeToRename.name = newName;
    parentLevel[newName] = nodeToRename;
    return newTree;
}

export function flattenTree(tree: FileSystemTree, prefix: string = ''): Record<string, string> {
    let flatMap: Record<string, string> = {};
    for (const name in tree) {
        const node = tree[name];
        const currentPath = prefix ? `${prefix}/${name}` : name;
        if (node.type === 'file') {
            flatMap[currentPath] = node.content;
        } else if (node.type === 'directory') {
            Object.assign(flatMap, flattenTree(node.children, currentPath));
        }
    }
    return flatMap;
}