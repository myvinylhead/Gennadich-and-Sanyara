// Клипы героев. Углы в градусах (0 = конечность вниз, «минус» — вперёд/вверх для правостороннего героя).
// Стопы абсолютные (0 = ровно на земле). Руки с бластером в боевых клипах ведёт IK, поэтому их
// значения здесь важны для особых поз: урон, победа, «залипание», спецприёмы.
(() => {
  const LEGS_IDLE = { thighF: -8, shinF: 8, footF: 0, thighB: 8, shinB: 0, footB: 0 };
  // Гитар-дуэль: широкая стойка, задняя рука на грифе, передняя бьёт по струнам. Гитара — в слоте реквизита.
  const STRUM = (guitar) => ({
    loop: true,
    keys: [
      { t: 0, hipsY: 0, torsoX: 0, ...LEGS_IDLE, thighF: -16, thighB: 16, torso: 4, head: -4, armB: -78, foreB: -38, armF: 18, foreF: -100, laptop: guitar, eyes: 'happy', mouth: 'grin' },
      { t: 0.12, hipsY: 1, armF: 26, foreF: -72, mouth: 'yell' },
      { t: 0.24, hipsY: 0, armF: 18, foreF: -100, mouth: 'grin' },
    ],
  });

  const base = {
    idle: {
      loop: true,
      keys: [
        { t: 0, hipsY: 0, torsoX: 0, torsoY: 0, torso: 3, head: 0, ...LEGS_IDLE, armB: 12, foreB: -15, armF: -30, foreF: -50, eyes: 'open', mouth: 'smile', sx: 1, sy: 1 },
        { t: 0.8, torsoY: 1, torso: 5, head: 3, thighF: -9, shinF: 10, armB: 16, foreB: -24 },
        { t: 1.6, torsoY: 0, torso: 3, head: 0, thighF: -8, shinF: 8, armB: 12, foreB: -15 },
      ],
    },

    // Бег — классические 8 кадров: контакт, просадка, проход, подъём (и зеркально), подскок корпуса
    // на целые пиксели. Наклон — сдвигом торса, а не поворотом: повёрнутый нарисованный торс «кипит».
    run: {
      loop: true,
      keys: [
        { t: 0, hipsY: 0, torsoX: 1, torsoY: 0, torso: 8, head: -4, thighF: -38, shinF: 12, footF: -12, thighB: 28, shinB: 40, footB: 30, armB: -30, foreB: -55, mouth: 'grin', ease: 'linear', ev: 'step' },
        { t: 0.05, hipsY: 1, thighF: -22, shinF: 30, footF: 0, thighB: 34, shinB: 64, footB: 40, armB: -22, foreB: -60, ease: 'linear' },
        { t: 0.1, hipsY: 0, thighF: -2, shinF: 18, footF: 0, thighB: -8, shinB: 88, footB: 30, armB: 4, foreB: -65, ease: 'linear' },
        { t: 0.15, hipsY: -1, thighF: 22, shinF: 22, footF: 15, thighB: -34, shinB: 52, footB: 0, armB: 24, foreB: -60, ease: 'linear' },
        { t: 0.2, hipsY: 0, thighB: -38, shinB: 12, footB: -12, thighF: 28, shinF: 40, footF: 30, armB: 30, foreB: -55, ease: 'linear', ev: 'step' },
        { t: 0.25, hipsY: 1, thighB: -22, shinB: 30, footB: 0, thighF: 34, shinF: 64, footF: 40, armB: 22, foreB: -60, ease: 'linear' },
        { t: 0.3, hipsY: 0, thighB: -2, shinB: 18, footB: 0, thighF: -8, shinF: 88, footF: 30, armB: -4, foreB: -65, ease: 'linear' },
        { t: 0.35, hipsY: -1, thighB: 22, shinB: 22, footB: 15, thighF: -34, shinF: 52, footF: 0, armB: -24, foreB: -60, ease: 'linear' },
        { t: 0.4, hipsY: 0, thighF: -38, shinF: 12, footF: -12, thighB: 28, shinB: 40, footB: 30, armB: -30, foreB: -55 },
      ],
    },

    // Прыжок: толчок (ноги вытянуты назад) → группировка; падение — ноги болтаются, рука машет.
    jump: {
      fade: 0.04,
      keys: [
        { t: 0, hipsY: -1, torsoX: 1, torsoY: 0, torso: 4, head: -4, thighF: -45, shinF: 55, footF: 10, thighB: 22, shinB: 30, footB: 40, armB: -140, foreB: -30, mouth: 'grin', eyes: 'open', ease: 'out' },
        { t: 0.14, thighF: -62, shinF: 88, footF: 20, thighB: -12, shinB: 82, footB: 30, armB: -152, foreB: -24 },
        { t: 0.32, thighF: -48, shinF: 70, footF: 15, thighB: 2, shinB: 62, footB: 25, armB: -138, foreB: -36 },
      ],
    },

    fall: {
      loop: true,
      fade: 0.12,
      keys: [
        { t: 0, hipsY: 0, torsoX: 0, torsoY: 0, torso: 2, head: 4, thighF: -24, shinF: 26, footF: 20, thighB: 16, shinB: 40, footB: 30, armB: -150, foreB: -25, mouth: 'o', eyes: 'wide' },
        { t: 0.15, thighF: -30, shinF: 36, thighB: 22, shinB: 50, armB: -166, foreB: -45 },
        { t: 0.3, thighF: -24, shinF: 26, thighB: 16, shinB: 40, armB: -150, foreB: -25 },
      ],
    },

    // Приземление: присед на 3 пикселя, колени сгибаются так, чтобы стопы оставались на земле.
    land: {
      fade: 0.02,
      keys: [
        { t: 0, hipsY: 3, torsoX: 1, torsoY: 1, torso: 10, head: 4, thighF: -50, shinF: 90, footF: 0, thighB: -15, shinB: 55, footB: 0, armB: 30, foreB: -30, mouth: 'smile', eyes: 'open' },
        { t: 0.07, hipsY: 2, torsoY: 0, thighF: -40, shinF: 70, thighB: -10, shinB: 40 },
        { t: 0.18, hipsY: 0, torsoX: 0, torso: 3, head: 0, ...LEGS_IDLE, armB: 12, foreB: -15 },
      ],
    },

    hurt: {
      fade: 0.02,
      keys: [
        { t: 0, hipsY: 0, torso: -28, head: -18, armF: -160, foreF: -30, armB: -170, foreB: -30, thighF: -30, shinF: 30, footF: -10, thighB: 30, shinB: 30, footB: 10, eyes: 'hurt', mouth: 'yell', sx: 1.12, sy: 0.9 },
        { t: 0.3, torso: -10, head: -6, sx: 1, sy: 1 },
      ],
    },

    die: {
      fade: 0.02,
      keys: [
        { t: 0, torso: -35, head: -25, armF: -170, foreF: -20, armB: -170, foreB: -20, thighF: -40, shinF: 40, thighB: 30, shinB: 40, eyes: 'x', mouth: 'yell' },
        { t: 0.5, torso: -45, head: -35, armF: -150, armB: -185 },
      ],
    },

    win: {
      loop: true,
      keys: [
        // Бластер стволом вверх перед собой: он перпендикулярен предплечью, поэтому предплечье — вперёд.
        // Рука над головой клала бы его поперёк лица. Без сплющивания: нецелый масштаб на ×2 дёргает пиксели.
        { t: 0, hipsY: 0, torso: -2, head: -4, ...LEGS_IDLE, armF: -40, foreF: -50, armB: 30, foreB: -20, eyes: 'happy', mouth: 'grin', sx: 1, sy: 1 },
        { t: 0.3, hipsY: -3, torso: -4, head: -8, armF: -75, foreF: -15, thighF: -20, shinF: 30, thighB: 15, shinB: 25 },
        { t: 0.6, hipsY: 0, torso: -2, head: -4, armF: -40, foreF: -50, ...LEGS_IDLE },
      ],
    },

    respawn: {
      fade: 0.01,
      keys: [
        { t: 0, ...LEGS_IDLE, torso: 0, head: -8, armF: -130, foreF: -20, armB: -130, foreB: -20, eyes: 'wide', mouth: 'o', sx: 0.6, sy: 1.4 },
        { t: 0.18, sx: 1.15, sy: 0.88, mouth: 'grin' },
        { t: 0.4, torso: 3, head: 0, armF: -30, foreF: -50, armB: 12, foreB: -15, eyes: 'open', mouth: 'smile', sx: 1, sy: 1 },
      ],
    },

    strum: STRUM('/suno/guitar_g'),

    // Вокал: микрофон в передней руке у рта, свободная рука в сторону.
    sing: {
      loop: true,
      keys: [
        // Предплечье вертикально — микрофон (он поперёк предплечья) смотрит назад, решёткой ко рту.
        { t: 0, hipsY: 0, torsoX: 0, ...LEGS_IDLE, thighF: -14, thighB: 14, torso: -3, head: -6, armF: -100, foreF: -80, armB: 50, foreB: -30, eyes: 'happy', mouth: 'yell' },
        { t: 0.24, hipsY: 1, armB: 70, foreB: -50, mouth: 'o' },
        { t: 0.48, hipsY: 0, armB: 50, foreB: -30, mouth: 'yell' },
      ],
    },

    // Пауза-поза для комиксов/диалогов: руки в боки.
    proud: {
      loop: true,
      keys: [
        { t: 0, ...LEGS_IDLE, thighF: -14, thighB: 14, torso: -3, head: -4, armF: -40, foreF: 120, armB: 40, foreB: -120, eyes: 'open', mouth: 'grin' },
        { t: 1, torsoY: 1, head: -2 },
        { t: 2, torsoY: 0, head: -4 },
      ],
    },

    // Сидеть в кабине Клод-меха: видна только верхняя часть.
    pilot: {
      loop: true,
      keys: [
        { t: 0, torso: 6, head: -4, armF: -70, foreF: -30, armB: -60, foreB: -40, thighF: -80, shinF: 80, thighB: -70, shinB: 80, eyes: 'angry', mouth: 'grin' },
        { t: 0.3, armF: -78, armB: -52 },
        { t: 0.6, armF: -70, armB: -60 },
      ],
    },
  };

  const special = {
    gennadich: {
      dash: {
        fade: 0.02,
        keys: [
          { t: 0, hipsY: 1, torso: 35, head: 12, thighF: -60, shinF: 50, footF: -20, thighB: 50, shinB: 40, footB: 40, armB: 70, foreB: -10, eyes: 'angry', mouth: 'grit', sx: 1.18, sy: 0.88 },
          { t: 0.2, sx: 1.1, sy: 0.92 },
        ],
      },
      fidget: {
        loop: true,
        keys: [
          { t: 0, ...LEGS_IDLE, torso: 10, head: 16, armF: -55, foreF: -75, armB: -45, foreB: -85, laptop: '/hero/laptop', eyes: 'spiral', mouth: 'grin' },
          { t: 0.1, foreF: -62, foreB: -94 },
          { t: 0.2, foreF: -78, foreB: -80 },
          { t: 0.3, foreF: -60, foreB: -95 },
          { t: 0.4, foreF: -75, foreB: -85 },
        ],
      },
    },
    sanyara: {
      grid: {
        fade: 0.02,
        keys: [
          { t: 0, torso: -10, head: -14, armB: -150, foreB: -20, armF: -150, foreF: -20, thighF: -30, shinF: 40, thighB: 20, shinB: 30, eyes: 'happy', mouth: 'grin', sx: 0.9, sy: 1.1 },
          { t: 0.12, torso: 6, head: 6, armB: -40, foreB: -30, armF: -40, foreF: -30, sx: 1, sy: 1 },
          { t: 0.3 },
        ],
      },
      fidget: {
        loop: true,
        keys: [
          { t: 0, ...LEGS_IDLE, torso: 2, head: 0, armB: -25, foreB: -115, mug: '/hero/mug', eyes: 'open', mouth: 'smile' },
          { t: 0.7, armB: -70, foreB: -115, head: -16, torso: -4, eyes: 'happy', mouth: 'flat' },
          { t: 1.7, armB: -72, foreB: -112, head: -18 },
          { t: 2.2, armB: -25, foreB: -115, head: 0, torso: 2, eyes: 'open', mouth: 'smile' },
          { t: 3.2 },
        ],
      },
    },
    yurich: {
      strum: STRUM('/suno/guitar_r'),
      slash: {
        fade: 0.01,
        keys: [
          { t: 0, torso: -14, head: -6, armF: -200, foreF: -10, armB: -160, foreB: -20, thighF: -35, shinF: 30, thighB: 25, shinB: 35, eyes: 'angry', mouth: 'grit', ease: 'in' },
          { t: 0.06, torso: 28, head: 10, armF: -55, foreF: -5, armB: 40, foreB: -30, thighF: -50, shinF: 40, thighB: 40, shinB: 20, sx: 1.12, sy: 0.92, ease: 'out' },
          { t: 0.26, torso: 14, head: 2, armF: -60, foreF: -20, sx: 1, sy: 1 },
        ],
      },
      fidget: {
        loop: true,
        keys: [
          { t: 0, ...LEGS_IDLE, torso: -6, head: -12, armF: -175, foreF: -60, armB: -175, foreB: 60, eyes: 'blink', mouth: 'o' },
          { t: 0.9, torso: -10, head: -16, armF: -180, armB: -170, mouth: 'flat' },
          { t: 1.4, torso: 4, head: 6, armF: -30, foreF: -50, armB: 12, foreB: -15, eyes: 'open', mouth: 'smirk' },
          { t: 2.8, torso: 3, head: 0 },
          { t: 3.6, torso: -6, head: -12, armF: -175, foreF: -60, armB: -175, foreB: 60, eyes: 'blink', mouth: 'o' },
        ],
      },
    },
  };

  GS.HERO_CLIPS = {};
  Object.keys(special).forEach((hero) => {
    GS.HERO_CLIPS[hero] = GS.buildClips({ ...base, ...special[hero] });
  });
})();
