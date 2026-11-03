// Комиксы между уровнями: пиксельные кадры из видео и диалоги с бормотанием.
GS.StoryScene = class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }

  init(data) {
    this.done = false;
    this.full = null;
    this.shown = 0;
    this.speaker = null;
    this.panels = GS.LINES.stories[data.story] || [];
    this.next = data.next;
    this.storyKey = data.story;
  }

  create() {
    const W = GS.W, H = GS.H;
    this.cameras.main.setBackgroundColor('#000000');
    this.controls = new GS.Controls(this, 1);
    this.img = this.add.image(W / 2, H / 2, '__DEFAULT').setScale(2);
    this.frame = this.add.graphics().setDepth(5);
    this.box = this.add.graphics().setDepth(10);
    this.portrait = this.add.image(46, H - 44, '__DEFAULT').setDepth(11).setScale(2).setVisible(false);
    this.name = GS.text(this, 84, H - 72, '', { color: '#ffffff', depth: 11 });
    this.txt = this.add.bitmapText(84, H - 58, 'pix', '', 7).setDepth(11).setTint(0xe2e4f0).setScale(1);
    this.hint = GS.text(this, W - 14, H - 12, '»', { color: '#b4ff5a', origin: [1, 1], depth: 11 });
    this.skipTxt = GS.text(this, W - 6, 6, 'ESC — ПРОПУСТИТЬ', { color: '#5a5a70', origin: [1, 0], depth: 11 });
    this.pi = -1;
    this.li = 0;
    GS.Music.play(this.storyKey === 'ending' ? 'ending' : 'title');
    this.nextPanel();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  nextPanel() {
    this.pi++;
    if (this.done) return;
    if (this.pi >= this.panels.length) { this.finish(); return; }
    const P = this.panels[this.pi];
    const key = this.textures.exists(P.img) ? P.img : '__DEFAULT';
    this.img.setTexture(key).setAlpha(0).setScale(GS.W / this.img.width); // старые панели 320×180 — ×2, новые 640×360 — 1:1
    this.img.x = GS.W / 2 + (this.pi % 2 ? 12 : -12);
    this.tweens.add({ targets: this.img, alpha: 1, x: GS.W / 2, duration: 350, ease: 'Quad.out' });
    this.li = -1;
    this.nextLine();
  }

  nextLine() {
    if (this.done) return;
    this.li++;
    const P = this.panels[this.pi];
    if (!P) { this.finish(); return; }
    if (this.li >= P.lines.length) { this.nextPanel(); return; }
    const [who, text] = P.lines[this.li];
    const sp = GS.LINES.speakers[who];
    this.speaker = sp;
    this.full = GS.Font.wrap(text, 520).join('\n');
    this.shown = 0;
    this.name.setText(sp.name).setTint(GS.hex(sp.color));
    if (sp.portrait && this.textures.exists(sp.portrait)) {
      this.portrait.setTexture(sp.portrait).setVisible(true);
      this.portrait.setScale(sp.portrait.includes('opossum') ? 1.5 : 2);
      this.txt.x = 84; this.name.x = 84;
    } else { this.portrait.setVisible(false); this.txt.x = 20; this.name.x = 20; }
    this.txt.setText('');
    if (who === 'o') { this.cameras.main.shake(400, 0.006); GS.Synth.roar(); }
    this.drawBox();
  }

  drawBox() {
    const g = this.box;
    const W = GS.W, H = GS.H;
    g.clear();
    g.fillStyle(GS.hex(GS.PAL.ink), 0.92).fillRect(8, H - 84, W - 16, 76);
    g.fillStyle(GS.hex(this.speaker ? this.speaker.color : '#ffffff'), 1).fillRect(8, H - 84, W - 16, 1).fillRect(8, H - 9, W - 16, 1);
    const f = this.frame;
    f.clear();
    f.lineStyle(4, 0x000000, 1).strokeRect(2, 2, W - 4, H - 4);
  }

  advance() {
    if (this.done || !this.full) return;
    if (this.shown < this.full.length) { this.shown = this.full.length; this.txt.setText(this.full); return; }
    GS.Synth.menuMove();
    this.nextLine();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.next) this.scene.start(this.next.scene, this.next.data);
      else this.scene.start('Title');
    });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    const C = this.controls;
    C.update();
    const inp = C.read(0);
    if (C.sys.back || C.sys.skip) { this.finish(); return; }
    if (C.sys.confirm || inp.shoot || inp.special) this.advance();
    if (this.input.activePointer.justDown) this.advance();
    if (this.full && this.shown < this.full.length) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(this.full.length, this.shown + dt * 40);
      const now = Math.floor(this.shown);
      if (now > before) {
        this.txt.setText(this.full.slice(0, now));
        if (now % 2 === 0 && this.full[now - 1] !== ' ') GS.Synth.blip(this.speaker.pitch);
      }
    }
    this.hint.setAlpha(this.shown >= (this.full || '').length ? 0.5 + Math.sin(time / 150) * 0.5 : 0);
    // Лёгкое «дыхание» кадра.
    this.img.y = GS.H / 2 + Math.round(Math.sin(time / 1200) * 2);
  }
};
