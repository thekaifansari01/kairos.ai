// js/ui/preferences.js — Ultra Minimal, No Preview, No marked dependency

(function() {
    const STORAGE_KEY = 'kairos_user_preferences';
    const DEFAULT_PREFERENCES = {
        tone: 'Professional',
        codeStyle: 'Verbose comments',
        securityFocus: 'High',
        customInstructions: '',
        userName: ''
    };

    let currentPreferences = { ...DEFAULT_PREFERENCES };
    let modalOverlay = null;

    async function loadPreferences() {
        const user = window.currentUser;
        if (user && window.db) {
            try {
                const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
                const prefDoc = await getDoc(doc(window.db, "userPreferences", user.uid));
                if (prefDoc.exists()) {
                    currentPreferences = { ...DEFAULT_PREFERENCES, ...prefDoc.data() };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPreferences));
                    return;
                }
            } catch (e) { console.warn("Firestore prefs load failed", e); }
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                currentPreferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
            } catch(e) {}
        } else {
            currentPreferences = { ...DEFAULT_PREFERENCES };
        }
    }

    async function savePreferences(prefs) {
        currentPreferences = { ...prefs };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPreferences));
        const user = window.currentUser;
        if (user && window.db) {
            try {
                const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
                await setDoc(doc(window.db, "userPreferences", user.uid), currentPreferences);
            } catch (e) { console.warn("Firestore prefs save failed", e); }
        }
        if (window.refreshSystemPrompt) window.refreshSystemPrompt();
        if (window.showToast) window.showToast("Preferences saved", "success", 1500);
    }

    function getPreferences() { return { ...currentPreferences }; }

    function buildSystemPrompt() {
        let basePrompt = `You are Kairos (Kai), an advanced AI assistant specializing in software development, cybersecurity, and broad-spectrum knowledge.`;
        const prefs = currentPreferences;
        switch(prefs.tone) {
            case 'Casual': basePrompt += ` Use a casual, conversational tone. Use occasional emojis. Be friendly but professional.`; break;
            case 'Friendly': basePrompt += ` Be warm, encouraging, and friendly. Use positive language.`; break;
            case 'Concise': basePrompt += ` Be extremely concise. Give short, direct answers. Avoid fluff.`; break;
            case 'Detailed': basePrompt += ` Provide thorough, detailed explanations. Include examples where helpful.`; break;
            case 'Creative': basePrompt += ` Be creative and think outside the box. Suggest innovative solutions.`; break;
            default: basePrompt += ` Maintain a professional, technical tone. Be precise and clear.`;
        }
        if (prefs.codeStyle === 'Verbose comments') basePrompt += ` When writing code, include detailed comments explaining each step.`;
        else if (prefs.codeStyle === 'Minimal comments') basePrompt += ` When writing code, use minimal comments only where necessary.`;
        else if (prefs.codeStyle === 'Type hints') basePrompt += ` Always include type hints in Python code and TypeScript annotations.`;
        else if (prefs.codeStyle === 'Functional') basePrompt += ` Prefer functional programming style. Avoid classes when possible.`;
        else if (prefs.codeStyle === 'OOP') basePrompt += ` Use object-oriented programming style. Encapsulate logic in classes.`;
        if (prefs.securityFocus === 'High') basePrompt += ` Prioritize security in all code. Always point out vulnerabilities and suggest fixes.`;
        else if (prefs.securityFocus === 'Medium') basePrompt += ` Mention security considerations when relevant.`;
        else basePrompt += ` Only mention security if explicitly asked.`;
        if (prefs.customInstructions && prefs.customInstructions.trim()) {
            basePrompt += `\n\nAdditional instructions from user: ${prefs.customInstructions}`;
        }
        return basePrompt;
    }

    function injectStyles() {
        if (document.getElementById('preferences-styles')) return;
        const style = document.createElement('style');
        style.id = 'preferences-styles';
        style.textContent = `
            .prefs-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 11000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: prefsFadeIn 0.15s ease;
            }
            @keyframes prefsFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .prefs-modal {
                background: #0f0f13;
                border-radius: 20px;
                width: 90%;
                max-width: 520px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                border: 1px solid #2a2a2e;
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
                animation: prefsSlideUp 0.2s ease;
                overflow: hidden;
            }
            @keyframes prefsSlideUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .prefs-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #2a2a2e;
                background: #0a0c10;
            }
            .prefs-header h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #e2e8f0;
            }
            .prefs-close {
                background: #1e1e24;
                border: 1px solid #2a2a2e;
                width: 32px;
                height: 32px;
                border-radius: 10px;
                font-size: 1.2rem;
                cursor: pointer;
                color: #a1a1aa;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .prefs-close:hover {
                background: #2a2a30;
                color: white;
                border-color: #3a3a44;
            }
            .prefs-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
                background: #0f0f13;
                scrollbar-width: thin;
            }
            .prefs-body::-webkit-scrollbar {
                width: 4px;
            }
            .prefs-body::-webkit-scrollbar-track {
                background: #1e1e24;
            }
            .prefs-body::-webkit-scrollbar-thumb {
                background: #3f3f46;
                border-radius: 10px;
            }
            .prefs-grid {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .prefs-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .prefs-field label {
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #8b8b93;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .prefs-field select,
            .prefs-field input,
            .prefs-field textarea {
                background: #1a1a20;
                border: 1px solid #2a2a2e;
                border-radius: 12px;
                padding: 10px 12px;
                color: #f0f0f5;
                font-size: 0.85rem;
                font-family: inherit;
                transition: all 0.15s;
                outline: none;
            }
            .prefs-field select option {
                background: #1a1a20;
                color: #f0f0f5;
            }
            .prefs-field select:hover,
            .prefs-field input:hover,
            .prefs-field textarea:hover {
                border-color: #3a3a44;
                background: #202028;
            }
            .prefs-field select:focus,
            .prefs-field input:focus,
            .prefs-field textarea:focus {
                border-color: #06b6d4;
                background: #1a1a24;
            }
            .prefs-field textarea {
                resize: vertical;
                min-height: 80px;
                font-family: monospace;
                font-size: 0.8rem;
            }
            .prefs-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 0.75rem 1.5rem 1.25rem;
                border-top: 1px solid #2a2a2e;
                background: #0a0c10;
            }
            .prefs-btn {
                padding: 7px 18px;
                border-radius: 30px;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
                border: none;
                font-family: inherit;
            }
            .prefs-btn-primary {
                background: #06b6d4;
                color: white;
            }
            .prefs-btn-primary:hover {
                background: #0891b2;
                transform: translateY(-1px);
            }
            .prefs-btn-secondary {
                background: #1e1e24;
                color: #a1a1aa;
                border: 1px solid #2a2a2e;
            }
            .prefs-btn-secondary:hover {
                background: #2a2a30;
                color: white;
            }
            .prefs-btn-reset {
                background: rgba(239, 68, 68, 0.08);
                color: #f87171;
                border: 1px solid rgba(239, 68, 68, 0.3);
                margin-right: auto;
            }
            .prefs-btn-reset:hover {
                background: rgba(239, 68, 68, 0.15);
                color: #ff8a8a;
            }
            @media (max-width: 640px) {
                .prefs-modal {
                    width: 95%;
                    border-radius: 16px;
                }
                .prefs-body {
                    padding: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    async function showPreferencesModal() {
        if (modalOverlay) return;
        await loadPreferences();
        injectStyles();
        
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'prefs-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'prefs-modal';
        
        modal.innerHTML = `
            <div class="prefs-header">
                <h3><i class="fas fa-sliders-h"></i> Preferences</h3>
                <button class="prefs-close">&times;</button>
            </div>
            <div class="prefs-body">
                <div class="prefs-grid">
                    <div class="prefs-field">
                        <label><i class="fas fa-comment-dots"></i> Tone</label>
                        <select id="pref-tone">
                            <option value="Professional">Professional</option>
                            <option value="Casual">Casual</option>
                            <option value="Friendly">Friendly</option>
                            <option value="Concise">Concise</option>
                            <option value="Detailed">Detailed</option>
                            <option value="Creative">Creative</option>
                        </select>
                    </div>
                    <div class="prefs-field">
                        <label><i class="fas fa-code"></i> Code Style</label>
                        <select id="pref-codeStyle">
                            <option value="Verbose comments">Verbose comments</option>
                            <option value="Minimal comments">Minimal comments</option>
                            <option value="Type hints">Type hints</option>
                            <option value="Functional">Functional</option>
                            <option value="OOP">OOP</option>
                        </select>
                    </div>
                    <div class="prefs-field">
                        <label><i class="fas fa-shield-alt"></i> Security Focus</label>
                        <select id="pref-securityFocus">
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div class="prefs-field">
                        <label><i class="fas fa-user"></i> Display Name</label>
                        <input type="text" id="pref-userName" placeholder="Your preferred name" autocomplete="off">
                    </div>
                    <div class="prefs-field">
                        <label><i class="fas fa-pen-alt"></i> Custom Instructions</label>
                        <textarea id="pref-customInstructions" placeholder="e.g., Always use async/await, Never use eval()..."></textarea>
                    </div>
                </div>
            </div>
            <div class="prefs-footer">
                <button class="prefs-btn prefs-btn-reset" id="prefs-reset">Reset</button>
                <button class="prefs-btn prefs-btn-secondary" id="prefs-cancel">Cancel</button>
                <button class="prefs-btn prefs-btn-primary" id="prefs-save">Save</button>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        document.getElementById('pref-tone').value = currentPreferences.tone;
        document.getElementById('pref-codeStyle').value = currentPreferences.codeStyle;
        document.getElementById('pref-securityFocus').value = currentPreferences.securityFocus;
        document.getElementById('pref-customInstructions').value = currentPreferences.customInstructions || '';
        document.getElementById('pref-userName').value = currentPreferences.userName || '';
        
        const closeModal = () => {
            if (modalOverlay) modalOverlay.remove();
            modalOverlay = null;
        };
        modal.querySelector('.prefs-close').onclick = closeModal;
        document.getElementById('prefs-cancel').onclick = closeModal;
        modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };
        
        document.getElementById('prefs-save').onclick = async () => {
            const newPrefs = {
                tone: document.getElementById('pref-tone').value,
                codeStyle: document.getElementById('pref-codeStyle').value,
                securityFocus: document.getElementById('pref-securityFocus').value,
                customInstructions: document.getElementById('pref-customInstructions').value,
                userName: document.getElementById('pref-userName').value
            };
            await savePreferences(newPrefs);
            closeModal();
            if (window.updateWelcomeUsername) window.updateWelcomeUsername();
        };
        
        document.getElementById('prefs-reset').onclick = async () => {
            await savePreferences({ ...DEFAULT_PREFERENCES });
            document.getElementById('pref-tone').value = DEFAULT_PREFERENCES.tone;
            document.getElementById('pref-codeStyle').value = DEFAULT_PREFERENCES.codeStyle;
            document.getElementById('pref-securityFocus').value = DEFAULT_PREFERENCES.securityFocus;
            document.getElementById('pref-customInstructions').value = '';
            document.getElementById('pref-userName').value = '';
            if (window.updateWelcomeUsername) window.updateWelcomeUsername();
        };
    }
    
    function refreshSystemPrompt() {
        const newPrompt = buildSystemPrompt();
        window.SYSTEM_PROMPT = newPrompt;
        if (window.updateSystemMessage) window.updateSystemMessage(newPrompt);
        console.log("System prompt refreshed with preferences");
    }
    
    window.preferences = {
        load: loadPreferences,
        save: savePreferences,
        get: getPreferences,
        buildSystemPrompt: buildSystemPrompt,
        refreshSystemPrompt: refreshSystemPrompt,
        showModal: showPreferencesModal
    };
    
    loadPreferences().then(() => refreshSystemPrompt());
})();