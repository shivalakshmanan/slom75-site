/* ==========================================================================
   Lab: the tower sketcher
   Three sliders and a shuffle button that redraw a tower elevation.
   ========================================================================== */
(function () {
  'use strict';

  var SL = window.SL;
  var stage = document.getElementById('sk-stage');
  if (!SL || !stage) return;

  var floorsIn = document.getElementById('sk-floors');
  var baysIn = document.getElementById('sk-bays');
  var litIn = document.getElementById('sk-lit');
  var floorsOut = document.getElementById('sk-floors-out');
  var baysOut = document.getElementById('sk-bays-out');
  var litOut = document.getElementById('sk-lit-out');
  var shuffleBtn = document.getElementById('sk-shuffle');
  var caption = document.getElementById('sk-caption');
  var seed = 42;

  function draw() {
    var floors = Number(floorsIn.value);
    var bays = Number(baysIn.value);
    var litShare = Number(litIn.value) / 100;
    var rnd = SL.rng(seed);

    var VW = 400, VH = 520, ground = 500;
    var fh = Math.min(20, 430 / floors);          // floor height
    var bw = Math.min(fh * 1.35, 320 / bays);     // bay width
    var w = bays * bw + 14;
    var h = floors * fh + 10;
    var x = (VW - w) / 2;
    var top = ground - 10 - h;

    var svg = SL.svg('svg', {
      viewBox: '0 0 ' + VW + ' ' + VH,
      preserveAspectRatio: 'xMidYMax meet',
      'class': 'skyline-svg',
      role: 'img',
      'aria-label': 'A sketched tower with ' + floors + ' floors and ' + bays + ' bays'
    });

    // Podium and body
    svg.appendChild(SL.svg('rect', { x: (x - 12).toFixed(1), y: ground - 10, width: (w + 24).toFixed(1), height: 10, 'class': 'body' }));
    svg.appendChild(SL.svg('rect', { x: x.toFixed(1), y: top.toFixed(1), width: w.toFixed(1), height: h.toFixed(1), 'class': 'body' }));

    // Crown: one of four, chosen by the shuffle
    var crown = Math.floor(rnd() * 4);
    var cx = x + w / 2;
    if (crown === 1 || crown === 3) {
      svg.appendChild(SL.svg('rect', { x: (x + w * 0.2).toFixed(1), y: (top - 12).toFixed(1), width: (w * 0.6).toFixed(1), height: 12, 'class': 'body' }));
    }
    if (crown === 3) {
      svg.appendChild(SL.svg('rect', { x: (x + w * 0.36).toFixed(1), y: (top - 22).toFixed(1), width: (w * 0.28).toFixed(1), height: 10, 'class': 'body' }));
    }
    if (crown === 1 || crown === 2) {
      var base = crown === 1 ? top - 12 : top;
      svg.appendChild(SL.svg('line', { x1: cx.toFixed(1), y1: base.toFixed(1), x2: cx.toFixed(1), y2: (base - 30).toFixed(1), 'class': 'mast' }));
      svg.appendChild(SL.svg('circle', { cx: cx.toFixed(1), cy: (base - 32).toFixed(1), r: 2.6, 'class': 'beacon' }));
    }

    // Windows
    var ww = bw * 0.58, wh = fh * 0.56;
    for (var f = 0; f < floors; f++) {
      for (var b = 0; b < bays; b++) {
        var win = SL.svg('rect', {
          x: (x + 7 + b * bw + (bw - ww) / 2).toFixed(1),
          y: (top + 6 + f * fh + (fh - wh) / 2).toFixed(1),
          width: ww.toFixed(1),
          height: wh.toFixed(1),
          'class': 'win touched'
        });
        if (rnd() < litShare) {
          win.classList.add('on');
          if (rnd() < 0.16) win.classList.add('warm');
        }
        svg.appendChild(win);
      }
    }

    svg.appendChild(SL.svg('rect', { x: 0, y: ground, width: VW, height: 4, 'class': 'ground' }));

    stage.textContent = '';
    stage.appendChild(svg);

    floorsOut.textContent = floors;
    baysOut.textContent = bays;
    litOut.textContent = Math.round(litShare * 100) + '%';
    caption.textContent = floors + ' floors, ' + bays + ' bays, ' + (floors * bays) + ' rooms. Click any window to switch it.';
  }

  stage.classList.add('live');
  stage.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('win')) t.classList.toggle('on');
  });

  [floorsIn, baysIn, litIn].forEach(function (input) { input.addEventListener('input', draw); });
  shuffleBtn.addEventListener('click', function () { seed += 1; draw(); });

  draw();
})();
