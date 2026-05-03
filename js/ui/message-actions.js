// js/ui/message-actions.js — Final: Inline edit with theme-matched buttons

// ========== HELPER FUNCTIONS ==========
function findPreviousUserMessage(aiMessageDiv) {
    let prev = aiMessageDiv.previousElementSibling;
    while (prev) {
        if (prev.classList && prev.classList.contains('message') && prev.classList.contains('user')) {
            return prev;
        }
        prev = prev.previousElementSibling;
    }
    return null;
}

function findNextAIMessage(userMessageDiv) {
    let next = userMessageDiv.nextElementSibling;
    while (next) {
        if (next.classList && next.classList.contains('message') && next.classList.contains('ai')) {
            return next;
        }
        next = next.nextElementSibling;
    }
    return null;
}

function deleteMessagesAfter(element) {
    let current = element.nextElementSibling;
    while (current) {
        const toRemove = current;
        current = current.nextElementSibling;
        toRemove.remove();
    }
}

// ========== GLOBAL SPEECH STATE ==========
window.currentSpeech = {
    utterance: null,
    messageDiv: null,
    isPaused: false
};

window.stopSpeaking = function() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (window.currentSpeech.messageDiv) {
        updateSpeakButtonIcon(window.currentSpeech.messageDiv, 'speak');
    }
    window.currentSpeech.utterance = null;
    window.currentSpeech.messageDiv = null;
    window.currentSpeech.isPaused = false;
};

function updateSpeakButtonIcon(messageDiv, state) {
    if (!messageDiv) return;
    const actionsDiv = messageDiv.querySelector('.message-actions');
    if (!actionsDiv) return;
    const speakBtn = actionsDiv.querySelector('.speak-ai-btn');
    if (!speakBtn) return;
    if (state === 'speak') {
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span>Speak</span>';
        speakBtn.title = "Read aloud";
    } else if (state === 'pause') {
        speakBtn.innerHTML = '<i class="fas fa-pause"></i> <span>Pause</span>';
        speakBtn.title = "Pause";
    } else if (state === 'resume') {
        speakBtn.innerHTML = '<i class="fas fa-play"></i> <span>Resume</span>';
        speakBtn.title = "Resume";
    }
}

window.toggleSpeak = async function(messageDiv) {
    const text = window.getMessageText(messageDiv);
    if (!text || text.trim() === '') {
        if (window.showToast) window.showToast("Nothing to speak", "info");
        return;
    }
    if (window.currentSpeech.messageDiv === messageDiv && window.currentSpeech.utterance) {
        if (window.speechSynthesis.paused || window.currentSpeech.isPaused) {
            window.speechSynthesis.resume();
            window.currentSpeech.isPaused = false;
            updateSpeakButtonIcon(messageDiv, 'pause');
            if (window.showToast) window.showToast("▶️ Resumed", "info", 800);
        } else {
            window.speechSynthesis.pause();
            window.currentSpeech.isPaused = true;
            updateSpeakButtonIcon(messageDiv, 'resume');
            if (window.showToast) window.showToast("⏸️ Paused", "info", 800);
        }
        return;
    }
    window.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    window.currentSpeech.utterance = utterance;
    window.currentSpeech.messageDiv = messageDiv;
    window.currentSpeech.isPaused = false;
    updateSpeakButtonIcon(messageDiv, 'pause');
    utterance.onstart = () => console.log('[Speak] started');
    utterance.onend = () => {
        if (window.currentSpeech.utterance === utterance) {
            window.stopSpeaking();
            updateSpeakButtonIcon(messageDiv, 'speak');
        }
    };
    utterance.onerror = (event) => {
        console.error('[Speak] error:', event.error);
        if (window.currentSpeech.utterance === utterance) {
            window.stopSpeaking();
            updateSpeakButtonIcon(messageDiv, 'speak');
            if (window.showToast) window.showToast("Speech error: " + event.error, "error");
        }
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    if (window.showToast) window.showToast("🔊 Speaking...", "info", 1000);
};

window.sendUserMessageForResponse = async function(text) {
    if (window.isGenerating) {
        if (window.showToast) window.showToast('Please wait, AI is still generating...', 'info');
        return;
    }
    window.isGenerating = true;
    const userInput = document.getElementById('user-input');
    if (userInput) userInput.disabled = true;
    window.setActionButtonMode('stop');
    const aiMessageId = 'ai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    window.appendAIMessage('<span class="blinking-cursor"></span>', aiMessageId);
    try {
        await window.callGroqAPI(aiMessageId);
    } catch (err) {
        console.error("Send error:", err);
        const aiMsgElem = document.getElementById(aiMessageId);
        if (aiMsgElem) aiMsgElem.remove();
        window.setActionButtonMode('send');
        window.isGenerating = false;
        if (userInput) userInput.disabled = false;
        if (window.showToast) window.showToast(err.message || "Failed to send message", "error");
    }
};

window.copyMessage = async function(button) {
    const messageDiv = button.closest('.message');
    if (!messageDiv) return;
    const text = window.getMessageText(messageDiv);
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> <span>Copied!</span>';
        setTimeout(() => { button.innerHTML = originalHTML; }, 1500);
    } catch (err) {
        console.error('Copy failed:', err);
        if (window.showToast) window.showToast('Could not copy to clipboard', 'error');
    }
};

window.editUserMessage = async function(button) {
    if (window.isGenerating) {
        if (window.showToast) window.showToast('Please wait for current response to finish.', 'info');
        return;
    }
    const messageDiv = button.closest('.message.user');
    if (!messageDiv) return;
    if (messageDiv.classList.contains('editing')) return;
    
    const contentDiv = messageDiv.querySelector('.msg-content div');
    const originalText = contentDiv.innerText.trim();
    const originalHTML = contentDiv.innerHTML;
    const actionsDiv = messageDiv.querySelector('.message-actions');
    const originalActionsHTML = actionsDiv.innerHTML;
    
    // Create textarea (DeepSeek style – no extra styling, inherits from .inline-edit-textarea)
    const textarea = document.createElement('textarea');
    textarea.value = originalText;
    textarea.className = 'inline-edit-textarea';
    textarea.style.fontSize = '0.95rem';
    textarea.style.lineHeight = '1.5';
    
    // Replace content with textarea
    contentDiv.innerHTML = '';
    contentDiv.appendChild(textarea);
    messageDiv.classList.add('editing');
    
    // Change actions to Cancel / Save (same classes as original action buttons)
    actionsDiv.innerHTML = `
        <button class="message-action-btn cancel-edit-btn" title="Cancel">
            <i class="fas fa-times"></i> <span>Cancel</span>
        </button>
        <button class="message-action-btn save-edit-btn" title="Save & Send">
            <i class="fas fa-paper-plane"></i> <span>Save</span>
        </button>
    `;
    
    // Focus and place cursor at end
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    // Auto-resize based on content
    function autoResize() {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    textarea.addEventListener('input', autoResize);
    autoResize();
    
    // Helper to exit edit mode
    const exitEditMode = (save = false) => {
        if (!messageDiv.classList.contains('editing')) return;
        messageDiv.classList.remove('editing');
        if (save) {
            const newText = textarea.value.trim();
            if (newText && newText !== originalText) {
                // Update displayed text
                contentDiv.innerHTML = window.escapeHtml(newText);
                // Delete all messages after this user message
                deleteMessagesAfter(messageDiv);
                // Update history and regenerate
                window.replaceUserMessageAndTruncate(originalText, newText);
                if (window.currentConversationId && window.currentUser) {
                    const allMessages = window.getRawChatHistory();
                    const userMessages = allMessages.filter(m => m.role !== 'system');
                    window.updateConversationMessages(window.currentConversationId, userMessages);
                }
                // Send new message to AI
                window.sendUserMessageForResponse(newText);
            } else {
                // No change, just restore original
                contentDiv.innerHTML = originalHTML;
            }
        } else {
            // Cancel: restore original content
            contentDiv.innerHTML = originalHTML;
        }
        // Restore original action buttons
        actionsDiv.innerHTML = originalActionsHTML;
        // Re-attach event listeners to the new buttons
        const newCopyBtn = actionsDiv.querySelector('.copy-user-btn');
        const newEditBtn = actionsDiv.querySelector('.edit-user-btn');
        if (newCopyBtn) newCopyBtn.addEventListener('click', (e) => { e.stopPropagation(); window.copyMessage(newCopyBtn); });
        if (newEditBtn) newEditBtn.addEventListener('click', (e) => { e.stopPropagation(); window.editUserMessage(newEditBtn); });
    };
    
    const cancelBtn = actionsDiv.querySelector('.cancel-edit-btn');
    const saveBtn = actionsDiv.querySelector('.save-edit-btn');
    cancelBtn.onclick = (e) => { e.stopPropagation(); exitEditMode(false); };
    saveBtn.onclick = (e) => { e.stopPropagation(); exitEditMode(true); };
    
    // Keyboard: Enter = Save, Escape = Cancel
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            exitEditMode(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            exitEditMode(false);
        }
    });
    
    // Prevent accidental outside clicks from cancelling (optional – explicit buttons only)
};

// ========== REGENERATE AI MESSAGE ==========
window.regenerateAIMessage = async function(button) {
    if (window.isGenerating) {
        if (window.showToast) window.showToast('Already generating a response. Please wait.', 'info');
        return;
    }
    const aiMessageDiv = button.closest('.message.ai');
    if (!aiMessageDiv) return;
    
    const prevUserMessage = findPreviousUserMessage(aiMessageDiv);
    if (!prevUserMessage) {
        if (window.showToast) window.showToast('Could not find the user message to regenerate.', 'error');
        return;
    }
    
    const userText = window.getMessageText(prevUserMessage);
    if (!userText) return;
    
    aiMessageDiv.remove();
    let next = aiMessageDiv.nextElementSibling;
    while (next) {
        const toRemove = next;
        next = next.nextElementSibling;
        if (toRemove.classList && toRemove.classList.contains('message')) toRemove.remove();
    }
    
    const truncated = window.truncateHistoryUpToUserMessage(userText);
    if (!truncated) {
        window.replaceUserMessageAndTruncate(userText, userText);
    }
    if (window.saveCurrentSession) await window.saveCurrentSession();
    await window.sendUserMessageForResponse(userText);
};

// ========== PATCH APPEND FUNCTIONS ==========
const originalAppendUser = window.appendUserMessage;
if (originalAppendUser && !window._userMessagePatched) {
    window.appendUserMessage = function(text, shouldScroll = true) {
        const messageDiv = originalAppendUser(text, shouldScroll);
        if (!messageDiv) return messageDiv;
        setTimeout(() => {
            const actionsDiv = messageDiv.querySelector('.message-actions');
            if (actionsDiv && actionsDiv.children.length === 0) {
                actionsDiv.innerHTML = `
                    <button class="message-action-btn copy-user-btn" title="Copy message">
                        <i class="fas fa-copy"></i> <span>Copy</span>
                    </button>
                    <button class="message-action-btn edit-user-btn" title="Edit message">
                        <i class="fas fa-edit"></i> <span>Edit</span>
                    </button>
                `;
                const copyBtn = actionsDiv.querySelector('.copy-user-btn');
                const editBtn = actionsDiv.querySelector('.edit-user-btn');
                copyBtn.addEventListener('click', (e) => { e.stopPropagation(); window.copyMessage(copyBtn); });
                editBtn.addEventListener('click', (e) => { e.stopPropagation(); window.editUserMessage(editBtn); });
            }
        }, 0);
        return messageDiv;
    };
    window._userMessagePatched = true;
}

const originalAppendAI = window.appendAIMessage;
if (originalAppendAI && !window._aiMessagePatched) {
    window.appendAIMessage = function(html, id = null, shouldScroll = true) {
        const messageDiv = originalAppendAI(html, id, shouldScroll);
        if (!messageDiv) return messageDiv;
        setTimeout(() => {
            const actionsDiv = messageDiv.querySelector('.message-actions');
            if (actionsDiv && actionsDiv.children.length === 0) {
                actionsDiv.innerHTML = `
                    <button class="message-action-btn copy-ai-btn" title="Copy response">
                        <i class="fas fa-copy"></i> <span>Copy</span>
                    </button>
                    <button class="message-action-btn regenerate-ai-btn" title="Regenerate response">
                        <i class="fas fa-sync-alt"></i> <span>Regenerate</span>
                    </button>
                    <button class="message-action-btn speak-ai-btn" title="Read aloud">
                        <i class="fas fa-volume-up"></i> <span>Speak</span>
                    </button>
                `;
                const copyBtn = actionsDiv.querySelector('.copy-ai-btn');
                const regenBtn = actionsDiv.querySelector('.regenerate-ai-btn');
                const speakBtn = actionsDiv.querySelector('.speak-ai-btn');
                copyBtn.addEventListener('click', (e) => { e.stopPropagation(); window.copyMessage(copyBtn); });
                regenBtn.addEventListener('click', (e) => { e.stopPropagation(); window.regenerateAIMessage(regenBtn); });
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.toggleSpeak(messageDiv);
                });
            }
        }, 0);
        return messageDiv;
    };
    window._aiMessagePatched = true;
}