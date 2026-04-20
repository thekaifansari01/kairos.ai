// js/modules/history/history-index.js
// Entry point - imports all modules and exports to window

import { db } from '../auth/firebase.js';
import { 
    allConversations, 
    loadUserConversations, 
    togglePinConversation, 
    clearAllChats, 
    deleteConversation, 
    updateConversationMessages,
    applyFilterAndRender
} from './history-firestore.js';

import { 
    selectConversation, 
    saveCurrentSession, 
    makeConversationPublic, 
    renameConversation 
} from './history-conversation.js';

import { generateChatTitle } from './history-title.js';

// Re-export functions to window
window.loadUserConversations = loadUserConversations;
window.selectConversation = selectConversation;
window.renameConversation = renameConversation;
window.deleteConversation = deleteConversation;
window.saveCurrentSession = saveCurrentSession;
window.makeConversationPublic = makeConversationPublic;
window.togglePinConversation = togglePinConversation;
window.clearAllChats = clearAllChats;
window.applyFilterAndRender = applyFilterAndRender;
window.updateConversationMessages = updateConversationMessages;
window.generateChatTitle = generateChatTitle;

// Initialize search and event listeners
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value;
        if (clearBtn) clearBtn.classList.toggle('hidden', !term);
        applyFilterAndRender(term);
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.classList.add('hidden');
            applyFilterAndRender('');
            searchInput.focus();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    const clearBtn = document.getElementById('clear-all-chats');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => clearAllChats());
    }
});

// Export db for any external use if needed
export { db };