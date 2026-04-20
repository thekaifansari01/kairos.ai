// js/modules/api/api.js — Live markdown streaming + file attachments fix
// FIXED: RAG context now properly injected (removed premature return of _pendingMessagesForAPI)

async function callGroqAPI(aiMessageId) {
    const aiMessageDiv = document.getElementById(aiMessageId);
    if (!aiMessageDiv) return;
    const markdownContainer = aiMessageDiv.querySelector('.markdown-container');
    if (!markdownContainer) return;
    
    const userInput = document.getElementById('user-input');
    if (window.isGenerating === false) window.isGenerating = true;
    window.setActionButtonMode('stop');
    if (userInput) userInput.disabled = true;
    
    window.currentAbortController = new AbortController();
    const signal = window.currentAbortController.signal;
    
    let fullText = "";
    let streamError = false;
    let currentApiUrl = window.API_URL;
    let currentApiKey = window.API_KEY;
    let currentModelName = window.MODEL_NAME;
    
    function getProviderFromModel() {
        const model = window.MODELS?.find(m => m.modelId === currentModelName);
        return model?.provider || 'groq';
    }
    
    const maxOutputTokens = {
        'gemini-2.0-flash-exp': 8192, 'gemini-1.5-flash': 8192, 'gemini-1.5-pro': 8192,
        'gemini-2.5-flash': 8192, 'gemini-2.5-flash-lite': 8192, 'llama-3.3-70b-versatile': 8192,
        'qwen/qwen3-32b': 8192, 'gemma2-9b-it': 8192, 'llama-3.1-8b-instant': 8192,
        'mixtral-8x7b-32768': 8192, 'nvidia/nemotron-3-super-120b-a12b:free': 8192,
        'deepseek/deepseek-r1:free': 8192, 'meta-llama/llama-3.2-3b-instruct:free': 8192
    };
    const outputLimit = maxOutputTokens[currentModelName] || 8192;
    
    let streamEnded = false;
    let renderTimeout = null;
    
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }
    
    // Live markdown render with throttle
    async function renderMarkdown() {
        if (streamEnded) return;
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = setTimeout(async () => {
            renderTimeout = null;
            if (streamEnded || fullText.length === 0) return;
            try {
                const formatted = await window.formatAIResponse(fullText, true);
                markdownContainer.innerHTML = formatted;
                if (!window.isUserScrolledUp) window.scrollToBottom();
            } catch (e) {
                console.warn("Markdown render error:", e);
                let escaped = escapeHtml(fullText);
                escaped = escaped.replace(/\n/g, '<br>');
                markdownContainer.innerHTML = escaped + '<span class="blinking-cursor"></span>';
            }
            if (!streamEnded) renderMarkdown();
        }, 400);
    }
    
    function scheduleUIUpdate() {
        if (!streamEnded) renderMarkdown();
    }
    
    // ========== RAG + Messages (FIXED: no early return) ==========
    async function getMessagesWithRAG(messagesOverride = null) {
        if (messagesOverride) return messagesOverride;
        let messages = window.getChatHistory();
        
        // ✅ FIX: Even if _pendingMessagesForAPI exists, we still need to add RAG context
        // But _pendingMessagesForAPI is set by handleSend when files are attached.
        // We'll merge RAG into the last user message if available.
        let baseMessages = messages;
        if (window._pendingMessagesForAPI && Array.isArray(window._pendingMessagesForAPI)) {
            baseMessages = window._pendingMessagesForAPI;
            window._pendingMessagesForAPI = null; // clear after using
        }
        
        if (!window.RAGEmbeddings || !baseMessages.length) return baseMessages;
        
        let lastUserMsgIndex = -1;
        for (let i = baseMessages.length - 1; i >= 0; i--) {
            if (baseMessages[i].role === 'user') { lastUserMsgIndex = i; break; }
        }
        if (lastUserMsgIndex === -1) return baseMessages;
        
        const lastUserMsg = baseMessages[lastUserMsgIndex];
        try {
            const relevant = await window.RAGEmbeddings.searchRelevantContext(lastUserMsg.content, 3);
            if (relevant && relevant.length > 0) {
                let contextBlock = "\n\n[Relevant code from your project]\n\n";
                for (const item of relevant) {
                    contextBlock += `File: ${item.filePath} (lines ${item.startLine}-${item.endLine})\n\`\`\`\n${item.content}\n\`\`\`\n\n`;
                }
                const enhancedUserMsg = { ...lastUserMsg, content: lastUserMsg.content + "\n\n" + contextBlock };
                const newMessages = [...baseMessages];
                newMessages[lastUserMsgIndex] = enhancedUserMsg;
                return newMessages;
            }
        } catch(e) { console.error("RAG error:", e); }
        return baseMessages;
    }
    
    async function makeRequest(apiUrl, apiKey, modelName, retryAttempt = 0) {
        const provider = getProviderFromModel();
        const messages = await getMessagesWithRAG(); // RAG now works properly
        
        const bodyObj = { model: modelName, messages, stream: true, temperature: 0.8, top_p: 0.95, max_tokens: outputLimit };
        if (provider !== 'google' && provider !== 'openrouter') {
            bodyObj.frequency_penalty = 0.15;
            bodyObj.presence_penalty = 0.15;
        }
        
        const fetchOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify(bodyObj),
            signal
        };
        if (provider === 'openrouter') {
            fetchOptions.headers["HTTP-Referer"] = window.location.origin;
            fetchOptions.headers["X-Title"] = "Kairos AI Chat";
        }
        
        try {
            const response = await fetch(apiUrl, fetchOptions);
            if (!response.ok) throw new Error(`API Error ${response.status}`);
            return response;
        } catch (err) {
            if (err.name === 'AbortError') throw err;
            if (retryAttempt < 2) {
                await new Promise(r => setTimeout(r, Math.pow(2, retryAttempt) * 800));
                return makeRequest(apiUrl, apiKey, modelName, retryAttempt + 1);
            }
            throw err;
        }
    }
    
    async function processStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finishReason = null;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullText += content;
                            scheduleUIUpdate();
                        }
                        if (parsed.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason;
                    } catch(e) {}
                }
            }
        }
        return finishReason;
    }
    
    let response;
    let usedFallback = false;
    try {
        response = await makeRequest(currentApiUrl, currentApiKey, currentModelName);
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        usedFallback = true;
        const fallbackModel = window.MODELS?.find(m => m.provider === 'groq');
        if (fallbackModel) {
            window.switchModel(fallbackModel.display);
            response = await makeRequest(window.API_URL, window.API_KEY, window.MODEL_NAME);
        } else throw err;
    }
    
    try {
        const finishReason = await processStream(response);
        streamEnded = true;
        if (renderTimeout) clearTimeout(renderTimeout);
        
        let finalHtml = await window.formatAIResponse(fullText, false);
        if (finishReason === 'length') {
            finalHtml += `<div class="truncation-warning" style="margin-top:12px;padding:8px 12px;background:rgba(239,68,68,0.1);border-left:3px solid #ef4444;border-radius:8px;">⚠️ Response truncated due to length limit.</div>`;
            if (window.showToast) window.showToast("Response was cut off due to token limit.", "warning", 5000);
        }
        markdownContainer.innerHTML = finalHtml;
        const cursor = markdownContainer.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        
        if (fullText.trim()) {
            window.addMessageToHistory('assistant', fullText);
            if (window.saveCurrentSession) await window.saveCurrentSession();
        }
        
        const allMessages = window.getChatHistory();
        const userMessages = allMessages.filter(m => m.role === 'user');
        const assistantMessages = allMessages.filter(m => m.role === 'assistant');
        if (window.currentUser && window.currentConversationId && assistantMessages.length === 1 && userMessages.length >= 1) {
            if (!window._titleGeneratedForConv || window._titleGeneratedForConv !== window.currentConversationId) {
                window._titleGeneratedForConv = window.currentConversationId;
                setTimeout(() => { if (typeof window.generateChatTitle === 'function') window.generateChatTitle(window.currentConversationId, userMessages[0].content); }, 500);
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            markdownContainer.innerHTML = (fullText.trim() ? await window.formatAIResponse(fullText, false) + '<br><em>[Stopped]</em>' : '<span style="color:#ffaa44;">Stopped.</span>');
        } else {
            markdownContainer.innerHTML = `<span style="color:#ff4d4d;">Error: ${error.message}</span>`;
        }
    } finally {
        window.isGenerating = false;
        window.currentAbortController = null;
        window.setActionButtonMode('send');
        if (userInput) userInput.disabled = false;
        if (!streamError && fullText.trim()) window.scrollToBottom();
    }
}

window.callGroqAPI = callGroqAPI;