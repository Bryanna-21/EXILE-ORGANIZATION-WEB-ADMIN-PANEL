const { API_URL, PUBLIC_SITE_URL } = window.EXILE_ADMIN, $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let csrf = '', me = null;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const closeModal = m => { m.classList.add('out'); setTimeout(() => m.remove(), 150); };
const shake = el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 450); };
const toast = (m, e) => { const t = document.createElement('div'); t.className = 'toast' + (e ? ' e' : ''); t.textContent = m; const rm = () => { if (!t.isConnected || t.classList.contains('out')) return; t.classList.add('out'); setTimeout(() => t.remove(), 180); }; t.onclick = rm; $('#toasts').append(t); setTimeout(rm, 3500); };
async function api(method, path, body) {
  let r; try { r = await fetch(API_URL + '/api/admin' + path, { method, credentials: 'include', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: body ? JSON.stringify(body) : undefined }); } catch { throw new Error('Cannot reach the API. Check API_URL in config.js and the backend CORS_ORIGINS.'); }
  const j = await r.json().catch(() => ({})); if (r.status === 401 && path !== '/login') { me = null; login(); throw new Error('Session expired'); }
  if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
}
// Button with SAVE -> SAVING... -> SAVED ✓ / SAVE FAILED
async function withState(btn, fn, idle = 'SAVE') { btn.disabled = true; btn.classList.add('busy'); btn.textContent = 'SAVING...'; try { await fn(); btn.textContent = 'SAVED ✓'; btn.classList.add('done'); } catch (e) { btn.textContent = 'SAVE FAILED'; btn.classList.add('fail'); toast(e.message, 1); } btn.classList.remove('busy'); setTimeout(() => { btn.textContent = idle; btn.disabled = false; btn.classList.remove('done', 'fail'); }, 1400); }
const S = { available: 1, in_development: 1, experimental: 1, research: 1 };
const ENT = {
  products: { label: 'Products', f: [['slug', 'text'], ['name', 'text'], ['icon_url', 'url'], ['short_description', 'text'], ['full_description', 'area'], ['category', 'text'], ['status', ['available', 'in_development', 'experimental', 'research']], ['version', 'text'], ['release_date', 'text'], ['website_url', 'url'], ['docs_url', 'url'], ['github_url', 'url'], ['screenshots', 'lines'], ['sort', 'num'], ['published', 'bool']], cols: ['id', 'slug', 'name', 'status', 'published'] },
  applications: { label: 'Apps (platforms)', f: [['product_id', 'num'], ['platform', 'text'], ['kind', ['file', 'store', 'web', 'github', 'external']]], cols: ['id', 'product_id', 'platform', 'kind'], qr: 1 },
  app_releases: { label: 'Releases', f: [['application_id', 'num'], ['version', 'text'], ['url', 'url'], ['release_date', 'text'], ['active', 'bool']], cols: ['id', 'application_id', 'version', 'url', 'active'] },
  exile_log_entries: { label: 'Exile Log', f: [['date', 'text'], ['title', 'text'], ['description', 'area'], ['category', 'text'], ['image_url', 'url'], ['product_slug', 'text'], ['link_url', 'url'], ['status', 'text'], ['published', 'bool']], cols: ['id', 'date', 'title', 'published'] },
  research_entries: { label: 'Research', f: [['slug', 'text'], ['title', 'text'], ['abstract', 'area'], ['description', 'area'], ['authors', 'text'], ['date', 'text'], ['category', 'text'], ['status', ['research', 'prototype', 'experimental', 'published']], ['link_url', 'url'], ['product_slug', 'text'], ['published', 'bool']], cols: ['id', 'slug', 'title', 'status', 'published'] },
  journal_posts: { label: 'Journal', f: [['slug', 'text'], ['title', 'text'], ['cover_url', 'url'], ['content', 'area'], ['author', 'text'], ['date', 'text'], ['category', ['Engineering', 'Research', 'Product', 'Security', 'Organization', 'Community', 'Announcements']], ['tags', 'text'], ['product_slug', 'text'], ['published', 'bool']], cols: ['id', 'slug', 'title', 'published'] },
  portfolio_projects: { label: 'Portfolio projects', f: [['title', 'text'], ['description', 'area'], ['status', 'text'], ['url', 'url'], ['tech', 'text'], ['sort', 'num'], ['published', 'bool']], cols: ['id', 'title', 'status', 'published'] },
  links: { label: 'Links', f: [['label', 'text'], ['url', 'url'], ['type', 'text'], ['product_slug', 'text'], ['location', 'text'], ['active', 'bool']], cols: ['id', 'label', 'url', 'active'] },
  media: { label: 'Media (URLs)', f: [['label', 'text'], ['url', 'url'], ['alt', 'text'], ['mime', 'text']], cols: ['id', 'label', 'url'] },
};
const PF = [['name', 'text'], ['title', 'text'], ['intro', 'area'], ['bio', 'area'], ['skills', 'lines'], ['technologies', 'lines'], ['experience', 'lines'], ['education', 'lines'], ['achievements', 'lines'], ['publications', 'lines'], ['github', 'url'], ['linkedin', 'url'], ['email', 'text'], ['photo_url', 'url']];
const field = ([n, t], v) => {
  const id = 'f_' + n; let el;
  if (Array.isArray(t)) el = `<select id="${id}">${t.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  else if (t === 'bool') return `<label><input type="checkbox" id="${id}" ${v == null || +v ? 'checked' : ''}> ${n}</label>`;
  else if (t === 'area') el = `<textarea id="${id}">${esc(v)}</textarea>`;
  else if (t === 'lines') el = `<textarea id="${id}" placeholder="One per line">${esc(Array.isArray(v) ? v.join('\n') : '')}</textarea>`;
  else el = `<input id="${id}" type="${t === 'num' ? 'number' : 'text'}" value="${esc(v)}">`;
  return `<label for="${id}">${n}</label>${el}`;
};
const collect = fs => Object.fromEntries(fs.map(([n, t]) => { const e = $('#f_' + n); return [n, t === 'bool' ? e.checked : t === 'lines' ? e.value.split('\n').map(s => s.trim()).filter(Boolean) : t === 'num' ? (e.value === '' ? null : +e.value) : e.value]; }));
const view = (h) => { const m = app.querySelector('main'); m.innerHTML = h; m.classList.remove('vw'); void m.offsetWidth; m.classList.add('vw'); polish(m); };
// Stagger children and count up stat numbers (transform/opacity only; skipped for reduced motion).
function polish(m) {
  const stag = (sel, max) => m.querySelectorAll(sel).forEach((el, i) => el.style.setProperty('--i', Math.min(i, max)));
  stag('.k', 8); stag('.bar', 10); stag('.days i', 30); stag('table tr', 14);
  if (RM) return;
  m.querySelectorAll('.k b').forEach(b => {
    const n = Number(String(b.textContent).replace(/,/g, '')); if (!isFinite(n) || n === 0) return;
    const t0 = performance.now() + 120, d = 800; b.textContent = '0';
    const f = t => { const p = Math.max(0, Math.min(1, (t - t0) / d)); b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });
}

// Password input with a Show/Hide toggle so you can see what you typed.
const pwField = (id, label, auto) => `<label for="${id}">${label}</label><div class="pw"><input id="${id}" type="password" autocomplete="${auto}"><button type="button" class="eye" data-for="${id}" aria-label="Show password" aria-pressed="false">Show</button></div>`;
function wireEyes(root = app) {
  root.querySelectorAll('.eye').forEach(btn => btn.onclick = () => {
    const i = $('#' + btn.dataset.for), show = i.type === 'password'; i.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show'; btn.setAttribute('aria-pressed', show); btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); i.focus();
  });
}
function login(msg = '', ok = false) {
  app.innerHTML = `<div class="login"><img src="logo.png" width="72" alt="Exile"><h1>Exile Admin</h1><label for="em">Email</label><input id="em" type="email" autocomplete="username">${pwField('pw', 'Password', 'current-password')}<p class="${ok ? 'ok' : 'err'}" id="er" role="status">${esc(msg)}</p><button class="btn p" id="go">Sign in</button><p class="alt"><a href="#" id="fg">Forgot password?</a></p></div>`;
  wireEyes();
  const go = async () => { const b = $('#go'); b.disabled = true; b.classList.add('busy'); b.textContent = 'Signing in...'; try { const r = await api('POST', '/login', { email: $('#em').value, password: $('#pw').value }); me = r; csrf = r.csrf; shell(); nav('dash'); } catch (e) { $('#er').className = 'err'; $('#er').textContent = e.message; b.disabled = false; b.classList.remove('busy'); b.textContent = 'Sign in'; shake($('.login')); } };
  $('#go').onclick = go; $('#pw').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  $('#fg').onclick = e => { e.preventDefault(); forgot($('#em').value); };
}
// Forgot password: step 1 asks for the email, step 2 takes the 6-digit code + new password.
function forgot(prefill = '') {
  app.innerHTML = `<div class="login"><img src="logo.png" width="72" alt="Exile"><h1>Reset password</h1><p class="muted">Enter your admin email. We'll send a 6-digit code that expires in 10 minutes.</p><label for="em">Email</label><input id="em" type="email" autocomplete="username" value="${esc(prefill)}"><p class="err" id="er" role="status"></p><button class="btn p" id="go">Send code</button><p class="alt"><a href="#" id="bk">Back to sign in</a></p></div>`;
  $('#bk').onclick = e => { e.preventDefault(); login(); };
  const send = async () => { const b = $('#go'), em = $('#em').value.trim(); if (!em) return; b.disabled = true; b.classList.add('busy'); b.textContent = 'Sending...'; try { await api('POST', '/forgot', { email: em }); resetStep(em, 'If that email belongs to an admin, a code is on its way.'); } catch (e) { $('#er').textContent = e.message; b.disabled = false; b.classList.remove('busy'); b.textContent = 'Send code'; shake($('.login')); } };
  $('#go').onclick = send; $('#em').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}
function resetStep(email, note = '') {
  app.innerHTML = `<div class="login"><img src="logo.png" width="72" alt="Exile"><h1>Enter code</h1><p class="ok" id="nt">${esc(note)}</p><label for="cd">6-digit code</label><input id="cd" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*">${pwField('np', 'New password (12+ characters)', 'new-password')}${pwField('np2', 'Confirm new password', 'new-password')}<p class="err" id="er" role="status"></p><button class="btn p" id="go">Reset password</button><p class="alt"><a href="#" id="rs">Resend code</a> &middot; <a href="#" id="bk">Back to sign in</a></p></div>`;
  wireEyes();
  $('#bk').onclick = e => { e.preventDefault(); login(); };
  $('#rs').onclick = async e => { e.preventDefault(); try { await api('POST', '/forgot', { email }); $('#nt').textContent = 'A new code has been sent (if the email is registered).'; $('#er').textContent = ''; } catch (x) { $('#er').textContent = x.message; } };
  const go = async () => {
    const b = $('#go'), er = $('#er'); er.textContent = '';
    if ($('#np').value.length < 12) { shake($('.login')); return er.textContent = 'Password must be at least 12 characters.'; }
    if ($('#np').value !== $('#np2').value) { shake($('.login')); return er.textContent = 'Passwords do not match.'; }
    b.disabled = true; b.classList.add('busy'); b.textContent = 'Resetting...';
    try { await api('POST', '/reset', { email, code: $('#cd').value.trim(), password: $('#np').value }); login('Password changed. Sign in with your new password.', true); }
    catch (e) { er.textContent = e.message; b.disabled = false; b.classList.remove('busy'); b.textContent = 'Reset password'; shake($('.login')); }
  };
  $('#go').onclick = go; $('#np2').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}
function shell() {
  app.innerHTML = `<div class="shell enter"><header class="mbar"><button type="button" id="mnu" aria-label="Open menu" aria-expanded="false" aria-controls="side">☰</button><img src="logo.png" alt="" width="28" height="28"><b id="mt">Dashboard</b></header><div class="scrim" id="scrim"></div><aside id="side"><img src="logo.png" alt="Exile"><nav aria-label="Admin"><i class="ind" aria-hidden="true"></i>${[['dash', 'Dashboard'], ...Object.entries(ENT).map(([k, v]) => [k, v.label]), ['portfolio', 'Portfolio'], ['settings', 'Site settings'], ['audit', 'Audit log'], ['account', 'Account']].map(([k, l], i) => `<a href="#${k}" data-k="${k}" style="--i:${i}">${l}</a>`).join('')}</nav><p class="row"><small>${esc(me.email)}</small></p><button class="btn" id="out">Sign out</button></aside><main></main></div>`;
  $('#mnu').onclick = () => setMenu(!app.querySelector('.shell').classList.contains('open')); $('#scrim').onclick = () => setMenu(false);
  $('#out').onclick = async () => { try { await api('POST', '/logout'); } catch {} me = null; login(); };
  app.querySelectorAll('aside a').forEach(a => a.onclick = e => { e.preventDefault(); nav(a.dataset.k); });
}
function moveInd() {
  const a = app.querySelector('aside a.on'), i = app.querySelector('.ind'); if (!a || !i) return;
  i.style.transform = `translateY(${a.offsetTop + (a.offsetHeight - 22) / 2}px)`; i.style.opacity = 1;
}
const SK = '<div class="sk" style="width:38%;height:26px"></div><div class="g">' + '<div class="k"><div class="sk" style="height:26px;width:55%"></div><div class="sk" style="height:10px;width:80%"></div></div>'.repeat(4) + '</div><div class="sk" style="height:140px;margin-top:22px"></div><div class="sk" style="height:14px"></div><div class="sk" style="height:14px;width:70%"></div>';
function setMenu(o) { const s = app.querySelector('.shell'); if (!s) return; s.classList.toggle('open', o); const b = $('#mnu'); if (b) { b.setAttribute('aria-expanded', o); b.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); } document.body.classList.toggle('noscroll', o); }
addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
matchMedia('(min-width: 801px)').addEventListener('change', e => e.matches && setMenu(false));
async function nav(k) {
  app.querySelectorAll('aside a').forEach(a => a.classList.toggle('on', a.dataset.k === k)); moveInd();
  const cur = app.querySelector(`aside a[data-k="${k}"]`), t = $('#mt'); if (t && cur) t.textContent = cur.textContent; setMenu(false);
  const late = setTimeout(() => { const m = app.querySelector('main'); if (m) m.innerHTML = SK; }, 160);
  try { await (SCREENS[k] || list)(k); } catch (e) { if (me) view(`<p class="err">${esc(e.message)}</p>`); } finally { clearTimeout(late); }
}
const bars = (rows, k, v) => { const mx = Math.max(1, ...rows.map(r => r[v])); return rows.length ? rows.map(r => `<div class="bar"><span>${esc(r[k])}</span><i style="width:${r[v] / mx * 100}%"></i><b>${r[v]}</b></div>`).join('') : '<p>No data yet.</p>'; };
const SCREENS = {
  async dash() {
    const [s, sys] = await Promise.all([api('GET', '/stats'), api('GET', '/system')]), mx = Math.max(1, ...s.daily.map(d => d.attempts));
    view(`<h1>Dashboard</h1><div class="g">${[['Products', s.products], ['Apps', s.applications], ['Download attempts', s.attempts_total], ['Unique downloads', s.unique_total], ['Today', s.today], ['This week', s.week], ['This month', s.month]].map(([l, v]) => `<div class="k"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <p style="color:var(--fg3)">Counts are redirect events served by the tracked download route; they can't confirm the file finished downloading.</p>
    <h2>Last 30 days</h2><div class="days">${s.daily.map(d => `<i title="${d.day}: ${d.attempts}" style="height:${d.attempts / mx * 100}%"></i>`).join('') || 'No data yet.'}</div>
    <h2>By product</h2>${bars(s.by_product, 'name', 'attempts')}<h2>By platform</h2>${bars(s.by_platform, 'platform', 'attempts')}<h2>By version</h2>${bars(s.by_version.map(r => ({ n: r.name + ' ' + r.version, attempts: r.attempts })), 'n', 'attempts')}<h2>By country</h2>${bars(s.by_country, 'country', 'attempts')}
    <h2>Recent downloads</h2><div class="tw"><table><tr><th>Time</th><th>Product</th><th>Platform</th><th>Version</th><th>Unique</th></tr>${s.recent.map(r => `<tr><td>${new Date(r.ts).toLocaleString()}</td><td>${esc(r.product)}</td><td>${esc(r.platform)}</td><td>${esc(r.version)}</td><td>${r.is_unique ? 'yes' : ''}</td></tr>`).join('')}</table></div>
    <h2>System</h2><p class="sysline"><i class="dot"></i>API: ${sys.api} · DB: ${sys.db} · Storage: ${esc(sys.storage)}</p><h2>Recent admin activity</h2><div class="tw"><table>${s.recent_admin.map(r => `<tr><td>${esc(r.ts)}</td><td>${esc(r.email)}</td><td>${esc(r.action)} ${esc(r.entity)} ${esc(r.entity_id)}</td></tr>`).join('')}</table></div>`);
  },
  async portfolio() {
    const p = await api('GET', '/portfolio'); view(`<h1>Portfolio</h1><p style="color:var(--fg3)">Only enter real information.</p>${PF.map(f => field(f, p[f[0]])).join('')}<div class="row"><button class="btn p" id="sv">SAVE</button></div>`);
    $('#sv').onclick = e => withState(e.target, () => api('PUT', '/portfolio', collect(PF)));
  },
  async settings() {
    const s = await api('GET', '/settings'); const keys = ['tagline', 'about', 'careers', 'contact_email', 'show_public_stats']; view(`<h1>Site settings</h1>${keys.map(k => `<label for="s_${k}">${k}${k === 'show_public_stats' ? ' (1 = show total downloads publicly)' : ''}</label><textarea id="s_${k}">${esc(s[k])}</textarea>`).join('')}<div class="row"><button class="btn p" id="sv">SAVE</button></div>`);
    $('#sv').onclick = e => withState(e.target, () => api('PUT', '/settings', Object.fromEntries(keys.map(k => [k, $('#s_' + k).value]))));
  },
  async audit() { const r = await api('GET', '/audit'); view(`<h1>Audit log</h1><div class="tw"><table><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th><th>Meta</th></tr>${r.map(x => `<tr><td>${esc(x.ts)}</td><td>${x.admin_id}</td><td>${esc(x.action)}</td><td>${esc(x.entity)} ${esc(x.entity_id)}</td><td>${esc(x.meta)}</td></tr>`).join('')}</table></div>`); },
  async account() {
    view(`<h1>Account</h1>${pwField('cu', 'Current password', 'current-password')}${pwField('nx', 'New password (12+ chars)', 'new-password')}<div class="row"><button class="btn p" id="sv">SAVE</button></div>`); wireEyes();
    $('#sv').onclick = e => withState(e.target, async () => { await api('POST', '/password', { current: $('#cu').value, next: $('#nx').value }); $('#cu').value = $('#nx').value = ''; });
  },
};
async function list(k, off = 0) {
  const E = ENT[k], r = await api('GET', `/${k}?limit=25&offset=${off}`);
  view(`<h1>${E.label}</h1><div class="row"><button class="btn p" id="add">+ Add</button></div><div class="tw"><table><tr>${E.cols.map(c => `<th>${c}</th>`).join('')}<th></th></tr>${r.rows.map(x => `<tr>${E.cols.map(c => `<td>${esc(x[c])}</td>`).join('')}<td><button class="btn" data-e="${x.id}">Edit</button>${E.qr ? ` <button class="btn" data-q="${x.id}">QR</button>` : ''}</td></tr>`).join('')}</table></div>
  <div class="row"><button class="btn" id="pv" ${off ? '' : 'disabled'}>← Prev</button><span>${r.total} total</span><button class="btn" id="nx" ${off + 25 < r.total ? '' : 'disabled'}>Next →</button></div>`);
  $('#add').onclick = () => form(k); $('#pv').onclick = () => list(k, off - 25); $('#nx').onclick = () => list(k, off + 25);
  app.querySelectorAll('[data-e]').forEach(b => b.onclick = () => form(k, r.rows.find(x => x.id == b.dataset.e)));
  app.querySelectorAll('[data-q]').forEach(b => b.onclick = () => qr(r.rows.find(x => x.id == b.dataset.q)));
}
function form(k, row) {
  const E = ENT[k]; view(`<h1>${row ? 'Edit' : 'Add'} ${E.label}</h1>${E.f.map(f => field(f, row?.[f[0]])).join('')}<div class="row"><button class="btn p" id="sv">SAVE</button><button class="btn" id="bk">Back</button>${row ? '<button class="btn d" id="del">Delete</button>' : ''}</div>`);
  $('#bk').onclick = () => list(k);
  $('#sv').onclick = e => withState(e.target, async () => { const b = collect(E.f); const s = row ? await api('PUT', `/${k}/${row.id}`, b) : await api('POST', `/${k}`, b); row = s; });
  if (row) $('#del').onclick = () => { const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div role="alertdialog" aria-modal="true"><h3>Delete this item?</h3><p>This cannot be undone.</p><div class="row" style="justify-content:center"><button class="btn" id="c">Cancel</button><button class="btn d" id="y">Delete</button></div></div>`; document.body.append(m); m.querySelector('#c').focus(); m.querySelector('#c').onclick = () => closeModal(m); m.addEventListener('click', e => e.target === m && closeModal(m)); m.querySelector('#y').onclick = async () => { try { await api('DELETE', `/${k}/${row.id}`); closeModal(m); toast('Deleted successfully'); list(k); } catch (e) { toast(e.message, 1); } }; };
}
async function qr(a) {
  const p = (await api('GET', `/products/${a.product_id}`)), url = `${PUBLIC_SITE_URL}/download/${p.slug}/${a.platform}`, m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div role="dialog" aria-modal="true"><h3>${esc(p.name)} · ${esc(a.platform)}</h3><div class="qr" id="qb"></div><p style="word-break:break-all">${esc(url)}</p><div class="row" style="justify-content:center"><button class="btn" id="cp">Copy URL</button><button class="btn" id="dl">Download PNG</button><button class="btn" id="rg">Regenerate</button><button class="btn p" id="cl">Close</button></div></div>`; document.body.append(m);
  m.querySelector('#cl').onclick = () => closeModal(m); m.addEventListener('click', e => e.target === m && closeModal(m)); m.querySelector('#cp').onclick = () => navigator.clipboard.writeText(url).then(() => toast('Link copied'));
  m.querySelector('#rg').onclick = async () => { try { await api('POST', `/qr/${a.id}`); toast('QR regenerated'); } catch (e) { toast(e.message, 1); } };
  await new Promise((ok, no) => { if (window.QRCode) return ok(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = ok; s.onerror = no; document.head.append(s); }).catch(() => toast('QR library failed to load', 1));
  if (window.QRCode) { new QRCode(m.querySelector('#qb'), { text: url, width: 220, height: 220 }); m.querySelector('#dl').onclick = () => { const c = m.querySelector('#qb canvas'); const l = document.createElement('a'); l.download = `${p.slug}-${a.platform}-qr.png`; l.href = c.toDataURL('image/png'); l.click(); }; }
}
(async () => { try { const r = await fetch(API_URL + '/api/admin/me', { credentials: 'include' }); if (!r.ok) throw 0; me = await r.json(); csrf = me.csrf; shell(); nav('dash'); } catch { login(); } })();
