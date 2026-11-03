// Враги нейропланеты. Физика — невидимый спрайт, внешний вид — скелетный риг (или спрайты).
GS.Enemy = class Enemy {
  constructor(scene, x, y, cfg, { w, h, gravity = true, rig = null, view = null, scale = 1 }) {
    this.scene = scene;
    this.cfg = cfg;
    this.hp = cfg.hp * (scene.players.length > 1 ? 1.3 : 1);
    this.maxHp = this.hp;
    this.alive = true;
    this.harmful = true;
    this.contact = 1;
    this.sprite = scene.physics.add.sprite(x, y - h / 2, 'px').setVisible(false);
    this.sprite.body.setSize(w, h);
    this.sprite.body.setAllowGravity(gravity);
    this.sprite.body.setMaxVelocityY(GS.TUNING.maxFall);
    this.sprite.enemy = this;
    this.rig = rig;
    this.view = view || rig;
    if (this.rig) { this.rig.setDepth(20); this.rig.baseScale = scale; }
    this.flashT = 0;
    this.voice = GS.util.rand(0.5, 0.7);
    this.talkCool = GS.util.rand(2, 6);
    this.facing = -1;
    this.t = Math.random() * 10;
  }

  get center() { return this.sprite.body.center; }
  headPoint() { const b = this.sprite.body; return { x: b.center.x, y: b.top - 4 }; }

  hit(dmg, fromX = null, src = null) {
    if (!this.alive) return false;
    // Гимн хора — вдвое меньше урона; скилл DIAGNOSE — в полтора раза больше.
    if (this.buffT > 0) dmg *= 0.5;
    if (this.scene.diagnoseT > 0) dmg *= 1.5;
    this.hp -= dmg;
    this.flashT = 0.06;
    if (this.rig) this.rig.setTintAll(0xffffff);
    this.onHit(dmg, fromX, src);
    this.scene.addTeam(GS.TUNING.team.perHit * 0.5);
    if (this.hp <= 0) this.die(fromX, src);
    else GS.Synth.hit();
    return true;
  }

  onHit() { if (this.rig && this.rig.clips.hurt) this.rig.play('hurt', { restart: true }); }

  die(fromX) {
    if (!this.alive) return;
    this.alive = false;
    this.sprite.body.enable = false;
    this.scene.onEnemyKilled(this);
    this.onDeath(fromX);
  }

  onDeath() {
    const c = this.center;
    GS.Synth.squeal();
    GS.Synth.splat();
    this.scene.fx.goo(c.x, c.y, 10);
    this.scene.fx.burst(c.x, c.y, 10, ['p', 'w']);
    this.scene.fx.ring(c.x, c.y, { color: 0xff7ab8, to: 1.4, ms: 220 });
    this.scene.fx.pop(c.x, c.y - 10, GS.util.pick(GS.LINES.enemy.death), { color: '#ffa8cf' });
    this.scene.fx.hitstop(30);
    this.vanish();
  }

  vanish() {
    const v = this.view;
    if (!v) { this.destroy(); return; }
    if (this.rig) this.rig.setTintAll(null);
    if (this.rig) {
      // Скелет сам пересчитывает масштаб каждый кадр — сплющиваем через squash.
      this.dying = true;
      this.scene.tweens.add({ targets: this.rig, squashX: 1.7, squashY: 0.15, alpha: 0, duration: 200, ease: 'Quad.in', onUpdate: () => this.rig.tick(0), onComplete: () => this.destroy() });
      return;
    }
    this.scene.tweens.add({
      targets: v, scaleX: v.scaleX * 1.6, scaleY: v.scaleY * 0.2, alpha: 0, duration: 200, ease: 'Quad.in',
      onComplete: () => this.destroy(),
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.view) this.view.destroy();
    this.sprite.destroy();
    if (this.extra) this.extra.forEach((o) => o.destroy());
  }

  baseUpdate(dt) {
    this.t += dt;
    if (this.buffT > 0) this.buffT -= dt;
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0 && this.rig) this.rig.setTintAll(null); }
    this.talkCool -= dt;
  }

  // Реплика в пузыре — изредка и только на экране.
  chat(pool, chance = 1) {
    if (this.talkCool > 0 || Math.random() > chance) return;
    if (!this.scene.cameras.main.worldView.contains(this.center.x, this.center.y)) return;
    this.talkCool = GS.util.rand(5, 10);
    this.scene.chatter.say(this, GS.util.pick(pool), { weak: true, time: 1.4 });
  }

  syncRig(dt) {
    if (!this.rig) return;
    const b = this.sprite.body;
    this.rig.x = Math.round(b.center.x);
    this.rig.y = Math.round(b.bottom);
    this.rig.facing = this.facing;
    this.rig.tick(dt);
  }

  lookAtPlayer(p) {
    if (!this.rig || !p) return;
    const dx = (p.center.x - this.center.x) * this.facing, dy = p.center.y - this.center.y;
    const d = Math.hypot(dx, dy) || 1;
    this.rig.look.x = dx / d * 1.4; this.rig.look.y = dy / d * 1.4;
  }

  update(dt) { this.baseUpdate(dt); this.syncRig(dt); }
};

// ——— Нейрохрючево-прыгун ———
GS.Hopper = class Hopper extends GS.Enemy {
  constructor(scene, x, y, opts = {}) {
    const cfg = opts.cfg || GS.TUNING.enemies.hopper;
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.hryuchevo(), 'pig_pink/');
    super(scene, x, y, cfg, { w: 18 * (opts.scale || 1), h: 22 * (opts.scale || 1), rig, scale: opts.scale || 1 });
    this.state = 'idle';
    this.stateT = GS.util.rand(0.3, cfg.hopEvery);
    this.homeX = x;
    rig.play('idle');
  }

  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const ground = b.blocked.down || b.touching.down;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (p && ground) this.facing = p.center.x < this.center.x ? -1 : 1;
    this.lookAtPlayer(p);
    this.stateT -= dt;
    switch (this.state) {
      case 'idle':
        if (ground) b.velocity.x *= 0.8;
        this.rig.play('idle');
        if (this.stateT <= 0 && ground) {
          this.state = 'crouch'; this.stateT = 0.22;
          this.rig.play('crouch', { restart: true });
          if (!p) this.facing = Math.abs(this.center.x - this.homeX) > 40 ? (this.center.x > this.homeX ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
        }
        if (p) this.chat(GS.LINES.enemy.hryuk, 0.02);
        break;
      case 'crouch':
        if (this.stateT <= 0) {
          this.state = 'air';
          const mul = p ? 1 : 0.5;
          b.setVelocity(this.facing * this.cfg.hopVX * mul * GS.util.rand(0.8, 1.2), -this.cfg.hopVY * (p ? GS.util.rand(0.9, 1.15) : 0.7));
          this.rig.play('air');
          this.rig.squash(0.8, 1.25);
          if (Math.random() < 0.3) GS.Synth.hryuk();
        }
        break;
      case 'air':
        if (ground && b.velocity.y >= 0) {
          this.state = 'idle';
          this.stateT = this.cfg.hopEvery * GS.util.rand(0.7, 1.3) * (p ? 1 : 1.8);
          this.rig.squash(1.3, 0.75);
          this.scene.fx.puff(this.center.x, b.bottom, 3, 0xffa8cf);
          b.velocity.x = 0;
        }
        break;
      default: break;
    }
    if (b.blocked.left || b.blocked.right) this.facing *= -1;
    this.syncRig(dt);
  }
};

// ——— Летучее хрючево ———
GS.Flyer = class Flyer extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.flyer;
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.flyer(), 'pig_lilac/');
    super(scene, x, y, cfg, { w: 18, h: 18, gravity: false, rig });
    this.homeX = x; this.homeY = y - 9;
    this.fireT = cfg.fireEvery * GS.util.rand(0.6, 1.2);
    rig.play('fly');
  }
  update(dt) {
    this.baseUpdate(dt);
    const cfg = this.cfg;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, cfg.aggro);
    if (p) {
      this.facing = p.center.x < this.center.x ? -1 : 1;
      const want = GS.util.clamp(p.center.x - this.facing * 70, this.homeX - 120, this.homeX + 120);
      this.homeX += GS.util.clamp(want - this.homeX, -cfg.speed * dt, cfg.speed * dt);
    }
    this.lookAtPlayer(p);
    const tx = this.homeX + Math.sin(this.t * 1.3) * 22;
    const ty = this.homeY + Math.sin(this.t * 2.1) * 12;
    const b = this.sprite.body;
    b.setVelocity((tx - b.center.x) * 4, (ty - b.center.y) * 4);
    if (p) {
      this.fireT -= dt;
      if (this.fireT < 0.4) this.rig.squash(1 + Math.random() * 0.1, 1 - Math.random() * 0.1);
      if (this.fireT <= 0) {
        this.fireT = cfg.fireEvery;
        const dx = p.center.x - this.center.x, dy = p.center.y - this.center.y;
        const d = Math.hypot(dx, dy) || 1;
        this.scene.shots.fireEnemy('slime', this.center.x, this.center.y + 4, dx / d * cfg.shotSpeed, dy / d * cfg.shotSpeed);
        GS.Synth.hryuk(1.4);
        this.rig.squash(1.25, 0.8);
      }
      this.chat(GS.LINES.enemy.hryuk, 0.01);
    }
    this.syncRig(dt);
  }
};

// ——— Хрючево с гранатомётом ———
GS.Grenadier = class Grenadier extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.grenadier;
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.grenadier(), 'pig_dark/');
    super(scene, x, y, cfg, { w: 20, h: 20, rig });
    this.fireT = cfg.fireEvery * GS.util.rand(0.5, 1);
    rig.play('aim');
  }
  update(dt) {
    this.baseUpdate(dt);
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    this.sprite.body.velocity.x *= 0.8;
    if (p) {
      this.facing = p.center.x < this.center.x ? -1 : 1;
      this.lookAtPlayer(p);
      // Ствол смотрит вверх-вперёд по баллистике.
      this.rig.worldRot.launcher = -Math.PI / 2 - 0.6 + Math.sin(this.t * 2) * 0.05;
      this.fireT -= dt;
      if (this.fireT < 0.5) { this.rig.squash(1.08, 0.94); if (Math.floor(this.fireT * 10) % 2) this.rig.setTintAll(0xffd0a0); else this.rig.setTintAll(null); }
      if (this.fireT <= 0) {
        this.fireT = this.cfg.fireEvery;
        this.rig.setTintAll(null);
        const mz = this.rig.boneWorld('launcher', 0, 12);
        const dx = p.center.x - mz.x;
        const tFlight = GS.util.clamp(Math.abs(dx) / 150, 0.6, 1.4);
        const vx = dx / tFlight;
        const vy = (p.center.y - mz.y - 0.5 * GS.TUNING.gravity * tFlight * tFlight) / tFlight;
        this.scene.shots.fireEnemy('grenade', mz.x, mz.y, vx, vy);
        this.scene.fx.smoke(mz.x, mz.y, 3);
        GS.Synth.mechShot();
        this.rig.squash(1.2, 0.85);
        this.chat(['ХРЮК-БАБАХ!', 'ЛОВИ ГРАНАТУ!', 'ХРЮ-ХРЮ, ОГОНЬ!'], 0.4);
      }
    } else this.rig.worldRot.launcher = null;
    this.syncRig(dt);
  }
};

// ——— Баг ———
GS.Bug = class Bug extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.bug;
    const view = scene.add.container(x, y).setDepth(20);
    super(scene, x, y, cfg, { w: 12, h: 12, view });
    this.legs = scene.add.graphics();
    this.body = scene.add.image(0, -4, 'bug/body0');
    view.add([this.legs, this.body]);
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.contact = 1;
  }
  hit(dmg, fromX, src) {
    const r = super.hit(dmg, fromX, src);
    if (this.body.active) this.body.setTintFill(0xffffff);
    return r;
  }
  onDeath() {
    const c = this.center;
    GS.Synth.bug();
    this.scene.fx.burst(c.x, c.y, 8, ['g', 'c', 'v']);
    this.scene.fx.pop(c.x, c.y - 6, GS.util.pick(GS.LINES.enemy.bug), { color: '#8cf2ff' });
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const sc = this.scene;
    const ground = b.blocked.down;
    if (ground) {
      const aheadX = this.facing > 0 ? b.right + 2 : b.left - 2;
      if (b.blocked.left || b.blocked.right || !sc.isSolidAt(aheadX, b.bottom + 3) || sc.isHazardAt(aheadX, b.bottom - 2)) this.facing *= -1;
      b.velocity.x = this.facing * this.cfg.speed;
    }
    this.view.setPosition(Math.round(b.center.x), Math.round(b.bottom));
    this.view.scaleX = this.facing;
    this.body.setTexture('bug/body' + (Math.floor(this.t * 8) % 2));
    if (this.flashT <= 0) this.body.clearTint();
    // Шесть дрыгающихся лапок.
    const g = this.legs;
    g.clear();
    g.fillStyle(GS.hex(GS.PAL.ink), 1);
    for (let i = 0; i < 3; i++) {
      const ph = Math.sin(this.t * 30 + i * 2);
      const x = -3 + i * 3;
      g.fillRect(x + Math.round(ph), -1, 1, 1);
      g.fillRect(x + Math.round(ph * 1.5), 0, 1, 1);
    }
    if (Math.random() < 0.01) this.scene.fx.burst(b.center.x, b.center.y, 1, ['g']);
  }
};

// ——— Спящее хрючево ———
GS.Sleeper = class Sleeper extends GS.Hopper {
  constructor(scene, x, y) {
    super(scene, x, y, { cfg: { ...GS.TUNING.enemies.hopper, ...GS.TUNING.enemies.sleeper, hopVX: 90, hopVY: 260, hopEvery: 1.2, aggro: 300 }, scale: 2 });
    this.asleep = true;
    this.near = 0;
    this.zT = 0;
    this.contact = 2;
    this.rig.play('sleep');
    this.passed = false;
    this.voice = 0.4;
  }
  wake() {
    if (!this.asleep) return;
    this.asleep = false;
    this.state = 'idle';
    this.stateT = 0.8;
    this.rig.play('scream', { restart: true });
    GS.Synth.roar();
    this.scene.fx.shake(300, 3);
    this.scene.chatter.say(this, GS.util.pick(GS.LINES.enemy.sleeperWake), { priority: true });
  }
  hit(dmg, fromX, src) { this.wake(); return super.hit(dmg, fromX, src); }
  update(dt) {
    if (!this.asleep) { super.update(dt); return; }
    this.baseUpdate(dt);
    this.zT -= dt;
    if (this.zT <= 0) { this.zT = 0.9; this.scene.fx.zzz(this.center.x + 10, this.center.y - 20); }
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.wakeRange);
    this.near = p ? this.near + dt : Math.max(0, this.near - dt);
    if (this.near > 0.3) this.rig.squash(1 + Math.random() * 0.06, 1);
    if (this.near > this.cfg.wakeTime) this.wake();
    // Прокрался мимо — респект.
    if (!this.passed && this.scene.players.some((pl) => pl.alive && Math.abs(pl.center.x - this.center.x) > 90 && (pl.center.x - this.center.x) * this.scene.levelDir > 0 && Math.abs(pl.center.y - this.center.y) < 60)) {
      this.passed = true;
      this.scene.fx.pop(this.center.x, this.center.y - 40, 'ТИХО КАК ОПОССУМ +500', { color: '#b4ff5a' });
      this.scene.addScore(500);
      if (this.scene.stickers) this.scene.stickers.show('sleeper');
    }
    this.syncRig(dt);
  }
};

// ——— Попап-монстр ———
GS.Popup = class Popup extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.popup;
    const [title, text] = GS.util.pick(GS.LINES.popups);
    const key = `popup_${Math.round(x)}_${Math.round(y)}`;
    const size = GS.EnemyArt.popupWindow(scene, key, title, text);
    const view = scene.add.container(x, y).setDepth(22);
    super(scene, x, y, cfg, { w: size.w - 4, h: size.h - 4, gravity: false, view });
    this.win = scene.add.image(0, 0, key);
    this.eyes = scene.add.graphics();
    view.add([this.win, this.eyes]);
    this.size = size;
    this.homeX = x; this.homeY = y - size.h / 2;
    this.fireT = cfg.fireEvery * GS.util.rand(0.5, 1);
    this.appeared = false;
    view.setScale(0);
    view.setVisible(false);
    this.sprite.body.enable = false;
    this.contact = 1;
    this.blink = 0;
  }
  appear() {
    if (this.appeared) return;
    this.appeared = true;
    this.view.setVisible(true);
    this.sprite.body.enable = true;
    this.scene.tweens.add({ targets: this.view, scale: 1, duration: 260, ease: 'Back.out' });
    GS.Synth.popupOpen();
  }
  // Попадание по кнопке [X] закрывает окно сразу.
  hit(dmg, fromX, src) {
    if (!this.alive || !this.appeared) return false;
    const b = this.sprite.body;
    if (src && src.x > b.right - 16 && src.y < b.top + 14) {
      this.scene.fx.pop(b.right - 6, b.top - 2, 'ЗАКРЫТО!', { color: '#ff5a4a' });
      this.hp = 0;
      return super.hit(0.01, fromX, src);
    }
    if (Math.random() < 0.15) this.scene.fx.pop(this.center.x, b.top - 2, 'БЕЙ ПО [X]!', { color: '#ffd84a' });
    return super.hit(dmg, fromX, src);
  }
  onHit() { this.win.setTintFill(0xffffff); this.scene.time.delayedCall(50, () => this.win.active && this.win.clearTint()); this.view.x += GS.util.rand(-2, 2); }
  onDeath() {
    const c = this.center;
    GS.Synth.popupClose();
    this.scene.fx.burst(c.x, c.y, 14, ['w', 'c', 'v']);
    this.scene.fx.ring(c.x, c.y, { color: 0x8cf2ff, to: 1.6 });
    this.scene.tweens.add({ targets: this.view, scaleY: 0, scaleX: 1.3, duration: 120, onComplete: () => this.destroy() });
  }
  update(dt) {
    this.baseUpdate(dt);
    const p = this.scene.nearestPlayer(this.homeX, this.homeY, this.cfg.aggro);
    if (!this.appeared) { if (p) this.appear(); return; }
    if (p) {
      const want = p.center.x + (p.center.x < this.homeX ? 60 : -60);
      this.homeX += GS.util.clamp(want - this.homeX, -this.cfg.speed * dt, this.cfg.speed * dt);
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = this.cfg.fireEvery;
        const dx = p.center.x - this.center.x, dy = p.center.y - this.center.y;
        const d = Math.hypot(dx, dy) || 1;
        this.scene.shots.fireEnemy('ok', this.center.x, this.center.y + 6, dx / d * 100, dy / d * 100);
        GS.Synth.popupOpen();
      }
    }
    const b = this.sprite.body;
    const tx = this.homeX + Math.sin(this.t * 0.9) * 10, ty = this.homeY + Math.sin(this.t * 1.7) * 8;
    b.setVelocity((tx - b.center.x) * 3, (ty - b.center.y) * 3);
    this.view.setPosition(Math.round(b.center.x), Math.round(b.center.y));
    // Злые глаза в окне следят за героем.
    this.blink -= dt;
    if (this.blink < -3) this.blink = 0.12;
    const g = this.eyes;
    g.clear();
    const ex = -this.size.w / 2 + 10, ey = -this.size.h / 2 + 15;
    const lx = p ? Math.sign(p.center.x - b.center.x) : 0, ly = p ? Math.sign(p.center.y - b.center.y) : 0;
    [0, 10].forEach((ox) => {
      g.fillStyle(GS.hex(GS.PAL.ink), 1).fillRect(ex + ox - 1, ey - 1, 7, this.blink > 0 ? 2 : 5);
      if (this.blink <= 0) {
        g.fillStyle(0xffffff, 1).fillRect(ex + ox, ey, 5, 3);
        g.fillStyle(GS.hex(GS.PAL.ink), 1).fillRect(ex + ox + 2 + lx, ey + 1 + (ly > 0 ? 1 : 0), 1, 1);
      }
    });
  }
};

// ——— Петушня ———
GS.Rooster = class Rooster extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.rooster;
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.rooster(), '');
    super(scene, x, y, cfg, { w: 16, h: 22, rig });
    this.state = 'idle';
    this.stateT = 1;
    this.homeX = x;
    this.voice = 1.4;
    this.contact = 1;
    rig.play('idle');
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const cfg = this.cfg;
    this.stateT -= dt;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, cfg.sight);
    switch (this.state) {
      case 'idle':
        b.velocity.x = GS.util.approach(b.velocity.x, this.facing * 25, 200 * dt);
        if (Math.abs(this.center.x - this.homeX) > 50 || b.blocked.left || b.blocked.right) { this.facing = this.center.x > this.homeX ? -1 : 1; }
        this.rig.play(Math.abs(b.velocity.x) > 10 ? 'run' : 'idle');
        this.rig.timeScale = 0.5;
        if (p && Math.abs(p.center.y - this.center.y) < 40 && this.stateT <= 0) {
          this.facing = p.center.x < this.center.x ? -1 : 1;
          this.state = 'crow'; this.stateT = 0.8;
          this.rig.play('crow', { restart: true });
          this.rig.timeScale = 1;
          b.velocity.x = 0;
          GS.Synth.rooster();
          this.scene.chatter.say(this, GS.util.pick(GS.LINES.enemy.rooster), { priority: true, time: 1 });
          if (this.scene.stickers && !this.scene.flags.rooster) { this.scene.flags.rooster = true; this.scene.stickers.show('rooster'); }
        }
        break;
      case 'crow':
        if (this.stateT <= 0) { this.state = 'windup'; this.stateT = 0.3; this.rig.play('windup', { restart: true }); }
        break;
      case 'windup':
        b.velocity.x = -this.facing * 20;
        if (this.stateT <= 0) { this.state = 'charge'; this.stateT = 1.6; this.contact = 2; this.rig.play('run'); this.rig.timeScale = 1.6; }
        break;
      case 'charge':
        b.velocity.x = this.facing * cfg.chargeSpeed;
        if (Math.random() < 0.5) this.scene.fx.puff(this.center.x - this.facing * 8, b.bottom, 1);
        if (b.blocked.left || b.blocked.right) {
          this.state = 'stunned'; this.stateT = cfg.stun; this.contact = 1;
          b.velocity.x = -this.facing * 80; b.velocity.y = -120;
          this.rig.play('stunned'); this.rig.timeScale = 1;
          this.scene.fx.shake(150, 3); this.scene.fx.stars(this.center.x, b.top, 6);
          GS.Synth.stomp();
        } else if (this.stateT <= 0 || !this.scene.isSolidAt(this.facing > 0 ? b.right + 6 : b.left - 6, b.bottom + 4)) {
          this.state = 'idle'; this.stateT = 1.2; this.contact = 1;
          b.velocity.x = 0; this.homeX = this.center.x;
        }
        break;
      case 'stunned':
        if (Math.random() < 0.1) this.scene.fx.stars(this.center.x, b.top - 4, 1);
        if (b.blocked.down) b.velocity.x *= 0.85;
        if (this.stateT <= 0) { this.state = 'idle'; this.stateT = 1.5; this.facing *= -1; this.homeX = this.center.x; }
        break;
      default: break;
    }
    this.syncRig(dt);
  }
  headPoint() { return { x: this.center.x, y: this.sprite.body.top - 8 }; }
};
