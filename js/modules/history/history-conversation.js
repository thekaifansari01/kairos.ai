// js/modules/history/history-conversation.js
// Conversation loading, saving, renaming, etc.

import { db } from '../auth/firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { 
    allConversations, 
    loadUserConversations, 
    createEmptyConversation, 
    saveConversationMessages, 
    updateConversationMessages
} from './history-firestore.js';

import { 
    escapeHtml, 
    cleanUserMessageForDisplay, 
    recreateFilePreviewFromMessage, 
    highlightActiveHistoryItem 
} from './history-helpers.js';

// Local loading flag (not imported)
let isLoadingConversation = false;

export async function selectConversation(conversationId) {
    if (!conversationId) return;
    if (isLoadingConversation) return;
    if (window.isGenerating && window.stopGeneration) window.stopGeneration();

    if (!db) {
        if (window.showToast) window.showToast("Firestore not ready. Please refresh.", "error");
        return;
    }

    isLoadingConversation = true;
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (chatMessages) {
        chatMessages.classList.remove('hidden');
        chatMessages.innerHTML = '<div class="loading-message">Loading conversation...</div>';
    }

    try {
        const convRef = doc(db, "conversations", conversationId);
        const convSnap = await getDoc(convRef);
        if (!convSnap.exists()) {
            chatMessages.innerHTML = '<div class="error-message">Conversation not found.</div>';
            if (window.showToast) window.showToast("Conversation not found.", "error");
            return;
        }
        const convData = convSnap.data();
        const messages = convData.messages || [];
        const isPublic = convData.isPublic || false;

        if (!isPublic && window.currentUser?.uid !== convData.userId) {
            chatMessages.innerHTML = '<div class="error-message">🔒 This conversation is private.</div>';
            return;
        }

        chatMessages.innerHTML = '';
        window.clearChatHistory();

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            window.addMessageToHistory(msg.role, msg.content);
            if (msg.role === 'user') {
                const cleanText = cleanUserMessageForDisplay(msg.content);
                const filePreviewDiv = recreateFilePreviewFromMessage(msg.content);
                if (filePreviewDiv) {
                    chatMessages.appendChild(filePreviewDiv);
                }
                window.appendUserMessage(cleanText, false);
            } else if (msg.role === 'assistant') {
                const assistantContent = msg.content && msg.content.trim() ? msg.content : "(Empty response)";
                try {
                    const formattedHtml = await window.formatAIResponse(assistantContent, false);
                    const displayHtml = formattedHtml && formattedHtml.trim() ? formattedHtml : `<pre style="white-space: pre-wrap;">${escapeHtml(assistantContent)}</pre>`;
                    window.appendAIMessage(displayHtml, null, false);
                } catch (err) {
                    console.error("Format error for assistant message:", err);
                    const plainHtml = `<pre style="white-space: pre-wrap; font-family: monospace;">${escapeHtml(assistantContent)}</pre>`;
                    window.appendAIMessage(plainHtml, null, false);
                }
            }
        }

        // Inside selectConversation, after setting window.currentConversationId and before setTimeout scroll
        setTimeout(() => {
            if (typeof updateWelcomeMode === 'function') updateWelcomeMode();
        }, 50);

        window.currentConversationId = conversationId;
        highlightActiveHistoryItem(conversationId);
        if (window.updateURL) window.updateURL(conversationId);
        
        const chatTitleElement = document.getElementById('chat-title');
        if (chatTitleElement) {
            chatTitleElement.textContent = convData.title || 'New Chat';
        }
        
        setTimeout(() => window.scrollToBottom(), 100);
        
    } catch (error) {
        console.error("Error loading conversation:", error);
        if (chatMessages) {
            chatMessages.innerHTML = `<div class="error-message">Failed to load conversation: ${error.message}</div>`;
        }
        if (window.showToast) window.showToast("Failed to load conversation.", "error");
    } finally {
        isLoadingConversation = false;
    }
}

export async function saveCurrentSession() {
    const user = window.currentUser;
    if (!user) {
        console.warn("No user logged in, session not saved.");
        return false;
    }
    if (!db) {
        console.warn("Firestore not ready, session not saved.");
        if (window.showToast) window.showToast("Cannot save: Firestore not ready", "error");
        return false;
    }

    const currentId = window.currentConversationId;
    const allMessages = window.getRawChatHistory();  
    const userMessages = allMessages.filter(m => m.role !== 'system');
    
    if (userMessages.length === 0) return false;

    try {
        if (!currentId) {
            const newId = await createEmptyConversation(user.uid, "New Chat");
            if (newId) {
                window.currentConversationId = newId;
                await saveConversationMessages(newId, userMessages);
                await loadUserConversations(user.uid);
                if (window.updateURL) window.updateURL(newId);
                if (window.showToast) window.showToast("Chat saved to cloud.", "success", 1500);
                return true;
            } else {
                throw new Error("Failed to create conversation");
            }
        } else {
            await saveConversationMessages(currentId, userMessages);
            if (window.showToast) window.showToast("Chat saved.", "success", 1000);
            return true;
        }
    } catch (error) {
        console.error("Error saving session:", error);
        if (window.showToast) window.showToast("Failed to save chat. Check your connection.", "error");
        return false;
    }
}

export async function makeConversationPublic(conversationId, isPublic) {
    if (!conversationId || !window.currentUser) {
        if (window.showToast) window.showToast("You must be logged in to change privacy.", "error");
        return false;
    }
    if (!db) return false;
    try {
        const convRef = doc(db, "conversations", conversationId);
        await updateDoc(convRef, { isPublic: isPublic });
        if (window.showToast) window.showToast(isPublic ? "Chat is now public!" : "Chat is now private.", "success");
        return true;
    } catch (error) {
        console.error("Error updating public status:", error);
        if (window.showToast) window.showToast("Failed to update privacy setting.", "error");
        return false;
    }
}

export async function renameConversation(conversationId) {
    const conv = allConversations.find(c => c.id === conversationId);
    const currentTitle = conv?.title || 'Untitled Chat';
    const newTitle = await window.Modal.showRenameModal(currentTitle);
    if (!newTitle || newTitle.trim() === '') return;
    
    if (!db) return;
    try {
        const convRef = doc(db, "conversations", conversationId);
        await updateDoc(convRef, { title: newTitle.trim() });
        if (window.showToast) window.showToast(`Chat renamed to "${newTitle.trim()}"`, "success");
        if (window.currentUser) {
            await loadUserConversations(window.currentUser.uid);
        }
    } catch (error) {
        console.error("Error renaming conversation:", error);
        if (window.showToast) window.showToast("Failed to rename conversation.", "error");
    }
}