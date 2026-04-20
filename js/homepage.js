(function() {
        // smooth scroll + custom cursor + scroll reveal + interactive hover effects
        const cursor = document.getElementById('cursorDot');
        if (cursor) {
            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
                cursor.style.opacity = '0.75';
            });
            const interactiveElements = document.querySelectorAll('a, button, .feature-card, .btn-primary, .mockup, .step');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('active'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
            });
            document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
            document.addEventListener('mouseenter', () => cursor.style.opacity = '0.75');
        }

        // scroll reveal observer (enhanced)
        const animated = document.querySelectorAll('[data-aos]');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
        animated.forEach(el => revealObserver.observe(el));

        // smooth anchor scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const targetElem = document.querySelector(targetId);
                if (targetElem) {
                    e.preventDefault();
                    targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // subtle background parallax movement based on mouse (minimal)
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            const orb = document.querySelector('.ambient-orb');
            if (orb) {
                orb.style.transform = `translate(${moveX * 0.5}px, ${moveY * 0.5}px)`;
            }
            const orb2 = document.querySelector('.ambient-orb-second');
            if (orb2) {
                orb2.style.transform = `translate(${moveX * -0.3}px, ${moveY * 0.2}px)`;
            }
        });
    })();