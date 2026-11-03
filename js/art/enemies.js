// Процедурные пиксельные части врагов, босса, меха и NPC.
GS.EnemyArt = (() => {
  const P = GS.PAL;
  const INK = P.ink;

  // Палитры хрючева: обычное, летучее (сиреневое), гранатомётчик (тёмное), спящее.
  const PIG = {
    pink: { b: '#e8649e', s: '#b03a78', d: '#7a2352', l: '#ffa8cf', spot: '#c9457f' },
    lilac: { b: '#c07ae8', s: '#8a4cc0', d: '#5a2c86', l: '#e8c4ff', spot: '#a25ad6' },
    dark: { b: '#d0507a', s: '#963054', d: '#5e1a34', l: '#ff96b8', spot: '#a83a60' },
  };

  function pigBody(p, C, w, h) {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 2;
    // Шишки-«рецепторы» по краю.
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      p.circle(cx + Math.cos(a) * (r + 0.6), cy + Math.sin(a) * (r + 0.6), 1.7, C.b);
    }
    p.circle(cx, cy, r, C.b);
    p.rim({ [C.b]: C.s }, -1, 1, 2);
    p.rim({ [C.s]: C.d }, -1, 1, 1);
    p.rim({ [C.b]: C.l }, 1, -1, 1);
    // Пятна-присоски.
    [[-6, -2], [-3, 5], [2, 6], [-7, 4], [-1, -7]].forEach(([dx, dy]) => {
      const x = Math.round(cx + dx), y = Math.round(cy + dy);
      p.rect(x, y, 2, 2, C.spot); p.px(x, y - 1, C.l);
    });
  }

  function pigEyes(p, variant) {
    const ball = (cx, cy, r, fill) => { p.circle(cx, cy, r + 1, INK); p.circle(cx, cy, r, fill); };
    const W = '#fff8f0';
    switch (variant) {
      case 'sleep':
        ball(3.5, 4, 2.6, '#e8649e'); ball(9.5, 4, 2.6, '#e8649e');
        p.line(1, 4, 6, 4, INK); p.line(7, 4, 12, 4, INK);
        return false;
      case 'angry':
        ball(3.5, 4, 2.8, W); ball(9.5, 4, 2.8, W);
        p.line(0, 0, 5, 2, INK); p.line(7, 2, 12, 0, INK);
        return true;
      case 'x':
        ball(3.5, 4, 2.6, W); ball(9.5, 4, 2.6, W);
        [[2, 3], [4, 3], [3, 4], [2, 5], [4, 5], [8, 3], [10, 3], [9, 4], [8, 5], [10, 5]].forEach(([x, y]) => p.px(x, y, INK));
        return false;
      case 'wide':
        ball(3.5, 4, 3.1, W); ball(9.5, 4, 3.1, W);
        return true;
      default:
        ball(3.5, 4, 2.8, W); ball(9.5, 4, 2.8, W);
        return true;
    }
  }

  function snout(p, C) {
    p.ellipse(3.5, 3, 3.5, 3, C.l);
    p.rim({ [C.l]: C.b }, -1, 1, 1);
    p.rect(2, 2, 1, 2, C.d); p.rect(5, 2, 1, 2, C.d);
  }

  function pigMouth(p, variant) {
    const IN = '#5a1020', T = '#ffffff';
    if (variant === 'closed') { p.line(0, 1, 2, 2, INK); p.line(2, 2, 5, 1, INK); p.line(5, 1, 7, 2, INK); return; }
    if (variant === 'grin') { p.rect(0, 0, 8, 1, INK); p.rect(1, 1, 6, 2, IN); p.px(1, 1, T); p.px(3, 1, T); p.px(5, 1, T); p.rect(1, 3, 6, 1, INK); return; }
    // open / scream: зубастая пасть.
    const h = variant === 'scream' ? 5 : 3;
    p.rect(0, 0, 8, h + 2, INK);
    p.rect(1, 1, 6, h, IN);
    p.px(1, 1, T); p.px(3, 1, T); p.px(5, 1, T); p.px(6, 1, T);
    p.px(2, h, T); p.px(4, h, T); p.px(6, h, T);
    if (variant === 'scream') p.rect(3, h - 1, 3, 1, '#e0607a');
  }

  // Сегмент щупальца — «бусина»: при повороте суставы не расходятся.
  function tentacle(p, C, tip) {
    p.ellipse(2, 2.5, 2, 2.5, C.b);
    p.px(0, 3, C.s); p.px(1, 4, C.s);
    if (tip) { p.circle(2, 4.5, 2.2, C.l); p.px(1, 5, C.s); p.px(2, 4, C.d); }
  }

  function wing(p) {
    p.poly([[0, 8], [3, 0], [7, 2], [11, 0], [12, 6], [8, 5], [5, 8]], '#5a2c86');
    p.line(3, 1, 3, 7, '#8a4cc0'); p.line(7, 3, 7, 6, '#8a4cc0');
  }

  function launcher(p) {
    p.rect(0, 1, 16, 5, '#3a3a52'); p.rect(0, 1, 16, 1, '#6a6a88'); p.rect(13, 0, 3, 7, '#2a2a3c');
    p.rect(4, 2, 4, 2, '#4fe03c'); p.px(5, 2, '#b4ff5a'); p.rect(2, 6, 2, 2, '#2a2a3c');
  }

  function helmet(p) {
    p.ellipse(7, 5, 7, 5, '#4a6a3a'); p.rect(0, 5, 14, 2, '#3a5530'); p.px(4, 2, '#7a9a5a'); p.px(5, 2, '#7a9a5a');
    for (let x = 0; x < 14; x++) for (let y = 7; y < 10; y++) p.px(x, y, null);
  }

  // ——— Баг ———
  function bugBody(p, frame) {
    p.ellipse(5, 3.5, 5, 3.5, '#3a2370');
    p.rect(1, 1, 8, 1, '#7d52d6');
    p.line(5, 0, 5, 6, '#140c1e');
    p.ellipse(9.5, 3.5, 2, 2, '#2a1a3e');
    p.px(10, 3, '#ff5a4a'); p.px(11, 3, '#ff5a4a');
    // Глитч-полосы.
    p.rect(2, 3 + (frame % 2), 3, 1, frame ? '#4fe03c' : '#8cf2ff');
  }

  // ——— Петушня ———
  const RO = { body: '#d8642a', bodyS: '#9a3a1a', bodyL: '#ffa060', comb: '#ff3a3a', beak: '#ffd84a', leg: '#ffc030', neon1: '#4fe03c', neon2: '#2ab0d8', neon3: '#e04ae0', eye: '#8cf2ff' };
  function roosterBody(p) {
    p.ellipse(9, 7, 9, 6.5, RO.body);
    p.rim({ [RO.body]: RO.bodyS }, -1, 1, 2);
    p.rim({ [RO.body]: RO.bodyL }, 1, -1, 1);
    for (let i = 0; i < 4; i++) { p.line(5 + i * 3, 5, 3 + i * 3, 9, RO.bodyS); }
    p.rect(12, 6, 3, 1, RO.eye);
  }
  function roosterWing(p) {
    p.ellipse(5, 3.5, 5, 3.5, RO.bodyS);
    p.line(1, 4, 9, 5, '#7a2a12'); p.line(2, 6, 8, 6, '#7a2a12');
    p.px(7, 2, RO.neon2);
  }
  function roosterNeck(p) { p.rect(0, 0, 5, 7, RO.bodyL); p.rim({ [RO.bodyL]: RO.body }, -1, 0, 1); p.px(2, 3, '#ffd84a'); }
  function roosterHead(p, open) {
    p.ellipse(4.5, 5, 4.5, 4, '#f0e0d0');
    p.rim({ '#f0e0d0': '#c8b0a0' }, -1, 1, 1);
    p.poly([[1, 2], [2, -1], [3.5, 1], [5, -2], [6.5, 1], [8, 0], [8, 3], [2, 3]], RO.comb);
    p.rect(8, 4, 3, 2, RO.beak); if (open) { p.rect(8, 6, 3, 1, INK); p.rect(8, 7, 2, 1, RO.beak); }
    p.rect(7, 7, 2, 3, RO.comb);
    p.circle(6, 4, 1.5, INK); p.px(6, 4, RO.eye); p.px(5, 3, RO.eye);
  }
  function feather(p, c) {
    p.rect(1, 0, 3, 12, c); p.rect(0, 3, 1, 8, c); p.px(2, 11, '#ffffff');
    p.line(2, 0, 2, 10, GS.Pix.mix(c, '#000000', 0.35));
  }
  function chickenLeg(p, part) {
    if (part === 'thigh') { p.ellipse(2.5, 3, 2.5, 3.5, RO.body); p.rim({ [RO.body]: RO.bodyS }, -1, 1, 1); }
    else if (part === 'shin') p.rect(0, 0, 2, 7, RO.leg);
    else { p.rect(0, 0, 7, 1, RO.leg); p.px(-1, 1, RO.leg); p.px(6, 1, RO.leg); p.px(3, 1, RO.leg); }
  }

  // ——— Опоссум-Макс ———
  const OP = { fur: '#9a96a8', furS: '#6a6678', furD: '#46425a', furL: '#d4d0e0', face: '#f0ecf4', skin: '#e89aaa', skinS: '#b86a80', eye: '#ffe14a', glitch: '#4fe03c' };
  function opBody(p) {
    p.ellipse(32, 18, 32, 16, OP.fur);
    p.ellipse(34, 25, 24, 8, OP.furL);
    // Шерсть: штрихи и колючий загривок.
    const rnd = GS.util.rng(77);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * 60) + 2, y = Math.floor(rnd() * 26) + 4;
      if (p.get(x, y) === OP.fur) p.line(x, y, x - 2, y + 1, OP.furS);
    }
    for (let i = 0; i < 12; i++) {
      const x = 8 + i * 4.4;
      const y = 18 - Math.sqrt(Math.max(0, 1 - Math.pow((x - 32) / 32, 2))) * 16;
      p.poly([[x - 2, y + 2], [x - 1, y - 4 - (i % 3) * 2], [x + 2, y + 2]], OP.fur);
    }
    p.rim({ [OP.fur]: OP.furS }, -1, 1, 2);
    p.rim({ [OP.furS]: OP.furD }, -1, 1, 1);
    p.rim({ [OP.fur]: OP.furL }, 1, -1, 1);
    // Глитч-пиксели.
    [[20, 10], [40, 8], [48, 14], [14, 18], [30, 6]].forEach(([x, y]) => p.px(x, y, OP.glitch));
  }
  function opHead(p) {
    // Вытянутая морда вправо, белое лицо, тёмные «очки» вокруг глаз.
    p.ellipse(14, 13, 13, 11, OP.furS);
    p.poly([[14, 6], [36, 12], [38, 15], [35, 19], [14, 22]], OP.face);
    p.ellipse(16, 14, 10, 8, OP.face);
    p.rim({ [OP.face]: '#c8c0d4' }, -1, 1, 1);
    p.ellipse(19, 10, 4.5, 3.5, '#3a3448');
    p.circle(37, 15, 2.5, OP.skin); p.px(37, 14, '#ffd0dc');
    // Верхние зубы — торчат из-под губы.
    for (let x = 22; x < 35; x += 3) { p.px(x, 19, '#ffffff'); p.px(x, 20, '#ffffff'); p.px(x + 1, 19, '#ffffff'); }
    p.px(24, 21, '#ffffff'); p.px(24, 22, '#ffffff');
    // Усы.
    p.line(30, 17, 38, 21, '#e8e4f0'); p.line(29, 18, 36, 23, '#e8e4f0');
  }
  function opEye(p, variant) {
    if (variant === 'closed') { p.rect(0, 3, 7, 1, INK); return; }
    if (variant === 'x') { p.circle(3.5, 3.5, 3.5, OP.eye); [[1, 1], [5, 1], [2, 2], [4, 2], [3, 3], [2, 4], [4, 4], [1, 5], [5, 5]].forEach(([x, y]) => p.px(x, y, INK)); return; }
    p.circle(3.5, 3.5, 3.5, variant === 'rage' ? '#ff5a4a' : OP.eye);
    p.circle(3.5, 3.5, 3.8, null);
    p.circle(3.5, 3.5, 3.5, variant === 'rage' ? '#ff5a4a' : OP.eye);
    p.rect(3, 3, 2, 2, INK);
    p.px(2, 1, '#ffffff');
  }
  function opJaw(p) {
    p.poly([[0, 0], [24, 2], [22, 7], [4, 9], [0, 6]], OP.face);
    p.rim({ [OP.face]: '#c8c0d4' }, -1, 1, 1);
    p.rect(2, 0, 20, 2, '#5a1020');
    for (let x = 4; x < 22; x += 3) { p.px(x, 0, '#ffffff'); p.px(x + 1, 0, '#ffffff'); p.px(x, -1, '#ffffff'); }
  }
  function opTongue(p) { p.ellipse(8, 3, 8, 3, '#e0607a'); p.line(2, 3, 12, 3, '#b03a58'); }
  function opEar(p) { p.ellipse(4, 5, 4, 5.5, OP.furD); p.ellipse(4, 5.5, 2.5, 3.5, OP.skin); }
  function opLimb(p, w, h, c, cs) { p.rect(0, 0, w, h, c); p.rim({ [c]: cs }, -1, 0, 1); }
  function opPaw(p) { p.ellipse(5, 3, 5, 3, OP.skin); p.rim({ [OP.skin]: OP.skinS }, 0, 1, 1); [2, 5, 8, 10].forEach((x) => { p.px(x + 1, 5, '#ffffff'); p.px(x + 2, 6, '#ffffff'); }); }
  function opTail(p, w) { p.rect(0, 0, w, 8, OP.skin); p.rim({ [OP.skin]: OP.skinS }, -1, 0, 1); p.px(Math.floor(w / 2), 2, '#ffd0dc'); }

  // ——— Клод-мех ———
  const ME = { cream: '#efe4cc', creamS: '#c4b494', orange: '#d9773a', orangeS: '#a04e1e', dark: '#2a2830', darkS: '#16141a', glow: '#ffb03a', glowL: '#ffe0a0' };
  function asterisk(p, cx, cy, r, c) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      p.line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
    }
  }
  function mechTorso(p) {
    p.rect(2, 4, 26, 22, ME.cream);
    p.poly([[0, 4], [30, 4], [27, 0], [3, 0]], ME.cream);
    p.rim({ [ME.cream]: ME.creamS }, -1, 1, 2);
    // Кабина: окно, где сидит пилот.
    p.rect(7, 4, 16, 13, ME.darkS); p.rect(8, 5, 14, 11, '#1a1430');
    p.rect(6, 17, 18, 2, ME.orange); p.rect(9, 20, 12, 3, ME.dark);
    [10, 13, 16, 19].forEach((x) => p.px(x, 21, ME.glow));
    p.rect(2, 23, 26, 3, ME.orange);
  }
  function mechGlass(p) {
    p.rect(0, 0, 14, 11, 'rgba(140,240,255,0.18)');
    p.line(1, 1, 4, 1, 'rgba(255,255,255,0.6)'); p.line(1, 2, 2, 2, 'rgba(255,255,255,0.5)');
  }
  function mechHead(p) {
    p.rect(0, 2, 16, 9, ME.orange); p.rect(2, 0, 12, 2, ME.orange);
    p.rim({ [ME.orange]: ME.orangeS }, -1, 1, 1);
    p.rect(3, 4, 11, 3, ME.darkS); p.rect(4, 5, 9, 1, ME.glow); p.px(11, 5, ME.glowL);
    p.rect(1, -3, 1, 4, ME.creamS); p.rect(14, -2, 1, 3, ME.creamS);
  }
  function mechPad(p) {
    p.ellipse(8, 7, 8, 7, ME.cream);
    p.rim({ [ME.cream]: ME.creamS }, -1, 1, 1);
    asterisk(p, 8, 7, 4.5, ME.orange);
  }
  function mechArm(p, w, h) { p.rect(0, 0, w, h, ME.dark); p.rect(1, 1, w - 2, 2, ME.orange); p.rim({ [ME.dark]: ME.darkS }, -1, 0, 1); }
  function mechFist(p) { p.rect(0, 0, 11, 10, ME.dark); p.rim({ [ME.dark]: ME.darkS }, -1, 1, 1); [2, 5, 8].forEach((x) => p.rect(x, 7, 2, 2, ME.orange)); }
  function mechBlade(p) {
    p.rect(0, 1, 6, 6, ME.dark);
    p.rect(6, 0, 40, 8, ME.glow); p.rect(6, 2, 40, 4, ME.glowL);
    p.poly([[46, 0], [52, 4], [46, 8]], ME.glow);
    GS.Font.draw(p, '{ } :: CODE', 10, 1, ME.orangeS);
  }
  function mechCannon(p) { p.rect(0, 0, 18, 8, ME.dark); p.rect(18, 2, 4, 4, ME.darkS); p.rect(3, 2, 10, 2, ME.glow); p.rim({ [ME.dark]: ME.darkS }, 0, 1, 1); }
  function mechThigh(p) { p.rect(0, 0, 10, 14, ME.cream); p.rim({ [ME.cream]: ME.creamS }, -1, 0, 2); p.rect(0, 10, 10, 2, ME.orange); }
  function mechShin(p) { p.rect(0, 0, 12, 16, ME.cream); p.rect(0, 0, 12, 4, ME.orange); p.rim({ [ME.cream]: ME.creamS }, -1, 0, 2); GS.Font.draw(p, '</>', 2, 7, ME.orangeS); }
  function mechFoot(p) { p.rect(0, 0, 18, 6, ME.dark); p.rect(0, 5, 20, 2, ME.darkS); p.rect(2, 1, 6, 1, ME.orange); }
  function mechPelvis(p) { p.rect(0, 0, 18, 8, ME.dark); p.rect(2, 2, 14, 2, ME.orange); }

  // ——— Инопланетянин «Я ПОМОГ» ———
  function alienBody(p) {
    p.ellipse(8, 9, 8, 8.5, '#6ad03a');
    p.rim({ '#6ad03a': '#3a9a2a' }, -1, 1, 2);
    p.rim({ '#6ad03a': '#b4ff5a' }, 1, -1, 1);
    p.circle(8, 7, 4.5, INK); p.circle(8, 7, 3.6, '#ffffff');
    p.rect(4, 13, 8, 1, INK); p.rect(5, 14, 6, 1, '#7a1f2e');
  }
  function alienAntenna(p) { p.rect(1, 2, 1, 6, '#3a9a2a'); p.circle(1.5, 1.5, 1.6, '#b4ff5a'); }
  function alienArm(p) { p.rect(0, 0, 3, 7, '#6ad03a'); p.circle(1.5, 7, 2, '#6ad03a'); }

  // ——— Попап-окно ———
  function popupWindow(scene, key, title, text) {
    const lines = GS.Font.wrap(text, 70);
    const w = Math.max(64, Math.min(96, Math.max(GS.Font.width(title) + 22, ...lines.map((l) => GS.Font.width(l) + 10))));
    const h = 24 + lines.length * 9 + 12;
    const p = new GS.Pix(w, h);
    p.rect(0, 0, w, h, '#e2e4f0');
    p.rect(0, 0, w, 11, '#3a5ad8');
    p.rect(0, 0, w, 1, '#6a8aff');
    GS.Font.draw(p, title, 3, 2, '#ffffff');
    // Кнопка [X].
    p.rect(w - 11, 1, 10, 9, '#d83a3a'); p.rect(w - 11, 1, 10, 1, '#ff7a7a');
    GS.Font.draw(p, '×', w - 9, 2, '#ffffff');
    lines.forEach((l, i) => GS.Font.draw(p, l, 6, 22 + i * 9, '#2a1a3e'));
    // Кнопка ОК внизу.
    p.rect(w - 26, h - 11, 20, 9, '#c4c4d8'); p.rect(w - 26, h - 11, 20, 1, '#ffffff');
    GS.Font.draw(p, 'ОК', w - 21, h - 10, '#2a1a3e');
    // Зубастая нижняя кромка — это всё-таки монстр.
    for (let x = 4; x < w - 30; x += 4) { p.px(x, h - 1, '#ffffff'); p.px(x + 1, h - 1, '#ffffff'); p.px(x, h - 2, '#ffffff'); }
    const o = p.outlined(INK);
    o.tex(scene, key);
    return { w: o.w, h: o.h };
  }

  return {
    PIG,
    popupWindow,
    generate(scene) {
      Object.entries(PIG).forEach(([name, C]) => {
        const k = (n) => `pig_${name}/${n}`;
        GS.makePart(scene, k('body'), 24, 22, [12, 11], (p) => pigBody(p, C, 24, 22));
        GS.makePart(scene, k('snout'), 7, 6, [0, 3], (p) => snout(p, C));
        GS.makePart(scene, k('tent'), 4, 5, [2, 1], (p) => tentacle(p, C, false));
        GS.makePart(scene, k('tip'), 5, 7, [2, 1], (p) => tentacle(p, C, true));
      });
      ['open', 'angry', 'wide', 'sleep', 'x'].forEach((v) => {
        const p = new GS.Pix(13, 8);
        pigEyes(p, v);
        p.tex(scene, 'pig/eyes_' + v);
        GS.PARTS['pig/eyes_' + v] = { ox: 0.5, oy: 0.5, w: 13, h: 8, px: 6, py: 4 };
      });
      ['closed', 'open', 'scream', 'grin'].forEach((v) => GS.makePart(scene, 'pig/mouth_' + v, 8, 7, [4, 1], (p) => pigMouth(p, v), { outline: false }));
      GS.makePart(scene, 'pig/pupil', 2, 2, [1, 1], (p) => p.rect(0, 0, 2, 2, INK), { outline: false });
      GS.makePart(scene, 'pig/wing', 12, 9, [1, 8], (p) => wing(p));
      GS.makePart(scene, 'pig/launcher', 16, 8, [7, 4], (p) => launcher(p));
      GS.makePart(scene, 'pig/helmet', 14, 10, [7, 7], (p) => helmet(p));

      [0, 1].forEach((f) => GS.makePart(scene, 'bug/body' + f, 12, 7, [6, 6], (p) => bugBody(p, f)));

      GS.makePart(scene, 'rooster/body', 18, 14, [9, 8], (p) => roosterBody(p));
      GS.makePart(scene, 'rooster/wing', 10, 8, [8, 2], (p) => roosterWing(p));
      GS.makePart(scene, 'rooster/neck', 5, 7, [2, 6], (p) => roosterNeck(p));
      GS.makePart(scene, 'rooster/head', 11, 10, [3, 8], (p) => roosterHead(p, false));
      GS.makePart(scene, 'rooster/head_open', 11, 10, [3, 8], (p) => roosterHead(p, true));
      [['f1', RO.neon1], ['f2', RO.neon2], ['f3', RO.neon3]].forEach(([n, c]) => GS.makePart(scene, 'rooster/' + n, 4, 12, [2, 0], (p) => feather(p, c)));
      GS.makePart(scene, 'rooster/thigh', 5, 6, [2, 1], (p) => chickenLeg(p, 'thigh'));
      GS.makePart(scene, 'rooster/shin', 2, 7, [1, 0], (p) => chickenLeg(p, 'shin'), { outline: true });
      GS.makePart(scene, 'rooster/foot', 7, 2, [2, 0], (p) => chickenLeg(p, 'foot'), { outline: true });

      GS.makePart(scene, 'opossum/body', 64, 34, [32, 18], (p) => opBody(p));
      GS.makePart(scene, 'opossum/head', 40, 26, [6, 14], (p) => opHead(p));
      ['open', 'closed', 'rage', 'x'].forEach((v) => GS.makePart(scene, 'opossum/eye_' + v, 7, 7, [3, 3], (p) => opEye(p, v), { outline: v !== 'closed' }));
      GS.makePart(scene, 'opossum/jaw', 25, 10, [1, 1], (p) => opJaw(p));
      GS.makePart(scene, 'opossum/tongue', 16, 6, [1, 3], (p) => opTongue(p));
      GS.makePart(scene, 'opossum/ear', 8, 11, [4, 10], (p) => opEar(p));
      GS.makePart(scene, 'opossum/legU', 9, 14, [4, 1], (p) => opLimb(p, 9, 14, OP.fur, OP.furS));
      GS.makePart(scene, 'opossum/legL', 7, 12, [3, 1], (p) => opLimb(p, 7, 12, OP.furD, '#2e2a3c'));
      GS.makePart(scene, 'opossum/paw', 12, 7, [4, 1], (p) => opPaw(p));
      [8, 7, 6, 6, 5, 5, 4, 3].forEach((w, i) => GS.makePart(scene, 'opossum/tail' + i, w, 8, [Math.floor(w / 2), 0], (p) => opTail(p, w)));
      // Портрет для диалогов.
      const pt = new GS.Pix(44, 30);
      const hd = new GS.Pix(40, 26); opHead(hd); pt.stamp(hd, 2, 2);
      const ey = new GS.Pix(7, 7); opEye(ey, 'rage'); pt.stamp(ey.outlined(INK), 17, 5);
      pt.outlined(INK).tex(scene, 'portrait/opossum');

      GS.makePart(scene, 'mech/torso', 30, 26, [15, 25], (p) => mechTorso(p));
      GS.makePart(scene, 'mech/glass', 14, 11, [0, 0], (p) => mechGlass(p), { outline: false });
      GS.makePart(scene, 'mech/head', 16, 11, [8, 10], (p) => mechHead(p));
      GS.makePart(scene, 'mech/pad', 16, 14, [8, 5], (p) => mechPad(p));
      GS.makePart(scene, 'mech/armU', 8, 12, [4, 1], (p) => mechArm(p, 8, 12));
      GS.makePart(scene, 'mech/armL', 8, 11, [4, 1], (p) => mechArm(p, 8, 11));
      GS.makePart(scene, 'mech/fist', 11, 10, [5, 1], (p) => mechFist(p));
      GS.makePart(scene, 'mech/blade', 52, 8, [2, 4], (p) => mechBlade(p));
      GS.makePart(scene, 'mech/cannon', 22, 8, [3, 4], (p) => mechCannon(p));
      GS.makePart(scene, 'mech/thigh', 10, 14, [5, 1], (p) => mechThigh(p));
      GS.makePart(scene, 'mech/shin', 12, 16, [6, 1], (p) => mechShin(p));
      GS.makePart(scene, 'mech/foot', 20, 7, [7, 0], (p) => mechFoot(p));
      GS.makePart(scene, 'mech/pelvis', 18, 8, [9, 2], (p) => mechPelvis(p));

      GS.makePart(scene, 'alien/body', 16, 18, [8, 17], (p) => alienBody(p));
      GS.makePart(scene, 'alien/antenna', 3, 8, [1, 7], (p) => alienAntenna(p));
      GS.makePart(scene, 'alien/arm', 3, 9, [1, 0], (p) => alienArm(p));
      GS.makePart(scene, 'alien/pupil', 2, 3, [1, 1], (p) => p.rect(0, 0, 2, 3, INK), { outline: false });
    },
  };
})();
