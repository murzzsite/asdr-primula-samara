const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/ZMAREYDG55';
// Ссылка на бота-игру (гайд). После переноса бота на аккаунт клиента поменять только здесь.
const BOT_LINK = 'https://t.me/trip_wire_super_bot?start=1b53d30d1532';

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  };

  $$('[data-bot]').forEach(a => { a.href = BOT_LINK; });
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== HERO: фото-домик чуть следует за курсором ===== */
  const art = $('#heroArt'), roofPhoto = $('#roofPhoto');
  if (art && roofPhoto && !reduce) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * .12; cy += (ty - cy) * .12;
      roofPhoto.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > .05) ? requestAnimationFrame(tick) : 0;
    };
    art.addEventListener('pointermove', e => {
      const b = art.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width - .5) * 16;
      ty = ((e.clientY - b.top) / b.height - .5) * 12;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    art.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  /* ===== СЦЕНА: дом, окна загораются по скроллу ===== */
  const scene = $('#scene'), house = $('#house');
  if (scene && house) {
    const wins = $('#wins');
    const COLS = [100, 240, 380], ROWS = [256, 372], W = 120, H = 100;
    const winEls = [];
    for (const y of ROWS) for (const x of COLS) {
      const g = el('g', { class: 'win' }, wins);
      el('rect', { class: 'frame', x, y, width: W, height: H, rx: 4 }, g);
      const pw = 49, ph = 39;
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => el('rect', { class: 'pane', x: x + 8 + a * (pw + 6), y: y + 8 + b * (ph + 6), width: pw, height: ph }, g));
      const pos = el('g', { transform: `translate(${x + W - 6} ${y + 6})` }, g);
      const st = el('g', { class: 'stamp' }, pos);
      el('circle', { r: 17, fill: '#CF1F6A', stroke: '#fff', 'stroke-width': 3 }, st);
      el('path', { d: 'M-8 0 -2.5 6 8 -6', fill: 'none', stroke: '#fff', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, st);
      winEls.push(g);
    }
    const fl = $('#flower');
    for (let k = 0; k < 5; k++) {
      const g = el('g', { transform: `rotate(${k * 72})` }, fl);
      el('ellipse', { class: 'petal', cx: 0, cy: -20, rx: 12, ry: 21 }, g);
    }
    el('circle', { class: 'flower-core', r: 9 }, fl);

    const steps = $$('.step', scene), N = 7;
    const stick = $('.scene__stick', scene);
    const names = ['Покупка и продажа', 'Узаконение перепланировки', 'Приватизация', 'Торги по банкротству', 'Проверка участков', 'Юрист и суд', 'Страховка и гарантии'];
    const ticks = $('#ticks'), now = $('#sNow'), cap = $('#cap');
    const tickBtns = names.map((n, k) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = k + 1; b.setAttribute('aria-label', 'Шаг ' + (k + 1) + ': ' + n);
      li.appendChild(b); ticks.appendChild(li);
      b.addEventListener('click', () => {
        const total = scene.offsetHeight - stick.offsetHeight;
        const top = scene.getBoundingClientRect().top + scrollY - 64 + total * ((k + .5) / N);
        scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      });
      return b;
    });
    let last = -1;
    const update = () => {
      const r = scene.getBoundingClientRect();
      const total = r.height - stick.offsetHeight;
      const p = clamp((64 - r.top) / total);
      const idx = Math.min(N - 1, Math.floor(p * N));
      const lit = p < .01 ? 0 : idx + 1;
      if (lit === last) return;
      last = lit;
      winEls.forEach((w, k) => { w.classList.toggle('on', k < lit); w.classList.toggle('cur', k === lit - 1 && lit <= 6); });
      house.classList.toggle('house--done', lit >= N);
      const show = Math.max(lit, 1) - 1;
      steps.forEach((s, k) => s.classList.toggle('on', k === show));
      tickBtns.forEach((b, k) => {
        b.classList.toggle('done', k < lit - 1 || (k === lit - 1 && lit >= N));
        b.classList.toggle('cur', k === lit - 1 && lit < N);
        if (k === lit - 1) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      now.textContent = String(show + 1).padStart(2, '0');
      cap.textContent = lit === 0 ? 'Дом по шагам: прокрутите вниз' : 'Закрыто: ' + names[show];
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', () => { last = -1; update(); });
  }

  /* ===== бейдж вращается, коллаж едет с разной скоростью ===== */
  const badgeSvg = $('#badge'), pars = $$('[data-par]');
  if (!reduce && (badgeSvg || pars.length)) {
    let ticking = false;
    const run = () => {
      ticking = false;
      if (badgeSvg) badgeSvg.style.transform = `rotate(${(scrollY * .15).toFixed(1)}deg)`;
      pars.forEach(f => {
        const r = f.getBoundingClientRect();
        if (r.bottom < -300 || r.top > innerHeight + 300) return;
        const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(f.dataset.par);
        f.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* ===== КАЛЬКУЛЯТОР комиссии: 3%, но не менее 120 000 ₽ ===== */
  const sum = $('#sum');
  if (sum) {
    const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n)).replace(/[  ]/g, ' ');
    const out = $('#sumOut'), feeEl = $('#fee'), note = $('#calcNote');
    let shown = 0, anim = 0;
    const MIN = 120000;
    const paint = v => { feeEl.textContent = fmt(v) + ' ₽'; };
    const upd = () => {
      const s = +sum.value;
      out.textContent = fmt(s) + ' ₽';
      const pct = s * .03;
      const fee = Math.max(pct, MIN);
      note.textContent = pct >= MIN ? '3% от ' + fmt(s) + ' ₽' : '3% было бы ' + fmt(pct) + ' ₽, поэтому действует минимум 120 000 ₽';
      sum.style.background = `linear-gradient(90deg,#CF1F6A ${((s - sum.min) / (sum.max - sum.min)) * 100}%,#DCD3BF 0) center/100% 6px no-repeat`;
      cancelAnimationFrame(anim);
      if (reduce) { shown = fee; paint(fee); return; }
      const from = shown, t0 = performance.now();
      const step = t => {
        const k = clamp((t - t0) / 380), e = 1 - Math.pow(1 - k, 3);
        shown = from + (fee - from) * e; paint(shown);
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    sum.addEventListener('input', upd);
    shown = Math.max(+sum.value * .03, MIN); upd();
  }

  /* ===== плавный переход по якорям ===== */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      const target = href === '#top' ? document.body : $(href);
      if (!target) return;
      e.preventDefault();
      const top = href === '#top' ? 0 : target.getBoundingClientRect().top + scrollY - 64;
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ===== FORM -> CLOUDFLARE WORKER -> TELEGRAM ===== */
  const form = $('#leadForm');
  const msg = $('#formMsg');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    msg.classList.remove('err');
    if (!String(payload.name || '').trim() || !String(payload.contact || '').trim()) { msg.textContent = 'Заполните имя и контакт'; msg.classList.add('err'); return; }
    if (!payload.consent) { msg.textContent = 'Нужно согласие на обработку персональных данных'; msg.classList.add('err'); return; }
    delete payload.consent;
    payload.source = 'Примула, Самара - лендинг';
    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Отправлено';
      msg.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
      msg.textContent = 'Не удалось отправить. Попробуйте ещё раз или напишите в Telegram @ASDR2680.';
      msg.classList.add('err');
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });
})();
