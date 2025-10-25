// main.js - Main JavaScript for Palette Strokes website
// Common functionality used across all pages

// Mobile Navigation Toggle
function initMobileNav() {
  const header = document.querySelector('header');
  const nav = document.querySelector('nav');
  
  // Create mobile menu button if it doesn't exist
  if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-btn')) {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.setAttribute('aria-label', 'Toggle menu');
    
    header.insertBefore(menuBtn, nav);
    
    menuBtn.addEventListener('click', function() {
      nav.classList.toggle('nav-active');
      this.innerHTML = nav.classList.contains('nav-active') ? '✕' : '☰';
    });
  }
}

// Smooth Scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// Lazy Loading Images (placeholder for now)
function initLazyLoading() {
  // This can be expanded with IntersectionObserver
  console.log("Lazy loading initialized (placeholder)");
}

// Add active class to current page nav link
function highlightCurrentPage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || 
        (currentPage === '' && linkPage === 'index.html')) {
      link.style.fontWeight = '500';
      link.style.opacity = '1';
      link.classList.add('active-nav-link'); // Added a class for styling
    }
  });
}

// Back to Top Button
function initBackToTop() {
  // Create back to top button
  const backToTopBtn = document.createElement('button');
  backToTopBtn.className = 'back-to-top';
  backToTopBtn.innerHTML = '↑';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(backToTopBtn);
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  // Scroll to top on click
  backToTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// --- GLOBAL HELPER FUNCTIONS ---

// Show notification (moved from admin.js/contact.js)
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Loading state helper (moved from admin.js/contact.js)
function setLoadingState(element, isLoading, loadingText = 'Loading...') {
  if (!element) return;
  if (isLoading) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.textContent = loadingText;
    element.classList.add('loading');
  } else {
    element.disabled = false;
    if (element.dataset.originalText) {
       element.textContent = element.dataset.originalText;
    }
    element.classList.remove('loading');
  }
}

// Form validation helper
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// --- END GLOBAL HELPERS ---

// Handle external links
function initExternalLinks() {
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  externalLinks.forEach(link => {
    if (!link.hostname.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// Animation on scroll
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.feature-card, .blog-card, .product-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target); // Stop observing once animated
      }
    });
  }, {
    threshold: 0.1
  });
  
  animatedElements.forEach(el => {
    // Set initial state for animation
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initMobileNav();
  initSmoothScroll();
  initLazyLoading();
  highlightCurrentPage();
  initBackToTop();
  initExternalLinks();
  
  // Delay scroll animations slightly to ensure all elements are ready
  setTimeout(initScrollAnimations, 100);
  
  console.log('Palette Strokes - Main JS initialized');
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    initMobileNav();
  }, 250);
});

// Make helper functions globally available for other scripts
window.showNotification = showNotification;
window.setLoadingState = setLoadingState;
window.validateEmail = validateEmail;
