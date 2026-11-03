// Поток игры: этапы, комиксы между ними, финал.
GS.STAGES = () => [
  { def: GS.LEVEL1, story: 'intro' },
  { def: GS.LEVEL2, story: 'toLevel2' },
  { def: GS.LEVEL_CDN, story: 'toCdn' },
  { def: GS.LEVEL_SUNO, story: 'toSuno' },
  { def: GS.LEVEL_PIZZA, story: 'toPizza' },
  { def: GS.LEVEL_PIZZA_BOSS, story: 'toPizzaBoss' },
  { def: GS.LEVEL_CHURCH, story: 'toChurch' },
  { def: GS.LEVEL_CHURCH_BOSS, story: 'toChurchBoss' },
  { def: GS.LEVEL_SPACE, story: 'toSpace', scene: 'Shmup' },
  { def: GS.LEVEL_BOSS, story: 'toBoss' },
];

GS.session = { players: 1, heroes: ['gennadich', 'sanyara'], stage: 1, totals: { time: 0, deaths: 0, kills: 0, coins: 0 } };

GS.startStage = (scene, stage, opts = {}) => {
  const s = GS.session;
  if (opts.players) s.players = opts.players;
  if (opts.heroes) s.heroes = opts.heroes;
  s.stage = stage;
  const st = GS.STAGES()[stage - 1];
  const target = st.scene || 'Level';
  const go = () => scene.scene.start(target, { stage });
  if (st.story && !opts.skipStory && !GS.QUERY.nostory && scene.scene.get('Story')) {
    scene.scene.start('Story', { story: st.story, next: { scene: target, data: { stage } } });
  } else go();
};

GS.LevelScene = class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.stage = data.stage || 1;
    this.def = GS.STAGES()[this.stage - 1].def;
    // Экземпляр сцены переиспользуется — сбросить всё, что осталось от прошлого уровня.
    this.exit = null;
    this.crate = null;
    this.boss = null;
    this.bossSpawn = null;
    this.floorY = null;
    this.chase = null;
    this.rhythm = null;
    this.diagnoseT = 0;
    this.roomMarks = [];
    this.relicCount = 0;
    this.eqCount = 0;
    this.laserCount = 0;
    this.hasArtifact = false;
    this.respawning = false;
  }

  create() {
    const def = this.def;
    const S = GS.session;
    GS.level = this;
    this.L = GS.parseLevel(def);
    this.worldW = this.L.w * 16;
    this.worldH = this.L.h * 16;
    this.isBoss = !!def.boss;
    this.levelDir = 1;
    this.flags = {};
    this.stats = { time: 0, kills: 0, coins: 0, coinsTotal: 0, deaths: 0, shots: 0, hits: 0, score: 0, cat: false, pizzas: 0, coffees: 0 };
    this.team = 0;
    this.combo = 0;
    this.comboT = 0;
    this.state = 'play';
    this.frozenInput = false;
    this.mechs = [];
    this.grids = [];
    this.enemies = [];
    this.pickups = [];
    this.objects = [];
    this.checkpoints = [];

    this.physics.world.setBounds(0, -400, this.worldW, this.worldH + 800, true, true, false, false);
    this.cameras.main.setBackgroundColor(GS.PAL.night0);
    this.bg = GS.Backgrounds.create(this, def.theme, this.worldH);

    // Тайлмап.
    const tkey = 'tiles_' + def.theme;
    const backMap = this.make.tilemap({ data: this.L.back, tileWidth: 16, tileHeight: 16 });
    const backTs = backMap.addTilesetImage(tkey, tkey, 16, 16, 0, 0);
    this.backLayer = backMap.createLayer(0, backTs, 0, 0).setDepth(-20);
    const map = this.make.tilemap({ data: this.L.fg, tileWidth: 16, tileHeight: 16 });
    const ts = map.addTilesetImage(tkey, tkey, 16, 16, 0, 0);
    this.layer = map.createLayer(0, ts, 0, 0).setDepth(2);
    const T = GS.TILES;
    const solid = [];
    for (let i = 0; i < 16; i++) { solid.push(T.GROUND + i, T.RUIN + i); }
    for (let i = 0; i < 4; i++) solid.push(T.GROUND_ALT + i);
    this.layer.setCollision(solid);
    this.layer.forEachTile((t) => { if (t.index >= T.ONEWAY && t.index <= T.ONEWAY + 3) t.setCollision(false, false, true, false); });

    GS.ChurchArt.make(this);
    this.decorate();

    this.fx = new GS.Fx(this);
    this.shots = new GS.Shots(this);
    this.chatter = new GS.Chatter(this);
    this.controls = new GS.Controls(this, S.players);

    this.enemySprites = this.add.group();
    this.pickupSprites = this.add.group();
    this.staticBlocks = this.add.group();
    this.platforms = this.add.group();
    this.gridSprites = this.add.group();
    this.mechSprites = this.add.group();

    GS.RaceArt.make(this);
    GS.RhythmArt.make(this);
    GS.PizzaArt.make(this);
    if (def.rhythm) { this.rhythm = new GS.RhythmDirector(this); this.objects.push(this.rhythm); }
    // Игроки и сущности из карты.
    const spawn = this.L.spawns.find((s) => s.c === '@') || { x: 40, y: this.worldH - 64 };
    this.checkpoint = { x: spawn.x, y: spawn.y };
    this.players = [];
    for (let i = 0; i < S.players; i++) {
      const p = new GS.Player(this, i, S.heroes[i], spawn.x - i * 18, spawn.y);
      this.players.push(p);
    }
    let signIndex = 0;
    const signs = this.L.spawns.filter((s) => s.c === 'T').sort((a, b) => a.x - b.x);
    signs.forEach((s) => { s.signIndex = signIndex++; });
    this.L.spawns.forEach((s) => this.spawnFromMap(s));
    this.stats.coinsTotal = this.pickups.filter((p) => p.kind === 'coin').length;
    // Реликвии по порядку слева направо: TDD, CAVEMAN, DIAGNOSE (точки появления идут по строкам карты).
    this.objects.filter((o) => o instanceof GS.RelicPedestal).sort((a, b) => a.x - b.x)
      .forEach((o, i) => o.setKind(['tdd', 'caveman', 'diagnose'][i % 3]));
    // Контекстные окна: «[» … «]», колонны «САММАРИ» внутри принадлежат своему окну.
    const starts = this.roomMarks.filter((m) => m.c === '[').sort((a, b) => a.x - b.x);
    const ends = this.roomMarks.filter((m) => m.c === ']').sort((a, b) => a.x - b.x);
    starts.forEach((st) => {
      const en = ends.find((e) => e.x > st.x);
      if (!en) return;
      const pillars = this.enemies.filter((e) => e instanceof GS.SummaryPillar && e.center.x > st.x && e.center.x < en.x);
      this.objects.push(new GS.ContextRoom(this, st.x - 8, en.x + 8, pillars));
    });
    if (def.exitOpen && this.exit) { this.exit.activate(); this.exit.label.setText(def.exitLabel || 'ФИНИШ!'); }
    if (def.chase) this.chase = new GS.ChaseWall(this, def.chase);

    this.setupColliders();

    // Камера.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.setRoundPixels(true);
    this.camTarget = new Phaser.Math.Vector2(spawn.x, spawn.y - 40);
    cam.startFollow(this.camTarget, true, 0.12, 0.12);
    cam.setFollowOffset(0, 0);
    cam.fadeIn(400, 7, 5, 26);
    this.lookAhead = 0;

    this.scene.launch('Hud', { level: this });
    this.events.once('shutdown', () => this.cleanup());

    GS.Music.play(def.music);
    this.time.delayedCall(600, () => {
      const p = this.players[0];
      if (this.isBoss) return;
      p.say('start', { priority: true });
      if (this.stickers) this.stickers.show(this.def.startSticker || 'start', { force: !!this.def.startSticker });
    });
    if (this.isBoss) this.setupBoss();
    if (GS.QUERY.god) this.players.forEach((p) => { p.maxHp = 99; p.hp = 99; });
  }

  get stickers() { const h = this.scene.get('Hud'); return h && h.stickers; }
  get hud() { return this.scene.get('Hud'); }

  cleanup() {
    if (this.rhythm) this.rhythm.release();
    this.scene.stop('Hud');
    GS.level = null;
  }

  decorate() {
    const th = this.def.theme;
    const sets = {
      planet: ['decor/coral', 'decor/crystal', 'decor/vcrystal', 'decor/mushroom', 'decor/grass', 'decor/grass', 'decor/tower'],
      city: ['decor/antenna', 'decor/ac', 'decor/grass'],
      core: ['decor/server', 'decor/cable'],
      cdn: ['decor/server', 'decor/cable', 'decor/antenna'],
      suno: ['decor/vcrystal', 'decor/crystal', 'decor/antenna', 'decor/vcrystal'],
      pizza: ['decor/mushroom', 'decor/grass', 'decor/mushroom', 'decor/grass'],
      church: ['church/candle', 'church/candle', 'decor/vcrystal'],
    }[th];
    this.L.decor.forEach((d) => {
      const key = sets[d.r % sets.length];
      if (key === 'decor/tower' && d.r % 3) return;
      const img = this.add.image(d.x + ((d.r * 7) % 9) - 4, d.y + 1, key).setOrigin(0.5, 1).setDepth(key === 'decor/grass' ? 3 : 1);
      if (d.r % 2) img.setFlipX(true);
      if (key === 'decor/crystal' || key === 'decor/vcrystal' || key === 'decor/mushroom') {
        this.add.image(img.x, img.y - 6, key === 'decor/vcrystal' ? 'glow/violet' : key === 'decor/mushroom' ? 'glow/cyan' : 'glow/green').setDepth(0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setScale(0.5);
      }
    });
  }

  spawnFromMap(s) {
    const add = (e) => { this.enemies.push(e); this.enemySprites.add(e.sprite); return e; };
    switch (s.c) {
      case 'C': case 'P': case 'K': case 'D': case 'A': case '$': {
        const kind = { C: 'coin', P: 'pizza', K: 'coffee', D: 'crystal', A: 'artifact', $: 'cat' }[s.c];
        const p = new GS.Pickup(this, kind, s.x, s.cy);
        this.pickups.push(p); this.pickupSprites.add(p.sprite);
        if (kind === 'cat' && GS.Save.data.cats[this.def.id]) p.sprite.setAlpha(0.5);
        break;
      }
      case 'S': { const c = new GS.Checkpoint(this, s.x, s.y); this.checkpoints.push(c); break; }
      case 'E': this.exit = new GS.ExitPortal(this, s.x, s.y); break;
      case 'T': {
        // Строки вида { hero, text } — только если этот герой в игре (секретного Юрича не выдаём заранее).
        const lines = ((this.def.signs || [])[s.signIndex] || ['...'])
          .filter((l) => typeof l === 'string' || this.players.some((p) => p.hero === l.hero))
          .map((l) => (typeof l === 'string' ? l : l.text));
        new GS.Sign(this, s.x, s.y, lines);
        break;
      }
      case 'M': this.crate = new GS.MechCrate(this, s.x, s.y); this.objects.push(this.crate); break;
      case 'Y': this.objects.push(new GS.Alien(this, s.x, s.y)); break;
      case 'G': { const g = new GS.GlitchBlock(this, s.tx * 16, s.ty * 16); this.objects.push(g); this.staticBlocks.add(g.sprite); break; }
      case 'm': case 'l': { const m = new GS.Mover(this, s.tx * 16 - 8, s.ty * 16 + 2, s.c === 'l', s.c === 'l' ? 80 : 88, this.def.moverSpeed || 45); this.objects.push(m); this.platforms.add(m.sprite); break; }
      case '>': this.objects.push(new GS.BoostPad(this, s.x, s.y)); break;
      case 'J': this.objects.push(new GS.JumpPad(this, s.x, s.y)); break;
      case 'q': { const e = new GS.EqPlatform(this, s.x + 8, s.cy, this.eqCount++ % 4); this.objects.push(e); this.platforms.add(e.sprite); break; }
      case 'U': this.objects.push(new GS.Subwoofer(this, s.x, s.y)); break;
      case 'L': this.objects.push(new GS.MetroLaser(this, s.x, s.y, this.laserCount++ % 2 === 1)); break;
      case 'N': { const p = new GS.Pickup(this, 'coin', s.x, s.cy); p.note = true; this.pickups.push(p); this.pickupSprites.add(p.sprite); break; }
      case 'x': add(new GS.FalseNote(this, s.x, s.y)); break;
      case 'a': add(new GS.AutotuneHog(this, s.x, s.y)); break;
      case 'c': add(new GS.CopyrightBot(this, s.x, s.y)); break;
      case 'u': add(new GS.MuteGhost(this, s.x, s.y)); break;
      case 'o': this.objects.push(new GS.PizzaWheel(this, s.x, s.cy)); break;
      case '~': { const b = new GS.CheeseBridge(this, s.tx * 16, s.ty * 16); this.objects.push(b); this.staticBlocks.add(b.sprite); break; }
      case 'p': this.objects.push(new GS.PepperoniSaw(this, s.x, s.cy)); break;
      case 'V': this.objects.push(new GS.OvenVent(this, s.x, s.y)); break;
      case 'n': add(new GS.PineappleHeretic(this, s.x, s.y)); break;
      case 'd': for (let i = 0; i < 3; i++) add(new GS.OliveDrone(this, s.x + (i - 1) * 14, s.y, i)); break;
      case 'k': add(new GS.CheeseSlime(this, s.x, s.y)); break;
      case 'F': add(new GS.PromptFanatic(this, s.x, s.y)); break;
      case 'H': add(new GS.AgentsAcolyte(this, s.x, s.y)); break;
      case 'e': add(new GS.Tokenizer(this, s.x, s.y)); break;
      case 'y': add(new GS.Choir(this, s.x, s.y)); break;
      case 'i': add(new GS.Inquisitor(this, s.x, s.y)); break;
      case 'I': add(new GS.SummaryPillar(this, s.x, s.y)); break;
      case '[': case ']': this.roomMarks.push(s); break;
      case 'Q': this.objects.push(new GS.RelicPedestal(this, s.x, s.y, ['tdd', 'caveman', 'diagnose'][this.relicCount++ % 3])); break;
      case 'r': add(new GS.CourierHog(this, s.x, s.y)); break;
      case 'h': add(new GS.Hopper(this, s.x, s.y)); break;
      case 'f': add(new GS.Flyer(this, s.x, s.y)); break;
      case 'g': add(new GS.Grenadier(this, s.x, s.y)); break;
      case 'b': add(new GS.Bug(this, s.x, s.y)); break;
      case 'z': add(new GS.Sleeper(this, s.x, s.y)); break;
      case 'W': add(new GS.Popup(this, s.x, s.y)); break;
      case 'R': add(new GS.Rooster(this, s.x, s.y)); break;
      case 'O': this.bossSpawn = s; break;
      default: break;
    }
  }

  setupColliders() {
    const T = GS.TILES;
    const isOneway = (tile) => tile.index >= T.ONEWAY && tile.index <= T.ONEWAY + 3;
    const ph = this.physics;
    const playerSprites = this.players.map((p) => p.sprite);
    this.playerGroup = this.add.group(playerSprites);

    const oneWayProcess = (spr, tile) => {
      if (!tile || !isOneway(tile)) return true;
      const p = spr.owner;
      if (p && p.dropT > 0) return false;
      return spr.body.velocity.y >= 0 && spr.body.bottom - spr.body.deltaY() <= tile.pixelY + 1;
    };
    ph.add.collider(this.playerGroup, this.layer, null, oneWayProcess);
    ph.add.collider(this.enemySprites, this.layer, null, (spr, tile) => {
      if (!tile || !isOneway(tile)) return true;
      return spr.body.velocity.y >= 0 && spr.body.bottom - spr.body.deltaY() <= tile.pixelY + 1;
    });
    ph.add.collider(this.mechSprites, this.layer, null, oneWayProcess);
    // Phaser может передать участников столкновения в любом порядке — различаем по признакам.
    const isPl = (o) => o && o.owner instanceof GS.Player;
    const pick = (a, b, test) => (test(a) ? [a, b] : [b, a]);
    ph.add.collider(this.playerGroup, this.staticBlocks, (a, b) => {
      const [spr, blk] = pick(a, b, isPl);
      if (spr.body.blocked.down || spr.body.touching.down) blk.owner.touch();
    });
    ph.add.collider(this.mechSprites, this.staticBlocks, (a, b) => { const blk = a.owner instanceof GS.GlitchBlock ? a : b; blk.owner.touch(); });
    ph.add.collider(this.enemySprites, this.staticBlocks);
    const dropProcess = (a, b) => { const spr = isPl(a) ? a : isPl(b) ? b : null; return !(spr && spr.owner.dropT > 0); };
    ph.add.collider(this.playerGroup, this.platforms, null, dropProcess);
    ph.add.collider(this.mechSprites, this.platforms);
    ph.add.collider(this.playerGroup, this.gridSprites, null, dropProcess);

    // Снаряды о стены.
    ph.add.collider(this.shots.player, this.layer, (s) => this.shots.kill(s), (s, tile) => !isOneway(tile));
    ph.add.collider(this.shots.player, this.staticBlocks, (a, b) => this.shots.kill(a.kind ? a : b));
    ph.add.collider(this.shots.enemy, this.layer, (s) => { if (s.kind !== 'grenade' && s.kind !== 'cube') this.shots.kill(s); else if (s.kind === 'cube') { this.fx.burst(s.x, s.y, 8, ['v', 'g']); this.shots.kill(s, false); GS.Synth.splat(); } },
      (s, tile) => s.kind !== 'wave' && !isOneway(tile));

    // Попадания.
    const isShot = (o) => o && o.kind !== undefined && o.hits !== undefined;
    ph.add.overlap(this.shots.player, this.enemySprites, (a, b) => {
      const [s, es] = pick(a, b, isShot);
      if (!s.active || !es.enemy || !es.enemy.alive) return;
      if (s.hits.has(es.enemy)) return;
      if (es.enemy instanceof GS.Popup && !es.enemy.appeared) return;
      s.hits.add(es.enemy);
      es.enemy.hit(s.damage, s.x, s);
      this.fx.sparks(s.x, s.y, 3, GS.hex(s.owner ? s.owner.cfg.color : '#ffffff'));
      if (s.hits.size > s.pierce) this.shots.kill(s);
    });
    ph.add.overlap(this.shots.enemy, this.playerGroup, (a, b) => {
      const [s, ps] = pick(a, b, isShot);
      if (!s.active) return;
      const p = ps.owner;
      if (!p || !p.canBeHit) return;
      if (s.kind === 'grenade') { this.shots.kill(s); return; }
      if (s.kind === 'strike') { p.addStrike(s.x); this.shots.kill(s); return; }
      p.hurt(s.damage, s.x);
      if (s.kind !== 'wave') this.shots.kill(s);
    });
    ph.add.overlap(this.shots.enemy, this.mechSprites, (a, b) => { const [s, ms] = pick(a, b, isShot); if (!s.active) return; ms.mech.hurt(1); this.shots.kill(s); });
    ph.add.overlap(this.playerGroup, this.enemySprites, (a, b) => {
      const [ps, es] = pick(a, b, isPl);
      const p = ps.owner, e = es.enemy;
      if (!e || !e.alive || !e.harmful || !p.alive) return;
      if (p.dashT > 0) {
        if (!p.dashHits.has(e)) { p.dashHits.add(e); e.hit(p.cfg.special.damage, p.center.x, null); this.fx.code(e.center.x, e.center.y, 4); }
        return;
      }
      if (e instanceof GS.Popup && !e.appeared) return;
      p.hurt(e.contact, e.center.x);
    });
    ph.add.overlap(this.mechSprites, this.enemySprites, (a, b) => {
      const [ms, es] = pick(a, b, (o) => !!o.mech);
      const e = es.enemy;
      if (!e || !e.alive) return;
      e.hit(0.5, ms.x, null);
      if (e.contact > 1) ms.mech.hurt(1);
    });
    ph.add.overlap(this.playerGroup, this.pickupSprites, (a, b) => {
      const [ps, it] = pick(a, b, isPl);
      if (ps.owner.alive && !ps.owner.bubbleState) it.owner.take(ps.owner);
    });
    ph.add.overlap(this.mechSprites, this.pickupSprites, (a, b) => { const [ms, it] = pick(a, b, (o) => !!o.mech); it.owner.take(ms.mech.player); });
  }

  // ——— Запросы к миру ———
  tileAt(x, y) { return this.layer.getTileAtWorldXY(x, y, true); }
  isSolidAt(x, y) { const t = this.tileAt(x, y); return !!(t && t.index >= 0 && t.collides); }
  isOnewayAt(x, y) { const t = this.tileAt(x, y); return !!(t && t.index >= GS.TILES.ONEWAY && t.index <= GS.TILES.ONEWAY + 3); }
  isHazardAt(x, y) { const t = this.tileAt(x, y); return !!(t && (t.index === GS.TILES.SPIKE_UP || t.index === GS.TILES.SPIKE_DOWN || t.index === GS.TILES.GOO_TOP || t.index === GS.TILES.GOO)); }
  isSafeGround(x, y) {
    const t = this.tileAt(x, y);
    if (!t || !t.collides || this.isOnewayAt(x, y)) return false;
    return !this.isHazardAt(x - 16, y - 2) && !this.isHazardAt(x + 16, y - 2) && this.isSolidAt(x - 10, y) && this.isSolidAt(x + 10, y);
  }
  onGrid(p) { return this.grids.some((g) => !g.dead && Math.abs(g.sprite.y - 3 - p.body.bottom) < 4 && Math.abs(g.sprite.x - p.center.x) < 26); }

  nearestPlayer(x, y, r = 9999) {
    let best = null, bd = r;
    for (const p of this.players) {
      if (!p.alive || p.bubbleState) continue;
      const c = p.inMech ? p.inMech.center : p.center;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = p.inMech ? { center: p.inMech.center, alive: true, body: p.inMech.body } : p; }
    }
    return best;
  }

  nearestEnemy(x, y, r = 9999) {
    let best = null, bd = r;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.center.x - x, e.center.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    if (this.boss && this.boss.alive) { const d = Math.hypot(this.boss.center.x - x, this.boss.center.y - y); if (d < bd) best = this.boss; }
    return best;
  }

  // ——— События ———
  addScore(n) { this.stats.score += n; }

  addTeam(n) {
    const was = this.team;
    this.team = Math.min(GS.TUNING.team.max, this.team + n);
    if (was < GS.TUNING.team.max && this.team >= GS.TUNING.team.max && this.hud) this.hud.banner('СУПЕРУДАР ГОТОВ!', '#b4ff5a', this.players.length > 1 ? 'R / U — ДВА МОЗГА, ОДИН ПРОД' : 'V — ДВА МОЗГА, ОДИН ПРОД');
  }

  onEnemyKilled(e) {
    this.stats.kills++;
    this.addScore(e.cfg.score || 100);
    this.addTeam(GS.TUNING.team.perKill);
    this.combo = this.comboT > 0 ? this.combo + 1 : 1;
    this.comboT = 2.5;
    if (this.hud) this.hud.setCombo(this.combo);
    if (this.combo === 4 || this.combo === 8 || this.combo === 12) {
      const p = this.nearestPlayer(e.center.x, e.center.y) || this.players[0];
      if (p && p.say) p.say(this.combo >= 8 ? 'combo' : 'kill', { priority: true });
      if (this.stickers) this.stickers.show('combo');
    } else if (Math.random() < 0.12) {
      const p = this.players.find((q) => q.alive);
      if (p) p.say('kill', { weak: true });
    }
  }

  onPickup(item, player) {
    const c = item.sprite;
    switch (item.kind) {
      case 'coin':
        this.stats.coins++;
        player.chainCoins++; player.chainT = 0.6;
        // Ноты-монеты подряд играют гамму соль мажора.
        if (item.note) GS.Synth.note([67, 69, 71, 74, 76, 79, 81, 83][(player.chainCoins - 1) % 8]);
        else GS.Synth.coin(player.chainCoins);
        this.addScore(10);
        this.addTeam(GS.TUNING.team.perCoin);
        this.fx.sparks(c.x, c.y, 3, 0xb4ff5a);
        break;
      case 'pizza':
        this.stats.pizzas++;
        player.heal(GS.TUNING.pizzaHeal);
        GS.Synth.pizza();
        this.fx.hearts(c.x, c.y, 3);
        this.fx.pop(c.x, c.y - 8, '+♥♥', { color: '#ff7ab8' });
        player.say('pizza', { priority: true });
        player.rig.mouthOverride = 'munch';
        this.time.delayedCall(500, () => { player.rig.mouthOverride = null; });
        if (this.stickers) this.stickers.show('pizza');
        break;
      case 'coffee':
        this.stats.coffees++;
        player.coffeeT = GS.TUNING.coffee.time;
        GS.Synth.coffee();
        this.fx.pop(c.x, c.y - 8, 'КОФЕ +112%', { color: '#ffd84a' });
        player.say('coffee', { priority: true });
        if (this.stickers) this.stickers.show('coffee');
        break;
      case 'crystal':
        player.shield = true;
        GS.Synth.crystal();
        this.fx.ring(c.x, c.y, { color: 0xb08cff, to: 1.6 });
        this.fx.pop(c.x, c.y - 8, 'ЩИТ!', { color: '#c8a8ff' });
        break;
      case 'artifact':
        GS.Synth.artifact();
        this.fx.flash(200, 0xd070ff, 0.5);
        this.fx.burst(c.x, c.y, 30, ['v', 'g', 'w']);
        this.fx.ring(c.x, c.y, { color: 0xd070ff, to: 3, ms: 500 });
        this.fx.hitstop(120);
        player.say('artifact', { priority: true });
        if (this.stickers) this.stickers.show('artifact', { force: true });
        this.addScore(1000);
        this.hasArtifact = true;
        if (this.exit) this.exit.activate();
        if (this.hud) this.hud.banner('АРТЕФАКТ В РЮКЗАКЕ!', '#d070ff', this.isBoss ? 'ДИЗТЕХИ ЖДУТ' : 'ПОРТАЛ ОТКРЫТ →');
        if (this.isBoss) this.time.delayedCall(1800, () => this.completeLevel(player));
        break;
      case 'cat': {
        GS.Synth.cat();
        this.stats.cat = true;
        const first = !GS.Save.data.cats[this.def.id];
        GS.Save.data.cats[this.def.id] = true;
        GS.Save.write();
        this.fx.burst(c.x, c.y, 24, ['y', 'w']);
        this.fx.ring(c.x, c.y, { color: 0xffd84a, to: 2.5 });
        this.addScore(2000);
        player.say('cat', { priority: true });
        if (this.stickers) this.stickers.show('cat', { force: true });
        if (this.hud) this.hud.banner('СЕКРЕТ НАЙДЕН!', '#ffd84a', `ЗОЛОТЫЕ КОШКИ: ${GS.Save.catCount()} / 3${first && GS.Save.catCount() >= 3 ? ' — ЮРИЧ ОТКРЫТ!' : ''}`);
        break;
      }
      default: break;
    }
  }

  onCheckpoint(cp, player) {
    this.checkpoint = { x: cp.x + 20, y: cp.y };
    GS.Synth.checkpoint();
    if (this.hud) this.hud.banner(this.def.checkpointTitle || 'ЧЕКПОИНТ', '#4fe03c', GS.util.pick(this.def.checkpointMsgs || GS.LINES.checkpointMsgs));
    player.say('checkpoint', { weak: true });
    this.players.forEach((p) => {
      if (p.alive) p.heal(2);
      else if (p.bubbleState) p.respawn(cp.x + 20, cp.y, 4);
    });
  }

  spawnGrid(player, x, y) {
    this.grids.filter((g) => g.owner === player && !g.dead).forEach((g) => g.destroy());
    const g = new GS.GridPlatform(this, player, x, y);
    this.grids.push(g);
    this.gridSprites.add(g.sprite);
  }

  katanaHit(player) {
    const sp = player.cfg.special;
    const cx = player.center.x + player.facing * sp.range * 0.6, cy = player.center.y - 2;
    this.fx.ring(cx, cy, { color: 0xffffff, to: 1.3, ms: 160 });
    let hit = false;
    this.enemies.forEach((e) => {
      if (!e.alive) return;
      if (Math.abs(e.center.x - cx) < sp.range * 0.7 + 8 && Math.abs(e.center.y - cy) < 26) { e.hit(sp.damage, player.center.x, null); hit = true; }
    });
    if (this.boss && this.boss.alive && Math.abs(this.boss.center.x - cx) < sp.range + 30 && Math.abs(this.boss.center.y - cy) < 40) { this.boss.hit(sp.damage, player.center.x, null); hit = true; }
    this.shots.enemy.children.each((s) => { if (s.active && Math.abs(s.x - cx) < sp.range && Math.abs(s.y - cy) < 28) { this.shots.kill(s); hit = true; } });
    if (hit) { this.fx.hitstop(50); this.fx.shake(80, 2); }
  }

  enterMech(player, x, y) {
    const m = new GS.Mech(this, player, x, y);
    this.mechs.push(m);
    this.mechSprites.add(m.sprite);
    player.inMech = m;
    player.dashT = 0;
    player.body.checkCollision.none = true;
    player.body.setAllowGravity(false);
    player.rig.setVisible(false);
    player.say('mech', { priority: true });
    if (this.stickers) this.stickers.show('mech', { force: true });
    if (this.hud) this.hud.banner('КЛОД-МЕХ В БОЙ!', '#ffb03a', 'ОГОНЬ — ПУШКА, СПЕЦ — CODE BLADE');
  }

  performSuper(player) {
    if (this.team < GS.TUNING.team.max || !player.alive) return;
    this.team = 0;
    const c = player.inMech ? player.inMech.center : player.center;
    GS.Synth.superBlast();
    this.fx.flash(300, 0xb4ff5a, 0.7);
    this.fx.shake(600, 6);
    this.fx.hitstop(150);
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 90, () => this.fx.ring(c.x, c.y, { color: i % 2 ? 0xb08cff : 0x4fe03c, to: 6 + i * 2, ms: 600 }));
    const portal = this.add.image(c.x, c.y - 20, 'obj/portal').setDepth(50).setScale(0.2).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: portal, scale: 5, angle: -720, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => portal.destroy() });
    const view = this.cameras.main.worldView;
    this.enemies.forEach((e) => { if (e.alive && view.contains(e.center.x, e.center.y)) e.hit(GS.TUNING.team.superDamage, c.x, null); });
    if (this.boss && this.boss.alive) this.boss.hit(this.boss.maxHp * GS.TUNING.team.superBossFrac, c.x, null);
    this.shots.enemy.children.each((s) => { if (s.active) this.shots.kill(s); });
    this.players.forEach((p) => p.say('super', { priority: true }));
    if (this.stickers) this.stickers.show('super', { force: true });
  }

  onPlayerDeath(p) {
    if (this.hud) this.hud.flashPortrait(p.index);
  }

  requestRespawn(p) {
    const mate = this.players.find((q) => q !== p && q.alive && !q.bubbleState);
    if (mate) { p.enterBubble(p.rig.x, Math.min(p.rig.y, this.cameras.main.worldView.bottom - 40) - 20); return; }
    if (this.players.every((q) => !q.alive || q.bubbleState)) this.respawnAll();
  }

  respawnAll() {
    if (this.respawning) return;
    this.respawning = true;
    const cam = this.cameras.main;
    cam.fadeOut(350, 7, 5, 26);
    cam.once('camerafadeoutcomplete', () => {
      this.players.forEach((p, i) => {
        if (p.bubbleImg) { p.bubbleImg.destroy(); p.bubbleImg = null; }
        p.bubbleState = null;
        p.respawn(this.checkpoint.x - i * 18, this.checkpoint.y, p.maxHp);
        p.say('respawn', { priority: true });
      });
      this.shots.enemy.children.each((s) => { if (s.active) this.shots.kill(s, false); });
      if (this.stickers) this.stickers.show('respawn');
      if (this.chase) this.chase.reset(this.checkpoint.x);
      this.objects.forEach((o) => o.onRespawn && o.onRespawn());
      this.camTarget.set(this.checkpoint.x, this.checkpoint.y - 40);
      cam.centerOn(this.checkpoint.x, this.checkpoint.y - 40);
      cam.fadeIn(350, 7, 5, 26);
      this.respawning = false;
      if (this.boss && this.boss.alive) this.boss.setState('idle', 1.5);
    });
  }

  completeLevel(player) {
    if (this.state !== 'play') return;
    this.state = 'won';
    this.frozenInput = true;
    GS.Music.stop(0.3);
    GS.Synth.win();
    this.players.forEach((p) => { if (p.alive) { p.rig.play('win'); p.say('portal', { priority: true }); } });
    if (this.stickers) this.stickers.show(this.isBoss ? 'win' : 'portal', { force: true });
    this.fx.flash(300, 0xb4ff5a, 0.4);
    const stats = { ...this.stats, stage: this.stage, levelId: this.def.id, name: this.def.name, par: this.def.parTime, players: this.players.length };
    if (this.exit && !this.isBoss) {
      // Героев засасывает в портал.
      this.players.forEach((p, i) => {
        this.time.delayedCall(900 + i * 150, () => {
          GS.Synth.portal();
          this.tweens.add({ targets: p.rig, x: this.exit.img.x, y: this.exit.img.y + 10, angle: 720, duration: 700, ease: 'Quad.in', onUpdate: () => { p.rig.squashX = p.rig.squashY = Math.max(0.05, p.rig.squashX * 0.95); } });
        });
      });
    }
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 7, 5, 26);
      // Студия SUNO заканчивается гитар-дуэлью — итоги покажет она.
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.def.duel ? 'Rhythm' : 'Results', stats));
    });
  }

  // ——— Босс ———
  setupBoss() {
    this.floorY = this.worldH - 32;
    const s = this.bossSpawn || { x: this.worldW - 120, y: this.floorY };
    const def = this.def;
    const Boss = { pizza: GS.PizzaBoss, archbishop: GS.ArchbishopBoss }[def.boss];
    this.boss = Boss ? new Boss(this, s.x, s.cy) : new GS.Opossum(this, s.x, s.y);
    this.enemySprites.add(this.boss.sprite);
    this.boss.sprite.enemy = { alive: true, harmful: true, get contact() { return GS.level && GS.level.boss ? GS.level.boss.contact : 1; }, hit: (d, fx, src) => this.boss.hit(d, fx, src), get center() { return GS.level.boss.center; } };
    Object.defineProperty(this.boss.sprite.enemy, 'alive', { get: () => !!(this.boss && this.boss.alive && this.boss.state !== 'sleep') });
    this.frozenInput = true;
    GS.Music.stop(0);
    this.time.delayedCall(800, () => {
      if (this.hud) this.hud.banner(def.bossName || 'ОПОССУМ-МАКС', '#ff5a4a', def.bossSub || 'ОШИБКА ГЕНЕРАЦИИ');
      this.boss.start();
    });
    this.time.delayedCall(3300, () => {
      this.frozenInput = false;
      GS.Music.play(def.bossMusic || 'boss');
      if (this.hud) this.hud.showBoss(true, def.bossName || 'ОПОССУМ-МАКС');
      this.boss.setState('idle', 0.5);
      this.players[0].say('boss', { priority: true });
    });
  }

  spawnMinion(x, y) {
    if (this.enemies.filter((e) => e.alive).length > 6) return;
    this.fx.ring(x, y, { color: 0x4fe03c, to: 1.5 });
    this.fx.burst(x, y, 10, ['g', 'p']);
    GS.Synth.portal();
    const e = Math.random() < 0.3 ? new GS.Bug(this, x, y) : new GS.Hopper(this, x, y);
    this.enemies.push(e);
    this.enemySprites.add(e.sprite);
  }

  onBossPhase(n) {
    const sub = (this.def.bossPhases || {})[n] || (n === 2 ? 'ГЛИТЧИ И ПОПАПЫ' : 'ОПОССУМ-МАКС: МАКСИМУМ');
    if (this.hud) this.hud.banner(n === 2 ? 'ФАЗА 2' : 'ФАЗА 3', '#ff5a4a', sub);
    if (n === 2 && !this.flags.bossMech && this.def.bossMech) {
      this.flags.bossMech = true;
      this.time.delayedCall(2000, () => {
        const crate = new GS.MechCrate(this, GS.W / 2, 60);
        crate.sprite.body.setAllowGravity(true);
        this.physics.add.collider(crate.sprite, this.layer);
        this.objects.push(crate);
        this.crate = crate;
        if (this.hud) this.hud.banner('ДИЗТЕХИ ПРИСЛАЛИ ПОДАРОК', '#ffb03a', 'CLAUDE-МЕХ!');
      });
    }
  }

  onBossDying() {
    this.enemies.forEach((e) => { if (e.alive) e.die(); });
    this.shots.enemy.children.each((s) => { if (s.active) this.shots.kill(s); });
  }

  onBossDefeated(x, y) {
    if (this.hud) this.hud.showBoss(false);
    this.addScore(10000);
    const a = new GS.Pickup(this, 'artifact', x, y - 20);
    this.pickups.push(a); this.pickupSprites.add(a.sprite);
    // Летающий босс (пицца) роняет артефакт на пол, наземный — оставляет на месте.
    a.baseY = this.def.bossFloats ? this.floorY - 30 : Math.min(y - 20, this.floorY - 30);
    this.tweens.add({ targets: a.sprite, y: a.baseY, duration: 600, ease: 'Bounce.out' });
    this.players.forEach((p) => { if (p.alive) p.say(GS.util.pick(['ПОБЕДА!', 'ХРЮК ДА КОД!', 'ВСЁ ПОД КОНТРОЛЕМ!']), { priority: true }); });
  }

  // ——— Цикл ———
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    const C = this.controls;
    C.update();
    if (C.sys.pause && this.state === 'play') { this.openPause(); return; }
    if (C.sys.f1) {
      const w = this.physics.world;
      if (!w.debugGraphic) w.createDebugGraphic();
      w.drawDebug = !w.drawDebug;
      w.debugGraphic.clear();
    }
    if (C.sys.mute) { GS.Synth.setMuted(!GS.Synth.muted); }
    if (GS.DEBUG && C.sys.f2) { const a = this.pickups.find((p) => p.kind === 'artifact' && !p.taken); if (a) a.take(this.players[0]); else if (this.exit) this.completeLevel(this.players[0]); }

    this.fx.update(dt);
    if (this.fx.frozen) { if (!this.physics.world.isPaused) this.physics.world.pause(); return; }
    if (this.physics.world.isPaused) this.physics.world.resume();

    if (this.state === 'play') this.stats.time += dt;
    if (this.diagnoseT > 0) this.diagnoseT -= dt;
    this.comboT -= dt;
    if (this.comboT <= 0 && this.combo) { this.combo = 0; if (this.hud) this.hud.setCombo(0); }

    this.players.forEach((p, i) => {
      let inp = this.frozenInput ? GS.Controls.prototype.blank() : C.read(i);
      if (GS.bot && !this.frozenInput) inp = GS.bot(i, inp, this, p);
      p.update(dt, inp);
      if (inp.super && this.team >= GS.TUNING.team.max) this.performSuper(p);
      if (p.alive && !p.inMech && !p.bubbleState) this.checkHazards(p);
    });

    // Враги далеко за кадром «спят»: не думают и не рисуются.
    const view = this.cameras.main.worldView;
    const cxv = view.centerX, cyv = view.centerY;
    this.enemies.forEach((e) => {
      if (!e.alive || e.dying) return;
      const c = e.sprite.body ? e.sprite.body.center : null;
      if (!c) return;
      const near = Math.abs(c.x - cxv) < 470 && Math.abs(c.y - cyv) < 330;
      if (e.view) e.view.setVisible(near || e.awakeOnce === true);
      if (!near && !e.awakeOnce) { e.sprite.body.setVelocityX(0); return; }
      e.update(dt);
    });
    if (this.enemies.length > 40) this.enemies = this.enemies.filter((e) => e.alive || !e.destroyed);
    if (this.boss && this.boss.state !== 'dead') this.boss.update(dt);
    this.pickups.forEach((p) => p.update(dt, time));
    this.objects.forEach((o) => o.update && o.update(dt, time));
    this.grids.forEach((g) => !g.dead && g.update(dt));
    this.grids = this.grids.filter((g) => !g.dead);
    this.shots.update(dt);
    if (this.exit) this.exit.update(dt, time);
    if (this.chase) this.chase.update(dt, time);

    // Чекпоинты, портал, ящик меха.
    this.players.forEach((p) => {
      if (!p.alive || p.bubbleState) return;
      const c = p.inMech ? p.inMech.center : p.center;
      this.checkpoints.forEach((cp) => { if (!cp.active && Math.abs(cp.x - c.x) < 14 && Math.abs(cp.y - 14 - c.y) < 30) cp.activate(p); });
      if (this.exit && this.exit.open && Math.abs(this.exit.img.x - c.x) < 18 && Math.abs(this.exit.img.y - c.y) < 30) this.completeLevel(p);
      if (this.crate && !this.crate.used && !p.inMech && Math.abs(this.crate.sprite.x - c.x) < 22 && Math.abs(this.crate.sprite.y - c.y) < 26) this.crate.open(p);
    });

    this.updateCamera(dt);
    this.bg.update(this.cameras.main, time);
    this.chatter.update(dt);
  }

  checkHazards(p) {
    const b = p.body;
    const pts = [[b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [b.center.x, b.bottom - 2], [b.center.x, b.top + 2]];
    for (const [x, y] of pts) {
      const t = this.tileAt(x, y);
      if (!t || t.index < 0) continue;
      if (t.index === GS.TILES.GOO || t.index === GS.TILES.GOO_TOP) {
        if (y > t.pixelY + 5) { this.fx.goo(x, t.pixelY + 4, 8, true); GS.Synth.splat(); p.fellInPit(); return; }
      }
      if (t.index === GS.TILES.SPIKE_UP && y > t.pixelY + 6) {
        if (p.hurt(1, x)) { p.body.velocity.y = -300; }
        return;
      }
      if (t.index === GS.TILES.SPIKE_DOWN && y < t.pixelY + 10) { p.hurt(1, x); return; }
    }
  }

  updateCamera(dt) {
    const cam = this.cameras.main;
    const alive = this.players.filter((p) => p.alive && !p.bubbleState);
    if (this.isBoss) { cam.stopFollow(); cam.setScroll(0, this.worldH - GS.H); return; }
    if (!alive.length) return;
    const pts = alive.map((p) => (p.inMech ? p.inMech.center : p.center));
    const cx = pts.reduce((a, c) => a + c.x, 0) / pts.length;
    const cy = pts.reduce((a, c) => a + c.y, 0) / pts.length;
    const lead = alive.length === 1 ? (alive[0].inMech ? alive[0].inMech.facing : alive[0].facing) * 48 : 0;
    this.lookAhead = GS.util.damp(this.lookAhead, lead, 2.5, dt);
    this.camTarget.set(cx + this.lookAhead, cy - 30);
    // Кооп: никто не уходит за край кадра.
    if (alive.length > 1) {
      const v = cam.worldView;
      alive.forEach((p) => {
        const b = p.inMech ? p.inMech.body : p.body;
        if (b.x < v.x + 2) { b.x = v.x + 2; if (b.velocity.x < 0) b.velocity.x = 0; }
        if (b.right > v.right - 2) { b.x = v.right - 2 - b.width; if (b.velocity.x > 0) b.velocity.x = 0; }
      });
    }
  }

  openPause() {
    this.scene.pause();
    this.scene.pause('Hud');
    GS.Music.duck(true);
    this.scene.launch('Pause', { from: 'Level' });
  }
};
