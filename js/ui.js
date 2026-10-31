/* ===================== 共用工具 ===================== */
const $ = (s, r = document) => r.querySelector(s);
const css = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const FONT = () => `12px ${css('f-mono') || 'monospace'}`;
const FONTB = () => `12px ${css('f-body') || 'sans-serif'}`;
function fit(cv, h) {
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || cv.parentNode.clientWidth;
  const H = typeof h === 'function' ? h(w) : h;
  cv.style.height = H + 'px';
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, H);
  return { ctx, w, h: H, dpr };
}
const tex = (s, display) => { try { return katex.renderToString(s, { output: 'mathml', displayMode: !!display, throwOnError: false }); } catch (e) { return `<code>${s}</code>`; } };
function slider(id, label, min, max, step, val, unit = '') {
  return `<div class="sl"><label for="${id}">${label}</label><output id="${id}-o">${val}${unit}</output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
}
function bindSlider(id, fmt, cb) {
  const el = $('#' + id), o = $('#' + id + '-o');
  const f = () => { const v = +el.value; o.textContent = fmt(v); cb(v); };
  el.addEventListener('input', f); o.textContent = fmt(+el.value);
}
function seg(id, opts, val) { return `<div class="seg" id="${id}" role="group">${opts.map(([k, t]) => `<button type="button" data-k="${k}" class="${k === val ? 'on' : ''}">${t}</button>`).join('')}</div>`; }
function bindSeg(id, cb) {
  const el = $('#' + id);
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.k); });
}
let rafPending = new Set();
function schedule(fn) { if (rafPending.has(fn)) return; rafPending.add(fn); requestAnimationFrame(() => { rafPending.delete(fn); fn(); }); }
const rgb = a => `rgb(${a.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',')})`;
function withAlpha(c, a) {
  if (c.startsWith('#')) { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  return c.replace('rgb(', 'rgba(').replace(')', `,${a})`);
}

/* 折線圖 */
function plot(cv, H, cfg) {
  const { ctx, w, h } = fit(cv, H);
  const m = { l: 46, r: 12, t: 12, b: 34, ...(cfg.m || {}) };
  const X = v => m.l + (v - cfg.x[0]) / (cfg.x[1] - cfg.x[0]) * (w - m.l - m.r);
  const Y = v => h - m.b - (v - cfg.y[0]) / (cfg.y[1] - cfg.y[0]) * (h - m.t - m.b);
  ctx.font = FONT(); ctx.lineWidth = 1;
  ctx.strokeStyle = css('line'); ctx.fillStyle = css('muted');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const t of cfg.xt) { ctx.beginPath(); ctx.moveTo(X(t), m.t); ctx.lineTo(X(t), h - m.b); ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(cfg.xf ? cfg.xf(t) : t, X(t), h - m.b + 5); }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of cfg.yt) { ctx.beginPath(); ctx.moveTo(m.l, Y(t)); ctx.lineTo(w - m.r, Y(t)); ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(cfg.yf ? cfg.yf(t) : t, m.l - 6, Y(t)); }
  ctx.font = FONTB();
  if (cfg.xl) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(cfg.xl, w - m.r, h - 1); }
  if (cfg.yl) { ctx.save(); ctx.translate(11, m.t); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(cfg.yl, 0, 0); ctx.restore(); }
  ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t - 2, w - m.l - m.r, h - m.t - m.b + 4); ctx.clip();
  if (cfg.pre) cfg.pre(ctx, X, Y, w, h, m);
  for (const s of cfg.series) {
    if (!s.pts.length) continue;
    ctx.beginPath(); s.pts.forEach(([a, b], i) => i ? ctx.lineTo(X(a), Y(b)) : ctx.moveTo(X(a), Y(b)));
    if (s.fill) { ctx.lineTo(X(s.pts[s.pts.length - 1][0]), Y(cfg.y[0])); ctx.lineTo(X(s.pts[0][0]), Y(cfg.y[0])); ctx.closePath(); ctx.fillStyle = s.fill; ctx.fill(); continue; }
    ctx.strokeStyle = s.col; ctx.lineWidth = s.w || 2; ctx.setLineDash(s.dash || []); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const v of cfg.vl || []) { ctx.strokeStyle = v.col || css('ink'); ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(v.x), m.t); ctx.lineTo(X(v.x), h - m.b); ctx.stroke(); ctx.setLineDash([]); }
  for (const p of cfg.dots || []) { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r || 4, 0, 7); ctx.fill(); }
  if (cfg.post) cfg.post(ctx, X, Y, w, h, m);
  ctx.restore();
  ctx.strokeStyle = css('muted'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, h - m.b); ctx.lineTo(w - m.r, h - m.b); ctx.stroke();
  return { X, Y, ctx, w, h };
}

/* ===================== 色度圖 ===================== */
const Chroma = (() => {
  const B = { xy: { x: [0, 0.8], y: [0, 0.9] }, uv: { x: [0, 0.65], y: [0, 0.62] } };
  let fillCache = {};
  const tr = (sp, p) => sp === 'uv' ? CIE.toUV(p) : p;
  function draw(cv, o) {
    const sp = o.space;
    const { ctx, w, h, dpr } = fit(cv, W => Math.min(W * 1.02, 520));
    const bb = B[sp], m = { l: 40, r: 10, t: 10, b: 30 };
    const sc = Math.min((w - m.l - m.r) / (bb.x[1] - bb.x[0]), (h - m.t - m.b) / (bb.y[1] - bb.y[0]));
    const ox = m.l, oy = h - m.b;
    const X = v => ox + (v - bb.x[0]) * sc, Y = v => oy - (v - bb.y[0]) * sc;
    const P = p => { const q = tr(sp, p); return [X(q[0]), Y(q[1])]; };
    // 色彩填色（掃描線）
    const loc = CIE.locus.map(L => P(L.xy));
    const key = [w, h, dpr, sp].join();
    if (!fillCache[key]) {
      const W = Math.round(w * dpr), Hh = Math.round(h * dpr), img = new ImageData(W, Hh), poly = loc.map(([a, b]) => [a * dpr, b * dpr]);
      for (let py = 0; py < Hh; py++) {
        const yy = py + .5, xs = [];
        for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; if ((y1 <= yy) !== (y2 <= yy)) xs.push(x1 + (yy - y1) / (y2 - y1) * (x2 - x1)); }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let px = Math.ceil(xs[k]); px < xs[k + 1]; px++) {
          const cx = (px / dpr - ox) / sc + bb.x[0], cy = (oy - py / dpr) / sc + bb.y[0];
          const xy = sp === 'uv' ? CIE.fromUV([cx, cy]) : [cx, cy];
          const c = CIE.xyToRGB(xy[0], xy[1]), j = (py * W + px) * 4;
          img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 235;
        }
      }
      const off = document.createElement('canvas'); off.width = W; off.height = Hh; off.getContext('2d').putImageData(img, 0, 0);
      fillCache = { [key]: off };
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.dim ? .55 : .9; ctx.drawImage(fillCache[key], 0, 0); ctx.restore();
    // 座標軸
    ctx.font = FONT(); ctx.fillStyle = css('muted'); ctx.strokeStyle = css('line'); ctx.lineWidth = 1;
    const tk = sp === 'uv' ? [0, .1, .2, .3, .4, .5, .6] : [0, .1, .2, .3, .4, .5, .6, .7, .8];
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of tk) if (t <= bb.x[1] + 1e-6) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(X(t), m.t); ctx.lineTo(X(t), oy); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(t.toFixed(1), X(t), oy + 4); }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const t of tk) if (t <= bb.y[1] + 1e-6) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(ox, Y(t)); ctx.lineTo(X(bb.x[1]), Y(t)); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(t.toFixed(1), ox - 5, Y(t)); }
    ctx.font = FONTB(); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(sp === 'uv' ? "u′" : 'x', X(bb.x[1]), h - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(sp === 'uv' ? "v′" : 'y', 4, m.t);
    // 光譜軌跡與波長刻度
    ctx.strokeStyle = css('ink'); ctx.lineWidth = 1.4; ctx.beginPath(); loc.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.stroke();
    ctx.font = FONT(); ctx.fillStyle = css('muted');
    const W0 = CIE.locus[0].l;
    for (const l of [460, 480, 490, 500, 510, 520, 540, 560, 580, 600, 620, 700]) {
      const i = l - W0, [a, b] = loc[i], [a2, b2] = loc[Math.min(i + 1, loc.length - 1)], [a0, b0] = loc[Math.max(i - 1, 0)];
      let nx = -(b2 - b0), ny = a2 - a0; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      // 法線朝外（遠離白點）
      const [wx, wy] = P([0.3127, 0.329]); if ((a - wx) * nx + (b - wy) * ny < 0) { nx = -nx; ny = -ny; }
      ctx.strokeStyle = css('ink'); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + nx * 5, b + ny * 5); ctx.stroke();
      ctx.textAlign = nx > 0.3 ? 'left' : nx < -0.3 ? 'right' : 'center'; ctx.textBaseline = ny > 0.3 ? 'top' : ny < -0.3 ? 'bottom' : 'middle';
      ctx.fillText(l, a + nx * 8, b + ny * 8);
    }
    // 標準色域
    const stdCol = { srgb: css('muted'), p3: css('warm'), bt2020: css('ink') };
    for (const k of ['srgb', 'p3', 'bt2020']) if (o.std && o.std[k]) {
      const pts = CIE.STD[k].p.map(P); ctx.strokeStyle = stdCol[k]; ctx.lineWidth = 1.3; ctx.setLineDash(k === 'srgb' ? [2, 3] : k === 'p3' ? [6, 3] : []);
      ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = stdCol[k]; ctx.font = FONT(); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      const g = pts[1]; ctx.fillText(CIE.STD[k].name, g[0] + 6, g[1] - (k === 'srgb' ? -14 : k === 'p3' ? 0 : 2));
    }
    for (const pth of o.paths || []) {
      ctx.strokeStyle = pth.col; ctx.lineWidth = pth.w || 1.5; ctx.setLineDash(pth.dash || []); ctx.beginPath();
      pth.pts.forEach((p, i) => { const [a, b] = P(p); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke(); ctx.setLineDash([]);
      for (const lb of pth.labels || []) { const [a, b] = P(lb.p); ctx.fillStyle = pth.col; ctx.beginPath(); ctx.arc(a, b, 2.2, 0, 7); ctx.fill(); ctx.font = FONT(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(lb.t, a + 4, b + 3); }
    }
    for (const t of o.tris || []) {
      const pts = t.p.map(P); ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
      ctx.fillStyle = withAlpha(css('ink'), .08); ctx.fill(); ctx.strokeStyle = css('accent'); ctx.lineWidth = 2.4; ctx.stroke();
      pts.forEach(([a, b]) => { ctx.fillStyle = css('panel'); ctx.beginPath(); ctx.arc(a, b, 5, 0, 7); ctx.fill(); ctx.strokeStyle = css('accent'); ctx.lineWidth = 2; ctx.stroke(); });
    }
    for (const p of o.points || []) {
      const [a, b] = P(p.xy); ctx.fillStyle = p.fill || css('panel'); ctx.strokeStyle = p.col || css('ink'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(a, b, p.r || 6, 0, 7); ctx.fill(); ctx.stroke();
      if (p.t) { ctx.fillStyle = css('ink'); ctx.font = FONT(); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(p.t, a + 9, b - 4); }
    }
  }
  return { draw };
})();

/* ===================== 主題目錄 ===================== */
const TOPICS = [
  { id: 'vision', n: '1', t: '人眼與光度學' },
  { id: 'color', n: '2', t: '色度學與色域' },
  { id: 'contrast', n: '3', t: '對比與閃爍' },
  { id: 'angle', n: '4', t: '視角與多域' },
  { id: 'frank', n: '5', t: 'Frank 彈性' },
  { id: 'films', n: '6', t: '背光光學膜' },
  { id: 'matrix', n: '7', t: '驅動與矩陣定址' },
  { id: 'pixel', n: '8', t: '畫素電路' },
];
const ANGLE_TABS = [['coords', '4a 量測座標與錐光圖'], ['va', '4b 多域 VA：突起物與開縫'], ['8d', '4c 從四域到八域'], ['ffs', '4d 邊緣電場：IPS 與 FFS']];
let current = null, redraw = null;

function route() {
  let h = (location.hash || '#color').slice(1);
  let [top, sub] = h.split('-');
  if (!TOPICS.find(t => t.id === top)) { top = 'color'; sub = undefined; }
  if (top === 'angle' && !ANGLE_TABS.find(a => a[0] === sub)) sub = 'coords';
  $('#topics').innerHTML = TOPICS.map(t => `<a href="#${t.id}" class="${t.id === top ? 'on' : ''} ${t.soon ? 'soon' : ''}"><b>${t.n}</b>${t.t}</a>`).join('');
  const key = top + (sub ? '-' + sub : '');
  if (key === current) return;
  current = key; redraw = null; if (typeof matAnim !== 'undefined' && matAnim) { cancelAnimationFrame(matAnim); matAnim = null; }
  const main = $('#main');
  if (top === 'color') PageColor(main);
  else if (top === 'angle') PageAngle(main, sub);
  else ({ vision: PageVision, contrast: PageContrast, frank: PageFrank, films: PageFilms, matrix: PageMatrix, pixel: PagePixel })[top](main);
  window.scrollTo(0, 0);
}
function PageSoon(main, t) {
  main.innerHTML = `<div class="page-head"><span class="eyebrow">主題 ${t.n}</span><h2>${t.t}</h2><p>這一頁還在規劃中，先確認第 2 頁與第 4 頁的風格與互動深度後再做。</p></div>
  <div class="card soon-card"><span class="tag">預定的互動</span><ul>${t.plan.map(p => `<li>${p}</li>`).join('')}</ul></div>`;
}

/* ===================== 第 2 頁：色度學 ===================== */
const spaceSeg = id => `<div class="seg c-space" id="${id}" role="group" aria-label="色度座標系">${[['xy', 'CIE 1931 xy'], ['uv', '1976 u′v′']].map(([k, t]) => `<button type="button" data-k="${k}" class="${CS.space === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
const CS = { space: 'xy', mode: 'gauss', lc: 530, fw: 30, cct: 6500, prod: true,
  prim: { r: { c: 630, f: 30 }, g: { c: 530, f: 25 }, b: { c: 450, f: 20 } }, std: { srgb: true, p3: true, bt2020: true } };
function PageColor(main) {
  main.innerHTML = `
  <div class="page-head"><span class="eyebrow">主題 2．W02 + W04</span><h2>從光譜到色度圖，再到色域</h2>
  <p>配色函數、色度圖與 FWHM 是同一條因果鏈：光譜 S(λ) 先和 x̄、ȳ、z̄ 相乘積分成 X、Y、Z，再歸一化成色度座標；三個原色的點圍出色域三角形，而 FWHM 決定每個點離光譜軌跡多遠。</p></div>

  <section class="lab">
    <div class="side">
      <div class="card concept"><h3>2.1　光譜 → XYZ → (x, y)</h3>
        <p>配色實驗得到 CIE 1931 RGB 配色函數，但 r̄ 有負值；CIE 線性轉換成全為正的 <b>x̄、ȳ、z̄</b>，並讓 ȳ 恰好等於 V(λ)，所以 Y 就是亮度。</p>
        <div class="eq">${tex('X=k\\!\\int\\! S(\\lambda)\\,\\bar x(\\lambda)\\,d\\lambda,\\quad Y=k\\!\\int\\! S\\,\\bar y\\,d\\lambda,\\quad Z=k\\!\\int\\! S\\,\\bar z\\,d\\lambda', true)}</div>
        <div class="eq">${tex('x=\\frac{X}{X+Y+Z},\\qquad y=\\frac{Y}{X+Y+Z}', true)}</div>
        <p>色度座標只保留「顏色」，把亮度丟掉；所以色度圖是一張「顏色的地圖」，不是亮度圖。</p>
      </div>
      <div class="card ctl">
        ${seg('c-mode', [['gauss', '高斯單峰光源'], ['bb', '黑體輻射（色溫）']], CS.mode)}
        <div id="c-gauss">${slider('c-lc', '中心波長 λc', 400, 680, 1, CS.lc, ' nm')}${slider('c-fw', '半高寬 FWHM', 1, 150, 1, CS.fw, ' nm')}</div>
        <div id="c-bb" hidden>${slider('c-cct', '色溫 T', 1000, 20000, 100, CS.cct, ' K')}</div>
        <label class="chk"><input type="checkbox" id="c-prod" ${CS.prod ? 'checked' : ''}>顯示乘積 S·x̄、S·ȳ、S·z̄（面積 = X、Y、Z）</label>
      </div>
      <div class="try"><b>試試看：</b>固定 λc = 530 nm，把 FWHM 從 1 拉到 150 nm。色度圖上的點會沿著細線往白點方向縮進去，這就是「光譜越寬、色純度越低」。</div>
    </div>
    <div class="stage">
      <div class="card"><h4>光譜與 CIE 1931 2° 配色函數</h4><canvas id="c-spec"></canvas>
        <div class="legend" style="margin-top:6px"><span><i style="border-color:var(--sx)"></i>x̄(λ)</span><span><i style="border-color:var(--sy)"></i>ȳ(λ) = V(λ)</span><span><i style="border-color:var(--sz)"></i>z̄(λ)</span><span>彩色填色 = S(λ)（峰值歸一）</span></div></div>
      <div class="grid2">
        <div class="card"><div class="card-head"><h4>色度圖</h4>${spaceSeg('c-sp1')}</div><canvas id="c-dia1"></canvas><p class="cap" id="c-dia1-cap"></p></div>
        <div class="card"><h4>讀值</h4><div class="readout" id="c-read"></div>
          <div style="margin-top:12px" id="c-xyzbars"></div>
          <p class="note" style="margin-top:10px">X : Y : Z 以 Y = 100 正規化。u′v′ 由 xy 換算：${tex("u'=\\frac{4x}{-2x+12y+3},\\ v'=\\frac{9y}{-2x+12y+3}")}</p></div>
      </div>
    </div>
  </section>

  <section class="lab">
    <div class="side">
      <div class="card concept"><h3>2.2　FWHM 如何決定色域</h3>
        <p>色域三角形由三個原色的色度點圍成。光譜越窄，點越貼近光譜軌跡；一變寬，點就往內縮，三角形面積下降。</p>
        <ul><li><b>綠光是瓶頸</b>：BT.2020 的綠原色幾乎落在光譜軌跡上，只有很窄的綠光才靠得近。</li>
        <li>筆記的例子：綠 FWHM 25 nm（CdSe 級）→ BT.2020 面積比 96.2%；40 nm（InP 級）→ 89.4%。</li>
        <li><b>三角形由最弱的原色決定</b>：把紅光換成 KSF 只補回約 0.4 個百分點。</li>
        <li><b>指標選擇會掩蓋差異</b>：同樣兩種方案，DCI-P3 覆蓋率幾乎都接近 100%。</li></ul>
        <p class="note">面積比 = 三角形面積 ÷ BT.2020 面積（可超過 100%）；覆蓋率 = 兩者重疊面積 ÷ 標準面積（最多 100%）。</p>
      </div>
    </div>
    <div class="stage">
      <div class="card"><div class="card-head"><h4>三個原色</h4><div class="presets" id="c-pre">
        <button type="button" data-p="cdse">CdSe QD（綠 25 nm）</button><button type="button" data-p="inp">InP QD（綠 40 nm）</button>
        <button type="button" data-p="laser">雷射（2 nm）</button><button type="button" data-p="wide">寬頻（60–80 nm）</button></div></div><div class="prim">
        ${[['r', '紅', 590, 680, 'sx'], ['g', '綠', 490, 575, 'sy'], ['b', '藍', 420, 485, 'sz']].map(([k, n, a, b, c]) => `<div class="p"><h5><i style="background:var(--${c})"></i>${n}原色</h5>
          ${slider('c-' + k + 'c', 'λc', a, b, 1, CS.prim[k].c, ' nm')}${slider('c-' + k + 'f', 'FWHM', 1, 100, 1, CS.prim[k].f, ' nm')}</div>`).join('')}</div>
        <canvas id="c-spec2" style="margin-top:10px"></canvas></div>
      <div class="grid2">
        <div class="card"><div class="card-head"><h4>色域三角形</h4>${spaceSeg('c-sp2')}</div><canvas id="c-dia2"></canvas>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">${['srgb', 'p3', 'bt2020'].map(k => `<label class="chk"><input type="checkbox" id="c-std-${k}" ${CS.std[k] ? 'checked' : ''}>${CIE.STD[k].name}</label>`).join('')}</div></div>
        <div class="card"><h4>色域指標</h4><table class="metrics" id="c-met"></table>
          <h4 style="margin-top:16px">掃描綠光 FWHM（紅、藍固定為目前設定）</h4><canvas id="c-sweep"></canvas>
          <div class="legend"><span><i style="border-color:var(--accent)"></i>BT.2020 面積比</span><span><i style="border-color:var(--ink)"></i>BT.2020 覆蓋率</span><span><i class="d" style="border-color:var(--warm)"></i>DCI-P3 覆蓋率</span></div></div>
      </div>
    </div>
  </section>`;

  const S = () => CS.mode === 'gauss' ? CIE.gauss(CS.lc, CS.fw) : CIE.planck(CS.cct);
  function drawTop() {
    const Sf = S(); let mx = 0; for (const l of CIE.W) mx = Math.max(mx, Sf(l));
    const Sn = l => Sf(l) / mx;
    const XYZ = CIE.xyzOf(Sn), xy = CIE.xyOf(XYZ), uv = CIE.toUV(xy);
    const cmfPts = k => CIE.W.filter(l => l >= 360 && l <= 780).map(l => [l, CMF[k][l - CMF.w0]]);
    plot($('#c-spec'), W => Math.max(220, Math.min(300, W * .38)), {
      x: [360, 780], y: [0, 2], xt: [400, 450, 500, 550, 600, 650, 700, 750], yt: [0, .5, 1, 1.5, 2], xl: '波長 λ (nm)', yl: '相對值',
      pre(ctx, X, Y) {
        for (let l = 360; l <= 780; l++) { const v = Sn(l); if (v < .002) continue; ctx.fillStyle = rgb(CIE.wlRGB(Math.min(Math.max(l, 380), 700))); ctx.globalAlpha = .55; ctx.fillRect(X(l) - .5, Y(v), X(l + 1) - X(l) + 1, Y(0) - Y(v)); }
        ctx.globalAlpha = 1;
        if (CS.prod) for (const [k, c] of [['x', 'sx'], ['y', 'sy'], ['z', 'sz']]) {
          ctx.beginPath(); ctx.moveTo(X(360), Y(0)); for (let l = 360; l <= 780; l += 2) ctx.lineTo(X(l), Y(Sn(l) * CMF[k][l - CMF.w0])); ctx.lineTo(X(780), Y(0)); ctx.closePath();
          ctx.fillStyle = withAlpha(css(c), .22); ctx.fill(); ctx.strokeStyle = withAlpha(css(c), .7); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); for (let l = 360; l <= 780; l++) { const v = Sn(l); l === 360 ? ctx.moveTo(X(l), Y(v)) : ctx.lineTo(X(l), Y(v)); } ctx.strokeStyle = css('ink'); ctx.lineWidth = 1.4; ctx.stroke();
      },
      series: [{ pts: cmfPts('x'), col: css('sx') }, { pts: cmfPts('y'), col: css('sy') }, { pts: cmfPts('z'), col: css('sz') }]
    });
    const paths = [];
    if (CS.mode === 'gauss') { const pts = []; for (let f = 1; f <= 150; f += 2) pts.push(CIE.xyOf(CIE.xyzOf(CIE.gauss(CS.lc, f)))); paths.push({ pts, col: css('ink'), w: 1, dash: [3, 3], labels: [{ p: pts[pts.length - 1], t: '150 nm' }] }); }
    else {
      const pts = []; for (let T = 1000; T <= 25000; T *= 1.06) pts.push(CIE.xyOf(CIE.xyzOf(CIE.planck(T))));
      paths.push({ pts, col: css('ink'), w: 1.2, labels: [2000, 3000, 4000, 6500, 10000].map(T => ({ p: CIE.xyOf(CIE.xyzOf(CIE.planck(T))), t: T + 'K' })) });
    }
    Chroma.draw($('#c-dia1'), { space: CS.space, paths, points: [{ xy: [0.3127, 0.329], r: 3, col: css('muted'), fill: css('muted') }, { xy, r: 7, col: css('ink'), fill: rgb(CIE.xyToRGB(xy[0], xy[1])), t: `(${xy[0].toFixed(3)}, ${xy[1].toFixed(3)})` }] });
    $('#c-dia1-cap').textContent = CS.mode === 'gauss' ? '虛線：同一中心波長下 FWHM 由 1 到 150 nm 的軌跡；灰點為 D65 白點。' : '曲線：普朗克軌跡（黑體色溫由低到高，從紅往藍白移動）；灰點為 D65 白點。';
    const n = 100 / XYZ[1];
    $('#c-read').innerHTML = [['X', XYZ[0] * n], ['Y', 100], ['Z', XYZ[2] * n], ['x', xy[0]], ['y', xy[1]], ['u′', uv[0]], ['v′', uv[1]]].map(([k, v], i) => `<div><small>${k}</small><span>${i < 3 ? v.toFixed(1) : v.toFixed(4)}</span></div>`).join('');
    const tot = XYZ[0] * n + 100 + XYZ[2] * n;
    $('#c-xyzbars').innerHTML = [['X', XYZ[0] * n, 'sx'], ['Y', 100, 'sy'], ['Z', XYZ[2] * n, 'sz']].map(([k, v, c]) => `<div style="font-size:.78rem;display:flex;justify-content:space-between"><span>${k} 佔比</span><span style="font-family:var(--f-mono)">${(v / tot * 100).toFixed(1)}%</span></div><div class="bar"><i style="width:${v / tot * 100}%;background:var(--${c})"></i></div>`).join('');
  }
  const primXY = k => CIE.xyOf(CIE.xyzOf(CIE.gauss(CS.prim[k].c, CS.prim[k].f)));
  function drawBottom() {
    const tri = ['r', 'g', 'b'].map(primXY);
    const G = ['r', 'g', 'b'].map(k => CIE.gauss(CS.prim[k].c, CS.prim[k].f));
    plot($('#c-spec2'), 150, {
      x: [380, 720], y: [0, 1.05], xt: [400, 450, 500, 550, 600, 650, 700], yt: [0, .5, 1], xl: '波長 λ (nm)', m: { l: 34 },
      pre(ctx, X, Y) {
        G.forEach((g, i) => { ctx.beginPath(); ctx.moveTo(X(380), Y(0)); for (let l = 380; l <= 720; l++) ctx.lineTo(X(l), Y(g(l))); ctx.lineTo(X(720), Y(0)); ctx.closePath(); ctx.fillStyle = withAlpha(css(['sx', 'sy', 'sz'][i]), .35); ctx.fill(); ctx.strokeStyle = css(['sx', 'sy', 'sz'][i]); ctx.lineWidth = 1.5; ctx.stroke(); });
      }, series: [['x', 'sx'], ['y', 'sy'], ['z', 'sz']].map(([k, c]) => ({ pts: CIE.W.filter(l => l >= 380 && l <= 720 && l % 2 === 0).map(l => [l, CMF[k][l - CMF.w0] / 1.8]), col: withAlpha(css(c), .45), w: 1, dash: [4, 3] }))
    });
    Chroma.draw($('#c-dia2'), { space: CS.space, std: CS.std, tris: [{ p: tri }], dim: true });
    const bt = CIE.STD.bt2020.p, ar = CIE.area(tri) / CIE.area(bt);
    const uvA = CIE.area(tri.map(CIE.toUV)) / CIE.area(bt.map(CIE.toUV));
    const rows = [['BT.2020 面積比（xy）', ar], ['BT.2020 面積比（u′v′）', uvA], ['BT.2020 覆蓋率', CIE.coverage(tri, bt)], ['DCI-P3 覆蓋率', CIE.coverage(tri, CIE.STD.p3.p)], ['sRGB 覆蓋率', CIE.coverage(tri, CIE.STD.srgb.p)]];
    $('#c-met').innerHTML = rows.map(([k, v]) => `<tr><td>${k}<div class="bar"><i style="width:${Math.min(v, 1) * 100}%"></i></div></td><td>${(v * 100).toFixed(1)}%</td></tr>`).join('');
    const sw = { a: [], c: [], p: [] }, R = primXY('r'), Bb = primXY('b');
    for (let f = 2; f <= 80; f += 2) { const t = [R, CIE.xyOf(CIE.xyzOf(CIE.gauss(CS.prim.g.c, f))), Bb]; sw.a.push([f, CIE.area(t) / CIE.area(bt) * 100]); sw.c.push([f, CIE.coverage(t, bt) * 100]); sw.p.push([f, CIE.coverage(t, CIE.STD.p3.p) * 100]); }
    const ys = [...sw.a, ...sw.c, ...sw.p].map(p => p[1]); const ymin = Math.max(0, Math.floor(Math.min(...ys) / 5) * 5);
    plot($('#c-sweep'), 190, { x: [0, 80], y: [ymin, 105], xt: [0, 20, 40, 60, 80], yt: [ymin, ymin + (105 - ymin) / 2, 100].map(Math.round), xl: '綠光 FWHM (nm)', yl: '%',
      series: [{ pts: sw.a, col: css('accent'), w: 2.2 }, { pts: sw.c, col: css('ink'), w: 1.5 }, { pts: sw.p, col: css('warm'), w: 1.5, dash: [5, 3] }],
      vl: [{ x: CS.prim.g.f, col: css('muted') }], dots: [{ x: CS.prim.g.f, y: ar * 100, col: css('accent') }] });
  }
  redraw = () => { drawTop(); drawBottom(); };
  const syncSpace = k => { CS.space = k; document.querySelectorAll('.c-space button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); redraw(); };
  bindSeg('c-sp1', syncSpace); bindSeg('c-sp2', syncSpace);
  bindSeg('c-mode', k => { CS.mode = k; $('#c-gauss').hidden = k !== 'gauss'; $('#c-bb').hidden = k !== 'bb'; schedule(drawTop); });
  $('#c-gauss').hidden = CS.mode !== 'gauss'; $('#c-bb').hidden = CS.mode !== 'bb';
  bindSlider('c-lc', v => v + ' nm', v => { CS.lc = v; schedule(drawTop); });
  bindSlider('c-fw', v => v + ' nm', v => { CS.fw = v; schedule(drawTop); });
  bindSlider('c-cct', v => v + ' K', v => { CS.cct = v; schedule(drawTop); });
  $('#c-prod').addEventListener('change', e => { CS.prod = e.target.checked; schedule(drawTop); });
  for (const k of ['r', 'g', 'b']) for (const q of ['c', 'f']) bindSlider('c-' + k + q, v => v + ' nm', v => { CS.prim[k][q] = v; schedule(drawBottom); });
  for (const k of ['srgb', 'p3', 'bt2020']) $('#c-std-' + k).addEventListener('change', e => { CS.std[k] = e.target.checked; schedule(drawBottom); });
  const PRE = { cdse: { r: [630, 30], g: [530, 25], b: [450, 20] }, inp: { r: [630, 30], g: [530, 40], b: [450, 20] }, laser: { r: [635, 2], g: [532, 2], b: [467, 2] }, wide: { r: [620, 70], g: [540, 80], b: [455, 60] } };
  $('#c-pre').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const p = PRE[b.dataset.p];
    for (const k of ['r', 'g', 'b']) { CS.prim[k] = { c: p[k][0], f: p[k][1] }; for (const [q, v] of [['c', p[k][0]], ['f', p[k][1]]]) { $('#c-' + k + q).value = v; $('#c-' + k + q + '-o').textContent = v + ' nm'; } }
    schedule(drawBottom); });
  redraw();
}

/* ===================== 第 4 頁：視角 ===================== */
function PageAngle(main, sub) {
  main.innerHTML = `<div class="page-head"><span class="eyebrow">主題 4．W03A + W03B</span><h2>視角：從量測座標到多域與邊緣電場</h2>
  <p>先定義「從哪裡看」（θ、φ 與錐光圖），再看各種 LCD 模式怎麼讓斜視時的畫面不變：VA 用多域讓各方位互相平均、用八域填平 gamma 偏移；IPS/FFS 讓分子只在面內轉，FFS 再用邊緣電場讓電極上方也透光。</p></div>
  <nav class="subtabs">${ANGLE_TABS.map(([k, t]) => `<a href="#angle-${k}" class="${k === sub ? 'on' : ''}">${t}</a>`).join('')}</nav><div id="a-body"></div>`;
  const body = $('#a-body');
  ({ coords: A_coords, va: A_va, '8d': A_8d, ffs: A_ffs })[sub](body);
}

/* ---------- 色階 ---------- */
const CMAP = [[13, 8, 135], [84, 2, 163], [139, 10, 165], [185, 50, 137], [219, 92, 104], [244, 136, 73], [254, 188, 43], [240, 249, 33]];
function cmap(t) { t = Math.max(0, Math.min(1, t)) * (CMAP.length - 1); const i = Math.min(Math.floor(t), CMAP.length - 2), f = t - i; return CMAP[i].map((v, j) => v + (CMAP[i + 1][j] - v) * f); }

/* ---------- 4a ---------- */
const AC = { th: 50, ph: 45, map: 'va', yaw: -40, el: 28 };
const CONO_MAPS = { pol: '只有正交偏光片：暗態漏光', va: 'VA 四域：暗態漏光（無補償）', vac: 'VA 四域：暗態漏光（+A／−C 補償）', cr: 'VA 四域：對比度 CR（無補償）', crc: 'VA 四域：對比度 CR（補償）' };
const conoCache = {};
function conoValue(map, th, ph) {
  if (map === 'pol') return OPT.T([], th, ph) + VA.LEAK;
  const comp = map === 'vac' || map === 'crc';
  const dark = VA.T4(0, th, ph, comp);
  if (map === 'va' || map === 'vac') return dark;
  return VA.T4(7, th, ph, comp) / dark;
}
function conoGrid(map) {
  if (conoCache[map]) return conoCache[map];
  const N = 81, g = new Float64Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i / (N - 1)) * 2 - 1, v = 1 - (j / (N - 1)) * 2, r = Math.hypot(u, v);
    if (r > 1.0001) { g[j * N + i] = NaN; continue; }
    g[j * N + i] = conoValue(map, r * 80, (Math.atan2(v, u) / D2R + 360) % 360);
  }
  return (conoCache[map] = { N, g });
}
function A_coords(body) {
  body.innerHTML = `<section class="lab"><div class="side">
    <div class="card concept"><h3>極角、方位角與錐光圖</h3>
      <ul><li><b>極角 θ</b>：觀看方向與面板法線的夾角，0° 為正視。</li>
      <li><b>方位角 φ</b>：觀看方向在面板平面內的方向；慣例 φ = 0° 為水平向右、90° 為上方。偏光片吸收軸常設在 0° 與 90°。</li>
      <li><b>錐光圖</b>：把整個觀看半球壓成一個圓，半徑代表 θ、圓周代表 φ，一張圖看完所有方向。</li></ul>
      <p>規格「178°」通常指 <b>CR ≥ 10:1</b> 的水平與垂直全視角，不代表色彩與灰階不變。</p></div>
    <div class="card ctl">${slider('a-th', '極角 θ', 0, 80, 1, AC.th, '°')}${slider('a-ph', '方位角 φ', 0, 359, 1, AC.ph, '°')}
      <h4 style="margin:4px 0 0">錐光圖顯示</h4>
      <div style="display:flex;flex-direction:column;gap:6px">${Object.entries(CONO_MAPS).map(([k, t]) => `<label class="chk"><input type="radio" name="a-map" value="${k}" ${AC.map === k ? 'checked' : ''}>${t}</label>`).join('')}</div></div>
    <div class="try"><b>試試看：</b>選「只有正交偏光片」，把 φ 轉到 45°。漏光集中在四個 45° 方位：斜看時兩片偏光片的軸投影不再互相垂直。再切到 VA 無補償與有補償，看 A 板 + −C 板怎麼把它壓下去，CR = 10 的白色等值線也跟著擴張到整個圓。</div>
  </div><div class="stage">
    <div class="grid2">
      <div class="card"><h4>觀看半球（可拖曳旋轉）</h4><canvas id="a-3d"></canvas><p class="cap">灰色方塊為面板；紅、藍虛線為下、上偏光片的吸收軸（沿 φ = 0° 與 90°）。</p></div>
      <div class="card"><h4>錐光圖（點擊可設定 θ、φ）</h4><canvas id="a-cono"></canvas><div id="a-legend" style="margin-top:6px"></div></div>
    </div>
    <div class="card"><div class="readout" id="a-read"></div>
      <p class="note" style="margin-top:8px">模型：理想偏光片 + 擴展瓊斯矩陣（單一傳播方向、忽略多重反射），VA 四域倒向 45°/135°/225°/315°，Δn·d ≈ 0.36 µm；補償膜為 +A（R₀ = 135 nm）與 −C（R<sub>th</sub> = 230 nm），參數由本模型最佳化而得。另加 2×10⁻⁴ 的偏光片消光底限。</p></div>
  </div></section>`;
  const cv3 = $('#a-3d'), cvc = $('#a-cono');
  function draw3d() {
    const { ctx, w, h } = fit(cv3, W => Math.min(W * .9, 380));
    const R = Math.min(w, h) * .36, cx = w / 2, cy = h * .62, yaw = AC.yaw * D2R, el = AC.el * D2R;
    const pr = ([x, y, z]) => { const x1 = x * Math.cos(yaw) - y * Math.sin(yaw), y1 = x * Math.sin(yaw) + y * Math.cos(yaw); return [cx + x1 * R, cy - (z * Math.cos(el) + y1 * Math.sin(el)) * R, y1]; };
    const line = (pts, col, wdt = 1, dash = []) => { ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.setLineDash(dash); ctx.beginPath(); pts.map(pr).forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke(); ctx.setLineDash([]); };
    // 面板
    const s = 1.25, quad = [[-s, -s, 0], [s, -s, 0], [s, s, 0], [-s, s, 0]].map(pr);
    ctx.fillStyle = withAlpha(css('muted'), .14); ctx.beginPath(); quad.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = css('line'); ctx.lineWidth = 1; ctx.stroke();
    line([[-1.2, 0, 0], [1.2, 0, 0]], css('sx'), 3, [6, 4]); line([[0, -1.2, 0], [0, 1.2, 0]], css('sz'), 3, [6, 4]);
    // 半球網格
    const col = withAlpha(css('ink'), .25);
    for (const t of [20, 40, 60, 80, 90]) { const pts = []; for (let p = 0; p <= 360; p += 6) pts.push([Math.sin(t * D2R) * Math.cos(p * D2R), Math.sin(t * D2R) * Math.sin(p * D2R), Math.cos(t * D2R)]); line(pts, t === 90 ? withAlpha(css('ink'), .5) : col); }
    for (let p = 0; p < 360; p += 45) { const pts = []; for (let t = 0; t <= 90; t += 5) pts.push([Math.sin(t * D2R) * Math.cos(p * D2R), Math.sin(t * D2R) * Math.sin(p * D2R), Math.cos(t * D2R)]); line(pts, col); }
    ctx.font = FONT(); ctx.fillStyle = css('muted'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of [0, 90, 180, 270]) { const [a, b] = pr([1.15 * Math.cos(p * D2R), 1.15 * Math.sin(p * D2R), 0]); ctx.fillText(`φ=${p}°`, a, b); }
    line([[0, 0, 0], [0, 0, 1.25]], css('muted'), 1.2); { const [a, b] = pr([0, 0, 1.32]); ctx.fillText('法線 θ=0°', a, b); }
    // 觀看方向
    const t = AC.th * D2R, p = AC.ph * D2R, v = [Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)];
    line([[0, 0, 0], [v[0], v[1], 0]], css('warm'), 1.5, [4, 3]); line([[v[0], v[1], 0], v], css('warm'), 1, [2, 3]);
    const arcT = []; for (let a = 0; a <= 1; a += .05) { const tt = t * a; arcT.push([.42 * Math.sin(tt) * Math.cos(p), .42 * Math.sin(tt) * Math.sin(p), .42 * Math.cos(tt)]); } line(arcT, css('accent'), 2);
    const arcP = []; for (let a = 0; a <= 1; a += .04) arcP.push([.32 * Math.cos(p * a), .32 * Math.sin(p * a), 0]); line(arcP, css('warm'), 2);
    line([[0, 0, 0], v.map(c => c * 1.18)], css('accent'), 2.6);
    const [ex, ey] = pr(v.map(c => c * 1.18)); ctx.fillStyle = css('accent'); ctx.beginPath(); ctx.arc(ex, ey, 6, 0, 7); ctx.fill();
    ctx.fillStyle = css('panel'); ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, 7); ctx.fill();
    ctx.font = `600 13px ${css('f-mono')}`; ctx.fillStyle = css('accent');
    { const [a, b] = pr([.5 * Math.sin(t / 2) * Math.cos(p), .5 * Math.sin(t / 2) * Math.sin(p), .5 * Math.cos(t / 2)]); ctx.fillText('θ', a + 8, b); }
    ctx.fillStyle = css('warm'); { const [a, b] = pr([.42 * Math.cos(p / 2), .42 * Math.sin(p / 2), 0]); ctx.fillText('φ', a, b); }
  }
  function drawCono() {
    const { ctx, w, h, dpr } = fit(cvc, W => Math.min(W * .9, 380));
    const R = Math.min(w, h) / 2 - 22, cx = w / 2, cy = h / 2;
    const { N, g } = conoGrid(AC.map), isCR = AC.map.startsWith('cr');
    const val = v => isCR ? Math.log10(Math.max(v, 1)) / 3.6 : (Math.log10(Math.max(v, 1e-4)) + 4) / 4;
    const off = document.createElement('canvas'); off.width = N; off.height = N; const ox = off.getContext('2d'), img = ox.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { if (isNaN(g[i])) continue; const c = cmap(val(g[i])); img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; }
    ox.putImageData(img, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, cx - R, cy - R, 2 * R, 2 * R); ctx.restore();
    // CR=10 等值線
    if (isCR) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath();
      const L = Math.log10(10), f = (i, j) => Math.log10(Math.max(g[j * N + i], 1)), px = i => cx - R + (i / (N - 1)) * 2 * R, py = j => cy - R + (j / (N - 1)) * 2 * R;
      for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
        const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]; if (c.some(([a, b]) => isNaN(g[b * N + a]))) continue;
        const vs = c.map(([a, b]) => f(a, b)), pts = [];
        for (let k = 0; k < 4; k++) { const a = vs[k], b = vs[(k + 1) % 4]; if ((a < L) !== (b < L)) { const tt = (L - a) / (b - a), [x1, y1] = c[k], [x2, y2] = c[(k + 1) % 4]; pts.push([px(x1 + (x2 - x1) * tt), py(y1 + (y2 - y1) * tt)]); } }
        if (pts.length >= 2) { ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); }
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1;
    for (const t of [20, 40, 60, 80]) { ctx.beginPath(); ctx.arc(cx, cy, R * t / 80, 0, 7); ctx.stroke(); }
    for (let p = 0; p < 360; p += 45) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(p * D2R), cy - R * Math.sin(p * D2R)); ctx.stroke(); }
    ctx.font = FONT(); ctx.fillStyle = css('muted'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of [0, 90, 180, 270]) ctx.fillText(p + '°', cx + (R + 12) * Math.cos(p * D2R), cy - (R + 12) * Math.sin(p * D2R));
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.textAlign = 'left'; for (const t of [40, 80]) ctx.fillText(t + '°', cx + R * t / 80 * .71 + 3, cy + R * t / 80 * .71 - 2);
    const rr = R * AC.th / 80, mx = cx + rr * Math.cos(AC.ph * D2R), my = cy - rr * Math.sin(AC.ph * D2R);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.stroke(); ctx.strokeStyle = css('accent'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.stroke();
    const grad = Array.from({ length: 11 }, (_, i) => `rgb(${cmap(i / 10).map(Math.round).join(',')}) ${i * 10}%`).join(',');
    $('#a-legend').innerHTML = `<div style="height:10px;border-radius:3px;background:linear-gradient(90deg,${grad})"></div><div style="display:flex;justify-content:space-between" class="note">${isCR ? '<span>CR 1</span><span>10</span><span>100</span><span>1000</span><span>≥4000</span>' : '<span>10⁻⁴</span><span>10⁻³</span><span>10⁻²</span><span>10⁻¹</span><span>1</span>'}</div>${isCR ? '<p class="note">白線：CR = 10 等值線（規格「視角」的邊界）</p>' : '<p class="note">暗態穿透率（以正交偏光片最大可能穿透 = 1 歸一）</p>'}`;
    const v = conoValue(AC.map, AC.th, AC.ph);
    $('#a-read').innerHTML = [['θ', AC.th + '°'], ['φ', AC.ph + '°'], [isCR ? '對比度 CR' : '暗態漏光', isCR ? Math.round(v) + ' : 1' : v.toExponential(2)], ['無補償 VA 漏光', VA.T4(0, AC.th, AC.ph, false).toExponential(2)], ['補償後 VA 漏光', VA.T4(0, AC.th, AC.ph, true).toExponential(2)]].map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join('');
  }
  redraw = () => { draw3d(); drawCono(); };
  bindSlider('a-th', v => v + '°', v => { AC.th = v; schedule(redraw); });
  bindSlider('a-ph', v => v + '°', v => { AC.ph = v; schedule(redraw); });
  body.querySelectorAll('input[name=a-map]').forEach(r => r.addEventListener('change', e => { AC.map = e.target.value; schedule(drawCono); }));
  let drag = null;
  cv3.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, AC.yaw, AC.el]; cv3.setPointerCapture(e.pointerId); });
  cv3.addEventListener('pointermove', e => { if (!drag) return; AC.yaw = drag[2] + (e.clientX - drag[0]) * .5; AC.el = Math.max(-5, Math.min(85, drag[3] + (e.clientY - drag[1]) * .4)); schedule(draw3d); });
  cv3.addEventListener('pointerup', () => drag = null);
  cvc.addEventListener('pointerdown', e => {
    const r = cvc.getBoundingClientRect(), R = Math.min(r.width, r.height) / 2 - 22, dx = e.clientX - r.left - r.width / 2, dy = -(e.clientY - r.top - r.height / 2);
    const th = Math.round(Math.min(80, Math.hypot(dx, dy) / R * 80)), ph = Math.round((Math.atan2(dy, dx) / D2R + 360) % 360);
    AC.th = th; AC.ph = ph; $('#a-th').value = th; $('#a-ph').value = ph; $('#a-th-o').textContent = th + '°'; $('#a-ph-o').textContent = ph + '°'; schedule(redraw);
  });
  redraw();
}

/* ---------- 4b ---------- */
const AV = { mode: 'mva', V: 3.5, th: 0, comp: true, lines: true };
function A_va(body) {
  body.innerHTML = `<section class="lab"><div class="side">
    <div class="card concept"><h3>多域化：讓不同區域倒向相反方向</h3>
      <p>單域 VA 加壓後分子都往同一側倒，從那一側看和從反方向看，光走過的延遲差很大，左右不對稱。<b>多域化</b>在同一畫素裡做出倒向不同的區域，讓各方向的誤差互相平均。</p>
      <ul><li><b>MVA（富士通 1997）</b>：基板上的三角形<b>突起物（protrusion）</b>。斜面讓附近分子先有預傾，低介電常數的突起物也讓電場線彎曲；加壓時分子沿突起物兩側往相反方向倒。代價：突起物斜面上的分子在暗態也是斜的，會漏光，並佔去開口率。</li>
      <li><b>PVA（Samsung）</b>：改在 ITO 上<b>開縫</b>，開縫邊緣的電場是斜的（邊緣電場），分子沿斜向電場倒向兩側。免摩擦、暗態漏光少；但開縫附近沒有預傾，倒向要由邊緣傳遞，響應較慢。</li>
      <li>VA 用負型液晶（Δε &lt; 0）：分子轉向<b>垂直於電場</b>的方向，所以電場往哪邊斜，分子就往反方向倒。</li></ul></div>
    <div class="card ctl">${seg('v-mode', [['single', '單域 VA'], ['mva', 'MVA 突起物'], ['pva', 'PVA 開縫']], AV.mode)}
      ${slider('v-V', '驅動電壓', 0, 7, 0.1, AV.V, ' V')}${slider('v-th', '觀看角（倒向平面內）', -70, 70, 1, AV.th, '°')}
      <label class="chk"><input type="checkbox" id="v-comp" ${AV.comp ? 'checked' : ''}>加上 +A／−C 補償膜</label>
      <label class="chk"><input type="checkbox" id="v-lines" ${AV.lines ? 'checked' : ''}>顯示電場線</label></div>
    <div class="try"><b>試試看：</b>先選「單域 VA」，把觀看角從 −40° 拖到 +40°：一邊很亮、一邊幾乎全暗。再切到 MVA 或 PVA，兩個顏色的域各佔一半，下方曲線變成左右對稱。注意突起物正上方與兩域交界處的分子仍是直立的，那裡形成暗線。</div>
  </div><div class="stage">
    <div class="card"><h4>畫素剖面（一個週期 30 µm，縱向放大 1.6 倍）</h4><canvas id="v-cv"></canvas>
      <div class="legend" style="margin-top:6px"><span><i style="border-color:var(--accent);border-top-width:6px"></i>向右倒的域</span><span><i style="border-color:var(--warm);border-top-width:6px"></i>向左倒的域</span><span><i style="border-color:var(--muted)"></i>直立（未倒）</span><span>上方色帶：該位置的穿透率</span></div></div>
    <div class="grid2">
      <div class="card"><h4>穿透率 vs 觀看角（同一電壓）</h4><canvas id="v-ch"></canvas>
        <div class="legend"><span><i style="border-color:var(--ink)"></i>整個畫素平均</span><span><i style="border-color:var(--accent)"></i>向右倒的域</span><span><i style="border-color:var(--warm)"></i>向左倒的域</span><span><i class="d" style="border-color:var(--muted)"></i>單域 VA 對照</span></div></div>
      <div class="card"><h4>讀值</h4><div class="readout" id="v-read"></div>
        <p class="note" style="margin-top:10px">模型：二維靜電場（突起物 ε = 3，液晶 ε = 5.5）求電場方向；指向矢傾角以 sin(πz/d) 分布、倒向由電場斜向決定、域邊界平滑化；穿透率用與 4a 相同的擴展瓊斯計算，倒向平面與偏光片成 45°。這是定性模型，用來看因果，不是元件模擬。</p></div>
    </div>
  </div></section>`;
  const cv = $('#v-cv');
  function streamlines(M) {
    const { F } = M, nx = VAX.nx, nz = VAX.nz, lines = [];
    const E = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi; let ex = 0, ez = 0;
      for (const [dx, dz, w] of [[0, 0, (1 - fx) * (1 - fz)], [1, 0, fx * (1 - fz)], [0, 1, (1 - fx) * fz], [1, 1, fx * fz]]) { const xx = ((xi + dx) % nx + nx) % nx, zz = Math.min(nz - 1, Math.max(0, zi + dz)); ex += w * F.Ex[zz * nx + xx]; ez += w * F.Ez[zz * nx + xx]; }
      return [ex, ez]; };
    for (let x0 = 1.5; x0 < nx; x0 += 4) {
      const z0 = VAX.LC0 - 0.5 + (M.mode === 'pva' && M.slit[Math.floor(x0)] ? -3 : 0) + (M.mode === 'mva' ? M.hb[Math.floor(x0)] : 0);
      let x = x0, z = z0; const pts = [[x, z]];
      for (let s = 0; s < 500; s++) {
        let [ex, ez] = E(x, z); let l = Math.hypot(ex, ez); if (l < 1e-6) break;
        const xm = x + .2 * ex / l, zm = z + .2 * ez / l; [ex, ez] = E(xm, zm); l = Math.hypot(ex, ez); if (l < 1e-6) break;
        x += .4 * ex / l; z += .4 * ez / l; pts.push([x, z]);
        const zi = Math.round(z), xi = ((Math.round(x) % nx) + nx) % nx;
        if (z >= VAX.LC1 - 0.5 && !(M.mode === 'pva' && M.slit[nx + xi])) break;
        if (z > nz - 2 || z < 0) break;
        if (M.mode === 'mva' && M.ht[xi] > 0 && z > VAX.LC1 - M.ht[xi]) break;
      }
      lines.push(pts);
    }
    return lines;
  }
  const lineCache = {};
  function computeChart(M) {
    const ths = []; for (let t = -70; t <= 70; t += 5) ths.push(t);
    const cols = []; for (let x = 1; x < VAX.nx; x += 3) cols.push(x);
    const avg = [], R = [], L = [];
    for (const t of ths) { let s = 0, sr = 0, nr = 0, sl = 0, nl = 0;
      for (const x of cols) { const T = VAX.Tcol(M, AV.V, x, t, AV.comp); s += T; if (M.s[x] > .6) { sr += T; nr++; } else if (M.s[x] < -.6) { sl += T; nl++; } }
      avg.push([t, s / cols.length]); if (nr) R.push([t, sr / nr]); if (nl) L.push([t, sl / nl]); }
    return { ths, avg, R, L };
  }
  function draw() {
    const M = VAX.build(AV.mode);
    if (!lineCache[AV.mode]) lineCache[AV.mode] = streamlines(M);
    const { ctx, w, h } = fit(cv, W => { const sx = (W - 20) / 30; return 86 + sx * 0.2 * VAX.nz * 1.6 + 26; });
    const sx = (w - 20) / (VAX.nx * VAX.DX), cell = sx * VAX.DX, sz = cell * 1.6, ox = 10, top = 86;
    const PX = x => ox + x * cell, PY = z => top + (VAX.nz - z) * sz;
    // 玻璃
    ctx.fillStyle = css('glass'); ctx.fillRect(ox, PY(VAX.nz), VAX.nx * cell, VAX.g * sz); ctx.fillRect(ox, PY(VAX.LC0), VAX.nx * cell, VAX.g * sz);
    ctx.fillStyle = css('lcbg'); ctx.fillRect(ox, PY(VAX.LC1), VAX.nx * cell, VAX.d * sz);
    // ITO
    ctx.fillStyle = css('ito');
    for (let x = 0; x < VAX.nx; x++) { if (!(M.mode === 'pva' && M.slit[x])) ctx.fillRect(PX(x), PY(VAX.LC0) - 1, cell + .5, 4); if (!(M.mode === 'pva' && M.slit[VAX.nx + x])) ctx.fillRect(PX(x), PY(VAX.LC1) - 3, cell + .5, 4); }
    // 突起物
    if (M.mode === 'mva') {
      ctx.fillStyle = css('bump');
      ctx.beginPath(); ctx.moveTo(PX(VAX.BOTX - VAX.BW), PY(VAX.LC0)); ctx.lineTo(PX(VAX.BOTX), PY(VAX.LC0 + VAX.BH)); ctx.lineTo(PX(VAX.BOTX + VAX.BW), PY(VAX.LC0)); ctx.fill();
      ctx.beginPath(); ctx.moveTo(PX(VAX.TOPX - VAX.BW), PY(VAX.LC1)); ctx.lineTo(PX(VAX.TOPX), PY(VAX.LC1 - VAX.BH)); ctx.lineTo(PX(VAX.TOPX + VAX.BW), PY(VAX.LC1)); ctx.fill();
    }
    // 電場線
    if (AV.lines) {
      ctx.strokeStyle = withAlpha(css('ink'), .18 + .3 * Math.min(1, AV.V / 4)); ctx.lineWidth = 1;
      for (const pts of lineCache[AV.mode]) { ctx.beginPath(); let prev = null; for (const [x, z] of pts) { const X = PX(x); if (prev !== null && Math.abs(X - prev) > 40) ctx.moveTo(X, PY(z)); else if (prev === null) ctx.moveTo(X, PY(z)); else ctx.lineTo(X, PY(z)); prev = X; } ctx.stroke(); }
    }
    // 分子
    const L = Math.min(sz * 2.2, cell * 6.5), Wd = Math.max(2, L * .28), cA = css('accent'), cB = css('warm'), cM = css('muted');
    for (let x = 2; x < VAX.nx; x += 5) for (let zc = VAX.LC0 + 1.5; zc < VAX.LC1; zc += 3) {
      const b = VAX.beta(M, AV.V, x, zc); if (b === null) continue;
      const X = PX(x + .5), Yc = PY(zc), dx = Math.sin(b) * L / 2, dy = -Math.cos(b) * L / 2;
      const s = M.s[x], tilt = Math.abs(b) / (Math.PI / 2);
      ctx.strokeStyle = Math.abs(b) < 4 * D2R ? cM : (b > 0 ? cA : cB); ctx.globalAlpha = .45 + .55 * Math.min(1, tilt * 2 + .2);
      ctx.lineWidth = Wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X - dx, Yc - dy); ctx.lineTo(X + dx, Yc + dy); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    // 穿透率色帶
    const Ts = []; for (let x = 0; x < VAX.nx; x += 2) Ts.push([x, VAX.Tcol(M, AV.V, x, AV.th, AV.comp)]);
    const bandY = 18, bandH = 52;
    ctx.fillStyle = css('panel-2'); ctx.fillRect(ox, bandY, VAX.nx * cell, bandH);
    for (const [x, T] of Ts) { const g = Math.round(255 * Math.min(1, T)); ctx.fillStyle = `rgb(${g},${g},${g})`; ctx.fillRect(PX(x), bandY + bandH - Math.min(1, T) * bandH, 2 * cell + .5, Math.min(1, T) * bandH); }
    ctx.strokeStyle = css('line'); ctx.strokeRect(ox, bandY, VAX.nx * cell, bandH);
    ctx.font = FONTB(); ctx.fillStyle = css('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(`從 θ = ${AV.th}° 觀看時，每個位置的穿透率（高度與灰階）`, ox, bandY - 2);
    ctx.textBaseline = 'top'; ctx.fillText('上基板．共通電極 0 V', ox + 4, PY(VAX.nz) + 3);
    ctx.textBaseline = 'bottom'; ctx.fillText(`下基板．畫素電極 ${AV.V.toFixed(1)} V`, ox + 4, PY(0) - 3);
    if (M.mode !== 'single') { ctx.fillStyle = css('ink'); ctx.textAlign = 'center'; const lab = M.mode === 'mva' ? '突起物' : 'ITO 開縫';
      ctx.textBaseline = 'top'; ctx.fillText(lab, PX(VAX.TOPX), PY(VAX.LC1 + 1) + 4); ctx.textBaseline = 'bottom'; ctx.fillText(lab, PX(VAX.BOTX), PY(VAX.LC0 - 1) - 2); }
    // 觀看方向箭頭
    { const ex = w - 26, ey = PY(VAX.LC1) - 4, a = AV.th * D2R, len = 30; ctx.strokeStyle = css('accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex - Math.sin(a) * 6, ey + Math.cos(a) * 6); ctx.lineTo(ex + Math.sin(a) * len * .0 - Math.sin(a) * len, ey - Math.cos(a) * len); ctx.stroke();
      ctx.fillStyle = css('accent'); ctx.beginPath(); ctx.arc(ex - Math.sin(a) * len, ey - Math.cos(a) * len, 4, 0, 7); ctx.fill(); }
    // 圖表
    const C = computeChart(M);
    let ref = null;
    if (AV.mode !== 'single') { const S = VAX.build('single'); ref = []; for (const t of C.ths) { let s = 0, n = 0; for (let x = 1; x < VAX.nx; x += 15) { s += VAX.Tcol(S, AV.V, x, t, AV.comp); n++; } ref.push([t, s / n]); } }
    const ymax = Math.max(.2, ...C.avg.map(p => p[1]), ...C.R.map(p => p[1]), ...C.L.map(p => p[1]), ...(ref || []).map(p => p[1])) * 1.08;
    const yt = [0, +(ymax / 2).toFixed(2), +ymax.toFixed(2)];
    plot($('#v-ch'), 210, { x: [-70, 70], y: [0, ymax], xt: [-60, -30, 0, 30, 60], yt, yf: v => v.toFixed(2), xl: '觀看角 θ (°)', yl: '穿透率',
      series: [...(ref ? [{ pts: ref, col: css('muted'), w: 1.5, dash: [5, 4] }] : []), { pts: C.R, col: css('accent'), w: 1.2 }, { pts: C.L, col: css('warm'), w: 1.2 }, { pts: C.avg, col: css('ink'), w: 2.4 }],
      vl: [{ x: AV.th, col: css('accent') }] });
    const at = t => C.avg.find(p => p[0] === t)[1];
    const tm = VA.thetaM(AV.V) / D2R;
    const fracR = [...M.s].filter(v => v > .6).length / VAX.nx, fracL = [...M.s].filter(v => v < -.6).length / VAX.nx;
    $('#v-read').innerHTML = [['中間層傾角', tm.toFixed(1) + '°'], ['正視穿透率', at(0).toFixed(3)], ['T(+40°)', at(40).toFixed(3)], ['T(−40°)', at(-40).toFixed(3)], ['左右比 T₊/T₋', (at(40) / at(-40)).toFixed(2)], ['向右／向左域', `${Math.round(fracR * 100)}% / ${Math.round(fracL * 100)}%`]].map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join('');
  }
  redraw = draw;
  bindSeg('v-mode', k => { AV.mode = k; schedule(draw); });
  bindSlider('v-V', v => v.toFixed(1) + ' V', v => { AV.V = v; schedule(draw); });
  bindSlider('v-th', v => v + '°', v => { AV.th = v; schedule(draw); });
  $('#v-comp').addEventListener('change', e => { AV.comp = e.target.checked; schedule(draw); });
  $('#v-lines').addEventListener('change', e => { AV.lines = e.target.checked; schedule(draw); });
  draw();
}

/* ---------- 4c ---------- */
const A8 = { gray: 64, th: 60, ph: 0, k: 0.4, a: 0.5, comp: true };
function A_8d(body) {
  body.innerHTML = `<section class="lab"><div class="side">
    <div class="card concept"><h3>色洗：四域補不回來的 gamma 偏移</h3>
      <p>斜視時低灰階的亮度被抬高，gamma 曲線變直，畫面像被洗白；膚色這種由三色不同灰階組成的顏色，三色被抬高的比例不同，合成後顏色也跑掉，這就是<b>色洗（color washout）</b>。</p>
      <p><b>為什麼四域補不回來？</b>低灰階（L64）正視很暗、斜視反而變亮，它的視角曲線形狀和高灰階（L192）很不一樣。四域只能讓各方位對稱，不能讓「各灰階的視角曲線形狀相同」。</p>
      <p><b>對策：子畫素分割（八域）</b>。一個畫素分成 A、B 兩個子畫素，用電荷分享給 B 較低的電壓。兩者分子傾角不同、視角曲線的凹谷位置不同，疊加後凹谷被填平，斜視 gamma 就接近正視。</p>
      <div class="eq">${tex('V_B=k\\,V_A,\\qquad L_{\\text{mix}}(\\theta)=a\\,L_A(\\theta)+(1-a)\\,L_B(\\theta)', true)}</div>
      <p class="note">VA 視角改善的三個層次：多域（4 域）解決左右不對稱與灰階反轉；補償膜解決斜視暗態漏光；子畫素分割（8 域）解決 gamma 偏移與色洗。</p></div>
    <div class="card ctl">
      ${slider('e-th', '觀看極角 θ', 0, 80, 1, A8.th, '°')}
      ${seg('e-ph', [['0', 'φ = 0°（水平）'], ['45', 'φ = 45°'], ['90', 'φ = 90°（垂直）']], String(A8.ph))}
      ${slider('e-k', '電荷分享比 k = V_B／V_A', 0.3, 1, 0.01, A8.k)}
      ${slider('e-a', '子畫素 A 面積比 a', 0.2, 0.8, 0.01, A8.a)}
      ${slider('e-g', '示意灰階（子畫素圖）', 0, 255, 1, A8.gray)}
      <label class="chk"><input type="checkbox" id="e-comp" ${A8.comp ? 'checked' : ''}>加上 +A／−C 補償膜</label></div>
    <div class="try"><b>試試看：</b>把 k 拉到 1（等於沒有分割），八域曲線就和四域重合。再慢慢把 k 降到 0.4 左右，看右上 gamma 曲線往正視曲線（γ = 2.2）靠，下方的膚色色票也跟著恢復。</div>
  </div><div class="stage">
    <div class="grid2">
      <div class="card"><h4>視角–亮度曲線（各灰階以正視亮度歸一）</h4><canvas id="e-c1"></canvas>
        <div class="legend"><span><i style="border-color:var(--warm)"></i>L64 四域</span><span><i class="d" style="border-color:var(--warm)"></i>L64 八域</span><span><i style="border-color:var(--accent)"></i>L192 四域</span><span><i class="d" style="border-color:var(--accent)"></i>L192 八域</span></div></div>
      <div class="card"><h4>gamma 曲線：正視 vs θ 斜視</h4><canvas id="e-c2"></canvas>
        <div class="legend"><span><i style="border-color:var(--ink)"></i>正視（γ = 2.2）</span><span><i style="border-color:var(--warm)"></i>斜視．四域</span><span><i style="border-color:var(--accent)"></i>斜視．八域</span></div></div>
    </div>
    <div class="grid2">
      <div class="card"><h4>色洗：同一組 RGB 灰階在斜視下的樣子</h4><div class="swatches" id="e-sw"></div>
        <div class="swatches" id="e-sw2" style="margin-top:8px"></div><p class="cap">每個通道依各自灰階的斜視亮度重新換算，再以 γ = 2.2 顯示。</p></div>
      <div class="card"><h4>子畫素 A、B（剖面示意）</h4><canvas id="e-sub"></canvas><div class="readout" id="e-read" style="margin-top:8px"></div></div>
    </div>
  </div></section>`;
  let base = null;
  function compute() {
    const { k, a, comp } = A8;
    const f4 = v => VA.T4(v, 0, 0, comp), f8 = v => VA.T8(v, 0, 0, comp, k, a);
    const M4 = f4(VA.P.VMAX), M8 = f8(VA.P.VMAX);
    const V4 = g => VA.solveV(Math.pow(g / 255, 2.2) * M4, f4), V8 = g => VA.solveV(Math.pow(g / 255, 2.2) * M8, f8);
    base = { M4, M8, V4, V8 };
  }
  const ang = (t) => t >= 0 ? [t, A8.ph] : [-t, A8.ph + 180];
  function draw() {
    compute(); const { k, a, comp } = A8, { V4, V8 } = base;
    // 視角曲線
    const series = [];
    for (const [g, col] of [[64, css('warm')], [192, css('accent')]]) {
      const v4 = V4(g), v8 = V8(g), n4 = VA.T4(v4, 0, 0, comp), n8 = VA.T8(v8, 0, 0, comp, k, a), p4 = [], p8 = [];
      for (let t = -80; t <= 80; t += 4) { const [th, ph] = ang(t); p4.push([t, VA.T4(v4, th, ph, comp) / n4]); p8.push([t, VA.T8(v8, th, ph, comp, k, a) / n8]); }
      series.push({ pts: p4, col, w: 2.2 }, { pts: p8, col, w: 1.8, dash: [6, 4] });
    }
    const ym = Math.min(12, Math.max(2, ...series.flatMap(s => s.pts.map(p => p[1])))) * 1.05;
    plot($('#e-c1'), 220, { x: [-80, 80], y: [0, ym], xt: [-80, -40, 0, 40, 80], yt: [0, 1, Math.round(ym / 2), Math.floor(ym)].filter((v, i, ar) => ar.indexOf(v) === i), xl: '觀看角 θ (°)', yl: 'L(θ)／L(0)',
      series, vl: [{ x: A8.th, col: css('muted') }, { x: -A8.th, col: css('muted') }],
      pre(ctx, X, Y) { ctx.strokeStyle = css('line'); ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(X(-80), Y(1)); ctx.lineTo(X(80), Y(1)); ctx.stroke(); ctx.setLineDash([]); } });
    // gamma
    const [th, ph] = ang(A8.th);
    const L4w = VA.T4(V4(255), th, ph, comp), L8w = VA.T8(V8(255), th, ph, comp, k, a);
    const off4 = g => VA.T4(V4(g), th, ph, comp) / L4w, off8 = g => VA.T8(V8(g), th, ph, comp, k, a) / L8w;
    const gs = []; for (let g = 0; g <= 255; g += 8.5) gs.push(Math.round(g));
    const g4 = gs.map(g => [g, off4(g)]), g8 = gs.map(g => [g, off8(g)]), g0 = gs.map(g => [g, Math.pow(g / 255, 2.2)]);
    plot($('#e-c2'), 220, { x: [0, 255], y: [0, 1], xt: [0, 64, 128, 192, 255], yt: [0, .25, .5, .75, 1], xl: '灰階', yl: '歸一亮度',
      series: [{ pts: g0, col: css('ink'), w: 2 }, { pts: g4, col: css('warm'), w: 2 }, { pts: g8, col: css('accent'), w: 2 }] });
    // 色票
    const enc = L => 255 * Math.pow(Math.max(0, Math.min(1, L)), 1 / 2.2);
    const sw = (rgbv, el) => {
      const n = rgbv, o4 = n.map(off4), o8 = n.map(off8);
      $(el).innerHTML = [['正視', n], [`斜視 ${A8.th}°．四域`, o4.map(enc)], [`斜視 ${A8.th}°．八域`, o8.map(enc)]].map(([t, c]) => `<div><i style="background:${rgb(c)}"></i><span>${t}<br>${c.map(v => Math.round(v)).join(', ')}</span></div>`).join('');
    };
    sw([224, 172, 140], '#e-sw'); sw([64, 64, 64], '#e-sw2');
    // 子畫素
    const g = A8.gray, vA = V8(g), vB = k * vA;
    const { ctx, w, h } = fit($('#e-sub'), 170);
    const W1 = (w - 30) * a, W2 = (w - 30) * (1 - a), y0 = 12, y1 = h - 44;
    [[10, W1, vA, 'A'], [20 + W1, W2, vB, 'B']].forEach(([x, ww, v, n]) => {
      ctx.fillStyle = css('lcbg'); ctx.fillRect(x, y0, ww, y1 - y0); ctx.fillStyle = css('ito'); ctx.fillRect(x, y0 - 3, ww, 3); ctx.fillRect(x, y1, ww, 3);
      const tm = VA.thetaM(v), Lr = 22;
      for (let xx = x + 12; xx < x + ww - 6; xx += 16) for (const [zz, side] of [[.3, 1], [.5, 1], [.7, 1]]) {
        const b = VA.P.pre + tm * Math.sin(Math.PI * zz), cx = xx, cy = y1 - (y1 - y0) * zz;
        ctx.strokeStyle = css(n === 'A' ? 'accent' : 'warm'); ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - Math.sin(b) * Lr / 2, cy + Math.cos(b) * Lr / 2); ctx.lineTo(cx + Math.sin(b) * Lr / 2, cy - Math.cos(b) * Lr / 2); ctx.stroke();
      }
      ctx.lineCap = 'butt'; ctx.font = FONT(); ctx.fillStyle = css('ink'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`子畫素 ${n}`, x + 2, y1 + 7); ctx.fillStyle = css('muted'); ctx.fillText(`${v.toFixed(2)} V．傾角 ${(tm / D2R).toFixed(0)}°`, x + 2, y1 + 23);
    });
    $('#e-read').innerHTML = [['灰階', g], ['V_A', vA.toFixed(2) + ' V'], ['V_B', vB.toFixed(2) + ' V'], [`L64 斜視亮度（四域）`, (off4(64) * 100).toFixed(1) + '%'], ['L64 斜視亮度（八域）', (off8(64) * 100).toFixed(1) + '%'], ['L64 正視目標', (Math.pow(64 / 255, 2.2) * 100).toFixed(1) + '%']].map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join('');
  }
  redraw = draw;
  bindSlider('e-th', v => v + '°', v => { A8.th = v; schedule(draw); });
  bindSeg('e-ph', v => { A8.ph = +v; schedule(draw); });
  bindSlider('e-k', v => v.toFixed(2), v => { A8.k = v; schedule(draw); });
  bindSlider('e-a', v => v.toFixed(2), v => { A8.a = v; schedule(draw); });
  bindSlider('e-g', v => v, v => { A8.gray = v; schedule(draw); });
  $('#e-comp').addEventListener('change', e => { A8.comp = e.target.checked; schedule(draw); });
  draw();
}

/* ---------- 4d ---------- */
const AF = { V: 4, lc: 'p', lines: true };
function A_ffs(body) {
  body.innerHTML = `<section class="lab"><div class="side">
    <div class="card concept"><h3>邊緣電場：讓電極上方也透光</h3>
      <ul><li><b>IPS</b>：梳狀畫素電極與共通電極同在下基板、間距約 10 µm，電場水平，分子只在面內旋轉，所以視角好。但電極正上方幾乎沒有水平電場，分子不轉，這一段不透光。</li>
      <li><b>FFS（Fringe Field Switching）</b>：共通電極改成<b>整面透明電極</b>放在下面，上面隔一層絕緣層放<b>狹縫電極</b>，電極寬 w 與間距 L 都小於盒厚。電場從狹縫邊緣彎到下方面電極，形成很強的<b>邊緣電場</b>，同時有水平與垂直分量。</li>
      <li>因為電極窄、間距小，<b>電極正上方的液晶也受水平分量驅動</b>而轉動，加上電極是透明 ITO，穿透率高於 IPS，驅動電壓也較低。</li>
      <li><b>負型液晶 FFS（n-FFS）</b>：正型液晶會順著垂直分量立起，立起的分子不貢獻亮度；負型液晶轉向垂直電場的方向，不會立起，只在面內旋轉，穿透率再提高。代價是 γ₁ 較高、響應較慢，需要的電壓也較高。</li></ul></div>
    <div class="card ctl">${slider('f-V', '驅動電壓', 0, 8, 0.1, AF.V, ' V')}
      ${seg('f-lc', [['p', '正型液晶 Δε > 0'], ['n', '負型液晶 Δε < 0']], AF.lc)}
      <label class="chk"><input type="checkbox" id="f-lines" ${AF.lines ? 'checked' : ''}>顯示電場線</label></div>
    <div class="try"><b>試試看：</b>正型液晶、電壓約 4 V：FFS 已經接近最亮，IPS 還很暗，而且 IPS 電極正上方那一段始終是暗的。把電壓再往上加，FFS 的正型液晶開始被垂直分量拉起來、穿透率反而下降；切成負型液晶，就不會出現這個下降。</div>
  </div><div class="stage">
    <div class="card"><h4>IPS 剖面（w = 4 µm，L = 11 µm）</h4><canvas id="f-ips"></canvas></div>
    <div class="card"><h4>FFS 剖面（狹縫 w = 2.8 µm，L = 4.6 µm，絕緣層 0.6 µm）</h4><canvas id="f-ffs"></canvas>
      <p class="cap">棒狀分子以斜投影繪製：沿紙面深度方向（y）排列的分子看起來較短；轉向電場方向（x）或被拉起時會變長。顏色深淺表示該分子貢獻的穿透率。</p></div>
    <div class="grid2">
      <div class="card"><h4>V–T 曲線</h4><canvas id="f-vt"></canvas>
        <div class="legend"><span><i style="border-color:var(--warm)"></i>IPS</span><span><i style="border-color:var(--accent)"></i>FFS</span><span>實線 = 目前液晶，虛線 = 另一種</span></div></div>
      <div class="card"><h4>讀值</h4><div class="readout" id="f-read"></div>
        <p class="note" style="margin-top:10px">模型：二維靜電場求各位置的水平、垂直場強（沿盒厚加權平均），面內旋轉角由彈性與電場力矩平衡求得（摩擦方向與電場夾 80°），正型液晶另會被垂直分量拉起；T = sin²(2Δφ)·sin²(πΔn<sub>eff</sub>d／λ)，d·Δn = λ/2。定性模型。</p></div>
    </div>
  </div></section>`;
  const lineCache = {};
  function stream(M) {
    const { F, nx } = M, nz = FFS.nz, lines = [];
    const E = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi; let ex = 0, ez = 0;
      for (const [dx, dz, w] of [[0, 0, (1 - fx) * (1 - fz)], [1, 0, fx * (1 - fz)], [0, 1, (1 - fx) * fz], [1, 1, fx * fz]]) { const xx = ((xi + dx) % nx + nx) % nx, zz = Math.min(nz - 1, Math.max(0, zi + dz)); ex += w * F.Ex[zz * nx + xx]; ez += w * F.Ez[zz * nx + xx]; } return [ex, ez]; };
    for (const e of M.elec) { if (e.v !== 1) continue; const step = M.mode === 'ips' ? 2 : 3;
      for (let x0 = e.x0 + .5; x0 < e.x1; x0 += step) {
        let x = x0, z = e.z + 1; const pts = [[x, z]];
        for (let s = 0; s < 700; s++) { let [ex, ez] = E(x, z), l = Math.hypot(ex, ez); if (l < 1e-7) break; const xm = x + .25 * ex / l, zm = z + .25 * ez / l; [ex, ez] = E(xm, zm); l = Math.hypot(ex, ez); if (l < 1e-7) break; x += .5 * ex / l; z += .5 * ez / l; pts.push([x, z]);
          const xi = ((Math.round(x) % nx) + nx) % nx, zi = Math.round(z); if (zi < 0 || zi >= nz - 1) break; if (M.F.V && fixedZero(M, xi, zi)) break; }
        lines.push(pts); } }
    return lines;
  }
  function fixedZero(M, x, z) { for (const e of M.elec) if (e.v === 0 && z === e.z && x >= e.x0 && x < e.x1) return true; return false; }
  function drawCell(cv, mode) {
    const M = FFS.build(mode);
    if (!lineCache[mode]) lineCache[mode] = stream(M);
    const z0 = 13, z1 = 46, nzv = z1 - z0;
    const { ctx, w, h } = fit(cv, W => { const c = (W - 20) / M.nx; return 70 + c * nzv * 1.5 + 30; });
    const cell = (w - 20) / M.nx, sz = cell * 1.5, ox = 10, top = 66;
    const PX = x => ox + x * cell, PY = z => top + (z1 - z) * sz;
    ctx.fillStyle = css('glass'); ctx.fillRect(ox, PY(z1), M.nx * cell, (z1 - FFS.LC1) * sz); ctx.fillRect(ox, PY(FFS.LC0), M.nx * cell, (FFS.LC0 - z0) * sz);
    ctx.fillStyle = css('lcbg'); ctx.fillRect(ox, PY(FFS.LC1), M.nx * cell, FFS.d * sz);
    if (mode === 'ffs') { ctx.fillStyle = withAlpha(css('warm'), .12); ctx.fillRect(ox, PY(FFS.LC0 - 1), M.nx * cell, 3 * sz); }
    for (const e of M.elec) { ctx.fillStyle = e.v ? css('accent') : css('ito'); ctx.fillRect(PX(e.x0), PY(e.z + .5), (e.x1 - e.x0) * cell, Math.max(3, sz * .8)); }
    if (AF.lines) { ctx.strokeStyle = withAlpha(css('ink'), .16 + .25 * Math.min(1, AF.V / 4)); ctx.lineWidth = 1;
      for (const pts of lineCache[mode]) { ctx.beginPath(); let prev = null; for (const [x, z] of pts) { if (z > FFS.LC1 + 1) break; if (z < z0) { prev = null; continue; } const X = PX(((x % M.nx) + M.nx) % M.nx); if (prev === null || Math.abs(X - prev) > 30) ctx.moveTo(X, PY(z)); else ctx.lineTo(X, PY(z)); prev = X; } ctx.stroke(); } }
    // 分子
    const L = Math.min(cell * 7, sz * 4.2);
    for (let x = 2; x < M.nx; x += 5) {
      const st = FFS.state(M, AF.V, AF.lc, x);
      for (const zf of [.18, .4, .6, .82]) {
        const zz = FFS.LC0 + zf * FFS.d, sw = Math.sin(Math.PI * zf), dphi = st.dphi * sw, tilt = st.tilt * sw;
        const phi = AF.lc === 'p' ? (80 * D2R - dphi) : (10 * D2R + dphi);
        const n = [Math.cos(tilt) * Math.cos(phi), Math.cos(tilt) * Math.sin(phi), Math.sin(tilt)];
        const dx = (n[0] + .42 * n[1]) * L / 2, dy = -(n[2] + .25 * n[1]) * L / 2, X = PX(x + .5), Y = PY(zz);
        const contrib = Math.sin(2 * dphi) ** 2 * Math.cos(tilt) ** 2;
        ctx.strokeStyle = css('accent'); ctx.globalAlpha = .25 + .75 * contrib; ctx.lineWidth = Math.max(2.5, L * .22); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X - dx, Y - dy); ctx.lineTo(X + dx, Y + dy); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    // 穿透率曲線
    const bandY = 14, bandH = 40; let sum = 0;
    ctx.fillStyle = css('panel-2'); ctx.fillRect(ox, bandY, M.nx * cell, bandH);
    ctx.beginPath(); ctx.moveTo(PX(0), bandY + bandH);
    for (let x = 0; x < M.nx; x++) { const T = FFS.state(M, AF.V, AF.lc, x).T; sum += T; ctx.lineTo(PX(x + .5), bandY + bandH - T * bandH); }
    ctx.lineTo(PX(M.nx), bandY + bandH); ctx.closePath(); ctx.fillStyle = withAlpha(css('accent'), .35); ctx.fill(); ctx.strokeStyle = css('accent'); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = css('line'); ctx.lineWidth = 1; ctx.strokeRect(ox, bandY, M.nx * cell, bandH);
    for (const e of M.elec) if (!e.plane) { ctx.fillStyle = withAlpha(css('ink'), .07); ctx.fillRect(PX(e.x0), bandY, (e.x1 - e.x0) * cell, bandH); }
    ctx.font = FONTB(); ctx.fillStyle = css('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(`穿透率分布（平均 ${(sum / M.nx).toFixed(2)}）．灰底 = 電極正上方`, ox, bandY - 1);
    ctx.textBaseline = 'top'; ctx.fillStyle = css('muted');
    ctx.fillText(mode === 'ips' ? '藍 = 畫素電極 V，灰 = 共通電極 0 V（同層）' : '藍 = 狹縫畫素電極 V，灰 = 整面共通電極 0 V，橘底 = 絕緣層', ox, PY(z0) + 8);
    return sum / M.nx;
  }
  function draw() {
    const ti = drawCell($('#f-ips'), 'ips'), tf = drawCell($('#f-ffs'), 'ffs');
    const Mi = FFS.build('ips'), Mf = FFS.build('ffs'), other = AF.lc === 'p' ? 'n' : 'p', vs = [];
    for (let v = 0; v <= 8.001; v += .25) vs.push(v);
    const S = (M, lc) => vs.map(v => [v, FFS.avgT(M, v, lc)]);
    plot($('#f-vt'), 210, { x: [0, 8], y: [0, 1], xt: [0, 2, 4, 6, 8], yt: [0, .25, .5, .75, 1], xl: '電壓 (V)', yl: '平均穿透率',
      series: [{ pts: S(Mi, other), col: css('warm'), w: 1.2, dash: [5, 4] }, { pts: S(Mf, other), col: css('accent'), w: 1.2, dash: [5, 4] }, { pts: S(Mi, AF.lc), col: css('warm'), w: 2.2 }, { pts: S(Mf, AF.lc), col: css('accent'), w: 2.2 }],
      vl: [{ x: AF.V, col: css('muted') }], dots: [{ x: AF.V, y: ti, col: css('warm') }, { x: AF.V, y: tf, col: css('accent') }] });
    let vi = 0, vf = 0, bi = 0, bf = 0; for (const [v] of vs.map(v => [v])) { const a = FFS.avgT(Mi, v, AF.lc), b = FFS.avgT(Mf, v, AF.lc); if (a > bi) { bi = a; vi = v; } if (b > bf) { bf = b; vf = v; } }
    $('#f-read').innerHTML = [['IPS 平均穿透率', ti.toFixed(2)], ['FFS 平均穿透率', tf.toFixed(2)], ['IPS 最大值', `${bi.toFixed(2)} @ ${vi.toFixed(1)} V`], ['FFS 最大值', `${bf.toFixed(2)} @ ${vf.toFixed(1)} V`]].map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join('');
  }
  redraw = draw;
  bindSlider('f-V', v => v.toFixed(1) + ' V', v => { AF.V = v; schedule(draw); });
  bindSeg('f-lc', k => { AF.lc = k; schedule(draw); });
  $('#f-lines').addEventListener('change', e => { AF.lines = e.target.checked; schedule(draw); });
  draw();
}

