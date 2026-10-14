// Login-screen signal network. Admin screens stay calm; this only runs while the login/loader is visible.
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, app = document.getElementById('app'), cv = document.getElementById('lnet');
const ctx = cv && cv.getContext('2d'); if (ctx) {
  let W = 0, H = 0, nodes = [], active = false, raf = 0; const m = { x: -999, y: -999 };
  const spawn = () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.4 + .8, c: Math.random() < .5 ? '0,208,132' : '22,131,255' });
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); const n = Math.round(Math.min(55, Math.max(20, W * H / 22000))); while (nodes.length < n) nodes.push(spawn()); nodes.length = n; };
  const frame = move => {
    ctx.clearRect(0, 0, W, H);
    if (move) for (const p of nodes) { const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy); if (d < 170 && d > 1) { p.vx += dx / d * .01; p.vy += dy / d * .01; } const sp = Math.hypot(p.vx, p.vy); if (sp > .8) { p.vx *= .8 / sp; p.vy *= .8 / sp; } p.x += p.vx; p.y += p.vy; if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10; }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) { const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 140) { ctx.strokeStyle = `rgba(${a.c},${(1 - d / 140) * .3})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      const dm = Math.hypot(a.x - m.x, a.y - m.y); if (dm < 170) { ctx.strokeStyle = `rgba(${a.c},${(1 - dm / 170) * .65})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke(); }
    }
    for (const p of nodes) { ctx.fillStyle = `rgba(${p.c},.12)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.2832); ctx.fill(); ctx.fillStyle = `rgba(${p.c},.9)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
  };
  const loop = () => { raf = 0; if (!active || document.hidden) { if (active) raf = requestAnimationFrame(loop); return; } frame(true); raf = requestAnimationFrame(loop); };
  const sync = () => {
    const on = !!app.querySelector('.login,.boot'); document.body.classList.toggle('auth', on);
    if (on === active) return; active = on;
    if (on) { size(); if (RM) frame(false); else if (!raf) raf = requestAnimationFrame(loop); }
    else setTimeout(() => { if (!active) ctx.clearRect(0, 0, W, H); }, 800);
  };
  addEventListener('resize', () => { if (active) { size(); if (RM) frame(false); } });
  addEventListener('pointermove', e => { m.x = e.clientX; m.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { m.x = m.y = -999; });
  new MutationObserver(sync).observe(app, { childList: true }); sync();
}
