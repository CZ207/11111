(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealItems = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    let targetX = -30;
    let targetY = -30;
    let currentX = -30;
    let currentY = -30;
    const animateGlow = () => {
      currentX += (targetX - currentX) * .22;
      currentY += (targetY - currentY) * .22;
      glow.style.transform = `translate3d(${currentX - glow.offsetWidth / 2}px, ${currentY - glow.offsetHeight / 2}px, 0)`;
      requestAnimationFrame(animateGlow);
    };
    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      glow.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('pointerover', (event) => {
      if (event.target.closest('a, button, video')) glow.classList.add('is-active');
    });
    document.addEventListener('pointerout', (event) => {
      if (event.target.closest('a, button, video')) glow.classList.remove('is-active');
    });
    window.addEventListener('mouseout', (event) => {
      if (!event.relatedTarget) glow.classList.remove('is-visible');
    });
    animateGlow();

    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(900px) translateY(-6px) rotateX(${-y * 2.5}deg) rotateY(${x * 3}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  const lightboxItems = [...document.querySelectorAll('[data-lightbox]')];
  if (lightboxItems.length) {
    const modal = document.createElement('div');
    modal.className = 'lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '证据图片查看器');
    modal.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="关闭">×</button>
      <button class="lightbox-prev" type="button" aria-label="上一张">←</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lightbox-next" type="button" aria-label="下一张">→</button>`;
    document.body.appendChild(modal);
    const image = modal.querySelector('img');
    const caption = modal.querySelector('figcaption');
    const closeButton = modal.querySelector('.lightbox-close');
    const previousButton = modal.querySelector('.lightbox-prev');
    const nextButton = modal.querySelector('.lightbox-next');
    let activeIndex = 0;
    let returnFocus = null;

    const render = () => {
      const item = lightboxItems[activeIndex];
      image.src = item.dataset.lightbox;
      image.alt = item.dataset.alt || item.querySelector('img')?.alt || '项目证据图';
      caption.textContent = item.dataset.caption || '';
      const multiple = lightboxItems.length > 1;
      previousButton.hidden = !multiple;
      nextButton.hidden = !multiple;
    };
    const open = (index, trigger) => {
      activeIndex = index;
      returnFocus = trigger;
      render();
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    };
    const close = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      image.removeAttribute('src');
      returnFocus?.focus();
    };
    const move = (direction) => {
      activeIndex = (activeIndex + direction + lightboxItems.length) % lightboxItems.length;
      render();
    };

    lightboxItems.forEach((item, index) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        open(index, item);
      });
    });
    closeButton.addEventListener('click', close);
    previousButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'Tab') {
        const controls = [closeButton, previousButton, nextButton].filter((button) => !button.hidden);
        const current = controls.indexOf(document.activeElement);
        if (event.shiftKey && current <= 0) {
          event.preventDefault();
          controls.at(-1).focus();
        } else if (!event.shiftKey && current === controls.length - 1) {
          event.preventDefault();
          controls[0].focus();
        }
      }
    });
  }

  const videos = [...document.querySelectorAll('video')];
  if (videos.length && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
      });
    }, { threshold: .18 });
    videos.forEach((video) => videoObserver.observe(video));
  }

  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', '返回页面顶部');
  backToTop.setAttribute('title', '返回顶部');
  backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(backToTop);
  const syncBackToTop = () => backToTop.classList.toggle('is-visible', window.scrollY > 420);
  window.addEventListener('scroll', syncBackToTop, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  syncBackToTop();
})();
