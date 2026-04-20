// js/utils/toast.js — Improved: better positioning, stack limit, smooth animations

(function() {
    let toastContainer = null;
    let activeToasts = 0;
    const MAX_VISIBLE_TOASTS = 3;
    
    function createContainer() {
        if (toastContainer) return;
        toastContainer = document.createElement('div');
        toastContainer.id = 'dolphin-toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
            pointer-events: none;
            max-width: 90vw;
        `;
        document.body.appendChild(toastContainer);
    }
    
    function showToast(message, type = 'info', duration = 3000) {
        createContainer();
        
        // Limit visible toasts
        if (activeToasts >= MAX_VISIBLE_TOASTS) {
            const firstToast = toastContainer.firstChild;
            if (firstToast) firstToast.remove();
            activeToasts--;
        }
        
        const toast = document.createElement('div');
        toast.className = `dolphin-toast dolphin-toast-${type}`;
        
        // Color based on type
        let color, bg;
        switch(type) {
            case 'error':
                color = '#ff6b6b';
                bg = 'rgba(30, 30, 42, 0.95)';
                break;
            case 'success':
                color = '#51cf66';
                bg = 'rgba(30, 30, 42, 0.95)';
                break;
            case 'info':
            default:
                color = '#facc15';
                bg = 'rgba(30, 30, 42, 0.95)';
                break;
        }
        
        toast.style.cssText = `
            background: ${bg};
            color: ${color};
            padding: 10px 20px;
            border-radius: 40px;
            font-size: 0.85rem;
            border: 1px solid ${color};
            backdrop-filter: blur(12px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
            animation: toastSlideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
            text-align: center;
            max-width: 90vw;
            white-space: nowrap;
            overflow-x: auto;
            font-family: inherit;
        `;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        activeToasts++;
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.2s ease forwards';
            toast.addEventListener('animationend', () => {
                if (toast.parentNode) toast.remove();
                activeToasts--;
            }, { once: true });
        }, duration);
    }
    
    // Add keyframes if not already present
    if (!document.querySelector('#toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'toast-keyframes';
        style.textContent = `
            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) translateX(-50%);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) translateX(-50%);
                }
            }
            @keyframes toastSlideOut {
                from {
                    opacity: 1;
                    transform: translateY(0) translateX(-50%);
                }
                to {
                    opacity: 0;
                    transform: translateY(-15px) translateX(-50%);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    window.showToast = showToast;
})();