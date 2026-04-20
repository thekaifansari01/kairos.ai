// js/modules/auth/login.js
// Login popup with Google & GitHub authentication

(function() {
    // ========== CSS STYLES (injected once) ==========
    const styles = `
        .login-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(12px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .login-popup {
            background: var(--bg-sidebar, #0f0f13);
            border-radius: 32px;
            width: 90%;
            max-width: 420px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
            overflow: hidden;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .login-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.2);
        }
        .login-header h3 {
            margin: 0;
            font-size: 1.35rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-primary, #f4f4f5);
        }
        .login-close {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            font-size: 1.4rem;
            cursor: pointer;
            color: var(--text-muted, #a1a1aa);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-close:hover {
            background: rgba(255, 255, 255, 0.12);
            color: white;
        }
        .login-body {
            padding: 2rem 1.75rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .login-btn-provider {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 12px 16px;
            border-radius: 40px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-primary);
        }
        .login-btn-provider:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(6, 182, 212, 0.4);
        }
        .login-btn-provider:active {
            transform: translateY(1px);
        }
        .google-btn {
            background: rgba(219, 68, 55, 0.1);
            border-color: rgba(219, 68, 55, 0.3);
        }
        .google-btn:hover {
            background: rgba(219, 68, 55, 0.2);
            border-color: #db4437;
        }
        .github-btn {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
        }
        .github-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: #fff;
        }
        .login-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-muted);
            font-size: 0.75rem;
            margin: 8px 0;
        }
        .login-divider::before,
        .login-divider::after {
            content: "";
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.08);
        }
        .guest-note {
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 12px;
        }
        .guest-note a {
            color: var(--accent-cyan, #06b6d4);
            text-decoration: none;
            cursor: pointer;
        }
        .guest-note a:hover {
            text-decoration: underline;
        }
        @media (max-width: 500px) {
            .login-body { padding: 1.5rem; }
        }
    `;

    // Inject styles if not already present
    if (!document.getElementById('login-popup-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'login-popup-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // Get Firebase auth (from existing firebase.js module)
    let auth = null;
    let googleProvider = null;
    let githubProvider = null;

    async function getAuth() {
        if (auth) return auth;
        try {
            // Try to get auth from window (if exposed)
            if (window.auth) {
                auth = window.auth;
            } else {
                // Dynamically import firebase.js module
                const module = await import('./firebase.js');
                auth = module.auth;
                // Also get providers if needed
                const { GoogleAuthProvider, GithubAuthProvider } = await import("firebase/auth");
                googleProvider = new GoogleAuthProvider();
                githubProvider = new GithubAuthProvider();
                githubProvider.addScope('read:user');
            }
            return auth;
        } catch (err) {
            console.error("Failed to load Firebase auth:", err);
            return null;
        }
    }

    async function signInWithGoogle() {
        const authInst = await getAuth();
        if (!authInst) {
            if (window.showToast) window.showToast("Auth not ready. Please refresh.", "error");
            return;
        }
        try {
            // Use popup (already works with existing firebase config)
            const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
            const provider = googleProvider || new GoogleAuthProvider();
            const result = await signInWithPopup(authInst, provider);
            console.log("Google sign-in success:", result.user);
            if (window.showToast) window.showToast(`Welcome ${result.user.displayName || result.user.email}!`, "success");
            closePopup();
            // Refresh user UI (if exists)
            if (window.updateWelcomeUsername) window.updateWelcomeUsername();
            if (window.loadUserConversations && result.user) window.loadUserConversations(result.user.uid);
        } catch (error) {
            console.error("Google sign-in error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                if (window.showToast) window.showToast(error.message, "error");
            }
        }
    }

    async function signInWithGitHub() {
        const authInst = await getAuth();
        if (!authInst) {
            if (window.showToast) window.showToast("Auth not ready. Please refresh.", "error");
            return;
        }
        try {
            const { signInWithPopup, GithubAuthProvider } = await import("firebase/auth");
            const provider = githubProvider || new GithubAuthProvider();
            provider.addScope('read:user');
            const result = await signInWithPopup(authInst, provider);
            console.log("GitHub sign-in success:", result.user);
            if (window.showToast) window.showToast(`Welcome ${result.user.displayName || result.user.email || "GitHub user"}!`, "success");
            closePopup();
            if (window.updateWelcomeUsername) window.updateWelcomeUsername();
            if (window.loadUserConversations && result.user) window.loadUserConversations(result.user.uid);
        } catch (error) {
            console.error("GitHub sign-in error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                if (error.code === 'auth/unauthorized-domain') {
                    if (window.showToast) window.showToast("GitHub login not enabled in Firebase Console. Add your domain in Authentication > Settings > Authorized domains.", "error", 8000);
                } else {
                    if (window.showToast) window.showToast(error.message, "error");
                }
            }
        }
    }

    let popupOverlay = null;

    function closePopup() {
        if (popupOverlay && popupOverlay.parentNode) {
            popupOverlay.remove();
            popupOverlay = null;
        }
        document.body.style.overflow = '';
    }

    function showLoginPopup() {
        // If already open, close first
        if (popupOverlay) closePopup();

        popupOverlay = document.createElement('div');
        popupOverlay.className = 'login-popup-overlay';

        popupOverlay.innerHTML = `
            <div class="login-popup">
                <div class="login-header">
                    <h3>
                        <span>🐬</span> Sign in to Kairos
                    </h3>
                    <button class="login-close">&times;</button>
                </div>
                <div class="login-body">
                    <button class="login-btn-provider google-btn" id="login-google-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#DB4437" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#0F9D58" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                    <button class="login-btn-provider github-btn" id="login-github-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.88-.01-1.72-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z"/>
                        </svg>
                        Continue with GitHub
                    </button>
                    <div class="login-divider">or</div>
                    <div class="guest-note">
                        Continue as <a id="continue-guest">Guest</a> (chats not saved to cloud)
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(popupOverlay);
        document.body.style.overflow = 'hidden';

        // Event listeners
        const closeBtn = popupOverlay.querySelector('.login-close');
        const googleBtn = popupOverlay.querySelector('#login-google-btn');
        const githubBtn = popupOverlay.querySelector('#login-github-btn');
        const guestLink = popupOverlay.querySelector('#continue-guest');

        closeBtn.onclick = closePopup;
        popupOverlay.onclick = (e) => { if (e.target === popupOverlay) closePopup(); };
        googleBtn.onclick = () => signInWithGoogle();
        githubBtn.onclick = () => signInWithGitHub();
        guestLink.onclick = () => {
            closePopup();
            if (window.showToast) window.showToast("You are using guest mode. Sign in to save chats.", "info", 3000);
        };
    }

    // Expose function globally
    window.showLoginPopup = showLoginPopup;
})();