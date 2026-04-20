// js/ui/modal.js — Global custom modal system
// FIXED: showPromptInternal now captures input value correctly

const Modal = (function() {
    let activeResolve = null;
    let activeReject = null;
    let zIndexFixed = false;

    function fixZIndex() {
        if (zIndexFixed) return;
        const style = document.createElement('style');
        style.textContent = `
            .global-modal {
                z-index: 10000 !important;
            }
            .global-modal .modal-overlay {
                z-index: 10000 !important;
            }
            .global-modal .modal-container {
                z-index: 10001 !important;
            }
        `;
        document.head.appendChild(style);
        zIndexFixed = true;
    }

    function getModalElements() {
        let modal = document.getElementById('global-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'global-modal';
            modal.className = 'global-modal hidden';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 id="modal-title">Modal Title</h3>
                        <button class="modal-close-btn" id="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body" id="modal-body"></div>
                    <div class="modal-footer" id="modal-footer"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        const footerEl = document.getElementById('modal-footer');
        const closeBtn = document.getElementById('modal-close-btn');
        const overlay = modal.querySelector('.modal-overlay');
        return { modal, titleEl, bodyEl, footerEl, closeBtn, overlay };
    }

    function hide() {
        const { modal } = getModalElements();
        if (modal) modal.classList.add('hidden');
        document.removeEventListener('keydown', escapeHandler);
        activeResolve = null;
        activeReject = null;
    }

    function escapeHandler(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (activeResolve) {
                activeResolve(null);
                hide();
            }
        }
    }

    function show(options) {
        fixZIndex();
        return new Promise((resolve, reject) => {
            const { modal, titleEl, bodyEl, footerEl, closeBtn, overlay } = getModalElements();
            if (!modal) {
                reject(new Error("Modal element not found"));
                return;
            }

            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }

            activeResolve = resolve;
            activeReject = reject;

            titleEl.textContent = options.title || 'Confirm';

            if (typeof options.body === 'string') {
                bodyEl.innerHTML = options.body;
            } else if (options.body instanceof HTMLElement) {
                bodyEl.innerHTML = '';
                bodyEl.appendChild(options.body);
            } else {
                bodyEl.innerHTML = '';
            }

            footerEl.innerHTML = '';
            const buttons = options.buttons || [];

            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn.label;
                button.className = `modal-btn ${btn.className || ''}`;
                if (btn.disabled) button.disabled = true;
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    let returnValue = btn.value !== undefined ? btn.value : true;
                    
                    // ✅ FIX: For prompt modal, capture current input value if present
                    if (btn.label === 'Save' && btn.value === null) {
                        const inputElem = bodyEl.querySelector('input, textarea');
                        if (inputElem) {
                            returnValue = inputElem.value;
                        }
                    }
                    
                    if (activeResolve) activeResolve(returnValue);
                    hide();
                });
                footerEl.appendChild(button);
            });

            if (buttons.length === 0) {
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.className = 'modal-btn modal-btn-cancel';
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (activeResolve) activeResolve(null);
                    hide();
                });
                footerEl.appendChild(cancelBtn);
            }

            const closeHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (activeResolve) activeResolve(null);
                hide();
            };
            if (closeBtn) {
                closeBtn.onclick = closeHandler;
            }
            if (overlay) {
                overlay.onclick = closeHandler;
            }

            modal.classList.remove('hidden');
            document.addEventListener('keydown', escapeHandler);

            const firstInput = bodyEl.querySelector('input, textarea');
            if (firstInput) firstInput.focus();
        });
    }

    async function showConfirm(message, title = 'Confirm') {
        const result = await show({
            title: title,
            body: `<p style="margin: 0; line-height: 1.4;">${escapeHtml(message)}</p>`,
            buttons: [
                { label: 'Cancel', className: 'modal-btn-cancel', value: false },
                { label: 'Yes', className: 'modal-btn-primary', value: true }
            ]
        });
        return result === true;
    }

    // ✅ FIXED: Save button now returns input value correctly
    async function showPromptInternal(message, defaultValue = '', title = 'Input') {
        const container = document.createElement('div');
        const messageP = document.createElement('p');
        messageP.textContent = message;
        messageP.style.marginBottom = '12px';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue;
        input.placeholder = 'Type here...';
        container.appendChild(messageP);
        container.appendChild(input);

        const result = await show({
            title: title,
            body: container,
            buttons: [
                { label: 'Cancel', className: 'modal-btn-cancel', value: null },
                { label: 'Save', className: 'modal-btn-primary', value: null } // value null, will be captured
            ]
        });
        // result will be either null (Cancel) or the input value
        if (result !== null && result !== undefined) {
            return result;
        }
        return null;
    }

    async function showRenameModal(currentTitle) {
        return await showPromptInternal('Enter new title for this chat:', currentTitle, 'Rename Chat');
    }

    async function showDeleteConfirm(chatTitle = 'this chat') {
        return await showConfirm(`Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`, 'Delete Chat');
    }

    async function showClearAllConfirm() {
        return await showConfirm('⚠️ This will permanently delete ALL your chats. This cannot be undone. Are you absolutely sure?', 'Clear All Chats');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    return {
        show,
        showConfirm,
        showPrompt: showPromptInternal,
        showRenameModal,
        showDeleteConfirm,
        showClearAllConfirm
    };
})();

window.Modal = Modal;