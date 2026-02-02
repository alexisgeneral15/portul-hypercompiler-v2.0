
// AETHER AI LEARNING CORE v3.0 - Axiomatic Knowledge Bitfield

const STORAGE_KEY = 'portul_ai_knowledge_axiom_v3';

// The entire knowledge base is a single 32-bit integer.
type KnowledgeAxiom = number;

// --- Bitfield Definitions (Conceptual allocation within a 32-bit integer) ---
export const NAMING_STYLE_MASK = 1 << 0; // 0 = snake_case, 1 = camelCase
export const VAR_TYPE_MASK     = 1 << 1; // 0 = num dominant, 1 = txt dominant
export const PUT_KEYWORD_MASK  = 1 << 2; // 1 = 'put' is common
export const CAL_KEYWORD_MASK  = 1 << 3; // 1 = 'cal' is common
export const INC_KEYWORD_MASK  = 1 << 4; // 1 = 'inc' is common
export const ADD_KEYWORD_MASK  = 1 << 5; // 1 = 'add' is common

export function getKnowledgeAxiom(): KnowledgeAxiom {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Returns the stored number or 0 if nothing is stored.
        return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
        console.error("Failed to parse knowledge axiom:", e);
        return 0;
    }
}

function saveKnowledgeAxiom(axiom: KnowledgeAxiom) {
    try {
        localStorage.setItem(STORAGE_KEY, axiom.toString());
    } catch (e) {
        console.error("Failed to save knowledge axiom:", e);
    }
}

function analyzeContent(content: string, stats: Record<string, number>) {
    content.split('\n').forEach(line => {
        const funcMatch = line.match(/^new\s+([a-zA-Z0-9_]+)/);
        if (funcMatch) {
            if (funcMatch[1].includes('_')) stats.snakeCase++;
            else stats.camelCase++;
        }
        if (line.match(/^(num)\s+\w+/)) stats.numVars++;
        if (line.match(/^(txt)\s+\w+/)) stats.txtVars++;
        if (line.includes('put')) stats.putCount++;
        if (line.includes('cal')) stats.calCount++;
        if (line.includes('inc')) stats.incCount++;
        if (line.includes('add')) stats.addCount++;
    });
}

/**
 * Analyzes code and updates the single Knowledge Axiom integer.
 * This process has a near-zero memory overhead.
 * @param {Record<string, string>} files - A map of file paths to their content.
 */
export function learnFromSuccessfulBuild(files: Record<string, string>): void {
    let axiom: KnowledgeAxiom = 0;
    
    const stats = { snakeCase: 0, camelCase: 0, numVars: 0, txtVars: 0, putCount: 0, calCount: 0, incCount: 0, addCount: 0 };
    for (const content of Object.values(files)) {
        analyzeContent(content, stats);
    }

    if (stats.camelCase > stats.snakeCase) axiom |= NAMING_STYLE_MASK;
    if (stats.txtVars > stats.numVars) axiom |= VAR_TYPE_MASK;
    if (stats.putCount > 5) axiom |= PUT_KEYWORD_MASK;
    if (stats.calCount > 3) axiom |= CAL_KEYWORD_MASK;
    if (stats.incCount > 2) axiom |= INC_KEYWORD_MASK;
    if (stats.addCount > 2) axiom |= ADD_KEYWORD_MASK;
    
    saveKnowledgeAxiom(axiom);
}

/**
 * Learns from a single piece of text, like AI-generated code, and updates the existing axiom.
 * @param {string} text - The code snippet to learn from.
 * @returns {string[]} A list of newly learned characteristics.
 */
export function learnFromText(text: string): string[] {
    const oldAxiom = getKnowledgeAxiom();
    let axiom = oldAxiom;
    const stats = { snakeCase: 0, camelCase: 0, numVars: 0, txtVars: 0, putCount: 0, calCount: 0, incCount: 0, addCount: 0 };
    
    analyzeContent(text, stats);
    
    if (stats.camelCase > stats.snakeCase) axiom |= NAMING_STYLE_MASK;
    if (stats.txtVars > stats.numVars) axiom |= VAR_TYPE_MASK;
    if (stats.putCount > 0) axiom |= PUT_KEYWORD_MASK;
    if (stats.calCount > 0) axiom |= CAL_KEYWORD_MASK;
    if (stats.incCount > 0) axiom |= INC_KEYWORD_MASK;
    if (stats.addCount > 0) axiom |= ADD_KEYWORD_MASK;

    if (axiom === oldAxiom) {
        return []; // Nothing new was learned
    }

    saveKnowledgeAxiom(axiom);

    const learnedCharacteristics: string[] = [];
    const checkAndLog = (mask: number, old: number, current: number, message: string) => {
        if (!(old & mask) && (current & mask)) {
            learnedCharacteristics.push(message);
        }
    };

    checkAndLog(NAMING_STYLE_MASK, oldAxiom, axiom, "Observed 'camelCase' naming style");
    checkAndLog(VAR_TYPE_MASK, oldAxiom, axiom, "Observed 'txt' as dominant type");
    checkAndLog(PUT_KEYWORD_MASK, oldAxiom, axiom, "Learned 'put' keyword usage");
    checkAndLog(CAL_KEYWORD_MASK, oldAxiom, axiom, "Learned 'cal' keyword usage");
    checkAndLog(INC_KEYWORD_MASK, oldAxiom, axiom, "Learned 'inc' keyword usage");
    checkAndLog(ADD_KEYWORD_MASK, oldAxiom, axiom, "Learned 'add' keyword usage");
    
    return learnedCharacteristics;
}


/**
 * Gets a human-readable summary of the AI's knowledge by decoding the axiom.
 */
export function getLearnedPatternSummary(): string {
    const axiom = getKnowledgeAxiom();
    if (axiom === 0) {
        return "Axioma de Conocimiento vacío. Se necesita análisis para calibrar.";
    }

    const characteristics = [
        `**Estilo:** \`${(axiom & NAMING_STYLE_MASK) ? 'camelCase' : 'snake_case'}\``,
        `**Tipo Dominante:** \`${(axiom & VAR_TYPE_MASK) ? 'txt' : 'num'}\``,
    ];
    
    const commonOps = [];
    if (axiom & PUT_KEYWORD_MASK) commonOps.push('put');
    if (axiom & CAL_KEYWORD_MASK) commonOps.push('cal');
    if (axiom & INC_KEYWORD_MASK) commonOps.push('inc');
    if (axiom & ADD_KEYWORD_MASK) commonOps.push('add');

    if (commonOps.length > 0) {
        characteristics.push(`**Ops Comunes:** \`${commonOps.join(', ')}\``);
    }
    
    return `Análisis de Axioma completado.\n- ${characteristics.join('\n- ')}`;
}

/**
 * Generates new code by decoding the Knowledge Axiom.
 */
export function innovateCode(): { newCode: string, newFilePath: string } {
    const axiom = getKnowledgeAxiom();
    const newFilePath = 'src/utils/innovations.portulpp';
    
    const useCamelCase = (axiom & NAMING_STYLE_MASK) !== 0;
    const dominantType = (axiom & VAR_TYPE_MASK) !== 0 ? 'txt' : 'num';
    
    const newFuncName = useCamelCase ? 'calculateAverage' : 'calculate_average';
    
    const newCode = `# innovations.portulpp (Auto-generated by Aether Core)
# This file is generated from a 4-byte Knowledge Axiom.

new ${newFuncName} ${dominantType} a ${dominantType} b {
    # Logic synthesized from learned patterns.
    add a b
    div a 2
    put "Average calculated."
    ret a
}
`;
    return { newCode, newFilePath };
}

/**
 * Clears the knowledge axiom.
 */
export function clearLearnedPatterns(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear learned patterns:", e);
    }
}

/**
 * Based on learned data, suggests more idiomatic ways to write code.
 */
export function getIdiomaticSuggestion(line: string): string | null {
    if (!line || typeof line !== 'string') return null;
    const axiom = getKnowledgeAxiom();
    const incIsCommon = (axiom & INC_KEYWORD_MASK) !== 0;

    if (incIsCommon && line.match(/^add\s+\w+\s+1$/)) {
        const varParts = line.trim().split(/\s+/);
        const variableName = varParts.length > 1 ? varParts[1] : 'var';
        return `Use 'inc ${variableName}' for better performance.`;
    }

    return null;
}

/**
 * Returns the size of the knowledge base in bytes.
 * With the new axiom model, this is constant.
 */
export function getKnowledgeAxiomSize(): number {
    // A 32-bit integer is 4 bytes.
    return 4;
}
