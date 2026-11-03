// Арена босса «АРХИЕПИСКОП СИСТЕМНОГО ПРОМПТА». Один экран, свиток парит над алтарём.
// Балконы по бокам — уйти с линии луча YOU MUST; перепады по 4 тайла.
(() => {
  const c = new GS.Chunk(40, 23);
  c.fill(0, 21, 40, 2, '#')
    .fill(0, 0, 1, 21, '%').fill(39, 0, 1, 21, '%')
    .put(3, 17, '======').put(31, 17, '======')
    .put(1, 13, '=====').put(34, 13, '=====')
    .put(6, 20, '@').put(20, 6, 'O');
  GS.LEVEL_CHURCH_BOSS = {
    id: 'churchBoss',
    name: 'АРХИЕПИСКОП СИСТЕМНОГО ПРОМПТА',
    subtitle: 'БОСС СОБОРА',
    theme: 'church',
    music: 'churchBoss',
    boss: 'archbishop',
    bossFloats: true,
    bossName: 'АРХИЕПИСКОП',
    bossSub: 'СИСТЕМНОГО ПРОМПТА',
    bossMusic: 'churchBoss',
    bossPhases: { 2: 'ВЛОЖЕННЫЕ СПИСКИ', 3: '## CRITICAL' },
    signs: [],
    map: c.rows,
    parTime: 150,
  };
})();
