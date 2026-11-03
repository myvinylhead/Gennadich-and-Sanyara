// Уровни пишутся ASCII-картами (тайл 16 px). Символы:
//   #  земля         %  техно-руины     =  полка (сквозь снизу)   :  задняя стена
//   ^  шипы вверх    v  шипы вниз        w  слизь
//   @  старт   S  чекпоинт   E  портал выхода   A  артефакт   $  золотая кошка   T  табличка
//   C  монета  P  пицца   K  кофе   D  кристалл-щит   M  ящик Клод-меха   Y  «Я ПОМОГ»
//   h  хрючево   f  летучее   g  гранатомётчик   b  баг   z  спящее   W  попап   R  Петушня   O  босс
//   G  глитч-блок   m  платформа ←→   l  лифт ↕   >  ускоритель   J  батут
//   SUNO: q  эквалайзер   U  сабвуфер   L  лазер-метроном   N  нота-монета
//         x  фальшивая нота   a  автотюн-хрючево   c  копирайт-бот   u  мьют-призрак
//   Пицца: o  колесо   ~  сырный мост   p  пепперони-пила   V  печной жар
//          n  ананас-еретик   d  оливки-дроны   k  сырный слайм   r  курьер на мопеде
//   Собор: F  фанатик   H  аколит   e  токенизатор   y  хор   i  инквизитор   I  колонна «САММАРИ»
//          [ ]  границы контекстного окна   Q  реликвия-скилл
GS.ENTITY_CHARS = '@SEA$TCPKDMYhfgbzWROGml>JqULNxacuo~pVndkrFHeyiI[]Q';

// Склеить карту из кусков одинаковой высоты (каждый кусок дополняется пробелами до своей ширины).
GS.joinChunks = (chunks) => {
  const H = Math.max(...chunks.map((c) => c.rows.length));
  const out = new Array(H).fill('');
  chunks.forEach((c, ci) => {
    const w = c.w || Math.max(...c.rows.map((r) => r.length));
    const pad = H - c.rows.length;
    for (let y = 0; y < H; y++) {
      const row = y < pad ? '' : c.rows[y - pad];
      if (row.length > w && GS.DEBUG) console.warn(`[level] chunk ${ci} row ${y} too long: ${row.length} > ${w}`);
      out[y] += row.slice(0, w).padEnd(w, ' ');
    }
  });
  return out;
};

GS.parseLevel = (def) => {
  const rows = def.map;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(w, ' ').split(''));
  const at = (x, y) => (x < 0 || x >= w ? '#' : y < 0 ? ' ' : y >= h ? '#' : grid[y][x]);
  const SOLID = new Set(['#', '%']);
  const solid = (x, y) => SOLID.has(at(x, y));
  const T = GS.TILES;
  const fg = [], back = [];
  const spawns = [];
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
  for (let y = 0; y < h; y++) {
    fg.push(new Array(w).fill(-1));
    back.push(new Array(w).fill(-1));
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      const mask = (!solid(x, y - 1) ? 1 : 0) | (!solid(x + 1, y) ? 2 : 0) | (!solid(x, y + 1) ? 4 : 0) | (!solid(x - 1, y) ? 8 : 0);
      switch (c) {
        case '#':
          fg[y][x] = mask === 0 && hash(x, y) % 4 === 0 ? T.GROUND_ALT + (hash(x, y) >>> 3) % 4 : T.GROUND + mask;
          break;
        case '%': fg[y][x] = T.RUIN + mask; break;
        case '=': {
          const l = at(x - 1, y) === '=', r = at(x + 1, y) === '=';
          fg[y][x] = T.ONEWAY + (l && r ? 1 : l ? 2 : r ? 0 : 3);
          break;
        }
        case '^': fg[y][x] = T.SPIKE_UP; break;
        case 'v': fg[y][x] = T.SPIKE_DOWN; break;
        case 'w': fg[y][x] = at(x, y - 1) === 'w' ? T.GOO : T.GOO_TOP; break;
        case ':': back[y][x] = T.BACK + hash(x, y) % 4; break;
        default:
          if (GS.ENTITY_CHARS.includes(c)) {
            spawns.push({ c, tx: x, ty: y, x: x * 16 + 8, y: (y + 1) * 16, cy: y * 16 + 8 });
            if (at(x - 1, y) === ':' || at(x + 1, y) === ':') back[y][x] = T.BACK + hash(x, y) % 4;
          }
      }
    }
  }
  // Автодекор на открытых верхних гранях земли.
  const decor = [];
  for (let y = 1; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== '#' || solid(x, y - 1) || at(x, y - 1) !== ' ') continue;
      const r = hash(x, y) % 100;
      if (r < 14) decor.push({ x: x * 16 + 8, y: y * 16 + 3, r });
    }
  }
  return { w, h, fg, back, spawns, decor, grid, at, solid };
};

// Конструктор кусков карты: точные координаты вместо ручного выравнивания строк.
GS.Chunk = class Chunk {
  constructor(w, h = 28) {
    this.w = w;
    this.h = h;
    this.g = Array.from({ length: h }, () => new Array(w).fill(' '));
  }
  fill(x, y, w, h, ch = '#') {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < this.h && i >= 0 && i < this.w) this.g[j][i] = ch;
    return this;
  }
  clear(x, y, w, h) { return this.fill(x, y, w, h, ' '); }
  put(x, y, str) { for (let i = 0; i < str.length; i++) if (str[i] !== '_' && x + i < this.w) this.g[y][x + i] = str[i]; return this; }
  floor(y = 23, ch = '#') { return this.fill(0, y, this.w, this.h - y, ch); }
  get rows() { return this.g.map((r) => r.join('')); }
};
