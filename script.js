/**
 * ONE ROOF - Luxury Real Estate Website
 * Interactive Features & Animations
 */

// ============================================
// NAVIGATION
// ============================================

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const progressBar = document.getElementById('progressBar');

// Sticky Navigation on Scroll
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // Add scrolled class for background
  if (scrollTop > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
  
  // Update progress bar
  const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (scrollTop / windowHeight) * 100;
  progressBar.style.width = scrolled + '%';
  
  lastScrollTop = scrollTop;
});

// Mobile Menu Toggle
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navMenu.classList.toggle('active');
  document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu on link click
document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ============================================
// PARALLAX EFFECT - HERO
// ============================================

const hero = document.querySelector('.hero');
const heroLayers = document.querySelectorAll('.hero__layer');

window.addEventListener('scroll', () => {
  if (!hero) return;
  
  const scrolled = window.pageYOffset;
  const heroHeight = hero.offsetHeight;
  
  if (scrolled < heroHeight) {
    heroLayers.forEach((layer, index) => {
      const speed = (index + 1) * 0.15;
      const yPos = -(scrolled * speed);
      layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  }
});

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================

const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Stagger effect
      setTimeout(() => {
        entry.target.classList.add('active');
      }, index * 100);
      
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(element => {
  revealObserver.observe(element);
});

// ============================================
// PORTFOLIO FILTERS
// ============================================

const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    const filterValue = button.getAttribute('data-filter');
    
    // Filter items with animation
    portfolioItems.forEach((item, index) => {
      const category = item.getAttribute('data-category');
      
      if (filterValue === 'all' || category === filterValue) {
        setTimeout(() => {
          item.classList.remove('hidden');
          item.style.animation = 'fadeInUp 0.6s ease-out forwards';
        }, index * 50);
      } else {
        item.classList.add('hidden');
      }
    });
  });
});

// ============================================
// ANIMATED COUNTERS
// ============================================

const statNumbers = document.querySelectorAll('.stat-item__number');
let countersAnimated = false;

const animateCounter = (element) => {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 seconds
  const increment = target / (duration / 16); // 60fps
  let current = 0;
  
  const updateCounter = () => {
    current += increment;
    
    if (current < target) {
      element.textContent = Math.floor(current);
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target;
    }
  };
  
  updateCounter();
};

// Observe stats section
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !countersAnimated) {
      countersAnimated = true;
      
      statNumbers.forEach((stat, index) => {
        setTimeout(() => {
          animateCounter(stat);
        }, index * 150);
      });
      
      statsObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.5
});

const statsSection = document.querySelector('.stats');
if (statsSection) {
  statsObserver.observe(statsSection);
}

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      const navHeight = nav.offsetHeight;
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// FORM HANDLING
// ============================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Simulate form submission
    console.log('Form submitted:', data);
    
    // Show success message
    const button = contactForm.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Message Envoyé !
    `;
    button.disabled = true;
    
    // Reset after 3 seconds
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
      contactForm.reset();
    }, 3000);
  });
  
  // Form input animations
  const formInputs = contactForm.querySelectorAll('.form-input');
  
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      if (!input.value) {
        input.parentElement.classList.remove('focused');
      }
    });
  });
}

// ============================================
// INTERSECTION OBSERVER FOR SECTIONS
// ============================================

// Add active class to nav links based on scroll position
const sections = document.querySelectorAll('section[id]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      
      // Remove active class from all nav links
      document.querySelectorAll('.nav__link').forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to current nav link
      const activeLink = document.querySelector(`.nav__link[href="#${id}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  });
}, {
  threshold: 0.3
});

sections.forEach(section => {
  sectionObserver.observe(section);
});

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Lazy load images (if using actual images)
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  // Fallback for browsers that don't support lazy loading
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

// Debounce function for scroll events
function debounce(func, wait = 10, immediate = false) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// ============================================
// MICRO-INTERACTIONS
// ============================================

// Button ripple effect
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
  button.addEventListener('mouseenter', (e) => {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Portfolio item hover effect
const portfolioItemsList = document.querySelectorAll('.portfolio-item');

portfolioItemsList.forEach(item => {
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const angleX = (y - centerY) / 30;
    const angleY = (centerX - x) / 30;
    
    item.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-8px)`;
  });
  
  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
  });
});

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Keyboard navigation for portfolio filters
filterButtons.forEach((button, index) => {
  button.addEventListener('keydown', (e) => {
    let newIndex = index;
    
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % filterButtons.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + filterButtons.length) % filterButtons.length;
      e.preventDefault();
    }
    
    if (newIndex !== index) {
      filterButtons[newIndex].focus();
    }
  });
});

// Trap focus in mobile menu when open
const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input, select'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
      navToggle.focus();
    }
  });
};

if (navMenu) {
  trapFocus(navMenu);
}

// ============================================
// PRELOAD CRITICAL FONTS
// ============================================

if ('fonts' in document) {
  Promise.all([
    document.fonts.load('600 1em Cormorant Garamond'),
    document.fonts.load('400 1em Inter')
  ]).then(() => {
    document.body.classList.add('fonts-loaded');
  });
}

// ============================================
// PAGE LOAD ANIMATION
// ============================================

window.addEventListener('load', () => {
  document.body.classList.add('loaded');
  
  // Remove any loading screens if present
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
});

// ============================================
// CONSOLE SIGNATURE
// ============================================

console.log(
  '%c ONE ROOF ',
  'background: #1E3A5F; color: #C9A961; font-size: 20px; padding: 10px 20px; font-weight: bold;'
);
console.log(
  '%c Patrimoine Familial · Excellence Immobilière ',
  'color: #1E3A5F; font-size: 12px; font-style: italic;'
);
console.log(
  '%c Site développé avec excellence et attention aux détails ',
  'color: #666; font-size: 10px;'
);
