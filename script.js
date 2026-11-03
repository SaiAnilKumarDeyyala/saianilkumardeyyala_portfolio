/* Sai Anil Kumar Deyyala: portfolio
   Plain JavaScript, no dependencies. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- page load ---------- */
  const start = () => root.classList.add('loaded');
  if (document.readyState === 'complete') requestAnimationFrame(start);
  else window.addEventListener('load', () => requestAnimationFrame(start));
  setTimeout(start, 1800); // safety net if a font is slow

  /* ---------- theme ---------- */
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const applyTheme = (name) => {
    root.setAttribute('data-theme', name);
    if (themeMeta) themeMeta.setAttribute('content', name === 'light' ? '#f4f7fc' : '#080c17');
    themeBtn.setAttribute('aria-label', name === 'light' ? 'Switch to the dark theme' : 'Switch to the light theme');
  };
  applyTheme(root.getAttribute('data-theme') || 'dark');
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $('#menu-btn');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- scroll reveal ---------- */
  $$('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--d', `${Math.min(i * 0.07, 0.5)}s`);
    });
  });
  // the stack reads bottom-up, so the lowest layer appears first
  $$('[data-stack]').forEach((group) => {
    const kids = Array.from(group.children);
    kids.forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--d', `${(kids.length - 1 - i) * 0.09}s`);
    });
  });

  const settle = (el) => {
    let done = false;
    const mark = () => { if (!done) { done = true; el.classList.add('settled'); } };
    el.addEventListener('transitionend', (e) => { if (e.target === el && e.propertyName === 'opacity') mark(); });
    setTimeout(mark, 2200);
  };

  const revealEls = $$('.reveal');
  if (hasIO) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        settle(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in', 'settled'));
  }

  /* ---------- count-up numbers ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const duration = 1400;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (hasIO) {
    counters.forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- scroll: progress bar, header, git-graph rail ---------- */
  const progress = $('#progress');
  const graph = $('#graph');
  let ticking = false;
  const onScroll = () => {
    const max = root.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    if (graph) {
      const r = graph.getBoundingClientRect();
      const p = (window.innerHeight * 0.62 - r.top) / r.height;
      graph.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(4));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- active nav link ---------- */
  const links = $$('#nav a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if (hasIO) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((s) => nio.observe(s));
  }

  /* ---------- pointer spotlight + magnetic buttons ---------- */
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest && e.target.closest('.panel, .layer, .cert');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- tool marquee: duplicate each track for a seamless loop ---------- */
  $$('.m-track').forEach((track) => {
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.innerHTML += clone.innerHTML;
  });

  /* ---------- experience tabs ---------- */
  $$('[data-tabs]').forEach((tabs) => {
    const list = $('.tablist', tabs);
    const buttons = $$('[role="tab"]', tabs);
    const indicator = $('.tab-ind', tabs);

    const moveIndicator = () => {
      const active = buttons.find((b) => b.getAttribute('aria-selected') === 'true');
      if (!active || !indicator) return;
      indicator.style.width = active.offsetWidth + 'px';
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    const select = (btn, focus) => {
      buttons.forEach((b) => {
        const on = b === btn;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      moveIndicator();
      if (focus) btn.focus();
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(b, false));
      b.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % buttons.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + buttons.length) % buttons.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = buttons.length - 1;
        if (n !== null) { e.preventDefault(); select(buttons[n], true); }
      });
    });
    moveIndicator();
    window.addEventListener('resize', moveIndicator);
    window.addEventListener('load', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
    if (list && 'ResizeObserver' in window) new ResizeObserver(moveIndicator).observe(list);
  });

  /* ---------- career bar: one bar per month ---------- */
  (() => {
    const bar = $('#career-bar');
    if (!bar) return;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const roles = [
      { label: 'DevOps Intern', org: 'Tiger Analytics', from: [2022, 2], color: 'var(--amber)' },
      { label: 'DevOps Engineer', org: 'Tiger Analytics', from: [2022, 7], color: 'var(--blue)' },
      { label: 'Senior DevOps Engineer', org: 'Tiger Analytics', from: [2023, 5], color: 'var(--violet)' },
      { label: 'Infrastructure Consultant', org: 'Thoughtworks', from: [2024, 6], color: 'var(--green)' }
    ];
    const idx = (y, m) => (y - 2022) * 12 + (m - 2);
    const starts = roles.map((r) => idx(r.from[0], r.from[1]));
    const now = new Date();
    const elapsed = Math.max(idx(now.getFullYear(), now.getMonth()), 0); // months since March 2022
    const total = elapsed + 1;

    const tenure = $('#tenure');
    if (tenure) {
      const y = Math.floor(elapsed / 12);
      const m = elapsed % 12;
      tenure.textContent = `${y} yrs${m ? ` ${m} mos` : ''}`;
    }

    const roleAt = (i) => {
      let k = 0;
      starts.forEach((s, n) => { if (i >= s) k = n; });
      return k;
    };
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const el = document.createElement('i');
      el.style.setProperty('--c', roles[roleAt(i)].color);
      el.style.setProperty('--i', i);
      if (i === total - 1) el.classList.add('now');
      frag.appendChild(el);
    }
    bar.appendChild(frag);

    const segs = Array.from(bar.children);
    const legend = $$('#career-legend li');
    const cap = $('#career-cap');
    const label = (i) => {
      const mi = 2 + i;
      const y = 2022 + Math.floor(mi / 12);
      const r = roles[roleAt(i)];
      return `${MONTHS[mi % 12]} ${y}: ${r.label}, ${r.org}`;
    };
    let cur = -1;
    const show = (i) => {
      if (i === cur) return;
      cur = i;
      segs.forEach((s, n) => s.classList.toggle('hl', n === i));
      legend.forEach((l, n) => l.classList.toggle('on', i >= 0 && n === roleAt(i)));
      if (cap) cap.textContent = i >= 0 ? label(i) : 'Hover or focus the bar to read any month.';
    };
    bar.addEventListener('pointermove', (e) => {
      const r = bar.getBoundingClientRect();
      show(Math.max(0, Math.min(total - 1, Math.floor(((e.clientX - r.left) / r.width) * total))));
    });
    bar.addEventListener('pointerleave', () => { if (document.activeElement !== bar) show(-1); });
    bar.addEventListener('focus', () => show(total - 1));
    bar.addEventListener('blur', () => show(-1));
    bar.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(0, (cur < 0 ? total - 1 : cur) - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(total - 1, (cur < 0 ? total - 1 : cur) + 1)); }
    });
  })();

  /* ---------- scrolling line charts (Grafana-style) ---------- */
  let gradId = 0;
  const createChart = (svg, cfg) => {
    if (!svg) return null;
    const W = 300, H = 110;
    const n = cfg.points || 48;
    const dx = W / (n - 1);
    const stepMs = cfg.stepMs || 260;
    const id = 'cg' + (gradId++);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    let defs = '<defs>';
    cfg.series.forEach((s, i) => {
      defs += `<linearGradient id="${id}-${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.color};stop-opacity:0.32"/><stop offset="1" style="stop-color:${s.color};stop-opacity:0"/></linearGradient>`;
    });
    defs += '</defs>';
    let grid = '';
    for (let i = 1; i < 4; i++) grid += `<line class="grid" x1="0" x2="${W}" y1="${(H * i) / 4}" y2="${(H * i) / 4}"/>`;
    svg.innerHTML = defs + grid + cfg.series.map((s, i) =>
      `<path class="area" style="fill:url(#${id}-${i})"/><path class="line" style="stroke:${s.color};fill:none"/>`).join('');
    const areas = $$('.area', svg);
    const lines = $$('.line', svg);

    let t = 0;
    let boost = 0;
    const data = cfg.series.map(() => []);
    const sample = (s, k) => {
      const v = s.base
        + s.amp * Math.sin(t * 0.13 * s.speed + k * 1.7)
        + s.amp * 0.5 * Math.sin(t * 0.37 + k * 0.9)
        + (Math.random() - 0.5) * 0.06
        + boost * (s.boost || 1);
      return Math.max(0.06, Math.min(0.94, v));
    };
    const push = () => {
      t++;
      cfg.series.forEach((s, k) => { data[k].push(sample(s, k)); if (data[k].length > n + 1) data[k].shift(); });
      boost *= 0.93;
    };
    for (let i = 0; i < n + 1; i++) push();

    const path = (pts) => {
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += `Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
      }
      const l = pts[pts.length - 1];
      return d + `L${l[0].toFixed(1)},${l[1].toFixed(1)}`;
    };
    const render = (f) => {
      data.forEach((arr, k) => {
        const pts = arr.map((v, i) => [(i - f) * dx, H - v * H]);
        const d = path(pts);
        lines[k].setAttribute('d', d);
        areas[k].setAttribute('d', `${d}L${pts[pts.length - 1][0].toFixed(1)},${H}L${pts[0][0].toFixed(1)},${H}Z`);
      });
    };
    render(0);

    let running = false;
    let last = 0;
    let acc = 0;
    const frame = (now) => {
      if (!running) return;
      if (!last) last = now;
      acc += now - last;
      last = now;
      while (acc >= stepMs) { push(); acc -= stepMs; }
      render(acc / stepMs);
      requestAnimationFrame(frame);
    };
    const api = {
      start() { if (running || reduceMotion) return; running = true; last = 0; requestAnimationFrame(frame); },
      stop() { running = false; },
      bump(v = 0.2) { boost = v; }
    };
    if (hasIO) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => (en.isIntersecting ? api.start() : api.stop()));
      }, { threshold: 0.05 }).observe(svg);
    } else {
      api.start();
    }
    return api;
  };

  const heroChart = createChart($('#hero-spark'), {
    points: 44,
    series: [{ color: '#4da3ff', base: 0.52, amp: 0.16, speed: 1 }]
  });
  createChart($('#proj-spark'), {
    points: 60,
    stepMs: 300,
    series: [
      { color: '#4da3ff', base: 0.58, amp: 0.2, speed: 1 },
      { color: '#36d6a0', base: 0.36, amp: 0.14, speed: 0.7 }
    ]
  });

  /* ---------- hero deploy console ---------- */
  (() => {
    const stages = $$('#stages li');
    const podsEl = $('#pods');
    const badge = $('#c-badge');
    const log = $('#c-log');
    const count = $('#pod-count');
    const consoleEl = $('#console');
    if (!stages.length || !podsEl) return;

    const POD_COUNT = 12;
    for (let i = 0; i < POD_COUNT; i++) podsEl.appendChild(document.createElement('i')).className = 'pod';
    const pods = $$('.pod', podsEl);

    const cmds = [
      'git push origin main',
      'docker build -t api:v2 .',
      'running unit and integration tests',
      'checkov -d ./infra',
      'terraform plan',
      'terraform apply -auto-approve',
      'helm upgrade --install api ./chart'
    ];

    const setBadge = (state, text) => { badge.dataset.state = state; badge.textContent = text; };
    const reset = () => {
      stages.forEach((s) => s.classList.remove('running', 'done'));
      pods.forEach((p) => p.classList.remove('updating', 'v2'));
      count.textContent = `${POD_COUNT}/${POD_COUNT} v1`;
      setBadge('running', 'Running');
    };
    const finalState = () => {
      stages.forEach((s) => s.classList.add('done'));
      pods.forEach((p) => p.classList.add('v2'));
      count.textContent = `${POD_COUNT}/${POD_COUNT} v2`;
      setBadge('done', 'Deployed');
      log.textContent = 'kubectl rollout status: successfully rolled out';
    };

    if (reduceMotion) { finalState(); return; }

    let inView = true;
    if (hasIO) new IntersectionObserver((en) => { inView = en[0].isIntersecting; }, { threshold: 0.1 }).observe(consoleEl);
    const gate = async () => { while (document.hidden || !inView) await sleep(300); };

    const run = async () => {
      for (;;) {
        reset();
        await sleep(900);
        for (let i = 0; i < stages.length; i++) {
          await gate();
          stages[i].classList.add('running');
          log.textContent = cmds[i];
          if (i === stages.length - 1) {
            if (heroChart) heroChart.bump(0.22);
            for (let k = 0; k < pods.length; k++) {
              pods[k].classList.add('updating');
              await sleep(190);
              pods[k].classList.remove('updating');
              pods[k].classList.add('v2');
              count.textContent = `${POD_COUNT}/${POD_COUNT} ${k + 1 === POD_COUNT ? 'v2' : 'rolling'}`;
              if (k < POD_COUNT - 1) count.textContent = `${k + 1} of ${POD_COUNT} updated`;
            }
          } else {
            await sleep(860);
          }
          stages[i].classList.remove('running');
          stages[i].classList.add('done');
        }
        setBadge('done', 'Deployed');
        log.textContent = 'kubectl rollout status: successfully rolled out';
        await sleep(4200);
      }
    };
    run();
  })();

  /* ---------- terminal typing (infrastructure project) ---------- */
  (() => {
    const body = $('#term-body');
    const box = $('#term');
    const replay = $('#term-replay');
    if (!body || reduceMotion) return;
    const lines = $$('.tl', body);
    lines.forEach((l) => { l.dataset.full = l.textContent; });
    let token = 0;

    const play = async () => {
      const mine = ++token;
      lines.forEach((l) => { l.textContent = ''; l.hidden = true; l.classList.remove('typing'); });
      for (const l of lines) {
        if (mine !== token) return;
        l.hidden = false;
        const full = l.dataset.full;
        if (l.classList.contains('cmd')) {
          l.classList.add('typing');
          for (let i = 1; i <= full.length; i++) {
            if (mine !== token) return;
            l.textContent = full.slice(0, i);
            await sleep(16 + Math.random() * 26);
          }
          l.classList.remove('typing');
          await sleep(260);
        } else {
          l.textContent = full;
          await sleep(140);
        }
      }
    };

    lines.forEach((l) => { l.textContent = ''; l.hidden = true; });
    if (hasIO) {
      const tio = new IntersectionObserver((en) => {
        if (en[0].isIntersecting) { play(); tio.disconnect(); }
      }, { threshold: 0.35 });
      tio.observe(box);
    } else {
      play();
    }
    if (replay) replay.addEventListener('click', play);
  })();

  /* ---------- copy email ---------- */
  const toast = $('#toast');
  let toastTimer;
  const notify = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  const copyBtn = $('#copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = copyBtn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        notify('Email copied');
      } catch (e) {
        notify('Press Ctrl+C to copy: ' + text);
      }
    });
  }

  /* ---------- footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
