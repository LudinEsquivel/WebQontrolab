/* ============================================================
   Qontrol · Landing — interacciones
   Mejora progresiva: sin JS el contenido se ve completo.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- Colores de canvas según el tema ---------- */
  var palette = {};
  function readPalette() {
    var cs = getComputedStyle(root);
    ['p-base', 'p-accent', 'p-ink', 'p-node', 'p-bg'].forEach(function (k) { palette[k] = cs.getPropertyValue('--' + k).trim(); });
    palette.dark = root.dataset.theme === 'dark';
  }
  readPalette();

  /* ---------- Tema claro / oscuro (blanco y negro) ----------
     Por defecto sigue el tema del navegador y cambia en vivo si la persona
     lo cambia en su sistema. Si elige otro con el botón, se respeta; si
     vuelve a elegir el mismo del sistema, la página vuelve a seguirlo. */
  function initTheme() {
    var btn = $('#themeToggle');
    var meta = $('meta[name="theme-color"]');
    var KEY = 'qontrol-theme';
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var forced = /[?&]tema=(oscuro|claro)/.test(location.search);
    function system() { return mq && mq.matches ? 'dark' : 'light'; }
    function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function set(theme) {
      root.classList.add('theme-switching');
      root.dataset.theme = theme;
      var dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      if (meta) meta.setAttribute('content', dark ? '#09090A' : '#F7F8FC');
      readPalette();
      document.dispatchEvent(new CustomEvent('qontrol:theme'));
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('theme-switching'); }); });
    }
    // Fundido suave de toda la página donde el navegador lo permite; si no, cambio limpio al instante.
    function apply(theme, animate) {
      if (animate && !reduceMotion && document.startViewTransition) document.startViewTransition(function () { set(theme); });
      else set(theme);
    }
    apply(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        if (next === system()) localStorage.removeItem(KEY); else localStorage.setItem(KEY, next);
      } catch (e) {}
      apply(next, true);
    });
    if (mq) {
      var follow = function () { if (!forced && !saved()) apply(system(), true); };
      if (mq.addEventListener) mq.addEventListener('change', follow); else if (mq.addListener) mq.addListener(follow);
    }
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var nav = $('#nav'), toggle = $('#navToggle'), menu = $('#mobileMenu');
    function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 24); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.hidden = !open;
    }
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });

    var links = $$('.nav__links a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['soluciones', 'beneficios', 'modulos', 'implementacion', 'preguntas'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Titular por palabras + revelado ---------- */
  function initReveal() {
    $$('[data-split]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = words.map(function (w, i) {
        return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
      }).join(' ');
      setTimeout(function () { el.classList.add('is-in'); }, 60);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });

    // Respaldo: si el observer no dispara (pestaña en segundo plano, capturas), nada queda oculto.
    function failsafe() {
      $$('.reveal:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) el.classList.add('is-in');
      });
    }
    setTimeout(failsafe, 1600);
    window.addEventListener('scroll', function () { clearTimeout(failsafe.t); failsafe.t = setTimeout(failsafe, 400); }, { passive: true });
  }

  /* ---------- Conteo de cifras ---------- */
  function formatNumber(v, el) {
    var s = el.dataset.format === 'comma' ? Math.round(v).toLocaleString('en-US') : String(Math.round(v));
    return (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
  }
  function countUp(el, dur) {
    if (reduceMotion || el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = parseFloat(el.dataset.count);
    var start = performance.now();
    (function tick(now) {
      var t = clamp((now - start) / (dur || 1400), 0, 1);
      el.textContent = formatNumber(target * (1 - Math.pow(1 - t, 4)), el);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- Utilidades de canvas ---------- */
  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }
  function whenVisible(el, onChange) {
    var io = new IntersectionObserver(function (entries) { onChange(entries[0].isIntersecting); }, { threshold: 0 });
    io.observe(el);
  }

  /* ---------- Puntos de fondo: pocos, suaves, acompañan al bajar ---------- */
  function initAmbient() {
    var canvas = $('#ambient');
    if (!canvas) return;
    var ctx, w, h, dots = [], raf = 0, last = 0, running = false;
    function build() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(w * h / 24000, 28, 80));
      dots = [];
      for (var i = 0; i < n; i++) {
        var d = 0.25 + Math.random() * 0.75;
        dots.push({ x: Math.random() * w, y: Math.random() * (h + 60), d: d, s: 0.9 + d * 1.3, a: 0.1 + d * 0.22,
          vx: (Math.random() - 0.5) * 0.006, ph: Math.random() * 6.28, accent: Math.random() < 0.16 });
      }
      draw(performance.now());
    }
    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      var sy = window.scrollY, span = h + 60, t = now * 0.001;
      var inkCol = 'rgb(' + palette['p-ink'] + ')', accentCol = 'rgb(' + palette['p-node'] + ')';
      var pos = [];
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i];
        var y = ((p.y - sy * p.d * 0.32) % span + span) % span - 30;
        var x = ((p.x % w) + w) % w;
        pos.push(x, y);
        ctx.globalAlpha = p.a * (0.75 + Math.sin(t * 0.6 + p.ph) * 0.25);
        ctx.fillStyle = p.accent ? accentCol : inkCol;
        ctx.beginPath(); ctx.arc(x, y, p.s, 0, Math.PI * 2); ctx.fill();
      }
      // Hilos muy tenues entre puntos cercanos (como la red, pero en susurro)
      ctx.strokeStyle = inkCol;
      ctx.lineWidth = 0.6;
      for (var a = 0; a < dots.length; a++) {
        for (var b = a + 1; b < dots.length; b++) {
          var dx = pos[a * 2] - pos[b * 2], dy = pos[a * 2 + 1] - pos[b * 2 + 1], d2 = dx * dx + dy * dy;
          if (d2 < 11000) {
            ctx.globalAlpha = (1 - d2 / 11000) * 0.07;
            ctx.beginPath(); ctx.moveTo(pos[a * 2], pos[a * 2 + 1]); ctx.lineTo(pos[b * 2], pos[b * 2 + 1]); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    function tick(now) {
      var dt = last ? Math.min(now - last, 50) : 16; last = now;
      for (var i = 0; i < dots.length; i++) { var p = dots[i]; p.y -= dt * 0.006 * p.d; p.x += p.vx * dt; }
      draw(now);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    build();
    if (reduceMotion) {
      window.addEventListener('scroll', function () { requestAnimationFrame(function () { draw(performance.now()); }); }, { passive: true });
    } else {
      start();
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    }
    document.addEventListener('qontrol:theme', function () { if (!running) draw(performance.now()); });
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
  }

  /* ---------- Partículas del hero: Q → tubos → corazón → cápsula ---------- */
  var SHAPES = [
    { label: 'Qontrol', draw: function (c, cx, cy, s, accent) {
        c.lineCap = 'round';
        c.lineWidth = s * 0.12;
        c.strokeStyle = '#fff';
        c.beginPath(); c.arc(cx - s * 0.03, cy - s * 0.04, s * 0.33, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = accent;
        c.beginPath(); c.moveTo(cx + s * 0.16, cy + s * 0.15); c.lineTo(cx + s * 0.4, cy + s * 0.39); c.stroke();
      } },
    { label: 'QontrolHosp · hospitales y sanatorios', draw: function (c, cx, cy, s, accent) {
        c.lineJoin = 'round'; c.lineCap = 'round';
        var bw = s * 0.92, bh = s * 0.6, left = cx - bw / 2, top = cy - bh / 2 + s * 0.14;
        c.strokeStyle = '#fff'; c.lineWidth = s * 0.035;
        c.strokeRect(left, top, bw, bh);
        c.beginPath(); c.moveTo(left - s * 0.06, top + bh); c.lineTo(left + bw + s * 0.06, top + bh); c.stroke();
        c.fillStyle = '#fff';
        [0.1, 0.27, 0.63, 0.8].forEach(function (fx) {
          [0.16, 0.5].forEach(function (fy) { c.fillRect(left + bw * fx, top + bh * fy, s * 0.1, s * 0.09); });
        });
        c.strokeRect(cx - s * 0.08, top + bh - s * 0.22, s * 0.16, s * 0.22);
        var cs = s * 0.26, t = cs * 0.34, ct = top - cs - s * 0.05;
        c.fillStyle = accent;
        c.fillRect(cx - t / 2, ct, t, cs);
        c.fillRect(cx - cs / 2, ct + cs / 2 - t / 2, cs, t);
      } },
    { label: 'QontroLab · laboratorios', draw: function (c, cx, cy, s, accent) {
        var levels = [0.5, 0.72, 0.38];
        c.save(); c.translate(cx, cy); c.rotate(-0.08);
        [-0.32, 0, 0.32].forEach(function (dx, i) {
          var x = dx * s, w = s * 0.16, top = -s * 0.42, bottom = s * 0.36, r = w / 2;
          var lt = bottom - (bottom - top) * levels[i];
          c.fillStyle = accent;
          c.beginPath(); c.moveTo(x - r, lt); c.lineTo(x - r, bottom - r); c.arc(x, bottom - r, r, Math.PI, 0, true); c.lineTo(x + r, lt); c.closePath(); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = s * 0.03;
          c.beginPath(); c.moveTo(x - r, top); c.lineTo(x - r, bottom - r); c.arc(x, bottom - r, r, Math.PI, 0, true); c.lineTo(x + r, top); c.stroke();
          c.beginPath(); c.moveTo(x - r - s * 0.03, top); c.lineTo(x + r + s * 0.03, top); c.stroke();
        });
        c.lineWidth = s * 0.035;
        c.beginPath(); c.moveTo(-s * 0.56, s * 0.08); c.lineTo(s * 0.56, s * 0.08); c.stroke();
        c.restore();
      } },
    { label: 'QontrolClinic · clínicas', draw: function (c, cx, cy, s, accent) {
        c.lineJoin = 'round'; c.lineCap = 'round';
        c.strokeStyle = '#fff'; c.lineWidth = s * 0.06;
        c.beginPath();
        c.moveTo(cx, cy + s * 0.36);
        c.bezierCurveTo(cx - s * 0.78, cy - s * 0.12, cx - s * 0.36, cy - s * 0.66, cx, cy - s * 0.26);
        c.bezierCurveTo(cx + s * 0.36, cy - s * 0.66, cx + s * 0.78, cy - s * 0.12, cx, cy + s * 0.36);
        c.stroke();
        c.strokeStyle = accent; c.lineWidth = s * 0.045;
        var y = cy - s * 0.02;
        c.beginPath();
        c.moveTo(cx - s * 0.82, y); c.lineTo(cx - s * 0.24, y); c.lineTo(cx - s * 0.14, y - s * 0.26);
        c.lineTo(cx - s * 0.02, y + s * 0.24); c.lineTo(cx + s * 0.1, y - s * 0.12); c.lineTo(cx + s * 0.18, y);
        c.lineTo(cx + s * 0.82, y);
        c.stroke();
      } },
    { label: 'QontrolFarm · farmacias', draw: function (c, cx, cy, s, accent) {
        c.save(); c.translate(cx, cy); c.rotate(-0.62);
        var w = s * 1.02, h = s * 0.36, r = h / 2;
        c.fillStyle = accent;
        c.beginPath(); c.moveTo(0, -r); c.lineTo(-w / 2 + r, -r); c.arc(-w / 2 + r, 0, r, -Math.PI / 2, Math.PI / 2, true); c.lineTo(0, r); c.closePath(); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = s * 0.04;
        c.beginPath(); c.moveTo(0, -r); c.lineTo(w / 2 - r, -r); c.arc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2); c.lineTo(0, r); c.stroke();
        c.beginPath(); c.moveTo(0, -r); c.lineTo(0, r); c.stroke();
        c.restore();
        c.fillStyle = '#fff';
        [[0.5, -0.36, 0.07], [0.62, -0.12, 0.05], [-0.56, 0.4, 0.06]].forEach(function (d) {
          c.beginPath(); c.arc(cx + d[0] * s, cy + d[1] * s, d[2] * s, 0, Math.PI * 2); c.fill();
        });
      } }
  ];

  function sampleShape(shape, w, h, count) {
    var off = document.createElement('canvas');
    off.width = Math.round(w); off.height = Math.round(h);
    var c = off.getContext('2d');
    shape.draw(c, w / 2, h * 0.47, Math.min(w, h) * 0.6, '#f00');
    var data = c.getImageData(0, 0, off.width, off.height).data;
    var pts = [];
    for (var y = 0; y < off.height; y += 2) {
      for (var x = 0; x < off.width; x += 2) {
        var i = (y * off.width + x) * 4;
        if (data[i + 3] > 140) pts.push({ x: x, y: y, accent: data[i + 1] < 120 });
      }
    }
    for (var k = pts.length - 1; k > 0; k--) { var j = (Math.random() * (k + 1)) | 0; var t = pts[k]; pts[k] = pts[j]; pts[j] = t; }
    var out = [];
    for (var n = 0; n < count; n++) {
      var p = pts[n % pts.length];
      out.push({ x: p.x + (Math.random() - 0.5) * 1.6, y: p.y + (Math.random() - 0.5) * 1.6, accent: p.accent });
    }
    return out;
  }

  function initHeroParticles() {
    var canvas = $('#heroParticles');
    if (!canvas) return;
    var label = $('#shapeLabel'), index = $('#shapeIndex');
    var ctx, w, h, targets = [], particles = [], free = [];
    var shapeAt = 0, running = false, raf = 0, lastSwitch = 0;
    var mouse = { x: -9999, y: -9999 };
    var HOLD = 5200;

    function build() {
      var f = fitCanvas(canvas); ctx = f.ctx; w = f.w; h = f.h;
      var count = Math.round(clamp(w * h / 150, 950, 2300));
      targets = SHAPES.map(function (sh) { return sampleShape(sh, w, h, count); });
      if (particles.length !== count) {
        particles = [];
        for (var i = 0; i < count; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, tx: 0, ty: 0, mix: 0, accent: false,
            s: Math.random() < 0.12 ? 1.9 : 1.15, a: 0.45 + Math.random() * 0.55, seed: Math.random() * 1000 });
        }
        free = [];
        for (var f2 = 0, amb = Math.round(count * 0.14); f2 < amb; f2++) {
          free.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.14, a: 0.12 + Math.random() * 0.3, s: Math.random() < 0.2 ? 1.6 : 1 });
        }
      }
      assign(shapeAt, false);
      if (reduceMotion) particles.forEach(function (p) { p.x = p.tx; p.y = p.ty; p.mix = p.accent ? 1 : 0; });
      draw();
    }

    function assign(k, kick) {
      var t = targets[k];
      particles.forEach(function (p, i) {
        p.tx = t[i].x; p.ty = t[i].y; p.accent = t[i].accent;
        if (kick) { p.vx += (Math.random() - 0.5) * 6; p.vy += (Math.random() - 0.5) * 6; }
      });
      if (!label) return;
      label.style.opacity = 0;
      setTimeout(function () {
        label.textContent = SHAPES[k].label;
        index.textContent = String(k + 1).padStart(2, '0');
        label.style.opacity = 1;
      }, kick ? 260 : 0);
    }

    function step(now) {
      if (now - lastSwitch > HOLD) { lastSwitch = now; shapeAt = (shapeAt + 1) % SHAPES.length; assign(shapeAt, true); }
      var t = now * 0.001;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var tx = p.tx + Math.sin(t * 1.3 + p.seed) * 1.4, ty = p.ty + Math.cos(t * 1.1 + p.seed) * 1.4;
        p.vx += (tx - p.x) * 0.014; p.vy += (ty - p.y) * 0.014;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 6400) { var f = (1 - d2 / 6400) * 2.2, d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx *= 0.86; p.vy *= 0.86;
        p.x += p.vx; p.y += p.vy;
        p.mix += ((p.accent ? 1 : 0) - p.mix) * 0.06;
      }
      for (var j = 0; j < free.length; j++) {
        var q = free[j];
        q.x += q.vx; q.y += q.vy;
        if (q.y < -4) { q.y = h + 4; q.x = Math.random() * w; }
        if (q.x < -4) q.x = w + 4; else if (q.x > w + 4) q.x = -4;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var accentBoost = palette.dark ? 0.7 : 0.3;
      ctx.fillStyle = 'rgb(' + palette['p-base'] + ')';
      for (var j = 0; j < free.length; j++) { var q = free[j]; ctx.globalAlpha = q.a; ctx.fillRect(q.x, q.y, q.s, q.s); }
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.mix < 0.98) { ctx.globalAlpha = p.a * (1 - p.mix); ctx.fillRect(p.x, p.y, p.s, p.s); }
      }
      ctx.fillStyle = 'rgb(' + palette['p-accent'] + ')';
      for (var k = 0; k < particles.length; k++) {
        var r = particles[k];
        if (r.mix > 0.02) { ctx.globalAlpha = Math.min(1, r.a * r.mix * 1.25); ctx.fillRect(r.x, r.y, r.s + accentBoost, r.s + accentBoost); }
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) { step(now); draw(); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduceMotion) return; running = true; lastSwitch = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    build();
    whenVisible(canvas, function (vis) { vis ? start() : stop(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    document.addEventListener('qontrol:theme', function () { if (!running) draw(); });
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (finePointer) {
      canvas.parentElement.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    }
  }

  /* ---------- PC: la pantalla escala para caber en cualquier ancho ---------- */
  function initMonitor() {
    var screen = $('#monitorScreen'), ui = $('#monitorUi'), stage = $('.stage'), monitor = $('#monitor');
    if (!screen || !ui) return;
    var DESIGN_W = 1120;
    function fit() {
      var cs = getComputedStyle(screen);
      var inner = screen.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      screen.style.setProperty('--ui-s', (inner / DESIGN_W).toFixed(4));
      screen.style.setProperty('--ui-h', ui.offsetHeight + 'px');
    }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(screen);
    else window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    // Se endereza al entrar en pantalla (solo escritorio)
    if (reduceMotion) return;
    var desktop = window.matchMedia('(min-width: 861px)');
    var ticking = false;
    function update() {
      ticking = false;
      if (!desktop.matches) { monitor.style.removeProperty('--tilt'); monitor.style.removeProperty('--lift'); return; }
      var r = stage.getBoundingClientRect(), vh = window.innerHeight;
      var e = 1 - Math.pow(1 - clamp((vh - r.top) / (vh * 0.9), 0, 1), 3);
      monitor.style.setProperty('--tilt', (16 * (1 - e)).toFixed(2) + 'deg');
      monitor.style.setProperty('--lift', (60 * (1 - e)).toFixed(1) + 'px');
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Pestañas por área ---------- */
  function initTabs() {
    var list = $('.tabs');
    if (!list) return;
    var tabs = $$('[role="tab"]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var current = 0, visible = false, hovering = false;

    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        panels[k].classList.toggle('is-active', on);
      });
      var bar = $('.tabs__bar', tabs[current]);
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      if (focus) tabs[current].focus();
      if (tabs[current].scrollIntoView && list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tabs[current].offsetLeft - 20, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    function syncPause() { list.classList.toggle('is-paused', !visible || hovering); }

    if (reduceMotion) list.classList.add('is-static');
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      $('.tabs__bar', t).addEventListener('animationend', function () { if (!reduceMotion) select(current + 1); });
    });
    list.addEventListener('keydown', function (e) {
      var map = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
      if (e.key in map) { e.preventDefault(); select(map[e.key], true); }
    });
    [list, $('.areas__panels')].forEach(function (el) {
      el.addEventListener('pointerenter', function () { hovering = true; syncPause(); });
      el.addEventListener('pointerleave', function () { hovering = false; syncPause(); });
      el.addEventListener('focusin', function () { hovering = true; syncPause(); });
      el.addEventListener('focusout', function () { hovering = false; syncPause(); });
    });
    whenVisible($('#areas'), function (vis) { visible = vis; syncPause(); });
    syncPause();
    // Tarjetas de producto y enlaces del pie abren su pestaña
    $$('[data-open-tab]').forEach(function (a) {
      a.addEventListener('click', function () { select(+a.dataset.openTab); });
    });
  }

  /* ---------- Cifras que se turnan ---------- */
  function initStats() {
    var row = $('#statsRow');
    if (!row) return;
    var stats = $$('.stat', row), i = 0, timer = 0, visible = false;
    function set(k) {
      i = k;
      stats.forEach(function (s, n) { s.classList.toggle('is-active', n === k); });
      row.style.setProperty('--seg', k);
    }
    function play() { clearInterval(timer); if (!reduceMotion && visible) timer = setInterval(function () { set((i + 1) % stats.length); }, 3200); }
    stats.forEach(function (s, n) {
      s.addEventListener('pointerenter', function () { set(n); clearInterval(timer); });
      s.addEventListener('pointerleave', play);
    });
    whenVisible(row, function (vis) {
      visible = vis; play();
      if (vis) $$('[data-count]', row).forEach(function (el) { countUp(el, 1800); });
    });
  }

  /* ---------- Red conectada: la información viaja sin fin entre módulos ---------- */
  // [lat, lon] en grados. Separados al menos ~30° para que no se encimen.
  var NODES = {
    'Recepción': [5, 0], 'Citas': [40, -30], 'Consultas': [-35, -35], 'Historia Clínica': [10, -62],
    'Internamiento': [42, -95], 'Enfermería': [-12, -100], 'Quirófano': [-55, -75], 'Rayos X': [18, -138],
    'Ultrasonidos': [-38, -145], 'Cocina': [66, -130], 'Laboratorio': [35, 35], 'Synapse': [58, 82],
    'Resultados': [0, 72], 'Portal del Paciente': [-42, 42], 'Farmacia': [-8, 140], 'Inventario': [-50, 112],
    'Caja': [25, 112], 'Facturación FEL': [52, 155], 'Reportes': [-28, 178]
  };
  // [desde, hacia, qué pasa, peso]. Solo conexiones que el sistema hace de verdad.
  var HOPS = [
    ['Recepción', 'Internamiento', 'El paciente se admite a internamiento desde recepción.', 3],
    ['Recepción', 'Laboratorio', 'La orden llega al laboratorio sin volver a digitarse.', 2],
    ['Recepción', 'Citas', 'Se agenda la cita del paciente.', 1],
    ['Citas', 'Consultas', 'La cita se convierte en consulta cuando el paciente llega.', 1],
    ['Consultas', 'Internamiento', 'El médico interna al paciente desde la consulta.', 2],
    ['Consultas', 'Historia Clínica', 'La consulta queda en la historia clínica.', 1],
    ['Consultas', 'Farmacia', 'La receta llega a la cola de farmacia.', 1],
    ['Consultas', 'Laboratorio', 'El médico solicita exámenes de laboratorio.', 1],
    ['Historia Clínica', 'Consultas', 'El médico revisa los antecedentes antes de atender.', 1],
    ['Internamiento', 'Enfermería', 'Enfermería recibe al paciente en su cama.', 3],
    ['Internamiento', 'Rayos X', 'Se pide una placa y queda cargada a la cuenta del paciente.', 1],
    ['Internamiento', 'Ultrasonidos', 'Se pide un ultrasonido y queda en la cuenta del internamiento.', 1],
    ['Internamiento', 'Quirófano', 'Se programa la cirugía del paciente.', 1],
    ['Internamiento', 'Cocina', 'La dieta se asigna desde el internamiento y cocina la ve por habitación.', 1],
    ['Internamiento', 'Caja', 'Al dar de alta, la cuenta ya trae los cargos del internamiento.', 1],
    ['Enfermería', 'Laboratorio', 'Enfermería pide exámenes para el paciente internado.', 2],
    ['Enfermería', 'Inventario', 'El medicamento administrado se descuenta de la bodega.', 2],
    ['Quirófano', 'Internamiento', 'Después de la cirugía, el paciente vuelve a su cama.', 1],
    ['Rayos X', 'Internamiento', 'El estudio queda cargado a la cuenta del internamiento.', 1],
    ['Ultrasonidos', 'Internamiento', 'El estudio queda cargado a la cuenta del internamiento.', 1],
    ['Cocina', 'Internamiento', 'Cada habitación recibe la dieta indicada.', 1],
    ['Laboratorio', 'Synapse', 'La muestra entra al analizador conectado.', 3],
    ['Laboratorio', 'Caja', 'La orden se cobra en caja.', 1],
    ['Synapse', 'Resultados', 'El equipo envía el resultado por ASTM o HL7.', 1],
    ['Resultados', 'Internamiento', 'El médico tratante ve el resultado del paciente internado.', 2],
    ['Resultados', 'Portal del Paciente', 'El paciente consulta su resultado validado en su portal.', 1],
    ['Resultados', 'Historia Clínica', 'El resultado queda en la historia clínica.', 1],
    ['Portal del Paciente', 'Recepción', 'Menos llamadas a recepción preguntando por resultados.', 1],
    ['Farmacia', 'Inventario', 'La venta descuenta el stock de la bodega.', 1],
    ['Farmacia', 'Caja', 'La venta se cobra en caja.', 1],
    ['Inventario', 'Reportes', 'Existencias y vencimientos a la vista de gerencia.', 1],
    ['Caja', 'Facturación FEL', 'La factura FEL sale del mismo cobro.', 2],
    ['Caja', 'Reportes', 'El corte de caja queda en los reportes.', 1],
    ['Facturación FEL', 'Reportes', 'Ingresos y facturas, juntos en los reportes.', 1],
    ['Reportes', 'Recepción', 'Y la operación sigue: llega el siguiente paciente.', 1]
  ];

  function initNetwork() {
    var canvas = $('#networkCanvas');
    if (!canvas) return;
    var box = $('#hop'), routeEl = $('#hopRoute'), textEl = $('#hopText');
    var ctx, w, h, dots = [], running = false, raf = 0, last = 0, clock = 0;
    var rotY = 0, tilt = 0.26, tiltTarget = 0.26;
    var TRAVEL = 1600, DWELL = 650, FADE = 6500, SEGS = 36;
    var nodes = {}, out = {}, trails = [], walkers = [], visible = false;

    Object.keys(NODES).forEach(function (name) {
      var lat = NODES[name][0] * Math.PI / 180, lon = NODES[name][1] * Math.PI / 180;
      nodes[name] = { name: name, lon: lon, lit: 0, v: [Math.cos(lat) * Math.sin(lon), -Math.sin(lat), -Math.cos(lat) * Math.cos(lon)] };
    });
    HOPS.forEach(function (hp) { (out[hp[0]] = out[hp[0]] || []).push(hp); });

    function slerp(a, b, t) {
      var d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d), so = Math.sin(om) || 1;
      var ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so;
      return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
    }
    function angleTo(from, to) { var d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

    // Proyección: se calcula seno/coseno una vez por cuadro
    var P = { cy: 1, sy: 0, cx: 1, sx: 0, R: 100, ox: 0, oy: 0 };
    function project(v, lift, o) {
      var x = v[0] * lift, y = v[1] * lift, z = v[2] * lift;
      var x1 = x * P.cy - z * P.sy, z1 = x * P.sy + z * P.cy;
      var y2 = y * P.cx - z1 * P.sx, z2 = y * P.sx + z1 * P.cx;
      var s = 3.2 / (3.2 + z2);
      o.x = P.ox + x1 * P.R * s; o.y = P.oy + y2 * P.R * s; o.z = z2; o.s = s;
      return o;
    }
    // Puntos de arco reutilizables (sin crear objetos en cada cuadro)
    var arcBuf = [];
    for (var ab = 0; ab <= SEGS; ab++) arcBuf.push({ x: 0, y: 0, z: 0, s: 1 });
    function arc(a, b, upto) {
      var n = Math.max(1, Math.round(upto * SEGS));
      for (var i = 0; i <= n; i++) { var t = i / SEGS; project(slerp(a, b, Math.min(t, upto)), 1 + Math.sin(Math.PI * Math.min(t, upto)) * 0.1, arcBuf[i]); }
      return n;
    }
    function strokeArc(a, b, upto, alpha, width) {
      var n = arc(a, b, upto);
      var front = new Path2D(), back = new Path2D(), inF = false, inB = false;
      for (var i = 1; i <= n; i++) {
        var p0 = arcBuf[i - 1], p1 = arcBuf[i], isFront = (p0.z + p1.z) / 2 < 0.25;
        var path = isFront ? front : back;
        if (isFront ? !inF : !inB) { path.moveTo(p0.x, p0.y); }
        path.lineTo(p1.x, p1.y);
        inF = isFront; inB = !isFront;
      }
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha; ctx.stroke(front);
      ctx.globalAlpha = alpha * 0.22; ctx.stroke(back);
      return arcBuf[n];
    }

    function pickHop(wk) {
      var options = out[wk.at] || HOPS;
      var pool = options.filter(function (hp) { return hp[1] !== wk.prev; });
      if (!pool.length) pool = options;
      var total = 0; pool.forEach(function (hp) { total += hp[3] || 1; });
      var r = Math.random() * total;
      for (var i = 0; i < pool.length; i++) { r -= pool[i][3] || 1; if (r <= 0) return pool[i]; }
      return pool[pool.length - 1];
    }
    function announce(hp) {
      if (!box) return;
      box.classList.add('is-swapping');
      setTimeout(function () {
        routeEl.innerHTML = '<span>' + hp[0] + '</span><i aria-hidden="true">→</i><span>' + hp[1] + '</span>';
        textEl.textContent = hp[2];
        box.classList.remove('is-swapping');
      }, 260);
    }
    function launch(wk) {
      wk.hop = pickHop(wk); wk.phase = 'travel'; wk.t0 = clock;
      if (wk.featured) announce(wk.hop);
    }

    walkers = [
      { at: 'Recepción', prev: null, featured: true, delay: 0 },
      { at: 'Internamiento', prev: null, featured: false, delay: 900 },
      { at: 'Farmacia', prev: null, featured: false, delay: 1800 }
    ];

    function build() {
      var f = fitCanvas(canvas); ctx = f.ctx; w = f.w; h = f.h;
      var n = w < 600 ? 650 : 1100;
      dots = [];
      var golden = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
        dots.push([Math.cos(th) * r, y, Math.sin(th) * r]);
      }
      draw();
    }

    function step(dt) {
      clock += dt;
      walkers.forEach(function (wk) {
        if (!wk.hop) { if (clock >= wk.delay) launch(wk); return; }
        var el = clock - wk.t0;
        if (wk.phase === 'travel' && el >= TRAVEL) {
          trails.push({ a: wk.hop[0], b: wk.hop[1], born: clock, featured: wk.featured });
          nodes[wk.hop[1]].lit = 1;
          wk.prev = wk.at; wk.at = wk.hop[1]; wk.phase = 'dwell'; wk.t0 = clock;
        } else if (wk.phase === 'dwell' && el >= DWELL) {
          launch(wk);
        }
      });
      for (var i = trails.length - 1; i >= 0; i--) if (clock - trails[i].born > FADE) trails.splice(i, 1);
      var decay = Math.exp(-dt / 900);
      Object.keys(nodes).forEach(function (k) { nodes[k].lit *= decay; });

      // El globo sigue con suavidad hacia donde va la información, sin saltos
      var lead = walkers[0], target = lead.hop ? nodes[lead.phase === 'travel' ? lead.hop[1] : lead.at] : nodes['Recepción'];
      rotY += angleTo(rotY, -target.lon) * (1 - Math.exp(-dt / 1700)) + dt * 0.00002;
      tilt += (tiltTarget - tilt) * (1 - Math.exp(-dt / 400));
    }

    var tmp = { x: 0, y: 0, z: 0, s: 1 };
    function draw() {
      ctx.clearRect(0, 0, w, h);
      // Tamaño que garantiza que esfera, arcos (hasta 1.18 R con la perspectiva),
      // el brillo del pulso y los nombres quepan siempre dentro del lienzo.
      P.R = Math.max(60, Math.min((w / 2 - 24) / 1.18, (h / 2 - 26) / 1.18)); P.ox = w / 2; P.oy = h * 0.5;
      P.cy = Math.cos(rotY); P.sy = Math.sin(rotY); P.cx = Math.cos(tilt); P.sx = Math.sin(tilt);
      var ink = 'rgb(' + palette['p-ink'] + ')', accent = 'rgb(' + palette['p-node'] + ')';

      // Esfera de puntos
      ctx.fillStyle = ink;
      for (var i = 0; i < dots.length; i++) {
        var p = project(dots[i], 1, tmp), depth = (1 - p.z) / 2;
        ctx.globalAlpha = 0.05 + depth * 0.3;
        var sz = (0.8 + depth * 1.1) * p.s;
        ctx.fillRect(p.x, p.y, sz, sz);
      }

      // Rastros que se desvanecen poco a poco (nunca desaparecen de golpe)
      ctx.strokeStyle = accent; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      trails.forEach(function (tr) {
        var age = (clock - tr.born) / FADE, a = Math.pow(1 - age, 1.6) * (tr.featured ? 0.75 : 0.4);
        if (a > 0.01) strokeArc(nodes[tr.a].v, nodes[tr.b].v, 1, a, tr.featured ? 2 : 1.5);
      });

      // Pulsos en viaje
      walkers.forEach(function (wk) {
        if (!wk.hop || wk.phase !== 'travel') return;
        var t = ease(clamp((clock - wk.t0) / TRAVEL, 0, 1));
        var head = strokeArc(nodes[wk.hop[0]].v, nodes[wk.hop[1]].v, Math.max(t, 0.001), wk.featured ? 0.95 : 0.55, wk.featured ? 2.2 : 1.6);
        var front = clamp((0.35 - head.z) / 0.7, 0.2, 1);
        var g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, wk.featured ? 14 : 9);
        g.addColorStop(0, accent); g.addColorStop(1, 'rgba(' + palette['p-node'] + ',0)');
        ctx.globalAlpha = front * (wk.featured ? 0.95 : 0.6);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(head.x, head.y, wk.featured ? 14 : 9, 0, Math.PI * 2); ctx.fill();
      });

      // Nodos con su nombre
      var lead = walkers[0], dest = lead.hop ? (lead.phase === 'travel' ? lead.hop[1] : lead.at) : 'Recepción';
      var from = lead.hop ? lead.hop[0] : null;
      ctx.font = '500 13px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 5;
      var halo = 'rgb(' + palette['p-bg'] + ')';
      var pulse = Math.sin(clock * 0.004);
      // Puntos de cada nodo; los nombres se dibujan después sin encimarse
      var labels = [];
      Object.keys(nodes).forEach(function (name) {
        var n = nodes[name], p2 = project(n.v, 1, tmp);
        var vis = clamp((0.3 - p2.z) / 0.6, 0, 1);
        if (vis <= 0.02) return;
        var key = name === dest || name === from;
        var r = (3.2 + n.lit * 2.5 + (name === dest ? 1.5 + pulse * 0.8 : 0)) * p2.s;
        ctx.globalAlpha = vis * (key || n.lit > 0.1 ? 1 : 0.5);
        ctx.fillStyle = key || n.lit > 0.05 ? accent : ink;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, r, 0, Math.PI * 2); ctx.fill();
        if (name === dest) {
          ctx.globalAlpha = vis * 0.35; ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p2.x, p2.y, r + 7 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
        }
        if (key || vis > 0.3) labels.push({ name: name, x: p2.x, y: p2.y, vis: vis, key: key, rank: (key ? 2 : 0) + vis + n.lit });
      });
      labels.sort(function (a, b) { return b.rank - a.rank; });
      var placed = [];
      ctx.lineWidth = 5;
      labels.forEach(function (lb) {
        var tw = ctx.measureText(lb.name).width, right = lb.x >= P.ox - 10;
        if (right && lb.x + 12 + tw > w - 12) right = false;
        if (!right && lb.x - 12 - tw < 12) right = true;
        var lx = lb.x + (right ? 12 : -12), x0 = right ? lx : lx - tw;
        var box = { l: x0 - 4, r: x0 + tw + 4, t: lb.y - 10, b: lb.y + 10 };
        for (var i = 0; i < placed.length; i++) {
          var q = placed[i];
          if (box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t) { if (!lb.key) return; }
        }
        placed.push(box);
        ctx.textAlign = right ? 'left' : 'right';
        ctx.globalAlpha = lb.vis * 0.9; ctx.strokeStyle = halo; ctx.strokeText(lb.name, lx, lb.y);
        ctx.globalAlpha = lb.vis * (lb.key ? 1 : 0.6); ctx.fillStyle = ink; ctx.fillText(lb.name, lx, lb.y);
      });
      ctx.globalAlpha = 1;
    }

    function tick(now) {
      var dt = last ? Math.min(now - last, 34) : 16; last = now;
      step(dt); draw();
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running || reduceMotion) return; running = true; last = 0; raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    rotY = -nodes['Recepción'].lon;
    build();
    if (reduceMotion) {
      // Imagen fija: un recorrido completo, sin animación
      [['Recepción', 'Internamiento'], ['Internamiento', 'Enfermería'], ['Enfermería', 'Laboratorio'], ['Laboratorio', 'Synapse']].forEach(function (pr) {
        trails.push({ a: pr[0], b: pr[1], born: clock, featured: true });
      });
      walkers[0].at = 'Synapse';
      draw();
    }
    whenVisible(canvas, function (vis) { visible = vis; vis ? start() : stop(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
    document.addEventListener('qontrol:theme', function () { if (!running) draw(); });
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (finePointer) {
      canvas.parentElement.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        tiltTarget = 0.26 + ((e.clientY - r.top) / r.height - 0.5) * 0.4;
      });
      canvas.parentElement.addEventListener('pointerleave', function () { tiltTarget = 0.26; });
    }
  }

  /* ---------- Módulos (los 36 del sistema, hospital primero, por solución) ---------- */
  // Último campo: soluciones que incluyen el módulo, según la matriz de modos de
  // operación de la app (src/lib/operationMode.ts). Los módulos hospitalarios
  // (internamiento, enfermería, quirófano, imagen, cocina) se venden en QontrolHosp.
  var MODULES = [
    ['hos', 'Internamiento', 'Encamamiento y censo.', 'Gestiona ingresos, camas, censo y la cuenta de cada paciente internado, con médico tratante asignado. Laboratorio, Rayos X y ultrasonidos se cargan directo a su cuenta.', ['hosp']],
    ['hos', 'Enfermería y Emergencia', 'Pantallas propias para enfermería.', 'Enfermería trabaja con sus propias pantallas: emergencia, encamamiento, órdenes de laboratorio, insumos de su área y medicamentos administrados, que se descuentan de la bodega.', ['hosp']],
    ['hos', 'Quirófano', 'Cirugías organizadas.', 'Organiza las cirugías y sus paquetes quirúrgicos dentro de la misma plataforma, con el personal de quirófano y sus permisos.', ['hosp']],
    ['hos', 'Rayos X', 'Solicitudes de imagen.', 'Solicitudes de Rayos X con su catálogo y su cobro, o cargadas directamente a la cuenta de un paciente internado.', ['hosp']],
    ['hos', 'Ultrasonidos', 'Estudios de ultrasonido.', 'Solicitudes de ultrasonido con su catálogo y su cobro, o cargadas directamente a la cuenta de un paciente internado.', ['hosp']],
    ['hos', 'Cocina', 'Dietas de pacientes internados.', 'Muestra las dietas activas de los pacientes internados, ordenadas por habitación. Las dietas se asignan desde el internamiento.', ['hosp']],
    ['lab', 'Órdenes de Trabajo', 'Proceso controlado de principio a fin.', 'Controla todo el proceso desde que entra el paciente: exámenes solicitados, pagos, muestra, estado de proceso y entrega final. Todo queda trazable.', ['hosp', 'lab']],
    ['lab', 'Resultados', 'Captura, validación y PDFs.', 'Captura, valida y entrega resultados con formato profesional, dentro de la misma orden de trabajo. Maneja valores de referencia y genera PDFs listos para el paciente o el médico.', ['hosp', 'lab']],
    ['lab', 'Catálogo de Exámenes', 'Exámenes y precios claros.', 'Mantén ordenados tus exámenes, perfiles, precios y áreas. Facilita cotizar, crear órdenes y estandarizar la forma en que trabaja el laboratorio.', ['hosp', 'lab']],
    ['lab', 'Synapse', 'Equipos conectados.', 'Conecta equipos de laboratorio para reducir digitación manual. Recibe resultados de analizadores mediante ASTM, HL7 o archivos planos, según el equipo.', ['hosp', 'lab']],
    ['lab', 'Control de Calidad', 'Controles internos y trazabilidad.', 'Gestión de calidad del laboratorio: controles internos de equipos, temperatura y ambiente, lotes de material de control, estadística acumulada, revisión y trazabilidad.', ['hosp', 'lab']],
    ['lab', 'Bitácora Diaria', 'Evidencia diaria del laboratorio.', 'Registra controles de inicio de turno, temperaturas, control de calidad y observaciones. Ayuda a mantener evidencia interna y orden en la operación.', ['hosp', 'lab']],
    ['lab', 'Laboratorios Referentes', 'Referencias y comisiones.', 'Registra los laboratorios y hospitales que te refieren exámenes, con su comisión. Cada laboratorio referente puede consultar sus comisiones desde su propio portal.', ['hosp', 'lab', 'clinic']],
    ['lab', 'Logística', 'Envíos de muestras controlados.', 'Registra los envíos a laboratorios de referencia, con los insumos del inventario que viajan en cada envío y sus devoluciones.', ['hosp', 'lab', 'clinic', 'farm']],
    ['cli', 'Consultas', 'Atención médica documentada.', 'Gestiona consultas clínicas, signos vitales, diagnósticos, recetas, constancias y seguimiento del paciente. Ideal para clínicas, médicos independientes y sanatorios.', ['hosp', 'clinic']],
    ['cli', 'Historia Clínica', 'El expediente clínico completo.', 'Reúne la historia clínica del paciente para que el médico tenga antecedentes, consultas y seguimiento en un solo lugar.', ['hosp', 'clinic']],
    ['cli', 'Catálogo de Servicios', 'Servicios clínicos y precios.', 'Mantén ordenados los servicios clínicos y sus precios para cotizar, cobrar y cargarlos a la cuenta del paciente.', ['hosp', 'clinic']],
    ['cli', 'Portal del Paciente', 'Resultados e historial en línea.', 'Permite que el paciente consulte su historial, órdenes y resultados desde un portal propio. Reduce llamadas repetitivas y mejora la entrega.', ['hosp', 'lab', 'clinic']],
    ['far', 'Farmacia y Punto de Venta', 'Ventas rápidas y caja.', 'Opera una farmacia completa con punto de venta, ventas, caja propia, clientes y reportes. Funciona como sistema de farmacia independiente o conectada con la clínica.', ['hosp', 'farm']],
    ['far', 'Recetas', 'De la consulta a la farmacia.', 'Las recetas que emite el médico llegan a una cola de farmacia para despacharlas sin volver a escribirlas.', ['hosp', 'farm']],
    ['far', 'Compras y Proveedores', 'Abastecimiento ordenado.', 'Catálogo de productos, proveedores, compras, entradas y precios de la farmacia en un mismo flujo.', ['hosp', 'farm']],
    ['far', 'Traslados y Bodegas', 'Stock donde se necesita.', 'Lleva el inventario de farmacia por bodega y mueve existencias entre bodegas con registro de cada traslado.', ['hosp', 'farm']],
    ['op', 'Dashboard', 'Vista general de la operación.', 'Ten a la vista lo más importante: órdenes del día, pendientes, ingresos, farmacia, clínica y actividad general. Ideal para tomar decisiones rápidas sin revisar hojas o reportes separados.', ['hosp', 'lab', 'clinic', 'farm']],
    ['op', 'Pacientes', 'Expedientes ordenados.', 'Centraliza la información de cada paciente en un expediente ordenado. Evita duplicar datos y permite consultar historial, órdenes anteriores y seguimiento en segundos.', ['hosp', 'lab', 'clinic', 'farm']],
    ['op', 'Citas y Agenda', 'Atención mejor organizada.', 'Organiza la atención diaria con horarios, estados y seguimiento. Ayuda a evitar confusiones en recepción y convierte una cita en orden de trabajo cuando el paciente llega.', ['hosp', 'lab', 'clinic']],
    ['op', 'Cotizaciones', 'Propuestas más profesionales.', 'Crea propuestas profesionales para pacientes, empresas o instituciones. Cuando el cliente acepta, puedes convertir la cotización en una orden.', ['hosp', 'lab', 'clinic']],
    ['op', 'Caja y Cobros', 'Control real de ingresos.', 'Lleva control de cobros, saldos, pagos parciales y cortes de caja. Ayuda a saber qué está pagado, qué está pendiente y cuánto ingresó realmente. Puede operar como caja separada de la recepción.', ['hosp', 'lab', 'clinic']],
    ['op', 'Inventario y Bodegas', 'Evita faltantes y pérdidas.', 'Controla insumos, reactivos, lotes, bodegas por sucursal y vencimientos. Evita quedarte sin materiales clave y ayuda a reducir pérdidas por productos vencidos o mal registrados.', ['hosp', 'lab', 'clinic']],
    ['op', 'Reportes', 'Decisiones con datos.', 'Consulta información clave sobre ingresos, órdenes, pacientes, médicos, exámenes, farmacia, inventario y actividad clínica. Ideal para administración y gerencia.', ['hosp', 'lab', 'clinic']],
    ['adm', 'Facturación FEL', 'Facturas desde el cobro.', 'Emite facturas electrónicas FEL desde los cobros. Administración gestiona la facturación y caja puede emitir los cobros que quedaron pendientes de facturar.', ['hosp', 'lab', 'clinic', 'farm']],
    ['adm', 'Contabilidad', 'Cuentas bancarias y movimientos.', 'Cuentas bancarias, saldos y movimientos. Las transferencias cobradas llegan a la cuenta que elijas como predeterminada.', ['hosp', 'lab', 'clinic']],
    ['adm', 'Médicos y Comisiones', 'Referencias bajo control.', 'Gestiona médicos referentes, órdenes enviadas y comisiones. Cada médico puede consultar sus pacientes, órdenes y comisiones desde el Portal Médico.', ['hosp', 'lab', 'clinic']],
    ['adm', 'Portal Médico', 'Comunicación más ágil.', 'Permite que médicos referentes consulten sus pacientes, órdenes y comisiones sin llamar ni saturar al equipo.', ['hosp', 'lab', 'clinic']],
    ['adm', 'Multi-sucursal', 'Varias sedes en orden.', 'Opera varias sedes desde una misma plataforma. Usuarios, bodegas e información organizados por sucursal, con una visión general de toda la operación.', ['hosp', 'lab', 'clinic', 'farm']],
    ['adm', 'Configuración y Permisos', 'Sistema adaptado a tu operación.', 'Adapta el sistema a tu institución: datos generales, usuarios, permisos por rol o por persona, formatos de PDF, menú y módulos activos.', ['hosp', 'lab', 'clinic', 'farm']],
    ['adm', 'Modos de Operación', 'Activa solo lo que necesitas.', 'QontroLab se adapta por módulos: solo laboratorio, solo clínica, laboratorio y clínica, solo farmacia, clínica con farmacia u operación completa.', ['hosp', 'lab', 'clinic', 'farm']]
  ];
  var AREAS = { hos: 'Hospital y sanatorio', lab: 'Laboratorio', cli: 'Clínica', far: 'Farmacia', op: 'Operación', adm: 'Administración' };
  var PRODUCTS = { hosp: ['Qontrol', 'Hosp'], lab: ['Qontro', 'Lab'], clinic: ['Qontrol', 'Clinic'], farm: ['Qontrol', 'Farm'] };
  var SHORT = { hosp: 'Hosp', lab: 'Lab', clinic: 'Clinic', farm: 'Farm' };

  var SYSTEMS = [
    { key: 'hosp', area: 'hos', for: 'Hospitales y sanatorios', lead: 'Lo propio de hospital y sanatorio' },
    { key: 'lab', area: 'lab', for: 'Laboratorios', lead: 'Lo propio del laboratorio' },
    { key: 'clinic', area: 'cli', for: 'Clínicas', lead: 'Lo propio de la clínica' },
    { key: 'farm', area: 'far', for: 'Farmacias', lead: 'Lo propio de la farmacia' }
  ];

  function initModules() {
    var box = $('#systems'), sheet = $('#moduleSheet');
    if (!box) return;
    var countEl = $('#moduleCount');
    if (countEl) countEl.textContent = MODULES.length;
    $$('.stat [data-count]').forEach(function (el) { if (el.dataset.count === '36') { el.dataset.count = MODULES.length; el.textContent = MODULES.length; } });
    var pw = function (k) { return PRODUCTS[k][0] + '<b>' + PRODUCTS[k][1] + '</b>'; };
    var name = function (k) { return PRODUCTS[k].join(''); };

    box.innerHTML = SYSTEMS.map(function (sys, si) {
      var inSys = MODULES.map(function (m, i) { return { m: m, i: i }; }).filter(function (x) { return x.m[4].indexOf(sys.key) > -1; });
      var own = inSys.filter(function (x) { return x.m[0] === sys.area; });
      var also = inSys.filter(function (x) { return x.m[0] !== sys.area; });
      var tiles = own.map(function (x) {
        return '<button type="button" class="tile" data-index="' + x.i + '"><strong>' + x.m[1] + '</strong>' +
          '<span class="tile__desc">' + x.m[2] + '</span><span class="arrow" aria-hidden="true">→</span></button>';
      }).join('');
      var alsoHtml = sys.key === 'hosp'
        ? '<div class="system__also"><span>Además incluye todo lo de</span><div class="system__chips">' +
            ['lab', 'clinic', 'farm'].map(function (k) { return '<a class="chip-link" href="#sys-' + k + '" data-open-system="' + k + '">' + name(k) + ' <span aria-hidden="true">→</span></a>'; }).join('') + '</div></div>'
        : '<div class="system__also"><span>También incluye</span><div class="system__chips">' +
            also.map(function (x) { return '<button type="button" class="chip-mod" data-index="' + x.i + '">' + x.m[1] + '</button>'; }).join('') + '</div></div>';
      return '<details class="system" id="sys-' + sys.key + '" data-system="' + sys.key + '">' +
        '<summary><span class="system__name"><small>' + sys.for + '</small><strong class="pw">' + pw(sys.key) + '</strong></span>' +
        '<span class="system__count">' + inSys.length + ' módulos</span><span class="system__chev" aria-hidden="true"></span></summary>' +
        '<div class="system__body"><p class="system__lead">' + sys.lead + '</p><div class="system__grid">' + tiles + '</div>' + alsoHtml + '</div></details>';
    }).join('');

    var all = $$('.system', box);
    var EASE = 'cubic-bezier(.22,1,.36,1)';

    // Apertura suave: el panel crece con fundido y las tarjetas aparecen en cascada.
    function animateOpen(d, done) {
      if (d.open) { if (done) done(); return; }
      d.open = true;
      var body = $('.system__body', d);
      if (reduceMotion || !body.animate) { if (done) done(); return; }
      var h = body.scrollHeight;
      body.style.overflow = 'hidden';
      var a = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 720, easing: EASE });
      a.onfinish = a.oncancel = function () { body.style.overflow = ''; if (done) done(); };
      $$('.tile, .chip-mod, .chip-link, .system__lead, .system__also > span', body).forEach(function (el, i) {
        el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 560, delay: 140 + i * 45, easing: EASE, fill: 'backwards' });
      });
    }
    function animateClose(d) {
      if (!d.open) return;
      var body = $('.system__body', d);
      if (reduceMotion || !body.animate) { d.open = false; return; }
      body.style.overflow = 'hidden';
      var a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 420, easing: EASE });
      a.onfinish = function () { d.open = false; body.style.overflow = ''; };
    }
    all.forEach(function (d) {
      $('summary', d).addEventListener('click', function (e) {
        e.preventDefault();
        d.dataset.touched = '1'; // la persona decidió: el scroll ya no lo toca
        d.open ? animateClose(d) : animateOpen(d);
      });
    });

    // Al bajar, los sistemas se abren de uno en uno y en orden: primero QontrolHosp, luego
    // QontroLab, QontrolClinic y QontrolFarm. El siguiente espera a que el anterior termine de
    // abrirse y a que su título llegue a la parte baja de la pantalla. Nunca se cierran solos,
    // así lo que estás leyendo no salta.
    var busy = false, ticking = false;
    function inZone(d) { var r = d.getBoundingClientRect(); return r.top < window.innerHeight * 0.72 && r.bottom > 0; }
    function advance() {
      ticking = false;
      if (busy) return;
      for (var i = 0; i < all.length; i++) {
        var d = all[i];
        if (d.dataset.touched) continue;
        if (inZone(d)) {
          d.dataset.touched = '1';
          busy = true;
          animateOpen(d, function () { busy = false; setTimeout(advance, 160); });
        }
        return;
      }
      window.removeEventListener('scroll', onScroll);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(advance); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    advance();

    function openSystem(k, scroll) {
      var t = $('#sys-' + k);
      if (!t) return;
      t.dataset.touched = '1';
      animateOpen(t);
      if (scroll) t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    box.addEventListener('click', function (e) {
      var link = e.target.closest('[data-open-system]');
      if (link) { e.preventDefault(); openSystem(link.dataset.openSystem, true); return; }
      var item = e.target.closest('[data-index]');
      if (!item || !sheet || typeof sheet.showModal !== 'function') return;
      var m = MODULES[+item.dataset.index];
      $('#sheetArea').textContent = AREAS[m[0]] + ' · ' + m[4].map(name).join(', ');
      $('#sheetTitle').textContent = m[1];
      $('#sheetText').textContent = m[3];
      sheet.showModal();
    });
    if (sheet) sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    // Botones "Ver módulos de…" de las pestañas abren su sistema
    $$('[data-filter-link]').forEach(function (a) {
      a.addEventListener('click', function () { var k = a.dataset.filterLink; if (PRODUCTS[k]) openSystem(k, false); });
    });
  }

  /* ---------- Calculadora: horas de digitación que se evitan ---------- */
  function initCalc() {
    var form = $('#calc');
    if (!form) return;
    var DAYS = 26;
    var el = {
      orders: $('#cOrders'), exams: $('#cExams'), minutes: $('#cMinutes'), share: $('#cShare'),
      oOrders: $('#oOrders'), oExams: $('#oExams'), oMinutes: $('#oMinutes'), oShare: $('#oShare'),
      hours: $('#rHours'), days: $('#rDays'), examsMonth: $('#rExams'), formula: $('#rFormula')
    };
    var shown = { hours: 0, days: 0, exams: 0 }, raf = 0;
    var fmt = function (v, dec) { return Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
    var num = function (v) { return String(+v).replace(/\.0$/, ''); };

    function paintFill(input) {
      var pct = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--fill', pct + '%');
    }
    function render(target) {
      var smart = function (v) { return v < 0.05 ? '0' : fmt(v, v < 10 ? 1 : 0); };
      el.hours.textContent = smart(target.hours);
      el.days.textContent = smart(target.days);
      el.examsMonth.textContent = fmt(target.exams, 0);
    }
    function update() {
      var orders = +el.orders.value, exams = +el.exams.value, minutes = +el.minutes.value, share = +el.share.value;
      el.oOrders.textContent = orders;
      el.oExams.textContent = num(exams);
      el.oMinutes.textContent = num(minutes) + ' min';
      el.oShare.textContent = share + '%';
      [el.orders, el.exams, el.minutes, el.share].forEach(paintFill);

      var examsDay = orders * exams * share / 100;
      var target = { hours: examsDay * minutes * DAYS / 60, exams: examsDay * DAYS };
      target.days = target.hours / 8;
      el.formula.textContent = orders + ' órdenes × ' + num(exams) + ' exámenes × ' + share + '% × ' + num(minutes) + ' min × ' + DAYS + ' días';

      cancelAnimationFrame(raf);
      if (reduceMotion) { shown = target; render(target); return; }
      var from = { hours: shown.hours, days: shown.days, exams: shown.exams }, start = performance.now();
      (function tick(now) {
        var t = clamp((now - start) / 420, 0, 1), e = 1 - Math.pow(1 - t, 3);
        shown = { hours: from.hours + (target.hours - from.hours) * e, days: from.days + (target.days - from.days) * e, exams: from.exams + (target.exams - from.exams) * e };
        render(shown);
        if (t < 1) raf = requestAnimationFrame(tick);
      })(start);
    }
    form.addEventListener('input', update);
    update();
  }

  /* ---------- Implementación: los pasos se encienden al bajar ---------- */
  function initImpl() {
    var list = $('#implSteps');
    if (!list) return;
    var items = $$('li', list);
    list.classList.add('is-live');
    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.6, reached = -1;
      items.forEach(function (li, i) { if (li.getBoundingClientRect().top < line) reached = i; });
      if (reduceMotion) reached = items.length - 1;
      items.forEach(function (li, i) { li.classList.toggle('is-on', i <= reached); });
      var r = list.getBoundingClientRect();
      var p = reduceMotion ? 1 : clamp((line - r.top) / r.height, 0, 1);
      list.style.setProperty('--p', p.toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Línea del flujo ---------- */
  function initFlow() {
    var steps = $('#flowSteps');
    if (!steps) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduceMotion ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25), 0, 1);
      steps.style.setProperty('--p', p.toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function boot() {
    initTheme();
    initAmbient();
    initNav();
    initReveal();
    initHeroParticles();
    initMonitor();
    initTabs();
    initStats();
    initNetwork();
    initModules();
    initCalc();
    initFlow();
    initImpl();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
