
import { AIPendingAction, Language } from './portulToolchainService';
import { translations } from '../utils/translations';

const STORAGE_KEY = 'portul_ai_learned_commands_v3'; // Version bump for new parametric structure

// --- String Utility Helpers ---
const toPascalCase = (str: string) => (str || '')
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const toSnakeCase = (str: string) => (str || '').replace(/\s+/g, '_').toLowerCase();

// --- Knowledge Keywords ---
const CREATE_VERBS = ['create', 'make', 'generate', 'build', 'new', 'touch', 'scaffold', 'crear', 'hacer', 'generar', 'construir'];
const ENTITY_NOUNS = ['logger', 'utility', 'parser', 'component', 'module', 'service', 'utilidad', 'componente', 'servicio', 'módulo'];

// --- New Type Definitions for Parametric Learning ---
export interface LearnedCommandTemplate {
    pattern: string; // The generalized regex pattern
    intent: string; // e.g., 'create'
    entityType: string; // e.g., 'logger'
    filePathTemplate: string;
    contentTemplate: string;
    originalCommand: string;
}

type CommandRegistry = Record<string, LearnedCommandTemplate>;

function getRegistry(): CommandRegistry {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Failed to parse AI command registry:", e);
        return {};
    }
}

function saveRegistry(registry: CommandRegistry): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    } catch (e) {
        console.error("Failed to save AI command registry:", e);
    }
}

/**
 * Associates a user's command with an action, but generalizes it into a parametric template.
 * @param {string} command - The user's natural language command (e.g., "create a logger utility").
 * @param {AIPendingAction} action - The action that was confirmed by the user.
 */
export function learnCommand(command: string, action: AIPendingAction): void {
    if (!command || typeof command !== 'string') return;
    const registry = getRegistry();
    const normalizedCommand = command.toLowerCase().trim();
    const words = normalizedCommand.split(/\s+/);

    const intent = words.find(w => CREATE_VERBS.includes(w));
    const entityType = words.find(w => ENTITY_NOUNS.includes(w));
    
    // We can only learn if we understand the core intent and entity type.
    if (!intent || !entityType) return;

    // The "parameter" is what's left over. This is a simple heuristic.
    const param = words.filter(w => !CREATE_VERBS.includes(w) && !ENTITY_NOUNS.includes(w) && w.length > 2).join(' ');
    
    if (!param) return; // No parameter to generalize from.

    // Create a robust, generalized pattern
    const pattern = `(${CREATE_VERBS.join('|')}).*(?<param>\\w+(\\s\\w+)*).*(${ENTITY_NOUNS.join('|')})`;

    const filePathTemplate = action.filePath.replace(toSnakeCase(param), '{param_snake}');
    const contentTemplate = action.content.replace(new RegExp(toPascalCase(param), 'g'), '{param_pascal}');
    
    const newTemplate: LearnedCommandTemplate = {
        pattern,
        intent,
        entityType,
        filePathTemplate,
        contentTemplate,
        originalCommand: normalizedCommand,
    };
    
    // Use the pattern as the key to avoid duplicate patterns.
    registry[pattern] = newTemplate;
    saveRegistry(registry);
}


/**
 * Retrieves a learned action by matching the command against learned patterns and applying parameters.
 * @param {string} command - The user's natural language command.
 * @returns {AIPendingAction | null} A new, contextual action, or null if no pattern matches.
 */
export function getLearnedAction(command: string, language: Language): AIPendingAction | null {
    if (!command || typeof command !== 'string') return null;
    const registry = getRegistry();
    const normalizedCommand = command.toLowerCase().trim();

    for (const template of Object.values(registry)) {
        try {
            const regex = new RegExp(template.pattern, 'i');
            const match = normalizedCommand.match(regex);
            
            // Extract the named group 'param'
            const param = match?.groups?.param?.trim();

            if (param) {
                const paramSnake = toSnakeCase(param);
                const paramPascal = toPascalCase(param);

                const filePath = template.filePathTemplate.replace('{param_snake}', paramSnake);
                const content = template.contentTemplate.replace(/{param_pascal}/g, paramPascal);
                
                // Craft the new, intelligent explanation
                const t = translations[language];
                const explanation = language === 'es' 
                    ? `Aprendí a ${template.intent} componentes de tipo '${template.entityType}' con tu comando anterior ("${template.originalCommand}").\n\n**Propuesta:** Aplicaré esa técnica para generar un nuevo componente llamado \`${paramPascal}\` para ti.`
                    : `I learned how to ${template.intent} '${template.entityType}' components from your previous command ("${template.originalCommand}").\n\n**Proposal:** I will now apply that technique to generate a new component named \`${paramPascal}\` for you.`;
                
                return {
                    originalCommand: command,
                    actionType: 'CREATE_FILE',
                    filePath,
                    content,
                    explanation,
                };
            }
        } catch(e) {
            console.error(`Invalid regex in learned command '${template.originalCommand}': ${template.pattern}`);
            continue;
        }
    }

    return null;
}


/**
 * Retrieves all learned command templates for display.
 */
export function getAllLearnedCommands(): CommandRegistry {
    return getRegistry();
}


/**
 * Clears all learned commands.
 */
export function clearLearnedCommands(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear learned commands:", e);
    }
}
