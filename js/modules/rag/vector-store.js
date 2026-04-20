// js/modules/rag/vector-store.js
// IndexedDB with contentHash unique index, hybrid search (keyword + cosine)
// Optimized: cursor-based search (no full memory load), auto-cleanup of old chunks

window.VectorStore = (function() {
    let DB_NAME = 'kairos_rag_db';
    const STORE_NAME = 'embeddings';
    let DB_VERSION = 3;          // bumped to support timestamp index for cleanup
    let db = null;

    // Update DB name based on logged-in user
    function setUserDbName(uid) {
        if (uid) DB_NAME = `kairos_rag_${uid}`;
        else DB_NAME = 'kairos_rag_db';
        if (db) {
            db.close();
            db = null;
        }
    }

    function openDB() {
        return new Promise((resolve, reject) => {
            if (db && db.name === DB_NAME) {
                resolve(db);
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            request.onupgradeneeded = (event) => {
                const dbInst = event.target.result;
                if (!dbInst.objectStoreNames.contains(STORE_NAME)) {
                    const store = dbInst.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('filePath', 'filePath', { unique: false });
                    store.createIndex('contentHash', 'contentHash', { unique: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false }); // for cleanup
                } else {
                    const store = event.target.transaction.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('timestamp')) {
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                    if (!store.indexNames.contains('contentHash')) {
                        store.createIndex('contentHash', 'contentHash', { unique: true });
                    }
                }
            };
        });
    }

    async function saveEmbedding(embeddingData) {
        const dbInst = await openDB();
        return new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.add(embeddingData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function getByFilePath(filePath) {
        const dbInst = await openDB();
        return new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('filePath');
            const request = index.getAll(filePath);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function deleteByFilePath(filePath) {
        const items = await getByFilePath(filePath);
        const dbInst = await openDB();
        const tx = dbInst.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const item of items) {
            await new Promise((resolve, reject) => {
                const req = store.delete(item.id);
                req.onsuccess = resolve;
                req.onerror = reject;
            });
        }
        return true;
    }

    async function getChunkByHash(hash) {
        const dbInst = await openDB();
        return new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('contentHash');
            const request = index.get(hash);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function getAllFiles() {
        const all = await getAllEmbeddings();
        const fileMap = new Map();
        for (const item of all) {
            if (!fileMap.has(item.filePath)) {
                fileMap.set(item.filePath, { path: item.filePath, chunks: 0 });
            }
            fileMap.get(item.filePath).chunks++;
        }
        return Array.from(fileMap.values());
    }

    async function saveManyEmbeddings(embeddingsArray) {
        const dbInst = await openDB();
        const tx = dbInst.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const data of embeddingsArray) {
            await new Promise((resolve, reject) => {
                const req = store.add(data);
                req.onsuccess = resolve;
                req.onerror = reject;
            });
        }
        return true;
    }

    async function getAllEmbeddings() {
        const dbInst = await openDB();
        return new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function clearAllEmbeddings() {
        const dbInst = await openDB();
        return new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Cosine similarity
    function cosineSimilarity(vecA, vecB) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }
        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);
        if (magA === 0 || magB === 0) return 0;
        return dot / (magA * magB);
    }

    // Keyword search (improved: substring matching already works)
    async function keywordSearch(query, topK = 5) {
        const all = await getAllEmbeddings();
        if (!all.length) return [];
        const keywords = query.toLowerCase().split(/\s+/);
        const scored = all.map(item => {
            const lowerContent = item.content.toLowerCase();
            let score = 0;
            for (const kw of keywords) {
                if (lowerContent.includes(kw)) score += 5;
                if (lowerContent === kw) score += 20;
                if (kw.length > 3 && lowerContent.includes(kw)) score += 2;
            }
            return { ...item, score };
        });
        scored.sort((a,b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    // ========== OPTIMIZED SEARCH (cursor-based, no full memory load) ==========
    async function searchSimilar(queryEmbedding, queryText, topK = 5) {
        const dbInst = await openDB();
        // Vector search using cursor
        const vectorResults = await new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const cursorRequest = store.openCursor();
            const results = [];
            let count = 0;
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < topK * 2) {
                    const item = cursor.value;
                    const sim = cosineSimilarity(queryEmbedding, item.embedding);
                    results.push({ ...item, score: sim });
                    results.sort((a,b) => b.score - a.score);
                    if (results.length > topK * 2) results.pop();
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            cursorRequest.onerror = () => reject(cursorRequest.error);
        });

        // Keyword search (still uses getAllEmbeddings, but keyword search is usually fast)
        const keywordResults = await keywordSearch(queryText, topK * 2);
        
        // Combine using weighted average (70% vector, 30% keyword)
        const combined = new Map();
        for (const r of vectorResults) {
            combined.set(r.id, { ...r, finalScore: r.score * 0.7 });
        }
        for (const r of keywordResults) {
            const existing = combined.get(r.id);
            if (existing) {
                existing.finalScore += r.score * 0.3;
            } else {
                combined.set(r.id, { ...r, finalScore: r.score * 0.3 });
            }
        }
        const final = Array.from(combined.values());
        final.sort((a,b) => b.finalScore - a.finalScore);
        return final.slice(0, topK).map(item => ({
            content: item.content,
            filePath: item.filePath,
            score: item.finalScore,
            startLine: item.startLine,
            endLine: item.endLine
        }));
    }

    async function getStats() {
        const all = await getAllEmbeddings();
        const fileMap = new Map();
        all.forEach(item => fileMap.set(item.filePath, (fileMap.get(item.filePath) || 0) + 1));
        return {
            totalChunks: all.length,
            files: Array.from(fileMap.entries()).map(([path, chunks]) => ({ path, chunks }))
        };
    }

    // ========== AUTO-CLEANUP: delete chunks older than X days ==========
    async function cleanupOldChunks(days = 30) {
        const dbInst = await openDB();
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return new Promise((resolve, reject) => {
            const tx = dbInst.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(cutoff);
            const cursorRequest = index.openCursor(range);
            let deletedCount = 0;
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    deletedCount++;
                    cursor.continue();
                } else {
                    if (deletedCount > 0 && window.showToast) {
                        window.showToast(`🧹 Auto-cleaned ${deletedCount} old chunks (>${days} days)`, 'info', 3000);
                    }
                    resolve(deletedCount);
                }
            };
            cursorRequest.onerror = () => reject(cursorRequest.error);
        });
    }

    // Run cleanup on app start (but only once after DB is ready)
    setTimeout(async () => {
        try {
            await openDB();
            await cleanupOldChunks(30);
        } catch(e) { console.warn('Auto-cleanup failed:', e); }
    }, 5000);

    // Expose public methods
    return {
        setUserDbName,
        saveEmbedding,
        saveManyEmbeddings,
        getAllEmbeddings,
        clearAllEmbeddings,
        searchSimilar,
        getStats,
        getByFilePath,
        deleteByFilePath,
        getAllFiles,
        getChunkByHash,
        cleanupOldChunks
    };
})();