const launchText = 'Audit the entire frontend of this existing application using its current source code and running interface. Ask me about my requirements and design preferences, preserve existing capabilities, and develop a complete interactive design concept. Clarify which earlier design decisions still apply. Independently review and refine the concept with me. Implement production changes only after my approval.';
const resumeText = 'Resume this design effort using the installed skill version. Reconcile the existing requirements, feedback, concept, work items and actual checks. Preserve settled answers and approvals. Resolve outstanding defects, establish a reproducible concept baseline, and continue through verified implementation within the approved scope.';
const layerToggle = document.querySelector('.layer-toggle');
layerToggle.addEventListener('click', () => {
  const expanded = layerToggle.getAttribute('aria-pressed') !== 'true';
  layerToggle.setAttribute('aria-pressed', String(expanded));
  document.querySelector('.scene').dataset.exploded = String(expanded);
  layerToggle.innerHTML = expanded ? 'Assemble the interface <span aria-hidden="true">↙</span>' : 'Inspect the layers <span aria-hidden="true">↗</span>';
});
const storyCaptions = {
  requirements: 'Reasoned recommendations turn your answers into requirements, with existing capabilities kept in view.',
  system: 'Translate the direction into shared type, color, components and interaction rules.',
  design: 'Bring the pieces together in complete, reviewable journeys.',
  review: 'Check the result against the requirements and refine what the evidence reveals.'
};
document.querySelectorAll('[data-story]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-story]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('.scene').dataset.stage = button.dataset.story;
    document.querySelector('.story-caption').textContent = storyCaptions[button.dataset.story];
  });
});
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectClient(tab) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  }
  const invocation = tab.id === 'tab-codex' ? '$stn-ultradesign' : '/stn-ultradesign:stn-ultradesign';
  document.getElementById('launch-prompt').textContent = `${invocation} ${launchText}`;
  document.getElementById('resume-prompt').textContent = `${invocation} ${resumeText}`;
  document.querySelector('.copy-status').textContent = '';
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectClient(tab));
  tab.addEventListener('keydown', event => {
    const offsets = {ArrowRight: 1, ArrowLeft: -1};
    let next;
    if (event.key in offsets) next = (index + offsets[event.key] + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[next].focus();
    selectClient(tabs[next]);
  });
});
selectClient(tabs[0]);
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy);
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      status.textContent = 'Copied. Paste it into your coding agent.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Clipboard access is unavailable. The text is selected; use your device’s Copy command.';
    }
  });
});
