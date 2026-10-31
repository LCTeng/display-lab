/* ===================== 色度學引擎 ===================== */
const D2R = Math.PI / 180;
const CIE = (() => {
  const n = CMF.x.length, W = [];
  for (let i = 0; i < n; i++) W.push(CMF.w0 + i);
  // 光譜 S(λ) → XYZ
  function xyzOf(S) {
    let X = 0, Y = 0, Z = 0;
    for (let i = 0; i < n; i++) { const s = S(W[i]); X += s * CMF.x[i]; Y += s * CMF.y[i]; Z += s * CMF.z[i]; }
    return [X, Y, Z];
  }
  const gauss = (c, f) => { const s = Math.max(f, 0.3) / 2.3548; return l => Math.exp(-0.5 * ((l - c) / s) ** 2); };
  const planck = T => l => { const m = l * 1e-9; return 1 / (m ** 5 * (Math.exp(0.0143877735 / (m * T)) - 1)); };
  const xyOf = ([X, Y, Z]) => { const t = X + Y + Z; return t > 0 ? [X / t, Y / t] : [1 / 3, 1 / 3]; };
  const toUV = ([x, y]) => { const d = -2 * x + 12 * y + 3; return [4 * x / d, 9 * y / d]; };
  const fromUV = ([u, v]) => { const d = 6 * u - 16 * v + 12; return [9 * u / d, 4 * v / d]; };
  // 光譜軌跡
  const locus = [];
  for (let l = 380; l <= 700; l++) { const i = l - CMF.w0; locus.push({ l, xy: xyOf([CMF.x[i], CMF.y[i], CMF.z[i]]) }); }
  function xyToRGB(x, y) {
    const X = x / y, Y = 1, Z = (1 - x - y) / y;
    let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
    r = Math.max(r, 0); g = Math.max(g, 0); b = Math.max(b, 0);
    const m = Math.max(r, g, b) || 1;
    const enc = c => { c /= m; return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); };
    return [enc(r), enc(g), enc(b)];
  }
  function wlRGB(l) { const i = Math.round(l) - CMF.w0; if (i < 0 || i >= n) return [0, 0, 0]; const xy = xyOf([CMF.x[i], CMF.y[i], CMF.z[i]]); return xyToRGB(xy[0], xy[1]); }
  const STD = {
    srgb: { name: 'sRGB', p: [[0.64, 0.33], [0.30, 0.60], [0.15, 0.06]] },
    p3: { name: 'DCI-P3', p: [[0.680, 0.320], [0.265, 0.690], [0.150, 0.060]] },
    bt2020: { name: 'BT.2020', p: [[0.708, 0.292], [0.170, 0.797], [0.131, 0.046]] },
  };
  const area = p => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
  const ccw = p => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a < 0 ? p.slice().reverse() : p; };
  function clip(subject, clipper) { // Sutherland–Hodgman，兩者皆為凸多邊形
    let out = ccw(subject); const c = ccw(clipper);
    for (let i = 0; i < c.length && out.length; i++) {
      const A = c[i], B = c[(i + 1) % c.length], inp = out; out = [];
      const side = P => (B[0] - A[0]) * (P[1] - A[1]) - (B[1] - A[1]) * (P[0] - A[0]);
      for (let j = 0; j < inp.length; j++) {
        const P = inp[j], Q = inp[(j + 1) % inp.length], sp = side(P), sq = side(Q);
        if (sp >= 0) out.push(P);
        if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
      }
    }
    return out;
  }
  const coverage = (tri, ref) => { const c = clip(tri, ref); return c.length > 2 ? area(c) / area(ref) : 0; };
  return { W, xyzOf, gauss, planck, xyOf, toUV, fromUV, locus, xyToRGB, wlRGB, STD, area, coverage };
})();

/* ===================== 偏光光學（擴展瓊斯，單一傳播方向近似） ===================== */
const OPT = (() => {
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  // layers: {ax 光軸, no, ne, d(µm)}；下偏光片吸收軸 a1、上偏光片吸收軸 a2；θ、φ 為空氣中的觀看方向
  function T(layers, th, ph, a1 = X, a2 = Y, lam = 0.55) {
    const thin = Math.asin(Math.sin(th * D2R) / 1.52), pv = ph * D2R;
    const k = [Math.sin(thin) * Math.cos(pv), Math.sin(thin) * Math.sin(pv), Math.cos(thin)];
    const p1 = nrm(cross(k, a1)), p2 = nrm(cross(k, a2));
    const Er = p1.slice(), Ei = [0, 0, 0];
    for (const L of layers) {
      const n = L.ax, c = dot(n, k);
      let e = [n[0] - c * k[0], n[1] - c * k[1], n[2] - c * k[2]];
      const el = Math.hypot(e[0], e[1], e[2]); if (el < 1e-9) continue;
      e = [e[0] / el, e[1] / el, e[2] / el]; const o = cross(k, e);
      const neff = L.no * L.ne / Math.sqrt(L.ne * L.ne * c * c + L.no * L.no * (1 - c * c));
      const G = 2 * Math.PI * (neff - L.no) * L.d / (lam * Math.cos(thin));
      const aer = dot(Er, e), aei = dot(Ei, e), aor = dot(Er, o), aoi = dot(Ei, o), cg = Math.cos(G), sg = Math.sin(G);
      const ber = aer * cg - aei * sg, bei = aer * sg + aei * cg;
      for (let j = 0; j < 3; j++) { Er[j] = ber * e[j] + aor * o[j]; Ei[j] = bei * e[j] + aoi * o[j]; }
    }
    const r = dot(Er, p2), im = dot(Ei, p2); return r * r + im * im;
  }
  // 補償膜：+A 板（R0 = 135 nm，光軸 ⟂ 下偏光片吸收軸）與 −C 板（Rth = 230 nm）
  const A_PLATE = { ax: Y, no: 1.5, ne: 1.51, d: 13.5 };
  const C_PLATE = { ax: Z, no: 1.51, ne: 1.5, d: 23 };
  return { T, X, Y, Z, A_PLATE, C_PLATE };
})();

/* ===================== VA 液晶模型 ===================== */
const VA = (() => {
  const P = { no: 1.48, ne: 1.58, d: 3.6, Vth: 2.2, N: 12, pre: 1 * D2R, VMAX: 7 };
  // 中間層傾角（自垂直方向量起）隨電壓的近似
  const thetaM = V => V <= P.Vth ? 0 : (Math.PI / 2) * 0.97 * Math.tanh(1.15 * Math.sqrt(V / P.Vth - 1));
  const rod = (beta, az) => [Math.sin(beta) * Math.cos(az), Math.sin(beta) * Math.sin(az), Math.cos(beta)];
  // 單一域：倒向方位角 phid（度）
  function stack(V, phid, comp) {
    const tm = thetaM(V), az = phid * D2R, L = [];
    if (comp) L.push(OPT.A_PLATE);
    for (let i = 0; i < P.N; i++) { const z = (i + 0.5) / P.N; L.push({ ax: rod(P.pre + tm * Math.sin(Math.PI * z), az), no: P.no, ne: P.ne, d: P.d / P.N }); }
    if (comp) L.push(OPT.C_PLATE);
    return L;
  }
  const DOM4 = [45, 135, 225, 315];
  const LEAK = 2e-4; // 實際偏光片的有限消光比
  function T4(V, th, ph, comp) { let s = 0; for (const d of DOM4) s += OPT.T(stack(V, d, comp), th, ph); return s / 4 + LEAK; }
  function T8(V, th, ph, comp, k, a) { return a * T4(V, th, ph, comp) + (1 - a) * T4(k * V, th, ph, comp); }
  function solveV(target, f) { let lo = 0, hi = P.VMAX; for (let i = 0; i < 34; i++) { const m = (lo + hi) / 2; if (f(m) < target) lo = m; else hi = m; } return (lo + hi) / 2; }
  return { P, thetaM, rod, stack, T4, T8, solveV, DOM4, LEAK };
})();

/* ===================== 靜電場：∇·(ε∇V)=0，x 週期、上下 Neumann ===================== */
function solveES(nx, nz, eps, fixed, val, iters) {
  const V = new Float64Array(nx * nz);
  for (let i = 0; i < nx * nz; i++) V[i] = fixed[i] ? val[i] : 0.5;
  const w = 1.88;
  for (let it = 0; it < iters; it++) {
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
      const i = z * nx + x; if (fixed[i]) continue;
      const e0 = eps[i]; let s = 0, ws = 0;
      const xl = z * nx + (x - 1 + nx) % nx, xr = z * nx + (x + 1) % nx;
      let ef = 2 * e0 * eps[xl] / (e0 + eps[xl]); s += ef * V[xl]; ws += ef;
      ef = 2 * e0 * eps[xr] / (e0 + eps[xr]); s += ef * V[xr]; ws += ef;
      if (z > 0) { const j = i - nx; ef = 2 * e0 * eps[j] / (e0 + eps[j]); s += ef * V[j]; ws += ef; }
      if (z < nz - 1) { const j = i + nx; ef = 2 * e0 * eps[j] / (e0 + eps[j]); s += ef * V[j]; ws += ef; }
      V[i] += w * (s / ws - V[i]);
    }
  }
  const Ex = new Float64Array(nx * nz), Ez = new Float64Array(nx * nz);
  for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
    const i = z * nx + x;
    Ex[i] = -(V[z * nx + (x + 1) % nx] - V[z * nx + (x - 1 + nx) % nx]) / 2;
    Ez[i] = z > 0 && z < nz - 1 ? -(V[i + nx] - V[i - nx]) / 2 : 0;
  }
  return { V, Ex, Ez, nx, nz };
}
function smoothPeriodic(arr, sigma) {
  const n = arr.length, out = new Float64Array(n), R = Math.ceil(sigma * 3), w = [];
  let ws = 0; for (let k = -R; k <= R; k++) { const v = Math.exp(-0.5 * (k / sigma) ** 2); w.push(v); ws += v; }
  for (let i = 0; i < n; i++) { let s = 0; for (let k = -R; k <= R; k++) s += w[k + R] * arr[(i + k + n) % n]; out[i] = s / ws; }
  return out;
}

/* ===================== 多域 VA 剖面（突起物／開縫） ===================== */
const VAX = (() => {
  const nx = 150, g = 8, d = 20, nz = g * 2 + d, LC0 = g, LC1 = g + d, DX = 0.2;
  const TOPX = 37, BOTX = 112, BH = 6, BW = 25, SW = 15;
  const SLOPE = Math.atan((BH * DX) / (BW * DX));
  const cache = {};
  function hBump(x, xc) { const dd = Math.abs(x - xc); return dd < BW ? BH * (1 - dd / BW) : 0; }
  function build(mode) {
    if (cache[mode]) return cache[mode];
    const eps = new Float64Array(nx * nz).fill(5.5), fixed = new Uint8Array(nx * nz), val = new Float64Array(nx * nz);
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) if (z < LC0 - 1 || z > LC1) eps[z * nx + x] = 6;
    const hb = new Float64Array(nx), ht = new Float64Array(nx);
    if (mode === 'mva') for (let x = 0; x < nx; x++) { hb[x] = hBump(x, BOTX); ht[x] = hBump(x, TOPX); }
    for (let x = 0; x < nx; x++) {
      for (let j = 0; j < Math.round(hb[x]); j++) eps[(LC0 + j) * nx + x] = 3;
      for (let j = 0; j < Math.round(ht[x]); j++) eps[(LC1 - 1 - j) * nx + x] = 3;
      const slitB = mode === 'pva' && Math.abs(x - BOTX) < SW, slitT = mode === 'pva' && Math.abs(x - TOPX) < SW;
      if (!slitB) { fixed[(LC0 - 1) * nx + x] = 1; val[(LC0 - 1) * nx + x] = 1; }
      if (!slitT) { fixed[LC1 * nx + x] = 1; val[LC1 * nx + x] = 0; }
    }
    const F = solveES(nx, nz, eps, fixed, val, mode === 'single' ? 1 : 900);
    // 倒向符號 s(x)：Δε<0，分子轉離電場方向
    let s = new Float64Array(nx);
    for (let x = 0; x < nx; x++) {
      if (mode === 'single') { s[x] = 1; continue; }
      let a = 0, ws = 0;
      for (let z = LC0 + Math.round(hb[x]); z < LC1 - Math.round(ht[x]); z++) {
        const i = z * nx + x, zz = (z + 0.5 - LC0) / d, w = Math.sin(Math.PI * zz);
        a += w * Math.atan2(F.Ex[i], F.Ez[i]); ws += w;
      }
      s[x] = -Math.tanh((a / ws) / (0.4 * D2R));
    }
    if (mode !== 'single') s = smoothPeriodic(s, 2.5);
    const slit = new Uint8Array(nx * 2);
    if (mode === 'pva') for (let x = 0; x < nx; x++) { slit[x] = Math.abs(x - BOTX) < SW; slit[nx + x] = Math.abs(x - TOPX) < SW; }
    return (cache[mode] = { mode, F, s, hb, ht, slit });
  }
  // 某格點的指向矢傾角（帶正負號，於倒向平面內）
  function beta(M, V, x, zc) {
    const zb = LC0 + M.hb[x], zt = LC1 - M.ht[x];
    if (zc < zb || zc > zt) return null;
    const zp = (zc - zb) / (zt - zb);
    let b = M.s[x] * VA.thetaM(V) * Math.sin(Math.PI * zp);
    if (M.mode === 'single') b += VA.P.pre;
    if (M.mode === 'mva') {
      const db = zc - zb, dt = zt - zc;
      if (M.hb[x] > 0.3) b += Math.sign(x - BOTX) * SLOPE * Math.exp(-db / 1.6) * (1 - Math.abs(b) / (Math.PI / 2));
      if (M.ht[x] > 0.3) b += -Math.sign(x - TOPX) * SLOPE * Math.exp(-dt / 1.6) * (1 - Math.abs(b) / (Math.PI / 2));
    }
    return Math.max(-1.55, Math.min(1.55, b));
  }
  function column(M, V, x, comp) {
    const L = []; if (comp) L.push(OPT.A_PLATE);
    const zb = LC0 + M.hb[x], zt = LC1 - M.ht[x], N = 10, dz = (zt - zb) * (VA.P.d / d) / N;
    for (let i = 0; i < N; i++) { const zc = zb + (i + 0.5) * (zt - zb) / N; const b = beta(M, V, x, zc); L.push({ ax: VA.rod(b, 45 * D2R), no: VA.P.no, ne: VA.P.ne, d: dz }); }
    if (comp) L.push(OPT.C_PLATE);
    return L;
  }
  // 在倒向平面內觀看：θ>0 為 φ=45°，θ<0 為 φ=225°
  const Tcol = (M, V, x, th, comp) => OPT.T(column(M, V, x, comp), Math.abs(th), th >= 0 ? 45 : 225) + VA.LEAK;
  return { nx, nz, g, d, LC0, LC1, DX, TOPX, BOTX, BH, BW, SW, build, beta, Tcol };
})();

/* ===================== IPS / FFS 剖面 ===================== */
const FFS = (() => {
  const DX = 0.2, nz = 60, LC0 = 20, LC1 = 40, d = 20;
  const cache = {};
  const LAM = 0.55;
  function build(mode) {
    if (cache[mode]) return cache[mode];
    const nx = mode === 'ips' ? 150 : 148;
    const eps = new Float64Array(nx * nz).fill(6), fixed = new Uint8Array(nx * nz), val = new Float64Array(nx * nz);
    for (let z = LC0; z < LC1; z++) for (let x = 0; x < nx; x++) eps[z * nx + x] = 6.5;
    const elec = []; // {x0,x1,z,v}
    if (mode === 'ips') { elec.push({ x0: 10, x1: 30, z: LC0 - 1, v: 1 }, { x0: 85, x1: 105, z: LC0 - 1, v: 0 }); }
    else {
      for (let z = LC0 - 3; z < LC0 - 1; z++) for (let x = 0; x < nx; x++) eps[z * nx + x] = 6.5;
      elec.push({ x0: 0, x1: nx, z: LC0 - 4, v: 0, plane: true });
      for (let k = 0; k < 4; k++) elec.push({ x0: 11 + 37 * k, x1: 25 + 37 * k, z: LC0 - 1, v: 1 });
    }
    for (const e of elec) for (let x = e.x0; x < e.x1; x++) { fixed[e.z * nx + x] = 1; val[e.z * nx + x] = e.v; }
    const F = solveES(nx, nz, eps, fixed, val, 1100);
    const ex = new Float64Array(nx), ez = new Float64Array(nx);
    for (let x = 0; x < nx; x++) {
      let a = 0, b = 0, ws = 0;
      for (let z = LC0; z < LC1; z++) { const i = z * nx + x, w = Math.sin(Math.PI * (z + 0.5 - LC0) / d); a += w * F.Ex[i] ** 2; b += w * F.Ez[i] ** 2; ws += w; }
      ex[x] = Math.sqrt(a / ws) / DX; ez[x] = Math.sqrt(b / ws) / DX; // V/µm（每伏特）
    }
    return (cache[mode] = { mode, nx, F, elec, ex: smoothPeriodic(ex, 6), ez: smoothPeriodic(ez, 6) });
  }
  const EC = 0.21; // 特徵場強 V/µm
  // 面內旋轉平衡：Δφ = r·sin(2(φ0−Δφ))/2，φ0 = 80°
  function rot(r) { const p0 = 80 * D2R; let lo = 0, hi = p0; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (m < r * Math.sin(2 * (p0 - m)) / 2) lo = m; else hi = m; } return (lo + hi) / 2; }
  function state(M, V, lc, x) {
    const k = lc === 'n' ? 0.6 : 1;
    const rx = k * (V * M.ex[x] / EC) ** 2, dphi = rot(rx);
    let tilt = 0;
    if (lc === 'p') { const rz = 0.55 * (V * M.ez[x] / EC) ** 2; tilt = rz > 1 ? (Math.PI / 2) * 0.85 * Math.sqrt(1 - 1 / rz) : 0; }
    // 平均於液晶層厚度（錨定使上下表面不動，取 sin 分布之有效值）
    const dEff = 0.64, tEff = 0.64;
    const T = Math.sin(2 * dphi * dEff) ** 2 * Math.sin(Math.PI / 2 * Math.cos(tilt * tEff) ** 2) ** 2;
    return { dphi, tilt, T };
  }
  function avgT(M, V, lc) { let s = 0; for (let x = 0; x < M.nx; x++) s += state(M, V, lc, x).T; return s / M.nx; }
  return { DX, nz, LC0, LC1, d, build, state, avgT };
})();

if (typeof module !== 'undefined') module.exports = { CIE, OPT, VA, VAX, FFS, solveES };
