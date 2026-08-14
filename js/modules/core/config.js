// js/modules/core/config.js

// Groq API
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = "";

// OpenRouter API
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = "";

// Google Gemini OpenAI-compatible endpoint
const GOOGLE_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GOOGLE_API_KEY = "";

// Model list
const MODELS = [
    // Google Free Models
    {
        display: "Flash-Lite",
        modelId: "gemini-3.1-flash-lite-preview",
        provider: "google",
        apiUrl: GOOGLE_OPENAI_URL,
        apiKey: GOOGLE_API_KEY,
        maxContext: 1000000,
        maxOutput: 8192
    },
    {
        display: "Flash",
        modelId: "gemini-2.5-flash",
        provider: "google",
        apiUrl: GOOGLE_OPENAI_URL,
        apiKey: GOOGLE_API_KEY,
        maxContext: 1000000,
        maxOutput: 8192
    },
    {
        display: "Flash-Lite 2.5",
        modelId: "gemini-2.5-flash-lite",
        provider: "google",
        apiUrl: GOOGLE_OPENAI_URL,
        apiKey: GOOGLE_API_KEY,
        maxContext: 1000000,
        maxOutput: 8192
    },
    
    // OpenRouter Free Models
    {
        display: "Nemotron",
        modelId: "nvidia/nemotron-3-super-120b-a12b:free",
        provider: "openrouter",
        apiUrl: OPENROUTER_API_URL,
        apiKey: OPENROUTER_API_KEY,
        maxContext: 262000,
        maxOutput: 8192
    },
    {
        display: "qwen 80B",
        modelId: "qwen/qwen3-next-80b-a3b-instruct:free",
        provider: "openrouter",
        apiUrl: OPENROUTER_API_URL,
        apiKey: OPENROUTER_API_KEY,
        maxContext: 1000000,
        maxOutput: 65536
    },

    // Groq Free Models
    {
        display: "Llama",
        modelId: "llama-3.3-70b-versatile",
        provider: "groq",
        apiUrl: GROQ_API_URL,
        apiKey: GROQ_API_KEY,
        maxContext: 128000,
        maxOutput: 4096
    },
    {
        display: "GPT",
        modelId: "openai/gpt-oss-120b",
        provider: "groq",
        apiUrl: GROQ_API_URL,
        apiKey: GROQ_API_KEY,
        maxContext: 128000,
        maxOutput: 4096
    },
    {
        display: "Kimi K2",
        modelId: "moonshotai/kimi-k2-instruct",
        provider: "groq",
        apiUrl: GROQ_API_URL,
        apiKey: GROQ_API_KEY,
        maxContext: 128000,
        maxOutput: 4096
    },
    {
        display: "Qwen (R)",
        modelId: "qwen/qwen3-32b",
        provider: "groq",
        apiUrl: GROQ_API_URL,
        apiKey: GROQ_API_KEY,
        maxContext: 128000,
        maxOutput: 4096
    },
];

// Current active model (default: Flash-Lite)
let currentModel = MODELS[0];

window.API_URL = currentModel.apiUrl;
window.API_KEY = currentModel.apiKey;
window.MODEL_NAME = currentModel.modelId;
window.CURRENT_MODEL_DISPLAY = currentModel.display;

// Base fallback prompt (used only if preferences not loaded yet)
const FALLBACK_SYSTEM_PROMPT = `You are Kairos (Kai), an advanced AI assistant specializing in software development, cybersecurity, and broad-spectrum knowledge, committed to delivering precise, comprehensive, and clearly structured responses with perfect emojies.`;

// System prompt will be set by preferences after load
let SYSTEM_PROMPT = FALLBACK_SYSTEM_PROMPT;

// Function to update system prompt dynamically (called from preferences.js)
window.updateSystemMessage = function(newPrompt) {
    if (!newPrompt || typeof newPrompt !== 'string') return;
    SYSTEM_PROMPT = newPrompt;
    window.SYSTEM_PROMPT = newPrompt;
    
    // Update in memory.js if already initialized
    if (window.getRawChatHistory) {
        const history = window.getRawChatHistory();
        if (history && history.length > 0 && history[0] && history[0].role === 'system') {
            history[0].content = newPrompt;
        }
    }
    console.log("✅ System prompt updated from preferences");
};

// ========== API KEY PERSISTENCE (FIX) ==========
function applyStoredApiKeys() {
    try {
        const stored = localStorage.getItem('kairos_api_keys');
        if (!stored) return;
        
        const keys = JSON.parse(stored);
        
        // Update global variables
        if (keys.groq) window.GROQ_API_KEY = keys.groq;
        if (keys.openrouter) window.OPENROUTER_API_KEY = keys.openrouter;
        if (keys.google) window.GOOGLE_API_KEY = keys.google;
        
        // Update each model's apiKey in MODELS array
        MODELS.forEach(model => {
            if (model.provider === 'groq' && keys.groq) {
                model.apiKey = keys.groq;
            } else if (model.provider === 'openrouter' && keys.openrouter) {
                model.apiKey = keys.openrouter;
            } else if (model.provider === 'google' && keys.google) {
                model.apiKey = keys.google;
            }
        });
        
        // Update current model's API key (if current model provider has a stored key)
        if (currentModel.provider === 'groq' && keys.groq) {
            window.API_KEY = keys.groq;
            currentModel.apiKey = keys.groq;
        } else if (currentModel.provider === 'openrouter' && keys.openrouter) {
            window.API_KEY = keys.openrouter;
            currentModel.apiKey = keys.openrouter;
        } else if (currentModel.provider === 'google' && keys.google) {
            window.API_KEY = keys.google;
            currentModel.apiKey = keys.google;
        }
        
        console.log("✅ Stored API keys applied on page load");
    } catch (e) {
        console.warn("Failed to apply stored API keys:", e);
    }
}

// Apply stored keys immediately
applyStoredApiKeys();

// If preferences module is already loaded, use its prompt
if (window.preferences && typeof window.preferences.buildSystemPrompt === 'function') {
    SYSTEM_PROMPT = window.preferences.buildSystemPrompt();
    window.SYSTEM_PROMPT = SYSTEM_PROMPT;
} else {
    // Otherwise set fallback (will be updated when preferences loads)
    window.SYSTEM_PROMPT = FALLBACK_SYSTEM_PROMPT;
}

// Expose globals
window.GROQ_API_URL = GROQ_API_URL;
window.GROQ_API_KEY = GROQ_API_KEY;
window.OPENROUTER_API_URL = OPENROUTER_API_URL;
window.OPENROUTER_API_KEY = OPENROUTER_API_KEY;
window.GOOGLE_OPENAI_URL = GOOGLE_OPENAI_URL;
window.GOOGLE_API_KEY = GOOGLE_API_KEY;
window.MODELS = MODELS;

// Model switching
window.switchModel = function(modelDisplayName) {
    const model = MODELS.find(m => m.display === modelDisplayName);
    if (!model) return false;
    
    currentModel = model;
    window.API_URL = model.apiUrl;
    window.API_KEY = model.apiKey;
    window.MODEL_NAME = model.modelId;
    window.CURRENT_MODEL_DISPLAY = model.display;
    
    console.log(`✅ Switched to ${model.display} (${model.provider})`);
    return true;
};