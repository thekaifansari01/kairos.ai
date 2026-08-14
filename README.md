# 🐬 kairos AI – Elite Cybersecurity & Coding Assistant

<<<<<<< HEAD
> **Real‑time code execution, project‑aware RAG, multi‑model intelligence, and a premium chat experience** > Built for developers, security researchers, and builders by Kaif Ansari.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-kairos.ai-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://trykairos.vercel.app/c)
[![GitHub](https://img.shields.io/badge/GitHub-thekaifansari01-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/thekaifansari01)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-thekaifansari01-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/thekaifansari01)
[![X / Twitter](https://img.shields.io/badge/X-thekaifansari01-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/thekaifansari01)
=======
> **Real‑time code execution, project‑aware RAG, multi‑model intelligence, and a premium chat experience**  
> Built for developers, security researchers, and builders.
>>>>>>> e739f4a74f96da9e6b222ed315eea24e573288d2

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-ffca28)](https://firebase.google.com)
[![Pyodide](https://img.shields.io/badge/Pyodide-Python%20in%20Browser-4B8BBE)](https://pyodide.org)
[![Groq](https://img.shields.io/badge/Groq-LLM%20API-f55036)](https://groq.com)

---

## 📌 Overview

<<<<<<< HEAD
**kairos** is an elite, all‑in‑one AI workspace engineered by **Kaif Ansari** that merges cutting-edge development tools with cybersecurity intelligence. 

This platform combines:

- **Multi-LLM Architecture** – Chat with Groq, OpenRouter, and Google Gemini seamlessly.  
- **Live Python Interpreter** – Execute code snippets directly inside the chat using Pyodide.  
- **Local RAG (Retrieval-Augmented Generation)** – Index your entire project locally and ask highly contextual questions.  
- **Cloud Sync & Persistence** – Chat history securely saved to Firestore via Google login.  
- **Voice UI & Export Controls** – Text‑to‑speech, message editing, and comprehensive export options.  
- **Custom Templates & Persona** – Tailor system prompts, coding styles, and security focus.  

Built with pristine vanilla HTML/CSS/JS for maximum performance—**no heavy frameworks**, just pure, responsive, dark-themed engineering.

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi‑Model Chat** | Instantly switch between Llama, Gemini, Qwen, Nemotron, GPT‑OSS, Kimi‑K2. |
| 🐍 **Live Python Execution** | Run Python blocks with output streams, abort controls, and timeout handling. |
| 📁 **Local RAG Pipeline** | Upload folders to chunk, embed (MiniLM), and store code in IndexedDB for deep context. |
| 🔐 **Cybersecurity Lens** | Integrated security audit prompts for vulnerability awareness and secure coding. |
| ☁️ **Cloud Synchronization** | Google SSO integration for cross-device conversation pinning and searching. |
| ✏️ **Advanced Message Actions** | Copy, edit, speak aloud (Web Speech API), and regenerate AI responses instantly. |
| 📎 **Contextual Attachments** | Drag and drop text files directly into the prompt context window. |
| 🧩 **Template Manager** | Trigger custom prompt templates using `/` in the input field. |
| ⚙️ **Dynamic Preferences** | Adjust AI tone (professional/casual) and security posture on the fly. |
| 🔑 **Local API Key Storage** | Securely override default keys for Groq/OpenRouter/Gemini via `localStorage`. |
| 📤 **Data Export** | Export chat sessions as `.txt` or `.json` for documentation or sharing. |

---

## 🛠️ Tech Stack & Architecture

### Frontend Layer
- **HTML5 / CSS3** – Highly modular CSS architecture (framework-free)  
- **JavaScript (ES2020+)** – Vanilla JS with module import maps  
- **Markdown Rendering** – `marked.js` + `highlight.js` for syntax precision  
- **Voice Interface** – Native Web Speech API integration  

### Backend & AI Services
- **Authentication & Database** – Firebase (Google Auth + Firestore)  
- **LLM APIs** – Groq (Llama 3.3, Mixtral), OpenRouter, Google Gemini (2.5 Flash)  

### Edge & Local Processing
- **In-Browser Compute** – Pyodide executing Python within Web Workers  
- **Local Vector Search** – Transformers.js (`Xenova/all-MiniLM-L6-v2`) for local RAG  
- **Storage** – IndexedDB for vector storage with content‑hash deduplication  
- **PWA Capabilities** – Service Worker for offline caching and network-first delivery

### Engineering Highlights
- **Token-Aware Truncation** – Prevents context window overflows automatically.
- **Hybrid Search** – Combines cosine similarity with keyword matching for superior RAG accuracy.
- **Custom Modal System** – Sleek UI components replacing native browser prompts.
=======
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
>>>>>>> e739f4a74f96da9e6b222ed315eea24e573288d2

---

## 🚀 Getting Started

<<<<<<< HEAD
### 1. Clone the Repository

```bash
git clone https://github.com/thekaifansari01/kairos-ai.git
cd kairos-ai
```

### 2. Serve Locally
Use any static web server:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

### 3. Firebase Configuration (For Cloud Sync)

* Create a project on Firebase Console.
* Enable **Google Authentication** and **Firestore Database**.
* Update the configuration object in `js/modules/auth/firebase.js`.

> **Note**: Demo API keys are included for immediate testing. Override them securely in the UI **Settings** panel (saved locally).

### 4. Launch

Navigate to `http://localhost:8000` and click **"Launch App"**.

---

## 📂 Codebase Structure

```text
kairos-ai/
├── index.html               # Marketing & Landing page
├── c.html                   # Main application interface
├── 404.html                 # Custom error routing
├── sw.js                    # PWA Service Worker
├── chatui/                  # Modular CSS architecture
│   ├── base.css
│   ├── sidebar.css
│   └── messages.css         # ...and more
├── js/
│   ├── modules/
│   │   ├── core/            # Configuration & main logic
│   │   ├── auth/            # Firebase integrations
│   │   ├── history/         # Firestore CRUD operations
│   │   ├── api/             # Multi-provider LLM caller
│   │   ├── rag/             # Chunker, embeddings, VectorDB
│   │   └── interpreter/     # Pyodide Web Worker bridge
│   ├── ui/                  # Component controllers (modals, navbar)
│   └── utils/               # Validation & toast notifications
└── README.md                # Project documentation
=======
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
>>>>>>> e739f4a74f96da9e6b222ed315eea24e573288d2
```

---

<<<<<<< HEAD
## 🧪 Usage Workflows

### 💬 Intelligent Chat

* Hit **Enter** to send (Shift+Enter for a new line).
* Use the top-right model selector to hot-swap LLMs mid-conversation.
* Drag and drop files directly into the chat box.

### 🐍 Live Python Execution

* Any markdown code block defined as `python` generates a **Run** button.
* Output streams directly into the chat UI.
* Supports execution abort and output copying.

### 📁 Local RAG (Index Project)

* Click the **Database Icon** in the floating navbar.
* Select your project folder. The system will recursively index text files (ignoring `.git`, `node_modules`).
* Code is chunked, embedded locally via MiniLM, and stored in IndexedDB.
* Future queries will automatically surface relevant codebase context.

### 🔧 Command Templates

* Type `/` to invoke the template menu.
* Manage custom snippets via the **Templates** (scroll icon) in the navbar.

---

## 🌐 Deployment Strategy

Deploy to any static Edge network (Vercel, Cloudflare Pages, Netlify).

**Crucial Deployment Notes:**

* **Service Worker Location:** Ensure `sw.js` is served from the root directory.
* **Firebase Auth Domains:** Add your production domain to Firebase's authorized domains list.
* **API Rate Limits:** Production deployments should require users to input their own API keys via the Settings UI.

Example `vercel.json` for SPA routing:

=======
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
>>>>>>> e739f4a74f96da9e6b222ed315eea24e573288d2
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 📜 License

<<<<<<< HEAD
Distributed under the **MIT License**. Created and maintained by **[Kaif Ansari](https://github.com/thekaifansari01)**.

---

## 🙌 Acknowledgements & Technologies

* [Pyodide](https://pyodide.org) – Browser-native Python environments.
* [Transformers.js](https://huggingface.co/docs/transformers.js) – Machine Learning in JavaScript.
* [Groq](https://groq.com) & [OpenRouter](https://openrouter.ai) – High-speed LLM inference.
* [Firebase](https://firebase.google.com) – Scalable backend infrastructure.
=======
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
>>>>>>> e739f4a74f96da9e6b222ed315eea24e573288d2
