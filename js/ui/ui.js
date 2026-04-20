// js/ui/ui.js — Base UI Module with file upload, drag & drop, RAG modal trigger (no inline RAG UI)

window.isUserScrolledUp = false;
window.scrollTimeout = null;
window.attachedFiles = [];
window.isSending = false;

window.escapeHtml = function(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

window.getMessageText = function(messageDiv) {
    const contentDiv = messageDiv.querySelector('.msg-content > div');
    if (!contentDiv) return '';
    const clone = contentDiv.cloneNode(true);
    const cursor = clone.querySelector('.blinking-cursor');
    if (cursor) cursor.remove();
    return clone.textContent.trim();
};

window.scrollToBottom = function() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
};

// File handling constants
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_EXTENSIONS = /\.(txt|js|py|html|css|json|md|xml|sh|log|csv|yaml|yml|ini|conf|cfg|env|gitignore|dockerignore|editorconfig|prettierrc|eslintrc|babelrc|npmrc|lock)$/i;
const ALLOWED_MIME_TYPES = [
    'text/plain', 'text/javascript', 'text/html', 'text/css', 'text/x-python',
    'application/json', 'text/markdown', 'text/xml', 'application/xml',
    'text/x-sh', 'text/csv'
];

function isAllowedFile(file) {
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) return false;
    if (ALLOWED_EXTENSIONS.test(file.name)) return true;
    if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
    return false;
}

function updateFileChips() {
    const container = document.getElementById('file-attachment-container');
    if (!container) return;
    
    if (window.attachedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="file-chips-wrapper">';
    window.attachedFiles.forEach((file, index) => {
        html += `
            <div class="file-chip" data-index="${index}">
                <span class="file-chip-icon">📄</span>
                <span class="file-chip-name">${window.escapeHtml(file.name)}</span>
                <button class="file-chip-remove" data-index="${index}" title="Remove file">✕</button>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.file-chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            if (!isNaN(idx) && idx >= 0 && idx < window.attachedFiles.length) {
                window.attachedFiles.splice(idx, 1);
                updateFileChips();
                if (window.showToast) window.showToast('File removed', 'info', 1500);
            }
        });
    });
}

window.attachFiles = async function(files) {
    if (!files || files.length === 0) return;
    
    if (window.attachedFiles.length + files.length > MAX_FILES) {
        if (window.showToast) window.showToast(`You can attach up to ${MAX_FILES} files at a time.`, 'error');
        return;
    }
    
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
        if (!isAllowedFile(file)) {
            errors.push(`"${file.name}" is not a supported text file.`);
            continue;
        }
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`"${file.name}" exceeds 2MB limit.`);
            continue;
        }
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
        if (errors.length) window.showToast(errors.join(' '), 'error', 4000);
        return;
    }
    
    const readPromises = validFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (content && typeof content === 'string') {
                    const sample = content.slice(0, 100);
                    if (sample.includes('\u0000') || (sample.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g)?.length || 0) > 10) {
                        resolve({ name: file.name, content: null, error: 'Binary file not supported' });
                        return;
                    }
                    resolve({ name: file.name, content: content, size: file.size });
                } else {
                    resolve({ name: file.name, content: null, error: 'Failed to read file content' });
                }
            };
            reader.onerror = () => {
                resolve({ name: file.name, content: null, error: 'Read error' });
            };
            reader.readAsText(file);
        });
    });
    
    const results = await Promise.all(readPromises);
    const newFiles = [];
    for (const res of results) {
        if (res.content !== null) {
            newFiles.push({ name: res.name, content: res.content, size: res.size });
        } else {
            errors.push(`"${res.name}": ${res.error || 'unsupported file type'}`);
        }
    }
    
    if (newFiles.length) {
        window.attachedFiles.push(...newFiles);
        updateFileChips();
        if (window.showToast) window.showToast(`${newFiles.length} file(s) attached.`, 'success', 2000);
    }
    if (errors.length) {
        if (window.showToast) window.showToast(errors.join(' '), 'error', 4000);
    }
};

// ========== RAG MODAL TRIGGER (to be defined in separate rag-manager.js) ==========
// This function will be implemented in the new file
window.showRAGModal = window.showRAGModal || function() {
    if (window.showToast) window.showToast("RAG Manager loading...", "info", 1000);
    // Load the modal script dynamically if not already loaded
    if (!document.getElementById('rag-manager-script')) {
        const script = document.createElement('script');
        script.id = 'rag-manager-script';
        script.src = 'js/ui/rag-manager.js';
        script.onload = () => {
            if (typeof window.showRAGModal === 'function') window.showRAGModal();
        };
        document.body.appendChild(script);
    }
};

// ========== TRIGGER FILE UPLOAD (for chat attachment) ==========
window.triggerFileUpload = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.txt,.js,.py,.html,.css,.json,.md,.xml,.sh,.log,.csv,.yaml,.yml,.ini,.conf,.cfg,.env,.gitignore';
    input.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            window.attachFiles(Array.from(e.target.files));
        }
    };
    input.click();
};

// Drag & drop for chat attachments
function initDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    const dropZone = document.querySelector('.input-container');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
    dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) window.attachFiles(Array.from(files));
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function appendFilePreview(files) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'message-files';
    
    let html = `<div class="files-preview-header">📎 Attached files</div><div class="files-preview-list">`;
    files.forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        let icon = '📄';
        if (ext === 'js') icon = '📜';
        else if (ext === 'py') icon = '🐍';
        else if (ext === 'html') icon = '🌐';
        else if (ext === 'css') icon = '🎨';
        else if (ext === 'json') icon = '🔧';
        else if (ext === 'md') icon = '📝';
        else if (ext === 'txt') icon = '📃';
        
        html += `
            <div class="file-preview-item" title="${window.escapeHtml(file.name)}">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${window.escapeHtml(file.name)}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
        `;
    });
    html += `</div>`;
    previewDiv.innerHTML = html;
    
    chatMessages.appendChild(previewDiv);
    if (!window.isUserScrolledUp) window.scrollToBottom();
}

// Model selector dropdown
let currentDropdownContent = 'main';

function closeDropdown() {
    const dropdown = document.getElementById('model-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

function showMainMenu() {
    const dropdown = document.getElementById('model-dropdown');
    if (!dropdown) return;
    currentDropdownContent = 'main';
    dropdown.innerHTML = `
        <div class="dropdown-menu-item" data-action="upload">
            <i class="fas fa-paperclip"></i> Upload file(s)
        </div>
        <div class="dropdown-menu-item" data-action="change-model">
            <i class="fas fa-microchip"></i> Change model
        </div>
    `;
    dropdown.classList.remove('hidden');

    dropdown.querySelector('[data-action="upload"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDropdown();
        window.triggerFileUpload();
    });
    dropdown.querySelector('[data-action="change-model"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showModelList();
    });
}

function showModelList() {
    if (!window.MODELS) return;
    const dropdown = document.getElementById('model-dropdown');
    if (!dropdown) return;
    currentDropdownContent = 'models';
    let html = `<div class="dropdown-back-btn" data-action="back">← Back</div>`;
    window.MODELS.forEach(model => {
        const activeClass = (window.CURRENT_MODEL_DISPLAY === model.display) ? 'active' : '';
        html += `<div class="dropdown-menu-item model-option ${activeClass}" data-model-id="${model.modelId}" data-display="${model.display}">${model.display}</div>`;
    });
    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');

    dropdown.querySelector('[data-action="back"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showMainMenu();
    });
    dropdown.querySelectorAll('.model-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const displayName = opt.getAttribute('data-display');
            if (displayName && window.switchModel) {
                window.switchModel(displayName);
                if (window.showToast) window.showToast(`Switched to ${displayName}`, 'success', 1500);
                closeDropdown();
            }
        });
    });
}

function initModelSelector() {
    const modelBtn = document.getElementById('model-btn');
    const modelDropdown = document.getElementById('model-dropdown');
    if (!modelBtn || !modelDropdown) return;

    modelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!modelDropdown.classList.contains('hidden') && currentDropdownContent === 'main') {
            closeDropdown();
        } else {
            showMainMenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (!modelBtn.contains(e.target) && !modelDropdown.contains(e.target)) closeDropdown();
    });
}

// Message appending
window.appendUserMessage = function(text, shouldScroll = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-inner">
            <div class="message-row">
                <div class="msg-avatar">👤</div>
                <div class="msg-content"><div>${window.escapeHtml(text)}</div></div>
            </div>
            <div class="message-actions"></div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    if (shouldScroll && !window.isUserScrolledUp) window.scrollToBottom();
    return messageDiv;
};

window.appendAIMessage = function(html, id = null, shouldScroll = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    if (id) messageDiv.id = id;
    messageDiv.innerHTML = `
        <div class="message-inner">
            <div class="message-row">
                <div class="msg-avatar">🐬</div>
                <div class="msg-content"><div class="markdown-container">${html}</div></div>
            </div>
            <div class="message-actions"></div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    if (shouldScroll && !window.isUserScrolledUp) window.scrollToBottom();
    return messageDiv;
};

window.appendMessage = function(sender, content, id = null, shouldScroll = true) {
    if (sender === 'user') return window.appendUserMessage(content, shouldScroll);
    else return window.appendAIMessage(content, id, shouldScroll);
};

// Handle send message (SMOOTH TRANSITION - FIXED) with template dropdown guard
window.handleSend = async function() {
    // ✅ CHECK: If template suggestions dropdown is open, don't send
    const templateDropdown = document.getElementById('template-suggestions-dropdown');
    if (templateDropdown && templateDropdown.parentNode) {
        return;
    }
    
    if (window.isGenerating || window.isSending) {
        if (window.showToast) window.showToast('Please wait, AI is still generating...', 'info');
        return;
    }
    window.isSending = true;
    
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    let text = userInput.value.trim();

    let finalMessageForAI = text;
    let cleanMessageForHistory = text;
    let attachedFilesCopy = [];

    if (window.attachedFiles.length > 0) {
        attachedFilesCopy = [...window.attachedFiles];
        
        let truncated = false;
        const MAX_FILE_CHARS = 32000;
        const fileSectionParts = [];
        for (const file of attachedFilesCopy) {
            let content = file.content;
            if (content.length > MAX_FILE_CHARS) {
                truncated = true;
                content = content.slice(0, MAX_FILE_CHARS) + "\n\n[... file truncated due to length ...]";
            }
            fileSectionParts.push(`[Attached file: ${file.name}]\n${content}`);
        }
        const fileSection = fileSectionParts.join('\n\n---\n\n');
        finalMessageForAI = fileSection + (text ? '\n\n---\n\n' + text : '');
        
        appendFilePreview(attachedFilesCopy);
        
        const fileNames = attachedFilesCopy.map(f => f.name);
        const fileIndicator = `📎 ${attachedFilesCopy.length} file${attachedFilesCopy.length > 1 ? 's' : ''}: ${fileNames.join(', ')}`;
        cleanMessageForHistory = text ? `${fileIndicator}\n\n${text}` : fileIndicator;
        
        window.appendUserMessage(text || fileIndicator, true);
        
        if (truncated && window.showToast) {
            window.showToast("⚠️ File content was too long, only first 32,000 characters sent.", "warning", 5000);
        }
        
        window.attachedFiles = [];
        updateFileChips();
    } else if (!text) {
        window.isSending = false;
        return;
    } else {
        window.appendUserMessage(text, true);
    }

    window.isGenerating = true;
    userInput.disabled = true;
    window.setActionButtonMode('stop');

    // ========== SMOOTH TRANSITION (NO updateWelcomeMode CALL) ==========
    if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
        // 1. Fade out welcome screen
        welcomeScreen.classList.add('fade-out');
        
        // 2. Animate input bar using CSS transition (already set in welcome.css)
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
            // Ensure transition is applied (inline for safety)
            inputArea.style.transition = 'bottom 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
            // Force reflow to make transition work
            void inputArea.offsetHeight;
            // Move to bottom (0)
            inputArea.style.bottom = '0';
        }
        
        // 3. Wait for transition to finish (400ms)
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // 4. Hide welcome screen and show messages
        welcomeScreen.classList.add('hidden');
        welcomeScreen.classList.remove('fade-out');
        if (chatMessages) chatMessages.classList.remove('hidden');
        
        // 5. Add slide-up animation to the last user message
        const userMessages = document.querySelectorAll('.message.user');
        const lastUserMsg = userMessages[userMessages.length - 1];
        if (lastUserMsg) {
            lastUserMsg.classList.add('slide-up');
            setTimeout(() => lastUserMsg.classList.remove('slide-up'), 400);
        }
        
        // 6. Remove inline transition after animation (cleanup)
        if (inputArea) {
            setTimeout(() => {
                inputArea.style.transition = '';
            }, 400);
        }
        
        // IMPORTANT: DO NOT call updateWelcomeMode() here - it will reset input bar!
    } else {
        if (chatMessages) chatMessages.classList.remove('hidden');
    }

    // The rest remains same...
    window.addMessageToHistory('user', cleanMessageForHistory);

    try {
        if (window.saveCurrentSession) await window.saveCurrentSession();
    } catch (err) {
        console.warn("Session save error:", err);
        if (window.showToast) window.showToast("Chat saved locally only. Login to sync.", "info", 2000);
    }

    userInput.value = '';
    userInput.style.height = 'auto';
    const aiMessageId = 'ai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    window.appendAIMessage('<span class="blinking-cursor"></span>', aiMessageId);

    const originalHistory = window.getRawChatHistory ? window.getRawChatHistory() : window.getChatHistory();
    const tempHistory = [...originalHistory];
    if (tempHistory.length > 0 && tempHistory[tempHistory.length - 1].role === 'user') {
        tempHistory[tempHistory.length - 1] = { role: 'user', content: finalMessageForAI };
    }
    window._pendingMessagesForAPI = tempHistory;
    
    try {
        await window.callGroqAPI(aiMessageId);
    } catch (err) {
        console.error("Send error:", err);
        const aiMsgElem = document.getElementById(aiMessageId);
        if (aiMsgElem) aiMsgElem.remove();
        window.setActionButtonMode('send');
        window.isGenerating = false;
        userInput.disabled = false;
        if (window.showToast) window.showToast(err.message || "Network error. Please try again.", "error");
    } finally {
        window.isSending = false;
        setTimeout(() => { window._pendingMessagesForAPI = null; }, 500);
    }
};


// New chat
window.createNewChat = async function() {
    if (window.isGenerating) window.stopGeneration();
    if (window.isSending) window.isSending = false;

    window._titleGeneratedForConv = null;

    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatHeader = document.getElementById('chat-header');
    const userInput = document.getElementById('user-input');

    if (chatMessages) chatMessages.innerHTML = '';
    if (welcomeScreen) welcomeScreen.classList.remove('hidden');
    if (chatMessages) chatMessages.classList.add('hidden');
    if (chatHeader) chatHeader.classList.add('hidden');
    if (userInput) {
        userInput.value = '';
        userInput.disabled = false;
        userInput.style.height = 'auto';
        userInput.focus();
    }

    window.clearChatHistory();
    window.currentConversationId = null;
    if (window.updateURL) window.updateURL(null);
    window.setActionButtonMode('send');
    window.isGenerating = false;
    window.currentAbortController = null;
    window.attachedFiles = [];
    window._pendingMessagesForAPI = null;
    
    updateFileChips();

    if (window.currentUser && window.loadUserConversations) {
        window.loadUserConversations(window.currentUser.uid);
    }
    if (window.showToast) window.showToast("New chat created.", "info", 2000);
    
    setTimeout(() => {
        if (typeof updateWelcomeMode === 'function') updateWelcomeMode();
    }, 50);
};

// Scroll detection
function initScrollDetection() {
    const chatMessages = document.getElementById('chat-messages');
    const backToBottomBtn = document.getElementById('back-to-bottom-btn');
    if (!chatMessages) return;

    function checkScrollPosition() {
        const { scrollTop, scrollHeight, clientHeight } = chatMessages;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        window.isUserScrolledUp = !isNearBottom;
        if (backToBottomBtn) {
            if (!isNearBottom && chatMessages.children.length > 0) {
                backToBottomBtn.classList.add('show');
            } else {
                backToBottomBtn.classList.remove('show');
            }
        }
        if (window.scrollTimeout) clearTimeout(window.scrollTimeout);
        window.scrollTimeout = setTimeout(() => { window.isUserScrolledUp = false; }, 2000);
    }

    chatMessages.addEventListener('scroll', checkScrollPosition);
    if (backToBottomBtn) {
        backToBottomBtn.addEventListener('click', () => {
            window.scrollToBottom();
            backToBottomBtn.classList.remove('show');
        });
    }
    checkScrollPosition();
}

// Welcome mode & disclaimer control (UPDATED with full username display & input bar upper)
function updateWelcomeMode() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const inputArea = document.querySelector('.input-area');
    const disclaimer = document.querySelector('.disclaimer');
    const inputContainer = document.querySelector('.input-container');
    const chatMessages = document.getElementById('chat-messages');
    
    const isWelcomeVisible = welcomeScreen && !welcomeScreen.classList.contains('hidden');
    
    if (isWelcomeVisible) {
        document.body.classList.add('welcome-mode');
        
        // ✅ Update username on welcome screen (full name)
        if (typeof window.updateWelcomeUsername === 'function') {
            window.updateWelcomeUsername();
        } else {
            // Fallback: set directly (full name)
            const usernameSpan = document.getElementById('welcome-username');
            if (usernameSpan) {
                const user = window.currentUser;
                if (user && user.displayName) {
                    usernameSpan.textContent = user.displayName;  // Full name
                    usernameSpan.style.color = 'var(--accent-cyan)';
                } else if (user && user.email) {
                    usernameSpan.textContent = user.email.split('@')[0];
                    usernameSpan.style.color = 'var(--accent-cyan)';
                } else {
                    usernameSpan.textContent = 'Guest';
                    usernameSpan.style.color = 'var(--text-muted)';
                }
            }
        }
        
        // ✅ INPUT BAR UPAR - bottom: 170px (as you requested)
        if (inputArea) {
            inputArea.style.position = 'absolute';
            inputArea.style.bottom = '150px';
            inputArea.style.top = 'auto';
        }
        
        // Input container ko adjust
        if (inputContainer) {
            inputContainer.style.marginTop = '-0.5rem';
        }
        
        // ✅ WELCOME CONTENT KO UPAR SHIFT KARO (to fix overlap)
        const welcomeContent = welcomeScreen.querySelector('.welcome-content');
        if (welcomeContent) {
            welcomeContent.style.marginTop = '-8rem';     // Welcome content upar jayega
            welcomeContent.style.marginBottom = '0.5rem';
        }
        
        if (disclaimer) disclaimer.classList.add('hidden');
        
        // Chat messages ko hidden rakhna
        if (chatMessages) chatMessages.classList.add('hidden');
        
    } else {
        document.body.classList.remove('welcome-mode');
        
        // Reset all styles
        if (inputArea) {
            inputArea.style.position = '';
            inputArea.style.bottom = '';
            inputArea.style.top = '';
        }
        
        if (inputContainer) {
            inputContainer.style.marginTop = '';
        }
        
        const welcomeContent = welcomeScreen?.querySelector('.welcome-content');
        if (welcomeContent) {
            welcomeContent.style.marginTop = '';
            welcomeContent.style.marginBottom = '';
        }
        
        if (disclaimer) disclaimer.classList.remove('hidden');
        
        if (chatMessages) chatMessages.classList.remove('hidden');
    }
}
function initWelcomeModeObserver() {
    updateWelcomeMode();
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        const observer = new MutationObserver(() => updateWelcomeMode());
        observer.observe(welcomeScreen, { attributes: true, attributeFilter: ['class'] });
    }
}

// ========== RAG STATS UI (kept for sidebar – but sidebar section will be removed from HTML) ==========
// These functions are kept for compatibility but won't be used after HTML change
async function updateIndexStatsUI() {
    const statsContainer = document.getElementById('stats-files-list');
    if (!statsContainer) return;
    if (!window.RAGEmbeddings) {
        statsContainer.innerHTML = '<div class="stats-empty">RAG not ready</div>';
        return;
    }
    try {
        const files = await window.RAGEmbeddings.getAllIndexedFiles();
        if (files.length === 0) {
            statsContainer.innerHTML = '<div class="stats-empty">No files indexed</div>';
        } else {
            let html = '';
            for (const file of files) {
                const shortName = file.path.split('/').pop();
                html += `
                    <div class="stats-file-item" data-filepath="${escapeHtml(file.path)}">
                        <span class="stats-file-name" title="${escapeHtml(file.path)}">📄 ${escapeHtml(shortName)}</span>
                        <span class="stats-file-chunks">${file.chunks} chunks</span>
                        <button class="delete-file-btn" data-filepath="${escapeHtml(file.path)}">🗑️</button>
                    </div>
                `;
            }
            statsContainer.innerHTML = html;
            document.querySelectorAll('.delete-file-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const filePath = btn.getAttribute('data-filepath');
                    if (filePath && confirm(`Delete "${filePath}" from index?`)) {
                        await window.RAGEmbeddings.deleteFileFromIndex(filePath);
                        updateIndexStatsUI();
                    }
                });
            });
        }
    } catch (err) {
        statsContainer.innerHTML = '<div class="stats-empty">Error loading stats</div>';
    }
}

async function handleClearIndex() {
    if (!window.RAGEmbeddings) return;
    const confirmed = window.Modal ? 
        await window.Modal.showConfirm("⚠️ Clear all indexed files?", "Clear Index") :
        confirm("⚠️ Clear all indexed files?");
    if (!confirmed) return;
    await window.RAGEmbeddings.clearIndex();
    if (window.showToast) window.showToast("Index cleared", "success");
    updateIndexStatsUI();
}

function initRAGStats() {
    if (window.RAGEmbeddings) {
        updateIndexStatsUI();
    } else {
        const checkInterval = setInterval(() => {
            if (window.RAGEmbeddings) {
                clearInterval(checkInterval);
                updateIndexStatsUI();
            }
        }, 500);
    }
}

// ========== ATTACH NAVBAR BUTTON EVENT ==========
document.addEventListener('DOMContentLoaded', () => {
    const indexBtn = document.getElementById('index-project-btn');
    if (indexBtn) {
        // Replace button to remove old listeners
        const newBtn = indexBtn.cloneNode(true);
        indexBtn.parentNode.replaceChild(newBtn, indexBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showRAGModal === 'function') {
                window.showRAGModal();
            } else {
                // Dynamically load the modal script
                const script = document.createElement('script');
                script.src = 'js/ui/rag-manager.js';
                script.onload = () => {
                    if (typeof window.showRAGModal === 'function') window.showRAGModal();
                    else if (window.showToast) window.showToast("RAG Manager failed to load", "error");
                };
                document.body.appendChild(script);
            }
        });
    }
});

// ========== INITIALIZATION ==========
let navbarInitialized = false;
async function loadModules() {
    const modalScript = document.createElement('script');
    modalScript.src = 'js/ui/modal.js';
    modalScript.onload = () => {
        const messageActionsScript = document.createElement('script');
        messageActionsScript.src = 'js/ui/message-actions.js';
        document.body.appendChild(messageActionsScript);
        const shareExportScript = document.createElement('script');
        shareExportScript.src = 'js/ui/chat-export.js';
        document.body.appendChild(shareExportScript);
        const navbarScript = document.createElement('script');
        navbarScript.src = 'js/ui/navbar.js';
        navbarScript.onload = () => {
            if (!navbarInitialized && window.initNavbar) {
                navbarInitialized = true;
                window.initNavbar();
                if (window.initNavbarScrollEffect) window.initNavbarScrollEffect();
            }
        };
        document.body.appendChild(navbarScript);
    };
    document.body.appendChild(modalScript);
    // Load preferences module
const prefsScript = document.createElement('script');
prefsScript.src = 'js/ui/preferences.js';
document.body.appendChild(prefsScript);
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollDetection();
    initModelSelector();
    initDragAndDrop();
    loadModules();
    initRAGStats();
    initWelcomeModeObserver();
    
    const clearIndexBtn = document.getElementById('clear-index-btn');
    if (clearIndexBtn) clearIndexBtn.addEventListener('click', handleClearIndex);
    
    // Sidebar collapse for index stats (if still present)
    const statsHeader = document.getElementById('stats-header');
    const statsWrapper = document.getElementById('stats-files-wrapper');
    const toggleIcon = document.getElementById('stats-toggle-icon');
    if (statsHeader && statsWrapper) {
        const isCollapsed = localStorage.getItem('indexStatsCollapsed') === 'true';
        if (isCollapsed) {
            statsWrapper.classList.add('collapsed');
            if (toggleIcon) toggleIcon.style.transform = 'rotate(-90deg)';
        }
        statsHeader.addEventListener('click', function(e) {
            if (e.target.closest('#clear-index-btn')) return;
            statsWrapper.classList.toggle('collapsed');
            if (toggleIcon) {
                if (statsWrapper.classList.contains('collapsed')) {
                    toggleIcon.style.transform = 'rotate(-90deg)';
                    localStorage.setItem('indexStatsCollapsed', 'true');
                } else {
                    toggleIcon.style.transform = 'rotate(0deg)';
                    localStorage.setItem('indexStatsCollapsed', 'false');
                }
            }
        });
    }
});

// Update welcome screen username (called from firebase.js)
window.updateWelcomeUsername = function() {
    const usernameSpan = document.getElementById('welcome-username');
    if (!usernameSpan) return;
    
    const user = window.currentUser;
    
    if (user && user.displayName) {
        let firstName = user.displayName.split(' ')[0];
        usernameSpan.textContent = firstName;
        usernameSpan.style.color = 'var(--accent-cyan)';
    } 
    else if (user && user.email) {
        let emailName = user.email.split('@')[0];
        usernameSpan.textContent = emailName;
        usernameSpan.style.color = 'var(--accent-cyan)';
    }
    else {
        usernameSpan.textContent = 'Guest';
        usernameSpan.style.color = 'var(--text-muted)';
    }
};

// Expose
window.updateIndexStatsUI = updateIndexStatsUI;
window.handleClearIndex = handleClearIndex;
window.updateWelcomeMode = updateWelcomeMode;