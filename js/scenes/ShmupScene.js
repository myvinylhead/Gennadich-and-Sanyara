// Шмап «Орбитальный скролл»: корабли летят снизу вверх, космос прокручивается навстречу.
// Сцена отдаёт HUD тот же интерфейс, что и обычный уровень (players, team, stats, def, boss),
// поэтому HUD, пауза, стикеры, реплики и итоги работают без изменений.

// ——— Корабль игрока ———
GS.Ship = class Ship {
  constructor(scene, index, hero, x, y) {
    this.scene = scene;
    this.index = index;
    this.hero = hero;
    const T = GS.TUNING.shmup;
    this.S = T.heroes[hero];
    // HUD читает имя, цвет и перезарядку спецприёма из cfg.
    this.cfg = { ...GS.TUNING.heroes[hero], special: this.S.special };
    this.maxHp = T.hp;
    this.hp = this.maxHp;
    this.alive = true;
    this.inMech = null;
    this.shield = false;
    this.coffeeT = 0;
    this.specialCd = 0;
    this.power = 1;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.invuln = 1.5;
    this.fireT = 0;
    this.rollT = 0;
    this.gridT = 0;
    this.slashT = 0;
    this.flashT = 0;
    this.respawnT = 0;
    this.alt = 0;
    this.t = 0;
    this.voice = { gennadich: 1.0, sanyara: 0.85, yurich: 0.75 }[hero] || 1;
    // Свой выхлоп и свои выстрелы у каждого корабля (листы art_refs/ship_<герой>.png).
    this.flames = [0, 1].map(() => scene.add.image(x, y, `ship/${hero}_flame0`).setDepth(29).setOrigin(0.5, 0));
    this.img = scene.add.image(x, y, 'ship/' + hero).setDepth(30);
    this.muzzle = scene.add.image(x, y, `shot/${hero}_flash`).setDepth(31).setOrigin(0.5, 1).setVisible(false);
  }

  get center() { return { x: this.x, y: this.y }; }
  headPoint() { return { x: this.x, y: this.y - 26 }; }

  say(event, opts = {}) {
    const text = typeof event === 'string' && GS.LINES.hero[event] ? GS.line(event, this.hero) : event;
    return this.scene.chatter.say(this, text, opts);
  }

  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

  update(dt, inp) {
    this.t += dt;
    if (!this.alive) return;
    const T = GS.TUNING.shmup;
    const sc = this.scene;
    // Движение: резкое, с лёгким сглаживанием; в «мусорных данных» управление инвертировано.
    let dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    let dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (sc.inGlitch(this.y)) { dx = -dx; dy = -dy; }
    const len = Math.hypot(dx, dy) || 1;
    const sp = T.speed * (this.rollT > 0 ? this.S.special.boost || 1 : 1) * (this.coffeeT > 0 ? GS.TUNING.coffee.speedMul : 1);
    const k = Math.min(1, dt * 18);
    this.vx += (dx / len * sp - this.vx) * k;
    this.vy += (dy / len * sp - this.vy) * k;
    this.x = GS.util.clamp(this.x + this.vx * dt, 18, GS.W - 18);
    this.y = GS.util.clamp(this.y + this.vy * dt, 60, GS.H - 22);

    // Огонь: держать кнопку стрельбы (или прыжка — пробел).
    this.fireT -= dt;
    if ((inp.shootHeld || inp.jumpHeld) && this.fireT <= 0) {
      this.fire();
      this.fireT = this.S.interval * (this.coffeeT > 0 ? GS.TUNING.coffee.fireMul : 1);
    }
    this.specialCd -= dt;
    if (inp.special && this.specialCd <= 0) this.special();

    this.invuln -= dt;
    this.rollT -= dt;
    this.gridT -= dt;
    this.slashT -= dt;
    this.flashT -= dt;
    this.coffeeT = Math.max(0, this.coffeeT - dt);
    this.shield = this.gridT > 0;
    this.draw(dt);
  }

  fire() {
    const sc = this.scene;
    const S = this.S;
    const p = this.power;
    const add = (ox, ang, dmg = S.damage) => sc.firePlayer(this, this.x + ox, this.y - 18, ang, dmg);
    if (S.pattern === 'twin') {
      this.alt = 1 - this.alt;
      add(-7, 0); add(7, 0);
      if (p >= 2) { add(-12, -0.18); add(12, 0.18); }
      if (p >= 3) add(0, 0);
      GS.Synth.shootCode();
    } else if (S.pattern === 'spread') {
      const n = p >= 2 ? 5 : 3;
      const step = p >= 3 ? 0.17 : 0.21;
      for (let i = 0; i < n; i++) add(0, (i - (n - 1) / 2) * step);
      GS.Synth.shootPixel();
    } else {
      add(0, 0);
      if (p >= 2) { add(-10, -0.08, S.damage * 0.6); add(10, 0.08, S.damage * 0.6); }
      if (p >= 3) { add(-16, -0.2, S.damage * 0.5); add(16, 0.2, S.damage * 0.5); }
      GS.Synth.shootRed();
    }
    this.flashT = 0.05;
    sc.stats.shots++;
  }

  special() {
    const sc = this.scene;
    const sp = this.S.special;
    this.specialCd = sp.cooldown;
    if (sp.kind === 'roll') {
      this.rollT = sp.time;
      this.invuln = Math.max(this.invuln, sp.time);
      GS.Synth.dash();
      sc.fx.code(this.x, this.y, 4);
    } else if (sp.kind === 'grid') {
      this.gridT = sp.time;
      GS.Synth.grid();
    } else {
      this.slashT = 0.2;
      GS.Synth.slash();
      sc.katana(this, sp.radius, sp.damage);
    }
    if (Math.random() < 0.3) this.say('special', { weak: true });
    if (!sc.flags['special_' + this.hero]) {
      sc.flags['special_' + this.hero] = true;
      if (sc.stickers && this.hero !== 'yurich') sc.stickers.show(this.hero === 'gennadich' ? 'special_g' : 'special_s', { force: true });
    }
  }

  draw() {
    const x = Math.round(this.x), y = Math.round(this.y);
    // Бочка: корабль «сплющивается» по ширине на целые пиксели — без нецелого масштаба.
    const roll = this.rollT > 0 ? Math.abs(Math.cos((1 - this.rollT / this.S.special.time) * Math.PI * 2)) : 1;
    this.img.setPosition(x, y).setVisible(true);
    this.img.setScale(roll < 0.5 ? 0.5 : 1, 1);
    this.img.setAlpha(this.invuln > 0 && this.rollT <= 0 && Math.floor(this.t * 18) % 2 ? 0.35 : 1);
    if (this.rollT > 0) this.img.setTint(0xb4ff5a); else this.img.clearTint();
    // Выхлоп: сильнее, когда летим вверх.
    const base = this.vy < -40 ? 0 : this.vy > 40 ? 3 : 1;
    const f = Math.min(5, base + (Math.floor(this.t * 24) % 2));
    const ex = Math.round(this.img.width * 0.24), ey = Math.round(this.img.height / 2) - 4;
    this.flames.forEach((fl, i) => fl.setTexture(`ship/${this.hero}_flame${f}`).setPosition(x + (i ? ex : -ex), y + ey).setVisible(true));
    this.muzzle.setPosition(x, y - Math.round(this.img.height / 2) + 2).setVisible(this.flashT > 0);
  }

  hurt(dmg = 1) {
    if (!this.alive || this.invuln > 0 || this.rollT > 0 || GS.QUERY.god) return false;
    this.hp -= dmg;
    this.invuln = GS.TUNING.shmup.invuln;
    const sc = this.scene;
    GS.Synth.hurt();
    sc.fx.shake(160, 3);
    sc.fx.sparks(this.x, this.y, 8, 0xff7ab8);
    if (sc.hud) sc.hud.flashPortrait(this.index);
    if (this.hp <= 0) { this.die(); return true; }
    if (Math.random() < 0.5) this.say('hurt', { weak: true });
    if (sc.stickers && Math.random() < 0.3) sc.stickers.show('hurt');
    return true;
  }

  die() {
    if (!this.alive) return;
    const sc = this.scene;
    this.alive = false;
    this.hp = 0;
    this.respawnT = GS.TUNING.shmup.respawn;
    this.power = Math.max(1, this.power - 1);
    sc.stats.deaths++;
    GS.Synth.explosion(true);
    sc.fx.burst(this.x, this.y, 24, ['w', 'v', 'g']);
    sc.fx.ring(this.x, this.y, { color: 0xffb03a, to: 3, ms: 400 });
    sc.fx.shake(300, 5);
    this.img.setVisible(false);
    this.flames.forEach((f) => f.setVisible(false));
    this.muzzle.setVisible(false);
    this.say('die', { priority: true });
    if (sc.stickers) sc.stickers.show('die');
    sc.onShipDown(this);
  }

  respawn(x, y) {
    this.alive = true;
    this.hp = this.maxHp;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.invuln = 2;
    this.rollT = 0; this.gridT = 0;
    this.say('respawn', { priority: true });
    this.draw();
  }

  destroy() {
    this.img.destroy();
    this.muzzle.destroy();
    this.flames.forEach((f) => f.destroy());
  }
};

// ——— Враги шмапа ———
GS.SpaceEnemy = class SpaceEnemy {
  constructor(scene, kind, x, y, view) {
    const cfg = GS.TUNING.shmup.enemies[kind];
    this.scene = scene;
    this.kind = kind;
    this.cfg = cfg;
    this.hp = cfg.hp * (scene.players.length > 1 ? 1.3 : 1);
    this.maxHp = this.hp;
    this.r = cfg.r;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.t = 0;
    this.alive = true;
    this.view = view;
    this.flashT = 0;
    this.voice = GS.util.rand(0.5, 0.7);
    this.drops = null;
  }

  get center() { return { x: this.x, y: this.y }; }
  headPoint() { return { x: this.x, y: this.y - this.r - 4 }; }

  hit(dmg) {
    if (!this.alive) return;
    this.hp -= dmg;
    this.flashT = 0.06;
    this.scene.addTeam(GS.TUNING.team.perHit * 0.5);
    if (this.hp <= 0) this.die();
    else GS.Synth.hit();
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    const sc = this.scene;
    sc.onEnemyKilled(this);
    this.boom();
    if (this.drops) sc.spawnItem(this.drops, this.x, this.y);
    else if (Math.random() < 0.25) sc.spawnItem('coin', this.x, this.y);
    this.view.destroy();
  }

  boom() {
    const sc = this.scene;
    GS.Synth.squeal();
    GS.Synth.splat();
    sc.fx.goo(this.x, this.y, 8);
    sc.fx.burst(this.x, this.y, 10, ['p', 'w']);
    sc.fx.ring(this.x, this.y, { color: 0xff7ab8, to: 1.4, ms: 220 });
    if (Math.random() < 0.35) sc.fx.pop(this.x, this.y - 10, GS.util.pick(GS.LINES.enemy.death), { color: '#ffa8cf' });
  }

  // Ушёл за нижний (или боковой) край — убрать без награды.
  offscreen() { return this.y > GS.H + 40 || this.y < -140 || this.x < -90 || this.x > GS.W + 90; }

  remove() { this.alive = false; this.view.destroy(); }

  sync(dt) {
    this.t += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.flashT -= dt;
    const v = this.view;
    v.setPosition(Math.round(this.x), Math.round(this.y));
    if (v.tick) {
      v.tick(dt);
      v.setTintAll(this.flashT > 0 ? 0xffffff : null);
    } else if (v.setTintFill) {
      if (this.flashT > 0) v.setTintFill(0xffffff); else v.clearTint();
    }
  }
};

// Летающее хрючево: синус, «ласточка» или клин; плюётся слизью в ближайший корабль.
GS.SpaceFlyer = class extends GS.SpaceEnemy {
  constructor(scene, x, y, path, i, n) {
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.flyer(), 'pig_lilac/').setDepth(20);
    rig.play('fly');
    super(scene, 'flyer', x, y, rig);
    this.path = path; this.i = i; this.n = n;
    this.x0 = x;
    this.fireT = GS.util.rand(1.2, 2.6);
    if (path === 'swoopL' || path === 'swoopR') { this.dir = path === 'swoopL' ? 1 : -1; this.x = this.dir > 0 ? -20 : GS.W + 20; this.y = 40 + i * 6; }
  }
  update(dt) {
    const s = this;
    // Змейка: все идут по одной синусоиде от общих часов, поэтому выстраиваются в «хвост».
    if (s.path === 'sine') { s.vy = 60; s.x = s.x0 + Math.sin(s.scene.clock * 2.2) * 90; }
    else if (s.path === 'v') { s.vy = 50; }
    else { s.vx = s.dir * 150 * Math.max(0.3, 1 - s.t * 0.25); s.vy = 30 + s.t * 40; }
    const p = s.scene.nearestShip(s.x, s.y);
    if (p) s.view.facing = p.x < s.x ? -1 : 1;
    s.fireT -= dt;
    if (p && s.fireT <= 0 && s.y > 20 && s.y < GS.H * 0.6) {
      s.fireT = GS.util.rand(1.8, 2.8);
      s.scene.fireAt('slime', s.x, s.y + 6, p, s.cfg.shotSpeed);
      GS.Synth.hryuk(1.4);
      s.view.squash(1.25, 0.8);
    }
    s.sync(dt);
  }
};

// Ныряльщик: зависает, прицеливается по X и пикирует вниз.
GS.SpaceDiver = class extends GS.SpaceEnemy {
  constructor(scene, x, y) {
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.hryuchevo(), 'pig_pink/').setDepth(20);
    rig.play('fly');
    super(scene, 'diver', x, y, rig);
    this.state = 'in';
  }
  update(dt) {
    const s = this;
    if (s.state === 'in') {
      s.vy = 90;
      if (s.y > 60) { s.state = 'aim'; s.t = 0; s.view.play('crouch'); }
    } else if (s.state === 'aim') {
      s.vy = 0;
      const p = s.scene.nearestShip(s.x, s.y);
      if (p) s.vx = GS.util.clamp((p.x - s.x) * 3, -160, 160);
      if (s.t > 0.8) { s.state = 'dive'; s.vx = 0; s.view.play('air'); GS.Synth.hryuk(0.9); s.view.squash(0.8, 1.3); }
    } else {
      s.vy = Math.min(320, s.vy + 600 * dt);
    }
    s.sync(dt);
  }
};

// Астероиды «мусорных данных».
GS.SpaceRock = class extends GS.SpaceEnemy {
  constructor(scene, x, y, big) {
    const img = scene.add.image(x, y, big ? 'sp/rock1' : 'sp/rock0').setDepth(18);
    super(scene, big ? 'bigrock' : 'rock', x, y, img);
    this.vy = GS.util.rand(45, 85);
    this.vx = GS.util.rand(-20, 20);
    this.spin = GS.util.rand(-1.5, 1.5);
  }
  boom() {
    const sc = this.scene;
    GS.Synth.explosion(false);
    sc.fx.burst(this.x, this.y, 8, ['w']);
    sc.fx.smoke(this.x, this.y, 3);
  }
  update(dt) { this.view.rotation += this.spin * dt; this.sync(dt); }
};

// Спутник-турель: медленно плывёт вниз и стреляет кольцом.
GS.SpaceTurret = class extends GS.SpaceEnemy {
  constructor(scene, x, y) {
    const img = scene.add.image(x, y, 'sp/sat').setDepth(19);
    super(scene, 'turret', x, y, img);
    this.vy = 24;
    this.fireT = 1.4;
    this.rot = 0;
    this.drops = 'coin3';
  }
  update(dt) {
    const s = this;
    s.fireT -= dt;
    if (s.y > 30 && s.fireT <= 0) {
      s.fireT = 2.1;
      s.rot += 0.35;
      for (let i = 0; i < 8; i++) {
        const a = s.rot + i * Math.PI / 4;
        s.scene.fireEnemy('slimeG', s.x, s.y, Math.cos(a) * s.cfg.shotSpeed, Math.sin(a) * s.cfg.shotSpeed);
      }
      GS.Synth.laser();
    }
    s.sync(dt);
  }
};

// Окно-попап: плывёт вниз, стреляет кнопками «OK».
GS.SpacePopup = class extends GS.SpaceEnemy {
  constructor(scene, x, y) {
    const [title, text] = GS.util.pick(GS.LINES.popups);
    const key = `sp_popup_${scene.popupN = (scene.popupN || 0) + 1}`;
    GS.EnemyArt.popupWindow(scene, key, title, text);
    const img = scene.add.image(x, y, key).setDepth(19);
    super(scene, 'popup', x, y, img);
    this.vy = 32;
    this.fireT = 1.5;
    this.texKey = key;
    GS.Synth.popupOpen();
  }
  boom() {
    const sc = this.scene;
    GS.Synth.popupClose();
    sc.fx.burst(this.x, this.y, 12, ['w', 'v']);
    sc.fx.pop(this.x, this.y - 10, 'ЗАКРЫТО', { color: '#8cf2ff' });
  }
  update(dt) {
    const s = this;
    s.x += Math.sin(s.t * 1.4) * 20 * dt;
    s.fireT -= dt;
    if (s.y > 20 && s.fireT <= 0) {
      s.fireT = 2;
      s.scene.fireEnemy('ok', s.x, s.y + 12, 0, s.cfg.shotSpeed);
    }
    s.sync(dt);
  }
};

// Петушня на реактивной тяге: замах — и таран через весь экран.
GS.SpaceRooster = class extends GS.SpaceEnemy {
  constructor(scene, y, from) {
    const dir = from === 'L' ? 1 : -1;
    const x = dir > 0 ? -30 : GS.W + 30;
    const rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.rooster(), '').setDepth(21);
    rig.facing = dir;
    rig.play('run');
    super(scene, 'rooster', x, y, rig);
    this.dir = dir;
    this.state = 'in';
    this.tx = dir > 0 ? 70 : GS.W - 70;
    this.drops = Math.random() < 0.5 ? 'coin3' : null;
  }
  update(dt) {
    const s = this;
    if (s.state === 'in') {
      s.vx = (s.tx - s.x) * 4;
      if (Math.abs(s.tx - s.x) < 3) { s.state = 'windup'; s.t = 0; s.vx = 0; s.view.play('windup'); GS.Synth.rooster(); s.scene.chatter.say(s, 'КУКАРЕ-КОД!', { priority: true }); }
    } else if (s.state === 'windup') {
      if (s.t > 0.7) { s.state = 'charge'; s.view.play('run'); }
    } else {
      s.vx = s.dir * 340;
    }
    s.sync(dt);
  }
};

// Мини-босс: опоссум-разведчик на летающем сервере.
GS.SpaceScout = class extends GS.SpaceEnemy {
  constructor(scene) {
    const cont = scene.add.container(GS.W / 2, -90).setDepth(22);
    const server = scene.add.image(0, 12, 'decor/server').setScale(2);
    const glow = scene.add.image(0, 40, 'glow/orange').setScale(2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
    cont.add([glow, server]);
    super(scene, 'scout', GS.W / 2, -90, cont);
    this.rig = new GS.Skeleton(scene, GS.W / 2, -90, GS.enemyRigs.opossum(), '').setDepth(23);
    this.rig.baseScale = 0.75;
    this.rig.play('idle');
    this.server = server;
    this.state = 'enter';
    this.phase = 1;
    this.atkT = 2;
    this.fanT = 3.5;
    this.spinA = 0;
  }
  headPoint() { return { x: this.x, y: this.y - 74 }; }
  hit(dmg) {
    if (this.state !== 'fight') return;
    super.hit(dmg);
    const f = this.hp / this.maxHp;
    const ph = f > 0.66 ? 1 : f > 0.33 ? 2 : 3;
    if (ph !== this.phase) {
      this.phase = ph;
      this.rig.play('roar', { restart: true });
      GS.Synth.roar();
      this.scene.fx.shake(400, 4);
      this.scene.chatter.say(this, ph === 2 ? 'ОШИБКА ГЕНЕРАЦИИ!' : 'ПРОВЕРЬ ЛОГИ, ЛЮБИМЧИК!', { priority: true, color: '#ff5a4a' });
      this.scene.time.delayedCall(900, () => this.rig.play('idle'));
    }
  }
  die() {
    if (!this.alive || this.state === 'flee') return;
    this.state = 'flee';
    this.hp = 0;
    this.t = 0;
    const sc = this.scene;
    sc.onEnemyKilled(this);
    sc.enemyShots.forEach((s) => s.img.destroy());
    sc.enemyShots = [];
    GS.Synth.explosion(true);
    sc.fx.flash(300, 0xffb03a, 0.5);
    sc.fx.shake(700, 6);
    this.rig.play('run');
    sc.chatter.say(this, 'ВСТРЕТИМСЯ В ЯДРЕ, ЛЮБИМЧИКИ!', { priority: true, color: '#ff5a4a' });
    for (let i = 0; i < 8; i++) sc.time.delayedCall(i * 140, () => { sc.fx.burst(this.x + GS.util.rand(-30, 30), this.y + GS.util.rand(-10, 30), 10, ['w', 'v']); GS.Synth.explosion(false); });
    sc.time.delayedCall(1800, () => sc.completeLevel());
  }
  update(dt) {
    const s = this;
    const sc = s.scene;
    if (s.state === 'enter') {
      s.y += (112 - s.y) * Math.min(1, dt * 1.5);
      if (s.y > 108) { s.state = 'fight'; s.t = 0; s.rig.play('roar', { restart: true }); GS.Synth.roar(); sc.time.delayedCall(900, () => s.rig.play('idle')); }
    } else if (s.state === 'fight') {
      const spd = s.phase === 3 ? 1.1 : 0.6;
      s.x = GS.W / 2 + Math.sin(s.t * spd) * 200;
      s.y = 112 + Math.sin(s.t * 1.3) * 10;
      s.atkT -= dt;
      s.fanT -= dt;
      const p = sc.nearestShip(s.x, s.y);
      if (s.atkT <= 0 && p) {
        s.atkT = s.phase === 3 ? 0.7 : 1.1;
        [-0.18, 0, 0.18].forEach((da) => sc.fireAt('slime', s.x, s.y + 20, p, 150, da));
        GS.Synth.hryuk(0.7);
      }
      if (s.fanT <= 0) {
        s.fanT = s.phase === 1 ? 3.2 : 2.4;
        const n = s.phase === 1 ? 7 : 11;
        for (let i = 0; i < n; i++) {
          const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.17;
          sc.fireEnemy('glitch', s.x, s.y + 24, Math.cos(a) * 120, Math.sin(a) * 120);
        }
        GS.Synth.laser();
      }
      if (s.phase >= 2) {
        s.spinA += dt * 2.6;
        s.spinT = (s.spinT || 0) - dt;
        if (s.spinT <= 0) {
          s.spinT = s.phase === 3 ? 0.12 : 0.2;
          sc.fireEnemy('slimeG', s.x, s.y + 10, Math.cos(s.spinA) * 100, Math.abs(Math.sin(s.spinA)) * 100 + 20);
        }
      }
      if (s.phase === 3 && Math.floor(s.t * 0.25) !== Math.floor((s.t - dt) * 0.25)) sc.spawnWave('divers', { xs: [s.x - 80, s.x + 80] });
    } else {
      s.y -= 160 * dt;
      s.x += Math.sin(s.t * 20) * 2;
    }
    s.sync(dt);
    s.rig.setPosition(Math.round(s.x), Math.round(s.y) - 4);
    s.rig.tick(dt);
    s.rig.setTintAll(s.flashT > 0 ? 0xffffff : null);
    s.server.y = 12 + Math.round(Math.sin(s.t * 6));
  }
  remove() { super.remove(); this.rig.destroy(); }
};

// ——— Сцена ———
GS.ShmupScene = class ShmupScene extends Phaser.Scene {
  constructor() { super('Shmup'); }

  init(data) {
    this.stage = data.stage || 3;
    this.def = GS.STAGES()[this.stage - 1].def;
    this.boss = null;
    this.respawning = false;
  }

  create() {
    const S = GS.session;
    GS.level = this;
    this.makeArt();
    this.stats = { time: 0, kills: 0, coins: 0, coinsTotal: 0, deaths: 0, shots: 0, hits: 0, score: 0, cat: false, pizzas: 0, coffees: 0 };
    this.team = 0;
    this.combo = 0;
    this.comboT = 0;
    this.state = 'play';
    this.flags = {};
    this.clock = 0;          // время по расписанию волн
    this.waveI = 0;
    this.cp = { t: 0, waveI: 0 };
    this.spawners = [];
    this.enemies = [];
    this.playerShots = [];
    this.enemyShots = [];
    this.items = [];
    this.glitchY = null;
    this.popupN = 0;

    this.cameras.main.setBackgroundColor('#06041a');
    this.makeBackground();
    this.fx = new GS.Fx(this);
    this.chatter = new GS.Chatter(this);
    this.controls = new GS.Controls(this, S.players);
    this.g = this.add.graphics().setDepth(40);
    this.players = [];
    for (let i = 0; i < S.players; i++) this.players.push(new GS.Ship(this, i, S.heroes[i], GS.W / 2 + (S.players > 1 ? (i ? 50 : -50) : 0), GS.H - 50));

    this.scene.launch('Hud', { level: this });
    this.events.once('shutdown', () => { this.scene.stop('Hud'); GS.level = null; });
    GS.Music.play(this.def.music);
    this.cameras.main.fadeIn(400, 6, 4, 26);
    this.time.delayedCall(700, () => {
      this.players[0].say('start', { priority: true });
      if (this.stickers) this.stickers.show('space', { force: true });
    });
    if (GS.QUERY.god) this.players.forEach((p) => { p.maxHp = 99; p.hp = 99; });
  }

  get stickers() { const h = this.scene.get('Hud'); return h && h.stickers; }
  get hud() { return this.scene.get('Hud'); }

  // ——— Арт, которого нет в общих текстурах ———
  makeArt() {
    if (this.textures.exists('sp/sat')) return;
    const ink = GS.PAL.ink;
    GS.makeTex(this, 'sp/sat', 34, 16, (p) => {
      p.rect(0, 4, 11, 8, '#2a4ab0'); p.rect(23, 4, 11, 8, '#2a4ab0');
      for (let x = 2; x < 11; x += 3) { p.rect(x, 4, 1, 8, '#5a8af0'); p.rect(23 + x - 2 + 1, 4, 1, 8, '#5a8af0'); }
      p.rect(11, 7, 12, 2, '#6a6a80');
      p.rect(13, 1, 8, 14, '#a8acc4'); p.rect(13, 1, 8, 2, '#e2e4f0'); p.rect(13, 13, 8, 2, '#6a6a80');
      p.rect(15, 5, 4, 4, '#ff5a8a'); p.px(16, 6, '#ffe0f0');
    }, { outline: true });
    const rock = (key, r) => GS.makeTex(this, key, r * 2 + 2, r * 2 + 2, (p) => {
      p.ellipse(r, r, r, r * 0.86, '#4a3a5e');
      p.ellipse(r - 1, r - 1, r * 0.72, r * 0.6, '#6a5a80');
      p.circle(r + r * 0.35, r + r * 0.2, Math.max(1, r * 0.22), '#3a2a4a');
      p.circle(r - r * 0.4, r - r * 0.3, Math.max(1, r * 0.16), '#3a2a4a');
      p.px(Math.round(r * 0.6), Math.round(r * 0.5), '#9a8ab0');
      p.px(Math.round(r * 1.2), Math.round(r * 1.3), '#4fe03c');
    }, { outline: true });
    rock('sp/rock0', 7);
    rock('sp/rock1', 12);
    const planet = (key, r, c, cs, cl) => GS.makeTex(this, key, r * 2 + 2, r * 2 + 2, (p) => {
      p.circle(r, r, r, cs);
      p.circle(r - 2, r - 2, r - 2, c);
      p.ellipse(r - r * 0.35, r - r * 0.35, r * 0.4, r * 0.3, cl);
      for (let i = 0; i < 3; i++) p.rect(Math.round(r * 0.3), Math.round(r * (0.7 + i * 0.4)), Math.round(r * 1.2), 1, cs);
    });
    planet('sp/planet0', 40, '#6a3ab0', '#3a1a6a', '#9a6ae0');
    planet('sp/planet1', 22, '#2a8a6a', '#1a4a3a', '#5ad0a0');
    planet('sp/planet2', 14, '#c05a3a', '#6a2a1a', '#f08a5a');
  }

  makeBackground() {
    const W = GS.W, H = GS.H;
    this.bgFar = this.add.tileSprite(0, 0, W, H, 'bg/stars1').setOrigin(0).setAlpha(0.55).setDepth(-30);
    this.bgMid = this.add.tileSprite(0, 0, W, H, 'bg/stars2').setOrigin(0).setAlpha(0.8).setDepth(-28);
    this.bgNear = this.add.tileSprite(0, 0, W, H, 'bg/stars1').setOrigin(0).setTileScale(2).setAlpha(0.5).setDepth(-26);
    this.decor = [];
    this.decorT = 1;
    this.lines = Array.from({ length: 14 }, () => ({ x: GS.util.rand(0, W), y: GS.util.rand(0, H), v: GS.util.rand(260, 520), l: GS.util.randInt(6, 18) }));
    this.bgLines = this.add.graphics().setDepth(-25);
    // Сразу на экране — большая планета внизу (откуда взлетели).
    this.addDecor('sp/planet0', W * 0.72, H * 0.55, 14, 0.9);
  }

  addDecor(key, x, y, v, alpha = 0.8, depth = -27) {
    const img = this.add.image(x, y, key).setAlpha(alpha).setDepth(depth);
    this.decor.push({ img, v, y });
  }

  updateBackground(dt) {
    const sp = this.state === 'won' ? 3 : 1;
    this.bgFar.tilePositionY -= 12 * dt * sp;
    this.bgMid.tilePositionY -= 30 * dt * sp;
    this.bgNear.tilePositionY -= 22 * dt * sp;
    this.decorT -= dt;
    if (this.decorT <= 0) {
      this.decorT = GS.util.rand(5, 9);
      const k = GS.util.pick(['sp/planet1', 'sp/planet2', 'decor/server', 'decor/antenna', 'sp/planet1']);
      const isJunk = k.startsWith('decor');
      this.addDecor(k, GS.util.rand(30, GS.W - 30), -50, isJunk ? 40 : 18, isJunk ? 0.35 : 0.75);
      if (isJunk) this.decor[this.decor.length - 1].img.setTint(0x6a5a9a).setRotation(GS.util.rand(-1, 1));
    }
    this.decor = this.decor.filter((d) => {
      d.y += d.v * dt * sp;
      d.img.y = Math.round(d.y);
      if (d.y > GS.H + 90) { d.img.destroy(); return false; }
      return true;
    });
    const g = this.bgLines;
    g.clear();
    this.lines.forEach((l) => {
      l.y += l.v * dt * sp;
      if (l.y > GS.H + 20) { l.y = -20; l.x = GS.util.rand(0, GS.W); }
      g.fillStyle(0x8cf2ff, 0.18).fillRect(Math.round(l.x), Math.round(l.y), 1, l.l);
    });
  }

  // ——— Стрельба ———
  firePlayer(ship, x, y, ang, dmg) {
    const S = ship.S;
    const img = this.add.image(Math.round(x), Math.round(y), `shot/${ship.hero}0`).setDepth(28);
    img.setRotation(ang);
    const v = S.bullet;
    this.playerShots.push({ img, x, y, vx: Math.sin(ang) * v, vy: -Math.cos(ang) * v, dmg, owner: ship, tex: ship.hero, t: 0 });
  }

  fireEnemy(kind, x, y, vx, vy) {
    const tex = { slime: 'shot/slime', slimeG: 'shot/slimeG', glitch: 'shot/glitch', ok: 'shot/ok' }[kind];
    const r = kind === 'ok' ? 5 : 3;
    const img = this.add.image(Math.round(x), Math.round(y), tex).setDepth(27);
    this.enemyShots.push({ img, x, y, vx, vy, r, spin: kind === 'glitch' ? 6 : 0 });
  }

  fireAt(kind, x, y, ship, speed, da = 0) {
    const a = Math.atan2(ship.y - y, ship.x - x) + da;
    this.fireEnemy(kind, x, y, Math.cos(a) * speed, Math.sin(a) * speed);
  }

  katana(ship, radius, dmg) {
    this.fx.sparks(ship.x, ship.y - radius / 2, 6, 0xff5a4a);
    this.enemies.forEach((e) => { if (e.alive && Math.hypot(e.x - ship.x, e.y - ship.y) < radius + e.r) e.hit(dmg); });
    if (this.boss && this.boss.alive && Math.hypot(this.boss.x - ship.x, this.boss.y - ship.y) < radius + this.boss.r) this.boss.hit(dmg);
    this.enemyShots = this.enemyShots.filter((s) => {
      if (Math.hypot(s.x - ship.x, s.y - ship.y) < radius) { this.fx.sparks(s.x, s.y, 2, 0xff5a4a); s.img.destroy(); return false; }
      return true;
    });
  }

  nearestShip(x, y) {
    let best = null, bd = Infinity;
    this.players.forEach((p) => { if (!p.alive) return; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } });
    return best;
  }

  // Совместимость с общими врагами/стикерами уровня.
  nearestPlayer(x, y) { return this.nearestShip(x, y); }

  // ——— Волны ———
  spawnWave(type, o = {}) {
    const W = GS.W;
    switch (type) {
      case 'tutorial': {
        const p = this.players[0];
        const sub = this.players.length > 1 ? 'ОГОНЬ — СТРЕЛЯТЬ, СПЕЦ — ПРИЁМ КОРАБЛЯ' : `ОГОНЬ ИЛИ ПРОБЕЛ — СТРЕЛЯТЬ. СПЕЦ — ${p.S.special.label}`;
        if (this.hud) this.hud.banner('ВЗЛЁТ!', '#8cf2ff', sub);
        break;
      }
      case 'flyers':
        for (let i = 0; i < o.n; i++) {
          const delay = o.path === 'v' ? Math.abs(i - (o.n - 1) / 2) * 0.25 : i * 0.45;
          const x = o.path === 'v' ? W / 2 + (i - (o.n - 1) / 2) * 52 : (o.x || W / 2);
          this.later(delay, () => this.enemies.push(new GS.SpaceFlyer(this, x, -20, o.path, i, o.n)));
        }
        break;
      case 'divers':
        o.xs.forEach((x, i) => this.later(i * 0.3, () => this.enemies.push(new GS.SpaceDiver(this, GS.util.clamp(x, 30, W - 30), -20))));
        break;
      case 'rocks':
        this.spawners.push({ until: this.clock + o.dur, every: o.every, t: 0, big: o.big });
        break;
      case 'turret': this.enemies.push(new GS.SpaceTurret(this, o.x, -20)); break;
      case 'popups': o.xs.forEach((x, i) => this.later(i * 0.4, () => this.enemies.push(new GS.SpacePopup(this, x, -30)))); break;
      case 'rooster': this.enemies.push(new GS.SpaceRooster(this, o.y, o.from)); break;
      case 'item':
        for (let i = 0; i < (o.n || 1); i++) this.later(i * 0.25, () => this.spawnItem(o.kind, o.x + (o.n > 1 ? (i - (o.n - 1) / 2) * 22 : 0), -12));
        break;
      case 'cat': {
        // Секрет: золотая кошка пролетает у самого края и быстро — надо успеть.
        const it = this.spawnItem('cat', 14, -12);
        if (it && GS.Save.data.cats[this.def.id]) it.img.setAlpha(0.5);
        if (it) { it.vy = 70; it.vx = 0; }
        break;
      }
      case 'glitch':
        this.glitchY = -40;
        GS.Synth.glitch();
        if (this.hud) this.hud.banner('МУСОРНЫЕ ДАННЫЕ!', '#ff4ad0', 'В ПОЛОСЕ УПРАВЛЕНИЕ ИНВЕРТИРУЕТСЯ');
        break;
      case 'checkpoint':
        this.cp = { t: this.clock, waveI: this.waveI };
        GS.Synth.checkpoint();
        this.players.forEach((p) => { if (p.alive) p.heal(2); });
        if (this.hud) this.hud.banner('GIT COMMIT', '#4fe03c', GS.util.pick(GS.LINES.checkpointMsgs));
        break;
      case 'warn':
        GS.Synth.warn();
        this.fx.flash(250, 0xff4a4a, 0.25);
        if (this.hud) this.hud.banner('ОПОССУМ НА РАДАРЕ!', '#ff5a4a', 'ВНИМАНИЕ: РАЗВЕДЧИК');
        GS.Music.play('boss');
        break;
      case 'boss':
        this.boss = new GS.SpaceScout(this);
        if (this.hud) this.hud.showBoss(true, 'ОПОССУМ-РАЗВЕДЧИК');
        if (this.stickers) this.stickers.show('boss', { force: true });
        break;
      default: break;
    }
  }

  later(sec, fn) { this.time.delayedCall(sec * 1000, () => { if (this.state === 'play' && !this.respawning) fn(); }); }

  // ——— Подборы ———
  spawnItem(kind, x, y) {
    if (kind === 'coin3') { for (let i = 0; i < 3; i++) this.spawnItem('coin', x + (i - 1) * 12, y + GS.util.rand(-6, 6)); return null; }
    const tex = { coin: 'item/coin0', pizza: 'item/pizza', coffee: 'item/coffee', crystal: 'item/crystal', cat: 'item/cat' }[kind];
    if (!tex) return null;
    if (kind === 'coin') this.stats.coinsTotal++;
    const img = this.add.image(Math.round(x), Math.round(y), tex).setDepth(25);
    const glow = kind === 'coin' ? null : this.add.image(x, y, kind === 'cat' ? 'glow/gold' : 'glow/green').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setDepth(24);
    const it = { kind, img, glow, x, y, vx: 0, vy: 45, t: Math.random() * 6 };
    this.items.push(it);
    return it;
  }

  takeItem(it, p) {
    const x = it.x, y = it.y;
    switch (it.kind) {
      case 'coin':
        this.stats.coins++;
        GS.Synth.coin(0);
        this.addTeam(GS.TUNING.team.perCoin);
        this.fx.sparks(x, y, 3, 0xb4ff5a);
        break;
      case 'pizza':
        this.stats.pizzas++;
        p.heal(GS.TUNING.pizzaHeal);
        GS.Synth.pizza();
        this.fx.hearts(x, y, 3);
        this.fx.pop(x, y - 8, '+♥♥', { color: '#ff7ab8' });
        p.say('pizza', { priority: true });
        if (this.stickers) this.stickers.show('pizza');
        break;
      case 'coffee':
        this.stats.coffees++;
        p.coffeeT = GS.TUNING.coffee.time;
        GS.Synth.coffee();
        this.fx.pop(x, y - 8, 'КОФЕ +112%', { color: '#ffd84a' });
        p.say('coffee', { priority: true });
        if (this.stickers) this.stickers.show('coffee');
        break;
      case 'crystal':
        p.power = Math.min(GS.TUNING.shmup.maxPower, p.power + 1);
        GS.Synth.crystal();
        this.fx.ring(x, y, { color: 0xb08cff, to: 1.6 });
        this.fx.pop(x, y - 8, p.power >= GS.TUNING.shmup.maxPower ? 'ОРУЖИЕ: МАКС!' : 'ОРУЖИЕ +1', { color: '#c8a8ff' });
        break;
      case 'cat': {
        GS.Synth.cat();
        this.stats.cat = true;
        const first = !GS.Save.data.cats[this.def.id];
        GS.Save.data.cats[this.def.id] = true;
        GS.Save.write();
        this.fx.burst(x, y, 24, ['y', 'w']);
        this.fx.ring(x, y, { color: 0xffd84a, to: 2.5 });
        p.say('cat', { priority: true });
        if (this.stickers) this.stickers.show('cat', { force: true });
        if (this.hud) this.hud.banner('СЕКРЕТ НАЙДЕН!', '#ffd84a', `ЗОЛОТЫЕ КОШКИ: ${GS.Save.catCount()} / 3${first && GS.Save.catCount() >= 3 ? ' — ЮРИЧ ОТКРЫТ!' : ''}`);
        break;
      }
      default: break;
    }
  }

  // ——— Командный метр, убийства, суперудар (как в обычном уровне) ———
  addTeam(n) {
    const was = this.team;
    this.team = Math.min(GS.TUNING.team.max, this.team + n);
    if (was < GS.TUNING.team.max && this.team >= GS.TUNING.team.max && this.hud) this.hud.banner('СУПЕРУДАР ГОТОВ!', '#b4ff5a', this.players.length > 1 ? 'R / U — ДВА МОЗГА, ОДИН ПРОД' : 'V — ДВА МОЗГА, ОДИН ПРОД');
  }

  onEnemyKilled(e) {
    this.stats.kills++;
    this.stats.score += e.cfg.score || 100;
    this.addTeam(GS.TUNING.team.perKill);
    this.combo = this.comboT > 0 ? this.combo + 1 : 1;
    this.comboT = 2.5;
    if (this.hud) this.hud.setCombo(this.combo);
    if (this.combo === 5 || this.combo === 10 || this.combo === 15) {
      const p = this.nearestShip(e.x, e.y) || this.players[0];
      if (p) p.say(this.combo >= 10 ? 'combo' : 'kill', { priority: true });
      if (this.stickers) this.stickers.show('combo');
    }
  }

  performSuper(ship) {
    if (this.team < GS.TUNING.team.max || !ship.alive) return;
    this.team = 0;
    GS.Synth.superBlast();
    this.fx.flash(300, 0xb4ff5a, 0.7);
    this.fx.shake(600, 6);
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 90, () => this.fx.ring(ship.x, ship.y, { color: i % 2 ? 0xb08cff : 0x4fe03c, to: 6 + i * 2, ms: 600 }));
    this.enemies.forEach((e) => { if (e.alive && e.y > -10) e.hit(GS.TUNING.team.superDamage * 2); });
    if (this.boss && this.boss.alive) this.boss.hit(this.boss.maxHp * GS.TUNING.team.superBossFrac);
    this.enemyShots.forEach((s) => s.img.destroy());
    this.enemyShots = [];
    this.players.forEach((p) => p.alive && p.say('super', { priority: true }));
    if (this.stickers) this.stickers.show('super', { force: true });
  }

  inGlitch(y) { return this.glitchY !== null && Math.abs(y - this.glitchY) < 26; }

  // ——— Смерть и чекпоинты ———
  onShipDown() {
    if (this.players.some((p) => p.alive)) return;
    // Все сбиты — откат к последнему «git commit».
    this.respawning = true;
    this.time.delayedCall(1300, () => {
      const cam = this.cameras.main;
      cam.fadeOut(350, 6, 4, 26);
      cam.once('camerafadeoutcomplete', () => {
        this.enemies.forEach((e) => e.remove());
        this.enemies = [];
        this.enemyShots.forEach((s) => s.img.destroy());
        this.enemyShots = [];
        this.items.forEach((it) => { it.img.destroy(); if (it.glow) it.glow.destroy(); });
        this.items = [];
        this.spawners = [];
        this.glitchY = null;
        if (this.boss) { this.boss.remove(); this.boss = null; if (this.hud) this.hud.showBoss(false); }
        this.clock = this.cp.t;
        this.waveI = this.cp.waveI;
        this.players.forEach((p, i) => p.respawn(GS.W / 2 + (this.players.length > 1 ? (i ? 50 : -50) : 0), GS.H - 50));
        if (this.stickers) this.stickers.show('respawn');
        GS.Music.play(this.def.music);
        cam.fadeIn(350, 6, 4, 26);
        this.respawning = false;
      });
    });
  }

  completeLevel() {
    if (this.state !== 'play') return;
    this.state = 'won';
    GS.Music.stop(0.3);
    GS.Synth.win();
    if (this.hud) this.hud.showBoss(false);
    this.players.forEach((p) => { if (p.alive) p.say('portal', { priority: true }); else p.respawn(GS.W / 2, GS.H - 50); });
    if (this.stickers) this.stickers.show('win', { force: true });
    if (this.hud) this.hud.banner('ПРОРВАЛИСЬ!', '#b4ff5a', 'КУРС — ЯДРО НЕЙРОСЕТИ');
    const stats = { ...this.stats, stage: this.stage, levelId: this.def.id, name: this.def.name, par: this.def.parTime, players: this.players.length };
    // Корабли уходят вверх за край экрана.
    this.players.forEach((p, i) => this.time.delayedCall(900 + i * 150, () => { p.won = true; GS.Synth.dash(); }));
    this.time.delayedCall(2600, () => {
      this.cameras.main.fadeOut(400, 6, 4, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Results', stats));
    });
  }

  openPause() {
    this.scene.pause();
    this.scene.pause('Hud');
    GS.Music.duck(true);
    this.scene.launch('Pause', { from: 'Shmup' });
  }

  // ——— Цикл ———
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    const C = this.controls;
    C.update();
    if (C.sys.pause && this.state === 'play') { this.openPause(); return; }
    if (C.sys.mute) GS.Synth.setMuted(!GS.Synth.muted);
    this.fx.update(dt);
    if (this.fx.frozen) return;

    this.updateBackground(dt);
    if (this.state === 'play') this.stats.time += dt;
    this.comboT -= dt;
    if (this.comboT <= 0 && this.combo) { this.combo = 0; if (this.hud) this.hud.setCombo(0); }

    // Расписание волн.
    const waves = this.def.waves;
    if (this.state === 'play' && !this.respawning && !this.boss) {
      this.clock += dt;
      while (this.waveI < waves.length && waves[this.waveI][0] <= this.clock) {
        const [, type, o] = waves[this.waveI++];
        this.spawnWave(type, o || {});
      }
    }
    this.spawners = this.spawners.filter((s) => {
      s.t -= dt;
      if (s.t <= 0) { s.t = s.every; this.enemies.push(new GS.SpaceRock(this, GS.util.rand(20, GS.W - 20), -20, s.big && Math.random() < 0.35)); }
      return this.clock < s.until;
    });
    if (this.glitchY !== null) { this.glitchY += 38 * dt; if (this.glitchY > GS.H + 40) this.glitchY = null; }

    // Корабли.
    this.players.forEach((p, i) => {
      if (p.won) { p.y -= 420 * dt; p.vy = -400; p.draw(); return; }
      let inp = this.state === 'play' && !this.respawning ? C.read(i) : GS.Controls.prototype.blank();
      if (GS.bot && this.state === 'play') inp = GS.bot(i, inp, this, p);
      p.update(dt, inp);
      if (inp.super && this.team >= GS.TUNING.team.max) this.performSuper(p);
      // Сбитый в коопе возвращается, пока напарник жив.
      if (!p.alive && !this.respawning && this.state === 'play') {
        p.respawnT -= dt;
        if (p.respawnT <= 0 && this.players.some((q) => q.alive)) p.respawn(GS.W / 2, GS.H - 40);
      }
    });

    // Враги.
    this.enemies.forEach((e) => { if (e.alive) { e.update(dt); if (e.offscreen()) e.remove(); } });
    this.enemies = this.enemies.filter((e) => e.alive);
    if (this.boss) {
      this.boss.update(dt);
      if (this.boss.state === 'flee' && this.boss.y < -160) { this.boss.remove(); this.boss = null; }
    }

    this.updateShots(dt);
    this.updateItems(dt);
    this.collide();
    this.drawOverlay(time);
    this.chatter.update(dt);
  }

  updateShots(dt) {
    this.playerShots = this.playerShots.filter((s) => {
      s.t += dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.img.setPosition(Math.round(s.x), Math.round(s.y));
      if (Math.floor(s.t * 20) % 2) s.img.setTexture(`shot/${s.tex}1`); else s.img.setTexture(`shot/${s.tex}0`);
      if (s.y < -20 || s.x < -20 || s.x > GS.W + 20) { s.img.destroy(); return false; }
      return true;
    });
    this.enemyShots = this.enemyShots.filter((s) => {
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.img.setPosition(Math.round(s.x), Math.round(s.y));
      if (s.spin) s.img.rotation += s.spin * dt;
      // Сетка Саняры съедает пули перед кораблём.
      const grid = this.players.find((p) => p.alive && p.gridT > 0 && Math.abs(s.x - p.x) < 30 && s.y > p.y - 40 && s.y < p.y - 20);
      if (grid) { this.fx.sparks(s.x, s.y, 2, 0xb08cff); s.img.destroy(); return false; }
      if (s.y > GS.H + 20 || s.y < -30 || s.x < -20 || s.x > GS.W + 20) { s.img.destroy(); return false; }
      return true;
    });
  }

  updateItems(dt) {
    this.items = this.items.filter((it) => {
      it.t += dt;
      // Магнит: рядом с кораблём подбор подтягивается.
      const p = this.nearestShip(it.x, it.y);
      if (p && it.kind !== 'cat' && Math.hypot(p.x - it.x, p.y - it.y) < 48) { it.x += (p.x - it.x) * dt * 6; it.y += (p.y - it.y) * dt * 6; }
      else { it.x += it.vx * dt; it.y += it.vy * dt; }
      if (it.kind === 'coin') it.img.setTexture('item/coin' + [0, 1, 2, 3, 2, 1][Math.floor(it.t * 10) % 6]);
      it.img.setPosition(Math.round(it.x), Math.round(it.y + Math.sin(it.t * 4) * 2));
      if (it.glow) it.glow.setPosition(it.img.x, it.img.y);
      if (it.y > GS.H + 20) { it.img.destroy(); if (it.glow) it.glow.destroy(); return false; }
      return true;
    });
  }

  collide() {
    const hitR = GS.TUNING.shmup.hitR;
    // Пули игроков по врагам и боссу.
    const targets = this.enemies.filter((e) => e.alive && e.y > -20);
    if (this.boss && this.boss.alive && this.boss.state === 'fight') targets.push(this.boss);
    this.playerShots = this.playerShots.filter((s) => {
      for (const e of targets) {
        if (!e.alive) continue;
        const ey = e === this.boss ? e.y - 20 : e.y;
        if (Math.abs(s.x - e.x) < e.r + 3 && Math.abs(s.y - ey) < e.r + 6) {
          e.hit(s.dmg);
          this.stats.hits++;
          this.fx.sparks(s.x, s.y - 4, 2, s.owner.S.spark);
          s.img.destroy();
          return false;
        }
      }
      return true;
    });
    this.players.forEach((p) => {
      if (!p.alive) return;
      // Вражеские пули.
      this.enemyShots = this.enemyShots.filter((s) => {
        if (Math.hypot(s.x - p.x, s.y - p.y) < hitR + s.r) {
          if (p.hurt(1)) { s.img.destroy(); return false; }
        }
        return true;
      });
      // Таран врагом.
      this.enemies.forEach((e) => {
        if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < e.r + hitR + 2 && p.hurt(1) && e.kind !== 'popup') e.hit(3);
      });
      if (this.boss && this.boss.state === 'fight' && Math.hypot(this.boss.x - p.x, this.boss.y - 20 - p.y) < this.boss.r) p.hurt(1);
      // Подборы.
      this.items = this.items.filter((it) => {
        if (Math.hypot(it.x - p.x, it.y - p.y) < 18) { this.takeItem(it, p); it.img.destroy(); if (it.glow) it.glow.destroy(); return false; }
        return true;
      });
    });
  }

  // Сетка Саняры, катана Юрича, полоса «мусорных данных».
  drawOverlay(time) {
    const g = this.g;
    g.clear();
    this.players.forEach((p) => {
      if (!p.alive) return;
      if (p.gridT > 0) {
        const a = p.gridT < 0.5 && Math.floor(time / 60) % 2 ? 0.3 : 0.85;
        const x0 = Math.round(p.x) - 30, y0 = Math.round(p.y) - 38;
        g.fillStyle(0x7d52d6, 0.25 * a).fillRect(x0, y0, 60, 14);
        g.fillStyle(0xd8a8ff, a);
        for (let x = 0; x <= 60; x += 6) g.fillRect(x0 + x, y0, 1, 14);
        g.fillRect(x0, y0, 61, 1).fillRect(x0, y0 + 7, 61, 1).fillRect(x0, y0 + 14, 61, 1);
      }
      if (p.slashT > 0) {
        const r = p.S.special.radius;
        g.lineStyle(2, 0xff5a4a, p.slashT / 0.2);
        g.beginPath();
        g.arc(Math.round(p.x), Math.round(p.y), r, -Math.PI * (1 - p.slashT / 0.2) * 2, -Math.PI * (1 - p.slashT / 0.2) * 2 + Math.PI * 1.4);
        g.strokePath();
      }
    });
    if (this.glitchY !== null) {
      const y = Math.round(this.glitchY);
      for (let i = 0; i < 14; i++) {
        const yy = y - 24 + ((i * 7 + Math.floor(time / 50) * 5) % 48);
        g.fillStyle(GS.util.pick([0xff4ad0, 0x4fe03c, 0x8cf2ff]), 0.35).fillRect(GS.util.randInt(0, GS.W - 120), yy, GS.util.randInt(40, 160), 2);
      }
      g.fillStyle(0xff4ad0, 0.12).fillRect(0, y - 26, GS.W, 52);
    }
  }
};
