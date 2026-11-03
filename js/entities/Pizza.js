// «Пицца-вселенная»: колесо из кусков пиццы, сырные мосты, пепперони-пилы, печной жар, враги-топпинги
// и босс «ПИЦЦА 4 СЫРА АПОКАЛИПСИСА». Арт процедурный; нарисованные листы с теми же ключами его заменят.
GS.PizzaArt = {
  make(scene) {
    const mk = (key, w, h, fn, outline = true) => { if (!scene.textures.exists(key)) GS.makeTex(scene, key, w, h, fn, { outline }); };
    const CRUST = '#d9822b', CRUST_L = '#f2b25a', CHEESE = '#ffd84a', CHEESE_D = '#e0a020', SAUCE = '#c0302a', PEP = '#a82424', PEP_D = '#6e1414';
    // Кусок-платформа колеса: корочка сверху, сыр и пепперони.
    mk('pizza/slicePlat', 28, 8, (p) => {
      p.rect(0, 0, 28, 3, CRUST); p.rect(0, 0, 28, 1, CRUST_L); p.rect(1, 3, 26, 3, CHEESE); p.rect(3, 6, 22, 2, CHEESE_D);
      p.circle(7, 4.5, 1.6, PEP); p.circle(19, 4.5, 1.6, PEP); p.px(13, 5, '#4fa83c');
    });
    // Сырный мост: целый и растянутый (провис, тянутся нити).
    mk('pizza/cheese0', 16, 6, (p) => { p.rect(0, 0, 16, 4, CHEESE); p.rect(0, 0, 16, 1, '#fff2a8'); p.rect(2, 4, 3, 2, CHEESE_D); p.rect(10, 4, 2, 2, CHEESE_D); });
    mk('pizza/cheese1', 16, 8, (p) => { p.rect(0, 2, 16, 3, CHEESE); p.rect(0, 2, 16, 1, '#fff2a8'); p.rect(3, 5, 1, 3, CHEESE); p.rect(8, 5, 1, 3, CHEESE_D); p.rect(12, 5, 1, 2, CHEESE); });
    // Пепперони-пила.
    mk('pizza/saw', 14, 14, (p) => {
      for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; p.px(Math.round(7 + Math.cos(t) * 6.5), Math.round(7 + Math.sin(t) * 6.5), '#e2e4f0'); }
      p.circle(7, 7, 5.5, PEP); p.circle(5, 5, 1, PEP_D); p.circle(9, 8, 1, PEP_D); p.circle(6, 9, 0.8, PEP_D); p.px(9, 4, '#ff7a6a');
    });
    // Нож-колесо для пиццы (оружие босса): два кадра — спицы «+» и «×», вращение без поворота спрайта.
    [0, 1].forEach((f) => mk('pizza/cutter' + f, 22, 22, (p) => {
      p.circle(11, 11, 10.5, '#8a8ca8'); p.circle(11, 11, 9, '#e2e4f0'); p.circle(11, 11, 7, '#b8bad0');
      for (let k = 0; k < 4; k++) {
        const a = (k / 4 + (f ? 1 / 8 : 0)) * Math.PI * 2;
        p.line(11, 11, Math.round(11 + Math.cos(a) * 7), Math.round(11 + Math.sin(a) * 7), '#6a6c88');
      }
      p.circle(11, 11, 2.5, SAUCE); p.px(10, 10, '#ff7a6a'); p.px(5, 4, '#ffffff'); p.px(4, 5, '#ffffff');
    }));
    // Печная решётка.
    mk('pizza/vent', 20, 6, (p) => { p.rect(0, 0, 20, 6, '#3a2a2a'); for (let x = 2; x < 18; x += 4) p.rect(x, 1, 2, 4, '#ff8a2a'); p.rect(0, 0, 20, 1, '#5a4a4a'); });
    // Ананас-еретик: два кадра (стоит / замахнулся).
    [0, 1].forEach((f) => mk('pizza/pineapple' + f, 14, 20, (p) => {
      p.rect(5, 0, 1, 4, '#4fa83c'); p.rect(7, 0, 1, 5, '#4fa83c'); p.rect(9, 1, 1, 3, '#4fa83c'); p.rect(4, 3, 7, 2, '#2f7a2a');
      p.ellipse(7, 12, 5, 7, '#e0a020');
      for (let y = 7; y < 19; y += 3) for (let x = 3; x < 12; x += 3) p.px(x + (y % 2), y, '#a8701a');
      p.rect(3, 6, 9, 2, '#6a2a8a'); // капюшон-повязка еретика
      p.rect(5, 9, 2, 2, '#ffffff'); p.rect(8, 9, 2, 2, '#ffffff'); p.px(6, 10, '#140c1e'); p.px(9, 10, '#140c1e');
      p.rect(5, 13, 4, 1, '#140c1e');
      if (f) { p.rect(11, 5, 2, 5, '#a8701a'); p.rect(11, 3, 3, 3, '#e0a020'); } else p.rect(11, 11, 2, 4, '#a8701a');
    }));
    mk('shot/pineapple', 7, 7, (p) => { p.poly([[0, 7], [3, 0], [7, 7]], '#e0a020'); p.px(3, 3, '#a8701a'); p.px(2, 5, '#a8701a'); p.px(4, 5, '#a8701a'); });
    // Оливка-дрон с пропеллером.
    [0, 1].forEach((f) => mk('pizza/olive' + f, 11, 10, (p) => {
      p.rect(f ? 1 : 3, 0, f ? 9 : 5, 1, '#a8acc4'); p.px(5, 1, '#5a5a80');
      p.ellipse(5.5, 6, 4.5, 3.5, '#2a2a2a'); p.ellipse(5.5, 6, 1.6, 1.4, SAUCE); p.px(3, 4, '#5a5a6a');
      p.px(3, 6, '#ffffff'); p.px(8, 6, '#ffffff');
    }));
    // Оливка-пуля: яркая зелёная со светлым ободком — в потоке босса её должно быть видно на ночном небе.
    mk('shot/olive', 8, 7, (p) => {
      p.ellipse(4, 3.5, 4, 3.5, '#fff2a8'); p.ellipse(4, 3.5, 3, 2.5, '#9ad84a'); p.rect(2, 4, 4, 1, '#5aa02a');
      p.rect(3, 2, 2, 2, SAUCE); p.px(2, 1, '#ffffff');
    }, false);
    mk('shot/cheese', 5, 7, (p) => { p.rect(1, 0, 3, 4, CHEESE); p.ellipse(2.5, 5, 2.5, 2, CHEESE); p.px(2, 1, '#fff2a8'); });
    // Сырный слайм (большой и маленький), второй кадр — в прыжке.
    [0, 1].forEach((f) => {
      mk('pizza/slime' + f, 18, 14, (p) => {
        if (f) p.ellipse(9, 7, 7, 7, CHEESE); else p.ellipse(9, 9, 9, 5, CHEESE);
        p.rect(1, f ? 7 : 9, 16, f ? 4 : 5, CHEESE); p.px(5, f ? 9 : 11, CHEESE_D); p.circle(12, f ? 9 : 11, 1.2, CHEESE_D); p.px(9, f ? 3 : 6, '#fff2a8');
        p.rect(6, f ? 6 : 8, 2, 2, '#140c1e'); p.rect(11, f ? 6 : 8, 2, 2, '#140c1e');
      });
      mk('pizza/slimeS' + f, 10, 8, (p) => {
        p.ellipse(5, f ? 4 : 5, 5, f ? 4 : 3, CHEESE); p.rect(1, f ? 4 : 5, 8, 3, CHEESE);
        p.px(3, f ? 3 : 4, '#140c1e'); p.px(6, f ? 3 : 4, '#140c1e');
      });
    });
    // Курьер-хрючево на мопеде с коробкой пиццы. Кадры — поворот колёс.
    [0, 1].forEach((f) => mk('pizza/courier' + f, 30, 22, (p) => {
      p.rect(0, 6, 9, 7, '#c8a070'); p.rect(0, 6, 9, 1, '#e8c890'); p.rect(2, 8, 5, 1, SAUCE); // коробка
      p.rect(6, 13, 18, 4, '#d0303a'); p.rect(20, 7, 3, 7, '#d0303a'); p.rect(19, 5, 6, 2, '#5a5a6a'); p.rect(8, 12, 10, 2, '#3a3a4a');
      p.circle(11, 6, 5, '#ff9ad0'); p.rect(8, 0, 7, 3, '#ffd84a'); p.ellipse(15, 7, 2.5, 2, '#ffb0d8'); p.px(14, 7, '#a0306a'); p.px(16, 7, '#a0306a'); p.px(12, 4, '#140c1e');
      [6, 22].forEach((x) => { p.circle(x, 18, 3.5, '#2a2a2a'); p.px(x + (f ? 1 : -1), 18, '#8a8aa8'); p.px(x, 18 + (f ? -1 : 1), '#8a8aa8'); });
    }));
    // Летящий кусок пиццы (оторвался от босса) и пепперони — слабое место босса.
    mk('pizza/slice', 26, 22, (p) => {
      p.poly([[0, 0], [26, 0], [13, 22]], CHEESE); p.rect(0, 0, 26, 4, CRUST); p.rect(0, 0, 26, 1, CRUST_L);
      p.circle(9, 8, 2.4, PEP); p.circle(16, 9, 2.4, PEP); p.circle(13, 15, 1.8, PEP); p.px(11, 11, '#4fa83c');
    });
    mk('pizza/pep', 11, 11, (p) => { p.circle(5.5, 5.5, 5, PEP); p.circle(4, 4, 1, PEP_D); p.circle(7, 7, 1.2, PEP_D); p.px(3, 7, PEP_D); p.px(7, 3, '#ff7a6a'); });
  },
};

// ——— Механики уровня ———

// Колесо пиццы: куски-платформы ездят по кругу и остаются горизонтальными, как кабинки колеса обозрения.
// Куски двигаются не скоростью, а прямо позицией, по целым пикселям, и везут стоящих на них героев на тот же шаг —
// иначе Arcade то отрывает героя от опускающегося куска, то подбрасывает, и он дёргается.
GS.PizzaWheel = class PizzaWheel {
  constructor(scene, x, y) {
    const C = GS.TUNING.pizza;
    this.scene = scene;
    this.cx = Math.round(x); this.cy = Math.round(y);
    this.r = C.wheelR;
    this.rot = 0;
    this.gfx = scene.add.graphics().setDepth(3);
    // Нарисованная ступица — маленькая пицца. Поворачивается только на четверть оборота: так пиксели не плывут.
    this.hub = scene.textures.exists('pizza/hub') ? scene.add.image(this.cx, this.cy, 'pizza/hub').setDepth(4) : null;
    this.plats = [];
    for (let i = 0; i < C.wheelSlices; i++) {
      const s = scene.physics.add.image(x, y, 'pizza/slicePlat').setDepth(5);
      s.body.setAllowGravity(false).setImmovable(true);
      s.body.moves = false;
      s.body.checkCollision.down = false; s.body.checkCollision.left = false; s.body.checkCollision.right = false;
      s.owner = this;
      this.plats.push(s);
      scene.platforms.add(s);
    }
    this.place();
  }
  place() {
    const n = this.plats.length;
    this.plats.forEach((s, i) => {
      const a = this.rot + i / n * Math.PI * 2;
      s.setPosition(Math.round(this.cx + Math.cos(a) * this.r), Math.round(this.cy + Math.sin(a) * this.r));
      s.body.updateFromGameObject();
    });
  }
  // Герой стоит на куске: падает или стоит, ноги на верхней кромке, по ширине над куском.
  rider(p, s) {
    if (!p.alive || p.bubbleState || p.inMech) return false;
    const b = p.body, top = s.y - s.height / 2;
    return b.velocity.y >= 0 && Math.abs(b.bottom - top) <= 2 && b.right > s.x - s.width / 2 && b.left < s.x + s.width / 2;
  }
  update(dt) {
    this.rot += GS.TUNING.pizza.wheelSpeed * dt;
    const riders = this.scene.players.map((p) => this.plats.find((s) => this.rider(p, s)) || null);
    const was = this.plats.map((s) => [s.x, s.y]);
    this.place();
    riders.forEach((s, i) => {
      if (!s) return;
      const [x0, y0] = was[this.plats.indexOf(s)];
      const p = this.scene.players[i];
      p.sprite.x += s.x - x0;
      p.sprite.y += s.y - y0;
    });
    const g = this.gfx;
    g.clear();
    // Сырные нити-спицы — пунктир из целых пикселей, и ступица-пицца.
    g.fillStyle(0xffd84a, 0.85);
    this.plats.forEach((s) => {
      const ex = s.x, ey = s.y + 2, d = Math.hypot(ex - this.cx, ey - this.cy), n = Math.floor(d / 4);
      for (let k = 3; k < n; k++) g.fillRect(Math.round(this.cx + (ex - this.cx) * k / n) - 1, Math.round(this.cy + (ey - this.cy) * k / n) - 1, 2, 2);
    });
    if (this.hub) this.hub.rotation = Math.floor(this.rot / (Math.PI / 2)) * (Math.PI / 2);
    else {
      g.fillStyle(0xd9822b, 1).fillCircle(this.cx, this.cy, 11);
      g.fillStyle(0xffd84a, 1).fillCircle(this.cx, this.cy, 8);
      g.fillStyle(0xa82424, 1).fillCircle(this.cx - 3, this.cy - 2, 2).fillCircle(this.cx + 3, this.cy + 2, 2);
    }
  }
};

// Сырный мост: постоял — сыр тянется, потом рвётся; через несколько секунд застывает снова.
GS.CheeseBridge = class CheeseBridge {
  constructor(scene, x, y) {
    this.scene = scene;
    this.baseY = y + 3;
    this.sprite = scene.physics.add.staticImage(x + 8, this.baseY, 'pizza/cheese0').setDepth(5);
    this.sprite.owner = this;
    this.state = 'solid';
    this.t = 0;
  }
  touch() { if (this.state === 'solid') { this.state = 'stretch'; this.t = GS.TUNING.pizza.bridgeHold; } }
  // После смерти мосты сразу целые — не ждать, пока сыр застынет.
  onRespawn() {
    this.state = 'solid'; this.t = 0;
    this.sprite.setVisible(true).setTexture('pizza/cheese0'); this.sprite.y = this.baseY; this.sprite.body.enable = true;
  }
  update(dt) {
    const s = this.sprite;
    if (this.state === 'stretch') {
      this.t -= dt;
      const tear = this.t < GS.TUNING.pizza.bridgeHold * 0.5;
      s.setTexture(tear ? 'pizza/cheese1' : 'pizza/cheese0');
      s.y = this.baseY + (tear ? 1 : 0);
      if (tear && Math.random() < 0.15) this.scene.fx.burst(s.x, s.y + 3, 1, ['y']);
      if (this.t <= 0) {
        this.state = 'gone'; this.t = GS.TUNING.pizza.bridgeRespawn;
        s.setVisible(false); s.body.enable = false;
        this.scene.fx.burst(s.x, s.y, 6, ['y', 'o']);
        GS.Synth.splat();
      }
    } else if (this.state === 'gone') {
      this.t -= dt;
      if (this.t <= 0 && !this.scene.players.some((p) => p.alive && Phaser.Geom.Intersects.RectangleToRectangle(p.sprite.getBounds(), s.getBounds()))) {
        this.state = 'solid'; s.setVisible(true).setTexture('pizza/cheese0'); s.y = this.baseY; s.body.enable = true;
        this.scene.fx.burst(s.x, s.y, 3, ['y']);
      }
    }
  }
};

// Пепперони-пила: катается по рельсу туда-обратно и крутится.
GS.PepperoniSaw = class PepperoniSaw {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x0 = x; this.y = y;
    this.t = Math.random() * 6;
    const R = GS.TUNING.pizza.sawRange;
    this.rail = scene.add.graphics().setDepth(4);
    this.rail.fillStyle(0x5a4a4a, 1).fillRect(x - R - 4, y - 1, R * 2 + 8, 2).fillRect(x - R - 4, y - 3, 2, 6).fillRect(x + R + 2, y - 3, 2, 6);
    this.img = scene.add.image(x, y, 'pizza/saw').setDepth(6);
  }
  update(dt) {
    const C = GS.TUNING.pizza;
    this.t += dt;
    const x = Math.round(this.x0 + Math.sin(this.t * C.sawSpeed) * C.sawRange);
    this.img.setPosition(x, this.y);
    this.img.rotation += dt * 10;
    this.scene.players.forEach((p) => {
      if (!p.alive || p.bubbleState || !p.canBeHit) return;
      const b = p.body;
      const nx = GS.util.clamp(x, b.left, b.right), ny = GS.util.clamp(this.y, b.top, b.bottom);
      if (Math.hypot(nx - x, ny - this.y) < 6) p.hurt(1, x);
    });
  }
};

// Печной жар: восходящий поток над решёткой поднимает героев.
GS.OvenVent = class OvenVent {
  constructor(scene, x, y) {
    const C = GS.TUNING.pizza;
    this.scene = scene;
    this.x = x; this.bottom = y; this.top = y - C.ventHeight * 16;
    this.img = scene.add.image(x, y, 'pizza/vent').setOrigin(0.5, 1).setDepth(4);
    this.glow = scene.add.graphics().setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
    this.t = Math.random() * 3;
  }
  update(dt) {
    const C = GS.TUNING.pizza;
    this.t += dt;
    const g = this.glow;
    g.clear();
    for (let i = 0; i < 6; i++) {
      const y = this.bottom - ((this.t * 60 + i * 37) % (this.bottom - this.top));
      const a = 0.28 * (1 - (this.bottom - y) / (this.bottom - this.top));
      g.fillStyle(0xff8a2a, a).fillRect(this.x - 8 + ((i * 5) % 14), Math.round(y), 2, 6);
    }
    g.fillStyle(0xff8a2a, 0.06).fillRect(this.x - 10, this.top, 20, this.bottom - this.top);
    this.scene.players.forEach((p) => {
      if (!p.alive || p.bubbleState || p.inMech) return;
      const b = p.body;
      if (Math.abs(b.center.x - this.x) > 12 || b.bottom < this.top || b.bottom > this.bottom + 2) return;
      b.velocity.y = Math.max(b.velocity.y - C.ventLift * dt, -C.ventMax);
      p.jumping = false;
    });
  }
};

// ——— Враги-топпинги ———

const pizzaFlash = (e) => { if (e.view && e.view.active) e.view.setTintFill(0xffffff); };

// Ананас-еретик: стоит и бросает дольки ананаса навесом.
GS.PineappleHeretic = class PineappleHeretic extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.heretic;
    const view = scene.add.image(x, y, 'pizza/pineapple0').setOrigin(0.5, 1).setDepth(20);
    super(scene, x, y, cfg, { w: 22, h: 34, view });
    this.throwT = cfg.throwEvery * GS.util.rand(0.5, 1);
    this.armT = 0;
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); pizzaFlash(this); return r; }
  onDeath() {
    const c = this.center;
    GS.Synth.splat();
    this.scene.fx.burst(c.x, c.y, 10, ['y', 'g']);
    this.scene.fx.pop(c.x, c.y - 10, GS.util.pick(GS.LINES.enemy.heretic), { color: '#ffd84a' });
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    b.velocity.x *= 0.8;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    this.armT -= dt;
    if (p) {
      this.facing = p.center.x < this.center.x ? -1 : 1;
      this.throwT -= dt;
      if (this.throwT <= 0) {
        this.throwT = this.cfg.throwEvery;
        this.armT = 0.3;
        const x0 = this.center.x + this.facing * 4, y0 = b.top;
        const dx = p.center.x - x0;
        const tF = GS.util.clamp(Math.abs(dx) / 140, 0.6, 1.3);
        this.scene.shots.fireEnemy('pineapple', x0, y0, dx / tF, (p.center.y - y0 - 0.5 * GS.TUNING.gravity * tF * tF) / tF);
        GS.Synth.blip(0.8);
      }
      this.chat(GS.LINES.enemy.heretic, 0.01);
    }
    this.view.setPosition(Math.round(b.center.x), Math.round(b.bottom)).setTexture(this.armT > 0 ? 'pizza/pineapple1' : 'pizza/pineapple0').setFlipX(this.facing < 0);
    if (this.flashT <= 0) this.view.clearTint();
  }
};

// Оливка-дрон: кружит у гнезда, по очереди пикирует на героя.
GS.OliveDrone = class OliveDrone extends GS.Enemy {
  constructor(scene, x, y, idx = 0) {
    const cfg = GS.TUNING.enemies.olive;
    const view = scene.add.image(x, y, 'pizza/olive0').setDepth(20);
    super(scene, x, y, cfg, { w: 9, h: 8, gravity: false, view });
    this.home = { x, y: y - 30 };
    this.idx = idx;
    this.state = 'orbit';
    this.diveT = cfg.diveEvery + idx * 0.8;
    this.t = idx * 2.1;
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); pizzaFlash(this); return r; }
  onDeath() {
    const c = this.center;
    GS.Synth.bug();
    this.scene.fx.burst(c.x, c.y, 6, ['w', 'r']);
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const cfg = this.cfg;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, cfg.aggro);
    if (this.state === 'orbit') {
      const tx = this.home.x + Math.cos(this.t * 2) * 20, ty = this.home.y + Math.sin(this.t * 2) * 10;
      b.setVelocity((tx - b.center.x) * 5, (ty - b.center.y) * 5);
      if (p) {
        this.home.x += GS.util.clamp(p.center.x - this.home.x, -40 * dt, 40 * dt);
        this.diveT -= dt;
        if (this.diveT <= 0) {
          this.state = 'dive'; this.stateT = 1.1;
          const dx = p.center.x - b.center.x, dy = p.center.y - b.center.y, d = Math.hypot(dx, dy) || 1;
          b.setVelocity(dx / d * cfg.diveSpeed, dy / d * cfg.diveSpeed);
          GS.Synth.blip(1.6);
        }
      }
    } else {
      this.stateT -= dt;
      if (this.stateT <= 0) { this.state = 'orbit'; this.diveT = cfg.diveEvery * GS.util.rand(0.8, 1.3); }
    }
    this.view.setPosition(Math.round(b.center.x), Math.round(b.center.y)).setTexture('pizza/olive' + (Math.floor(this.t * 12) % 2));
    if (this.flashT <= 0) this.view.clearTint();
  }
};

// Сырный слайм: прыгает к героям; большой при смерти делится на два маленьких.
GS.CheeseSlime = class CheeseSlime extends GS.Enemy {
  constructor(scene, x, y, small = false) {
    const cfg = small ? GS.TUNING.enemies.slimeSmall : GS.TUNING.enemies.slime;
    const view = scene.add.image(x, y, small ? 'pizza/slimeS0' : 'pizza/slime0').setOrigin(0.5, 1).setDepth(20);
    // Хитбокс выше лежачей капли — чтобы выстрел с плеча попадал без приседа.
    super(scene, x, y, cfg, small ? { w: 18, h: 20, view } : { w: 34, h: 22, view });
    this.small = small;
    this.hopT = cfg.hopEvery * GS.util.rand(0.4, 1);
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); pizzaFlash(this); return r; }
  onDeath(fromX) {
    const c = this.center;
    GS.Synth.splat();
    this.scene.fx.burst(c.x, c.y, 8, ['y']);
    if (!this.small) {
      this.scene.fx.pop(c.x, c.y - 10, 'ДЕЛЮСЬ!', { color: '#ffd84a' });
      [-1, 1].forEach((s) => {
        const e = new GS.CheeseSlime(this.scene, c.x + s * 12, this.sprite.body.bottom, true);
        e.sprite.body.setVelocity(s * 90, -180);
        this.scene.enemies.push(e);
        this.scene.enemySprites.add(e.sprite);
      });
    }
    this.vanish();
  }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const ground = b.blocked.down;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, this.cfg.aggro);
    if (ground) {
      b.velocity.x *= 0.7;
      this.hopT -= dt;
      if (this.hopT <= 0) {
        this.hopT = this.cfg.hopEvery * GS.util.rand(0.8, 1.2);
        this.facing = p ? (p.center.x < this.center.x ? -1 : 1) : -this.facing;
        b.setVelocity(this.facing * this.cfg.hopVX, -this.cfg.hopVY);
        if (Math.random() < 0.4) GS.Synth.splat();
      }
    }
    if (b.blocked.left || b.blocked.right) this.facing *= -1;
    const key = (this.small ? 'pizza/slimeS' : 'pizza/slime') + (ground ? 0 : 1);
    this.view.setPosition(Math.round(b.center.x), Math.round(b.bottom)).setTexture(key).setFlipX(this.facing < 0);
    if (this.flashT <= 0) this.view.clearTint();
  }
};

// Курьер-хрючево на мопеде: катается, увидел героя на своей высоте — сигналит и таранит.
GS.CourierHog = class CourierHog extends GS.Enemy {
  constructor(scene, x, y) {
    const cfg = GS.TUNING.enemies.courier;
    const view = scene.add.image(x, y, 'pizza/courier0').setOrigin(0.5, 1).setDepth(20);
    super(scene, x, y, cfg, { w: 44, h: 34, view });
    this.state = 'patrol';
    this.stateT = 1;
    this.homeX = x;
    this.wheel = 0;
  }
  hit(dmg, fromX, src) { const r = super.hit(dmg, fromX, src); pizzaFlash(this); return r; }
  update(dt) {
    this.baseUpdate(dt);
    const b = this.sprite.body;
    const cfg = this.cfg;
    this.stateT -= dt;
    const p = this.scene.nearestPlayer(this.center.x, this.center.y, cfg.sight);
    const edgeAhead = () => !this.scene.isSolidAt(this.facing > 0 ? b.right + 6 : b.left - 6, b.bottom + 4);
    switch (this.state) {
      case 'patrol':
        b.velocity.x = GS.util.approach(b.velocity.x, this.facing * 40, 200 * dt);
        if (Math.abs(this.center.x - this.homeX) > 60 || b.blocked.left || b.blocked.right || edgeAhead()) this.facing = this.center.x > this.homeX ? -1 : 1;
        if (p && Math.abs(p.center.y - this.center.y) < 30 && this.stateT <= 0) {
          this.facing = p.center.x < this.center.x ? -1 : 1;
          this.state = 'honk'; this.stateT = 0.5; b.velocity.x = 0;
          GS.Synth.rooster();
          this.scene.chatter.say(this, GS.util.pick(GS.LINES.enemy.courier), { priority: true, time: 1 });
        }
        break;
      case 'honk':
        if (this.stateT <= 0) { this.state = 'charge'; this.stateT = 1.6; this.contact = 2; }
        break;
      case 'charge':
        b.velocity.x = this.facing * cfg.chargeSpeed;
        if (Math.random() < 0.5) this.scene.fx.puff(this.center.x - this.facing * 22, b.bottom, 1);
        if (b.blocked.left || b.blocked.right || this.stateT <= 0 || edgeAhead()) {
          const crash = b.blocked.left || b.blocked.right;
          this.state = 'patrol'; this.stateT = crash ? cfg.stun : 1.2; this.contact = 1;
          b.velocity.x = crash ? -this.facing * 60 : 0;
          if (crash) { this.scene.fx.shake(120, 2); this.scene.fx.stars(this.center.x, b.top, 5); GS.Synth.stomp(); }
          this.homeX = this.center.x;
        }
        break;
      default: break;
    }
    this.wheel += Math.abs(b.velocity.x) * dt;
    this.view.setPosition(Math.round(b.center.x), Math.round(b.bottom)).setTexture('pizza/courier' + (Math.floor(this.wheel / 6) % 2)).setFlipX(this.facing < 0);
    if (this.flashT <= 0) this.view.clearTint();
  }
};

// ——— Босс: ПИЦЦА 4 СЫРА АПОКАЛИПСИСА ———
// Огромная пицца крутится над ареной. Здоровье общее; каждая потерянная восьмая отрывает кусок там, куда
// попали: он летит в героя, а упав, становится лечебной пиццей. Пепперони — слабые места (двойной урон).
// (Урон по куску отдельно не годится: пицца крутится, попадания размазываются, и все куски падают разом в конце.)
GS.PizzaBoss = class PizzaBoss {
  constructor(scene, x, y) {
    const B = GS.TUNING.pizzaBoss;
    this.scene = scene;
    this.R = B.radius;
    this.homeX = x; this.homeY = y;
    this.x = x; this.y = y - 220;
    this.rot = 0;
    this.spin = 0;
    this.n = B.slices;
    this.sliceHp = B.sliceHp * (scene.players.length > 1 ? B.coopMul : 1);
    this.slices = new Array(this.n).fill(true);
    this.lastHit = 0;
    this.maxHp = this.sliceHp * this.n;
    this.hp = this.maxHp;
    this.alive = true;
    this.state = 'sleep';
    this.stateT = 0;
    this.phase = 1;
    this.t = 0;
    this.flashT = 0;
    this.contact = 1;
    this.voice = 0.5;
    this.flyers = [];
    this.cutters = [];
    this.drizzleT = 1;
    this.sprite = scene.physics.add.sprite(this.x, this.y, 'px').setVisible(false);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.body.setCircle(this.R, -this.R, -this.R);
    this.sprite.boss = this;
    this.gfx = scene.add.graphics().setDepth(24);
    this.peps = this.slices.map(() => scene.add.image(0, 0, 'pizza/pep').setDepth(25));
    this.face = scene.add.graphics().setDepth(26);
    // Нарисованное лицо (4 выражения) — если есть лист; иначе лицо рисуется кодом.
    this.faceImg = scene.textures.exists('pizza/face0') ? scene.add.image(this.x, this.y, 'pizza/face0').setDepth(26).setVisible(false) : null;
    this.hurtT = 0;
    this.warn = scene.add.graphics().setDepth(5);
    this.draw();
  }

  get body() { return this.sprite.body; }
  get center() { return { x: this.x, y: this.y }; }
  headPoint() { return { x: this.x, y: this.y - this.R - 6 }; }
  aliveSlices() { return this.slices.filter(Boolean).length; }

  start() {
    this.state = 'intro';
    this.stateT = 2.4;
    GS.Synth.roar();
    this.scene.fx.shake(1000, 3);
    this.scene.chatter.say(this, 'П И Ц Ц А   4   С Ы Р А   А П О К А Л И П С И С А !', { priority: true, time: 2.2 });
    if (this.scene.stickers) this.scene.stickers.show('pizza', { force: true });
  }

  setState(s, t) { this.state = s; this.stateT = t; }

  sliceAt(px, py) {
    const a = Math.atan2(py - this.y, px - this.x) - this.rot;
    const full = Math.PI * 2;
    return Math.floor((((a % full) + full) % full) / (full / this.n)) % this.n;
  }

  pepPos(i) {
    const a = this.rot + (i + 0.5) / this.n * Math.PI * 2;
    return { x: this.x + Math.cos(a) * this.R * 0.62, y: this.y + Math.sin(a) * this.R * 0.62 };
  }

  hit(dmg, fromX, src) {
    if (!this.alive || this.state === 'sleep' || this.state === 'intro' || this.state === 'dying') return false;
    const px = src ? src.x : (fromX ?? this.x), py = src ? src.y : this.y + this.R * 0.5;
    let i = this.sliceAt(px, py);
    let mul = 1;
    if (!this.slices[i]) {
      // Попали в дыру от выбитого куска — засчитываем ближайшему живому, вполсилы.
      let best = -1;
      for (let k = 1; k < this.n && best < 0; k++) {
        if (this.slices[(i + k) % this.n]) best = (i + k) % this.n;
        else if (this.slices[(i - k + this.n) % this.n]) best = (i - k + this.n) % this.n;
      }
      if (best < 0) return false;
      i = best; mul = 0.5;
    } else if (src) {
      const pp = this.pepPos(i);
      if (Math.hypot(src.x - pp.x, src.y - pp.y) < 8) { mul = 2; this.scene.fx.sparks(pp.x, pp.y, 4, 0xffd84a); this.scene.fx.pop(pp.x, pp.y - 8, 'КРИТ!', { color: '#ffd84a', rise: 12, ms: 400 }); }
    }
    this.lastHit = i;
    this.hp = Math.max(0, this.hp - dmg * mul);
    this.flashT = 0.035;
    GS.Synth.hit();
    this.scene.addTeam(GS.TUNING.team.perHit * 0.5);
    // Здоровья осталось на меньшее число кусков — отрываем тот, куда попали.
    while (this.aliveSlices() > Math.ceil(this.hp / this.sliceHp - 1e-6)) {
      const k = this.slices[i] ? i : this.slices.findIndex(Boolean);
      if (k < 0) break;
      this.slices[k] = false;
      this.detach(k);
    }
    const left = this.aliveSlices();
    if (this.phase === 1 && left <= GS.TUNING.pizzaBoss.phase2) this.nextPhase(2);
    else if (this.phase === 2 && left <= GS.TUNING.pizzaBoss.phase3) this.nextPhase(3);
    if (left === 0) this.die();
    return true;
  }

  nextPhase(n) {
    this.phase = n;
    this.setState('roar', 1.2);
    GS.Synth.roar();
    this.scene.fx.shake(700, 4);
    this.scene.chatter.say(this, n === 2 ? 'ДОБАВЬТЕ СЫРУ! БОЛЬШЕ СЫРУ!' : 'АНАНАСОВАЯ ЕРЕСЬ! КРУЧУСЬ НАОБОРОТ!', { priority: true, time: 2 });
    this.scene.onBossPhase(n);
  }

  // Выбитый кусок летит в героя и, упав, становится лечебной пиццей.
  detach(i) {
    const sc = this.scene;
    const a = this.rot + (i + 0.5) / this.n * Math.PI * 2;
    const x = this.x + Math.cos(a) * this.R * 0.55, y = this.y + Math.sin(a) * this.R * 0.55;
    const s = sc.physics.add.image(x, y, 'pizza/slice').setDepth(27);
    s.body.setSize(18, 16);
    const p = this.target();
    const dx = p ? p.center.x - x : 0;
    s.body.setVelocity(GS.util.clamp(dx * 1.1, -220, 220), -160);
    sc.physics.add.collider(s, sc.layer);
    // Лечебная пицца — только из каждого второго куска, иначе босс слишком щедрый.
    this.detached = (this.detached || 0) + 1;
    this.flyers.push({ s, t: 0, done: false, heal: this.detached % 2 === 0 });
    sc.fx.burst(x, y, 12, ['y', 'o', 'r']);
    GS.Synth.splat();
    this.hurtT = 0.6;
    sc.chatter.say(this, GS.util.pick(['МОЙ КУСОЧЕК!', 'ПОЛОВИНКА ПОЛОВИНКИ!', 'ЭТО БЫЛ ЛУЧШИЙ КУСОК!']), { priority: true, time: 1.2 });
  }

  updateFlyers(dt) {
    const sc = this.scene;
    this.flyers.forEach((f) => {
      if (f.done) return;
      f.t += dt;
      const s = f.s;
      s.rotation += dt * 8;
      sc.players.forEach((p) => {
        if (f.done || !p.alive || !p.canBeHit || f.t > 2) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(p.sprite.getBounds(), s.getBounds()) && s.body.velocity.y > -40) { p.hurt(1, s.x); }
      });
      if ((s.body.blocked.down && f.t > 0.2) || f.t > 4) {
        f.done = true;
        if (f.heal) {
          const it = new GS.Pickup(sc, 'pizza', s.x, Math.min(s.y, sc.floorY - 8));
          sc.pickups.push(it); sc.pickupSprites.add(it.sprite);
        } else sc.fx.burst(s.x, s.y, 8, ['y', 'o', 'r']);
        sc.fx.puff(s.x, s.y + 6, 4, 0xffd84a);
        s.destroy();
      }
    });
    this.flyers = this.flyers.filter((f) => !f.done);
  }

  target() {
    const alive = this.scene.players.filter((p) => p.alive && !p.bubbleState);
    if (!alive.length) return null;
    return alive.reduce((a, b) => (Math.abs(a.center.x - this.x) < Math.abs(b.center.x - this.x) ? a : b));
  }

  // ——— Атаки ———
  spiral(n, speed) {
    for (let k = 0; k < n; k++) {
      const a = this.rot * 1.3 + k / n * Math.PI * 2;
      this.scene.shots.fireEnemy('olive', this.x + Math.cos(a) * this.R * 0.9, this.y + Math.sin(a) * this.R * 0.9, Math.cos(a) * speed, Math.sin(a) * speed);
    }
    GS.Synth.blip(1.2);
  }

  // Сырный дождь: половина капель — прямо над героем, стоять на месте нельзя.
  cheeseRain(n) {
    const sc = this.scene;
    for (let k = 0; k < n; k++) {
      sc.time.delayedCall(k * 110, () => {
        if (!this.alive) return;
        const p = this.target();
        const x = p && k % 2 === 0 ? GS.util.clamp(p.center.x + GS.util.rand(-40, 40), 24, GS.W - 24) : GS.util.rand(30, GS.W - 30);
        sc.shots.fireEnemy('cheese', x, this.y + this.R * 0.4, 0, 40);
      });
    }
    GS.Synth.splat();
  }

  // Веер: несколько прицельных залпов оливок с промежутком — уходить вбок.
  fan(waves, n) {
    for (let w = 0; w < waves; w++) {
      this.scene.time.delayedCall(w * 260, () => {
        if (!this.alive) return;
        const p = this.target();
        const base = p ? Math.atan2(p.center.y - this.y, p.center.x - this.x) : Math.PI / 2;
        for (let k = 0; k < n; k++) {
          const a = base + (k - (n - 1) / 2) * 0.16;
          this.scene.shots.fireEnemy('olive', this.x + Math.cos(a) * this.R * 0.8, this.y + Math.sin(a) * this.R * 0.8, Math.cos(a) * 150, Math.sin(a) * 150);
        }
        GS.Synth.blip(1.5);
      });
    }
  }

  // Кольцо с одной дырой — найти её.
  ring(n, speed) {
    const gap = GS.util.rand(0, Math.PI * 2);
    for (let k = 0; k < n; k++) {
      const a = gap + (k + 2) / (n + 4) * Math.PI * 2;
      this.scene.shots.fireEnemy('olive', this.x + Math.cos(a) * this.R * 0.9, this.y + Math.sin(a) * this.R * 0.9, Math.cos(a) * speed, Math.sin(a) * speed);
    }
    GS.Synth.blip(0.9);
  }

  // Нож-колесо катится по полу от одной стены к другой: перепрыгнуть или уйти на полку.
  cutter() {
    const p = this.target();
    const dir = p && p.center.x > GS.W / 2 ? -1 : 1;
    this.cutters.push({ x: dir > 0 ? 28 : GS.W - 28, dir, warn: 0.7, t: 0, img: null });
    GS.Synth.warn();
    this.scene.chatter.say(this, GS.util.pick(['НОЖ ДЛЯ ПИЦЦЫ!', 'РЕЖУ НА ВОСЕМЬ!', 'ПОРЦИОННО!']), { priority: true, time: 1 });
  }

  updateCutters(dt) {
    const sc = this.scene;
    const y = sc.floorY - 11;
    const speed = this.phase === 3 ? 230 : 180;
    this.cutters.forEach((c) => {
      if (c.warn > 0) {
        c.warn -= dt;
        const blink = Math.floor(c.warn * 12) % 2;
        this.warn.fillStyle(0xff5a4a, blink ? 0.55 : 0.2).fillTriangle(c.x - c.dir * 8, y - 10, c.x - c.dir * 8, y + 10, c.x + c.dir * 8, y);
        if (c.warn <= 0) c.img = sc.add.image(c.x, y, 'pizza/cutter0').setDepth(27);
        return;
      }
      c.t += dt;
      c.x += c.dir * speed * dt;
      c.img.setPosition(Math.round(c.x), y).setTexture('pizza/cutter' + (Math.floor(c.t * 16) % 2));
      if (Math.random() < 0.4) sc.fx.sparks(c.x - c.dir * 8, sc.floorY - 1, 1, 0xe2e4f0);
      sc.players.forEach((p) => {
        if (!p.canBeHit) return;
        const b = p.body;
        const nx = GS.util.clamp(c.x, b.left, b.right), ny = GS.util.clamp(y, b.top, b.bottom);
        if (Math.hypot(nx - c.x, ny - y) < 10) p.hurt(1, c.x);
      });
      if (c.x < -20 || c.x > GS.W + 20) { c.img.destroy(); c.dead = true; }
    });
    this.cutters = this.cutters.filter((c) => !c.dead);
  }

  lob(n) {
    const ps = this.scene.players.filter((p) => p.alive && !p.bubbleState);
    for (let k = 0; k < n && ps.length; k++) {
      const p = ps[k % ps.length];
      const tx = p.center.x + GS.util.rand(-30, 30);
      const tF = 1.1;
      this.scene.shots.fireEnemy('pineapple', this.x, this.y + this.R * 0.6, (tx - this.x) / tF, (p.center.y - this.y - this.R * 0.6 - 0.5 * GS.TUNING.gravity * tF * tF) / tF);
    }
  }

  attack() {
    const ph = this.phase;
    const pool = ph === 1 ? ['spiral', 'fan', 'lob', 'rain', 'fan']
      : ph === 2 ? ['stream', 'fan', 'rain', 'cutter', 'slam', 'lob', 'ring']
        : ['stream', 'cutter', 'slam', 'rain', 'ring', 'fan', 'stream'];
    let a = GS.util.pick(pool.filter((x) => x !== this.lastAttack));
    this.lastAttack = a;
    if (a === 'spiral') this.spiral(ph === 1 ? 12 : 16, ph === 1 ? 85 : 95);
    else if (a === 'fan') this.fan(ph === 1 ? 2 : 3, ph === 3 ? 7 : 5);
    else if (a === 'ring') this.ring(ph === 3 ? 26 : 20, 90);
    else if (a === 'cutter') this.cutter();
    else if (a === 'stream') { this.streamA = this.rot; this.streamDir = Math.random() < 0.5 ? -1 : 1; this.streamEmit = 0; this.setState('stream', 2.4); return; }
    else if (a === 'rain') this.cheeseRain(ph === 1 ? 8 : ph === 2 ? 10 : 12);
    else if (a === 'lob') this.lob(ph);
    else if (a === 'slam') {
      const p = this.target();
      this.slamX = GS.util.clamp(p ? p.center.x : this.x, this.R + 20, GS.W - this.R - 20);
      this.setState('slamWarn', 0.8);
      return;
    }
    this.setState('idle', GS.TUNING.pizzaBoss.every[ph - 1]);
  }

  // ——— Цикл ———
  update(dt) {
    const sc = this.scene;
    this.t += dt;
    this.flashT -= dt;
    this.hurtT -= dt;
    this.updateFlyers(dt);
    const B = GS.TUNING.pizzaBoss;
    this.warn.clear();
    this.updateCutters(dt);
    const wantSpin = this.state === 'dying' ? 6 : B.spin[this.phase - 1];
    this.spin += (wantSpin - this.spin) * Math.min(1, dt * 2);
    this.rot += this.spin * dt;
    this.stateT -= dt;
    const floorTop = sc.floorY;
    // Плавает по арене — под ним не постоишь; с каждой фазой шире и быстрее.
    const ph = this.phase - 1;
    let tx = this.homeX + Math.sin(this.t * [0.45, 0.6, 0.8][ph]) * [90, 150, 170][ph];
    let ty = this.homeY + Math.sin(this.t * 1.3) * 6 + (ph ? Math.sin(this.t * 0.9) * 14 : 0);
    // В 3-й фазе между атаками — одиночные прицельные оливки.
    if (this.phase === 3 && (this.state === 'idle' || this.state === 'stream')) {
      this.drizzleT -= dt;
      if (this.drizzleT <= 0) {
        this.drizzleT = 0.75;
        const p = this.target();
        if (p) { const a = Math.atan2(p.center.y - this.y, p.center.x - this.x); sc.shots.fireEnemy('olive', this.x + Math.cos(a) * this.R * 0.8, this.y + Math.sin(a) * this.R * 0.8, Math.cos(a) * 120, Math.sin(a) * 120); }
      }
    }
    switch (this.state) {
      case 'sleep': ty = this.homeY - 220; break;
      case 'intro':
        ty = this.homeY - Math.max(0, this.stateT - 0.6) / 1.8 * 220;
        if (this.stateT <= 0) this.setState('idle', 0.8);
        break;
      case 'idle':
        if (this.stateT <= 0) this.attack();
        break;
      // Поток: вращающиеся рукава оливок, между ними надо лавировать. Пицца при этом почти стоит.
      case 'stream': {
        tx = this.x; ty = this.y;
        this.streamA += this.streamDir * dt * 2.3;
        this.streamEmit -= dt;
        if (this.streamEmit <= 0) {
          this.streamEmit = 0.12;
          const arms = this.phase === 3 ? 3 : 2;
          for (let k = 0; k < arms; k++) {
            const a = this.streamA + k / arms * Math.PI * 2;
            sc.shots.fireEnemy('olive', this.x + Math.cos(a) * this.R * 0.9, this.y + Math.sin(a) * this.R * 0.9, Math.cos(a) * 105, Math.sin(a) * 105);
          }
          if (Math.random() < 0.3) GS.Synth.blip(1.3);
        }
        if (this.stateT <= 0) this.setState('idle', B.every[this.phase - 1]);
        break;
      }
      case 'roar':
        if (Math.random() < 0.3) sc.fx.burst(this.x + GS.util.rand(-this.R, this.R), this.y + GS.util.rand(-this.R, this.R), 1, ['y', 'r']);
        if (this.stateT <= 0) this.setState('idle', 0.6);
        break;
      case 'slamWarn': {
        tx = this.slamX; ty = this.homeY - 10;
        const blink = Math.floor(this.stateT * 12) % 2;
        this.warn.fillStyle(0xff5a4a, blink ? 0.45 : 0.2).fillRect(this.slamX - this.R, floorTop - 4, this.R * 2, 4);
        if (this.stateT <= 0) { this.setState('slam', 3); this.contact = 2; this.slamV = 0; }
        break;
      }
      // Падает с ускорением, а не переносится вниз — видно, куда летит.
      case 'slam':
        tx = this.x + (this.slamX - this.x) * Math.min(1, dt * 10);
        this.slamV += 1100 * dt;
        ty = Math.min(floorTop - this.R + 6, this.y + this.slamV * dt);
        if (ty >= floorTop - this.R + 6 || this.stateT <= 0) {
          sc.fx.shake(300, 5);
          GS.Synth.stomp();
          sc.fx.puff(this.x, floorTop, 8, 0xffd84a);
          [-1, 1].forEach((s) => sc.shots.fireEnemy('wave', this.x + s * this.R * 0.7, floorTop - 7, s * 150, 0));
          this.setState('slamUp', 0.9);
        }
        break;
      case 'slamUp':
        tx = this.slamX; ty = this.stateT > 0.45 ? floorTop - this.R + 6 : this.homeY;
        if (this.stateT <= 0) { this.contact = 1; this.setState('idle', B.every[this.phase - 1]); }
        break;
      case 'dying':
        if (Math.random() < 0.5) sc.fx.burst(this.x + GS.util.rand(-30, 30), this.y + GS.util.rand(-30, 30), 2, ['y', 'r', 'o']);
        if (this.stateT <= 0) { this.finish(); return; }
        break;
      default: break;
    }
    // Плавно к цели (резкие только «удар» вниз и подъём).
    const k = this.state === 'slam' ? 1 : this.state === 'slamUp' ? Math.min(1, dt * 4) : Math.min(1, dt * (this.state === 'intro' ? 6 : 3));
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.sprite.setPosition(this.x, this.y);
    this.sprite.body.updateFromGameObject();
    this.draw();
  }

  draw() {
    const g = this.gfx;
    g.clear();
    const R = this.R, n = this.n;
    const flash = this.flashT > 0;
    for (let i = 0; i < n; i++) {
      const a0 = this.rot + i / n * Math.PI * 2, a1 = this.rot + (i + 1) / n * Math.PI * 2;
      const pep = this.peps[i];
      if (!this.slices[i]) { pep.setVisible(false); continue; }
      const pts = [{ x: this.x, y: this.y }];
      for (let s = 0; s <= 6; s++) { const a = a0 + (a1 - a0) * s / 6; pts.push({ x: this.x + Math.cos(a) * R, y: this.y + Math.sin(a) * R }); }
      // Вспышка от попадания — мягкая подсветка, а не белый кадр: по пицце стреляют часто, иначе мигает.
      g.fillStyle(flash ? 0xf2b25a : 0xd9822b, 1).fillPoints(pts, true);
      const inner = [{ x: this.x, y: this.y }];
      for (let s = 0; s <= 6; s++) { const a = a0 + (a1 - a0) * s / 6 + 0.02; inner.push({ x: this.x + Math.cos(a) * (R - 8), y: this.y + Math.sin(a) * (R - 8) }); }
      // Кусок, по которому сейчас бьют, подгорает — он оторвётся следующим.
      const chunk = this.hp - this.sliceHp * (this.aliveSlices() - 1);
      const burnt = i === this.lastHit && chunk < this.sliceHp * 0.5;
      g.fillStyle(flash ? 0xfff2a8 : (burnt ? 0xe0a020 : 0xffd84a), 1).fillPoints(inner, true);
      g.lineStyle(1, 0xc0302a, 0.9).lineBetween(this.x, this.y, this.x + Math.cos(a0) * (R - 2), this.y + Math.sin(a0) * (R - 2));
      const pp = this.pepPos(i);
      pep.setVisible(true).setPosition(Math.round(pp.x), Math.round(pp.y));
      pep.clearTint();
    }
    // Лицо в центре — не крутится вместе с пиццей.
    const f = this.face;
    f.clear();
    if (this.faceImg) {
      const fr = this.state === 'dying' ? 3 : this.hurtT > 0 ? 2 : (this.phase === 3 || this.state === 'roar' || this.state.startsWith('slam')) ? 1 : 0;
      this.faceImg.setVisible(this.state !== 'sleep').setTexture('pizza/face' + fr).setPosition(Math.round(this.x), Math.round(this.y + (fr === 1 ? 2 : 0)));
      return;
    }
    if (this.state === 'sleep') return;
    const ang = this.phase === 3 || this.state === 'roar';
    f.fillStyle(0xffffff, 1).fillEllipse(this.x - 13, this.y - 8, 14, 12).fillEllipse(this.x + 13, this.y - 8, 14, 12);
    const p = this.target();
    const lx = p ? GS.util.clamp((p.center.x - this.x) / 60, -2, 2) : 0, ly = p ? GS.util.clamp((p.center.y - this.y) / 60, -2, 2) : 0;
    f.fillStyle(0xc0302a, 1).fillCircle(this.x - 13 + lx, this.y - 8 + ly, 3).fillCircle(this.x + 13 + lx, this.y - 8 + ly, 3);
    f.fillStyle(0x140c1e, 1).fillRect(this.x - 21, this.y - (ang ? 18 : 16), 14, 3).fillRect(this.x + 7, this.y - (ang ? 18 : 16), 14, 3);
    f.fillStyle(0x6e1414, 1).fillRect(this.x - 14, this.y + 6, 28, ang ? 10 : 6);
    f.fillStyle(0xffffff, 1);
    for (let k = 0; k < 4; k++) f.fillTriangle(this.x - 13 + k * 7, this.y + 6, this.x - 9 + k * 7, this.y + 6, this.x - 11 + k * 7, this.y + 10);
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    this.setState('dying', 2.4);
    this.warn.clear();
    this.cutters.forEach((c) => c.img && c.img.destroy());
    this.cutters = [];
    GS.Synth.roar();
    this.scene.fx.shake(2200, 3);
    this.scene.fx.hitstop(200);
    this.scene.chatter.say(this, 'ЭТО БЫЛА... ЛУЧШАЯ ПИЦЦА... В ДАТАСЕТЕ...', { priority: true, time: 3 });
    this.scene.onBossDying();
  }

  finish() {
    const sc = this.scene;
    this.state = 'dead';
    sc.fx.flash(400, 0xffd84a, 0.9);
    sc.fx.burst(this.x, this.y, 50, ['y', 'r', 'o', 'w']);
    sc.fx.ring(this.x, this.y, { color: 0xffd84a, to: 5, ms: 600 });
    GS.Synth.explosion(true);
    this.gfx.destroy(); this.face.destroy(); this.warn.destroy();
    if (this.faceImg) this.faceImg.destroy();
    this.peps.forEach((p) => p.destroy());
    this.sprite.destroy();
    sc.onBossDefeated(this.x, this.y);
  }
};
