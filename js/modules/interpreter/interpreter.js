// interpreter.js - Main thread wrapper with lazy loading, queue, abort, and save support

(function() {
    let worker = null;
    let isReady = false;
    let pendingPromises = new Map(); // id -> { resolve, reject }
    let nextId = 1;
    let queue = [];
    let isExecuting = false;
    let currentRunId = null;
    let isLoading = false;           // New flag: loading in progress
    let loadPromise = null;          // New: promise for pending load

    // Lazy loader: creates worker only when needed
    function ensureWorker() {
        if (worker) {
            return Promise.resolve();
        }
        if (loadPromise) {
            return loadPromise;      // Already loading, wait for it
        }
        
        isLoading = true;
        loadPromise = new Promise((resolve, reject) => {
            console.log('[Interpreter] Lazy loading Pyodide worker...');
            if (window.showToast) {
                window.showToast('🐍 Loading Python runtime (first run may take a few seconds)...', 'info', 3000);
            }
            
            worker = new Worker('js/modules/interpreter/python-worker.js');
            
            worker.onmessage = function(e) {
                const data = e.data;
                
                if (data.type === 'ready') {
                    isReady = true;
                    isLoading = false;
                    console.log('[Interpreter] Worker ready');
                    if (window.showToast) {
                        window.showToast('✅ Python ready!', 'success', 1500);
                    }
                    resolve();
                    processQueue(); // Process any queued runs
                }
                else if (data.type === 'loading') {
                    console.log('[Interpreter] Worker loading Pyodide...');
                    // Optional: show persistent loading indicator
                }
                else if (data.type === 'execution_result') {
                    const promise = pendingPromises.get(data.id);
                    if (promise) {
                        promise.resolve(data.output);
                        pendingPromises.delete(data.id);
                    }
                    isExecuting = false;
                    currentRunId = null;
                    processQueue();
                }
                else if (data.type === 'execution_error') {
                    const promise = pendingPromises.get(data.id);
                    if (promise) {
                        promise.reject(new Error(data.error));
                        pendingPromises.delete(data.id);
                    }
                    isExecuting = false;
                    currentRunId = null;
                    processQueue();
                }
                else if (data.type === 'aborted') {
                    const promise = pendingPromises.get(data.id);
                    if (promise) {
                        promise.reject(new Error('Aborted by user'));
                        pendingPromises.delete(data.id);
                    }
                    isExecuting = false;
                    currentRunId = null;
                    processQueue();
                }
                else if (data.type === 'error') {
                    console.error('[Interpreter] Worker error:', data.error);
                    isReady = false;
                    isLoading = false;
                    if (window.showToast) {
                        window.showToast('Python interpreter error. Retrying...', 'error');
                    }
                    // Reset so next run tries again
                    worker = null;
                    loadPromise = null;
                    reject(new Error(data.error));
                }
                else if (data.type === 'reset_done') {
                    console.log('[Interpreter] Worker reset done');
                }
            };
            
            worker.onerror = function(err) {
                console.error('[Interpreter] Worker crashed:', err);
                isReady = false;
                isLoading = false;
                worker = null;
                loadPromise = null;
                if (window.showToast) {
                    window.showToast('Python interpreter crashed. Reload page?', 'error');
                }
                reject(err);
            };
        });
        
        return loadPromise;
    }

    function processQueue() {
        if (isExecuting) return;
        if (queue.length === 0) return;
        if (!isReady) return;

        const next = queue.shift();
        if (next) {
            isExecuting = true;
            currentRunId = next.id;
            worker.postMessage({ type: 'run', code: next.code, id: next.id });
        }
    }

    async function runPythonCode(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Invalid code');
        }

        // Ensure worker is loaded (lazy)
        await ensureWorker();
        
        // Wait until ready (just in case)
        if (!isReady) {
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (isReady) {
                        clearInterval(check);
                        resolve();
                    }
                }, 50);
            });
        }

        const id = (nextId++).toString();

        return new Promise((resolve, reject) => {
            pendingPromises.set(id, { resolve, reject });
            queue.push({ code, id });
            processQueue();
        });
    }

    function abortCurrent() {
        if (currentRunId && worker) {
            worker.postMessage({ type: 'abort', abortId: currentRunId });
            const promise = pendingPromises.get(currentRunId);
            if (promise) {
                promise.reject(new Error('Aborted by user'));
                pendingPromises.delete(currentRunId);
            }
            isExecuting = false;
            currentRunId = null;
            processQueue();
        }
    }

    function resetInterpreter() {
        if (worker) {
            worker.terminate();
            worker = null;
        }
        isReady = false;
        isLoading = false;
        isExecuting = false;
        currentRunId = null;
        loadPromise = null;
        pendingPromises.clear();
        queue = [];
        if (window.showToast) {
            window.showToast('Python interpreter reset. Will reload on next run.', 'info', 1500);
        }
    }

    function isInterpreterReady() {
        return isReady;
    }

    // ❌ REMOVED auto-initialization timeout
    // No more setTimeout(initWorker, 1000)

    // Expose globally
    window.pythonInterpreter = {
        run: runPythonCode,
        abort: abortCurrent,
        reset: resetInterpreter,
        isReady: isInterpreterReady
    };
})();