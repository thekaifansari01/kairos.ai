// js/modules/history/history-helpers.js
// Helper functions - no Firestore dependency

export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function cleanUserMessageForDisplay(content) {
    if (!content) return '';
    if (content.startsWith('📎')) {
        const parts = content.split('\n\n');
        if (parts.length > 1) {
            return parts.slice(1).join('\n\n').trim() || '(Sent files)';
        }
        return '(Sent files)';
    }
    if (content.includes('[Attached file:')) {
        const parts = content.split('---');
        let lastPart = parts[parts.length - 1].trim();
        return lastPart || '(Attached files)';
    }
    return content;
}

// Custom SVG for Delete button
const DELETE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="M22.049 7.077a4 4 0 0 1-1.001 0c-.85-.09-1.822-.31-2.573-.38a62 62 0 0 0-4.764-.3c-1.612-.03-3.203 0-4.765.11l-4.614.31a.31.31 0 0 0 .12-.26c.12 0 .12-.5.14-.56q.114-.321.32-.591a1 1 0 0 1 .46-.34q1.186-.38 2.413-.591a26.5 26.5 0 0 1 3.734-.35c1.436-.1 2.878-.1 4.314 0c.948.055 1.887.21 2.803.46a.59.59 0 0 1 .35.37q.125.393.17.801a.36.36 0 0 0 .39.29a.34.34 0 0 0 .29-.39a3.8 3.8 0 0 0-.23-1.151a1.23 1.23 0 0 0-.73-.68a14.2 14.2 0 0 0-3.003-.701s-.58-1.512-.59-1.522A3.8 3.8 0 0 0 14.21.411a2.64 2.64 0 0 0-1.651-.4a5.1 5.1 0 0 0-1.522.36c-.507.221-.95.565-1.291 1a7.6 7.6 0 0 0-.66 1.843c-.281 0-.581.08-.862.14a15.3 15.3 0 0 0-3.143 1a1.85 1.85 0 0 0-.64.491c-.224.3-.387.64-.48 1.001q-.092.346-.14.7a.38.38 0 0 0 .09.281l.07.02c-3.544.25-2.273.831-2.003.821q.339-.02.671-.08h6.336c1.301 0 2.623-.06 3.954-.07h2.643c1 0 1.891 0 2.822.06c.741 0 1.722.19 2.573.24c.399.048.802.048 1.201 0a.34.34 0 0 0 .28-.39a.352.352 0 0 0-.41-.35m-11.59-5.065a2.5 2.5 0 0 1 .77-.47a4.8 4.8 0 0 1 1.442-.341a1.63 1.63 0 0 1 1 .15c.344.198.649.456.902.76c.05.07.27.591.44.942a30 30 0 0 0-3.543-.04c-.48 0-.971 0-1.482.07c.23-.37.38-1.011.47-1.071m10.191 6.646a.31.31 0 0 0-.43 0a.32.32 0 0 0 0 .38v.37a39 39 0 0 1-.571 4.765c-.34 2.062-.751 4.164-1.061 5.235c-.14.491-.24 1.001-.41 1.482c-.092.28-.227.544-.401.78c-.41.492-.975.827-1.602.952a9 9 0 0 1-3.153.21c-1.421-.15-3.003 0-4.434-.19a4.7 4.7 0 0 1-1.602-.52a1.83 1.83 0 0 1-.64-.842a8 8 0 0 1-.591-1.882c-.15-.83-.33-1.871-.51-3.002c-.42-2.663-.861-5.706-1.062-7.007a.36.36 0 0 0-.39-.3a.35.35 0 0 0-.29.39c.16 1.321.51 4.364.86 7.007c.14 1.13.28 2.192.411 3.003a9.3 9.3 0 0 0 .61 2.162a2.93 2.93 0 0 0 1.022 1.381a5.6 5.6 0 0 0 2.002.68c1.461.25 3.003.07 4.494.23a10 10 0 0 0 3.593-.27a4 4 0 0 0 2.183-1.41c.22-.339.392-.706.51-1.092c.16-.5.25-1 .38-1.551a71 71 0 0 0 1.112-7.538c.124-.996.175-2 .15-3.003a.8.8 0 0 0-.18-.42"/><path d="M9.256 16.156c.14.841.31 1.582.42 2.112c.07.34.12.591.14.711c.061.3.321.26.511.17a.23.23 0 0 0 .16-.1v-.79c0-.541 0-1.302-.11-2.153c0-.46-.09-.94-.16-1.421c0-.24-.06-.48-.11-.71c-.2-1.122-.46-2.143-.61-2.814a.302.302 0 1 0-.601.08c0 .681 0 1.742.11 2.873c0 .24 0 .47.07.711c.03.39.1.87.18 1.331m5.586 2.813a.34.34 0 0 0 .34-.34c.05-.61.22-1.542.33-2.563c.07-.56.13-1.15.15-1.711c.06-1.352 0-2.523 0-2.913a.31.31 0 0 0-.508-.247a.3.3 0 0 0-.102.207c-.06.35-.29 1.32-.46 2.502c-.05.34-.08.71-.11 1.071c-.03.36 0 .73 0 1.091c0 1.001 0 1.952.08 2.563a.34.34 0 0 0 .28.34"/></g></svg>`;

// Custom SVG for Rename button
const RENAME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m15 16l-4 4h10v-4zm-2.94-8.81L3 16.25V20h3.75l9.06-9.06zm6.65.85c.39-.39.39-1.04 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/></svg>`;

// File icon based on extension
export function getFileIcon(ext) {
    const icons = {
        py: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#0288d1" d="M9.86 2A2.86 2.86 0 0 0 7 4.86v1.68h4.29c.39 0 .71.57.71.96H4.86A2.86 2.86 0 0 0 2 10.36v3.781a2.86 2.86 0 0 0 2.86 2.86h1.18v-2.68a2.85 2.85 0 0 1 2.85-2.86h5.25c1.58 0 2.86-1.271 2.86-2.851V4.86A2.86 2.86 0 0 0 14.14 2zm-.72 1.61c.4 0 .72.12.72.71s-.32.891-.72.891c-.39 0-.71-.3-.71-.89s.32-.711.71-.711"/><path fill="#fdd835" d="M17.959 7v2.68a2.85 2.85 0 0 1-2.85 2.859H9.86A2.85 2.85 0 0 0 7 15.389v3.75a2.86 2.86 0 0 0 2.86 2.86h4.28A2.86 2.86 0 0 0 17 19.14v-1.68h-4.291c-.39 0-.709-.57-.709-.96h7.14A2.86 2.86 0 0 0 22 13.64V9.86A2.86 2.86 0 0 0 19.14 7zM8.32 11.513l-.004.004l.038-.004zm6.54 7.276c.39 0 .71.3.71.89a.71.71 0 0 1-.71.71c-.4 0-.72-.12-.72-.71s.32-.89.72-.89"/></svg>`,
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><path fill="#e65100" d="m4 4l2 22l10 2l10-2l2-22Zm19.72 7H11.28l.29 3h11.86l-.802 9.335L15.99 25l-6.635-1.646L8.93 19h3.02l.19 2l3.86.77l3.84-.77l.29-4H8.84L8 8h16Z"/></svg>`,
        css: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><g fill="none"><rect width="256" height="256" fill="#0277bd" rx="60"/><path fill="#ebebeb" d="m53.753 102.651l2.862 31.942h71.481v-31.942zM128.095 38H48l2.904 31.942h77.191zm0 180.841v-33.233l-.14.037l-35.574-9.605l-2.274-25.476H58.042l4.475 50.154l65.431 18.164z"/><path fill="#fff" d="m167.318 134.593l-3.708 41.426l-35.625 9.616v33.231l65.483-18.148l.48-5.397l7.506-84.092l.779-8.578L208 38h-80.015v31.942h45.009l-2.906 32.709h-42.103v31.942z"/></g></svg>`,
        js: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><path fill="#f5de19" d="M18.774 19.7a3.73 3.73 0 0 0 3.376 2.078c1.418 0 2.324-.709 2.324-1.688c0-1.173-.931-1.589-2.491-2.272l-.856-.367c-2.469-1.052-4.11-2.37-4.11-5.156c0-2.567 1.956-4.52 5.012-4.52A5.06 5.06 0 0 1 26.9 10.52l-2.665 1.711a2.33 2.33 0 0 0-2.2-1.467a1.49 1.49 0 0 0-1.638 1.467c0 1.027.636 1.442 2.1 2.078l.856.366c2.908 1.247 4.549 2.518 4.549 5.376c0 3.081-2.42 4.769-5.671 4.769a6.58 6.58 0 0 1-6.236-3.5ZM6.686 20c.538.954 1.027 1.76 2.2 1.76c1.124 0 1.834-.44 1.834-2.15V7.975h3.422v11.683c0 3.543-2.078 5.156-5.11 5.156A5.31 5.31 0 0 1 3.9 21.688Z"/></svg>`,
        json: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><path fill="#f5de19" d="M4.014 14.976a2.5 2.5 0 0 0 1.567-.518a2.38 2.38 0 0 0 .805-1.358a15.3 15.3 0 0 0 .214-2.944q.012-2.085.075-2.747a5.2 5.2 0 0 1 .418-1.686a3 3 0 0 1 .755-1.018A3.05 3.05 0 0 1 9 4.125A6.8 6.8 0 0 1 10.544 4h.7v1.96h-.387a2.34 2.34 0 0 0-1.723.468a3.4 3.4 0 0 0-.425 2.092a36 36 0 0 1-.137 4.133a4.7 4.7 0 0 1-.768 2.06A4.6 4.6 0 0 1 6.1 16a3.8 3.8 0 0 1 1.992 1.754a8.9 8.9 0 0 1 .618 3.865q0 2.435.05 2.9a1.76 1.76 0 0 0 .504 1.181a2.64 2.64 0 0 0 1.592.337h.387V28h-.7a5.7 5.7 0 0 1-1.773-.2a2.97 2.97 0 0 1-1.324-.93a3.35 3.35 0 0 1-.681-1.63a24 24 0 0 1-.165-3.234a16.5 16.5 0 0 0-.214-3.106a2.4 2.4 0 0 0-.805-1.361a2.5 2.5 0 0 0-1.567-.524Zm23.972 2.035a2.5 2.5 0 0 0-1.567.524a2.4 2.4 0 0 0-.805 1.361a16.5 16.5 0 0 0-.212 3.109a24 24 0 0 1-.169 3.234a3.35 3.35 0 0 1-.681 1.63a2.97 2.97 0 0 1-1.324.93a5.7 5.7 0 0 1-1.773.2h-.7V26.04h.387a2.64 2.64 0 0 0 1.592-.337a1.76 1.76 0 0 0 .506-1.186q.05-.462.05-2.9a8.9 8.9 0 0 1 .618-3.865A3.8 3.8 0 0 1 25.9 16a4.6 4.6 0 0 1-1.7-1.286a4.7 4.7 0 0 1-.768-2.06a36 36 0 0 1-.137-4.133a3.4 3.4 0 0 0-.425-2.092a2.34 2.34 0 0 0-1.723-.468h-.387V4h.7a6.8 6.8 0 0 1 1.54.125a3.05 3.05 0 0 1 1.149.581a3 3 0 0 1 .755 1.018a5.2 5.2 0 0 1 .418 1.686q.062.662.075 2.747a15.3 15.3 0 0 0 .212 2.947a2.38 2.38 0 0 0 .805 1.355a2.5 2.5 0 0 0 1.567.518Z"/></svg>`,
        md: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" fill-rule="evenodd" clip-rule="evenodd"><path fill="#8fbffa" d="M2.5 0A1.5 1.5 0 0 0 1 1.5v11A1.5 1.5 0 0 0 2.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-7a.5.5 0 0 0-.146-.354l-5-5A.5.5 0 0 0 7.5 0z"/><path fill="#2859c5" d="M4.534 6.387a.868.868 0 0 0-1.659.356V10.5a.625.625 0 1 0 1.25 0V8.523l.023.051a.934.934 0 0 0 1.704 0l.023-.051V10.5a.625.625 0 1 0 1.25 0V6.743a.868.868 0 0 0-1.66-.356L5 7.42zm5.591.113a.625.625 0 1 0-1.25 0V9H8.5a.5.5 0 0 0-.354.853l1 1a.5.5 0 0 0 .708 0l1-1A.5.5 0 0 0 10.5 9h-.375z"/></g></svg>`,
        txt: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11c0-.818 0-1.57-.152-1.937s-.441-.657-1.02-1.235l-4.736-4.736c-.499-.499-.748-.748-1.058-.896a2 2 0 0 0-.197-.082C11.514 2 11.161 2 10.456 2c-3.245 0-4.868 0-5.967.886a4 4 0 0 0-.603.603C3 4.59 3 6.211 3 9.456V14c0 3.771 0 5.657 1.172 6.828S7.229 22 11 22h8M12 2.5V3c0 2.828 0 4.243.879 5.121C13.757 9 15.172 9 18 9h.5m-.5 5h1.5m0 0H21m-1.5 0v5M7 14h1.5m0 0H10m-1.5 0v5m4-5l1.5 2.5m0 0l1.5 2.5M14 16.5l1.5-2.5M14 16.5L12.5 19"/></svg>`,
    };
    return icons[ext] || `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}

export function recreateFilePreviewFromMessage(storedMessage) {
    if (!storedMessage) return null;
    const fileMatch = storedMessage.match(/^📎\s*(\d+)\s*file[s]?:\s*(.+?)(?:\n\n|$)/i);
    if (!fileMatch) return null;
    
    const fileNames = fileMatch[2].split(',').map(s => s.trim());
    if (fileNames.length === 0) return null;
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'message-files';
    
    let html = `<div class="files-preview-header">📎 Attached files</div><div class="files-preview-list">`;
    fileNames.forEach(name => {
        const ext = name.split('.').pop().toLowerCase();
        const icon = getFileIcon(ext);
        
        html += `
            <div class="file-preview-item" title="${escapeHtml(name)}">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${escapeHtml(name)}</span>
                <span class="file-size">(file)</span>
            </div>
        `;
    });
    html += `</div>`;
    previewDiv.innerHTML = html;
    return previewDiv;
}

export function groupChatsByDate(chats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const groups = {
        pinned: [],
        today: [],
        yesterday: [],
        last7: [],
        last30: [],
        older: []
    };
    
    chats.forEach(chat => {
        const date = chat.updatedAt?.toDate?.() || new Date(chat.updatedAt) || new Date();
        if (chat.isPinned) {
            groups.pinned.push(chat);
        } else if (date >= today) {
            groups.today.push(chat);
        } else if (date >= yesterday) {
            groups.yesterday.push(chat);
        } else if (date >= weekAgo) {
            groups.last7.push(chat);
        } else if (date >= monthAgo) {
            groups.last30.push(chat);
        } else {
            groups.older.push(chat);
        }
    });
    
    for (let key in groups) {
        groups[key].sort((a, b) => {
            const aDate = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
            const bDate = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
            return bDate - aDate;
        });
    }
    
    return groups;
}

export function showSkeleton() {
    const historyList = document.getElementById('chat-history-list');
    if (!historyList) return;
    historyList.innerHTML = `
        <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
        <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
        <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
    `;
}

export function renderHistoryItem(chat, currentConversationId) {
    const convId = chat.id;
    const title = chat.title || 'Untitled Chat';
    const activeClass = (currentConversationId === convId) ? 'active' : '';
    const pinnedClass = chat.isPinned ? 'pinned' : '';
    
    return `
        <div class="history-item ${activeClass}" data-id="${convId}" data-title="${escapeHtml(title)}">
            <div class="history-item-content" onclick="window.selectConversation('${convId}')">
                <span class="history-icon"><i class="fas fa-comment"></i></span>
                <span class="history-title">${escapeHtml(title)}</span>
            </div>
            <div class="pin-icon ${pinnedClass}" onclick="event.stopPropagation(); window.togglePinConversation('${convId}')">
                <i class="fas fa-thumbtack"></i>
            </div>
            <div class="history-actions">
                <button class="history-rename" onclick="event.stopPropagation(); window.renameConversation('${convId}')" title="Rename">${RENAME_SVG}</button>
                <button class="history-delete" onclick="event.stopPropagation(); window.deleteConversation('${convId}')" title="Delete">${DELETE_SVG}</button>
            </div>
        </div>
    `;
}

export function renderGroupedChats(groups, searchTerm, currentConversationId) {
    const historyList = document.getElementById('chat-history-list');
    if (!historyList) return;
    
    const filterChat = (chat) => {
        if (!searchTerm) return true;
        return chat.title.toLowerCase().includes(searchTerm.toLowerCase());
    };
    
    let html = '';
    
    if (groups.pinned.length > 0) {
        html += `<div class="group-header pinned-header" data-group="pinned">
                    <span>📌 Pinned <span class="group-count">(${groups.pinned.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="pinned">`;
        groups.pinned.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat, currentConversationId);
        });
        html += `</div>`;
    }
    
    if (groups.today.length > 0) {
        html += `<div class="group-header" data-group="today">
                    <span>Today <span class="group-count">(${groups.today.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="today">`;
        groups.today.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat, currentConversationId);
        });
        html += `</div>`;
    }
    
    if (groups.yesterday.length > 0) {
        html += `<div class="group-header" data-group="yesterday">
                    <span>Yesterday <span class="group-count">(${groups.yesterday.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="yesterday">`;
        groups.yesterday.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat, currentConversationId);
        });
        html += `</div>`;
    }
    
    if (groups.last7.length > 0) {
        html += `<div class="group-header" data-group="last7">
                    <span>Last 7 days <span class="group-count">(${groups.last7.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="last7">`;
        groups.last7.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat, currentConversationId);
        });
        html += `</div>`;
    }
    
    if (groups.last30.length > 0) {
        html += `<div class="group-header" data-group="last30">
                    <span>Last 30 days <span class="group-count">(${groups.last30.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="last30">`;
        groups.last30.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat, currentConversationId);
        });
        html += `</div>`;
    }
    
    if (groups.older.length > 0) {
        html += `<div class="group-header" data-group="older">
                    <span>Older <span class="group-count">(${groups.older.length})</span></span>
                    <span class="group-toggle">▼</span>
                 </div>
                 <div class="group-items" data-group="older">`;
        groups.older.forEach(chat => {
            if (filterChat(chat)) html += renderHistoryItem(chat, currentConversationId);
        });
        html += `</div>`;
    }
    
    if (html === '') {
        html = '<div class="history-placeholder">No chats found</div>';
    }
    
    historyList.innerHTML = html;
    
    document.querySelectorAll('.group-header').forEach(header => {
        const groupName = header.getAttribute('data-group');
        const isCollapsed = localStorage.getItem(`group_${groupName}_collapsed`) === 'true';
        if (isCollapsed) header.classList.add('collapsed');
        
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            header.classList.toggle('collapsed');
            localStorage.setItem(`group_${groupName}_collapsed`, header.classList.contains('collapsed'));
        });
    });
}

export function highlightActiveHistoryItem(convId) {
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        if (item.getAttribute('data-id') === convId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}