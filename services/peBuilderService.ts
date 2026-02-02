// AETHER CORE COMPILER v3.0 - PE Builder & Linker Service
// This service implements the Assembler, Linker, and PE file format generator with full import handling.

// --- Helper class for writing binary data ---
class BinaryWriter {
    private buffer: number[] = [];
    private _offset: number = 0;

    get offset(): number { return this._offset; }

    writeUint8(value: number) { this.buffer.push(value & 0xFF); this._offset++; }
    writeUint16(value: number) { this.writeUint8(value); this.writeUint8(value >> 8); }
    writeUint32(value: number) { this.writeUint16(value); this.writeUint16(value >> 16); }
    writeUint64(value: bigint) {
        const lower = Number(BigInt.asUintN(32, value));
        const upper = Number(BigInt.asUintN(32, value >> 32n));
        this.writeUint32(lower);
        this.writeUint32(upper);
    }
    writeString(value: string) { for (let i = 0; i < value.length; i++) this.writeUint8(value.charCodeAt(i)); }
    writeBytes(bytes: number[] | Uint8Array) { bytes.forEach(b => this.writeUint8(b)); }
    
    align(alignment: number) {
        while (this._offset % alignment !== 0) {
            this.writeUint8(0);
        }
    }
    
    getBytes(): Uint8Array { return new Uint8Array(this.buffer); }
}

interface ImportInfo {
    dll: string;
    functions: string[];
}

interface AssembledSections {
    text: Uint8Array;
    data: Uint8Array;
    imports: ImportInfo[];
    relocations: { textOffset: number; type: 'call' | 'data'; symbol: string }[];
}

/**
 * A micro-assembler for a tiny subset of x86/64 instructions. It now handles external calls.
 * @param asm - The assembly code string.
 * @returns Assembled machine code and metadata for linking.
 */
export function assemble(asm: string): AssembledSections {
    const text: number[] = [];
    const data: number[] = [];
    const imports = new Map<string, Set<string>>();
    const relocations: AssembledSections['relocations'] = [];
    let currentSection: 'text' | 'data' | null = null;
    
    const lines = asm.split('\n');

    // First pass: identify externals and data labels
    const dataLabels = new Map<string, number>();
    let currentDataOffset = 0;
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('extern')) {
            const externParts = trimmed.split(/\s+/);
            const func = externParts.length > 1 ? externParts[1] : null;
            // Simple mapping of function to DLL
            const dll = func === 'ExitProcess' ? 'kernel32.dll' : (func ? 'msvcrt.dll' : 'unknown.dll');
            if (!imports.has(dll)) imports.set(dll, new Set());
            imports.get(dll)!.add(func);
        } else if (trimmed.startsWith('section .data')) {
            currentSection = 'data';
        } else if (trimmed.startsWith('section .text')) {
            currentSection = 'text';
        } else if (currentSection === 'data') {
            const labelMatch = trimmed.match(/^(\w+):/);
            if (labelMatch) {
                dataLabels.set(labelMatch[1], currentDataOffset);
                const dbMatch = trimmed.match(/db\s+"([^"]+)",\s*0/);
                if (dbMatch) currentDataOffset += dbMatch[1].length + 1;
            }
        }
    });

    // Second pass: assemble instructions
    let currentTextOffset = 0;
    currentSection = null;
    lines.forEach(line => {
        const trimmed = line.trim().replace(/;.*$/, '').trim();
        if (!trimmed || trimmed.startsWith('extern')) return;
        if (trimmed.startsWith('section .text')) { currentSection = 'text'; return; }
        if (trimmed.startsWith('section .data')) { currentSection = 'data'; return; }
        if (trimmed.match(/^(\w+):/)) return; 

        if (currentSection === 'text') {
            const writer = new BinaryWriter();
            if (trimmed.startsWith('sub rsp, 32')) writer.writeBytes([0x48, 0x83, 0xEC, 0x20]);
            else if (trimmed.startsWith('xor rcx, rcx')) writer.writeBytes([0x48, 0x31, 0xC9]);
            else if (trimmed.startsWith('call')) {
                const callParts = trimmed.split(/\s+/);
                const symbol = callParts.length > 1 ? callParts[1] : 'unknown';
                // FF 15 disp32 -> CALL QWORD PTR [rip+disp32]
                writer.writeBytes([0xFF, 0x15]);
                relocations.push({ textOffset: writer.offset + currentTextOffset, type: 'call', symbol });
                writer.writeUint32(0); // Placeholder for RIP-relative offset to IAT entry
            } else if (trimmed.startsWith('lea rcx')) {
                const bracketMatch = trimmed.match(/\[([^\]]+)\]/);
                const symbol = bracketMatch ? bracketMatch[1] : 'unknown';
                // 48 8D 0D disp32 -> LEA RCX, [rip+disp32]
                writer.writeBytes([0x48, 0x8D, 0x0D]);
                relocations.push({ textOffset: writer.offset + currentTextOffset, type: 'data', symbol });
                writer.writeUint32(0); // Placeholder for RIP-relative offset to data
            }
            const bytes = Array.from(writer.getBytes());
            text.push(...bytes);
            currentTextOffset += bytes.length;
        } else if (currentSection === 'data') {
            const dbMatch = trimmed.match(/db\s+"([^"]+)",\s*0/);
            if (dbMatch) {
                const strBytes = [...dbMatch[1]].map(c => c.charCodeAt(0));
                data.push(...strBytes, 0);
            }
        }
    });
    
    const finalImports: ImportInfo[] = [];
    imports.forEach((functions, dll) => {
        finalImports.push({ dll, functions: Array.from(functions) });
    });

    return { text: new Uint8Array(text), data: new Uint8Array(data), imports: finalImports, relocations };
}

/**
 * Constructs a 64-bit PE file, now with a proper .idata section for linking.
 * @param assembled - The result from the assemble function.
 * @returns A Uint8Array representing the complete .exe file.
 */
export function createPEFile(assembled: AssembledSections): Uint8Array {
    const writer = new BinaryWriter();

    const IMAGE_BASE = 0x400000n;
    const FILE_ALIGNMENT = 0x200;
    const SECTION_ALIGNMENT = 0x1000;
    const align = (val: number, alignment: number) => Math.ceil(val / alignment) * alignment;

    // --- .idata Section Pre-computation ---
    const importDataWriter = new BinaryWriter();
    const rvaToIatEntry: Map<string, number> = new Map();
    
    const dlls = assembled.imports;
    const numDlls = dlls.length;
    const importDirTableSize = (numDlls + 1) * 20; // 20 bytes per IMAGE_IMPORT_DESCRIPTOR
    
    let currentOffset = importDirTableSize;
    const lookupTablesRva: number[] = [];
    const dllNamesRva: number[] = [];

    // Build Hint/Name table and DLL names first
    const hintNameRvas: Map<string, number> = new Map();
    dlls.forEach(imp => {
        imp.functions.forEach(func => {
            hintNameRvas.set(func, currentOffset);
            importDataWriter.writeUint16(0); // Hint
            importDataWriter.writeString(func);
            importDataWriter.writeUint8(0);
            importDataWriter.align(2);
            currentOffset = importDataWriter.offset;
        });
        dllNamesRva.push(currentOffset);
        importDataWriter.writeString(imp.dll);
        importDataWriter.writeUint8(0);
        currentOffset = importDataWriter.offset;
    });

    // Build Lookup Tables (ILT and IAT)
    let iatRvaStart = currentOffset;
    dlls.forEach(imp => {
        lookupTablesRva.push(currentOffset);
        imp.functions.forEach(func => {
            rvaToIatEntry.set(func, currentOffset);
            importDataWriter.writeUint64(BigInt(hintNameRvas.get(func)!));
            currentOffset += 8;
        });
        importDataWriter.writeUint64(0n); // End of table
        currentOffset += 8;
    });

    // Build Import Directory Table
    const idataRva = SECTION_ALIGNMENT * 3;
    const importDirWriter = new BinaryWriter();
    dlls.forEach((imp, i) => {
        importDirWriter.writeUint32(lookupTablesRva[i] + idataRva); // OriginalFirstThunk (ILT)
        importDirWriter.writeUint32(0); // TimeDateStamp
        importDirWriter.writeUint32(0); // ForwarderChain
        importDirWriter.writeUint32(dllNamesRva[i] + idataRva); // Name
        importDirWriter.writeUint32(rvaToIatEntry.get(imp.functions[0])! + idataRva); // FirstThunk (IAT)
    });
    importDirWriter.writeBytes(new Array(20).fill(0)); // Null entry to terminate

    const idataBytes = new Uint8Array([...importDirWriter.getBytes(), ...importDataWriter.getBytes()]);

    // --- DOS Header ---
    writer.writeString('MZ'); writer.writeBytes(new Array(58).fill(0)); writer.writeUint32(0x40);
    writer.align(0x40);

    // --- PE Header ---
    const peHeaderOffset = writer.offset;
    writer.writeString('PE\0\0'); 
    writer.writeUint16(0x8664); // Machine: x64
    writer.writeUint16(3); // NumberOfSections: .text, .data, .idata
    writer.writeUint32(Math.floor(Date.now() / 1000));
    writer.writeUint32(0); writer.writeUint32(0);
    writer.writeUint16(0xF0); // SizeOfOptionalHeader
    writer.writeUint16(0x22); 

    // --- Optional Header ---
    writer.writeUint16(0x20B); // PE32+
    writer.writeUint8(1); writer.writeUint8(0);
    
    const sizeOfText = align(assembled.text.length, FILE_ALIGNMENT);
    const sizeOfData = align(assembled.data.length, FILE_ALIGNMENT);
    const sizeOfIData = align(idataBytes.length, FILE_ALIGNMENT);

    writer.writeUint32(sizeOfText); // SizeOfCode
    writer.writeUint32(sizeOfData + sizeOfIData); // SizeOfInitializedData
    writer.writeUint32(0); 
    writer.writeUint32(SECTION_ALIGNMENT); // AddressOfEntryPoint
    writer.writeUint32(SECTION_ALIGNMENT); // BaseOfCode
    writer.writeUint64(IMAGE_BASE);
    writer.writeUint32(SECTION_ALIGNMENT); writer.writeUint32(FILE_ALIGNMENT);
    writer.writeUint16(6); writer.writeUint16(0); writer.writeUint16(0); writer.writeUint16(0);
    writer.writeUint16(6); writer.writeUint16(0); writer.writeUint32(0); 

    const sizeOfImage = SECTION_ALIGNMENT * 4;
    writer.writeUint32(sizeOfImage);
    const sizeOfHeaders = align(peHeaderOffset + 0xF0 + (3 * 0x28), FILE_ALIGNMENT);
    writer.writeUint32(sizeOfHeaders);
    writer.writeUint32(0);
    writer.writeUint16(2); // Subsystem: CUI
    writer.writeUint16(0x400); 
    writer.writeUint64(0x100000n); writer.writeUint64(0x1000n);
    writer.writeUint64(0x100000n); writer.writeUint64(0x1000n);
    writer.writeUint32(0); writer.writeUint32(16);
    
    // Data Directories
    writer.writeUint32(0); writer.writeUint32(0); // Export Table
    writer.writeUint32(idataRva); writer.writeUint32(idataBytes.length); // Import Table
    for (let i = 0; i < 14; i++) { writer.writeUint32(0); writer.writeUint32(0); }

    // --- Section Headers ---
    // .text
    writer.writeString(".text\0\0\0");
    writer.writeUint32(assembled.text.length); writer.writeUint32(SECTION_ALIGNMENT);
    writer.writeUint32(sizeOfText); writer.writeUint32(sizeOfHeaders);
    writer.writeBytes(new Array(12).fill(0)); writer.writeUint32(0x60000020);
    
    // .data
    writer.writeString(".data\0\0\0");
    writer.writeUint32(assembled.data.length); writer.writeUint32(SECTION_ALIGNMENT * 2);
    writer.writeUint32(sizeOfData); writer.writeUint32(sizeOfHeaders + sizeOfText);
    writer.writeBytes(new Array(12).fill(0)); writer.writeUint32(0xC0000040);

    // .idata
    writer.writeString(".idata\0\0\0");
    writer.writeUint32(idataBytes.length); writer.writeUint32(SECTION_ALIGNMENT * 3);
    writer.writeUint32(sizeOfIData); writer.writeUint32(sizeOfHeaders + sizeOfText + sizeOfData);
    writer.writeBytes(new Array(12).fill(0)); writer.writeUint32(0xC0000040);

    writer.align(FILE_ALIGNMENT);

    // --- Section Data ---
    const textStart = writer.offset;
    writer.writeBytes(assembled.text);
    writer.align(FILE_ALIGNMENT);
    
    const dataStart = writer.offset;
    writer.writeBytes(assembled.data);
    writer.align(FILE_ALIGNMENT);

    const idataStart = writer.offset;
    writer.writeBytes(idataBytes);
    writer.align(FILE_ALIGNMENT);
    
    // --- Final Linking Step (Patching) ---
    const finalBytes = writer.getBytes();
    const finalDataView = new DataView(finalBytes.buffer);
    
    const textRva = SECTION_ALIGNMENT;
    const dataRva = SECTION_ALIGNMENT * 2;
    const idataRvaBase = SECTION_ALIGNMENT * 3;

    assembled.relocations.forEach(reloc => {
        const rvaOfInstruction = textRva + reloc.textOffset;
        const rvaOfNextInstruction = rvaOfInstruction + 4;
        let targetRva = 0;
        
        if(reloc.type === 'data') {
            targetRva = dataRva; // Simple case, assumes one data symbol
        } else if (reloc.type === 'call') {
            targetRva = idataRvaBase + rvaToIatEntry.get(reloc.symbol)!;
        }

        const ripRelativeOffset = targetRva - rvaOfNextInstruction;
        finalDataView.setInt32(textStart + reloc.textOffset, ripRelativeOffset, true);
    });
    
    return finalBytes;
}
