// js/modules/rag/embeddings-worker.js
// ES Module Worker – handles both single and batch embedding with progress

import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0/dist/transformers.min.js';

let embeddingPipeline = null;

async function loadPipeline() {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embeddingPipeline;
}

self.onmessage = async function(e) {
    const { type, data, id, batchId } = e.data;
    
    if (type === 'embed') {
        try {
            const extractor = await loadPipeline();
            const output = await extractor(data, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);
            self.postMessage({ type: 'embed_result', data: embedding, id });
        } catch (err) {
            self.postMessage({ type: 'embed_error', error: err.message, id });
        }
    }
    else if (type === 'batch_embed') {
        const { chunks, batchId: bid } = data;
        const results = [];
        const extractor = await loadPipeline();
        
        for (let i = 0; i < chunks.length; i++) {
            try {
                const output = await extractor(chunks[i].content, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data);
                results.push({ ...chunks[i], embedding });
                self.postMessage({ 
                    type: 'batch_progress', 
                    progress: i + 1, 
                    total: chunks.length, 
                    batchId: bid 
                });
            } catch (err) {
                self.postMessage({ 
                    type: 'batch_error', 
                    error: err.message, 
                    chunk: chunks[i], 
                    batchId: bid 
                });
            }
        }
        self.postMessage({ type: 'batch_result', data: results, batchId: bid });
    }
};

self.postMessage({ type: 'worker_ready' });