/* ============================================================
   GeoBit — Main JavaScript
   Animations, 3D Effects, Interactivity
   ============================================================ */

'use strict';

// ---- Preloader ----
function adelfHidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
        setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 600);
    }
}

// Лёгкие анимации на IntersectionObserver — почти ничего не стоят, можно
// инициализировать рано, чтобы контент, попавший в кадр, сразу оживал.
// (initMetricBars не трогаем — у него есть свой обработчик на load ниже.)
function adelfInitLightAnims() {
    initCounters();
    initAOS();
}

// Тяжёлые визуальные эффекты (canvas/3D) — только после полной загрузки,
// чтобы не грузить главный поток во время первого показа (низкий TBT).
function adelfInitHeavyAnims() {
    initHeroCanvas();
    initAboutCubesLazy();
    initH1LetterFlee();
}

// Прячем прелоадер и показываем контент СРАЗУ, как только готов DOM.
// style.css блокирующий → к этому моменту страница уже оформлена, «мелькания»
// нет. Раньше ждали load + 1800 мс — именно это держало LCP на ~7 секундах.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        adelfHidePreloader();
        adelfInitLightAnims();
    });
} else {
    adelfHidePreloader();
    adelfInitLightAnims();
}

// Тяжёлые эффекты и страховочное скрытие прелоадера — на полную загрузку.
window.addEventListener('load', () => {
    adelfHidePreloader();
    adelfInitHeavyAnims();
});

// Жёсткий предохранитель: прелоадер точно уйдёт, даже если что-то пойдёт не так.
setTimeout(adelfHidePreloader, 5000);

// ---- Navbar Scroll ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    handleScrollTop();
});

// ---- Burger Menu ----
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

if (burgerBtn && navLinks) {
    burgerBtn.addEventListener('click', () => {
        burgerBtn.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close on nav link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            burgerBtn.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// ---- Active Nav Link ----
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
setActiveNavLink();

// ---- Hero Canvas — Particle Field ----
function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let mouse = { x: W / 2, y: H / 2 };

    // Resize
    const resizeObserver = new ResizeObserver(() => {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    });
    resizeObserver.observe(canvas);

    document.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    // Particles
    const particles = [];
    const colors = ['#7c00ff', '#ff3399', '#00e5ff', '#00ff7f'];
    // На светлом фоне линии-связи делаем контрастнее
    let lineBoost = document.documentElement.getAttribute('data-theme') === 'light' ? 1.8 : 1;
    window.addEventListener('adelf:themechange', function (e) {
        lineBoost = e.detail && e.detail.theme === 'light' ? 1.8 : 1;
    });
    const NUM = Math.floor((W * H) / 15000);

    for (let i = 0; i < Math.max(40, NUM); i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.6 + 0.1,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            pulseOffset: Math.random() * Math.PI * 2
        });
    }

    let frame = 0;
    let heroVisible = true;
    let heroRunning = false;
    function animate() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(124,0,255,${0.12 * lineBoost * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw mouse connection
        particles.forEach(p => {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0,229,255,${0.2 * lineBoost * (1 - dist / 180)})`;
                ctx.lineWidth = 0.8;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        });

        // Draw particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                p.vx += (dx / dist) * 0.05;
                p.vy += (dy / dist) * 0.05;
            }

            // Damping
            p.vx *= 0.98;
            p.vy *= 0.98;

            // Bounds
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;

            // Pulse alpha
            const pulse = Math.sin(frame * p.pulseSpeed + p.pulseOffset) * 0.3 + 0.7;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * pulse;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        if (heroVisible) requestAnimationFrame(animate);
        else heroRunning = false;
    }
    // Рисуем только когда hero виден на экране (экономит CPU при прокрутке вниз)
    const startHero = () => { if (!heroRunning) { heroRunning = true; animate(); } };
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            heroVisible = entries[0].isIntersecting;
            if (heroVisible) startHero();
        });
        io.observe(canvas);
    }
    startHero();
}

// ---- CTA Canvas — Animated Gradient ----
function initCtaCanvas() {
    const canvas = document.getElementById('ctaCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const resizeObserver = new ResizeObserver(() => {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    });
    resizeObserver.observe(canvas);

    let frame = 0;
    function draw() {
        frame += 0.005;
        ctx.clearRect(0, 0, W, H);

        // Animated radial gradients
        const orbs = [
            { x: W * (0.3 + Math.sin(frame) * 0.2), y: H * 0.5, r: W * 0.4, color: 'rgba(124,0,255,0.12)' },
            { x: W * (0.7 + Math.cos(frame * 1.3) * 0.2), y: H * 0.5, r: W * 0.35, color: 'rgba(255,51,153,0.08)' },
            { x: W * 0.5, y: H * (0.3 + Math.sin(frame * 0.7) * 0.3), r: W * 0.3, color: 'rgba(0,229,255,0.06)' },
        ];

        orbs.forEach(orb => {
            const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
            g.addColorStop(0, orb.color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        });

        requestAnimationFrame(draw);
    }
    draw();
}

// Init CTA canvas when page loads
window.addEventListener('load', initCtaCanvas);

// ---- Counter Animation ----
function initCounters() {
    const counters = document.querySelectorAll('.stat-num[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current);
        }, 20);
    });
}

// ---- AOS (Animate on Scroll) ----
function initAOS() {
    const elements = document.querySelectorAll('[data-aos]');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-visible');
                }, parseInt(delay));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ---- Metric Bars Animation ----
function initMetricBars() {
    const bars = document.querySelectorAll('.metric-fill[data-width]');
    if (bars.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.getAttribute('data-width');
                setTimeout(() => {
                    entry.target.style.width = width + '%';
                }, 300);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    bars.forEach(bar => observer.observe(bar));
}
window.addEventListener('load', initMetricBars);

// ---- Testimonials Slider ----
function initSlider() {
    const track = document.getElementById('testimonialsTrack');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsContainer = document.getElementById('sliderDots');
    if (!track) return;

    const cards = track.querySelectorAll('.testimonial-card');
    const total = cards.length;
    let current = 0;
    let autoplayInterval;

    // Set track width
    track.style.gridTemplateColumns = `repeat(${total}, 100%)`;

    // Create dots
    if (dotsContainer) {
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Слайд ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        }
    }

    function goTo(index) {
        current = ((index % total) + total) % total;
        track.style.transform = `translateX(-${current * 100}%)`;
        if (dotsContainer) {
            dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        }
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });

    // Autoplay
    let autoplayPaused = false;
    function startAutoplay() {
        clearInterval(autoplayInterval);
        if (autoplayPaused) return;
        autoplayInterval = setInterval(next, 5000);
    }
    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
    startAutoplay();

    // Пауза автопрокрутки, пока раскрыт хотя бы один отзыв
    document.addEventListener('adelf:testimonial-toggle', function (e) {
        autoplayPaused = !!(e.detail && e.detail.anyOpen);
        if (autoplayPaused) {
            clearInterval(autoplayInterval);
        } else {
            startAutoplay();
        }
    });

    // Touch swipe
    let startX = 0;
    const slider = document.getElementById('testimonialsSlider');
    if (slider) {
        slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        slider.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? next() : prev();
                resetAutoplay();
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', initSlider);

// ---- Portfolio Filter ----
function initPortfolioFilter() {
    // Каждая секция с фильтром обрабатывается независимо (главная, страница портфолио)
    const sections = document.querySelectorAll('.portfolio, .portfolio-page');
    sections.forEach(section => {
        const filterBtns = section.querySelectorAll('.filter-btn');
        // Поддерживаем и новые карточки (.pf-card), и старую разметку (.portfolio-item)
        const items = section.querySelectorAll('.pf-card, .portfolio-item');
        if (filterBtns.length === 0 || items.length === 0) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                items.forEach(item => {
                    const category = item.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        item.classList.remove('hidden');
                        item.style.animation = 'filterIn 0.4s ease forwards';
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    });
}
document.addEventListener('DOMContentLoaded', initPortfolioFilter);

// ---- Scroll to Top ----
const scrollTopBtn = document.getElementById('scrollTop');
function handleScrollTop() {
    if (scrollTopBtn) {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }
}
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ---- Smooth Scroll for Anchor Links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ---- Contact Form ---- (удалён демо-обработчик: форма шлётся через свой AJAX на странице)

// ---- Hero Parallax ----
function initParallax() {
    const heroContent = document.querySelector('.hero-content');
    const heroBgGrid = document.querySelector('.hero-bg-grid');
    if (!heroContent) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
            heroContent.style.opacity = `${1 - scrolled / (window.innerHeight * 0.7)}`;
            if (heroBgGrid) {
                heroBgGrid.style.transform = `translateY(${scrolled * 0.1}px)`;
            }
        }
    }, { passive: true });
}
document.addEventListener('DOMContentLoaded', initParallax);

// ---- Glitch Text Effect ----
function initGlitch() {
    const glitchElements = document.querySelectorAll('.glitch');
    glitchElements.forEach(el => {
        el.setAttribute('data-text', el.textContent);
    });
}
document.addEventListener('DOMContentLoaded', initGlitch);

// ---- Magnetic Buttons ----
function initMagneticButtons() {
    const btns = document.querySelectorAll('.btn-primary');
    btns.forEach(btn => {
        btn.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            this.style.transform = `translate(${x * 0.15}px, ${y * 0.3}px) translateY(-2px)`;
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}
document.addEventListener('DOMContentLoaded', initMagneticButtons);

// ---- Text Reveal Animation ----
// Появление контента героя перенесено в чистый CSS (@keyframes heroReveal
// в style.css): один прогон, без зависимости от таймингов и прелоадера.
// JS-версия ниже давала «двойную» анимацию с пустым местом после того,
// как показ контента ускорили (её задержки ~1900 мс были рассчитаны на
// старый прелоадер, уходивший на load + 1800 мс).
function initTextReveal() { /* не используется — см. CSS-анимацию heroReveal */ }

// ---- Service Cards Hover 3D ----
function init3DCards() {
    const cards = document.querySelectorAll('.service-card, .adv-item, .portfolio-item');
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateY = (x - 0.5) * 10;
            const rotateX = (0.5 - y) * 10;
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.transition = 'transform 0.5s ease';
        });
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.1s ease, border-color 0.3s, box-shadow 0.3s';
        });
    });
}
document.addEventListener('DOMContentLoaded', init3DCards);

// ---- RGB Glow Cursor Trail (Desktop only) ----
function initCursorTrail() {
    if (window.innerWidth < 1024) return;
    // Не запускаем на сенсорных устройствах — курсора нет, цикл крутился бы вхолостую
    if (window.matchMedia('(hover: none)').matches || 'ontouchstart' in window) return;
    const trail = [];
    const colors = ['#fff', '#000', '#fff'];
    const NUM_TRAILS = 10;
    for (let i = 0; i < NUM_TRAILS; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: fixed;
            width: ${8 - i}px;
            height: ${8 - i}px;
            border-radius: 50%;
            background: ${colors[i % colors.length]};
            pointer-events: none;
            z-index: 9999;
            opacity: ${0.6 - i * 0.08};
            transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
            filter: blur(${i * 0.5}px);
        `;
        document.body.appendChild(dot);
        trail.push({ el: dot, x: -100, y: -100, baseSize: 8 - i });
    }

    let mouseX = -100, mouseY = -100;
    let isHoveringLink = false;
    let running = false;
    let idleFrames = 0;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isHoveringLink = e.target.closest('a, button, [role="button"]') !== null;
        idleFrames = 0;
        if (!running) { running = true; requestAnimationFrame(animateTrail); }
    });

    function animateTrail() {
        let x = mouseX, y = mouseY;
        let maxMove = 0;
        trail.forEach((t, i) => {
            const scale = isHoveringLink ? 2.5 : 1;
            const size = t.baseSize * scale;
            t.el.style.width = `${size}px`;
            t.el.style.height = `${size}px`;
            t.el.style.opacity = isHoveringLink
                ? Math.min((0.6 - i * 0.08) * 1.4, 1)
                : (0.6 - i * 0.08);

            t.el.style.left = `${x - size / 2}px`;
            t.el.style.top = `${y - size / 2}px`;

            const next = trail[i + 1] || trail[0];
            next.x = x;
            next.y = y;
            const mvx = (t.x - x) * 0.4, mvy = (t.y - y) * 0.4;
            maxMove = Math.max(maxMove, Math.abs(mvx), Math.abs(mvy));
            x += mvx;
            y += mvy;
        });
        // Если точки почти доехали и мышь не двигается — останавливаем цикл
        if (maxMove < 0.1) { idleFrames++; } else { idleFrames = 0; }
        if (idleFrames > 5) { running = false; return; }
        requestAnimationFrame(animateTrail);
    }
}
document.addEventListener('DOMContentLoaded', initCursorTrail);

// ---- Number Counter on Scroll ----
function initScrollCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-counter'));
                let current = 0;
                const increment = target / 80;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = Math.floor(current);
                }, 16);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', initScrollCounters);

// ---- Blog Filter ----
function initBlogFilter() {
    const filterBtns = document.querySelectorAll('.blog-filter-btn');
    const blogCards = document.querySelectorAll('.blog-card-filterable');
    if (filterBtns.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            blogCards.forEach(card => {
                const cat = card.getAttribute('data-category');
                if (filter === 'all' || cat === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}
document.addEventListener('DOMContentLoaded', initBlogFilter);

// ---- Add CSS animation for filter ----
const style = document.createElement('style');
style.textContent = `
@keyframes filterIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
`;
document.head.appendChild(style);

// ---- Typing Effect for Hero ----
function initTypingEffect() {
    const typingEl = document.querySelector('.typing-text');
    if (!typingEl) return;

    const texts = ['Создаём сайты', 'Разрабатываем дизайн', 'Продвигаем в SEO', 'Делаем логотипы'];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const current = texts[textIndex];
        if (!isDeleting) {
            typingEl.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            if (charIndex === current.length) {
                isDeleting = true;
                setTimeout(type, 1800);
                return;
            }
        } else {
            typingEl.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
            }
        }
        setTimeout(type, isDeleting ? 50 : 80);
    }
    type();
}
document.addEventListener('DOMContentLoaded', initTypingEffect);

// ---- Intersection Observer for page sections ----
function initSectionReveal() {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.05 });
    sections.forEach(s => observer.observe(s));
}
document.addEventListener('DOMContentLoaded', initSectionReveal);

// ---- WordPress AJAX Contact Form ---- (удалён дубль: форма шлётся обработчиком на странице контактов)


// ---- About Cubes — 3D-поле кубов (Three.js) ----
/**
 * Ленивая подгрузка самой библиотеки Three.js (~117 КБ).
 * Раньше библиотека грузилась в <head> на всей главной, даже на мобильных,
 * где кубы вообще не показываются. Теперь она скачивается ТОЛЬКО когда блок
 * кубов реально приближается к экрану и устройство подходит (десктоп).
 * Это убирает ~117 КБ JS с мобайла и откладывает их на десктопе — сильно
 * улучшает FCP/LCP/TBT и снимает замечание «неиспользуемый JavaScript».
 */
function adelfLoadThree() {
    return new Promise(function (resolve, reject) {
        if (typeof THREE !== 'undefined') { resolve(); return; }
        var existing = document.getElementById('adelf-threejs');
        if (existing) {
            existing.addEventListener('load', function () { resolve(); });
            existing.addEventListener('error', reject);
            return;
        }
        var url = (window.adelfCube && window.adelfCube.three)
            ? window.adelfCube.three
            : 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        var s = document.createElement('script');
        s.id = 'adelf-threejs';
        s.src = url;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function initAboutCubesLazy() {
    const canvas = document.getElementById('cubesCanvas');
    const aboutSec = document.querySelector('.about');
    // Нет блока кубов (не главная) — выходим без затрат
    if (!canvas || !aboutSec) return;
    // На мобильных/сенсорных и узких экранах 3D не запускаем —
    // экономим CPU, батарею и трафик (библиотека даже не скачивается),
    // улучшаем INP/LCP на мобайле.
    if (window.innerWidth < 1024 || window.matchMedia('(hover: none)').matches || 'ontouchstart' in window) {
        canvas.style.display = 'none';
        return;
    }

    let started = false;
    const start = () => {
        if (started) return;
        started = true;
        // Скачиваем библиотеку по требованию, затем инициализируем сцену
        adelfLoadThree().then(initAboutCubes).catch(function () {
            // Не удалось загрузить Three.js — просто прячем canvas, страница цела
            canvas.style.display = 'none';
        });
    };

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { start(); io.disconnect(); }
            });
        }, { rootMargin: '200px' }); // запустить чуть заранее, до полного появления
        io.observe(aboutSec);
    } else {
        // старые браузеры — просто запускаем
        start();
    }
}

function initAboutCubes() {
    const canvas = document.getElementById('cubesCanvas');
    const aboutSec = document.querySelector('.about');
    if (!canvas || !aboutSec || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    // Цвет тумана зависит от темы: тёмно-фиолетовый в dark, светло-серо-голубой в light
    function fogColorForTheme() {
        return document.documentElement.getAttribute('data-theme') === 'light'
            ? 0xe9edf6 : 0x070510;
    }
    scene.fog = new THREE.Fog(fogColorForTheme(), 10, 30);
    window.addEventListener('adelf:themechange', function () {
        if (scene.fog) scene.fog.color.setHex(fogColorForTheme());
    });
    const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    camera.position.set(0, 11, 18);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    function resize() {
        const w = canvas.offsetWidth, h = canvas.offsetHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    ro.observe(aboutSec);

    const GRID = 24, GAP = 1.25;
    // Нейтральные «болванки» кубов: тёмные в dark, светло-серые в light,
    // чтобы поле читалось на светлом фоне. Неоновые акценты общие.
    var _cubeLight = document.documentElement.getAttribute('data-theme') === 'light';
    const neutral1 = _cubeLight ? 0xc7cfe0 : 0x2a2440;
    const neutral2 = _cubeLight ? 0xd8deec : 0x1a1530;
    const palette = [0x7b2fff, 0xff3399, 0x00e5ff, neutral1, neutral2];
    const weights = [0.22, 0.22, 0.18, 0.20, 0.18];
    function pickColor() { let r = Math.random(), acc = 0; for (let i = 0; i < palette.length; i++) { acc += weights[i]; if (r < acc) return palette[i]; } return palette[0]; }

    const cubes = [];
    const field = new THREE.Group(); scene.add(field);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const offset = (GRID - 1) * GAP / 2;
    const half = (GRID - 1) / 2;
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        const ni = (i - half) / half, nj = (j - half) / half;
        const edge = Math.max(Math.abs(ni), Math.abs(nj));
        const dropChance = Math.max(0, (edge - 0.45)) * 1.3;
        if (Math.random() < dropChance) continue;
        const col = pickColor();
        const isNeon = (col === 0x7b2fff || col === 0xff3399 || col === 0x00e5ff);
        const mat = new THREE.MeshStandardMaterial({
            color: col, metalness: 0.4, roughness: 0.45,
            emissive: isNeon ? col : 0x000000, emissiveIntensity: isNeon ? 0.25 : 0,
            transparent: !isNeon && Math.random() < 0.3, opacity: !isNeon && Math.random() < 0.3 ? 0.5 : 1
        });
        const m = new THREE.Mesh(geo, mat);
        const jit = edge * 0.35;
        const baseH = 0.4 + Math.random() * 1.6;
        m.position.set(i * GAP - offset + (Math.random() - 0.5) * jit, baseH / 2, j * GAP - offset + (Math.random() - 0.5) * jit);
        m.scale.y = baseH;
        cubes.push({ m, baseH, gx: m.position.x, gz: m.position.z });
        field.add(m);
    }
    field.rotation.y = -0.5;

    var _isLight = document.documentElement.getAttribute('data-theme') === 'light';
    scene.add(new THREE.AmbientLight(_isLight ? 0x8890b0 : 0x404060, _isLight ? 1.15 : 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(5, 12, 8); scene.add(d);
    const p1 = new THREE.PointLight(0xff3399, 1.2, 40); p1.position.set(-8, 8, 6); scene.add(p1);
    const p2 = new THREE.PointLight(0x00e5ff, 1.0, 40); p2.position.set(8, 7, -4); scene.add(p2);

    const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3(); let haveHit = false;
    let camX = 0, camTargetX = 0;

    function updatePointer(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
        ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(ndc, camera);
        haveHit = ray.ray.intersectPlane(plane, hit);
        camTargetX = ndc.x * 3;
    }

    aboutSec.addEventListener('mousemove', e => {
        updatePointer(e.clientX, e.clientY);
    });
    aboutSec.addEventListener('mouseleave', () => { haveHit = false; camTargetX = 0; });
    aboutSec.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        if (!touch) return;
        updatePointer(touch.clientX, touch.clientY);
    }, { passive: true });

    let t = 0;
    const wp = new THREE.Vector3();
    (function animate() {
        requestAnimationFrame(animate);
        t += 0.016;
        camX += (camTargetX - camX) * 0.05;
        camera.position.x = camX; camera.lookAt(0, 1, 0);
        cubes.forEach(c => {
            let target = c.baseH + Math.sin(t * 1.2 + c.gx * 0.4 + c.gz * 0.3) * 0.15;
            if (haveHit) {
                c.m.getWorldPosition(wp);
                const dx = wp.x - hit.x, dz = wp.z - hit.z, dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 7) { const lift = (1 - dist / 7); target += lift * lift * 3.5; }
            }
            c.m.scale.y += (target - c.m.scale.y) * 0.15;
            c.m.position.y = c.m.scale.y / 2;
        });
        renderer.render(scene, camera);
    })();
}

// ---- Анимация букв в заголовках h1 (убегают от курсора) ----
function initH1LetterFlee() {
    const RADIUS = 90, MAX_SHIFT = 22;
    const targets = document.querySelectorAll('h1:not(.hero-title)');
    targets.forEach(el => {
        if (el.dataset.split) return;
        el.dataset.split = '1';
        const walk = (node, inGrad) => {
            const grad = inGrad || (node.nodeType === 1 && node.classList && node.classList.contains('gradient-text'));
            Array.from(node.childNodes).forEach(ch => {
                if (ch.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    // Разбиваем на слова по пробелам, каждое слово — неразрывный контейнер,
                    // внутри которого буквы-спаны. Так перенос строки идёт целыми словами.
                    const tokens = ch.textContent.split(/(\s+)/);
                    tokens.forEach(tok => {
                        if (tok === '') return;
                        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const word = document.createElement('span');
                        word.className = 'ltr-word';
                        Array.from(tok).forEach(c => {
                            const s = document.createElement('span');
                            s.className = grad ? 'ltr-flee ltr-grad' : 'ltr-flee';
                            s.textContent = c;
                            word.appendChild(s);
                        });
                        frag.appendChild(word);
                    });
                    node.replaceChild(frag, ch);
                } else if (ch.nodeType === 1) {
                    walk(ch, grad);
                }
            });
        };
        walk(el, false);
    });
    const letters = Array.from(document.querySelectorAll('.ltr-flee')).map(el => ({ el, x: 0, y: 0 }));
    if (!letters.length) return;
    let mx = -9999, my = -9999;
    let running = false;
    let idleFrames = 0;
    const wake = () => { idleFrames = 0; if (!running) { running = true; requestAnimationFrame(loop); } };
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; wake(); });
    window.addEventListener('mouseout', () => { mx = -9999; my = -9999; wake(); });
    function loop() {
        let maxMove = 0;
        letters.forEach(L => {
            const r = L.el.getBoundingClientRect();
            const cx = r.left + r.width / 2 - L.x, cy = r.top + r.height / 2 - L.y;
            const dx = cx - mx, dy = cy - my, dist = Math.hypot(dx, dy);
            let tx = 0, ty = 0, near = false;
            if (dist < RADIUS) {
                near = true;
                const f = (1 - dist / RADIUS);
                tx = (dx / (dist || 1)) * f * MAX_SHIFT;
                ty = (dy / (dist || 1)) * f * MAX_SHIFT;
            }
            const mvx = (tx - L.x) * 0.18, mvy = (ty - L.y) * 0.18;
            L.x += mvx;
            L.y += mvy;
            maxMove = Math.max(maxMove, Math.abs(mvx), Math.abs(mvy));
            L.el.style.transform = `translate(${L.x.toFixed(2)}px,${L.y.toFixed(2)}px)`;
            L.el.classList.toggle('near', near && (Math.abs(L.x) + Math.abs(L.y) > 1.5));
        });
        // буквы доехали и мышь не движется — останавливаем цикл
        if (maxMove < 0.05) { idleFrames++; } else { idleFrames = 0; }
        if (idleFrames > 5) { running = false; return; }
        requestAnimationFrame(loop);
    }
}

console.log('%cGeoBit Studio', 'color: #7c00ff; font-size: 20px; font-weight: bold;');
console.log('%cWebsite built with passion ❤️', 'color: #00e5ff; font-size: 14px;');

// ---- FAQ аккордеон ----
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var items = document.querySelectorAll('.faq-item');
        items.forEach(function (item) {
            var btn = item.querySelector('.faq-question');
            if (!btn) return;
            btn.addEventListener('click', function () {
                var isOpen = item.classList.contains('is-open');
                // закрыть все
                items.forEach(function (i) {
                    i.classList.remove('is-open');
                    var b = i.querySelector('.faq-question');
                    if (b) b.setAttribute('aria-expanded', 'false');
                });
                // открыть текущий, если был закрыт
                if (!isOpen) {
                    item.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    });
})();

// ============================================================
//  Переключатель темы (Dark / Light)
//  Тема уже установлена ранним скриптом в <head> (anti-FOUC).
//  Здесь: синхронизируем кнопку, переключаем по клику,
//  сохраняем выбор и реагируем на системную тему до первого выбора.
// ============================================================
(function () {
    'use strict';
    var KEY = 'adelf-theme';
    var root = document.documentElement;
    // Светлая тема отключена: сайт всегда тёмный.
    root.setAttribute('data-theme', 'dark');
    try { localStorage.removeItem(KEY); } catch (e) {}
    if (true) return;

    function currentTheme() {
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function syncToggle(btn, theme) {
        if (!btn) return;
        var isLight = theme === 'light';
        btn.setAttribute('aria-checked', isLight ? 'true' : 'false');
        var label = isLight ? 'Включить тёмную тему' : 'Включить светлую тему';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
    }

    function applyTheme(theme, persist) {
        root.setAttribute('data-theme', theme);
        if (persist) {
            try { localStorage.setItem(KEY, theme); } catch (e) {}
        }
        // Дать знать остальному коду (например, 3D-сцене), что тема сменилась
        window.dispatchEvent(new CustomEvent('adelf:themechange', { detail: { theme: theme } }));
    }

    function init() {
        var btn = document.getElementById('themeToggle');
        syncToggle(btn, currentTheme());

        if (btn) {
            btn.addEventListener('click', function () {
                var next = currentTheme() === 'light' ? 'dark' : 'light';
                applyTheme(next, true);
                syncToggle(btn, next);
            });
        }

        // Пометим кастомный логотип как адаптивный (для точечных фильтров в CSS)
        document.querySelectorAll('.custom-logo, img.custom-logo').forEach(function (el) {
            el.classList.add('theme-adaptive-logo');
        });

        // Пока пользователь не сделал явный выбор — следуем за системной темой
        if (window.matchMedia) {
            var mq = window.matchMedia('(prefers-color-scheme: light)');
            var onChange = function (e) {
                var saved;
                try { saved = localStorage.getItem(KEY); } catch (err) {}
                if (saved === 'light' || saved === 'dark') return; // выбор уже сделан
                var sys = e.matches ? 'light' : 'dark';
                applyTheme(sys, false);
                syncToggle(btn, sys);
            };
            if (mq.addEventListener) mq.addEventListener('change', onChange);
            else if (mq.addListener) mq.addListener(onChange);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// ============================================================
//  Отзывы: обрезка до 3 строк + кнопка «Читать далее»
//  Текст выводится как в редакторе (форматирование сохранено).
//  Кнопка появляется только если отзыв реально длиннее 3 строк.
// ============================================================
(function () {
    'use strict';

    function setup() {
        var wraps = document.querySelectorAll('.testimonial-text-wrap');
        if (!wraps.length) return;

        wraps.forEach(function (wrap) {
            var text = wrap.querySelector('.testimonial-text');
            var btn  = wrap.querySelector('.testimonial-more');
            if (!text || !btn) return;

            // Есть ли переполнение при обрезке в 3 строки?
            function isOverflowing() {
                return text.scrollHeight - text.clientHeight > 2;
            }

            // Показать кнопку только если текст обрезан
            function evaluate() {
                if (wrap.classList.contains('is-open')) return; // раскрытые не трогаем
                if (isOverflowing()) {
                    text.classList.add('is-clamped');
                    btn.classList.add('is-visible');
                } else {
                    text.classList.remove('is-clamped');
                    btn.classList.remove('is-visible');
                }
            }

            evaluate();

            btn.addEventListener('click', function () {
                var open = wrap.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                var txt = btn.querySelector('.testimonial-more-txt');
                if (txt) txt.textContent = open ? 'Свернуть' : 'Читать далее';
                if (!open) {
                    // при сворачивании — снова оценить обрезку
                    text.classList.add('is-clamped');
                }
                // Сообщаем слайдеру, что нужно приостановить автопрокрутку
                document.dispatchEvent(new CustomEvent('adelf:testimonial-toggle', {
                    detail: { anyOpen: !!document.querySelector('.testimonial-text-wrap.is-open') }
                }));
            });

            // Пересчёт при ресайзе (перенос строк меняется)
            var rt;
            window.addEventListener('resize', function () {
                clearTimeout(rt);
                rt = setTimeout(evaluate, 200);
            });
        });

        // Шрифты могут догрузиться позже — пересчитать после их загрузки
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                wraps.forEach(function (wrap) {
                    if (wrap.classList.contains('is-open')) return;
                    var text = wrap.querySelector('.testimonial-text');
                    var btn  = wrap.querySelector('.testimonial-more');
                    if (text && btn && text.scrollHeight - text.clientHeight > 2) {
                        text.classList.add('is-clamped');
                        btn.classList.add('is-visible');
                    }
                });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();

// ============================================================
//  Ховер-превью карточек портфолио.
//  Пока курсор не наведён — статичная обложка. При наведении
//  проигрывается видео (приоритет, легче) или GIF. Медиа грузится
//  лениво (только при первом наведении / появлении во вьюпорте),
//  чтобы не нагружать страницу. Уважает prefers-reduced-motion.
// ============================================================
(function () {
    'use strict';

    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function loadSrc(anim) {
        if (anim.dataset.loaded) return;
        anim.dataset.loaded = '1';
        var src = anim.getAttribute('data-src');
        if (!src) return;
        if (anim.tagName === 'VIDEO') {
            anim.src = src;
            anim.load();
        } else {
            anim.src = src; // GIF стартует с начала при установке src
        }
    }

    function play(media) {
        var anim = media.querySelector('.pf-card-media__anim');
        if (!anim) return;
        loadSrc(anim);
        media.classList.add('is-playing');
        if (anim.tagName === 'VIDEO') {
            var p = anim.play();
            if (p && typeof p.catch === 'function') { p.catch(function () {}); }
        }
    }

    function stop(media) {
        var anim = media.querySelector('.pf-card-media__anim');
        if (!anim) return;
        media.classList.remove('is-playing');
        if (anim.tagName === 'VIDEO') {
            try { anim.pause(); anim.currentTime = 0; } catch (e) {}
        }
    }

    function init() {
        var medias = document.querySelectorAll('.pf-card-media.has-anim');
        if (!medias.length) return;

        var canHover = !(window.matchMedia && window.matchMedia('(hover: none)').matches);

        medias.forEach(function (media) {
            if (canHover && !reduce) {
                media.addEventListener('pointerenter', function () { play(media); });
                media.addEventListener('pointerleave', function () { stop(media); });
            }
        });

        // На тач-устройствах (нет hover) — предзагрузка отключена; проигрываем
        // короткий превью, когда карточка появляется во вьюпорте, если это не
        // противоречит настройкам экономии движения.
        if (!canHover && !reduce && 'IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { play(en.target); }
                    else { stop(en.target); }
                });
            }, { threshold: 0.6 });
            medias.forEach(function (m) { io.observe(m); });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* ============================================================
   Выпадающее меню «Услуги»
   (перенесено из инлайнового <script> в header.php)
   Десктоп — по ховеру (CSS), мобайл/тач — аккордеон по тапу.
   ============================================================ */
(function () {
    function initServicesDropdown() {
        document.querySelectorAll('.nav-links .has-dropdown').forEach(function (li) {
            var toggle = li.querySelector('.nav-drop-toggle');
            var caret  = li.querySelector('.nav-drop-caret');
            function flip(e) {
                e.preventDefault();
                e.stopPropagation();
                var open = li.classList.toggle('drop-open');
                if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
            if (toggle) toggle.addEventListener('click', flip);
            // На тач-устройствах тап по стрелке рядом с текстом тоже раскрывает список
            if (caret) caret.addEventListener('click', function (e) {
                if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 992) flip(e);
            });
        });
        // Клик мимо — закрыть (десктоп)
        document.addEventListener('click', function (e) {
            document.querySelectorAll('.nav-links .has-dropdown.drop-open').forEach(function (li) {
                if (!li.contains(e.target)) {
                    li.classList.remove('drop-open');
                    var t = li.querySelector('.nav-drop-toggle');
                    if (t) t.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initServicesDropdown);
    } else {
        initServicesDropdown();
    }
})();
