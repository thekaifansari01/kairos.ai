// js/modules/core/memory.js
// Full context management with token counting, model limits
// FIXED: clearChatHistory uses current SYSTEM_PROMPT, added preference sync

let chatHistory = [];

const MODEL_LIMITS = {
    'google': { maxContext: 1000000, maxOutput: 8192 },
    'groq': { maxContext: 128000, maxOutput: 4096 },
    'openrouter': { maxContext: 262000, maxOutput: 4096 }
};

function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

function getCurrentProvider() {
    const model = window.MODELS?.find(m => m.modelId === window.MODEL_NAME);
    return model?.provider || 'groq';
}

function getOptimizedHistoryForAPI() {
    const provider = getCurrentProvider();
    const limits = MODEL_LIMITS[provider] || MODEL_LIMITS.groq;
    
    const reservedForResponse = limits.maxOutput;
    const reservedForSystem = 500;
    const availableForHistory = limits.maxContext - reservedForResponse - reservedForSystem;
    
    let totalTokens = 0;
    const optimizedMessages = [];
    
    const systemMsg = chatHistory.find(m => m.role === 'system');
    if (systemMsg) {
        optimizedMessages.push(systemMsg);
        totalTokens += estimateTokens(systemMsg.content);
    }
    
    const nonSystemMessages = chatHistory.filter(m => m.role !== 'system');
    
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
        const msg = nonSystemMessages[i];
        const msgTokens = estimateTokens(msg.content);
        
        if (totalTokens + msgTokens <= availableForHistory) {
            optimizedMessages.unshift(msg);
            totalTokens += msgTokens;
        } else {
            console.log(`[Context] Used ${optimizedMessages.length} messages (${totalTokens} tokens) out of ${availableForHistory}`);
            break;
        }
    }
    
    return optimizedMessages;
}

// Get current system prompt from window (which may be updated by preferences)
function getCurrentSystemPrompt() {
    if (window.SYSTEM_PROMPT && typeof window.SYSTEM_PROMPT === 'string') {
        return window.SYSTEM_PROMPT;
    }
    // Fallback
    return "You are Kairos (Kai), an advanced AI assistant specializing in software development, cybersecurity, and broad-spectrum knowledge, committed to delivering precise, comprehensive, and clearly structured responses with perfect emojies.";
}

function initChatHistory() {
    const systemPrompt = getCurrentSystemPrompt();
    chatHistory = [
        { role: "system", content: systemPrompt }
    ];
}

function addMessageToHistory(role, content) {
    if (!role || !content) return;
    if (chatHistory.length === 0 || chatHistory[0]?.role !== 'system') {
        chatHistory.unshift({ role: "system", content: getCurrentSystemPrompt() });
    }
    chatHistory.push({ role, content });
    
    if (chatHistory.length > 500) {
        const systemMsg = chatHistory[0];
        chatHistory = [systemMsg, ...chatHistory.slice(-450)];
    }
}

function getChatHistory() {
    return getOptimizedHistoryForAPI();
}

function getChatHistoryForAPI() {
    return getOptimizedHistoryForAPI();
}

// ✅ FIXED: clearChatHistory now uses current system prompt (not fallback)
function clearChatHistory() {
    initChatHistory(); // this uses getCurrentSystemPrompt()
}

function replaceUserMessageAndTruncate(oldContent, newContent) {
    let foundIndex = -1;
    for (let i = 0; i < chatHistory.length; i++) {
        if (chatHistory[i].role === 'user' && chatHistory[i].content === oldContent) {
            foundIndex = i;
            break;
        }
    }
    if (foundIndex === -1) return false;
    
    chatHistory[foundIndex].content = newContent;
    chatHistory = chatHistory.slice(0, foundIndex + 1);
    return true;
}

function truncateHistoryUpToUserMessage(userMessageContent) {
    let indexToKeep = -1;
    for (let i = 0; i < chatHistory.length; i++) {
        if (chatHistory[i].role === 'user' && chatHistory[i].content === userMessageContent) {
            indexToKeep = i;
            break;
        }
    }
    if (indexToKeep !== -1) {
        chatHistory = chatHistory.slice(0, indexToKeep + 1);
        return true;
    }
    return false;
}

function updateSystemMessage(newPrompt) {
    if (chatHistory.length > 0 && chatHistory[0].role === 'system') {
        chatHistory[0].content = newPrompt;
    } else {
        chatHistory.unshift({ role: "system", content: newPrompt });
    }
}

// ✅ Expose function to refresh system prompt from preferences
function refreshSystemPromptFromPreferences() {
    if (window.preferences && typeof window.preferences.buildSystemPrompt === 'function') {
        const newPrompt = window.preferences.buildSystemPrompt();
        window.SYSTEM_PROMPT = newPrompt;
        updateSystemMessage(newPrompt);
        console.log("✅ System prompt refreshed from preferences");
    }
}

window.estimateTokens = estimateTokens;
window.addMessageToHistory = addMessageToHistory;
window.getChatHistory = getChatHistoryForAPI;
window.clearChatHistory = clearChatHistory;
window.replaceUserMessageAndTruncate = replaceUserMessageAndTruncate;
window.truncateHistoryUpToUserMessage = truncateHistoryUpToUserMessage;
window.updateSystemMessage = updateSystemMessage;
window.refreshSystemPromptFromPreferences = refreshSystemPromptFromPreferences;

window.getRawChatHistory = function() {
    return [...chatHistory];
};

// Initialize
initChatHistory();

// Listen for preferences load
if (window.preferences) {
    refreshSystemPromptFromPreferences();
} else {
    // Wait for preferences to load
    const checkPrefs = setInterval(() => {
        if (window.preferences && typeof window.preferences.buildSystemPrompt === 'function') {
            clearInterval(checkPrefs);
            refreshSystemPromptFromPreferences();
        }
    }, 200);
}