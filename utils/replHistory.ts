
import { AIPendingAction } from '../services/portulToolchainService';

export interface HistoryEntry {
  type: 'input' | 'output';
  content: string;
  pendingAction?: AIPendingAction | null;
  aiMode?: 'gemini' | 'aether';
}

export function addHistoryEntry(history: HistoryEntry[], newEntry: HistoryEntry): HistoryEntry[] {
  // Remove pending action from previous entries to avoid multiple confirmation dialogs
  const cleanedHistory = history.map(entry => ({...entry, pendingAction: null}));
  return [...cleanedHistory, newEntry];
}

export function formatHistoryForAPI(history: HistoryEntry[]): string {
  return history
    .map(entry => {
      if (entry.type === 'input') {
        return `> ${entry.content}`;
      }
      return entry.content;
    })
    .join('\n');
}