// js/ui/rag-manager.js
// RAG Management Modal – Fixed folder reading (recursive readEntries loop)
// Added Modal confirm instead of native confirm

(function() {
    if (window._ragModalActive) return;
    
    if (!document.getElementById('rag-modal-css')) {
        const link = document.createElement('link');
        link.id = 'rag-modal-css';
        link.rel = 'stylesheet';
        link.href = 'chatui/rag-modal.css';
        document.head.appendChild(link);
    }
    
    const ALLOWED_EXTENSIONS = /\.(txt|js|py|html|css|json|md|xml|sh|log|csv|yaml|yml|ini|conf|cfg|env|gitignore|dockerignore|editorconfig|prettierrc|eslintrc|babelrc|npmrc|lock)$/i;
    const ALLOWED_MIME_TYPES = [
        'text/plain', 'text/javascript', 'text/html', 'text/css', 'text/x-python',
        'application/json', 'text/markdown', 'text/xml', 'application/xml',
        'text/x-sh', 'text/csv'
    ];
    const EXCLUDED_DIRS = new Set([
        'node_modules', '.git', '.venv', 'venv', '__pycache__', 
        'dist', 'build', '.cache', '.next', 'coverage', 
        '.idea', '.vscode', '.vs', 'vendor', 'bower_components'
    ]);
    const MAX_INDEX_FILE_SIZE = 10 * 1024 * 1024;
    const MAX_FILES_PER_FOLDER = 2000;
    const WARNING_FILE_COUNT = 500;
    
    function isAllowedFile(file) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) return false;
        if (ALLOWED_EXTENSIONS.test(file.name)) return true;
        if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
        return false;
    }
    
    // ✅ FIXED: Proper recursive directory reading (handles readEntries in loop)
    async function readAllFilesFromDirectory(entry, maxFiles = MAX_FILES_PER_FOLDER) {
        const files = [];
        const queue = [{ entry, path: '' }];
        let fileCount = 0;
        
        while (queue.length && fileCount < maxFiles) {
            const { entry, path } = queue.shift();
            const currentPath = path ? `${path}/${entry.name}` : entry.name;
            
            if (entry.isFile) {
                const file = await new Promise(resolve => entry.file(resolve));
                files.push(file);
                fileCount++;
            } else if (entry.isDirectory) {
                if (EXCLUDED_DIRS.has(entry.name)) continue;
                const reader = entry.createReader();
                // ✅ FIX: readEntries may return partial results, loop until empty
                let entries = [];
                let batch;
                do {
                    batch = await new Promise((resolve) => reader.readEntries(resolve));
                    entries = entries.concat(batch);
                } while (batch.length > 0);
                
                for (const subEntry of entries) {
                    queue.push({ entry: subEntry, path: currentPath });
                }
            }
        }
        return files;
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
    
    function showRAGModal() {
        if (window._ragModalActive) return;
        window._ragModalActive = true;
        
        const overlay = document.createElement('div');
        overlay.className = 'rag-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'rag-modal';
        
        modal.innerHTML = `
            <div class="rag-modal-header">
                <h3><i class="fas fa-database"></i> Code Index Manager</h3>
                <button class="rag-modal-close">&times;</button>
            </div>
            <div class="rag-modal-body">
                <div class="rag-section">
                    <div class="rag-toggle-row">
                        <label class="rag-switch">
                            <input type="checkbox" id="rag-toggle-checkbox" ${localStorage.getItem('ragEnabled') !== 'false' ? 'checked' : ''}>
                            <span class="rag-slider"></span>
                        </label>
                        <span>Enable RAG (code context)</span>
                        <span class="rag-info">🔍 Search indexed code during chat</span>
                    </div>
                </div>
                
                <div class="rag-section">
                    <div class="rag-dropzone" id="rag-dropzone">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Drag & drop files or folder here</p>
                        <p class="rag-small">
                            <button id="rag-select-files-btn" class="rag-btn-small">Browse files</button> 
                            <button id="rag-select-folder-btn" class="rag-btn-small">Browse folder</button>
                        </p>
                    </div>
                    <div id="rag-progress-area" style="display: none;">
                        <div class="rag-progress-bar">
                            <div class="rag-progress-fill"></div>
                        </div>
                        <div class="rag-progress-text" id="rag-progress-text">Preparing...</div>
                    </div>
                </div>
                
                <div class="rag-section">
                    <div class="rag-stats-header">
                        <span><i class="fas fa-file-code"></i> Indexed Files (<span id="rag-file-count">0</span>)</span>
                        <button id="rag-clear-all" class="rag-btn-danger">Clear All</button>
                    </div>
                    <div id="rag-files-list" class="rag-files-list">
                        <div class="rag-loading">Loading...</div>
                    </div>
                </div>
            </div>
            <div class="rag-modal-footer">
                <button id="rag-close-btn" class="rag-btn-secondary">Close</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const closeModal = () => {
            if (overlay && overlay.parentNode) overlay.remove();
            window._ragModalActive = false;
        };
        
        modal.querySelector('.rag-modal-close').onclick = closeModal;
        modal.querySelector('#rag-close-btn').onclick = closeModal;
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
        
        const toggleCheckbox = modal.querySelector('#rag-toggle-checkbox');
        toggleCheckbox.addEventListener('change', (e) => {
            localStorage.setItem('ragEnabled', e.target.checked);
            if (window.showToast) window.showToast(e.target.checked ? "RAG enabled" : "RAG disabled", "info", 1500);
        });
        
        async function refreshFileList() {
            const container = modal.querySelector('#rag-files-list');
            const countSpan = modal.querySelector('#rag-file-count');
            if (!window.RAGEmbeddings) {
                container.innerHTML = '<div class="rag-error">RAG system not loaded. Please refresh.</div>';
                return;
            }
            try {
                const files = await window.RAGEmbeddings.getAllIndexedFiles();
                countSpan.textContent = files.length;
                if (files.length === 0) {
                    container.innerHTML = '<div class="rag-empty">No files indexed. Drop some files above.</div>';
                    return;
                }
                let html = '';
                for (const file of files) {
                    const shortName = file.path.split('/').pop();
                    html += `
                        <div class="rag-file-item" data-filepath="${escapeHtml(file.path)}">
                            <span class="rag-file-name" title="${escapeHtml(file.path)}">📄 ${escapeHtml(shortName)}</span>
                            <span class="rag-file-chunks">${file.chunks} chunks</span>
                            <button class="rag-delete-file" data-filepath="${escapeHtml(file.path)}">🗑️</button>
                        </div>
                    `;
                }
                container.innerHTML = html;
                container.querySelectorAll('.rag-delete-file').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const filePath = btn.getAttribute('data-filepath');
                        const confirmed = await window.Modal.showConfirm(`Delete "${filePath}" from index?`, 'Delete File');
                        if (confirmed) {
                            await window.RAGEmbeddings.deleteFileFromIndex(filePath);
                            refreshFileList();
                            if (window.updateIndexStatsUI) window.updateIndexStatsUI();
                        }
                    });
                });
            } catch (err) {
                console.error(err);
                container.innerHTML = '<div class="rag-error">Error loading files</div>';
            }
        }
        
        function showProgress(show, current = 0, total = 0, fileName = '') {
            const area = modal.querySelector('#rag-progress-area');
            const fill = modal.querySelector('.rag-progress-fill');
            const text = modal.querySelector('#rag-progress-text');
            if (show) {
                area.style.display = 'block';
                if (total > 0) {
                    const percent = (current / total) * 100;
                    fill.style.width = percent + '%';
                    text.textContent = `${fileName} (${current}/${total})`;
                } else {
                    fill.style.width = '0%';
                    text.textContent = fileName || 'Preparing...';
                }
            } else {
                area.style.display = 'none';
                fill.style.width = '0%';
            }
        }
        
        async function indexFiles(filesOrItems) {
            showProgress(true, 0, 0, 'Reading files...');
            let fileList = [];
            if (filesOrItems.length && filesOrItems[0] instanceof File) {
                fileList = Array.from(filesOrItems);
            } else if (filesOrItems.length && filesOrItems[0]?.webkitGetAsEntry) {
                const entries = [];
                for (let i = 0; i < filesOrItems.length; i++) {
                    const entry = filesOrItems[i].webkitGetAsEntry();
                    if (entry) entries.push(entry);
                }
                showProgress(true, 0, 0, 'Scanning folder...');
                fileList = await readAllFilesFromDirectory(entries, MAX_FILES_PER_FOLDER);
            }
            
            if (fileList.length === 0) {
                showProgress(false);
                if (window.showToast) window.showToast("No valid files found", "error");
                return;
            }
            
            if (fileList.length > WARNING_FILE_COUNT) {
                const proceed = await window.Modal.showConfirm(
                    `⚠️ Folder contains ${fileList.length} files. Indexing may take several minutes. Continue?`,
                    'Large Folder Warning'
                );
                if (!proceed) {
                    showProgress(false);
                    return;
                }
            }
            
            const validFiles = [];
            for (const file of fileList) {
                if (file.size > MAX_INDEX_FILE_SIZE) {
                    if (window.showToast) window.showToast(`⚠️ Skipping ${file.name} (>10MB)`, "warning", 1000);
                    continue;
                }
                if (isAllowedFile(file)) validFiles.push(file);
                else if (window.showToast) window.showToast(`⚠️ Skipping ${file.name} (unsupported)`, "warning", 1000);
            }
            if (validFiles.length === 0) {
                showProgress(false);
                if (window.showToast) window.showToast("No supported files", "error");
                return;
            }
            
            showProgress(true, 0, validFiles.length, 'Starting...');
            let successCount = 0;
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                showProgress(true, i, validFiles.length, `Indexing: ${file.name}`);
                const content = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsText(file);
                });
                if (content) {
                    await window.RAGEmbeddings.indexCodeFiles(
                        [{ name: file.name, content, size: file.size }],
                        (percent, total, status) => {
                            showProgress(true, i, validFiles.length, `${file.name} (${Math.round(percent)}%)`);
                        }
                    );
                    successCount++;
                }
                await new Promise(r => setTimeout(r, 30));
            }
            showProgress(false);
            if (window.showToast) window.showToast(`Indexed ${successCount} files`, "success");
            refreshFileList();
            if (window.updateIndexStatsUI) window.updateIndexStatsUI();
        }
        
        const dropzone = modal.querySelector('#rag-dropzone');
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('rag-drag-over');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('rag-drag-over');
        });
        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzone.classList.remove('rag-drag-over');
            const items = e.dataTransfer.items;
            if (items) {
                const entries = [];
                for (let i = 0; i < items.length; i++) {
                    const entry = items[i].webkitGetAsEntry();
                    if (entry) entries.push(entry);
                }
                await indexFiles(entries);
            } else {
                await indexFiles(e.dataTransfer.files);
            }
        });
        
        modal.querySelector('#rag-select-files-btn').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.txt,.js,.py,.html,.css,.json,.md,.xml,.sh,.log,.csv';
            input.onchange = async (e) => {
                if (e.target.files.length) await indexFiles(e.target.files);
            };
            input.click();
        };
        
        modal.querySelector('#rag-select-folder-btn').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;
            input.directory = true;
            input.onchange = async (e) => {
                if (e.target.files.length) await indexFiles(e.target.files);
            };
            input.click();
        };
        
        modal.querySelector('#rag-clear-all').onclick = async () => {
            const confirmed = await window.Modal.showConfirm(
                '⚠️ Delete ALL indexed files? This cannot be undone.',
                'Clear All Indexed Files'
            );
            if (confirmed) {
                await window.RAGEmbeddings.clearIndex();
                if (window.showToast) window.showToast("All indexed files cleared", "success");
                refreshFileList();
                if (window.updateIndexStatsUI) window.updateIndexStatsUI();
            }
        };
        
        refreshFileList();
    }
    
    window.showRAGModal = showRAGModal;
})();