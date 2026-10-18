/* ============ Fayed — portfolio v2 runtime ============ */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (min-width:901px)').matches;

/* ---------- split text into masked lines (split on <br>) ---------- */
$$('.split').forEach(el => {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p, i) =>
    `<span class="ln"><span style="transition-delay:${i * 90 + (+el.dataset.delay || 0)}ms">${p.trim()}</span></span>`).join('');
});

/* ---------- statement words ---------- */
$$('[data-words]').forEach(el => {
  const walk = n => {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) frag.append(t);
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s); }
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    });
  };
  walk(el);
});

/* ---------- loader (first visit per session) ---------- */
const loader = $('.loader');
const start = () => document.body.classList.add('ready');
if (loader && !document.documentElement.classList.contains('no-loader')) {
  const cnt = $('.loader-count', loader), bar = $('.loader-bar', loader);
  let v = 0;
  const tick = () => {
    v += Math.max(1, (100 - v) * .085);
    if (v > 99.5) v = 100;
    cnt.textContent = String(Math.floor(v)).padStart(3, '0');
    bar.style.width = v + '%';
    if (v < 100) setTimeout(tick, 28);
    else setTimeout(() => { loader.classList.add('done'); start(); try { sessionStorage.setItem('seen', 1); } catch (e) {} }, 260);
  };
  reduce ? (loader.classList.add('done'), start()) : tick();
} else start();

/* ---------- smooth scroll ---------- */
let lenis = null;
if (window.Lenis && !reduce) {
  lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ---------- reveals ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
const arm = () => $$('.split,.fade,.rule,.bigname,.portrait').forEach(el => io.observe(el));
document.body.classList.contains('ready') ? arm() : new MutationObserver((m, o) => {
  if (document.body.classList.contains('ready')) { o.disconnect(); setTimeout(arm, 350); }
}).observe(document.body, { attributes: true });

/* ---------- counters ---------- */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1800;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(to * k);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step); cio.unobserve(el);
}), { threshold: .5 });
$$('[data-count]').forEach(el => cio.observe(el));

/* ---------- scroll-driven bits ---------- */
const words = $$('.statement .w');
const portraitImg = $('.portrait img');
const heroInner = $('.hero-inner');
const onScroll = () => {
  const vh = innerHeight;
  if (words.length) {
    const box = $('.statement p').getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * .85 - box.top) / (box.height + vh * .35)));
    const lit = Math.floor(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));
  }
  if (portraitImg) {
    const r = portraitImg.parentElement.getBoundingClientRect();
    portraitImg.style.transform = `translateY(${((r.top + r.height / 2 - vh / 2) / vh) * -60 - 40}px)`;
  }
  if (heroInner && !reduce) {
    const y = scrollY;
    heroInner.style.transform = `translateY(${y * .25}px)`;
    heroInner.style.opacity = Math.max(0, 1 - y / (vh * .7));
  }
};
(lenis ? lenis.on('scroll', onScroll) : addEventListener('scroll', onScroll, { passive: true }));
onScroll();

/* ---------- cursor ---------- */
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
if (fine) {
  const dot = Object.assign(document.createElement('div'), { className: 'cur' });
  const ring = Object.assign(document.createElement('div'), { className: 'cur-ring', innerHTML: '<span></span>' });
  document.body.append(dot, ring);
  const rp = { x: mouse.x, y: mouse.y };
  const loop = () => {
    rp.x += (mouse.x - rp.x) * .16; rp.y += (mouse.y - rp.y) * .16;
    dot.style.transform = `translate(${mouse.x}px,${mouse.y}px)`;
    ring.style.transform = `translate(${rp.x}px,${rp.y}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('pointerover', e => {
    const l = e.target.closest('[data-cursor]');
    const h = e.target.closest('a,button,input,textarea,label');
    ring.classList.toggle('label', !!l);
    ring.classList.toggle('hover', !l && !!h);
    ring.firstChild.textContent = l ? l.dataset.cursor : '';
  });

  /* magnetic */
  $$('[data-mag]').forEach(el => {
    const s = +el.dataset.mag || .35;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px,${(e.clientY - r.top - r.height / 2) * s}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)'; el.style.transform = '';
      setTimeout(() => el.style.transition = '', 800);
    });
  });
}

/* ---------- project hover preview ---------- */
const plist = $('.plist'), prev = $('.preview');
if (plist && prev && fine) {
  const slides = $('.slides', prev), pp = { x: 0, y: 0 };
  $$('.prow', plist).forEach((row, i) => row.addEventListener('pointerenter', () => {
    slides.style.transform = `translateY(${-i * 230}px)`; prev.classList.add('on');
  }));
  plist.addEventListener('pointerleave', () => prev.classList.remove('on'));
  const loop = () => {
    pp.x += (mouse.x - pp.x) * .1; pp.y += (mouse.y - pp.y) * .1;
    prev.style.left = (pp.x + 30) + 'px'; prev.style.top = (pp.y - 115) + 'px';
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------- page wipe transitions ---------- */
const wipe = $('.wipe');
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a || !wipe || reduce) return;
  const href = a.getAttribute('href') || '';
  if (a.target === '_blank' || e.metaKey || e.ctrlKey || !/\.html(#.*)?$/.test(href)) return;
  if (href.split('#')[0] === location.pathname.split('/').pop()) return;
  e.preventDefault();
  wipe.classList.add('in');
  setTimeout(() => location.href = href, 650);
});
addEventListener('pageshow', e => { if (e.persisted && wipe) wipe.classList.remove('in'); });

/* ---------- Dhaka clock ---------- */
const clk = $('[data-clock]');
if (clk) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const t = () => clk.textContent = 'DHK ' + f.format(new Date());
  t(); setInterval(t, 1000);
}

/* ---------- copy email ---------- */
const toast = $('.toast');
$$('[data-copy]').forEach(b => b.addEventListener('click', () => {
  navigator.clipboard?.writeText(b.dataset.copy);
  if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); }
}));

/* ---------- contact form (Web3Forms) ---------- */
const cf = $('#contactForm');
if (cf) {
  const note = $('#cfNote'), btn = $('#cfSubmitBtn'), lbl = $('.t', btn);
  cf.addEventListener('submit', async e => {
    e.preventDefault(); btn.disabled = true; lbl.textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(cf)))
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      cf.reset(); note.textContent = 'Sent — thanks, I\'ll get back to you soon.';
    } catch (err) {
      note.textContent = 'Something went wrong — email me directly at hufayed19@gmail.com.';
    } finally { btn.disabled = false; lbl.textContent = 'Send message'; }
  });
}

/* ---------- hero: data terrain ---------- */
const cv = $('#terrain');
if (cv) {
  const ctx = cv.getContext('2d');
  let W, H, DPR, f, hz, cx, pts = [], visible = true;
  const ROWS = 64, COLS = 150, ZN = .35, ZF = 5, CAMY = .55;
  const m = { x: 0, z: 2, tx: 0, tz: 2, amp: 0 };
  const build = () => {
    DPR = Math.min(devicePixelRatio || 1, 1.75);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    f = Math.max(W, H * 1.2) * .62; hz = H * .2; cx = W / 2;
    const cols = W < 700 ? 80 : COLS;
    pts = [];
    for (let r = 0; r < ROWS; r++) {
      const z = ZN + Math.pow(r / (ROWS - 1), 1.35) * (ZF - ZN);
      const spread = (W / 2) / f * z * 1.15;
      for (let c = 0; c < cols; c++) pts.push({ x: (c / (cols - 1) * 2 - 1) * spread, z });
    }
  };
  build(); addEventListener('resize', build);
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(cv);

  const h = (x, z, t) =>
    .11 * Math.sin(x * 1.9 + t * .55) * Math.cos(z * 1.6 - t * .38) +
    .05 * Math.sin((x * .7 - z) * 3.1 + t * .9) +
    .025 * Math.sin(x * 6.3 - t * 1.4 + z * 2);

  const acc = [212, 255, 58];
  const draw = now => {
    requestAnimationFrame(draw);
    if (!visible) return;
    const t = reduce ? 0 : now / 1000;
    // mouse -> ground plane
    const sy = Math.max(mouse.y, hz + 20);
    m.tz = Math.min(ZF, CAMY * f / (sy - hz)); m.tx = (mouse.x - cx) * m.tz / f;
    m.x += (m.tx - m.x) * .06; m.z += (m.tz - m.z) * .06;
    m.amp += ((fine ? 1 : 0) - m.amp) * .02;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const dx = p.x - m.x, dz = p.z - m.z, d2 = dx * dx + dz * dz * .6;
      const rip = m.amp * .22 * Math.exp(-d2 * 3.2) * Math.cos(Math.sqrt(d2) * 9 - t * 3.2);
      const y = h(p.x, p.z, t) + rip;
      const X = cx + p.x * f / p.z, Y = hz + (CAMY - y) * f / p.z;
      if (X < -4 || X > W + 4 || Y < -4 || Y > H + 4) continue;
      const depth = 1 - (p.z - ZN) / (ZF - ZN);
      const lift = Math.max(0, y + .02) * 5;
      const a = Math.min(1, Math.pow(depth, 1.5) * (.85 + lift * 1.6));
      const s = Math.max(.8, 2.4 / p.z);
      const k = Math.min(1, Math.max(0, (y - .08) * 7) + Math.exp(-d2 * 4) * m.amp * .9);
      ctx.fillStyle = `rgba(${237 + (acc[0] - 237) * k | 0},${235 + (acc[1] - 235) * k | 0},${230 + (acc[2] - 230) * k | 0},${a})`;
      ctx.fillRect(X - s / 2, Y - s / 2, s, s);
    }
  };
  requestAnimationFrame(draw);
}
})();

/* ===== v3: boot, tilt, command palette ===== */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const boot = $('.boot');
if (boot) {
  const lines = JSON.parse(boot.dataset.lines); boot.innerHTML = '';
  let li = 0;
  const next = () => {
    if (li >= lines.length) return;
    const d = document.createElement('div'); boot.append(d);
    const [t, ok] = lines[li++]; let c = 0;
    const type = () => {
      d.textContent = t.slice(0, ++c);
      if (c < t.length) setTimeout(type, reduce ? 0 : 14);
      else { if (ok) d.insertAdjacentHTML('beforeend', ` <span class="ok">${ok}</span>`); setTimeout(next, reduce ? 0 : 160); }
    };
    type();
  };
  const go = () => setTimeout(next, 500);
  document.body.classList.contains('ready') ? go() : new MutationObserver((m, o) => { if (document.body.classList.contains('ready')) { o.disconnect(); go(); } }).observe(document.body, { attributes: true });
}

const frames = $$('.frame');
if (frames.length && !reduce) {
  const t = () => {
    const vh = innerHeight;
    frames.forEach(f => {
      const r = f.getBoundingClientRect(), p = (r.top + r.height / 2 - vh / 2) / vh;
      f.style.transform = `rotateX(${Math.max(-18, Math.min(18, p * 22))}deg) scale(${1 - Math.min(.08, Math.abs(p) * .08)})`;
    });
    requestAnimationFrame(t);
  };
  t();
}

const box = document.createElement('div'); box.className = 'cmdk';
const items = [
  ['Pages', 'Index', 'index.html'], ['Pages', 'Work', 'work.html'], ['Pages', 'About', 'about.html'], ['Pages', 'Contact', 'contact.html'],
  ['Projects', 'GLTC Corporate Website', 'work.html#gltc-website'], ['Projects', 'GLTC Inventory System', 'work.html#gltc-inventory'],
  ['Projects', 'HBTrace & HBTrail', 'work.html#hbtrace'], ['Projects', 'GP Tracker Auto-Watcher', 'work.html#gp-tracker-report-automation'],
  ['Projects', 'Factory Production Log App', 'work.html#factory-production-log-automation-app'], ['Projects', 'F.I.D.O. — voice AI', 'work.html#labs'],
  ['Actions', 'Copy email', 'copy:hufayed19@gmail.com'], ['Actions', 'Visit gltcbd.com', 'https://www.gltcbd.com/'],
  ['Actions', 'GitHub', 'https://github.com/Fayed038'], ['Actions', 'LinkedIn', 'https://www.linkedin.com/in/md-hammad-ullah-fayed-251744271'],
];
box.innerHTML = `<div class="cmdk-box"><input placeholder="Type a command or search…" aria-label="Command palette"><div class="cmdk-list"></div><div class="cmdk-foot"><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></div></div>`;
document.body.append(box);
const inp = $('input', box), list = $('.cmdk-list', box); let sel = 0, shown = [];
const render = () => {
  const q = inp.value.toLowerCase();
  shown = items.filter(i => i[1].toLowerCase().includes(q)); sel = Math.min(sel, Math.max(0, shown.length - 1));
  let g = '', h = '';
  shown.forEach((it, k) => { if (it[0] !== g) { g = it[0]; h += `<div class="cmdk-g">${g}</div>`; } h += `<button class="cmdk-i${k === sel ? ' on' : ''}" data-k="${k}">${it[1]}<span>${it[2].startsWith('http') ? '↗' : it[2].startsWith('copy') ? 'copy' : '→'}</span></button>`; });
  list.innerHTML = h || '<div class="cmdk-g">No results</div>';
};
const run = it => {
  if (!it) return; close();
  if (it[2].startsWith('copy:')) { navigator.clipboard?.writeText(it[2].slice(5)); const t = $('.toast'); t && (t.classList.add('show'), setTimeout(() => t.classList.remove('show'), 1800)); }
  else if (it[2].startsWith('http')) open(it[2], '_blank', 'noopener');
  else location.href = it[2];
};
const openP = () => { box.classList.add('open'); inp.value = ''; sel = 0; render(); setTimeout(() => inp.focus(), 20); };
const close = () => box.classList.remove('open');
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.classList.contains('open') ? close() : openP(); return; }
  if (!box.classList.contains('open')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowDown') { sel = (sel + 1) % shown.length; render(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { sel = (sel - 1 + shown.length) % shown.length; render(); e.preventDefault(); }
  if (e.key === 'Enter') run(shown[sel]);
});
inp.addEventListener('input', () => { sel = 0; render(); });
list.addEventListener('click', e => { const b = e.target.closest('[data-k]'); b && run(shown[+b.dataset.k]); });
box.addEventListener('click', e => { if (e.target === box) close(); });
$$('[data-cmdk]').forEach(b => b.addEventListener('click', openP));
})();
