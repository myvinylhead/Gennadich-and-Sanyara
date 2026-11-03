// Стикер-реакции: вырезанные из мемпаков стикеры выезжают в углу экрана на ключевых событиях.
GS.Stickers = class Stickers {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.current = null;
    this.gap = 0;
    this.cool = {};
    this.recent = [];
    this.side = 1;
  }

  show(event, { force = false } = {}) {
    let pool = (GS.LINES.stickers[event] || []).filter((k) => this.scene.textures.exists('st/' + k));
    // Есть перерисованные пиксельные стикеры — старые вырезки из мемпаков показываем, только если других нет.
    const caps = GS.STICKER_CAPS || {};
    if (pool.some((k) => caps[k])) pool = pool.filter((k) => caps[k]);
    if (!pool.length) return;
    if (!force && this.cool[event] > 0) return;
    if (this.queue.length >= 2) return;
    const fresh = pool.filter((k) => !this.recent.includes(k));
    const key = GS.util.pick(fresh.length ? fresh : pool);
    this.recent.push(key);
    if (this.recent.length > 8) this.recent.shift();
    this.cool[event] = force ? 0 : 7;
    this.queue.push(key);
  }

  // Стикер с подписью на картинке — как есть; без подписи — картинка ×2 и подпись пиксельным шрифтом.
  make(key) {
    const cap = (GS.STICKER_CAPS || {})[key];
    if (!cap) return this.scene.add.image(0, 0, 'st/' + key).setDepth(800).setScrollFactor(0);
    if (!cap[0]) return this.scene.add.image(0, 0, 'st/' + key).setDepth(800).setScrollFactor(0); // надпись уже на картинке, 1:1
    const pic = this.scene.add.image(0, 0, 'st/' + key).setScale(2);
    const txt = GS.text(this.scene, 0, 0, cap[0], { color: cap[1], maxW: 130, align: 1, origin: [0.5, 0] });
    const h = pic.height * 2 + txt.height - 4;
    pic.setY(-h / 2 + pic.height);
    txt.setY(pic.y + pic.height - 6);
    const box = this.scene.add.container(0, 0, [pic, txt]).setDepth(800).setScrollFactor(0);
    box.setSize(Math.max(pic.width * 2, txt.width), h);
    return box;
  }

  update(dt) {
    for (const k in this.cool) this.cool[k] -= dt;
    this.gap -= dt;
    if (this.current || this.gap > 0 || !this.queue.length) return;
    const key = this.queue.shift();
    const img = this.make(key);
    const right = this.side > 0;
    this.side *= -1;
    // В покое — ровно (угол 0, масштаб 1, левый верхний угол на целом пикселе): поворот и нецелый масштаб
    // в пиксель-арте ломают линии в лесенку. Наклон — только пока стикер летит.
    const w = img.displayWidth, h = img.displayHeight;
    const tx = (right ? GS.W - 10 - w : 10) + w / 2;
    const ty = GS.H - 14 - h + h / 2;
    img.setPosition(right ? GS.W + w : -w, ty).setAngle(right ? 12 : -12);
    this.current = img;
    GS.Synth.sticker();
    this.scene.tweens.add({ targets: img, x: tx, angle: 0, duration: 260, ease: 'Cubic.out' });
    // «Пружинка» — подскок на целые пиксели, без сплющивания.
    this.scene.tweens.add({ targets: img, y: ty - 4, yoyo: true, duration: 110, delay: 260, ease: 'Quad.out',
      onUpdate: () => { img.y = ty - Math.round(ty - img.y); } });
    this.scene.tweens.add({
      targets: img, x: right ? GS.W + img.width : -img.width, angle: right ? 20 : -20, delay: 2300, duration: 260, ease: 'Back.in',
      onComplete: () => { img.destroy(); this.current = null; this.gap = 0.6; },
    });
  }
};
