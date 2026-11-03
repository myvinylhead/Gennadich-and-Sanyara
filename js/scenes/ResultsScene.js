// Итоги уровня: счётчики с «прокруткой», шуточные метрики, ранг-печать.
GS.ResultsScene = class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  init(stats) {
    this.st = stats;
    this.leaving = false;
    this.stamped = false;
    this.record = false;
  }

  create() {
    const W = GS.W, H = GS.H;
    const st = this.st;
    this.cameras.main.setBackgroundColor('#0b0824');
    this.add.tileSprite(0, 0, W, H, 'bg/stars1').setOrigin(0).setAlpha(0.7);
    this.controls = new GS.Controls(this, 1);
    GS.text(this, W / 2, 18, st.levelId === 'boss' ? 'ОПОССУМ ПОВЕРЖЕН!' : st.levelId === 'space' ? 'ПРОРВАЛИСЬ!' : st.levelId === 'cdn' ? 'ДОСТАВЛЕНО!' : st.levelId === 'suno' ? 'ТРЕК В ТОПЕ!' : st.levelId === 'pizza' ? 'ПИЦЦА-БРЕЙК!' : st.levelId === 'pizzaBoss' ? 'ПИЦЦА ПОВЕРЖЕНА!' : st.levelId === 'church' ? 'ГРЕХИ ОТПУЩЕНЫ!' : st.levelId === 'churchBoss' ? 'КОНТЕКСТ ОЧИЩЕН!' : 'УРОВЕНЬ ПРОЙДЕН!', { color: '#b4ff5a', origin: [0.5, 0], scale: 3 });
    GS.text(this, W / 2, 46, st.name, { color: '#a8acc4', origin: [0.5, 0] });

    // Ранг.
    const coinsPct = st.coinsTotal ? st.coins / st.coinsTotal : 1;
    const par = st.par || 240;
    let rank = 'C';
    if (st.deaths <= 5) rank = 'B';
    if (st.time <= par * 1.4 && st.deaths <= 2) rank = 'A';
    if (st.time <= par && st.deaths === 0 && coinsPct >= 0.75) rank = 'S';
    this.rank = rank;
    const prevBest = GS.Save.data.best[st.levelId];
    GS.Save.recordLevel(st.levelId, st.time, rank, st.stage - 1);
    GS.Save.data.deaths += st.deaths;
    GS.Save.write();
    const s = GS.session.totals;
    s.time += st.time; s.deaths += st.deaths; s.kills += st.kills; s.coins += st.coins;

    const chaos = Math.min(99, 40 + st.kills * 2 + st.deaths * 7);
    const coffee = 100 + st.coffees * 12;
    this.rows = [
      ['ВРЕМЯ', () => GS.util.fmtTime(st.time), st.time],
      ['ХРЮЧЕВА ПОФИКШЕНО', () => `${Math.round(this.v[1])}`, st.kills],
      ['ПОРТАЛ-МОНЕТЫ', () => `${Math.round(this.v[2])} / ${st.coinsTotal}`, st.coins],
      ['РЕФАКТОРИНГОВ (СМЕРТЕЙ)', () => `${Math.round(this.v[3])}`, st.deaths],
      ['ЗОЛОТАЯ КОШКА', () => (st.cat ? 'НАЙДЕНА!' : 'НЕ НАЙДЕНА'), 0],
      ['ХАОС', () => `${Math.round(this.v[5])}%`, chaos],
      ['КОФЕ', () => `${Math.round(this.v[6])}%`, coffee],
      ['ПИЦЦА', () => '∞', 0],
    ];
    if (st.accuracy !== undefined) this.rows.push(['ТОЧНОСТЬ ДУЭЛИ', () => `${Math.round(this.v[7])}%`, st.accuracy]);
    this.v = this.rows.map(() => 0);
    this.texts = this.rows.map((r, i) => {
      const y = 72 + i * 15;
      const a = GS.text(this, 120, y, r[0], { color: '#e2e4f0' }).setAlpha(0);
      const b = GS.text(this, 400, y, '', { color: i === 4 ? (st.cat ? '#ffd84a' : '#6a6a88') : '#ffd84a', origin: [1, 0] }).setAlpha(0);
      return [a, b];
    });
    this.reveal = 0;
    this.t = 0;
    if (prevBest && st.time < prevBest) this.record = true;

    // Герои празднуют.
    this.rigs = GS.session.heroes.slice(0, st.players).map((h, i) => {
      const r = new GS.Skeleton(this, 470 + i * 70, 292, GS.heroRig(h), h + '/');
      r.baseScale = 2;
      r.play('win');
      return r;
    });
    this.rankTxt = GS.text(this, 505, 112, rank, { color: { S: '#ffd84a', A: '#b4ff5a', B: '#8cf2ff', C: '#ff7ab8' }[rank], origin: [0.5, 0.5], scale: 8 }).setAlpha(0);
    this.rankSub = GS.text(this, 260, 200, GS.LINES.ranks[rank], { color: '#e2e4f0', origin: [0.5, 0] }).setAlpha(0);
    this.next = GS.text(this, W / 2, H - 20, 'ПРОБЕЛ / ENTER — ДАЛЬШЕ', { color: '#b4ff5a', origin: [0.5, 0.5] }).setAlpha(0);
    this.stickers = new GS.Stickers(this);
    GS.Music.play('ending');
    this.cameras.main.fadeIn(400, 7, 5, 26);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    this.t += dt;
    this.controls.update();
    const idx = Math.floor(this.t / 0.35);
    while (this.reveal < Math.min(idx, this.rows.length)) {
      const [a, b] = this.texts[this.reveal];
      a.setAlpha(1); b.setAlpha(1);
      GS.Synth.menuMove();
      this.reveal++;
    }
    this.rows.forEach((r, i) => {
      if (i >= this.reveal) return;
      this.v[i] = Math.min(r[2], this.v[i] + Math.max(1, r[2]) * dt * 2.5);
      this.texts[i][1].setText(r[1]());
    });
    if (this.reveal >= this.rows.length && !this.stamped && this.t > this.rows.length * 0.35 + 0.4) {
      this.stamped = true;
      this.rankTxt.setAlpha(1).setScale(16);
      this.tweens.add({ targets: this.rankTxt, scale: 8, angle: -8, duration: 250, ease: 'Quad.in', onComplete: () => { this.cameras.main.shake(200, 0.01); GS.Synth.explosion(); } });
      this.tweens.add({ targets: [this.rankSub, this.next], alpha: 1, delay: 400, duration: 300 });
      if (this.record) GS.text(this, 505, 156, 'НОВЫЙ РЕКОРД!', { color: '#ff7ab8', origin: [0.5, 0.5] });
      this.stickers.show(this.rank === 'S' || this.rank === 'A' ? 'win' : 'respawn', { force: true });
    }
    this.rigs.forEach((r) => r.tick(dt));
    this.stickers.update(dt);
    if (this.stamped && (this.controls.sys.confirm || this.controls.read(0).shoot) && !this.leaving) {
      this.leaving = true;
      const stage = this.st.stage;
      this.cameras.main.fadeOut(400, 7, 5, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (stage >= GS.STAGES().length) this.scene.start('Story', { story: 'ending', next: { scene: 'Ending', data: {} } });
        else GS.startStage(this, stage + 1, {});
      });
    }
  }
};
