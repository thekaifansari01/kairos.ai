// python-worker.js - Web Worker for Pyodide with abort support, stdout capture, timeout

let pyodide = null;
let isReady = false;
let timeoutId = null;
let stdoutBuffer = [];
let currentExecutionId = null;
let shouldAbort = false;

// Custom stdout handler to capture print output
function stdoutWriter(text) {
    stdoutBuffer.push(text);
}

async function loadPyodideAndRun() {
    try {
        self.postMessage({ type: 'loading' });
        // Load Pyodide from CDN
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
            stdout: stdoutWriter
        });
        isReady = true;
        self.postMessage({ type: 'ready' });
        console.log('[Pyodide Worker] Ready');
    } catch (err) {
        self.postMessage({ type: 'error', error: err.message });
        console.error('[Pyodide Worker] Init failed:', err);
    }
}

async function executeCode(code, id) {
    if (!pyodide || !isReady) {
        self.postMessage({ type: 'execution_error', id, error: 'Python runtime not ready yet. Please wait.' });
        return;
    }

    currentExecutionId = id;
    shouldAbort = false;
    stdoutBuffer = [];

    // Clear any previous timeout
    if (timeoutId) clearTimeout(timeoutId);

    // Set 30 second timeout
    timeoutId = setTimeout(() => {
        if (currentExecutionId === id) {
            shouldAbort = true;
            self.postMessage({ type: 'execution_error', id, error: 'Execution timeout (30s). Code may be too slow or infinite loop.' });
        }
    }, 30000);

    try {
        // Wrap code with abort flag checking
        const wrappedCode = `
import asyncio
import sys

_abort_flag = False

def check_abort():
    if _abort_flag:
        raise KeyboardInterrupt("Execution aborted by user")

# Monkey-patch sys.settrace to check abort periodically
old_trace = sys.gettrace()
def trace_callback(frame, event, arg):
    check_abort()
    if old_trace:
        return old_trace(frame, event, arg)
    return trace_callback

sys.settrace(trace_callback)

# Run user code
${code}

sys.settrace(old_trace)
        `;

        const result = await pyodide.runPythonAsync(wrappedCode);

        if (shouldAbort) throw new Error('Aborted');

        if (timeoutId) clearTimeout(timeoutId);

        // Combine stdout and return value
        let output = stdoutBuffer.join('\n');
        if (result !== undefined && result !== null && String(result).trim() !== '') {
            if (output) output += '\n';
            output += String(result);
        }
        if (!output.trim()) output = '(No output)';

        // Run garbage collection
        await pyodide.runPythonAsync('import gc; gc.collect()');

        self.postMessage({ type: 'execution_result', id, output: output });
    } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        let errorMsg = err.message || String(err);
        if (errorMsg.includes('Aborted') || errorMsg.includes('KeyboardInterrupt')) {
            errorMsg = 'Execution stopped by user';
        } else if (errorMsg.includes('Traceback')) {
            const lines = errorMsg.split('\n');
            const lastLine = lines[lines.length - 1];
            if (lastLine && lastLine.includes('Error:')) {
                errorMsg = lastLine;
            } else if (lines.length > 3) {
                errorMsg = lines.slice(-2).join('\n');
            }
        }
        self.postMessage({ type: 'execution_error', id, error: errorMsg });
    } finally {
        currentExecutionId = null;
    }
}

self.onmessage = async function(e) {
    const { type, code, id, abortId } = e.data;

    if (type === 'init') {
        loadPyodideAndRun();
    }
    else if (type === 'run') {
        executeCode(code, id);
    }
    else if (type === 'abort') {
        if (currentExecutionId === abortId) {
            shouldAbort = true;
            // Try to set abort flag inside Python
            try {
                await pyodide.runPythonAsync('_abort_flag = True');
            } catch(e) {}
        }
        self.postMessage({ type: 'aborted', id: abortId });
    }
    else if (type === 'reset') {
        if (pyodide) {
            try {
                await pyodide.runPythonAsync('import gc; gc.collect()');
            } catch(e) {}
        }
        self.postMessage({ type: 'reset_done' });
    }
};

// Auto-initialize when worker starts
self.postMessage({ type: 'loading' });
loadPyodideAndRun();