// Пиксельные пузыри реплик: печатаются по буквам с «бормотанием», следуют за говорящим.
GS.Bubble = class Bubble {
  // owner должен уметь headPoint() → {x, y} в мире. Необязательно: owner.voice (высота голоса).
  static say(scene, owner, text, opts = {}) {
    if (!owner || !text) return null;
    if (owner.bubble && owner.bubble.alive) {
      if (opts.weak) return null;
      owner.bubble.destroy();
    }
    owner.bubble = new GS.Bubble(scene, owner, text, opts);
    if (owner.rig && owner.rig.say) owner.rig.say(Math.min(2, GS.Font.norm(text).length / 14));
    return owner.bubble;
  }

  constructor(scene, owner, text, { color = '#140c1e', bg = 0xffffff, time = null, maxW = 150, depth = 70 } = {}) {
    this.scene = scene;
    this.owner = owner;
    this.alive = true;
    const lines = GS.Font.wrap(text, maxW);
    this.full = lines.join('\n');
    this.shown = 0;
    this.total = this.full.length;
    this.speed = 45;
    this.life = time ?? 1.3 + this.total / 16;
    this.t = 0;
    const tw = Math.max(...lines.map((l) => GS.Font.width(l)));
    this.w = tw + 8;
    this.h = lines.length * 10 + 4;
    this.g = scene.add.graphics().setDepth(depth);
    this.txt = scene.add.bitmapText(0, 0, 'pix', '', 7).setTint(GS.hex(color)).setDepth(depth + 1);
    this.bg = bg;
    this.pitch = owner.voice || 1;
    this.scale = 0.2;
    this.update(0);
  }

  draw(x, y, tailX) {
    const g = this.g;
    const w = this.w, h = this.h;
    const ink = GS.hex(GS.PAL.ink);
    g.clear();
    g.fillStyle(ink, 1);
    g.fillRect(x + 1, y, w - 2, h);
    g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle(this.bg, 1);
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    // Хвостик.
    const tx = GS.util.clamp(tailX, x + 4, x + w - 6);
    g.fillStyle(ink, 1);
    g.fillRect(tx, y + h, 4, 1); g.fillRect(tx + 1, y + h + 1, 2, 1); g.fillRect(tx + 1, y + h + 2, 1, 1);
    g.fillStyle(this.bg, 1);
    g.fillRect(tx + 1, y + h - 1, 2, 1); g.fillRect(tx + 1, y + h, 2, 1);
  }

  update(dt) {
    if (!this.alive) return;
    if (this.owner.destroyed || (this.owner.sprite && !this.owner.sprite.body && !this.owner.rig)) { this.destroy(); return; }
    this.t += dt;
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.total, this.shown + dt * this.speed);
    const now = Math.floor(this.shown);
    if (now > before) {
      this.txt.setText(this.full.slice(0, now));
      const ch = this.full[now - 1];
      if (ch && ch !== ' ' && now % 2 === 0) GS.Synth.blip(this.pitch);
    }
    const hp = this.owner.headPoint ? this.owner.headPoint() : { x: 0, y: 0 };
    const cam = this.scene.cameras.main;
    let x = Math.round(hp.x - this.w / 2);
    x = GS.util.clamp(x, Math.round(cam.worldView.x) + 2, Math.round(cam.worldView.right) - this.w - 2);
    let y = Math.round(hp.y - this.h - 6);
    y = Math.max(Math.round(cam.worldView.y) + 2, y);
    this.draw(x, y, Math.round(hp.x - 2));
    this.txt.setPosition(x + 4, y + 3);
    if (this.t > this.life || (this.owner.alive === false && this.t > 0.6) || (this.owner.destroyed)) this.destroy();
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;
    this.g.destroy();
    this.txt.destroy();
    if (this.owner.bubble === this) this.owner.bubble = null;
  }
};

// Менеджер: обновляет все пузыри сцены и ограничивает болтовню.
GS.Chatter = class Chatter {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.cool = 0;
  }
  // priority: true — сказать даже если недавно болтали.
  say(owner, text, opts = {}) {
    if (!opts.priority && this.cool > 0) return null;
    const b = GS.Bubble.say(this.scene, owner, text, opts);
    if (b) { this.list.push(b); this.cool = opts.priority ? 0.5 : 1.4; }
    return b;
  }
  update(dt) {
    this.cool -= dt;
    this.list = this.list.filter((b) => { b.update(dt); return b.alive; });
  }
};
