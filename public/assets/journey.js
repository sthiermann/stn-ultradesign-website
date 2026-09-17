(() => {
  const journey = document.querySelector('.journey');
  if (!journey) return;

  const track = journey.querySelector('.journey-track');
  const pin = journey.querySelector('.journey-pin');
  const stage = journey.querySelector('.journey-stage');
  const toolbar = journey.querySelector('.journey-toolbar');
  const storyRegion = journey.querySelector('.journey-story');
  const world = journey.querySelector('.journey-world');
  const chapters = [...journey.querySelectorAll('[data-journey-chapter]')];
  const mobilePanels = [...journey.querySelectorAll('[data-mobile-chapter]')];
  const motionButton = journey.querySelector('.journey-motion');
  const nextButton = journey.querySelector('.journey-next');
  const story = journey.querySelector('.journey-story-copy');
  const announcement = journey.querySelector('.journey-announcement');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 850px)');
  const stories = [
    ['Start with what matters.', 'Roles, context and continuity. Turn the needs of your application into decisions the design can answer.'],
    ['Give the decisions a shared language.', 'The requirements become type, color, components and behavior. Different parts, designed to work together.'],
    ['Bring the whole task into view.', 'Assemble the system around real work: find an order, compare its context, inspect the detail and return.'],
    ['Close the loop with the brief.', 'Trace the experience back to each requirement. Review what works, expose the gaps and refine before agreement.']
  ];
  // x, y, scale, rotateZ, rotateY, rotateX, opacity. Same objects persist across chapters.
  const poses = {
    '.journey-requirements': [[0,0,1,0,0,0,1],[-32,10,.8,0,0,0,1],[-160,5,.55,-8,0,0,.12],[-137,90,.5,0,0,0,0]],
    '.journey-intent-art': [[0,0,1,0,0,0,1],[90,-25,.7,35,20,0,0],[100,-30,.4,60,0,0,0],[100,-30,.4,60,0,0,0]],
    '.journey-system': [[70,40,.8,4,-30,0,0],[0,0,1,-2,-6,3,1],[-70,-35,.76,-7,-15,10,0],[-70,-35,.76,-7,-15,10,0]],
    '.journey-app': [[120,45,.65,8,25,10,0],[95,45,.72,8,25,10,0],[0,-1,1,0,0,0,1],[-115,22,.91,-3,8,0,1]],
    '.journey-review': [[85,0,.9,0,0,0,0],[85,0,.9,0,0,0,0],[85,0,.9,0,0,0,0],[0,0,1,0,0,0,1]],
    '.journey-orbit': [[0,0,1,-22,0,0,.16],[0,8,.95,1,0,0,.18],[-55,18,.95,18,0,0,.1],[-65,15,.9,30,0,0,.12]]
  };
  const layers = Object.entries(poses).map(([selector, frames]) => ({element: journey.querySelector(selector), frames}));
  let chapter = 0;
  let current = 0;
  let target = 0;
  let frame = 0;
  let manualChapter = false;
  let manualScrollY = window.scrollY;
  let scrollEnabled = false;
  let lastHeaderHeight = -1;
  let geometryFrame = 0;
  let visible = true;
  let explicitlyOff = false;
  try { explicitlyOff = localStorage.getItem('ultradesign-motion') === 'off'; } catch {}
  if (explicitlyOff) document.documentElement.dataset.motion = 'off';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);
  function motionAllowed() {
    return !reduceMotion.matches && document.documentElement.dataset.motion !== 'off';
  }
  function headerHeight() {
    const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height'));
    return Number.isFinite(value) ? value : 90;
  }
  function hasScrollSpace() {
    const available = Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight) - headerHeight() - 24;
    const needed = toolbar.offsetHeight + storyRegion.offsetHeight + 320;
    return available >= Math.max(590, needed);
  }
  function setChapter(index, announce = false) {
    if (chapter !== index || !journey.dataset.enhanced) {
      chapter = index;
      journey.dataset.chapter = String(index);
      chapters.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      mobilePanels.forEach((panel, i) => { panel.hidden = i !== index; });
      story.querySelector('.journey-story-index').textContent = `0${index + 1} / 04`;
      story.querySelector('h3').textContent = stories[index][0];
      story.querySelector('p').textContent = stories[index][1];
      nextButton.firstChild.textContent = index === 3 ? 'Replay the journey ' : 'Next chapter ';
    }
    if (announce) announcement.textContent = `Chapter ${index + 1} of 4. ${stories[index][0]} ${stories[index][1]}`;
  }
  function paint(value) {
    const left = Math.min(2, Math.floor(value));
    const progress = smooth(value - left);
    layers.forEach(({element, frames}) => {
      const a = frames[left], b = frames[left + 1];
      const p = a.map((entry, i) => entry + (b[i] - entry) * progress);
      element.style.transform = `translate(${p[0]}px, ${p[1]}px) scale(${p[2]}) rotateZ(${p[3]}deg) rotateY(${p[4]}deg) rotateX(${p[5]}deg)`;
      element.style.opacity = p[6];
    });
    journey.querySelector('.journey-connections').style.opacity = Math.max(0, 1 - Math.abs(value - 1) * 1.65) * .65;
    journey.style.setProperty('--j-progress', String(1 + value));
    if (!manualChapter) setChapter(clamp(Math.round(value), 0, 3));
  }
  function tick() {
    frame = 0;
    if (!visible && scrollEnabled) return;
    if (!motionAllowed() || compact.matches) current = target;
    else current += (target - current) * .12;
    if (Math.abs(target - current) < .001) current = target;
    paint(current);
    if (current !== target) frame = requestAnimationFrame(tick);
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function measure() {
    const scale = Math.min(1.16, (stage.clientWidth - 15) / 1060, (stage.clientHeight - 22) / 490);
    world.style.setProperty('--j-scale', String(Math.max(.35, scale)));
  }
  function readScroll() {
    if (!scrollEnabled || manualChapter) return;
    const box = track.getBoundingClientRect();
    const distance = Math.max(1, track.offsetHeight - pin.offsetHeight);
    const top = parseFloat(getComputedStyle(pin).top) || 0;
    target = clamp((top - box.top) / distance, 0, 1) * 3;
    queue();
  }
  function configure({preservePosition = false} = {}) {
    const previousTop = pin.getBoundingClientRect().top;
    const wasScrolling = scrollEnabled;
    lastHeaderHeight = headerHeight();
    scrollEnabled = motionAllowed() && !compact.matches && hasScrollSpace();
    journey.dataset.scroll = String(scrollEnabled);
    motionButton.setAttribute('aria-pressed', String(motionAllowed()));
    motionButton.querySelector('span').textContent = reduceMotion.matches ? 'Reduced motion' : motionAllowed() ? 'Motion on' : 'Motion off';
    motionButton.setAttribute('aria-label', reduceMotion.matches ? 'Reduced motion follows your device preference' : motionAllowed() ? 'Motion on. Turn motion off.' : 'Motion off. Turn motion on.');
    motionButton.disabled = reduceMotion.matches;
    if (!scrollEnabled) { manualChapter = true; target = chapter; current = target; }
    if (preservePosition && wasScrolling !== scrollEnabled && previousTop <= lastHeaderHeight + 24 && track.getBoundingClientRect().bottom > 0) {
      window.scrollBy({top: pin.getBoundingClientRect().top - previousTop, behavior: 'instant'});
    }
    manualScrollY = window.scrollY;
    measure();
    readScroll();
    queue();
  }
  function choose(index) {
    manualChapter = true;
    manualScrollY = window.scrollY;
    target = index;
    setChapter(index, true);
    if (!motionAllowed() || compact.matches) current = target;
    queue();
  }
  chapters.forEach((button, index) => button.addEventListener('click', () => choose(index)));
  nextButton.addEventListener('click', () => choose((chapter + 1) % 4));
  motionButton.addEventListener('click', () => {
    if (reduceMotion.matches) return;
    const enabled = !motionAllowed();
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
    try { localStorage.setItem('ultradesign-motion', enabled ? 'on' : 'off'); } catch {}
    configure({preservePosition: true});
    window.dispatchEvent(new CustomEvent('ultradesign:motion', {detail: {enabled}}));
    announcement.textContent = enabled ? 'Motion enabled. Explore by scrolling or choosing a chapter.' : 'Motion disabled. Choose a chapter to explore at your own pace.';
  });
  window.addEventListener('scroll', () => {
    // Keep a selected chapter through small focus/layout adjustments. Deliberate
    // scrolling resumes the page's normal narrative without changing its position.
    if (manualChapter && Math.abs(window.scrollY - manualScrollY) > 32) manualChapter = false;
    readScroll();
  }, {passive: true});
  function scheduleGeometry() {
    if (geometryFrame) return;
    geometryFrame = requestAnimationFrame(() => {
      geometryFrame = 0;
      configure({preservePosition: true});
    });
  }
  window.addEventListener('resize', scheduleGeometry, {passive: true});
  window.visualViewport?.addEventListener('resize', scheduleGeometry, {passive: true});
  window.addEventListener('ultradesign:motion', () => configure());
  reduceMotion.addEventListener('change', () => configure({preservePosition: true}));
  compact.addEventListener('change', () => configure({preservePosition: true}));
  new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'data-motion') || headerHeight() !== lastHeaderHeight) scheduleGeometry();
  }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion', 'style']});
  if ('ResizeObserver' in window) {
    new ResizeObserver(measure).observe(stage);
    const chromeObserver = new ResizeObserver(scheduleGeometry);
    chromeObserver.observe(toolbar);
    chromeObserver.observe(storyRegion);
  }
  document.fonts?.ready.then(scheduleGeometry);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) { readScroll(); queue(); }
    }, {rootMargin: '150px'}).observe(pin);
  }
  setChapter(0);
  journey.dataset.enhanced = 'true';
  motionButton.hidden = false;
  configure();
})();
