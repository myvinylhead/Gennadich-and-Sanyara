// Параллакс-фоны биомов. Слои — TileSprite в экранных координатах, сдвиг по камере с коэффициентом.
GS.Backgrounds = (() => {
  const W = GS.W, H = GS.H;

  function once(scene, key, w, h, fn) {
    if (!scene.textures.exists(key)) GS.makeTex(scene, key, w, h, fn);
    return key;
  }

  function sky(scene, key, top, mid, bottom) {
    return once(scene, key, 4, H, (p) => {
      for (let y = 0; y < H; y++) {
        const t = y / H;
        const c = t < 0.5 ? GS.Pix.mix(top, mid, t * 2) : GS.Pix.mix(mid, bottom, (t - 0.5) * 2);
        // Ступенчатые полосы с дизерингом — «16-битный» градиент.
        const band = Math.floor(t * 24) / 24;
        const c2 = band < 0.5 ? GS.Pix.mix(top, mid, band * 2) : GS.Pix.mix(mid, bottom, (band - 0.5) * 2);
        for (let x = 0; x < 4; x++) p.px(x, y, (x + y) % 2 ? c : c2);
      }
    });
  }

  function stars(scene, key, seed, density = 0.004) {
    return once(scene, key, 256, 256, (p) => {
      const rnd = GS.util.rng(seed);
      const n = Math.floor(256 * 256 * density);
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rnd() * 256), y = Math.floor(rnd() * 256);
        const r = rnd();
        p.px(x, y, r < 0.6 ? '#4a3a8a' : r < 0.85 ? '#8a7ad0' : r < 0.95 ? '#e2e4f0' : '#b4ff5a');
        if (r > 0.97) { p.px(x - 1, y, '#6a5ab0'); p.px(x + 1, y, '#6a5ab0'); p.px(x, y - 1, '#6a5ab0'); p.px(x, y + 1, '#6a5ab0'); }
      }
    });
  }

  // Силуэты руин/шпилей нейропланеты.
  function ruinsLayer(scene, key, seed, h, colA, colB, light) {
    return once(scene, key, 512, h, (p) => {
      const rnd = GS.util.rng(seed);
      let x = 0;
      while (x < 512) {
        const w = 14 + Math.floor(rnd() * 30);
        const th = 30 + Math.floor(rnd() * (h - 50));
        p.rect(x, h - th, w, th, colA);
        if (rnd() < 0.6) { const sw = 3 + Math.floor(rnd() * 4); p.rect(x + Math.floor(w / 2) - 1, h - th - 12 - Math.floor(rnd() * 20), sw, 14 + Math.floor(rnd() * 20), colA); }
        if (rnd() < 0.5) p.rect(x + 2, h - th + 4, w - 4, 2, colB);
        for (let i = 0; i < 3; i++) if (rnd() < 0.5) p.rect(x + 3 + Math.floor(rnd() * (w - 6)), h - th + 6 + Math.floor(rnd() * (th - 10)), 2, 3, light);
        // Ветви-«деревья».
        if (rnd() < 0.35) {
          const bx = x + Math.floor(w / 2);
          for (let k = 0; k < 4; k++) p.line(bx, h - th, bx + Math.floor((rnd() - 0.5) * 30), h - th - 10 - Math.floor(rnd() * 20), colA);
        }
        x += w + Math.floor(rnd() * 10);
      }
    });
  }

  function coralLayer(scene, key, seed, h, col, dot) {
    return once(scene, key, 512, h, (p) => {
      const rnd = GS.util.rng(seed);
      p.rect(0, h - 10, 512, 10, col);
      for (let i = 0; i < 26; i++) {
        const bx = Math.floor(rnd() * 512);
        const bh = 20 + Math.floor(rnd() * (h - 30));
        p.rect(bx, h - bh, 3, bh, col);
        for (let k = 0; k < 3; k++) {
          const yy = h - Math.floor(rnd() * bh);
          const dir = rnd() < 0.5 ? -1 : 1;
          const len = 4 + Math.floor(rnd() * 10);
          p.rect(dir > 0 ? bx + 3 : bx - len, yy, len, 2, col);
          p.rect(dir > 0 ? bx + 3 + len - 2 : bx - len, yy - 6, 2, 6, col);
          if (rnd() < 0.6) p.circle(dir > 0 ? bx + 3 + len - 1 : bx - len + 1, yy - 7, 1.6, dot);
        }
        p.circle(bx + 1.5, h - bh, 2, dot);
      }
    });
  }

  function skylineLayer(scene, key, seed, h, col, win, neon) {
    return once(scene, key, 512, h, (p) => {
      const rnd = GS.util.rng(seed);
      let x = 0;
      while (x < 512) {
        const w = 24 + Math.floor(rnd() * 40);
        const th = 40 + Math.floor(rnd() * (h - 50));
        p.rect(x, h - th, w, th, col);
        if (rnd() < 0.4) p.rect(x + Math.floor(w / 2), h - th - 10, 1, 10, col);
        for (let yy = h - th + 4; yy < h - 4; yy += 6) {
          for (let xx = x + 3; xx < x + w - 3; xx += 5) {
            const r = rnd();
            if (r < 0.35) p.rect(xx, yy, 2, 3, win[Math.floor(rnd() * win.length)]);
          }
        }
        if (neon && rnd() < 0.3) p.rect(x + 2, h - th + 2, w - 4, 2, neon[Math.floor(rnd() * neon.length)]);
        x += w + 2 + Math.floor(rnd() * 6);
      }
    });
  }

  function gridLayer(scene, key) {
    return once(scene, key, 64, 64, (p) => {
      p.rect(0, 0, 64, 1, 'rgba(255,90,74,0.25)'); p.rect(0, 0, 1, 64, 'rgba(255,90,74,0.25)');
      p.rect(32, 0, 1, 64, 'rgba(255,90,74,0.1)'); p.rect(0, 32, 64, 1, 'rgba(255,90,74,0.1)');
    });
  }

  // Потоки пакетов: горизонтальные световые штрихи разной длины.
  function streamLayer(scene, key, seed, h, cols) {
    return once(scene, key, 512, h, (p) => {
      const rnd = GS.util.rng(seed);
      for (let i = 0; i < 70; i++) {
        const y = Math.floor(rnd() * h), x = Math.floor(rnd() * 512), len = 6 + Math.floor(rnd() * 40);
        const c = cols[Math.floor(rnd() * cols.length)];
        p.rect(x, y, Math.min(len, 512 - x), 1, c);
        p.px(Math.min(511, x + len), y, '#ffffff');
      }
    });
  }

  // Полоса фона из нарисованных деталей: put(key, x, y) кладёт деталь в целых пикселях. Без деталей — null.
  function composeLayer(scene, key, w, h, fill, fn) {
    if (scene.textures.exists(key)) return key;
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(0, 0, w, h); }
    const put = (k, x, y) => { const im = scene.textures.get(k).getSourceImage(); ctx.drawImage(im, Math.round(x), Math.round(y)); return im; };
    fn(put, ctx);
    tex.refresh();
    return key;
  }

  function layer(scene, key, factor, y, h, alpha = 1, fy = 0.05) {
    const t = scene.add.tileSprite(0, y, W, h, key).setOrigin(0, 0).setScrollFactor(0).setAlpha(alpha);
    t.factor = factor;
    t.fy = fy;
    t.baseY = y;
    return t;
  }

  const builders = {
    planet(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_planet', '#05031a', '#140c3a', '#2b1d5e')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      out.push(layer(scene, stars(scene, 'bg/stars1', 11), 0.02, 0, H));
      const planet = scene.textures.exists('bg/planet');
      if (planet) {
        const img = scene.add.image(0, 0, 'bg/planet').setOrigin(0, 0).setScrollFactor(0);
        img.factor = 0.08; img.fy = 0.04; img.baseY = 0; img.isImage = true;
        out.push(img);
      }
      out.push(layer(scene, ruinsLayer(scene, 'bg/ruins_planet', 5, 180, '#1d1445', '#2b1d5e', '#4fe03c'), 0.28, H - 180, 180, planet ? 0.75 : 1, 0.1));
      out.push(layer(scene, coralLayer(scene, 'bg/coral_planet', 9, 120, '#120c2e', '#7d52d6'), 0.5, H - 110, 120, 1, 0.18));
      return out;
    },
    city(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_city', '#05061a', '#1a1040', '#4a1a5a')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      out.push(layer(scene, stars(scene, 'bg/stars2', 23, 0.002), 0.02, 0, H));
      const moon = scene.add.image(470, 90, 'obj/portal').setScrollFactor(0).setScale(2).setAlpha(0.35);
      moon.spin = 0.15;
      out.push(moon);
      out.push(layer(scene, skylineLayer(scene, 'bg/sky_far', 31, 220, '#100c2a', ['#2a2050', '#3a2a6a', '#5a3a8a'], null), 0.12, H - 220, 220, 1, 0.06));
      out.push(layer(scene, skylineLayer(scene, 'bg/sky_mid', 47, 200, '#0a0a20', ['#ffd84a', '#8cf2ff', '#ff4ad0', '#3a3a6a', '#3a3a6a'], ['#ff4ad0', '#8cf2ff', '#4fe03c']), 0.3, H - 190, 200, 1, 0.12));
      return out;
    },
    cdn(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_cdn', '#020a14', '#062236', '#0a3a4a')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      out.push(layer(scene, stars(scene, 'bg/stars2', 23, 0.002), 0.02, 0, H));
      out.push(layer(scene, skylineLayer(scene, 'bg/cdn_far', 37, 230, '#061626', ['#1a4a6a', '#1a4a6a', '#3cb8d8', '#8cf2ff'], ['#ffd84a', '#ff4ad0']), 0.12, H - 230, 230, 1, 0.06));
      const far = layer(scene, streamLayer(scene, 'bg/cdn_stream1', 5, 150, ['#1a6a8a', '#3cb8d8']), 0.2, 70, 150, 0.6, 0.08);
      far.drift = 70;
      out.push(far);
      out.push(layer(scene, skylineLayer(scene, 'bg/cdn_mid', 53, 170, '#04101c', ['#3cd8f8', '#123047', '#123047', '#ff4ad0'], ['#3cd8f8']), 0.35, H - 170, 170, 1, 0.12));
      const near = layer(scene, streamLayer(scene, 'bg/cdn_stream2', 9, 120, ['#8cf2ff', '#3cd8f8', '#ff4ad0']), 0.5, 120, 120, 0.45, 0.14);
      near.drift = 180;
      out.push(near);
      return out;
    },
    // Собор из нарисованных деталей (art_refs/church_bg.png): колоннада, витражи со знамёнами, люстры,
    // полки, статуя и орган — слоями с параллаксом. Детали чуть притушены, чтобы враги читались на фоне.
    church(scene) {
      if (!scene.textures.exists('church/bg_arch')) return builders.churchCode(scene);
      const out = [];
      const boss = scene.def && scene.def.boss;
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_church', '#08060e', '#120c20', '#1e1432')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      const rose = scene.add.image(320, 58, 'church/bg_rose').setScrollFactor(0).setAlpha(boss ? 0.3 : 0.85);
      if (!boss) rose.flicker = 1;
      out.push(rose);
      const dim = (l, c) => { l.setTint(c); return l; };
      // Дальняя колоннада: арки встык.
      const arch = scene.textures.get('church/bg_arch').getSourceImage();
      out.push(dim(layer(scene, composeLayer(scene, 'bg/church_nave', arch.width * 4, arch.height, null, (put) => {
        for (let k = 0; k < 4; k++) put('church/bg_arch', k * arch.width, 0);
      }), 0.12, H - arch.height - 40, arch.height, 1, 0.06), 0x8a84a8));
      // Витражи и знамёна между ними.
      out.push(dim(layer(scene, composeLayer(scene, 'bg/church_windows', 360, 96, null, (put) => {
        put('church/bg_win0', 18, 6); put('church/bg_banner0', 68, 0);
        put('church/bg_win1', 128, 6); put('church/bg_banner1', 188, 0);
        put('church/bg_win2', 248, 6); put('church/bg_banner0', 300, 0);
      }), 0.22, 120, 96, 1, 0.08), 0xb0a8c8));
      // Люстры свисают сверху.
      out.push(layer(scene, composeLayer(scene, 'bg/church_lamps', 420, 60, null, (put) => {
        put('church/bg_chandelier', 40, 0); put('church/bg_chandelier', 270, 4);
      }), 0.3, 0, 60, 1, 0.1));
      // Ближний план: полка со свитками, статуя Святого Покока, орган.
      out.push(dim(layer(scene, composeLayer(scene, 'bg/church_props', 560, 90, null, (put) => {
        const b = (k, x) => { const im = scene.textures.get(k).getSourceImage(); put(k, x, 90 - im.height); };
        b('church/bg_shelf', 30); b('church/bg_statue', 150); b('church/bg_organ', 300); b('church/bg_statue', 470);
      }), 0.4, H - 90 - 16, 90, 1, 0.12), 0x9890b0));
      return out;
    },
    // Собор: тёмный неф, стрельчатые арки и витраж-роза со Святым Пококом (стилизованно: нимб, очки, значок TS).
    churchCode(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_church', '#08060e', '#120c20', '#1e1432')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      const rose = scene.add.image(320, 92, once(scene, 'bg/church_rose', 120, 120, (p) => {
        p.circle(60, 60, 59, '#3a3450');
        const cols = ['#c0303a', '#3a6ab0', '#ffd84a', '#4fa83c', '#8a4ce0', '#3a6ab0', '#c0303a', '#ffd84a'];
        for (let k = 0; k < 16; k++) {
          const a0 = k / 16 * Math.PI * 2, a1 = (k + 1) / 16 * Math.PI * 2;
          p.poly([[60, 60], [60 + Math.cos(a0) * 54, 60 + Math.sin(a0) * 54], [60 + Math.cos(a1) * 54, 60 + Math.sin(a1) * 54]], cols[k % cols.length]);
          p.line(60, 60, Math.round(60 + Math.cos(a0) * 55), Math.round(60 + Math.sin(a0) * 55), '#1a1426');
        }
        p.circle(60, 60, 26, '#f2e2b0');
        for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; p.px(Math.round(60 + Math.cos(t) * 21), Math.round(46 + Math.sin(t) * 6), '#ffd84a'); } // нимб
        p.circle(60, 56, 9, '#f2c49a');
        p.rect(52, 54, 7, 4, '#140c1e'); p.rect(61, 54, 7, 4, '#140c1e'); p.rect(59, 55, 2, 1, '#140c1e'); // очки
        p.rect(56, 61, 8, 1, '#8a3a2a');
        p.poly([[46, 86], [50, 66], [70, 66], [74, 86]], '#3a6ab0');
        p.rect(55, 72, 10, 8, '#3178c6'); p.rect(56, 73, 3, 1, '#ffffff'); p.rect(57, 73, 1, 5, '#ffffff'); p.rect(60, 73, 3, 1, '#ffffff'); p.rect(60, 75, 3, 1, '#ffffff'); p.rect(62, 76, 1, 2, '#ffffff'); p.rect(60, 77, 2, 1, '#ffffff'); // «TS»
      })).setScrollFactor(0).setAlpha(scene.def && scene.def.boss ? 0.3 : 0.8);
      // На арене босса витраж приглушён: на первом плане — свиток Архиепископа.
      if (!(scene.def && scene.def.boss)) rose.flicker = 1;
      out.push(rose);
      out.push(layer(scene, once(scene, 'bg/church_arches', 192, 220, (p) => {
        for (let k = 0; k < 3; k++) {
          const x = k * 64;
          p.rect(x, 0, 64, 220, '#0c0a16');
          p.rect(x + 10, 60, 44, 160, '#161226');
          p.poly([[x + 10, 60], [x + 32, 18], [x + 54, 60]], '#161226');
          p.rect(x + 22, 70, 20, 60, '#1e1838'); p.poly([[x + 22, 70], [x + 32, 52], [x + 42, 70]], '#1e1838');
          p.rect(x + 31, 52, 2, 78, '#2a2448');
        }
      }), 0.2, H - 220, 220, 1, 0.08));
      out.push(layer(scene, skylineLayer(scene, 'bg/church_pews', 61, 110, '#0a0814', ['#ffd84a', '#ff8a2a', '#2a2438', '#2a2438'], null), 0.4, H - 110, 110, 1, 0.12));
      return out;
    },
    // Пицца-вселенная: печной жар, звёзды и огромная пицца-планета, которая медленно крутится.
    pizza(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_pizza', '#12040a', '#3a0c0a', '#7a2a0a')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      out.push(layer(scene, stars(scene, 'bg/stars1', 11), 0.03, 0, H));
      const planet = scene.add.image(470, 110, once(scene, 'bg/pizza_planet', 120, 120, (p) => {
        p.circle(60, 60, 59, '#d9822b'); p.circle(60, 60, 52, '#ffd84a');
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.line(60, 60, Math.round(60 + Math.cos(a) * 52), Math.round(60 + Math.sin(a) * 52), '#e0a020'); }
        [[40, 38], [78, 44], [52, 80], [86, 76], [62, 58], [30, 66]].forEach(([x, y]) => p.circle(x, y, 6, '#c0302a'));
        [[48, 56], [72, 66], [64, 30]].forEach(([x, y]) => p.circle(x, y, 2.5, '#2a2a2a'));
      })).setScrollFactor(0).setAlpha(0.55);
      planet.spin = 0.12;
      // На арене босса главная пицца — сам босс, вторая на фоне только путает.
      if (!(scene.def && scene.def.boss)) out.push(planet); else planet.destroy();
      out.push(layer(scene, skylineLayer(scene, 'bg/pizza_boxes', 91, 200, '#2a1408', ['#c8a070', '#c0302a', '#5a3a1a', '#5a3a1a'], ['#ffd84a']), 0.15, H - 200, 200, 1, 0.07));
      out.push(layer(scene, ruinsLayer(scene, 'bg/pizza_oven', 37, 150, '#1a0804', '#3a1408', '#ff8a2a'), 0.35, H - 150, 150, 1, 0.12));
      return out;
    },
    suno(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_suno', '#06041a', '#140a34', '#2a1050')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      out.push(layer(scene, stars(scene, 'bg/stars1', 11), 0.03, 0, H));
      // Вывеска SUNO и портал — как в ролике.
      const sign = GS.text(scene, 70, 40, 'SUNO', { color: '#e8d8ff', scale: 3, origin: [0, 0] }).setScrollFactor(0);
      sign.flicker = 1;
      out.push(sign);
      const portal = scene.add.image(520, 70, 'obj/portal').setScrollFactor(0).setScale(1.6).setAlpha(0.4);
      portal.spin = -0.4;
      out.push(portal);
      out.push(layer(scene, ruinsLayer(scene, 'bg/suno_crystals', 71, 200, '#1a0c3a', '#3a1a6a', '#d070ff'), 0.15, H - 200, 200, 1, 0.07));
      // Эквалайзер на заднике — прыгает в такт.
      const eq = scene.add.graphics().setScrollFactor(0);
      eq.tick = () => {
        const B = GS.beat();
        eq.clear();
        for (let i = 0; i < 40; i++) {
          const ph = (((B.step - (i % 8)) / 4) % 1 + 1) % 1;
          const h = Math.round((1 - ph) * (18 + ((i * 37) % 23)) + 6);
          const c = i % 3 === 0 ? 0xd070ff : i % 3 === 1 ? 0x4fe03c : 0x8cf2ff;
          eq.fillStyle(c, 0.28).fillRect(i * 16 + 2, H - 70 - h, 10, h);
        }
      };
      out.push(eq);
      out.push(layer(scene, skylineLayer(scene, 'bg/suno_stacks', 83, 150, '#0a0618', ['#3a2470', '#4fe03c', '#3a2470', '#d070ff'], ['#4fe03c']), 0.35, H - 150, 150, 1, 0.12));
      return out;
    },
    core(scene) {
      const out = [];
      out.push(scene.add.image(0, 0, sky(scene, 'bg/sky_core', '#05050c', '#120a14', '#2a0c14')).setOrigin(0).setScrollFactor(0).setDisplaySize(W, H));
      out.push(layer(scene, gridLayer(scene, 'bg/grid'), 0.15, 0, H, 1, 0.15));
      out.push(layer(scene, skylineLayer(scene, 'bg/racks', 61, 160, '#0c0c14', ['#ff5a4a', '#4fe03c', '#2a2a3a', '#2a2a3a'], null), 0.4, H - 160, 160, 1, 0.1));
      return out;
    },
  };

  return {
    // Общие текстуры фонов (звёзды, кораллы) — нужны и меню, и уровням.
    prepare(scene) {
      stars(scene, 'bg/stars1', 11);
      stars(scene, 'bg/stars2', 23, 0.002);
      coralLayer(scene, 'bg/coral_planet', 9, 120, '#120c2e', '#7d52d6');
    },
    create(scene, theme, worldH = H) {
      const layers = builders[theme](scene);
      const maxScroll = Math.max(0, worldH - H);
      layers.forEach((l, i) => l.setDepth(-100 + i));
      return {
        layers,
        update(cam, time) {
          for (const l of layers) {
            if (l.tick) { l.tick(cam, time); continue; }
            if (l.factor === undefined) {
              if (l.spin) l.rotation = time / 1000 * l.spin;
              if (l.flicker !== undefined) l.setAlpha(0.65 + 0.15 * Math.sin(time / 90 + l.flicker * 2) * (Math.random() < 0.05 ? 3 : 1));
              continue;
            }
            // По вертикали слои «лежат» на дне мира и уезжают вниз, когда камера поднимается.
            const lift = (maxScroll - cam.scrollY) * l.fy;
            if (l.isImage) {
              l.x = -Math.min(Math.round(cam.scrollX * l.factor), l.width - W);
              l.y = Math.round(lift);
              continue;
            }
            l.tilePositionX = Math.round(cam.scrollX * l.factor + (l.drift ? time / 1000 * l.drift : 0));
            l.y = Math.round(l.baseY + lift);
          }
        },
      };
    },
  };
})();
