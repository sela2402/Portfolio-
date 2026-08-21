/* ============================================================
   DATA ANALYST PORTFOLIO — SCRIPT
   Sections: 1) Nav toggle  2) Hero network canvas + coord readout
   3) Scroll reveals  4) Counters + skill bars  5) Certificate modal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1) MOBILE NAV TOGGLE
  --------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks   = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.classList.toggle('is-active', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     2) HERO NETWORK CANVAS
     Drifting nodes ("data points") that connect with lines
     when close enough — like a live correlation / scatter plot.
     Mouse position gently repels nearby nodes.
  --------------------------------------------------------- */
  const canvas = document.getElementById('networkCanvas');
  const hero   = document.querySelector('.hero');
  const readout = document.getElementById('coordReadout');

  if (canvas && hero) {
    const ctx = canvas.getContext('2d');
    let width, height, nodes;
    let mouse = { x: null, y: null };

    const NODE_COLORS = ['#22D3EE', '#FBBF24', '#A78BFA'];
    const LINK_DIST = 150;
    const MOUSE_RADIUS = 130;

    function resize() {
      width  = canvas.width  = hero.offsetWidth;
      height = canvas.height = hero.offsetHeight;
      const count = Math.max(28, Math.min(70, Math.floor((width * height) / 22000)));
      nodes = Array.from({ length: count }, () => createNode());
    }

    function createNode() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 1.2,
        color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]
      };
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      // update + draw nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width)  n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // gentle repel from cursor
        if (mouse.x !== null) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
            n.x += (dx / dist) * force * 1.1;
            n.y += (dy / dist) * force * 1.1;
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // draw links between close nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(148,163,184,' + (1 - dist / LINK_DIST) * 0.35 + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(step);
    }

    resize();
    window.addEventListener('resize', resize);

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      if (readout) {
        readout.style.opacity = '1';
        readout.style.transform = `translate(${mouse.x + 16}px, ${mouse.y + 16}px)`;
        readout.textContent = `x:${String(Math.round(mouse.x)).padStart(4,'0')} y:${String(Math.round(mouse.y)).padStart(4,'0')}`;
      }
    });

    hero.addEventListener('mouseleave', () => {
      mouse.x = null; mouse.y = null;
      if (readout) readout.style.opacity = '0';
    });

    // Respect reduced-motion preference: draw a single static frame.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      step_static();
      function step_static(){
        ctx.clearRect(0,0,width,height);
        for (const n of nodes) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();
        }
      }
    } else {
      requestAnimationFrame(step);
    }
  }

  /* ---------------------------------------------------------
     3) SCROLL REVEALS
     Tags each direct child block of a section with `.reveal`
     then fades/slides it in once it enters the viewport.
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.about__grid, .skills__grid, .timeline__item, .cert-card, .contact__inner'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => revealObserver.observe(el));

  /* ---------------------------------------------------------
     4) ANIMATED COUNTERS + SKILL BARS
     Triggered once when their section scrolls into view.
  --------------------------------------------------------- */
  function animateCount(el, target, duration = 1200) {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  const statsSection = document.querySelector('.about__stats');
  if (statsSection) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.stat__num').forEach(num => {
            animateCount(num, parseInt(num.dataset.count, 10));
          });
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statObserver.observe(statsSection);
  }

  const skillBars = document.querySelectorAll('.skillbar');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const fill = bar.querySelector('.skillbar__fill');
        fill.style.width = bar.dataset.percent + '%';
        skillObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.4 });
  skillBars.forEach(bar => skillObserver.observe(bar));

  /* ---------------------------------------------------------
     5) CERTIFICATE MODAL
     Click a certificate card -> open full image in a lightbox.
     Supports prev/next, Escape to close, backdrop click to close.
  --------------------------------------------------------- */
  const certCards   = Array.from(document.querySelectorAll('.cert-card'));
  const modal        = document.getElementById('certModal');
  const modalImage   = document.getElementById('modalImage');
  const modalTitle   = document.getElementById('modalTitle');
  const modalMeta    = document.getElementById('modalMeta');
  const modalClose   = document.getElementById('modalClose');
  const modalBackdrop= document.getElementById('modalBackdrop');
  const modalPrev    = document.getElementById('modalPrev');
  const modalNext    = document.getElementById('modalNext');

  let currentIndex = 0;
  let lastFocusedEl = null;

  function openModal(index) {
    currentIndex = (index + certCards.length) % certCards.length;
    const card = certCards[currentIndex];

    modalImage.src = card.dataset.image;
    modalImage.alt = card.dataset.title;
    modalTitle.textContent = card.dataset.title;
    modalMeta.textContent  = `${card.dataset.issuer}  ·  ${card.dataset.date}`;

    lastFocusedEl = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  certCards.forEach((card, i) => {
    card.addEventListener('click', () => openModal(i));
  });

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', () => openModal(currentIndex - 1));
  modalNext.addEventListener('click', () => openModal(currentIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') openModal(currentIndex - 1);
    if (e.key === 'ArrowRight') openModal(currentIndex + 1);
  });

});