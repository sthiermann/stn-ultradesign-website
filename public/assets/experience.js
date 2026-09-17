(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => !reduced.matches && document.documentElement.dataset.motion !== 'off';
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);
  const header = document.querySelector('.site-header');
  const updateHeaderHeight = () => document.documentElement.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`);
  updateHeaderHeight();
  if ('ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(header);
  const hero = document.querySelector('.hero-art');
  const heroSection = document.querySelector('.hero');
  let scheduled = false;
  function paintScroll() {
    scheduled = false;
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--reading-progress', total > 0 ? Math.min(1, scrollY / total) : 0);
    header.classList.toggle('is-scrolled', scrollY > 30);
    const rect = heroSection.getBoundingClientRect();
    const amount = canMove() && innerWidth > 850 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
    hero.style.setProperty('--hero-y', `${amount * -45}px`);
    hero.style.setProperty('--hero-turn', `${amount * 4}deg`);
  }
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(paintScroll); } };
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  addEventListener('ultradesign:motion', schedule);
  reduced.addEventListener('change', schedule);
  paintScroll();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), {threshold:0.12});
    document.querySelectorAll('.manifesto>div,.section-heading,.work-list .work-row,.principles-heading,.principle-card,.closing').forEach((item, index) => {
      item.classList.add('reveal-ready');
      item.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 65}ms`);
      observer.observe(item);
    });
    observer.observe(hero);
  }
  document.querySelectorAll('.principle-action').forEach(button => {
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(active));
      button.closest('.principle-card').dataset.active = String(active);
      document.getElementById(button.getAttribute('aria-controls')).textContent = active ? button.dataset.result : button.dataset.rest;
    });
  });
})();
