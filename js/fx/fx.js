// Эффекты сцены уровня: частицы, тряска, хит-стоп, вспышки, всплывающие надписи, кольца.
GS.Fx = class Fx {
  constructor(scene) {
    this.scene = scene;
    const base = { emitting: false };
    const mk = (tex, cfg, depth = 45) => scene.add.particles(0, 0, tex, { ...base, ...cfg }).setDepth(depth);
    this.e = {
      dust: mk('fx/dust', { lifespan: 380, speed: { min: 15, max: 55 }, angle: { min: 200, max: 340 }, scale: { start: 1, end: 0 }, alpha: { start: 0.8, end: 0 }, gravityY: -30 }, 29),
      smoke: mk('fx/smoke', { lifespan: 700, speed: { min: 10, max: 40 }, angle: { min: 230, max: 310 }, scale: { start: 1, end: 0.2 }, alpha: { start: 0.7, end: 0 }, gravityY: -40 }),
      spark: mk('fx/spark', { lifespan: 260, speed: { min: 50, max: 150 }, scale: { start: 1, end: 0 } }),
      star: mk('fx/star', { lifespan: 700, speed: { min: 40, max: 120 }, angle: { min: 200, max: 340 }, gravityY: 250, scale: { start: 1, end: 0.4 }, rotate: { min: 0, max: 360 } }),
      heart: mk('fx/heart', { lifespan: 900, speed: { min: 20, max: 50 }, angle: { min: 250, max: 290 }, gravityY: -30, alpha: { start: 1, end: 0 } }),
      z: mk('fx/z', { lifespan: 1600, speedX: { min: 4, max: 12 }, speedY: { min: -18, max: -10 }, alpha: { start: 1, end: 0 }, scale: { start: 0.6, end: 1.4 } }),
      muzzle: mk('fx/muzzle', { lifespan: 70, scale: { start: 1, end: 0.3 } }, 46),
    };
    this.bits = {};
    Object.keys(GS.ItemArt.FX_BITS).forEach((k) => {
      this.bits[k] = mk('fx/bit_' + k, { lifespan: { min: 300, max: 700 }, speed: { min: 40, max: 170 }, gravityY: 380, scale: { start: 1, end: 0.5 } });
    });
    this.goos = {
      p: mk('fx/goo', { lifespan: 700, speed: { min: 50, max: 150 }, angle: { min: 200, max: 340 }, gravityY: 500, scale: { start: 1, end: 0.6 } }),
      g: mk('fx/gooG', { lifespan: 700, speed: { min: 50, max: 150 }, angle: { min: 200, max: 340 }, gravityY: 500, scale: { start: 1, end: 0.6 } }),
    };
    this.glyphs = [0, 1, 2, 3, 4, 5].map((i) => mk('fx/glyph' + i, { lifespan: 500, speed: { min: 10, max: 40 }, alpha: { start: 1, end: 0 }, gravityY: -20 }));
    this.hitstopT = 0;
  }

  puff(x, y, n = 4, tint = 0xffffff) { this.e.dust.setParticleTint(tint); this.e.dust.explode(n, x, y); }
  smoke(x, y, n = 3) { this.e.smoke.explode(n, x, y); }
  sparks(x, y, n = 5, tint = 0xffffff) { this.e.spark.setParticleTint(tint); this.e.spark.explode(n, x, y); }
  stars(x, y, n = 5) { this.e.star.explode(n, x, y); }
  hearts(x, y, n = 2) { this.e.heart.explode(n, x, y); }
  zzz(x, y) { this.e.z.explode(1, x, y); }
  burst(x, y, n = 10, colors = ['p', 'v', 'w']) { colors.forEach((c) => this.bits[c] && this.bits[c].explode(Math.ceil(n / colors.length), x, y)); }
  goo(x, y, n = 6, green = false) { (green ? this.goos.g : this.goos.p).explode(n, x, y); }
  code(x, y, n = 2) { for (let i = 0; i < n; i++) GS.util.pick(this.glyphs).explode(1, x + GS.util.rand(-3, 3), y + GS.util.rand(-3, 3)); }
  muzzle(x, y, tint) { this.e.muzzle.setParticleTint(tint); this.e.muzzle.explode(1, x, y); }

  shake(ms = 120, px = 2) { this.scene.cameras.main.shake(ms, px / GS.W); }
  hitstop(ms = 50) { this.hitstopT = Math.max(this.hitstopT, ms / 1000); }
  flash(ms = 80, color = 0xffffff, alpha = 0.6) {
    const r = this.scene.add.rectangle(0, 0, GS.W, GS.H, color, alpha).setOrigin(0).setScrollFactor(0).setDepth(900);
    this.scene.tweens.add({ targets: r, alpha: 0, duration: ms, onComplete: () => r.destroy() });
  }

  ring(x, y, { color = 0xffffff, from = 0.2, to = 2, ms = 300, depth = 44 } = {}) {
    const r = this.scene.add.image(x, y, 'fx/ring').setTint(color).setScale(from).setDepth(depth);
    this.scene.tweens.add({ targets: r, scale: to, alpha: 0, duration: ms, ease: 'Quad.out', onComplete: () => r.destroy() });
  }

  // Всплывающая надпись над точкой мира.
  pop(x, y, text, { color = '#ffffff', scale = 1, rise = 26, ms = 900, depth = 60 } = {}) {
    const t = GS.text(this.scene, x, y, text, { color, scale, origin: [0.5, 1], depth });
    t.setScale(0.2 * scale);
    this.scene.tweens.add({ targets: t, scale, duration: 140, ease: 'Back.out' });
    this.scene.tweens.add({ targets: t, y: y - rise, duration: ms, ease: 'Quad.out' });
    this.scene.tweens.add({ targets: t, alpha: 0, delay: ms * 0.6, duration: ms * 0.4, onComplete: () => t.destroy() });
    return t;
  }

  // Глитч-полосы поверх экрана.
  glitch(ms = 250, strength = 1) {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(890);
    const cols = [0x4fe03c, 0xff4ad0, 0x8cf2ff, 0xffffff];
    let t = 0;
    const ev = this.scene.time.addEvent({
      delay: 40, repeat: Math.ceil(ms / 40),
      callback: () => {
        t += 40;
        g.clear();
        const n = Math.floor(3 + Math.random() * 5 * strength);
        for (let i = 0; i < n; i++) {
          g.fillStyle(GS.util.pick(cols), 0.25 + Math.random() * 0.3);
          g.fillRect(Math.floor(Math.random() * GS.W), Math.floor(Math.random() * GS.H), 20 + Math.floor(Math.random() * 200 * strength), 1 + Math.floor(Math.random() * 4));
        }
        if (t >= ms) { g.destroy(); ev.remove(); }
      },
    });
    if (Math.random() < 0.5) GS.Synth.glitch();
  }

  update(dt) { if (this.hitstopT > 0) this.hitstopT -= dt; }
  get frozen() { return this.hitstopT > 0; }
};
