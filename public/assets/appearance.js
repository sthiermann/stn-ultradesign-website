(() => {
  const choices = ['system', 'light', 'dark'];
  let saved = 'system';
  try { saved = localStorage.getItem('ultradesign-appearance') || 'system'; } catch {}
  document.documentElement.dataset.appearance = choices.includes(saved) ? saved : 'system';
  try {
    if (localStorage.getItem('ultradesign-motion') === 'off') document.documentElement.dataset.motion = 'off';
  } catch {}
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-button');
    if (!button) return;
    const refresh = () => {
      const choice = document.documentElement.dataset.appearance;
      button.querySelector('.theme-label').textContent = choice[0].toUpperCase() + choice.slice(1);
      button.setAttribute('aria-label', `Appearance: ${choice}. Change appearance.`);
    };
    button.addEventListener('click', () => {
      const current = choices.indexOf(document.documentElement.dataset.appearance);
      const next = choices[(current + 1) % choices.length];
      document.documentElement.dataset.appearance = next;
      try { localStorage.setItem('ultradesign-appearance', next); } catch {}
      refresh();
    });
    refresh();
  });
})();
