// Простое вертикальное меню из пиксельного текста: стрелки/WS, подтверждение, мышь.
GS.Menu = class Menu {
  constructor(scene, x, y, items, { gap = 16, scale = 1, color = '#e2e4f0', hi = '#b4ff5a', align = 'center', controls = null } = {}) {
    this.scene = scene;
    this.items = items;
    this.index = 0;
    this.hi = hi;
    this.color = color;
    this.controls = controls;
    this.texts = items.map((it, i) => {
      const t = GS.text(scene, x, y + i * gap, it.label, { color, scale, origin: [align === 'center' ? 0.5 : 0, 0.5], depth: 100 });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (!it.disabled) { this.index = i; this.refresh(); } });
      t.on('pointerdown', () => { GS.Synth.unlock(); this.index = i; this.select(); });
      return t;
    });
    this.cursor = GS.text(scene, 0, 0, '>', { color: hi, scale, origin: [1, 0.5], depth: 100 });
    this.scale = scale;
    this.t = 0;
    this.refresh();
  }
  label(i, s) { this.items[i].label = s; this.texts[i].setText(s); this.refresh(); }
  refresh() {
    this.texts.forEach((t, i) => {
      const it = this.items[i];
      t.setTint(GS.hex(it.disabled ? '#5a5a70' : i === this.index ? this.hi : this.color));
    });
    const t = this.texts[this.index];
    this.cursor.setPosition(t.x - t.displayWidth * t.originX - 4 * this.scale, t.y);
  }
  move(d) {
    let n = this.index;
    for (let k = 0; k < this.items.length; k++) {
      n = (n + d + this.items.length) % this.items.length;
      if (!this.items[n].disabled) break;
    }
    if (n !== this.index) { this.index = n; GS.Synth.menuMove(); this.refresh(); }
  }
  select() {
    const it = this.items[this.index];
    if (it.disabled) { GS.Synth.denied(); return; }
    GS.Synth.menuSelect();
    if (it.action) it.action(this);
  }
  update(dt) {
    this.t += dt;
    const C = this.controls;
    if (C) {
      if (C.sys.up) this.move(-1);
      if (C.sys.down) this.move(1);
      if (C.sys.confirm) this.select();
      const it = this.items[this.index];
      if (it.change && (C.sys.left || C.sys.right)) { it.change(C.sys.left ? -1 : 1, this); GS.Synth.menuMove(); }
    }
    this.cursor.x += Math.round(Math.sin(this.t * 8));
    this.refresh();
  }
  destroy() { this.texts.forEach((t) => t.destroy()); this.cursor.destroy(); }
};

// Пункты настроек — общие для титула и паузы.
GS.settingsItems = (onBack) => {
  const S = GS.Save.data.settings;
  const pct = (v) => `${Math.round(v * 100)}%`;
  const items = [
    { label: `МУЗЫКА: ${pct(S.music)}`, change: (d, m) => { S.music = GS.util.clamp(Math.round((S.music + d * 0.1) * 10) / 10, 0, 1); GS.Synth.applyVolumes(); GS.Save.write(); m.label(0, `МУЗЫКА: ${pct(S.music)}`); } },
    { label: `ЗВУК: ${pct(S.sfx)}`, change: (d, m) => { S.sfx = GS.util.clamp(Math.round((S.sfx + d * 0.1) * 10) / 10, 0, 1); GS.Synth.applyVolumes(); GS.Save.write(); m.label(1, `ЗВУК: ${pct(S.sfx)}`); GS.Synth.coin(); } },
    { label: `ПИКСЕЛИ: ${S.crisp ? 'ЧЁТКИЕ' : 'ВО ВЕСЬ ЭКРАН'}`, action: (m) => { S.crisp = !S.crisp; GS.Save.write(); GS.applyZoom(); m.label(2, `ПИКСЕЛИ: ${S.crisp ? 'ЧЁТКИЕ' : 'ВО ВЕСЬ ЭКРАН'}`); } },
    { label: 'ПОЛНЫЙ ЭКРАН', action: () => { const sc = GS.game.scale; if (sc.isFullscreen) sc.stopFullscreen(); else sc.startFullscreen(); } },
    { label: 'НАЗАД', action: onBack },
  ];
  items[0].action = (m) => items[0].change(1, m);
  items[1].action = (m) => items[1].change(1, m);
  return items;
};

// Пиксельный логотип: жёлтые буквы, зелёная «слизь» с каплями, чернильная обводка.
GS.makeLogo = (scene) => {
  if (scene.textures.exists('ui/logo')) return;
  const l1 = 'ГЕННАДИЧ', l2 = 'И САНЯРА';
  const s = 4;
  const w = Math.max(GS.Font.width(l1), GS.Font.width(l2)) * s + 20;
  const h = 7 * s * 2 + 10 * s + 20;
  const p = new GS.Pix(w, h);
  const draw = (str, y, c) => GS.Font.draw(p, str, Math.floor(w / 2), y, c, { scale: s, align: 'center' });
  // Слизь: сдвинутые копии зелёным.
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 1], [2, 1], [0, 2]]) {
    draw(l1, 6 + dy, '#3fc22a'); draw(l2, 6 + 9 * s + dy, '#3fc22a');
    void dx;
  }
  const rnd = GS.util.rng(42);
  for (let i = 0; i < 26; i++) {
    const x = 10 + Math.floor(rnd() * (w - 20));
    for (let y = h - 1; y > 0; y--) {
      if (p.get(x, y) === '#3fc22a') {
        const len = 2 + Math.floor(rnd() * 7);
        p.rect(x, y, 2, len, '#3fc22a');
        p.circle(x + 1, y + len, 1.6, '#3fc22a');
        break;
      }
    }
  }
  draw(l1, 6, '#ffe14a'); draw(l2, 6 + 9 * s, '#ffe14a');
  // Блик: верхняя строка пикселей каждой буквы светлее.
  for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) if (p.get(x, y) === '#ffe14a' && p.get(x, y - 1) !== '#ffe14a' && p.get(x, y - 1) !== '#fff8c0') p.px(x, y, '#fff8c0');
  p.outlined(GS.PAL.ink, true).outlined('#0a1a0a').tex(scene, 'ui/logo');
};

GS.TitleScene = class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.leaving = false;
    this.menu = null;
    this.button = null;
    GS.makeLogo(this);
    const W = GS.W, H = GS.H;
    this.cameras.main.setBackgroundColor('#07051a');
    this.add.image(0, 0, this.textures.exists('bg/sky_title') ? 'bg/sky_title' : GS.makeTex(this, 'bg/sky_title', 4, H, (p) => {
      for (let y = 0; y < H; y++) for (let x = 0; x < 4; x++) p.px(x, y, GS.Pix.mix('#05031a', '#2b1d5e', y / H));
    })).setOrigin(0).setDisplaySize(W, H);
    this.stars = this.add.tileSprite(0, 0, W, H, 'bg/stars1').setOrigin(0);
    this.portal = this.add.image(W / 2, 112, 'obj/portal').setScale(4).setAlpha(0.55);
    this.portalGlow = this.add.image(W / 2, 112, 'glow/green').setScale(6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35);
    if (this.textures.exists('bg/coral_planet')) this.add.tileSprite(0, H - 90, W, 120, 'bg/coral_planet').setOrigin(0).setAlpha(0.9);
    this.ground = this.add.rectangle(0, H - 18, W, 18, GS.hex('#120c2e')).setOrigin(0);
    this.add.rectangle(0, H - 18, W, 1, GS.hex('#4fe03c')).setOrigin(0);

    // Нарисованный логотип (со своим порталом) — если собран; иначе процедурный.
    const art = this.textures.exists('ui/logo_art');
    if (art) this.portal.setVisible(false);
    this.logoY = art ? 79 : 74;
    this.logo = this.add.image(W / 2, this.logoY, art ? 'ui/logo_art' : 'ui/logo');
    const subY = art ? 162 : 142;
    this.sub = GS.text(this, W / 2, subY, 'НЕЙРОСЕТЕВЫЕ ПРИКЛЮЧЕНИЯ', { color: '#ffe14a', origin: [0.5, 0.5] });
    const pill = this.add.graphics();
    pill.fillStyle(GS.hex('#2a1a4e'), 1).fillRoundedRect(W / 2 - 92, subY - 8, 184, 16, 7);
    pill.lineStyle(1, GS.hex('#7d52d6'), 1).strokeRoundedRect(W / 2 - 92, subY - 8, 184, 16, 7);
    this.children.bringToTop(this.sub);

    // Живые риги героев.
    this.gen = new GS.Skeleton(this, 110, H - 18, GS.heroRig('gennadich'), 'gennadich/');
    this.gen.baseScale = 3; this.gen.play('proud'); this.gen.showSlot('gun', false);
    this.san = new GS.Skeleton(this, W - 110, H - 18, GS.heroRig('sanyara'), 'sanyara/');
    this.san.baseScale = 3; this.san.facing = -1; this.san.play('proud'); this.san.showSlot('gun', false);
    this.pig = new GS.Skeleton(this, W / 2 + 120, H - 18, GS.enemyRigs.hryuchevo(), 'pig_pink/');
    this.pig.baseScale = 2; this.pig.play('idle'); this.pig.facing = -1;
    this.pigT = 0;
    this.add.image(40, H - 18, 'item/pizza').setOrigin(0.5, 1).setScale(2);
    this.add.image(W - 36, H - 18, 'item/coffee').setOrigin(0.5, 1).setScale(2);
    this.add.image(W / 2 - 150, H - 18, 'decor/vcrystal').setOrigin(0.5, 1).setScale(2);
    this.fidgetT = 0;

    this.controls = new GS.Controls(this, 1);
    this.buildMain();

    this.footer = GS.text(this, W / 2, H - 9, 'КОСМОС СЛОЖЕН, НО ПРОДАКШН — СВЯЩЕНЕН!', { color: '#7d52d6', origin: [0.5, 0.5] });
    GS.text(this, W - 4, 4, 'V1.0', { color: '#3a2a5a', origin: [1, 0] });
    // ?music=<трек> — послушать любой трек на титуле (например, ?music=theme).
    GS.Music.play(typeof GS.QUERY.music === 'string' ? GS.QUERY.music : 'theme');
    this.cameras.main.fadeIn(400, 7, 5, 26);
  }

  buildMain() {
    if (this.menu) this.menu.destroy();
    const unlocked = GS.Save.data.unlocked;
    const items = [
      { label: 'СДЕЛАТЬ КРАСИВО', action: () => this.go('Select', { players: 1 }) },
      { label: 'КООП НА ДВОИХ', action: () => this.go('Select', { players: 2 }) },
      { label: 'ВЫБОР ЭТАПА', disabled: unlocked < 2, action: () => this.go('Select', { players: 1, pickStage: true }) },
      { label: 'НАСТРОЙКИ', action: () => this.buildSettings() },
      { label: 'СТЕНД РИГОВ', action: () => this.go('RigLab') },
    ];
    this.menu = new GS.Menu(this, GS.W / 2, 186, items, { gap: 15, controls: this.controls });
    this.drawButton();
  }

  buildSettings() {
    this.menu.destroy();
    this.menu = new GS.Menu(this, GS.W / 2, 176, GS.settingsItems(() => this.buildMain()), { gap: 15, controls: this.controls });
    this.button.clear();
  }

  // Неоновая кнопка под первым пунктом — как «Сделать красиво» на заставке.
  drawButton() {
    if (!this.button) this.button = this.add.graphics().setDepth(99);
    this.button.clear();
  }

  go(scene, data) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 7, 5, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    this.controls.update();
    if (this.controls.sys.back && this.menu.items[this.menu.items.length - 1].label === 'НАЗАД') this.buildMain();
    this.menu.update(dt);
    this.stars.tilePositionX += dt * 4;
    this.portal.rotation -= dt * 0.8;
    this.portalGlow.setScale(6 + Math.sin(time / 400) * 0.4);
    this.logo.y = this.logoY + Math.round(Math.sin(time / 600) * 2);
    // Кнопка-подсветка выбранного пункта.
    if (this.button && this.menu.items[0].label === 'СДЕЛАТЬ КРАСИВО') {
      const t = this.menu.texts[this.menu.index];
      const w = t.displayWidth + 20;
      const g = this.button;
      g.clear();
      const pulse = 0.6 + Math.sin(time / 180) * 0.25;
      g.lineStyle(1, GS.hex('#4fe03c'), pulse).strokeRoundedRect(Math.round(t.x - w / 2), Math.round(t.y - 7), Math.round(w), 14, 6);
      g.lineStyle(1, GS.hex('#b4ff5a'), pulse * 0.5).strokeRoundedRect(Math.round(t.x - w / 2) - 2, Math.round(t.y - 9), Math.round(w) + 4, 18, 8);
    }
    // Герои живут своей жизнью.
    this.fidgetT += dt;
    if (this.fidgetT > 7) { this.fidgetT = 0; this.gen.play(this.gen.clipName === 'fidget' ? 'proud' : 'fidget'); this.san.play(this.san.clipName === 'fidget' ? 'proud' : 'fidget'); }
    this.gen.look.x = 1; this.san.look.x = 1;
    this.gen.tick(dt); this.san.tick(dt);
    this.pigT += dt;
    const px = GS.W / 2 + Math.sin(this.pigT * 0.7) * 80;
    this.pig.facing = Math.cos(this.pigT * 0.7) > 0 ? 1 : -1;
    this.pig.x = Math.round(px);
    this.pig.y = Math.round(GS.H - 18 - Math.abs(Math.sin(this.pigT * 4)) * 10);
    if (Math.abs(Math.sin(this.pigT * 4)) < 0.08) this.pig.squash(1.2, 0.85);
    this.pig.tick(dt);
  }
};
