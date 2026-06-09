/**
 * JAN Wedding Platform — Shared Utilities
 * ─────────────────────────────────────────
 * Nav, countdown, scroll animations, toast, particles
 */

/* ── Nav: Scroll Glass Effect ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {

/* ── Nav: Scroll Glass Effect ────────────────────────────────────── */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlight
  const path = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === 'index.html' && href === './') || href === './' + path) {
      a.classList.add('active');
    }
  });
})();

/* ── Scroll Reveal ───────────────────────────────────────────────── */
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children if data-stagger is set
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, Number(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up, .fade-in').forEach((el, i) => {
    if (!el.dataset.delay) {
      // Auto-stagger sibling elements
      const siblings = el.parentElement?.querySelectorAll('.fade-up, .fade-in');
      if (siblings) {
        const idx = Array.from(siblings).indexOf(el);
        el.dataset.delay = idx * 80;
      }
    }
    observer.observe(el);
  });
})();

}); // end DOMContentLoaded

/* ── Countdown Timer ─────────────────────────────────────────────── */
function initCountdown(targetDateStr) {
  const days    = document.getElementById('cd-days');
  const hours   = document.getElementById('cd-hours');
  const minutes = document.getElementById('cd-minutes');
  const seconds = document.getElementById('cd-seconds');

  if (!days) return;

  const target = new Date(targetDateStr).getTime();

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      days.textContent = hours.textContent = minutes.textContent = seconds.textContent = '00';
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);

    days.textContent    = pad(d);
    hours.textContent   = pad(h);
    minutes.textContent = pad(m);
    seconds.textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
}

/* ── Toast Notifications ─────────────────────────────────────────── */
function showToast(message, type = 'default', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/* ── Gold Particle System ────────────────────────────────────────── */
function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  function resize() {
    canvas.width  = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x     = Math.random() * canvas.width;
      this.y     = init ? Math.random() * canvas.height : canvas.height + 10;
      this.size  = Math.random() * 2 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = 0;
      this.maxOpacity = Math.random() * 0.5 + 0.1;
      this.fadeIn  = true;
      this.life    = 0;
      this.maxLife = Math.random() * 300 + 200;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;

      if (this.fadeIn) {
        this.opacity = Math.min(this.opacity + 0.01, this.maxOpacity);
        if (this.opacity >= this.maxOpacity) this.fadeIn = false;
      }

      if (this.life > this.maxLife * 0.7) {
        this.opacity = Math.max(this.opacity - 0.008, 0);
      }

      if (this.life >= this.maxLife || this.y < -10) this.reset();
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#C9A84C';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#E8C97A';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: 60 }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    resize();
    particles.forEach(p => p.reset(true));
  });

  init();
  loop();
}

/* ── Confetti Burst ──────────────────────────────────────────────── */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx     = canvas.getContext('2d');
  const pieces  = [];
  const colors  = ['#C9A84C', '#E8C97A', '#F5F0E8', '#9A7A2E', '#fff'];
  const count   = 120;

  for (let i = 0; i < count; i++) {
    pieces.push({
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height - canvas.height,
      w:      Math.random() * 10 + 5,
      h:      Math.random() * 5 + 3,
      color:  colors[Math.floor(Math.random() * colors.length)],
      speed:  Math.random() * 4 + 2,
      angle:  Math.random() * 360,
      spin:   (Math.random() - 0.5) * 8,
      opacity: 1
    });
  }

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    let allDone = true;
    pieces.forEach(p => {
      if (p.y < canvas.height + 20) {
        allDone = false;
        p.y     += p.speed;
        p.angle += p.spin;
        if (frame > 80) p.opacity = Math.max(0, p.opacity - 0.02);

        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle   = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    });

    if (!allDone) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  draw();
}

/* ── Apply Config to DOM ─────────────────────────────────────────── */
function applyConfig(cfg) {
  // Couple names
  document.querySelectorAll('[data-couple-names]').forEach(el => {
    el.textContent = cfg.coupleNames;
  });
  // Hashtag
  document.querySelectorAll('[data-hashtag]').forEach(el => {
    el.textContent = cfg.hashtag;
  });
  // Venue
  document.querySelectorAll('[data-venue]').forEach(el => {
    el.textContent = cfg.venue;
  });
  // Address
  document.querySelectorAll('[data-venue-address]').forEach(el => {
    el.textContent = cfg.venueAddress;
  });
  // Date display
  document.querySelectorAll('[data-wedding-date-display]').forEach(el => {
    const d = new Date(cfg.weddingDate);
    el.textContent = d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  });
  // Welcome message
  document.querySelectorAll('[data-welcome]').forEach(el => {
    el.textContent = cfg.welcomeMessage;
  });
  // Accent color
  if (cfg.accentColor) {
    document.documentElement.style.setProperty('--gold', cfg.accentColor);
  }
  // Page title
  document.title = `${cfg.coupleNames} — JAN Wedding`;
  // Countdown
  initCountdown(cfg.weddingDate);
}

// Auto-apply if config is loaded
if (typeof JAN_CONFIG !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => applyConfig(JAN_CONFIG));
}
