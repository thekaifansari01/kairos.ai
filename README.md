# 🐬 kairos AI – Elite Cybersecurity & Coding Assistant

> **Real‑time code execution, project‑aware RAG, multi‑model intelligence, and a premium chat experience**  
> Built for developers, security researchers, and builders.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-ffca28)](https://firebase.google.com)
[![Pyodide](https://img.shields.io/badge/Pyodide-Python%20in%20Browser-4B8BBE)](https://pyodide.org)
[![Groq](https://img.shields.io/badge/Groq-LLM%20API-f55036)](https://groq.com)

---

## 📌 Overview

**kairos** is an all‑in‑one AI workspace that combines:

- **Chat with multiple LLMs** – Groq, OpenRouter, Google Gemini (free tiers)  
- **Live Python execution** – run code snippets inside the chat (Pyodide)  
- **RAG (Retrieval-Augmented Generation)** – index your project files and ask contextual questions  
- **Cloud sync** – chat history saved to Firestore (Google login)  
- **Voice & export** – text‑to‑speech, copy, regenerate, edit messages  
- **Templates & preferences** – custom system prompts, tone, code style  

The interface is **responsive**, **dark‑themed**, and built with vanilla HTML/CSS/JS – no heavy frameworks.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi‑Model Chat** | Switch between Llama, Gemini, Qwen, Nemotron, GPT‑OSS, Kimi‑K2 – all free. |
| 🐍 **Live Python Interpreter** | Run Python code blocks with output, abort, timeout. Supports most standard libraries. |
| 📁 **RAG – Index Your Project** | Upload folders or files. Code is chunked (token‑aware), embedded with MiniLM, and stored in IndexedDB. |
| 🔐 **Cybersecurity Lens** | Built‑in security audit prompts, vulnerability awareness. |
| ☁️ **Cloud Sync** | Sign in with Google – conversations saved, pinned, searchable across devices. |
| ✏️ **Message Actions** | Copy, edit (with regeneration), speak aloud (TTS), regenerate responses. |
| 📎 **File Attachments** | Attach text files to your prompt (automatically included in context). |
| 🧩 **Template Manager** | Create, edit, delete prompt templates – triggered by `/` in the input box. |
| ⚙️ **Preferences** | Set tone (professional/casual), code style, security focus – dynamic system prompt. |
| 🔑 **API Key Settings** | Override API keys for Groq/OpenRouter/Gemini (stored locally). |
| 📤 **Export / Share** | Export conversation as `.txt` or `.json`, shareable links. |

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 / CSS3** – custom modular CSS (no framework)  
- **JavaScript (ES2020+)** – vanilla JS, modules (import maps)  
- **Markdown** – `marked.js` + `highlight.js` for syntax highlighting  
- **TTS** – Web Speech API  
- **Lottie** – animated dolphin on welcome screen  

### Backend & Services
- **Firebase** – Authentication (Google) + Firestore (chat history)  
- **Groq API** – Llama 3.3, Mixtral, etc.  
- **OpenRouter API** – Qwen, Nemotron, etc.  
- **Google Gemini API** – Gemini 2.5 Flash, Flash‑Lite  

### Local Processing
- **Pyodide** – Python runtime in a Web Worker (code execution)  
- **Transformers.js** – embedding model (`Xenova/all-MiniLM-L6-v2`) for RAG  
- **IndexedDB** – vector storage per user (with content‑hash dedup)  
- **Service Worker** – offline caching (critical assets, network‑first strategy)

### Architecture Highlights
- **Modular JS** – `core/`, `ui/`, `auth/`, `history/`, `rag/`, `interpreter/`  
- **Custom Modal System** – replaces native `confirm`/`prompt`  
- **Token‑aware Context Truncation** – respects model limits  
- **Hybrid Search** – cosine similarity + keyword for RAG  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/kairos-ai.git
cd kairos-ai
```

### 2. Serve locally
Use any static server, for example:
```bash
# Using Python
python -m http.server 8000

# Using npx
npx serve .
```

### 3. Configure Firebase (optional – for cloud sync)
- Create a Firebase project  
- Enable **Authentication** (Google sign‑in)  
- Create a **Firestore** database  
- Replace the Firebase config in `js/modules/auth/firebase.js` with your own keys.

> **Note**: The code already includes demo API keys for Groq/OpenRouter/Gemini.  
> You can override them in the **Settings** popup (they are stored in `localStorage`).

### 4. Open in browser
Navigate to `http://localhost:8000` – you’ll see the landing page.  
Click **"Launch App"** to start chatting.

---

## 📂 Project Structure

```
kairos-ai/
├── index.html               # Landing page
├── c.html                   # Main chat application
├── 404.html                 # Custom error page
├── sw.js                    # Service Worker (caching)
├── animations/              # Lottie JSON for dolphin
├── chatui/                  # All CSS modules
│   ├── base.css
│   ├── sidebar.css
│   ├── messages.css
│   ├── code-blocks.css
│   ├── input-area.css
│   ├── navbar.css
│   ├── modals.css
│   ├── rag-modal.css
│   └── ... (other component styles)
├── js/
│   ├── modules/
│   │   ├── core/            # config, memory, main
│   │   ├── auth/            # firebase.js, featureGuard.js
│   │   ├── history/         # Firestore CRUD, title gen
│   │   ├── api/             # multi‑provider API caller
│   │   ├── rag/             # chunker, embeddings, vector-store
│   │   └── interpreter/     # Pyodide worker + main thread
│   ├── ui/                  # UI components: formatter, navbar, modal, preferences, templates...
│   └── utils/               # toast, validation
└── README.md                # This file
```

---

## 🧪 Usage Examples

### 💬 Chat
- Type a message and press **Enter** (Shift+Enter for new line).  
- Click the **model indicator** (top‑right) to switch between models.  
- Attach files via the **“+” button** or drag & drop into the input area.

### 🐍 Run Python Code
- Any code block with language `python` gets a **“Run”** button.  
- Click **Run** – output appears below the code block.  
- You can **stop** execution, **copy** output, or **save** output to the chat.

### 📁 Index a Project (RAG)
- Click the **“Index Project”** button (database icon) in the floating navbar.  
- Drop a folder or select files. The system will:  
  - Read all text files (recursively, ignoring `node_modules`, `.git`, etc.)  
  - Chunk code (token‑aware)  
  - Generate embeddings using MiniLM  
  - Store in IndexedDB (per user)  
- Once indexed, every chat automatically includes relevant code snippets from your project.

### 🔧 Templates
- Type **`/`** in the input box – a dropdown shows your saved templates.  
- Navigate with **↑/↓**, select with **Enter** or **Tab**.  
- Manage templates via the **“Templates”** button (scroll icon) in the navbar.

### ⚙️ Preferences
- Click the **sliders icon** (preferences) – set tone, code style, security focus, custom instructions.  
- The system prompt is rebuilt automatically and applied to the current conversation.

---

## 🌐 Deployment

You can deploy to any static hosting (Vercel, Netlify, GitHub Pages, Firebase Hosting).  

### Important notes:
- **Service Worker** – make sure `sw.js` is served from the root and paths in `PRECACHE_URLS` match your deployment structure.  
- **Firebase** – if you use your own project, update `firebase.js` with your credentials and enable the required domains in Authentication settings.  
- **API Keys** – the built‑in keys are rate‑limited. Replace them in **Settings** or directly in `config.js`.

Example `vercel.json` for clean routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 📜 License

MIT © [Kaif Ansari](https://github.com/your-username)

---

## 🙌 Acknowledgements

- [Pyodide](https://pyodide.org) – Python in the browser  
- [Transformers.js](https://huggingface.co/docs/transformers.js) – embeddings  
- [Groq](https://groq.com), [OpenRouter](https://openrouter.ai), [Google AI Studio](https://aistudio.google.com) – LLM APIs  
- [Firebase](https://firebase.google.com) – auth & database  
- [Lottie](https://airbnb.io/lottie) – animations

---

**Built with ❤️ for developers who ship fast and think secure.**  
🐬 *kairos – the right moment to build.*