// Пауза поверх уровня.
GS.PauseScene = class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) { this.from = (data && data.from) || 'Level'; }

  create() {
    this.menu = null;
    const W = GS.W, H = GS.H;
    this.add.rectangle(0, 0, W, H, GS.hex('#07051a'), 0.78).setOrigin(0);
    GS.text(this, W / 2, 50, 'ПАУЗА', { color: '#b4ff5a', origin: [0.5, 0.5], scale: 3 });
    GS.text(this, W / 2, 76, GS.util.pick(['НУ ЭТО ПОТОМ', 'ПИЦЦА-БРЕЙК', 'КОФЕ ОСТЫВАЕТ', 'ХРЮЧЕВО ЖДЁТ']), { color: '#a8acc4', origin: [0.5, 0.5] });
    this.controls = new GS.Controls(this, 1);
    this.buildMain();
    const L = GS.level;
    const lines = L && L.players.length > 1 ? [...GS.CONTROLS_TEXT.p1, '', ...GS.CONTROLS_TEXT.p2] : GS.CONTROLS_TEXT.solo;
    lines.forEach((l, i) => GS.text(this, 16, 200 + i * 10, l, { color: '#6a6a88' }));
    GS.text(this, W - 16, H - 16, 'M — ЗВУК ВКЛ/ВЫКЛ', { color: '#6a6a88', origin: [1, 1] });
    this.cool = 0.2;
  }

  buildMain() {
    if (this.menu) this.menu.destroy();
    this.menu = new GS.Menu(this, GS.W / 2, 110, [
      { label: 'ПРОДОЛЖИТЬ', action: () => this.resume() },
      { label: 'С ЧЕКПОИНТА', action: () => { this.resume(); const L = GS.level; if (L) { L.players.forEach((p) => { if (p.alive) p.die(); }); } } },
      { label: 'НАСТРОЙКИ', action: () => { this.menu.destroy(); this.menu = new GS.Menu(this, GS.W / 2, 104, GS.settingsItems(() => this.buildMain()), { gap: 14, controls: this.controls }); } },
      { label: 'В ГЛАВНОЕ МЕНЮ', action: () => this.toTitle() },
    ], { gap: 16, controls: this.controls });
  }

  resume() {
    GS.Music.duck(false);
    this.scene.resume(this.from);
    this.scene.resume('Hud');
    this.scene.stop();
  }

  toTitle() {
    GS.Music.stop(0.2);
    this.scene.stop('Hud');
    this.scene.stop(this.from);
    this.scene.start('Title');
  }

  update(time, delta) {
    this.controls.update();
    this.cool -= delta / 1000;
    if (this.cool <= 0 && this.controls.sys.pause) { this.resume(); return; }
    if (this.controls.sys.mute) GS.Synth.setMuted(!GS.Synth.muted);
    this.menu.update(delta / 1000);
  }
};
