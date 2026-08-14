// js/modules/auth/featureGuard.js — Fixed: memory leak (observer disconnect), recursion fix

(function() {
    let originalSaveSession = null;
    let originalLoadConversations = null;
    let guestWarningShown = false;
    let intervalId = null;
    let historyObserver = null;
    
    function setGuestModeUI() {
        const historyList = document.getElementById('chat-history-list');
        if (historyList) {
            historyList.style.opacity = '0.6';
            historyList.style.pointerEvents = 'none';
            if (!historyList.innerHTML.includes('history-placeholder')) {
                historyList.innerHTML = '<div class="history-placeholder">🔒 Sign in to save & view your chat history</div>';
            }
        }
        
        // Disable all action buttons
        const disableHistoryActions = () => {
            document.querySelectorAll('.history-rename, .history-delete, .pin-icon').forEach(btn => {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.4';
                btn.title = 'Sign in to modify chats';
            });
        };
        disableHistoryActions();
        
        // Observe for dynamically added items
        if (historyObserver) historyObserver.disconnect();
        historyObserver = new MutationObserver(disableHistoryActions);
        if (historyList) historyObserver.observe(historyList, { childList: true, subtree: true });
        
        // Override save function
        if (window.saveCurrentSession && !originalSaveSession) {
            originalSaveSession = window.saveCurrentSession;
            window.saveCurrentSession = async function() {
                if (!window.currentUser) {
                    if (!guestWarningShown) {
                        if (window.showToast) window.showToast("🔐 Sign in to save chats to cloud", "info", 3000);
                        guestWarningShown = true;
                        setTimeout(() => { guestWarningShown = false; }, 5000);
                    }
                    return;
                }
                return originalSaveSession.call(this);
            };
        }
        
        console.log("🔒 Guest mode: Firestore features disabled");
    }
    
    function setUserModeUI() {
        const historyList = document.getElementById('chat-history-list');
        if (historyList) {
            historyList.style.opacity = '1';
            historyList.style.pointerEvents = 'auto';
        }
        
        // Enable all action buttons
        document.querySelectorAll('.history-rename, .history-delete, .pin-icon').forEach(btn => {
            btn.style.pointerEvents = '';
            btn.style.opacity = '';
            btn.title = '';
        });
        
        // Disconnect observer
        if (historyObserver) {
            historyObserver.disconnect();
            historyObserver = null;
        }
        
        // Restore original functions
        if (originalSaveSession) {
            window.saveCurrentSession = originalSaveSession;
            originalSaveSession = null;
        }
        if (originalLoadConversations) {
            window.loadUserConversations = originalLoadConversations;
            originalLoadConversations = null;
        }
        console.log("✅ User mode: Firestore features enabled");
    }
    
    function applyByUser(user) {
        if (user) setUserModeUI();
        else setGuestModeUI();
    }
    
    function initFeatureGuard() {
        if (typeof window.currentUser !== 'undefined') applyByUser(window.currentUser);
        let lastUser = window.currentUser;
        
        // Clear previous interval
        if (intervalId) clearInterval(intervalId);
        
        // Use requestAnimationFrame instead of setInterval (better performance)
        function checkUserChange() {
            if (window.currentUser !== lastUser) {
                lastUser = window.currentUser;
                applyByUser(window.currentUser);
            }
            requestAnimationFrame(checkUserChange);
        }
        requestAnimationFrame(checkUserChange);
        
        // Properly define currentUser property to avoid recursion
        let _currentUser = window.currentUser;
        Object.defineProperty(window, 'currentUser', {
            get: function() { return _currentUser; },
            set: function(val) {
                if (_currentUser === val) return;
                _currentUser = val;
                applyByUser(val);
            },
            configurable: true
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (intervalId) clearInterval(intervalId);
            if (historyObserver) historyObserver.disconnect();
        });
    }
    
    window.updateFeatureAccess = applyByUser;
    initFeatureGuard();
})();