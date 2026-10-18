(() => {
  'use strict';

  const reactions = JSON.parse(document.getElementById('chematch-data').textContent);
  const list = document.getElementById('st-list');
  const group = document.querySelector('[data-group=mode]');

  // same formatting as the game: subscripts, _{..}, ^{..}
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const chem = (s) =>
    esc(s)
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');

  let hide = 'all'; // all | reactants | products | conditions

  const cell = (cls, html, hidden) =>
    `<div class="${cls}${hidden ? ' sp' : ''}"${
      hidden ? ' role="button" tabindex="0" aria-expanded="false" aria-label="Hidden, click to reveal"' : ''
    }>${html}</div>`;

  function render() {
    list.innerHTML = reactions
      .map((r) => {
        const conds = r.conditions || [];
        const condHTML = conds
          .map((c) => `<span class="st-cond">${chem(c)}</span>`)
          .join('<span class="st-or">or</span>');
        return `<article class="st-row">
          <div class="st-eq">
            ${cell('st-cell st-r', chem(r.reactants), hide === 'reactants')}
            <span class="st-arrow">→</span>
            ${cell('st-cell st-p', chem(r.product), hide === 'products')}
          </div>
          ${conds.length ? cell('st-conds', condHTML, hide === 'conditions') : ''}
        </article>`;
      })
      .join('');
  }

  group.addEventListener('click', (e) => {
    const btn = e.target.closest('.cm-opt');
    if (!btn) return;
    group.querySelectorAll('.cm-opt').forEach((b) => b.classList.toggle('is-active', b === btn));
    hide = btn.dataset.value;
    render(); // switching mode re-hides everything
  });

  const toggle = (el) => {
    const open = el.classList.toggle('is-open');
    el.setAttribute('aria-expanded', String(open));
    el.setAttribute('aria-label', open ? 'Revealed, click to hide' : 'Hidden, click to reveal');
  };
  list.addEventListener('click', (e) => {
    const el = e.target.closest('.sp');
    if (el) toggle(el);
  });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('.sp');
    if (!el) return;
    e.preventDefault();
    toggle(el);
  });

  render();
})();