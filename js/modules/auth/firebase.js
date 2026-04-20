// js/modules/auth/firebase.js — OAuth 2.0 (Google) with Auto-Popup & Manual Button + Firestore

import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_6UCfqSuWE2vhRNo5qgUHjOu11VN2Yi4",
    authDomain: "dolphin-55754.firebaseapp.com",
    projectId: "dolphin-55754",
    storageBucket: "dolphin-55754.firebasestorage.app",
    messagingSenderId: "471737982665",
    appId: "1:471737982665:web:d1cc0e4e602c0ba2207718",
    measurementId: "G-DCCL5PRCN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Session storage key to track if auto-popup has been attempted
const AUTO_POPUP_KEY = 'dolphin_auto_popup_attempted';

// Helper: escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showAuthError(message) {
    console.error('[Auth Error]', message);
}

function attemptAutoPopup() {
    if (sessionStorage.getItem(AUTO_POPUP_KEY)) return;
    sessionStorage.setItem(AUTO_POPUP_KEY, 'true');
    signInWithPopup(auth, provider)
        .then(result => console.log('Auto sign-in successful:', result.user))
        .catch(error => {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error('Auto sign-in failed:', error);
            }
        });
}

function updateUserUI(user) {
    const container = document.getElementById('user-info-container');
    if (!container) return;

    if (user) {
        const photoURL = user.photoURL || '';
        const displayName = user.displayName || user.email || 'User';
        const avatarHtml = photoURL
            ? `<img src="${photoURL}" alt="avatar">`
            : '<span>👤</span>';
        container.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-details">
                    <span class="user-name">${escapeHtml(displayName)}</span>
                    <span class="user-status online">● Online</span>
                </div>
                <button class="logout-btn" title="Sign out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">👤</div>
                <div class="user-details">
                    <span class="user-name">Guest User</span>
                    <span class="user-status offline">● Offline</span>
                </div>
                <button class="login-btn" title="Sign in with Google">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                </button>
            </div>
        `;
    }

    const actionBtn = user
        ? container.querySelector('.logout-btn')
        : container.querySelector('.login-btn');
    if (actionBtn) {
        actionBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (actionBtn.disabled) return;
            actionBtn.disabled = true;
            try {
                if (user) {
                    await signOut(auth);
                    console.log("Signed out");
                } else {
                    await signInWithPopup(auth, provider);
                }
            } catch (error) {
                if (error.code !== 'auth/popup-closed-by-user') {
                    showAuthError(error.message);
                }
            } finally {
                actionBtn.disabled = false;
            }
        });
    }
}

// Listen for auth state changes
let isFirstLoad = true;
onAuthStateChanged(auth, (user) => {
    updateUserUI(user);
    window.currentUser = user;

    if (typeof window.updateWelcomeUsername === 'function') {
        window.updateWelcomeUsername();
    }

    if (user) {
        setTimeout(() => {
            if (window.loadUserConversations) {
                window.loadUserConversations(user.uid);
            }
        }, 100);
    } else {
        const historyList = document.getElementById('chat-history-list');
        if (historyList) {
            historyList.innerHTML = '<div class="history-placeholder">Sign in to see your chats</div>';
        }
        window.currentConversationId = null;
    }

    if (isFirstLoad && !user) {
        isFirstLoad = false;
        attemptAutoPopup();
    } else {
        isFirstLoad = false;
    }
});

// ✅ EXPORT db (and auth if needed)
export { db, auth };