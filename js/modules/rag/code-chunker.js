// js/modules/rag/code-chunker.js
// Token‑aware chunking using estimateTokens, with file size limit
// Fixed: overlap startLine calculation, removed dead code

window.CodeChunker = (function() {
    const MAX_CHUNK_TOKENS = 500;        // ~500 tokens per chunk
    const OVERLAP_TOKENS = 50;           // overlap for context
    const MAX_FILE_TOKENS = 50000;       // skip files > 50k tokens (~200KB)

    // Estimate tokens (same as memory.js)
    function estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    function splitIntoChunks(content, filePath, language = '') {
        const ext = filePath.split('.').pop().toLowerCase();
        const lang = language || ext;

        // Token limit check – skip huge files
        const totalTokens = estimateTokens(content);
        if (totalTokens > MAX_FILE_TOKENS) {
            console.warn(`[chunker] Skipping ${filePath}: ${totalTokens} tokens > ${MAX_FILE_TOKENS}`);
            return [];
        }

        const lines = content.split('\n');
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;
        let startLine = 1;
        
        // Helper to get last N lines of a chunk (for overlap)
        function getLastLines(text, maxTokens) {
            const linesArr = text.split('\n');
            const result = [];
            let tokens = 0;
            for (let i = linesArr.length - 1; i >= 0; i--) {
                const line = linesArr[i];
                const tok = estimateTokens(line + '\n');
                if (tokens + tok <= maxTokens) {
                    result.unshift(line);
                    tokens += tok;
                } else break;
            }
            return result;
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineTokens = estimateTokens(line + '\n');
            
            if (currentTokens + lineTokens > MAX_CHUNK_TOKENS && currentChunk) {
                // Save current chunk
                chunks.push({
                    content: currentChunk.trim(),
                    filePath,
                    startLine,
                    endLine: i,  // end line before current line (1-indexed)
                    chunkIndex: chunks.length
                });
                
                // Start new chunk with overlap (last few lines)
                const overlapLines = getLastLines(currentChunk, OVERLAP_TOKENS);
                currentChunk = overlapLines.join('\n') + (overlapLines.length ? '\n' : '');
                currentTokens = 0;
                for (const ln of overlapLines) {
                    currentTokens += estimateTokens(ln + '\n');
                }
                // Calculate new startLine: i - overlapLines.length + 1
                // Because we are about to add current line after overlap
                startLine = i - overlapLines.length + 1;
                if (startLine < 1) startLine = 1;
            }
            currentChunk += line + '\n';
            currentTokens += lineTokens;
        }

        // Last chunk
        if (currentChunk.trim()) {
            chunks.push({
                content: currentChunk.trim(),
                filePath,
                startLine,
                endLine: lines.length,
                chunkIndex: chunks.length
            });
        }

        // Fallback: if no chunks (very short file) just return whole content
        if (chunks.length === 0 && content.trim()) {
            chunks.push({
                content: content.trim(),
                filePath,
                startLine: 1,
                endLine: lines.length,
                chunkIndex: 0
            });
        }

        return chunks;
    }

    return { splitIntoChunks };
})();