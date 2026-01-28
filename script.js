// DOM Elements
const navbar = document.getElementById('navbar');
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const bgCanvas = document.getElementById('bg-canvas');

// --- Mobile Menu Toggle & Overlay ---
const createOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
    return overlay;
};

const overlay = createOverlay();

if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        const isActive = mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = isActive ? 'hidden' : '';
    });
}

// Close menu when a link or overlay is clicked
const closeMenu = () => {
    mobileMenu.classList.remove('active');
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
};

navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

overlay.addEventListener('click', closeMenu);

// --- Three.js Background Animation ---
const initThreeJS = () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create a group to hold all particle systems
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    // Characters to display
    const chars = ['{', '}', '</>', ';', '0', '1', 'if', 'var', 'const'];
    const particleCountPerChar = 50; // Total ~450 particles

    // Helper to create texture from character
    const createCharTexture = (char) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.font = 'Bold 40px "Fira Code", monospace';
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    };

    chars.forEach(char => {
        const geometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCountPerChar * 3);

        for (let i = 0; i < particleCountPerChar * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const material = new THREE.PointsMaterial({
            size: 0.2, // Reduced size per user request
            map: createCharTexture(char),
            transparent: true,
            opacity: 0.6,
            depthWrite: false, // Prevent z-fighting transparency issues
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geometry, material);
        particlesGroup.add(points);
    });

    camera.position.z = 3;

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
    });

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);

        // Rotate entire group slowly
        particlesGroup.rotation.y += 0.002;
        particlesGroup.rotation.x += 0.001;

        // Mouse interaction parallax
        particlesGroup.rotation.y += mouseX * 0.05;
        particlesGroup.rotation.x += mouseY * 0.05;


        renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// Initialize Three.js if library is loaded
if (typeof THREE !== 'undefined') {
    initThreeJS();
} else {
    // Fallback if CDN fails or offline
    console.warn('Three.js not loaded');
}

// --- Multi-Page Swipe Navigation Logic ---
const pages = ['index.html', 'about.html', 'skills.html', 'projects.html', 'services.html', 'contact.html'];

// Get current page index
let currentPage = window.location.pathname.split('/').pop();
if (currentPage === '' || currentPage === '/') currentPage = 'index.html';

// Handle edge case if pathname includes full path or query params
if (currentPage.indexOf('.html') === -1) {
    if (window.location.href.includes('index.html')) currentPage = 'index.html';
    else if (window.location.href.includes('about.html')) currentPage = 'about.html';
    else if (window.location.href.includes('skills.html')) currentPage = 'skills.html';
    else if (window.location.href.includes('projects.html')) currentPage = 'projects.html';
    else if (window.location.href.includes('services.html')) currentPage = 'services.html';
    else if (window.location.href.includes('contact.html')) currentPage = 'contact.html';
    else currentPage = 'index.html'; // Default
}

let currentIndex = pages.indexOf(currentPage);
if (currentIndex === -1) currentIndex = 0; // Default to home if not found

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        if (currentIndex < pages.length - 1) navigateToPage(pages[currentIndex + 1]);
    }
    if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) navigateToPage(pages[currentIndex - 1]);
    }
});

// --- Swipe Navigation Logic ---
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 100; // Minimum distance for a swipe

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

const handleSwipe = () => {
    const swipeDistance = touchEndX - touchStartX;

    // Swipe Right (Previous Page)
    if (swipeDistance > swipeThreshold) {
        if (currentIndex > 0) navigateToPage(pages[currentIndex - 1]);
    }
    // Swipe Left (Next Page)
    if (swipeDistance < -swipeThreshold) {
        if (currentIndex < pages.length - 1) navigateToPage(pages[currentIndex + 1]);
    }
};

const navigateToPage = (href) => {
    const overlay = document.querySelector('.page-transition-overlay');
    if (overlay) {
        overlay.classList.remove('page-ready');
        overlay.classList.add('page-exit');
        setTimeout(() => {
            window.location.href = href;
        }, 800);
    } else {
        window.location.href = href;
    }
};


// --- Project Filtering ---
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

// --- Scroll Animations (Intersection Observer) ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.show-on-scroll').forEach(el => {
    observer.observe(el);
});

// --- Testimonials Auto-Slide ---
const slider = document.getElementById('testimonialSlider');
if (slider) {
    const autoSlideInterval = 10000; // 10 Seconds

    const autoSlide = () => {
        // Calculate dynamic step (card width + gap)
        const card = slider.querySelector('.testimonial-card');
        if (!card) return;

        const style = window.getComputedStyle(slider);
        const gap = parseFloat(style.gap) || 32; // Default to 2rem/32px if fails
        const scrollStep = card.offsetWidth + gap;

        // If we reached the end, scroll back to start
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
            slider.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } else {
            slider.scrollBy({ top: 0, left: scrollStep, behavior: 'smooth' });
        }
    };

    let slideTimer = setInterval(autoSlide, autoSlideInterval);

    // Pause on hover
    slider.addEventListener('mouseenter', () => clearInterval(slideTimer));
    slider.addEventListener('mouseleave', () => slideTimer = setInterval(autoSlide, autoSlideInterval));

    // Arrow Button Functionality
    const leftBtn = document.getElementById('slideLeft');
    const rightBtn = document.getElementById('slideRight');

    const getScrollStep = () => {
        const card = slider.querySelector('.testimonial-card');
        if (!card) return 340;
        const style = window.getComputedStyle(slider);
        const gap = parseFloat(style.gap) || 32;
        return card.offsetWidth + gap;
    };

    if (leftBtn) {
        leftBtn.addEventListener('click', () => {
            clearInterval(slideTimer); // Stop auto-slide on interaction
            const step = getScrollStep();
            slider.scrollBy({ top: 0, left: -step, behavior: 'smooth' });
            slideTimer = setInterval(autoSlide, autoSlideInterval); // Restart timer
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('click', () => {
            clearInterval(slideTimer); // Stop auto-slide on interaction
            const step = getScrollStep();
            // Check if at end to loop manually or just scroll
            if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
                slider.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ top: 0, left: step, behavior: 'smooth' });
            }
            slideTimer = setInterval(autoSlide, autoSlideInterval); // Restart timer
        });
    }
}
// --- 3D Page Transitions ---
document.addEventListener('DOMContentLoaded', () => {
    // Create transition overlay dynamically
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    for (let i = 0; i < 10; i++) {
        const slice = document.createElement('div');
        slice.className = 'transition-slice';
        overlay.appendChild(slice);
    }
    document.body.appendChild(overlay);

    // Initial entrance animation
    setTimeout(() => {
        overlay.classList.add('page-ready');
    }, 100);

    // Intercept clicks on internal links
    document.querySelectorAll('a').forEach(anchor => {
        const href = anchor.getAttribute('href');

        // Only target internal HTML links that aren't anchors within the same page
        if (href && href.endsWith('.html') && !href.startsWith('#') && !anchor.target) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                overlay.classList.remove('page-ready');
                overlay.classList.add('page-exit');

                setTimeout(() => {
                    window.location.href = href;
                }, 800); // Match CSS transition duration
            });
        }
    });
});
