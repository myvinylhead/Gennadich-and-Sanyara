// Процедурные пиксельные части героев. Каждая часть — отдельная текстура `<hero>/<part>`
// с точкой вращения в GS.PARTS. Конечности нарисованы «вниз» (+y), оружие — «вправо» (+x).
GS.SKINS = {
  gennadich: {
    skin: '#f7c58d', skinS: '#d9925a', skinD: '#a35f35',
    hair: '#f2cf5b', hairS: '#c99a2e', hairL: '#fff0a0',
    suit: '#f1ede0', suitS: '#c4bca6', suitD: '#8c8572', suitL: '#ffffff',
    trim: '#2e8c7c', trimS: '#1b5c52', trimL: '#5fd0b4',
    glove: '#2e8c7c', gloveS: '#1b5c52',
    boot: '#2e8c7c', bootS: '#1b5c52', sole: '#163f39',
    gun: '#e6e7ef', gunS: '#a9adc2', gunD: '#5b6078', glow: '#8cff3a', glowS: '#3fc22a',
    eyeStyle: 'big', mouthAt: [10, 14], eyesAt: [6, 3],
  },
  sanyara: {
    skin: '#f2bf86', skinS: '#d38c55', skinD: '#9e5a33',
    hair: '#3b2618', hairS: '#22150b', hairL: '#5e3c24',
    suit: '#5c3aa8', suitS: '#3e2580', suitD: '#28165a', suitL: '#7d5ad6',
    trim: '#28165a', trimS: '#1a0e3e', trimL: '#5c3aa8',
    glove: '#2b2535', gloveS: '#17131d',
    boot: '#2b2535', bootS: '#17131d', sole: '#0f0c14',
    gun: '#4a3a72', gunS: '#30244f', gunD: '#1c1430', glow: '#d08cff', glowS: '#8a4ce0',
    eyeStyle: 'glasses', mouthAt: [10, 14], eyesAt: [8, 8],
  },
  yurich: {
    skin: '#f0b884', skinS: '#cf8650', skinD: '#985530',
    hair: '#7a4526', hairS: '#4f2a14', hairL: '#a8673a',
    suit: '#c9402c', suitS: '#8e2b1e', suitD: '#5a1a12', suitL: '#ea6a4c',
    trim: '#2e2a30', trimS: '#18151a', trimL: '#4a454e',
    glove: '#2e2a30', gloveS: '#18151a',
    boot: '#2e2a30', bootS: '#18151a', sole: '#0e0c10',
    gun: '#2e2a30', gunS: '#1a171c', gunD: '#0e0c10', glow: '#ff9a3a', glowS: '#d0501a',
    eyeStyle: 'normal', mouthAt: [10, 14], eyesAt: [9, 6],
  },
};

GS.HeroArt = (() => {
  const INK = GS.PAL.ink;
  const MOUTH_IN = '#7a1f2e', TONGUE = '#e0607a', TEETH = '#ffffff';

  // ——— Голова ———
  function head(p, S, hero) {
    p.ellipse(8, 9.6, 6.6, 7.0, S.skin);
    p.ellipse(10.8, 12.8, 5.4, 4.8, S.skin);
    p.rect(15, 11, 2, 2, S.skin);          // нос
    p.px(17, 12, S.skin);
    p.rim({ [S.skin]: S.skinS }, -1, 1, 1);
    p.px(16, 13, S.skinS);
    // Ухо.
    p.ellipse(5.2, 11.6, 1.6, 2.2, S.skin);
    p.px(5, 11, S.skinS); p.px(5, 12, S.skinS); p.px(4, 13, S.skinD);

    if (hero === 'gennadich') {
      p.poly([[1, 13], [0.5, 7], [1.5, 3.5], [1, 0.5], [4, 2.5], [5, -0.5], [7.5, 2], [9.5, -0.5], [11, 2.5], [13.5, 0.5], [13.5, 3.5],
        [16, 3.5], [15, 5.5], [12.5, 5], [11, 6.5], [9, 5.5], [7, 6.5], [5.5, 6], [4, 8.5], [3.8, 13]], S.hair);
      p.rim({ [S.hair]: S.hairS }, -1, 1, 1);
      p.px(6, 2, S.hairL); p.px(9, 1, S.hairL); p.px(10, 2, S.hairL); p.px(13, 2, S.hairL); p.px(7, 3, S.hairL);
    } else if (hero === 'sanyara') {
      p.poly([[1, 14], [0, 8], [0.5, 4], [2, 1.5], [4, 2], [5, 0], [7, 1.5], [9, -0.5], [10.5, 1.5], [13, 0.5], [13.5, 2.5], [16.5, 3],
        [15.5, 5], [16, 7], [13, 5.5], [11.5, 7], [10, 5.5], [8, 7], [6.5, 6], [5.5, 8.5], [4, 9], [4, 14]], S.hair);
      p.rim({ [S.hair]: S.hairS }, -1, 1, 1);
      p.px(8, 2, S.hairL); p.px(11, 2, S.hairL); p.px(5, 3, S.hairL); p.px(14, 3, S.hairL);
    } else {
      // Юрич: зачёс-кок вверх и вперёд, бакенбарды.
      p.poly([[1, 13], [0.5, 6], [2, 2.5], [5, 1], [8, 0.5], [12, -0.5], [16, 0.5], [17, 2.5], [14.5, 3], [15.5, 5], [12, 4.5],
        [10, 5.5], [7, 5], [5.5, 7], [4.5, 10], [4.5, 13]], S.hair);
      p.rim({ [S.hair]: S.hairS }, -1, 1, 1);
      p.px(9, 1, S.hairL); p.px(12, 1, S.hairL); p.px(13, 1, S.hairL); p.px(6, 2, S.hairL); p.px(15, 1, S.hairL);
    }
  }

  // ——— Глаза. Варианты: open, blink, happy, wide, angry, x, spiral, hurt, sleep ———
  // Возвращают false, если зрачки поверх рисовать не нужно.
  function eyes(p, S, variant) {
    const st = S.eyeStyle;
    if (st === 'big') {
      // Большие круглые «мультяшные» глаза (холст 12×9), передний перекрывает задний.
      const B = [4, 4.5], F = [7.6, 4.5];
      const ball = (c, r, fill) => { p.circle(c[0], c[1], r + 1, INK); p.circle(c[0], c[1], r, fill); };
      const base = (fill, r = 2.6) => { ball(B, r, fill); ball(F, r, fill); };
      switch (variant) {
        case 'blink':
        case 'sleep':
          base(S.skin);
          p.line(1, 5, 10, 5, INK);
          if (variant === 'sleep') { p.px(3, 6, INK); p.px(8, 6, INK); }
          return false;
        case 'happy':
          base(S.skin);
          [[2, 5], [3, 4], [4, 4], [5, 5], [6, 5], [7, 4], [8, 4], [9, 5]].forEach(([x, y]) => p.px(x, y, INK));
          return false;
        case 'wide':
          base('#ffffff', 3.0);
          return true;
        case 'angry':
          base('#ffffff');
          p.line(1, 1, 5, 3, INK); p.line(6, 3, 11, 0, INK);
          p.line(1, 2, 5, 4, S.skin); p.line(6, 4, 10, 2, S.skin);
          return true;
        case 'x':
        case 'hurt': {
          base('#ffffff');
          const mk = (cx, cy) => {
            if (variant === 'x') { p.px(cx - 1, cy - 1, INK); p.px(cx + 1, cy - 1, INK); p.px(cx, cy, INK); p.px(cx - 1, cy + 1, INK); p.px(cx + 1, cy + 1, INK); }
            else { p.px(cx - 1, cy - 1, INK); p.px(cx, cy, INK); p.px(cx - 1, cy + 1, INK); }
          };
          mk(4, 4); mk(8, 4);
          return false;
        }
        case 'spiral': {
          base('#ffffff');
          const sp = (cx, cy) => {
            p.px(cx, cy, INK); p.px(cx + 1, cy, INK); p.px(cx + 1, cy + 1, INK); p.px(cx, cy + 1, '#3fc22a');
            p.px(cx - 1, cy + 1, INK); p.px(cx - 1, cy, INK); p.px(cx - 1, cy - 1, INK); p.px(cx, cy - 1, INK); p.px(cx + 1, cy - 1, INK); p.px(cx + 2, cy - 1, '#3fc22a');
          };
          sp(4, 4); sp(8, 4);
          return false;
        }
        default:
          base('#ffffff');
          return true;
      }
    }

    if (st === 'glasses') {
      // Холст 9×2: белки 3×2 внутри линз; оправа — отдельный слот поверх.
      const lens = (c) => { p.rect(0, 0, 3, 2, c); p.rect(6, 0, 3, 2, c); };
      switch (variant) {
        case 'blink':
        case 'sleep':
          lens(S.skin); p.rect(0, 1, 3, 1, INK); p.rect(6, 1, 3, 1, INK);
          return false;
        case 'happy':
          lens(S.skin); [[0, 1], [1, 0], [2, 1], [6, 1], [7, 0], [8, 1]].forEach(([x, y]) => p.px(x, y, INK));
          return false;
        case 'angry':
          lens('#ffffff'); p.px(0, 0, INK); p.px(8, 0, INK);
          return true;
        case 'x':
        case 'hurt':
          lens('#ffffff');
          p.px(0, 0, INK); p.px(1, 1, INK); p.px(2, 0, INK); p.px(6, 0, INK); p.px(7, 1, INK); p.px(8, 0, INK);
          return false;
        case 'spiral':
          lens('#ffffff'); p.px(1, 0, '#8a4ce0'); p.px(1, 1, INK); p.px(7, 0, '#8a4ce0'); p.px(7, 1, INK);
          return false;
        default:
          lens('#ffffff');
          return true;
      }
    }

    // normal (Юрич), холст 8×5: брови в строке 0, белки 3×3 в строках 2–4.
    const whites = (c) => { p.rect(0, 2, 3, 3, c); p.rect(5, 2, 3, 3, c); };
    const brows = (angry) => {
      if (angry) { p.line(0, 0, 2, 1, S.hairS); p.line(5, 1, 7, 0, S.hairS); }
      else { p.rect(0, 0, 3, 1, S.hairS); p.rect(5, 0, 3, 1, S.hairS); }
    };
    switch (variant) {
      case 'blink':
      case 'sleep':
        whites(S.skin); p.rect(0, 3, 3, 1, INK); p.rect(5, 3, 3, 1, INK); brows(false);
        return false;
      case 'happy':
        whites(S.skin); [[0, 4], [1, 3], [2, 4], [5, 4], [6, 3], [7, 4]].forEach(([x, y]) => p.px(x, y, INK)); brows(false);
        return false;
      case 'wide':
        p.rect(0, 1, 3, 4, '#ffffff'); p.rect(5, 1, 3, 4, '#ffffff'); p.rect(0, 0, 3, 1, S.hairS); p.rect(5, 0, 3, 1, S.hairS);
        return true;
      case 'angry':
        whites('#ffffff'); brows(true); p.rect(0, 2, 3, 1, S.skin); p.rect(5, 2, 3, 1, S.skin);
        return true;
      case 'x':
      case 'hurt':
        whites('#ffffff'); brows(false);
        p.px(0, 2, INK); p.px(2, 2, INK); p.px(1, 3, INK); p.px(5, 2, INK); p.px(7, 2, INK); p.px(6, 3, INK);
        if (variant === 'x') { p.px(0, 4, INK); p.px(2, 4, INK); p.px(5, 4, INK); p.px(7, 4, INK); }
        return false;
      case 'spiral':
        whites('#ffffff'); brows(false); p.px(1, 3, '#ff9a3a'); p.px(6, 3, '#ff9a3a');
        return false;
      default:
        whites('#ffffff'); brows(false);
        return true;
    }
  }

  const EYE_SIZES = { big: [12, 9], glasses: [9, 2], normal: [8, 5] };
  // Верхний левый пиксель зрачков (1×2) внутри холста глаз при взгляде прямо.
  const PUPILS = {
    big: [[4, 4], [8, 4]],
    glasses: [[1, 0], [7, 0]],
    normal: [[1, 3], [6, 3]],
  };

  // ——— Рты: smile, grin, o, yell, grit, flat, smirk, talk, munch ———
  function mouth(p, variant, S) {
    switch (variant) {
      case 'smile':
        p.line(0, 0, 1, 1, INK); p.rect(1, 1, 5, 1, MOUTH_IN); p.line(1, 1, 5, 1, INK); p.rect(2, 2, 3, 1, INK); p.px(6, 0, INK);
        p.px(2, 1, TEETH); p.px(3, 1, TEETH); p.px(4, 1, TEETH);
        break;
      case 'grin':
        p.rect(0, 0, 7, 1, INK); p.rect(1, 1, 5, 2, MOUTH_IN); p.rect(1, 1, 5, 1, TEETH); p.px(3, 2, TONGUE); p.px(4, 2, TONGUE);
        p.px(0, 1, INK); p.px(6, 1, INK); p.rect(1, 3, 5, 1, INK); p.px(0, 2, INK); p.px(6, 2, INK);
        break;
      case 'o':
        p.rect(3, 0, 2, 1, INK); p.rect(2, 1, 1, 2, INK); p.rect(5, 1, 1, 2, INK); p.rect(3, 3, 2, 1, INK); p.rect(3, 1, 2, 2, MOUTH_IN);
        break;
      case 'yell':
        p.rect(1, 0, 5, 1, INK); p.rect(0, 1, 1, 3, INK); p.rect(6, 1, 1, 3, INK); p.rect(1, 4, 5, 1, INK);
        p.rect(1, 1, 5, 3, MOUTH_IN); p.rect(1, 1, 5, 1, TEETH); p.rect(2, 3, 3, 1, TONGUE);
        break;
      case 'grit':
        p.rect(0, 0, 7, 3, INK); p.rect(1, 1, 5, 1, TEETH); p.px(3, 1, INK);
        break;
      case 'flat':
        p.rect(1, 1, 5, 1, INK);
        break;
      case 'smirk':
        p.rect(1, 1, 4, 1, INK); p.px(5, 0, INK); p.px(6, 0, INK);
        break;
      case 'sad':
        p.rect(2, 0, 3, 1, INK); p.px(1, 1, INK); p.px(5, 1, INK);
        break;
      case 'munch':
        p.rect(1, 0, 5, 1, INK); p.rect(1, 1, 5, 1, MOUTH_IN); p.rect(1, 2, 5, 1, INK); p.px(2, 1, '#f2b23c'); p.px(4, 1, '#c8302a');
        break;
      case 'talk':
        p.rect(1, 0, 5, 1, INK); p.rect(1, 1, 5, 1, MOUTH_IN); p.px(3, 1, TONGUE); p.rect(2, 2, 3, 1, INK); p.px(0, 0, INK);
        break;
      default:
        p.rect(1, 1, 5, 1, INK);
    }
  }
  const MOUTHS = ['smile', 'grin', 'o', 'yell', 'grit', 'flat', 'smirk', 'sad', 'munch', 'talk'];
  const EYES = ['open', 'blink', 'happy', 'wide', 'angry', 'x', 'spiral', 'hurt', 'sleep'];

  // ——— Тело ———
  function torso(p, S, hero) {
    p.ellipse(6.5, 5, 5, 3.2, S.suit);
    p.rect(2, 4, 9, 9, S.suit);
    p.px(2, 4, null);
    if (hero === 'gennadich') {
      // Шейное кольцо скафандра, нагрудная панель, бейджи JS и </>.
      p.rect(3, 1, 7, 3, S.trim); p.rect(4, 2, 5, 1, S.trimS);
      p.rect(7, 6, 3, 2, '#f7df1e'); p.px(8, 6, '#3a3a2a');
      p.rect(3, 6, 3, 2, '#1d3a2c'); p.px(4, 6, '#8cff3a');
      p.rect(2, 10, 9, 2, S.trim); p.rect(6, 10, 2, 2, '#d8d8e8');
    } else if (hero === 'sanyara') {
      p.rect(4, 1, 5, 3, S.suitS); p.rect(5, 1, 3, 2, S.suitD);
      p.line(6, 4, 6, 9, S.suitD);
      // Нашивка Figma.
      p.px(8, 5, '#f24e1e'); p.px(9, 5, '#ff7262'); p.px(8, 6, '#a259ff'); p.px(9, 6, '#1abcfe'); p.px(8, 7, '#0acf83');
      p.rect(2, 10, 9, 2, '#1b1424'); p.px(6, 10, '#9a9aaa');
    } else {
      p.rect(4, 1, 5, 3, S.suitS); p.rect(5, 2, 3, 1, S.suitD);
      p.rect(7, 5, 3, 3, '#1c1a20'); p.px(8, 6, '#8cff3a');
      p.line(3, 4, 5, 9, S.suitD);
      p.rect(2, 10, 9, 2, '#1f1b22'); p.px(6, 10, '#d0a040');
    }
    p.rim({ [S.suit]: S.suitS }, -1, 1, 1);
    p.rim({ [S.suit]: S.suitL }, 1, -1, 1);
  }

  function upperArm(p, S, hero) {
    p.rect(0, 1, 4, 6, S.suit); p.rect(1, 0, 2, 1, S.suit);
    if (hero === 'gennadich') p.rect(0, 0, 4, 2, S.trim);
    p.rim({ [S.suit]: S.suitS }, -1, 0, 1);
  }
  function foreArm(p, S, hero) {
    p.rect(0, 0, 4, 6, S.suit);
    p.rect(0, 4, 4, 2, hero === 'gennadich' ? S.trim : S.glove);
    p.rim({ [S.suit]: S.suitS }, -1, 0, 1);
  }
  function glove(p, S) {
    p.circle(2.5, 2.5, 2.6, S.glove);
    p.rim({ [S.glove]: S.gloveS }, -1, 1, 1);
  }
  function thigh(p, S) {
    p.rect(0, 0, 5, 7, S.suit);
    p.rim({ [S.suit]: S.suitS }, -1, 0, 1);
  }
  function shin(p, S, hero) {
    p.rect(0, 0, 5, 7, S.suit);
    if (hero === 'gennadich') { p.rect(0, 0, 5, 2, S.suitL); p.px(2, 0, S.trim); }
    p.rect(0, 5, 5, 2, S.boot);
    p.rim({ [S.suit]: S.suitS }, -1, 0, 1);
  }
  function boot(p, S) {
    p.rect(0, 0, 5, 3, S.boot);
    p.ellipse(5.5, 2.5, 2.6, 1.8, S.boot);
    p.rect(0, 3, 8, 1, S.sole);
    p.rim({ [S.boot]: S.bootS }, 0, 1, 1);
    p.px(5, 1, GS.Pix.mix(S.boot, '#ffffff', 0.35));
  }

  function gun(p, S, hero) {
    if (hero === 'sanyara') {
      p.rect(2, 1, 8, 4, S.gun); p.rect(10, 2, 3, 2, S.gunS); p.rect(4, 2, 4, 2, S.glow);
      p.rect(3, 4, 2, 3, S.gunD); p.px(12, 2, S.glow); p.px(12, 3, S.glowS); p.rect(0, 2, 2, 2, S.gunS);
    } else if (hero === 'yurich') {
      p.rect(2, 1, 9, 3, S.gun); p.rect(11, 2, 2, 1, S.gunS); p.rect(4, 2, 5, 1, S.glow);
      p.rect(3, 4, 2, 3, S.gunD); p.rect(0, 1, 2, 2, '#8e2b1e'); p.px(12, 2, S.glow);
    } else {
      p.rect(2, 1, 9, 4, S.gun); p.rect(11, 2, 3, 2, S.gunD); p.rect(5, 2, 4, 2, S.glow); p.px(6, 2, '#eaffc0');
      p.rect(3, 4, 2, 3, S.gunD); p.px(13, 2, S.glow); p.px(13, 3, S.glowS); p.rect(1, 2, 1, 2, S.trim);
      p.rim({ [S.gun]: S.gunS }, 0, 1, 1);
    }
  }

  function backpack(p, S, hero) {
    if (hero === 'gennadich') {
      p.rect(0, 0, 6, 10, S.suit); p.rect(1, 2, 3, 4, '#3ab0c8'); p.px(2, 3, '#a8f0ff'); p.rect(0, 8, 6, 2, S.trim);
      p.rim({ [S.suit]: S.suitS }, -1, 1, 1);
    } else if (hero === 'yurich') {
      // Ножны катаны за спиной.
      p.line(0, 13, 7, 0, '#2a1e26'); p.line(1, 13, 8, 0, '#3e2c38'); p.rect(6, 0, 3, 2, '#d0a040');
    }
  }

  function antenna(p) {
    p.rect(1, 2, 1, 6, '#8a8fa8');
    p.circle(1.5, 1.5, 1.6, '#ff8a2a');
    p.px(1, 0, '#ffd0a0');
  }
  function tuft(p, S) {
    p.poly([[0, 5], [1, 2], [3, 0], [4, 2], [3, 5]], S.hair);
    p.px(2, 1, S.hairL);
  }

  function glasses(p) {
    // Оправа: две прямоугольные линзы, мостик и дужка назад к уху.
    const fr = '#0e0c14';
    p.rect(0, 0, 5, 1, fr); p.rect(0, 3, 5, 1, fr); p.rect(0, 0, 1, 4, fr); p.rect(4, 0, 1, 4, fr);
    p.rect(6, 0, 5, 1, fr); p.rect(6, 3, 5, 1, fr); p.rect(6, 0, 1, 4, fr); p.rect(10, 0, 1, 4, fr);
    p.px(5, 1, fr);
    p.line(-1, 1, -4, 2, fr);
  }

  // Предметы для «залипания» и спецприёмов.
  function laptop(p) {
    p.rect(0, 0, 12, 8, '#2a2c3a'); p.rect(1, 1, 10, 6, '#0d1a14');
    [1, 3, 5].forEach((y, i) => p.rect(2, y + 1, 4 + ((i * 3) % 5), 1, '#5aff6a'));
    p.px(9, 2, '#ffd84a');
    p.rect(-1, 8, 14, 2, '#4a4d60');
  }
  function mug(p) {
    p.rect(0, 0, 5, 6, '#f2ece0'); p.rect(5, 1, 2, 3, '#f2ece0'); p.px(5, 2, null); p.px(6, 2, null);
    p.rect(1, 2, 3, 2, '#3a2a2a'); p.px(2, 2, '#f2ece0');
    p.rect(0, 0, 5, 1, '#6a3c20');
    p.rim({ '#f2ece0': '#c8bca8' }, -1, 0, 1);
  }
  function katana(p) {
    p.rect(0, 1, 5, 2, '#2b1f2a'); p.px(1, 1, '#d0a040'); p.px(3, 2, '#d0a040');
    p.rect(5, 0, 1, 4, '#d0a040');
    p.rect(6, 1, 15, 2, '#dfe6f0'); p.rect(6, 2, 15, 1, '#a8b2c4'); p.px(21, 1, '#ffffff');
  }

  // Минимальные размеры холстов и точки вращения (до обводки).
  const LAYOUT = {
    head: [18, 19, [7, 18]],
    torso: [13, 13, [6.5, 12.5]],
    armU: [4, 7, [2, 1]],
    armL: [4, 6, [2, 1]],
    glove: [5, 5, [2.5, 1.5]],
    thigh: [5, 7, [2.5, 1]],
    shin: [5, 7, [2.5, 1]],
    boot: [8, 4, [2.5, 0.5]],
    gun: [14, 7, [4, 5]],
    pack: [6, 10, [5, 2]],
    sheath: [9, 14, [8, 2]],
    antenna: [3, 8, [1.5, 7.5]],
    tuft: [5, 6, [1.5, 5.5]],
    glasses: [11, 4, [0, 0]],
    mouth: [7, 5, [0, 0]],
    laptop: [12, 10, [6, 9]],
    mug: [7, 6, [1, 4]],
    katana: [22, 4, [2, 2]],
  };

  return {
    EYES, MOUTHS, PUPILS, EYE_SIZES, LAYOUT,

    generate(scene) {
      Object.keys(GS.SKINS).forEach((hero) => {
        const S = GS.SKINS[hero];
        const k = (n) => `${hero}/${n}`;
        const L = LAYOUT;
        GS.makePart(scene, k('head'), L.head[0], L.head[1], L.head[2], (p) => head(p, S, hero));
        GS.makePart(scene, k('torso'), L.torso[0], L.torso[1], L.torso[2], (p) => torso(p, S, hero));
        GS.makePart(scene, k('armU'), L.armU[0], L.armU[1], L.armU[2], (p) => upperArm(p, S, hero));
        GS.makePart(scene, k('armL'), L.armL[0], L.armL[1], L.armL[2], (p) => foreArm(p, S, hero));
        GS.makePart(scene, k('glove'), L.glove[0], L.glove[1], L.glove[2], (p) => glove(p, S));
        GS.makePart(scene, k('thigh'), L.thigh[0], L.thigh[1], L.thigh[2], (p) => thigh(p, S));
        GS.makePart(scene, k('shin'), L.shin[0], L.shin[1], L.shin[2], (p) => shin(p, S, hero));
        GS.makePart(scene, k('boot'), L.boot[0], L.boot[1], L.boot[2], (p) => boot(p, S));
        GS.makePart(scene, k('gun'), L.gun[0], L.gun[1], L.gun[2], (p) => gun(p, S, hero));
        if (hero === 'gennadich') {
          GS.makePart(scene, k('pack'), L.pack[0], L.pack[1], L.pack[2], (p) => backpack(p, S, hero));
          GS.makePart(scene, k('antenna'), L.antenna[0], L.antenna[1], L.antenna[2], (p) => antenna(p), { outline: true });
        }
        if (hero === 'yurich') GS.makePart(scene, k('pack'), L.sheath[0], L.sheath[1], L.sheath[2], (p) => backpack(p, S, hero));
        GS.makePart(scene, k('tuft'), L.tuft[0], L.tuft[1], L.tuft[2], (p) => tuft(p, S));
        if (S.eyeStyle === 'glasses') GS.makePart(scene, k('glasses'), L.glasses[0] + 4, L.glasses[1], [4, 0], (p) => {
          const g = new GS.Pix(11, 4); glasses(g); p.stamp(g, 4, 0); p.line(3, 1, 0, 2, '#0e0c14');
        }, { outline: false });

        const [ew, eh] = EYE_SIZES[S.eyeStyle];
        EYES.forEach((v) => {
          // Глаза рисуются со своей обводкой внутри функции, поэтому холст без автообводки.
          const pp = new GS.Pix(ew, eh);
          eyes(pp, S, v);
          pp.tex(scene, k('eyes_' + v));
          GS.PARTS[k('eyes_' + v)] = { ox: 0, oy: 0, w: pp.w, h: pp.h, px: 0, py: 0 };
        });
        MOUTHS.forEach((v) => GS.makePart(scene, k('mouth_' + v), L.mouth[0], L.mouth[1], [0, 0], (p) => mouth(p, v, S), { outline: false }));
      });

      // Общие детали.
      GS.makePart(scene, 'hero/pupil', 1, 2, [0, 0], (p) => p.rect(0, 0, 1, 2, GS.PAL.ink), { outline: false });
      GS.makePart(scene, 'hero/laptop', LAYOUT.laptop[0], LAYOUT.laptop[1], LAYOUT.laptop[2], (p) => {
        const q = new GS.Pix(14, 10); laptop(q); p.stamp(q, 0, 0);
      });
      GS.makePart(scene, 'hero/mug', LAYOUT.mug[0], LAYOUT.mug[1], LAYOUT.mug[2], (p) => mug(p));
      GS.makePart(scene, 'hero/katana', LAYOUT.katana[0], LAYOUT.katana[1], LAYOUT.katana[2], (p) => katana(p));
      GS.makePart(scene, 'hero/none', 1, 1, [0, 0], () => {}, { outline: false });

      // Портреты для HUD: голова + глаза + рот в одном холсте.
      Object.keys(GS.SKINS).forEach((hero) => {
        ['open', 'hurt', 'happy', 'x'].forEach((ev) => this.portrait(scene, hero, ev));
      });
    },

    portrait(scene, hero, ev) {
      const S = GS.SKINS[hero];
      const h = new GS.Pix(LAYOUT.head[0], LAYOUT.head[1]);
      head(h, S, hero);
      const out = new GS.Pix(24, 24);
      out.stamp(h, 2, 3);
      const [ew, eh] = EYE_SIZES[S.eyeStyle];
      const e = new GS.Pix(ew, eh);
      const pupils = eyes(e, S, ev);
      const ex = 2 + S.eyesAt[0], ey = 3 + S.eyesAt[1];
      out.stamp(e, ex, ey);
      if (pupils) PUPILS[S.eyeStyle].forEach(([x, y]) => { out.px(ex + x, ey + y, GS.PAL.ink); out.px(ex + x, ey + y + 1, GS.PAL.ink); });
      if (S.eyeStyle === 'glasses') { const g = new GS.Pix(11, 4); glasses(g); out.stamp(g, ex - 1, ey - 1); }
      const m = new GS.Pix(7, 5);
      mouth(m, ev === 'hurt' || ev === 'x' ? 'yell' : ev === 'happy' ? 'grin' : 'smile', S);
      out.stamp(m, 2 + S.mouthAt[0], 3 + S.mouthAt[1]);
      out.outlined(GS.PAL.ink).tex(scene, `portrait/${hero}_${ev}`);
    },
  };
})();
