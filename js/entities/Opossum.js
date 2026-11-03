// Босс: Опоссум-Макс, «Ошибка генерации». Три фазы, у каждой — свой набор атак.
GS.Opossum = class Opossum {
  constructor(scene, x, y) {
    const B = GS.TUNING.boss;
    this.scene = scene;
    this.maxHp = B.hp * (scene.players.length > 1 ? B.coopMul : 1);
    this.hp = this.maxHp;
    this.alive = true;
    this.sprite = scene.physics.add.sprite(x, y - 25, 'px').setVisible(false);
    this.sprite.body.setSize(64, 46);
    this.sprite.body.setMaxVelocityY(500);
    this.sprite.boss = this;
    this.rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.opossum(), '').setDepth(26);
    this.rig.on('ev', (e) => { if (e === 'step' && this.onGround) { GS.Synth.stomp(); scene.fx.shake(60, 1); scene.fx.puff(this.center.x, this.body.bottom, 2); } });
    this.facing = -1;
    this.state = 'sleep';
    this.stateT = 0;
    this.t = 0;
    this.flashT = 0;
    this.voice = 0.45;
    this.phase = 1;
    this.lastAttack = null;
    this.laser = scene.add.graphics().setDepth(27);
    this.warn = scene.add.graphics().setDepth(5);
    this.aura = scene.add.particles(0, 0, 'fx/bit_g', { lifespan: 600, speed: { min: 10, max: 40 }, scale: { start: 1, end: 0 }, frequency: 60, emitting: true }).setDepth(25);
    this.contact = 1;
    this.rig.play('idle');
  }

  get body() { return this.sprite.body; }
  get center() { return this.body.center; }
  headPoint() { const h = this.rig.boneWorld('head', 14, -14); return { x: h.x, y: h.y - 6 }; }
  get onGround() { return this.body.blocked.down; }

  start() {
    this.state = 'intro';
    this.stateT = 2.4;
    this.rig.play('roar', { restart: true });
    GS.Synth.roar();
    this.scene.fx.shake(1200, 4);
    this.scene.chatter.say(this, 'О Ш И Б К А   Г Е Н Е Р А Ц И И !', { priority: true, time: 2.2 });
    if (this.scene.stickers) this.scene.stickers.show('boss', { force: true });
  }

  hit(dmg, fromX, src) {
    if (!this.alive || this.state === 'sleep' || this.state === 'intro' || this.state === 'gone') return false;
    // Голова — слабое место.
    let mul = 1;
    if (src) {
      const h = this.rig.boneWorld('head', 16, -2);
      if (Math.hypot(src.x - h.x, src.y - h.y) < 18) { mul = 1.5; this.scene.fx.sparks(src.x, src.y, 3, 0xffd84a); }
    }
    this.hp -= dmg * mul;
    this.flashT = 0.06;
    this.rig.setTintAll(0xffffff);
    GS.Synth.hit();
    this.scene.addTeam(GS.TUNING.team.perHit * 0.5);
    const frac = this.hp / this.maxHp;
    if (this.phase === 1 && frac < 0.66) this.nextPhase(2);
    else if (this.phase === 2 && frac < 0.33) this.nextPhase(3);
    if (this.hp <= 0) this.die();
    return true;
  }

  nextPhase(n) {
    this.phase = n;
    this.state = 'roar';
    this.stateT = 1.4;
    this.body.setVelocityX(0);
    this.rig.play('roar', { restart: true });
    GS.Synth.roar();
    this.scene.fx.shake(800, 4);
    this.scene.fx.glitch(600, 1.5);
    this.scene.chatter.say(this, n === 2 ? 'ПРОМПТ ОБНОВЛЁН: БОЛЬШЕ ХАОСА!' : 'ОПОССУМ-МАКС. МАКСИМУМ.', { priority: true, time: 2 });
    if (n === 3) this.aura.setConfig ? null : null;
    this.scene.onBossPhase(n);
  }

  pickAttack() {
    const p = this.target();
    const dist = p ? Math.abs(p.center.x - this.center.x) : 200;
    const pool = { 1: ['charge', 'leap', 'charge', 'roar'], 2: ['charge', 'leap', 'popups', 'glitch', 'roar'], 3: ['charge', 'leap', 'popups', 'glitch', 'laser', 'laser', 'debris'] }[this.phase];
    let a = GS.util.pick(pool.filter((x) => x !== this.lastAttack));
    if (dist < 50 && Math.random() < 0.5) a = 'leap';
    this.lastAttack = a;
    return a;
  }

  target() {
    const alive = this.scene.players.filter((p) => p.alive && !p.bubbleState);
    if (!alive.length) return null;
    return alive.reduce((a, b) => (Math.abs(a.center.x - this.center.x) < Math.abs(b.center.x - this.center.x) ? a : b));
  }

  setState(s, t) { this.state = s; this.stateT = t; this.sub = 0; }

  update(dt) {
    this.t += dt;
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.rig.setTintAll(this.phase === 3 ? 0xffb0a0 : null); }
    const b = this.body;
    const sc = this.scene;
    this.stateT -= dt;
    this.laser.clear();
    this.warn.clear();
    const p = this.target();
    const speedMul = this.phase === 3 ? 1.25 : 1;
    this.contact = 1;

    switch (this.state) {
      case 'sleep':
        this.rig.play('idle');
        b.velocity.x = 0;
        break;
      case 'intro':
      case 'roar':
        b.velocity.x *= 0.85;
        if (Math.random() < 0.3) sc.fx.burst(this.headPoint().x, this.headPoint().y + 10, 2, ['g', 'p']);
        if (this.state === 'roar' && this.sub === 0 && this.stateT < 0.8) {
          this.sub = 1;
          if (this.phase < 3 || Math.random() < 0.5) {
            const n = this.phase === 1 ? 2 : 3;
            for (let i = 0; i < n; i++) sc.time.delayedCall(i * 250, () => sc.spawnMinion(GS.util.rand(80, GS.W - 80), 120));
          } else this.dropDebris(5);
        }
        if (this.stateT <= 0) { this.setState('idle', 0.7 / speedMul); this.rig.play('idle'); }
        break;
      case 'idle':
        this.rig.play('idle');
        b.velocity.x *= 0.8;
        if (p) this.facing = p.center.x < this.center.x ? -1 : 1;
        if (this.stateT <= 0 && this.onGround) {
          const a = this.pickAttack();
          if (a === 'charge') { this.setState('chargeWind', 0.55 / speedMul); this.rig.play('crouch', { restart: true }); GS.Synth.warn(); }
          else if (a === 'leap') { this.setState('leapWind', 0.45 / speedMul); this.rig.play('crouch', { restart: true }); }
          else if (a === 'roar') { this.setState('roar', 1.6); this.rig.play('roar', { restart: true }); GS.Synth.roar(); sc.fx.shake(700, 3); this.scene.chatter.say(this, GS.util.pick(['ХРЮЧЕВО, КО МНЕ!', 'ГЕНЕРИРУЮ ПОМОЩЬ!', 'ПРОВЕРЬ ЛОГИ!']), { weak: true }); }
          else if (a === 'popups') { this.setState('popups', 1.4); this.rig.play('roar', { restart: true }); }
          else if (a === 'glitch') { this.setState('glitchOut', 0.5); GS.Synth.glitch(); }
          else if (a === 'laser') { this.setState('laserWind', 0.8); this.laserY = Math.random() < 0.5 ? 'low' : 'high'; this.rig.play('crouch', { restart: true }); GS.Synth.warn(); }
          else if (a === 'debris') { this.setState('roar', 1.4); this.sub = 1; this.rig.play('roar', { restart: true }); this.dropDebris(7); GS.Synth.roar(); }
        }
        break;
      case 'chargeWind':
        b.velocity.x = -this.facing * 15;
        if (Math.floor(this.stateT * 12) % 2) this.rig.setTintAll(0xff8080); else this.rig.setTintAll(null);
        if (this.stateT <= 0) { this.setState('charge', 2.2); this.rig.setTintAll(null); this.rig.play('run'); this.rig.timeScale = 1.6; }
        break;
      case 'charge':
        this.contact = 2;
        b.velocity.x = this.facing * 250 * speedMul;
        if (Math.random() < 0.4) sc.fx.puff(this.center.x - this.facing * 20, b.bottom, 1);
        if (b.blocked.left || b.blocked.right || this.stateT <= 0) {
          sc.fx.shake(200, 3);
          GS.Synth.stomp();
          sc.fx.stars(this.center.x + this.facing * 30, b.top, 5);
          b.velocity.x = -this.facing * 120; b.velocity.y = -150;
          this.rig.timeScale = 1;
          this.setState('idle', this.phase === 1 ? 1.1 : 0.7);
        }
        break;
      case 'leapWind':
        if (this.stateT <= 0 && p) {
          const dx = GS.util.clamp(p.center.x - this.center.x, -260, 260);
          const tFlight = 0.9;
          b.velocity.x = dx / tFlight;
          b.velocity.y = -0.5 * GS.TUNING.gravity * tFlight;
          this.facing = dx < 0 ? -1 : 1;
          this.setState('leap', 3);
          this.rig.play('air');
          this.rig.squash(0.85, 1.2);
          GS.Synth.jump();
        } else if (this.stateT <= 0) this.setState('idle', 0.5);
        break;
      case 'leap':
        this.contact = 2;
        if (this.onGround && b.velocity.y >= 0 && this.stateT < 2.8) {
          b.velocity.x = 0;
          this.rig.play('crouch', { restart: true });
          this.rig.squash(1.3, 0.75);
          sc.fx.shake(300, 5);
          sc.fx.ring(this.center.x, b.bottom, { color: 0x4fe03c, to: 3, ms: 300 });
          sc.fx.smoke(this.center.x, b.bottom, 8);
          GS.Synth.explosion();
          const waveSpeed = 170 + this.phase * 25;
          sc.shots.fireEnemy('wave', this.center.x - 30, b.bottom - 6, -waveSpeed, 0, { damage: 1 });
          sc.shots.fireEnemy('wave', this.center.x + 30, b.bottom - 6, waveSpeed, 0, { damage: 1 });
          this.setState('idle', this.phase === 1 ? 1.0 : 0.6);
        }
        break;
      case 'popups':
        b.velocity.x *= 0.85;
        if (this.sub < 5 && this.stateT < 1.2 - this.sub * 0.18) {
          const h = this.headPoint();
          const a = -Math.PI / 2 + this.facing * (0.35 + this.sub * 0.28);
          sc.shots.fireEnemy(this.phase === 3 ? 'glitch' : 'ok', h.x + this.facing * 18, h.y + 10, Math.cos(a) * 150, Math.sin(a) * 150 + 40, { gravity: false });
          GS.Synth.popupOpen();
          this.sub++;
        }
        if (this.stateT <= 0) this.setState('idle', 0.6);
        break;
      case 'glitchOut':
        this.rig.alpha = Math.random() < 0.5 ? 0.2 : 1;
        this.rig.x += GS.util.randInt(-3, 3);
        if (this.stateT <= 0) {
          this.setState('gone', 0.6);
          this.rig.setVisible(false);
          this.aura.emitting = false;
          b.enable = false;
          sc.fx.burst(this.center.x, this.center.y, 20, ['g', 'p', 'c']);
          sc.fx.glitch(300);
        }
        return;
      case 'gone':
        if (this.stateT <= 0) {
          const tx = p ? (p.center.x < GS.W / 2 ? GS.W - 110 : 110) : GS.W / 2;
          b.enable = true;
          b.reset(tx, 80);
          this.rig.setVisible(true);
          this.rig.alpha = 1;
          this.aura.emitting = true;
          sc.fx.burst(tx, 80, 20, ['g', 'p', 'c']);
          sc.fx.glitch(250);
          this.setState('leap', 3);
          this.rig.play('air');
        }
        return;
      case 'laserWind': {
        b.velocity.x *= 0.8;
        const ly = this.laserLineY();
        this.warn.fillStyle(0xff5a4a, Math.floor(this.stateT * 16) % 2 ? 0.5 : 0.2);
        this.warn.fillRect(0, ly - 1, GS.W, 2);
        if (this.stateT <= 0) { this.setState('laser', 0.9); GS.Synth.laser(); }
        break;
      }
      case 'laser': {
        const ly = this.laserLineY();
        const e = this.rig.boneWorld('head', 16, -4);
        const x0 = e.x, x1 = this.facing > 0 ? GS.W + 20 : -20;
        this.laser.fillStyle(0xff5a4a, 1).fillRect(Math.min(x0, x1), ly - 4, Math.abs(x1 - x0), 8);
        this.laser.fillStyle(0xffe0a0, 1).fillRect(Math.min(x0, x1), ly - 1, Math.abs(x1 - x0), 2);
        this.laser.lineStyle(1, 0xff5a4a, 1).lineBetween(e.x, e.y, e.x + this.facing * 10, ly);
        sc.fx.shake(30, 1);
        sc.players.forEach((pl) => {
          if (!pl.canBeHit) return;
          const pb = pl.body;
          const inX = this.facing > 0 ? pb.right > x0 : pb.left < x0;
          if (inX && pb.top < ly + 4 && pb.bottom > ly - 4) pl.hurt(1, this.center.x);
        });
        if (this.stateT <= 0) this.setState('idle', 0.6);
        break;
      }
      case 'dying':
        b.velocity.x = 0;
        if (Math.random() < 0.25) {
          const x = this.center.x + GS.util.rand(-40, 40), y = this.center.y + GS.util.rand(-30, 20);
          sc.fx.burst(x, y, 10, ['g', 'p', 'w', 'o']);
          sc.fx.ring(x, y, { color: 0xff8a2a, to: 1.2, ms: 200 });
          GS.Synth.explosion();
        }
        this.rig.x += GS.util.randInt(-2, 2);
        if (this.stateT <= 0) { this.finish(); return; }
        break;
      default: break;
    }

    if (this.state !== 'charge' && this.state !== 'leap' && p && this.onGround && this.state === 'idle') this.facing = p.center.x < this.center.x ? -1 : 1;
    this.rig.x = Math.round(b.center.x);
    this.rig.y = Math.round(b.bottom);
    this.rig.facing = this.facing;
    if (p) { const dx = (p.center.x - this.center.x) * this.facing; this.rig.look.x = Math.sign(dx); }
    this.rig.tick(dt);
    this.aura.setPosition(this.center.x + GS.util.rand(-30, 30), this.center.y + GS.util.rand(-20, 10));
  }

  laserLineY() {
    const floor = this.scene.floorY || (GS.H - 32);
    return this.laserY === 'low' ? floor - 10 : floor - 44;
  }

  dropDebris(n) {
    const sc = this.scene;
    for (let i = 0; i < n; i++) {
      const x = GS.util.rand(40, GS.W - 40);
      sc.time.delayedCall(i * 220, () => {
        const w = sc.add.graphics().setDepth(4);
        const floor = sc.floorY || GS.H - 32;
        let t = 0;
        const ev = sc.time.addEvent({ delay: 50, repeat: 12, callback: () => { t++; w.clear(); w.fillStyle(0xff5a4a, t % 2 ? 0.6 : 0.25).fillRect(x - 6, floor - 2, 12, 2); if (t >= 12) { w.destroy(); ev.remove(); } } });
        sc.time.delayedCall(450, () => sc.shots.fireEnemy('cube', x, -10, GS.util.rand(-20, 20), 60, { damage: 1 }));
      });
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    this.setState('dying', 2.4);
    this.rig.play('dead', { restart: true });
    this.rig.setTintAll(null);
    this.laser.clear(); this.warn.clear();
    this.body.setVelocity(0, 0);
    GS.Synth.roar();
    this.scene.fx.shake(2400, 3);
    this.scene.fx.hitstop(200);
    this.scene.chatter.say(this, 'СООБЩЕНИЕ ОТ ОПОССУМА: ПРОВЕРЬ ЛОГИ, ЛЮБИМЧИК. ЛЮБОЙ ОШИБКЕ НАЙДЁТСЯ ОПРАВДАНИЕ...', { priority: true, time: 3.5 });
    if (this.scene.stickers) this.scene.stickers.show('bossMsg', { force: true });
    this.scene.onBossDying();
  }

  finish() {
    const sc = this.scene;
    const c = this.center;
    this.state = 'dead';
    sc.fx.flash(400, 0xffffff, 0.9);
    sc.fx.burst(c.x, c.y, 50, ['g', 'p', 'w', 'v', 'o']);
    sc.fx.ring(c.x, c.y, { color: 0x4fe03c, to: 5, ms: 600 });
    GS.Synth.explosion(true);
    this.rig.destroy();
    this.aura.destroy();
    this.laser.destroy();
    this.warn.destroy();
    this.sprite.destroy();
    sc.onBossDefeated(c.x, c.y);
  }
};
