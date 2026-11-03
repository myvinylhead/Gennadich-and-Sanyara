// Клод-мех: герой садится в кабину. Тяжёлый топот, пушка-кулак и CODE BLADE.
GS.Mech = class Mech {
  constructor(scene, player, x, y) {
    const M = GS.TUNING.mech;
    this.scene = scene;
    this.player = player;
    this.armor = M.armor;
    this.time = M.time;
    this.facing = player.facing;
    this.sprite = scene.physics.add.sprite(x, y - 30, 'px').setVisible(false);
    this.sprite.body.setSize(26, 58);
    this.sprite.body.setMaxVelocityY(GS.TUNING.maxFall);
    this.sprite.mech = this;
    this.rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.mech(player.hero), '').setDepth(31);
    const pilot = this.rig.slots.pilot.img;
    pilot.setCrop(5, 4, 17, 13);
    this.rig.slots.pilot.x = -1; this.rig.slots.pilot.y = -12;
    this.cooldown = 0;
    this.bladeCd = 0;
    this.slashT = 0;
    this.hitCd = 0;
    this.wasGround = false;
    this.fallV = 0;
    this.voice = 0.6;
    this.blink = 0;
    this.rig.on('ev', (e) => { if (e === 'stomp' && this.onGround) this.step(); });
    this.rig.play('stomp', { restart: true });
    scene.fx.shake(300, 4);
    this.intro = 0.6;
  }

  get body() { return this.sprite.body; }
  get center() { return this.body.center; }
  headPoint() { return { x: this.rig.x, y: this.rig.y - 72 }; }

  step() {
    GS.Synth.stomp();
    this.scene.fx.shake(90, 1.5);
    this.scene.fx.puff(this.center.x + this.facing * 6, this.body.bottom, 3, 0xd0c0a0);
    // Давит багов и мелочь под ногами.
    this.scene.enemies.forEach((e) => {
      if (!e.alive) return;
      const c = e.center;
      if (Math.abs(c.x - this.center.x) < 22 && Math.abs(e.sprite.body.bottom - this.body.bottom) < 10) e.hit(3, this.center.x, null);
    });
  }

  update(dt, inp) {
    const M = GS.TUNING.mech;
    const b = this.body;
    const p = this.player;
    this.onGround = b.blocked.down || b.touching.down;
    this.time -= dt;
    this.cooldown -= dt;
    this.bladeCd -= dt;
    this.slashT -= dt;
    this.hitCd -= dt;
    this.intro -= dt;

    const dir = this.intro > 0 ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) this.facing = dir;
    b.velocity.x = GS.util.approach(b.velocity.x, dir * M.runSpeed, (this.onGround ? 900 : 500) * dt);
    if (inp.jump && this.onGround && this.intro <= 0) { b.velocity.y = -M.jumpVelocity; GS.Synth.jump(); this.rig.squash(0.85, 1.15); }
    if (!inp.jumpHeld && b.velocity.y < 0) b.velocity.y *= 0.9;
    if (this.onGround && !this.wasGround && this.fallV > 150) {
      // Приземление — ударная волна.
      this.rig.squash(1.25, 0.78);
      this.rig.play('stomp', { restart: true });
      GS.Synth.stomp();
      this.scene.fx.shake(220, 4);
      this.scene.fx.ring(this.center.x, b.bottom, { color: 0xffb03a, to: 2.5, ms: 260 });
      this.scene.fx.smoke(this.center.x, b.bottom, 6);
      this.scene.enemies.forEach((e) => {
        if (e.alive && Math.abs(e.center.x - this.center.x) < 60 && Math.abs(e.center.y - b.bottom) < 40) e.hit(4, this.center.x, null);
      });
    }
    this.fallV = b.velocity.y;
    this.wasGround = this.onGround;
    // Точка возврата для пилота, если мех упадёт в пропасть.
    this.safeT = (this.safeT || 0) - dt;
    if (this.onGround && this.safeT <= 0 && this.scene.isSafeGround(b.center.x, b.bottom + 2)) { p.lastSafe = { x: b.center.x, y: b.bottom }; this.safeT = 0.3; }

    // Пушка.
    if (inp.shootHeld && this.cooldown <= 0 && this.intro <= 0) {
      this.cooldown = M.shot.interval;
      let ay = inp.up ? -1 : inp.down && !this.onGround ? 1 : 0;
      const ax = ay === 0 || inp.left || inp.right ? 1 : 0;
      const a = Math.atan2(ay, ax);
      const m = this.rig.boneWorld('handB', 0, 4);
      const dx = Math.cos(a) * this.facing, dy = Math.sin(a);
      this.scene.shots.firePlayer(p, 'mech', m.x + dx * 8, m.y + dy * 8, dx, dy, { speed: M.shot.speed });
      this.scene.fx.muzzle(m.x + dx * 8, m.y + dy * 8, 0xffb03a);
      GS.Synth.mechShot();
      this.rig.addRot.armB = -70;
      this.rig.squash(1.03, 0.98);
    } else this.rig.addRot.armB = (this.rig.addRot.armB || 0) * 0.8;

    // CODE BLADE.
    if (inp.special && this.bladeCd <= 0 && this.intro <= 0) {
      this.bladeCd = M.blade.cooldown;
      this.slashT = 0.35;
      this.rig.play('slash', { restart: true });
      GS.Synth.blade();
      this.scene.time.delayedCall(70, () => this.bladeHit());
      if (Math.random() < 0.4) this.scene.chatter.say(this, GS.util.pick(['CODE BLADE!', 'РЕФАКТОРИНГ!', 'DEPLOY!']), { weak: true });
    }

    let clip = 'idle';
    if (this.slashT > 0) clip = 'slash';
    else if (!this.onGround) clip = 'jump';
    else if (this.rig.clipName === 'stomp' && !this.rig.clipDone) clip = 'stomp';
    else if (Math.abs(b.velocity.x) > 15) clip = 'walk';
    this.rig.play(clip);
    this.rig.x = Math.round(b.center.x);
    this.rig.y = Math.round(b.bottom);
    this.rig.facing = this.facing;
    this.blink -= dt;
    this.rig.alpha = this.blink > 0 && Math.floor(this.blink * 14) % 2 ? 0.4 : 1;
    if (this.time < 3 && Math.floor(this.time * 6) % 2 === 0) this.rig.setTintAll(0xffb03a); else if (this.time < 3) this.rig.setTintAll(null);
    this.rig.tick(dt);

    // Пилот «сидит» в кабине: физическое тело героя едет вместе с мехом.
    p.body.reset(b.center.x, b.center.y);
    if (b.top > this.scene.worldH) this.armor = 0; // упал в пропасть — пилот катапультируется
    if (this.time <= 0 || this.armor <= 0) this.eject();
  }

  bladeHit() {
    const R = GS.TUNING.mech.blade.range;
    const cx = this.center.x + this.facing * R * 0.6, cy = this.center.y - 6;
    this.scene.fx.ring(cx, cy, { color: 0xffb03a, to: 2.2, ms: 200 });
    this.scene.fx.burst(cx, cy, 10, ['o', 'y']);
    this.scene.enemies.forEach((e) => {
      if (!e.alive) return;
      const c = e.center;
      if (Math.abs(c.x - cx) < R * 0.8 && Math.abs(c.y - cy) < 36) e.hit(GS.TUNING.mech.blade.damage, this.center.x, null);
    });
    if (this.scene.boss && this.scene.boss.alive) {
      const c = this.scene.boss.center;
      if (Math.abs(c.x - cx) < R + 30 && Math.abs(c.y - cy) < 50) this.scene.boss.hit(GS.TUNING.mech.blade.damage, this.center.x, null);
    }
    this.scene.shots.enemy.children.each((s) => { if (s.active && Math.abs(s.x - cx) < R && Math.abs(s.y - cy) < 36) this.scene.shots.kill(s); });
    this.scene.fx.shake(120, 2);
  }

  hurt(dmg = 1) {
    if (this.hitCd > 0) return;
    this.hitCd = 0.6;
    this.blink = 0.6;
    this.armor -= dmg;
    GS.Synth.hit();
    this.scene.fx.sparks(this.center.x, this.center.y - 10, 6, 0xffb03a);
    this.scene.fx.shake(100, 2);
  }

  eject() {
    if (this.done) return;
    this.done = true;
    const sc = this.scene;
    const p = this.player;
    const c = this.center;
    sc.fx.burst(c.x, c.y, 30, ['o', 'y', 'w']);
    sc.fx.smoke(c.x, c.y, 10);
    sc.fx.ring(c.x, c.y, { color: 0xffb03a, to: 3 });
    GS.Synth.explosion(true);
    sc.fx.shake(300, 5);
    // Детали меха разлетаются.
    this.rig.slotList.forEach((s) => {
      if (!s.img.visible) return;
      const m = s.img.getWorldTransformMatrix();
      const piece = sc.add.image(m.tx, m.ty, s.img.texture.key).setDepth(32).setRotation(s.img.rotation);
      sc.tweens.add({ targets: piece, x: piece.x + GS.util.rand(-90, 90), y: piece.y + GS.util.rand(-60, 30) + 140, angle: GS.util.rand(-400, 400), alpha: 0, duration: 1100, ease: 'Quad.in', onComplete: () => piece.destroy() });
    });
    this.rig.destroy();
    this.sprite.destroy();
    p.inMech = null;
    p.body.checkCollision.none = false;
    p.body.setAllowGravity(true);
    p.body.reset(c.x, c.y - 10);
    p.body.setVelocity(0, -300);
    p.invuln = 1.5;
    p.rig.setVisible(true);
    sc.chatter.say(p, GS.util.pick(['ГОТОВО К КОМПИЛЯЦИИ!', 'МЕХ — ВСЁ. ЕЩЁ ХОЧУ!', 'LET\'S SHIP!']), { priority: true });
    sc.mechs = sc.mechs.filter((m) => m !== this);
  }
};
