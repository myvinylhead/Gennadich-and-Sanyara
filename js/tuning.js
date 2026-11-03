// Все «ручки» геймплея в одном месте. Единицы — пиксели внутреннего разрешения 640×360 и секунды.
GS.TUNING = {
  gravity: 980,
  fallGravityMul: 1.35,     // падение тяжелее подъёма — прыжок ощущается «плотным»
  maxFall: 380,

  player: {
    bodyW: 12,
    bodyH: 30,
    runSpeed: 138,
    accelGround: 1500,
    accelAir: 1000,
    decelGround: 1900,
    jumpVelocity: 380,      // ≈ 4.6 тайла высоты
    jumpCut: 0.45,
    coyoteTime: 0.1,
    jumpBuffer: 0.13,
    maxHp: 6,
    invulnTime: 1.1,
    knockbackX: 150,
    knockbackY: 210,
    hurtStun: 0.25,
    pitDamage: 1,
    idleFidget: 5.5,        // через сколько секунд бездействия герой начинает «залипать»
  },

  heroes: {
    gennadich: {
      name: 'ГЕННАДИЧ', role: 'ФРОНТЕНД-РАЗРАБОТЧИК', color: '#4fe03c',
      shot: { speed: 380, interval: 0.1, damage: 1, life: 0.75, kind: 'code' },
      special: { kind: 'dash', speed: 400, time: 0.2, cooldown: 0.55, damage: 2 },
    },
    sanyara: {
      name: 'САНЯРА', role: 'ВЕБ-ДИЗАЙНЕР', color: '#b08cff',
      shot: { speed: 360, interval: 0.2, damage: 1.5, life: 0.8, kind: 'pixel', chargeTime: 1.0, chargeDamage: 6 },
      special: { kind: 'grid', cooldown: 0.25, life: 2.6, bounce: 250 },
    },
    yurich: {
      name: 'ЮРИЧ', role: 'ЛЕГЕНДА ФРОНТЕНДА', color: '#ff5a4a',
      shot: { speed: 380, interval: 0.14, damage: 1.2, life: 0.7, kind: 'red' },
      special: { kind: 'katana', cooldown: 0.32, damage: 5, range: 34, lunge: 120 },
      // Катана не подбрасывает, поэтому — второй прыжок в воздухе (иначе не достать до высоких секреток).
      airJumps: 1, airJumpVelocity: 340,
    },
  },

  team: {
    max: 100,
    perKill: 7,
    perHit: 1,
    perRevive: 20,
    perCoin: 1,
    superDamage: 14,
    superBossFrac: 0.12,
  },

  coffee: { time: 8, fireMul: 0.55, speedMul: 1.15 },

  // «Гонка по CDN».
  race: { boostMul: 1.75, boostTime: 1.3, padVelocity: 560 },
  // «Студия SUNO»: высота подскока эквалайзеров и сабвуфера; гитар-дуэль.
  suno: { eqAmp: 24, subVelocity: 520, strikes: 3 },
  // «Пицца-вселенная»: колесо, сырные мосты, пилы, печной жар; босс-пицца.
  pizza: { wheelR: 64, wheelSlices: 8, wheelSpeed: 0.55, bridgeHold: 1.7, bridgeRespawn: 1.6, sawRange: 40, sawSpeed: 1.4, ventHeight: 13, ventLift: 1700, ventMax: 240 },
  // «Церковь Святого Покока»: контекстное окно, скиллы-реликвии; босс-свиток.
  church: { wallSpeed: 16, minGap: 120, pillarRoom: 40, compactPush: 56, relicTime: 10, tddRate: 1.5 },
  archbishop: { hp: 190, coopMul: 1.4, w: 70, h: 96, every: [2.2, 1.9, 1.5] },
  pizzaBoss: { radius: 72, slices: 8, sliceHp: 22, coopMul: 1.4, phase2: 5, phase3: 2, spin: [0.5, 1.0, -1.5], every: [2.0, 1.6, 1.25] },
  // Все ноты мелодии (minGap: 1), но прощающие правила: широкие окна, мягкие промахи, лишние нажатия не наказываются,
  // доиграл трек — победа (шкала бота показывает, насколько хорошо сыграл).
  duel: {
    perfect: 0.08, good: 0.17, pxPerStep: 13, minGap: 1, chartFrom: 32, chartTo: 544,
    crowd: { start: 80, max: 100, perfect: 3, good: 2, miss: -3, wrong: 0, claim: -5 },
    winFrac: 0.6, surviveWins: true, starTime: 8,
  },

  // Шмап «Орбитальный скролл»: корабли, их оружие и спецприёмы.
  shmup: {
    speed: 185, hp: 6, invuln: 1.4, respawn: 2.4, hitR: 5, maxPower: 3,
    heroes: {
      gennadich: { spark: 0x6aff5a, interval: 0.075, damage: 0.75, bullet: 430, pattern: 'twin',
        special: { kind: 'roll', label: 'ХОТФИКС-БОЧКА: НЕУЯЗВИМ', cooldown: 2.2, time: 0.55, boost: 1.9 } },
      sanyara: { spark: 0x8cf2ff, interval: 0.15, damage: 0.9, bullet: 390, pattern: 'spread',
        special: { kind: 'grid', label: 'СЕТКА: ЩИТ ОТ ПУЛЬ', cooldown: 6, time: 2.6 } },
      yurich: { spark: 0xffb03a, interval: 0.11, damage: 1.5, bullet: 470, pattern: 'single',
        special: { kind: 'katana', label: 'КАТАНА: РЕЖЕТ ВРАГОВ И ПУЛИ', cooldown: 1.1, radius: 44, damage: 6 } },
    },
    enemies: {
      flyer: { hp: 3, r: 10, score: 100, shotSpeed: 120 },
      diver: { hp: 2, r: 10, score: 120 },
      rock: { hp: 3, r: 9, score: 50 },
      bigrock: { hp: 7, r: 14, score: 150 },
      turret: { hp: 12, r: 14, score: 300, shotSpeed: 90 },
      popup: { hp: 8, r: 18, score: 250, shotSpeed: 110 },
      rooster: { hp: 9, r: 13, score: 400 },
      scout: { hp: 260, r: 34, score: 5000 },
    },
  },
  pizzaHeal: 2,
  reviveTime: 2.2,

  enemies: {
    hopper: { hp: 3, score: 100, hopEvery: 1.3, hopVX: 70, hopVY: 230, aggro: 260 },
    flyer: { hp: 2, score: 120, speed: 40, fireEvery: 2.6, shotSpeed: 120, aggro: 300 },
    grenadier: { hp: 6, score: 200, fireEvery: 2.3, aggro: 330 },
    bug: { hp: 1, score: 40, speed: 70 },
    sleeper: { hp: 14, score: 400, wakeTime: 1.0, wakeRange: 56 },
    popup: { hp: 5, score: 150, speed: 26, fireEvery: 2.8, aggro: 320 },
    rooster: { hp: 9, score: 300, chargeSpeed: 230, sight: 220, stun: 1.2 },
    // «Студия SUNO».
    falseNote: { hp: 2, score: 120, aggro: 300, shotSpeed: 110 },
    autotune: { hp: 4, score: 200, aggro: 260, speed: 150, jumpV: 300 },
    copyright: { hp: 6, score: 300, aggro: 320, speed: 50, shotSpeed: 110 },
    mute: { hp: 4, score: 200, aggro: 280, speed: 22, r: 78 },
    // «Пицца-вселенная».
    heretic: { hp: 5, score: 200, aggro: 280, throwEvery: 2.2 },
    olive: { hp: 1, score: 60, aggro: 240, diveEvery: 2.6, diveSpeed: 170 },
    slime: { hp: 4, score: 150, aggro: 240, hopEvery: 1.3, hopVX: 70, hopVY: 200 },
    slimeSmall: { hp: 1.5, score: 60, aggro: 240, hopEvery: 0.8, hopVX: 90, hopVY: 170 },
    courier: { hp: 6, score: 300, sight: 240, chargeSpeed: 230, stun: 1 },
    // «Церковь Святого Покока».
    fanatic: { hp: 4, score: 150, aggro: 280, throwEvery: 2.4, shotSpeed: 120, tail: 4 },
    acolyte: { hp: 5, score: 200, aggro: 260, speed: 32 },
    tokenizer: { hp: 6, score: 220, aggro: 280, tokenSpeed: 130 },
    choir: { hp: 7, score: 250, hymnEvery: 1.6, r: 110 },
    inquisitor: { hp: 5, score: 250, aggro: 300, askEvery: 1.2 },
    pillar: { hp: 18, score: 100 },
  },

  boss: {
    hp: 180,
    coopMul: 1.5,
  },

  mech: {
    time: 20,
    armor: 12,
    runSpeed: 110,
    jumpVelocity: 345,
    shot: { speed: 420, interval: 0.16, damage: 2.5 },
    blade: { damage: 9, cooldown: 0.5, range: 58 },
  },
};
