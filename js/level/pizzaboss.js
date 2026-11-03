// Арена босса «ПИЦЦА 4 СЫРА АПОКАЛИПСИСА». Один экран, пицца крутится над центром.
// Полки по бокам — подняться повыше и стрелять по пицце; перепады по 4 тайла.
(() => {
  const c = new GS.Chunk(40, 23);
  c.fill(0, 21, 40, 2, '#')
    .fill(0, 0, 1, 21, '%').fill(39, 0, 1, 21, '%')
    .put(3, 17, '======').put(31, 17, '======')
    .put(1, 13, '=====').put(34, 13, '=====')
    .put(6, 20, '@').put(20, 8, 'O');
  GS.LEVEL_PIZZA_BOSS = {
    id: 'pizzaBoss',
    name: 'ПИЦЦА 4 СЫРА АПОКАЛИПСИСА',
    subtitle: 'БОСС ПИЦЦА-ВСЕЛЕННОЙ',
    theme: 'pizza',
    music: 'pizzaBoss',
    boss: 'pizza',
    bossFloats: true,
    bossName: 'ПИЦЦА 4 СЫРА',
    bossSub: 'АПОКАЛИПСИСА',
    bossMusic: 'pizzaBoss',
    bossPhases: { 2: 'БОЛЬШЕ СЫРУ!', 3: 'АНАНАСОВАЯ ЕРЕСЬ' },
    signs: [],
    map: c.rows,
    parTime: 150,
  };
})();
