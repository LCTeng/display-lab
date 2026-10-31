/* ===================== 第 1、3、5、6、7、8 頁 ===================== */
const lab = (ctl, tryT, concept, stage) => `<section class="lab"><div class="side">
  <div class="card ctl">${ctl}</div>${tryT ? `<div class="try"><b>試試看：</b>${tryT}</div>` : ''}<div class="card concept">${concept}</div></div>
  <div class="stage">${stage}</div></section>`;
const head = (eb, t, p) => `<div class="page-head"><span class="eyebrow">${eb}</span><h2>${t}</h2><p>${p}</p></div>`;
const reads = (el, rows) => { $(el).innerHTML = rows.map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join(''); };
const fmtSI = (v, d = 3) => { if (!isFinite(v)) return '—'; const a = Math.abs(v); if (a === 0) return '0'; if (a >= 1e5 || a < 1e-2) return v.toExponential(2).replace('e+', '×10^').replace('e-', '×10^-'); return (+v.toPrecision(d)).toLocaleString('en-US'); };
const sup = s => s.replace(/\^(-?\d+)/, (m, e) => '<sup>' + e + '</sup>');
const logSlider = (id, label, lo, hi, val, unit) => slider(id, label, Math.log10(lo), Math.log10(hi), 0.01, Math.log10(val), unit);
const hTitle = t => `<h3 class="sec-title">${t}</h3>`;
const visAt = (arr, l) => { const i = (l - VIS.w0) / VIS.step; if (i < 0 || i > arr.length - 1) return 0; const i0 = Math.floor(i), f = i - i0; return arr[i0] * (1 - f) + (arr[Math.min(i0 + 1, arr.length - 1)] || 0) * f; };
const Vph = l => { const i = Math.round(l) - CMF.w0; return i >= 0 && i < CMF.y.length ? CMF.y[i] : 0; };

/* ---------- 1 人眼與光度學 ---------- */
const PV = { lum: 1, cones: true, lam: 555, P: 1000, beam: 60, r: 1, tilt: 0, rho: 0.8, area: 1 };
function PageVision(main) {
  main.innerHTML = head('主題 1．W02', '人眼與光度學：從感光細胞到 lm、cd、lx、nit', '人眼的光譜敏感度 V(λ) 是把「物理功率」換成「看起來多亮」的權重，所以光度學的四個量都建立在人的視覺上。這一頁先看感光細胞與明暗視覺，再沿著一顆光源把 lm → cd → lx → cd/m² 逐層展開。') +
  hTitle('1.1　感光細胞與明視覺、中介視覺、暗視覺') +
  lab(`${logSlider('v-lum', '環境亮度（對數）', 1e-5, 1e4, PV.lum, '')}<label class="chk"><input type="checkbox" id="v-cones" ${PV.cones ? 'checked' : ''}>顯示 L、M、S 錐狀細胞響應</label><div class="readout" id="v-read"></div>`,
    '把亮度從 1000 cd/m² 慢慢拉到 0.001 cd/m²。敏感度峰值從 555 nm 移到 507 nm（Purkinje 位移），右下的紅花先變暗、葉子相對變亮，最後兩者都失去顏色。',
    `<h3>視網膜上的兩種感光細胞</h3><ul><li><b>錐狀細胞</b>（約 600 萬個）負責色覺與明視覺，集中在中心窩；L : M : S 約 32 : 16 : 1，S 很少，所以藍色的空間解析度較低。</li>
    <li><b>桿狀細胞</b>（1 億個以上）負責低照度，中心窩中央沒有，離中心約 20° 處最密，所以夜晚看暗星要用眼角。</li>
    <li>視神經離開處（視盤）沒有感光細胞，形成<b>盲點</b>。</li></ul>
    <p><b>為什麼暗處看不到顏色？</b>顏色要比較三種錐狀細胞的反應；桿狀細胞只有一種，只能告訴大腦「多亮」。</p>
    <p><b>階段說</b>：受光器層是 L、M、S 三原色反應，後段神經轉成「一個亮度＋兩個色差」訊號；Y′CbCr 與 4:2:0 色度降取樣就是模仿這個結構。</p>`,
    `<div class="card"><h4>光譜敏感度（各曲線峰值歸一）</h4><canvas id="v-c1"></canvas>
      <div class="legend"><span><i style="border-color:var(--ink);border-top-width:3px"></i>目前亮度下的有效敏感度</span><span><i style="border-color:var(--sy)"></i>V(λ) 明視覺</span><span><i class="d" style="border-color:var(--sz)"></i>V′(λ) 暗視覺</span><span><i style="border-color:var(--sx);opacity:.6"></i>L</span><span><i style="border-color:var(--sy);opacity:.6"></i>M</span><span><i style="border-color:var(--sz);opacity:.6"></i>S</span></div></div>
    <div class="grid2"><div class="card"><h4>錐狀與桿狀細胞的分布（示意）</h4><canvas id="v-c2"></canvas><p class="cap">形狀依 Østerberg（1935）的量測趨勢繪製；鼻側約 15° 處的空缺是盲點。</p></div>
    <div class="card"><h4>黃昏的紅花與綠葉</h4><canvas id="v-c3"></canvas><p class="cap" id="v-c3cap"></p></div></div>
    <div class="card"><table class="metrics" id="v-tab"></table></div>`) +
  hTitle('1.2　光度四個量：lm → cd → lx → cd/m²') +
  lab(`${slider('v-lam', '光源波長 λ', 400, 700, 1, PV.lam, ' nm')}${logSlider('v-P', '輻射功率', 1, 3000, PV.P, '')}
    ${slider('v-beam', '光束全角', 10, 180, 1, PV.beam, '°')}${slider('v-r', '到受光面的距離 r', 0.2, 5, 0.05, PV.r, ' m')}
    ${slider('v-tilt', '受光面傾角 α', 0, 80, 1, PV.tilt, '°')}${slider('v-rho', '受光面反射率 ρ', 0.02, 0.95, 0.01, PV.rho)}`,
    '把波長從 555 nm 拉到 450 nm，功率不變，流明掉到約 4%：藍光很耗能卻「看起來不亮」。再把光束收窄，cd 變大但 lm 不變；把距離加倍，照度變成 1/4。',
    `<h3>四個量只差在「對什麼歸一化」</h3>
    <div class="eq">${tex('\\Phi_v=683\\,\\tfrac{\\text{lm}}{\\text{W}}\\int\\Phi_e(\\lambda)V(\\lambda)d\\lambda', true)}</div>
    <ul><li><b>光通量 Φ<sub>v</sub>（lm）</b>：光源總輸出。</li><li><b>發光強度 I（cd = lm/sr）</b>：單位立體角，描述指向性。</li>
    <li><b>照度 E（lx = lm/m²）</b>：受光面單位面積接收的光，照度計量的就是它。</li><li><b>亮度 L（cd/m²，nit）</b>：單位面積、單位立體角，描述「看起來多亮」，顯示器規格用這個。</li></ul>
    <p><b>兩個不可混的觀念</b>：由光度量無法反推輻射度量（V(λ) 積分把光譜資訊丟掉了）；看光源用強度與亮度，看受光面用照度，兩者要經反射率換算：朗伯面 ${tex('L=\\rho E/\\pi')}。</p>`,
    `<div class="card"><h4>光源 → 受光面 → 眼睛</h4><canvas id="v-scene"></canvas></div>
    <div class="card"><h4>逐層換算</h4><div class="chain" id="v-chain"></div></div>`);
  const W = []; for (let l = 380; l <= 780; l += 2) W.push(l);
  const mesoX = L => L >= 3.4 ? 1 : L <= 0.034 ? 0 : Math.log10(L / 0.034) / 2;
  const regime = L => L >= 3.4 ? '明視覺' : L > 0.034 ? '中介視覺' : '暗視覺';
  function vision() {
    const L = Math.pow(10, PV.lumLog ?? Math.log10(PV.lum)), x = mesoX(L);
    const vm = W.map(l => x * Vph(l) + (1 - x) * visAt(VIS.vs, l)); const mx = Math.max(...vm);
    const eff = W.map((l, i) => [l, vm[i] / mx]); const pk = eff.reduce((a, b) => b[1] > a[1] ? b : a)[0];
    const series = [{ pts: W.map(l => [l, Vph(l)]), col: css('sy'), w: 1.4 }, { pts: W.map(l => [l, visAt(VIS.vs, l)]), col: css('sz'), w: 1.4, dash: [5, 4] }];
    if (PV.cones) for (const [k, c] of [['L', 'sx'], ['M', 'sy'], ['S', 'sz']]) series.push({ pts: W.map(l => [l, visAt(VIS[k], l)]), col: withAlpha(css(c), .55), w: 1 });
    series.push({ pts: eff, col: css('ink'), w: 3 });
    plot($('#v-c1'), W0 => Math.max(220, Math.min(290, W0 * .36)), { x: [380, 780], y: [0, 1.05], xt: [400, 450, 500, 550, 600, 650, 700, 750], yt: [0, .5, 1], xl: '波長 λ (nm)', yl: '相對敏感度', series,
      pre(ctx, X, Y) { for (let l = 380; l < 780; l += 2) { ctx.fillStyle = rgb(CIE.wlRGB(Math.min(700, l))); ctx.globalAlpha = .12; ctx.fillRect(X(l), Y(1.05), X(l + 2) - X(l) + .5, 6); } ctx.globalAlpha = 1; },
      vl: [{ x: pk, col: css('ink') }] });
    // 視網膜分布
    const cone = e => 4000 + 150000 * Math.exp(-Math.abs(e) / 1.1) + 8000 * Math.exp(-Math.abs(e) / 12);
    const rod = e => { const a = Math.abs(e); return 160000 * (a / 18) * Math.exp(1 - a / 18) * (1 - Math.exp(-a / 1.2)); };
    const bs = e => e > 12.5 && e < 17.5 ? 0 : 1;
    const E = []; for (let e = -80; e <= 80; e += .5) E.push(e);
    plot($('#v-c2'), 210, { x: [-80, 80], y: [0, 180], xt: [-80, -40, -20, 0, 20, 40, 80], yt: [0, 50, 100, 150], xl: '離中心窩角度（°，正為鼻側）', yl: '密度（千/mm²）', m: { l: 42 },
      series: [{ pts: E.map(e => [e, rod(e) * bs(e) / 1000]), col: css('sz'), w: 2 }, { pts: E.map(e => [e, cone(e) * bs(e) / 1000]), col: css('warm'), w: 2 }],
      post(ctx, X, Y) { ctx.font = FONTB(); ctx.fillStyle = css('sz'); ctx.textAlign = 'left'; ctx.fillText('桿狀', X(36), Y(140)); ctx.fillStyle = css('warm'); ctx.textAlign = 'right'; ctx.fillText('錐狀（中心窩）', X(-3), Y(150)); ctx.textAlign = 'left'; ctx.fillStyle = css('muted'); ctx.fillText('盲點', X(13), Y(20)); } });
    // 紅花綠葉
    const refl = (c, w) => l => Math.exp(-0.5 * ((l - c) / w) ** 2);
    const lumOf = (R, wf) => W.reduce((s, l, i) => s + R(l) * wf(l, i), 0);
    const wM = (l, i) => vm[i], wP = l => Vph(l);
    const red = refl(625, 35), leaf = refl(505, 35);
    const k = L >= 3.4 ? 1 : Math.max(0.08, Math.pow(Math.max(L, 1e-5) / 3.4, 0.18));
    const brR = lumOf(red, wM) / lumOf(red, wP), brG = lumOf(leaf, wM) / lumOf(leaf, wP);
    const norm = Math.max(brR, brG);
    const paint = (base, br) => { const g = 0.3 * base[0] + 0.59 * base[1] + 0.11 * base[2]; const sat = x; return base.map(c => (g + (c - g) * sat) * br / norm * k); };
    const { ctx, w, h } = fit($('#v-c3'), 210);
    ctx.fillStyle = rgb([8, 10, 14].map(v => v + 30 * k)); ctx.fillRect(0, 0, w, h);
    const cR = rgb(paint([210, 40, 50], brR)), cG = rgb(paint([40, 170, 120], brG));
    const cx = w * .5, cy = h * .45;
    ctx.fillStyle = cG; for (const [a, s] of [[-2.4, 1], [-0.7, -1]]) { ctx.save(); ctx.translate(cx + s * 70, cy + 40); ctx.rotate(a * s); ctx.beginPath(); ctx.ellipse(0, 0, 60, 22, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = cG; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy + 20); ctx.lineTo(cx, h); ctx.stroke();
    ctx.fillStyle = cR; for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.ellipse(0, -30, 18, 32, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = rgb(paint([230, 200, 60], 1)); ctx.beginPath(); ctx.arc(cx, cy, 13, 0, 7); ctx.fill();
    $('#v-c3cap').textContent = `目前「紅花 / 綠葉」的相對亮度比為 ${(brR / brG).toFixed(2)}（明視覺為 1.00）；顏色飽和度依錐狀細胞參與比例縮減。`;
    reads('#v-read', [['亮度', fmtSI(L) + ' cd/m²'], ['區域', regime(L)], ['峰值', pk + ' nm'], ['作用細胞', x >= 1 ? '錐狀' : x <= 0 ? '桿狀' : '錐狀＋桿狀']]);
    const rows = [['', '明視覺 photopic', '中介視覺 mesopic', '暗視覺 scotopic'], ['作用細胞', '錐狀細胞', '錐狀＋桿狀', '桿狀細胞'], ['亮度範圍', '3.4–10⁶ cd/m²', '0.034–3.4 cd/m²', '3.4×10⁻⁶–0.034'], ['峰值波長', '555 nm', '介於兩者', '507 nm'], ['色覺', '有、視銳度佳', '減弱', '無、視銳度差']];
    const col = ['明視覺', '中介視覺', '暗視覺'].indexOf(regime(L)) + 1;
    $('#v-tab').innerHTML = rows.map((r, i) => `<tr>${r.map((c, j) => `<td style="text-align:left;font-family:var(--f-body);${j === col ? 'background:var(--accent-soft);' : ''}${i === 0 ? 'font-weight:700' : ''}">${c}</td>`).join('')}</tr>`).join('');
  }
  function photo() {
    const Vl = Vph(PV.lam), P = PV.P / 1000, Pv = 683 * Vl * P;
    const half = PV.beam / 2 * D2R, Om = 2 * Math.PI * (1 - Math.cos(half)), I = Pv / Om;
    const inBeam = Math.atan2(0, 1) <= half; const E = I * Math.cos(PV.tilt * D2R) / PV.r ** 2, Ls = PV.rho * E / Math.PI, Lsrc = I / (PV.area * 1e-6);
    const { ctx, w, h } = fit($('#v-scene'), W0 => Math.min(260, Math.max(200, W0 * .32)));
    const sx = 40, sy = h / 2, scale = (w - 170) / 5.2, tx = sx + PV.r * scale, col = rgb(CIE.wlRGB(PV.lam));
    const g = ctx.createLinearGradient(sx, 0, tx, 0); g.addColorStop(0, withAlpha(col, .55)); g.addColorStop(1, withAlpha(col, .08));
    const spread = Math.tan(Math.min(half, 80 * D2R)) * (tx - sx);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, sy - spread); ctx.lineTo(tx, sy + spread); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, 7); ctx.fill(); ctx.strokeStyle = css('ink'); ctx.lineWidth = 1; ctx.stroke();
    // 受光面
    const a = PV.tilt * D2R, Lp = 70; ctx.strokeStyle = css('ink'); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(tx - Math.sin(a) * Lp, sy - Math.cos(a) * Lp); ctx.lineTo(tx + Math.sin(a) * Lp, sy + Math.cos(a) * Lp); ctx.stroke();
    ctx.strokeStyle = css('muted'); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(tx, sy); ctx.lineTo(tx - Math.cos(a) * 46, sy + Math.sin(a) * 46); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = FONT(); ctx.fillStyle = css('muted'); ctx.textAlign = 'center'; ctx.fillText(`r = ${PV.r.toFixed(2)} m`, (sx + tx) / 2, sy + 4 + Math.min(spread, h / 2 - 20) + 12 > h - 6 ? h - 8 : sy + Math.min(spread, h / 2 - 30) + 16);
    ctx.fillText('法線', tx - Math.cos(a) * 54, sy + Math.sin(a) * 54 - 6);
    // 眼睛
    const ex = w - 50, ey = sy - 50; ctx.strokeStyle = css('ink'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(ex, ey, 16, 9, 0, 0, 7); ctx.stroke(); ctx.fillStyle = css('ink'); ctx.beginPath(); ctx.arc(ex - 4, ey, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = withAlpha(css('ink'), .4); ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(tx + 4, sy); ctx.lineTo(ex - 18, ey); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = css('ink'); ctx.textAlign = 'left'; ctx.font = FONTB();
    ctx.fillText('光源', sx - 14, sy - 18); ctx.fillText('受光面', tx + 10, sy + Lp * .7); ctx.fillText('觀察者', ex - 18, ey - 18);
    const tile = (t, u, v, f, note) => `<div class="tile"><small>${t}</small><b>${v}</b><span>${u}</span><div class="eq">${f}</div><em>${note}</em></div>`;
    $('#v-chain').innerHTML =
      tile('光通量 Φv', 'lm', sup(fmtSI(Pv)), tex('683\\cdot V(\\lambda)\\cdot P'), `V(${PV.lam}) = ${Vl.toFixed(3)}；同功率 555 nm 為 ${fmtSI(683 * P)} lm`) +
      tile('發光強度 I', 'cd', sup(fmtSI(I)), tex('\\Phi_v/\\Omega'), `Ω = ${Om.toFixed(3)} sr（全角 ${PV.beam}°）`) +
      tile('照度 E', 'lx', sup(fmtSI(E)), tex('I\\cos\\alpha/r^2'), '平方反比，受光面傾斜再乘 cos α') +
      tile('受光面亮度 L', 'cd/m²', sup(fmtSI(Ls)), tex('\\rho E/\\pi'), `朗伯面 ρ = ${PV.rho.toFixed(2)}；光源本身（1 mm²）約 ${sup(fmtSI(Lsrc))} cd/m²`);
  }
  redraw = () => { vision(); photo(); };
  bindSlider('v-lum', v => fmtSI(Math.pow(10, v)) + ' cd/m²', v => { PV.lumLog = v; schedule(vision); });
  $('#v-cones').addEventListener('change', e => { PV.cones = e.target.checked; schedule(vision); });
  bindSlider('v-lam', v => v + ' nm', v => { PV.lam = v; schedule(photo); });
  bindSlider('v-P', v => fmtSI(Math.pow(10, v)) + ' mW', v => { PV.P = Math.pow(10, v); schedule(photo); });
  bindSlider('v-beam', v => v + '°', v => { PV.beam = v; schedule(photo); });
  bindSlider('v-r', v => v.toFixed(2) + ' m', v => { PV.r = v; schedule(photo); });
  bindSlider('v-tilt', v => v + '°', v => { PV.tilt = v; schedule(photo); });
  bindSlider('v-rho', v => v.toFixed(2), v => { PV.rho = v; schedule(photo); });
  redraw();
}

/* ---------- 3 對比與閃爍 ---------- */
const PC = { Lw: 500, Lb: 0.5, rho: 2, E: 300, mode: 'pwm', duty: 30, f: 240, dc: 0, hz: 120, v: 960, gtg: 1, bfi: 100 };
function PageContrast(main) {
  main.innerHTML = head('主題 3．W02 + W05', '對比、閃爍與動態模糊', '規格表上的對比、亮度與響應時間，都要回到「在什麼條件下量的」：環境光會把暗室對比壓扁，PWM 調光會帶來閃爍，保持型顯示的模糊則跟面板切換多快無關。') +
  hTitle('3.1　環境光下的有效對比') +
  lab(`${slider('k-Lw', '白階亮度 L_white', 100, 1500, 10, PC.Lw, ' nit')}${slider('k-Lb', 'LCD 黑階 L_black', 0.05, 1.5, 0.01, PC.Lb, ' nit')}
    ${slider('k-rho', '表面反射率 ρ', 0.1, 6, 0.1, PC.rho, '%')}${logSlider('k-E', '環境照度 E', 1, 100000, PC.E, '')}
    <div class="presets" id="k-pre"><button type="button" data-e="1">暗室</button><button type="button" data-e="300">辦公室 300 lx</button><button type="button" data-e="10000">陰天戶外</button><button type="button" data-e="100000">晴天直射</button></div>`,
    '先按「暗室」：OLED 對比接近無限大。再按「辦公室」，OLED 與 LCD 的差距剩約 1.3 倍。這時把反射率從 2% 降到 0.5%，比把 LCD 黑階壓低更有效。',
    `<h3>反射光同時加在白階與黑階上</h3><div class="eq">${tex('C_{\\text{amb}}=\\frac{L_{\\text{white}}+\\rho E/\\pi}{L_{\\text{black}}+\\rho E/\\pi}', true)}</div>
    <p>當 ${tex('\\rho E/\\pi\\gg L_{\\text{black}}')} 時，${tex('C_{\\text{amb}}\\approx\\pi L_{\\text{white}}/(\\rho E)')}，<b>黑階再低也沒有用</b>；要提高對比只能提高白亮度或降低反射率。</p>
    <p class="note">限制：朗伯近似忽略鏡面反射；實際量測依 IDMS 指定光源幾何與量測角度。</p>`,
    `<div class="grid2"><div class="card"><h4>OLED 與 LCD 在目前環境下</h4><canvas id="k-scr"></canvas><div class="readout" id="k-read" style="margin-top:8px"></div></div>
    <div class="card"><h4>有效對比 vs 環境照度</h4><canvas id="k-ch"></canvas><div class="legend"><span><i style="border-color:var(--accent)"></i>OLED（黑階 ≈ 0）</span><span><i style="border-color:var(--warm)"></i>LCD</span></div></div></div>`) +
  hTitle('3.2　PWM 調光與閃爍') +
  lab(`${seg('k-mode', [['pwm', 'PWM 調光'], ['dc', 'DC 調光']], PC.mode)}${slider('k-duty', '亮度（工作週期）', 1, 100, 1, PC.duty, '%')}
    ${logSlider('k-f', 'PWM 頻率', 60, 20000, PC.f, '')}${slider('k-dc', 'DC 調光的殘餘漣波', 0, 30, 1, PC.dc, '%')}`,
    '把 PWM 頻率設在 240 Hz、亮度 30%，點落在風險區。把頻率拉過 1250 Hz、或改成 DC 調光，點就移到安全區。OLED 在低亮度時常用 EM 工作週期調光，就是這個取捨。',
    `<h3>閃爍看兩個數字：頻率與調變深度</h3><div class="eq">${tex('\\text{Mod}\\,\\%=\\frac{L_{\\max}-L_{\\min}}{L_{\\max}+L_{\\min}}\\times100', true)}</div>
    <ul><li><b>PWM</b>：以開關時間比例調亮度，電流維持在最佳工作點，但每一週期都完全熄滅，調變深度 100%。</li>
    <li><b>DC 調光</b>：直接降低電流，幾乎沒有亮度波動；但 OLED 低電流下效率與色度會改變、TFT 不均更明顯。</li>
    <li>IEEE 1789-2015 建議：f &lt; 90 Hz 時調變深度 &lt; 0.025·f（%）、90–1250 Hz 時 &lt; 0.08·f 為低風險；0.0333·f 以下視為無影響；3000 Hz 以上不受限。</li>
    <li>LCD 的極性反轉若正負穿透率不等，會以 f/2 出現閃爍；空間交錯排列可把它壓低。</li></ul>`,
    `<div class="card"><h4>亮度波形（20 ms）</h4><canvas id="k-wave"></canvas></div>
    <div class="grid2"><div class="card"><h4>IEEE 1789 風險分區</h4><canvas id="k-ieee"></canvas><div class="legend"><span><i style="border-color:var(--good);border-top-width:8px;opacity:.5"></i>無影響</span><span><i style="border-color:var(--warm);border-top-width:8px;opacity:.35"></i>低風險</span><span>其餘：風險區</span></div></div>
    <div class="card"><h4>讀值</h4><div class="readout" id="k-read2"></div></div></div>`) +
  hTitle('3.3　GtG、MPRT 與保持型模糊') +
  lab(`${slider('k-hz', '更新率', 30, 480, 1, PC.hz, ' Hz')}${slider('k-v', '物體移動速度', 120, 3840, 10, PC.v, ' px/s')}${slider('k-gtg', '面板 GtG', 0.1, 10, 0.1, PC.gtg, ' ms')}${slider('k-bfi', '每影格發光比例（BFI）', 10, 100, 1, PC.bfi, '%')}`,
    '把 GtG 從 5 ms 降到 0.1 ms，模糊寬度幾乎不變；把更新率加倍、或把發光比例降到 50%（黑幀插入），模糊才明顯變窄，但亮度也跟著掉。',
    `<h3>模糊來自「影格保持多久」</h3><p>LCD 與 OLED 都是保持型顯示：每格畫面亮到下一格。眼睛追蹤移動物體時眼球連續移動，但畫面上的物體停在原地，於是在視網膜上被拖成一條。</p>
    <div class="eq">${tex('\\text{MPRT}\\approx\\frac{D}{f},\\qquad d=v\\times\\text{MPRT}', true)}</div>
    <p>D 為每影格發光的比例。<b>GtG</b> 量的是畫素切換能力，<b>MPRT</b> 量的是動態影像的模糊。有效手段是提高更新率、黑幀插入或背光掃描，三者都以犧牲亮度為代價。</p>`,
    `<div class="card"><h4>追蹤攝影（pursuit camera）模擬：視網膜上看到的移動方塊</h4><canvas id="k-blur"></canvas></div>
    <div class="grid2"><div class="card"><h4>邊緣亮度剖面</h4><canvas id="k-prof"></canvas></div><div class="card"><h4>讀值</h4><div class="readout" id="k-read3"></div></div></div>`);
  function contrast() {
    const Lr = PC.rho / 100 * PC.E / Math.PI, Co = (PC.Lw + Lr) / Lr, Cl = (PC.Lw + Lr) / (PC.Lb + Lr);
    const { ctx, w, h } = fit($('#k-scr'), 170);
    const panel = (x0, ww, Lb, name) => {
      const disp = v => { const L = Lb + (PC.Lw - Lb) * Math.pow(v, 2.2); return 255 * Math.pow((L + Lr) / (PC.Lw + Lr), 1 / 2.2); };
      for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const v = j === 1 ? i / 7 : (i + j) % 2 ? 1 : 0; const g = disp(v); ctx.fillStyle = rgb([g, g, g]); ctx.fillRect(x0 + i * ww / 8, 22 + j * (h - 30) / 3, ww / 8 + .5, (h - 30) / 3 + .5); }
      ctx.fillStyle = css('ink'); ctx.font = FONTB(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(name, x0, 2);
    };
    const ww = (w - 14) / 2; panel(0, ww, 0, 'OLED'); panel(ww + 14, ww, PC.Lb, 'LCD');
    reads('#k-read', [['反射亮度 ρE/π', Lr.toFixed(2) + ' nit'], ['OLED 對比', Lr < 1e-6 ? '∞' : Math.round(Co) + ' : 1'], ['LCD 對比', Math.round(Cl) + ' : 1'], ['OLED / LCD', Lr < 1e-6 ? '∞' : (Co / Cl).toFixed(2) + ' 倍']]);
    const pts = [], pl = []; for (let e = 0; e <= 5; e += .05) { const lr = PC.rho / 100 * Math.pow(10, e) / Math.PI; pts.push([e, Math.log10((PC.Lw + lr) / lr)]); pl.push([e, Math.log10((PC.Lw + lr) / (PC.Lb + lr))]); }
    plot($('#k-ch'), 230, { x: [0, 5], y: [0, 5], xt: [0, 1, 2, 3, 4, 5], yt: [0, 1, 2, 3, 4, 5], xf: t => '10' + '⁰¹²³⁴⁵'[t], yf: t => ['1', '10', '100', '1k', '10k', '100k'][t], xl: '環境照度 (lx)', yl: '有效對比', m: { l: 44 },
      series: [{ pts, col: css('accent'), w: 2.2 }, { pts: pl, col: css('warm'), w: 2.2 }], vl: [{ x: Math.log10(PC.E), col: css('muted') }],
      dots: [{ x: Math.log10(PC.E), y: Math.min(5, Math.log10(Co)), col: css('accent') }, { x: Math.log10(PC.E), y: Math.log10(Cl), col: css('warm') }] });
  }
  function flicker() {
    const D = PC.duty / 100, f = PC.f, isP = PC.mode === 'pwm';
    const L = t => isP ? ((t * f) % 1 < D ? 1 : 0) : D * (1 + PC.dc / 100 * Math.sin(2 * Math.PI * 240 * t));
    const pts = []; for (let t = 0; t <= 0.02; t += 0.02 / 2000) pts.push([t * 1000, L(t)]);
    plot($('#k-wave'), 170, { x: [0, 20], y: [0, 1.15], xt: [0, 5, 10, 15, 20], yt: [0, .5, 1], xl: '時間 (ms)', yl: '亮度', series: [{ pts, col: css('accent'), w: 1.4 }, { pts: [[0, D], [20, D]], col: css('warm'), w: 1.5, dash: [5, 4] }] });
    const mod = isP ? (D >= 1 ? 0 : 100) : PC.dc, freq = isP ? f : 240;
    const lo = x => x < 90 ? 0.025 * x : 0.08 * x, no = x => x < 90 ? 0.01 * x : 0.0333 * x;
    plot($('#k-ieee'), 230, { x: [Math.log10(30), Math.log10(20000)], y: [0, 2.05], xt: [2, 3, 4], xf: t => ['100', '1k', '10k'][t - 2], yt: [0, 1, 2], yf: t => ['1%', '10%', '100%'][t], xl: '頻率 (Hz)', yl: '調變深度', m: { l: 44 },
      pre(ctx, X, Y) {
        const band = (fn, col) => { ctx.beginPath(); ctx.moveTo(X(Math.log10(30)), Y(0)); for (let lf = Math.log10(30); lf <= Math.log10(20000); lf += .01) { const fr = Math.pow(10, lf); const m = fr >= 3000 ? 100 : Math.min(100, fn(fr)); ctx.lineTo(X(lf), Y(Math.max(0, Math.log10(Math.max(m, 1))))); } ctx.lineTo(X(Math.log10(20000)), Y(0)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
        band(lo, withAlpha(css('warm'), .25)); band(no, withAlpha(css('good'), .35));
      }, series: [], dots: [{ x: Math.log10(freq), y: Math.log10(Math.max(mod, 1)), col: css('ink'), r: 6 }] });
    const zone = freq >= 3000 || mod <= no(freq) ? '無影響' : mod <= lo(freq) ? '低風險' : '風險區';
    reads('#k-read2', [['平均亮度', (D * 100).toFixed(0) + '%'], ['調變深度', mod.toFixed(0) + '%'], ['閃爍頻率', fmtSI(freq) + ' Hz'], ['IEEE 1789 分區', zone]]);
  }
  function blur() {
    const per = PC.bfi / 100 / PC.hz, d = PC.v * per, g = PC.v * PC.gtg / 1000, tot = d + g * 0.8;
    const prof = x => { // 方塊寬 60 px：保持型盒狀卷積 + GtG 指數響應
      const box = (a, b) => Math.max(0, Math.min(1, (x - a) / Math.max(d, .01))) - Math.max(0, Math.min(1, (x - b) / Math.max(d, .01)));
      return box(0, 60);
    };
    const smooth = []; for (let x = -40; x <= 140; x += .5) { let s = 0, ws = 0; for (let k = 0; k < 40; k++) { const tau = g / 2.2 + 1e-3, dx = k * tau / 8, wgt = Math.exp(-dx / tau); s += wgt * prof(x - dx); ws += wgt; } smooth.push([x, s / ws]); }
    const { ctx, w, h } = fit($('#k-blur'), 120);
    const sc = w / 200, y0 = 20, hh = h - 40;
    ctx.fillStyle = css('panel-2'); ctx.fillRect(0, y0, w, hh);
    for (const [x, v] of smooth) { const c = 30 + 225 * v; ctx.fillStyle = rgb([c, c, c]); ctx.fillRect((x + 50) * sc, y0 + 10, .5 * sc + .6, hh - 20); }
    ctx.strokeStyle = css('accent'); ctx.setLineDash([4, 3]); ctx.strokeRect(50 * sc, y0 + 10, 60 * sc, hh - 20); ctx.setLineDash([]);
    ctx.fillStyle = css('muted'); ctx.font = FONTB(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('虛線框：靜止時的方塊（60 px）；移動方向 →', 4, 2);
    plot($('#k-prof'), 200, { x: [-40, 140], y: [0, 1.05], xt: [0, 60, 120], yt: [0, .5, 1], xl: '位置 (px)', yl: '亮度', series: [{ pts: smooth, col: css('accent'), w: 2 }, { pts: [[-40, 0], [0, 0], [0, 1], [60, 1], [60, 0], [140, 0]], col: css('muted'), w: 1, dash: [4, 3] }] });
    reads('#k-read3', [['MPRT', (per * 1000).toFixed(2) + ' ms'], ['保持模糊 v·MPRT', d.toFixed(1) + ' px'], ['GtG 貢獻 v·GtG', g.toFixed(1) + ' px'], ['亮度（相對）', PC.bfi + '%']]);
  }
  redraw = () => { contrast(); flicker(); blur(); };
  bindSlider('k-Lw', v => v + ' nit', v => { PC.Lw = v; schedule(contrast); });
  bindSlider('k-Lb', v => v.toFixed(2) + ' nit', v => { PC.Lb = v; schedule(contrast); });
  bindSlider('k-rho', v => v.toFixed(1) + '%', v => { PC.rho = v; schedule(contrast); });
  bindSlider('k-E', v => fmtSI(Math.pow(10, v)) + ' lx', v => { PC.E = Math.pow(10, v); schedule(contrast); });
  $('#k-pre').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; PC.E = +b.dataset.e; $('#k-E').value = Math.log10(PC.E); $('#k-E-o').textContent = fmtSI(PC.E) + ' lx'; schedule(contrast); });
  bindSeg('k-mode', k => { PC.mode = k; schedule(flicker); });
  bindSlider('k-duty', v => v + '%', v => { PC.duty = v; schedule(flicker); });
  bindSlider('k-f', v => fmtSI(Math.pow(10, v)) + ' Hz', v => { PC.f = Math.pow(10, v); schedule(flicker); });
  bindSlider('k-dc', v => v + '%', v => { PC.dc = v; schedule(flicker); });
  bindSlider('k-hz', v => v + ' Hz', v => { PC.hz = v; schedule(blur); });
  bindSlider('k-v', v => v + ' px/s', v => { PC.v = v; schedule(blur); });
  bindSlider('k-gtg', v => v.toFixed(1) + ' ms', v => { PC.gtg = v; schedule(blur); });
  bindSlider('k-bfi', v => v + '%', v => { PC.bfi = v; schedule(blur); });
  redraw();
}

/* ---------- 5 Frank 彈性 ---------- */
const PF = { q: 0.6, K11: 12, K22: 6.5, K33: 16, geo: 'ecb', V: 2.5, de: 8, d: 4, gap: 10 };
const ellK = m => { let a = 1, b = Math.sqrt(1 - m); for (let i = 0; i < 20; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; } return Math.PI / (2 * a); };
function thetaMof(r) { if (r <= 1) return 0; let lo = 0, hi = Math.PI / 2 - 1e-6; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if ((2 / Math.PI) * ellK(Math.sin(m) ** 2) < r) lo = m; else hi = m; } return (lo + hi) / 2; }
function profile(tm, N) { // sinθ = sinθm·sn(2K z/d | m)
  const m = Math.sin(tm) ** 2, K = ellK(m), tab = [], M = 400; let u = 0; tab.push([0, 0]);
  for (let i = 1; i <= M; i++) { const p0 = (i - 1) / M * Math.PI / 2, p1 = i / M * Math.PI / 2, f = p => 1 / Math.sqrt(1 - m * Math.sin(p) ** 2); u += (p1 - p0) / 6 * (f(p0) + 4 * f((p0 + p1) / 2) + f(p1)); tab.push([u, p1]); }
  const am = uu => { let j = 1; while (j < tab.length - 1 && tab[j][0] < uu) j++; const [u0, a0] = tab[j - 1], [u1, a1] = tab[j]; return a0 + (a1 - a0) * (uu - u0) / Math.max(u1 - u0, 1e-12); };
  const out = []; for (let i = 0; i < N; i++) { const z = (i + .5) / N, zz = z <= .5 ? z : 1 - z; out.push(tm < 1e-6 ? 0 : Math.asin(Math.min(1, Math.sin(tm) * Math.sin(am(2 * K * zz))))); }
  return out;
}
function PageFrank(main) {
  main.innerHTML = head('主題 5．W03B', 'Frank 彈性自由能與 Fréedericksz 轉變', '液晶喜歡指向矢處處平行；任何空間上的扭曲都要付出彈性能。展曲、扭轉、彎曲三種形變各有一個彈性常數，它們和介電異方性一起決定了 TN、IPS、VA 的閾值電壓。') +
  hTitle('5.1　三種基本形變') +
  lab(`${slider('fr-q', '形變強度（指向矢轉動率）', 0, 1.2, 0.01, PF.q, ' rad/µm')}${slider('fr-k11', 'K₁₁ 展曲', 3, 25, 0.5, PF.K11, ' pN')}${slider('fr-k22', 'K₂₂ 扭轉', 2, 15, 0.5, PF.K22, ' pN')}${slider('fr-k33', 'K₃₃ 彎曲', 3, 30, 0.5, PF.K33, ' pN')}`,
    '同樣的形變強度下，扭轉的能量最小（K₂₂ 約 K₁₁ 的一半），所以 IPS 的面內旋轉是「最便宜」的形變；VA 倒下要付彎曲的代價，K₃₃ 最大。',
    `<h3>Frank 彈性自由能密度</h3><div class="eq">${tex('f=\\tfrac12K_{11}(\\nabla\\!\\cdot\\!\\mathbf n)^2+\\tfrac12K_{22}(\\mathbf n\\!\\cdot\\!\\nabla\\!\\times\\!\\mathbf n)^2+\\tfrac12K_{33}|\\mathbf n\\!\\times\\!\\nabla\\!\\times\\!\\mathbf n|^2', true)}</div>
    <table class="metrics"><tr><td>展曲 K₁₁</td><td>平行配向盒（TN、ECB）的閾值</td></tr><tr><td>扭轉 K₂₂</td><td>IPS 的閾值；TN 的扭轉結構</td></tr><tr><td>彎曲 K₃₃</td><td>VA 的閾值；TN 加壓後的形變</td></tr></table>
    <p class="note">典型 K₂₂ ≈ K₁₁/2，K₃₃ ≈ 1.2–1.6 K₁₁。</p>`,
    `<div class="card"><div class="frank3" id="fr-panels"></div></div>
    <div class="card"><h4>形變能量密度 f = ½ K q²</h4><canvas id="fr-bar"></canvas></div>`) +
  hTitle('5.2　Fréedericksz 轉變：閾值、指向矢分布與 V–T') +
  lab(`${seg('fr-geo', [['ecb', '平行配向（K₁₁）'], ['ips', 'IPS（K₂₂）'], ['va', 'VA（K₃₃）']], PF.geo)}${slider('fr-V', '電壓', 0, 8, 0.05, PF.V, ' V')}${slider('fr-de', '|Δε|', 2, 20, 0.5, PF.de)}${slider('fr-d', '盒厚 d', 2, 8, 0.1, PF.d, ' µm')}${slider('fr-gap', 'IPS 電極間距 ℓ', 4, 20, 0.5, PF.gap, ' µm')}<div class="readout" id="fr-read"></div>`,
    '改變盒厚 d：平行配向與 VA 的閾值完全不動，只有 V–T 曲線的高度（延遲量）改變。IPS 則不同，它的電場是 V/ℓ，閾值和 ℓ/d 有關。',
    `<h3>閾值行為</h3><p>電壓低於某值時指向矢完全不動；電場力矩超過彈性回復力矩，指向矢才開始重排。</p>
    <div class="eq">${tex('V_{\\text{th}}=\\pi\\sqrt{\\frac{K}{\\varepsilon_0|\\Delta\\varepsilon|}}', true)}</div>
    <p><b>閾值與盒厚無關</b>：盒變薄，彈性力矩 ∝ 1/d²；同電壓下 E = V/d，電場力矩 ∝ E² ∝ 1/d²，兩者同比例變化，d 相消。</p>
    <p>閾值以上的精確解是 Jacobi 橢圓函數：${tex('V/V_{\\text{th}}=\\tfrac{2}{\\pi}K(\\sin^2\\theta_m)')}。V/V<sub>th</sub> = 1.2 時中央傾角 47°、= 2 時 80°。高電壓下靠近基板會留下薄的<b>邊界層</b>，造成殘留延遲。</p>
    <p class="note">本頁使用單一彈性常數、強錨定、均勻電場的近似（與筆記推導相同）。IPS 以 ${tex('V_{\\text{th}}=\\tfrac{\\pi\\ell}{d}\\sqrt{K_{22}/\\varepsilon_0\\Delta\\varepsilon}')} 估算。</p>`,
    `<div class="grid2"><div class="card"><h4>指向矢分布（盒厚方向）</h4><canvas id="fr-dir"></canvas></div><div class="card"><h4>中央傾角 θm vs V</h4><canvas id="fr-tm"></canvas></div></div>
    <div class="card"><h4>V–T 曲線（正交偏光片，λ = 550 nm，Δn = 0.1）</h4><canvas id="fr-vt"></canvas></div>`);
  function deform() {
    const box = $('#fr-panels'); if (!box.children.length) box.innerHTML = [['splay', '展曲 splay'], ['twist', '扭轉 twist'], ['bend', '彎曲 bend']].map(([k, t]) => `<div><h4>${t}</h4><canvas id="fr-${k}"></canvas></div>`).join('');
    const q = PF.q;
    for (const k of ['splay', 'twist', 'bend']) {
      const { ctx, w, h } = fit($('#fr-' + k), 190);
      const n = 7, gx = w / (n + 1), gy = h / (n + 1), L = Math.min(gx, gy) * .8;
      for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) {
        const x = i * gx, y = j * gy, u = (i - (n + 1) / 2) * gx / 40, v = ((n + 1) / 2 - j) * gy / 40;
        let ang, len = L, alpha = 1;
        if (k === 'splay') ang = Math.PI / 2 - q * u * .9;              // 指向矢由中心向外張開
        else if (k === 'bend') ang = q * v * .9;                          // 指向矢沿弧線彎曲
        else { const phi = q * v * 1.4; ang = 0; len = L * Math.abs(Math.cos(phi)) + 3; alpha = .35 + .65 * Math.abs(Math.cos(phi)); }
        ctx.strokeStyle = css(k === 'twist' ? 'sy' : k === 'splay' ? 'warm' : 'accent'); ctx.globalAlpha = alpha; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2); ctx.lineTo(x + Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
      if (k === 'twist') { ctx.font = FONTB(); ctx.fillStyle = css('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('↑ 越往上，分子越轉向紙面深度方向', 4, h - 2); }
    }
    const f = [['展曲 K₁₁', PF.K11, 'warm'], ['扭轉 K₂₂', PF.K22, 'sy'], ['彎曲 K₃₃', PF.K33, 'accent']].map(([n, K, c]) => [n, 0.5 * K * 1e-12 * (q * 1e6) ** 2, c]);
    const { ctx, w, h } = fit($('#fr-bar'), 130); const mx = Math.max(...f.map(r => r[1]), 1e-9) * 1.15;
    f.forEach(([n, v, c], i) => { const y = 10 + i * 38; ctx.fillStyle = css('muted'); ctx.font = FONTB(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(n, 0, y + 12);
      ctx.fillStyle = css(c); ctx.fillRect(90, y + 2, (w - 200) * v / mx, 20); ctx.fillStyle = css('ink'); ctx.font = FONT(); ctx.fillText(v.toFixed(1) + ' J/m³', 96 + (w - 200) * v / mx, y + 12); });
  }
  const KofGeo = () => PF.geo === 'ecb' ? PF.K11 : PF.geo === 'ips' ? PF.K22 : PF.K33;
  const Vth = () => { const base = Math.PI * Math.sqrt(KofGeo() * 1e-12 / (8.854e-12 * PF.de)); return PF.geo === 'ips' ? base * PF.gap / PF.d : base; };
  function layersFor(V) {
    const tm = thetaMof(V / Vth()), th = profile(tm, 16), L = [];
    for (const t of th) {
      const ax = PF.geo === 'ecb' ? [Math.cos(t) * Math.SQRT1_2, Math.cos(t) * Math.SQRT1_2, Math.sin(t)]
        : PF.geo === 'va' ? [Math.sin(t) * Math.SQRT1_2, Math.sin(t) * Math.SQRT1_2, Math.cos(t)]
          : [Math.cos(t), Math.sin(t), 0];
      L.push({ ax, no: 1.5, ne: 1.6, d: PF.d / 16 });
    }
    return { L, tm, th };
  }
  const Tof = V => { const { L } = layersFor(V); if (PF.geo === 'ecb') { const z = [0, 0, 1]; } return OPT.T(L, 0, 0); };
  function freed() {
    const vth = Vth(), { tm, th } = layersFor(PF.V);
    const { ctx, w, h } = fit($('#fr-dir'), 230);
    const N = th.length, gy = (h - 30) / N, Lr = Math.min(gy * 1.8, 30);
    ctx.fillStyle = css('ito'); ctx.fillRect(10, 8, w - 20, 4); ctx.fillRect(10, h - 22, w - 20, 4);
    th.forEach((t, i) => { const y = 14 + (i + .5) * gy;
      for (let x = 30; x < w - 20; x += 34) {
        let dx, dy, alpha = 1, len = Lr;
        if (PF.geo === 'ecb') { dx = Math.cos(t); dy = Math.sin(t); }
        else if (PF.geo === 'va') { dx = Math.sin(t); dy = Math.cos(t); }
        else { dx = Math.cos(t); dy = 0; len = Lr * (0.25 + 0.75 * Math.abs(Math.cos(t))); alpha = .4 + .6 * Math.abs(Math.cos(t)); }
        ctx.strokeStyle = css('accent'); ctx.globalAlpha = alpha; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - dx * len / 2, y + dy * len / 2); ctx.lineTo(x + dx * len / 2, y - dy * len / 2); ctx.stroke(); } });
    ctx.globalAlpha = 1; ctx.lineCap = 'butt'; ctx.font = FONTB(); ctx.fillStyle = css('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(PF.geo === 'ips' ? '俯視：分子在面內轉動（短 = 轉向深度方向）' : '側視：上下基板強錨定，中央轉得最多', 10, h - 1);
    const pts = []; for (let r = 0; r <= 5; r += .02) pts.push([r, thetaMof(r) / D2R]);
    plot($('#fr-tm'), 230, { x: [0, 5], y: [0, 90], xt: [0, 1, 2, 3, 4, 5], yt: [0, 30, 60, 90], xl: 'V / Vth', yl: 'θm (°)', series: [{ pts, col: css('accent'), w: 2.2 }], dots: [{ x: Math.min(5, PF.V / vth), y: tm / D2R, col: css('warm'), r: 5 }], vl: [{ x: 1, col: css('muted') }] });
    const vt = []; for (let V = 0; V <= 8; V += .08) vt.push([V, Tof(V)]);
    plot($('#fr-vt'), 220, { x: [0, 8], y: [0, 1.02], xt: [0, 2, 4, 6, 8], yt: [0, .5, 1], xl: '電壓 (V)', yl: '穿透率', series: [{ pts: vt, col: css('accent'), w: 2.2 }], vl: [{ x: vth, col: css('muted') }], dots: [{ x: PF.V, y: Tof(PF.V), col: css('warm'), r: 5 }] });
    reads('#fr-read', [['Vth', vth.toFixed(2) + ' V'], ['V / Vth', (PF.V / vth).toFixed(2)], ['中央傾角 θm', (tm / D2R).toFixed(1) + '°'], ['Δn·d', (0.1 * PF.d).toFixed(2) + ' µm']]);
  }
  redraw = () => { deform(); freed(); };
  bindSlider('fr-q', v => v.toFixed(2) + ' rad/µm', v => { PF.q = v; schedule(deform); });
  for (const k of ['k11', 'k22', 'k33']) bindSlider('fr-' + k, v => v + ' pN', v => { PF[k.toUpperCase()] = v; schedule(redraw); });
  bindSeg('fr-geo', k => { PF.geo = k; schedule(freed); });
  bindSlider('fr-V', v => v.toFixed(2) + ' V', v => { PF.V = v; schedule(freed); });
  bindSlider('fr-de', v => v, v => { PF.de = v; schedule(freed); });
  bindSlider('fr-d', v => v.toFixed(1) + ' µm', v => { PF.d = v; schedule(freed); });
  bindSlider('fr-gap', v => v + ' µm', v => { PF.gap = v; schedule(freed); });
  redraw();
}

/* ---------- 6 背光光學膜 ---------- */
const PB = { inc: 20, sheets: 2, R: 0.8, dbef: true, Rd: 0.75, dep: 0.45 };
const BEF = (() => {
  const n = 1.58;
  const fres = (ci, ct, n1, n2) => { const rs = ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2, rp = ((n1 * ct - n2 * ci) / (n1 * ct + n2 * ci)) ** 2; return (rs + rp) / 2; };
  // d: 方向（往外法線 nr 方向為出射），從 n1 到 n2；回傳 [新方向, 是否穿透]
  function interact(d, nr, n1, n2, rnd) {
    const ci = d[0] * nr[0] + d[1] * nr[1] + d[2] * nr[2], eta = n1 / n2, k = 1 - eta * eta * (1 - ci * ci);
    const refl = () => [d[0] - 2 * ci * nr[0], d[1] - 2 * ci * nr[1], d[2] - 2 * ci * nr[2]];
    if (k < 0) return [refl(), false];
    const ct = Math.sqrt(k); if (rnd() < fres(ci, ct, n1, n2)) return [refl(), false];
    const a = ct - eta * ci; return [[eta * d[0] + a * nr[0], eta * d[1] + a * nr[1], eta * d[2] + a * nr[2]], true];
  }
  const S2 = Math.SQRT1_2, NL = [-S2, 0, S2], NR = [S2, 0, S2];
  // 一片稜鏡片（局部座標：x 橫越稜鏡、週期 1、高 0.5）；輸入為空氣中往上的方向；回傳 {up, dir, path}
  function sheet(d0, x0, rnd, rec) {
    let p = [x0, 0, 0], path = rec ? [[p[0], p[2]]] : null;
    let [d, ok] = interact(d0, [0, 0, -1].map(v => -v), 1, n, rnd); // 底面：法線往內（+z）
    // interact 預期 nr 為出射側法線；從空氣進入材料時出射側為 +z
    if (!ok) return { up: false, dir: d, path };
    let cell = Math.floor(p[0]);
    for (let it = 0; it < 40; it++) {
      // 在稜鏡 cell 內
      const ts = [];
      const t1 = (-cell * S2 - (NL[0] * p[0] + NL[2] * p[2])) / (NL[0] * d[0] + NL[2] * d[2]); if (NL[0] * d[0] + NL[2] * d[2] > 1e-12 && t1 > 1e-9) ts.push([t1, NL]);
      const t2 = ((cell + 1) * S2 - (NR[0] * p[0] + NR[2] * p[2])) / (NR[0] * d[0] + NR[2] * d[2]); if (NR[0] * d[0] + NR[2] * d[2] > 1e-12 && t2 > 1e-9) ts.push([t2, NR]);
      if (d[2] < -1e-12) ts.push([-p[2] / d[2], null]);
      ts.sort((a, b) => a[0] - b[0]); const [t, nr] = ts[0];
      p = [p[0] + t * d[0], p[1] + t * d[1], p[2] + t * d[2]]; if (rec) path.push([p[0], p[2]]);
      if (!nr) return { up: false, dir: d, path }; // 從底面回到背光腔
      const [d2, out] = interact(d, nr, n, 1, rnd);
      d = d2; if (!out) continue;
      // 空氣中：檢查是否射入相鄰稜鏡
      let hit = null;
      if (nr === NL && d[0] < 0) { const c = cell - 1, den = NR[0] * d[0] + NR[2] * d[2], t3 = ((c + 1) * S2 - (NR[0] * p[0] + NR[2] * p[2])) / den; if (den < 0 && t3 > 1e-9) { const q = [p[0] + t3 * d[0], p[1] + t3 * d[1], p[2] + t3 * d[2]]; if (q[2] >= 0 && q[2] <= .5) hit = [q, NR, c]; } }
      if (nr === NR && d[0] > 0) { const c = cell + 1, den = NL[0] * d[0] + NL[2] * d[2], t3 = (-c * S2 - (NL[0] * p[0] + NL[2] * p[2])) / den; if (den < 0 && t3 > 1e-9) { const q = [p[0] + t3 * d[0], p[1] + t3 * d[1], p[2] + t3 * d[2]]; if (q[2] >= 0 && q[2] <= .5) hit = [q, NL, c]; } }
      if (!hit) { if (rec) path.push([p[0] + d[0] * .8, p[2] + d[2] * .8]); return { up: d[2] > 0, dir: d, path }; }
      p = hit[0]; if (rec) path.push([p[0], p[2]]);
      const [d3, inn] = interact(d, hit[1].map(v => -v), 1, n, rnd); d = d3; cell = hit[2];
      if (!inn) { if (rec) path.push([p[0] + d[0] * .8, p[2] + d[2] * .8]); return { up: d[2] > 0, dir: d, path }; }
    }
    return { up: false, dir: d, path };
  }
  function lambert(rnd) { const c = Math.sqrt(rnd()), s = Math.sqrt(1 - c * c), ph = 2 * Math.PI * rnd(); return [s * Math.cos(ph), s * Math.sin(ph), c]; }
  function simulate(sheets, R, N, seed) {
    let s = seed; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const out = [];
    for (let i = 0; i < N; i++) {
      let alive = true;
      for (let b = 0; b < 40 && alive; b++) {
        let d = lambert(rnd), up = true;
        if (sheets >= 1) { const r = sheet(d, rnd(), rnd, false); up = r.up; d = r.dir; }
        if (up && sheets >= 2) { const loc = [d[1], d[0], d[2]]; const r = sheet(loc, rnd(), rnd, false); up = r.up; d = [r.dir[1], r.dir[0], r.dir[2]]; }
        if (up && d[2] > 0) { out.push(d); break; }
        if (rnd() > R) alive = false;
      }
    }
    return out;
  }
  function luminanceCut(rays, N, axis) { // axis 0：水平切面，1：垂直切面
    const bins = [], half = 8 * D2R, tv = Math.tan(half);
    for (let a = -80; a < 80; a += 5) bins.push({ a: a + 2.5, lo: Math.tan(a * D2R), hi: Math.tan((a + 5) * D2R), s: 0 });
    for (const d of rays) { const u = (axis ? d[1] : d[0]) / d[2], v = (axis ? d[0] : d[1]) / d[2]; if (Math.abs(v) > tv) continue; const ang = Math.atan(u) / D2R; const i = Math.floor((ang + 80) / 5); if (i < 0 || i >= bins.length) continue; bins[i].s += (1 + u * u + v * v) ** 2; }
    return bins.map(b => [b.a, b.s / ((b.hi - b.lo) * 2 * tv) / (N / Math.PI)]);
  }
  return { sheet, simulate, luminanceCut };
})();
function PageFilms(main) {
  main.innerHTML = head('主題 6．W04', '背光光學膜：BEF 與 DBEF', '光學膜合計常僅零點幾毫米，卻決定了一半以上的光學效率。因為光會在膜之間多次反射、回收再利用，所以效率不是穿透率相乘：BEF 用角度換正面亮度，DBEF 回收原本會被偏光片吸收的那一半偏振。') +
  hTitle('6.1　BEF：把光收攏到正面') +
  lab(`${slider('b-inc', '單一光線組的入射角（稜鏡剖面內）', -80, 80, 1, PB.inc, '°')}${seg('b-n', [['0', '無 BEF'], ['1', '1 片'], ['2', '2 片正交']], String(PB.sheets))}${slider('b-R', '背光腔反射率（回收效率）', 0, 0.98, 0.01, PB.R)}`,
    '把入射角設在 0° 附近：光在稜鏡兩個斜面連續全反射後回到背光腔。改到 30–40°：光被折射「掰」向正面。再把背光腔反射率降到 0，回收消失，增益明顯下降。',
    `<h3>稜鏡片的兩個動作</h3><ul><li><b>折射</b>：入射角適中的光經 90° 稜鏡斜面折射，方向被掰向正面（約 ±35° 內），正面亮度提高。</li>
    <li><b>全反射回收</b>：接近垂直入射的光在兩個斜面上連續全反射，被送回背光腔，經反射片與擴散片打散後再試一次。</li>
    <li>結果：<b>正面亮度提高、可視角變窄</b>，是亮度與視角的直接交換。兩片正交疊放，分別收攏水平與垂直方向。</li></ul>
    <p class="note">3M BEF II：稜鏡角 90°、間距 50 µm；單片增益約 58%，兩片正交約 114%。右側為 3D 蒙地卡羅光線追跡（n = 1.58，含菲涅耳反射，背光腔為朗伯面），數值會隨回收效率改變。</p>`,
    `<div class="card"><h4>稜鏡剖面的光線（藍 = 往正面射出，橘 = 回到背光腔）</h4><canvas id="b-ray"></canvas></div>
    <div class="grid2"><div class="card"><h4>亮度角分布（以無膜的朗伯面 = 1）</h4><canvas id="b-ang"></canvas><div class="legend"><span><i class="d" style="border-color:var(--muted)"></i>無膜</span><span><i style="border-color:var(--accent)"></i>水平切面</span><span><i style="border-color:var(--warm)"></i>垂直切面</span></div></div>
    <div class="card"><h4>讀值</h4><div class="readout" id="b-read"></div></div></div>`) +
  hTitle('6.2　DBEF：回收被偏光片吸收的一半') +
  lab(`<label class="chk"><input type="checkbox" id="b-dbef" ${PB.dbef ? 'checked' : ''}>加上 DBEF</label>${slider('b-Rd', '背光腔反射率', 0, 0.98, 0.01, PB.Rd)}${slider('b-dep', '每次回到背光腔的去偏振比例', 0, 1, 0.01, PB.dep)}`,
    '把去偏振比例拉到 0：S 偏振回去後還是 S，永遠出不來，DBEF 沒有增益。拉到 1 並提高反射率，增益接近 2 倍，但實際膜層每次循環都有吸收與散射，所以典型只有 30–40%。',
    `<h3>回收循環</h3><ol><li>背光腔射出非偏振光（P＋S 各半）。</li><li>DBEF 讓 P 通過，P 接著幾乎全部通過下偏光片。</li><li>S 被反射回背光腔，在反射片與擴散片之間被<b>去偏振</b>。</li><li>再次射向 DBEF，其中的 P 成分又可通過……</li></ol>
    <p>沒有 DBEF 時，S 偏振（約一半的光）直接被下偏光片吸收成熱。DBEF <b>只能部分回收</b>，無法改變偏光片「一次只能過一半」的上限本身。</p>`,
    `<div class="card"><h4>每一輪循環通過的 P 偏振</h4><canvas id="b-cyc"></canvas></div>
    <div class="card"><div class="readout" id="b-read2"></div></div>`);
  const cache = {};
  function getSim(k) { if (!cache[k]) { const [n, R] = k.split('|').map(Number); cache[k] = { rays: BEF.simulate(n, R, 30000, 12345), N: 30000 }; } return cache[k]; }
  function rays() {
    const { ctx, w, h } = fit($('#b-ray'), 230);
    const sc = Math.min((w - 20) / 4, (h - 40) / 1.4), ox = w / 2 - 2 * sc, by = h - 26 - .35 * sc;
    const X = x => ox + x * sc, Y = z => by - z * sc;
    ctx.fillStyle = withAlpha(css('accent'), .1); ctx.strokeStyle = css('muted'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); for (let c = 0; c < 4; c++) { ctx.lineTo(X(c + .5), Y(.5)); ctx.lineTo(X(c + 1), Y(0)); } ctx.lineTo(X(4), Y(-.12)); ctx.lineTo(X(0), Y(-.12)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.font = FONTB(); ctx.fillStyle = css('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('↑ 從背光腔（擴散片／反射片）射入', 4, h - 18);
    const a = PB.inc * D2R, d = [Math.sin(a), 0, Math.cos(a)];
    let s = 7; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; const noFres = () => 0.999;
    for (let i = 0; i < 9; i++) {
      const x0 = 1 + (i + .5) / 9 * 2, r = BEF.sheet(d, x0, noFres, true);
      const up = r.up && r.dir[2] > 0;
      ctx.strokeStyle = up ? css('accent') : css('warm'); ctx.lineWidth = 1.6;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, by + 6); ctx.clip(); ctx.beginPath(); ctx.moveTo(X(x0 - d[0] / d[2] * .35), Y(-.35)); r.path.forEach(([x, z]) => ctx.lineTo(X(x), Y(z)));
      if (!up) { const last = r.path[r.path.length - 1]; const k = r.dir[2] < 0 ? Math.min(.6, (last[1] + .35) / -r.dir[2]) : .6; ctx.lineTo(X(last[0] + r.dir[0] * k), Y(last[1] + r.dir[2] * k)); }
      ctx.stroke(); ctx.restore();
    }
  }
  function angular() {
    const base = getSim('0|' + PB.R), sim = getSim(PB.sheets + '|' + PB.R);
    const hcut = BEF.luminanceCut(sim.rays, sim.N, 0), vcut = BEF.luminanceCut(sim.rays, sim.N, 1), b0 = BEF.luminanceCut(base.rays, base.N, 0);
    const smooth = a => a.map((p, i) => [p[0], (a[Math.max(0, i - 1)][1] + 2 * p[1] + a[Math.min(a.length - 1, i + 1)][1]) / 4]);
    const H = smooth(hcut), Vv = smooth(vcut), B0 = smooth(b0);
    const ym = Math.max(2.4, ...H.map(p => p[1]), ...Vv.map(p => p[1])) * 1.05;
    plot($('#b-ang'), 230, { x: [-80, 80], y: [0, ym], xt: [-80, -40, 0, 40, 80], yt: [0, 1, 2], xl: '觀看角 (°)', yl: '相對亮度', series: [{ pts: B0, col: css('muted'), w: 1.4, dash: [5, 4] }, { pts: Vv, col: css('warm'), w: 2 }, { pts: H, col: css('accent'), w: 2 }] });
    const on = c => (c[15][1] + c[16][1]) / 2, half = c => { const p = on(c) / 2; let i = 16; while (i < c.length - 1 && c[i][1] > p) i++; return c[i][0]; };
    const flux = sim.rays.length / sim.N, flux0 = base.rays.length / base.N;
    reads('#b-read', [['正面增益（水平切面）', on(H).toFixed(2) + '×'], ['半亮度角（水平）', '±' + half(H).toFixed(0) + '°'], ['半亮度角（垂直）', '±' + half(Vv).toFixed(0) + '°'], ['總出光量（相對無膜）', (flux / flux0).toFixed(2) + '×']]);
  }
  function dbef() {
    const t = 0.95; let s = 0.5, p = 0.5 * t; const cyc = [[0, p]];
    if (PB.dbef) for (let k = 1; k <= 12; k++) { s = PB.Rd * s; const np = s * PB.dep / 2; s = s - np; cyc.push([k, np * t]); p += np * t; }
    const G = PB.dbef ? p / 0.5 : 1;
    const { ctx, w, h } = fit($('#b-cyc'), 200); const n = cyc.length, bw = (w - 60) / 13, mx = 0.5;
    ctx.font = FONT(); ctx.textAlign = 'center';
    cyc.forEach(([k, v], i) => { const x = 40 + i * bw, hh = (h - 50) * v / mx; ctx.fillStyle = i ? css('accent') : css('muted'); ctx.fillRect(x + 3, h - 30 - hh, bw - 6, hh); ctx.fillStyle = css('muted'); ctx.textBaseline = 'top'; ctx.fillText(i ? k : '首次', x + bw / 2, h - 26); });
    ctx.textAlign = 'left'; ctx.fillStyle = css('muted'); ctx.textBaseline = 'top'; ctx.font = FONTB(); ctx.fillText('灰：第一次就通過的 P；藍：回收後新增的 P（高度為相對光通量）', 40, 2);
    const bef = getSim(PB.sheets + '|' + PB.R), b0 = getSim('0|' + PB.R), on = BEF.luminanceCut(bef.rays, bef.N, 0), on0 = BEF.luminanceCut(b0.rays, b0.N, 0);
    const gB = (on[15][1] + on[16][1]) / 2 / ((on0[15][1] + on0[16][1]) / 2);
    reads('#b-read2', [['無 DBEF 通過下偏光片', '50%'], ['加 DBEF 後', (p * 100).toFixed(1) + '%'], ['DBEF 增益', G.toFixed(2) + '×'], ['× 6.1 的 BEF 正面增益', (G * gB).toFixed(2) + '×']]);
  }
  redraw = () => { rays(); angular(); dbef(); };
  bindSlider('b-inc', v => v + '°', v => { PB.inc = v; schedule(rays); });
  bindSeg('b-n', k => { PB.sheets = +k; schedule(angular); schedule(dbef); });
  bindSlider('b-R', v => v.toFixed(2), v => { PB.R = Math.round(v * 20) / 20; schedule(angular); schedule(dbef); });
  $('#b-dbef').addEventListener('change', e => { PB.dbef = e.target.checked; schedule(dbef); });
  bindSlider('b-Rd', v => v.toFixed(2), v => { PB.Rd = v; schedule(dbef); });
  bindSlider('b-dep', v => v.toFixed(2), v => { PB.dep = v; schedule(dbef); });
  redraw();
}

/* ---------- 7 驅動與矩陣定址 ---------- */
const PM = { res: '4k', hz: 120, bits: 8, mode: 'am', speed: 0.6, N: 240, stn: false, mat: 'igzo', vgs: 15 };
const RES = { fhd: [1920, 1080, 'FHD'], qhd: [2560, 1440, 'QHD'], '4k': [3840, 2160, '4K'], '8k': [7680, 4320, '8K'] };
const TFTM = { asi: { n: 'a-Si:H', mu: 0.7, vth: 2.5, ss: 0.6, ioff: 1e-12 }, igzo: { n: 'a-IGZO', mu: 15, vth: 1, ss: 0.2, ioff: 1e-15 }, ltps: { n: 'LTPS', mu: 100, vth: 1.2, ss: 0.25, ioff: 1e-12 } };
function tftI(m, vgs, vds) { const C = 3e-8, WL = 2, vov = vgs - m.vth; const kp = m.mu * C * WL; let on = 0; if (vov > 0) on = vds < vov ? kp * (vov * vds - vds * vds / 2) : 0.5 * kp * vov * vov; const sub = 1e-7 * Math.pow(10, vov / m.ss) * (1 - Math.exp(-vds / 0.05)); return Math.max(m.ioff, vov > 0 ? on + Math.min(sub, 1e-7) : Math.min(sub, 1e-7)); }
let matAnim = null;
function PageMatrix(main) {
  main.innerHTML = head('主題 7．W05', '驅動電路的任務與矩陣定址', '4K 120 Hz 每秒要設定約 30 億個類比量，但面板只有幾千條閘極線與一萬多條資料線。解法是「矩陣定址（空間多工）＋逐列掃描（時間多工）」，主動矩陣再用 TFT 與電容把「定址」與「保持」分開。') +
  hTitle('7.1　驅動電路的任務') +
  lab(`${seg('m-res', Object.entries(RES).map(([k, v]) => [k, v[2]]), PM.res)}${slider('m-hz', '更新率', 30, 240, 1, PM.hz, ' Hz')}${seg('m-bits', [['8', '8-bit'], ['10', '10-bit']], String(PM.bits))}`,
    '把 4K 從 60 Hz 拉到 240 Hz：列時間從 7.7 µs 縮到 1.9 µs。到了 8.3 頁的 RC 充電，就會看到這段時間不夠畫素充電。',
    `<h3>串列影像 → 逐列、並列的類比電壓</h3><ul><li><b>直接驅動</b>每個子畫素一條線：4K 子畫素約 2.49×10⁷ 條，不可能。</li><li><b>矩陣驅動</b>只要列＋行：4K 為 2160 + 11,520 條，少了約三個數量級。</li><li>代價：每列只在 1/M 的時間被定址，需要保持機制。</li></ul>
    <p>TCON 產生時序與處理資料（過驅動、Gamma、Demura）；源極驅動用 DAC 產生資料電壓；閘極驅動是一串移位暫存器，逐列開啟 TFT。</p>`,
    `<div class="card"><h4>驅動流程</h4><div class="pipe" id="m-pipe"></div></div><div class="card"><div class="readout" id="m-read"></div></div>`) +
  hTitle('7.2　被動矩陣與主動矩陣的逐列掃描') +
  lab(`${seg('m-mode', [['pm', '被動矩陣 PM'], ['am', '主動矩陣 AM']], PM.mode)}${slider('m-speed', '掃描速度（慢動作）', 0.1, 3, 0.05, PM.speed, '×')}`,
    '切到被動矩陣：每個畫素只在自己那一列被選到的瞬間收到完整電壓，其餘時間仍承受行電極上別列的資料電壓（串擾）。切到主動矩陣：TFT 關閉後電容保持電壓，整張畫面穩定。',
    `<h3>主動矩陣的本質</h3><p>被動矩陣的畫素沒有開關，液晶回應的是整個影格的 V<sub>rms</sub>，所以開與關的差異隨列數 N 被稀釋。</p>
    <p>主動矩陣把<b>定址</b>與<b>保持</b>分開：TFT 負責在列時間內寫入，電容負責在其餘時間保持；未被選取時 TFT 是關的，別列的資料電壓進不來，串擾消失。</p>`,
    `<div class="grid2"><div class="card"><h4>8 × 8 面板（亮度 = 畫素電壓）</h4><canvas id="m-grid"></canvas></div><div class="card"><h4>畫素（第 3 列、第 3 行）的電壓</h4><canvas id="m-pix"></canvas><p class="cap">兩個影格；灰色區為該畫素所在列被選取的時間。</p></div></div>`) +
  hTitle('7.3　被動矩陣的極限：選擇比') +
  lab(`${logSlider('m-N', '列數 N', 2, 2160, PM.N, '')}<label class="chk"><input type="checkbox" id="m-stn" ${PM.stn ? 'checked' : ''}>改用 STN（陡峭的 T–V 曲線）</label>`,
    '把 N 從 16 拉到 240：開、關電壓只差 7%，TN 的兩個點幾乎疊在一起。勾選 STN，曲線變陡，同樣的電壓差又能分出亮暗。',
    `<h3>Alt–Pleshko 極限</h3><div class="eq">${tex('\\frac{V_{\\text{on}}}{V_{\\text{off}}}=\\sqrt{\\frac{\\sqrt N+1}{\\sqrt N-1}}', true)}</div>
    <p>N = 16 → 1.291；100 → 1.106；240 → 1.067；2160 → 1.022。若要求選擇比 1.5，只容許約 6 列。STN 以 180°–270° 的大扭轉角讓 T(V) 變陡，把可用列數推到數百列。</p>`,
    `<div class="grid2"><div class="card"><h4>選擇比 vs 列數</h4><canvas id="m-sel"></canvas></div><div class="card"><h4>T–V 曲線上的開／關點</h4><canvas id="m-tv"></canvas></div></div>`) +
  hTitle('7.4　TFT：薄膜電晶體') +
  lab(`${seg('m-mat', Object.entries(TFTM).map(([k, v]) => [k, v.n]), PM.mat)}${slider('m-vgs', '閘極電壓 V_GH', 5, 25, 0.5, PM.vgs, ' V')}`,
    '比較三種材料：IGZO 的關閉電流比 a-Si 低三個數量級，所以能做 1 Hz；LTPS 的導通電流最大，適合當 OLED 的驅動電流源。',
    `<h3>開關與電流源</h3><div class="eq">${tex('I_D\\approx\\mu C_{ox}\\tfrac WL(V_{GS}-V_{th})V_{DS}\\ \\ (\\text{線性}),\\quad I_D\\approx\\tfrac12\\mu C_{ox}\\tfrac WL(V_{GS}-V_{th})^2\\ \\ (\\text{飽和})', true)}</div>
    <ul><li>LCD 畫素 TFT 在<b>線性區</b>當開關，${tex('R_{on}\\approx1/[\\mu C_{ox}(W/L)V_{ov}]')}。</li><li>AMOLED 驅動 TFT 在<b>飽和區</b>當電流源，電流對 V<sub>th</sub> 敏感。</li>
    <li><b>遷移率</b>高 → 充電快、可做小；<b>關閉電流</b>低 → 保持久、可降更新率；<b>LTPO</b> 是同一基板上同時做 LTPS（驅動）與氧化物（開關）。</li></ul>`,
    `<div class="grid2"><div class="card"><h4>轉移特性 log I_D – V_GS（V_DS = 10 V）</h4><canvas id="m-iv"></canvas><div class="legend">${Object.entries(TFTM).map(([k, v], i) => `<span><i style="border-color:var(--${['warm', 'accent', 'sy'][i]})"></i>${v.n}</span>`).join('')}</div></div>
    <div class="card"><h4>讀值（W/L = 2，C<sub>ox</sub> = 30 nF/cm²，畫素電容 0.5 pF）</h4><div class="readout" id="m-read2"></div></div></div>`);
  function task() {
    const [W, H, nm] = RES[PM.res], sub = W * H * 3, per = sub * PM.hz, tl = 1 / (PM.hz * H) * 1e6, rate = sub * PM.bits * PM.hz / 1e9;
    $('#m-pipe').innerHTML = [['影像資料', `${nm} ${PM.hz} Hz`], ['TCON', '時序、過驅動、Gamma'], ['源極驅動', `${(W * 3).toLocaleString()} 條資料線`], ['閘極驅動', `${H.toLocaleString()} 條閘極線`], ['畫素電路', '寫入並保持'], ['光輸出', '']].map(([a, b], i) => `<div><b>${a}</b><span>${b}</span></div>${i < 5 ? '<i>→</i>' : ''}`).join('');
    reads('#m-read', [['子畫素數', sub.toExponential(2).replace('e+', '×10^')], ['每秒類比量', per.toExponential(2).replace('e+', '×10^')], ['列時間', tl.toFixed(2) + ' µs'], ['資料率', rate.toFixed(1) + ' Gbps'], ['直接驅動走線', sub.toExponential(2).replace('e+', '×10^')], ['矩陣走線', (H + W * 3).toLocaleString()]].map(([k, v]) => [k, sup(v)]));
  }
  const IMG = ['00111100', '01000010', '10100101', '10000001', '10100101', '10011001', '01000010', '00111100'].map(r => [...r].map(Number));
  let t0 = performance.now(), frameT = 0;
  function scanFrame() {
    if (!$('#m-grid')) { matAnim = null; return; }
    const now = performance.now(); frameT = ((now - t0) / 1000 * PM.speed) % 2; // 2 個影格 / 每影格 1 秒（慢動作）
    const row = Math.floor((frameT % 1) * 8), pol = frameT < 1 ? 1 : -1;
    const { ctx, w, h } = fit($('#m-grid'), W0 => Math.min(W0, 280));
    const s = Math.min(w, h) - 30, cell = s / 8, ox = (w - s) / 2 + 10, oy = 10;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      let v;
      if (PM.mode === 'am') { const written = j < row || frameT >= 1 ? true : j <= row; v = IMG[j][i] ? 1 : 0.05; if (frameT < 1 && j > row) v = IMG[j][i] ? 1 : 0.05; }
      else v = j === row ? (IMG[j][i] ? 1 : 0.15) : (0.18 + 0.1 * IMG[row][i]);
      const g = 20 + 220 * v; ctx.fillStyle = rgb([g * .8, g * .85, g]); ctx.fillRect(ox + i * cell + 1, oy + j * cell + 1, cell - 2, cell - 2);
    }
    ctx.strokeStyle = css('accent'); ctx.lineWidth = 2; ctx.strokeRect(ox - 2, oy + row * cell, s + 4, cell);
    ctx.fillStyle = css('accent'); ctx.font = FONT(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('掃描 →', ox - 4, oy + row * cell + cell / 2);
    // 畫素 (3,4) 電壓
    const pts = []; const tr = 2, tc = 2;
    for (let t = 0; t <= 2; t += 0.004) {
      const f = Math.floor(t), ph = t % 1, r = Math.floor(ph * 8), p = f === 0 ? 1 : -1, on = IMG[tr][tc];
      let v;
      if (PM.mode === 'am') { const written = ph >= (tr + 1) / 8; const pol = written ? p : -p; const since = written ? ph - (tr + 1) / 8 : ph + 1 - (tr + 1) / 8; v = pol * (on ? 1 : 0.1) * (1 - 0.06 * since); }
      else v = r === tr ? p * (on ? 1 : 0.25) * 1.6 : p * 0.35 * (IMG[r][tc] ? 1 : -1);
      pts.push([t, v]);
    }
    plot($('#m-pix'), 200, { x: [0, 2], y: [-1.8, 1.8], xt: [0, 1, 2], yt: [-1.5, 0, 1.5], xf: t => t + ' 格', yf: t => t === 0 ? 'Vcom' : t > 0 ? '+' : '−', xl: '時間', yl: '畫素電壓',
      pre(ctx, X, Y) { ctx.fillStyle = withAlpha(css('muted'), .18); for (const f of [0, 1]) ctx.fillRect(X(f + tr / 8), Y(1.8), X(f + (tr + 1) / 8) - X(f + tr / 8), Y(-1.8) - Y(1.8)); },
      series: [{ pts, col: css('accent'), w: 2 }], vl: [{ x: frameT, col: css('warm') }] });
    matAnim = requestAnimationFrame(scanFrame);
  }
  function selection() {
    const N = PM.N, r = Math.sqrt((Math.sqrt(N) + 1) / (Math.sqrt(N) - 1));
    const pts = []; for (let l = Math.log10(2); l <= Math.log10(2160); l += .02) { const n = Math.pow(10, l); pts.push([l, Math.sqrt((Math.sqrt(n) + 1) / (Math.sqrt(n) - 1))]); }
    plot($('#m-sel'), 220, { x: [Math.log10(2), Math.log10(2160)], y: [1, 2.5], xt: [1, 2, 3], xf: t => ['10', '100', '1000'][t - 1], yt: [1, 1.5, 2, 2.5], yf: t => t.toFixed(1), xl: '列數 N', yl: 'Von / Voff', series: [{ pts, col: css('accent'), w: 2.2 }], dots: [{ x: Math.log10(N), y: r, col: css('warm'), r: 5 }] });
    const w = PM.stn ? 0.03 : 0.18, Vc = 1.25;
    const T = v => 1 / (1 + Math.exp(-(v - Vc) / w)), Voff = Vc - (PM.stn ? 0.04 : 0.12), Von = Voff * r;
    const tv = []; for (let v = 0; v <= 2.5; v += .01) tv.push([v, T(v)]);
    plot($('#m-tv'), 220, { x: [0, 2.5], y: [0, 1.02], xt: [0, .5, 1, 1.5, 2, 2.5], yt: [0, .5, 1], xl: 'Vrms（相對）', yl: '亮度', series: [{ pts: tv, col: css('ink'), w: 2 }], dots: [{ x: Voff, y: T(Voff), col: css('muted'), r: 6 }, { x: Von, y: T(Von), col: css('warm'), r: 6 }],
      post(ctx, X, Y) { ctx.font = FONT(); ctx.fillStyle = css('ink'); ctx.textAlign = 'left'; ctx.fillText(`開／關亮度比 ${(T(Von) / T(Voff)).toFixed(2)}`, X(0.05), Y(0.92)); } });
  }
  function tft() {
    const series = Object.entries(TFTM).map(([k, m], i) => { const p = []; for (let v = -10; v <= 25; v += .25) p.push([v, Math.log10(tftI(m, v, 10))]); return { pts: p, col: css(['warm', 'accent', 'sy'][i]), w: k === PM.mat ? 3 : 1.4 }; });
    plot($('#m-iv'), 230, { x: [-10, 25], y: [-16, -2], xt: [-10, 0, 10, 20], yt: [-15, -12, -9, -6, -3], yf: t => '10' + ({ '-15': '⁻¹⁵', '-12': '⁻¹²', '-9': '⁻⁹', '-6': '⁻⁶', '-3': '⁻³' })[t], xl: 'V_GS (V)', yl: 'I_D (A)', m: { l: 50 }, series, vl: [{ x: PM.vgs, col: css('muted') }] });
    const m = TFTM[PM.mat], vds = 0.1, Ron = vds / tftI(m, PM.vgs, vds), tau = Ron * 0.5e-12;
    reads('#m-read2', [['遷移率 μ', m.mu + ' cm²/V·s'], ['關閉電流', sup(m.ioff.toExponential(0).replace('e', '×10^')) + ' A'], ['導通電阻 R_on', fmtSI(Ron / 1e6) + ' MΩ'], ['充電時間常數 τ', fmtSI(tau * 1e6) + ' µs'], ['60 Hz 保持壓降', fmtSI(m.ioff / 60 / 0.5e-12 * 1000) + ' mV'], ['1 Hz 保持壓降', fmtSI(m.ioff / 1 / 0.5e-12 * 1000) + ' mV']]);
  }
  redraw = () => { task(); selection(); tft(); };
  bindSeg('m-res', k => { PM.res = k; schedule(task); });
  bindSlider('m-hz', v => v + ' Hz', v => { PM.hz = v; schedule(task); });
  bindSeg('m-bits', k => { PM.bits = +k; schedule(task); });
  bindSeg('m-mode', k => { PM.mode = k; });
  bindSlider('m-speed', v => v.toFixed(2) + '×', v => { PM.speed = v; });
  bindSlider('m-N', v => Math.round(Math.pow(10, v)), v => { PM.N = Math.round(Math.pow(10, v)); schedule(selection); });
  $('#m-stn').addEventListener('change', e => { PM.stn = e.target.checked; schedule(selection); });
  bindSeg('m-mat', k => { PM.mat = k; schedule(tft); });
  bindSlider('m-vgs', v => v + ' V', v => { PM.vgs = v; schedule(tft); });
  redraw();
  if (matAnim) cancelAnimationFrame(matAnim);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) PM.speed = Math.min(PM.speed, 0.2);
  matAnim = requestAnimationFrame(scanFrame);
}

/* ---------- 8 畫素電路 ---------- */
const PP = { mat: 'asi', hz: 60, cst: 0.3, rows: 2160, inv: 'dot', invF: 0, vov: 2, sig: 0.15, comp: false, em: 100, hzL: 60, apl: 0.05, seed: 3 };
function PagePixel(main) {
  main.innerHTML = head('主題 8．W05', '畫素電路：1T1C、2T1C 與 LTPO', 'LCD 畫素是「電壓控制的光閥」：TFT 在列時間內寫入電壓，電容保持到下一格。OLED 畫素是「電流源」：驅動 TFT 在飽和區把電壓轉成電流，所以 V_th 的差異會直接變成亮度不均。LTPO 再把保持時間拉長到 1 秒，換取省電。') +
  hTitle('8.1　1T1C 液晶畫素：寫入與保持') +
  lab(`${seg('p-mat', [['asi', 'a-Si'], ['igzo', 'IGZO']], PP.mat)}${slider('p-hz', '更新率', 1, 240, 1, PP.hz, ' Hz')}${slider('p-rows', '列數', 720, 4320, 10, PP.rows)}${slider('p-cst', '儲存電容 C_st', 0, 1, 0.01, PP.cst, ' pF')}`,
    '用 a-Si、2160 列，把更新率從 60 拉到 240 Hz：列時間縮短，寫入時沒充到目標值（左圖）。再把材料換成 IGZO、更新率降到 1 Hz：保持壓降仍只有幾 mV。',
    `<h3>等效電路</h3><ul><li><b>TFT</b>：閘極線開啟時導通，把資料電壓寫入畫素電極。</li><li><b>C<sub>LC</sub></b>：畫素電極與共同電極夾住液晶，約 0.1–0.3 pF，隨灰階改變。</li><li><b>C<sub>st</sub></b>：儲存電容，提高保持能力並降低饋通電壓。</li><li><b>C<sub>gs</sub></b>：寄生電容，閘極關閉的瞬間把畫素電壓往下拉（饋通 ΔV<sub>p</sub>）。</li></ul>
    <div class="eq">${tex('V_p(t)=V_D+(V_{p0}-V_D)e^{-t/R_{on}C_p},\\qquad \\Delta V_{\\text{hold}}=\\frac{I_{\\text{off}}T_{\\text{frame}}}{C_{LC}+C_{st}}', true)}</div>
    <p>8-bit 平均階距約 16 mV（4 V／255），殘餘誤差須小於 0.2%，也就是需要 t ≥ 6–7 τ。</p>`,
    `<div class="card"><h4>等效電路</h4><canvas id="p-sch"></canvas></div>
    <div class="grid2"><div class="card"><h4>寫入階段（列時間內，µs）</h4><canvas id="p-w"></canvas></div><div class="card"><h4>兩個影格（ms，極性反轉）</h4><canvas id="p-h"></canvas></div></div>
    <div class="card"><div class="readout" id="p-read"></div></div>`) +
  hTitle('8.2　極性反轉') +
  lab(`${seg('p-inv', [['frame', '逐影格'], ['line', '逐列'], ['column', '逐行'], ['dot', '逐點']], PP.inv)}<button type="button" class="btn" id="p-flip">切到下一個影格</button>`,
    '比較逐影格與逐點：正負極性的穿透率若略有差異，逐影格會讓整面一起以 f/2 閃，逐點則讓相鄰畫素一亮一暗互相抵消。',
    `<h3>為什麼要反轉？</h3><p>液晶長時間承受同方向直流偏壓，離子會遷移並吸附在配向層界面，造成殘影與 V<sub>com</sub> 漂移。每個影格把畫素電壓相對 V<sub>com</sub> 反轉，時間平均的直流分量為零；液晶回應 V<sub>rms</sub>，畫面不變。</p>
    <table class="metrics"><tr><td>逐影格</td><td>閃爍最明顯；擺幅低</td></tr><tr><td>逐列</td><td>水平條紋；擺幅高</td></tr><tr><td>逐行</td><td>垂直未抵消；擺幅低</td></tr><tr><td>逐點</td><td>最不明顯；擺幅高</td></tr></table>`,
    `<div class="grid2"><div class="card"><h4>極性分布（紅 = +，藍 = −）</h4><canvas id="p-pol"></canvas></div><div class="card"><h4>若正極性亮 2%：人眼看到的大面積平均</h4><canvas id="p-flk"></canvas><p class="cap">左：影格 A；右：影格 B。空間平均差越小，閃爍越不明顯。</p></div></div>`) +
  hTitle('8.3　AMOLED 2T1C：V_th 變異與補償') +
  lab(`${slider('p-vov', '過驅動電壓 V_ov = V_GS − V_th', 0.5, 4, 0.05, PP.vov, ' V')}${slider('p-sig', 'V_th 變異（標準差）', 0, 0.5, 0.01, PP.sig, ' V')}<label class="chk"><input type="checkbox" id="p-comp" ${PP.comp ? 'checked' : ''}>內部補償（如 7T1C）：先取樣 V_th 再疊加資料</label>${slider('p-em', 'EM 工作週期（低亮度 PWM 調光）', 5, 100, 1, PP.em, '%')}`,
    '把 V_ov 降到 1 V 附近（低灰階）：同樣的 V_th 變異造成更嚴重的不均。勾選內部補償，V_th 從電流式子裡消掉，面板變均勻。',
    `<h3>平方律把小差異放大</h3><div class="eq">${tex('I_{\\text{OLED}}\\approx\\tfrac12\\mu C_{ox}\\tfrac WL(V_{GS}-V_{th})^2,\\qquad L_{\\text{avg}}\\propto I_{\\text{OLED}}\\times D_{\\text{EM}}', true)}</div>
    <p>例：V<sub>ov</sub> = 2 V、ΔV<sub>th</sub> = 0.5 V → 電流剩 (1.5/2)² = 56%。LTPS 雷射結晶的晶粒差異造成空間不均（Mura）；偏壓應力造成時間漂移（燒屏）。</p>
    <p><b>內部補償</b>：讓驅動 TFT 接成二極體，把 V<sub>GS</sub> = V<sub>th</sub> 存進電容，再疊上資料電壓，得到 I ∝ (V<sub>data</sub>)²。</p>
    <p><b>EM 調光</b>：低亮度時只降電流會讓 OLED 與 TFT 進入非理想區，改用 EM 工作週期縮短發光時間，代價是閃爍風險（第 3 頁）。</p>`,
    `<div class="grid2"><div class="card"><h4>2T1C 電路</h4><canvas id="p-2t"></canvas></div><div class="card"><h4>面板亮度（每格一個畫素）</h4><canvas id="p-mura"></canvas></div></div>
    <div class="card"><div class="readout" id="p-read2"></div></div>`) +
  hTitle('8.4　LTPO 與可變更新率') +
  lab(`${slider('p-hzL', '更新率', 1, 120, 1, PP.hzL, ' Hz')}${slider('p-apl', '畫面平均亮度 APL', 0, 1, 0.01, PP.apl)}`,
    'APL 設在 0.05（暗的靜態畫面，如 AOD），把更新率從 120 降到 1 Hz，省約 40%；APL 拉到 0.7 再做一次，只省約 12%，因為降低更新率只減少驅動項。',
    `<h3>兩種 TFT 各司其職</h3><p>LTPO 以 LTPS 做驅動（大電流），以氧化物做開關（I<sub>off</sub> &lt; 10⁻¹⁵ A），畫素電壓可保持到 1 Hz，壓降只有 mV 量級。</p>
    <div class="eq">${tex('P(f)=P_{\\text{發光}}+k\\,f', true)}</div><p>降低更新率<b>只能減少驅動項</b>（資料線充放電、掃描），發光所需的功耗不變。代價：兩套半導體製程、光罩數增加、時序控制更複雜。</p>`,
    `<div class="grid2"><div class="card"><h4>面板功耗 vs 更新率</h4><canvas id="p-pw"></canvas><div class="legend"><span><i style="border-color:var(--accent);border-top-width:8px;opacity:.5"></i>驅動項 k·f</span><span><i style="border-color:var(--warm);border-top-width:8px;opacity:.5"></i>發光項</span></div></div>
    <div class="card"><h4>保持期間的畫素壓降（C = 0.5 pF）</h4><canvas id="p-dr"></canvas><div class="legend"><span><i style="border-color:var(--warm)"></i>LTPS 開關（1 pA）</span><span><i style="border-color:var(--accent)"></i>氧化物開關（1 fA）</span><span><i class="d" style="border-color:var(--muted)"></i>8-bit 階距 16 mV</span></div></div></div>
    <div class="card"><div class="readout" id="p-read3"></div></div>`);
  function schematic(cv, kind) {
    const { ctx, w, h } = fit(cv, kind === 'lcd' ? 220 : 240);
    ctx.strokeStyle = css('ink'); ctx.fillStyle = css('ink'); ctx.lineWidth = 1.6; ctx.font = FONTB(); ctx.textBaseline = 'middle';
    const L = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
    const tft = (x, y, lab) => { L([[x - 18, y], [x - 6, y]]); L([[x + 6, y], [x + 18, y]]); L([[x - 6, y - 8], [x + 6, y - 8]]); L([[x - 8, y - 14], [x + 8, y - 14]]); L([[x - 6, y], [x - 6, y - 8]]); L([[x + 6, y], [x + 6, y - 8]]); ctx.textAlign = 'center'; ctx.fillText(lab, x, y + 14); };
    const cap = (x, y, lab, vert = true) => { L([[x - 12, y - 4], [x + 12, y - 4]]); L([[x - 12, y + 4], [x + 12, y + 4]]); ctx.textAlign = 'left'; ctx.fillText(lab, x + 16, y); };
    if (kind === 'lcd') {
      const gx = 40, gy = 40, dx = 70; ctx.strokeStyle = css('accent'); L([[20, gy], [w - 20, gy]]); ctx.fillStyle = css('accent'); ctx.textAlign = 'left'; ctx.fillText('閘極線（掃描）', w - 150, gy - 12);
      ctx.strokeStyle = css('warm'); L([[dx, 20], [dx, h - 10]]); ctx.fillStyle = css('warm'); ctx.save(); ctx.translate(dx - 12, h - 60); ctx.rotate(-Math.PI / 2); ctx.fillText('資料線', 0, 0); ctx.restore();
      ctx.strokeStyle = css('ink'); ctx.fillStyle = css('ink');
      const ty = 100, tx = 130; L([[dx, ty], [tx - 18, ty]]); tft(tx, ty, 'TFT'); L([[tx, ty - 14], [tx, gy]]);
      const nx = 210; L([[tx + 18, ty], [nx + 90, ty]]); ctx.beginPath(); ctx.arc(nx, ty, 3, 0, 7); ctx.fill(); ctx.textAlign = 'left'; ctx.fillText('畫素電極 Vp', nx - 30, ty - 14);
      L([[nx, ty], [nx, 146]]); cap(nx, 150, 'C_LC'); L([[nx, 154], [nx, 190]]); ctx.fillText('Vcom', nx - 14, 202);
      L([[nx + 90, ty], [nx + 90, 146]]); cap(nx + 90, 150, `C_st ${PP.cst.toFixed(2)} pF`); L([[nx + 90, 154], [nx + 90, 190]]); ctx.fillText('Vcs', nx + 76, 202);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = css('muted'); L([[tx + 8, ty - 14], [tx + 40, ty - 40], [nx - 8, ty - 4]]); ctx.setLineDash([]); ctx.fillStyle = css('muted'); ctx.fillText('C_gs（寄生）', tx + 44, ty - 46);
    } else {
      ctx.strokeStyle = css('accent'); L([[20, 30], [w - 20, 30]]); ctx.fillStyle = css('accent'); ctx.textAlign = 'left'; ctx.fillText('掃描線', w - 80, 18);
      ctx.strokeStyle = css('warm'); L([[50, 10], [50, h - 10]]); ctx.fillStyle = css('warm'); ctx.fillText('資料線', 56, h - 16);
      ctx.strokeStyle = css('ink'); ctx.fillStyle = css('ink');
      L([[50, 80], [82, 80]]); tft(100, 80, 'T1 開關'); L([[100, 66], [100, 30]]);
      L([[118, 80], [170, 80]]); ctx.beginPath(); ctx.arc(170, 80, 3, 0, 7); ctx.fill(); ctx.textAlign = 'left'; ctx.fillText('節點 A', 150, 64);
      L([[170, 80], [170, 120]]); cap(170, 124, 'C_st'); L([[170, 128], [170, 150], [230, 150]]);
      ctx.strokeStyle = css('ink'); L([[w - 60, 10], [w - 60, 60]]); ctx.fillText('VDD', w - 52, 16);
      // T2 垂直
      const tx = w - 60, ty = 100; L([[tx, 60], [tx, ty - 14]]); L([[tx, ty + 14], [tx, 150]]); L([[tx - 8, ty - 10], [tx - 8, ty + 10]]); L([[tx - 14, ty - 12], [tx - 14, ty + 12]]); L([[tx - 8, ty - 10], [tx, ty - 14]]); L([[tx - 8, ty + 10], [tx, ty + 14]]);
      L([[170, 80], [tx - 30, 80], [tx - 30, ty], [tx - 14, ty]]); ctx.textAlign = 'right'; ctx.fillText('T2 驅動', tx - 18, ty + 26);
      L([[230, 150], [tx, 150]]);
      // OLED
      L([[tx, 150], [tx, 172]]); ctx.beginPath(); ctx.moveTo(tx - 12, 172); ctx.lineTo(tx + 12, 172); ctx.lineTo(tx, 190); ctx.closePath(); ctx.stroke(); L([[tx - 12, 190], [tx + 12, 190]]); L([[tx, 190], [tx, 215]]);
      ctx.textAlign = 'left'; ctx.fillText('OLED', tx + 16, 182); ctx.fillText('VSS', tx + 6, 226);
      ctx.fillStyle = css('accent'); ctx.fillText('→ I_OLED', tx + 6, 162);
    }
  }
  const MAT = { asi: { R: 1.2e6, ioff: 1e-12 }, igzo: { R: 0.15e6, ioff: 1e-15 } };
  function lcd() {
    schematic($('#p-sch'), 'lcd');
    const m = MAT[PP.mat], Clc = 0.2e-12, Cst = PP.cst * 1e-12, Cgs = 0.02e-12, Ct = Clc + Cst + Cgs;
    const tau = m.R * Ct, tl = 1 / (PP.hz * PP.rows), Tf = 1 / PP.hz, VD = 4, V0 = -4;
    const chargeFrac = 1 - Math.exp(-tl / tau), Vend = VD + (V0 - VD) * Math.exp(-tl / tau), fT = Cgs / Ct * 25, droop = m.ioff * Tf / (Clc + Cst + 1e-18);
    const wpts = []; const span = Math.max(tl * 1.6, 7 * tau); for (let t = 0; t <= span; t += span / 300) wpts.push([t * 1e6, t <= tl ? VD + (V0 - VD) * Math.exp(-t / tau) : Vend - fT]);
    plot($('#p-w'), 200, { x: [0, span * 1e6], y: [-4.5, 4.5], xt: [0, span * 1e6 / 2, span * 1e6].map(v => +v.toFixed(2)), yt: [-4, 0, 4], xl: 't (µs)', yl: 'Vp (V)',
      pre(ctx, X, Y) { ctx.fillStyle = withAlpha(css('accent'), .12); ctx.fillRect(X(0), Y(4.5), X(tl * 1e6) - X(0), Y(-4.5) - Y(4.5)); ctx.font = FONTB(); ctx.fillStyle = css('accent'); ctx.textAlign = 'left'; ctx.fillText('閘極開啟（列時間）', X(0) + 4, Y(4.2) + 8); },
      series: [{ pts: [[0, VD], [span * 1e6, VD]], col: css('muted'), w: 1, dash: [4, 3] }, { pts: wpts, col: css('warm'), w: 2.2 }] });
    const hp = []; for (let k = 0; k < 2; k++) { const s = k ? -1 : 1, t0 = k * Tf; hp.push([t0 * 1e3, -s * (Math.abs(Vend) - fT)]); const vstart = s * Math.abs(Vend) - fT; hp.push([(t0 + tl) * 1e3, vstart]); hp.push([(t0 + Tf) * 1e3, vstart - s * droop * 40]); }
    plot($('#p-h'), 200, { x: [0, 2 * Tf * 1e3], y: [-5, 5], xt: [0, Tf * 1e3, 2 * Tf * 1e3].map(v => +v.toFixed(1)), yt: [-4, 0, 4], xl: 't (ms)', yl: 'Vp (V)', series: [{ pts: hp, col: css('accent'), w: 2 }],
      post(ctx, X, Y) { ctx.font = FONTB(); ctx.fillStyle = css('muted'); ctx.textAlign = 'left'; ctx.fillText('保持壓降放大 40 倍顯示', X(0) + 4, Y(-4.4)); } });
    reads('#p-read', [['列時間', (tl * 1e6).toFixed(2) + ' µs'], ['τ = R_on·C', (tau * 1e6).toFixed(2) + ' µs'], ['寫入達成率', (chargeFrac * 100).toFixed(1) + '%'], ['列時間 / τ', (tl / tau).toFixed(1)], ['保持壓降', fmtSI(droop * 1000) + ' mV'], ['饋通 ΔVp', (fT * 1000).toFixed(0) + ' mV']]);
  }
  function polarity() {
    const sign = (i, j, f) => { const s = { frame: 1, line: j % 2 ? -1 : 1, column: i % 2 ? -1 : 1, dot: (i + j) % 2 ? -1 : 1 }[PP.inv]; return f ? -s : s; };
    const { ctx, w, h } = fit($('#p-pol'), W0 => Math.min(W0, 240)); const s = Math.min(w, h) - 10, c = s / 8, ox = (w - s) / 2;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const v = sign(i, j, PP.invF); ctx.fillStyle = v > 0 ? withAlpha(css('sx'), .75) : withAlpha(css('sz'), .75); ctx.fillRect(ox + i * c + 1, 5 + j * c + 1, c - 2, c - 2); ctx.fillStyle = '#fff'; ctx.font = FONT(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v > 0 ? '+' : '−', ox + i * c + c / 2, 5 + j * c + c / 2); }
    const g = fit($('#p-flk'), W0 => Math.min(W0 * .5, 200)); const bw = (g.w - 20) / 2;
    [0, 1].forEach(f => { let sum = 0; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) sum += sign(i, j, f) > 0 ? 1.02 : 1; const avg = sum / 64; const v = 128 + (avg - 1.01) * 3500; g.ctx.fillStyle = rgb([v, v, v]); g.ctx.fillRect(f * (bw + 20), 0, bw, g.h - 20); g.ctx.fillStyle = css('muted'); g.ctx.font = FONT(); g.ctx.textAlign = 'center'; g.ctx.textBaseline = 'top'; g.ctx.fillText(`影格 ${'AB'[f]}：${(avg * 100 - 100).toFixed(1)}%`, f * (bw + 20) + bw / 2, g.h - 16); });
  }
  function oled() {
    schematic($('#p-2t'), 'oled');
    let s = PP.seed; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const { ctx, w, h } = fit($('#p-mura'), W0 => Math.min(W0 * .75, 260)); const nx = 16, ny = 12, c = Math.min(w / nx, h / ny), ox = (w - c * nx) / 2;
    let mn = 9, mx = 0; const I0 = PP.vov ** 2;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const dv = PP.sig * gauss() + PP.sig * 0.6 * Math.sin(i / 3) * Math.cos(j / 4); const I = PP.comp ? I0 : Math.max(0, PP.vov - dv) ** 2; const r = I / I0; mn = Math.min(mn, r); mx = Math.max(mx, r);
      const v = 255 * Math.pow(Math.min(1.6, r) * PP.em / 100 / 1.6, 1 / 2.2) * 1.25; ctx.fillStyle = rgb([v, v * .96, v * .9]); ctx.fillRect(ox + i * c, j * c, c - 1, c - 1);
    }
    reads('#p-read2', [['ΔVth = 0.5 V 時電流', (Math.max(0, PP.vov - .5) ** 2 / PP.vov ** 2 * 100).toFixed(0) + '%'], ['面板最暗／最亮', `${(mn * 100).toFixed(0)}% / ${(mx * 100).toFixed(0)}%`], ['平均亮度 ∝ I × D', (PP.em).toFixed(0) + '%'], ['EM 閃爍', PP.em < 100 ? '有（調變深度 100%）' : '無']]);
  }
  function ltpo() {
    const k = 1, Pe = 150 + 1000 * PP.apl, P = f => Pe + k * f, fs = []; for (let f = 1; f <= 120; f += 1) fs.push(f);
    const top = P(120) * 1.08;
    plot($('#p-pw'), 230, { x: [1, 120], y: [0, top], xt: [1, 30, 60, 90, 120], yt: [0, Math.round(top / 2), Math.round(top)], xl: '更新率 (Hz)', yl: '功耗（相對）', m: { l: 48 },
      pre(ctx, X, Y) { ctx.beginPath(); ctx.moveTo(X(1), Y(0)); fs.forEach(f => ctx.lineTo(X(f), Y(Pe))); ctx.lineTo(X(120), Y(0)); ctx.closePath(); ctx.fillStyle = withAlpha(css('warm'), .3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(X(1), Y(Pe)); fs.forEach(f => ctx.lineTo(X(f), Y(P(f)))); fs.slice().reverse().forEach(f => ctx.lineTo(X(f), Y(Pe))); ctx.closePath(); ctx.fillStyle = withAlpha(css('accent'), .35); ctx.fill(); },
      series: [{ pts: fs.map(f => [f, P(f)]), col: css('ink'), w: 2 }], dots: [{ x: PP.hzL, y: P(PP.hzL), col: css('ink'), r: 5 }] });
    const dr = (ioff) => fs.map(f => [Math.log10(f), Math.log10(ioff / f / 0.5e-12 * 1000)]);
    plot($('#p-dr'), 230, { x: [0, Math.log10(120)], y: [-3, 4], xt: [0, 1, 2], xf: t => ['1', '10', '100'][t], yt: [-3, -2, -1, 0, 1, 2, 3, 4], yf: t => ['1µ', '10µ', '0.1m', '1m', '10m', '0.1', '1', '10'][t + 3], xl: '更新率 (Hz)', yl: '壓降 (V)', m: { l: 44 },
      series: [{ pts: dr(1e-12), col: css('warm'), w: 2 }, { pts: dr(1e-15), col: css('accent'), w: 2 }, { pts: [[0, Math.log10(16)], [2.1, Math.log10(16)]], col: css('muted'), w: 1.2, dash: [5, 4] }], vl: [{ x: Math.log10(PP.hzL), col: css('muted') }] });
    reads('#p-read3', [['發光項', Math.round(Pe)], ['驅動項 k·f', PP.hzL], ['相對 120 Hz 省下', ((1 - P(PP.hzL) / P(120)) * 100).toFixed(1) + '%'], ['LTPS 開關壓降', fmtSI(1e-12 / PP.hzL / 0.5e-12 * 1000) + ' mV'], ['氧化物開關壓降', fmtSI(1e-15 / PP.hzL / 0.5e-12 * 1000) + ' mV']]);
  }
  redraw = () => { lcd(); polarity(); oled(); ltpo(); };
  bindSeg('p-mat', k => { PP.mat = k; schedule(lcd); });
  bindSlider('p-hz', v => v + ' Hz', v => { PP.hz = v; schedule(lcd); });
  bindSlider('p-rows', v => v, v => { PP.rows = v; schedule(lcd); });
  bindSlider('p-cst', v => v.toFixed(2) + ' pF', v => { PP.cst = v; schedule(lcd); });
  bindSeg('p-inv', k => { PP.inv = k; schedule(polarity); });
  $('#p-flip').addEventListener('click', () => { PP.invF ^= 1; schedule(polarity); });
  bindSlider('p-vov', v => v.toFixed(2) + ' V', v => { PP.vov = v; schedule(oled); });
  bindSlider('p-sig', v => v.toFixed(2) + ' V', v => { PP.sig = v; schedule(oled); });
  $('#p-comp').addEventListener('change', e => { PP.comp = e.target.checked; schedule(oled); });
  bindSlider('p-em', v => v + '%', v => { PP.em = v; schedule(oled); });
  bindSlider('p-hzL', v => v + ' Hz', v => { PP.hzL = v; schedule(ltpo); });
  bindSlider('p-apl', v => v.toFixed(2), v => { PP.apl = v; schedule(ltpo); });
  redraw();
}
