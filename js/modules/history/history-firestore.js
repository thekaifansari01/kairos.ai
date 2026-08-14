// js/modules/history/history-firestore.js
// Firestore CRUD operations and state management

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

import { showSkeleton, groupChatsByDate, renderGroupedChats, escapeHtml } from './history-helpers.js';

if (!db) {
    console.error("Firestore db not initialized.");
}

// State (only allConversations is shared; loading flag is local to conversation module)
export let allConversations = [];

// Helper to refresh the UI after data changes
export function applyFilterAndRender(searchTerm) {
    if (!allConversations.length) return;
    let filtered = [...allConversations];
    if (searchTerm) {
        filtered = filtered.filter(conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const groups = groupChatsByDate(filtered);
    renderGroupedChats(groups, searchTerm, window.currentConversationId);
}

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
        applyFilterAndRender(searchTerm);
        
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

export async function saveConversationMessages(conversationId, messagesArray) {
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