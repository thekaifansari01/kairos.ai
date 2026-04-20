# 🐬 Kairos AI

> **Elite Cybersecurity & Coding Assistant** — Your intelligent, context‑aware coding companion powered by state‑of‑the‑art LLMs.

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-production-green)
![Tech](https://img.shields.io/badge/tech-Vanilla%20JS%20%7C%20Firebase%20%7C%20RAG-orange)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

**Kairos** is a production‑ready, full‑featured AI chat application built with vanilla JavaScript. It combines a sleek, minimalist UI with powerful backend capabilities including **multiple LLM providers (Google Gemini, Groq, OpenRouter)**, **local RAG (Retrieval‑Augmented Generation)**, **real‑time Firestore sync**, and **Google Authentication**.

🔗 **Live Demo:** [TryKairos](https://trykairos.vercel.app)  
📁 **Repository:** https://github.com/thekaifansari01/kairos-ai

---

## ✨ Highlights

- 🤖 **Multi‑Provider LLM Support** – Seamlessly switch between Google Gemini, Groq, and OpenRouter models with auto‑fallback.
- 🧠 **Local RAG (Code Indexing)** – Index your project files (client‑side) using Transformers.js; relevant code is automatically injected into the chat context.
- 🔐 **Firebase Authentication** – Sign in with Google. Chats sync across devices in real time.
- 💬 **Conversation Management** – Create, rename, search, pin, and delete chats. Full history stored in Firestore.
- 🎤 **Text‑to‑Speech** – Listen to AI responses using the Web Speech API (play/pause/resume).
- ✨ **Rich Markdown Rendering** – Code blocks with syntax highlighting (Highlight.js), tables, task lists, and ` <think> ` block visualization.
- 📎 **File Attachments** – Upload text‑based files (code, logs, etc.) to include in prompts.
- ⚡ **Streaming Responses** – Real‑time token‑by‑token streaming with a blinking cursor.
- 📤 **Export & Share** – Export chats as `.txt` or `.json`, copy to clipboard, or share via Web Share API.
- 🎨 **Minimalist, Responsive UI** – Clean dark theme with smooth animations and mobile‑friendly layout.

---

## 🚀 Tech Stack

| Category            | Technology                                                                          |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Frontend**        | Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom properties, Flexbox, Grid)           |
| **Markdown & Code** | `marked`, `highlight.js`                                                             |
| **AI / Embeddings** | Google Gemini API, Groq API, OpenRouter API, Transformers.js (`Xenova/all-MiniLM-L6-v2`) |
| **Database**        | Firebase Firestore (NoSQL)                                                          |
| **Auth**            | Firebase Authentication (Google OAuth)                                               |
| **Vector Storage**  | IndexedDB (client‑side)                                                             |
| **Animations**      | Lottie‑web, CSS keyframes                                                           |
| **Icons**           | Font Awesome, Custom SVGs                                                           |

---

## 📁 Project Structure

```
kairos-ai/
├── index.html                 # Main entry point
├── js/
│   ├── modules/
│   │   ├── api/               # LLM API integration (Groq, Gemini, OpenRouter)
│   │   ├── auth/              # Firebase auth & feature guards
│   │   ├── core/              # Core logic (config, memory, main)
│   │   ├── history/           # Conversation CRUD, search, grouping
│   │   └── rag/               # Code chunker, embeddings, vector store (IndexedDB)
│   ├── ui/                    # UI components (modals, toasts, navbar, etc.)
│   └── utils/                 # Toast notifications, helpers
├── chatui/                    # Modular CSS files (sidebar, messages, modals, etc.)
├── animations/                # Lottie JSON animation (dolphin)
└── README.md
```

> **Note:** The app is **fully client‑side** (except for Firebase). API keys are stored in `localStorage` and can be updated via the Settings popup.

---

## ⚙️ Setup & Installation

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge)
- (Optional) Firebase project for authentication & Firestore
- (Optional) API keys for Google Gemini, Groq, or OpenRouter

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/kairos-ai.git
cd kairos-ai
```

### 2️⃣ Configure Firebase (if you want auth & cloud sync)
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Google Authentication** and **Firestore Database**.
3. Copy your Firebase config object.
4. Replace the config inside `js/modules/auth/firebase.js`:
   ```js
   const firebaseConfig = {
     // your config here
   };
   ```

### 3️⃣ (Optional) Add Your API Keys
The app comes with **default free API keys** (rate‑limited). To use your own:
- Click the **Settings** icon (⚙️) in the top‑right navbar.
- Enter your keys for Groq, OpenRouter, and/or Google Gemini.
- Keys are saved **only in your browser’s localStorage** (no server).

### 4️⃣ Run Locally
Simply open `index.html` in your browser, or use a lightweight server:
```bash
npx serve .
```

---

## 🧠 How RAG Works (Code Indexing)

Kairos can index your local codebase **entirely in the browser**:

1. Click **"Index Project"** in the floating navbar.
2. Drag & drop a folder (or select files).
3. Files are chunked (token‑aware) and embedded using **Transformers.js** (`all-MiniLM-L6-v2`).
4. Embeddings are stored in **IndexedDB** (private to your browser).
5. When you ask a question, the most relevant code chunks are automatically injected into the prompt (if RAG is enabled).

✅ **Zero data leaves your machine** – all embedding and storage happens client‑side.

---

## 🎮 Usage

| Action                       | How                                                               |
| ---------------------------- | ----------------------------------------------------------------- |
| **New Chat**                 | Click `+ New Chat` in sidebar or `Ctrl/Cmd + N`                   |
| **Send Message**             | Type and press `Enter` (Shift+Enter for new line)                 |
| **Stop Generation**          | Click the red stop button (or press `Esc` during generation)      |
| **Attach Files**             | Click the `+` button next to input or drag & drop                 |
| **Change Model**             | Click the model indicator (top‑right) or via Settings             |
| **Rename / Delete Chat**     | Hover over chat in sidebar → click ✏️ or 🗑️                       |
| **Search Chats**             | `Ctrl/Cmd + K` or use the search bar in sidebar                   |
| **Toggle RAG**               | Open RAG Manager (📊) and toggle "Enable RAG"                     |
| **Speak AI Response**        | Click the 🔊 **Speak** button below any AI message                 |
| **Copy / Edit / Regenerate** | Hover over message → use action buttons                           |

---

## 🔧 Configuration

All default API keys and models are defined in `js/modules/core/config.js`.  
You can modify the `MODELS` array to add/remove providers.

The app automatically selects the **fastest/cheapest** model by default (Gemini Flash‑Lite).  
Token limits are automatically adjusted based on the selected model.

---

## 🌐 Browser Support

| Browser         | Support                                 |
| --------------- | --------------------------------------- |
| Chrome / Edge   | ✅ Full (IndexedDB, Transformers.js)    |
| Firefox         | ✅ Full                                 |
| Safari          | ✅ Full (Web Speech API may vary)       |
| Mobile Browsers | ✅ Responsive, touch‑friendly           |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

Please follow the existing code style and keep the UI minimal.

---

## 📜 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Transformers.js](https://github.com/xenova/transformers.js) – in‑browser embeddings
- [Marked](https://marked.js.org/) – Markdown parsing
- [Highlight.js](https://highlightjs.org/) – syntax highlighting
- [Lottie](https://airbnb.io/lottie/) – animations
- [Firebase](https://firebase.google.com/) – backend services
- [Font Awesome](https://fontawesome.com/) – icons

---

**Made with ❤️ by Kaif Ansari**  
*"Took you long enough to ask."* – Kairos
