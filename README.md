# 🐬 kairos AI – Elite Cybersecurity & Coding Assistant

> **Real‑time code execution, project‑aware RAG, multi‑model intelligence, and a premium chat experience** > Built for developers, security researchers, and builders by Kaif Ansari.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-kairos.ai-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://trykairos.vercel.app/c)
[![GitHub](https://img.shields.io/badge/GitHub-thekaifansari01-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/thekaifansari01)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-thekaifansari01-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/thekaifansari01)
[![X / Twitter](https://img.shields.io/badge/X-thekaifansari01-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/thekaifansari01)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-ffca28)](https://firebase.google.com)
[![Pyodide](https://img.shields.io/badge/Pyodide-Python%20in%20Browser-4B8BBE)](https://pyodide.org)
[![Groq](https://img.shields.io/badge/Groq-LLM%20API-f55036)](https://groq.com)

---

## 📌 Overview

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

---

## 🚀 Getting Started

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
```

---

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

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 📜 License

Distributed under the **MIT License**. Created and maintained by **[Kaif Ansari](https://github.com/thekaifansari01)**.

---

## 🙌 Acknowledgements & Technologies

* [Pyodide](https://pyodide.org) – Browser-native Python environments.
* [Transformers.js](https://huggingface.co/docs/transformers.js) – Machine Learning in JavaScript.
* [Groq](https://groq.com) & [OpenRouter](https://openrouter.ai) – High-speed LLM inference.
* [Firebase](https://firebase.google.com) – Scalable backend infrastructure.