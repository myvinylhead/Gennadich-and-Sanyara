// Звук без файлов: всё синтезируется WebAudio. Контекст создаётся по первому нажатию
// (браузеры не дают играть звук до жеста пользователя).
GS.Synth = (() => {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let musicBus = null;
  let noiseBuf = null;
  let muted = false;
  const last = {};

  function unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    applyVolumes();
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (GS.Music) GS.Music.onUnlock(ctx, musicBus);
  }

  function applyVolumes() {
    if (!ctx) return;
    const s = GS.Save.data.settings;
    sfxBus.gain.value = s.sfx * 0.7;
    musicBus.gain.value = s.music * 0.5;
  }

  // Не играть один и тот же звук чаще, чем раз в gap секунд (защита от «пулемёта»).
  function gate(name, gap) {
    if (!ctx) return false;
    const t = ctx.currentTime;
    if (last[name] && t - last[name] < gap) return false;
    last[name] = t;
    return true;
  }

  function env(g, t, a, hold, rel, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }

  function tone({ freq, type = 'square', dur = 0.12, vol = 0.2, slideTo = null, delay = 0, vibrato = 0, vibRate = 8, attack = 0.004, bus = null, pan = 0 }) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = vibRate;
      lg.gain.value = vibrato;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    env(g, t, attack, dur * 0.25, dur * 0.75, vol);
    let out = osc.connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; out = out.connect(p); }
    out.connect(bus || sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise({ dur = 0.2, vol = 0.2, filter = 'bandpass', freq = 1200, freqTo = null, q = 1, delay = 0, bus = null }) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, 0.003, dur * 0.2, dur * 0.8, vol);
    src.connect(f).connect(g).connect(bus || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // «Хрюк»: низкая пила с амплитудной «тряской» через формантный фильтр.
  function grunt({ pitch = 1, dur = 0.22, vol = 0.22, delay = 0 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130 * pitch, t);
    osc.frequency.linearRampToValueAtTime(95 * pitch, t + dur);
    const am = ctx.createOscillator();
    am.frequency.value = 38;
    const amg = ctx.createGain();
    amg.gain.value = 0.5;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    am.connect(amg).connect(g.gain);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 700 * pitch; f1.Q.value = 3;
    const out = ctx.createGain();
    env(out, t, 0.01, dur * 0.4, dur * 0.6, vol);
    osc.connect(g).connect(f1).connect(out).connect(sfxBus);
    osc.start(t); am.start(t);
    osc.stop(t + dur + 0.05); am.stop(t + dur + 0.05);
  }

  const S = {
    unlock,
    applyVolumes,
    get ctx() { return ctx; },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.9; },
    get muted() { return muted; },

    shootCode() {
      if (!gate('shoot', 0.04)) return;
      tone({ freq: 1250, slideTo: 620, type: 'square', dur: 0.07, vol: 0.07 });
      tone({ freq: 2500, slideTo: 1800, type: 'sine', dur: 0.04, vol: 0.03 });
    },
    shootPixel() {
      if (!gate('shoot', 0.04)) return;
      tone({ freq: 880, slideTo: 330, type: 'triangle', dur: 0.1, vol: 0.14 });
      tone({ freq: 1760, slideTo: 990, type: 'square', dur: 0.05, vol: 0.03 });
    },
    shootRed() {
      if (!gate('shoot', 0.04)) return;
      tone({ freq: 700, slideTo: 260, type: 'sawtooth', dur: 0.08, vol: 0.06 });
    },
    charge(level) {
      if (!gate('charge', 0.07)) return;
      tone({ freq: 300 + level * 700, type: 'triangle', dur: 0.06, vol: 0.05 });
    },
    chargeShot() {
      tone({ freq: 220, slideTo: 880, type: 'square', dur: 0.18, vol: 0.12 });
      noise({ dur: 0.25, vol: 0.12, freq: 3000, freqTo: 600, q: 1.5 });
    },
    mechShot() {
      if (!gate('mech', 0.05)) return;
      tone({ freq: 160, slideTo: 60, type: 'square', dur: 0.14, vol: 0.14 });
      noise({ dur: 0.12, vol: 0.12, filter: 'lowpass', freq: 1800 });
    },
    slash() {
      noise({ dur: 0.16, vol: 0.2, filter: 'highpass', freq: 2500, freqTo: 6000 });
      tone({ freq: 1800, slideTo: 3200, type: 'sine', dur: 0.1, vol: 0.04 });
    },
    blade() {
      noise({ dur: 0.3, vol: 0.25, filter: 'bandpass', freq: 900, freqTo: 4000, q: 0.7 });
      tone({ freq: 110, slideTo: 55, type: 'sawtooth', dur: 0.3, vol: 0.12 });
    },
    dash() {
      noise({ dur: 0.18, vol: 0.16, freq: 1500, freqTo: 5000, q: 2 });
      tone({ freq: 400, slideTo: 1200, type: 'square', dur: 0.1, vol: 0.05 });
    },
    grid() {
      [660, 880, 1320].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.06, vol: 0.06, delay: i * 0.03 }));
    },
    jump() { if (gate('jump', 0.05)) tone({ freq: 300, slideTo: 640, type: 'square', dur: 0.1, vol: 0.06 }); },
    land() { if (gate('land', 0.06)) noise({ dur: 0.06, vol: 0.12, filter: 'lowpass', freq: 500 }); },
    step() { if (gate('step', 0.09)) noise({ dur: 0.025, vol: 0.05, filter: 'lowpass', freq: 900 }); },
    hurt() {
      tone({ freq: 420, slideTo: 140, type: 'sawtooth', dur: 0.25, vol: 0.12 });
      tone({ freq: 440, slideTo: 150, type: 'square', dur: 0.25, vol: 0.05 });
    },
    shield() { tone({ freq: 1500, slideTo: 600, type: 'triangle', dur: 0.2, vol: 0.12 }); },
    die() {
      // Грустный тромбон «ва-ва-ва-ваааа».
      [392, 370, 349, 330].forEach((f, i) => tone({ freq: f, slideTo: i === 3 ? 260 : f * 0.97, type: 'sawtooth', dur: i === 3 ? 0.7 : 0.22, vol: 0.09, delay: i * 0.25, vibrato: i === 3 ? 8 : 0, vibRate: 6 }));
    },
    respawn() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.08, vol: 0.06, delay: i * 0.05 }));
    },
    // Нота-монета: звенит заданной нотой (midi).
    note(midi) {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      tone({ freq: f, type: 'square', dur: 0.09, vol: 0.06 });
      tone({ freq: f * 2, type: 'triangle', dur: 0.14, vol: 0.04, delay: 0.03 });
    },
    coin(chain = 0) {
      const f = 988 * Math.pow(2, Math.min(chain, 12) / 12);
      tone({ freq: f, type: 'square', dur: 0.05, vol: 0.06 });
      tone({ freq: f * 1.5, type: 'square', dur: 0.12, vol: 0.06, delay: 0.05 });
    },
    pizza() {
      noise({ dur: 0.06, vol: 0.12, filter: 'lowpass', freq: 700 });
      noise({ dur: 0.06, vol: 0.12, filter: 'lowpass', freq: 600, delay: 0.1 });
      [523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.1, vol: 0.12, delay: 0.2 + i * 0.07 }));
    },
    coffee() {
      noise({ dur: 0.35, vol: 0.12, freq: 400, freqTo: 2400, q: 4 });
      tone({ freq: 200, slideTo: 900, type: 'sine', dur: 0.35, vol: 0.1, delay: 0.2 });
    },
    crystal() {
      [1319, 1568, 1976, 2637].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.25, vol: 0.06, delay: i * 0.05 }));
    },
    artifact() {
      const seq = [523, 659, 784, 1047, 784, 1047, 1319];
      seq.forEach((f, i) => tone({ freq: f, type: 'square', dur: i === seq.length - 1 ? 0.5 : 0.1, vol: 0.08, delay: i * 0.09, vibrato: i === seq.length - 1 ? 6 : 0 }));
    },
    cat() {
      tone({ freq: 700, slideTo: 1200, type: 'triangle', dur: 0.15, vol: 0.1 });
      tone({ freq: 1200, slideTo: 800, type: 'triangle', dur: 0.25, vol: 0.1, delay: 0.15, vibrato: 30 });
      [1568, 2093, 2637].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.3, vol: 0.05, delay: 0.4 + i * 0.08 }));
    },
    checkpoint() {
      [659, 784, 988, 1319].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.07, vol: 0.06, delay: i * 0.06 }));
    },
    hit() {
      if (!gate('hit', 0.03)) return;
      tone({ freq: 900, slideTo: 400, type: 'square', dur: 0.04, vol: 0.05 });
      noise({ dur: 0.03, vol: 0.08, freq: 2500, q: 3 });
    },
    hryuk(pitch = 1) { if (gate('hryuk', 0.08)) grunt({ pitch: pitch * GS.util.rand(0.9, 1.15) }); },
    squeal() {
      if (!gate('squeal', 0.05)) return;
      tone({ freq: 700, slideTo: 1500, type: 'sawtooth', dur: 0.15, vol: 0.06, vibrato: 60, vibRate: 30 });
      noise({ dur: 0.18, vol: 0.12, freq: 1800, freqTo: 400, q: 1 });
    },
    splat() {
      if (!gate('splat', 0.04)) return;
      noise({ dur: 0.14, vol: 0.18, filter: 'lowpass', freq: 1500, freqTo: 200 });
    },
    bug() { if (gate('bug', 0.05)) tone({ freq: 2200, slideTo: 3000, type: 'square', dur: 0.04, vol: 0.04 }); },
    popupOpen() {
      if (!gate('popup', 0.1)) return;
      [1046, 1318].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.14, vol: 0.1, delay: i * 0.09 }));
    },
    popupClose() { tone({ freq: 1600, slideTo: 800, type: 'square', dur: 0.05, vol: 0.06 }); },
    denied() { tone({ freq: 180, type: 'square', dur: 0.12, vol: 0.06 }); tone({ freq: 150, type: 'square', dur: 0.15, vol: 0.06, delay: 0.13 }); },
    rooster() {
      // «Ку-ка-ре-ку!»
      const syl = [[620, 700, 0.1], [700, 760, 0.1], [760, 820, 0.1], [880, 560, 0.45]];
      let d = 0;
      syl.forEach(([a, b, l]) => {
        tone({ freq: a, slideTo: b, type: 'sawtooth', dur: l, vol: 0.07, delay: d, vibrato: 20, vibRate: 22 });
        d += l + 0.03;
      });
    },
    explosion(big = false) {
      noise({ dur: big ? 0.8 : 0.4, vol: big ? 0.35 : 0.25, filter: 'lowpass', freq: big ? 1200 : 2000, freqTo: 80 });
      tone({ freq: big ? 90 : 140, slideTo: 30, type: 'sine', dur: big ? 0.6 : 0.3, vol: 0.25 });
    },
    stomp() {
      if (!gate('stomp', 0.12)) return;
      tone({ freq: 90, slideTo: 40, type: 'sine', dur: 0.2, vol: 0.3 });
      noise({ dur: 0.12, vol: 0.15, filter: 'lowpass', freq: 400 });
    },
    roar() {
      noise({ dur: 1.0, vol: 0.3, filter: 'bandpass', freq: 500, freqTo: 250, q: 1.2 });
      tone({ freq: 160, slideTo: 70, type: 'sawtooth', dur: 1.0, vol: 0.14, vibrato: 12, vibRate: 18 });
      grunt({ pitch: 0.6, dur: 0.9, vol: 0.2 });
    },
    laser() { tone({ freq: 1800, slideTo: 1600, type: 'sawtooth', dur: 0.5, vol: 0.05, vibrato: 40, vibRate: 40 }); },
    warn() { if (gate('warn', 0.2)) [880, 880].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.08, vol: 0.06, delay: i * 0.14 })); },
    glitch() {
      if (!gate('glitch', 0.08)) return;
      for (let i = 0; i < 5; i++) tone({ freq: 200 + Math.random() * 2000, type: 'square', dur: 0.025, vol: 0.04, delay: i * 0.025 });
    },
    portal() {
      noise({ dur: 1.0, vol: 0.18, freq: 300, freqTo: 3000, q: 3 });
      tone({ freq: 200, slideTo: 1200, type: 'triangle', dur: 1.0, vol: 0.1, vibrato: 30, vibRate: 10 });
    },
    superBlast() {
      [262, 330, 392, 523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.6, vol: 0.06, delay: i * 0.03 }));
      noise({ dur: 1.0, vol: 0.3, filter: 'lowpass', freq: 3000, freqTo: 100 });
    },
    // Бормотание персонажей при печати реплик.
    blip(pitch = 1) {
      if (!gate('blip', 0.045)) return;
      tone({ freq: 340 * pitch * GS.util.rand(0.85, 1.25), type: 'square', dur: 0.035, vol: 0.035 });
    },
    menuMove() { tone({ freq: 660, type: 'square', dur: 0.04, vol: 0.05 }); },
    menuSelect() { [660, 990].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.06, vol: 0.06, delay: i * 0.06 })); },
    sticker() { tone({ freq: 500, slideTo: 1500, type: 'triangle', dur: 0.12, vol: 0.06 }); },
    win() {
      const seq = [523, 659, 784, 1047, 988, 1047, 1319, 1568];
      seq.forEach((f, i) => tone({ freq: f, type: 'square', dur: i === seq.length - 1 ? 0.6 : 0.11, vol: 0.07, delay: i * 0.11, vibrato: i === seq.length - 1 ? 6 : 0 }));
    },
  };
  return S;
})();
