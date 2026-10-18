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
