// Тайлсеты трёх биомов с автотайлингом по маске открытых граней и декор.
// Маска: 1 — открыт верх, 2 — право, 4 — низ, 8 — лево.
GS.TILES = {
  GROUND: 0,       // 0..15 по маске
  GROUND_ALT: 16,  // 16..19 — варианты «внутренних» тайлов
  RUIN: 20,        // 20..35 по маске
  ONEWAY: 36,      // 36 левый край, 37 середина, 38 правый край, 39 одиночная
  SPIKE_UP: 40,
  SPIKE_DOWN: 41,
  GOO_TOP: 42,
  GOO: 43,
  BACK: 44,        // 44..47 задняя стена (без коллизий)
};

GS.THEMES = {
  planet: {
    rock: ['#1d1445', '#2b1d5e', '#3a2370', '#5634a3'], speck: '#140c1e',
    top: ['#1f9a3a', '#4fe03c', '#b4ff5a'], drip: '#1f9a3a',
    ruin: ['#1a1a2c', '#2a2a42', '#3c3c5c', '#5a5a80'], circuit: '#4fe03c',
    oneway: ['#3a3a58', '#6a6a8c', '#a8acc4'], glow: '#4fe03c',
    spike: ['#7d52d6', '#b08cff', '#e8d8ff'],
    goo: ['#1f9a3a', '#4fe03c', '#b4ff5a'],
    back: ['#120c2e', '#1a1240'],
  },
  city: {
    rock: ['#0e1230', '#161c44', '#20285a', '#323e7a'], speck: '#080a1c',
    top: ['#a02a90', '#ff4ad0', '#ffb0f0'], drip: '#a02a90',
    ruin: ['#0c0f24', '#151a3a', '#1f2650', '#2e386e'], circuit: '#8cf2ff',
    oneway: ['#2a2a4a', '#4a4a7a', '#8a8ac0'], glow: '#ff4ad0',
    spike: ['#b8302e', '#ff5a4a', '#ffc0b0'],
    goo: ['#6a1a8a', '#b04ae0', '#e8a8ff'],
    back: ['#0a0c22', '#10143a'],
  },
  core: {
    rock: ['#12121c', '#1c1c2a', '#28283c', '#3c3c58'], speck: '#08080e',
    top: ['#8a2a2a', '#ff5a4a', '#ffb0a0'], drip: '#8a2a2a',
    ruin: ['#101018', '#1a1a28', '#262638', '#3a3a54'], circuit: '#ff5a4a',
    oneway: ['#2a2a3a', '#4a4a64', '#8a8aa8'], glow: '#ff5a4a',
    spike: ['#3cb8d8', '#8cf2ff', '#e0ffff'],
    goo: ['#8a2a2a', '#ff5a4a', '#ffb0a0'],
    back: ['#0c0c14', '#14141e'],
  },
  // Сеть доставки: бирюзовые стойки, «битые данные» вместо слизи.
  cdn: {
    rock: ['#06141f', '#0b2030', '#123047', '#1e4a66'], speck: '#030a10',
    top: ['#1a7a9a', '#3cd8f8', '#c0f8ff'], drip: '#1a7a9a',
    ruin: ['#081822', '#0e2434', '#16344a', '#24506e'], circuit: '#3cd8f8',
    oneway: ['#1e3a50', '#3c6a8a', '#8cc8e8'], glow: '#3cd8f8',
    spike: ['#b8302e', '#ff5a4a', '#ffc0b0'],
    goo: ['#5a1a6a', '#c03ad0', '#ff9af0'],
    back: ['#061420', '#0a1e2e'],
  },
  // Собор Святого Покока: серый камень, красная ковровая дорожка с золотом, дубовые скамьи и балконы, свечи.
  church: {
    rock: ['#2a2438', '#3a3450', '#4a4466', '#6a6488'], speck: '#1a1426',
    top: ['#8a1a2a', '#c0303a', '#ffd84a'], drip: '#8a1a2a',
    ruin: ['#3a2414', '#5a3a1e', '#7a5028', '#a8743a'], circuit: '#ffd84a',
    oneway: ['#4a2e16', '#7a5028', '#c8a070'], glow: '#ffd84a',
    spike: ['#c8b890', '#f2e2b0', '#ff8a2a'],
    goo: ['#1a3a6a', '#3a6ab0', '#8cc8f0'],
    back: ['#141022', '#1c1630'],
  },
  // Пицца-вселенная: тесто с корочкой, сверху расплавленный сыр, коробки из-под пиццы, томатный соус.
  pizza: {
    rock: ['#8a4a1a', '#b8682a', '#d9822b', '#f2b25a'], speck: '#5a2a0a',
    top: ['#e0a020', '#ffd84a', '#fff2a8'], drip: '#e0a020',
    ruin: ['#7a5a3a', '#a8804a', '#c8a070', '#e8c890'], circuit: '#c0302a',
    oneway: ['#5a5a6a', '#8a8aa8', '#c8c8d8'], glow: '#ff8a2a',
    spike: ['#2f7a2a', '#4fa83c', '#b4ff5a'],
    goo: ['#7a1414', '#c0302a', '#ff7a6a'],
    back: ['#3a1a0a', '#4a2410'],
  },
  // Студия SUNO: фиолетовая сцена с неоново-зелёной кромкой, колонки вместо руин.
  suno: {
    rock: ['#120a26', '#1c1038', '#28184c', '#3c2470'], speck: '#0a0618',
    top: ['#1f9a3a', '#4fe03c', '#b4ff5a'], drip: '#1f9a3a',
    ruin: ['#101018', '#1a1a28', '#262638', '#3a3a54'], circuit: '#d070ff',
    oneway: ['#2a1a4a', '#5a3a8a', '#b08cff'], glow: '#d070ff',
    spike: ['#b8302e', '#ff5a4a', '#ffc0b0'],
    goo: ['#a02a90', '#ff4ad0', '#ffb0f0'],
    back: ['#0c0820', '#140c30'],
  },
};

GS.TileArt = (() => {
  const S = 16;

  function ground(p, ox, oy, mask, T, seed) {
    const rnd = GS.util.rng(seed * 7919 + mask * 31 + 1);
    const [d0, d1, d2, d3] = T.rock;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const r = rnd();
        let c = d1;
        if (r < 0.08) c = d0; else if (r < 0.14) c = d2;
        // Пласты породы.
        if ((y + Math.floor(x / 5) + seed) % 7 === 0 && rnd() < 0.7) c = d0;
        p.px(ox + x, oy + y, c);
      }
    }
    // Камушки.
    for (let i = 0; i < 2; i++) {
      const x = 2 + Math.floor(rnd() * 11), y = 4 + Math.floor(rnd() * 9);
      p.rect(ox + x, oy + y, 2, 2, d2); p.px(ox + x, oy + y, d3); p.px(ox + x + 1, oy + y + 1, d0);
    }
    if (mask & 8) { for (let y = 0; y < S; y++) { p.px(ox, oy + y, T.speck); p.px(ox + 1, oy + y, d2); } }
    if (mask & 2) { for (let y = 0; y < S; y++) { p.px(ox + S - 1, oy + y, T.speck); p.px(ox + S - 2, oy + y, d0); } }
    if (mask & 4) {
      for (let x = 0; x < S; x++) { p.px(ox + x, oy + S - 1, T.speck); p.px(ox + x, oy + S - 2, d0); }
      for (let i = 0; i < 2; i++) { const x = 2 + Math.floor(rnd() * 12); p.px(ox + x, oy + S - 1, d0); }
    }
    if (mask & 1) {
      const [g0, g1, g2] = T.top;
      for (let x = 0; x < S; x++) {
        p.px(ox + x, oy, g2);
        p.px(ox + x, oy + 1, g1);
        p.px(ox + x, oy + 2, g1);
        p.px(ox + x, oy + 3, g0);
        if (rnd() < 0.3) p.px(ox + x, oy + 4, g0);
        if (rnd() < 0.12) { p.px(ox + x, oy + 4, g0); p.px(ox + x, oy + 5, g0); p.px(ox + x, oy + 6, T.drip); }
        if (rnd() < 0.25) p.px(ox + x, oy + 1, g2);
      }
      if (mask & 8) { p.px(ox, oy + 1, g0); p.px(ox, oy + 2, T.speck); p.px(ox, oy, T.speck); }
      if (mask & 2) { p.px(ox + S - 1, oy + 1, g0); p.px(ox + S - 1, oy + 2, T.speck); p.px(ox + S - 1, oy, T.speck); }
    }
  }

  function ruin(p, ox, oy, mask, T, seed) {
    const [d0, d1, d2, d3] = T.ruin;
    p.rect(ox, oy, S, S, d1);
    p.rect(ox + 1, oy + 1, S - 2, S - 2, d2);
    p.rect(ox + 2, oy + 2, S - 4, S - 4, d1);
    p.px(ox + 2, oy + 2, d3); p.px(ox + S - 3, oy + 2, d3); p.px(ox + 2, oy + S - 3, d0); p.px(ox + S - 3, oy + S - 3, d0);
    const rnd = GS.util.rng(seed * 13 + mask + 5);
    // Светящиеся дорожки схемы.
    const y = 4 + Math.floor(rnd() * 8);
    const x0 = 3 + Math.floor(rnd() * 4), x1 = 9 + Math.floor(rnd() * 4);
    for (let x = x0; x <= x1; x++) p.px(ox + x, oy + y, T.circuit);
    p.px(ox + x0, oy + y - 1, T.circuit); p.px(ox + x1, oy + y + 1, T.circuit);
    if (rnd() < 0.5) p.rect(ox + x1 - 1, oy + y - 2, 2, 2, GS.Pix.mix(T.circuit, '#ffffff', 0.5));
    if (mask & 1) { p.rect(ox, oy, S, 2, d3); p.rect(ox, oy + 2, S, 1, d0); }
    if (mask & 8) p.rect(ox, oy, 1, S, d0);
    if (mask & 2) p.rect(ox + S - 1, oy, 1, S, d0);
    if (mask & 4) p.rect(ox, oy + S - 1, S, 1, d0);
  }

  function oneway(p, ox, oy, kind, T) {
    const [a, b, c] = T.oneway;
    p.rect(ox, oy, S, 5, b);
    p.rect(ox, oy, S, 1, c);
    p.rect(ox, oy + 4, S, 1, a);
    for (let x = 2; x < S; x += 5) { p.px(ox + x, oy + 2, a); }
    p.rect(ox + 3, oy + 5, 2, 1, T.glow); p.rect(ox + 10, oy + 5, 2, 1, T.glow);
    if (kind === 0 || kind === 3) { p.rect(ox, oy, 1, 5, a); p.rect(ox + 1, oy + 5, 2, 3, a); }
    if (kind === 2 || kind === 3) { p.rect(ox + S - 1, oy, 1, 5, a); p.rect(ox + S - 3, oy + 5, 2, 3, a); }
  }

  function spikes(p, ox, oy, up, T) {
    const [a, b, c] = T.spike;
    for (let i = 0; i < 4; i++) {
      const bx = ox + i * 4 + 2;
      const h = 7 + ((i * 3) % 4);
      for (let j = 0; j < h; j++) {
        const w = Math.floor(j / 3);
        const py = up ? oy + S - h + j : oy + h - 1 - j;
        for (let x = -w; x <= w; x++) p.px(bx + x, py, x < 0 ? b : a);
      }
      p.px(bx, up ? oy + S - h : oy + h - 1, c);
    }
  }

  function goo(p, ox, oy, top, T) {
    const [a, b, c] = T.goo;
    p.rect(ox, oy + (top ? 4 : 0), S, top ? S - 4 : S, a);
    if (top) {
      for (let x = 0; x < S; x++) {
        const h = Math.round(Math.sin(x * 0.8) * 1.2);
        p.px(ox + x, oy + 4 + h, c); p.px(ox + x, oy + 5 + h, b);
      }
      p.circle(ox + 5, oy + 9, 1.5, b); p.px(ox + 5, oy + 8, c);
    } else {
      p.circle(ox + 10, oy + 6, 1.5, b);
    }
  }

  function back(p, ox, oy, v, T) {
    const [a, b] = T.back;
    p.rect(ox, oy, S, S, a);
    const rnd = GS.util.rng(v * 101 + 3);
    for (let i = 0; i < 10; i++) p.px(ox + Math.floor(rnd() * S), oy + Math.floor(rnd() * S), b);
    if (v % 2) p.rect(ox, oy + 7, S, 1, b);
  }

  function generateTheme(scene, name) {
    const T = GS.THEMES[name];
    const p = new GS.Pix(S * 16, S * 4);
    const at = (i) => [(i % 16) * S, Math.floor(i / 16) * S];
    for (let m = 0; m < 16; m++) { const [x, y] = at(GS.TILES.GROUND + m); ground(p, x, y, m, T, m); }
    for (let v = 0; v < 4; v++) { const [x, y] = at(GS.TILES.GROUND_ALT + v); ground(p, x, y, 0, T, 40 + v); }
    for (let m = 0; m < 16; m++) { const [x, y] = at(GS.TILES.RUIN + m); ruin(p, x, y, m, T, m); }
    for (let k = 0; k < 4; k++) { const [x, y] = at(GS.TILES.ONEWAY + k); oneway(p, x, y, k, T); }
    { const [x, y] = at(GS.TILES.SPIKE_UP); spikes(p, x, y, true, T); }
    { const [x, y] = at(GS.TILES.SPIKE_DOWN); spikes(p, x, y, false, T); }
    { const [x, y] = at(GS.TILES.GOO_TOP); goo(p, x, y, true, T); }
    { const [x, y] = at(GS.TILES.GOO); goo(p, x, y, false, T); }
    for (let v = 0; v < 4; v++) { const [x, y] = at(GS.TILES.BACK + v); back(p, x, y, v, T); }
    p.tex(scene, 'tiles_' + name);
  }

  // ——— Декор (спрайты без коллизий) ———
  function decor(scene) {
    const mk = (key, w, h, fn, outline = true) => GS.makeTex(scene, key, w, h, fn, { outline });
    mk('decor/coral', 12, 16, (p) => {
      const c = '#7d52d6', l = '#b08cff';
      p.rect(5, 6, 2, 10, c); p.rect(2, 3, 2, 8, c); p.rect(8, 1, 2, 9, c); p.rect(2, 10, 4, 2, c); p.rect(6, 9, 4, 2, c);
      p.circle(3, 2.5, 1.6, '#ff4a8a'); p.circle(9, 1.2, 1.6, '#4fe03c'); p.circle(6, 5.5, 1.6, '#ff8a2a');
      p.px(2, 4, l); p.px(8, 2, l);
    });
    mk('decor/crystal', 11, 13, (p) => {
      p.poly([[1, 13], [2, 5], [4, 2], [5, 13]], '#3fc22a'); p.poly([[4, 13], [6, 0], [8, 4], [8, 13]], '#4fe03c');
      p.poly([[7, 13], [9, 6], [11, 9], [11, 13]], '#1f9a3a'); p.line(6, 2, 6, 11, '#b4ff5a');
    });
    mk('decor/vcrystal', 9, 12, (p) => {
      p.poly([[0, 12], [2, 3], [4, 12]], '#7d52d6'); p.poly([[3, 12], [5, 0], [7, 12]], '#b08cff'); p.poly([[6, 12], [8, 5], [9, 12]], '#5634a3');
      p.line(5, 2, 5, 10, '#e8d8ff');
    });
    mk('decor/mushroom', 9, 8, (p) => {
      p.ellipse(4.5, 3, 4.5, 3, '#2ab0d8'); p.rect(3, 4, 3, 4, '#e2e4f0'); p.px(2, 2, '#8cf2ff'); p.px(6, 1, '#8cf2ff');
    });
    mk('decor/grass', 9, 5, (p) => {
      [[1, 5, 0], [3, 5, 2], [5, 5, 1], [7, 5, 3]].forEach(([x, y, h]) => p.line(x, y, x + (h % 2 ? 1 : -1), h, '#4fe03c'));
    }, false);
    mk('decor/tower', 14, 40, (p) => {
      p.rect(4, 6, 6, 34, '#2a2a42'); p.rect(2, 20, 10, 4, '#3c3c5c'); p.rect(6, 0, 2, 6, '#5a5a80');
      p.rect(5, 10, 4, 6, '#4fe03c'); p.rect(6, 11, 2, 4, '#b4ff5a'); p.px(7, 0, '#ff5a4a');
      for (let y = 26; y < 40; y += 4) p.rect(4, y, 6, 1, '#1a1a2c');
    });
    mk('decor/sign', 10, 14, (p) => { p.rect(4, 4, 2, 10, '#5a5a80'); });
    mk('decor/antenna', 9, 20, (p) => { p.rect(4, 4, 1, 16, '#6a6a88'); p.line(0, 6, 8, 6, '#6a6a88'); p.line(1, 10, 7, 10, '#6a6a88'); p.circle(4.5, 2.5, 2, '#ff4a8a'); });
    mk('decor/ac', 16, 12, (p) => { p.rect(0, 0, 16, 12, '#3a3a58'); p.circle(8, 6, 4, '#1a1a2c'); p.line(5, 6, 11, 6, '#6a6a88'); p.line(8, 3, 8, 9, '#6a6a88'); });
    mk('decor/cable', 24, 10, (p) => { for (let x = 0; x < 24; x++) p.px(x, Math.round(2 + Math.sin(x / 7.6 * Math.PI) * 6), '#2a2a3a'); }, false);
    mk('decor/server', 16, 30, (p) => {
      p.rect(0, 0, 16, 30, '#1c1c2a'); for (let y = 3; y < 28; y += 5) { p.rect(2, y, 12, 3, '#28283c'); p.px(4, y + 1, y % 2 ? '#4fe03c' : '#ff5a4a'); p.px(6, y + 1, '#ffd84a'); }
    });
  }

  return {
    generate(scene) {
      Object.keys(GS.THEMES).forEach((n) => generateTheme(scene, n));
      decor(scene);
    },

    // Нарисованные тайлы студии SUNO (лист из ChatGPT, см. tools/build_assets.py) поверх процедурных.
    // Автотайлинг сохраняется: открытый верх — тайл с неоновой кромкой, открытые бока и низ — тёмная обводка.
    applyDrawn(scene) { ['suno', 'pizza', 'church'].forEach((theme) => this.applyTheme(scene, theme)); },

    // Листы тайлов темы: <тема>/tile_top, fillA, fillB, cab, foam, owL/owM/owR, gooTop, goo, spike.
    applyTheme(scene, theme) {
      const k = (n) => `${theme}/tile_${n}`;
      if (!scene.textures.exists(k('top')) || !scene.textures.exists('tiles_' + theme)) return;
      const tex = scene.textures.get('tiles_' + theme);
      const cv = tex.getSourceImage();
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const img = (n) => scene.textures.get(k(n)).getSourceImage();
      const at = (i) => [(i % 16) * S, Math.floor(i / 16) * S];
      const T = GS.TILES;
      // Тайл целиком на клетку (обрезанные по краю листа — растянуть до 16×16).
      // top — своей высоты сверху (полки), bottom — своей высоты снизу (шипы: растянутые искажаются).
      const put = (i, n, { flipY = false, dark = 0, top = false, bottom = false } = {}) => {
        const [x, y] = at(i);
        const im = img(n);
        const h = top || bottom ? Math.min(S, im.height) : S;
        const oy = bottom ? S - h : 0;
        ctx.clearRect(x, y, S, S);
        ctx.save();
        if (flipY) { ctx.translate(x, y + S); ctx.scale(1, -1); ctx.drawImage(im, 0, oy, S, h); }
        else ctx.drawImage(im, x, y + oy, S, h);
        ctx.restore();
        if (dark) { ctx.fillStyle = `rgba(6,4,20,${dark})`; ctx.fillRect(x, y, S, S); }
      };
      const ink = GS.PAL.ink;
      for (let m = 0; m < 16; m++) {
        const i = T.GROUND + m;
        // Внутри — простая заливка; вариант с деталями — только редкие «альтернативные» тайлы ниже.
        put(i, m & 1 ? 'top' : 'fillA');
        const [x, y] = at(i);
        ctx.fillStyle = ink;
        if (m & 2) ctx.fillRect(x + S - 1, y, 1, S);
        if (m & 8) ctx.fillRect(x, y, 1, S);
        if (m & 4) ctx.fillRect(x, y + S - 1, S, 1);
      }
      for (let v = 0; v < 4; v++) put(T.GROUND_ALT + v, v === 0 ? 'fillB' : 'fillA');
      for (let m = 0; m < 16; m++) put(T.RUIN + m, 'cab');
      put(T.ONEWAY, 'owL', { top: true });
      put(T.ONEWAY + 1, 'owM', { top: true });
      put(T.ONEWAY + 2, 'owR', { top: true });
      put(T.ONEWAY + 3, 'owM', { top: true });
      put(T.SPIKE_UP, 'spike', { bottom: true });
      put(T.SPIKE_DOWN, 'spike', { flipY: true, bottom: true });
      put(T.GOO_TOP, 'gooTop');
      put(T.GOO, 'goo');
      for (let v = 0; v < 4; v++) put(T.BACK + v, 'foam', { dark: 0.45 + v * 0.05 });
      tex.refresh();
    },
  };
})();
