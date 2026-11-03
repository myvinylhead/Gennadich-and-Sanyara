// Предметы и интерактивные объекты уровня.
GS.Pickup = class Pickup {
  constructor(scene, kind, x, y) {
    const tex = { coin: 'item/coin0', pizza: 'item/pizza', coffee: 'item/coffee', crystal: 'item/crystal', artifact: 'item/artifact', cat: 'item/cat' }[kind];
    this.scene = scene;
    this.kind = kind;
    this.sprite = scene.physics.add.image(x, y, tex).setDepth(25);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.owner = this;
    this.baseY = y;
    this.t = Math.random() * 6;
    this.taken = false;
    if (kind === 'artifact' || kind === 'cat') {
      this.glow = scene.add.image(x, y, kind === 'cat' ? 'glow/gold' : 'glow/violet').setDepth(24).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
    }
    if (kind === 'crystal') this.glow = scene.add.image(x, y, 'glow/violet').setDepth(24).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.4).setScale(0.6);
  }

  update(dt, time) {
    if (this.taken) return;
    this.t += dt;
    const s = this.sprite;
    if (this.kind === 'coin') {
      if (this.note) s.setTexture('suno/note').setFlipX(false);
      else {
        s.setTexture('item/coin' + [0, 1, 2, 3, 2, 1][Math.floor(this.t * 10) % 6]);
        s.setFlipX(Math.floor(this.t * 10) % 6 > 3);
      }
      // Магнит к ближайшему герою.
      const p = this.scene.nearestPlayer(s.x, s.y, 34);
      if (p) {
        const c = p.center;
        s.x += (c.x - s.x) * Math.min(1, dt * 10);
        s.y += (c.y - s.y) * Math.min(1, dt * 10);
        this.baseY = s.y;
        s.body.updateFromGameObject();
        return;
      }
    }
    const bob = this.kind === 'artifact' ? 3 : 2;
    s.y = Math.round(this.baseY + Math.sin(this.t * 3) * bob);
    s.body.updateFromGameObject();
    if (this.glow) { this.glow.setPosition(s.x, s.y).setScale((this.kind === 'crystal' ? 0.6 : 1) + Math.sin(this.t * 4) * 0.08); }
    if (this.kind === 'artifact' && Math.random() < 0.08) this.scene.fx.burst(s.x + GS.util.rand(-8, 8), s.y + GS.util.rand(-8, 8), 1, ['v', 'g']);
    if (this.kind === 'cat' && Math.random() < 0.06) this.scene.fx.sparks(s.x + GS.util.rand(-7, 7), s.y + GS.util.rand(-8, 6), 1, 0xffd84a);
    if (this.kind === 'coffee' && Math.random() < 0.05) this.scene.fx.puff(s.x, s.y - 7, 1, 0xc8c8d8);
  }

  take(player) {
    if (this.taken) return;
    this.taken = true;
    const sc = this.scene;
    const s = this.sprite;
    sc.onPickup(this, player);
    s.body.enable = false;
    if (this.glow) this.glow.destroy();
    sc.tweens.add({ targets: s, y: s.y - 14, scale: 1.6, alpha: 0, duration: 260, ease: 'Quad.out', onComplete: () => s.destroy() });
  }
};

// Чекпоинт — терминал «git commit».
GS.Checkpoint = class Checkpoint {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.active = false;
    // Уровень может переодеть чекпоинт (в соборе — исповедальня).
    this.tex = (scene.def && scene.def.checkpointTex) || ['obj/terminal_off', 'obj/terminal_on'];
    this.sprite = scene.physics.add.image(x, y - 11, this.tex[0]).setDepth(12);
    if (this.tex[0] !== 'obj/terminal_off') this.sprite.setOrigin(0.5, 1).setY(y);
    this.sprite.body.setAllowGravity(false).setImmovable(true).setSize(20, 30);
    this.sprite.owner = this;
  }
  activate(player) {
    if (this.active) return;
    this.active = true;
    this.sprite.setTexture(this.tex[1]);
    this.scene.onCheckpoint(this, player);
    this.scene.fx.ring(this.x, this.y - 14, { color: 0x4fe03c, to: 2 });
    this.scene.fx.code(this.x, this.y - 22, 6);
    this.glow = this.scene.add.image(this.x, this.y - 16, 'glow/green').setDepth(11).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
  }
};

// Портал выхода: серый, пока не найден артефакт.
GS.ExitPortal = class ExitPortal {
  constructor(scene, x, y) {
    this.scene = scene;
    this.open = false;
    this.img = scene.add.image(x, y - 24, 'obj/portal_off').setDepth(8);
    this.glow = scene.add.image(x, y - 24, 'glow/green').setDepth(7).setBlendMode(Phaser.BlendModes.ADD).setScale(2.4).setAlpha(0);
    this.sprite = scene.physics.add.image(x, y - 24, 'px').setVisible(false);
    this.sprite.body.setAllowGravity(false).setImmovable(true).setSize(26, 40);
    this.sprite.owner = this;
    this.label = GS.text(scene, x, y - 58, 'НУЖЕН АРТЕФАКТ', { color: '#a8acc4', origin: [0.5, 1], depth: 9 });
  }
  activate() {
    if (this.open) return;
    this.open = true;
    this.img.setTexture('obj/portal');
    this.label.setText('В ПОРТАЛ!').setTint(GS.hex('#b4ff5a'));
    this.scene.tweens.add({ targets: this.glow, alpha: 0.7, duration: 600 });
    this.scene.fx.ring(this.img.x, this.img.y, { color: 0x4fe03c, to: 3, ms: 600 });
  }
  update(dt, time) {
    this.img.rotation = time / 1000 * (this.open ? -4 : -0.6);
    if (this.open) {
      this.glow.setScale(2.4 + Math.sin(time / 200) * 0.2);
      if (Math.random() < 0.3) this.scene.fx.burst(this.img.x + GS.util.rand(-20, 20), this.img.y + GS.util.rand(-20, 20), 1, ['g']);
      this.label.y = this.img.y - 34 + Math.sin(time / 250) * 2;
    }
  }
};

// Табличка обучения.
GS.Sign = class Sign {
  constructor(scene, x, y, lines) {
    const w = Math.max(...lines.map((l) => GS.Font.width(l))) + 10;
    const h = lines.length * 10 + 6;
    const key = `sign_${Math.round(x)}_${Math.round(y)}`;
    GS.makeTex(scene, key, w, h + 10, (p) => {
      p.rect(Math.floor(w / 2) - 1, h, 3, 10, '#5a3a24');
      p.rect(0, 0, w, h, '#2a1a3e');
      p.rect(1, 1, w - 2, h - 2, '#3a2370');
      p.rect(1, 1, w - 2, 1, '#5634a3');
      lines.forEach((l, i) => GS.Font.draw(p, l, Math.floor(w / 2), 4 + i * 10, i === 0 ? '#b4ff5a' : '#e2e4f0', { align: 'center' }));
    }, { outline: true });
    this.img = scene.add.image(Math.round(x), Math.round(y), key).setOrigin(0.5, 1).setDepth(6);
  }
};

// Ящик с Клод-мехом.
GS.MechCrate = class MechCrate {
  constructor(scene, x, y) {
    this.scene = scene;
    this.used = false;
    this.sprite = scene.physics.add.image(x, y - 13, 'obj/crate').setDepth(12);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.owner = this;
    this.glow = scene.add.image(x, y - 13, 'glow/orange').setDepth(11).setBlendMode(Phaser.BlendModes.ADD).setScale(1.5).setAlpha(0.5);
    this.label = GS.text(scene, x, y - 32, 'CLAUDE-МЕХ', { color: '#ffb03a', origin: [0.5, 1], depth: 13 });
    this.t = 0;
  }
  update(dt) {
    if (this.used) return;
    this.t += dt;
    this.glow.setAlpha(0.4 + Math.sin(this.t * 4) * 0.2).setPosition(this.sprite.x, this.sprite.y);
    this.label.y = this.sprite.y - 19 + Math.round(Math.sin(this.t * 3) * 2);
  }
  open(player) {
    if (this.used || !player.alive || player.inMech) return;
    this.used = true;
    this.glow.destroy();
    this.label.destroy();
    const sc = this.scene;
    sc.fx.burst(this.sprite.x, this.sprite.y, 20, ['o', 'y', 'w']);
    sc.fx.smoke(this.sprite.x, this.sprite.y, 6);
    sc.fx.shake(200, 3);
    GS.Synth.explosion();
    this.sprite.destroy();
    sc.enterMech(player, this.sprite.x, this.sprite.y + 13);
  }
};

// Платформа с багом: постоишь — исчезает, потом возвращается.
GS.GlitchBlock = class GlitchBlock {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.staticImage(x + 8, y + 8, 'obj/glitch0').setDepth(5);
    this.sprite.owner = this;
    this.state = 'solid';
    this.t = 0;
  }
  touch() { if (this.state === 'solid') { this.state = 'warn'; this.t = 0.55; GS.Synth.glitch(); } }
  update(dt) {
    const s = this.sprite;
    if (this.state === 'warn') {
      this.t -= dt;
      s.setTexture('obj/glitch' + (1 + (Math.floor(this.t * 20) % 2)));
      s.x = s.body.x + 8 + (Math.random() < 0.5 ? 1 : 0);
      if (this.t <= 0) { this.state = 'gone'; this.t = 2.2; s.setVisible(false); s.body.enable = false; this.scene.fx.burst(s.x, s.y, 6, ['g', 'c', 'p']); }
    } else if (this.state === 'gone') {
      this.t -= dt;
      if (this.t <= 0 && !this.scene.players.some((p) => p.alive && Phaser.Geom.Intersects.RectangleToRectangle(p.sprite.getBounds(), s.getBounds()))) {
        this.state = 'solid'; s.setVisible(true).setTexture('obj/glitch0'); s.body.enable = true; s.x = s.body.x + 8;
        this.scene.fx.burst(s.x, s.y, 4, ['g', 'w']);
      }
    }
  }
};

// Движущаяся платформа (горизонтальная или вертикальная).
GS.Mover = class Mover {
  constructor(scene, x, y, vertical, range = 64, speed = 40) {
    this.scene = scene;
    this.sprite = scene.physics.add.image(x + 16, y + 4, 'obj/platform').setDepth(5);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.body.checkCollision.down = false;
    this.sprite.body.checkCollision.left = false;
    this.sprite.body.checkCollision.right = false;
    this.sprite.owner = this;
    this.vertical = vertical;
    this.origin = vertical ? this.sprite.y : this.sprite.x;
    this.range = range;
    this.speed = speed;
    this.dir = 1;
  }
  update() {
    const b = this.sprite.body;
    const pos = this.vertical ? this.sprite.y : this.sprite.x;
    if (pos > this.origin + this.range) this.dir = -1;
    if (pos < this.origin - (this.vertical ? 0 : this.range)) this.dir = 1;
    if (this.vertical) b.setVelocity(0, this.dir * this.speed * -1 * -1);
    else b.setVelocity(this.dir * this.speed, 0);
  }
};

// «Сетка» Саняры: временная платформа из пиксельной сетки.
GS.GridPlatform = class GridPlatform {
  constructor(scene, owner, x, y) {
    this.scene = scene;
    this.owner = owner;
    this.sprite = scene.physics.add.image(x, y + 3, 'obj/gridplat').setDepth(29);
    const b = this.sprite.body;
    b.setAllowGravity(false).setImmovable(true);
    b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
    this.sprite.owner = this;
    this.life = owner.cfg.special.life;
    this.sprite.setScale(0.2, 1);
    scene.tweens.add({ targets: this.sprite, scaleX: 1, duration: 120, ease: 'Back.out' });
    scene.fx.burst(x, y, 8, ['v', 'w']);
  }
  update(dt) {
    this.life -= dt;
    if (this.life < 0.6) this.sprite.setAlpha(Math.floor(this.life * 14) % 2 ? 0.3 : 1);
    if (this.life <= 0) this.destroy();
  }
  destroy() {
    if (!this.sprite.active) return;
    this.scene.fx.burst(this.sprite.x, this.sprite.y, 6, ['v']);
    this.sprite.destroy();
    this.dead = true;
  }
};

// Инопланетянин «Я ПОМОГ»: подходит — даёт бесполезный совет.
GS.Alien = class Alien {
  constructor(scene, x, y) {
    this.scene = scene;
    this.rig = new GS.Skeleton(scene, x, y, GS.enemyRigs.alien(), '').setDepth(20);
    this.rig.play('idle');
    this.x = x; this.y = y;
    this.cool = 0;
    this.voice = 1.6;
    this.i = 0;
  }
  headPoint() { return { x: this.rig.x, y: this.rig.y - 24 }; }
  update(dt) {
    this.cool -= dt;
    const p = this.scene.nearestPlayer(this.x, this.y - 10, 70);
    if (p) {
      this.rig.facing = p.center.x < this.x ? -1 : 1;
      this.rig.look.x = 1; this.rig.look.y = -0.3;
      if (this.cool <= 0) {
        this.cool = 6;
        this.scene.chatter.say(this, GS.LINES.alien[this.i++ % GS.LINES.alien.length], { priority: true });
        if (this.i === 1 && this.scene.stickers) this.scene.stickers.show('alien');
      }
    }
    this.rig.y = Math.round(this.y + Math.sin(this.scene.time.now / 300) * 1);
    this.rig.tick(dt);
  }
};
