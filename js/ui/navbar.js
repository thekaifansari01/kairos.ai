// js/ui/navbar.js — Vertical Navbar, Top-Right, Custom SVG Icons + AI Indicator + Templates Modal Trigger + Preferences

(function() {
    // Store original switchModel if exists
    let originalSwitchModel = null;

    // Custom SVG Icons
    const CUSTOM_ICONS = {
        newChat: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" style="display: inline-block; vertical-align: middle;"><path fill="currentColor" fill-rule="evenodd" d="M1.5 4A1.5 1.5 0 0 1 3 2.5h10A1.5 1.5 0 0 1 14.5 4v3.25a.75.75 0 0 0 1.5 0V4a3 3 0 0 0-3-3H3a3 3 0 0 0-3 3v11.25a.75.75 0 0 0 1.28.53L4.063 13H8.25a.75.75 0 0 0 0-1.5H3.443l-.22.22L1.5 13.44zM13 14a.75.75 0 0 1-.75-.75v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5a.75.75 0 0 1 1.5 0v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5A.75.75 0 0 1 13 14" clip-rule="evenodd"/></svg>`,
        share: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" style="display: inline-block; vertical-align: middle;"><path fill="currentColor" d="M9.5 3a.5.5 0 0 1 0 1H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5a.5.5 0 0 1 1 0V14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm3.797-.957a.5.5 0 0 1 .538.085l5 4.5a.5.5 0 0 1 0 .744l-5 4.5A.5.5 0 0 1 13 11.5V9.34c-1.4.128-2.665.78-3.7 1.608c-1.014.813-1.775 1.768-2.195 2.484l-.158.291A.5.5 0 0 1 6 13.5c0-2.049.382-4.284 1.519-6.024C8.609 5.808 10.367 4.643 13 4.513V2.5l.005-.073a.5.5 0 0 1 .292-.384"/></svg>`,
        export: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M20 14v-3.343c0-.818 0-1.226-.152-1.594c-.152-.367-.441-.657-1.02-1.235l-4.736-4.736c-.499-.499-.748-.748-1.058-.896a2 2 0 0 0-.197-.082C12.514 2 12.161 2 11.456 2c-3.245 0-4.868 0-5.967.886a4 4 0 0 0-.603.603C4 4.59 4 6.211 4 9.456V14c0 3.771 0 5.657 1.172 6.828S8.229 22 12 22m1-19.5V3c0 2.828 0 4.243.879 5.121C14.757 9 16.172 9 19 9h.5"/><path d="M17 22c.607-.59 3-2.16 3-3s-2.393-2.41-3-3m2 3h-7"/></g></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;"><path fill="currentColor" d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17ZM18.41 14l.8.9-1.28 2.22-1.18-.24a3 3 0 0 0-3.45 2L12.92 20h-2.56L10 18.86a3 3 0 0 0-3.45-2l-1.18.24-1.3-2.21.8-.9a3 3 0 0 0 0-4l-.8-.9 1.28-2.2 1.18.24a3 3 0 0 0 3.45-2L10.36 4h2.56l.38 1.14a3 3 0 0 0 3.45 2l1.18-.24 1.28 2.22-.8.9a3 3 0 0 0 0 3.98m-6.77-6a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/></svg>`,
        aiIndicator: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" style="display: inline-block; vertical-align: middle;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m14.928 32.839l1.897 5.835a1 1 0 0 0 1.689.366l8.458-9.225" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M37.886 25.037s-1.06 5.617-7.329 5.617s-10.22-7.735-14.942-7.735c-5.578 0-7.043 4.682-7.043 7.735c0 2.606 1.384 3.665 3.216 3.665s5.252-3.095 6.718-4.683h8.1" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M15.615 22.919c0-2.687-2.158-4.764-5.537-4.764S4.5 19.825 4.5 24.547s4.083 5.658 4.083 5.658" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7.257 18.701c-1.275-3.362 1.884-6.653 6.77-6.653c7.41 0 8.081 12.03 15.186 12.03c5.904 0 9.863-7.657 7.166-12.07c-3.583-5.864-9.574-4.786-12.099-2.384" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M14.027 12.048c1.344-4.52 8.082-4.662 10.749-1.995s2.524 6.473-1.218 10.642m9.485 2.224c2.868 3.48 9.918 2.996 10.427-3.905s-5.533-6.79-6.74-6.328" stroke-width="1.5"/></svg>`,
        indexProject: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="currentColor"><path d="M12.5 16a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0"/><path d="M12.096 6.223A5 5 0 0 0 13 5.698V7c0 .289-.213.654-.753 1.007a4.5 4.5 0 0 1 1.753.25V4c0-1.007-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1s-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4v9c0 1.007.875 1.755 1.904 2.223C4.978 15.71 6.427 16 8 16c.536 0 1.058-.034 1.555-.097a4.5 4.5 0 0 1-.813-.927Q8.378 15 8 15c-1.464 0-2.766-.27-3.682-.687C3.356 13.875 3 13.373 3 13v-1.302c.271.202.58.378.904.525C4.978 12.71 6.427 13 8 13h.027a4.6 4.6 0 0 1 0-1H8c-1.464 0-2.766-.27-3.682-.687C3.356 10.875 3 10.373 3 10V8.698c.271.202.58.378.904.525C4.978 9.71 6.427 10 8 10q.393 0 .774-.024a4.5 4.5 0 0 1 1.102-1.132C9.298 8.944 8.666 9 8 9c-1.464 0-2.766-.27-3.682-.687C3.356 7.875 3 7.373 3 7V5.698c.271.202.58.378.904.525C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777M3 4c0-.374.356-.875 1.318-1.313C5.234 2.271 6.536 2 8 2s2.766.27 3.682.687C12.644 3.125 13 3.627 13 4c0 .374-.356.875-1.318 1.313C10.766 5.729 9.464 6 8 6s-2.766-.27-3.682-.687C3.356 4.875 3 4.373 3 4"/></g></svg>`,
        templates: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="currentColor" d="M31.5 23c-.827 0-1.5-.673-1.5-1.5V20c0-1.102-.897-2-2-2h-2v2h2v1.5c0 .98.407 1.864 1.058 2.5A3.5 3.5 0 0 0 28 26.5V28h-2v2h2c1.103 0 2-.897 2-2v-1.5c0-.827.673-1.5 1.5-1.5h.5v-2zM16 20v1.5c0 .827-.673 1.5-1.5 1.5H14v2h.5c.827 0 1.5.673 1.5 1.5V28c0 1.103.897 2 2 2h2v-2h-2v-1.5c0-.98-.407-1.864-1.058-2.5A3.5 3.5 0 0 0 18 21.5V20h2v-2h-2c-1.103 0-2 .898-2 2m12-5h2V5c0-1.103-.897-2-2-2h-3v2h3z"/><circle cx="23" cy="13" r="2" fill="currentColor"/><circle cx="16" cy="13" r="2" fill="currentColor"/><circle cx="9" cy="13" r="2" fill="currentColor"/><path fill="currentColor" d="M7 23H4c-1.103 0-2-.897-2-2V5c0-1.103.897-2 2-2h3v2H4v16h3z"/></svg>`,
        preferences: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="2"/><path d="M13 15c0 1.105 0 2-4 2s-4-.895-4-2s1.79-2 4-2s4 .895 4 2Z"/><path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12s0 5.657-1.172 6.828S17.771 20 14 20h-4c-3.771 0-5.657 0-6.828-1.172S2 15.771 2 12Z"/><path stroke-linecap="round" d="M19 12h-4m4-3h-5m5 6h-3"/></g></svg>`
    };

    // Function to inject custom SVG icons into navbar elements
    function injectCustomIcons() {
        const newChatBtn = document.querySelector('#createNewChat\\(\\)') || document.getElementById('createNewChat()');
        if (newChatBtn) {
            const existingIcon = newChatBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-plus-circle')) {
                existingIcon.outerHTML = CUSTOM_ICONS.newChat;
            } else if (!newChatBtn.querySelector('svg')) {
                newChatBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.newChat);
            }
        }

        const shareBtn = document.querySelector('#nav-share');
        if (shareBtn) {
            const existingIcon = shareBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-share-alt')) {
                existingIcon.outerHTML = CUSTOM_ICONS.share;
            } else if (!shareBtn.querySelector('svg')) {
                shareBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.share);
            }
        }

        const exportBtn = document.querySelector('#nav-export');
        if (exportBtn) {
            const existingIcon = exportBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-download')) {
                existingIcon.outerHTML = CUSTOM_ICONS.export;
            } else if (!exportBtn.querySelector('svg')) {
                exportBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.export);
            }
        }

        const settingsBtn = document.querySelector('#nav-settings');
        if (settingsBtn) {
            const existingIcon = settingsBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-cog')) {
                existingIcon.outerHTML = CUSTOM_ICONS.settings;
            } else if (!settingsBtn.querySelector('svg')) {
                settingsBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.settings);
            }
        }

        const indexBtn = document.querySelector('#index-project-btn');
        if (indexBtn) {
            const existingIcon = indexBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-database')) {
                existingIcon.outerHTML = CUSTOM_ICONS.indexProject;
            } else if (!indexBtn.querySelector('svg')) {
                indexBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.indexProject);
            }
        }

        const modelIndicator = document.querySelector('.model-indicator');
        if (modelIndicator) {
            const existingIcon = modelIndicator.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-microchip')) {
                existingIcon.outerHTML = CUSTOM_ICONS.aiIndicator;
            } else if (!modelIndicator.querySelector('svg')) {
                modelIndicator.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.aiIndicator);
            }
        }

        const templatesBtn = document.querySelector('#nav-templates');
        if (templatesBtn) {
            const existingIcon = templatesBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-scroll')) {
                existingIcon.outerHTML = CUSTOM_ICONS.templates;
            } else if (!templatesBtn.querySelector('svg')) {
                templatesBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.templates);
            }
        }

        // Preferences button icon
        const prefsBtn = document.querySelector('#nav-preferences');
        if (prefsBtn) {
            const existingIcon = prefsBtn.querySelector('i, svg');
            if (existingIcon && existingIcon.tagName === 'I' && existingIcon.classList.contains('fa-sliders-h')) {
                existingIcon.outerHTML = CUSTOM_ICONS.preferences;
            } else if (!prefsBtn.querySelector('svg')) {
                prefsBtn.insertAdjacentHTML('afterbegin', CUSTOM_ICONS.preferences);
            }
        }
    }

    function updateModelIndicator() {
        const modelIndicator = document.querySelector('.model-indicator');
        if (!modelIndicator) return;

        const modelNameSpan = modelIndicator.querySelector('span');
        if (modelNameSpan && window.CURRENT_MODEL_DISPLAY) {
            let shortName = window.CURRENT_MODEL_DISPLAY.split(' - ')[0];
            shortName = shortName.replace(/[🌟🔥⚡💎💻🚀👁️🐻🎯🧠]/g, '').trim();
            if (shortName.length > 18) {
                shortName = shortName.substring(0, 15) + '...';
            }
            modelNameSpan.textContent = shortName;
        }

        const modelBtn = document.getElementById('model-btn');
        if (modelBtn) {
            const newIndicator = modelIndicator.cloneNode(true);
            modelIndicator.parentNode.replaceChild(newIndicator, modelIndicator);
            newIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                modelBtn.click();
            });
            window.modelIndicatorElement = newIndicator;
        }
    }

    function loadTemplateManager() {
        if (typeof window.showTemplateManager === 'function') {
            window.showTemplateManager();
            return;
        }
        if (window.showToast) window.showToast("Loading Template Manager...", "info", 1000);
        const script = document.createElement('script');
        script.src = 'js/ui/template-manager.js';
        script.onload = () => {
            if (typeof window.showTemplateManager === 'function') {
                window.showTemplateManager();
            } else if (window.showToast) {
                window.showToast("Template Manager failed to load", "error");
            }
        };
        script.onerror = () => {
            if (window.showToast) window.showToast("Failed to load Template Manager", "error");
        };
        document.body.appendChild(script);
    }

    function loadPreferences() {
        if (typeof window.preferences?.showModal === 'function') {
            window.preferences.showModal();
            return;
        }
        if (window.showToast) window.showToast("Loading Preferences...", "info", 1000);
        const script = document.createElement('script');
        script.src = 'js/ui/preferences.js';
        script.onload = () => {
            if (typeof window.preferences?.showModal === 'function') {
                window.preferences.showModal();
            } else if (window.showToast) {
                window.showToast("Preferences failed to load", "error");
            }
        };
        script.onerror = () => {
            if (window.showToast) window.showToast("Failed to load Preferences", "error");
        };
        document.body.appendChild(script);
    }

    function initNavbar() {
        console.log("🔧 Initializing vertical navbar with Templates & Preferences buttons...");

        function safeAttach(selector, handler) {
            const element = document.querySelector(selector) || document.getElementById(selector.replace('#', ''));
            if (!element) {
                console.warn(`Navbar element not found: ${selector}`);
                return null;
            }
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            clone.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
            return clone;
        }

        // Ensure Templates button exists
        let templatesBtn = document.getElementById('nav-templates');
        const navbar = document.querySelector('.floating-navbar');
        if (!templatesBtn && navbar) {
            templatesBtn = document.createElement('button');
            templatesBtn.id = 'nav-templates';
            templatesBtn.className = 'nav-item';
            templatesBtn.title = 'Manage Templates';
            templatesBtn.innerHTML = `<i class="fas fa-scroll"></i><span>Templates</span>`;
            const settingsBtn = document.getElementById('nav-settings');
            if (settingsBtn) {
                navbar.insertBefore(templatesBtn, settingsBtn);
            } else {
                navbar.appendChild(templatesBtn);
            }
        }

        // Ensure Preferences button exists
        let prefsBtn = document.getElementById('nav-preferences');
        if (!prefsBtn && navbar) {
            prefsBtn = document.createElement('button');
            prefsBtn.id = 'nav-preferences';
            prefsBtn.className = 'nav-item';
            prefsBtn.title = 'User Preferences';
            prefsBtn.innerHTML = `<i class="fas fa-sliders-h"></i><span>Preferences</span>`;
            const settingsBtn = document.getElementById('nav-settings');
            if (settingsBtn) {
                navbar.insertBefore(prefsBtn, settingsBtn);
            } else {
                navbar.appendChild(prefsBtn);
            }
        }

        safeAttach('#createNewChat\\(\\)', () => {
            if (typeof window.createNewChat === 'function') {
                window.createNewChat();
            } else {
                console.error("createNewChat not found");
                if (window.showToast) window.showToast("Error: Chat function not ready", "error");
            }
        });

        safeAttach('#nav-share', async () => {
            if (!window.currentConversationId) {
                if (window.showToast) window.showToast("No active chat to share.", "info");
                return;
            }
            const url = window.location.href;
            try {
                await navigator.clipboard.writeText(url);
                if (window.showToast) window.showToast("Link copied to clipboard!", "success");
            } catch (err) {
                if (window.showToast) window.showToast("Failed to copy link.", "error");
            }
        });

        safeAttach('#nav-export', () => {
            if (typeof window.exportChat === 'function') {
                window.exportChat();
            } else {
                console.error("exportChat not found");
                if (window.showToast) window.showToast("Export function not ready", "error");
            }
        });

        safeAttach('#nav-settings', () => {
            if (typeof window.showSettingsPopup === 'function') {
                window.showSettingsPopup();
            } else {
                console.error("showSettingsPopup not found");
                if (window.showToast) window.showToast("Settings popup not available", "error");
            }
        });

        safeAttach('#index-project-btn', () => {
            if (typeof window.showRAGModal === 'function') {
                window.showRAGModal();
            } else {
                const script = document.createElement('script');
                script.src = 'js/ui/rag-manager.js';
                script.onload = () => {
                    if (window.showRAGModal) window.showRAGModal();
                    else if (window.showToast) window.showToast("RAG Manager failed to load", "error");
                };
                document.body.appendChild(script);
            }
        });

        // Templates button handler
        if (templatesBtn) {
            const newTemplatesBtn = templatesBtn.cloneNode(true);
            templatesBtn.parentNode.replaceChild(newTemplatesBtn, templatesBtn);
            newTemplatesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                loadTemplateManager();
            });
        }

        // Preferences button handler
        if (prefsBtn) {
            const newPrefsBtn = prefsBtn.cloneNode(true);
            prefsBtn.parentNode.replaceChild(newPrefsBtn, prefsBtn);
            newPrefsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                loadPreferences();
            });
        }

        injectCustomIcons();
        updateModelIndicator();
    }

    function initNavbarScrollEffect() {
        const navbar = document.querySelector('.floating-navbar');
        if (!navbar) return;
        
        const handleScroll = () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    if (window.switchModel) {
        originalSwitchModel = window.switchModel;
        window.switchModel = function(modelDisplayName) {
            const result = originalSwitchModel(modelDisplayName);
            if (result) {
                setTimeout(updateModelIndicator, 50);
            }
            return result;
        };
    }

    if (window.CURRENT_MODEL_DISPLAY) {
        let lastModel = window.CURRENT_MODEL_DISPLAY;
        setInterval(() => {
            if (window.CURRENT_MODEL_DISPLAY && window.CURRENT_MODEL_DISPLAY !== lastModel) {
                lastModel = window.CURRENT_MODEL_DISPLAY;
                updateModelIndicator();
            }
        }, 500);
    }

    window.initNavbar = initNavbar;
    window.initNavbarScrollEffect = initNavbarScrollEffect;
    window.updateModelIndicator = updateModelIndicator;
})();