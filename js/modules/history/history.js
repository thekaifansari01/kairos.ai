// js/modules/history/history.js — Using custom modal, fixed clear/delete with debug logs
// ADDED: Auto-title generation with Groq Qwen 32B

import { db } from '../auth/firebase.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

if (!db) {
    console.error("Firestore db not initialized.");
}

window.currentConversationId = null;
let isLoadingConversation = false;
let allConversations = [];

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function cleanUserMessageForDisplay(content) {
    if (!content) return '';
    if (content.startsWith('📎')) {
        const parts = content.split('\n\n');
        if (parts.length > 1) {
            return parts.slice(1).join('\n\n').trim() || '(Sent files)';
        }
        return '(Sent files)';
    }
    if (content.includes('[Attached file:')) {
        const parts = content.split('---');
        let lastPart = parts[parts.length - 1].trim();
        return lastPart || '(Attached files)';
    }
    return content;
}

function recreateFilePreviewFromMessage(storedMessage) {
    if (!storedMessage) return null;
    const fileMatch = storedMessage.match(/^📎\s*(\d+)\s*file[s]?:\s*(.+?)(?:\n\n|$)/i);
    if (!fileMatch) return null;
    
    const fileNames = fileMatch[2].split(',').map(s => s.trim());
    if (fileNames.length === 0) return null;
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'message-files';
    
    let html = `<div class="files-preview-header">📎 Attached files</div><div class="files-preview-list">`;
    fileNames.forEach(name => {
        const ext = name.split('.').pop().toLowerCase();
        let icon = '📄';
        if (ext === 'js') icon = '📜';
        else if (ext === 'py') icon = '🐍';
        else if (ext === 'html') icon = '🌐';
        else if (ext === 'css') icon = '🎨';
        else if (ext === 'json') icon = '🔧';
        else if (ext === 'md') icon = '📝';
        else if (ext === 'txt') icon = '📃';
        
        html += `
            <div class="file-preview-item" title="${escapeHtml(name)}">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${escapeHtml(name)}</span>
                <span class="file-size">(file)</span>
            </div>
        `;
    });
    html += `</div>`;
    previewDiv.innerHTML = html;
    return previewDiv;
}

function groupChatsByDate(chats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const groups = {
        pinned: [],
        today: [],
        yesterday: [],
        last7: [],
        last30: [],
        older: []
    };
    
    chats.forEach(chat => {
        const date = chat.updatedAt?.toDate?.() || new Date(chat.updatedAt) || new Date();
        if (chat.isPinned) {
            groups.pinned.push(chat);
        } else if (date >= today) {
            groups.today.push(chat);
        } else if (date >= yesterday) {
            groups.yesterday.push(chat);
        } else if (date >= weekAgo) {
            groups.last7.push(chat);
        } else if (date >= monthAgo) {
            groups.last30.push(chat);
        } else {
            groups.older.push(chat);
        }
    });
    
    for (let key in groups) {
        groups[key].sort((a, b) => {
            const aDate = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
            const bDate = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
            return bDate - aDate;
        });
    }
    
    return groups;
}

function showSkeleton() {
    const historyList = document.getElementById('chat-history-list');
    if (!historyList) return;
    historyList.innerHTML = `
        <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
        <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
        <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
    `;
}

function renderHistoryItem(chat) {
    const convId = chat.id;
    const title = chat.title || 'Untitled Chat';
    const activeClass = (window.currentConversationId === convId) ? 'active' : '';
    const pinnedClass = chat.isPinned ? 'pinned' : '';
    
    return `
        <div class="history-item ${activeClass}" data-id="${convId}" data-title="${escapeHtml(title)}">
            <div class="history-item-content" onclick="window.selectConversation('${convId}')">
                <span class="history-icon"><i class="fas fa-comment"></i></span>
                <span class="history-title">${escapeHtml(title)}</span>
            </div>
            <div class="pin-icon ${pinnedClass}" onclick="event.stopPropagation(); window.togglePinConversation('${convId}')">
                <i class="fas fa-thumbtack"></i>
            </div>
            <div class="history-actions">
                <button class="history-rename" onclick="event.stopPropagation(); window.renameConversation('${convId}')" title="Rename">✏️</button>
                <button class="history-delete" onclick="event.stopPropagation(); window.deleteConversation('${convId}')" title="Delete">🗑️</button>
            </div>
        </div>
    `;
}

function renderGroupedChats(groups, searchTerm = '') {
    const historyList = document.getElementById('chat-history-list');
    if (!historyList) return;
    
    const filterChat = (chat) => {
        if (!searchTerm) return true;
        return chat.title.toLowerCase().includes(searchTerm.toLowerCase());
    };
    
    let html = '';
    
    if (groups.pinned.length > 0) {
        html += `<div class="group-header pinned-header" data-group="pinned">
                    <span>📌 Pinned <span class="group-count">(${groups.pinned.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="pinned">`;
        groups.pinned.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat);
        });
        html += `</div>`;
    }
    
    if (groups.today.length > 0) {
        html += `<div class="group-header" data-group="today">
                    <span>Today <span class="group-count">(${groups.today.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="today">`;
        groups.today.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat);
        });
        html += `</div>`;
    }
    
    if (groups.yesterday.length > 0) {
        html += `<div class="group-header" data-group="yesterday">
                    <span>Yesterday <span class="group-count">(${groups.yesterday.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="yesterday">`;
        groups.yesterday.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat);
        });
        html += `</div>`;
    }
    
    if (groups.last7.length > 0) {
        html += `<div class="group-header" data-group="last7">
                    <span>Last 7 days <span class="group-count">(${groups.last7.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="last7">`;
        groups.last7.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat);
        });
        html += `</div>`;
    }
    
    if (groups.last30.length > 0) {
        html += `<div class="group-header" data-group="last30">
                    <span>Last 30 days <span class="group-count">(${groups.last30.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="last30">`;
        groups.last30.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat);
        });
        html += `</div>`;
    }
    
    if (groups.older.length > 0) {
        html += `<div class="group-header" data-group="older">
                    <span>Older <span class="group-count">(${groups.older.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="older">`;
        groups.older.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat);
        });
        html += `</div>`;
    }
    
    if (html === '') {
        html = '<div class="history-placeholder">No chats found</div>';
    }
    
    historyList.innerHTML = html;
    
    document.querySelectorAll('.group-header').forEach(header => {
        const groupName = header.getAttribute('data-group');
        const isCollapsed = localStorage.getItem(`group_${groupName}_collapsed`) === 'true';
        if (isCollapsed) header.classList.add('collapsed');
        
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            header.classList.toggle('collapsed');
            localStorage.setItem(`group_${groupName}_collapsed`, header.classList.contains('collapsed'));
        });
    });
}

window.applyFilterAndRender = function(searchTerm) {
    if (!allConversations.length) return;
    let filtered = [...allConversations];
    if (searchTerm) {
        filtered = filtered.filter(conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const groups = groupChatsByDate(filtered);
    renderGroupedChats(groups, searchTerm);
};

export async function createEmptyConversation(userId, title = "New Chat") {
    if (!userId) return null;
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "conversations"), {
            userId: userId,
            title: title,
            messages: [],
            isPublic: false,
            isPinned: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating empty conversation:", error);
        if (window.showToast) window.showToast("Failed to create new chat. Please try again.", "error");
        return null;
    }
}

export async function loadUserConversations(userId) {
    if (!userId) {
        const historyList = document.getElementById('chat-history-list');
        if (historyList) historyList.innerHTML = '<div class="history-placeholder">Sign in to see your chats</div>';
        return;
    }
    if (!db) {
        const historyList = document.getElementById('chat-history-list');
        if (historyList) historyList.innerHTML = '<div class="history-placeholder">Firestore connecting...</div>';
        return;
    }
    
    showSkeleton();
    
    try {
        const q = query(
            collection(db, "conversations"),
            where("userId", "==", userId),
            orderBy("updatedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        
        allConversations = [];
        querySnapshot.forEach(docSnap => {
            allConversations.push({
                id: docSnap.id,
                ...docSnap.data(),
                updatedAt: docSnap.data().updatedAt
            });
        });
        
        const searchTerm = document.getElementById('search-input')?.value || '';
        window.applyFilterAndRender(searchTerm);
        
        // ✅ FIX: Define chatTitleElement before using it
        const chatTitleElement = document.getElementById('chat-title');
        if (chatTitleElement && window.currentConversationId) {
            const currentConv = allConversations.find(c => c.id === window.currentConversationId);
            if (currentConv) {
                chatTitleElement.textContent = currentConv.title || 'New Chat';
            }
        }
        
    } catch (error) {
        console.error("Error loading conversations:", error);
        const historyList = document.getElementById('chat-history-list');
        if (historyList) historyList.innerHTML = '<div class="history-placeholder">Error loading chats. Refresh?</div>';
        if (window.showToast) window.showToast("Failed to load chat history.", "error");
    }
}

export async function togglePinConversation(conversationId) {
    if (!conversationId || !window.currentUser) {
        if (window.showToast) window.showToast("You must be logged in to pin chats.", "error");
        return;
    }
    if (!db) return;
    try {
        const convRef = doc(db, "conversations", conversationId);
        const convSnap = await getDoc(convRef);
        if (!convSnap.exists()) return;
        const currentPinned = convSnap.data().isPinned || false;
        await updateDoc(convRef, { isPinned: !currentPinned });
        if (window.showToast) window.showToast(currentPinned ? "Chat unpinned" : "Chat pinned", "success");
        await loadUserConversations(window.currentUser.uid);
    } catch (error) {
        console.error("Error toggling pin:", error);
        if (window.showToast) window.showToast("Failed to update pin status.", "error");
    }
}

export async function clearAllChats() {
    if (!window.currentUser) {
        if (window.showToast) window.showToast("Sign in to clear chats.", "error");
        return;
    }
    
    console.log("[ClearAll] Showing confirmation modal...");
    const confirmClear = await window.Modal.showClearAllConfirm();
    console.log("[ClearAll] Modal returned:", confirmClear);
    
    if (!confirmClear) {
        console.log("[ClearAll] User cancelled.");
        return;
    }
    
    if (!db) {
        console.error("[ClearAll] Firestore not available");
        return;
    }
    
    try {
        const q = query(
            collection(db, "conversations"),
            where("userId", "==", window.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        console.log(`[ClearAll] Found ${snapshot.size} chats to delete`);
        
        if (snapshot.empty) {
            if (window.showToast) window.showToast("No chats to clear.", "info");
            return;
        }
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log("[ClearAll] Batch delete successful");
        
        if (window.showToast) window.showToast("All chats cleared successfully.", "success");
        await loadUserConversations(window.currentUser.uid);
        if (window.createNewChat) window.createNewChat();
    } catch (error) {
        console.error("[ClearAll] Error clearing chats:", error);
        if (window.showToast) window.showToast("Failed to clear chats: " + error.message, "error");
    }
}

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

        window.currentConversationId = conversationId;
        highlightActiveHistoryItem(conversationId);
        if (window.updateURL) window.updateURL(conversationId);
        
        // ✅ Update header title
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

function highlightActiveHistoryItem(convId) {
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        if (item.getAttribute('data-id') === convId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
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

export async function deleteConversation(conversationId) {
    console.log("[Delete] Starting delete for:", conversationId);
    
    const conv = allConversations.find(c => c.id === conversationId);
    const chatTitle = conv?.title || 'this chat';
    console.log("[Delete] Chat title:", chatTitle);
    
    const confirmed = await window.Modal.showDeleteConfirm(chatTitle);
    console.log("[Delete] Modal confirmed:", confirmed);
    
    if (!confirmed) {
        console.log("[Delete] User cancelled.");
        return;
    }
    
    if (!db) {
        console.error("[Delete] Firestore not available");
        if (window.showToast) window.showToast("Database not available.", "error");
        return;
    }
    
    try {
        const convRef = doc(db, "conversations", conversationId);
        await deleteDoc(convRef);
        console.log("[Delete] Firestore delete successful");
        
        if (window.showToast) window.showToast("Chat deleted successfully.", "success");
        
        if (window.currentConversationId === conversationId) {
            console.log("[Delete] Deleted active chat, creating new chat...");
            if (window.createNewChat) window.createNewChat();
        }
        
        if (window.currentUser) {
            await loadUserConversations(window.currentUser.uid);
        }
    } catch (error) {
        console.error("[Delete] Error deleting conversation:", error);
        if (window.showToast) window.showToast("Failed to delete conversation: " + error.message, "error");
    }
}

// Direct update conversation messages in Firestore
export async function updateConversationMessages(conversationId, messagesArray) {
    if (!conversationId || !db) return false;
    try {
        const convRef = doc(db, "conversations", conversationId);
        await updateDoc(convRef, {
            messages: messagesArray,
            updatedAt: serverTimestamp()
        });
        console.log(`✅ Updated ${messagesArray.length} messages in ${conversationId}`);
        return true;
    } catch (error) {
        console.error("Error updating messages:", error);
        if (window.showToast) window.showToast("Failed to update chat. Check your connection.", "error");
        return false;
    }
}

async function saveConversationMessages(conversationId, messagesArray) {
    if (!conversationId || !db) return;
    try {
        const convRef = doc(db, "conversations", conversationId);
        await updateDoc(convRef, {
            messages: messagesArray,
            updatedAt: serverTimestamp()
        });
        console.log(`✅ Saved ${messagesArray.length} messages to ${conversationId}`);
    } catch (error) {
        console.error("Error saving messages:", error);
        if (window.showToast) window.showToast("Failed to save chat. Check your connection.", "error");
        throw error;
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
    const allMessages = window.getChatHistory();
    const userMessages = allMessages.filter(m => m.role !== 'system');
    
    if (userMessages.length === 0) return false;

    try {
        if (!currentId) {
            // ✅ Always create with "New Chat" title (not first message text)
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

// ========== AUTO-GENERATE CHAT TITLE USING AI (Groq Qwen 32B Free) ==========
export async function generateChatTitle(conversationId, userMessage) {
    if (!conversationId || !window.currentUser) {
        console.warn("Cannot generate title: no conversation or user");
        return;
    }
    if (!db) return;

    const convRef = doc(db, "conversations", conversationId);
    let convSnap;
    try {
        convSnap = await getDoc(convRef);
        if (!convSnap.exists()) return;
        const currentTitle = convSnap.data().title;
        
        // Only generate if title is still "New Chat"
        if (currentTitle !== "New Chat") {
            console.log(`Title is already "${currentTitle}", not auto-generating`);
            return;
        }
    } catch (err) {
        console.error("Error checking conversation:", err);
        return;
    }

    // Clean user message (remove file attachments)
    let cleanUserMessage = userMessage;
    if (cleanUserMessage.includes('📎')) {
        const lines = cleanUserMessage.split('\n');
        const textLines = lines.filter(line => !line.startsWith('📎'));
        cleanUserMessage = textLines.join('\n').trim();
    }
    if (cleanUserMessage.includes('[Attached file:')) {
        const parts = cleanUserMessage.split('---');
        cleanUserMessage = parts[parts.length - 1].trim();
    }
    if (!cleanUserMessage || cleanUserMessage.length < 5) {
        cleanUserMessage = userMessage.substring(0, 100);
    }

    // Using Groq Qwen 32B Free Model for title generation
    const TITLE_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const TITLE_API_KEY = "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";
    const TITLE_MODEL = "llama-3.1-8b-instant";

    const prompt = `Generate a very short title (max 6 words) for a chat conversation based on the user's first message. Only output the title, nothing else. No quotes, no extra text, no punctuation at the end.

User message: "${cleanUserMessage.substring(0, 500)}"

Title:`;

    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TITLE_API_KEY}`
        },
        body: JSON.stringify({
            model: TITLE_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 30,
            stream: false
        })
    };

    try {
        console.log("🎯 Generating title with Groq Qwen 32B...");
        const response = await fetch(TITLE_API_URL, fetchOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Title API error ${response.status}:`, errorText);
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        let generatedTitle = data.choices?.[0]?.message?.content?.trim() || "";
        
        // Clean up: remove quotes, extra spaces, limit length
        generatedTitle = generatedTitle.replace(/^["']|["']$/g, '').substring(0, 60);
        
        if (!generatedTitle || generatedTitle.length < 3) {
            generatedTitle = cleanUserMessage.substring(0, 40).replace(/\n/g, ' ');
        }
        
        await updateDoc(convRef, { title: generatedTitle, updatedAt: serverTimestamp() });
        console.log(`✅ AI generated title (Qwen 32B): "${generatedTitle}"`);
        
        // Update header title if this is the current conversation
        if (window.currentConversationId === conversationId) {
            const chatTitleElement = document.getElementById('chat-title');
            if (chatTitleElement) {
                chatTitleElement.textContent = generatedTitle;
            }
        }
        
        // Refresh sidebar to show new title
        if (window.currentUser) {
            await loadUserConversations(window.currentUser.uid);
        }
        if (window.showToast) {
            window.showToast(`✨ Title: "${generatedTitle}"`, "success", 2000);
        }
    } catch (error) {
        console.error("Title generation failed:", error);
        let fallbackTitle = cleanUserMessage.substring(0, 40).replace(/\n/g, ' ');
        if (fallbackTitle.length < 3) fallbackTitle = "New Chat";
        try {
            await updateDoc(convRef, { title: fallbackTitle, updatedAt: serverTimestamp() });
            console.log(`✅ Fallback title: "${fallbackTitle}"`);
            if (window.currentConversationId === conversationId) {
                const chatTitleElement = document.getElementById('chat-title');
                if (chatTitleElement) chatTitleElement.textContent = fallbackTitle;
            }
            if (window.currentUser) await loadUserConversations(window.currentUser.uid);
            if (window.showToast) {
                window.showToast(`✨ Title: "${fallbackTitle}"`, "success", 2000);
            }
        } catch (updateErr) {
            console.error("Fallback also failed:", updateErr);
        }
    }
}

// Expose the new function globally
window.generateChatTitle = generateChatTitle;

// ========== INIT SEARCH & EVENT LISTENERS ==========
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value;
        if (clearBtn) clearBtn.classList.toggle('hidden', !term);
        window.applyFilterAndRender(term);
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.classList.add('hidden');
            window.applyFilterAndRender('');
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

// Expose all functions globally
window.loadUserConversations = loadUserConversations;
window.selectConversation = selectConversation;
window.renameConversation = renameConversation;
window.deleteConversation = deleteConversation;
window.saveCurrentSession = saveCurrentSession;
window.createEmptyConversation = createEmptyConversation;
window.makeConversationPublic = makeConversationPublic;
window.togglePinConversation = togglePinConversation;
window.clearAllChats = clearAllChats;
window.applyFilterAndRender = window.applyFilterAndRender;
window.updateConversationMessages = updateConversationMessages;