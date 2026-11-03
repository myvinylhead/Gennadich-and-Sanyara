// «Студия SUNO»: ритм-платформер. Всё, что живёт в такт, берёт время из GS.beat() — часов музыки.
// Шаг = 1/16 такта, доля = 4 шага.
GS.beat = () => {
  const c = GS.Music.clock();
  if (c) return { step: c.step, stepDur: c.stepDur, beat: c.step / 4 };
  // Музыка не играет — часы по реальному времени в темпе трека SUNO, ритм уровня не встаёт.
  const stepDur = 60 / 132 / 4;
  const step = performance.now() / 1000 / stepDur;
  return { step, stepDur, beat: step / 4 };
};

GS.RhythmArt = {
  // Нарисованные листы (art_refs/suno_*.png → images.js) важнее: процедурный арт — только для того, чего нет.
  make(scene) {
    const mk = (key, w, h, fn, outline = false) => { if (!scene.textures.exists(key)) GS.makeTex(scene, key, w, h, fn, { outline }); };
    // Верх эквалайзер-платформы.
    mk('suno/eq', 32, 6, (p) => {
      p.rect(0, 0, 32, 6, '#1a1240'); p.rect(0, 0, 32, 2, '#4fe03c'); p.rect(0, 0, 32, 1, '#b4ff5a');
      for (let x = 3; x < 32; x += 4) p.rect(x, 2, 1, 4, '#0a0820');
    });
    // Сабвуфер: кабинет и динамик; второй кадр — диффузор «выстрелил».
    [0, 1].forEach((f) => mk('suno/sub' + f, 20, 18, (p) => {
      p.rect(0, 0, 20, 18, '#3c3c58'); p.rect(1, 1, 18, 16, '#1c1c2a');
      p.circle(10, 10, f ? 7 : 6, f ? '#d070ff' : '#8a4ce0'); p.circle(10, 10, f ? 5 : 4, '#2a2a3a'); p.circle(10, 10, 1.5, f ? '#ffffff' : '#5a5a80');
      p.rect(8, 2, 4, 2, '#5a5a80');
    }, true));
    mk('suno/metro', 12, 8, (p) => { p.rect(0, 0, 12, 6, '#3c3c58'); p.rect(1, 1, 10, 4, '#1c1c2a'); p.rect(4, 5, 4, 3, '#ff4ad0'); p.px(5, 6, '#ffffff'); }, true);
    // Нота-монета.
    mk('suno/note', 8, 11, (p) => { p.rect(5, 0, 1, 8, '#b4ff5a'); p.rect(6, 0, 2, 1, '#b4ff5a'); p.rect(7, 1, 1, 2, '#4fe03c'); p.ellipse(3, 8, 3, 2.2, '#4fe03c'); p.px(2, 7, '#b4ff5a'); }, true);
    // Фальшивая нота: кислотная, со злыми глазками.
    [0, 1].forEach((f) => mk('suno/fnote' + f, 12, 14, (p) => {
      p.rect(8, 0, 2, 10, '#ff4ad0'); p.rect(10, 0, 2, 2, '#ff4ad0'); p.rect(10, 2 + f, 2, 2, '#a02a90');
      p.ellipse(5, 10, 5, 3.5, '#ff4ad0'); p.px(3, 9, '#ffffff'); p.px(6, 9, '#ffffff'); p.px(3 + f, 10, '#1a0c2a'); p.px(6 + f, 10, '#1a0c2a');
    }, true));
    // Копирайт-бот: коробка с визором и знаком ©.
    [0, 1].forEach((f) => mk('suno/bot' + f, 20, 24, (p) => {
      p.rect(9, 0, 2, 4, '#8a8aa8'); p.px(9 + f, 0, '#ff5a4a');
      p.rect(3, 4, 14, 8, '#a8acc4'); p.rect(4, 6, 12, 3, '#3a0a1a'); p.rect(5 + f * 5, 7, 5, 1, '#ff5a4a');
      p.rect(2, 13, 16, 9, '#8a8aa8'); p.circle(10, 17, 3.5, '#ff5a4a'); p.circle(10, 17, 2.2, '#8a8aa8'); p.rect(11, 16, 2, 2, '#8a8aa8');
      p.rect(0, 14, 2, 5, '#6a6a88'); p.rect(18, 14, 2, 5, '#6a6a88'); p.rect(5, 22, 3, 2, '#4a4a64'); p.rect(12, 22, 3, 2, '#4a4a64');
    }, true));
    // Мьют-призрак с перечёркнутым динамиком.
    [0, 1].forEach((f) => mk('suno/ghost' + f, 16, 18, (p) => {
      p.ellipse(8, 7, 7, 7, '#e2e4f0'); p.rect(1, 7, 14, 8, '#e2e4f0');
      for (let x = 1; x < 15; x += 4) p.rect(x + (f ? 2 : 0), 15, 2, 2, '#e2e4f0');
      p.rect(4, 6, 2, 3, '#1a0c2a'); p.rect(10, 6, 2, 3, '#1a0c2a');
      p.rect(6, 11, 2, 2, '#5a5a80'); p.rect(8, 10, 1, 4, '#5a5a80'); p.line(5, 9, 11, 14, '#ff5a4a');
    }, true));
    mk('shot/strike', 9, 9, (p) => { p.circle(4.5, 4.5, 4.4, '#ff5a4a'); p.circle(4.5, 4.5, 3, '#3a0a1a'); p.rect(3, 3, 3, 1, '#ffffff'); p.rect(3, 3, 1, 3, '#ffffff'); p.rect(3, 5, 3, 1, '#ffffff'); });
  },
};

// Эквалайзер-платформа: подскакивает на каждую долю и плавно опускается. Сосед — со сдвигом на шаг, выходит волна.
GS.EqPlatform = class EqPlatform {
  constructor(scene, x, y, offset) {
    this.scene = scene;
    this.baseY = y;
    this.offset = offset;
    this.amp = GS.TUNING.suno.eqAmp;
    this.sprite = scene.physics.add.image(x, y, 'suno/eq').setDepth(5);
    const b = this.sprite.body;
    b.setAllowGravity(false).setImmovable(true);
    b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
    this.sprite.owner = this;
    this.gfx = scene.add.graphics().setDepth(4);
    // До пола — столбик эквалайзера.
    this.floorY = y + 16 * 6;
    for (let ty = Math.floor(y / 16) + 1; ty < scene.L.h; ty++) if (scene.L.solid(Math.floor(x / 16), ty) || scene.L.at(Math.floor(x / 16), ty) === 'w') { this.floorY = ty * 16; break; }
  }
  update(dt) {
    const B = GS.beat();
    const s = this.sprite;
    let target = s.y;
    if (!(this.scene.rhythm && this.scene.rhythm.isMuted(s.x, s.y))) {
      const ph = (((B.step - this.offset) / 4) % 1 + 1) % 1;
      // Подъём за первую четверть доли (не рывком — иначе стоящий провалится), спад — остаток доли.
      const env = ph < 0.25 ? Math.sin(ph / 0.25 * Math.PI / 2) : Math.pow(1 - (ph - 0.25) / 0.75, 2);
      target = this.baseY - this.amp * env;
    }
    s.body.setVelocityY((target - s.y) / Math.max(dt, 1 / 120));
    const g = this.gfx;
    g.clear();
    const top = Math.round(s.y + s.height / 2), h = this.floorY - top;
    const cols = [0x4fe03c, 0x4fe03c, 0xb4ff5a, 0xffd84a, 0xff4ad0];
    for (let yy = 0, i = 0; yy < h; yy += 4, i++) {
      const c = cols[Math.min(cols.length - 1, Math.floor((h - yy) / Math.max(1, h) * cols.length))];
      g.fillStyle(c, 0.55).fillRect(Math.round(s.x) - 13, top + yy, 26, 3);
    }
  }
};

// Сабвуфер: на сильную долю такта «бахает» и подбрасывает стоящих на нём. За четыре шага — мигает.
GS.Subwoofer = class Subwoofer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.image(x, y, 'suno/sub0').setOrigin(0.5, 1).setDepth(6);
    this.x = x; this.top = y - this.sprite.height;
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.owner = this;
    scene.staticBlocks.add(this.sprite);
    this.lastBar = Math.floor(GS.beat().step / 16);
    this.flash = 0;
  }
  touch() {}
  update(dt) {
    const B = GS.beat();
    const bar = Math.floor(B.step / 16), pos = B.step - bar * 16;
    this.flash -= dt;
    const charge = pos >= 12 && Math.floor(pos) % 2 === 0;
    this.sprite.setTexture(this.flash > 0 ? 'suno/sub1' : 'suno/sub0');
    if (charge) this.sprite.setTint(0xffb0f0); else this.sprite.clearTint();
    if (bar !== this.lastBar) {
      this.lastBar = bar;
      if (pos < 2) this.thump();
    }
  }
  thump() {
    const sc = this.scene;
    this.flash = 0.12;
    if (sc.cameras.main.worldView.contains(this.x, this.top)) { sc.fx.ring(this.x, this.top + 6, { color: 0xd070ff, to: 1.6, ms: 220 }); GS.Synth.stomp(); }
    sc.players.forEach((p) => {
      if (!p.alive || p.bubbleState || p.inMech) return;
      const b = p.body;
      if (Math.abs(b.center.x - this.x) < 13 && Math.abs(b.bottom - this.top) < 5) p.launch(GS.TUNING.suno.subVelocity);
    });
  }
};

// Лазер-метроном: луч на 2-ю и 4-ю доли (нечётные по счёту лазеры — на 1-ю и 3-ю), перед лучом мигает.
GS.MetroLaser = class MetroLaser {
  constructor(scene, x, y, odd) {
    this.scene = scene;
    this.x = x; this.bottom = y;
    this.beats = odd ? [0, 2] : [1, 3];
    let top = y - 16 * 12;
    // Луч — от пола до ближайшего потолка или полки над лазером.
    for (let ty = Math.floor(y / 16) - 1; ty > Math.floor(y / 16) - 13; ty--) {
      if (scene.L.solid(Math.floor(x / 16), ty) || scene.L.at(Math.floor(x / 16), ty) === '=') { top = (ty + 1) * 16; break; }
    }
    this.top = top;
    this.emit = scene.add.image(x, top + 4, 'suno/metro').setDepth(6);
    this.gfx = scene.add.graphics().setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    this.was = false;
  }
  update() {
    const B = GS.beat();
    const beatIn = ((Math.floor(B.beat) % 4) + 4) % 4, frac = B.beat - Math.floor(B.beat);
    const on = this.beats.includes(beatIn) && frac < 0.7;
    const warn = !on && this.beats.includes((beatIn + 1) % 4) && frac >= 0.55;
    const g = this.gfx;
    g.clear();
    const h = this.bottom - this.top - 8;
    if (warn && Math.floor(frac * 20) % 2) g.fillStyle(0xff4ad0, 0.5).fillRect(this.x, this.top + 8, 1, h);
    if (on) {
      g.fillStyle(0xff4ad0, 0.25).fillRect(this.x - 4, this.top + 8, 9, h);
      g.fillStyle(0xff9af0, 0.9).fillRect(this.x - 1, this.top + 8, 3, h);
      this.scene.players.forEach((p) => {
        if (!p.alive || p.bubbleState || !p.canBeHit) return;
        const b = p.body;
        if (Math.abs(b.center.x - this.x) < 7 && b.bottom > this.top + 8 && b.top < this.bottom) p.hurt(1, this.x);
      });
      if (!this.was && this.scene.cameras.main.worldView.contains(this.x, this.bottom - 20)) GS.Synth.laser();
    }
    this.was = on;
  }
};

// Режиссёр уровня: зоны мьют-призраков глушат музыку и замораживают эквалайзеры.
GS.RhythmDirector = class RhythmDirector {
  constructor(scene) { this.scene = scene; this.muted = false; }
  isMuted(x, y) {
    return this.scene.enemies.some((e) => e instanceof GS.MuteGhost && e.alive && Math.hypot(e.center.x - x, e.center.y - y) < e.cfg.r);
  }
  update() {
    const m = this.scene.players.some((p) => p.alive && !p.bubbleState && this.isMuted(p.center.x, p.center.y));
    if (m !== this.muted) { this.muted = m; GS.Music.duck(m); }
  }
  release() { if (this.muted) GS.Music.duck(false); this.muted = false; }
};

// ——— Враги студии ———

// Фальшивая нота: перескакивает на «и» — мимо долей, иногда плюётся глитчем.
GS.FalseNote = class FalseNote extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.falseNote;
    const view = scene.add.image(x, y, 'suno/fnote0').setDepth(20);
    super(scene, x, y, cfg, { w: 12, h: 14, gravity: false, view });
    this.home = { x, y: y - 7 };
    this.target = { ...this.home };
    this.lastHalf = Math.floor(GS.beat().step / 2);
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); if (this.view.active) this.view.setTintFill(0xffffff); return r; }
  onDeath() {
    const c = this.center;
    GS.Synth.bug();
    this.scene.fx.burst(c.x, c.y, 8, ['p', 'v']);
    this.scene.fx.pop(c.x, c.y - 8, GS.util.pick(GS.LINES.enemy.falseNote), { color: '#ff9af0' });
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const B = GS.beat();
    const half = Math.floor(B.step / 2);
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (half !== this.lastHalf) {
      this.lastHalf = half;
      if (half % 2 === 1) {
        if (p) { this.home.x += GS.util.clamp(p.center.x - this.home.x, -30, 30); this.home.y += GS.util.clamp(p.center.y - 40 - this.home.y, -12, 12); }
        this.target = { x: this.home.x + GS.util.rand(-34, 34), y: this.home.y + GS.util.rand(-18, 18) };
      }
      if (p && half % 8 === 5) {
        const dx = p.center.x - this.center.x, dy = p.center.y - this.center.y, d = Math.hypot(dx, dy) || 1;
        this.scene.shots.fireEnemy('glitch', this.center.x, this.center.y, dx / d * this.cfg.shotSpeed, dy / d * this.cfg.shotSpeed);
        GS.Synth.glitch();
      }
    }
    const b = this.sprite.body;
    b.setVelocity((this.target.x - b.center.x) * 9, (this.target.y - b.center.y) * 9);
    this.view.setPosition(Math.round(b.center.x), Math.round(b.center.y)).setTexture('suno/fnote' + (Math.floor(B.beat) % 2)).setFlipX(b.velocity.x < 0);
    if (this.flashT <= 0) this.view.clearTint();
    if (p) this.chat(GS.LINES.enemy.falseNote, 0.005);
  }
};

// Автотюн-хрючево: повторяет движения ближайшего героя с опозданием на такт.
GS.AutotuneHog = class AutotuneHog extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.autotune;
    // Есть нарисованные кадры (наушники, зигзаг высоты) — спрайт, иначе риг хрючева.
    const drawn = scene.textures.exists('suno/autotune0');
    const rig = drawn ? null : new GS.Skeleton(scene, x, y, GS.enemyRigs.hryuchevo(), 'pig_lilac/');
    const view = drawn ? scene.add.image(x, y, 'suno/autotune0').setOrigin(0.5, 1).setDepth(20) : null;
    super(scene, x, y, cfg, { w: 18, h: 22, rig, view });
    this.tape = [];
    this.prevVy = 0;
    if (rig) rig.play('idle');
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); if (!this.rig && this.view.active) this.view.setTintFill(0xffffff); return r; }
  play(clip) { if (this.rig) this.rig.play(clip); }
  syncView(dt, ground) {
    if (this.rig) { this.syncRig(dt); return; }
    const b = this.sprite.body;
    const f = this.flashT > 0 ? 3 : !ground ? 2 : Math.floor(GS.beat().beat) % 2;
    this.view.setPosition(Math.round(b.center.x), Math.round(b.bottom)).setTexture('suno/autotune' + f).setFlipX(this.facing < 0);
    if (this.flashT <= 0) this.view.clearTint();
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const ground = b.blocked.down || b.touching.down;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    const lag = 16 * GS.beat().stepDur;
    if (p && p.body) {
      const vy = p.body.velocity.y;
      this.tape.push({ t: this.t, vx: p.body.velocity.x, jump: vy < -150 && this.prevVy >= -150 });
      this.prevVy = vy;
    } else this.tape.length = 0;
    let vx = null;
    while (this.tape.length && this.tape[0].t < this.t - lag) {
      const e = this.tape.shift();
      vx = e.vx;
      if (e.jump && ground) { b.velocity.y = -this.cfg.jumpV; this.play('air'); GS.Synth.hryuk(1.6); }
    }
    if (vx !== null) {
      // Эхо движения плюс лёгкое притяжение к оригиналу, чтобы не убежать за кадр.
      const pull = p ? GS.util.clamp((p.center.x - this.center.x) * 0.6, -50, 50) : 0;
      b.velocity.x = GS.util.clamp(vx * 0.9 + pull, -this.cfg.speed, this.cfg.speed);
    } else if (ground) b.velocity.x *= 0.85;
    if (Math.abs(b.velocity.x) > 8) this.facing = b.velocity.x < 0 ? -1 : 1;
    if (ground && b.velocity.y >= 0) this.play('idle');
    this.lookAtPlayer(p);
    if (p) this.chat(GS.LINES.enemy.autotune, 0.01);
    this.syncView(dt, ground);
  }
};

// Копирайт-бот: висит в воздухе и раз в такт стреляет «страйком». Три страйка — минус жизнь.
GS.CopyrightBot = class CopyrightBot extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.copyright;
    const view = scene.add.image(x, y, 'suno/bot0').setDepth(20);
    super(scene, x, y, cfg, { w: 18, h: 22, gravity: false, view });
    this.home = { x, y: y - 40 };
    this.lastBar = Math.floor(GS.beat().step / 16);
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); if (this.view.active) this.view.setTintFill(0xffffff); return r; }
  onDeath() {
    const c = this.center;
    this.scene.shots.explode(c.x, c.y, 0, 0);
    this.scene.fx.pop(c.x, c.y - 10, 'ПРЕТЕНЗИЯ ОТОЗВАНА', { color: '#b4ff5a' });
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const B = GS.beat();
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (p) this.home.x += GS.util.clamp(p.center.x - this.facing * 80 - this.home.x, -this.cfg.speed * dt, this.cfg.speed * dt);
    if (p) this.facing = p.center.x < this.center.x ? -1 : 1;
    const b = this.sprite.body;
    const ty = this.home.y + Math.sin(this.t * 2) * 6;
    b.setVelocity((this.home.x - b.center.x) * 3, (ty - b.center.y) * 3);
    const bar = Math.floor(B.step / 16);
    if (bar !== this.lastBar) {
      this.lastBar = bar;
      if (p) {
        const dx = p.center.x - this.center.x, dy = p.center.y - this.center.y, d = Math.hypot(dx, dy) || 1;
        this.scene.shots.fireEnemy('strike', this.center.x, this.center.y + 4, dx / d * this.cfg.shotSpeed, dy / d * this.cfg.shotSpeed);
        GS.Synth.denied();
        this.shootT = 0.3;
        this.chat(GS.LINES.enemy.copyright, 0.4);
      }
    }
    this.shootT = (this.shootT || 0) - dt;
    const has = (k) => this.scene.textures.exists(k);
    const frame = this.flashT > 0 && has('suno/bot_hurt') ? 'suno/bot_hurt' : this.shootT > 0 && has('suno/bot_shoot') ? 'suno/bot_shoot' : 'suno/bot' + (Math.floor(B.beat) % 2);
    this.view.setPosition(Math.round(b.center.x), Math.round(b.bottom)).setOrigin(0.5, 1).setTexture(frame).setFlipX(this.facing < 0);
    if (this.flashT <= 0) this.view.clearTint();
  }
};

// Мьют-призрак: медленно плывёт к героям, в его круге музыка глохнет, эквалайзеры замирают.
GS.MuteGhost = class MuteGhost extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.mute;
    const view = scene.add.image(x, y, 'suno/ghost0').setDepth(20).setAlpha(0.85);
    super(scene, x, y, cfg, { w: 14, h: 16, gravity: false, view });
    this.home = { x, y: y - 8 };
    this.zone = scene.add.graphics().setDepth(19);
    this.extra = [this.zone];
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); if (this.view.active) this.view.setTintFill(0xffffff); return r; }
  onDeath() {
    const c = this.center;
    GS.Synth.portal();
    this.scene.fx.burst(c.x, c.y, 10, ['w', 'c']);
    this.scene.fx.pop(c.x, c.y - 8, 'ЗВУК ВЕРНУЛСЯ!', { color: '#8cf2ff' });
    this.zone.clear();
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (p) { this.home.x += GS.util.clamp(p.center.x - this.home.x, -this.cfg.speed * dt, this.cfg.speed * dt); }
    const b = this.sprite.body;
    b.setVelocity((this.home.x - b.center.x) * 2, (this.home.y + Math.sin(this.t * 1.6) * 8 - b.center.y) * 2);
    this.view.setPosition(Math.round(b.center.x), Math.round(b.center.y)).setTexture('suno/ghost' + (Math.floor(this.t * 3) % 2));
    if (this.flashT <= 0) this.view.clearTint();
    const g = this.zone;
    g.clear();
    const r = this.cfg.r;
    for (let a = 0; a < 32; a++) {
      if (a % 2) continue;
      const t = a / 32 * Math.PI * 2 + this.t * 0.4;
      g.fillStyle(0xa8acc4, 0.35).fillRect(Math.round(b.center.x + Math.cos(t) * r), Math.round(b.center.y + Math.sin(t) * r), 2, 2);
    }
    if (p) this.chat(GS.LINES.enemy.mute, 0.006);
  }
};
