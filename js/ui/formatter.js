// js/ui/formatter.js — Markdown + code highlighting, Python run button, line numbers, stop, save, keyboard shortcut

// ========== MARKDOWN CONFIGURATION ==========
marked.setOptions({
    breaks: true,
    gfm: true,
    mangle: false
});

// ========== HELPER: ESCAPE HTML ==========
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}
window.escapeHtml = escapeHtml;

// ========== HELPER: DECODE HTML ENTITIES ==========
function decodeHtmlEntities(str) {
    if (!str) return '';
    return str.replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&');
}

// ========== CHECK IF PYTHON CODE IS SUPPORTED IN PYODIDE ==========
function isPythonCodeSupported(code) {
    if (!code) return true;
    const unsupportedPatterns = [
        /\bimport\s+threading\b/,
        /\bfrom\s+threading\b/,
        /\bimport\s+socket\b/,
        /\bfrom\s+socket\b/,
        /\bimport\s+multiprocessing\b/,
        /\bfrom\s+multiprocessing\b/,
        /\bimport\s+subprocess\b/,
        /\bfrom\s+subprocess\b/,
        /\bos\.system\s*\(/,
        /\bthreading\.Thread\s*\(/,
        /\bsocket\.socket\s*\(/,
        /\bmultiprocessing\.Process\s*\(/
    ];
    for (let pattern of unsupportedPatterns) {
        if (pattern.test(code)) {
            return false;
        }
    }
    return true;
}

// ========== HELPER: SAFE URL ==========
function normalizeHref(href) {
    if (href === null || href === undefined) return '#';
    let url = '';
    if (typeof href === 'string') {
        url = href;
    } else if (typeof href === 'object' && typeof href.href === 'string') {
        url = href.href;
    } else {
        url = String(href);
    }
    url = url.trim();
    if (!url) return '#';
    const compact = url.replace(/\s+/g, '').toLowerCase();
    if (
        compact.startsWith('javascript:') ||
        compact.startsWith('vbscript:') ||
        compact.startsWith('data:text/html') ||
        compact.startsWith('data:application/javascript')
    ) {
        return '#';
    }
    return url;
}

function normalizeText(text) {
    if (text === null || text === undefined) return '';
    return typeof text === 'string' ? text : String(text);
}

// ========== HIGHLIGHT CODE BLOCK ==========
function highlightCodeBlock(code, language) {
    if (code === null || code === undefined) return '';
    const codeStr = typeof code === 'string' ? code : String(code);
    const lang = (language && typeof language === 'string') ? language.trim() : '';
    try {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(codeStr, { language: lang }).value;
        } else {
            return hljs.highlightAuto(codeStr).value;
        }
    } catch (e) {
        console.warn('Highlight error:', e);
        return escapeHtml(codeStr);
    }
}

// ========== LINE NUMBERS FOR PYTHON CODE ==========
function addLineNumbersToPython(codeContent) {
    const lines = codeContent.split('\n');
    let numberedLines = '';
    for (let i = 1; i <= lines.length; i++) {
        numberedLines += `<span>${i}</span>`;
    }
    const highlighted = highlightCodeBlock(codeContent, 'python');
    return `
        <div class="line-numbers-container">
            <div class="line-numbers">${numberedLines}</div>
            <pre><code class="language-python hljs">${highlighted}</code></pre>
        </div>
    `;
}

// ========== POST-PROCESS HTML TO ADD COPY & RUN BUTTONS ==========
function addCopyButtonsToCodeBlocks(html) {
    if (!html || typeof html !== 'string') return '';

    return html.replace(
        /<pre><code(?:\s+class="[^"]*")?>([\s\S]*?)<\/code><\/pre>/gis,
        function(match, codeContent) {
            let lang = 'plaintext';
            const langMatch = match.match(/class="[^"]*language-([\w-]+)[^"]*"/i);
            if (langMatch && langMatch[1]) lang = langMatch[1];
            
            const isPython = (lang === 'python' || lang === 'py');
            const blockId = 'code-block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
            
            let innerCode;
            if (isPython) {
                innerCode = addLineNumbersToPython(codeContent);
            } else {
                const highlighted = highlightCodeBlock(codeContent, lang);
                innerCode = `<pre><code class="language-${escapeHtml(lang)} hljs">${highlighted}</code></pre>`;
            }
            
            let buttonsHtml = `
                <button class="copy-btn" onclick="copyCode(this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
            `;
            
            if (isPython) {
                const rawCode = decodeHtmlEntities(codeContent);
                const isSupported = isPythonCodeSupported(rawCode);
                if (isSupported) {
                    buttonsHtml += `
                        <button class="run-btn" data-block-id="${blockId}" onclick="runPythonCodeBlock(this)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                            </svg>
                            Run
                        </button>
                    `;
                } else {
                    buttonsHtml += `
                        <button class="run-btn disabled" disabled title="This code uses threading/socket/multiprocessing which are not supported in browser Python (Pyodide)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                            </svg>
                            Run (unsupported)
                        </button>
                    `;
                }
            }
            
            return `<div class="code-wrapper" data-block-id="${blockId}">
                <div class="code-header">
                    <span>${escapeHtml(lang)}</span>
                    <div class="code-buttons">
                        ${buttonsHtml}
                    </div>
                </div>
                ${innerCode}
                <div class="python-output" data-output-for="${blockId}" style="display: none;"></div>
            </div>`;
        }
    );
}

// ========== COPY FUNCTION ==========
window.copyCode = function(btn) {
    const wrapper = btn.closest('.code-wrapper');
    if (!wrapper) return;
    let codeElem = wrapper.querySelector('code');
    if (!codeElem) {
        const pre = wrapper.querySelector('pre');
        if (pre) codeElem = pre.querySelector('code');
    }
    if (!codeElem) return;
    const text = codeElem.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 2000);
    }).catch(() => alert('Copy failed'));
};

// ========== SAVE OUTPUT TO CHAT ==========
window.saveOutputToChat = function(outputText, code) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const formattedOutput = `**📤 Output from executed code:**\n\`\`\`\n${outputText}\n\`\`\``;
    window.appendAIMessage(formattedOutput, null, true);
    window.addMessageToHistory('assistant', `Output from executed code:\n${outputText}`);
    if (window.saveCurrentSession) window.saveCurrentSession();
};

// ========== COPY OUTPUT HELPER ==========
window.copyTerminalOutput = function(btn) {
    const outputDiv = btn.closest('.python-output');
    if (!outputDiv) return;
    const contentElem = outputDiv.querySelector('.terminal-content');
    if (!contentElem) return;
    const text = contentElem.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '✓';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 1500);
        if (window.showToast) window.showToast('Output copied', 'info', 1000);
    }).catch(() => {
        if (window.showToast) window.showToast('Copy failed', 'error');
    });
};

// ========== RUN PYTHON CODE BLOCK ==========
window.runPythonCodeBlock = async function(btn) {
    const wrapper = btn.closest('.code-wrapper');
    if (!wrapper) return;
    const blockId = wrapper.getAttribute('data-block-id');
    
    let codeElem = wrapper.querySelector('code');
    if (!codeElem) {
        const pre = wrapper.querySelector('pre');
        if (pre) codeElem = pre.querySelector('code');
    }
    if (!codeElem) return;
    
    let code = codeElem.textContent || '';
    code = decodeHtmlEntities(code);
    if (!code.trim()) {
        if (window.showToast) window.showToast('No code to run', 'info');
        return;
    }
    
    let outputDiv = wrapper.querySelector('.python-output');
    if (!outputDiv) {
        outputDiv = document.createElement('div');
        outputDiv.className = 'python-output';
        outputDiv.setAttribute('data-output-for', blockId);
        wrapper.appendChild(outputDiv);
    }
    
    outputDiv.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-header-left">
                <span class="terminal-icon">⩾</span>
                <span class="terminal-title">Output</span>
            </div>
            <div class="terminal-actions">
                <button class="stop-exec-btn" style="display:none;" title="Stop execution">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
                </button>
                <button class="save-output-btn" title="Save output to chat">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </button>
                <button class="copy-output-btn" title="Copy output">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
            </div>
        </div>
        <pre class="terminal-content">Running...</pre>
    `;
    outputDiv.style.display = 'block';
    outputDiv.classList.remove('success', 'error');
    
    const stopBtn = outputDiv.querySelector('.stop-exec-btn');
    const saveBtn = outputDiv.querySelector('.save-output-btn');
    const copyBtn = outputDiv.querySelector('.copy-output-btn');
    
    const originalHtml = btn.innerHTML;
    btn.classList.add('running');
    btn.innerHTML = '<span class="running-spinner"></span> Running...';
    btn.disabled = true;
    
    stopBtn.style.display = 'inline-flex';
    stopBtn.onclick = () => {
        if (window.pythonInterpreter && window.pythonInterpreter.abort) {
            window.pythonInterpreter.abort();
            if (window.showToast) window.showToast('Stopping execution...', 'info');
        }
    };
    
    saveBtn.onclick = () => {
        const contentElem = outputDiv.querySelector('.terminal-content');
        if (!contentElem) return;
        const outputText = contentElem.textContent || '';
        if (outputText && outputText !== 'Running...') {
            window.saveOutputToChat(outputText, code);
            if (window.showToast) window.showToast('Output saved to chat', 'success');
        } else {
            if (window.showToast) window.showToast('No output to save', 'info');
        }
    };
    
    copyBtn.onclick = () => {
        const contentElem = outputDiv.querySelector('.terminal-content');
        if (!contentElem) return;
        const text = contentElem.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = '✓';
            setTimeout(() => {
                copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
            }, 1500);
            if (window.showToast) window.showToast('Output copied', 'info');
        }).catch(() => window.showToast('Copy failed', 'error'));
    };
    
    try {
        if (!window.pythonInterpreter || typeof window.pythonInterpreter.run !== 'function') {
            throw new Error('Python interpreter not loaded. Please refresh the page.');
        }
        const result = await window.pythonInterpreter.run(code);
        let displayOutput = result === undefined || result === '' ? '(No output)' : result;
        let isError = false;
        if (displayOutput.includes("can't start new thread") || displayOutput.includes("threading")) {
            displayOutput = `⚠️ Threading not supported. Use asyncio.\n\n${displayOutput}`;
            isError = true;
        } else if (displayOutput.includes("socket")) {
            displayOutput = `⚠️ Sockets not allowed. Use pyodide.http.pyfetch.\n\n${displayOutput}`;
            isError = true;
        }
        const contentElem = outputDiv.querySelector('.terminal-content');
        if (contentElem) contentElem.textContent = displayOutput;
        outputDiv.classList.add(isError ? 'error' : 'success');
        if (!isError && window.showToast) window.showToast('✓ Code executed', 'success', 1500);
        else if (isError && window.showToast) window.showToast('⚠️ Execution with warnings', 'warning', 3000);
    } catch (err) {
        let errorMsg = err.message;
        if (errorMsg.includes('Aborted')) {
            errorMsg = 'Execution stopped by user';
        } else if (errorMsg.includes("can't start new thread")) {
            errorMsg = "Threading not supported. Use asyncio.";
        } else if (errorMsg.includes("socket")) {
            errorMsg = "Socket operations not allowed.";
        }
        const contentElem = outputDiv.querySelector('.terminal-content');
        if (contentElem) contentElem.textContent = `Error: ${errorMsg}`;
        outputDiv.classList.add('error');
        if (window.showToast) window.showToast('Execution failed', 'error', 3000);
    } finally {
        btn.classList.remove('running');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        if (stopBtn) stopBtn.style.display = 'none';
    }
};

// ========== KEYBOARD SHORTCUT: Ctrl+Enter to run focused code block ==========
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const active = document.activeElement;
        let codeWrapper = null;
        if (active && active.closest) {
            codeWrapper = active.closest('.code-wrapper');
        }
        if (!codeWrapper) {
            const selection = window.getSelection();
            if (selection.anchorNode) {
                const container = selection.anchorNode.parentElement?.closest?.('.code-wrapper');
                if (container) codeWrapper = container;
            }
        }
        if (codeWrapper) {
            const runBtn = codeWrapper.querySelector('.run-btn:not(.disabled)');
            if (runBtn && !runBtn.disabled && !runBtn.classList.contains('running')) {
                e.preventDefault();
                runBtn.click();
            }
        }
    }
});

// ========== AUTO-RUN ON PAGE LOAD (for blocks with data-auto-run="true") ==========
function initAutoRun() {
    const autoRunBlocks = document.querySelectorAll('.code-wrapper[data-auto-run="true"] .run-btn:not(.disabled)');
    autoRunBlocks.forEach(btn => {
        setTimeout(() => btn.click(), 500);
    });
}
window.initAutoRun = initAutoRun;

// ========== CUSTOM TABLE RENDERER ==========
const renderer = new marked.Renderer();

renderer.table = function(...args) {
    if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
        const token = args[0];
        const header = Array.isArray(token.header) ? token.header : [];
        const rows = Array.isArray(token.rows) ? token.rows : [];
        const aligns = Array.isArray(token.align) ? token.align : [];
        const renderCell = (cell, index, tag) => {
            const align = aligns[index];
            const style = align ? ` style="text-align:${align}"` : '';
            let content = '';
            if (cell && Array.isArray(cell.tokens) && this.parser && typeof this.parser.parseInline === 'function') {
                content = this.parser.parseInline(cell.tokens);
            } else if (cell && typeof cell.text === 'string') {
                content = escapeHtml(cell.text);
            } else {
                content = '';
            }
            return `<${tag}${style}>${content}</${tag}>`;
        };
        const headerHtml = `<tr>${header.map((cell, i) => renderCell(cell, i, 'th')).join('')}</tr>`;
        const bodyHtml = rows.map(row => {
            const cells = Array.isArray(row) ? row : [];
            return `<tr>${cells.map((cell, i) => renderCell(cell, i, 'td')).join('')}</tr>`;
        }).join('');
        return `<div class="table-wrapper">\n<table>\n<thead>${headerHtml}</thead>\n<tbody>${bodyHtml}</tbody>\n</table>\n</div>`;
    }
    const header = args[0] || '';
    const body = args[1] || '';
    return '<div class="table-wrapper">' +
           '<table><thead>' + header + '</thead><tbody>' + body + '</tbody></table>' +
           '</div>';
};

renderer.link = function(...args) {
    let href = '';
    let title = '';
    let text = '';
    if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
        const token = args[0];
        href = token.href ?? '';
        title = token.title ?? '';
        if (Array.isArray(token.tokens) && this.parser && typeof this.parser.parseInline === 'function') {
            text = this.parser.parseInline(token.tokens);
        } else if (typeof token.text === 'string') {
            text = escapeHtml(token.text);
        } else {
            text = 'link';
        }
    } else {
        href = args[0];
        title = args[1];
        text = args[2];
    }
    const safeHref = normalizeHref(href);
    const safeTitle = title ? ` title="${escapeHtml(normalizeText(title))}"` : '';
    const safeText = (text === null || text === undefined || text === '') ? 'link' : text;
    return `<a href="${escapeHtml(safeHref)}"${safeTitle} target="_blank" rel="noopener noreferrer" class="markdown-link">${safeText}</a>`;
};

marked.use({ renderer });

// ========== MAIN FORMAT FUNCTION (NO CURSOR INSIDE) ==========
window.formatAIResponse = async function(rawText, isGenerating = true) {
    if (!rawText || typeof rawText !== 'string') return '';
    if (rawText.length > 50000 && !isGenerating) {
        return `<pre style="white-space: pre-wrap; font-family: monospace; background: #0a0c10; padding: 1rem; border-radius: 8px; overflow-x: auto;">${escapeHtml(rawText)}</pre>`;
    }
    let thinkContent = '';
    let answerContent = rawText;
    const thinkMatch = rawText.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
    if (thinkMatch) {
        thinkContent = thinkMatch[1].trim();
        answerContent = rawText.replace(/<think>[\s\S]*?(?:<\/think>|$)/i, '').trim();
    }
    let html = '';
    if (thinkContent) {
        const isComplete = rawText.toLowerCase().includes('</think>');
        let parsedThink = '';
        try {
            parsedThink = await marked.parse(thinkContent);
            parsedThink = addCopyButtonsToCodeBlocks(parsedThink);
        } catch (e) {
            parsedThink = escapeHtml(thinkContent);
        }
        html += `<div class="think-box">
            <details${isComplete ? '' : ' open'}>
                <summary>
                    <span class="think-icon">${isComplete ? '✓' : '⟳'}</span>
                    ${isComplete ? ' Thought Process' : ' Reasoning in progress...'}
                </summary>
                <div class="think-content">${parsedThink}</div>
            </details>
        </div>`;
    }
    if (answerContent) {
        try {
            let parsed = await marked.parse(answerContent);
            parsed = addCopyButtonsToCodeBlocks(parsed);
            html += parsed;
        } catch (e) {
            console.error('Parse error:', e);
            html += escapeHtml(answerContent);
        }
    }   
    // ✅ No cursor added here – cursor is separate in UI
    return html;
};

// ========== FAST PLAIN TEXT FORMATTER (FOR STREAMING, NO MARKDOWN) ==========
window.formatPlainText = function(rawText, isGenerating = true) {
    if (!rawText) return '';
    let escaped = escapeHtml(rawText);
    escaped = escaped.replace(/\n/g, '<br>');
    escaped = escaped.replace(/  /g, ' &nbsp;');
    if (isGenerating) {
        return escaped + '<span class="blinking-cursor"></span>';
    }
    return escaped;
};