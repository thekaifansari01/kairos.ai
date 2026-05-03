// js/ui/template-suggestions.js — Premium inline slash dropdown with perfect keyboard

(function() {
    let activeDropdown = null;
    let currentQuery = '';
    let selectedIndex = -1;
    let templates = [];
    let inputElement = null;
    let debounceTimer = null;
    
    function getTemplates() {
        return window.getPromptTemplates ? window.getPromptTemplates() : [];
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }
    
    function createDropdown() {
        const div = document.createElement('div');
        div.id = 'template-suggestions-dropdown';
        div.className = 'template-suggestions-dropdown';
        div.style.cssText = `
            position: absolute;
            bottom: calc(100% + 8px);
            left: 0;
            width: 460px;
            max-width: calc(100vw - 40px);
            background: var(--bg-sidebar, #0f0f13);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(6, 182, 212, 0.05) inset;
            backdrop-filter: blur(16px);
            z-index: 1100;
            overflow: hidden;
            animation: dropdownGlowIn 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
            font-family: inherit;
        `;
        return div;
    }
    
    function getFilteredTemplates() {
        if (!currentQuery) return templates;
        const lowerQuery = currentQuery.toLowerCase();
        return templates.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) || 
            t.content.toLowerCase().includes(lowerQuery)
        );
    }
    
    function renderSuggestions() {
        if (!activeDropdown) return;
        const filtered = getFilteredTemplates();
        
        if (filtered.length === 0) {
            activeDropdown.innerHTML = `
                <div class="suggestion-empty-state">
                    <div class="empty-icon">⌕</div>
                    <div class="empty-text">No templates match "${escapeHtml(currentQuery)}"</div>
                    <div class="empty-hint">Type / then template name</div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="suggestions-header">
                <span class="header-icon">⌨️</span>
                <span class="header-title">Prompt Templates</span>
                <span class="header-count">${filtered.length}</span>
            </div>
            <div class="suggestions-list">
        `;
        
        filtered.forEach((tmpl, idx) => {
            const isSelected = (idx === selectedIndex);
            let displayName = escapeHtml(tmpl.name);
            if (currentQuery) {
                const regex = new RegExp(`(${escapeRegex(currentQuery)})`, 'gi');
                displayName = displayName.replace(regex, `<mark>$1</mark>`);
            }
            html += `
                <div class="suggestion-item ${isSelected ? 'selected' : ''}" data-index="${idx}">
                    <div class="suggestion-icon">⎘</div>
                    <div class="suggestion-content">
                        <div class="suggestion-title">${displayName}</div>
                        <div class="suggestion-desc">${escapeHtml(tmpl.content.substring(0, 80))}${tmpl.content.length > 80 ? '…' : ''}</div>
                    </div>
                    <div class="suggestion-shortcut">↵</div>
                </div>
            `;
        });
        
        html += `</div><div class="suggestions-footer"><span class="footer-hint">↑ ↓ navigate • ↵ select • ⎋ esc • ⇥ tab</span></div>`;
        activeDropdown.innerHTML = html;
        
        if (selectedIndex >= 0) {
            const selectedEl = activeDropdown.querySelector(`.suggestion-item[data-index="${selectedIndex}"]`);
            if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
        }
        
        activeDropdown.querySelectorAll('.suggestion-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const idx = parseInt(el.getAttribute('data-index'), 10);
                const filteredNow = getFilteredTemplates();
                if (!isNaN(idx) && filteredNow[idx]) {
                    insertTemplateContent(filteredNow[idx].content);
                    closeDropdown();
                }
            });
        });
    }
    
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function insertTemplateContent(content) {
        if (!inputElement) return;
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        
        let lastSlashPos = -1;
        for (let i = cursorPos - 1; i >= 0; i--) {
            if (value[i] === '/') {
                if (i === 0 || value[i-1] === ' ' || value[i-1] === '\n') {
                    lastSlashPos = i;
                    break;
                }
            }
        }
        
        if (lastSlashPos !== -1) {
            const before = value.slice(0, lastSlashPos);
            const after = value.slice(cursorPos);
            const newValue = before + content + after;
            inputElement.value = newValue;
            const newCursorPos = before.length + content.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.focus();
            inputElement.style.height = 'auto';
            inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + 'px';
        }
    }
    
    function closeDropdown() {
        if (activeDropdown && activeDropdown.parentNode) {
            activeDropdown.remove();
        }
        activeDropdown = null;
        selectedIndex = -1;
        currentQuery = '';
    }
    
    function selectCurrentAndClose() {
        const filtered = getFilteredTemplates();
        if (filtered.length === 0) {
            closeDropdown();
            return;
        }
        let idx = selectedIndex;
        if (idx < 0 || idx >= filtered.length) idx = 0;
        if (filtered[idx]) {
            insertTemplateContent(filtered[idx].content);
        }
        closeDropdown();
    }
    
    function handleInput(e) {
        if (debounceTimer) clearTimeout(debounceTimer);
        const input = e.target;
        inputElement = input;
        const value = input.value;
        const cursorPos = input.selectionStart;
        
        let slashPos = -1;
        for (let i = cursorPos - 1; i >= 0; i--) {
            if (value[i] === '/') {
                if (i === 0 || value[i-1] === ' ' || value[i-1] === '\n') {
                    slashPos = i;
                    break;
                }
            }
        }
        
        if (slashPos !== -1) {
            const query = value.slice(slashPos + 1, cursorPos);
            currentQuery = query;
            templates = getTemplates();
            if (!templates.length) return;
            
            if (!activeDropdown) {
                activeDropdown = createDropdown();
                const wrapper = document.querySelector('.input-wrapper');
                if (wrapper) {
                    wrapper.style.position = 'relative';
                    wrapper.appendChild(activeDropdown);
                } else {
                    document.body.appendChild(activeDropdown);
                    const rect = input.getBoundingClientRect();
                    activeDropdown.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
                    activeDropdown.style.left = rect.left + 'px';
                }
            }
            debounceTimer = setTimeout(() => {
                renderSuggestions();
            }, 30);
            selectedIndex = -1;
        } else {
            closeDropdown();
        }
    }
    
    function handleKeydown(e) {
        if (!activeDropdown) return;
        
        const filtered = getFilteredTemplates();
        if (filtered.length === 0) {
            if (e.key === 'Escape') closeDropdown();
            return;
        }
        
        const itemsCount = filtered.length;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex = (selectedIndex + 1) % itemsCount;
            renderSuggestions();
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex = (selectedIndex - 1 + itemsCount) % itemsCount;
            renderSuggestions();
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            selectCurrentAndClose();
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            selectCurrentAndClose();
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
        }
    }
    
    function injectStyles() {
        if (document.getElementById('template-suggestions-styles')) return;
        const style = document.createElement('style');
        style.id = 'template-suggestions-styles';
        style.textContent = `
            @keyframes dropdownGlowIn {
                from { opacity: 0; transform: translateY(-10px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .template-suggestions-dropdown {
                font-family: var(--font-family, 'Poppins', system-ui);
                letter-spacing: -0.2px;
            }
            .suggestions-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: rgba(6, 182, 212, 0.06);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                color: var(--accent-cyan);
            }
            .header-icon { font-size: 0.9rem; opacity: 0.8; }
            .header-title { flex: 1; }
            .header-count {
                background: rgba(6, 182, 212, 0.15);
                padding: 2px 8px;
                border-radius: 20px;
                font-size: 0.65rem;
                font-weight: 500;
            }
            .suggestions-list {
                max-height: 340px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: var(--accent-cyan) rgba(255,255,255,0.05);
            }
            .suggestions-list::-webkit-scrollbar {
                width: 5px;
                height: 5px;
            }
            .suggestions-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
            }
            .suggestions-list::-webkit-scrollbar-thumb {
                background: var(--accent-cyan);
                border-radius: 10px;
            }
            .suggestions-list::-webkit-scrollbar-thumb:hover {
                background: #22d3ee;
            }
            .suggestion-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.12s ease;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            }
            .suggestion-item:last-child {
                border-bottom: none;
            }
            .suggestion-item:hover, .suggestion-item.selected {
                background: rgba(6, 182, 212, 0.1);
            }
            .suggestion-icon {
                font-size: 1rem;
                width: 24px;
                text-align: center;
                opacity: 0.7;
                font-family: monospace;
            }
            .suggestion-content {
                flex: 1;
                min-width: 0;
            }
            .suggestion-title {
                font-weight: 500;
                color: var(--text-primary);
                font-size: 0.9rem;
                margin-bottom: 2px;
            }
            .suggestion-title mark {
                background: rgba(6, 182, 212, 0.25);
                color: var(--accent-cyan);
                border-radius: 4px;
                padding: 0 2px;
            }
            .suggestion-desc {
                font-size: 0.7rem;
                color: var(--text-muted);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .suggestion-shortcut {
                font-size: 0.65rem;
                color: var(--text-muted);
                background: rgba(255, 255, 255, 0.05);
                padding: 2px 8px;
                border-radius: 20px;
                font-family: monospace;
            }
            .suggestions-footer {
                padding: 8px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                background: rgba(0, 0, 0, 0.25);
                font-size: 0.65rem;
                color: var(--text-muted);
                text-align: center;
            }
            .footer-hint {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-family: monospace;
            }
            .suggestion-empty-state {
                padding: 28px 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            .empty-icon {
                font-size: 1.8rem;
                opacity: 0.4;
                font-family: monospace;
            }
            .empty-text {
                font-size: 0.85rem;
                color: var(--text-muted);
            }
            .empty-hint {
                font-size: 0.7rem;
                color: var(--text-muted);
                opacity: 0.6;
            }
        `;
        document.head.appendChild(style);
    }
    
    function init() {
        injectStyles();
        const input = document.getElementById('user-input');
        if (!input) return;
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeydown);
        input.addEventListener('blur', () => setTimeout(() => closeDropdown(), 200));
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();