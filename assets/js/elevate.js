/* ============================================================
   Qontrolab · Motion con física (progressive enhancement)
   No toca datos ni estructura. Se desactiva con prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --- Failsafe de reveal: si el observer no dispara (tab oculto,
         render headless, JS previo con error), nada queda invisible. --- */
  function revealFailsafe() {
    setTimeout(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.2) el.classList.add('is-visible');
      });
    }, 1400);
  }

  /* --- Botones magnéticos: la etiqueta se inclina hacia el cursor --- */
  function magnetic() {
    if (reduce.matches || !fine.matches) return;
    $$('.btn--primary, .nav-cta').forEach(function (btn) {
      var raf = null;
      btn.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var b = btn.getBoundingClientRect();
          var mx = (e.clientX - b.left - b.width / 2) / b.width;
          var my = (e.clientY - b.top - b.height / 2) / b.height;
          btn.style.transform = 'translate(' + (mx * 6).toFixed(2) + 'px,' + (my * 6 - 1).toFixed(2) + 'px)';
        });
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* --- Parallax del hero: la ventana del producto responde al mouse --- */
  function heroParallax() {
    if (reduce.matches || !fine.matches) return;
    var stage = $('.product-stage');
    var win = $('.system-window');
    var cardR = $('.floating-card--right');
    var cardL = $('.floating-card--left');
    if (!stage || !win) return;
    var raf = null, tx = 0, ty = 0;
    stage.addEventListener('pointermove', function (e) {
      var b = stage.getBoundingClientRect();
      tx = (e.clientX - b.left - b.width / 2) / b.width;   // -0.5..0.5
      ty = (e.clientY - b.top - b.height / 2) / b.height;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        win.style.transform = 'perspective(1400px) rotateY(' + (tx * 6 - 2.6).toFixed(2) + 'deg) rotateX(' + (-ty * 5 + 1.2).toFixed(2) + 'deg) translateY(-2px)';
        if (cardR) cardR.style.transform = 'translate3d(' + (tx * 18).toFixed(1) + 'px,' + (ty * 14).toFixed(1) + 'px,0)';
        if (cardL) cardL.style.transform = 'translate3d(' + (tx * -16).toFixed(1) + 'px,' + (ty * -12).toFixed(1) + 'px,0)';
      });
    });
    stage.addEventListener('pointerleave', function () {
      win.style.transform = '';
      if (cardR) cardR.style.transform = '';
      if (cardL) cardL.style.transform = '';
    });
  }

  /* --- Count-up de los KPI del mockup: los números "cuentan" al entrar
         y cada vez que se cambia de módulo. Solo dígitos, respeta prefijos. --- */
  function countUp() {
    if (reduce.matches) return;
    var ids = ['#mockKpiOne', '#mockKpiTwo', '#mockKpiThree'];
    function animate(el) {
      var raw = el.textContent.trim();
      var m = raw.match(/^([^\d]*)([\d.,]+)([^\d]*)$/); // prefijo, número, sufijo (Q4.2k, 142, +18%)
      if (!m) return;
      var pre = m[1], numStr = m[2].replace(/,/g, ''), post = m[3];
      var target = parseFloat(numStr);
      if (!isFinite(target)) return;
      var decimals = (numStr.split('.')[1] || '').length;
      var hadComma = m[2].indexOf(',') > -1;
      var start = performance.now(), dur = 620;
      function fmt(v) {
        var s = decimals ? v.toFixed(decimals) : String(Math.round(v));
        if (hadComma) s = Number(s).toLocaleString('en-US');
        return pre + s + post;
      }
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 4); // ease-out-quart
        el.textContent = fmt(target * e);
        if (t < 1) requestAnimationFrame(tick); else el.textContent = pre + m[2] + post;
      }
      requestAnimationFrame(tick);
    }
    function run() { ids.forEach(function (id) { var el = $(id); if (el) animate(el); }); }

    // Al entrar el hero en viewport
    var hero = $('.product-stage');
    if (hero && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: .3 });
      io.observe(hero);
    }
    // Cada vez que cambia el módulo activo (el sidebar reescribe #mockRows)
    var rows = $('#mockRows');
    if (rows && 'MutationObserver' in window) {
      var mo = new MutationObserver(function () { run(); });
      mo.observe(rows, { childList: true });
    }
  }

  /* --- Tour automático: el mockup se demuestra solo, cede el control al usuario --- */
  function heroTour() {
    if (reduce.matches) return;
    if (!window.matchMedia('(min-width:1101px)').matches) return;
    if (typeof window.setActiveModule !== 'function') return;
    var sidebar = $('#moduleSidebar');
    var stage = $('.product-stage');
    if (!sidebar || !stage) return;
    var DUR = 3400;
    sidebar.style.setProperty('--tour-dur', DUR + 'ms');
    var timer = null, paused = false, onScreen = false;

    function buttons() { return sidebar.querySelectorAll('button'); }
    function currentIndex() {
      var bs = buttons(), a = sidebar.querySelector('button.active');
      return a ? Array.prototype.indexOf.call(bs, a) : 0;
    }
    function tick() {
      if (paused) return;
      var bs = buttons(); if (!bs.length) return;
      window.setActiveModule((currentIndex() + 1) % bs.length);
      // Mantener el módulo activo visible dentro del sidebar (sin mover la página)
      var a = sidebar.querySelector('button.active');
      if (a && sidebar.scrollHeight > sidebar.clientHeight) {
        sidebar.scrollTop = Math.max(0, a.offsetTop - sidebar.clientHeight / 2 + a.offsetHeight / 2);
      }
    }
    function play() {
      if (!onScreen || paused) { sidebar.classList.remove('touring'); return; }
      sidebar.classList.add('touring');
      clearInterval(timer); timer = setInterval(tick, DUR);
    }
    function stop() { clearInterval(timer); sidebar.classList.remove('touring'); }

    // El usuario toma el control al pasar por encima; se reanuda al salir
    stage.addEventListener('pointerenter', function () { paused = true; stop(); });
    stage.addEventListener('pointerleave', function () {
      setTimeout(function () { paused = false; play(); }, 600);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else play();
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { onScreen = e.isIntersecting; onScreen ? play() : stop(); });
      }, { threshold: .45 });
      io.observe(stage);
    } else { onScreen = true; play(); }
  }

  /* --- Circuito vivo: la orden fluye por el pipeline en bucle --- */
  function livingCircuit() {
    if (reduce.matches) return;
    var steps = $$('.operation-steps span');
    var nodes = ['.node-a', '.node-b', '.node-c'].map(function (s) { return $(s); }).filter(Boolean);
    var card = $('.operation-card--main');
    var vis = $('.operation-visual');
    if (!steps.length || !vis) return;

    // Partícula que recorre el borde de la orden
    if (card && CSS && CSS.supports && CSS.supports('offset-path', 'inset(0)')) {
      var spark = document.createElement('span');
      spark.className = 'flow-spark';
      card.appendChild(spark);
    }

    var i = 0, timer = null, running = false;
    function frame() {
      steps.forEach(function (s, idx) {
        s.classList.toggle('done', idx < i);
        s.classList.toggle('active', idx === i);
      });
      nodes.forEach(function (n, idx) { n.classList.toggle('is-live', idx === (i % nodes.length)); });
      i = (i + 1) % steps.length;
    }
    function start() { if (running) return; running = true; frame(); timer = setInterval(frame, 1400); }
    function stop() { running = false; clearInterval(timer); }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: .3 });
      io.observe(vis);
    } else start();
  }

  /* --- Foco que envuelve: sigue el cursor en el hero --- */
  function heroSpotlight() {
    if (reduce.matches || !fine.matches) return;
    var hero = $('.hero'); if (!hero) return;
    var blob = document.createElement('div');
    blob.className = 'hero__spotlight';
    hero.appendChild(blob);
    var raf = null, x = 0, y = 0;
    hero.addEventListener('pointermove', function (e) {
      var b = hero.getBoundingClientRect();
      x = e.clientX - b.left; y = e.clientY - b.top;
      hero.classList.add('spotlight-on');
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        blob.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
    });
    hero.addEventListener('pointerleave', function () { hero.classList.remove('spotlight-on'); });
  }

  function init() {
    revealFailsafe();
    magnetic();
    heroParallax();
    countUp();
    heroSpotlight();
    livingCircuit();
    heroTour();
  }

  // init corre en 'load' para garantizar que app.js ya construyó el sidebar,
  // el mockup y las tarjetas de módulo (app.js inicializa en DOMContentLoaded).
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init, { once: true });
  }
})();
