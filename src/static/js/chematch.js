(() => {
  'use strict';

  const SLOTS = 5;
  const T = { fade: 320, wrongLock: 1000, spawnMin: 300, spawnMax: 900 };

  const root = document.getElementById('chematch');
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const reactions = JSON.parse(document.getElementById('chematch-data').textContent);

  /* ---------- formatting: subscripts / superscripts ---------- */
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const chem = (s) =>
    esc(s)
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');

  /* ---------- pair pool (one pair per reaction x condition) ---------- */
  // 'cond' mode: only reactions that have a condition.
  // 'prod' mode: every reaction; ones without conditions show just the reactants.
  const poolFor = (mode) =>
    reactions.flatMap((r, i) => {
      const conds = r.conditions || [];
      if (conds.length)
        return conds.map((c, j) => ({ id: `${i}.${j}`, r: r.reactants, p: r.product, c }));
      return mode === 'prod' ? [{ id: `${i}.-`, r: r.reactants, p: r.product, c: null }] : [];
    });

  const keyL = (pair, mode) => (mode === 'cond' ? `${pair.r}>${pair.p}` : `${pair.r}|${pair.c || ''}`);
  const keyR = (pair, mode) => (mode === 'cond' ? pair.c : pair.p);

  const leftHTML = (pair, mode) =>
    mode === 'cond'
      ? `<span class="cm-main">${chem(pair.r)} → ${chem(pair.p)}</span>`
      : `<span class="cm-main">${chem(pair.r)}</span>${pair.c ? `<span class="cm-sub">${chem(pair.c)}</span>` : ''}`;
  const rightHTML = (pair, mode) => `<span class="cm-main">${chem(keyR(pair, mode))}</span>`;

  /* ---------- DOM ---------- */
  const screens = {
    start: $('[data-screen=start]'),
    game: $('[data-screen=game]'),
    end: $('[data-screen=end]'),
  };
  const show = (name) => Object.entries(screens).forEach(([k, el]) => (el.hidden = k !== name));

  const board = $('[data-board]');
  const cols = { left: $('[data-col=left]'), right: $('[data-col=right]') };
  const cards = { left: [], right: [] };
  for (const side of ['left', 'right']) {
    for (let i = 0; i < SLOTS; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cm-card is-empty';
      b.addEventListener('click', () => onClick(side, i));
      b.addEventListener('animationend', () => b.classList.remove('is-entering'));
      cols[side].append(b);
      cards[side].push(b);
    }
  }

  const hud = {
    done: $('[data-hud=done]'),
    total: $('[data-hud=total]'),
    time: $('[data-hud=time]'),
    mistakes: $('[data-hud=mistakes]'),
    bar: $('[data-hud=bar]'),
  };

  /* ---------- config ---------- */
  const cfg = { mode: 'cond', total: 10 };
  $$('[data-group]').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.cm-opt');
      if (!btn) return;
      group.querySelectorAll('.cm-opt').forEach((p) => p.classList.toggle('is-active', p === btn));
      const key = group.dataset.group;
      cfg[key] = key === 'total' ? Number(btn.dataset.value) : btn.dataset.value;
    });
  });

  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]')?.dataset.action;
    if (a === 'start' || a === 'again') startGame();
    if (a === 'quit' || a === 'menu') { stopGame(); show('start'); }
  });

  /* ---------- state ---------- */
  let st = null;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const later = (fn, ms) => {
    const id = setTimeout(() => { st.timers.delete(id); fn(); }, ms);
    st.timers.add(id);
  };

  function startGame() {
    stopGame();
    st = {
      mode: cfg.mode,
      pool: poolFor(cfg.mode),
      total: cfg.total,
      spawned: 0,
      done: 0,
      mistakes: 0,
      slots: { left: Array(SLOTS).fill(null), right: Array(SLOTS).fill(null) },
      sel: { left: null, right: null },
      locked: false,
      ended: false,
      recent: [],
      refilling: false,
      timers: new Set(),
      t0: performance.now(),
      tick: null,
    };
    for (const side of ['left', 'right'])
      cards[side].forEach((c) => { c.className = 'cm-card is-empty'; c.innerHTML = ''; });
    board.classList.remove('is-locked');

    // initial pairs: left in order, right scrambled
    const perm = [...Array(SLOTS).keys()].sort(() => Math.random() - 0.5);
    const n = Math.min(SLOTS, st.total);
    for (let k = 0; k < n; k++) place(pickPair(), k, perm[k]);

    updateHud();
    st.tick = setInterval(updateHud, 250);
    show('game');
  }

  function stopGame() {
    if (!st) return;
    clearInterval(st.tick);
    st.timers.forEach(clearTimeout);
    st.timers.clear();
    st.ended = true;
  }

  function pickPair() {
    const usedL = new Set(), usedR = new Set();
    for (const side of ['left', 'right'])
      for (const s of st.slots[side])
        if (s) { usedL.add(keyL(s.pair, st.mode)); usedR.add(keyR(s.pair, st.mode)); }

    let c = st.pool.filter((p) => !usedL.has(keyL(p, st.mode)) && !usedR.has(keyR(p, st.mode)));
    const fresh = c.filter((p) => !st.recent.includes(p.id));
    if (fresh.length) c = fresh;
    if (!c.length) c = st.pool; // data set too small: fall back (may be ambiguous)

    const pair = pick(c);
    st.recent.push(pair.id);
    if (st.recent.length > 8) st.recent.shift();
    return pair;
  }

  function place(pair, li, ri) {
    st.spawned++;
    const fill = (side, i, html) => {
      st.slots[side][i] = { pair, state: 'idle' };
      const el = cards[side][i];
      el.innerHTML = html;
      el.className = 'cm-card is-entering';
      el.setAttribute('aria-pressed', 'false');
    };
    fill('left', li, leftHTML(pair, st.mode));
    fill('right', ri, rightHTML(pair, st.mode));
  }

  // New pairs only load once REFILL_AT pairs (or fewer) are left, all at once,
  // into randomly chosen empty slots on each side.
  const REFILL_AT = 2;
  const shuffled = (a) => [...a].sort(() => Math.random() - 0.5);
  const activePairs = () => st.slots.left.filter((s) => s && s.state !== 'leaving').length;

  function maybeRefill() {
    if (st.refilling || st.spawned >= st.total || activePairs() > REFILL_AT) return;
    st.refilling = true;
    later(refill, T.fade + rand(T.spawnMin, T.spawnMax));
  }

  function refill() {
    st.refilling = false;
    if (st.ended) return;
    const empty = (side) => shuffled(st.slots[side].map((s, i) => (s ? -1 : i)).filter((i) => i >= 0));
    const el = empty('left'), er = empty('right');
    const n = Math.min(el.length, er.length, st.total - st.spawned);
    for (let k = 0; k < n; k++) place(pickPair(), el[k], er[k]);
  }

  /* ---------- interaction ---------- */
  function setSelected(side, i, on) {
    const slot = st.slots[side][i];
    if (!slot) return;
    slot.state = on ? 'selected' : 'idle';
    cards[side][i].classList.toggle('is-selected', on);
    cards[side][i].setAttribute('aria-pressed', String(on));
    st.sel[side] = on ? i : null;
  }

  function onClick(side, i) {
    if (!st || st.locked || st.ended) return;
    const slot = st.slots[side][i];
    if (!slot || slot.state === 'leaving') return;

    if (st.sel[side] === i) return setSelected(side, i, false); // tap again = unselect
    if (st.sel[side] !== null) setSelected(side, st.sel[side], false); // switch selection
    setSelected(side, i, true);

    if (st.sel.left !== null && st.sel.right !== null) resolve();
  }

  function resolve() {
    const li = st.sel.left, ri = st.sel.right;
    const L = st.slots.left[li], R = st.slots.right[ri];

    if (L.pair.id === R.pair.id) {
      // correct
      for (const [side, i] of [['left', li], ['right', ri]]) {
        st.slots[side][i].state = 'leaving';
        st.sel[side] = null;
        cards[side][i].classList.remove('is-selected');
        cards[side][i].classList.add('is-correct');
      }
      st.done++;
      updateHud();
      later(() => {
        for (const [side, i] of [['left', li], ['right', ri]]) {
          st.slots[side][i] = null;
          cards[side][i].className = 'cm-card is-empty';
          cards[side][i].innerHTML = '';
        }
      }, T.fade);

      if (st.done >= st.total) return later(endGame, T.fade + 150);
      maybeRefill();
    } else {
      // wrong
      st.mistakes++;
      st.locked = true;
      board.classList.add('is-locked');
      cards.left[li].classList.add('is-wrong');
      cards.right[ri].classList.add('is-wrong');
      updateHud();
      later(() => {
        cards.left[li].classList.remove('is-wrong');
        cards.right[ri].classList.remove('is-wrong');
        setSelected('left', li, false);
        setSelected('right', ri, false);
        board.classList.remove('is-locked');
        st.locked = false;
      }, T.wrongLock);
    }
  }

  /* ---------- hud / end ---------- */
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  function updateHud() {
    hud.done.textContent = st.done;
    hud.total.textContent = st.total;
    hud.mistakes.textContent = st.mistakes;
    hud.time.textContent = fmt(performance.now() - st.t0);
    hud.bar.style.width = `${(st.done / st.total) * 100}%`;
  }

  function endGame() {
    const elapsed = performance.now() - st.t0;
    stopGame();

    let best = elapsed;
    const key = `chematch-best-${st.mode}-${st.total}`;
    try {
      const prev = Number(localStorage.getItem(key));
      if (prev && prev < elapsed) best = prev;
      else localStorage.setItem(key, String(elapsed));
    } catch (_) { /* storage unavailable */ }

    $('[data-end=time]').textContent = fmt(elapsed);
    $('[data-end=mistakes]').textContent = st.mistakes;
    $('[data-end=accuracy]').textContent =
      `${Math.round((st.total / (st.total + st.mistakes)) * 100)}%`;
    $('[data-end=best]').textContent = fmt(best);
    show('end');
  }
})();