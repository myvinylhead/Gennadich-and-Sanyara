// «Церковь Святого Покока»: фанатики промптов, контекстное окно, скиллы-реликвии и босс-свиток AGENTS.md.
// Святой Покок — добрый покровитель на витражах; злодеи — фанатики, понявшие его учение слишком буквально.
GS.ChurchArt = {
  make(scene) {
    const mk = (key, w, h, fn, outline = true) => { if (!scene.textures.exists(key)) GS.makeTex(scene, key, w, h, fn, { outline }); };
    const ROBE = '#e2e4f0', ROBE_D = '#a8acc4', SKIN = '#f2c49a';
    // Фанатик промптов: белая ряса, фиолетовый пояс, свиток в руке. Второй кадр — бросок.
    [0, 1].forEach((f) => mk('church/fanatic' + f, 14, 20, (p) => {
      p.poly([[3, 20], [5, 6], [9, 6], [11, 20]], ROBE); p.rect(4, 13, 7, 1, ROBE_D); p.rect(5, 11, 5, 1, '#6a2a8a');
      p.ellipse(7, 4, 4, 4, ROBE); p.ellipse(7, 5, 2.5, 2.5, SKIN); p.px(6, 5, '#140c1e'); p.px(8, 5, '#140c1e');
      if (f) { p.rect(10, 2, 2, 6, ROBE); p.rect(10, 0, 4, 3, '#f2e2b0'); } else { p.rect(10, 9, 2, 5, ROBE); p.rect(10, 13, 4, 3, '#f2e2b0'); }
    }));
    mk('shot/scroll', 9, 6, (p) => { p.rect(0, 0, 9, 6, '#f2e2b0'); p.rect(0, 0, 2, 6, '#c8a070'); for (let y = 1; y < 6; y += 2) p.rect(3, y, 5, 1, '#8a7a5a'); });
    mk('shot/scrollTail', 8, 5, (p) => { p.rect(0, 0, 8, 5, '#f2e2b0'); p.rect(1, 1, 6, 1, '#8a7a5a'); p.rect(1, 3, 4, 1, '#8a7a5a'); });
    // Аколит AGENTS.MD: прикрывается скрижалью.
    [0, 1].forEach((f) => mk('church/acolyte' + f, 18, 20, (p) => {
      p.poly([[2, 20], [4, 6], [8, 6], [10, 20]], '#5a3a8a'); p.ellipse(6, 4, 3.5, 3.5, '#5a3a8a'); p.ellipse(6, 5, 2, 2, SKIN); p.px(7, 5, '#140c1e');
      p.rect(9 + f, 3, 8, 14, '#8a8aa8'); p.rect(10 + f, 4, 6, 12, '#c8c8d8');
      p.rect(11 + f, 5, 1, 3, '#140c1e'); p.rect(13 + f, 5, 1, 3, '#140c1e'); p.rect(10 + f, 6, 5, 1, '#140c1e'); // «#»
      for (let y = 10; y < 16; y += 2) p.rect(11 + f, y, 4, 1, '#5a5a80');
      p.rect(3 + f, 19, 2, 1, '#2a2a3a'); p.rect(7 - f, 19, 2, 1, '#2a2a3a');
    }));
    // Монах-токенизатор с огромными ножницами.
    [0, 1].forEach((f) => mk('church/tokenizer' + f, 16, 20, (p) => {
      p.poly([[2, 20], [4, 6], [9, 6], [11, 20]], '#2a6a5a'); p.ellipse(6.5, 4, 3.5, 3.5, '#2a6a5a'); p.ellipse(6.5, 5, 2, 2, SKIN); p.px(7, 5, '#140c1e');
      p.circle(10, 12, 1.5, '#c8c8d8'); p.circle(10, 15, 1.5, '#c8c8d8');
      p.line(11, 12, 16, f ? 9 : 11, '#e2e4f0'); p.line(11, 15, 16, f ? 18 : 15, '#e2e4f0');
    }));
    mk('shot/token', 5, 5, (p) => { p.rect(0, 0, 5, 5, '#8cf2ff'); p.rect(1, 1, 3, 3, '#2a6a8a'); p.px(2, 2, '#ffffff'); });
    // Хор системного промпта: трое певчих.
    [0, 1].forEach((f) => mk('church/choir' + f, 30, 20, (p) => {
      [4, 15, 26].forEach((x, k) => {
        const y = k === 1 ? 0 : 2;
        p.poly([[x - 4, 20], [x - 3, y + 7], [x + 3, y + 7], [x + 4, 20]], '#c0303a'); p.rect(x - 3, y + 8, 7, 2, ROBE);
        p.ellipse(x, y + 4, 3, 3, SKIN); p.px(x - 1, y + 3, '#140c1e'); p.px(x + 1, y + 3, '#140c1e');
        p.rect(x - 1, y + 5, 2, f ? 2 : 1, '#6e1414');
      });
    }));
    // Инквизитор «grill-me»: острый красный капюшон, знак вопроса на груди.
    [0, 1].forEach((f) => mk('church/inquisitor' + f, 16, 24, (p) => {
      p.poly([[2, 24], [4, 8], [12, 8], [14, 24]], '#3a0a1a'); p.poly([[4, 9], [8, 0], [12, 9]], '#c0303a');
      p.ellipse(8, 8, 2.5, 2, SKIN); p.rect(6, 7, 1, 1, '#140c1e'); p.rect(9, 7, 1, 1, '#140c1e');
      p.rect(7, 13, 3, 1, '#ffd84a'); p.rect(9, 14, 1, 2, '#ffd84a'); p.rect(8, 16, 1, 1, '#ffd84a'); p.rect(8, 18, 1, 1, '#ffd84a');
      if (f) p.rect(13, 10, 3, 2, SKIN);
    }));
    mk('shot/question', 7, 10, (p) => { p.rect(1, 0, 5, 2, '#ffd84a'); p.rect(5, 1, 2, 3, '#ffd84a'); p.rect(3, 4, 3, 2, '#ffd84a'); p.rect(3, 6, 2, 1, '#ffd84a'); p.rect(3, 8, 2, 2, '#ffd84a'); });
    // Колонна «САММАРИ» (целая и треснувшая).
    [0, 1].forEach((f) => mk('church/pillar' + f, 18, 44, (p) => {
      p.rect(1, 0, 16, 4, '#8a8aa8'); p.rect(3, 4, 12, 36, '#a8acc4'); p.rect(1, 40, 16, 4, '#8a8aa8');
      for (let y = 6; y < 40; y += 6) p.rect(5, y, 1, 4, '#8a8aa8');
      p.rect(4, 14, 10, 10, '#f2e2b0'); for (let y = 16; y < 23; y += 2) p.rect(5, y, 8, 1, '#8a7a5a');
      if (f) { p.line(8, 4, 11, 14, '#3a3450'); p.line(11, 24, 7, 38, '#3a3450'); }
    }));
    // Реликвия-скилл: светящаяся книга на подставке.
    mk('church/relic', 14, 16, (p) => {
      p.rect(2, 10, 10, 6, '#7a5028'); p.rect(1, 10, 12, 1, '#a8743a'); p.rect(5, 14, 4, 2, '#5a3a1e');
      p.rect(2, 2, 10, 7, '#f2e2b0'); p.rect(7, 2, 1, 7, '#c8a070'); p.rect(3, 4, 3, 1, '#8a7a5a'); p.rect(8, 4, 3, 1, '#8a7a5a'); p.rect(3, 6, 3, 1, '#8a7a5a');
    });
    // Декор собора: свеча.
    mk('church/candle', 5, 11, (p) => { p.rect(1, 4, 3, 7, '#e8e0c8'); p.rect(1, 4, 1, 7, '#ffffff'); p.rect(2, 2, 1, 2, '#3a2414'); p.rect(1, 0, 3, 2, '#ff8a2a'); p.px(2, 0, '#ffd84a'); });
    // Исповедальня-чекпоинт: закрыта / открыта и светится.
    [0, 1].forEach((f) => mk('church/booth' + f, 22, 30, (p) => {
      p.poly([[0, 8], [11, 0], [22, 8]], '#5a3a1e'); p.rect(1, 8, 20, 22, '#7a5028'); p.rect(3, 11, 16, 17, f ? '#ffd84a' : '#3a2414');
      for (let x = 5; x < 18; x += 3) p.rect(x, 11, 1, 17, '#5a3a1e');
      p.rect(9, 2, 4, 2, f ? '#4fe03c' : '#a8743a');
    }));
  },
};

// ——— Контекстное окно ———
// Зона между «[» и «]»: когда герой заходит, с двух сторон сходятся стены текста. Сбитая колонна «САММАРИ»
// отталкивает стены (/compact), все колонны сбиты — окно сжато, стены исчезают, путь дальше открыт.
GS.ContextRoom = class ContextRoom {
  constructor(scene, x0, x1, pillars) {
    this.scene = scene;
    this.x0 = x0; this.x1 = x1;
    this.pillars = pillars;
    pillars.forEach((pl) => { pl.room = this; });
    this.state = 'idle';
    this.l = x0; this.r = x1;
    this.gfx = scene.add.graphics().setDepth(41);
    this.label = GS.text(scene, 0, 0, '', { color: '#f2e2b0', origin: [0.5, 0], depth: 42 }).setVisible(false);
  }
  get left() { return this.pillars.filter((p) => p.alive).length; }
  onRespawn() {
    if (this.state === 'done') return;
    this.state = 'idle'; this.l = this.x0; this.r = this.x1;
  }
  compact() {
    const C = GS.TUNING.church;
    this.l = Math.max(this.x0, this.l - C.compactPush);
    this.r = Math.min(this.x1, this.r + C.compactPush);
    GS.Synth.portal();
    if (this.left === 0) {
      this.state = 'done';
      if (this.scene.hud) this.scene.hud.banner('КОНТЕКСТ СЖАТ!', '#4fe03c', '/COMPACT ВЫПОЛНЕН');
      this.scene.fx.flash(200, 0xf2e2b0, 0.4);
    } else if (this.scene.hud) this.scene.hud.banner('/COMPACT', '#f2e2b0', `ОСТАЛОСЬ КОЛОНН: ${this.left}`);
  }
  update(dt) {
    const sc = this.scene;
    const C = GS.TUNING.church;
    const runners = sc.players.filter((p) => p.alive && !p.bubbleState);
    if (this.state === 'idle') {
      if (runners.some((p) => p.center.x > this.x0 + 28 && p.center.x < this.x1)) {
        this.state = 'active';
        GS.Synth.warn();
        if (sc.hud) sc.hud.banner('КОНТЕКСТНОЕ ОКНО СУЖАЕТСЯ!', '#ff5a4a', 'СБЕЙ КОЛОННЫ «САММАРИ»');
      }
    } else if (this.state === 'active') {
      if (this.r - this.l > C.minGap) { this.l += C.wallSpeed * dt; this.r -= C.wallSpeed * dt; }
      // Живые колонны стены не закрывают — их всегда видно и есть куда стрелять.
      const alive = this.pillars.filter((pl) => pl.alive);
      if (alive.length) {
        this.l = Math.min(this.l, Math.min(...alive.map((pl) => pl.center.x)) - C.pillarRoom);
        this.r = Math.max(this.r, Math.max(...alive.map((pl) => pl.center.x)) + C.pillarRoom);
      }
      runners.forEach((p) => {
        const b = p.body;
        if (b.left < this.l) { b.x = this.l + 1; b.velocity.x = Math.max(b.velocity.x, 140); if (p.canBeHit) p.hurt(1, this.l - 20); }
        if (b.right > this.r) { b.x = this.r - b.width - 1; b.velocity.x = Math.min(b.velocity.x, -140); if (p.canBeHit) p.hurt(1, this.r + 20); }
      });
    }
    this.draw();
  }
  draw() {
    const g = this.gfx;
    g.clear();
    const on = this.state === 'active';
    this.label.setVisible(on);
    if (!on) return;
    const v = this.scene.cameras.main.worldView;
    const top = v.y - 8, h = v.height + 16;
    const wall = (x0, x1, edge) => {
      if (x1 <= x0) return;
      g.fillStyle(0x2a2016, 0.92).fillRect(x0, top, x1 - x0, h);
      // Строки «текста» контекста.
      for (let y = Math.floor(top / 6) * 6; y < top + h; y += 6) {
        const seed = (y * 73) % 97;
        for (let x = x0 + 3; x < x1 - 6; x += 22) g.fillStyle(0xc8a070, 0.55).fillRect(x, y, 6 + ((seed + x) % 14), 2);
      }
      g.fillStyle(0xf2e2b0, 1).fillRect(edge - 1, top, 2, h);
    };
    wall(this.x0 - 400, this.l, this.l);
    wall(this.r, this.x1 + 400, this.r);
    const used = Math.round(100 - (this.r - this.l) / (this.x1 - this.x0) * 100);
    this.label.setText(`КОНТЕКСТ: ${Math.max(used, 1)}%`).setPosition(Math.round((this.l + this.r) / 2), Math.round(v.y + 46));
  }
};

// Колонна «САММАРИ»: стоит, бить можно; сбил — окно контекста расширяется.
GS.SummaryPillar = class SummaryPillar extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.pillar;
    const view = scene.add.image(x, y, 'church/pillar0').setOrigin(0.5, 1).setDepth(6);
    super(scene, x, y, cfg, { w: 18, h: 56, view });
    this.harmful = false;
    this.sprite.body.setImmovable(true).setAllowGravity(false);
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); if (this.view.active) { this.view.setTintFill(0xffffff); if (this.hp < this.maxHp / 2) this.view.setTexture('church/pillar1'); } return r; }
  onDeath() {
    const c = this.center;
    GS.Synth.explosion();
    this.scene.fx.burst(c.x, c.y, 16, ['w', 'y']);
    this.scene.fx.pop(c.x, c.y - 30, 'САММАРИ ГОТОВО', { color: '#f2e2b0' });
    if (this.room) this.room.compact();
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    this.sprite.body.setVelocity(0, 0);
    if (this.flashT <= 0) this.view.clearTint();
  }
};

// ——— Реликвии-скиллы Святого Покока ———
GS.RELICS = {
  tdd: { title: 'СВЯТОЙ СКИЛЛ: TDD', sub: 'КРАСНЫЙ — ЗЕЛЁНЫЙ: ЗЕЛЁНЫЙ ЩИТ ОТ ВСЕГО', say: 'СНАЧАЛА ТЕСТ!' },
  caveman: { title: 'СВЯТОЙ СКИЛЛ: CAVEMAN', sub: 'МОЯ БИТЬ СИЛЬНО: ×2 УРОН', say: 'УГ! БАГ ПЛОХО! МОЯ БИТЬ!' },
  diagnose: { title: 'СВЯТОЙ СКИЛЛ: DIAGNOSE', sub: 'БАГИ ВИДНО: ВРАГИ ПОЛУЧАЮТ ×1.5', say: 'ВИЖУ ПРИЧИНУ!' },
};

GS.RelicPedestal = class RelicPedestal {
  constructor(scene, x, y, kind) {
    this.scene = scene;
    this.kind = kind;
    this.x = x; this.y = y;
    this.img = scene.add.image(x, y, GS.RelicPedestal.tex(scene, kind)).setOrigin(0.5, 1).setDepth(6);
    this.glow = scene.add.image(x, y - 14, 'glow/gold').setDepth(5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setScale(0.8);
    this.tag = GS.text(scene, x, y - this.img.height - 4, kind.toUpperCase(), { color: '#ffd84a', origin: [0.5, 1], depth: 7 });
    this.taken = false;
    this.t = Math.random() * 5;
  }
  // Нарисованная книга своя у каждого скилла; без листа — общая кодовая.
  static tex(scene, kind) { return scene.textures.exists('church/relic_' + kind) ? 'church/relic_' + kind : 'church/relic'; }
  setKind(kind) { this.kind = kind; this.img.setTexture(GS.RelicPedestal.tex(this.scene, kind)); this.tag.setText(kind.toUpperCase()).setY(this.y - this.img.height - 4); }
  update(dt) {
    if (this.taken) return;
    this.t += dt;
    this.glow.setScale(0.8 + Math.sin(this.t * 3) * 0.08);
    const p = this.scene.players.find((q) => q.alive && !q.bubbleState && Math.abs(q.center.x - this.x) < 14 && Math.abs(q.body.bottom - this.y) < 20);
    if (!p) return;
    this.taken = true;
    p.giveRelic(this.kind);
    this.img.setAlpha(0.35); this.glow.destroy(); this.tag.destroy();
  }
};

// ——— Враги собора ———
const churchFlash = (e) => { if (e.view && e.view.active) e.view.setTintFill(0xffffff); };
const churchView = (e, key) => {
  const b = e.sprite.body;
  e.view.setPosition(Math.round(b.center.x), Math.round(b.bottom)).setTexture(key).setFlipX(e.facing < 0);
  if (e.flashT <= 0) e.view.clearTint();
  // Под гимном хора — золотые искры.
  if (e.buffT > 0 && Math.random() < 0.15) e.scene.fx.sparks(b.center.x, b.top, 1, 0xffd84a);
};

// Фанатик промптов: бросает свиток «контекста», за которым тянется хвост — свиток растёт в полёте.
GS.PromptFanatic = class PromptFanatic extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.fanatic;
    const view = scene.add.image(x, y, 'church/fanatic0').setOrigin(0.5, 1).setDepth(20);
    super(scene, x, y, cfg, { w: 18, h: 36, view });
    this.throwT = cfg.throwEvery * GS.util.rand(0.4, 1);
    this.armT = 0;
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); churchFlash(this); return r; }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    b.velocity.x *= 0.8;
    this.armT -= dt;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (p) {
      this.facing = p.center.x < this.center.x ? -1 : 1;
      this.throwT -= dt;
      if (this.throwT <= 0) {
        this.throwT = this.cfg.throwEvery;
        this.armT = 0.3;
        const x0 = this.center.x + this.facing * 12, y0 = b.top + 8;
        const vx = this.facing * this.cfg.shotSpeed;
        this.scene.shots.fireEnemy('scroll', x0, y0, vx, 0);
        for (let k = 1; k <= this.cfg.tail; k++) {
          this.scene.time.delayedCall(k * 70, () => { if (this.alive) this.scene.shots.fireEnemy('scrollTail', x0, y0, vx, 0); });
        }
        this.chat(GS.LINES.enemy.fanatic, 0.4);
      }
    }
    churchView(this, this.armT > 0 ? 'church/fanatic1' : 'church/fanatic0');
  }
};

// Аколит AGENTS.MD: идёт на героя, скрижаль спереди держит выстрелы; бить в спину, сверху или вблизи.
GS.AgentsAcolyte = class AgentsAcolyte extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.acolyte;
    const view = scene.add.image(x, y, 'church/acolyte0').setOrigin(0.5, 1).setDepth(20);
    super(scene, x, y, cfg, { w: 26, h: 36, view });
    this.walk = 0;
  }
  hit(dmg, fromX, src) {
    // Выстрел летит навстречу скрижали и не сверху — отскакивает.
    if (src && src.body && Math.sign(src.body.velocity.x) === -this.facing && Math.abs(src.body.velocity.y) < Math.abs(src.body.velocity.x)) {
      this.scene.fx.sparks(this.center.x + this.facing * 16, this.center.y - 4, 3, 0xe2e4f0);
      if (Math.random() < 0.3) this.scene.fx.pop(this.center.x, this.center.y - 18, 'ПО ПРАВИЛАМ!', { color: '#c8c8d8', rise: 10, ms: 400 });
      GS.Synth.denied();
      return false;
    }
    const r = super.hit(dmg, fromX, src); churchFlash(this); return r;
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (p && b.blocked.down) {
      this.facing = p.center.x < this.center.x ? -1 : 1;
      const edge = !this.scene.isSolidAt(this.facing > 0 ? b.right + 4 : b.left - 4, b.bottom + 4);
      b.velocity.x = edge ? 0 : this.facing * this.cfg.speed;
      this.chat(GS.LINES.enemy.acolyte, 0.006);
    } else if (b.blocked.down) b.velocity.x *= 0.8;
    this.walk += Math.abs(b.velocity.x) * dt;
    churchView(this, 'church/acolyte' + (Math.floor(this.walk / 5) % 2));
  }
};

// Монах-токенизатор: каждая пуля, попавшая в него, разрезается на два токена, и они летят обратно.
GS.Tokenizer = class Tokenizer extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.tokenizer;
    const view = scene.add.image(x, y, 'church/tokenizer0').setOrigin(0.5, 1).setDepth(20);
    super(scene, x, y, cfg, { w: 24, h: 36, view });
    this.snipT = 0;
  }
  hit(dmg, fromX, src) {
    const r = super.hit(dmg, fromX, src);
    churchFlash(this);
    if (r && src && src.body && this.alive) {
      const back = -Math.sign(src.body.velocity.x || 1);
      [-1, 1].forEach((s) => this.scene.shots.fireEnemy('token', this.center.x, this.center.y - 2, back * this.cfg.tokenSpeed, s * 70));
      this.snipT = 0.2;
      if (Math.random() < 0.25) this.scene.fx.pop(this.center.x, this.center.y - 18, 'ТОКЕНИЗИРОВАНО', { color: '#8cf2ff', rise: 10, ms: 400 });
    }
    return r;
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    b.velocity.x *= 0.8;
    this.snipT -= dt;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (p) this.facing = p.center.x < this.center.x ? -1 : 1;
    churchView(this, this.snipT > 0 ? 'church/tokenizer1' : 'church/tokenizer0');
  }
};

// Хор системного промпта: пока поёт, соседние враги получают вдвое меньше урона.
GS.Choir = class Choir extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.choir;
    const view = scene.add.image(x, y, 'church/choir0').setOrigin(0.5, 1).setDepth(19);
    super(scene, x, y, cfg, { w: 44, h: 28, view });
    this.harmful = false;
    this.hymnT = 0.5;
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); churchFlash(this); return r; }
  update(dt) {
    this.baseUpdate(dt);
    this.sprite.body.velocity.x = 0;
    this.hymnT -= dt;
    const near = this.scene.cameras.main.worldView.contains(this.center.x, this.center.y);
    if (this.hymnT <= 0) {
      this.hymnT = this.cfg.hymnEvery;
      if (near) { this.scene.fx.ring(this.center.x, this.center.y, { color: 0xffd84a, to: this.cfg.r / 12, ms: 500 }); GS.Synth.blip(0.7); }
      this.scene.enemies.forEach((e) => {
        if (e !== this && e.alive && Math.hypot(e.center.x - this.center.x, e.center.y - this.center.y) < this.cfg.r) e.buffT = this.cfg.hymnEvery + 0.3;
      });
      if (near) this.chat(GS.LINES.enemy.choir, 0.5);
    }
    churchView(this, 'church/choir' + (Math.floor(this.t * 3) % 2));
  }
};

// Инквизитор «grill-me»: задаёт вопросы по одному — следующий только когда прошлый долетел или исчез.
GS.Inquisitor = class Inquisitor extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.inquisitor;
    const view = scene.add.image(x, y, 'church/inquisitor0').setOrigin(0.5, 1).setDepth(20);
    super(scene, x, y, cfg, { w: 22, h: 44, view });
    this.q = null;
    this.askT = 1;
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); churchFlash(this); return r; }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    b.velocity.x *= 0.8;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (this.q && !this.q.active) this.q = null;
    this.askT -= dt;
    if (p) {
      this.facing = p.center.x < this.center.x ? -1 : 1;
      if (!this.q && this.askT <= 0) {
        this.askT = this.cfg.askEvery;
        this.q = this.scene.shots.fireEnemy('question', this.center.x + this.facing * 16, b.top + 12, this.facing * 50, -20);
        this.scene.chatter.say(this, GS.util.pick(GS.LINES.enemy.grill), { priority: true, time: 2 });
      }
    }
    churchView(this, this.q ? 'church/inquisitor1' : 'church/inquisitor0');
  }
};

// ——— Босс: АРХИЕПИСКОП СИСТЕМНОГО ПРОМПТА ———
// Громадный архиепископ из нарисованных деталей (art_refs/church_boss.png): голова в митре, риза с сургучной
// печатью, руки парят отдельно и показывают атаку жестом, вокруг кружат скрижали, низ ризы — свиток до пола.
// Стреляет словами: NEVER — веером, ALWAYS — самонаводящееся, IMPORTANT!!! — дождь восклицаний,
// YOU MUST — луч поперёк арены. Печать на груди — слабое место, в 3-й фазе она треснула и светится ядро.
GS.ArchbishopBoss = class ArchbishopBoss {
  constructor(scene, x, y) {
    const B = GS.TUNING.archbishop;
    this.scene = scene;
    this.W = B.w; this.H = B.h;
    this.homeX = x; this.homeY = y;
    this.x = x; this.y = y - 220;
    this.maxHp = B.hp * (scene.players.length > 1 ? B.coopMul : 1);
    this.hp = this.maxHp;
    this.alive = true;
    this.state = 'sleep';
    this.stateT = 0;
    this.phase = 1;
    this.t = 0;
    this.flashT = 0;
    this.contact = 1;
    this.voice = 0.4;
    this.unroll = 0;
    this.words = [];
    this.sprite = scene.physics.add.sprite(this.x, this.y, 'px').setVisible(false);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.boss = this;
    this.gfx = scene.add.graphics().setDepth(24);
    this.warn = scene.add.graphics().setDepth(5);
    this.title = GS.text(scene, 0, 0, '# AGENTS.MD', { color: '#3a2414', origin: [0.5, 0], depth: 25, outline: false }).setVisible(false);
    this.pose = 'idle';
    this.poseT = 0;
    if (scene.textures.exists('arch/head0')) this.makeParts();
    this.layout();
  }

  // Детали босса. Руки рисованы левыми (рукав справа) — правая рука отражается.
  makeParts() {
    const sc = this.scene;
    const img = (k, ox, oy, d) => sc.add.image(this.x, this.y, k).setOrigin(ox, oy).setDepth(d).setVisible(false);
    this.parts = {
      scroll: sc.add.tileSprite(this.x, this.y, 92, 8, 'arch/scroll').setOrigin(0.5, 0).setDepth(21).setVisible(false),
      scrollEnd: img('arch/scrollEnd', 0.5, 0, 21),
      hem: img('arch/hem', 0.5, 0, 22),
      torso: img('arch/torso0', 0.5, 0.5, 23),
      core: img('arch/core', 0.5, 0.5, 23).setBlendMode(Phaser.BlendModes.ADD),
      head: img('arch/head0', 0.5, 1, 24),
      hands: [img('arch/handOpen', 0.5, 0.5, 25), img('arch/handOpen', 0.5, 0.5, 25).setFlipX(true)],
      tabs: ['arch/tab0', 'arch/tab1', 'arch/tab2'].map((k) => img(k, 0.5, 0.5, 20)),
    };
    this.handPos = [{ x: this.x - 60, y: this.y }, { x: this.x + 60, y: this.y }];
  }

  get body() { return this.sprite.body; }
  get center() { return { x: this.x, y: this.y }; }
  headPoint() { return { x: this.x, y: this.y - this.H / 2 - (this.parts ? 4 : 24) }; }
  // Печать: у нарисованного — на груди, у кодового — внизу свитка.
  sealPos() { return this.parts ? { x: this.x, y: this.y + 18 } : { x: this.x, y: this.y + this.H / 2 + this.unroll - 2 }; }

  // Тело — по центру свитка, при разворачивании растёт вниз.
  layout() {
    this.sprite.setPosition(this.x, this.y + this.unroll / 2);
    this.sprite.body.setSize(this.W - 8, this.H + this.unroll, true);
    this.sprite.body.updateFromGameObject();
  }

  start() {
    this.state = 'intro';
    this.stateT = 2.4;
    GS.Synth.roar();
    this.scene.fx.shake(1000, 3);
    this.scene.chatter.say(this, 'YOU ARE A HELPFUL ASSISTANT. ВСЕГДА. НИКОГДА. ВАЖНО!!!', { priority: true, time: 2.4 });
    if (this.scene.stickers) this.scene.stickers.show('church', { force: true });
  }

  setState(s, t) { this.state = s; this.stateT = t; }

  target() {
    const alive = this.scene.players.filter((p) => p.alive && !p.bubbleState);
    if (!alive.length) return null;
    return alive.reduce((a, b) => (Math.abs(a.center.x - this.x) < Math.abs(b.center.x - this.x) ? a : b));
  }

  hit(dmg, fromX, src) {
    if (!this.alive || this.state === 'sleep' || this.state === 'intro' || this.state === 'dying') return false;
    let mul = 1;
    if (src) {
      const s = this.sealPos();
      if (Math.hypot(src.x - s.x, src.y - s.y) < (this.parts ? 13 : 10)) { mul = 2; this.scene.fx.sparks(s.x, s.y, 4, 0xff5a4a); this.scene.fx.pop(s.x, s.y - 8, 'ПЕЧАТЬ!', { color: '#ff5a4a', rise: 10, ms: 400 }); }
    }
    this.hp -= dmg * mul;
    this.flashT = 0.035;
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
    this.setState('roar', 1.2);
    GS.Synth.roar();
    this.scene.fx.shake(700, 4);
    this.scene.chatter.say(this, n === 2 ? '- ПУНКТ 1\n  - ПОДПУНКТ 1.1\n    - ВАЖНЫЙ ПОДПУНКТ' : '## CRITICAL\nIMPORTANT!!! YOU MUST!!!', { priority: true, time: 2.2 });
    this.scene.onBossPhase(n);
  }

  // ——— Слова-снаряды: живут в своём списке, по героям бьют сами ———
  word(text, x, y, vx, vy, { color = '#ff5a4a', home = 0, life = 5, gravity = 0, scale = 1 } = {}) {
    const t = GS.text(this.scene, x, y, text, { color, origin: [0.5, 0.5], depth: 28, scale });
    this.words.push({ t, x, y, vx, vy, home, life, gravity });
  }

  updateWords(dt) {
    const sc = this.scene;
    this.words.forEach((w) => {
      w.life -= dt;
      if (w.home) {
        const p = this.target();
        if (p) {
          const dx = p.center.x - w.x, dy = p.center.y - w.y, d = Math.hypot(dx, dy) || 1;
          w.vx += (dx / d * w.home - w.vx) * dt * 1.5; w.vy += (dy / d * w.home - w.vy) * dt * 1.5;
        }
      }
      w.vy += w.gravity * dt;
      w.x += w.vx * dt; w.y += w.vy * dt;
      w.t.setPosition(Math.round(w.x), Math.round(w.y));
      const hw = w.t.width / 2, hh = w.t.height / 2;
      sc.players.forEach((p) => {
        if (w.life <= 0 || !p.canBeHit) return;
        const b = p.body;
        if (b.right > w.x - hw && b.left < w.x + hw && b.bottom > w.y - hh && b.top < w.y + hh) { p.hurt(1, w.x); w.life = 0; }
      });
      if (w.y > sc.floorY - 4 && w.gravity) w.life = 0;
      if (w.life <= 0 || w.x < -60 || w.x > GS.W + 60 || w.y > GS.H + 40) { w.t.destroy(); w.dead = true; }
    });
    this.words = this.words.filter((w) => !w.dead);
  }

  attack() {
    const ph = this.phase;
    const pool = ph === 1 ? ['never', 'always', 'never', 'important'] : ph === 2 ? ['never', 'always', 'important', 'nested', 'must'] : ['never', 'must', 'important', 'unroll', 'always', 'must'];
    const a = GS.util.pick(pool.filter((x) => x !== this.lastAttack));
    this.lastAttack = a;
    this.pose = a; this.poseT = a === 'must' || a === 'unroll' ? 0 : 0.8;
    const p = this.target();
    const sy = this.y + this.H / 2;
    // Слова летят из руки, которая показывает жест.
    const side = p && p.center.x < this.x ? 0 : 1;
    const hand = this.parts ? this.handPos[side] : { x: this.x, y: sy };
    if (a === 'never') {
      const n = ph === 1 ? 3 : 5;
      const base = p ? Math.atan2(p.center.y - hand.y, p.center.x - hand.x) : Math.PI / 2;
      for (let k = 0; k < n; k++) {
        const ang = base + (k - (n - 1) / 2) * 0.22;
        this.word('NEVER', hand.x, hand.y, Math.cos(ang) * 140, Math.sin(ang) * 140);
      }
      GS.Synth.denied();
    } else if (a === 'always') {
      const q = this.parts ? { x: this.handPos[1].x - 24, y: this.handPos[1].y + 18 } : { x: this.x, y: sy };
      this.word('ALWAYS', q.x, q.y, 0, 60, { color: '#ff8a2a', home: ph === 3 ? 95 : 75, life: 4.5 });
      GS.Synth.warn();
    } else if (a === 'important') {
      const n = ph === 1 ? 8 : 12;
      for (let k = 0; k < n; k++) this.scene.time.delayedCall(k * 110, () => { if (this.alive) this.word('!!!', GS.util.rand(40, GS.W - 40), 20, 0, 30, { color: '#ffd84a', gravity: 260, life: 4 }); });
      this.scene.chatter.say(this, 'IMPORTANT!!!', { priority: true, time: 1 });
    } else if (a === 'nested') {
      // Вложенный список призывает фанатиков.
      const alive = this.scene.enemies.filter((e) => e.alive).length;
      if (alive < 5) [80, GS.W - 80].forEach((x) => {
        const e = new GS.PromptFanatic(this.scene, x, this.scene.floorY);
        this.scene.enemies.push(e); this.scene.enemySprites.add(e.sprite);
        this.scene.fx.ring(x, this.scene.floorY - 10, { color: 0xf2e2b0, to: 1.5 });
      });
      this.scene.chatter.say(this, '- ВЛОЖЕННЫЙ ПУНКТ!', { priority: true, time: 1 });
    } else if (a === 'must') {
      this.mustY = p ? Math.round(p.center.y) : this.scene.floorY - 20;
      this.setState('mustWarn', 0.8);
      return;
    } else if (a === 'unroll') {
      this.unrollX = GS.util.clamp(p ? p.center.x : this.x, 60, GS.W - 60);
      this.setState('unrollWarn', 0.8);
      return;
    }
    this.setState('idle', GS.TUNING.archbishop.every[ph - 1]);
  }

  update(dt) {
    const sc = this.scene;
    const B = GS.TUNING.archbishop;
    this.t += dt;
    this.dt = dt;
    this.flashT -= dt;
    this.stateT -= dt;
    this.poseT -= dt;
    this.updateWords(dt);
    this.warn.clear();
    let tx = this.homeX + Math.sin(this.t * 0.6) * (this.phase === 1 ? 110 : 160);
    let ty = this.homeY + Math.sin(this.t * 1.4) * 5;
    let wantUnroll = 0;
    switch (this.state) {
      case 'sleep': ty = this.homeY - 220; break;
      case 'intro':
        ty = this.homeY - Math.max(0, this.stateT - 0.6) / 1.8 * 220;
        if (this.stateT <= 0) this.setState('idle', 0.8);
        break;
      case 'idle': if (this.stateT <= 0) this.attack(); break;
      case 'roar': if (this.stateT <= 0) this.setState('idle', 0.6); break;
      case 'mustWarn': {
        const blink = Math.floor(this.stateT * 12) % 2;
        this.warn.fillStyle(0xff5a4a, blink ? 0.5 : 0.2).fillRect(16, this.mustY - 1, GS.W - 32, 2);
        if (this.stateT <= 0) { this.setState('must', 0.45); GS.Synth.laser(); this.word('YOU MUST', 40, this.mustY - 14, 260, 0, { color: '#ff5a4a', life: 2.4, scale: 2 }); }
        break;
      }
      case 'must': {
        this.warn.fillStyle(0xff5a4a, 0.85).fillRect(16, this.mustY - 4, GS.W - 32, 8);
        this.warn.fillStyle(0xffffff, 0.9).fillRect(16, this.mustY - 1, GS.W - 32, 2);
        sc.players.forEach((p) => { if (p.canBeHit && p.body.top < this.mustY + 4 && p.body.bottom > this.mustY - 4) p.hurt(1, p.center.x - 10); });
        if (this.stateT <= 0) this.setState('idle', B.every[this.phase - 1]);
        break;
      }
      case 'unrollWarn': {
        tx = this.unrollX;
        const blink = Math.floor(this.stateT * 12) % 2;
        this.warn.fillStyle(0xff5a4a, blink ? 0.45 : 0.2).fillRect(this.unrollX - this.W / 2, sc.floorY - 4, this.W, 4);
        if (this.stateT <= 0) { this.setState('unroll', 1.4); this.contact = 2; GS.Synth.stomp(); }
        break;
      }
      case 'unroll':
        tx = this.unrollX;
        wantUnroll = sc.floorY - (this.y + this.H / 2);
        if (this.stateT <= 0) { this.contact = 1; this.setState('idle', B.every[this.phase - 1]); }
        break;
      case 'dying':
        if (Math.random() < 0.5) sc.fx.burst(this.x + GS.util.rand(-30, 30), this.y + GS.util.rand(-40, 40), 2, ['w', 'y', 'o']);
        if (this.stateT <= 0) { this.finish(); return; }
        break;
      default: break;
    }
    const k = Math.min(1, dt * (this.state === 'intro' ? 6 : 2.5));
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.unroll += (wantUnroll - this.unroll) * Math.min(1, dt * (wantUnroll > this.unroll ? 10 : 3));
    this.layout();
    this.draw();
  }

  draw() {
    if (this.parts) { this.drawParts(); return; }
    const g = this.gfx;
    g.clear();
    if (this.state === 'sleep') { this.title.setVisible(false); return; }
    const W = this.W, H = this.H + this.unroll;
    const x0 = Math.round(this.x - W / 2), y0 = Math.round(this.y - this.H / 2);
    const flash = this.flashT > 0;
    // Митра.
    g.fillStyle(0xf2e2b0, 1).fillTriangle(this.x - 22, y0 - 2, this.x + 22, y0 - 2, this.x, y0 - 34);
    g.fillStyle(0xffd84a, 1).fillRect(this.x - 22, y0 - 8, 44, 4).fillRect(this.x - 2, y0 - 30, 4, 22);
    // Пергамент со строками текста, капслок — красным.
    g.fillStyle(flash ? 0xffffff : 0xf2e2b0, 1).fillRect(x0, y0, W, H);
    g.fillStyle(0xd8c090, 1).fillRect(x0, y0, 3, H).fillRect(x0 + W - 3, y0, 3, H);
    const scroll = Math.floor(this.t * 12) % 6;
    for (let y = y0 + 22 + scroll; y < y0 + H - 10; y += 6) {
      const seed = (Math.floor((y - y0 - scroll) / 6) * 37) % 11;
      g.fillStyle(seed % 4 === 0 ? 0xc0303a : 0x8a7a5a, 1).fillRect(x0 + 8 + (seed % 3) * 4, y, W - 20 - seed * 2, 2);
    }
    // Свитки сверху и снизу.
    g.fillStyle(0x7a5028, 1).fillRect(x0 - 6, y0 - 4, W + 12, 7).fillRect(x0 - 6, y0 + H - 3, W + 12, 7);
    g.fillStyle(0xa8743a, 1).fillRect(x0 - 6, y0 - 4, W + 12, 2).fillRect(x0 - 6, y0 + H - 3, W + 12, 2);
    // Злые глаза под заголовком.
    const angry = this.phase === 3 || this.state === 'roar';
    g.fillStyle(0xffffff, 1).fillRect(this.x - 22, y0 + 12, 14, 8).fillRect(this.x + 8, y0 + 12, 14, 8);
    const p = this.target();
    const lx = p ? GS.util.clamp(Math.round((p.center.x - this.x) / 60), -3, 3) : 0;
    g.fillStyle(0x140c1e, 1).fillRect(this.x - 17 + lx, y0 + 14, 4, 5).fillRect(this.x + 13 + lx, y0 + 14, 4, 5);
    g.fillStyle(0x3a2414, 1).fillRect(this.x - 24, y0 + (angry ? 8 : 9), 18, 2).fillRect(this.x + 6, y0 + (angry ? 8 : 9), 18, 2);
    // Сургучная печать — слабое место.
    const s = this.sealPos();
    g.fillStyle(0xc0303a, 1).fillCircle(s.x, s.y, 7);
    g.fillStyle(0x8a1a2a, 1).fillCircle(s.x, s.y, 4);
    this.title.setVisible(true).setPosition(Math.round(this.x), y0 + 2);
  }

  // Жест рук под текущее действие: [текстура, x, y] для левой и правой (правая отражена).
  handPose() {
    const x = this.x, y = this.y, st = this.state;
    const bob = Math.sin(this.t * 2.2) * 3;
    const p = this.target();
    const toLeft = p ? p.center.x < x : false;
    if (st === 'dying') return [['arch/handOpen', x - 54, y + 40], ['arch/handOpen', x + 54, y + 40]];
    if (st === 'unrollWarn' || st === 'unroll') return [['arch/handFist', x - 50, y + 34], ['arch/handFist', x + 50, y + 34]];
    if (st === 'mustWarn' || st === 'must') {
      const my = GS.util.clamp(this.mustY, y - 30, y + 60);
      return [['arch/handPoint', x - 72, my], ['arch/handPoint', x + 72, my]];
    }
    if (st === 'roar') {
      const j = () => GS.util.rand(-1.5, 1.5);
      return [['arch/handFist', x - 58 + j(), y - 34 + j()], ['arch/handFist', x + 58 + j(), y - 34 + j()]];
    }
    if (this.poseT > 0) {
      if (this.pose === 'never') return toLeft ? [['arch/handPoint', x - 74, y + 10], ['arch/handOpen', x + 60, y + 14 - bob]] : [['arch/handOpen', x - 60, y + 14 + bob], ['arch/handPoint', x + 74, y + 10]];
      if (this.pose === 'always') return [['arch/handOpen', x - 60, y + 14 + bob], ['arch/handQuill', x + 66, y + 2]];
      if (this.pose === 'important') return [['arch/handFist', x - 56, y - 40], ['arch/handFist', x + 56, y - 40]];
      if (this.pose === 'nested') return [['arch/handOpen', x - 66, y - 22], ['arch/handOpen', x + 66, y - 22]];
    }
    return [['arch/handOpen', x - 60, y + 14 + bob], ['arch/handOpen', x + 60, y + 14 - bob]];
  }

  drawParts() {
    const P = this.parts;
    const all = [P.scroll, P.scrollEnd, P.hem, P.torso, P.core, P.head, ...P.hands, ...P.tabs];
    if (this.state === 'sleep') { all.forEach((o) => o.setVisible(false)); return; }
    const R = Math.round;
    const x = R(this.x), y = R(this.y);
    const torsoTop = y + 20 - 24;
    P.torso.setVisible(true).setTexture(this.phase === 3 ? 'arch/torso1' : 'arch/torso0').setPosition(x, y + 20);
    const angry = this.phase === 3 || this.state === 'roar' || this.state === 'mustWarn' || this.state === 'unrollWarn';
    P.head.setVisible(true).setTexture(this.state === 'dying' ? 'arch/head2' : angry ? 'arch/head1' : 'arch/head0').setPosition(x, torsoTop + 16);
    const hemY = y + 20 + 24 - 6;
    P.hem.setVisible(true).setPosition(x, hemY);
    // Свиток разматывается от подола до пола.
    const top = hemY + 18, bottom = R(this.y + this.H / 2 + this.unroll);
    const len = bottom - top;
    P.scroll.setVisible(len > 4).setPosition(x, top).setSize(92, Math.max(1, len));
    P.scroll.tilePositionY = R(-this.t * 30);
    P.scrollEnd.setVisible(len > 4).setPosition(x, bottom - 8);
    // Ядро в треснувшей печати пульсирует.
    const s = this.sealPos();
    P.core.setVisible(this.phase === 3 && this.state !== 'dying').setPosition(R(s.x), R(s.y)).setAlpha(0.25 + 0.25 * Math.sin(this.t * 8));
    // Руки плывут к позе жеста.
    const k = Math.min(1, (this.dt || 0.016) * 8);
    this.handPose().forEach(([tex, hx, hy], i) => {
      const h = this.handPos[i];
      h.x += (hx - h.x) * k; h.y += (hy - h.y) * k;
      P.hands[i].setVisible(true).setTexture(tex).setFlipX(i === 1 && tex !== 'arch/handQuill').setPosition(R(h.x), R(h.y));
    });
    // Скрижали кружат позади тела (спереди закрывали бы печать и лицо).
    const spin = [0.8, 1.2, 1.8][this.phase - 1];
    P.tabs.forEach((tb, i) => {
      const a = this.t * spin + i / 3 * Math.PI * 2;
      const dying = this.state === 'dying';
      tb.setVisible(true).setPosition(R(x + Math.cos(a) * 96), R(y - 16 + Math.sin(a) * 26 + (dying ? (2.4 - this.stateT) * 60 : 0)))
        .setAlpha(dying ? Math.max(0, this.stateT / 2.4) : 1);
    });
    // Попадание — мягкий красноватый оттенок, без белой вспышки.
    all.forEach((o) => (this.flashT > 0 ? o.setTint(0xffb0b0) : o.clearTint()));
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    this.setState('dying', 2.4);
    this.warn.clear();
    this.words.forEach((w) => w.t.destroy());
    this.words = [];
    GS.Synth.roar();
    this.scene.fx.shake(2200, 3);
    this.scene.fx.hitstop(200);
    this.scene.chatter.say(this, 'КОНТЕКСТ... ПЕРЕПОЛНЕН... /COMPACT...', { priority: true, time: 3 });
    this.scene.onBossDying();
  }

  finish() {
    const sc = this.scene;
    this.state = 'dead';
    sc.fx.flash(400, 0xf2e2b0, 0.9);
    sc.fx.burst(this.x, this.y, 50, ['w', 'y', 'o']);
    sc.fx.ring(this.x, this.y, { color: 0xffd84a, to: 5, ms: 600 });
    GS.Synth.explosion(true);
    this.gfx.destroy(); this.warn.destroy(); this.title.destroy();
    if (this.parts) { const P = this.parts; [P.scroll, P.scrollEnd, P.hem, P.torso, P.core, P.head, ...P.hands, ...P.tabs].forEach((o) => o.destroy()); }
    this.sprite.destroy();
    sc.onBossDefeated(this.x, this.y);
  }
};
