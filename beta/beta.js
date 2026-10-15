/* ============================================================
   Qontrolab · Landing beta editorial — interacciones
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

  /* ---------- Tema claro / oscuro (blanco y negro) ---------- */
  function initTheme() {
    var btn = $('#themeToggle');
    var meta = $('meta[name="theme-color"]');
    function apply(theme, save) {
      root.dataset.theme = theme;
      var dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      if (meta) meta.setAttribute('content', dark ? '#09090A' : '#F7F8FC');
      if (save) { try { localStorage.setItem('qontrolab-theme', theme); } catch (e) {} }
      readPalette();
      document.dispatchEvent(new CustomEvent('qontrolab:theme'));
    }
    apply(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
    btn.addEventListener('click', function () { apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true); });
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
    ['plataforma', 'beneficios', 'modulos', 'implementacion', 'preguntas'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
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

  /* ---------- Partículas del hero: Q → tubos → corazón → cápsula ---------- */
  var SHAPES = [
    { label: 'Qontrolab', draw: function (c, cx, cy, s, accent) {
        c.lineCap = 'round';
        c.lineWidth = s * 0.12;
        c.strokeStyle = '#fff';
        c.beginPath(); c.arc(cx - s * 0.03, cy - s * 0.04, s * 0.33, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = accent;
        c.beginPath(); c.moveTo(cx + s * 0.16, cy + s * 0.15); c.lineTo(cx + s * 0.4, cy + s * 0.39); c.stroke();
      } },
    { label: 'Laboratorio · muestras y resultados', draw: function (c, cx, cy, s, accent) {
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
    { label: 'Clínica · consultas y signos vitales', draw: function (c, cx, cy, s, accent) {
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
    { label: 'Farmacia · ventas, stock y recetas', draw: function (c, cx, cy, s, accent) {
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
    document.addEventListener('qontrolab:theme', function () { if (!running) draw(); });
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

  /* ---------- Red conectada: cada punto es un área ---------- */
  var NODES = {
    'Recepción': [12, 0], 'Laboratorio': [36, 58], 'Caja': [-16, 112], 'Reportes': [30, 168],
    'Clínica': [-28, -56], 'Farmacia': [18, -112], 'Inventario': [-38, -164], 'Internamiento': [42, -18]
  };
  var JOURNEYS = [
    { title: 'Una orden de laboratorio', path: ['Recepción', 'Laboratorio', 'Caja', 'Reportes'] },
    { title: 'Una consulta con receta', path: ['Recepción', 'Clínica', 'Farmacia', 'Inventario'] },
    { title: 'Un paciente internado', path: ['Clínica', 'Internamiento', 'Farmacia', 'Caja'] }
  ];

  function initNetwork() {
    var canvas = $('#networkCanvas');
    if (!canvas) return;
    var titleEl = $('#journeyTitle'), stepsEl = $('#journeySteps');
    var ctx, w, h, dots = [], running = false, raf = 0, last = 0;
    var rotY = 0, tilt = 0.28, tiltTarget = 0.28;
    var nodes = {};
    Object.keys(NODES).forEach(function (name) {
      var lat = NODES[name][0] * Math.PI / 180, lon = NODES[name][1] * Math.PI / 180;
      nodes[name] = { name: name, lon: lon, v: [Math.cos(lat) * Math.sin(lon), -Math.sin(lat), -Math.cos(lat) * Math.cos(lon)] };
    });

    // Estado del recorrido
    var j = 0, seg = 0, phase = 'travel', phaseStart = 0;
    var TRAVEL = 1700, HOLD = 900, REST = 1600;

    function renderSteps() {
      var jr = JOURNEYS[j];
      titleEl.textContent = jr.title;
      stepsEl.innerHTML = jr.path.map(function (n) { return '<li><span>' + n + '</span></li>'; }).join('');
      markSteps();
    }
    function markSteps() {
      var reached = phase === 'travel' ? seg : seg + 1;
      $$('li', stepsEl).forEach(function (li, k) {
        li.classList.toggle('is-on', k === reached);
        li.classList.toggle('is-done', k < reached);
      });
    }

    function build() {
      var f = fitCanvas(canvas); ctx = f.ctx; w = f.w; h = f.h;
      var n = w < 600 ? 700 : 1200;
      dots = [];
      var golden = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
        dots.push([Math.cos(th) * r, y, Math.sin(th) * r]);
      }
      render(performance.now(), 0);
    }

    function project(v, R, cx, cy, lift) {
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(tilt), sinX = Math.sin(tilt);
      var x = v[0] * lift, y = v[1] * lift, z = v[2] * lift;
      var x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
      var y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
      var fov = 3.2, s = fov / (fov + z2);
      return { x: cx + x1 * R * s, y: cy + y2 * R * s, z: z2, s: s };
    }
    function slerp(a, b, t) {
      var d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d), so = Math.sin(om) || 1;
      var ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so;
      return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
    }
    function angleTo(from, to) { var d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

    function arcPoints(a, b, R, cx, cy) {
      var pts = [];
      for (var i = 0; i <= 40; i++) { var t = i / 40; pts.push(project(slerp(a, b, t), R, cx, cy, 1 + Math.sin(Math.PI * t) * 0.14)); }
      return pts;
    }

    function render(now, progress) {
      ctx.clearRect(0, 0, w, h);
      var R = Math.min(w * 0.3, h * 0.38), cx = w / 2, cy = h * 0.5;
      var ink = palette['p-ink'], node = palette['p-node'];

      // Puntos de la esfera
      for (var i = 0; i < dots.length; i++) {
        var p = project(dots[i], R, cx, cy, 1);
        var depth = (1 - p.z) / 2;
        ctx.fillStyle = 'rgba(' + ink + ',' + (0.05 + depth * 0.32).toFixed(3) + ')';
        var sz = (0.8 + depth * 1.1) * p.s;
        ctx.fillRect(p.x, p.y, sz, sz);
      }

      var jr = JOURNEYS[j];
      // Recorrido: tramos ya hechos + tramo en curso
      ctx.lineCap = 'round';
      for (var k = 0; k < jr.path.length - 1; k++) {
        var done = k < seg || (k === seg && phase !== 'travel');
        var active = k === seg && phase === 'travel';
        if (!done && !active) continue;
        var pts = arcPoints(nodes[jr.path[k]].v, nodes[jr.path[k + 1]].v, R, cx, cy);
        var upto = active ? Math.max(1, Math.round(progress * 40)) : 40;
        ctx.lineWidth = 2;
        for (var q = 1; q <= upto; q++) {
          var a = pts[q - 1], b = pts[q];
          var front = clamp((0.35 - (a.z + b.z) / 2) / 0.7, 0.15, 1);
          ctx.strokeStyle = 'rgba(' + node + ',' + (front * (active ? 0.95 : 0.55)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        if (active) {
          var head = pts[upto];
          var g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
          g.addColorStop(0, 'rgba(' + node + ',.9)'); g.addColorStop(1, 'rgba(' + node + ',0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(head.x, head.y, 14, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Nodos (áreas) con su nombre
      var t = now * 0.001;
      var reached = phase === 'travel' ? seg : seg + 1;
      ctx.font = '500 13px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      Object.keys(nodes).forEach(function (name) {
        var n = nodes[name], p2 = project(n.v, R, cx, cy, 1);
        var vis = clamp((0.3 - p2.z) / 0.6, 0, 1);
        var idx = jr.path.indexOf(name);
        var isCurrent = idx === reached, inPath = idx > -1 && idx <= reached;
        var base = 0.25 + vis * 0.75;
        // anillo
        var r = (isCurrent ? 6 + Math.sin(t * 4) * 1.2 : 4) * p2.s;
        ctx.fillStyle = 'rgba(' + (inPath ? node : ink) + ',' + (base * (inPath ? 1 : 0.55)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p2.x, p2.y, r, 0, Math.PI * 2); ctx.fill();
        if (isCurrent) {
          ctx.strokeStyle = 'rgba(' + node + ',' + (0.35 * base).toFixed(3) + ')';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p2.x, p2.y, r + 7 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.stroke();
        }
        if (vis > 0.05) {
          var tw = ctx.measureText(name).width;
          var right = p2.x >= cx - 10;
          if (right && p2.x + 12 + tw > w - 4) right = false;
          if (!right && p2.x - 12 - tw < 4) right = true;
          var lx = p2.x + (right ? 12 : -12);
          ctx.textAlign = right ? 'left' : 'right';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 5;
          ctx.strokeStyle = 'rgba(' + palette['p-bg'] + ',' + (vis * 0.9).toFixed(3) + ')';
          ctx.strokeText(name, lx, p2.y);
          ctx.fillStyle = 'rgba(' + ink + ',' + (vis * (inPath ? 1 : 0.6)).toFixed(3) + ')';
          ctx.fillText(name, lx, p2.y);
        }
      });
    }

    function tick(now) {
      var dt = last ? Math.min(now - last, 50) : 16; last = now;
      var jr = JOURNEYS[j];
      var elapsed = now - phaseStart, progress = 0;
      if (phase === 'travel') {
        progress = clamp(elapsed / TRAVEL, 0, 1);
        progress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        if (elapsed >= TRAVEL) { phase = 'hold'; phaseStart = now; markSteps(); }
      } else if (phase === 'hold' && elapsed >= HOLD) {
        if (seg < jr.path.length - 2) { seg++; phase = 'travel'; phaseStart = now; markSteps(); }
        else { phase = 'rest'; phaseStart = now; }
      } else if (phase === 'rest' && elapsed >= REST) {
        j = (j + 1) % JOURNEYS.length; seg = 0; phase = 'travel'; phaseStart = now; renderSteps();
      }
      // El globo gira para mostrar el área hacia donde va la información
      var focus = nodes[jr.path[phase === 'travel' ? seg + 1 : Math.min(seg + 1, jr.path.length - 1)]];
      var k = 1 - Math.exp(-dt / 700);
      rotY += angleTo(rotY, -focus.lon) * k;
      tilt += (tiltTarget - tilt) * 0.05;
      render(now, progress);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running || reduceMotion) return; running = true; last = 0; phaseStart = performance.now(); raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    renderSteps();
    rotY = -nodes[JOURNEYS[0].path[0]].lon;
    build();
    if (reduceMotion) { seg = JOURNEYS[0].path.length - 2; phase = 'hold'; markSteps(); render(performance.now(), 1); }
    whenVisible(canvas, function (vis) { vis ? start() : stop(); });
    document.addEventListener('qontrolab:theme', function () { if (!running) render(performance.now(), 1); });
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (finePointer) {
      canvas.parentElement.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        tiltTarget = 0.28 + ((e.clientY - r.top) / r.height - 0.5) * 0.4;
      });
      canvas.parentElement.addEventListener('pointerleave', function () { tiltTarget = 0.28; });
    }
  }

  /* ---------- Módulos (los 36 del sistema) ---------- */
  var MODULES = [
    ['op', 'Dashboard', 'Vista general de la operación.', 'Ten a la vista lo más importante: órdenes del día, pendientes, ingresos, farmacia, clínica y actividad general. Ideal para tomar decisiones rápidas sin revisar hojas o reportes separados.'],
    ['op', 'Pacientes', 'Expedientes ordenados.', 'Centraliza la información de cada paciente en un expediente ordenado. Evita duplicar datos y permite consultar historial, órdenes anteriores y seguimiento en segundos.'],
    ['op', 'Citas y Agenda', 'Atención mejor organizada.', 'Organiza la atención diaria con horarios, estados y seguimiento. Ayuda a evitar confusiones en recepción y convierte una cita en orden de trabajo cuando el paciente llega.'],
    ['op', 'Cotizaciones', 'Propuestas más profesionales.', 'Crea propuestas profesionales para pacientes, empresas o instituciones. Cuando el cliente acepta, puedes convertir la cotización en una orden.'],
    ['op', 'Caja y Cobros', 'Control real de ingresos.', 'Lleva control de cobros, saldos, pagos parciales y cortes de caja. Ayuda a saber qué está pagado, qué está pendiente y cuánto ingresó realmente. Puede operar como caja separada de la recepción.'],
    ['op', 'Inventario y Bodegas', 'Evita faltantes y pérdidas.', 'Controla insumos, reactivos, lotes, bodegas por sucursal y vencimientos. Evita quedarte sin materiales clave y ayuda a reducir pérdidas por productos vencidos o mal registrados.'],
    ['op', 'Reportes', 'Decisiones con datos.', 'Consulta información clave sobre ingresos, órdenes, pacientes, médicos, exámenes, farmacia, inventario y actividad clínica. Ideal para administración y gerencia.'],
    ['lab', 'Órdenes de Trabajo', 'Proceso controlado de principio a fin.', 'Controla todo el proceso desde que entra el paciente: exámenes solicitados, pagos, muestra, estado de proceso y entrega final. Todo queda trazable.'],
    ['lab', 'Resultados', 'Captura, validación y PDFs.', 'Captura, valida y entrega resultados con formato profesional, dentro de la misma orden de trabajo. Maneja valores de referencia y genera PDFs listos para el paciente o el médico.'],
    ['lab', 'Catálogo de Exámenes', 'Exámenes y precios claros.', 'Mantén ordenados tus exámenes, perfiles, precios y áreas. Facilita cotizar, crear órdenes y estandarizar la forma en que trabaja el laboratorio.'],
    ['lab', 'Synapse', 'Equipos conectados.', 'Conecta equipos de laboratorio para reducir digitación manual. Recibe resultados de analizadores mediante ASTM, HL7 o archivos planos, según el equipo.'],
    ['lab', 'Control de Calidad', 'Controles internos y trazabilidad.', 'Gestión de calidad del laboratorio: controles internos de equipos, temperatura y ambiente, lotes de material de control, estadística acumulada, revisión y trazabilidad.'],
    ['lab', 'Bitácora Diaria', 'Evidencia diaria del laboratorio.', 'Registra controles de inicio de turno, temperaturas, control de calidad y observaciones. Ayuda a mantener evidencia interna y orden en la operación.'],
    ['lab', 'Laboratorios Referentes', 'Referencias y comisiones.', 'Registra los laboratorios y hospitales que te refieren exámenes, con su comisión. Cada laboratorio referente puede consultar sus comisiones desde su propio portal.'],
    ['lab', 'Logística', 'Envíos de muestras controlados.', 'Registra los envíos a laboratorios de referencia, con los insumos del inventario que viajan en cada envío y sus devoluciones.'],
    ['cli', 'Consultas', 'Atención médica documentada.', 'Gestiona consultas clínicas, signos vitales, diagnósticos, recetas, constancias y seguimiento del paciente. Ideal para clínicas, médicos independientes y sanatorios.'],
    ['cli', 'Historia Clínica', 'El expediente clínico completo.', 'Reúne la historia clínica del paciente para que el médico tenga antecedentes, consultas y seguimiento en un solo lugar.'],
    ['cli', 'Catálogo de Servicios', 'Servicios clínicos y precios.', 'Mantén ordenados los servicios clínicos y sus precios para cotizar, cobrar y cargarlos a la cuenta del paciente.'],
    ['cli', 'Internamiento', 'Encamamiento y censo.', 'Gestiona ingresos, camas, censo y la cuenta de cada paciente internado, con médico tratante asignado y cargos de laboratorio, imagen y farmacia en la misma cuenta.'],
    ['cli', 'Enfermería y Emergencia', 'Pantallas propias para enfermería.', 'Enfermería trabaja con sus propias pantallas: emergencia, encamamiento, órdenes de laboratorio e insumos de su área, con permisos a la medida.'],
    ['cli', 'Quirófano', 'Cirugías organizadas.', 'Organiza las cirugías y sus paquetes quirúrgicos dentro de la misma plataforma, con el personal de quirófano y sus permisos.'],
    ['cli', 'Rayos X', 'Solicitudes de imagen.', 'Solicitudes de Rayos X con su catálogo y su cobro, o cargadas directamente a la cuenta de un paciente internado.'],
    ['cli', 'Ultrasonidos', 'Estudios de ultrasonido.', 'Solicitudes de ultrasonido con su catálogo y su cobro, o cargadas directamente a la cuenta de un paciente internado.'],
    ['cli', 'Cocina', 'Dietas de pacientes internados.', 'Muestra las dietas activas de los pacientes internados, ordenadas por habitación. Las dietas se asignan desde el internamiento.'],
    ['cli', 'Portal del Paciente', 'Resultados e historial en línea.', 'Permite que el paciente consulte su historial, órdenes y resultados desde un portal propio. Reduce llamadas repetitivas y mejora la entrega.'],
    ['far', 'Farmacia y Punto de Venta', 'Ventas rápidas y caja.', 'Opera una farmacia completa con punto de venta, ventas, caja propia, clientes y reportes. Funciona como sistema de farmacia independiente o conectada con la clínica.'],
    ['far', 'Recetas', 'De la consulta a la farmacia.', 'Las recetas que emite el médico llegan a una cola de farmacia para despacharlas sin volver a escribirlas.'],
    ['far', 'Compras y Proveedores', 'Abastecimiento ordenado.', 'Catálogo de productos, proveedores, compras, entradas y precios de la farmacia en un mismo flujo.'],
    ['far', 'Traslados y Bodegas', 'Stock donde se necesita.', 'Lleva el inventario de farmacia por bodega y mueve existencias entre bodegas con registro de cada traslado.'],
    ['adm', 'Facturación FEL', 'Facturas desde el cobro.', 'Emite facturas electrónicas FEL desde los cobros. Administración gestiona la facturación y caja puede emitir los cobros que quedaron pendientes de facturar.'],
    ['adm', 'Contabilidad', 'Cuentas bancarias y movimientos.', 'Cuentas bancarias, saldos y movimientos. Las transferencias cobradas llegan a la cuenta que elijas como predeterminada.'],
    ['adm', 'Médicos y Comisiones', 'Referencias bajo control.', 'Gestiona médicos referentes, órdenes enviadas y comisiones. Cada médico puede consultar sus pacientes, órdenes y comisiones desde el Portal Médico.'],
    ['adm', 'Portal Médico', 'Comunicación más ágil.', 'Permite que médicos referentes consulten sus pacientes, órdenes y comisiones sin llamar ni saturar al equipo.'],
    ['adm', 'Multi-sucursal', 'Varias sedes en orden.', 'Opera varias sedes desde una misma plataforma. Usuarios, bodegas e información organizados por sucursal, con una visión general de toda la operación.'],
    ['adm', 'Configuración y Permisos', 'Sistema adaptado a tu operación.', 'Adapta el sistema a tu institución: datos generales, usuarios, permisos por rol o por persona, formatos de PDF, menú y módulos activos.'],
    ['adm', 'Modos de Operación', 'Activa solo lo que necesitas.', 'Qontrolab se adapta por módulos: solo laboratorio, solo clínica, laboratorio y clínica, solo farmacia, clínica con farmacia u operación completa.']
  ];
  var AREAS = { op: 'Operación', lab: 'Laboratorio', cli: 'Clínica y hospital', far: 'Farmacia', adm: 'Administración' };

  function initModules() {
    var grid = $('#moduleGrid'), sheet = $('#moduleSheet');
    if (!grid) return;
    var countEl = $('#moduleCount');
    if (countEl) countEl.textContent = MODULES.length;
    $$('.stat [data-count]').forEach(function (el) { if (el.dataset.count === '36') { el.dataset.count = MODULES.length; el.textContent = MODULES.length; } });

    grid.innerHTML = MODULES.map(function (m, i) {
      return '<button type="button" class="tile" data-area="' + m[0] + '" data-index="' + i + '">' +
        '<small>' + String(i + 1).padStart(2, '0') + ' · ' + AREAS[m[0]] + '</small>' +
        '<strong>' + m[1] + '</strong><span class="tile__desc">' + m[2] + '</span><span class="arrow" aria-hidden="true">→</span></button>';
    }).join('');

    grid.addEventListener('click', function (e) {
      var tile = e.target.closest('.tile');
      if (!tile || !sheet || typeof sheet.showModal !== 'function') return;
      var m = MODULES[+tile.dataset.index];
      $('#sheetArea').textContent = AREAS[m[0]];
      $('#sheetTitle').textContent = m[1];
      $('#sheetText').textContent = m[3];
      sheet.showModal();
    });
    if (sheet) sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });

    function applyFilter(f) {
      $$('.filter button').forEach(function (b) { var on = b.dataset.filter === f; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      $$('.tile', grid).forEach(function (t) {
        var show = f === 'all' || t.dataset.area === f;
        t.classList.toggle('is-hidden', !show);
        t.classList.remove('is-entering');
        if (show) { void t.offsetWidth; t.classList.add('is-entering'); }
      });
    }
    $$('.filter button').forEach(function (btn) { btn.addEventListener('click', function () { applyFilter(btn.dataset.filter); }); });
    $$('[data-filter-link]').forEach(function (a) { a.addEventListener('click', function () { applyFilter(a.dataset.filterLink); }); });
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
