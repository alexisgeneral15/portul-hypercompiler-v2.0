
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

const getAiInstance = () => {
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set. AI features will not work.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
}

const getTargetLanguage = (filename: string): 'Portul' | 'PortulScript' | 'Portul++' | null => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'py':
            return 'PortulScript';
        case 'js':
        case 'ts':
            return 'Portul';
        case 'c':
        case 'cpp':
        case 'java':
        case 'go':
        case 'cs': // C#
        case 'swift':
            return 'Portul++';
        default:
            return null;
    }
};

export const translateCodeToPortul = async (sourceCode: string, originalFilename: string): Promise<{ translatedCode: string; newFilename: string }> => {
    const ai = getAiInstance(); // Will throw if API_KEY is missing
    const targetLang = getTargetLanguage(originalFilename);
    if (!targetLang) {
        throw new Error(`Unsupported file type for translation: ${originalFilename}`);
    }

    const newExtension = targetLang === 'Portul' ? '.portul' : targetLang === 'Portul++' ? '.portulpp' : '.portulscript';
    const newFilename = originalFilename.substring(0, originalFilename.lastIndexOf('.')) + newExtension;

    const prompt = `
You are an expert compiler engineer specializing in hyper-efficient, low-level languages.
Translate the following code into the "${targetLang}" language.
The target language is designed for minimal hardware (1MHz CPU, 7KB RAM).
The translation must be extremely efficient and ergonomic, adhering to the target language's syntax and philosophy.
- The "Portul" language has keywords like 'num', 'add', 'put', 'for i 0 10 {}'. It's very low-level and maps closely to assembly.
- The "Portul++" language adds object-oriented concepts. It uses header files (.ph, .phpp) for declarations (with 'declare') and source files (.portulpp) for implementation. It has keywords like 'class', 'public', 'private', 'this'.
- The "PortulScript" language is a simple, Python-like scripting language with 'print()', 'for i in range()', and variable assignments.

Preserve the original logic and functionality. Respond ONLY with the raw translated code, without any explanation, intro, or markdown code fences.

Original Filename: ${originalFilename}
Source Code:
---
${sourceCode}
---
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    
    // FIX: The .text property is a getter, not a method. Per guidelines, access it directly.
    let translatedCode = response.text;

    // Clean up markdown fences if the model includes them despite instructions
    if (translatedCode?.startsWith('```')) {
        translatedCode = translatedCode.substring(translatedCode.indexOf('\n') + 1, translatedCode.lastIndexOf('```')).trim();
    }
    
    if (!translatedCode) {
        translatedCode = `# AI translation failed for ${originalFilename}\n# Please review the original code and translate manually.`;
    }

    return { translatedCode, newFilename };
};