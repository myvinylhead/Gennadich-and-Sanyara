// Риги врагов, босса, меха и NPC. Те же соглашения, что у героев: 0° — кость вниз,
// «плюс» — по часовой стрелке; части нарисованы вниз (+y), «вертикальные» — со слотом rot: 180.
GS.enemyRigs = (() => {
  const chain = (bones, slots, springs, { name, parent, x, y, angle, segs, len, skin, tipPart, segPart, z, wave, k = 90, damp = 7, limit = 60, tint }) => {
    let par = parent;
    for (let i = 0; i < segs; i++) {
      const bn = `${name}${i}`;
      bones.push({ name: bn, parent: par, x: i === 0 ? x : 0, y: i === 0 ? y : len, r: i === 0 ? angle - 90 : 0, len });
      const s = { name: bn, bone: bn, part: i === segs - 1 && tipPart ? tipPart : segPart, z };
      if (tint) s.tint = tint;
      slots.push(s);
      springs.push({ bone: bn, k: k - i * 10, damp, limit, wave: wave ? [wave[0], wave[1] * (1 + i * 0.4), (wave[2] || 0) + i * 0.7] : null });
      par = bn;
    }
  };
  const byZ = (slots) => slots.map((s, i) => ({ s, i })).sort((a, b) => (a.s.z ?? 0) - (b.s.z ?? 0) || a.i - b.i).map((o) => o.s);

  // ——— Нейрохрючево ———
  function hryuchevo(kind = 'pink', { wings = false, launcher = false, helmet = false } = {}) {
    const bones = [{ name: 'root' }, { name: 'body', parent: 'root', x: 0, y: -15 },
      { name: 'face', parent: 'body', x: 0, y: 0 }];
    const slots = [];
    const springs = [];
    const T = (n, segs = 3) => ({ name: n, parent: 'body', segs, len: 3, segPart: 'tent', tipPart: 'tip' });
    chain(bones, slots, springs, { ...T('tb1'), x: -9, y: 1, angle: 170, z: -2, wave: [3.1, 14] });
    chain(bones, slots, springs, { ...T('tb2'), x: -6, y: -7, angle: -140, z: -2, wave: [2.7, 16, 1] });
    chain(bones, slots, springs, { ...T('legB', 2), x: -4, y: 8, angle: 110, z: -1, wave: [4, 8, 2], k: 140, tint: 0xc0a0c0 });
    if (wings) {
      bones.push({ name: 'wingB', parent: 'body', x: -2, y: -8, r: 0 }, { name: 'wingF', parent: 'body', x: 2, y: -8, r: 0 });
      slots.push({ name: 'wingB', bone: 'wingB', part: '/pig/wing', z: -3, tint: 0xb090c0 });
    }
    slots.push({ name: 'body', bone: 'body', part: 'body', z: 0 });
    chain(bones, slots, springs, { ...T('top'), x: 1, y: -10, angle: -80, z: 1, wave: [2.3, 18, 3] });
    chain(bones, slots, springs, { ...T('legF', 2), x: 4, y: 8, angle: 75, z: 1, wave: [4, 8], k: 140 });
    chain(bones, slots, springs, { ...T('tf'), x: 8, y: 5, angle: 35, z: 1, wave: [3.4, 14, 4] });
    if (wings) slots.push({ name: 'wingF', bone: 'wingF', part: '/pig/wing', z: 2 });
    slots.push(
      { name: 'snout', bone: 'face', part: 'snout', x: 8, y: 0, z: 3 },
      { name: 'eyes', bone: 'face', part: '/pig/eyes_open', x: 3, y: -5, z: 3, swap: true },
      { name: 'pupilB', bone: 'face', part: '/pig/pupil', x: 0, y: -5, z: 4, swap: true },
      { name: 'pupilF', bone: 'face', part: '/pig/pupil', x: 6, y: -5, z: 4, swap: true },
      { name: 'mouth', bone: 'face', part: '/pig/mouth_closed', x: 4, y: 5, z: 4, swap: true },
    );
    if (helmet) slots.push({ name: 'helmet', bone: 'body', part: '/pig/helmet', x: 0, y: -8, z: 5 });
    if (launcher) {
      bones.push({ name: 'launcher', parent: 'body', x: -3, y: -9, r: -90 });
      slots.push({ name: 'launcher', bone: 'launcher', part: '/pig/launcher', rot: 90, z: 6 });
    }
    const blink = { pupilB: '/hero/none', pupilF: '/hero/none' };
    return {
      skin: `pig_${kind}/`,
      bones, slots: byZ(slots), springs,
      stepRate: 1 / 15,
      clips: GS.buildClips({
        idle: { loop: true, keys: [
          { t: 0, bodyY: 0, sx: 1, sy: 1, wingB: -20, wingF: -30 },
          { t: 0.5, bodyY: 1, sx: 1.05, sy: 0.95, wingB: 30, wingF: 20 },
          { t: 1.0, bodyY: 0, sx: 1, sy: 1, wingB: -20, wingF: -30 }] },
        fly: { loop: true, keys: [
          { t: 0, bodyY: 0, wingB: -40, wingF: -50, sx: 1, sy: 1 },
          { t: 0.08, wingB: 50, wingF: 40, sx: 1.04, sy: 0.96 },
          { t: 0.16, wingB: -40, wingF: -50, sx: 1, sy: 1 }] },
        crouch: { keys: [{ t: 0, bodyY: 2, sx: 1.25, sy: 0.78, eyes: '/pig/eyes_angry', mouth: '/pig/mouth_grin' }, { t: 0.2 }] },
        air: { loop: true, keys: [{ t: 0, bodyY: -1, sx: 0.88, sy: 1.15, eyes: '/pig/eyes_wide', mouth: '/pig/mouth_open' }, { t: 0.3, sx: 0.92, sy: 1.1 }, { t: 0.6, sx: 0.88, sy: 1.15 }] },
        hurt: { keys: [{ t: 0, sx: 1.3, sy: 0.78, eyes: '/pig/eyes_x', mouth: '/pig/mouth_scream', ...blink }, { t: 0.18, sx: 1, sy: 1 }] },
        scream: { loop: true, keys: [{ t: 0, sx: 1.12, sy: 0.92, eyes: '/pig/eyes_angry', mouth: '/pig/mouth_scream' }, { t: 0.1, sx: 1.06, sy: 0.96 }, { t: 0.2, sx: 1.12, sy: 0.92 }] },
        sleep: { loop: true, keys: [
          { t: 0, sx: 1, sy: 1, eyes: '/pig/eyes_sleep', mouth: '/pig/mouth_closed', ...blink },
          { t: 1.2, sx: 1.06, sy: 0.95 },
          { t: 2.4, sx: 1, sy: 1 }] },
        aim: { loop: true, keys: [{ t: 0, eyes: '/pig/eyes_angry', mouth: '/pig/mouth_grin', sx: 1, sy: 1 }, { t: 0.4, sx: 1.03, sy: 0.97 }, { t: 0.8, sx: 1, sy: 1 }] },
      }),
      pupils: true,
    };
  }

  // ——— Петушня ———
  function rooster() {
    const bones = [
      { name: 'root' }, { name: 'hips', parent: 'root', x: 0, y: -13 }, { name: 'body', parent: 'hips' },
      { name: 'tail1', parent: 'body', x: -7, y: -3, r: 150, len: 11 }, { name: 'tail2', parent: 'body', x: -7, y: -2, r: 128, len: 11 }, { name: 'tail3', parent: 'body', x: -7, y: -1, r: 108, len: 11 },
      { name: 'thighB', parent: 'hips', x: -2, y: 2 }, { name: 'shinB', parent: 'thighB', x: 0, y: 4 }, { name: 'footB', parent: 'shinB', x: 0, y: 7, abs: true },
      { name: 'thighF', parent: 'hips', x: 2, y: 2 }, { name: 'shinF', parent: 'thighF', x: 0, y: 4 }, { name: 'footF', parent: 'shinF', x: 0, y: 7, abs: true },
      { name: 'neck', parent: 'body', x: 6, y: -4, r: 180, len: 6 }, { name: 'head', parent: 'neck', x: 0, y: 5, r: 180 },
      { name: 'wing', parent: 'body', x: 0, y: -3 },
    ];
    const slots = [
      { name: 'tail1', bone: 'tail1', part: 'rooster/f1', rot: 180 }, { name: 'tail2', bone: 'tail2', part: 'rooster/f2', rot: 180 }, { name: 'tail3', bone: 'tail3', part: 'rooster/f3', rot: 180 },
      { name: 'thighB', bone: 'thighB', part: 'rooster/thigh', tint: 0xb0a0b0 }, { name: 'shinB', bone: 'shinB', part: 'rooster/shin', tint: 0xb0a0b0 }, { name: 'footB', bone: 'footB', part: 'rooster/foot', tint: 0xb0a0b0 },
      { name: 'neck', bone: 'neck', part: 'rooster/neck', rot: 180 },
      { name: 'body', bone: 'body', part: 'rooster/body' },
      { name: 'headImg', bone: 'head', part: 'rooster/head', swap: true },
      { name: 'wing', bone: 'wing', part: 'rooster/wing' },
      { name: 'thighF', bone: 'thighF', part: 'rooster/thigh' }, { name: 'shinF', bone: 'shinF', part: 'rooster/shin' }, { name: 'footF', bone: 'footF', part: 'rooster/foot' },
    ];
    const springs = [
      { bone: 'tail1', k: 70, damp: 5, limit: 50, wave: [1.5, 6] }, { bone: 'tail2', k: 70, damp: 5, limit: 50, wave: [1.7, 6, 1] }, { bone: 'tail3', k: 70, damp: 5, limit: 50, wave: [1.9, 6, 2] },
    ];
    const LEGS = { thighF: -10, shinF: 10, footF: 0, thighB: 10, shinB: -5, footB: 0 };
    return {
      skin: '', bones, slots, springs, stepRate: 1 / 15,
      clips: GS.buildClips({
        idle: { loop: true, keys: [
          { t: 0, ...LEGS, body: 0, neck: 0, head: 0, wing: 0, hipsY: 0 },
          { t: 1.1, neck: 0, head: 0 },
          { t: 1.25, neck: 55, head: 40, body: 12, ease: 'out' },
          { t: 1.4, neck: 20, head: 15, body: 4 },
          { t: 1.5, neck: 55, head: 40, body: 12 },
          { t: 1.8, neck: 0, head: 0, body: 0 },
          { t: 2.4 }] },
        run: { loop: true, keys: [
          { t: 0, body: 18, neck: 40, head: 20, thighF: -50, shinF: 40, footF: -20, thighB: 40, shinB: 30, footB: 20, wing: -30, hipsY: 0, ev: 'step' },
          { t: 0.08, hipsY: -2, thighF: -10, shinF: 60, thighB: -10, shinB: 10, wing: 20 },
          { t: 0.16, hipsY: 0, thighF: 40, shinF: 30, footF: 20, thighB: -50, shinB: 40, footB: -20, wing: -30, ev: 'step' },
          { t: 0.24, hipsY: -2, thighF: -10, shinF: 10, thighB: -10, shinB: 60, wing: 20 },
          { t: 0.32, thighF: -50, shinF: 40, footF: -20, thighB: 40, shinB: 30, footB: 20, wing: -30, hipsY: 0 }] },
        crow: { loop: true, keys: [
          { t: 0, ...LEGS, body: -14, neck: -30, head: -40, wing: -60, hipsY: -1, headImg: 'rooster/head_open' },
          { t: 0.15, wing: 40, head: -50 },
          { t: 0.3, wing: -60, head: -40 }] },
        windup: { keys: [{ t: 0, ...LEGS, body: 25, neck: 60, head: 20, hipsY: 2, thighF: -40, shinF: 70, thighB: 20, shinB: 50, wing: 30 }, { t: 0.3 }] },
        stunned: { loop: true, keys: [
          { t: 0, ...LEGS, body: -6, neck: 80, head: 70, wing: 40, hipsY: 2, thighF: -40, shinF: 70, thighB: 30, shinB: 60 },
          { t: 0.4, neck: 70, head: 90 },
          { t: 0.8, neck: 80, head: 70 }] },
      }),
    };
  }

  // ——— Опоссум-Макс ———
  function opossum() {
    const bones = [
      { name: 'root' }, { name: 'body', parent: 'root', x: 0, y: -38 },
      { name: 'head', parent: 'body', x: 30, y: -6 },
      { name: 'jaw', parent: 'head', x: 15, y: 5 },
      { name: 'ear', parent: 'head', x: -1, y: -9, r: 180, len: 9 },
    ];
    const slots = [];
    const springs = [];
    // Хвост — цепочка из 8 сегментов.
    let par = 'body';
    for (let i = 0; i < 8; i++) {
      bones.push({ name: 'tail' + i, parent: par, x: i === 0 ? -30 : 0, y: i === 0 ? -2 : 6, r: i === 0 ? 100 : -6, len: 6 });
      slots.push({ name: 'tail' + i, bone: 'tail' + i, part: 'opossum/tail' + i, z: -3 });
      springs.push({ bone: 'tail' + i, k: 70 - i * 5, damp: 5, limit: 40, wave: [1.6, 8 + i * 2, i * 0.6] });
      par = 'tail' + i;
    }
    const leg = (n, x, z, tint) => {
      bones.push({ name: n + 'U', parent: 'body', x, y: 9 }, { name: n + 'L', parent: n + 'U', x: 0, y: 12 }, { name: n + 'P', parent: n + 'L', x: 0, y: 10, abs: true });
      slots.push({ name: n + 'U', bone: n + 'U', part: 'opossum/legU', z, tint }, { name: n + 'L', bone: n + 'L', part: 'opossum/legL', z, tint }, { name: n + 'P', bone: n + 'P', part: 'opossum/paw', z, tint });
    };
    leg('fb', 20, -2, 0x9890a8); leg('bb', -20, -2, 0x9890a8);
    slots.push({ name: 'body', bone: 'body', part: 'opossum/body', z: 0 });
    leg('ff', 24, 1); leg('bf', -16, 1);
    slots.push(
      { name: 'ear', bone: 'ear', part: 'opossum/ear', rot: 180, z: 1 },
      { name: 'tongue', bone: 'jaw', part: 'opossum/tongue', x: 4, y: 0, z: 1 },
      { name: 'jaw', bone: 'jaw', part: 'opossum/jaw', z: 2 },
      { name: 'head', bone: 'head', part: 'opossum/head', z: 3 },
      { name: 'eye', bone: 'head', part: 'opossum/eye_open', x: 13, y: -4, z: 4, swap: true },
    );
    springs.push({ bone: 'ear', k: 120, damp: 7, limit: 40 });
    const S = { fbU: 0, fbL: 0, fbP: 0, ffU: 0, ffL: 0, ffP: 0, bbU: 0, bbL: 0, bbP: 0, bfU: 0, bfL: 0, bfP: 0 };
    return {
      skin: '', bones, slots: byZ(slots), springs, stepRate: 1 / 15,
      clips: GS.buildClips({
        idle: { loop: true, keys: [
          { t: 0, ...S, bodyY: 0, body: 0, head: 0, jaw: 6, ffU: -5, fbU: 5, bfU: 5, bbU: -5, sx: 1, sy: 1 },
          { t: 0.7, bodyY: 2, head: 5, jaw: 10, ffU: -8, ffL: 6, fbU: 2, fbL: 6, bfU: 2, bfL: 6, bbU: -8, bbL: 6 },
          { t: 1.4, bodyY: 0, head: 0, jaw: 6, ffU: -5, ffL: 0, fbU: 5, fbL: 0, bfU: 5, bfL: 0, bbU: -5, bbL: 0 }] },
        run: { loop: true, keys: [
          { t: 0, ...S, bodyY: 0, body: 4, head: 6, jaw: 20, ffU: -50, ffL: 20, fbU: -30, fbL: 10, bfU: 40, bfL: 30, bbU: 50, bbL: 20, ev: 'step' },
          { t: 0.12, bodyY: -6, body: -4, ffU: 20, ffL: 40, fbU: 30, fbL: 50, bfU: -40, bfL: 10, bbU: -30, bbL: 20 },
          { t: 0.24, bodyY: 0, body: 4, ffU: -50, ffL: 20, fbU: -30, fbL: 10, bfU: 40, bfL: 30, bbU: 50, bbL: 20, ev: 'step' }] },
        roar: { loop: true, keys: [
          { t: 0, ...S, bodyY: 2, body: -8, head: -28, jaw: 48, ffU: -20, fbU: -15, bfU: 10, bbU: 15, eye: 'opossum/eye_rage', sx: 1.06, sy: 0.96 },
          { t: 0.08, head: -32, jaw: 52, sx: 1.08, sy: 0.94 },
          { t: 0.16, head: -28, jaw: 48, sx: 1.06, sy: 0.96 }] },
        crouch: { keys: [{ t: 0, ...S, bodyY: 8, body: 8, head: 10, jaw: 14, ffU: -40, ffL: 70, fbU: -40, fbL: 70, bfU: 40, bfL: -60, bbU: 40, bbL: -60, eye: 'opossum/eye_rage', sx: 1.1, sy: 0.88 }, { t: 0.3 }] },
        air: { loop: true, keys: [{ t: 0, ...S, body: -10, head: -10, jaw: 30, ffU: -70, ffL: 30, fbU: -60, fbL: 30, bfU: 60, bfL: 20, bbU: 70, bbL: 20, sx: 0.95, sy: 1.05 }, { t: 0.4 }] },
        hurt: { keys: [{ t: 0, ...S, body: -6, head: -16, jaw: 30, eye: 'opossum/eye_closed', sx: 1.08, sy: 0.92 }, { t: 0.2, sx: 1, sy: 1 }] },
        dead: { keys: [{ t: 0, ...S, bodyY: 0, body: 12, head: 40, jaw: 30, eye: 'opossum/eye_x', ffU: -60, fbU: -50, bfU: 50, bbU: 60 }, { t: 0.6, bodyY: 18, body: 20, head: 60, jaw: 40, ffU: -90, ffL: 0, fbU: -85, bfU: 85, bbU: 90 }] },
      }),
    };
  }

  // ——— Клод-мех ———
  function mech(hero = 'gennadich') {
    const bones = [
      { name: 'root' }, { name: 'hips', parent: 'root', x: 0, y: -34 }, { name: 'torso', parent: 'hips', x: 0, y: -3 },
      { name: 'head', parent: 'torso', x: 0, y: -25 },
      { name: 'armB', parent: 'torso', x: -11, y: -20 }, { name: 'foreB', parent: 'armB', x: 0, y: 11 }, { name: 'handB', parent: 'foreB', x: 0, y: 10 },
      { name: 'thighB', parent: 'hips', x: -5, y: 1 }, { name: 'shinB', parent: 'thighB', x: 0, y: 13 }, { name: 'footB', parent: 'shinB', x: 0, y: 15, abs: true },
      { name: 'thighF', parent: 'hips', x: 5, y: 1 }, { name: 'shinF', parent: 'thighF', x: 0, y: 13 }, { name: 'footF', parent: 'shinF', x: 0, y: 15, abs: true },
      { name: 'armF', parent: 'torso', x: 11, y: -20 }, { name: 'foreF', parent: 'armF', x: 0, y: 11 }, { name: 'handF', parent: 'foreF', x: 0, y: 10 },
      { name: 'blade', parent: 'handF', x: 0, y: 2, r: -90 },
    ];
    const D = 0xa8a0b8;
    const slots = [
      { name: 'padB', bone: 'armB', part: 'mech/pad', tint: D, y: -2 },
      { name: 'armB', bone: 'armB', part: 'mech/armU', tint: D }, { name: 'foreB', bone: 'foreB', part: 'mech/armL', tint: D }, { name: 'handB', bone: 'handB', part: 'mech/fist', tint: D },
      { name: 'thighB', bone: 'thighB', part: 'mech/thigh', tint: D }, { name: 'shinB', bone: 'shinB', part: 'mech/shin', tint: D }, { name: 'footB', bone: 'footB', part: 'mech/foot', tint: D },
      { name: 'pelvis', bone: 'hips', part: 'mech/pelvis' },
      { name: 'thighF', bone: 'thighF', part: 'mech/thigh' }, { name: 'shinF', bone: 'shinF', part: 'mech/shin' }, { name: 'footF', bone: 'footF', part: 'mech/foot' },
      { name: 'torso', bone: 'torso', part: 'mech/torso' },
      { name: 'pilot', bone: 'torso', part: `/portrait/${hero}_open`, x: -8, y: -24 },
      { name: 'glass', bone: 'torso', part: 'mech/glass', x: -7, y: -20 },
      { name: 'head', bone: 'head', part: 'mech/head' },
      { name: 'blade', bone: 'blade', part: 'mech/blade', rot: 90 },
      { name: 'armF', bone: 'armF', part: 'mech/armU' }, { name: 'foreF', bone: 'foreF', part: 'mech/armL' },
      { name: 'padF', bone: 'armF', part: 'mech/pad', y: -2 },
    ];
    const LEGS = { thighF: -8, shinF: 8, footF: 0, thighB: 8, shinB: 0, footB: 0 };
    return {
      skin: '', bones, slots, springs: [], stepRate: 1 / 15,
      clips: GS.buildClips({
        idle: { loop: true, keys: [
          { t: 0, ...LEGS, hipsY: 0, torso: 2, head: 0, armB: 10, foreB: -20, armF: -20, foreF: -70, sx: 1, sy: 1 },
          { t: 1.0, hipsY: 1, torso: 3, head: 3, armB: 14, foreB: -25 },
          { t: 2.0, hipsY: 0, torso: 2, head: 0, armB: 10, foreB: -20 }] },
        walk: { loop: true, keys: [
          { t: 0, hipsY: 1, torso: 6, head: -2, thighF: -35, shinF: 20, footF: -10, thighB: 25, shinB: 30, footB: 15, armB: 25, foreB: -30, armF: -30, foreF: -70, ev: 'stomp' },
          { t: 0.2, hipsY: -2, thighF: -5, shinF: 10, footF: 0, thighB: -5, shinB: 60, footB: 20, armB: 0 },
          { t: 0.4, hipsY: 1, thighF: 25, shinF: 30, footF: 15, thighB: -35, shinB: 20, footB: -10, armB: -25, foreB: -40, ev: 'stomp' },
          { t: 0.6, hipsY: -2, thighF: -5, shinF: 60, footF: 20, thighB: -5, shinB: 10, footB: 0, armB: 0 },
          { t: 0.8, hipsY: 1, thighF: -35, shinF: 20, footF: -10, thighB: 25, shinB: 30, footB: 15, armB: 25, foreB: -30 }] },
        jump: { keys: [{ t: 0, thighF: -50, shinF: 70, footF: 10, thighB: 20, shinB: 50, footB: 20, armB: -60, foreB: -30, armF: -60, foreF: -40, torso: 4 }, { t: 0.3 }] },
        slash: { keys: [
          { t: 0, ...LEGS, torso: -14, armF: -190, foreF: -10, armB: 30, ease: 'in' },
          { t: 0.08, torso: 22, armF: -40, foreF: -10, armB: -20, sx: 1.08, sy: 0.94, ease: 'out' },
          { t: 0.35, torso: 10, armF: -30, foreF: -40, sx: 1, sy: 1 }] },
        stomp: { keys: [{ t: 0, hipsY: 6, ...LEGS, thighF: -40, shinF: 70, thighB: 30, shinB: 50, torso: 12, sx: 1.1, sy: 0.9 }, { t: 0.25, hipsY: 0, ...LEGS, torso: 2, sx: 1, sy: 1 }] },
      }),
    };
  }

  // ——— Инопланетянин «Я ПОМОГ» ———
  function alien() {
    const bones = [
      { name: 'root' }, { name: 'body', parent: 'root' },
      { name: 'antB', parent: 'body', x: -4, y: -15, r: 165, len: 7 }, { name: 'antF', parent: 'body', x: 3, y: -16, r: 195, len: 7 },
      { name: 'arm', parent: 'body', x: 6, y: -8 },
    ];
    const slots = [
      { name: 'antB', bone: 'antB', part: 'alien/antenna', rot: 180 }, { name: 'antF', bone: 'antF', part: 'alien/antenna', rot: 180 },
      { name: 'body', bone: 'body', part: 'alien/body' },
      { name: 'pupil', bone: 'body', part: 'alien/pupil', x: 1, y: -11 },
      { name: 'arm', bone: 'arm', part: 'alien/arm' },
    ];
    return {
      skin: '', bones, slots, stepRate: 1 / 12, pupils: true,
      springs: [{ bone: 'antB', k: 80, damp: 5, wave: [2, 10] }, { bone: 'antF', k: 80, damp: 5, wave: [2.3, 10, 1] }],
      clips: GS.buildClips({
        idle: { loop: true, keys: [
          { t: 0, arm: -150, sx: 1, sy: 1, bodyY: 0 },
          { t: 0.25, arm: -120, sx: 1.05, sy: 0.95 },
          { t: 0.5, arm: -150, sx: 1, sy: 1 }] },
      }),
    };
  }

  return {
    hryuchevo: () => hryuchevo('pink'),
    flyer: () => hryuchevo('lilac', { wings: true }),
    grenadier: () => hryuchevo('dark', { launcher: true, helmet: true }),
    rooster,
    opossum,
    mech: (hero) => mech(hero || 'gennadich'),
    alien,
  };
})();
