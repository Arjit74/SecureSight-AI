// Enhanced Animations and Interactions for SecureSight AI

// Smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Observe all elements with scroll-fade class
document.addEventListener('DOMContentLoaded', () => {
  const scrollElements = document.querySelectorAll('.scroll-fade');
  scrollElements.forEach(el => observer.observe(el));
});

// Parallax effect for Spline models
let ticking = false;

function updateParallax() {
  const scrolled = window.pageYOffset;
  const splineHero = document.querySelector('.spline-hero');
  
  if (splineHero) {
    const yPos = -(scrolled * 0.3);
    splineHero.style.transform = `translateY(${yPos}px)`;
  }
  
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateParallax);
    ticking = true;
  }
});

// Animate stat counters on page load
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Enhanced hover effects for stat cards
document.addEventListener('DOMContentLoaded', () => {
  const statCards = document.querySelectorAll('.stat');
  
  statCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.background = '';
    });
  });
});

// Item cards click animation
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.item');
  
  items.forEach(item => {
    item.addEventListener('click', function() {
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = '';
      }, 100);
    });
  });
});

// Button ripple effect
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
  ripple.classList.add('ripple');
  
  const rippleElement = button.getElementsByClassName('ripple')[0];
  if (rippleElement) {
    rippleElement.remove();
  }
  
  button.appendChild(ripple);
}

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.btn, .filter-btn');
  buttons.forEach(button => {
    button.addEventListener('click', createRipple);
  });
});

// Enhanced drag and drop animations
const dropzone = document.getElementById('dropzone');
if (dropzone) {
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.transform = 'scale(1.05) rotateZ(2deg)';
    dropzone.style.borderColor = '#667eea';
    dropzone.style.background = 'rgba(102, 126, 234, 0.1)';
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.transform = '';
    dropzone.style.borderColor = '';
    dropzone.style.background = '';
  });
  
  dropzone.addEventListener('drop', () => {
    dropzone.style.transform = 'scale(0.95)';
    setTimeout(() => {
      dropzone.style.transform = '';
    }, 200);
  });
}

// Mouse trail effect (subtle)
let lastX = 0;
let lastY = 0;
let particles = [];

function createParticle(x, y) {
  if (Math.random() > 0.9) { // Only create particle 10% of the time
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.borderRadius = '50%';
    particle.style.background = 'radial-gradient(circle, rgba(102, 126, 234, 0.6), transparent)';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.transition = 'all 0.5s ease';
    
    document.body.appendChild(particle);
    particles.push(particle);
    
    setTimeout(() => {
      particle.style.opacity = '0';
      particle.style.transform = 'scale(2)';
    }, 50);
    
    setTimeout(() => {
      particle.remove();
      particles = particles.filter(p => p !== particle);
    }, 600);
  }
}

document.addEventListener('mousemove', (e) => {
  if (Math.abs(e.clientX - lastX) > 20 || Math.abs(e.clientY - lastY) > 20) {
    createParticle(e.clientX, e.clientY);
    lastX = e.clientX;
    lastY = e.clientY;
  }
});

// Loading animation for items
function pulseItem(itemId) {
  const item = document.querySelector(`[data-id="${itemId}"]`);
  if (item) {
    item.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
      item.style.animation = '';
    }, 500);
  }
}

// Enhanced modal animations
const modal = document.getElementById('modal');
if (modal) {
  const originalDisplay = modal.style.display;
  
  // Override modal show
  const showModal = () => {
    modal.style.display = 'flex';
    modal.style.animation = 'fadeIn 0.3s ease';
    const card = modal.querySelector('.modal-card');
    if (card) {
      card.style.animation = 'slideUp 0.4s ease';
    }
  };
  
  // Override modal hide
  const hideModal = () => {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  };
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Typing effect for title (on first load)
function typeEffect(element, text, speed = 100) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// Initialize on page load
window.addEventListener('load', () => {
  // Add entrance animations to all main sections
  const sections = document.querySelectorAll('.hero, .panel, .upload-section');
  sections.forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, index * 100);
  });
});

// Enhanced theme toggle with animation
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.style.transition = 'background 0.5s ease';
    
    // Add a flash effect
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'white';
    flash.style.opacity = '0.3';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '99999';
    flash.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
      flash.remove();
    }, 350);
  });
}

// Auto-refresh notification with animation
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'notification-toast';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: -100px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-weight: 600;
    transition: bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.bottom = '20px';
  }, 100);
  
  setTimeout(() => {
    notification.style.bottom = '-100px';
    setTimeout(() => {
      notification.remove();
    }, 400);
  }, 3000);
}

// Export enhancements indicator
console.log('🎨 SecureSight AI Enhanced Animations Loaded');
console.log('✨ Features: Scroll animations, parallax effects, ripple buttons, mouse trails');

// Add gradient animation to dropzone
setInterval(() => {
  const dropzone = document.getElementById('dropzone');
  if (dropzone && !dropzone.classList.contains('dragover')) {
    const currentHue = parseInt(getComputedStyle(dropzone).getPropertyValue('--hue') || '0');
    dropzone.style.setProperty('--hue', (currentHue + 1) % 360);
  }
}, 50);
