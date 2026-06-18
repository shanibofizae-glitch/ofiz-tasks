/* ============================================================
   OFIZ Tasks — FX layer
   Three.js animated mesh-gradient backgrounds (login + dashboard)
   + GSAP entrance / micro-interaction motion.
   Fully optional: every effect is guarded, so if a CDN fails the
   app still works normally.
   ============================================================ */
(function () {
  'use strict';

  const HAS_THREE = typeof window.THREE !== 'undefined';
  const HAS_GSAP  = typeof window.gsap  !== 'undefined';
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────────────────────────────────────
     Three.js soft metaball gradient background
     ───────────────────────────────────────────────────────── */
  const FRAG = `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_res;
    uniform vec3  c1; uniform vec3 c2; uniform vec3 c3;
    uniform float u_alpha;
    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      float aspect = u_res.x / u_res.y;
      vec2 p = uv; p.x *= aspect;
      vec2 b1 = vec2((0.28 + 0.16 * sin(u_time * 0.25)) * aspect, 0.34 + 0.12 * cos(u_time * 0.20));
      vec2 b2 = vec2((0.72 + 0.13 * cos(u_time * 0.18)) * aspect, 0.66 + 0.15 * sin(u_time * 0.23));
      vec2 b3 = vec2((0.50 + 0.18 * sin(u_time * 0.15 + 1.0)) * aspect, 0.50 + 0.16 * cos(u_time * 0.19 + 2.0));
      float d1 = exp(-dot(p - b1, p - b1) * 5.5);
      float d2 = exp(-dot(p - b2, p - b2) * 5.5);
      float d3 = exp(-dot(p - b3, p - b3) * 6.5);
      vec3 col = c1 * d1 + c2 * d2 + c3 * d3;
      float a = clamp(d1 + d2 + d3, 0.0, 1.0) * u_alpha;
      gl_FragColor = vec4(col, a);
    }`;

  const VERT = `
    void main() { gl_Position = vec4(position, 1.0); }`;

  function makeBg(canvas, opts) {
    if (!HAS_THREE || reduceMotion || !canvas) return null;
    opts = opts || {};
    let renderer, scene, camera, material, mesh, raf = null, running = false, t0 = performance.now();

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setClearColor(0x000000, 0);
    } catch (e) { return null; }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);

    scene  = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    material = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        u_time:  { value: 0 },
        u_res:   { value: new THREE.Vector2(1, 1) },
        u_alpha: { value: opts.alpha != null ? opts.alpha : 0.55 },
        c1: { value: new THREE.Color(opts.c1 || '#81D8D0') },
        c2: { value: new THREE.Color(opts.c2 || '#AE82D9') },
        c3: { value: new THREE.Color(opts.c3 || '#D99E82') },
      },
    });
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    function resize() {
      const parent = canvas.parentElement || canvas;
      const w = parent.clientWidth  || window.innerWidth;
      const h = parent.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      material.uniforms.u_res.value.set(w * dpr, h * dpr);
    }

    function frame() {
      if (!running) return;
      material.uniforms.u_time.value = (performance.now() - t0) / 1000;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    const api = {
      start() { if (running) return; running = true; resize(); frame(); },
      stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = null; },
      resize: resize,
      /* Live-update uniforms (used to re-tune the mesh on theme change) */
      setOpts(o) {
        if (!o) return;
        if (o.alpha != null) material.uniforms.u_alpha.value = o.alpha;
        if (o.c1) material.uniforms.c1.value.set(o.c1);
        if (o.c2) material.uniforms.c2.value.set(o.c2);
        if (o.c3) material.uniforms.c3.value.set(o.c3);
        if (!running) renderer.render(scene, camera);   /* repaint if paused */
      },
    };

    const ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);
    else window.addEventListener('resize', resize);

    return api;
  }

  /* Pause all WebGL when the tab is hidden */
  let _loginBg = null, _dashBg = null;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { _loginBg && _loginBg.stop(); _dashBg && _dashBg.stop(); }
    else {
      if (_loginBg && document.getElementById('login-screen') &&
          document.getElementById('login-screen').style.display !== 'none') _loginBg.start();
      if (_dashBg && window.currentPage === 'dashboard') _dashBg.start();
    }
  });

  /* ─────────────────────────────────────────────────────────
     GSAP motion
     ───────────────────────────────────────────────────────── */

  /* Safety net: if rAF is throttled/stalled (so GSAP never advances),
     force any still-hidden element back to visible after `delay`.
     Timers fire even when rAF doesn't, so content is never stuck. */
  function failsafe(nodes, delay) {
    const list = Array.prototype.slice.call(nodes);
    setTimeout(function () {
      list.forEach(function (e) {
        if (!e) return;
        if (e.style.opacity === '0' || getComputedStyle(e).opacity === '0') {
          e.style.opacity = '';
          e.style.transform = '';
        }
      });
    }, delay);
  }

  function animateLogin() {
    if (!HAS_GSAP || reduceMotion) return;
    const card = document.querySelector('#login-screen .login-card');
    if (!card) return;
    const items = card.querySelectorAll(
      '.login-logo-mark, .login-brand, .login-sub, .form-group, #login-btn, .login-footer'
    );
    gsap.killTweensOf([card, items]);
    gsap.fromTo(card, { y: 26, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    gsap.fromTo(items, { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.07, delay: 0.15,
        clearProps: 'transform' });
    const orbs = document.querySelectorAll('#login-screen .login-orb');
    gsap.fromTo(orbs, { opacity: 0 }, { opacity: 0.55, duration: 1.4, ease: 'sine.out', stagger: 0.2 });
    failsafe([card].concat(Array.prototype.slice.call(items)), 1300);
  }

  let _dashAnimAt = 0;
  function animateDashboard() {
    if (!HAS_GSAP || reduceMotion) return;
    const now = Date.now();
    if (now - _dashAnimAt < 250) return;     /* debounce double-calls */
    _dashAnimAt = now;

    const hero    = document.querySelector('#page-dashboard .dash-hero');
    const stats   = document.querySelectorAll('#page-dashboard .stats-grid .stat-card');
    const days    = document.querySelectorAll('#page-dashboard .dash-day');
    const widgets = document.querySelectorAll(
      '#page-dashboard .dash-section, #page-dashboard .dash-widget, ' +
      '#page-dashboard .dash-bot-left, #page-dashboard .dash-bot-mid, #page-dashboard .dash-bot-right'
    );

    if (hero) gsap.fromTo(hero, { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: 'transform' });
    if (stats.length) gsap.fromTo(stats, { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.06, delay: 0.1,
        clearProps: 'transform' });
    if (days.length) gsap.fromTo(days, { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.6)', stagger: 0.03, delay: 0.25,
        clearProps: 'transform' });
    if (widgets.length) gsap.fromTo(widgets, { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.07, delay: 0.3,
        clearProps: 'transform' });

    failsafe([hero].concat(Array.prototype.slice.call(stats),
      Array.prototype.slice.call(days), Array.prototype.slice.call(widgets)), 1700);

    /* Count-up on the stat values */
    document.querySelectorAll('#page-dashboard .stat-value').forEach(function (el) {
      const raw = (el.textContent || '').trim();
      if (!/^\d+$/.test(raw)) return;            /* skip "x / y" style values */
      const end = parseInt(raw, 10);
      if (!end) return;
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 0.9, ease: 'power1.out', delay: 0.2,
        onUpdate() { el.textContent = Math.round(o.v); } });
    });
  }

  /* ─────────────────────────────────────────────────────────
     Wire into the existing app lifecycle (non-destructive)
     ───────────────────────────────────────────────────────── */
  function startLoginBg() {
    if (!_loginBg) _loginBg = makeBg(document.getElementById('login-bg'),
      { alpha: 0.5, c1: '#81D8D0', c2: '#AE82D9', c3: '#D99E82' });
    _loginBg && _loginBg.start();
  }
  /* Dashboard mesh tuned per theme — bright pastels on light, a calmer
     deeper-toned, lower-alpha aurora on dark (so it isn't a harsh glow). */
  function dashOptsForTheme() {
    return document.body.classList.contains('dark')
      ? { alpha: 0.30, c1: '#3db5ad', c2: '#8a63b8', c3: '#c4845f' }
      : { alpha: 0.70, c1: '#81D8D0', c2: '#AE82D9', c3: '#D99E82' };
  }
  function startDashBg() {
    if (!_dashBg) _dashBg = makeBg(document.getElementById('dash-bg'), dashOptsForTheme());
    else          _dashBg.setOpts(dashOptsForTheme());
    _dashBg && _dashBg.start();
  }

  /* Re-tune the live mesh whenever the theme class flips on <body> */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (_dashBg) _dashBg.setOpts(dashOptsForTheme());
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* Wrap loginAs → kick off dashboard motion + background */
  if (typeof window.loginAs === 'function') {
    const _loginAs = window.loginAs;
    window.loginAs = async function () {
      _loginBg && _loginBg.stop();
      const r = await _loginAs.apply(this, arguments);
      startDashBg();
      requestAnimationFrame(animateDashboard);
      return r;
    };
  }

  /* Wrap showPage → animate when navigating to dashboard; pause dash bg elsewhere */
  if (typeof window.showPage === 'function') {
    const _showPage = window.showPage;
    window.showPage = function (pageId) {
      const r = _showPage.apply(this, arguments);
      if (pageId === 'dashboard') { startDashBg(); requestAnimationFrame(animateDashboard); }
      else { _dashBg && _dashBg.stop(); }
      return r;
    };
  }

  /* Wrap logout → return to an animated login screen */
  if (typeof window.logout === 'function') {
    const _logout = window.logout;
    window.logout = function () {
      _dashBg && _dashBg.stop();
      const r = _logout.apply(this, arguments);
      startLoginBg();
      requestAnimationFrame(animateLogin);
      return r;
    };
  }

  /* Initial paint: the login screen is visible on load */
  function boot() {
    const login = document.getElementById('login-screen');
    if (login && login.style.display !== 'none') {
      startLoginBg();
      animateLogin();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Expose for manual use / debugging */
  window.FX = { animateDashboard: animateDashboard, animateLogin: animateLogin,
                startDashBg: startDashBg, startLoginBg: startLoginBg };
})();
