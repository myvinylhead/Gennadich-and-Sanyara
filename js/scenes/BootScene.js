// Встроенные картинки (data-URI из js/data/images.js) — регистрируются асинхронно.
GS.Images = {
  register(scene, done) {
    const data = GS.IMAGE_DATA || {};
    const keys = Object.keys(data).filter((k) => !scene.textures.exists(k));
    if (!keys.length) { done(); return; }
    let left = keys.length;
    const want = new Set(keys);
    const tick = (key) => {
      if (!want.has(key)) return;
      want.delete(key);
      if (--left === 0) {
        scene.textures.off('addtexture', tick);
        scene.textures.off('onerror', tick);
        done();
      }
    };
    scene.textures.on('addtexture', tick);
    scene.textures.on('onerror', tick);
    keys.forEach((k) => scene.textures.addBase64(k, data[k]));
    // Страховка: не ждать вечно.
    setTimeout(() => { if (left > 0) { left = 1; tick([...want][0]); } }, 4000);
  },
};

// Генерация всех процедурных текстур и шрифтов, затем переход в нужную сцену.
GS.BootScene = class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const t0 = performance.now();
    GS.Font.generate(this);
    GS.HeroArt.generate(this);
    if (GS.EnemyArt) GS.EnemyArt.generate(this);
    if (GS.ItemArt) GS.ItemArt.generate(this);
    if (GS.TileArt) GS.TileArt.generate(this);
    GS.Backgrounds.prepare(this);
    if (GS.FxArt) GS.FxArt.generate(this);
    if (GS.Images) GS.Images.register(this, () => { if (GS.HeroSprites) GS.HeroSprites.apply(this); GS.TileArt.applyDrawn(this); this.go(t0); });
    else this.go(t0);
  }

  go(t0) {
    if (GS.DEBUG) console.log(`[boot] textures in ${Math.round(performance.now() - t0)} ms`);
    const q = GS.QUERY;
    if (q.lab) { this.scene.start('RigLab'); return; }
    // ?duel=1 — сразу гитар-дуэль студии SUNO.
    if (q.duel) {
      const S = GS.session;
      S.players = q.coop ? 2 : 1; S.heroes = [q.hero || 'gennadich', q.hero2 || 'sanyara'];
      S.stage = GS.STAGES().findIndex((st) => st.def === GS.LEVEL_SUNO) + 1;
      this.scene.start('Rhythm', { stage: S.stage, levelId: 'suno', name: GS.LEVEL_SUNO.name });
      return;
    }
    if (q.level || q.boss || q.space || q.cdn || q.suno || q.pizza || q.pizzaboss || q.church || q.churchboss) {
      const stage = q.boss ? GS.STAGES().length : q.space ? GS.STAGES().findIndex((st) => st.scene === 'Shmup') + 1 : q.cdn ? GS.STAGES().findIndex((st) => st.def === GS.LEVEL_CDN) + 1 : q.suno ? GS.STAGES().findIndex((st) => st.def === GS.LEVEL_SUNO) + 1 : q.pizza ? GS.STAGES().findIndex((st) => st.def === GS.LEVEL_PIZZA) + 1 : q.pizzaboss ? GS.STAGES().findIndex((st) => st.def === GS.LEVEL_PIZZA_BOSS) + 1 : q.church ? GS.STAGES().findIndex((st) => st.def === GS.LEVEL_CHURCH) + 1 : q.churchboss ? GS.STAGES().findIndex((st) => st.def === GS.LEVEL_CHURCH_BOSS) + 1 : Number(q.level) || 1;
      GS.startStage(this, stage, { players: q.coop ? 2 : 1, heroes: [q.hero || 'gennadich', q.hero2 || 'sanyara'] });
      return;
    }
    this.scene.start(this.scene.get('Title') ? 'Title' : 'RigLab');
  }
};
