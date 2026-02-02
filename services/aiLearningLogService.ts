
const STORAGE_KEY = 'portul_ai_learning_log_v1';

export interface LearningEvent {
    timestamp: number;
    message: string;
}

export function getLearningLog(): LearningEvent[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse AI learning log:", e);
        return [];
    }
}

function saveLearningLog(log: LearningEvent[]): void {
    try {
        // Keep the log from getting too big
        const limitedLog = log.slice(-50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedLog));
    } catch (e) {
        console.error("Failed to save AI learning log:", e);
    }
}

export function addLearningEvent(message: string): void {
    const log = getLearningLog();
    const newEvent: LearningEvent = {
        timestamp: Date.now(),
        message: message,
    };
    saveLearningLog([...log, newEvent]);
}

export function clearLearningLog(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear learning log:", e);
    }
}
