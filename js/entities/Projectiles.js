// Снаряды героев и врагов на общих физических группах с переиспользованием.
GS.Shots = class Shots {
  constructor(scene) {
    this.scene = scene;
    this.player = scene.physics.add.group({ allowGravity: false, maxSize: 140 });
    this.enemy = scene.physics.add.group({ allowGravity: false, maxSize: 140 });
  }

  spawn(group, tex, x, y, vx, vy, p = {}) {
    const s = group.get(x, y, tex);
    if (!s) return null;
    s.setTexture(tex);
    s.enableBody(true, x, y, true, true);
    s.setActive(true).setVisible(true).setDepth(p.depth ?? 40).setAlpha(1).setScale(p.scale ?? 1).setRotation(0).clearTint();
    s.body.setAllowGravity(!!p.gravity);
    s.body.setSize(p.w ?? s.width, p.h ?? s.height, true);
    s.body.setVelocity(vx, vy);
    s.body.setBounce(p.bounce || 0);
    s.body.setCollideWorldBounds(false);
    s.life = p.life ?? 1;
    s.damage = p.damage ?? 1;
    s.pierce = p.pierce || 0;
    s.hits = new Set();
    s.kind = p.kind || 'shot';
    s.owner = p.owner || null;
    s.fuse = p.fuse ?? 0;
    s.spin = p.spin || 0;
    s.wobble = p.wobble || 0;
    s.t = 0;
    s.baseVy = vy;
    if (p.rotate) s.setRotation(Math.atan2(vy, vx));
    return s;
  }

  firePlayer(owner, kind, x, y, dx, dy, mods = {}) {
    const H = owner.cfg.shot;
    const sp = (mods.speed ?? H.speed);
    let s;
    switch (kind) {
      case 'code':
        s = this.spawn(this.player, 'shot/code' + GS.util.randInt(0, 3), x, y, dx * sp, dy * sp, { life: H.life, damage: H.damage, w: 7, h: 6, kind, owner });
        if (s && dy !== 0 && dx !== 0) s.setRotation(Math.atan2(dy, dx) * 0.35);
        break;
      case 'pixel':
        s = this.spawn(this.player, 'shot/pixel', x, y, dx * sp, dy * sp, { life: H.life, damage: H.damage, kind, owner });
        break;
      case 'pixelBig':
        s = this.spawn(this.player, 'shot/pixelBig', x, y, dx * sp * 1.1, dy * sp * 1.1, { life: 1.1, damage: H.chargeDamage, pierce: 4, kind, owner, w: 11, h: 11, spin: 8 });
        break;
      case 'red':
        s = this.spawn(this.player, 'shot/red', x, y, dx * sp, dy * sp, { life: H.life, damage: H.damage, kind, owner, rotate: true, w: 6, h: 4 });
        break;
      case 'mech':
        s = this.spawn(this.player, 'shot/mech', x, y, dx * sp, dy * sp, { life: 0.9, damage: GS.TUNING.mech.shot.damage, kind, owner, rotate: true, w: 8, h: 5 });
        break;
      default:
        break;
    }
    return s;
  }

  fireEnemy(kind, x, y, vx, vy, p = {}) {
    const map = {
      slime: { tex: 'shot/slime', life: 3, w: 5, h: 5 },
      slimeG: { tex: 'shot/slimeG', life: 3, w: 5, h: 5 },
      grenade: { tex: 'shot/grenade', life: 4, w: 6, h: 6, gravity: true, bounce: 0.45, fuse: 1.5 },
      ok: { tex: 'shot/ok', life: 4, w: 13, h: 7 },
      cube: { tex: 'shot/cube', life: 4, w: 9, h: 9, gravity: true, damage: 1 },
      glitch: { tex: 'shot/glitch', life: 4, w: 7, h: 7, spin: 6 },
      wave: { tex: 'shot/wave', life: 3.5, w: 12, h: 12 },
      strike: { tex: 'shot/strike', life: 4, w: 9, h: 9, spin: 3, damage: 0 },
      pineapple: { tex: 'shot/pineapple', life: 4, w: 6, h: 6, gravity: true, spin: 9 },
      olive: { tex: 'shot/olive', life: 5, w: 6, h: 5 },
      cheese: { tex: 'shot/cheese', life: 3, w: 4, h: 6, gravity: true },
      scroll: { tex: 'shot/scroll', life: 4, w: 14, h: 8 },
      scrollTail: { tex: 'shot/scrollTail', life: 4, w: 14, h: 8 },
      token: { tex: 'shot/token', life: 2.5, w: 6, h: 6, spin: 8 },
      question: { tex: 'shot/question', life: 6, w: 8, h: 12 },
    };
    const d = map[kind];
    return this.spawn(this.enemy, d.tex, x, y, vx, vy, { ...d, ...p, kind, damage: p.damage ?? d.damage ?? 1 });
  }

  kill(s, fx = true) {
    if (!s.active) return;
    const fxm = this.scene.fx;
    if (fx && fxm) {
      if (s.kind === 'code') fxm.code(s.x, s.y, 2);
      else if (s.kind === 'pixel' || s.kind === 'pixelBig') fxm.burst(s.x, s.y, s.kind === 'pixelBig' ? 10 : 4, ['v', 'w']);
      else if (s.kind === 'slime') fxm.goo(s.x, s.y, 4);
      else if (s.kind === 'slimeG') fxm.goo(s.x, s.y, 4, true);
      else if (s.kind === 'grenade') this.explode(s.x, s.y);
      else if (s.kind === 'ok') { fxm.burst(s.x, s.y, 6, ['w', 'c']); }
      else fxm.sparks(s.x, s.y, 4);
    }
    s.disableBody(true, true);
  }

  explode(x, y, r = 26, dmg = 1) {
    const sc = this.scene;
    sc.fx.ring(x, y, { color: 0xff8a2a, to: 1.8, ms: 260 });
    sc.fx.burst(x, y, 14, ['o', 'y', 'r']);
    sc.fx.smoke(x, y, 4);
    sc.fx.shake(140, 2);
    GS.Synth.explosion();
    sc.players.forEach((pl) => {
      if (!pl.canBeHit) return;
      const c = pl.sprite.body.center;
      if (Math.hypot(c.x - x, c.y - y) < r) pl.hurt(dmg, x);
    });
  }

  update(dt) {
    const cam = this.scene.cameras.main;
    const cull = (s) => s.x < cam.worldView.x - 80 || s.x > cam.worldView.right + 80 || s.y > cam.worldView.bottom + 120 || s.y < cam.worldView.y - 200;
    this.player.children.each((s) => {
      if (!s.active) return;
      s.life -= dt;
      s.t += dt;
      if (s.spin) s.rotation += s.spin * dt;
      if (s.kind === 'pixelBig') s.setScale(1 + Math.sin(s.t * 30) * 0.1);
      if (s.life <= 0 || cull(s)) this.kill(s, s.life <= 0);
    });
    this.enemy.children.each((s) => {
      if (!s.active) return;
      s.life -= dt;
      s.t += dt;
      if (s.spin) s.rotation += s.spin * dt;
      if (s.kind === 'grenade') {
        s.rotation += s.body.velocity.x * dt * 0.1;
        s.fuse -= dt;
        if (s.fuse < 0.5) s.setTint(Math.floor(s.t * 20) % 2 ? 0xff5a4a : 0xffffff);
        if (s.fuse <= 0) { this.kill(s); return; }
      }
      if (s.kind === 'ok') s.y += Math.sin(s.t * 8) * 0.4;
      // Вопрос инквизитора медленно доворачивает к ближайшему герою.
      if (s.kind === 'question') {
        const p = this.scene.nearestPlayer(s.x, s.y, 400);
        if (p) {
          const dx = p.center.x - s.x, dy = p.center.y - s.y, d = Math.hypot(dx, dy) || 1;
          s.body.velocity.x += (dx / d * 75 - s.body.velocity.x) * dt * 1.6;
          s.body.velocity.y += (dy / d * 75 - s.body.velocity.y) * dt * 1.6;
        }
      }
      if (s.kind === 'wave') { s.setScale(1 + Math.sin(s.t * 30) * 0.15, 1); if (Math.random() < 0.3) this.scene.fx.burst(s.x, s.y + 4, 1, ['g']); }
      if (s.life <= 0 || cull(s)) this.kill(s, false);
    });
  }
};
