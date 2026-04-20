// js/ui/settings-popup.js
// Settings popup for API keys - current session only

// Get default keys from globally exposed config (config.js)
function getDefaultKeys() {
    return {
        groq: window.GROQ_API_KEY || "",
        openrouter: window.OPENROUTER_API_KEY || "",
        google: window.GOOGLE_API_KEY || ""
    };
}

// Load saved keys from localStorage (session only)
function loadSavedKeys() {
    const saved = localStorage.getItem('kairos_api_keys');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge with defaults in case new providers added
            const defaults = getDefaultKeys();
            return { ...defaults, ...parsed };
        } catch(e) {
            return getDefaultKeys();
        }
    }
    return getDefaultKeys();
}

// Save keys to localStorage
function saveKeys(keys) {
    localStorage.setItem('kairos_api_keys', JSON.stringify(keys));
}

// Apply keys to current session (updates globals and MODELS array)
function applyKeysToSession(keys) {
    // Update Groq
    if (keys.groq) {
        window.GROQ_API_KEY = keys.groq;
        if (window.currentProvider === 'groq') {
            window.API_KEY = keys.groq;
        }
    }
    
    // Update OpenRouter
    if (keys.openrouter) {
        window.OPENROUTER_API_KEY = keys.openrouter;
        if (window.currentProvider === 'openrouter') {
            window.API_KEY = keys.openrouter;
        }
    }
    
    // Update Google
    if (keys.google) {
        window.GOOGLE_API_KEY = keys.google;
        if (window.currentProvider === 'google') {
            window.API_KEY = keys.google;
        }
    }
    
    // Update MODELS array with new keys
    if (window.MODELS) {
        window.MODELS.forEach(model => {
            if (model.provider === 'groq' && keys.groq) {
                model.apiKey = keys.groq;
            } else if (model.provider === 'openrouter' && keys.openrouter) {
                model.apiKey = keys.openrouter;
            } else if (model.provider === 'google' && keys.google) {
                model.apiKey = keys.google;
            }
        });
    }
    
    console.log("✅ API keys updated for current session");
}

// Reset to default keys (from config.js)
function resetToDefaultKeys() {
    const defaults = getDefaultKeys();
    saveKeys(defaults);
    applyKeysToSession(defaults);
    return defaults;
}

// SVG Icons
const VIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.582.707.582 1.066s-.194.594-.582 1.066C18.768 14.79 15.636 18 12 18s-6.768-3.21-8.188-4.934c-.388-.472-.582-.707-.582-1.066s.194-.594.582-1.066C5.232 9.21 8.364 6 12 6s6.768 3.21 8.188 4.934Z"/></g></svg>`;
const HIDE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M11.83 9L15 12.16V12a3 3 0 0 0-3-3zm-4.3.8l1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28l.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22L21 20.73L3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7"/></svg>`;
const WARNING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" style="margin-right: 6px; vertical-align: middle;"><g fill="none"><path fill="url(#warningGradientA)" d="M12.937 3.809c1.33-2.41 4.796-2.41 6.127 0l10.494 18.999c1.288 2.333-.4 5.192-3.064 5.192H5.507c-2.665 0-4.352-2.86-3.064-5.192z"/><path fill="url(#warningGradientB)" d="M17.25 22a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0M16 9a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0v-8a1 1 0 0 0-1-1"/><defs><linearGradient id="warningGradientA" x1="6.377" x2="22.707" y1="-2.061" y2="31.433" gradientUnits="userSpaceOnUse"><stop stop-color="#ffcd0f"/><stop offset="1" stop-color="#fe8401"/></linearGradient><linearGradient id="warningGradientB" x1="12.666" x2="20.071" y1="9" y2="22.856" gradientUnits="userSpaceOnUse"><stop stop-color="#4a4a4a"/><stop offset="1" stop-color="#212121"/></linearGradient></defs></g></svg>`;

// Show settings popup
window.showSettingsPopup = function() {
    const currentKeys = loadSavedKeys();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'settings-popup-overlay';
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'settings-popup';
    
    popup.innerHTML = `
        <div class="settings-popup-header">
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                    <path fill="currentColor" d="m14.136 3.361l.995-.1zm-.152-.82L13.095 3zm.447 2.277l.795-.607zm.929.384l-.134-.99zm1.238-.82l.633.773zm.687-.473l.305.953zm.702.035l.398-.917zm.637.538l-.707.707zm.894.894l.707-.707zm.538.637l.917-.398zm.035.702l.952.304zm-.472.687l-.774-.633zm-.822 1.239l-.99-.134zm.385.928l-.606.795zm1.457.295l.099-.995zm.82.152l.458-.889zm.47.521l.93-.367zm.001 2.926l-.93-.368zm-.472.52l.459.89zm-.82.153l-.099-.995l-.033.003l-.032.006zm0 0l.1.995l.033-.003l.032-.005zm-1.456.295l-.606-.795zm-.384.929l-.991.133zm.821 1.238l-.774.633zm.472.687l-.953.304zm-.035.702l-.918-.398zm-.538.637l.707.707zm-.894.893l-.707-.707zm-.637.538l.398.918zm-.702.035l-.304.953zm-.687-.472l.633-.774l-.008-.006zm0 0l-.633.774l.008.007zm-1.238-.82l.133-.992zm-.929.384l.795.606zm-.295 1.456l-.995-.1zm-.152.82L13.095 21zm-.521.472l-.368-.93zm-2.926 0l.368-.93zm-.52-.472l.888-.458zm-.153-.82l-.995.1zm-.295-1.456l-.795.607zm-.928-.384l-.134-.992zm-1.239.82l-.633-.773l-.016.013l-.015.013zm0 0l.633.775l.016-.013l.015-.014zm-.687.473l.304.952zm-.702-.035l-.398.917zm-.637-.538l.707.707zm-.894-.894l-.707.707zm-.538-.637l.918-.397zm-.035-.702l.953.305zm.472-.687l.774.633zm.821-1.239l.992.134zm-.384-.928l.606-.795zm-1.457-.295l-.1.995zm-.82-.152L3 13.095zm-.47-.521l-.93.367zm0-2.926l-.93-.368zm.47-.52l-.458-.89zm.82-.153v-1h-.05l-.049.005zm0 0v1h.05l.05-.005zm1.457-.295l-.606-.795zm.385-.928l.991-.134zM4.38 7.4l.774-.632zm-.472-.687l.953-.304zm.035-.702l-.917-.397zm.538-.637l.707.707zm.894-.893l-.707-.707zm.637-.538l-.398-.918zm.702-.035l.304-.953zm.687.472l.633-.774zm1.238.821l.134-.991zm.93-.385l-.796-.606zm.294-1.456l.995.1zm.152-.82l-.889-.458zm.521-.471l.368.93zm2.926 0l.367-.93z"/>
                </svg>
                API Settings
            </h3>
            <button class="settings-popup-close">&times;</button>
        </div>
        <div class="settings-popup-body">
            <p class="settings-info">
                ${WARNING_SVG}
                <span>These changes apply to <strong>current session only</strong>. Keys are stored in localStorage.</span>
            </p>
            
            <div class="settings-field">
                <label>
                    <span class="provider-badge groq">GROQ</span>
                    <span class="provider-desc">Groq API Key</span>
                </label>
                <div class="input-wrapper">
                    <input type="password" id="groq-key" class="settings-input" value="${escapeHtml(currentKeys.groq)}" placeholder="Enter Groq API Key">
                    <button class="toggle-visibility" data-target="groq-key">${VIEW_SVG}</button>
                </div>
            </div>
            
            <div class="settings-field">
                <label>
                    <span class="provider-bracket">[</span>
                    <span class="provider-name">OpenRouter</span>
                    <span class="provider-bracket">]</span>
                    <span class="provider-desc">OpenRouter API Key</span>
                </label>
                <div class="input-wrapper">
                    <input type="password" id="openrouter-key" class="settings-input" value="${escapeHtml(currentKeys.openrouter)}" placeholder="Enter OpenRouter API Key">
                    <button class="toggle-visibility" data-target="openrouter-key">${VIEW_SVG}</button>
                </div>
            </div>
            
            <div class="settings-field">
                <label>
                    <span class="provider-badge google">GOOGLE</span>
                    <span class="provider-desc">Google Gemini API Key</span>
                </label>
                <div class="input-wrapper">
                    <input type="password" id="google-key" class="settings-input" value="${escapeHtml(currentKeys.google)}" placeholder="Enter Google API Key">
                    <button class="toggle-visibility" data-target="google-key">${VIEW_SVG}</button>
                </div>
            </div>
        </div>
        <div class="settings-popup-footer">
            <button class="settings-btn settings-btn-reset">Reset to Default</button>
            <button class="settings-btn settings-btn-cancel">Cancel</button>
            <button class="settings-btn settings-btn-save">Save Changes</button>
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Toggle password visibility with SVG icons
    popup.querySelectorAll('.toggle-visibility').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = HIDE_SVG;
            } else {
                input.type = 'password';
                btn.innerHTML = VIEW_SVG;
            }
        });
    });
    
    // Close button
    popup.querySelector('.settings-popup-close').onclick = () => {
        overlay.remove();
    };
    
    // Cancel button
    popup.querySelector('.settings-btn-cancel').onclick = () => {
        overlay.remove();
    };
    
    // Reset button
    popup.querySelector('.settings-btn-reset').onclick = () => {
        const defaultKeys = resetToDefaultKeys();
        document.getElementById('groq-key').value = defaultKeys.groq;
        document.getElementById('openrouter-key').value = defaultKeys.openrouter;
        document.getElementById('google-key').value = defaultKeys.google;
        // Reset toggle buttons to view state
        document.querySelectorAll('.toggle-visibility').forEach(btn => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input && input.type !== 'password') {
                input.type = 'password';
                btn.innerHTML = VIEW_SVG;
            }
        });
        if (window.showToast) {
            window.showToast("✅ API keys reset to defaults", "success", 2000);
        }
    };
    
    // Save button
    popup.querySelector('.settings-btn-save').onclick = () => {
        const newKeys = {
            groq: document.getElementById('groq-key').value.trim(),
            openrouter: document.getElementById('openrouter-key').value.trim(),
            google: document.getElementById('google-key').value.trim()
        };
        
        // Validate at least one key is not empty
        if (!newKeys.groq && !newKeys.openrouter && !newKeys.google) {
            if (window.showToast) {
                window.showToast("⚠️ At least one API key is required", "error", 3000);
            }
            return;
        }
        
        // Save and apply
        saveKeys(newKeys);
        applyKeysToSession(newKeys);
        
        overlay.remove();
        
        if (window.showToast) {
            window.showToast("✅ API keys saved for current session", "success", 3000);
        }
        
        // Reload current model config to refresh API key
        if (window.switchModel && window.CURRENT_MODEL_DISPLAY) {
            window.switchModel(window.CURRENT_MODEL_DISPLAY);
        }
    };
    
    // Click outside to close
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
    
    // Escape key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Inject styles automatically
(function injectSettingsStyles() {
    if (document.getElementById('settings-popup-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'settings-popup-styles';
    style.textContent = `
        .settings-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .settings-popup {
            background: var(--bg-sidebar, #121214);
            border: 1px solid var(--border-color, #27272a);
            border-radius: 24px;
            width: 90%;
            max-width: 500px;
            max-height: 85vh;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            animation: settingsPopupSlideIn 0.3s ease;
        }
        
        @keyframes settingsPopupSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.96);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .settings-popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color, #27272a);
            background: rgba(0, 0, 0, 0.2);
        }
        
        .settings-popup-header h3 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
            font-size: 1.2rem;
            font-weight: 500;
            color: var(--text-primary, #f4f4f5);
        }
        
        .settings-popup-close {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 1.4rem;
            cursor: pointer;
            color: var(--text-muted, #a1a1aa);
            transition: all 0.2s;
        }
        
        .settings-popup-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .settings-popup-body {
            padding: 1.5rem;
            max-height: 55vh;
            overflow-y: auto;
        }
        
        .settings-info {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            color: var(--text-muted, #a1a1aa);
            background: rgba(6, 182, 212, 0.1);
            padding: 10px 12px;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            border-left: 3px solid var(--accent-cyan, #06b6d4);
        }
        
        .settings-field {
            margin-bottom: 1.25rem;
        }
        
        .settings-field label {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .provider-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .provider-badge.groq {
            background: #f55036;
            color: white;
        }
        
        .provider-badge.google {
            background: #4285f4;
            color: white;
        }
        
        .provider-bracket {
            color: var(--text-muted);
            font-weight: 600;
        }
        
        .provider-name {
            color: var(--accent-cyan);
            font-weight: 600;
        }
        
        .provider-desc {
            color: var(--text-muted);
            font-size: 0.75rem;
        }
        
        .input-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .settings-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color, #27272a);
            border-radius: 12px;
            padding: 10px 14px;
            color: var(--text-primary, #f4f4f5);
            font-size: 0.85rem;
            font-family: monospace;
            outline: none;
            transition: all 0.2s;
        }
        
        .settings-input:focus {
            border-color: var(--accent-cyan, #06b6d4);
            background: rgba(6, 182, 212, 0.05);
        }
        
        .toggle-visibility {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color, #27272a);
            border-radius: 10px;
            padding: 8px 12px;
            cursor: pointer;
            color: var(--text-muted);
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        
        .toggle-visibility:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--accent-cyan);
        }
        
        .settings-popup-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 1rem 1.5rem 1.5rem;
            border-top: 1px solid var(--border-color, #27272a);
            background: rgba(0, 0, 0, 0.15);
        }
        
        .settings-btn {
            padding: 8px 18px;
            border-radius: 40px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-family: inherit;
        }
        
        .settings-btn-save {
            background: var(--accent-cyan, #06b6d4);
            color: white;
        }
        
        .settings-btn-save:hover {
            background: #0891b2;
            transform: translateY(-1px);
        }
        
        .settings-btn-cancel {
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-muted);
            border: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .settings-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.12);
            color: white;
        }
        
        .settings-btn-reset {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
            margin-right: auto;
        }
        
        .settings-btn-reset:hover {
            background: rgba(239, 68, 68, 0.25);
            color: #ff8a8a;
        }
        
        @media (max-width: 640px) {
            .settings-popup {
                width: 95%;
                border-radius: 20px;
            }
            .settings-popup-footer {
                flex-wrap: wrap;
            }
            .settings-btn-reset {
                margin-right: 0;
                order: 1;
            }
        }
    `;
    document.head.appendChild(style);
})();