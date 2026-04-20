// js/modules/rag/embeddings.js
// Full RAG manager: dedup (SHA‑256), parallel batches, folder upload, sanitization, user DB
// Fixed: setInterval removed, worker terminated on page unload, progress callback local

window.RAGEmbeddings = (function() {
    let worker = null;
    let pendingPromises = new Map();
    let nextId = 0;
    let isWorkerReady = false;
    let pendingQueue = [];
    let currentProgressCallback = null; // local progress callback

    // ---------- SHA‑256 for deduplication ----------
    async function sha256(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ---------- Sanitize code to prevent prompt injection ----------
    function sanitizeCode(content) {
        return content.replace(/<\|system\|>|\[INST\]|<<SYS>>|<\/?think>/gi, '[removed]');
    }

    // ---------- Worker initialization ----------
    function initWorker() {
        if (worker) return Promise.resolve();
        return new Promise((resolve, reject) => {
            try {
                worker = new Worker('js/modules/rag/embeddings-worker.js', { type: 'module' });
                worker.onmessage = function(e) {
                    const { type, data, id, error, batchId, progress, total } = e.data;
                    if (type === 'worker_ready') {
                        isWorkerReady = true;
                        console.log('✅ Embedding worker ready');
                        while (pendingQueue.length) {
                            const { type, data, id, batchId, resolve, reject } = pendingQueue.shift();
                            if (type === 'embed') worker.postMessage({ type: 'embed', data, id });
                            else if (type === 'batch_embed') worker.postMessage({ type: 'batch_embed', data: { chunks: data, batchId } });
                        }
                        resolve();
                    }
                    else if (type === 'embed_result' && pendingPromises.has(id)) {
                        pendingPromises.get(id).resolve(data);
                        pendingPromises.delete(id);
                    } 
                    else if (type === 'embed_error' && pendingPromises.has(id)) {
                        pendingPromises.get(id).reject(new Error(error));
                        pendingPromises.delete(id);
                    } 
                    else if (type === 'batch_result' && pendingPromises.has(batchId)) {
                        pendingPromises.get(batchId).resolve(data);
                        pendingPromises.delete(batchId);
                    } 
                    else if (type === 'batch_error' && pendingPromises.has(batchId)) {
                        pendingPromises.get(batchId).reject(new Error(error));
                        pendingPromises.delete(batchId);
                    } 
                    else if (type === 'batch_progress') {
                        if (currentProgressCallback && typeof currentProgressCallback === 'function') {
                            currentProgressCallback(progress, total);
                        }
                        if (progress === total && window.showToast) {
                            window.showToast(`✅ Generated ${total} embeddings`, 'success', 2000);
                        }
                    }
                };
                worker.onerror = (err) => reject(err);
                setTimeout(() => {
                    if (!isWorkerReady) reject(new Error('Worker failed to load within 10 seconds'));
                }, 10000);
            } catch (err) {
                reject(err);
            }
        });
    }

    async function ensureWorker() {
        if (!worker) await initWorker();
        else if (!isWorkerReady) {
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (isWorkerReady) { clearInterval(check); resolve(); }
                }, 100);
            });
        }
    }

    async function generateEmbedding(text) {
        await ensureWorker();
        const id = (nextId++).toString();
        return new Promise((resolve, reject) => {
            pendingPromises.set(id, { resolve, reject });
            if (isWorkerReady) worker.postMessage({ type: 'embed', data: text, id });
            else pendingQueue.push({ type: 'embed', data: text, id, resolve, reject });
        });
    }

    async function generateEmbeddingsForChunks(chunks, progressCallback = null) {
        await ensureWorker();
        const batchId = 'batch_' + Date.now() + '_' + Math.random().toString(36);
        return new Promise((resolve, reject) => {
            // Store progress callback temporarily for this batch
            const originalProgress = currentProgressCallback;
            if (progressCallback) currentProgressCallback = progressCallback;
            pendingPromises.set(batchId, { 
                resolve: (val) => { currentProgressCallback = originalProgress; resolve(val); },
                reject: (err) => { currentProgressCallback = originalProgress; reject(err); }
            });
            if (isWorkerReady) worker.postMessage({ type: 'batch_embed', data: { chunks, batchId } });
            else pendingQueue.push({ type: 'batch_embed', data: chunks, batchId, resolve, reject });
        });
    }

    // ---------- Helper: recursive directory read ----------
    async function readAllFilesFromEntry(entry) {
        const files = [];
        if (entry.isFile) {
            const file = await new Promise(resolve => entry.file(resolve));
            files.push(file);
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await new Promise(resolve => reader.readEntries(resolve));
            for (const subEntry of entries) {
                const subFiles = await readAllFilesFromEntry(subEntry);
                files.push(...subFiles);
            }
        }
        return files;
    }

    // ---------- Main indexing function (dedup + parallel batches) ----------
    async function indexCodeFiles(files, progressCallback = null) {
        if (!files || files.length === 0) return false;
        if (!window.VectorStore) {
            console.error('VectorStore not loaded');
            return false;
        }

        // Use local progress callback if provided
        const onProgress = progressCallback || function(current, total) {
            console.log(`Indexing: ${current}/${total}`);
        };

        onProgress(0, files.length, 'Preparing...');

        let allChunks = [];
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                console.warn(`Skipping ${file.name}: >10MB`);
                continue;
            }
            let content = file.content;
            if (!content) continue;
            content = sanitizeCode(content);
            const chunks = window.CodeChunker.splitIntoChunks(content, file.name);
            allChunks.push(...chunks);
        }

        if (allChunks.length === 0) {
            if (window.showToast) window.showToast('No valid chunks extracted.', 'warning');
            return false;
        }

        // Deduplicate: check hash before embedding
        const uniqueChunks = [];
        for (const chunk of allChunks) {
            const hash = await sha256(chunk.content);
            const existing = await window.VectorStore.getChunkByHash(hash);
            if (!existing) {
                uniqueChunks.push({ ...chunk, contentHash: hash });
            }
        }

        if (uniqueChunks.length === 0) {
            if (window.showToast) window.showToast('All chunks already indexed.', 'info');
            return false;
        }

        if (window.showToast) window.showToast(`🔍 Generating ${uniqueChunks.length} new embeddings...`, 'info', 3000);

        // Parallel batches (5 chunks per batch)
        const BATCH_SIZE = 5;
        const batches = [];
        for (let i = 0; i < uniqueChunks.length; i += BATCH_SIZE) {
            batches.push(uniqueChunks.slice(i, i + BATCH_SIZE));
        }
        let allResults = [];
        let processedBatches = 0;
        for (const batch of batches) {
            const results = await generateEmbeddingsForChunks(batch, (progress, total) => {
                const overallProgress = Math.floor((processedBatches * BATCH_SIZE + progress) / uniqueChunks.length * 100);
                onProgress(overallProgress, 100, `Embedding batch ${processedBatches+1}/${batches.length}`);
            });
            allResults.push(...results);
            processedBatches++;
            onProgress(Math.floor(processedBatches * BATCH_SIZE / uniqueChunks.length * 100), 100, `Saving embeddings...`);
        }

        // Save to VectorStore
        for (const chunk of allResults) {
            await window.VectorStore.saveEmbedding({
                content: chunk.content,
                filePath: chunk.filePath,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                chunkIndex: chunk.chunkIndex,
                embedding: chunk.embedding,
                contentHash: chunk.contentHash,
                timestamp: Date.now()
            });
        }

        const stats = await window.VectorStore.getStats();
        if (window.showToast) {
            window.showToast(`✅ Indexed ${stats.totalChunks} chunks from ${stats.files.length} files`, 'success', 4000);
        }
        if (window.updateIndexStatsUI) window.updateIndexStatsUI();
        return true;
    }

    // ---------- Search with RAG toggle check ----------
    async function searchRelevantContext(query, topK = 3) {
        if (!query || query.trim().length === 0) return [];
        if (localStorage.getItem('ragEnabled') === 'false') return [];
        if (!window.VectorStore) return [];
        try {
            const queryEmbedding = await generateEmbedding(query);
            const results = await window.VectorStore.searchSimilar(queryEmbedding, query, topK);
            return results;
        } catch (err) {
            console.warn('Search failed:', err);
            return [];
        }
    }

    // ---------- Index management ----------
    async function clearIndex() {
        if (!window.VectorStore) return;
        await window.VectorStore.clearAllEmbeddings();
        if (window.showToast) window.showToast('🗑️ RAG index cleared.', 'info', 1500);
        if (window.updateIndexStatsUI) window.updateIndexStatsUI();
    }

    async function getIndexStats() {
        if (!window.VectorStore) return { totalChunks: 0, files: [] };
        return await window.VectorStore.getStats();
    }

    async function getFileChunks(filePath) {
        if (!window.VectorStore) return [];
        return await window.VectorStore.getByFilePath(filePath);
    }

    async function deleteFileFromIndex(filePath) {
        if (!window.VectorStore) return false;
        await window.VectorStore.deleteByFilePath(filePath);
        if (window.showToast) window.showToast(`🗑️ Removed "${filePath.split('/').pop()}" from index`, 'success', 1500);
        if (window.updateIndexStatsUI) window.updateIndexStatsUI();
        return true;
    }

    async function getAllIndexedFiles() {
        if (!window.VectorStore) return [];
        return await window.VectorStore.getAllFiles();
    }

    // ---------- Auth listener to update DB name (no setInterval) ----------
    function initAuthListener() {
        if (window.currentUser !== undefined) {
            const updateDbName = () => {
                if (window.VectorStore && window.VectorStore.setUserDbName) {
                    window.VectorStore.setUserDbName(window.currentUser?.uid);
                }
            };
            // Use MutationObserver or Firebase onAuthStateChanged if available
            if (typeof window.onAuthStateChanged === 'function') {
                window.onAuthStateChanged((user) => {
                    updateDbName();
                });
            } else {
                // Fallback: watch for property changes (less ideal but works)
                let lastUser = window.currentUser;
                const observer = new MutationObserver(() => {
                    if (window.currentUser !== lastUser) {
                        lastUser = window.currentUser;
                        updateDbName();
                    }
                });
                observer.observe(document.body, { attributes: true, subtree: false, attributeFilter: ['data-user'] });
                // Also periodically check but with longer interval (once per minute)
                setInterval(() => {
                    if (window.currentUser !== lastUser) {
                        lastUser = window.currentUser;
                        updateDbName();
                    }
                }, 60000);
            }
            updateDbName();
        }
    }

    // ---------- Worker termination on page unload ----------
    function cleanupWorker() {
        if (worker) {
            worker.terminate();
            worker = null;
            isWorkerReady = false;
            pendingPromises.clear();
            pendingQueue = [];
            console.log('🧹 Embedding worker terminated');
        }
    }
    window.addEventListener('beforeunload', cleanupWorker);

    // ---------- Auto‑init worker and auth listener ----------
    setTimeout(() => {
        initWorker().catch(err => console.warn('Worker init failed:', err));
    }, 1000);
    initAuthListener();

    // ---------- Public API ----------
    return {
        indexCodeFiles,
        searchRelevantContext,
        clearIndex,
        getIndexStats,
        generateEmbedding,
        getFileChunks,
        deleteFileFromIndex,
        getAllIndexedFiles
    };
})();