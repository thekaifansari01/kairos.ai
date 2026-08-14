// js/modules/core/main.js

window.isGenerating = false;
window.currentAbortController = null;

// ==================== HASH ROUTING ====================
function updateURL(conversationId) {
    if (!conversationId) {
        window.history.pushState({}, '', window.location.pathname);
        // Clear hash completely
        if (window.location.hash) window.location.hash = '';
        return;
    }
    window.location.hash = `#/chat/${conversationId}`;
}

function getConversationIdFromURL() {
    const hash = window.location.hash;
    const match = hash.match(/^#\/chat\/([a-zA-Z0-9_-]+)$/);
    return match ? match[1] : null;
}

// ==================== BUTTON MODES ====================
window.setActionButtonMode = function(mode) {
    const btn = document.getElementById('action-btn');
    if (!btn) return;
    
    if (mode === 'send') {
        btn.className = 'action-btn send-mode';
        btn.title = 'Send message';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
        </svg>`;
        btn.onclick = () => { if (window.handleSend) window.handleSend(); };
    } else if (mode === 'stop') {
        btn.className = 'action-btn stop-mode';
        btn.title = 'Stop generation';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"></rect>
        </svg>`;
        btn.onclick = () => window.stopGeneration();
    }
};

window.stopGeneration = function() {
    if (window.currentAbortController) {
        window.currentAbortController.abort();
        window.currentAbortController = null;
    }
    window.isGenerating = false;
    window.setActionButtonMode('send');
    
    const userInput = document.getElementById('user-input');
    if (userInput) userInput.disabled = false;
    
    const lastAiMsg = document.querySelector('.message.ai:last-child .msg-content div');
    if (lastAiMsg && lastAiMsg.innerHTML.includes('blinking-cursor')) {
        let html = lastAiMsg.innerHTML;
        html = html.replace('<span class="blinking-cursor"></span>', '');
        if (!html.trim()) html = '*[Generation stopped]*';
        else html += '\n\n*[Generation stopped]*';
        lastAiMsg.innerHTML = html;
    }
};

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                if (window.showToast) window.showToast("🔍 Search chats...", "info", 1000);
            }
        }
        // Ctrl/Cmd + N: new chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (window.createNewChat) window.createNewChat();
        }
        // Ctrl/Cmd + Shift + D: delete current chat
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            if (window.currentConversationId && window.deleteConversation) {
                window.deleteConversation(window.currentConversationId);
            } else if (window.showToast) {
                window.showToast("No active chat to delete.", "info");
            }
        }
        // Escape: clear search input and trigger filter
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('search-input');
            if (searchInput && document.activeElement === searchInput) {
                e.preventDefault();
                searchInput.value = '';
                const clearBtn = document.getElementById('clear-search');
                if (clearBtn) clearBtn.classList.add('hidden');
                // ✅ FIX: Safe call to filter function
                if (typeof window.applyFilterAndRender === 'function') {
                    window.applyFilterAndRender('');
                } else if (typeof window.filterChatHistory === 'function') {
                    window.filterChatHistory('');
                } else {
                    // Fallback: trigger input event on search input
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    });
}

// Corrected sidebar toggle — preserves custom SVGs
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggleBtn) return;

    const closeIcon = document.getElementById('close-sidebar-icon');
    const openIcon = document.getElementById('open-sidebar-icon');
    if (!closeIcon || !openIcon) return;

    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        closeIcon.style.display = 'none';
        openIcon.style.display = 'inline-block';
    } else {
        closeIcon.style.display = 'inline-block';
        openIcon.style.display = 'none';
    }

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const collapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', collapsed);

        if (collapsed) {
            closeIcon.style.display = 'none';
            openIcon.style.display = 'inline-block';
        } else {
            closeIcon.style.display = 'inline-block';
            openIcon.style.display = 'none';
        }
    });
}

function updateToggleIcon(btn, isCollapsed) {
    if (isCollapsed) {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
        </svg>`;
        btn.title = "Expand sidebar";
    } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>`;
        btn.title = "Collapse sidebar";
    }
}

// ==================== INIT UI ====================
let uiInitialized = false;
function initUI() {
    if (uiInitialized) return;
    uiInitialized = true;
    
    const userInput = document.getElementById('user-input');
    initSidebarToggle();
    
    if (!userInput) return;
    
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!window.isGenerating && window.handleSend) {
                window.handleSend();
            }
        }
    });
    
    window.setActionButtonMode('send');
}

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

    if (typeof updateFileChips === 'function') updateFileChips();

    if (window.currentUser && window.loadUserConversations) {
        window.loadUserConversations(window.currentUser.uid);
    }
    if (window.showToast) window.showToast("New chat created.", "info", 2000);
    
    // ✅ ADD THIS LINE
    setTimeout(() => {
        if (typeof updateWelcomeMode === 'function') updateWelcomeMode();
    }, 50);
};

// ==================== ROUTING ON PAGE LOAD & HASH CHANGE ====================
function handleRoute() {
    const convId = getConversationIdFromURL();
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatMessages = document.getElementById('chat-messages');
    const chatHeader = document.getElementById('chat-header');
    
    if (convId && window.selectConversation && typeof window.selectConversation === 'function') {
        if (window.currentConversationId !== convId) {
            window.selectConversation(convId);
        }
        // Ensure welcome screen hidden and messages visible
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (chatMessages) chatMessages.classList.remove('hidden');
        if (chatHeader) chatHeader.classList.remove('hidden');
    } else {
        // No hash or invalid, show welcome screen
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (chatMessages) chatMessages.classList.add('hidden');
        if (chatHeader) chatHeader.classList.add('hidden');
        // Clear current conversation ID
        window.currentConversationId = null;
    }
}

// Export functions to global
window.updateURL = updateURL;
window.getConversationIdFromURL = getConversationIdFromURL;
window.handleRoute = handleRoute; // Expose for manual calls

// ==================== START EVERYTHING ====================
function bootstrap() {
    initUI();
    initKeyboardShortcuts();
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}