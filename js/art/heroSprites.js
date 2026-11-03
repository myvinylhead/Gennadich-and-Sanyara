// Нарисованные детали героев (листы из ChatGPT → tools/build_assets.py → js/data/images.js).
// После загрузки картинок они заменяют процедурные детали того же героя, а лицо остаётся «живым»:
// на голове стёрты глаза и рот, поверх рисуются сменные глаза, зрачки и рты.
GS.HERO_SPRITES = {
  sanyara: {
    // Точки вращения в пикселях уменьшенной детали.
    pivots: {
      head: [11, 20], torso: [6, 12], armU: [2, 1], armL: [3, 1], glove: [1, 2],
      thigh: [2, 1], shin: [3, 1], boot: [3, 1], gun: [4, 7], mug: [2, 5],
    },
    // Скелет под пропорции нового арта (рост ≈ 48 px, как у остальных героев).
    rig: {
      hipsY: -17, neckY: -11, shoulderB: [-3, -9], shoulderF: [3, -9],
      hipB: -2, hipF: 2, armLen: 6, legLen: [6, 6], height: 50,
      gloveRot: 90, muzzle: [4, 12], reach: 8, hipLow: 9,
      eyesAt: [1, -9], pupilF: [3, -8], pupilB: [8, -8], mouthAt: [2, -4],
    },
    skin: '#FDB97A',
    // Очки: передняя линза 4×4 (x 0–3), задняя 2×3 (x 6–7); холст 8×4.
    eyes: { w: 8, h: 4, F: [0, 4, 4], B: [6, 2, 3] },
  },
  gennadich: {
    pivots: {
      head: [9, 21], torso: [8, 13], armU: [2, 1], armL: [2, 1], glove: [1, 3],
      thigh: [2, 1], shin: [2, 1], boot: [3, 1], gun: [3, 7],
    },
    rig: {
      hipsY: -17, neckY: -12, shoulderB: [-4, -10], shoulderF: [4, -10],
      hipB: -2, hipF: 2, armLen: 6, legLen: [6, 6], height: 52,
      gloveRot: 90, muzzle: [4, 12], reach: 8, hipLow: 9,
      eyesAt: [-1, -11], pupilF: [1, -10], pupilB: [6, -10], mouthAt: [-2, -5],
    },
    skin: '#FDB46D',
    // Большие круглые мультяшные глаза в чёрной обводке: передний 4×4, задний 2×4.
    eyes: { w: 8, h: 4, F: [0, 4, 4], B: [6, 2, 4] },
  },
  yurich: {
    pivots: {
      head: [10, 21], torso: [7, 13], armU: [3, 1], armL: [2, 1], glove: [1, 2],
      thigh: [1, 1], shin: [2, 1], boot: [3, 1], gun: [3, 7],
    },
    rig: {
      hipsY: -17, neckY: -12, shoulderB: [-3, -10], shoulderF: [3, -10],
      hipB: -2, hipF: 2, armLen: 6, legLen: [6, 6], height: 51,
      gloveRot: 90, muzzle: [4, 13], reach: 8, hipLow: 9,
      eyesAt: [-1, -9], pupilF: [0, -9], pupilB: [6, -9], mouthAt: [0, -5],
    },
    skin: '#FDAD57',
    // Без очков: передний глаз 3×2, задний 2×2.
    eyes: { w: 8, h: 2, F: [0, 3, 2], B: [6, 2, 2] },
  },
};

GS.HeroSprites = {
  active(hero) { const h = GS.HERO_SPRITES[hero]; return !!(h && h.applied); },

  apply(scene) {
    Object.entries(GS.HERO_SPRITES).forEach(([hero, cfg]) => {
      const keys = Object.keys(cfg.pivots);
      if (!keys.every((p) => scene.textures.exists(`hs/${hero}/${p}`))) return;
      keys.forEach((part) => {
        const src = scene.textures.get(`hs/${hero}/${part}`).getSourceImage();
        const target = part === 'mug' ? 'hero/mug' : `${hero}/${part}`;
        if (scene.textures.exists(target)) scene.textures.remove(target);
        const cv = document.createElement('canvas');
        cv.width = src.width; cv.height = src.height;
        cv.getContext('2d').drawImage(src, 0, 0);
        scene.textures.addCanvas(target, cv);
        const [px, py] = cfg.pivots[part];
        GS.PARTS[target] = { ox: px / cv.width, oy: py / cv.height, w: cv.width, h: cv.height, px, py };
      });
      this.makeEyes(scene, hero, cfg);
      cfg.applied = true;
      ['open', 'hurt', 'happy', 'x'].forEach((ev) => this.portrait(scene, hero, cfg, ev));
    });
  },

  // Сменные глаза поверх нарисованных: две «линзы» (передняя F и задняя B, [x, ширина, высота]) на холсте g.w×g.h.
  // Варианты рисуются относительно размера линзы, поэтому подходят и под очки, и под обычные глаза.
  eyesPix(variant, skin, g) {
    const INK = GS.PAL.ink;
    const p = new GS.Pix(g.w, g.h);
    const each = (fn) => [g.F, g.B].forEach(([x, w, h], i) => fn(x, w, h, i === 0));
    const fill = (c, top) => each((x, w, h) => { p.rect(x, 0, w, h, c); if (top && h >= 3) p.rect(x, 0, w, 1, top); });
    const mid = (h) => Math.min(2, h - 1);
    switch (variant) {
      case 'blink':
      case 'sleep':
        fill(skin);
        each((x, w, h) => p.rect(x, mid(h), w, 1, INK));
        if (variant === 'sleep') p.px(g.F[0], g.h - 1, INK);
        return [p, false];
      case 'happy':
        fill(skin);
        each((x, w, h) => {
          const y = mid(h);
          for (let i = 0; i < w; i++) p.px(x + i, i === 0 || i === w - 1 ? y : y - 1, INK);
        });
        return [p, false];
      case 'angry':
        fill('#fcfcfc');
        each((x, w) => p.rect(x, 0, w, 1, INK));
        return [p, true];
      case 'x':
        fill('#fcfcfc');
        each((x, w, h) => {
          for (let y = 0; y < h; y++) {
            const t = h === 1 ? 0 : Math.round(y * (w - 1) / (h - 1));
            p.px(x + t, y, INK); p.px(x + w - 1 - t, y, INK);
          }
        });
        return [p, false];
      case 'hurt':
        fill(skin);
        each((x, w, h, front) => {
          for (let y = 0; y < h; y++) {
            const d = h === 1 ? 0 : Math.round(Math.abs(y - (h - 1) / 2) * 2 / (h - 1) * (w - 1));
            p.px(front ? x + d : x + w - 1 - d, y, INK);
          }
        });
        return [p, false];
      case 'spiral':
        fill('#fcfcfc');
        each((x, w, h) => { p.px(x + (w >> 1), h >> 1, '#8a4ce0'); p.px(x + Math.max(0, (w >> 1) - 1), Math.max(0, (h >> 1) - 1), INK); });
        return [p, false];
      case 'wide':
        fill('#ffffff');
        return [p, true];
      default:
        fill('#fcfcfc', '#dbdbdd');
        return [p, true];
    }
  },

  makeEyes(scene, hero, cfg) {
    GS.HeroArt.EYES.forEach((v) => {
      const [p] = this.eyesPix(v, cfg.skin, cfg.eyes);
      const key = `${hero}/eyes_${v}`;
      p.tex(scene, key);
      GS.PARTS[key] = { ox: 0, oy: 0, w: p.w, h: p.h, px: 0, py: 0 };
    });
  },

  // Портрет для HUD и диалогов: новая голова + глаза + рот.
  portrait(scene, hero, cfg, ev) {
    const head = scene.textures.get(`${hero}/head`).getSourceImage();
    const R = cfg.rig;
    const [hx, hy] = cfg.pivots.head;
    const cv = document.createElement('canvas');
    cv.width = 30; cv.height = 28;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const ox = 1, oy = 1;
    ctx.drawImage(head, ox, oy);
    const [eyes, pupils] = this.eyesPix(ev, cfg.skin, cfg.eyes);
    ctx.drawImage(eyes.toCanvas(), ox + hx + R.eyesAt[0], oy + hy + R.eyesAt[1]);
    if (pupils) {
      ctx.fillStyle = GS.PAL.ink;
      ctx.fillRect(ox + hx + R.pupilF[0], oy + hy + R.pupilF[1], 1, 2);
      ctx.fillRect(ox + hx + R.pupilB[0], oy + hy + R.pupilB[1], 1, 2);
    }
    const mouthKey = `${hero}/mouth_${ev === 'hurt' || ev === 'x' ? 'yell' : ev === 'happy' ? 'grin' : 'smile'}`;
    ctx.drawImage(scene.textures.get(mouthKey).getSourceImage(), ox + hx + R.mouthAt[0], oy + hy + R.mouthAt[1]);
    const key = `portrait/${hero}_${ev}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, cv);
  },
};
