// HUD поверх уровня — как в концепте: портрет, здоровье, командный метр, счётчики, стикеры.
GS.HudScene = class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  init(data) { this.level = data.level; this.bossOn = false; }

  create() {
    const L = this.level;
    this.stickers = new GS.Stickers(this);
    this.g = this.add.graphics();
    this.panels = L.players.map((p, i) => this.makePanel(p, i));
    const cx = GS.W / 2;
    this.teamLabel = GS.text(this, cx, 4, 'КОМАНДНЫЙ МЕТР', { color: '#a8acc4', origin: [0.5, 0] });
    this.portalIcon = this.add.image(cx + 76, 17, 'obj/portal').setScale(0.3);
    this.coinIcon = this.add.image(cx - 66, 30, 'ui/coin');
    this.coinTxt = GS.text(this, cx - 60, 27, '0', { color: '#b4ff5a' });
    this.clockIcon = this.add.image(cx - 18, 30, 'ui/clock');
    this.timeTxt = GS.text(this, cx - 12, 27, '0:00', { color: '#e2e4f0' });
    this.skullIcon = this.add.image(cx + 34, 30, 'ui/skull');
    this.deathTxt = GS.text(this, cx + 40, 27, '0', { color: '#e2e4f0' });
    this.catIcon = this.add.image(cx + 66, 30, GS.Save.data.cats[L.def.id] ? 'ui/cat' : 'ui/catOff');

    this.comboTxt = GS.text(this, GS.W - 8, 52, '', { color: '#ffd84a', origin: [1, 0], scale: 2 });
    this.comboTxt.setAlpha(0);

    this.bossOn = false;
    this.bossName = GS.text(this, GS.W / 2, GS.H - 26, 'ОПОССУМ-МАКС', { color: '#ff5a4a', origin: [0.5, 1] }).setVisible(false);

    this.bannerT = 0;
    this.bannerTitle = GS.text(this, GS.W / 2, 70, '', { color: '#ffffff', origin: [0.5, 0.5], scale: 2 }).setAlpha(0);
    this.bannerSub = GS.text(this, GS.W / 2, 88, '', { color: '#e2e4f0', origin: [0.5, 0.5] }).setAlpha(0);

    // Название уровня в начале.
    this.time.delayedCall(250, () => this.banner(L.def.name, '#b4ff5a', L.def.subtitle || ''));
  }

  makePanel(p, i) {
    const right = i === 1;
    const x = right ? GS.W - 136 : 4;
    const color = p.cfg.color;
    const portrait = this.add.image(x + (right ? 117 : 15), 18, `portrait/${p.hero}_open`);
    const name = GS.text(this, x + (right ? 102 : 30), 5, `P${i + 1} ${p.cfg.name}`, { color, origin: [right ? 1 : 0, 0] });
    return { p, x, right, color, portrait, name, hurtT: 0, lastHp: p.hp };
  }

  flashPortrait(i) { if (this.panels[i]) this.panels[i].hurtT = 1; }

  banner(title, color = '#ffffff', sub = '') {
    this.bannerTitle.setText(title).setTint(GS.hex(color)).setAlpha(1).setScale(0.5);
    this.bannerSub.setText(sub).setAlpha(sub ? 1 : 0);
    this.tweens.killTweensOf([this.bannerTitle, this.bannerSub]);
    this.tweens.add({ targets: this.bannerTitle, scale: 2, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: [this.bannerTitle, this.bannerSub], alpha: 0, delay: 2200, duration: 400 });
  }

  setCombo(n) {
    if (n < 3) { this.tweens.add({ targets: this.comboTxt, alpha: 0, duration: 300 }); return; }
    this.comboTxt.setText(`КОМБО ×${n}`).setAlpha(1).setScale(2.6);
    this.tweens.killTweensOf(this.comboTxt);
    this.tweens.add({ targets: this.comboTxt, scale: 2, duration: 160, ease: 'Back.out' });
    this.comboTxt.setTint(GS.hex(n >= 10 ? '#ff4ad0' : n >= 6 ? '#b4ff5a' : '#ffd84a'));
  }

  showBoss(on, name = 'ОПОССУМ-МАКС') { this.bossOn = on; this.bossName.setText(name).setVisible(on); }

  update(time, delta) {
    const dt = delta / 1000;
    const L = this.level;
    if (!L || !L.players) return;
    const g = this.g;
    g.clear();
    const ink = GS.hex(GS.PAL.ink);

    this.panels.forEach((P) => {
      const p = P.p;
      const x = P.x;
      // Рамка.
      g.fillStyle(ink, 0.85).fillRect(x, 2, 132, 32);
      g.fillStyle(GS.hex(P.color), 1).fillRect(x, 2, 132, 1).fillRect(x, 33, 132, 1);
      g.fillStyle(GS.hex('#2a1a3e'), 1).fillRect(x + (P.right ? 103 : 1), 3, 28, 30);
      if (p.hp < P.lastHp) P.hurtT = 0.6;
      P.lastHp = p.hp;
      P.hurtT -= dt;
      const ev = !p.alive ? 'x' : P.hurtT > 0 ? 'hurt' : p.coffeeT > 0 || L.state === 'won' ? 'happy' : 'open';
      P.portrait.setTexture(`portrait/${p.hero}_${ev}`);
      P.portrait.x = x + (P.right ? 117 : 15) + (P.hurtT > 0 ? GS.util.randInt(-1, 1) : 0);
      // Здоровье сегментами.
      const segs = Math.min(10, p.maxHp);
      const hx = P.right ? x + 100 - segs * 9 : x + 32;
      for (let s = 0; s < segs; s++) {
        const full = s < Math.min(p.hp, segs);
        g.fillStyle(full ? GS.hex(p.hp <= 2 ? '#ff5a4a' : '#4fe03c') : GS.hex('#3a2a4a'), 1).fillRect(hx + s * 9, 15, 8, 6);
        if (full) g.fillStyle(GS.hex(p.hp <= 2 ? '#ffb0a0' : '#b4ff5a'), 1).fillRect(hx + s * 9, 15, 8, 1);
      }
      // Спецприём: перезарядка.
      const cd = p.cfg.special.cooldown;
      const ready = GS.util.clamp(1 - p.specialCd / cd, 0, 1);
      const bx = P.right ? x + 100 - 50 : x + 32;
      g.fillStyle(GS.hex('#2a2a42'), 1).fillRect(bx, 24, 50, 3);
      g.fillStyle(GS.hex(ready >= 1 ? '#8cf2ff' : '#2ab0d8'), 1).fillRect(bx, 24, Math.round(50 * ready), 3);
      // Кофе и щит.
      let ix = P.right ? x + 46 : x + 86;
      if (p.coffeeT > 0) { g.fillStyle(GS.hex('#ffd84a'), 1).fillRect(ix, 29, Math.round(20 * p.coffeeT / GS.TUNING.coffee.time), 2); g.fillStyle(GS.hex('#f2ece0'), 1).fillRect(ix, 24, 4, 4); ix += 24; }
      if (p.shield) { g.fillStyle(GS.hex('#b08cff'), 1).fillRect(ix, 23, 5, 5); }
      if (p.inMech) {
        const m = p.inMech;
        g.fillStyle(GS.hex('#ffb03a'), 1).fillRect(bx, 29, Math.round(50 * GS.util.clamp(m.time / GS.TUNING.mech.time, 0, 1)), 2);
      }
    });

    // Командный метр.
    const T = GS.TUNING.team;
    const cx = GS.W / 2;
    const full = L.team >= T.max;
    g.fillStyle(ink, 0.85).fillRect(cx - 72, 12, 144, 10);
    g.fillStyle(GS.hex('#3a2a5a'), 1).fillRect(cx - 70, 14, 136, 6);
    const w = Math.round(136 * L.team / T.max);
    for (let i = 0; i < w; i += 4) {
      const c = full ? (Math.floor(time / 80 + i / 4) % 2 ? '#b4ff5a' : '#4fe03c') : '#2ab0d8';
      g.fillStyle(GS.hex(c), 1).fillRect(cx - 70 + i, 14, Math.min(3, w - i), 6);
    }
    this.portalIcon.rotation = time / 1000 * (full ? -8 : -1);
    this.portalIcon.setScale(full ? 0.34 + Math.sin(time / 100) * 0.04 : 0.28);
    this.teamLabel.setText(full ? (L.players.length > 1 ? 'СУПЕР: R / U' : 'СУПЕР: V') : 'КОМАНДНЫЙ МЕТР').setTint(GS.hex(full ? '#b4ff5a' : '#a8acc4'));

    // Счётчики.
    g.fillStyle(ink, 0.7).fillRect(cx - 72, 24, 144, 12);
    this.coinTxt.setText(`${L.stats.coins}`);
    this.timeTxt.setText(GS.util.fmtTime(L.stats.time).slice(0, -3));
    this.deathTxt.setText(`${L.stats.deaths}`);
    if (L.stats.cat) this.catIcon.setTexture('ui/cat');

    // Босс.
    if (this.bossOn && L.boss) {
      const b = L.boss;
      const bw = 300, bx = Math.round(GS.W / 2 - bw / 2), by = GS.H - 22;
      g.fillStyle(ink, 0.9).fillRect(bx - 2, by - 2, bw + 4, 10);
      g.fillStyle(GS.hex('#3a1a2a'), 1).fillRect(bx, by, bw, 6);
      const hw = Math.round(bw * Math.max(0, b.hp) / b.maxHp);
      g.fillStyle(GS.hex(b.phase === 3 ? '#ff4a4a' : b.phase === 2 ? '#ff8a2a' : '#ffd84a'), 1).fillRect(bx, by, hw, 6);
      g.fillStyle(0xffffff, 0.5).fillRect(bx, by, hw, 1);
      [0.33, 0.66].forEach((f) => g.fillStyle(ink, 1).fillRect(bx + Math.round(bw * f), by, 1, 6));
    }

    this.stickers.update(dt);
  }
};
