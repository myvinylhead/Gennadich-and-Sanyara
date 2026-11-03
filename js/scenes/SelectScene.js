// Выбор героя (и этапа). В коопе каждый игрок выбирает своей раскладкой.
GS.HERO_INFO = {
  gennadich: ['СКОРОСТРЕЛЬНЫЙ КОД-БЛАСТЕР </>', 'СПЕЦ: ХОТФИКС-РЫВОК, НЕУЯЗВИМ', 'КОД — МОЁ ТОПЛИВО!'],
  sanyara: ['ПИКСЕЛЬ-БЛАСТЕР, ДЕРЖИ — ЗАРЯД', 'СПЕЦ: СЕТКА — ПЛАТФОРМА В ВОЗДУХЕ', 'СЕЙЧАС СЕТКУ ПОПРАВИМ'],
  yurich: ['КРАСНЫЙ ЛАЗЕР + ДВОЙНОЙ ПРЫЖОК', 'СПЕЦ: КАТАНА — РЕЖЕТ И ОТБИВАЕТ', 'ЛЕГЕНДА ФРОНТЕНДА'],
};

GS.SelectScene = class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  init(data) {
    this.leaving = false;
    this.players = data.players || 1;
    this.pickStage = !!data.pickStage;
  }

  create() {
    const W = GS.W, H = GS.H;
    this.cameras.main.setBackgroundColor('#0b0824');
    this.add.tileSprite(0, 0, W, H, 'bg/stars1').setOrigin(0).setAlpha(0.8);
    this.heroes = ['gennadich', 'sanyara', 'yurich'];
    this.locked = { yurich: !GS.Save.yurichUnlocked() };
    this.controls = new GS.Controls(this, this.players);
    GS.text(this, W / 2, 16, this.players > 1 ? 'КООП: ВЫБЕРИТЕ ГЕРОЕВ' : 'ВЫБЕРИ ГЕРОЯ', { color: '#b4ff5a', origin: [0.5, 0], scale: 2 });
    this.slots = [];
    const xs = this.players > 1 ? [W * 0.28, W * 0.72] : [W / 2];
    for (let i = 0; i < this.players; i++) {
      const s = { i, x: xs[i], pick: i, ready: false };
      s.stage = this.add.graphics();
      s.rig = null;
      s.name = GS.text(this, s.x, 210, '', { color: '#ffffff', origin: [0.5, 0], scale: 2 });
      s.info = [0, 1, 2].map((k) => GS.text(this, s.x, 234 + k * 11, '', { color: k === 2 ? '#ffd84a' : '#e2e4f0', origin: [0.5, 0] }));
      s.arrows = GS.text(this, s.x, 140, '<                    >', { color: '#7d52d6', origin: [0.5, 0.5], scale: 2 });
      s.ctrl = (this.players > 1 ? GS.CONTROLS_TEXT[i === 0 ? 'p1' : 'p2'] : GS.CONTROLS_TEXT.solo).map((l, k) => GS.text(this, s.x, 280 + k * 10, l, { color: '#8a8aa8', origin: [0.5, 0] }));
      s.readyTxt = GS.text(this, s.x, 194, '', { color: '#4fe03c', origin: [0.5, 0] });
      this.slots.push(s);
      this.setHero(s, this.players > 1 ? i : 0);
    }
    this.stageIndex = 1;
    if (this.pickStage) {
      this.stageTxt = GS.text(this, W / 2, 46, '', { color: '#ffd84a', origin: [0.5, 0] });
      this.updateStage();
    }
    this.hint = GS.text(this, W / 2, H - 12, this.players > 1 ? 'ОГОНЬ — ГОТОВ   ESC — НАЗАД' : '← → ВЫБОР   ПРОБЕЛ / ENTER — В БОЙ   ESC — НАЗАД', { color: '#a8acc4', origin: [0.5, 0.5] });
    GS.Music.play('theme');
    this.cameras.main.fadeIn(300, 7, 5, 26);
  }

  updateStage() {
    const names = ['ПОСАДОЧНАЯ СТРАНИЦА', 'ПОПАП-МЕГАПОЛИС', 'ГОНКА ПО CDN', 'СТУДИЯ SUNO', 'ПИЦЦА-ВСЕЛЕННАЯ', 'ПИЦЦА 4 СЫРА (БОСС)', 'ЦЕРКОВЬ СВЯТОГО ПОКОКА', 'АРХИЕПИСКОП (БОСС)', 'ОРБИТАЛЬНЫЙ СКРОЛЛ', 'ЯДРО НЕЙРОСЕТИ (БОСС)'];
    this.stageTxt.setText(`ЭТАП ${this.stageIndex}: ${names[this.stageIndex - 1]}   ↑ ↓`);
  }

  setHero(s, idx) {
    s.pick = (idx + this.heroes.length) % this.heroes.length;
    const hero = this.heroes[s.pick];
    if (s.rig) s.rig.destroy();
    s.rig = new GS.Skeleton(this, s.x, 190, GS.heroRig(hero), hero + '/');
    s.rig.baseScale = 3;
    s.rig.play(this.locked[hero] ? 'idle' : 'proud');
    s.rig.showSlot('gun', false);
    if (this.locked[hero]) s.rig.setTintAll(0x1a1430);
    const cfg = GS.TUNING.heroes[hero];
    s.name.setText(this.locked[hero] ? '???' : cfg.name).setTint(GS.hex(cfg.color));
    const info = this.locked[hero] ? ['ЗАБЛОКИРОВАН', 'НАЙДИ 3 ЗОЛОТЫХ КОШКИ', `ИЛИ ПРОЙДИ ИГРУ  (${GS.Save.catCount()}/3)`] : GS.HERO_INFO[hero];
    s.info.forEach((t, k) => t.setText(info[k] || ''));
    s.stage.clear();
    s.stage.fillStyle(GS.hex(cfg.color), 0.25).fillEllipse(s.x, 191, 110, 14);
    s.stage.lineStyle(1, GS.hex(cfg.color), 0.8).strokeEllipse(s.x, 191, 110, 14);
  }

  back() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('Title');
  }

  start() {
    if (this.leaving) return;
    const heroes = this.slots.map((s) => this.heroes[s.pick]);
    if (heroes.some((h) => this.locked[h])) { GS.Synth.denied(); return; }
    this.leaving = true;
    GS.Synth.menuSelect();
    this.slots.forEach((s) => { s.rig.play('win'); });
    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(300, 7, 5, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => GS.startStage(this, this.stageIndex, { players: this.players, heroes: heroes.length > 1 ? heroes : [heroes[0], 'sanyara'] }));
    });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    const C = this.controls;
    C.update();
    if (C.sys.back) { this.back(); return; }
    if (this.pickStage) {
      const max = GS.Save.data.unlocked;
      if (C.sys.up) { this.stageIndex = Math.max(1, this.stageIndex - 1); this.updateStage(); GS.Synth.menuMove(); }
      if (C.sys.down) { this.stageIndex = Math.min(Math.min(GS.STAGES().length, max), this.stageIndex + 1); this.updateStage(); GS.Synth.menuMove(); }
    }
    this.slots.forEach((s) => {
      const inp = C.read(s.i);
      if (!s.ready && !this.leaving) {
        const l = inp.left && !s.prevL, r = inp.right && !s.prevR;
        if (l || r) { this.setHero(s, s.pick + (r ? 1 : -1)); GS.Synth.menuMove(); }
        if (this.players > 1 && (inp.shoot || inp.jump)) {
          if (this.locked[this.heroes[s.pick]]) GS.Synth.denied();
          else { s.ready = true; s.readyTxt.setText('ГОТОВ!'); GS.Synth.menuSelect(); s.rig.play('win'); }
        }
      } else if (this.players > 1 && inp.special) { s.ready = false; s.readyTxt.setText(''); s.rig.play('proud'); }
      s.prevL = inp.left; s.prevR = inp.right;
      s.arrows.setAlpha(s.ready ? 0.2 : 0.6 + Math.sin(time / 200) * 0.3);
      s.rig.look.x = 1;
      s.rig.tick(dt);
    });
    if (this.players === 1 && (C.sys.confirm || C.read(0).shoot)) this.start();
    if (this.players > 1 && this.slots.every((s) => s.ready)) this.start();
  }
};
