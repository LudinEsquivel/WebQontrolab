/* ============================================================
   Qontrolab · Landing beta editorial — interacciones
   Mejora progresiva: sin JS el contenido se ve completo.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var TEAL = '20,184,166';


  /* ---------- Navegación ---------- */
  function initNav() {
    var nav = $('#nav');
    var toggle = $('#navToggle');
    var menu = $('#mobileMenu');
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
    ['plataforma', 'modulos', 'flujo', 'preguntas'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
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
      var e = 1 - Math.pow(1 - t, 4);
      el.textContent = formatNumber(target * e, el);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }
  function initCounters() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
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
          c.fillStyle = accent;
          c.beginPath();
          var lt = bottom - (bottom - top) * levels[i];
          c.moveTo(x - r, lt); c.lineTo(x - r, bottom - r); c.arc(x, bottom - r, r, Math.PI, 0, true); c.lineTo(x + r, lt); c.closePath(); c.fill();
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
    var s = Math.min(w, h) * 0.6;
    shape.draw(c, w / 2, h * 0.47, s, '#f00');
    var data = c.getImageData(0, 0, off.width, off.height).data;
    var pts = [];
    var step = 2;
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
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
    var fit, ctx, w, h, targets = [], particles = [], free = [];
    var shapeAt = 0, running = false, raf = 0, lastSwitch = 0;
    var mouse = { x: -9999, y: -9999 };
    var HOLD = 5200;

    function build() {
      fit = fitCanvas(canvas); ctx = fit.ctx; w = fit.w; h = fit.h;
      var count = Math.round(clamp(w * h / 150, 950, 2300));
      targets = SHAPES.map(function (sh) { return sampleShape(sh, w, h, count); });
      var keep = particles.length === count;
      if (!keep) {
        particles = [];
        for (var i = 0; i < count; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, tx: 0, ty: 0, mix: 0, accent: false,
            s: Math.random() < 0.12 ? 1.9 : 1.15, a: 0.45 + Math.random() * 0.55, seed: Math.random() * 1000 });
        }
        free = [];
        var amb = Math.round(count * 0.14);
        for (var f = 0; f < amb; f++) {
          free.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.14, a: 0.12 + Math.random() * 0.3, s: Math.random() < 0.2 ? 1.6 : 1 });
        }
      }
      assign(shapeAt, false);
      if (reduceMotion || !keep) {
        particles.forEach(function (p) { if (reduceMotion) { p.x = p.tx; p.y = p.ty; p.mix = p.accent ? 1 : 0; } });
      }
      draw(performance.now());
    }

    function assign(k, kick) {
      var t = targets[k];
      particles.forEach(function (p, i) {
        p.tx = t[i].x; p.ty = t[i].y; p.accent = t[i].accent;
        if (kick) { p.vx += (Math.random() - 0.5) * 6; p.vy += (Math.random() - 0.5) * 6; }
      });
      if (label) {
        label.style.opacity = 0;
        setTimeout(function () {
          label.textContent = SHAPES[k].label;
          index.textContent = String(k + 1).padStart(2, '0');
          label.style.opacity = 1;
        }, kick ? 260 : 0);
      }
    }

    function step(now) {
      if (now - lastSwitch > HOLD) { lastSwitch = now; shapeAt = (shapeAt + 1) % SHAPES.length; assign(shapeAt, true); }
      var t = now * 0.001;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var tx = p.tx + Math.sin(t * 1.3 + p.seed) * 1.4, ty = p.ty + Math.cos(t * 1.1 + p.seed) * 1.4;
        p.vx += (tx - p.x) * 0.014; p.vy += (ty - p.y) * 0.014;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 6400) { var f = (1 - d2 / 6400) * 2.2; var d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
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
      ctx.fillStyle = 'rgb(214,219,236)';
      for (var j = 0; j < free.length; j++) { var q = free[j]; ctx.globalAlpha = q.a; ctx.fillRect(q.x, q.y, q.s, q.s); }
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.mix < 0.98) { ctx.globalAlpha = p.a * (1 - p.mix); ctx.fillRect(p.x, p.y, p.s, p.s); }
      }
      ctx.fillStyle = 'rgb(' + TEAL + ')';
      for (var k = 0; k < particles.length; k++) {
        var r = particles[k];
        if (r.mix > 0.02) { ctx.globalAlpha = Math.min(1, r.a * r.mix * 1.25); ctx.fillRect(r.x, r.y, r.s + 0.3, r.s + 0.3); }
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) { step(now); draw(); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduceMotion) return; running = true; lastSwitch = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    build();
    whenVisible(canvas, function (vis) { vis ? start() : stop(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (finePointer) {
      canvas.parentElement.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    }
  }

  /* ---------- Esfera de puntos (cifras) ---------- */
  function initCloud() {
    var canvas = $('#cloudParticles');
    if (!canvas) return;
    var ctx, w, h, pts = [], running = false, raf = 0, rotY = 0, tiltTarget = 0.32, tilt = 0.32;

    function build() {
      var f = fitCanvas(canvas); ctx = f.ctx; w = f.w; h = f.h;
      var n = w < 600 ? 650 : 1250;
      pts = [];
      var golden = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
        pts.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, node: Math.random() < 0.035, seed: Math.random() * 10 });
      }
      render(performance.now());
    }

    function render(now) {
      var t = now * 0.001;
      ctx.clearRect(0, 0, w, h);
      var R = Math.min(w * (w < 600 ? 0.34 : 0.2), h * 0.4), cx = w / 2, cy = h * 0.46, fov = R * 3.2;
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(tilt), sinX = Math.sin(tilt);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var breathe = 1 + Math.sin(t * 0.8 + p.seed) * 0.025;
        var x = p.x * breathe, y = p.y * breathe, z = p.z * breathe;
        var x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
        var y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
        var scale = fov / (fov + z2 * R);
        var sx = cx + x1 * R * scale, sy = cy + y2 * R * scale;
        var depth = (1 - z2) / 2;
        if (p.node) {
          var pulse = 0.6 + Math.sin(t * 2 + p.seed) * 0.4;
          ctx.fillStyle = 'rgba(' + TEAL + ',' + (0.35 + depth * 0.6) * pulse + ')';
          var s = 2.6 * scale;
          ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
        } else {
          ctx.fillStyle = 'rgba(15,16,35,' + (0.08 + depth * 0.42) + ')';
          var sz = (0.9 + depth * 1.1) * scale;
          ctx.fillRect(sx, sy, sz, sz);
        }
      }
    }

    var last = 0;
    function loop(now) {
      var dt = last ? Math.min(now - last, 50) : 16; last = now;
      rotY += dt * 0.00018;
      tilt += (tiltTarget - tilt) * 0.04;
      render(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || reduceMotion) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    build();
    whenVisible(canvas, function (vis) { vis ? start() : stop(); });
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (finePointer) {
      canvas.parentElement.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        tiltTarget = 0.32 + ((e.clientY - r.top) / r.height - 0.5) * 0.5;
      });
    }
  }

  /* ---------- Monitor: se endereza al entrar ---------- */
  function initMonitor() {
    var stage = $('.stage'), monitor = $('#monitor');
    if (!stage || !monitor || reduceMotion) return;
    var desktop = window.matchMedia('(min-width: 861px)');
    var ticking = false;
    function update() {
      ticking = false;
      if (!desktop.matches) { monitor.style.removeProperty('--tilt'); monitor.style.removeProperty('--lift'); return; }
      var r = stage.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh - r.top) / (vh * 0.9), 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      monitor.style.setProperty('--tilt', (16 * (1 - e)).toFixed(2) + 'deg');
      monitor.style.setProperty('--lift', (70 * (1 - e)).toFixed(1) + 'px');
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
    var section = $('#areas');
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
      // reinicia la barra de progreso
      var bar = $('.tabs__bar', tabs[current]);
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      if (focus) tabs[current].focus();
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
    var zone = $('.areas__panels');
    [list, zone].forEach(function (el) {
      el.addEventListener('pointerenter', function () { hovering = true; syncPause(); });
      el.addEventListener('pointerleave', function () { hovering = false; syncPause(); });
      el.addEventListener('focusin', function () { hovering = true; syncPause(); });
      el.addEventListener('focusout', function () { hovering = false; syncPause(); });
    });
    whenVisible(section, function (vis) { visible = vis; syncPause(); });
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

  /* ---------- Módulos ---------- */
  var MODULES = [
    ['op', 'Dashboard', 'Vista general de la operación.', 'Ten a la vista lo más importante: órdenes del día, pendientes, ingresos, farmacia, clínica y actividad general. Ideal para tomar decisiones rápidas sin revisar hojas o reportes separados.'],
    ['op', 'Pacientes', 'Expedientes ordenados.', 'Centraliza la información de cada paciente en un expediente ordenado. Evita duplicar datos y permite consultar historial, órdenes anteriores y seguimiento en segundos.'],
    ['op', 'Citas y Agenda', 'Atención mejor organizada.', 'Organiza la atención diaria con horarios, estados y seguimiento. Ayuda a evitar confusiones en recepción y convierte una cita en orden de trabajo cuando el paciente llega.'],
    ['op', 'Órdenes de Trabajo', 'Proceso clínico controlado.', 'Controla todo el proceso desde que entra el paciente: exámenes solicitados, pagos, muestra, estado de proceso y entrega final. Todo queda trazable.'],
    ['op', 'Cotizaciones', 'Propuestas más profesionales.', 'Crea propuestas profesionales para pacientes, empresas o instituciones. Cuando el cliente acepta, puedes convertir la cotización en una orden.'],
    ['lab', 'Resultados', 'Entrega profesional de PDFs.', 'Reduce errores al capturar, validar y entregar resultados con formato profesional. Permite manejar valores de referencia y generar PDFs listos para el paciente o médico.'],
    ['lab', 'Catálogo de Exámenes', 'Exámenes y precios claros.', 'Mantén ordenados tus exámenes, perfiles, precios y áreas. Facilita cotizar, crear órdenes y estandarizar la forma en que trabaja el laboratorio.'],
    ['lab', 'Synapse', 'Menos digitación manual.', 'Conecta equipos de laboratorio para reducir digitación manual. Ayuda a recibir resultados de analizadores mediante ASTM, HL7 o archivos planos, según el equipo.'],
    ['lab', 'Bitácora Diaria', 'Evidencia diaria del laboratorio.', 'Registra controles de inicio de turno, temperaturas, control de calidad y observaciones. Ayuda a mantener evidencia interna y orden en la operación.'],
    ['lab', 'Portal Médico', 'Comunicación más ágil.', 'Permite que médicos referentes consulten información relacionada con sus pacientes, órdenes o comisiones. Mejora la comunicación sin saturar al equipo.'],
    ['cli', 'Clínica y Consultas', 'Atención médica documentada.', 'Gestiona consultas clínicas, signos vitales, diagnósticos, recetas, constancias y seguimiento del paciente. Ideal para clínicas, médicos independientes y sanatorios.'],
    ['cli', 'Farmacia', 'Ventas, stock y recetas.', 'Opera una farmacia completa con punto de venta, inventario, bodegas, compras, proveedores, precios, caja, reportes y seguimiento de recetas.'],
    ['cli', 'Inventario', 'Evita faltantes y pérdidas.', 'Controla insumos, reactivos, lotes, bodegas y vencimientos. Evita quedarte sin materiales clave y ayuda a reducir pérdidas por productos vencidos o mal registrados.'],
    ['cli', 'Portal del Paciente', 'Resultados e historial en línea.', 'Permite que el paciente consulte su historial, órdenes y resultados desde un portal propio. Reduce llamadas repetitivas y mejora la entrega.'],
    ['adm', 'Caja y Pagos', 'Control real de ingresos.', 'Lleva control de cobros, saldos, pagos parciales y cortes de caja. Ayuda a saber qué está pagado, qué está pendiente y cuánto ingresó realmente.'],
    ['adm', 'Reportes', 'Decisiones con datos.', 'Consulta información clave sobre ingresos, órdenes, pacientes, médicos, exámenes, farmacia, inventario y actividad clínica. Ideal para administración y gerencia.'],
    ['adm', 'Médicos y Comisiones', 'Referencias bajo control.', 'Gestiona médicos referentes, órdenes enviadas y comisiones. Útil para laboratorios que trabajan con referencias y necesitan medir relaciones.'],
    ['adm', 'Multi-sucursal', 'Varias sedes en orden.', 'Opera varias sedes desde una misma plataforma. Mantiene la información organizada por sucursal y facilita una visión general de toda la operación.'],
    ['adm', 'Configuración', 'Sistema adaptado a tu operación.', 'Adapta el sistema a la identidad y forma de trabajar de tu institución: datos generales, usuarios, permisos, formatos de PDF y módulos activos.'],
    ['adm', 'Modos de Operación', 'Activa solo lo que necesitas.', 'Qontrolab se adapta por módulos: solo laboratorio, solo farmacia, solo clínica, laboratorio con farmacia, clínica con farmacia o una operación completa.']
  ];
  var AREAS = { op: 'Operación', lab: 'Laboratorio', cli: 'Clínica y farmacia', adm: 'Administración' };

  function initModules() {
    var grid = $('#moduleGrid'), sheet = $('#moduleSheet');
    if (!grid) return;
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

    $$('.filter button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        $$('.filter button').forEach(function (b) { var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
        $$('.tile', grid).forEach(function (t) {
          var show = f === 'all' || t.dataset.area === f;
          t.classList.toggle('is-hidden', !show);
          t.classList.remove('is-entering');
          if (show) { void t.offsetWidth; t.classList.add('is-entering'); }
        });
      });
    });
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
    initNav();
    initReveal();
    initCounters();
    initHeroParticles();
    initMonitor();
    initTabs();
    initStats();
    initCloud();
    initModules();
    initFlow();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
