// js/utils/validation.js
// Client-side validation: internet status, input check, generation lock, file limits
// Does NOT modify existing files. Only reads globals and updates UI.

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const MAX_INPUT_LENGTH = 10000;
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_EXTENSIONS = /\.(txt|js|py|html|css|json|md|xml|sh|log|csv|yaml|yml|ini|conf|cfg|env|gitignore|dockerignore|editorconfig|prettierrc|eslintrc|babelrc|npmrc|lock)$/i;

    // ========== STATE ==========
    let isOnline = navigator.onLine;
    let isGenerating = false;
    let inputElement = null;
    let sendButton = null;
    let actionButtonMode = 'send'; // 'send' or 'stop'

    // ========== HELPER: UPDATE SEND BUTTON STATE ==========
    function updateSendButtonState() {
        if (!sendButton) return;

        const input = inputElement;
        if (!input) return;

        const rawText = input.value;
        const hasText = rawText && rawText.trim().length > 0;
        const hasFiles = window.attachedFiles && window.attachedFiles.length > 0;
        const canSend = hasText || hasFiles;

        // Disable conditions
        let disabled = false;
        let reason = '';

        if (!isOnline) {
            disabled = true;
            reason = '📡 No internet connection';
        } else if (isGenerating) {
            // Generating ke time send button hota hi nahi (stop mode), par safety
            disabled = true;
        } else if (!canSend) {
            disabled = true;
            reason = '✏️ Type a message or attach a file';
        }

        // Visual update
        if (disabled && actionButtonMode === 'send') {
            sendButton.disabled = true;
            sendButton.style.opacity = '0.5';
            sendButton.style.cursor = 'not-allowed';
            sendButton.title = reason || 'Cannot send';
        } else if (!disabled && actionButtonMode === 'send') {
            sendButton.disabled = false;
            sendButton.style.opacity = '';
            sendButton.style.cursor = '';
            sendButton.title = 'Send message';
        }
    }

    // ========== MONITOR INTERNET STATUS ==========
    function handleOnline() {
        isOnline = true;
        if (window.showToast) window.showToast('🌐 Back online!', 'success', 2000);
        updateSendButtonState();
    }

    function handleOffline() {
        isOnline = false;
        if (window.showToast) window.showToast('📡 You are offline. Check your connection.', 'error', 4000);
        updateSendButtonState();
    }

    // ========== MONITOR GENERATION STATE (watch window.isGenerating) ==========
    function checkGenerationState() {
        const newState = window.isGenerating === true;
        if (isGenerating !== newState) {
            isGenerating = newState;
            updateSendButtonState();
        }
        // Also track button mode (send/stop)
        const btn = document.getElementById('action-btn');
        if (btn) {
            const isStopMode = btn.classList.contains('stop-mode');
            actionButtonMode = isStopMode ? 'stop' : 'send';
            sendButton = btn;
        }
        requestAnimationFrame(checkGenerationState);
    }

    // ========== MONITOR INPUT CHANGES ==========
    function onInputChange() {
        const input = inputElement;
        if (!input) return;

        let value = input.value;
        // Trim to max length if exceeds
        if (value.length > MAX_INPUT_LENGTH) {
            input.value = value.slice(0, MAX_INPUT_LENGTH);
            if (window.showToast) {
                window.showToast(`⚠️ Message truncated to ${MAX_INPUT_LENGTH} characters.`, 'warning', 2000);
            }
        }

        updateSendButtonState();
    }

    // ========== MONITOR ATTACHED FILES ==========
    function watchAttachedFiles() {
        // Override window.attachFiles to add validation BEFORE adding
        const originalAttach = window.attachFiles;
        if (originalAttach && !originalAttach._patched) {
            window.attachFiles = async function(files) {
                if (!files || files.length === 0) return;

                // Check internet
                if (!isOnline) {
                    if (window.showToast) window.showToast('📡 Cannot attach files offline', 'error');
                    return;
                }

                // Check total count
                const currentCount = window.attachedFiles ? window.attachedFiles.length : 0;
                if (currentCount + files.length > MAX_FILES) {
                    if (window.showToast) window.showToast(`⚠️ You can attach up to ${MAX_FILES} files at a time.`, 'error');
                    return;
                }

                // Filter valid files (size, type)
                const validFiles = [];
                const errors = [];
                for (const file of files) {
                    if (file.size > MAX_FILE_SIZE) {
                        errors.push(`"${file.name}" exceeds 2MB limit.`);
                        continue;
                    }
                    if (!ALLOWED_EXTENSIONS.test(file.name) && 
                        !['text/', 'application/json', 'application/xml'].some(t => file.type.startsWith(t))) {
                        errors.push(`"${file.name}" is not a supported text file.`);
                        continue;
                    }
                    validFiles.push(file);
                }

                if (errors.length) {
                    if (window.showToast) window.showToast(errors.join(' '), 'error', 4000);
                }

                if (validFiles.length === 0) return;

                // Call original with valid files only
                await originalAttach.call(this, validFiles);
                updateSendButtonState();
            };
            window.attachFiles._patched = true;
        }

        // Also watch array changes (simple polling for safety)
        setInterval(() => {
            updateSendButtonState();
        }, 500);
    }

    // ========== WRAP HANDLE SEND TO ADD INTERNET CHECK ==========
    function wrapHandleSend() {
        const originalSend = window.handleSend;
        if (!originalSend || originalSend._wrapped) return;

        window.handleSend = async function() {
            // Internet check
            if (!isOnline) {
                if (window.showToast) window.showToast('📡 No internet connection. Please check your network.', 'error', 3000);
                return;
            }

            // Already generating?
            if (window.isGenerating) {
                if (window.showToast) window.showToast('Please wait, AI is still generating...', 'info');
                return;
            }

            // Empty check (input + files)
            const input = document.getElementById('user-input');
            const hasText = input && input.value.trim().length > 0;
            const hasFiles = window.attachedFiles && window.attachedFiles.length > 0;
            if (!hasText && !hasFiles) {
                if (window.showToast) window.showToast('Type a message or attach a file.', 'info');
                return;
            }

            // Call original
            await originalSend.call(this);
        };
        window.handleSend._wrapped = true;
    }

    // ========== INITIALIZE ==========
    function init() {
        inputElement = document.getElementById('user-input');
        sendButton = document.getElementById('action-btn');

        if (!inputElement || !sendButton) {
            // Retry after a short delay (DOM might not be ready)
            setTimeout(init, 100);
            return;
        }

        // Internet events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Input events
        inputElement.addEventListener('input', onInputChange);
        inputElement.addEventListener('keyup', onInputChange); // for paste etc.

        // Start generation state watcher
        requestAnimationFrame(checkGenerationState);

        // Patch attachFiles and handleSend
        watchAttachedFiles();
        wrapHandleSend();

        // Initial state
        updateSendButtonState();

        // Also observe model changes? Not needed for validation.

        console.log('✅ Validation module active');
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();