// «Гонка по CDN»: стена-404 гонит героев вправо, ускорители и батуты на трассе.
GS.RaceArt = {
  make(scene) {
    if (scene.textures.exists('race/boost0')) return;
    // Ускоритель: тёмная плита с бегущими шевронами (два кадра).
    [0, 1].forEach((f) => GS.makeTex(scene, 'race/boost' + f, 16, 5, (p) => {
      p.rect(0, 1, 16, 4, '#0b2030'); p.rect(0, 1, 16, 1, '#3c6a8a'); p.rect(0, 4, 16, 1, '#06141f');
      for (let k = 0; k < 2; k++) {
        const x = 2 + k * 7 + f * 3;
        const c = k === f ? '#c0f8ff' : '#3cd8f8';
        p.px(x % 16, 2, c); p.px((x + 1) % 16, 3, c); p.px(x % 16, 4, c);
      }
    }));
    // Батут: пружина и плита, сжатый кадр — ниже.
    [0, 1].forEach((f) => GS.makeTex(scene, 'race/spring' + f, 16, 10, (p) => {
      const top = f ? 5 : 1;
      p.rect(1, top, 14, 2, '#ffd84a'); p.rect(1, top, 14, 1, '#fff2a8'); p.rect(1, top + 2, 14, 1, '#b08a1a');
      for (let y = top + 3; y < 8; y += 2) { p.rect(4, y, 8, 1, '#8a8aa8'); p.px(3, y, '#4a4a64'); p.px(12, y, '#4a4a64'); }
      p.rect(2, 8, 12, 2, '#2a2a3a'); p.rect(2, 8, 12, 1, '#4a4a64');
    }));
  },
};

// Плита-ускоритель: наступил — разгон вправо на время.
GS.BoostPad = class BoostPad {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.img = scene.add.image(x, y, 'race/boost0').setOrigin(0.5, 1).setDepth(4);
    this.glow = scene.add.image(x, y - 2, 'glow/cyan').setDepth(3).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setScale(0.6, 0.25);
  }
  update(dt, time) {
    this.img.setTexture('race/boost' + (Math.floor(time / 120) % 2));
    this.scene.players.forEach((p) => {
      if (!p.alive || p.bubbleState || p.inMech || !p.onGround) return;
      const b = p.body;
      if (Math.abs(b.center.x - this.x) < 10 && Math.abs(b.bottom - this.y) < 3) p.boost();
    });
  }
};

// Батут: подбрасывает на верхний маршрут.
GS.JumpPad = class JumpPad {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.img = scene.add.image(x, y, 'race/spring0').setOrigin(0.5, 1).setDepth(4);
    this.squashT = 0;
  }
  update(dt) {
    this.squashT -= dt;
    this.img.setTexture(this.squashT > 0 ? 'race/spring1' : 'race/spring0');
    this.scene.players.forEach((p) => {
      if (!p.alive || p.bubbleState || p.inMech) return;
      const b = p.body;
      // Срабатывает и на бегу по батуту, и при приземлении на него сверху.
      if (b.velocity.y < 0 || Math.abs(b.center.x - this.x) > 10 || b.bottom < this.y - 14 || b.bottom > this.y + 2) return;
      p.launch(GS.TUNING.race.padVelocity);
      this.squashT = 0.15;
      this.scene.fx.ring(this.x, this.y - 6, { color: 0xffd84a, to: 1.4, ms: 200 });
    });
  }
};

// Стена-404: идёт вправо, ускоряется к концу трассы, догоняет, если отстала за кадр.
// Касание — урон и «выплёвывание» вперёд на ближайшую твёрдую землю.
GS.ChaseWall = class ChaseWall {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    this.x = -200;
    this.wait = cfg.delay;
    this.warned = false;
    this.gfx = scene.add.graphics().setDepth(40);
    this.label = GS.text(scene, 0, 0, '404', { color: '#ff4a6a', origin: [1, 0.5], scale: 4, depth: 41 });
    this.sub = GS.text(scene, 0, 0, 'ОШИБКА ДОСТАВКИ', { color: '#ffb0c0', origin: [1, 0.5], depth: 41 });
    this.ping = GS.text(scene, GS.W / 2, 44, '', { color: '#4fe03c', origin: [0.5, 0], depth: 900 }).setScrollFactor(0);
  }

  speedAt(x) {
    let s = this.cfg.speed[0][1];
    for (const [from, v] of this.cfg.speed) if (x >= from) s = v;
    return s;
  }

  reset(x) {
    this.x = x - this.cfg.restartGap;
    this.wait = this.cfg.restartDelay;
    this.warned = false;
  }

  update(dt, time) {
    const sc = this.scene;
    const view = sc.cameras.main.worldView;
    const racing = sc.state === 'play' && !sc.respawning;
    if (racing) {
      if (this.wait > 0) {
        this.wait -= dt;
        if (this.wait <= 0 && sc.hud) { sc.hud.banner('404 НАСТУПАЕТ!', '#ff4a6a', 'БЕГИ ВПРАВО!'); GS.Synth.warn(); }
      } else {
        // Отстала за левый край кадра — догоняет, чтобы угроза не терялась.
        const behind = this.x < view.x - this.cfg.catchupGap;
        this.x += (behind ? this.cfg.catchup : this.speedAt(this.x)) * dt;
      }
    }
    this.draw(view, time);

    // Кто ближе всех к стене — по нему «пинг».
    const runners = sc.players.filter((p) => p.alive && !p.bubbleState);
    if (!runners.length) return;
    const back = Math.min(...runners.map((p) => (p.inMech ? p.inMech.center.x : p.center.x)));
    const gap = Math.max(0, back - this.x);
    const ms = Math.round(gap / 2);
    this.ping.setText(this.wait > 0 ? 'ПИНГ: —' : `ПИНГ: ${ms} МС`).setTint(GS.hex(ms < 60 ? '#ff4a6a' : ms < 130 ? '#ffd84a' : '#4fe03c'));
    if (gap < 110 && !this.warned && this.wait <= 0) {
      this.warned = true;
      const p = runners.reduce((a, q) => (q.center.x < a.center.x ? q : a));
      p.say(GS.util.pick(GS.LINES.chase), { priority: true });
      GS.Synth.glitch();
    }
    if (gap > 220) this.warned = false;
    if (!racing || this.wait > 0) return;

    runners.forEach((p) => { if (!p.inMech && p.body.left < this.x) this.bite(p); });
    sc.enemies.forEach((e) => { if (e.alive && !e.dying && e.center.x < this.x - 8) e.die(); });
  }

  bite(p) {
    const sc = this.scene;
    sc.fx.burst(p.center.x, p.center.y, 14, ['p', 'w']);
    if (p.invuln <= 0) p.hurt(this.cfg.damage, this.x - 40);
    if (!p.alive) return;
    const g = this.groundAhead(this.x + this.cfg.spitAhead, p.body.bottom);
    p.body.reset(g.x, g.y - GS.TUNING.player.bodyH / 2 - 2);
    p.body.setVelocity(120, -200);
    p.invuln = Math.max(p.invuln, 1.4);
    p.lastSafe = { x: g.x, y: g.y };
    sc.fx.ring(g.x, g.y - 20, { color: 0xff4a6a, to: 2, ms: 300 });
    GS.Synth.portal();
    p.say('404 ВЫПЛЮНУЛ МЕНЯ ВПЕРЁД!', { priority: true });
  }

  // Ближайшая безопасная твёрдая поверхность правее x (по вертикали — ближе к nearY).
  groundAhead(x, nearY) {
    const L = this.scene.L;
    for (let tx = Math.max(1, Math.floor(x / 16)); tx < L.w - 1; tx++) {
      let best = null;
      for (let ty = 1; ty < L.h; ty++) {
        if (!L.solid(tx, ty) || L.solid(tx, ty - 1) || L.at(tx, ty - 1) === 'w') continue;
        if (!L.solid(tx - 1, ty) || !L.solid(tx + 1, ty) || L.at(tx, ty - 2) === 'v') continue;
        const y = ty * 16;
        if (!best || Math.abs(y - nearY) < Math.abs(best.y - nearY)) best = { x: tx * 16 + 8, y };
      }
      if (best) return best;
    }
    return { x: x, y: nearY };
  }

  draw(view, time) {
    const g = this.gfx;
    g.clear();
    const left = view.x - 8;
    const visible = this.x > left;
    this.label.setVisible(visible);
    this.sub.setVisible(visible);
    if (!visible) return;
    const top = view.y - 8, h = view.height + 16;
    const edge = Math.round(this.x);
    g.fillStyle(0x12030c, 0.86).fillRect(left, top, edge - left, h);
    // Строки развёртки и битые блоки по кромке.
    const rnd = GS.util.rng(Math.floor(time / 70));
    for (let y = Math.floor(top / 4) * 4; y < top + h; y += 4) {
      if ((y / 4) % 3 === 0) g.fillStyle(0xff2a5a, 0.08).fillRect(left, y, edge - left, 1);
      const r = rnd();
      const w = Math.floor(r * 18);
      const c = r < 0.3 ? 0xff2a5a : r < 0.55 ? 0xff4ad0 : r < 0.75 ? 0x3cd8f8 : 0x12030c;
      g.fillStyle(c, 0.9).fillRect(edge - 2, y, w, 4);
      if (rnd() < 0.08) g.fillStyle(0xffffff, 0.7).fillRect(edge - 30 - Math.floor(rnd() * 60), y, 8 + Math.floor(rnd() * 20), 2);
    }
    const jx = rnd() < 0.15 ? Math.floor(rnd() * 5) - 2 : 0;
    this.label.setPosition(edge - 12 + jx, Math.round(view.centerY - 10));
    this.sub.setPosition(edge - 12, Math.round(view.centerY + 18));
  }
};
