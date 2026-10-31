/* ===================== 啟動 ===================== */
window.addEventListener('hashchange', route);
let rw = 0; new ResizeObserver(() => { const w = $('#main').clientWidth; if (w !== rw) { rw = w; if (redraw) schedule(redraw); } }).observe($('#main'));
const themeRedraw = () => { if (redraw) schedule(redraw); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeRedraw);
new MutationObserver(themeRedraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
route();
