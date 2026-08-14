// js/ui/template-manager.js — Premium UI, smooth animations, glassmorphism

(function() {
    const STORAGE_KEY = 'kairos_templates';
    
    const DEFAULT_TEMPLATES = [
        { id: '1', name: 'Explain Code', content: 'Explain this code like I\'m 5 years old:\n\n```\n{code}\n```' },
        { id: '2', name: 'Security Audit', content: 'Analyze this code for security vulnerabilities. List issues with severity levels.' },
        { id: '3', name: 'Unit Tests', content: 'Generate comprehensive unit tests for this function using Jest/Pytest.' },
        { id: '4', name: 'Documentation', content: 'Write clear documentation for this code, including parameters, return values, and examples.' },
        { id: '5', name: 'Refactor Suggestion', content: 'Suggest improvements to make this code more readable and maintainable.' }
    ];
    
    function loadTemplates() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); }
            catch(e) { return [...DEFAULT_TEMPLATES]; }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
        return [...DEFAULT_TEMPLATES];
    }
    
    function saveTemplates(templates) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }
    
    // Premium form modal (using global Modal)
    function showTemplateForm(template = null, onSave) {
        const isEdit = !!template;
        const title = isEdit ? '✏️ Edit Template' : '✨ Create Template';
        const nameValue = template ? template.name : '';
        const contentValue = template ? template.content : '';
        
        const formHtml = `
            <div class="template-form">
                <div class="form-field">
                    <label>Template Name</label>
                    <input type="text" id="template-name-input" value="${escapeHtml(nameValue)}" placeholder="e.g., Explain Code" autocomplete="off">
                </div>
                <div class="form-field">
                    <label>Template Content</label>
                    <textarea id="template-content-input" rows="6" placeholder="Write your prompt template...">${escapeHtml(contentValue)}</textarea>
                </div>
            </div>
        `;
        
        if (window.Modal && typeof window.Modal.show === 'function') {
            window.Modal.show({
                title: title,
                body: formHtml,
                buttons: [
                    { label: 'Cancel', className: 'modal-btn-cancel', value: null },
                    { label: 'Save', className: 'modal-btn-primary', value: 'save' }
                ]
            }).then(result => {
                if (result === 'save') {
                    const nameInput = document.getElementById('template-name-input');
                    const contentInput = document.getElementById('template-content-input');
                    const newName = nameInput?.value.trim() || '';
                    const newContent = contentInput?.value.trim() || '';
                    if (!newName || !newContent) {
                        if (window.showToast) window.showToast('Name and content are required', 'error');
                        return;
                    }
                    onSave({ name: newName, content: newContent });
                }
            });
        } else {
            // Fallback
            const newName = prompt('Template name:', nameValue);
            if (newName) {
                const newContent = prompt('Template content:', contentValue);
                if (newContent) onSave({ name: newName, content: newContent });
            }
        }
    }
    
    // Inject global styles for template manager (once)
    function injectStyles() {
        if (document.getElementById('template-manager-styles')) return;
        const style = document.createElement('style');
        style.id = 'template-manager-styles';
        style.textContent = `
            .template-manager-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(12px);
                z-index: 3000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease;
            }
            .template-manager-modal {
                background: var(--bg-sidebar, #0f0f13);
                border-radius: 32px;
                width: 90%;
                max-width: 720px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                animation: modalSlideUp 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
                overflow: hidden;
            }
            .template-manager-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.25rem 1.75rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                background: rgba(0, 0, 0, 0.2);
            }
            .template-manager-header h3 {
                margin: 0;
                font-size: 1.35rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--text-primary);
            }
            .template-manager-close {
                background: rgba(255, 255, 255, 0.05);
                border: none;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                font-size: 1.4rem;
                cursor: pointer;
                color: var(--text-muted);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .template-manager-close:hover {
                background: rgba(255, 255, 255, 0.12);
                color: white;
                transform: scale(1.02);
            }
            .template-manager-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 1.25rem;
            }
            .template-add-btn {
                background: rgba(6, 182, 212, 0.08);
                border: 1px solid rgba(6, 182, 212, 0.3);
                color: var(--accent-cyan);
                padding: 10px 18px;
                border-radius: 40px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
            }
            .template-add-btn:hover {
                background: rgba(6, 182, 212, 0.15);
                border-color: var(--accent-cyan);
                transform: translateY(-1px);
            }
            .template-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 50vh;
                overflow-y: auto;
                padding-right: 4px;
            }
            .template-item {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 20px;
                padding: 14px 18px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                transition: all 0.2s;
            }
            .template-item:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(6, 182, 212, 0.3);
                transform: translateX(2px);
            }
            .template-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .template-name {
                font-weight: 600;
                color: var(--accent-cyan);
                font-size: 1rem;
            }
            .template-actions {
                display: flex;
                gap: 8px;
            }
            .template-edit, .template-delete {
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px 10px;
                border-radius: 30px;
                font-size: 0.8rem;
                transition: all 0.15s;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .template-edit {
                color: var(--text-muted);
            }
            .template-edit:hover {
                background: rgba(255, 255, 255, 0.08);
                color: var(--accent-cyan);
            }
            .template-delete {
                color: #f87171;
            }
            .template-delete:hover {
                background: rgba(239, 68, 68, 0.15);
                color: #ff9b9b;
            }
            .template-preview {
                font-size: 0.8rem;
                color: var(--text-muted);
                white-space: pre-wrap;
                word-break: break-word;
                max-height: 80px;
                overflow-y: auto;
                line-height: 1.4;
                padding-left: 4px;
                border-left: 2px solid rgba(6, 182, 212, 0.3);
            }
            .template-empty {
                text-align: center;
                padding: 2.5rem;
                color: var(--text-muted);
                font-style: italic;
            }
            .template-manager-footer {
                padding: 1rem 1.75rem;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                justify-content: flex-end;
                background: rgba(0, 0, 0, 0.15);
            }
            .template-close-btn {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 8px 28px;
                border-radius: 40px;
                cursor: pointer;
                color: var(--text-primary);
                transition: all 0.2s;
            }
            .template-close-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                transform: translateY(-1px);
            }
            /* Form styles inside modal */
            .template-form {
                display: flex;
                flex-direction: column;
                gap: 18px;
            }
            .form-field label {
                display: block;
                margin-bottom: 8px;
                font-size: 0.85rem;
                font-weight: 500;
                color: var(--text-muted);
            }
            .form-field input, .form-field textarea {
                width: 100%;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                color: var(--text-primary);
                font-size: 0.9rem;
                font-family: inherit;
                transition: all 0.2s;
            }
            .form-field input:focus, .form-field textarea:focus {
                outline: none;
                border-color: var(--accent-cyan);
                background: rgba(6, 182, 212, 0.05);
            }
            .form-field textarea {
                resize: vertical;
                font-family: monospace;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    window.showTemplateManager = function() {
        if (document.getElementById('template-manager-overlay')) return;
        injectStyles();
        
        let templates = loadTemplates();
        
        const overlay = document.createElement('div');
        overlay.id = 'template-manager-overlay';
        overlay.className = 'template-manager-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'template-manager-modal';
        
        // Header
        const header = document.createElement('div');
        header.className = 'template-manager-header';
        header.innerHTML = `
            <h3><i class="fas fa-scroll"></i> Manage Templates</h3>
            <button class="template-manager-close">&times;</button>
        `;
        
        // Body
        const body = document.createElement('div');
        body.className = 'template-manager-body';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'template-add-btn';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Create New Template';
        
        const listContainer = document.createElement('div');
        listContainer.className = 'template-list';
        
        function renderList() {
            listContainer.innerHTML = '';
            if (templates.length === 0) {
                listContainer.innerHTML = '<div class="template-empty">✨ No templates yet. Create one!</div>';
                return;
            }
            templates.forEach(tmpl => {
                const item = document.createElement('div');
                item.className = 'template-item';
                item.innerHTML = `
                    <div class="template-item-header">
                        <span class="template-name">${escapeHtml(tmpl.name)}</span>
                        <div class="template-actions">
                            <button class="template-edit" data-id="${tmpl.id}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="template-delete" data-id="${tmpl.id}"><i class="fas fa-trash"></i> Delete</button>
                        </div>
                    </div>
                    <div class="template-preview">${escapeHtml(tmpl.content.substring(0, 150))}${tmpl.content.length > 150 ? '…' : ''}</div>
                `;
                listContainer.appendChild(item);
            });
            
            // Attach events
            listContainer.querySelectorAll('.template-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.getAttribute('data-id');
                    const template = templates.find(t => t.id === id);
                    if (template) {
                        showTemplateForm(template, (updated) => {
                            template.name = updated.name;
                            template.content = updated.content;
                            saveTemplates(templates);
                            renderList();
                            if (window.showToast) window.showToast('Template updated', 'success');
                        });
                    }
                });
            });
            listContainer.querySelectorAll('.template-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Delete this template?')) {
                        templates = templates.filter(t => t.id !== id);
                        saveTemplates(templates);
                        renderList();
                        if (window.showToast) window.showToast('Template deleted', 'info');
                    }
                });
            });
        }
        
        addBtn.onclick = () => {
            showTemplateForm(null, (newTemplate) => {
                const newId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4);
                templates.push({ id: newId, name: newTemplate.name, content: newTemplate.content });
                saveTemplates(templates);
                renderList();
                if (window.showToast) window.showToast('Template created', 'success');
            });
        };
        
        body.appendChild(addBtn);
        body.appendChild(listContainer);
        
        // Footer
        const footer = document.createElement('div');
        footer.className = 'template-manager-footer';
        const closeFooterBtn = document.createElement('button');
        closeFooterBtn.className = 'template-close-btn';
        closeFooterBtn.textContent = 'Close';
        closeFooterBtn.onclick = () => overlay.remove();
        footer.appendChild(closeFooterBtn);
        
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close handlers
        header.querySelector('.template-manager-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        
        renderList();
    };
    
    window.getPromptTemplates = function() {
        return loadTemplates();
    };
})();