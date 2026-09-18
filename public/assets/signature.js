(() => {
  const signature = document.querySelector('#footer-signature');
  if (!signature) return;

  const button = signature.querySelector('.signature-toggle');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  let visible = false;
  let presented = false;
  const canMove = () => !reduceMotion.matches && !forcedColors.matches && document.documentElement.dataset.motion !== 'off';

  function setState(state) {
    signature.dataset.state = state;
    button.textContent = state === 'playing' ? 'Pause signature' : state === 'paused' ? 'Resume signature' : 'Replay signature';
  }

  function start() {
    if (!canMove() || document.hidden) return;
    presented = true;
    setState('playing');
  }

  function syncPreference() {
    const allowed = canMove();
    button.hidden = !allowed;
    if (!allowed) setState('idle');
    else if (visible && !presented) start();
  }

  button.addEventListener('click', () => {
    if (!canMove()) return;
    if (signature.dataset.state === 'playing') setState('paused');
    else start();
  });
  signature.addEventListener('animationend', event => {
    if (event.animationName === 'stn-brand-signature-base') setState('idle');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setState('idle');
    else if (visible && !presented) start();
  });
  addEventListener('ultradesign:motion', syncPreference);
  reduceMotion.addEventListener('change', syncPreference);
  forcedColors.addEventListener('change', syncPreference);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .6;
      if (visible && !presented) start();
      else if (!visible) setState('idle');
    }, {threshold: [0, .6]});
    observer.observe(signature);
  }
  syncPreference();
})();
