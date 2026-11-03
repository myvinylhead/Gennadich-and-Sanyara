// Точка входа. Внутреннее разрешение 640×360, целочисленное увеличение под окно — пиксели остаются квадратными.
(() => {
  const crispZoom = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const fit = Math.min(w / GS.W, h / GS.H);
    if (!GS.Save.data.settings.crisp) return Math.max(0.5, fit);
    return fit >= 1 ? Math.floor(fit) : Math.max(0.5, fit);
  };
  GS.applyZoom = () => { if (GS.game) GS.game.scale.setZoom(crispZoom()); };

  const scenes = [
    GS.BootScene, GS.RigLabScene, GS.TitleScene, GS.SelectScene, GS.StoryScene, GS.LevelScene,
    GS.ShmupScene, GS.RhythmScene, GS.HudScene, GS.PauseScene, GS.ResultsScene, GS.EndingScene,
  ].filter(Boolean);

  // Страховка: ошибка в одном кадре не должна останавливать игровой цикл.
  const origStep = Phaser.Game.prototype.step;
  let lastErr = 0;
  Phaser.Game.prototype.step = function step(time, delta) {
    try { origStep.call(this, time, delta); } catch (e) {
      if (time - lastErr > 2000) { lastErr = time; console.error(e); }
    }
  };

  GS.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GS.W,
    height: GS.H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: GS.PAL.night0,
    scale: { mode: Phaser.Scale.NONE, zoom: crispZoom() },
    physics: { default: 'arcade', arcade: { gravity: { y: GS.TUNING.gravity }, debug: false, tileBias: 20, overlapBias: 8 } },
    input: { gamepad: true },
    audio: { noAudio: true },
    disableContextMenu: true,
    banner: false,
    scene: scenes,
  });

  // ?fps=1 — счётчик кадров в углу и сводка в консоль раз в 2 с (кадры, средний и худший интервал, рывки > 25 мс).
  if (GS.QUERY.fps) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:6px;bottom:6px;font:12px monospace;color:#b4ff5a;background:#0008;padding:2px 6px;z-index:9;pointer-events:none';
    document.body.appendChild(box);
    let last = performance.now(), acc = [], t0 = last;
    const tick = (now) => {
      acc.push(now - last); last = now;
      if (now - t0 >= 2000) {
        const n = acc.length, avg = acc.reduce((a, b) => a + b, 0) / n, worst = Math.max(...acc), jank = acc.filter((d) => d > 25).length;
        const scenes = GS.game ? GS.game.scene.getScenes(true).map((x) => x.scene.key).join(',') : '';
        box.textContent = `${Math.round(1000 / avg)} FPS  худший ${worst.toFixed(0)} мс  рывков ${jank}`;
        console.log(`[fps] ${scenes} fps=${(1000 / avg).toFixed(1)} avg=${avg.toFixed(1)} worst=${worst.toFixed(1)} jank=${jank} n=${n}`);
        acc = []; t0 = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ?autoplay=1 — отладочный автопилот для замеров производительности: бежит/летит и стреляет без остановки.
  if (GS.QUERY.autoplay) {
    setTimeout(() => GS.Synth && GS.Synth.unlock(), 300); // со звуком — замер честнее
    GS.bot = (i, inp, sc, p) => {
      const t = performance.now() / 1000 + i;
      if (sc.scene.key === 'Shmup') return { ...inp, shootHeld: true, left: Math.sin(t) > 0.4, right: Math.sin(t) < -0.4, special: Math.random() < 0.01 };
      return { ...inp, right: true, shootHeld: true, up: Math.sin(t * 0.7) > 0.6, jump: Math.random() < 0.04, jumpHeld: true, special: Math.random() < 0.01 };
    };
  }

  window.addEventListener('resize', GS.applyZoom);
  document.addEventListener('fullscreenchange', () => setTimeout(GS.applyZoom, 50));
  // Звук разрешён только после жеста пользователя.
  const unlock = () => GS.Synth && GS.Synth.unlock();
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);
})();
