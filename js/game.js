/* ==========================================================================
   Lights On — a wiring puzzle
   Turn the tiles until every room is connected back to the mains.

   How it works:
   - Each level is a grid of rooms. A random "spanning tree" is grown from the
     mains tile, so one wire network reaches every room exactly once. That
     guarantees every level can be solved.
   - Every tile is then spun to a random position. The player spins them back.
   - Levels are seeded, so every visitor gets the same twelve towers.
   ========================================================================== */
(function () {
  'use strict';

  var SL = window.SL;
  var gridEl = document.getElementById('grid');
  if (!SL || !gridEl) return;

  var towerEl = document.getElementById('tower');
  var titleEl = document.getElementById('level-title');
  var statusEl = document.getElementById('status');
  var hintBtn = document.getElementById('hint');
  var restartBtn = document.getElementById('restart');
  var winEl = document.getElementById('win');
  var winMsg = document.getElementById('win-msg');
  var nextBtn = document.getElementById('next');
  var streetEl = document.getElementById('street');
  var resetBtn = document.getElementById('reset-all');

  var LEVELS = SL.LEVELS;

  // A tile's wires are stored as four bits: north, east, south, west.
  var N = 1, E = 2, S = 4, W = 8;
  var DIRS = [
    { bit: N, opp: S, dx: 0, dy: -1 },
    { bit: E, opp: W, dx: 1, dy: 0 },
    { bit: S, opp: N, dx: 0, dy: 1 },
    { bit: W, opp: E, dx: -1, dy: 0 }
  ];

  var WIN_LINES = [
    'Tower 1 is lit. Somebody on the third floor just put the kettle on.',
    'Tower 2 is lit. The lift is working again, to general relief.',
    'Tower 3 is lit. Someone’s finally found their reading glasses.',
    'Tower 4 is lit. Dinner is back on, four floors at a time.',
    'Tower 5 is lit. The night watchman sends his thanks.',
    'Tower 6 is lit. You can see it from the ring road now.',
    'Tower 7 is lit. Halfway down the street and it’s starting to look like a city.',
    'Tower 8 is lit. A football match just came back on in forty-nine living rooms.',
    'Tower 9 is lit. The rooftop beacon has company at last.',
    'Tower 10 is lit. Pilots can find the place again.',
    'Tower 11 is lit. One more and the whole street is yours.',
    'Tower 12 is lit. That’s the whole skyline, switched on by hand. Nicely done.'
  ];

  // Turn a wire pattern a quarter-turn clockwise, k times.
  function rot(mask, k) {
    k = ((k % 4) + 4) % 4;
    for (var i = 0; i < k; i++) mask = ((mask << 1) & 15) | (mask >> 3);
    return mask;
  }

  function countBits(mask) {
    return (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1) + ((mask >> 3) & 1);
  }

  // Walk the wires from the mains and report how far away each lit room is (-1 = dark).
  function flow(masks, cols, rows, src) {
    var n = cols * rows;
    var dist = [];
    for (var a = 0; a < n; a++) dist.push(-1);
    var queue = [src];
    dist[src] = 0;
    for (var head = 0; head < queue.length; head++) {
      var i = queue[head];
      var x = i % cols;
      var y = (i - x) / cols;
      for (var d = 0; d < 4; d++) {
        var dir = DIRS[d];
        if (!(masks[i] & dir.bit)) continue;
        var nx = x + dir.dx, ny = y + dir.dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        var j = ny * cols + nx;
        if (dist[j] === -1 && (masks[j] & dir.opp)) {
          dist[j] = dist[i] + 1;
          queue.push(j);
        }
      }
    }
    return dist;
  }

  function allLit(dist) {
    for (var i = 0; i < dist.length; i++) if (dist[i] === -1) return false;
    return true;
  }

  // Build one level: a solved wiring plan plus a scrambled starting position.
  function generate(level) {
    var cols = LEVELS[level - 1][0];
    var rows = LEVELS[level - 1][1];
    var n = cols * rows;
    var src = (rows - 1) * cols + Math.floor(cols / 2); // ground floor, middle

    for (var attempt = 0; attempt < 200; attempt++) {
      var rnd = SL.rng(7001 + level * 7919 + attempt * 101);
      var sol = [], inTree = [], i;
      for (i = 0; i < n; i++) { sol.push(0); inTree.push(false); }
      var active = [src];
      var count = 1;
      inTree[src] = true;

      while (active.length) {
        // Mostly extend the newest branch, sometimes start a side branch.
        var k = rnd() < 0.6 ? active.length - 1 : Math.floor(rnd() * active.length);
        var cell = active[k];
        var x = cell % cols;
        var y = (cell - x) / cols;
        var options = [];
        if (countBits(sol[cell]) < 3) {
          for (var d = 0; d < 4; d++) {
            var nx = x + DIRS[d].dx, ny = y + DIRS[d].dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            var j = ny * cols + nx;
            if (!inTree[j]) options.push([DIRS[d], j]);
          }
        }
        if (!options.length) { active.splice(k, 1); continue; }
        var pick = options[Math.floor(rnd() * options.length)];
        sol[cell] |= pick[0].bit;
        sol[pick[1]] |= pick[0].opp;
        inTree[pick[1]] = true;
        active.push(pick[1]);
        count++;
      }
      if (count !== n) continue; // a room was left out: try another plan

      var start = sol.map(function (mask) { return rot(mask, Math.floor(rnd() * 4)); });
      if (allLit(flow(start, cols, rows, src))) continue; // already solved: scramble again

      return { cols: cols, rows: rows, n: n, src: src, sol: sol, start: start };
    }
    return null;
  }

  /* ---------- game state ---------- */

  var state = null;   // the current level
  var tiles = [];     // the tile buttons
  var focusIndex = 0;

  function current(i) { return rot(state.start[i], state.turns[i]); }

  function currentMasks() {
    var out = [];
    for (var i = 0; i < state.n; i++) out.push(current(i));
    return out;
  }

  function shapeName(mask) {
    var bits = countBits(mask);
    if (bits === 1) return 'lamp';
    if (bits === 3) return 'three-way wire';
    if (bits === 4) return 'four-way wire';
    return (mask === (N | S) || mask === (E | W)) ? 'straight wire' : 'corner wire';
  }

  function describe(i, lit) {
    var x = i % state.cols;
    var y = (i - x) / state.cols;
    return 'Floor ' + (state.rows - y) + ', room ' + (x + 1) + ': ' + shapeName(state.start[i]) +
      (i === state.src ? ', the mains' : '') +
      (state.locked[i] ? ', pinned in place' : '') +
      (lit ? ', lit' : ', dark');
  }

  function wireSvg(mask) {
    var s = '<svg class="wire" viewBox="0 0 100 100" aria-hidden="true" focusable="false">';
    if (mask & N) s += '<line x1="50" y1="50" x2="50" y2="0"/>';
    if (mask & E) s += '<line x1="50" y1="50" x2="100" y2="50"/>';
    if (mask & S) s += '<line x1="50" y1="50" x2="50" y2="100"/>';
    if (mask & W) s += '<line x1="50" y1="50" x2="0" y2="50"/>';
    s += '<circle cx="50" cy="50" r="' + (countBits(mask) === 1 ? 15 : 4.5) + '"/></svg>';
    return s;
  }

  function loadLevel(level) {
    var plan = generate(level);
    if (!plan) return;
    state = plan;
    state.level = level;
    state.turns = [];
    state.locked = [];
    state.won = false;
    state.wasLit = [];
    for (var i = 0; i < state.n; i++) { state.turns.push(0); state.locked.push(false); state.wasLit.push(false); }

    towerEl.classList.remove('won');
    towerEl.style.setProperty('--cols', state.cols);
    towerEl.style.setProperty('--rows', state.rows);
    gridEl.textContent = '';
    gridEl.setAttribute('aria-label', 'Tower ' + level + ': ' + state.rows + ' floors of ' + state.cols + ' rooms');
    tiles = [];
    var warmRnd = SL.rng(300 + level);

    for (i = 0; i < state.n; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tile' +
        (i === state.src ? ' source' : '') +
        (countBits(state.start[i]) === 1 ? ' end' : '') +
        (warmRnd() < 0.2 ? ' warm' : '');
      btn.setAttribute('data-i', i);
      btn.tabIndex = -1;
      btn.style.setProperty('--row', state.rows - 1 - Math.floor(i / state.cols));
      btn.innerHTML = '<span class="room"></span>' + wireSvg(state.start[i]);
      gridEl.appendChild(btn);
      tiles.push(btn);
    }

    focusIndex = state.src;
    tiles[focusIndex].tabIndex = 0;

    titleEl.textContent = 'Tower ' + level + ' of ' + LEVELS.length;
    winEl.hidden = true;
    hintBtn.disabled = false;
    restartBtn.disabled = false;
    refresh();
    drawStreet();
  }

  // Recalculate which rooms are lit and update the screen.
  function refresh() {
    var dist = flow(currentMasks(), state.cols, state.rows, state.src);
    var litCount = 0;
    var nearestNew = Infinity;
    var i;
    for (i = 0; i < state.n; i++) {
      if (dist[i] !== -1 && !state.wasLit[i] && dist[i] < nearestNew) nearestNew = dist[i];
    }
    for (i = 0; i < state.n; i++) {
      var lit = dist[i] !== -1;
      if (lit) litCount++;
      // Newly lit rooms switch on in sequence, as if the current is travelling.
      var delay = (lit && !state.wasLit[i]) ? Math.min(450, (dist[i] - nearestNew) * 32) : 0;
      tiles[i].style.setProperty('--delay', delay + 'ms');
      tiles[i].classList.toggle('on', lit);
      tiles[i].setAttribute('aria-label', describe(i, lit));
      state.wasLit[i] = lit;
    }
    statusEl.textContent = litCount === state.n
      ? 'All ' + state.n + ' rooms lit'
      : litCount + ' of ' + state.n + ' rooms lit';
    if (litCount === state.n && !state.won) win();
  }

  function turn(i, by) {
    if (!state || state.won || state.locked[i]) return;
    state.turns[i] += by;
    tiles[i].style.setProperty('--turns', state.turns[i]);
    refresh();
  }

  function setFocus(i, moveFocus) {
    tiles[focusIndex].tabIndex = -1;
    focusIndex = i;
    tiles[i].tabIndex = 0;
    if (moveFocus) tiles[i].focus();
  }

  function hint() {
    if (!state || state.won) return;
    // Fix the wrong tile nearest the mains, so hints build outward from the power.
    var solDist = flow(state.sol, state.cols, state.rows, state.src);
    var best = -1;
    for (var i = 0; i < state.n; i++) {
      if (state.locked[i] || current(i) === state.sol[i]) continue;
      if (best === -1 || solDist[i] < solDist[best]) best = i;
    }
    if (best === -1) return;
    var k = 1;
    while (k < 4 && rot(current(best), k) !== state.sol[best]) k++;
    state.turns[best] += k;
    state.locked[best] = true;
    tiles[best].style.setProperty('--turns', state.turns[best]);
    tiles[best].classList.add('locked');
    refresh();
  }

  function win() {
    state.won = true;
    towerEl.classList.add('won');
    hintBtn.disabled = true;

    var lit = SL.getLit();
    if (lit.indexOf(state.level) === -1) {
      lit.push(state.level);
      lit.sort(function (a, b) { return a - b; });
      SL.setLit(lit);
    }

    var next = nextDark(lit);
    winMsg.textContent = WIN_LINES[state.level - 1];
    if (next) {
      nextBtn.hidden = false;
      nextBtn.textContent = 'Go to tower ' + next;
      nextBtn.setAttribute('data-level', next);
    } else {
      nextBtn.hidden = true;
      winMsg.textContent = WIN_LINES[state.level - 1] +
        (state.level === LEVELS.length ? '' : ' Every tower on the street is lit.');
    }
    winEl.hidden = false;
    drawStreet();
    if (next) nextBtn.focus({ preventScroll: true });
    // On small screens the message sits below the tower, so bring it into view.
    if (winEl.scrollIntoView) {
      window.setTimeout(function () { winEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 900);
    }
  }

  function nextDark(lit) {
    for (var level = 1; level <= LEVELS.length; level++) {
      if (lit.indexOf(level) === -1) return level;
    }
    return 0;
  }

  function drawStreet() {
    var lit = SL.getLit();
    SL.street(streetEl, { lit: lit, current: state ? state.level : 0, onPick: loadLevel });
    resetBtn.hidden = lit.length === 0;
  }

  /* ---------- controls ---------- */

  function tileIndex(target) {
    var btn = target && target.closest ? target.closest('.tile') : null;
    return btn ? Number(btn.getAttribute('data-i')) : -1;
  }

  gridEl.addEventListener('click', function (e) {
    var i = tileIndex(e.target);
    if (i < 0) return;
    setFocus(i, false);
    turn(i, e.shiftKey ? -1 : 1);
  });

  gridEl.addEventListener('contextmenu', function (e) {
    var i = tileIndex(e.target);
    if (i < 0) return;
    e.preventDefault();
    setFocus(i, false);
    turn(i, -1);
  });

  gridEl.addEventListener('keydown', function (e) {
    if (!state) return;
    var x = focusIndex % state.cols;
    var y = (focusIndex - x) / state.cols;
    if (e.key === 'ArrowUp') y--;
    else if (e.key === 'ArrowDown') y++;
    else if (e.key === 'ArrowLeft') x--;
    else if (e.key === 'ArrowRight') x++;
    else return;
    e.preventDefault();
    if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return;
    setFocus(y * state.cols + x, true);
  });

  gridEl.addEventListener('focusin', function (e) {
    var i = tileIndex(e.target);
    if (i >= 0 && i !== focusIndex) setFocus(i, false);
  });

  hintBtn.addEventListener('click', hint);
  restartBtn.addEventListener('click', function () { if (state) loadLevel(state.level); });
  nextBtn.addEventListener('click', function () {
    var level = Number(nextBtn.getAttribute('data-level'));
    if (level) {
      loadLevel(level);
      tiles[focusIndex].focus({ preventScroll: true });
    }
  });
  resetBtn.addEventListener('click', function () {
    if (window.confirm('Switch every tower off and start the street again?')) {
      SL.setLit([]);
      loadLevel(1);
    }
  });

  // Start on the first tower that is still dark (or tower 1 if all are lit).
  loadLevel(nextDark(SL.getLit()) || 1);

  // Exposed for testing only.
  SL._game = { generate: generate, flow: flow, allLit: allLit, rot: rot, state: function () { return state; } };
})();
