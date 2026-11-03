// Скелетная анимация для пиксельных персонажей.
//
// Кости — данные: { name, parent, x, y, r } (покой в пространстве родителя; r — градусы,
// 0 = кость смотрит вниз (+y), положительный угол — по часовой стрелке).
// Слоты — картинки, прикреплённые к костям, в порядке отрисовки (сзади → вперёд).
// Клипы — ключи с углами костей (число = поворот, <bone>X/<bone>Y = смещение, sx/sy = сжатие,
// eyes/mouth/<slot> — свап кадров), ключ наследует незаданные поля от предыдущего.
//
// Поверх клипа работают процедурные слои: аддитивные повороты, двухкостный IK, прямые мировые
// повороты, пружинные кости (волосы, антенны, щупальца, хвосты), моргание, взгляд зрачков, речь.
// Корень контейнера — точка между стоп на земле; разворот — scaleX = −1.
//
// def.pixelSafe — для нарисованных деталей: кости с snap (голова, торс) поворачиваются только на 90°,
// смещения костей — целые пиксели, без сплющивания. Иначе нарисованное лицо «кипит» от поворота
// на пару градусов и перерастяжения, а глаза-накладки съезжают относительно головы.
GS.DEG = Math.PI / 180;

GS.buildClips = (raw) => {
  const out = {};
  for (const [name, c] of Object.entries(raw)) {
    let prev = {};
    const keys = c.keys.map((k) => {
      const full = { ...prev, ...k };
      delete full.ev;
      delete full.ease;
      if (k.ev) full.ev = k.ev;
      if (k.ease) full.ease = k.ease;
      prev = full;
      return full;
    });
    out[name] = { loop: !!c.loop, keys, dur: keys[keys.length - 1].t, fade: c.fade };
  }
  return out;
};

GS.sampleClip = (clip, time) => {
  const keys = clip.keys;
  if (keys.length === 1) return keys[0];
  const dur = clip.dur;
  const t = clip.loop ? ((time % dur) + dur) % dur : Math.min(time, dur);
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  let u = GS.util.clamp((t - a.t) / Math.max(0.0001, b.t - a.t), 0, 1);
  const ease = a.ease || 'smooth';
  if (ease === 'smooth') u = u * u * (3 - 2 * u);
  else if (ease === 'out') u = 1 - (1 - u) * (1 - u);
  else if (ease === 'in') u = u * u;
  else if (ease === 'step') u = 0;
  const out = {};
  for (const k in a) {
    if (k === 't' || k === 'ev' || k === 'ease') continue;
    const va = a[k], vb = b[k];
    out[k] = typeof va === 'number' && typeof vb === 'number' ? va + (vb - va) * u : va;
  }
  for (const k in b) if (!(k in out) && k !== 't' && k !== 'ev' && k !== 'ease') out[k] = b[k];
  return out;
};

GS.Skeleton = class Skeleton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, def, skin = '') {
    super(scene, Math.round(x), Math.round(y));
    scene.add.existing(this);
    this.def = def;
    this.skin = skin;
    this.clips = def.clips;
    this.stepRate = def.stepRate ?? 1 / 15;
    this.pixelSafe = !!def.pixelSafe;

    this.bones = {};
    this.order = [];
    def.bones.forEach((b) => {
      const bone = { name: b.name, parent: b.parent ? this.bones[b.parent] : null, rx: b.x || 0, ry: b.y || 0, rr: (b.r || 0) * GS.DEG,
        abs: !!b.abs, snap: !!b.snap, x: 0, y: 0, r: 0, sx: 1, sy: 1, wx: 0, wy: 0, wr: 0, len: b.len || 0, children: [] };
      if (bone.parent) bone.parent.children.push(bone);
      this.bones[b.name] = bone;
      this.order.push(bone);
    });
    // Длина кости по умолчанию — расстояние до первого ребёнка.
    this.order.forEach((b) => { if (!b.len && b.children.length) b.len = Math.hypot(b.children[0].rx, b.children[0].ry); });

    this.slots = {};
    this.slotList = def.slots.map((s) => {
      const slot = { ...s, img: scene.add.image(0, 0, '__DEFAULT'), part: undefined, dx: 0, dy: 0, defPart: s.part || null };
      if (s.tint) slot.img.setTint(s.tint);
      this.add(slot.img);
      this.slots[s.name] = slot;
      this.setSlot(s.name, s.part);
      if (s.hidden) slot.img.setVisible(false);
      return slot;
    });

    this.facing = 1;
    this.baseScale = 1;
    this.squashX = 1;
    this.squashY = 1;
    this.clipName = null;
    this.clipTime = 0;
    this.timeScale = 1;
    this.stepAcc = 0;
    this.pose = {};
    this.fadeFrom = null;
    this.fadeT = 0;
    this.fadeDur = 0.1;

    this.addRot = {};      // аддитивные повороты, градусы
    this.ik = {};          // цели IK: имя цепочки → { x, y, bend }
    this.worldRot = {};    // прямые мировые повороты, радианы (в системе «0 = вниз»)
    this.look = { x: 0, y: 0 };
    this.eyesOverride = null;
    this.mouthOverride = null;
    this.talking = 0;
    this.talkT = 0;
    this.blinkIn = GS.util.rand(1.5, 3.5);
    this.blinkLeft = 0;
    this.hasFace = !!def.heroFace;

    this.springs = (def.springs || []).map((s) => ({ ...s, bone: this.bones[s.bone], tx: null, ty: null, vx: 0, vy: 0 }));
    this.lastX = this.x;
    this.lastY = this.y;
    this.lastFacing = 1;

    if (def.clips) this.play(Object.keys(def.clips)[0]);
    this.applyPose(0);
  }

  tex(part) {
    if (!part) return 'hero/none';
    return part[0] === '/' ? part.slice(1) : this.skin + part;
  }

  setSlot(name, part) {
    const s = this.slots[name];
    if (!s || s.part === part) return;
    s.part = part;
    const key = this.tex(part);
    const meta = GS.PARTS[key];
    s.img.setTexture(this.scene.textures.exists(key) ? key : '__MISSING');
    if (meta) s.img.setOrigin(meta.px / meta.w, meta.py / meta.h);
    else s.img.setOrigin(0.5, 0.5);
  }

  showSlot(name, on) { if (this.slots[name]) this.slots[name].img.setVisible(on); }

  play(name, { restart = false, fade = null } = {}) {
    if (!this.clips[name]) return;
    if (this.clipName === name && !restart) return;
    if (this.clipName) {
      this.fadeFrom = { ...this.pose };
      this.fadeT = 0;
      this.fadeDur = fade ?? this.clips[name].fade ?? 0.08;
    }
    this.clipName = name;
    this.clipTime = 0;
    this.stepAcc = this.stepRate; // новая поза — сразу
  }

  get clipDone() {
    const c = this.clips[this.clipName];
    return !c.loop && this.clipTime >= c.dur;
  }

  squash(sx, sy) { if (!this.pixelSafe) { this.squashX = sx; this.squashY = sy; } }

  say(seconds) { this.talking = Math.max(this.talking, seconds); }

  tick(dt) {
    const prevT = this.clipTime;
    this.clipTime += dt * this.timeScale;
    this.stepAcc += dt;
    if (this.fadeFrom) this.fadeT += dt;

    // События клипа (шаги и т.п.).
    const clip = this.clips[this.clipName];
    if (clip && clip.keys.length > 1) {
      const d = clip.dur;
      const a = clip.loop ? prevT % d : Math.min(prevT, d);
      const b = clip.loop ? this.clipTime % d : Math.min(this.clipTime, d);
      clip.keys.forEach((k) => {
        if (!k.ev) return;
        const hit = b >= a ? k.t > a && k.t <= b : k.t > a || k.t <= b;
        if (hit && b !== a) this.emit('ev', k.ev);
      });
    }

    this.blinkIn -= dt;
    if (this.blinkIn <= 0) { this.blinkLeft = 0.12; this.blinkIn = GS.util.rand(2, 4.5); }
    if (this.blinkLeft > 0) this.blinkLeft -= dt;
    if (this.talking > 0) { this.talking -= dt; this.talkT += dt; }

    if (this.stepAcc >= this.stepRate) {
      this.stepAcc %= this.stepRate;
      this.samplePose();
    }

    const k = Math.min(1, dt * 14);
    this.squashX += (1 - this.squashX) * k;
    this.squashY += (1 - this.squashY) * k;
    const bs = this.baseScale;
    if (this.pixelSafe) this.setScale(bs * this.facing, bs);
    else this.setScale(bs * this.facing * this.squashX * (this.pose.sx ?? 1), bs * this.squashY * (this.pose.sy ?? 1));
    this.applyPose(dt);
  }

  samplePose() {
    const clip = this.clips[this.clipName];
    if (!clip) return;
    let p = GS.sampleClip(clip, this.clipTime);
    if (this.fadeFrom) {
      const w = GS.util.clamp(this.fadeT / this.fadeDur, 0, 1);
      if (w >= 1) this.fadeFrom = null;
      else {
        const q = {};
        for (const k in p) {
          const a = this.fadeFrom[k], b = p[k];
          q[k] = typeof b === 'number' && typeof a === 'number' ? a + (b - a) * w : b;
        }
        p = q;
      }
    }
    this.pose = p;
  }

  fk() {
    for (const b of this.order) {
      const P = b.parent;
      if (!P) { b.wx = b.rx + b.x; b.wy = b.ry + b.y; b.wr = b.rr + b.r; continue; }
      const c = Math.cos(P.wr), s = Math.sin(P.wr);
      const lx = b.rx + b.x, ly = b.ry + b.y;
      b.wx = P.wx + lx * c - ly * s;
      b.wy = P.wy + lx * s + ly * c;
      b.wr = b.abs ? b.rr + b.r : P.wr + b.rr + b.r;
      if (b.snap) b.wr = Math.round(b.wr / (Math.PI / 2)) * (Math.PI / 2);
    }
  }

  // Двухкостный IK: upper → lower → end (end — кость на конце, задающая длину нижней).
  solveIK(chain, tx, ty, bend = 1) {
    const [n1, n2] = chain;
    const b1 = this.bones[n1], b2 = this.bones[n2];
    const l1 = b1.len, l2 = b2.len;
    const ax = b1.wx, ay = b1.wy;
    let dx = tx - ax, dy = ty - ay;
    let d = Math.hypot(dx, dy);
    const dmax = l1 + l2 - 0.01, dmin = Math.abs(l1 - l2) + 0.01;
    if (d < 0.0001) { dx = 0; dy = 1; d = 1; }
    const dc = GS.util.clamp(d, dmin, dmax);
    const base = Math.atan2(dy, dx);
    const cosA = GS.util.clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1);
    const a1 = base - bend * Math.acos(cosA);
    const jx = ax + Math.cos(a1) * l1, jy = ay + Math.sin(a1) * l1;
    const a2 = Math.atan2(ty - jy, tx - jx);
    // Направление → поворот в системе «0 = вниз».
    const w1 = a1 - Math.PI / 2, w2 = a2 - Math.PI / 2;
    const p1 = b1.parent ? b1.parent.wr : 0;
    b1.r = w1 - p1 - b1.rr;
    b2.r = w2 - w1 - b2.rr;
  }

  applyPose(dt) {
    const p = this.pose;
    for (const b of this.order) {
      const v = p[b.name];
      b.r = ((typeof v === 'number' ? v : 0) + (this.addRot[b.name] || 0)) * GS.DEG;
      b.x = p[b.name + 'X'] || 0;
      b.y = p[b.name + 'Y'] || 0;
      if (this.pixelSafe) { b.x = Math.round(b.x); b.y = Math.round(b.y); }
    }
    this.fk();
    // Хук владельца: здесь известны мировые позиции костей текущей позы — можно ставить цели IK.
    if (this.onIK) this.onIK(this);

    let again = false;
    for (const name in this.ik) {
      const t = this.ik[name];
      if (!t) continue;
      this.solveIK(this.def.ik[name], t.x, t.y, t.bend ?? 1);
      again = true;
      this.fk();
    }
    for (const name in this.worldRot) {
      const v = this.worldRot[name];
      if (v === null || v === undefined) continue;
      const b = this.bones[name];
      b.r = v - (b.parent ? b.parent.wr : 0) - b.rr;
      again = true;
    }
    if (again) this.fk();

    if (dt > 0 && this.springs.length) this.updateSprings(dt);

    // Лицо.
    if (this.hasFace) {
      let eyes = this.eyesOverride || p.eyes || 'open';
      if ((eyes === 'open' || eyes === 'angry') && this.blinkLeft > 0) eyes = 'blink';
      let mouth = this.mouthOverride || p.mouth || 'smile';
      if (this.talking > 0 && !this.mouthOverride) {
        const f = Math.floor(this.talkT * 9) % 3;
        mouth = f === 0 ? 'talk' : f === 1 ? 'o' : 'smile';
      }
      this.setSlot('eyes', 'eyes_' + eyes);
      this.setSlot('mouth', 'mouth_' + mouth);
      const showPupils = this.def.pupilsFor ? this.def.pupilsFor(eyes) : true;
      ['pupilB', 'pupilF'].forEach((n) => this.slots[n] && this.slots[n].img.setVisible(showPupils));
      const lx = Math.round(GS.util.clamp(this.look.x, -1, 1));
      const ly = Math.round(GS.util.clamp(this.look.y, -1, 1) * (this.def.lookY ?? 1));
      ['pupilB', 'pupilF'].forEach((n) => {
        const sl = this.slots[n];
        if (!sl) return;
        const m = sl.lookMul || [1, 1];
        sl.dx = lx * m[0]; sl.dy = ly * m[1];
      });
    } else if (this.def.pupils) {
      const lx = Math.round(GS.util.clamp(this.look.x, -1, 1)), ly = Math.round(GS.util.clamp(this.look.y, -1, 1));
      ['pupilB', 'pupilF', 'pupil'].forEach((n) => { if (this.slots[n]) { this.slots[n].dx = lx; this.slots[n].dy = ly; } });
    }
    // Слоты-«реквизит»: кадр берётся из клипа, а если клип его не задаёт — возвращается к исходному.
    for (const s of this.slotList) {
      if (!s.swap) continue;
      const v = p[s.name];
      this.setSlot(s.name, typeof v === 'string' ? v : s.defPart);
    }

    for (const s of this.slotList) {
      const b = this.bones[s.bone];
      const c = Math.cos(b.wr), sn = Math.sin(b.wr);
      const ox = (s.x || 0) + s.dx, oy = (s.y || 0) + s.dy;
      const img = s.img;
      img.x = Math.round(b.wx + ox * c - oy * sn);
      img.y = Math.round(b.wy + ox * sn + oy * c);
      img.rotation = s.fixed ? 0 : b.wr + (s.rot || 0) * GS.DEG;
    }
  }

  updateSprings(dt) {
    // Перемещение корня в мире → инерция в локальном пространстве.
    let mx = (this.x - this.lastX) * this.facing, my = this.y - this.lastY;
    if (this.facing !== this.lastFacing || Math.abs(mx) > 40 || Math.abs(my) > 40) { mx = 0; my = 0; this.springs.forEach((s) => { s.tx = null; }); }
    this.lastX = this.x; this.lastY = this.y; this.lastFacing = this.facing;
    const h = Math.min(dt, 1 / 30);
    for (const s of this.springs) {
      const b = s.bone;
      const len = s.len || b.len || 4;
      const P = b.parent;
      // Желаемое направление — поза клипа.
      const want = b.wr + (s.wave ? Math.sin(this.scene.time.now / 1000 * s.wave[0] + (s.wave[2] || 0)) * s.wave[1] * GS.DEG : 0);
      const gx = b.wx - Math.sin(want) * len, gy = b.wy + Math.cos(want) * len;
      if (s.tx === null) { s.tx = gx; s.ty = gy; s.vx = 0; s.vy = 0; }
      s.tx -= mx; s.ty -= my;
      const k = s.k ?? 120, damp = s.damp ?? 10;
      s.vx += ((gx - s.tx) * k - s.vx * damp) * h;
      s.vy += ((gy - s.ty) * k - s.vy * damp + (s.gravity || 0)) * h;
      s.tx += s.vx * h; s.ty += s.vy * h;
      const dx = s.tx - b.wx, dy = s.ty - b.wy;
      const d = Math.hypot(dx, dy) || 1;
      s.tx = b.wx + (dx / d) * len; s.ty = b.wy + (dy / d) * len;
      let wr = Math.atan2(dy, dx) - Math.PI / 2;
      if (s.limit) {
        const diff = GS.util.clamp(GS.util.angleDiff(want, wr), -s.limit * GS.DEG, s.limit * GS.DEG);
        wr = want + diff;
      }
      b.r += wr - b.wr;
      // Пересчитать эту кость и её потомков.
      const stack = [b];
      while (stack.length) {
        const q = stack.pop();
        const Q = q.parent;
        const c = Math.cos(Q ? Q.wr : 0), sn = Math.sin(Q ? Q.wr : 0);
        const lx = q.rx + q.x, ly = q.ry + q.y;
        if (Q) { q.wx = Q.wx + lx * c - ly * sn; q.wy = Q.wy + lx * sn + ly * c; q.wr = q.abs ? q.rr + q.r : Q.wr + q.rr + q.r; }
        q.children.forEach((ch) => stack.push(ch));
      }
    }
  }

  // Мировая (сцена) позиция точки в пространстве кости.
  boneWorld(name, ox = 0, oy = 0) {
    const b = this.bones[name];
    const c = Math.cos(b.wr), s = Math.sin(b.wr);
    const lx = b.wx + ox * c - oy * s, ly = b.wy + ox * s + oy * c;
    return { x: this.x + lx * this.scaleX, y: this.y + ly * this.scaleY };
  }

  setTintAll(color) { this.slotList.forEach((s) => (color === null ? (s.tint ? s.img.setTint(s.tint) : s.img.clearTint()) : s.img.setTintFill(color))); }
};
