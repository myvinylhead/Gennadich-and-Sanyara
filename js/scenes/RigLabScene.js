// Стенд ригов (Entity Playground): все герои и клипы, увеличение, прицел мышью.
// Открывается как index.html?lab. ←/→ — клип, ↑/↓ — масштаб, 1/2/3 — эмоции, ПРОБЕЛ — пауза, A — прицел.
GS.RigLabScene = class RigLabScene extends Phaser.Scene {
  constructor() { super('RigLab'); }

  create() {
    this.cameras.main.setBackgroundColor('#1d1445');
    const g = this.add.graphics();
    g.fillStyle(0x2b1d5e, 1);
    for (let x = 0; x < GS.W; x += 16) for (let y = 0; y < GS.H; y += 16) if (((x + y) / 16) % 2 === 0) g.fillRect(x, y, 16, 16);
    g.fillStyle(0x4fe03c, 0.5).fillRect(0, 250, GS.W, 1);

    this.heroes = ['gennadich', 'sanyara', 'yurich'].map((h, i) => {
      const r = new GS.Skeleton(this, 80 + i * 60, 250, GS.heroRig(h), h + '/');
      return r;
    });
    this.extra = [];
    if (GS.enemyRigs) {
      Object.keys(GS.enemyRigs).forEach((name, i) => {
        const def = GS.enemyRigs[name]();
        const r = new GS.Skeleton(this, 300 + i * 110, 250, def, def.skin || '');
        this.extra.push(r);
      });
    }

    this.clipNames = Object.keys(GS.HERO_CLIPS.gennadich);
    this.clipIndex = 0;
    this.aimOn = false;
    this.zoom = 2;
    this.label = GS.text(this, 8, 8, '', { color: '#b4ff5a' }).setScrollFactor(0);
    this.help = GS.text(this, 8, 340, '←→ КЛИП  ↑↓ ЗУМ  1-6 ЭМОЦИИ  A ПРИЦЕЛ  F РАЗВОРОТ  ПРОБЕЛ ПАУЗА', { color: '#ffffff' }).setScrollFactor(0);
    this.paused = false;
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,F,ONE,TWO,THREE,FOUR,FIVE,SIX,ZERO');
    this.updateLabel();
    this.cameras.main.setZoom(this.zoom).centerOn(200, 225);
  }

  updateLabel() {
    this.label.setText(`КЛИП: ${this.clipNames[this.clipIndex]}  ЗУМ ${this.zoom}  ПРИЦЕЛ ${this.aimOn ? 'ВКЛ' : 'ВЫКЛ'}`);
    this.label.setScale(1 / this.zoom).setPosition(this.cameras.main.worldView.x + 4, this.cameras.main.worldView.y + 4);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    const J = Phaser.Input.Keyboard.JustDown;
    const k = this.keys;
    if (J(k.RIGHT)) { this.clipIndex = (this.clipIndex + 1) % this.clipNames.length; }
    if (J(k.LEFT)) { this.clipIndex = (this.clipIndex + this.clipNames.length - 1) % this.clipNames.length; }
    if (J(k.UP)) this.zoom = Math.min(6, this.zoom + 1);
    if (J(k.DOWN)) this.zoom = Math.max(1, this.zoom - 1);
    if (J(k.SPACE)) this.paused = !this.paused;
    if (J(k.A)) this.aimOn = !this.aimOn;
    if (J(k.F)) this.heroes.forEach((h) => { h.facing *= -1; });
    const emo = [['ZERO', null], ['ONE', 'angry'], ['TWO', 'wide'], ['THREE', 'happy'], ['FOUR', 'spiral'], ['FIVE', 'x'], ['SIX', 'sleep']];
    emo.forEach(([key, e]) => { if (J(k[key])) this.heroes.forEach((h) => { h.eyesOverride = e; }); });
    const f = this.focus || [this.zoom >= 3 ? 140 : 260, 220];
    this.cameras.main.setZoom(this.zoom).centerOn(f[0], f[1]);
    this.updateLabel();

    const ptr = this.input.activePointer;
    const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    const name = this.clipNames[this.clipIndex];
    this.heroes.forEach((h) => {
      if (h.clips[name]) h.play(name);
      if (h.clipDone) h.play(name, { restart: true });
      if (this.aimOn) {
        const sh = h.bones.armF;
        const lx = (wp.x - h.x) * h.facing, ly = wp.y - h.y;
        const a = Math.atan2(ly - sh.wy, lx - sh.wx);
        const gx = sh.wx + Math.cos(a) * 7, gy = sh.wy + Math.sin(a) * 7 + 1;
        h.ik.armF = { x: gx, y: gy, bend: -1 };
        h.ik.armB = { x: gx + Math.cos(a) * 5, y: gy + Math.sin(a) * 5, bend: -1 };
        h.worldRot.gun = a - Math.PI / 2;
        h.look.x = Math.cos(a) * 1.5; h.look.y = Math.sin(a) * 1.5;
        h.addRot.head = GS.util.clamp(a * 30 / Math.PI, -20, 15);
      } else {
        h.ik = {}; h.worldRot = {}; h.addRot = {}; h.look.x = 0; h.look.y = 0;
      }
      if (!this.paused) h.tick(dt);
    });
    this.extra.forEach((r) => { if (!this.paused) { r.tick(dt); if (r.clipDone) r.play(r.clipName, { restart: true }); } });
  }
};
