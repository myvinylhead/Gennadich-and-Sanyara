// Описания ригов героев: кости, слоты, пружины, IK-цепочки. Клипы — в clips.js.
GS.heroRig = (hero) => {
  const S = GS.SKINS[hero];
  const A = GS.HeroArt;
  const HX = 7, HY = 18; // точка шеи в холсте головы
  const ex = S.eyesAt[0] - HX, ey = S.eyesAt[1] - HY;
  const pup = A.PUPILS[S.eyeStyle];
  const BACK = 0xa49cc0;
  // Размеры скелета: процедурные по умолчанию, у героев с нарисованными деталями — свои.
  const spr = GS.HeroSprites && GS.HeroSprites.active(hero) ? GS.HERO_SPRITES[hero].rig : null;
  const D = spr || {
    hipsY: -15, neckY: -11, shoulderB: [-2, -9], shoulderF: [2, -9], hipB: -2, hipF: 2, armLen: 5, legLen: [5, 5],
    height: 48, gloveRot: 0, muzzle: [2, 10], reach: 7,
    eyesAt: [ex, ey], pupilF: [ex + pup[1][0], ey + pup[1][1]], pupilB: [ex + pup[0][0], ey + pup[0][1]],
    mouthAt: [S.mouthAt[0] - HX, S.mouthAt[1] - HY],
  };

  const bones = [
    { name: 'root' },
    { name: 'hips', parent: 'root', x: 0, y: D.hipsY },
    { name: 'torso', parent: 'hips', snap: !!spr },
    { name: 'head', parent: 'torso', x: 0, y: D.neckY, snap: !!spr },
    { name: 'tuft', parent: 'head', x: hero === 'sanyara' ? -3 : -1, y: hero === 'sanyara' ? -15 : -16, r: hero === 'sanyara' ? 145 : 190, len: 5 },
    { name: 'pack', parent: 'torso', x: -5, y: -9 },
    { name: 'antenna', parent: 'pack', x: -3, y: -1, r: 180, len: 7 },
    { name: 'armB', parent: 'torso', x: D.shoulderB[0], y: D.shoulderB[1] },
    { name: 'foreB', parent: 'armB', x: 0, y: D.armLen },
    { name: 'handB', parent: 'foreB', x: 0, y: D.armLen },
    { name: 'thighB', parent: 'hips', x: D.hipB, y: 0 },
    { name: 'shinB', parent: 'thighB', x: 0, y: D.legLen[0] },
    { name: 'footB', parent: 'shinB', x: 0, y: D.legLen[1], abs: true },
    { name: 'thighF', parent: 'hips', x: D.hipF, y: 0 },
    { name: 'shinF', parent: 'thighF', x: 0, y: D.legLen[0] },
    { name: 'footF', parent: 'shinF', x: 0, y: D.legLen[1], abs: true },
    { name: 'prop', parent: 'torso', x: 6, y: -3 },
    { name: 'armF', parent: 'torso', x: D.shoulderF[0], y: D.shoulderF[1] },
    { name: 'foreF', parent: 'armF', x: 0, y: D.armLen },
    { name: 'handF', parent: 'foreF', x: 0, y: D.armLen },
    { name: 'gun', parent: 'handF', x: 0, y: 0, r: -90 },
  ];

  const slots = [
    { name: 'armB', bone: 'armB', part: 'armU', tint: BACK },
    { name: 'foreB', bone: 'foreB', part: 'armL', tint: BACK },
    { name: 'mug', bone: 'handB', part: null, swap: true, x: 1, y: 1, fixed: true },
    { name: 'handB', bone: 'handB', part: 'glove', tint: BACK, rot: D.gloveRot },
    { name: 'thighB', bone: 'thighB', part: 'thigh', tint: BACK },
    { name: 'shinB', bone: 'shinB', part: 'shin', tint: BACK },
    { name: 'footB', bone: 'footB', part: 'boot', tint: BACK },
    { name: 'pack', bone: 'pack', part: hero === 'sanyara' || (spr && hero !== 'yurich') ? null : 'pack' }, // у Юрича — ножны катаны
    { name: 'antenna', bone: 'antenna', part: hero === 'gennadich' && !spr ? 'antenna' : null, rot: 180 },
    { name: 'thighF', bone: 'thighF', part: 'thigh' },
    { name: 'shinF', bone: 'shinF', part: 'shin' },
    { name: 'footF', bone: 'footF', part: 'boot' },
    { name: 'torso', bone: 'torso', part: 'torso' },
    { name: 'tuft', bone: 'tuft', part: hero === 'gennadich' && !spr ? 'tuft' : null, rot: 180 },
    { name: 'head', bone: 'head', part: 'head' },
    { name: 'eyes', bone: 'head', part: 'eyes_open', x: D.eyesAt[0], y: D.eyesAt[1] },
    { name: 'pupilB', bone: 'head', part: '/hero/pupil', x: D.pupilB[0], y: D.pupilB[1], lookMul: spr ? [0, 0] : [1, 1] },
    { name: 'pupilF', bone: 'head', part: '/hero/pupil', x: D.pupilF[0], y: D.pupilF[1], lookMul: [1, 1] },
    { name: 'glasses', bone: 'head', part: S.eyeStyle === 'glasses' && !spr ? 'glasses' : null, x: ex - 1, y: ey - 1 },
    { name: 'mouth', bone: 'head', part: 'mouth_smile', x: D.mouthAt[0], y: D.mouthAt[1] },
    { name: 'laptop', bone: 'prop', part: null, swap: true },
    { name: 'gun', bone: 'gun', part: 'gun', rot: 90 },
    { name: 'blade', bone: 'gun', part: null, rot: 90 },
    { name: 'armF', bone: 'armF', part: 'armU' },
    { name: 'foreF', bone: 'foreF', part: 'armL' },
    { name: 'handF', bone: 'handF', part: 'glove', rot: D.gloveRot },
  ];

  const springs = [
    { bone: 'tuft', k: 160, damp: 9, limit: 50, gravity: 0, wave: [2.2, 4] },
  ];
  if (hero === 'gennadich' && !spr) springs.push({ bone: 'antenna', k: 90, damp: 6, limit: 70, wave: [1.6, 5, 1] });

  return {
    bones, slots, springs,
    clips: GS.HERO_CLIPS[hero],
    ik: { armF: ['armF', 'foreF'], armB: ['armB', 'foreB'] },
    stepRate: spr ? 1 / 20 : 1 / 15,
    pixelSafe: !!spr,
    heroFace: true,
    height: D.height,
    muzzle: D.muzzle,
    reach: D.reach,
    hipLow: D.hipLow,
    lookY: S.eyeStyle === 'glasses' && !spr ? 0 : 1,
    pupilsFor: (eyes) => ['open', 'wide', 'angry'].includes(eyes),
  };
};
