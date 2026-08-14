// js/modules/history/history-title.js
// Auto-title generation using Groq Qwen 32B

import { db } from '../auth/firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { loadUserConversations } from './history-firestore.js';

export async function generateChatTitle(conversationId, userMessage) {
    if (!conversationId || !window.currentUser) {
        console.warn("Cannot generate title: no conversation or user");
        return;
    }
    if (!db) return;

    const convRef = doc(db, "conversations", conversationId);
    let convSnap;
    try {
        convSnap = await getDoc(convRef);
        if (!convSnap.exists()) return;
        const currentTitle = convSnap.data().title;
        
        if (currentTitle !== "New Chat") {
            console.log(`Title is already "${currentTitle}", not auto-generating`);
            return;
        }
    } catch (err) {
        console.error("Error checking conversation:", err);
        return;
    }

    let cleanUserMessage = userMessage;
    if (cleanUserMessage.includes('📎')) {
        const lines = cleanUserMessage.split('\n');
        const textLines = lines.filter(line => !line.startsWith('📎'));
        cleanUserMessage = textLines.join('\n').trim();
    }
    if (cleanUserMessage.includes('[Attached file:')) {
        const parts = cleanUserMessage.split('---');
        cleanUserMessage = parts[parts.length - 1].trim();
    }
    if (!cleanUserMessage || cleanUserMessage.length < 5) {
        cleanUserMessage = userMessage.substring(0, 100);
    }

    const TITLE_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const TITLE_API_KEY = "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";
    const TITLE_MODEL = "llama-3.1-8b-instant";

    const prompt = `Generate a very short title (max 6 words) for a chat conversation based on the user's first message. Only output the title, nothing else. No quotes, no extra text, no punctuation at the end.

User message: "${cleanUserMessage.substring(0, 500)}"

Title:`;

    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TITLE_API_KEY}`
        },
        body: JSON.stringify({
            model: TITLE_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 30,
            stream: false
        })
    };

    try {
        console.log("🎯 Generating title with Groq Qwen 32B...");
        const response = await fetch(TITLE_API_URL, fetchOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Title API error ${response.status}:`, errorText);
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        let generatedTitle = data.choices?.[0]?.message?.content?.trim() || "";
        generatedTitle = generatedTitle.replace(/^["']|["']$/g, '').substring(0, 60);
        
        if (!generatedTitle || generatedTitle.length < 3) {
            generatedTitle = cleanUserMessage.substring(0, 40).replace(/\n/g, ' ');
        }
        
        await updateDoc(convRef, { title: generatedTitle, updatedAt: serverTimestamp() });
        console.log(`✅ AI generated title: "${generatedTitle}"`);
        
        if (window.currentConversationId === conversationId) {
            const chatTitleElement = document.getElementById('chat-title');
            if (chatTitleElement) {
                chatTitleElement.textContent = generatedTitle;
            }
        }
        
        if (window.currentUser) {
            await loadUserConversations(window.currentUser.uid);
        }
        if (window.showToast) {
            window.showToast(`✨ Title: "${generatedTitle}"`, "success", 2000);
        }
    } catch (error) {
        console.error("Title generation failed:", error);
        let fallbackTitle = cleanUserMessage.substring(0, 40).replace(/\n/g, ' ');
        if (fallbackTitle.length < 3) fallbackTitle = "New Chat";
        try {
            await updateDoc(convRef, { title: fallbackTitle, updatedAt: serverTimestamp() });
            console.log(`✅ Fallback title: "${fallbackTitle}"`);
            if (window.currentConversationId === conversationId) {
                const chatTitleElement = document.getElementById('chat-title');
                if (chatTitleElement) chatTitleElement.textContent = fallbackTitle;
            }
            if (window.currentUser) await loadUserConversations(window.currentUser.uid);
            if (window.showToast) {
                window.showToast(`✨ Title: "${fallbackTitle}"`, "success", 2000);
            }
        } catch (updateErr) {
            console.error("Fallback also failed:", updateErr);
        }
    }
}