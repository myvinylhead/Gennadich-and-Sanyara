// Герой: физика платформера, стрельба в 8 направлений, спецприёмы, урон, смерть и возрождение.
// Внешний вид — скелетный риг; руки с бластером ведёт двухкостный IK к точке прицела.
GS.Player = class Player {
  constructor(scene, index, hero, x, y) {
    const T = GS.TUNING.player;
    this.scene = scene;
    this.index = index;
    this.hero = hero;
    this.cfg = GS.TUNING.heroes[hero];
    this.voice = hero === 'sanyara' ? 0.85 : hero === 'yurich' ? 0.75 : 1;
    this.sprite = scene.physics.add.sprite(x, y - T.bodyH / 2, 'px').setVisible(false);
    this.sprite.body.setSize(T.bodyW, T.bodyH);
    this.sprite.body.setMaxVelocityY(GS.TUNING.maxFall);
    this.sprite.owner = this;

    this.rig = new GS.Skeleton(scene, x, y, GS.heroRig(hero), hero + '/').setDepth(30 - index);
    this.rig.onIK = () => this.applyArms();
    this.rig.on('ev', (e) => { if (e === 'step' && this.onGround) { GS.Synth.step(); scene.fx.puff(this.sprite.body.center.x - this.facing * 4, this.sprite.body.bottom, 1); } });
    this.shieldImg = scene.add.image(x, y, 'obj/shield').setDepth(31).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);

    this.maxHp = T.maxHp;
    this.hp = this.maxHp;
    this.alive = true;
    this.facing = 1;
    this.invuln = 0;
    this.hurtT = 0;
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
    this.onGround = true;
    this.wasGround = true;
    this.landT = 0;
    this.dropT = 0;
    this.cooldown = 0;
    this.aimT = 0;
    this.aimAngle = 0;
    this.recoil = 0;
    this.charge = 0;
    this.specialCd = 0;
    this.dashT = 0;
    this.airDash = true;
    this.gridAir = true;
    this.airJumps = this.cfg.airJumps || 0;
    this.poseT = 0;           // время особой позы (сетка/катана)
    this.posing = null;
    this.idleT = 0;
    this.fidgetSaid = false;
    this.coffeeT = 0;
    this.boostT = 0;
    this.relic = null;
    this.relicT = 0;
    this.shield = false;
    this.lastSafe = { x, y };
    this.safeT = 0;
    this.deadT = 0;
    this.bubbleState = null;  // кооп: летит пузырём к напарнику
    this.inMech = null;
    this.chainCoins = 0;
    this.chainT = 0;
    this.lookTarget = null;
    this.lookT = 0;
  }

  get body() { return this.sprite.body; }
  get canBeHit() { return this.alive && !this.bubbleState && this.invuln <= 0 && this.dashT <= 0 && !this.inMech; }
  get center() { return this.body.center; }

  headPoint() {
    if (this.inMech) return this.inMech.headPoint();
    if (this.bubbleState) return { x: this.bubbleState.x, y: this.bubbleState.y - 18 };
    return { x: this.rig.x, y: this.rig.y - (this.rig.def.height || 48) };
  }

  say(event, opts = {}) {
    const text = typeof event === 'string' && GS.LINES.hero[event] ? GS.line(event, this.hero) : event;
    return this.scene.chatter.say(this, text, opts);
  }

  // ——— Основной цикл ———
  update(dt, inp) {
    const T = GS.TUNING.player;
    const b = this.body;
    if (this.inMech) { this.inMech.update(dt, inp); this.syncRig(dt, true); return; }
    if (!this.alive) { this.updateDead(dt); return; }

    this.onGround = b.blocked.down || b.touching.down;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.cooldown -= dt;
    this.aimT -= dt;
    this.specialCd -= dt;
    this.landT -= dt;
    this.dropT -= dt;
    this.poseT -= dt;
    this.coffeeT -= dt;
    this.boostT -= dt;
    this.chainT -= dt;
    if (this.relic) {
      this.relicT -= dt;
      if (this.relic === 'tdd' && Math.random() < 0.3) this.scene.fx.sparks(this.center.x + GS.util.rand(-8, 8), this.center.y + GS.util.rand(-12, 8), 1, this.tddGreen ? 0x4fe03c : 0xff5a4a);
      if (this.relicT <= 0) { this.relic = null; this.scene.fx.pop(this.center.x, this.center.y - 30, 'СКИЛЛ ЗАКОНЧИЛСЯ', { color: '#a8acc4' }); }
    }
    this.recoil = Math.max(0, this.recoil - dt * 20);
    if (this.chainT <= 0) this.chainCoins = 0;

    const stunned = this.hurtT > 0;
    const coffee = this.coffeeT > 0;
    const dir = stunned || this.scene.frozenInput ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir && this.dashT <= 0) this.facing = dir;

    // ——— Рывок Геннадича ———
    if (this.dashT > 0) {
      this.dashT -= dt;
      b.setVelocity(this.dashDir * this.cfg.special.speed, 0);
      if (Math.random() < 0.8) this.scene.fx.code(b.center.x - this.dashDir * 6, b.center.y + GS.util.rand(-8, 8), 1);
      if (this.dashT <= 0) { b.setAllowGravity(true); b.velocity.x = this.dashDir * T.runSpeed; this.invuln = Math.max(this.invuln, 0.08); }
    } else if (!stunned) {
      const boosted = this.boostT > 0;
      const speed = T.runSpeed * (coffee ? GS.TUNING.coffee.speedMul : 1) * (boosted ? GS.TUNING.race.boostMul : 1) * (this.posing === 'slash' ? 0.4 : 1);
      // На ускорителе бежим вправо и без кнопки; назад можно, но против потока.
      const target = (boosted && dir >= 0 ? 1 : dir) * speed;
      if (boosted && Math.random() < 0.6) this.scene.fx.sparks(b.center.x - 8, b.center.y + GS.util.rand(-10, 10), 1, 0x8cf2ff);
      const accel = this.onGround ? (dir ? T.accelGround : T.decelGround) : T.accelAir;
      b.velocity.x = GS.util.approach(b.velocity.x, target, accel * dt);
    }

    // ——— Прыжок: coyote time, буфер, срез высоты, сквозь полку вниз ———
    this.coyote = this.onGround ? T.coyoteTime : this.coyote - dt;
    this.buffer = inp.jump ? T.jumpBuffer : this.buffer - dt;
    if (!stunned && this.dashT <= 0 && this.buffer > 0) {
      if (inp.down && this.onGround && this.standingOnOneway()) {
        this.dropT = 0.25;
        this.buffer = 0;
        b.y += 2;
      } else if (this.coyote > 0) {
        b.velocity.y = -T.jumpVelocity;
        this.buffer = 0;
        this.coyote = 0;
        this.jumping = true;
        this.rig.squash(0.75, 1.28);
        this.scene.fx.puff(b.center.x, b.bottom, 4);
        GS.Synth.jump();
        this.rig.play('jump', { restart: true });
      } else if (inp.jump && this.airJumps > 0 && !this.onGround) {
        // Двойной прыжок (Юрич): только по свежему нажатию, буфер у земли его не тратит.
        this.airJumps--;
        b.velocity.y = -this.cfg.airJumpVelocity;
        this.buffer = 0;
        this.jumping = true;
        this.rig.squash(0.8, 1.22);
        this.scene.fx.puff(b.center.x, b.bottom, 6);
        GS.Synth.jump();
        this.rig.play('jump', { restart: true });
      }
    }
    if (this.jumping && !inp.jumpHeld && b.velocity.y < 0) { b.velocity.y *= T.jumpCut; this.jumping = false; }
    if (b.velocity.y >= 0) this.jumping = false;
    // Подброс батутом закончился — вернуть обычный предел скорости падения.
    if (b.velocity.y >= 0 && b.maxVelocity.y !== GS.TUNING.maxFall) b.setMaxVelocityY(GS.TUNING.maxFall);
    b.setGravityY(b.velocity.y > 0 && this.dashT <= 0 ? GS.TUNING.gravity * (GS.TUNING.fallGravityMul - 1) : 0);

    if (this.onGround && !this.wasGround) {
      const hard = this.fallSpeed > 260;
      this.rig.squash(hard ? 1.35 : 1.2, hard ? 0.7 : 0.82);
      this.scene.fx.puff(b.center.x, b.bottom, hard ? 6 : 3);
      this.landT = 0.14;
      GS.Synth.land();
      this.airDash = true;
      this.gridAir = true;
      this.airJumps = this.cfg.airJumps || 0;
    }
    this.fallSpeed = b.velocity.y;
    this.wasGround = this.onGround;

    // Безопасная точка для возврата после падения в пропасть.
    this.safeT -= dt;
    if (this.onGround && this.safeT <= 0 && this.scene.isSafeGround(b.center.x, b.bottom + 2)) {
      this.lastSafe = { x: b.center.x, y: b.bottom };
      this.safeT = 0.3;
    }

    // ——— Спецприём ———
    if (inp.special && !stunned && this.specialCd <= 0 && !this.scene.frozenInput) this.special(inp);

    // ——— Прицел и стрельба ———
    let ay = 0;
    if (inp.up) ay = -1;
    else if (inp.down && !this.onGround) ay = 1;
    const horiz = inp.left || inp.right;
    const ax = ay === 0 || horiz ? 1 : 0;
    const aim = Math.atan2(ay, ax);
    const canShoot = !stunned && this.dashT <= 0 && this.posing !== 'slash' && !this.scene.frozenInput;
    if (canShoot && (inp.shootHeld || inp.shoot)) {
      this.aimT = 0.3;
      this.aimAngle = aim;
    } else if (this.aimT > 0 && canShoot) {
      this.aimAngle = aim;
    }
    this.wantFire = false;
    if (canShoot) {
      if (this.cfg.shot.kind === 'pixel') {
        // Саняра: огонь очередью, а пока кнопка зажата — копится заряд; отпустила — пиксель-бомба.
        if (inp.shootHeld && this.cooldown <= 0) this.wantFire = 'normal';
        if (inp.shootHeld) {
          this.charge += dt;
          if (this.charge > 0.15) GS.Synth.charge(Math.min(1, this.charge / this.cfg.shot.chargeTime));
        } else {
          if (this.charge >= this.cfg.shot.chargeTime) this.wantFire = 'charged';
          this.charge = 0;
        }
      } else if (inp.shootHeld && this.cooldown <= 0) this.wantFire = 'normal';
    } else this.charge = 0;

    // ——— Выбор клипа ———
    this.chooseClip(dt, inp, dir, stunned);

    // Неуязвимость — мигание.
    this.rig.alpha = this.invuln > 0 && this.dashT <= 0 && Math.floor(this.invuln * 14) % 2 === 0 ? 0.3 : 1;

    this.syncRig(dt);

    // Заряд Саняры: бластер мигает, у дула собираются пиксели.
    const gun = this.rig.slots.gun.img;
    if (this.charge > 0.2) {
      const full = this.charge >= this.cfg.shot.chargeTime;
      gun.setTint(Math.floor(this.charge * (full ? 18 : 8)) % 2 ? 0xffffff : 0xd08cff);
      if (Math.random() < (full ? 0.7 : 0.3)) {
        const m = this.muzzle();
        this.scene.fx.burst(m.x + GS.util.rand(-6, 6), m.y + GS.util.rand(-6, 6), 1, full ? ['w', 'v'] : ['v']);
      }
    } else gun.clearTint();

    if (this.wantFire) this.fire(this.wantFire === 'charged');

    // Падение в пропасть.
    if (b.top > this.scene.worldH + 20) this.fellInPit();
  }

  chooseClip(dt, inp, dir, stunned) {
    const r = this.rig;
    const b = this.body;
    const moving = Math.abs(b.velocity.x) > 18;
    const busy = inp.shootHeld || inp.jumpHeld || inp.special || dir !== 0 || inp.up || inp.down;
    this.idleT = busy || moving || !this.onGround ? 0 : this.idleT + dt;
    let clip;
    this.armed = true;
    if (this.dashT > 0) { clip = 'dash'; this.armed = false; }
    else if (this.posing && this.poseT > 0) { clip = this.posing; this.armed = this.posing !== 'slash'; }
    else if (stunned) { clip = 'hurt'; this.armed = false; }
    else if (!this.onGround) clip = b.velocity.y < 0 ? 'jump' : 'fall';
    else if (this.landT > 0) clip = 'land';
    else if (moving) clip = 'run';
    else if (this.idleT > GS.TUNING.player.idleFidget && this.aimT <= 0) {
      clip = 'fidget';
      this.armed = this.hero === 'sanyara';
      if (!this.fidgetSaid) { this.fidgetSaid = true; this.say('fidget', { weak: true }); if (Math.random() < 0.5) this.scene.stickers && this.scene.stickers.show('idle'); }
    } else clip = 'idle';
    if (clip !== 'fidget') this.fidgetSaid = false;
    if (this.posing && this.poseT <= 0) {
      if (this.posing === 'slash') { r.showSlot('gun', true); r.setSlot('blade', null); }
      this.posing = null;
    }
    r.play(clip);
    r.timeScale = clip === 'run' ? Math.max(0.6, Math.abs(b.velocity.x) / GS.TUNING.player.runSpeed) : 1;
    r.showSlot('gun', this.armed || this.posing === 'grid');

    // Мимика: решимость при стрельбе, кофе — дёрганые зрачки.
    const shooting = this.aimT > 0;
    r.eyesOverride = stunned || clip === 'fidget' || clip === 'dash' ? null : shooting ? 'angry' : null;
    r.mouthOverride = stunned || clip === 'fidget' ? null : shooting && this.cooldown > this.cfg.shot.interval * 0.5 ? 'grit' : null;
    if (this.coffeeT > 0 && !shooting) r.eyesOverride = 'wide';
    // Голова и взгляд следуют за прицелом.
    if (shooting) {
      r.addRot.head = this.aimAngle < -0.3 ? -14 : this.aimAngle > 0.3 ? 12 : 0;
      r.look.x = Math.cos(this.aimAngle) * 1.4;
      r.look.y = Math.sin(this.aimAngle) * 1.4;
    } else {
      r.addRot.head = 0;
      this.lookT -= dt;
      if (this.lookT <= 0) { this.lookT = 0.3; this.lookTarget = this.scene.nearestEnemy(this.center.x, this.center.y, 160); }
      if (this.lookTarget && this.lookTarget.alive) {
        const dx = (this.lookTarget.sprite.x - this.center.x) * this.facing, dy = this.lookTarget.sprite.y - this.center.y;
        const d = Math.hypot(dx, dy) || 1;
        r.look.x = dx / d * 1.3; r.look.y = dy / d * 1.3;
      } else { r.look.x = this.coffeeT > 0 ? GS.util.rand(-1.5, 1.5) : 0.6; r.look.y = 0; }
    }
  }

  // Руки: IK к рукояти бластера (вызывается из рига после расчёта позы).
  applyArms() {
    const r = this.rig;
    if (!this.armed || !this.alive || this.dashT > 0) { r.ik.armF = null; r.ik.armB = null; r.worldRot.gun = null; return; }
    const sh = r.bones.armF;
    const aiming = this.aimT > 0;
    const a = aiming ? this.aimAngle : 0.5;
    const R = r.def.reach || 7;
    const reach = aiming ? R - this.recoil : R - 1;
    // Горизонтальная стрельба — «от бедра»: так пули попадают и в мелкое хрючево.
    const low = aiming && Math.abs(a) < 0.3 ? (r.def.hipLow || 6) : aiming ? 1 : 2;
    const gx = sh.wx + Math.cos(a) * reach, gy = sh.wy + Math.sin(a) * reach + low;
    r.ik.armF = { x: gx, y: gy, bend: -1 };
    r.worldRot.gun = a - Math.PI / 2;
    const clip = r.clipName;
    if (aiming || clip === 'idle' || clip === 'land') r.ik.armB = { x: gx + Math.cos(a) * 5, y: gy + Math.sin(a) * 5, bend: -1 };
    else r.ik.armB = null;
    if (this.hero === 'sanyara' && clip === 'fidget') r.ik.armB = null;
  }

  syncRig(dt, hidden = false) {
    const b = this.body;
    this.rig.x = Math.round(b.center.x);
    this.rig.y = Math.round(b.bottom);
    this.rig.facing = this.facing;
    this.rig.setVisible(!hidden);
    this.rig.tick(dt);
    this.shieldImg.setVisible(this.shield && !hidden && this.alive).setPosition(this.rig.x, this.rig.y - 22);
    if (this.shield) this.shieldImg.setAlpha(0.7 + Math.sin(this.scene.time.now / 120) * 0.2);
  }

  muzzle() {
    const mz = this.rig.def.muzzle || [2, 10];
    const p = this.rig.boneWorld('gun', mz[0], mz[1]);
    return p;
  }

  fire(charged = false) {
    const S = this.cfg.shot;
    const coffee = this.coffeeT > 0 ? GS.TUNING.coffee.fireMul : 1;
    this.cooldown = S.interval * coffee;
    this.aimT = 0.3;
    const a = this.aimAngle;
    const dx = Math.cos(a) * this.facing, dy = Math.sin(a);
    const m = this.muzzle();
    const kind = charged ? 'pixelBig' : S.kind;
    const shot = this.scene.shots.firePlayer(this, kind, m.x, m.y, dx, dy);
    // CAVEMAN: вдвое сильнее и крупнее.
    if (shot && this.relic === 'caveman') { shot.damage *= 2; shot.setScale(2); }
    this.recoil = charged ? 4 : 1.5;
    this.scene.fx.muzzle(m.x, m.y, GS.hex(this.cfg.color));
    if (kind === 'code') GS.Synth.shootCode();
    else if (kind === 'pixel') GS.Synth.shootPixel();
    else if (kind === 'pixelBig') { GS.Synth.chargeShot(); this.scene.fx.shake(80, 1); this.rig.squash(1.1, 0.92); this.body.velocity.x -= dx * 60; }
    else GS.Synth.shootRed();
    this.scene.stats.shots++;
  }

  special(inp) {
    const sp = this.cfg.special;
    const b = this.body;
    const flagKey = 'special_' + this.hero;
    if (!this.scene.flags[flagKey] && this.scene.stickers) {
      this.scene.flags[flagKey] = true;
      if (this.hero !== 'yurich') this.scene.stickers.show(this.hero === 'gennadich' ? 'special_g' : 'special_s', { force: true });
    }
    if (sp.kind === 'dash') {
      if (!this.onGround && !this.airDash) return;
      if (!this.onGround) this.airDash = false;
      this.dashT = sp.time;
      this.dashDir = this.facing;
      this.specialCd = sp.cooldown;
      b.setAllowGravity(false);
      b.velocity.y = 0;
      this.rig.squash(1.3, 0.8);
      this.scene.fx.ring(b.center.x, b.center.y, { color: 0x4fe03c, to: 1.2, ms: 200 });
      GS.Synth.dash();
      if (Math.random() < 0.35) this.say('special', { weak: true });
      this.scene.dashHits = this.scene.dashHits || new Set();
      this.dashHits = new Set();
    } else if (sp.kind === 'grid') {
      // С земли — прыжок со «стартовой» сеткой; в воздухе — сетка под ногами и второй прыжок.
      if (!this.onGround && !this.gridAir) return;
      this.specialCd = sp.cooldown;
      this.scene.spawnGrid(this, b.center.x, b.bottom + 1);
      if (this.onGround) { b.velocity.y = -GS.TUNING.player.jumpVelocity; this.jumping = true; this.coyote = 0; }
      else { this.gridAir = false; b.velocity.y = -sp.bounce; this.jumping = false; }
      this.posing = 'grid'; this.poseT = 0.3;
      this.rig.play('grid', { restart: true });
      GS.Synth.grid();
      if (Math.random() < 0.35) this.say('special', { weak: true });
    } else if (sp.kind === 'katana') {
      this.specialCd = sp.cooldown;
      this.posing = 'slash'; this.poseT = 0.28;
      this.rig.play('slash', { restart: true });
      this.rig.showSlot('gun', false);
      this.rig.setSlot('blade', '/hero/katana');
      b.velocity.x = this.facing * sp.lunge;
      GS.Synth.slash();
      this.scene.time.delayedCall(60, () => this.scene.katanaHit(this));
      if (Math.random() < 0.3) this.say('special', { weak: true });
    }
  }

  standingOnOneway() {
    const b = this.body;
    return this.scene.isOnewayAt(b.left + 1, b.bottom + 2) || this.scene.isOnewayAt(b.right - 1, b.bottom + 2) || this.scene.onGrid(this);
  }

  // ——— Урон и смерть ———
  // TDD: цикл «красный — зелёный»; в зелёной фазе урон не проходит.
  get tddGreen() { return this.relic === 'tdd' && Math.floor(this.relicT * GS.TUNING.church.tddRate) % 2 === 0; }

  giveRelic(kind) {
    const R = GS.RELICS[kind];
    this.relic = kind;
    this.relicT = GS.TUNING.church.relicTime;
    if (kind === 'diagnose') this.scene.diagnoseT = this.relicT;
    GS.Synth.artifact();
    this.scene.fx.ring(this.center.x, this.center.y, { color: 0xffd84a, to: 2.2, ms: 400 });
    this.say(R.say, { priority: true });
    if (this.scene.hud) this.scene.hud.banner(R.title, '#ffd84a', R.sub);
    if (this.scene.stickers) this.scene.stickers.show('relic');
  }

  hurt(amount = 1, fromX = null) {
    if (!this.canBeHit) return false;
    if (this.tddGreen) {
      this.invuln = 0.4;
      GS.Synth.shield();
      this.scene.fx.ring(this.center.x, this.center.y - 6, { color: 0x4fe03c, to: 1.4, ms: 200 });
      this.scene.fx.pop(this.center.x, this.center.y - 28, 'ТЕСТЫ ЗЕЛЁНЫЕ!', { color: '#4fe03c', rise: 12, ms: 500 });
      return true;
    }
    const T = GS.TUNING.player;
    if (this.shield) {
      this.shield = false;
      this.invuln = 0.8;
      GS.Synth.shield();
      this.scene.fx.burst(this.center.x, this.center.y, 12, ['v', 'w']);
      this.scene.fx.ring(this.center.x, this.center.y - 6, { color: 0xb08cff, to: 1.6 });
      return true;
    }
    this.hp -= amount;
    this.scene.stats.hits++;
    GS.Synth.hurt();
    this.scene.fx.shake(160, 3);
    this.scene.fx.hitstop(60);
    this.scene.fx.burst(this.center.x, this.center.y, 8, ['w', 'r']);
    this.charge = 0;
    if (this.hp <= 0) { this.die(); return true; }
    this.invuln = T.invulnTime;
    this.hurtT = T.hurtStun;
    const side = fromX === null ? -this.facing : Math.sign(this.center.x - fromX) || -this.facing;
    this.body.velocity.x = side * T.knockbackX;
    this.body.velocity.y = -T.knockbackY;
    this.dashT = 0;
    this.body.setAllowGravity(true);
    this.rig.play('hurt', { restart: true });
    if (Math.random() < 0.5) this.say('hurt', { weak: true });
    if (Math.random() < 0.3 && this.scene.stickers) this.scene.stickers.show('hurt');
    return true;
  }

  // Страйк Копирайт-бота: копятся, на третьем — минус жизнь.
  addStrike(x) {
    this.strikes = (this.strikes || 0) + 1;
    const max = GS.TUNING.suno.strikes;
    GS.Synth.denied();
    this.scene.fx.pop(this.center.x, this.center.y - 30, `СТРАЙК ${this.strikes}/${max}`, { color: '#ff5a4a' });
    if (this.strikes < max) return;
    this.strikes = 0;
    if (this.hurt(1, x)) this.say('ТРЕК ЗАБЛОКИРОВАЛИ!', { priority: true });
  }

  // Ускоритель CDN.
  boost() {
    if (this.boostT <= 0) { GS.Synth.dash(); this.scene.fx.ring(this.body.center.x, this.body.bottom - 4, { color: 0x3cd8f8, to: 1.2, ms: 180 }); }
    this.boostT = GS.TUNING.race.boostTime;
    this.facing = 1;
    this.body.velocity.x = Math.max(this.body.velocity.x, GS.TUNING.player.runSpeed * GS.TUNING.race.boostMul);
  }

  // Батут: подброс без среза высоты, двойной прыжок снова доступен.
  launch(v) {
    // Предел maxFall действует и вверх — на время подброса поднимаем его, иначе батут = обычный прыжок.
    this.body.setMaxVelocityY(Math.max(GS.TUNING.maxFall, v));
    this.body.velocity.y = -v;
    this.jumping = false;
    this.coyote = 0;
    this.airJumps = this.cfg.airJumps || 0;
    GS.Synth.jump();
    this.rig.play('jump', { restart: true });
  }

  fellInPit() {
    if (!this.alive) return;
    this.hp -= GS.TUNING.player.pitDamage;
    GS.Synth.hurt();
    this.scene.fx.flash(120, 0x000000, 0.5);
    if (this.hp <= 0) { this.die(true); return; }
    this.body.reset(this.lastSafe.x, this.lastSafe.y - GS.TUNING.player.bodyH / 2 - 2);
    this.invuln = 1.2;
    this.rig.play('respawn', { restart: true });
    this.say('ОЙ. ЭТО БЫЛ НЕ ПОЛ.', { priority: true });
  }

  die(fell = false) {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    this.deadT = 0;
    this.dashT = 0;
    this.shield = false;
    this.coffeeT = 0;
    this.scene.stats.deaths++;
    GS.Synth.die();
    this.rig.alpha = 1;
    this.rig.ik = {}; this.rig.worldRot = {}; this.rig.addRot = {};
    this.rig.eyesOverride = null; this.rig.mouthOverride = null;
    this.rig.showSlot('gun', true);
    this.rig.play('die', { restart: true });
    const b = this.body;
    b.checkCollision.none = true;
    b.setAllowGravity(true);
    b.setGravityY(0);
    if (!fell) { b.setVelocity(-this.facing * 60, -330); this.spin = 0; }
    else b.setVelocity(0, 0);
    this.fellDeath = fell;
    this.scene.fx.shake(250, 4);
    this.say('die', { priority: true });
    if (this.scene.stickers) this.scene.stickers.show('die');
    this.scene.onPlayerDeath(this);
  }

  updateDead(dt) {
    this.deadT += dt;
    const b = this.body;
    if (this.bubbleState) { this.updateBubble(dt); return; }
    if (!this.fellDeath) this.rig.angle += 540 * dt * -this.facing * this.rig.scaleX;
    this.syncRig(dt, this.fellDeath);
    if (this.deadT > 1.1 && !this.waitingRespawn) {
      this.waitingRespawn = true;
      this.scene.requestRespawn(this);
    }
    void b;
  }

  // Кооп: пузырь-портал летит к живому напарнику; коснись — и герой вернётся.
  enterBubble(x, y) {
    this.bubbleState = { x, y, vx: 0, vy: 0, t: 0 };
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.rig.angle = 0;
    this.rig.play('fall');
    this.bubbleImg = this.scene.add.image(x, y, 'obj/bubble').setDepth(32);
    this.waitingRespawn = false;
  }

  updateBubble(dt) {
    const s = this.bubbleState;
    s.t += dt;
    const mate = this.scene.players.find((p) => p !== this && p.alive && !p.bubbleState);
    if (mate) {
      const tx = mate.center.x - mate.facing * 26, ty = mate.center.y - 34;
      s.vx += ((tx - s.x) * 3 - s.vx * 2.5) * dt;
      s.vy += ((ty - s.y) * 3 - s.vy * 2.5) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      const touch = Math.hypot(mate.center.x - s.x, mate.center.y - s.y) < 26;
      if ((touch && s.t > 0.6) || s.t > GS.TUNING.reviveTime + 1.2) {
        this.respawn(s.x, s.y + 18, 3);
        mate.say('revive', { priority: true });
        if (this.scene.stickers) this.scene.stickers.show(mate.hero === 'gennadich' ? 'revive_g' : mate.hero === 'sanyara' ? 'revive_s' : 'respawn');
        this.scene.addTeam(GS.TUNING.team.perRevive);
        return;
      }
    }
    s.y += Math.sin(s.t * 4) * 0.2;
    this.bubbleImg.setPosition(Math.round(s.x), Math.round(s.y)).setScale(1 + Math.sin(s.t * 6) * 0.05);
    this.rig.x = Math.round(s.x); this.rig.y = Math.round(s.y + 16);
    this.rig.facing = this.facing;
    this.rig.setVisible(true);
    this.rig.tick(dt);
    this.body.reset(s.x, s.y);
  }

  respawn(x, y, hp = this.maxHp) {
    if (this.bubbleImg) {
      this.scene.fx.burst(this.bubbleImg.x, this.bubbleImg.y, 14, ['g', 'w']);
      this.scene.fx.ring(this.bubbleImg.x, this.bubbleImg.y, { color: 0xb4ff5a, to: 2 });
      this.bubbleImg.destroy();
      this.bubbleImg = null;
    }
    this.bubbleState = null;
    this.alive = true;
    this.waitingRespawn = false;
    this.hp = hp;
    this.invuln = 2;
    this.hurtT = 0;
    this.fellDeath = false;
    const b = this.body;
    b.checkCollision.none = false;
    b.setAllowGravity(true);
    b.reset(x, y - GS.TUNING.player.bodyH / 2);
    this.rig.angle = 0;
    this.rig.setVisible(true);
    this.rig.play('respawn', { restart: true });
    this.lastSafe = { x, y };
    GS.Synth.respawn();
    this.scene.fx.ring(x, y - 16, { color: 0x4fe03c, to: 2.2 });
    this.scene.fx.burst(x, y - 16, 12, ['g', 'w', 'v']);
    this.say('respawn', { priority: true });
  }

  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

  destroy() {
    this.rig.destroy();
    this.sprite.destroy();
    this.shieldImg.destroy();
    if (this.bubbleImg) this.bubbleImg.destroy();
  }
};
