// Пиксельный «холст»: рисуем по точкам (без сглаживания), затем затеняем края, обводим чернилами
// и превращаем в текстуру Phaser. Вся графика игры процедурная и живёт в этих текстурах.
GS.Pix = class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Array(w * h).fill(null);
  }

  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.d[y * this.w + x] : null; }
  px(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (this.inb(x, y)) this.d[y * this.w + x] = c;
    return this;
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }

  // Эллипс: закрашиваем пиксели, центры которых попадают внутрь.
  ellipse(cx, cy, rx, ry, c) {
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1);
    const y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
    }
    return this;
  }

  circle(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }

  ring(cx, cy, r0, r1, c) {
    const x0 = Math.floor(cx - r1 - 1), x1 = Math.ceil(cx + r1 + 1);
    for (let y = Math.floor(cy - r1 - 1); y <= Math.ceil(cy + r1 + 1); y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d >= r0 && d <= r1) this.px(x, y, c);
      }
    }
    return this;
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  // Многоугольник: точка внутри — по центру пикселя (правило чёт-нечет).
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    pts.forEach(([x, y]) => { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); });
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.px(x, y, c);
      }
    }
    return this;
  }

  // Карта из строк: каждый символ — ключ палитры, '.' и ' ' — прозрачно.
  map(rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c !== undefined) this.px(ox + x, oy + y, c);
      }
    });
    return this;
  }

  replace(from, to) {
    for (let i = 0; i < this.d.length; i++) if (this.d[i] === from) this.d[i] = to;
    return this;
  }

  // Затенение края: пиксель цвета из ramp, у которого в направлении (dx, dy) пусто (на глубину depth), перекрашивается.
  rim(ramp, dx, dy, depth = 1) {
    const out = this.d.slice();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.d[y * this.w + x];
        if (!c || !ramp[c]) continue;
        for (let k = 1; k <= depth; k++) {
          if (this.get(x + dx * k, y + dy * k) === null) { out[y * this.w + x] = ramp[c]; break; }
        }
      }
    }
    this.d = out;
    return this;
  }

  // Шахматный дизеринг цвета c внутри прямоугольника по уже закрашенным пикселям цвета only.
  dither(x, y, w, h, c, only = null, phase = 0) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if ((i + j + phase) % 2) continue;
        const cur = this.get(x + i, y + j);
        if (cur === null) continue;
        if (only && cur !== only) continue;
        this.px(x + i, y + j, c);
      }
    }
    return this;
  }

  // Новый холст на 1 px шире с каждой стороны и чернильной обводкой вокруг непрозрачных пикселей.
  outlined(color = GS.PAL.ink, diag = false) {
    const o = new GS.Pix(this.w + 2, this.h + 2);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.d[(y + 1) * o.w + x + 1] = this.d[y * this.w + x];
    const src = o.d.slice();
    const at = (x, y) => (x >= 0 && y >= 0 && x < o.w && y < o.h ? src[y * o.w + x] : null);
    for (let y = 0; y < o.h; y++) {
      for (let x = 0; x < o.w; x++) {
        if (src[y * o.w + x] !== null) continue;
        let near = at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1);
        if (!near && diag) near = at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y + 1);
        if (near) o.d[y * o.w + x] = color;
      }
    }
    return o;
  }

  flipX() {
    const o = new GS.Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
    return o;
  }

  // Наложить другой холст поверх.
  stamp(src, ox, oy) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.d[y * src.w + x];
      if (c !== null) this.px(ox + x, oy + y, c);
    }
    return this;
  }

  toCanvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const c = this.d[i];
      if (!c) continue;
      const rgba = GS.Pix.rgba(c);
      img.data[i * 4] = rgba[0];
      img.data[i * 4 + 1] = rgba[1];
      img.data[i * 4 + 2] = rgba[2];
      img.data[i * 4 + 3] = rgba[3];
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  tex(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, this.toCanvas());
    return key;
  }

  static rgba(c) {
    let v = GS.Pix._cache.get(c);
    if (v) return v;
    if (c[0] === '#') {
      const n = parseInt(c.slice(1, 7), 16);
      const a = c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255;
      v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
    } else {
      const m = c.match(/[\d.]+/g).map(Number);
      v = [m[0], m[1], m[2], m[3] === undefined ? 255 : Math.round(m[3] * 255)];
    }
    GS.Pix._cache.set(c, v);
    return v;
  }

  // Смешать два css-цвета.
  static mix(a, b, t) {
    const x = GS.Pix.rgba(a), y = GS.Pix.rgba(b);
    const h = (v) => Math.round(v).toString(16).padStart(2, '0');
    return '#' + h(x[0] + (y[0] - x[0]) * t) + h(x[1] + (y[1] - x[1]) * t) + h(x[2] + (y[2] - x[2]) * t);
  }
};
GS.Pix._cache = new Map();

// Реестр частей скелетных ригов: ключ текстуры → точка вращения (в пикселях текстуры).
GS.PARTS = {};

// Создать часть: draw(p) рисует в холст w×h, затем (по желанию) затенение и обводка.
// pivot задаётся в координатах исходного холста; обводка сдвигает его на 1 px.
GS.makePart = (scene, key, w, h, pivot, draw, { outline = true, shade = null, diag = false } = {}) => {
  let p = new GS.Pix(w, h);
  draw(p);
  if (shade) shade(p);
  // Точка вращения — целый пиксель: так части не «дрожат» на пиксельной сетке.
  let px = Math.floor(pivot[0]), py = Math.floor(pivot[1]);
  if (outline) { p = p.outlined(GS.PAL.ink, diag); px += 1; py += 1; }
  p.tex(scene, key);
  GS.PARTS[key] = { ox: px / p.w, oy: py / p.h, w: p.w, h: p.h, px, py };
  return key;
};

// Простая текстура без реестра частей.
GS.makeTex = (scene, key, w, h, draw, { outline = false, diag = false } = {}) => {
  let p = new GS.Pix(w, h);
  draw(p);
  if (outline) p = p.outlined(GS.PAL.ink, diag);
  p.tex(scene, key);
  return key;
};

// Мягкое «неоновое» свечение: концентрические кольца с убывающей прозрачностью (пиксельно, без размытия).
GS.makeGlow = (scene, key, r, color) => {
  const s = r * 2 + 2;
  const p = new GS.Pix(s, s);
  const rgb = GS.Pix.rgba(color);
  const steps = [[1.0, 0.1], [0.75, 0.16], [0.5, 0.24], [0.28, 0.34]];
  steps.forEach(([k, a]) => p.circle(s / 2, s / 2, r * k, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`));
  p.tex(scene, key);
  return key;
};
