// Прогресс и настройки в localStorage. Хранилище может быть недоступно (приватное окно, file://
// с запретом) — тогда игра просто живёт без сохранений.
GS.Save = (() => {
  const KEY = 'gennadich-sanyara-save-v1';
  const defaults = () => ({
    unlocked: 1,              // сколько этапов открыто (1 — только первый уровень)
    best: {},                 // лучшие времена по id уровня
    ranks: {},                // лучшие ранги
    cats: {},                 // найденные золотые кошки: { level1: true }
    deaths: 0,
    finished: false,
    settings: { music: 0.55, sfx: 0.8, crisp: true },
  });

  let data = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = { ...defaults(), ...parsed, settings: { ...defaults().settings, ...(parsed.settings || {}) } };
    }
  } catch (e) { /* без сохранений */ }

  function write() {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* без сохранений */ }
  }

  return {
    get data() { return data; },
    write,
    catCount() { return Object.values(data.cats).filter(Boolean).length; },
    yurichUnlocked() { return GS.DEBUG || this.catCount() >= 3 || data.finished; },
    recordLevel(id, time, rank, stageIndex) {
      if (!data.best[id] || time < data.best[id]) data.best[id] = time;
      const order = ['C', 'B', 'A', 'S'];
      if (!data.ranks[id] || order.indexOf(rank) > order.indexOf(data.ranks[id])) data.ranks[id] = rank;
      data.unlocked = Math.max(data.unlocked, stageIndex + 2);
      write();
    },
    reset() { data = defaults(); write(); },
  };
})();
