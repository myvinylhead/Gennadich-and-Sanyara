// «Гитар-дуэль» — финал студии SUNO, лайтовый Guitar Hero против Копирайт-бота.
// Ноты — мелодия трека suno (канал chart), время — часы музыки GS.Music.clock(): то, что видно, совпадает с тем,
// что слышно. Интерфейс как у уровня (players / team / stats / def / boss) — HUD, пауза и стикеры работают сами.
GS.RhythmScene = class RhythmScene extends Phaser.Scene {
  constructor() { super('Rhythm'); }

  init(stats) {
    this.levelStats = stats || {};
  }

  create() {
    const S = GS.session, W = GS.W, H = GS.H, D = GS.TUNING.duel;
    GS.level = this;
    this.cfg = D;
    this.stage = this.levelStats.stage || S.stage;
    this.def = { id: 'suno', name: 'ГИТАР-ДУЭЛЬ', subtitle: 'ПРОТИВ КОПИРАЙТ-БОТА', parTime: GS.LEVEL_SUNO.parTime };
    this.stats = { time: 0, kills: 0, coins: 0, coinsTotal: 0, deaths: 0, shots: 0, hits: 0, score: 0, cat: false, pizzas: 0, coffees: 0, ...this.levelStats };
    this.team = 0;
    this.state = 'play';
    this.crowd = D.crowd.start;
    this.combo = 0;
    this.starT = 0;
    this.judged = { perfect: 0, good: 0, miss: 0 };
    this.held = [false, false, false, false];
    this.padPrev = [[], []];
    // Объект сцены переиспользуется между перезапусками дуэли — сбросить всё, что создаётся лениво.
    this.keyTxt = null;
    this.comboTxt = null;
    this.kicked = false;
    this.botHitT = 0;
    this.pausedStep = 0;

    this.controls = new GS.Controls(this, S.players);
    this.fx = new GS.Fx(this);
    this.makeArt();
    this.bg = GS.Backgrounds.create(this, 'suno', H);
    this.buildStage();
    this.buildChart();

    const heroes = S.heroes.slice(0, S.players);
    this.players = heroes.map((hero, i) => ({
      index: i, hero, cfg: GS.TUNING.heroes[hero], hp: 6, maxHp: 6, alive: true, coffeeT: 0, specialCd: 0, shield: false, inMech: null,
      die: () => this.fail('ПЕРЕЗАПУСК ДУЭЛИ'),
    }));
    const notesHp = this.notes.reduce((a, n) => a + (n.claim ? 4 : 2), 0);
    this.boss = { hp: Math.round(notesHp * D.winFrac), maxHp: Math.round(notesHp * D.winFrac), alive: true, phase: 1 };

    this.bindKeys();
    this.scene.launch('Hud', { level: this });
    this.time.delayedCall(400, () => { if (this.hud) this.hud.showBoss(true, 'КОПИРАЙТ-БОТ: ПРАВА НА ТРЕК'); });
    // Сцена перезапускается при провале — обработчики снимаем, чтобы не копились.
    this.events.once('shutdown', () => {
      this.scene.stop('Hud');
      GS.level = null;
      this.input.keyboard.off('keydown', this.onKeyDown, this);
      this.input.keyboard.off('keyup', this.onKeyUp, this);
      this.events.off('resume', this.resumeMusic, this);
      this.game.events.off('hidden', this.onHidden, this);
    });
    this.events.on('resume', this.resumeMusic, this);
    // Вкладку свернули — картинка встала, а звук бы шёл дальше и все ноты ушли бы в промах. Ставим паузу.
    this.game.events.on('hidden', this.onHidden, this);
    GS.Music.play('suno', { restart: true });
    this.cameras.main.fadeIn(400, 7, 5, 26);
  }

  get hud() { return this.scene.get('Hud'); }
  get stickers() { const h = this.hud; return h && h.stickers; }

  // ——— Арт ———
  makeArt() {
    GS.RhythmArt.make(this);
    // Точки крепления реквизита: гитара — за центр корпуса, микрофон — за ручку. Нарисованным листам — свои.
    const pivot = (key, fx, fy) => {
      const src = this.textures.get(key).getSourceImage();
      GS.PARTS[key] = { ox: fx, oy: fy, w: src.width, h: src.height, px: Math.round(src.width * fx), py: Math.round(src.height * fy) };
    };
    if (this.textures.exists('suno/guitar_g')) {
      ['suno/guitar_g', 'suno/guitar_r'].forEach((k) => pivot(k, 0.3, 0.68));
      pivot('suno/mic', 0.3, 0.5);
      return;
    }
    const mk = (key, w, h, fn) => GS.makeTex(this, key, w, h, fn, { outline: true });
    // Неоновая гитара, гриф вверх-вперёд. Точка вращения — центр корпуса.
    [['g', '#4fe03c', '#b4ff5a'], ['r', '#ff5a4a', '#ffc0b0']].forEach(([n, c, l]) => {
      mk('suno/guitar_' + n, 28, 18, (p) => {
        p.ellipse(8, 12, 8, 6, c); p.ellipse(8, 12, 6, 4, '#1a1240'); p.ellipse(5, 10, 2, 2, c); p.circle(9, 12, 1.8, c);
        p.rect(4, 15, 8, 1, l);
        p.line(14, 10, 24, 3, c); p.line(14, 11, 24, 4, l);
        p.rect(23, 0, 4, 4, c);
      });
      GS.PARTS['suno/guitar_' + n] = { ox: 8 / 28, oy: 12 / 18, w: 28, h: 18, px: 8, py: 12 };
    });
    mk('suno/mic', 12, 4, (p) => { p.rect(0, 1, 8, 2, '#3a3a54'); p.rect(8, 0, 4, 4, '#c8c8d8'); p.px(9, 1, '#8a8aa8'); p.px(10, 2, '#8a8aa8'); });
    GS.PARTS['suno/mic'] = { ox: 3 / 12, oy: 0.5, w: 12, h: 4, px: 3, py: 2 };
    // Ударная установка хрючева.
    mk('suno/drums', 48, 28, (p) => {
      p.circle(24, 18, 9, '#2a1a4a'); p.circle(24, 18, 7, '#e8d8ff'); p.rect(20, 17, 9, 2, '#8a4ce0');
      p.rect(6, 14, 10, 6, '#c8c8d8'); p.rect(6, 14, 10, 1, '#ffffff'); p.rect(10, 20, 2, 8, '#5a5a80');
      p.rect(34, 14, 10, 6, '#c8c8d8'); p.rect(34, 14, 10, 1, '#ffffff'); p.rect(38, 20, 2, 8, '#5a5a80');
      p.rect(0, 6, 14, 2, '#ffd84a'); p.rect(6, 8, 2, 20, '#5a5a80'); p.rect(36, 4, 12, 2, '#ffd84a'); p.rect(41, 6, 2, 22, '#5a5a80');
    });
  }

  buildStage() {
    const W = GS.W, H = GS.H;
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x1a1038, 1).fillRect(0, 300, W, 60);
    g.fillStyle(0x4fe03c, 1).fillRect(0, 300, W, 2);
    g.fillStyle(0xb4ff5a, 1).fillRect(0, 300, W, 1);
    this.spots = this.add.graphics().setDepth(0).setBlendMode(Phaser.BlendModes.ADD);
    // Группа: Геннадич поёт, Саняра и Юрич на гитарах. Игроки — обязательно в составе.
    const band = ['gennadich', 'sanyara', 'yurich'].filter((h) => h !== 'yurich' || this.playersHeroes().includes('yurich'));
    this.band = band.map((hero, i) => {
      const r = new GS.Skeleton(this, 60 + i * 64, 300, GS.heroRig(hero), hero + '/');
      r.baseScale = 2;
      r.setDepth(10);
      if (hero === 'gennadich') { r.play('sing'); r.setSlot('gun', '/suno/mic'); } else { r.play('strum'); r.showSlot('gun', false); }
      r.hero = hero;
      return r;
    });
    // Хрючево за барабанами.
    // Барабанщик: нарисованные кадры (сам с установкой) или риг хрючева за установкой.
    this.drawnDrummer = this.textures.exists('suno/drummer0');
    if (this.drawnDrummer) {
      this.drummer = this.add.image(452, 300, 'suno/drummer0').setOrigin(0.5, 1).setScale(2).setDepth(9);
    } else {
      this.drummer = new GS.Skeleton(this, 452, 290, GS.enemyRigs.hryuchevo(), 'pig_pink/');
      this.drummer.baseScale = 2;
      this.drummer.facing = -1;
      this.drummer.setDepth(8);
      this.drummer.play('idle');
      this.drums = this.add.image(452, 300, 'suno/drums').setOrigin(0.5, 1).setScale(2).setDepth(9);
    }
    // Копирайт-бот: большой нарисованный (покой / удар / повержен) или маленький процедурный крупно.
    this.bigBot = this.textures.exists('suno/botbig0');
    this.bot = this.add.image(574, 300, this.bigBot ? 'suno/botbig0' : 'suno/bot0').setOrigin(0.5, 1).setScale(this.bigBot ? 2 : 3).setDepth(10);
    this.botY = this.bot.y;
    this.crowdG = this.add.graphics().setDepth(12);
    this.hwy = this.add.graphics().setDepth(20);
    this.claimIcons = [];
  }

  playersHeroes() { return GS.session.heroes.slice(0, GS.session.players); }

  // ——— Ноты ———
  // Мелодия → 4 дорожки по высоте ноты внутри такта; каждые 4 такта бот вбрасывает «CLAIM».
  buildChart() {
    const D = this.cfg;
    const base = GS.Music.chart('suno');
    const loop = 16 * 16;
    const notes = [];
    for (let off = 0; off < D.chartTo; off += loop) {
      base.forEach((n) => {
        const step = off + n.step;
        if (step < D.chartFrom || step >= D.chartTo) return;
        notes.push({ step, len: n.len, midi: n.midi });
      });
    }
    const byBar = {};
    notes.forEach((n) => { (byBar[Math.floor(n.step / 16)] = byBar[Math.floor(n.step / 16)] || []).push(n); });
    Object.entries(byBar).forEach(([bar, list]) => {
      const lo = Math.min(...list.map((n) => n.midi)), hi = Math.max(...list.map((n) => n.midi));
      list.forEach((n, i) => { n.lane = hi === lo ? 1 + (i % 2) : Math.round((n.midi - lo) / (hi - lo) * 3); });
      if (Number(bar) % 4 === 3) { const n = list[list.length - 1]; n.claim = true; }
    });
    // Прореживание: не чаще одной ноты в minGap шагов — остаются главные ноты мелодии.
    const kept = [];
    notes.forEach((n) => { if (!kept.length || n.step - kept[kept.length - 1].step >= (D.minGap || 1)) kept.push(n); });
    kept.forEach((n) => { n.hold = n.len >= 3; n.hit = false; n.missed = false; n.holding = false; });
    this.notes = kept;
    notes.length = 0; notes.push(...kept);
    this.lastStep = notes.length ? notes[notes.length - 1].step + notes[notes.length - 1].len : D.chartTo;
  }

  // ——— Ввод ———
  // Соло: D F J K или ← ↓ ↑ →. Кооп: P1 — A S (дорожки 1–2), P2 — K L или ← → (дорожки 3–4). Плюс геймпады.
  bindKeys() {
    const solo = GS.session.players === 1;
    this.keyLane = solo
      ? { KeyD: 0, ArrowLeft: 0, KeyF: 1, ArrowDown: 1, KeyJ: 2, ArrowUp: 2, KeyK: 3, ArrowRight: 3 }
      : { KeyA: 0, KeyS: 1, KeyK: 2, ArrowLeft: 2, KeyL: 3, ArrowRight: 3 };
    this.input.keyboard.on('keydown', this.onKeyDown, this);
    this.input.keyboard.on('keyup', this.onKeyUp, this);
  }

  onKeyDown(ev) {
    const lane = this.keyLane[ev.code];
    if (lane === undefined || ev.repeat) return;
    this.press(lane);
  }

  onKeyUp(ev) {
    const lane = this.keyLane[ev.code];
    if (lane !== undefined) this.held[lane] = false;
  }

  pollPads() {
    const solo = GS.session.players === 1;
    for (let i = 0; i < (solo ? 1 : 2); i++) {
      const pad = this.controls.pad(i);
      if (!pad) continue;
      const b = (n) => !!(pad.buttons[n] && pad.buttons[n].pressed);
      const lanes = solo ? [b(14) || b(2), b(13) || b(0), b(12) || b(3), b(15) || b(1)] : [b(14) || b(2), b(15) || b(1)];
      lanes.forEach((on, k) => {
        const lane = solo ? k : i * 2 + k;
        if (on && !this.padPrev[i][k]) this.press(lane);
        if (!on && this.padPrev[i][k]) this.held[lane] = false;
      });
      this.padPrev[i] = lanes;
    }
  }

  now() { const c = GS.Music.clock(); return c && c.track === 'suno' ? c : null; }

  press(lane) {
    if (this.state !== 'play') return;
    const c = this.now();
    if (!c) return;
    this.held[lane] = true;
    const win = this.cfg.good / c.stepDur;
    let best = null, bd = Infinity;
    for (const n of this.notes) {
      if (n.hit || n.missed || n.lane !== lane) continue;
      const d = Math.abs(n.step - c.step);
      if (d < bd) { bd = d; best = n; }
      if (n.step > c.step + win) break;
    }
    if (!best || bd > win) { this.wrong(lane); return; }
    const perfect = bd * c.stepDur <= this.cfg.perfect;
    this.hitNote(best, perfect);
  }

  hitNote(n, perfect) {
    const D = this.cfg;
    n.hit = true;
    if (n.hold) n.holding = true;
    this.combo++;
    this.judged[perfect ? 'perfect' : 'good']++;
    const mult = Math.min(4, 1 + Math.floor(this.combo / 10)) * (this.starT > 0 ? 2 : 1);
    this.stats.score += (perfect ? 100 : 60) * mult;
    this.stats.hits++;
    this.crowdAdd(perfect ? D.crowd.perfect : D.crowd.good);
    this.addTeam(perfect ? 2.5 : 1.5);
    const dmg = (n.claim ? 4 : perfect ? 2 : 1.2) * (this.starT > 0 ? 2 : 1);
    this.boss.hp = Math.max(0, this.boss.hp - dmg);
    const x = this.laneX(n.lane);
    this.fx.sparks(x, 296, perfect ? 6 : 3, perfect ? 0xb4ff5a : 0x8cf2ff);
    this.fx.pop(x, 282, n.claim ? 'CLAIM ОТБИТ!' : perfect ? 'PERFECT!' : 'GOOD', { color: n.claim ? '#ffd84a' : perfect ? '#b4ff5a' : '#8cf2ff', rise: 16, ms: 450 });
    this.botHit();
    if (this.hud) this.hud.setCombo && this.hud.setCombo(this.combo);
    if (this.combo === 25 || this.combo === 60) { if (this.stickers) this.stickers.show('combo'); }
    const r = this.band.find((b) => this.playersHeroes().includes(b.hero)) || this.band[0];
    r.squash(1.05, 0.95);
  }

  wrong(lane) {
    if (!this.cfg.crowd.wrong) return; // лишнее нажатие не наказываем
    this.crowdAdd(this.cfg.crowd.wrong);
    this.fx.pop(this.laneX(lane), 286, 'МИМО', { color: '#ff7ab8', rise: 10, ms: 300 });
  }

  miss(n) {
    const D = this.cfg;
    n.missed = true;
    this.combo = 0;
    this.judged.miss++;
    if (this.hud && this.hud.setCombo) this.hud.setCombo(0);
    this.crowdAdd(n.claim ? D.crowd.claim : D.crowd.miss);
    this.fx.pop(this.laneX(n.lane), 286, n.claim ? 'СТРАЙК!' : 'МИМО', { color: '#ff5a4a', rise: 12, ms: 400 });
    if (n.claim) { GS.Synth.denied(); this.fx.shake(120, 2); }
  }

  crowdAdd(v) {
    this.crowd = GS.util.clamp(this.crowd + v, 0, this.cfg.crowd.max);
    const hp = Math.ceil(this.crowd / this.cfg.crowd.max * 6);
    this.players.forEach((p) => { p.hp = hp; });
    if (this.crowd <= 0 && this.state === 'play') this.fail('ТРЕК ОТКЛОНЁН МОДЕРАЦИЕЙ');
  }

  addTeam(n) {
    const T = GS.TUNING.team;
    const was = this.team;
    this.team = Math.min(T.max, this.team + n);
    if (was < T.max && this.team >= T.max && this.hud) this.hud.banner('ЗВЁЗДНАЯ СИЛА ГОТОВА!', '#b4ff5a', GS.session.players > 1 ? 'R / U — ×2 К ОЧКАМ' : 'V — ×2 К ОЧКАМ');
  }

  botHit() {
    this.botHitT = 0.12;
    if (!this.bigBot) { this.bot.setTintFill(0xffffff); this.time.delayedCall(60, () => this.bot.clearTint()); }
    if (this.boss.hp <= 0 && this.boss.alive) {
      this.boss.alive = false;
      this.fx.burst(this.bot.x, this.bot.y - 40, 30, ['o', 'y', 'w']);
      this.fx.ring(this.bot.x, this.bot.y - 40, { color: 0xffd84a, to: 4, ms: 500 });
      GS.Synth.explosion();
      if (this.hud) this.hud.banner('ПРЕТЕНЗИЯ ОТОЗВАНА!', '#ffd84a', 'ДОИГРАЙ ТРЕК ДО КОНЦА');
      if (this.bigBot) { this.bot.setTexture('suno/botbig_dead'); this.tweens.add({ targets: this.bot, y: this.botY + 4, duration: 400, ease: 'Bounce.out' }); }
      else this.tweens.add({ targets: this.bot, angle: 90, y: this.bot.y + 6, alpha: 0.35, duration: 500, ease: 'Bounce.out' });
    }
  }

  laneX(lane) { return 256 + lane * 32 + 16; }

  // ——— Финал ———
  fail(why) {
    if (this.state !== 'play') return;
    this.state = 'fail';
    GS.Music.stop(0.2);
    GS.Synth.die();
    if (this.hud) this.hud.banner(why, '#ff5a4a', 'ЕЩЁ РАЗ — С НАЧАЛА ТРЕКА');
    this.band.forEach((r) => r.play('hurt', { restart: true }));
    this.time.delayedCall(2600, () => {
      this.cameras.main.fadeOut(300, 7, 5, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ ...this.levelStats, deaths: (this.levelStats.deaths || 0) + 1 }));
    });
  }

  win() {
    if (this.state !== 'play') return;
    this.state = 'won';
    GS.Music.stop(0.6);
    GS.Synth.win();
    this.band.forEach((r) => { r.play('win'); r.showSlot('gun', true); r.setSlot('gun', 'gun'); });
    if (this.stickers) this.stickers.show('win', { force: true });
    if (this.hud) this.hud.banner('ТРЕК В ТОПЕ!', '#b4ff5a', 'КОПИРАЙТ-БОТ ПОВЕРЖЕН');
    this.fx.flash(300, 0xb4ff5a, 0.4);
    const total = this.judged.perfect + this.judged.good + this.judged.miss;
    const accuracy = total ? Math.round((this.judged.perfect + this.judged.good * 0.6) / total * 100) : 0;
    const stats = { ...this.stats, accuracy, stage: this.stage, levelId: 'suno', name: GS.LEVEL_SUNO.name, par: GS.LEVEL_SUNO.parTime, players: this.players.length };
    this.time.delayedCall(2600, () => {
      this.cameras.main.fadeOut(400, 7, 5, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Results', stats));
    });
  }

  // ——— Пауза: музыку останавливаем и потом продолжаем с того же шага, чтобы ноты не разъехались со звуком ———
  openPause() {
    const c = this.now();
    this.pausedStep = c ? c.step : 0;
    GS.Music.stop(0);
    this.scene.pause();
    this.scene.pause('Hud');
    this.scene.launch('Pause', { from: 'Rhythm' });
  }

  onHidden() { if (this.state === 'play' && this.scene.isActive()) this.openPause(); }

  resumeMusic() {
    if (this.state !== 'play') return;
    GS.Music.play('suno', { restart: true, fromStep: Math.max(0, Math.floor(this.pausedStep || 0)) });
  }

  // ——— Цикл ———
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    const C = this.controls;
    C.update();
    if (C.sys.pause && this.state === 'play') { this.openPause(); return; }
    if (C.sys.mute) GS.Synth.setMuted(!GS.Synth.muted);
    this.fx.update(dt);
    this.pollPads();
    if (this.state === 'play') this.stats.time += dt;
    this.starT -= dt;
    for (let i = 0; i < this.players.length; i++) {
      const inp = GS.bot ? GS.bot(i, C.read(i), this) : C.read(i);
      if (inp && inp.super && this.team >= GS.TUNING.team.max && this.state === 'play') {
        this.team = 0;
        this.starT = this.cfg.starTime;
        this.fx.flash(250, 0xd070ff, 0.5);
        GS.Synth.superBlast();
        if (this.hud) this.hud.banner('ЗВЁЗДНАЯ СИЛА!', '#d070ff', '×2 К ОЧКАМ И УРОНУ');
        if (this.stickers) this.stickers.show('super', { force: true });
      }
    }

    const c = this.now();
    const step = c ? c.step : -999;
    if (c && this.state === 'play') {
      const win = this.cfg.good / c.stepDur;
      for (const n of this.notes) {
        if (n.step > step) break;
        if (!n.hit && !n.missed && n.step < step - win) this.miss(n);
        if (n.holding) {
          if (!this.held[n.lane] || step >= n.step + n.len) n.holding = false;
          else { this.stats.score += Math.round(30 * dt * (this.starT > 0 ? 2 : 1) * 10); if (Math.random() < 0.3) this.fx.sparks(this.laneX(n.lane), 296, 1, 0xffd84a); }
        }
      }
      if (step > this.lastStep + 8) { if (this.boss.hp <= 0 || this.cfg.surviveWins) this.win(); else this.fail('ТРЕК ЗАБЛОКИРОВАН: МАЛО ХИТОВ'); }
    }

    this.drawHighway(step, time);
    this.drawCrowd(step);
    this.animateBand(step, dt);
    this.bg.update(this.cameras.main, time);
  }

  animateBand(step, dt) {
    this.band.forEach((r) => r.tick(dt));
    const beatPh = ((step / 4) % 1 + 1) % 1;
    // Барабанщик: присед на каждую долю, на сильную — сильнее.
    const beatN = Math.floor(step / 4);
    if (beatPh < 0.08 && !this.kicked) {
      this.kicked = true;
      if (!this.drawnDrummer) this.drummer.squash(1.18, 0.84);
      if (beatN % 4 === 0) this.fx.sparks(470, 250, 2, 0xffd84a);
    }
    if (beatPh > 0.5) this.kicked = false;
    // Нарисованный барабанщик: удар левой/правой на долю, палочки вверх — между долями.
    if (this.drawnDrummer) this.drummer.setTexture(beatPh < 0.4 ? 'suno/drummer' + (1 + (((beatN % 2) + 2) % 2)) : 'suno/drummer0');
    else this.drummer.tick(dt);
    this.botHitT = (this.botHitT || 0) - dt;
    if (this.boss.alive) {
      if (this.bigBot) this.bot.setTexture(this.botHitT > 0 ? 'suno/botbig_hit' : 'suno/botbig0');
      else this.bot.setTexture('suno/bot' + (beatN % 2 ? 1 : 0));
      this.bot.y = this.botY + Math.round(Math.sin(step / 2) * 2);
    }
    // Прожекторы.
    const g = this.spots;
    g.clear();
    [[120, 0xd070ff], [320, 0x4fe03c], [520, 0x8cf2ff]].forEach(([x, col], i) => {
      const a = Math.sin(step / 16 + i * 2) * 0.5;
      const bx = x + Math.sin(a) * 260;
      g.fillStyle(col, this.starT > 0 ? 0.16 : 0.08).fillTriangle(x, 0, bx - 50, 300, bx + 50, 300);
    });
  }

  drawCrowd(step) {
    const g = this.crowdG;
    g.clear();
    const mood = this.crowd / this.cfg.crowd.max;
    for (let i = 0; i < 28; i++) {
      const x = 8 + i * 23 + (i % 2) * 6;
      const ph = (((step - (i % 2) * 2) / 4) % 1 + 1) % 1;
      const jump = mood > 0.25 ? Math.round(Math.pow(1 - ph, 2) * 5 * mood) : 0;
      const y = 352 - jump - (i % 3) * 3;
      const body = mood > 0.25 ? 0xff9ad0 : 0x8a6a8a;
      g.fillStyle(body, 1).fillCircle(x, y, 8);
      g.fillStyle(body, 1).fillTriangle(x - 7, y - 4, x - 4, y - 11, x - 1, y - 6).fillTriangle(x + 7, y - 4, x + 4, y - 11, x + 1, y - 6);
      g.fillStyle(0xd0609a, 1).fillRect(x - 3, y, 6, 4);
      g.fillStyle(0x1a0c2a, 1).fillRect(x - 4, y - 4, 2, 2).fillRect(x + 2, y - 4, 2, 2);
    }
  }

  drawHighway(step, time) {
    const g = this.hwy;
    const D = this.cfg, px = D.pxPerStep;
    const x0 = 256, w = 128, top = 44, hitY = 296;
    g.clear();
    g.fillStyle(0x0a0618, 0.88).fillRect(x0 - 4, top, w + 8, hitY - top + 22);
    g.fillStyle(this.starT > 0 ? 0xd070ff : 0x4fe03c, 1).fillRect(x0 - 4, top, 2, hitY - top + 22).fillRect(x0 + w + 2, top, 2, hitY - top + 22);
    for (let l = 1; l < 4; l++) g.fillStyle(0x2a1a4a, 1).fillRect(x0 + l * 32, top, 1, hitY - top + 22);
    // Линии долей и тактов едут вниз вместе с нотами.
    const first = Math.ceil(step - 2);
    for (let s = first; s < step + (hitY - top) / px; s++) {
      if (s % 4) continue;
      const y = Math.round(hitY - (s - step) * px);
      if (y < top || y > hitY + 10) continue;
      g.fillStyle(s % 16 ? 0x2a1a4a : 0x5a3a8a, 1).fillRect(x0, y, w, 1);
    }
    const LANE = [0x4fe03c, 0xd070ff, 0x8cf2ff, 0xffd84a];
    // Ноты.
    for (const n of this.notes) {
      const y = Math.round(hitY - (n.step - step) * px);
      const tailY = Math.round(hitY - (n.step + n.len - step) * px);
      if (tailY > hitY + 16) continue;
      if (y < top - 10) break;
      const x = this.laneX(n.lane);
      const col = n.claim ? 0xff5a4a : LANE[n.lane];
      if (n.hold && !n.missed) {
        const ty = Math.max(top, tailY), by = n.holding ? hitY : Math.min(hitY, y);
        if (by > ty) g.fillStyle(col, n.holding ? 0.9 : 0.5).fillRect(x - 3, ty, 6, by - ty);
      }
      if (n.hit) continue;
      if (y > hitY + 16) continue;
      const a = n.missed ? 0.3 : 1;
      g.fillStyle(0x0a0618, a).fillRect(x - 13, y - 5, 26, 10);
      g.fillStyle(col, a).fillRect(x - 12, y - 4, 24, 8);
      g.fillStyle(0xffffff, a * 0.6).fillRect(x - 12, y - 4, 24, 2);
      if (n.claim) { g.fillStyle(0xffffff, a).fillRect(x - 3, y - 2, 6, 1).fillRect(x - 3, y - 2, 1, 4).fillRect(x - 3, y + 1, 6, 1); }
    }
    // Кнопки-лады.
    for (let l = 0; l < 4; l++) {
      const x = this.laneX(l);
      const on = this.held[l];
      g.fillStyle(0x0a0618, 1).fillRect(x - 13, hitY - 6, 26, 12);
      g.lineStyle(2, LANE[l], 1).strokeRect(x - 12, hitY - 5, 24, 10);
      if (on) g.fillStyle(LANE[l], 0.85).fillRect(x - 11, hitY - 4, 22, 8);
    }
    // Подписи клавиш.
    if (!this.keyTxt) {
      const solo = GS.session.players === 1;
      const labels = solo ? ['D ←', 'F ↓', 'J ↑', 'K →'] : ['A', 'S', 'K ←', 'L →'];
      this.keyTxt = labels.map((t, l) => GS.text(this, this.laneX(l), hitY + 9, t, { color: '#a8acc4', origin: [0.5, 0], depth: 21 }));
      this.comboTxt = GS.text(this, x0 + w + 12, top + 4, '', { color: '#ffd84a', origin: [0, 0], depth: 21 });
    }
    const mult = Math.min(4, 1 + Math.floor(this.combo / 10)) * (this.starT > 0 ? 2 : 1);
    this.comboTxt.setText(mult > 1 ? `×${mult}` : '');
  }
};
