/* Процесс работы: по линии плавно течёт световой луч с градиентным шлейфом
   (розовый → фиолетовый → бирюзовый), как контурная подсветка в салоне авто.
   Этапы мягко разгораются, когда луч к ним подходит, и медленно гаснут после.
   При наведении на этап луч плавно «подплывает» к нему и останавливается. */
(function () {
  var root = document.getElementById('gbProc');
  if (!root) return;
  var svg = root.querySelector('.gb-proc-wire');
  var base = root.querySelector('.gb-proc-wire-base');
  var steps = Array.prototype.slice.call(root.querySelectorAll('.gb-proc-step'));
  if (!svg || !base || steps.length < 2) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- defs: градиент луча и размытие для свечения ---
  var defs = document.createElementNS(NS, 'defs');
  var grad = document.createElementNS(NS, 'linearGradient');
  grad.setAttribute('id', 'gbProcBeamGrad');
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  [
    ['0', '#ff3399', '0'],
    ['0.45', '#ff3399', '0.55'],
    ['0.8', '#7b2fff', '0.9'],
    ['0.97', '#00e5ff', '1'],
    ['1', '#00e5ff', '0'],
  ].forEach(function (st) {
    var s = document.createElementNS(NS, 'stop');
    s.setAttribute('offset', st[0]);
    s.setAttribute('stop-color', st[1]);
    s.setAttribute('stop-opacity', st[2]);
    grad.appendChild(s);
  });
  var filt = document.createElementNS(NS, 'filter');
  filt.setAttribute('id', 'gbProcBlur');
  filt.setAttribute('x', '-20%'); filt.setAttribute('y', '-400%');
  filt.setAttribute('width', '140%'); filt.setAttribute('height', '900%');
  var blur = document.createElementNS(NS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '5');
  filt.appendChild(blur);
  defs.appendChild(grad); defs.appendChild(filt);
  svg.insertBefore(defs, svg.firstChild);

  function mkLine(cls) {
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('class', cls);
    l.setAttribute('stroke', 'url(#gbProcBeamGrad)');
    svg.appendChild(l);
    return l;
  }
  var glow = mkLine('gb-proc-beam-glow');
  var beam = mkLine('gb-proc-beam');

  var A = { x: 0, y: 0 }, B = { x: 0, y: 0 }, len = 1, fr = []; // fr — доля пути до каждого узла

  function measure() {
    var rr = root.getBoundingClientRect();
    svg.setAttribute('width', rr.width);
    svg.setAttribute('height', rr.height);
    svg.setAttribute('viewBox', '0 0 ' + rr.width + ' ' + rr.height);
    var pts = steps.map(function (st) {
      var n = st.querySelector('.gb-proc-node').getBoundingClientRect();
      return { x: n.left - rr.left + n.width / 2, y: n.top - rr.top + n.height / 2 };
    });
    A = pts[0]; B = pts[pts.length - 1];
    len = Math.max(1, Math.hypot(B.x - A.x, B.y - A.y));
    fr = pts.map(function (p) { return Math.hypot(p.x - A.x, p.y - A.y) / len; });
    [base, glow, beam].forEach(function (l) {
      l.setAttribute('x1', A.x); l.setAttribute('y1', A.y);
      l.setAttribute('x2', B.x); l.setAttribute('y2', B.y);
    });
  }

  function at(t) { return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t }; }

  var TAIL = 0.42;          // длина шлейфа (доля линии)
  var CYCLE = 5200;         // проход луча, мс
  var PAUSE = 300;          // пауза между проходами
  var head = -0.05, hoverT = -1, glowN = steps.map(function () { return 0; });
  var tStart = 0, last = 0, running = false, raf = 0, blendUntil = 0;

  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(64, now - (last || now)); last = now;
    var target;
    if (hoverT >= 0) {
      target = hoverT;
      head += (target - head) * Math.min(1, dt / 220);   // мягко подплывает к этапу
    } else {
      var el = (now - tStart) % (CYCLE + PAUSE);
      var p = Math.min(1, el / CYCLE);
      var nh = -0.08 + ease(p) * (1 + TAIL + 0.08);
      // сразу после наведения не прыгаем, а мягко догоняем фазу
      if (now < blendUntil) head += (nh - head) * Math.min(1, dt / 160);
      else head = nh;
    }

    // шлейф: от head-TAIL до head (+ крошечный выход за голову)
    var a = at(head - TAIL), b = at(head + 0.012);
    grad.setAttribute('x1', a.x); grad.setAttribute('y1', a.y);
    grad.setAttribute('x2', b.x); grad.setAttribute('y2', b.y);

    // этапы: разгораются при подходе луча, затем плавно остывают
    steps.forEach(function (st, i) {
      var d = head - fr[i];
      var near = Math.exp(-(d * d) / (2 * 0.045 * 0.045));             // пик у головы
      var trail = d > 0 && d < TAIL ? 0.55 * (1 - d / TAIL) : 0;        // подсветка шлейфом
      var want = Math.max(near, trail);
      if (hoverT >= 0) want = Math.abs(fr[i] - hoverT) < 0.001 ? 1 : want * 0.6;
      var k = want > glowN[i] ? Math.min(1, dt / 120) : Math.min(1, dt / 700); // быстро загорается, медленно гаснет
      glowN[i] += (want - glowN[i]) * k;
      st.style.setProperty('--g', glowN[i].toFixed(3));
    });
  }

  function start() {
    if (running) return;
    measure();
    if (reduce) { steps.forEach(function (s) { s.style.setProperty('--g', '0.6'); }); return; }
    running = true; last = 0; tStart = performance.now() - 0; head = -0.08;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    steps.forEach(function (st, i) {
      st.addEventListener('mouseenter', function () { hoverT = fr[i] || 0; });
      st.addEventListener('mouseleave', function () {
        hoverT = -1;
        // продолжаем цикл с текущего места луча
        var p = Math.max(0, Math.min(1, (head + 0.08) / (1 + TAIL + 0.08)));
        var lo = 0, hi = 1; // обратная функция ease — подбором
        for (var it = 0; it < 24; it++) { var m = (lo + hi) / 2; if (ease(m) < p) lo = m; else hi = m; }
        tStart = performance.now() - lo * CYCLE;
        blendUntil = performance.now() + 500;
      });
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.15 }).observe(root);
  } else start();

  var rT;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(measure, 150); });
  window.addEventListener('load', measure);
  setTimeout(measure, 300);
})();
