// Общее пространство имён игры. Все файлы подключаются обычными <script> и добавляют сюда свои части.
window.GS = window.GS || {};

GS.W = 640;
GS.H = 360;
GS.TILE = 16;

// Палитра нейрокосмоса: ночной фиолет, неоново-зелёный портал, розовое хрючево.
GS.PAL = {
  ink: '#140c1e',
  inkSoft: '#2a1a3e',
  night0: '#07051a',
  night1: '#120c2e',
  night2: '#1d1445',
  night3: '#2b1d5e',
  violet0: '#3a2370',
  violet1: '#5634a3',
  violet2: '#7d52d6',
  violet3: '#b08cff',
  green0: '#0f5a2a',
  green1: '#1f9a3a',
  green2: '#4fe03c',
  green3: '#b4ff5a',
  pink0: '#6e1f4c',
  pink1: '#b03a78',
  pink2: '#e8649e',
  pink3: '#ffa8cf',
  gold0: '#8a5a10',
  gold1: '#d99a1e',
  gold2: '#ffd84a',
  gold3: '#fff3a8',
  red0: '#5e1a20',
  red1: '#b8302e',
  red2: '#ff5a4a',
  cyan0: '#1a5a7a',
  cyan1: '#2ab0d8',
  cyan2: '#8cf2ff',
  steel0: '#3a3a52',
  steel1: '#6a6a88',
  steel2: '#a8acc4',
  steel3: '#e2e4f0',
  white: '#ffffff',
  cream: '#f4eedf',
  orange: '#ff8a2a',
};

GS.hex = (css) => parseInt(css.slice(1), 16);

GS.HERO_COLORS = {
  gennadich: '#4fe03c',
  sanyara: '#b08cff',
  yurich: '#ff5a4a',
};

GS.util = {
  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v),
  rand: (lo, hi) => lo + Math.random() * (hi - lo),
  randInt: (lo, hi) => Math.floor(lo + Math.random() * (hi - lo + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  sign: (v) => (v < 0 ? -1 : 1),
  // Приближение к цели не быстрее чем на step.
  approach: (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target)),
  // Плавное приближение, не зависящее от частоты кадров.
  damp: (v, target, k, dt) => v + (target - v) * (1 - Math.exp(-k * dt)),
  easeInOut: (t) => t * t * (3 - 2 * t),
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  angleDiff: (a, b) => {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  },
  // Детерминированный генератор — чтобы процедурный арт и декор были одинаковыми при каждом запуске.
  rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  },
  shuffle(arr, rnd = Math.random) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec * 100) % 100);
    return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  },
};

// Параметры адресной строки: ?lab, ?level=2, ?boss, ?god, ?coop, ?hero=sanyara, ?debug.
GS.QUERY = (() => {
  const out = {};
  try {
    new URLSearchParams(window.location.search).forEach((v, k) => { out[k] = v === '' ? true : v; });
  } catch (e) { /* без параметров */ }
  return out;
})();
GS.DEBUG = !!(GS.QUERY.debug || GS.QUERY.god);

// Отладка: снимок кадра отправляется POST-запросом на dev-сервер (если он умеет их принимать).
GS.snap = (name = 'snap', scale = 1) => new Promise((resolve) => {
  GS.game.renderer.snapshot((img) => {
    const cv = document.createElement('canvas');
    cv.width = img.width * scale; cv.height = img.height * scale;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    fetch('/__snap?name=' + encodeURIComponent(name), { method: 'POST', body: cv.toDataURL('image/png') })
      .then(() => resolve(name), () => resolve(null));
  });
});
