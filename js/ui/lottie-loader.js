// js/ui/lottie-loader.js
// Enhanced Lottie animation loader for welcome screen with interactions

(function() {
    // ========== CONFIGURATION ==========
    const ANIMATION_PATH = 'animations/dolphin_welcome_animation.json';
    const CONTAINER_ID = 'dolphin-animation';
    const HOVER_SPEED = 1.8;        // Hover pe 1.8x tez
    const NORMAL_SPEED = 1.0;
    const LOOP = true;
    const AUTOPLAY = true;
    
    let animation = null;
    let isLoaded = false;
    
    // ========== LOADING INDICATOR ==========
    function showLoading() {
        const container = document.getElementById(CONTAINER_ID);
        if (container && !container.querySelector('.loading-spinner')) {
            container.innerHTML = '<div class="loading-spinner" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"><div style="width: 40px; height: 40px; border: 3px solid rgba(6,182,212,0.2); border-top-color: #06b6d4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div></div>';
            // Add spin animation if not exists
            if (!document.querySelector('#lottie-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'lottie-spinner-style';
                style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }
        }
    }
    
    function hideLoading() {
        const container = document.getElementById(CONTAINER_ID);
        if (container) {
            const spinner = container.querySelector('.loading-spinner');
            if (spinner) spinner.remove();
        }
    }
    
    // ========== FALLBACK EMOJI ==========
    function showFallbackEmoji() {
        hideLoading();
        const container = document.getElementById(CONTAINER_ID);
        if (container) {
            container.innerHTML = '🐬';
            container.style.fontSize = 'clamp(3rem, 15vw, 5rem)';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.animation = 'float 4s infinite ease-in-out';
            console.log('🐬 Fallback emoji active');
        }
    }
    
    // ========== MAIN LOAD FUNCTION ==========
    function loadLottieAnimation() {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) {
            console.warn('Animation container not found');
            return;
        }
        
        // Show loading spinner
        showLoading();
        
        // Check if Lottie library is available
        if (typeof lottie === 'undefined') {
            console.warn('Lottie not loaded, showing fallback emoji');
            showFallbackEmoji();
            return;
        }
        
        try {
            animation = lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: LOOP,
                autoplay: AUTOPLAY,
                path: ANIMATION_PATH,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid meet',
                    clearCanvas: true,
                    progressiveLoad: true,
                    hideOnTransparent: true
                }
            });
            
            // Animation load start
            animation.addEventListener('DOMLoaded', function() {
                console.log('🎬 Lottie DOM loaded');
                hideLoading();
                isLoaded = true;
                
                // Apply initial styles to container
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
            });
            
            // Animation loaded completely
            animation.addEventListener('complete', function() {
                console.log('✅ Animation complete (looping)');
            });
            
            // Error handling
            animation.addEventListener('error', function(err) {
                console.error('Lottie error:', err);
                showFallbackEmoji();
            });
            
            // Setup hover interaction (only if animation loaded)
            animation.addEventListener('DOMLoaded', function() {
                setupHoverInteraction(container);
            });
            
        } catch (error) {
            console.error('Failed to load Lottie animation:', error);
            showFallbackEmoji();
        }
    }
    
    // ========== HOVER INTERACTION (Speed change) ==========
    function setupHoverInteraction(container) {
        if (!container || !animation) return;
        
        container.addEventListener('mouseenter', () => {
            if (animation && isLoaded) {
                animation.setSpeed(HOVER_SPEED);
                container.style.cursor = 'pointer';
                container.style.transform = 'scale(1.02)';
                container.style.transition = 'transform 0.2s ease';
            }
        });
        
        container.addEventListener('mouseleave', () => {
            if (animation && isLoaded) {
                animation.setSpeed(NORMAL_SPEED);
                container.style.transform = 'scale(1)';
            }
        });
        
        // Optional: click to restart animation (fun)
        container.addEventListener('click', () => {
            if (animation && isLoaded) {
                animation.stop();
                animation.play();
                // Add a little bounce effect
                container.style.transform = 'scale(0.98)';
                setTimeout(() => { container.style.transform = ''; }, 150);
            }
        });
    }
    
    // ========== RESIZE HANDLER (responsive) ==========
    function handleResize() {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) return;
        // For Lottie, we just ensure container dimensions are set via CSS
        // No extra action needed usually
    }
    
    window.addEventListener('resize', handleResize);
    
    // ========== INIT ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadLottieAnimation);
    } else {
        loadLottieAnimation();
    }
})();