// js/ui/chat-export.js — Share and Export functionality (improved)

// Get plain text of conversation (without HTML/cursor)
window.getConversationText = function() {
    const messages = document.querySelectorAll('.message');
    let text = "🐬 Dolphin AI Chat\n" + new Date().toLocaleString() + "\n" + "=".repeat(40) + "\n\n";
    
    messages.forEach(msg => {
        const isUser = msg.classList.contains('user');
        const contentDiv = msg.querySelector('.msg-content > div');
        if (!contentDiv) return;
        
        // Clone to avoid modifying live DOM
        const clone = contentDiv.cloneNode(true);
        const cursor = clone.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        
        let rawText = clone.textContent.trim();
        if (rawText) {
            text += `${isUser ? "👤 You" : "🐬 Dolphin"}:\n${rawText}\n\n`;
        }
    });
    
    return text;
};

// Get JSON representation of conversation
window.getConversationJSON = function() {
    const messages = [];
    document.querySelectorAll('.message').forEach(msg => {
        const isUser = msg.classList.contains('user');
        const contentDiv = msg.querySelector('.msg-content > div');
        if (!contentDiv) return;
        
        const clone = contentDiv.cloneNode(true);
        const cursor = clone.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        
        const rawText = clone.textContent.trim();
        if (rawText) {
            messages.push({
                role: isUser ? "user" : "assistant",
                content: rawText,
                timestamp: new Date().toISOString()
            });
        }
    });
    return JSON.stringify(messages, null, 2);
};

// Check if conversation has any messages
function hasMessages() {
    const messages = document.querySelectorAll('.message');
    let hasContent = false;
    for (const msg of messages) {
        const contentDiv = msg.querySelector('.msg-content > div');
        if (contentDiv && contentDiv.textContent.trim()) {
            hasContent = true;
            break;
        }
    }
    return hasContent;
}

// Fallback copy method
window.fallbackCopy = function(text) {
    // Create temporary textarea for copy
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        if (window.showToast) window.showToast('✅ Chat copied to clipboard!', 'success');
        else alert('✅ Chat copied to clipboard!');
    } catch (err) {
        if (window.showToast) window.showToast('❌ Could not copy. Manual copy needed.', 'error');
        else alert('Could not copy. Please copy manually.');
    }
    document.body.removeChild(textarea);
};

// Share chat (using Web Share API if available)
window.shareChat = async function() {
    if (!hasMessages()) {
        if (window.showToast) window.showToast("No messages to share.", "info");
        else alert("No messages to share.");
        return;
    }
    
    const text = window.getConversationText();
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Dolphin AI Chat',
                text: text,
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                window.fallbackCopy(text);
            }
        }
    } else {
        window.fallbackCopy(text);
    }
};

// Export chat as .txt file
window.exportChat = function(format = 'txt') {
    if (!hasMessages()) {
        if (window.showToast) window.showToast("No messages to export.", "info");
        else alert("No messages to export.");
        return;
    }
    
    let content, filename, mimeType;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (format === 'json') {
        content = window.getConversationJSON();
        filename = `dolphin-chat-${timestamp}.json`;
        mimeType = 'application/json';
    } else {
        content = window.getConversationText();
        filename = `dolphin-chat-${timestamp}.txt`;
        mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (window.showToast) window.showToast(`Exported as ${format.toUpperCase()}`, 'success', 2000);
};

// Optional: Export as JSON (convenience wrapper)
window.exportChatAsJSON = function() {
    window.exportChat('json');
};