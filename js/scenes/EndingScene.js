// Финальные титры: стикеры, итоги, разблокировка Юрича.
GS.EndingScene = class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    this.leaving = false;
    const W = GS.W, H = GS.H;
    const wasLocked = !GS.Save.yurichUnlocked();
    GS.Save.data.finished = true;
    GS.Save.write();
    this.controls = new GS.Controls(this, 1);
    this.cameras.main.setBackgroundColor('#000000');
    if (this.textures.exists('story/title')) { const t = this.add.image(W / 2, H / 2, 'story/title').setAlpha(0.35); t.setScale(W / t.width); }
    this.add.rectangle(0, 0, W, H, 0x07051a, 0.45).setOrigin(0);
    const T = GS.session.totals;
    const lines = [
      ['ГЕННАДИЧ И САНЯРА', '#ffe14a', 2],
      ['НЕЙРОСЕТЕВЫЕ ПРИКЛЮЧЕНИЯ', '#b4ff5a', 1],
      ['', '', 1],
      ['ДИЗТЕХАМ ОТВЕТ ДОСТАВЛЕН!', '#ffffff', 2],
      ['', '', 1],
      ['В РОЛЯХ', '#b08cff', 1],
      ['ГЕННАДИЧ — ФРОНТЕНД, КОД И ХОТФИКСЫ', '#4fe03c', 1],
      ['САНЯРА — ДИЗАЙН, СЕТКИ И КОФЕ', '#b08cff', 1],
      ['ЮРИЧ — ЛЕГЕНДА ФРОНТЕНДА', '#ff5a4a', 1],
      ['ОПОССУМ-МАКС — ОШИБКА ГЕНЕРАЦИИ', '#e2e4f0', 1],
      ['НЕЙРОХРЮЧЕВО — САМО СЕБЯ', '#ff7ab8', 1],
      ['ПЕТУШНЯ — ПЕТУШНЯ', '#ff8a2a', 1],
      ['«Я ПОМОГ» — ПОМОГ', '#6ad03a', 1],
      ['', '', 1],
      ['ПРИ УЧАСТИИ', '#b08cff', 1],
      ['ДИЗТЕХИ • CLAUDE-МЕХ • SEEDANCE 2.0 • SUNO • FIGMA', '#e2e4f0', 1],
      ['ПИЦЦА • CAFFEINE FUEL LOGIC • КОШКА В СУСАЛЬНОМ ЗОЛОТЕ', '#e2e4f0', 1],
      ['', '', 1],
      ['ИТОГИ ПОХОДА', '#b08cff', 1],
      [`ВРЕМЯ: ${GS.util.fmtTime(T.time)}`, '#ffd84a', 1],
      [`ХРЮЧЕВА ПОФИКШЕНО: ${T.kills}`, '#ffd84a', 1],
      [`РЕФАКТОРИНГОВ: ${T.deaths}`, '#ffd84a', 1],
      [`ЗОЛОТЫХ КОШЕК: ${GS.Save.catCount()} / 3`, '#ffd84a', 1],
      ['', '', 1],
      [wasLocked ? 'ЮРИЧ РАЗБЛОКИРОВАН!' : 'ЮРИЧ ГОРДИТСЯ ВАМИ', '#ff5a4a', 2],
      ['', '', 1],
      ['КОСМОС СЛОЖЕН, НО ПРОДАКШН — СВЯЩЕНЕН!', '#b4ff5a', 1],
      ['СПАСИБО ЗА ИГРУ!', '#ffffff', 2],
    ];
    this.scroll = this.add.container(0, H + 10);
    let y = 0;
    lines.forEach(([s, c, sc]) => {
      if (s) this.scroll.add(GS.text(this, W / 2, y, s, { color: c, origin: [0.5, 0], scale: sc }));
      y += 10 * sc + 6;
    });
    this.scrollH = y;
    this.heroes = ['gennadich', 'sanyara', 'yurich'].map((h, i) => {
      const r = new GS.Skeleton(this, [52, 112, 588][i], H - 10, GS.heroRig(h), h + '/');
      r.baseScale = 2;
      r.play(i === 1 ? 'fidget' : 'win');
      r.facing = i === 2 ? -1 : 1;
      return r;
    });
    this.stickers = new GS.Stickers(this);
    this.stT = 1;
    this.events_ = ['win', 'pizza', 'combo', 'super', 'idle', 'coffee', 'cat', 'mech', 'artifact'];
    GS.Music.play('theme');
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    this.controls.update();
    this.scroll.y -= dt * 22;
    this.stT -= dt;
    if (this.stT <= 0) { this.stT = 3.2; this.stickers.show(this.events_.shift() || 'win', { force: true }); this.events_.push('win'); }
    this.stickers.update(dt);
    this.heroes.forEach((r) => r.tick(dt));
    const done = this.scroll.y < -this.scrollH + GS.H / 2;
    if (done) this.scroll.y = -this.scrollH + GS.H / 2;
    if ((this.controls.sys.confirm || this.controls.sys.back) && !this.leaving && (done || this.controls.sys.back)) {
      this.leaving = true;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    }
  }
};
