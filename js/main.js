/* ==========================================================================
   Shiva Lakshmanan — personal site
   main.js: shared behaviour for every page.
   - mobile menu
   - scroll reveals
   - the skyline drawings (hero and footer)
   - the game-progress "street" on Home
   - the email link and copy button on Contact
   No libraries. Everything degrades gracefully if JavaScript is off.
   ========================================================================== */
(function () {
  'use strict';

  var SL = window.SL = window.SL || {};
  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- small helpers ---------- */

  // Seeded random numbers, so drawings and puzzles are the same for everyone.
  SL.rng = function (seed) {
    var s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  var SVG_NS = 'http://www.w3.org/2000/svg';
  SL.svg = function (name, attrs) {
    var node = doc.createElementNS(SVG_NS, name);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) node.setAttribute(key, attrs[key]);
    }
    return node;
  };

  /* ---------- game progress (shared by Home and the Game page) ---------- */

  // Each level is [columns, rows]. Towers get taller and wider as you go.
  SL.LEVELS = [[4, 4], [4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [6, 8], [7, 7], [7, 8], [7, 9], [8, 8], [8, 9]];

  var STORE_KEY = 'lightsOn.v1';
  var memoryLit = null; // used if the browser blocks storage

  SL.getLit = function () {
    if (memoryLit) return memoryLit.slice();
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(function (n) {
        return typeof n === 'number' && n % 1 === 0 && n >= 1 && n <= SL.LEVELS.length;
      });
    } catch (err) {
      return [];
    }
  };

  SL.setLit = function (list) {
    memoryLit = list.slice();
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
      memoryLit = null;
    } catch (err) {
      /* storage unavailable: progress lasts for this visit only */
    }
  };

  // Draw the row of twelve towers. opts.onPick makes them buttons.
  SL.street = function (host, opts) {
    opts = opts || {};
    var lit = opts.lit || SL.getLit();
    host.textContent = '';
    SL.LEVELS.forEach(function (size, index) {
      var level = index + 1;
      var isLit = lit.indexOf(level) !== -1;
      var node = doc.createElement(opts.onPick ? 'button' : 'span');
      node.className = 't' + (isLit ? ' lit' : '') + (opts.current === level ? ' current' : '');
      node.style.setProperty('--h', (0.34 + (size[1] - 4) * 0.132).toFixed(3));
      if (opts.onPick) {
        var unlocked = level === 1 || isLit || lit.indexOf(level - 1) !== -1;
        node.type = 'button';
        node.disabled = !unlocked;
        node.setAttribute('aria-label', 'Tower ' + level + ', ' +
          (isLit ? 'lit' : unlocked ? 'dark' : 'locked until tower ' + (level - 1) + ' is lit') +
          (opts.current === level ? ', playing now' : ''));
        var num = doc.createElement('span');
        num.className = 'num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = level;
        node.appendChild(num);
        node.addEventListener('click', function () { opts.onPick(level); });
      }
      host.appendChild(node);
    });
  };

  /* ---------- skyline drawing ---------- */

  SL.skyline = function (host, o) {
    o = o || {};
    var W = o.width || 1600;
    var H = o.height || 340;
    var rnd = SL.rng(o.seed || 11);
    var litShare = o.lit == null ? 0.3 : o.lit;
    // o.rise: towers stay low on the left and climb to the right (wide hero only).
    var range = function (cx, lo, hi) {
      if (!o.rise) return [lo, hi];
      var t = Math.max(0, Math.min(1, (cx / W - 0.5) / 0.26));
      t = t * t * (3 - 2 * t);
      return [0.07 + (lo - 0.07) * t * 1.5, 0.16 + (hi - 0.16) * t];
    };
    var band;
    var svg = SL.svg('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: o.rise ? 'xMaxYMax slice' : 'xMidYMax slice',
      'aria-hidden': 'true',
      focusable: 'false',
      'class': 'skyline-svg'
    });
    var x, w, h, top;

    // Distant silhouettes, for depth.
    x = -20;
    while (x < W) {
      w = 50 + rnd() * 90;
      band = range(x + w / 2, 0.3, 0.8);
      h = H * (band[0] + rnd() * (band[1] - band[0]));
      svg.appendChild(SL.svg('rect', { x: x.toFixed(1), y: (H - h).toFixed(1), width: w.toFixed(1), height: h.toFixed(1), 'class': 'far' }));
      x += w - 8 + rnd() * 34;
    }

    // Near towers, with windows.
    x = -30;
    while (x < W + 30) {
      w = Math.round(46 + rnd() * 74);
      band = range(x + w / 2, 0.26, 0.88);
      h = Math.round(H * (band[0] + rnd() * (band[1] - band[0])));
      top = H - h;
      svg.appendChild(SL.svg('rect', { x: x, y: top, width: w, height: h + 2, 'class': 'body' }));

      var crown = rnd();
      if (crown < 0.28 && w > 62) {
        svg.appendChild(SL.svg('rect', { x: Math.round(x + w * 0.25), y: top - 12, width: Math.round(w * 0.5), height: 13, 'class': 'body' }));
      } else if (crown < 0.46) {
        var mx = Math.round(x + w * (0.3 + rnd() * 0.4));
        svg.appendChild(SL.svg('line', { x1: mx, y1: top, x2: mx, y2: top - 24, 'class': 'mast' }));
        svg.appendChild(SL.svg('circle', { cx: mx, cy: top - 26, r: 2.4, 'class': 'beacon', style: 'animation-delay:' + (rnd() * 2.6).toFixed(2) + 's' }));
      }

      var px = 13, py = 15;
      var cols = Math.floor((w - 10) / px);
      var rows = Math.floor((h - 12) / py);
      var ox = x + (w - (cols * px - 6)) / 2;
      var oy = top + 9;
      var towerLit = litShare * (0.35 + rnd() * 1.3);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var win = SL.svg('rect', { x: (ox + c * px).toFixed(1), y: oy + r * py, width: 7, height: 8, 'class': 'win' });
          if (rnd() < towerLit) {
            win.classList.add('on');
            if (rnd() < 0.16) win.classList.add('warm');
            win.style.setProperty('--d', (0.2 + rnd() * 2.6).toFixed(2) + 's');
          }
          svg.appendChild(win);
        }
      }
      x += w + Math.round(rnd() * 12) - 3;
    }

    svg.appendChild(SL.svg('rect', { x: 0, y: H - 3, width: W, height: 4, 'class': 'ground' }));

    if (o.live) {
      // The windows are switches: hover lights them, a click or tap toggles them.
      host.classList.add('live');
      var isWin = function (t) { return t && t.classList && t.classList.contains('win'); };
      svg.addEventListener('pointerover', function (e) {
        if (e.pointerType === 'touch' || !isWin(e.target)) return;
        e.target.classList.add('on', 'touched');
      });
      svg.addEventListener('click', function (e) {
        if (!isWin(e.target)) return;
        e.target.classList.add('touched');
        e.target.classList.toggle('on');
      });
    }

    host.textContent = '';
    host.appendChild(svg);
    return svg;
  };

  /* ---------- page wiring ---------- */

  function initNav() {
    var toggle = doc.querySelector('.nav-toggle');
    var nav = doc.getElementById('site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  function initReveal() {
    var items = doc.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(items, function (n) { io.observe(n); });
  }

  function initSkylines() {
    var hero = doc.querySelector('[data-skyline="hero"]');
    if (hero) {
      // Wide screens get a taller city that climbs to the right, behind the text.
      var wide = window.matchMedia ? window.matchMedia('(min-width: 1000px)') : null;
      var drawHero = function () {
        if (wide && wide.matches) SL.skyline(hero, { width: 1600, height: 620, seed: 2026, lit: 0.3, live: true, rise: true });
        else SL.skyline(hero, { width: 1600, height: 340, seed: 2026, lit: 0.3, live: true });
      };
      drawHero();
      if (wide) {
        if (wide.addEventListener) wide.addEventListener('change', drawHero);
        else if (wide.addListener) wide.addListener(drawHero);
      }
    }

    var foot = doc.querySelector('[data-skyline="footer"]');
    if (foot) SL.skyline(foot, { width: 1600, height: 120, seed: 75, lit: 0.2 });
  }

  // Home: the hero copy drifts and fades a little as you scroll away.
  function initHeroDrift() {
    var copy = doc.querySelector('.hero-copy');
    if (!copy || reduceMotion) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset || 0;
      var k = Math.min(1, y / 520);
      copy.style.opacity = String(1 - k * 0.85);
      copy.style.transform = 'translateY(' + (y * 0.16).toFixed(1) + 'px)';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
  }

  function initTeaser() {
    var street = doc.getElementById('teaser-street');
    if (!street) return;
    var lit = SL.getLit();
    var total = SL.LEVELS.length;
    SL.street(street, { lit: lit });
    var line = doc.getElementById('teaser-progress');
    var cta = doc.getElementById('teaser-cta');
    if (line) {
      if (lit.length >= total) line.textContent = 'You’ve lit all ' + total + ' towers. The street looks good.';
      else if (lit.length > 0) line.textContent = 'You’ve lit ' + lit.length + ' of ' + total + ' towers so far.';
    }
    if (cta && lit.length > 0) cta.textContent = lit.length >= total ? 'Play it again' : 'Keep going';
  }

  function initEmail() {
    var links = doc.querySelectorAll('[data-email]');
    if (!links.length) return;
    Array.prototype.forEach.call(links, function (a) {
      // The address is stitched together here so it never sits whole in the HTML.
      var address = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
      a.href = 'mailto:' + address;
      if (a.hasAttribute('data-show')) a.textContent = address;
    });

    var copyBtn = doc.getElementById('copy-email');
    var note = doc.getElementById('copy-note');
    if (!copyBtn) return;
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      var first = links[0];
      var address = first.getAttribute('data-u') + '@' + first.getAttribute('data-d');
      function done(ok) {
        if (note) note.textContent = ok ? 'Address copied.' : 'Couldn’t copy automatically. The address is ' + address;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  }

  function initYear() {
    var y = doc.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function start() {
    initNav();
    initSkylines();
    initReveal();
    initHeroDrift();
    initTeaser();
    initEmail();
    initYear();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})();
