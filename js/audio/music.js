// Маленький чиптюн-секвенсор: пульс-волны, треугольный бас и шумовые барабаны.
// Такты пишутся строками из 16 шагов: «A4» — нота, «.» — пауза, «-» — тянуть предыдущую.
// Барабаны: k — бочка, s — малый, h — хэт, o — открытый хэт.
GS.Music = (() => {
  let ctx = null, bus = null;
  let pulse25 = null, pulse12 = null, noiseBuf = null;
  let current = null, wanted = null;
  let timer = null;
  let nextTime = 0, step = 0;
  let trackGain = null;
  // Часы ритма: t0 — время нулевого шага в ctx; fb — запасные часы по performance.now, пока звук не разблокирован.
  let t0 = 0, fb = null;
  const nowFb = () => performance.now() / 1000;

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(tok) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(tok);
    if (!m) return 0;
    return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  }
  function freq(tok) {
    const n = midi(tok);
    return n ? 440 * Math.pow(2, (n - 69) / 12) : 0;
  }

  function pulseWave(duty) {
    const N = 64;
    const real = new Float32Array(N), imag = new Float32Array(N);
    for (let k = 1; k < N; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(real, imag);
  }

  function onUnlock(c, b) {
    ctx = c; bus = b;
    pulse25 = pulseWave(0.25);
    pulse12 = pulseWave(0.125);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Звук разблокировали посреди трека — продолжаем с того же шага запасных часов, сетка не сбивается.
    if (wanted) start(wanted, fb && fb.name === wanted ? Math.max(0, Math.ceil(clock().step)) : 0);
  }

  function voice(wave, f, t, dur, vol, vib = 0) {
    const osc = ctx.createOscillator();
    if (wave === 'p25') osc.setPeriodicWave(pulse25);
    else if (wave === 'p12') osc.setPeriodicWave(pulse12);
    else osc.type = wave;
    osc.frequency.setValueAtTime(f, t);
    if (vib && dur > 0.25) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + dur);
      lfo.connect(lg).connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(trackGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function drum(kind, t) {
    if (kind === 'k') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(trackGain); o.start(t); o.stop(t + 0.2);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    let dur = 0.04, vol = 0.12;
    if (kind === 's') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8; dur = 0.12; vol = 0.28; }
    else if (kind === 'h') { f.type = 'highpass'; f.frequency.value = 7000; dur = 0.03; vol = 0.1; }
    else if (kind === 'o') { f.type = 'highpass'; f.frequency.value = 6000; dur = 0.14; vol = 0.09; }
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(trackGain);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
    if (kind === 's') voice('triangle', 190, t, 0.06, 0.12);
  }

  function parse(bar) { return bar.trim().split(/\s+/); }

  function scheduleStep(T, s, t) {
    const bars = T.bars;
    const barIdx = Math.floor(s / 16) % bars;
    const pos = s % 16;
    const stepDur = 60 / T.bpm / 4;
    for (const ch of T.channels) {
      const bar = ch.parsed[barIdx % ch.parsed.length];
      const tok = bar[pos];
      if (!tok || tok === '.' || tok === '-') continue;
      if (ch.drum) { drum(tok, t); continue; }
      let len = 1;
      while (pos + len < 16 && bar[pos + len] === '-') len++;
      const f = freq(tok) * (ch.oct ? Math.pow(2, ch.oct) : 1);
      if (!f) continue;
      voice(ch.wave, f, t, stepDur * len * (ch.gate ?? 0.92), ch.vol, ch.vib);
      if (ch.echo) voice(ch.wave, f, t + stepDur * 3, stepDur * len * 0.8, ch.vol * 0.3);
    }
  }

  function tick() {
    if (!ctx || !current) return;
    const T = TRACKS[current];
    const stepDur = 60 / T.bpm / 4;
    // Таймер проспал (вкладка в фоне, тяжёлый кадр) — пропущенные шаги не играем пачкой, а перескакиваем,
    // иначе они звучат разом и музыка будто разгоняется.
    if (nextTime < ctx.currentTime - 0.05) {
      const skip = Math.ceil((ctx.currentTime - nextTime) / stepDur);
      step += skip;
      nextTime += skip * stepDur;
    }
    while (nextTime < ctx.currentTime + 0.15) {
      scheduleStep(T, step, nextTime);
      nextTime += stepDur;
      step++;
    }
  }

  function prep(T) { T.channels.forEach((c) => { if (!c.parsed) c.parsed = c.bars.map(parse); }); }

  function start(name, fromStep = 0) {
    stopNow();
    if (!TRACKS[name]) return;
    current = name;
    fb = null;
    const T = TRACKS[name];
    prep(T);
    trackGain = ctx.createGain();
    trackGain.gain.value = T.vol ?? 1;
    trackGain.connect(bus);
    nextTime = ctx.currentTime + 0.06;
    step = fromStep;
    t0 = nextTime - fromStep * (60 / T.bpm / 4);
    timer = setInterval(tick, 25);
    tick();
  }

  function stopNow(fade = 0) {
    if (timer) clearInterval(timer);
    timer = null;
    if (trackGain && ctx) {
      const g = trackGain;
      if (fade) { g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade); setTimeout(() => g.disconnect(), fade * 1000 + 100); }
      else g.disconnect();
    }
    trackGain = null;
    current = null;
  }

  // ——— Треки ———
  const D_ROCK = 'k . h . s . h k . k h . s . h .';
  const TRACKS = {
    title: {
      bpm: 128, bars: 8, vol: 0.9,
      channels: [
        { wave: 'p25', vol: 0.07, vib: true, bars: [
          'A4 . C5 . E5 . A5 - G5 . E5 . C5 . D5 .',
          'F5 - - . E5 . C5 . A4 - - . C5 . D5 .',
          'E5 - - . G5 . E5 . C5 . D5 . E5 . G5 .',
          'D5 - - - - - B4 . G4 . A4 . B4 . D5 .',
          'A4 . C5 . E5 . A5 - G5 . E5 . C5 . D5 .',
          'F5 . A5 . C6 - A5 . G5 . F5 . E5 . C5 .',
          'D5 . G5 . B5 - A5 . G5 . D5 . B4 . G4 .',
          'G#4 - - - B4 - - - E5 - - - - - . .'] },
        { wave: 'p12', vol: 0.035, bars: [
          'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5',
          'F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4',
          'C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
          'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5',
          'F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
          'G#4 B4 E5 B4 G#4 B4 E5 B4 G#4 B4 E5 B4 G#4 B4 E5 B4'] },
        { wave: 'triangle', vol: 0.2, bars: [
          'A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .',
          'F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 .',
          'C3 . C4 . C3 . C4 . C3 . C4 . C3 . C4 .',
          'G2 . G3 . G2 . G3 . G2 . G3 . G2 . G3 .',
          'A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .',
          'F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 .',
          'G2 . G3 . G2 . G3 . G2 . G3 . G2 . G3 .',
          'E2 . E3 . E2 . E3 . E2 . E3 . E2 . E3 .'] },
        { drum: true, bars: ['k . h . s . h . k . h k s . h h', 'k . h . s . h . k . h k s . h h', 'k . h . s . h . k . h k s . h h', 'k . h . s . h . k k s . s s s s'] },
      ],
    },

    level1: {
      bpm: 140, bars: 8, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.065, vib: true, echo: true, bars: [
          'D5 . . F5 . A5 . G5 - - F5 . E5 . D5 .',
          'B4 - - . D5 . G5 . F5 . E5 . D5 . B4 .',
          'A4 . D5 . F5 . A5 - - - G5 . A5 . C6 .',
          'G5 - - - E5 - - - C5 . D5 . E5 . G5 .',
          'D6 . C6 . A5 . F5 . G5 - A5 . F5 . D5 .',
          'B5 . A5 . G5 . D5 . E5 - F5 . E5 . D5 .',
          'F5 - - . D5 . A#4 . F5 . G5 . A5 . A#5 .',
          'A5 - - - - - - - E5 . C#5 . A4 . C#5 .'] },
        { wave: 'p12', vol: 0.03, bars: [
          'D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
          'D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5',
          'C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5',
          'D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
          'A#4 D5 F5 D5 A#4 D5 F5 D5 A#4 D5 F5 D5 A#4 D5 F5 D5',
          'A4 C#5 E5 C#5 A4 C#5 E5 C#5 A4 C#5 E5 C#5 A4 C#5 E5 C#5'] },
        { wave: 'triangle', vol: 0.22, gate: 0.7, bars: [
          'D2 . D3 . . D2 D3 . D2 . D3 . . D2 C3 .',
          'G2 . G3 . . G2 G3 . G2 . G3 . . G2 A2 .',
          'D2 . D3 . . D2 D3 . D2 . D3 . . D2 C3 .',
          'C3 . C4 . . C3 C4 . C3 . C4 . . C3 B2 .',
          'D2 . D3 . . D2 D3 . D2 . D3 . . D2 C3 .',
          'G2 . G3 . . G2 G3 . G2 . G3 . . G2 A2 .',
          'A#2 . A#3 . . A#2 A#3 . A#2 . A#3 . . A#2 A2 .',
          'A2 . A3 . . A2 A3 . A2 . A3 . E3 . C#3 .'] },
        { drum: true, bars: [D_ROCK, D_ROCK, D_ROCK, 'k . h . s . h k . k h . s s s s'] },
      ],
    },

    level2: {
      bpm: 152, bars: 8, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.06, vib: true, bars: [
          'E5 . G5 . B5 . E6 - D6 . B5 . G5 . A5 .',
          'G5 - - . E5 . C5 . E5 . G5 . C6 . B5 .',
          'A5 - - . F#5 . D5 . F#5 . A5 . D6 . C6 .',
          'B5 - - - D#5 - - - F#5 - - - B5 - . .',
          'E6 . D6 . B5 . G5 . A5 . B5 . G5 . E5 .',
          'C6 . B5 . G5 . E5 . G5 . A5 . B5 . C6 .',
          'D6 - - . C6 . A5 . F#5 . A5 . D6 . E6 .',
          'D#6 - - - B5 - - - F#5 . D#5 . B4 . D#5 .'] },
        { wave: 'p12', vol: 0.03, bars: [
          'E5 G5 B5 G5 E5 G5 B5 G5 E5 G5 B5 G5 E5 G5 B5 G5',
          'C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5',
          'D5 F#5 A5 F#5 D5 F#5 A5 F#5 D5 F#5 A5 F#5 D5 F#5 A5 F#5',
          'B4 D#5 F#5 D#5 B4 D#5 F#5 D#5 B4 D#5 F#5 D#5 B4 D#5 F#5 D#5'] },
        { wave: 'triangle', vol: 0.22, gate: 0.6, bars: [
          'E2 . E3 E2 . E2 E3 . E2 . E3 E2 . E2 D3 .',
          'C3 . C4 C3 . C3 C4 . C3 . C4 C3 . C3 B2 .',
          'D3 . D4 D3 . D3 D4 . D3 . D4 D3 . D3 C#3 .',
          'B2 . B3 B2 . B2 B3 . B2 . B3 B2 . B2 D#3 .'] },
        { drum: true, bars: ['k h s h k k s h k h s h k k s h', 'k h s h k k s h k h s h k k s h', 'k h s h k k s h k h s h k k s h', 'k h s h k k s h k k s s s s s s'] },
      ],
    },

    // Шмап: быстрый «космический» драйв, ля минор.
    // «Гонка по CDN»: ми мажор, полутемповый брейк, арпеджио октавой ниже и мелодия с эхом.
    cdn: {
      bpm: 150, bars: 8, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.055, vib: true, echo: true, bars: [
          'B5 - - . G#5 . B5 . E6 - - . D#6 . B5 .',
          'C#6 - - . B5 . G#5 . E5 - - - . . G#5 .',
          'A5 - - . B5 . C#6 . E6 - - . C#6 . A5 .',
          'B5 - - - - - . . F#5 . A5 . B5 . D#6 .',
          'E6 - - . D#6 . B5 . G#5 - - . B5 . E6 .',
          'D#6 - - . B5 . G#5 . D#5 - - - . . B5 .',
          'C#6 - - . E6 . C#6 . A5 - - . B5 . C#6 .',
          'B5 - - - - - - - - - - - . . . .'] },
        { wave: 'p12', vol: 0.025, oct: -1, bars: [
          'E5 G#5 B5 E6 B5 G#5 E5 G#5 B5 E6 B5 G#5 E5 G#5 B5 G#5',
          'C#5 E5 G#5 C#6 G#5 E5 C#5 E5 G#5 C#6 G#5 E5 C#5 E5 G#5 E5',
          'A4 C#5 E5 A5 E5 C#5 A4 C#5 E5 A5 E5 C#5 A4 C#5 E5 C#5',
          'B4 D#5 F#5 B5 F#5 D#5 B4 D#5 F#5 B5 F#5 D#5 B4 D#5 F#5 D#5',
          'E5 G#5 B5 E6 B5 G#5 E5 G#5 B5 E6 B5 G#5 E5 G#5 B5 G#5',
          'G#4 B4 D#5 G#5 D#5 B4 G#4 B4 D#5 G#5 D#5 B4 G#4 B4 D#5 B4',
          'A4 C#5 E5 A5 E5 C#5 A4 C#5 E5 A5 E5 C#5 A4 C#5 E5 C#5',
          'B4 D#5 F#5 B5 F#5 D#5 B4 D#5 F#5 B5 F#5 D#5 B4 D#5 F#5 D#5'] },
        { wave: 'triangle', vol: 0.24, gate: 0.6, bars: [
          'E2 . E3 . . E2 . E3 . E2 E3 . E2 . B2 .',
          'C#2 . C#3 . . C#2 . C#3 . C#2 C#3 . C#2 . G#2 .',
          'A1 . A2 . . A1 . A2 . A1 A2 . A1 . E2 .',
          'B1 . B2 . . B1 . B2 . B1 B2 . B1 . F#2 .',
          'E2 . E3 . . E2 . E3 . E2 E3 . E2 . B2 .',
          'G#1 . G#2 . . G#1 . G#2 . G#1 G#2 . G#1 . D#2 .',
          'A1 . A2 . . A1 . A2 . A1 A2 . A1 . E2 .',
          'B1 . B2 . . B1 . B2 . B1 B2 . B1 . F#2 .'] },
        { drum: true, bars: [
          'k . h . o . h k s . h . o . h .',
          'k . h . o . h . s . h k o . h .',
          'k . h . o . h k s . h . o . h .',
          'k . h . o . h . s . h k o . h .',
          'k . h . o . h k s . h . o . h .',
          'k . h . o . h . s . h k o . h .',
          'k . h . o . h k s . h . o . h .',
          'k . h . o . h k s . h . s . o .'] },
      ],
    },
    // «Студия SUNO»: бодрый поп-рок в соль мажоре. Мелодия (chart) — она же нотная дорожка гитар-дуэли.
    suno: {
      bpm: 132, bars: 16, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.06, vib: true, oct: -1, chart: true, bars: [
          'G5 . . . B5 . D6 . . . B5 . A5 . G5 .',
          'A5 - - . F#5 . A5 . D6 - - . . . A5 .',
          'B5 . . . G5 . B5 . E6 . . . D6 . B5 .',
          'C6 - - . B5 . A5 . G5 - - - . . . .',
          'G5 . B5 . D6 . G6 . F#6 . D6 . B5 . . .',
          'A5 . . . D6 . . . F#6 - - . E6 . D6 .',
          'E6 . . . C6 . E6 . G6 - - . E6 . C6 .',
          'D6 - - - - - - . A5 . B5 . C6 . D6 .',
          'E6 - - . D6 . C6 . D6 - - . E6 . G6 .',
          'G6 - - . D6 . B5 . D6 - - - . . . .',
          'F#6 - - . E6 . D6 . A5 - - . D6 . F#6 .',
          'E6 - - . B5 . G5 . B5 - - - . . . .',
          'C6 . E6 . G6 . E6 . C6 . E6 . G6 . A6 .',
          'B6 - - . A6 . G6 . D6 - - . G6 . . .',
          'A6 - - . G6 . F#6 . E6 . D6 . E6 . F#6 .',
          'G6 - - - - - - - . . . . . . . .'] },
        { wave: 'p12', vol: 0.028, gate: 0.5, bars: [
          'G3 . G3 . D3 . G3 . G3 . G3 . D3 . G4 .',
          'D3 . D3 . A3 . D3 . D3 . D3 . A3 . D4 .',
          'E3 . E3 . B3 . E3 . E3 . E3 . B3 . E4 .',
          'C3 . C3 . G3 . C3 . C3 . C3 . G3 . C4 .',
          'G3 . G3 . D3 . G3 . G3 . G3 . D3 . G4 .',
          'D3 . D3 . A3 . D3 . D3 . D3 . A3 . D4 .',
          'C3 . C3 . G3 . C3 . C3 . C3 . G3 . C4 .',
          'D3 . D3 . A3 . D3 . D3 . D3 . A3 . D4 .',
          'C3 . C3 . G3 . C3 . C3 . C3 . G3 . C4 .',
          'G3 . G3 . D3 . G3 . G3 . G3 . D3 . G4 .',
          'D3 . D3 . A3 . D3 . D3 . D3 . A3 . D4 .',
          'E3 . E3 . B3 . E3 . E3 . E3 . B3 . E4 .',
          'C3 . C3 . G3 . C3 . C3 . C3 . G3 . C4 .',
          'G3 . G3 . D3 . G3 . G3 . G3 . D3 . G4 .',
          'D3 . D3 . A3 . D3 . D3 . D3 . A3 . D4 .',
          'D3 . D3 . A3 . D3 . D3 . D3 . A3 . D4 .'] },
        { wave: 'triangle', vol: 0.24, gate: 0.55, bars: [
          'G2 . G2 . G2 . G3 . G2 . G2 . G2 . D2 .',
          'D2 . D2 . D2 . D3 . D2 . D2 . D2 . A2 .',
          'E2 . E2 . E2 . E3 . E2 . E2 . E2 . B2 .',
          'C2 . C2 . C2 . C3 . C2 . C2 . C2 . G2 .',
          'G2 . G2 . G2 . G3 . G2 . G2 . G2 . D2 .',
          'D2 . D2 . D2 . D3 . D2 . D2 . D2 . A2 .',
          'C2 . C2 . C2 . C3 . C2 . C2 . C2 . G2 .',
          'D2 . D2 . D2 . D3 . D2 . D2 . D2 . A2 .',
          'C2 . C2 . C2 . C3 . C2 . C2 . C2 . G2 .',
          'G2 . G2 . G2 . G3 . G2 . G2 . G2 . D2 .',
          'D2 . D2 . D2 . D3 . D2 . D2 . D2 . A2 .',
          'E2 . E2 . E2 . E3 . E2 . E2 . E2 . B2 .',
          'C2 . C2 . C2 . C3 . C2 . C2 . C2 . G2 .',
          'G2 . G2 . G2 . G3 . G2 . G2 . G2 . D2 .',
          'D2 . D2 . D2 . D3 . D2 . D2 . D2 . A2 .',
          'D2 . D2 . D2 . D3 . D2 . D2 . D2 . A2 .'] },
        { drum: true, bars: [
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k . s . s . o .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k k h . s . h .',
          'k . h . s . h . k . s . s . o .'] },
      ],
    },
    // Главная тема — чиптюн-кавер песни «Геннадич и Саняра (energetic sci-fi punk rock)», без вокала.
    // Мелодия снята с вокала (куплет и припев), аккорды E – C#m – A – B, 178 BPM как в оригинале.
    // Форма: интро 4 такта, куплет 8, припев 8, второй припев с подголоском терцией ниже.
    theme: {
      bpm: 178, bars: 28, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.06, vib: true, echo: true, bars: [
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          'C#5 - - - C#5 - - - E5 - G#5 - - - - -',
          'F#5 - - - E5 - - - D#5 - - - B4 - - -',
          'E5 - B4 - - - - - D#5 - G#5 - - - - .',
          'G#5 - C#5 - - - C#5 - - - B4 - E5 - - .',
          'E5 - C#5 - - - E5 - A5 - G#5 - F#5 - - .',
          'F#5 - B4 - F#5 - B4 - - - D#5 - - - E5 .',
          'E5 - B4 - - - - - D#5 - G#5 - - - - .',
          'G#5 - C#5 - - - C#5 - - - B4 - E5 - - .',
          'E5 - C#5 - - - E5 - A5 - G#5 - F#5 - - .',
          'F#5 - B4 - F#5 - B4 - D#5 - F#5 - B5 - - -',
          'B4 - B4 . E5 - - - E5 - B4 - - - B4 .',
          'B4 - B4 - D#5 - E5 - G#5 - E5 - C#5 - - .',
          'C#5 - - - C#5 - - - E5 - G#5 - - - - .',
          'C#5 - C#5 - C#5 - C#5 . C#5 - E5 - - - C#5 .',
          'C#5 - - - C#5 - - - C#5 - E5 - - - - .',
          'E5 - E5 - A5 - E5 - G#5 - F#5 - - - - .',
          'E5 - B4 - - - - - - - - - - - F#5 -',
          'F#5 - B4 - - - - - D#5 - - - B4 - - -',
          'B4 - B4 . E5 - - - E5 - B4 - - - B4 .',
          'B4 - B4 - D#5 - E5 - G#5 - E5 - C#5 - - .',
          'C#5 - - - C#5 - - - E5 - G#5 - - - - .',
          'C#5 - C#5 - C#5 - C#5 . C#5 - E5 - - - C#5 .',
          'C#5 - - - C#5 - - - C#5 - E5 - - - - .',
          'E5 - E5 - A5 - E5 - G#5 - F#5 - - - - .',
          'E5 - B4 - - - - - - - - - - - F#5 -',
          'F#5 - B4 - - - - - D#5 - - - B4 - - -'] },
        { wave: 'p25', vol: 0.03, bars: [
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          '. . . . . . . . . . . . . . . .',
          'G#4 - G#4 . C#5 - - - C#5 - G#4 - - - G#4 .',
          'G#4 - G#4 - B4 - C#5 - E5 - C#5 - A4 - - .',
          'A4 - - - A4 - - - C#5 - E5 - - - - .',
          'A4 - A4 - A4 - A4 . A4 - C#5 - - - A4 .',
          'A4 - - - A4 - - - A4 - C#5 - - - - .',
          'C#5 - C#5 - F#5 - C#5 - E5 - D#5 - - - - .',
          'C#5 - G#4 - - - - - - - - - - - D#5 -',
          'D#5 - G#4 - - - - - B4 - - - G#4 - - -'] },
        { wave: 'p12', vol: 0.03, gate: 0.45, bars: [
          'E3 - - - . . . . E3 - - - . . E3 .',
          'C#3 - - - . . . . C#3 - - - . . C#3 .',
          'A3 - - - . . . . A3 - - - . . A3 .',
          'B3 - - - . . . . B3 - - - . . B3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 .',
          'A3 . A3 . A3 . A3 . A3 . A3 . A3 . A3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 .',
          'A3 . A3 . A3 . A3 . A3 . A3 . A3 . A3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 .',
          'C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 .',
          'A3 . A3 . A3 . A3 . A3 . A3 . A3 . A3 .',
          'A3 . A3 . A3 . A3 . A3 . A3 . A3 . A3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 .',
          'C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 . C#3 .',
          'A3 . A3 . A3 . A3 . A3 . A3 . A3 . A3 .',
          'A3 . A3 . A3 . A3 . A3 . A3 . A3 . A3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .'] },
        { wave: 'p12', vol: 0.022, gate: 0.45, bars: [
          'B3 - - - . . . . B3 - - - . . B3 .',
          'G#3 - - - . . . . G#3 - - - . . G#3 .',
          'E3 - - - . . . . E3 - - - . . E3 .',
          'F#3 - - - . . . . F#3 - - - . . F#3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 .',
          'G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 .',
          'F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'B3 . B3 . B3 . B3 . B3 . B3 . B3 . B3 .',
          'G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 .',
          'G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 . G#3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'E3 . E3 . E3 . E3 . E3 . E3 . E3 . E3 .',
          'F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 .',
          'F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 . F#3 .'] },
        { wave: 'triangle', vol: 0.25, gate: 0.6, bars: [
          'E2 - - - . . . . E2 - - - . . E2 .',
          'C#2 - - - . . . . C#2 - - - . . C#2 .',
          'A2 - - - . . . . A2 - - - . . A2 .',
          'B2 - - - . . . . B2 - - - . . B2 .',
          'E2 . E2 . E2 . E2 . E2 . E2 . E2 . E3 .',
          'C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#3 .',
          'A2 . A2 . A2 . A2 . A2 . A2 . A2 . A3 .',
          'B2 . B2 . B2 . B2 . B2 . B2 . B2 . B3 .',
          'E2 . E2 . E2 . E2 . E2 . E2 . E2 . E3 .',
          'C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#3 .',
          'A2 . A2 . A2 . A2 . A2 . A2 . A2 . A3 .',
          'B2 . B2 . B2 . B2 . B2 . B2 . B2 . B3 .',
          'E2 . E2 . E2 . E2 . E2 . E2 . E2 . E3 .',
          'E2 . E2 . E2 . E2 . E2 . E2 . E2 . E3 .',
          'C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#3 .',
          'C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#3 .',
          'A2 . A2 . A2 . A2 . A2 . A2 . A2 . A3 .',
          'A2 . A2 . A2 . A2 . A2 . A2 . A2 . A3 .',
          'B2 . B2 . B2 . B2 . B2 . B2 . B2 . B3 .',
          'B2 . B2 . B2 . B2 . B2 . B2 . B2 . B3 .',
          'E2 . E2 . E2 . E2 . E2 . E2 . E2 . E3 .',
          'E2 . E2 . E2 . E2 . E2 . E2 . E2 . E3 .',
          'C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#3 .',
          'C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#2 . C#3 .',
          'A2 . A2 . A2 . A2 . A2 . A2 . A2 . A3 .',
          'A2 . A2 . A2 . A2 . A2 . A2 . A2 . A3 .',
          'B2 . B2 . B2 . B2 . B2 . B2 . B2 . B3 .',
          'B2 . B2 . B2 . B2 . B2 . B2 . B2 . B3 .'] },
        { drum: true, bars: [
          'k . . . o . . . k . . . o . . .',
          'k . . . o . . . k . . . o . . .',
          'k . . . o . . . k . . . o . . .',
          'k . s . k . s . s . s . k . o .',
          'k . h . s . h k k . h . s . h .',
          'k . h . s . h k k . h . s . h .',
          'k . h . s . h k k . h . s . h .',
          'k . h . s . h k s . s . k . h .',
          'k . h . s . h k k . h . s . h .',
          'k . h . s . h k k . h . s . h .',
          'k . h . s . h k k . h . s . h .',
          'k . h . s . h k s . s . k . h .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k s . s . k . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k s . s . k . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .',
          'k . o . s . o k k . o . s . o .'] },
      ],
    },
    // «Пицца-вселенная»: тарантелла-чиптюн: мандолина тремоло, бас «ум-па». Своя мелодия, ля минор.
    pizza: {
      bpm: 168, bars: 16, vol: 0.85,
      channels: [
        { wave: 'p12', vol: 0.04, gate: 0.55, bars: [
          'A5 A5 A5 A5 C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5',
          'G#5 G#5 G#5 G#5 B5 B5 B5 B5 E5 E5 E5 E5 E5 E5 E5 E5',
          'B5 B5 B5 B5 D6 D6 D6 D6 C6 C6 C6 C6 B5 B5 B5 B5',
          'A5 A5 A5 A5 E5 E5 E5 E5 A5 A5 A5 A5 A5 A5 A5 A5',
          'F5 F5 F5 F5 A5 A5 A5 A5 D6 D6 D6 D6 C6 C6 C6 C6',
          'C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5 E5 E5 E5 E5',
          'E5 E5 E5 E5 G#5 G#5 G#5 G#5 B5 B5 B5 B5 D6 D6 D6 D6',
          'C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5 . . . .',
          'E6 E6 E6 E6 E6 E6 E6 E6 D6 D6 D6 D6 C6 C6 C6 C6',
          'B5 B5 B5 B5 C6 C6 C6 C6 D6 D6 D6 D6 B5 B5 B5 B5',
          'C6 C6 C6 C6 C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5',
          'G#5 G#5 G#5 G#5 A5 A5 A5 A5 B5 B5 B5 B5 E5 E5 E5 E5',
          'F5 F5 F5 F5 A5 A5 A5 A5 C6 C6 C6 C6 F6 F6 F6 F6',
          'E6 E6 E6 E6 D6 D6 D6 D6 C6 C6 C6 C6 A5 A5 A5 A5',
          'B5 B5 B5 B5 G#5 G#5 G#5 G#5 E5 E5 E5 E5 B5 B5 B5 B5',
          'A5 A5 A5 A5 A5 A5 A5 A5 A5 A5 A5 A5 . . . .'] },
        { wave: 'p25', vol: 0.025, gate: 0.35, bars: [
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . G#3 . . . . . . . B3 . . .',
          '. . . . G#3 . . . . . . . B3 . . .',
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . F3 . . . . . . . A3 . . .',
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . G#3 . . . . . . . B3 . . .',
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . G#3 . . . . . . . B3 . . .',
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . G#3 . . . . . . . B3 . . .',
          '. . . . F3 . . . . . . . A3 . . .',
          '. . . . C4 . . . . . . . E4 . . .',
          '. . . . G#3 . . . . . . . B3 . . .',
          '. . . . C4 . . . . . . . E4 . . .'] },
        { wave: 'triangle', vol: 0.25, gate: 0.6, bars: [
          'A2 . . . . . . . E2 . . . . . . .',
          'E2 . . . . . . . B1 . . . . . . .',
          'E2 . . . . . . . B1 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .',
          'D2 . . . . . . . A2 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .',
          'E2 . . . . . . . B1 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .',
          'E2 . . . . . . . B1 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .',
          'E2 . . . . . . . B1 . . . . . . .',
          'D2 . . . . . . . A2 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .',
          'E2 . . . . . . . B1 . . . . . . .',
          'A2 . . . . . . . E2 . . . . . . .'] },
        { drum: true, bars: [
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . s . s . o .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . h . s . h .',
          'k . h . s . h . k . s . s . o .'] },
      ],
    },
    // «Пицца-вселенная»: ускоренная тяжёлая тарантелла для босса. Своя мелодия, ля минор.
    pizzaBoss: {
      bpm: 192, bars: 16, vol: 0.85,
      channels: [
        { wave: 'p12', vol: 0.045, gate: 0.55, oct: 0, bars: [
          'A5 A5 A5 A5 C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5',
          'G#5 G#5 G#5 G#5 B5 B5 B5 B5 E5 E5 E5 E5 E5 E5 E5 E5',
          'B5 B5 B5 B5 D6 D6 D6 D6 C6 C6 C6 C6 B5 B5 B5 B5',
          'A5 A5 A5 A5 E5 E5 E5 E5 A5 A5 A5 A5 A5 A5 A5 A5',
          'F5 F5 F5 F5 A5 A5 A5 A5 D6 D6 D6 D6 C6 C6 C6 C6',
          'C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5 E5 E5 E5 E5',
          'E5 E5 E5 E5 G#5 G#5 G#5 G#5 B5 B5 B5 B5 D6 D6 D6 D6',
          'C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5 . . . .',
          'E6 E6 E6 E6 E6 E6 E6 E6 D6 D6 D6 D6 C6 C6 C6 C6',
          'B5 B5 B5 B5 C6 C6 C6 C6 D6 D6 D6 D6 B5 B5 B5 B5',
          'C6 C6 C6 C6 C6 C6 C6 C6 B5 B5 B5 B5 A5 A5 A5 A5',
          'G#5 G#5 G#5 G#5 A5 A5 A5 A5 B5 B5 B5 B5 E5 E5 E5 E5',
          'F5 F5 F5 F5 A5 A5 A5 A5 C6 C6 C6 C6 F6 F6 F6 F6',
          'E6 E6 E6 E6 D6 D6 D6 D6 C6 C6 C6 C6 A5 A5 A5 A5',
          'B5 B5 B5 B5 G#5 G#5 G#5 G#5 E5 E5 E5 E5 B5 B5 B5 B5',
          'A5 A5 A5 A5 A5 A5 A5 A5 A5 A5 A5 A5 . . . .'] },
        { wave: 'p25', vol: 0.025, gate: 0.35, bars: [
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . G#3 . . . B3 . . . G#3 . . . B3 .',
          '. . G#3 . . . B3 . . . G#3 . . . B3 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . F3 . . . A3 . . . F3 . . . A3 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . G#3 . . . B3 . . . G#3 . . . B3 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . G#3 . . . B3 . . . G#3 . . . B3 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . G#3 . . . B3 . . . G#3 . . . B3 .',
          '. . F3 . . . A3 . . . F3 . . . A3 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .',
          '. . G#3 . . . B3 . . . G#3 . . . B3 .',
          '. . C4 . . . E4 . . . C4 . . . E4 .'] },
        { wave: 'triangle', vol: 0.25, gate: 0.6, bars: [
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'E2 . E2 . B1 . E2 . E2 . E2 . B1 . E2 .',
          'E2 . E2 . B1 . E2 . E2 . E2 . B1 . E2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'D2 . D2 . A2 . D2 . D2 . D2 . A2 . D2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'E2 . E2 . B1 . E2 . E2 . E2 . B1 . E2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'E2 . E2 . B1 . E2 . E2 . E2 . B1 . E2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'E2 . E2 . B1 . E2 . E2 . E2 . B1 . E2 .',
          'D2 . D2 . A2 . D2 . D2 . D2 . A2 . D2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .',
          'E2 . E2 . B1 . E2 . E2 . E2 . B1 . E2 .',
          'A2 . A2 . E2 . A2 . A2 . A2 . E2 . A2 .'] },
        { drum: true, bars: [
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . s . s . k . s . s . k . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . s . s . k . s . s . k . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . s . s . k . s . s . k . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . h . s . h k k . h . s . o .',
          'k . s . s . k . s . s . k . o .'] },
      ],
    },
    // «Церковь Святого Покока»: органная токката: арпеджио шестнадцатыми, хорал, педальный бас. Своя музыка, ре минор.
    church: {
      bpm: 132, bars: 16, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.045, gate: 0.97, vib: true, bars: [
          'A5 - - - - - - - F5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - G5 - - - - - - -',
          'E5 - - - - - - - C#5 - - - - - - -',
          'E5 - - - - - - - A5 - - - - - - -',
          'F5 - - - - - - - E5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'D6 - - - - - - - C6 - - - - - - -',
          'A#5 - - - - - - - F5 - - - - - - -',
          'A5 - - - - - - - C6 - - - - - - -',
          'F5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - C#6 - - - - - - -',
          'D6 - - - - - - - A5 - - - - - - -',
          'C#6 - - - - - - - - - - - - - - -'] },
        { wave: 'p12', vol: 0.022, gate: 0.97, oct: -1, bars: [
          'A5 - - - - - - - F5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - G5 - - - - - - -',
          'E5 - - - - - - - C#5 - - - - - - -',
          'E5 - - - - - - - A5 - - - - - - -',
          'F5 - - - - - - - E5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'D6 - - - - - - - C6 - - - - - - -',
          'A#5 - - - - - - - F5 - - - - - - -',
          'A5 - - - - - - - C6 - - - - - - -',
          'F5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - C#6 - - - - - - -',
          'D6 - - - - - - - A5 - - - - - - -',
          'C#6 - - - - - - - - - - - - - - -'] },
        { wave: 'p12', vol: 0.026, gate: 0.7, bars: [
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'G3 A#3 D4 G4 D4 A#3 G3 A#3 D4 G4 D4 G4 D4 A#3 D4 A#3',
          'G3 A#3 D4 G4 D4 A#3 G3 A#3 D4 G4 D4 G4 D4 A#3 D4 A#3',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'A#3 D4 F4 A#4 F4 D4 A#3 D4 F4 A#4 F4 A#4 F4 D4 F4 D4',
          'A#3 D4 F4 A#4 F4 D4 A#3 D4 F4 A#4 F4 A#4 F4 D4 F4 D4',
          'F3 A3 C4 F4 C4 A3 F3 A3 C4 F4 C4 F4 C4 A3 C4 A3',
          'F3 A3 C4 F4 C4 A3 F3 A3 C4 F4 C4 F4 C4 A3 C4 A3',
          'G3 A#3 D4 G4 D4 A#3 G3 A#3 D4 G4 D4 G4 D4 A#3 D4 A#3',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4'] },
        { wave: 'triangle', vol: 0.25, gate: 0.95, bars: [
          'D2 - - - - - - - A2 - - - - - - -',
          'D2 - - - - - - - A2 - - - - - - -',
          'G2 - - - - - - - D2 - - - - - - -',
          'G2 - - - - - - - D2 - - - - - - -',
          'A1 - - - - - - - E2 - - - - - - -',
          'A1 - - - - - - - E2 - - - - - - -',
          'D2 - - - - - - - A2 - - - - - - -',
          'D2 - - - - - - - A2 - - - - - - -',
          'A#1 - - - - - - - F2 - - - - - - -',
          'A#1 - - - - - - - F2 - - - - - - -',
          'F2 - - - - - - - C2 - - - - - - -',
          'F2 - - - - - - - C2 - - - - - - -',
          'G2 - - - - - - - D2 - - - - - - -',
          'A1 - - - - - - - E2 - - - - - - -',
          'D2 - - - - - - - A2 - - - - - - -',
          'A1 - - - - - - - E2 - - - - - - -'] },
        { drum: true, bars: [
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . s . h . o .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . . . h . . .',
          'k . . . h . . . s . s . h . o .'] },
      ],
    },
    // «Церковь Святого Покока»: металл-орган для босса: двойная бочка, бас восьмыми. Своя музыка, ре минор.
    churchBoss: {
      bpm: 172, bars: 16, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.05, gate: 0.97, vib: true, bars: [
          'A5 - - - - - - - F5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - G5 - - - - - - -',
          'E5 - - - - - - - C#5 - - - - - - -',
          'E5 - - - - - - - A5 - - - - - - -',
          'F5 - - - - - - - E5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'D6 - - - - - - - C6 - - - - - - -',
          'A#5 - - - - - - - F5 - - - - - - -',
          'A5 - - - - - - - C6 - - - - - - -',
          'F5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - C#6 - - - - - - -',
          'D6 - - - - - - - A5 - - - - - - -',
          'C#6 - - - - - - - - - - - - - - -'] },
        { wave: 'p12', vol: 0.022, gate: 0.97, oct: -1, bars: [
          'A5 - - - - - - - F5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - G5 - - - - - - -',
          'E5 - - - - - - - C#5 - - - - - - -',
          'E5 - - - - - - - A5 - - - - - - -',
          'F5 - - - - - - - E5 - - - - - - -',
          'D5 - - - - - - - - - - - - - - -',
          'D6 - - - - - - - C6 - - - - - - -',
          'A#5 - - - - - - - F5 - - - - - - -',
          'A5 - - - - - - - C6 - - - - - - -',
          'F5 - - - - - - - - - - - - - - -',
          'G5 - - - - - - - A#5 - - - - - - -',
          'A5 - - - - - - - C#6 - - - - - - -',
          'D6 - - - - - - - A5 - - - - - - -',
          'C#6 - - - - - - - - - - - - - - -'] },
        { wave: 'p12', vol: 0.03, gate: 0.7, bars: [
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'G3 A#3 D4 G4 D4 A#3 G3 A#3 D4 G4 D4 G4 D4 A#3 D4 A#3',
          'G3 A#3 D4 G4 D4 A#3 G3 A#3 D4 G4 D4 G4 D4 A#3 D4 A#3',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'A#3 D4 F4 A#4 F4 D4 A#3 D4 F4 A#4 F4 A#4 F4 D4 F4 D4',
          'A#3 D4 F4 A#4 F4 D4 A#3 D4 F4 A#4 F4 A#4 F4 D4 F4 D4',
          'F3 A3 C4 F4 C4 A3 F3 A3 C4 F4 C4 F4 C4 A3 C4 A3',
          'F3 A3 C4 F4 C4 A3 F3 A3 C4 F4 C4 F4 C4 A3 C4 A3',
          'G3 A#3 D4 G4 D4 A#3 G3 A#3 D4 G4 D4 G4 D4 A#3 D4 A#3',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4',
          'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 D5 A4 F4 A4 F4',
          'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 A4 E4 C#4 E4 C#4'] },
        { wave: 'triangle', vol: 0.25, gate: 0.55, bars: [
          'D2 . D2 . D2 . D2 . D2 . D2 . D2 . D2 .',
          'D2 . D2 . D2 . D2 . D2 . D2 . D2 . D2 .',
          'G2 . G2 . G2 . G2 . G2 . G2 . G2 . G2 .',
          'G2 . G2 . G2 . G2 . G2 . G2 . G2 . G2 .',
          'A1 . A1 . A1 . A1 . A1 . A1 . A1 . A1 .',
          'A1 . A1 . A1 . A1 . A1 . A1 . A1 . A1 .',
          'D2 . D2 . D2 . D2 . D2 . D2 . D2 . D2 .',
          'D2 . D2 . D2 . D2 . D2 . D2 . D2 . D2 .',
          'A#1 . A#1 . A#1 . A#1 . A#1 . A#1 . A#1 . A#1 .',
          'A#1 . A#1 . A#1 . A#1 . A#1 . A#1 . A#1 . A#1 .',
          'F2 . F2 . F2 . F2 . F2 . F2 . F2 . F2 .',
          'F2 . F2 . F2 . F2 . F2 . F2 . F2 . F2 .',
          'G2 . G2 . G2 . G2 . G2 . G2 . G2 . G2 .',
          'A1 . A1 . A1 . A1 . A1 . A1 . A1 . A1 .',
          'D2 . D2 . D2 . D2 . D2 . D2 . D2 . D2 .',
          'A1 . A1 . A1 . A1 . A1 . A1 . A1 . A1 .'] },
        { drum: true, bars: [
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k s k k s k k s . s . k . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k s k k s k k s . s . k . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k s k k s k k s . s . k . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k h k s . h k k k h k s . o .',
          'k k s k k s k k s . s . k . o .'] },
      ],
    },
    space: {
      bpm: 160, bars: 8, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.06, vib: true, bars: [
          'A5 . E5 . A5 . C6 - B5 . A5 . G5 . E5 .',
          'F5 - - . A5 . C6 . D6 . C6 . A5 . F5 .',
          'G5 - - . B5 . D6 . E6 - D6 . B5 . G5 .',
          'E5 - - - G#5 - - - B5 - - - E6 . D6 .',
          'C6 . B5 . A5 . E5 . A5 . B5 . C6 . E6 .',
          'D6 . C6 . A5 . F5 . A5 . C6 . D6 . F6 .',
          'E6 - - . D6 . B5 . G5 . B5 . D6 . G6 .',
          'E6 - - - - - . . G#5 . B5 . E6 . G#6 .'] },
        { wave: 'p12', vol: 0.03, bars: [
          'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5',
          'F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
          'E4 G#4 B4 G#4 E4 G#4 B4 G#4 E4 G#4 B4 G#4 E4 G#4 B4 G#4'] },
        { wave: 'triangle', vol: 0.23, gate: 0.55, bars: [
          'A2 A2 A3 A2 A2 A3 A2 A3 A2 A2 A3 A2 A2 A3 G2 E2',
          'F2 F2 F3 F2 F2 F3 F2 F3 F2 F2 F3 F2 F2 F3 E2 C2',
          'G2 G2 G3 G2 G2 G3 G2 G3 G2 G2 G3 G2 G2 G3 F#2 D2',
          'E2 E2 E3 E2 E2 E3 E2 E3 E2 E2 E3 E2 G#2 B2 D3 E3'] },
        { drum: true, bars: ['k h s h k h s h k h s h k h s s', 'k h s h k h s h k h s h k h s s', 'k h s h k h s h k h s h k h s s', 'k k s k k s k s k k s s s s s s'] },
      ],
    },

    boss: {
      bpm: 168, bars: 8, vol: 0.9,
      channels: [
        { wave: 'p25', vol: 0.065, vib: true, bars: [
          'C5 . D#5 . G5 . C6 - - . A#5 . G5 . D#5 .',
          'G#5 - - . G5 . D#5 . C5 . D#5 . G#5 . G5 .',
          'A#5 - - . G5 . F5 . D5 . F5 . A#5 . D6 .',
          'B5 - - - G5 - - - D5 - - - B4 . D5 .',
          'C6 . C6 . A#5 . G5 . G#5 - G5 . D#5 . C5 .',
          'D#5 . G#5 . C6 . D#6 - D6 . C6 . G#5 . G5 .',
          'F5 . A#5 . D6 . F6 - D#6 . D6 . A#5 . F5 .',
          'G5 - - - B5 - - - D6 - - - G6 - - -'] },
        { wave: 'p12', vol: 0.03, bars: [
          'C5 D#5 G5 D#5 C5 D#5 G5 D#5 C5 D#5 G5 D#5 C5 D#5 G5 D#5',
          'G#4 C5 D#5 C5 G#4 C5 D#5 C5 G#4 C5 D#5 C5 G#4 C5 D#5 C5',
          'A#4 D5 F5 D5 A#4 D5 F5 D5 A#4 D5 F5 D5 A#4 D5 F5 D5',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4'] },
        { wave: 'triangle', vol: 0.24, gate: 0.6, bars: [
          'C2 C2 C3 C2 C2 C3 C2 C3 C2 C2 C3 C2 D#3 D3 C3 A#2',
          'G#2 G#2 G#3 G#2 G#2 G#3 G#2 G#3 G#2 G#2 G#3 G#2 C3 A#2 G#2 G2',
          'A#2 A#2 A#3 A#2 A#2 A#3 A#2 A#3 A#2 A#2 A#3 A#2 D3 C3 A#2 A2',
          'G2 G2 G3 G2 G2 G3 G2 G3 G2 G2 G3 G2 B2 A2 G2 F2'] },
        { drum: true, bars: ['k . k h s . k h k . k h s h s s', 'k . k h s . k h k . k h s h s s', 'k . k h s . k h k . k h s h s s', 'k k s k k s k s k k s s s s s s'] },
      ],
    },

    ending: {
      bpm: 120, bars: 4, vol: 0.85,
      channels: [
        { wave: 'p25', vol: 0.07, vib: true, echo: true, bars: [
          'E5 . G5 . C6 . G5 . E5 . G5 . A5 . G5 .',
          'D5 - - . G5 . B5 . D6 - - . B5 . G5 .',
          'C6 - - . A5 . E5 . A5 . C6 . E6 - - .',
          'F5 . A5 . C6 . F6 - - - E6 . D6 . C6 .'] },
        { wave: 'p12', vol: 0.03, bars: [
          'C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5',
          'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
          'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5',
          'F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4'] },
        { wave: 'triangle', vol: 0.2, bars: [
          'C3 . . C3 G2 . . . C3 . . C3 G2 . E3 .',
          'G2 . . G2 D3 . . . G2 . . G2 D3 . B2 .',
          'A2 . . A2 E3 . . . A2 . . A2 E3 . C3 .',
          'F2 . . F2 C3 . . . F2 . . F2 G2 . B2 .'] },
        { drum: true, bars: ['k . h . s . h . k . h . s . h h'] },
      ],
    },
  };

  // Где сейчас музыка, в шагах (1/16 такта, дробное число) — по тому, что уже слышно (с учётом задержки вывода).
  function clock() {
    const name = current || (fb && fb.name);
    const T = name && TRACKS[name];
    if (!T) return null;
    const stepDur = 60 / T.bpm / 4;
    const audio = !!(ctx && current);
    const lat = audio ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
    const now = audio ? ctx.currentTime - lat : nowFb();
    return { track: name, step: (now - (audio ? t0 : fb.t0)) / stepDur, stepDur, bpm: T.bpm, bars: T.bars, audio };
  }

  // Ноты канала с chart: true за один проход трека: { step, len, midi } — для нотной дорожки ритм-игры.
  function chart(name) {
    const T = TRACKS[name];
    if (!T) return [];
    prep(T);
    const ch = T.channels.find((c) => c.chart);
    if (!ch) return [];
    const out = [];
    for (let b = 0; b < T.bars; b++) {
      const bar = ch.parsed[b % ch.parsed.length];
      for (let i = 0; i < 16; i++) {
        const n = midi(bar[i] || '.');
        if (!n) continue;
        let len = 1;
        while (i + len < 16 && bar[i + len] === '-') len++;
        out.push({ step: b * 16 + i, len, midi: n });
      }
    }
    return out;
  }

  // Отрисовать трек без воспроизведения (для экспорта в файл): целые проходы трека не короче minSec, с затуханием в конце.
  // Те же инструменты, что в игре: на время рендера подменяем контекст, волны, шум и выход трека.
  function render(name, minSec = 60, fadeSec = 3) {
    const T = TRACKS[name];
    if (!T) return Promise.reject(new Error('нет трека ' + name));
    prep(T);
    const stepDur = 60 / T.bpm / 4;
    const loopSec = T.bars * 16 * stepDur;
    const loops = Math.max(1, Math.ceil(minSec / loopSec));
    const total = loops * loopSec + fadeSec;
    const off = new OfflineAudioContext(1, Math.ceil(total * 44100), 44100);
    const saved = { ctx, pulse25, pulse12, noiseBuf, trackGain };
    ctx = off;
    pulse25 = pulseWave(0.25);
    pulse12 = pulseWave(0.125);
    noiseBuf = off.createBuffer(1, off.sampleRate, off.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    trackGain = off.createGain();
    trackGain.gain.value = T.vol ?? 1;
    trackGain.gain.setValueAtTime(T.vol ?? 1, loops * loopSec);
    trackGain.gain.linearRampToValueAtTime(0.0001, total);
    trackGain.connect(off.destination);
    const steps = Math.ceil(total / stepDur);
    for (let st = 0; st < steps; st++) scheduleStep(T, st, 0.02 + st * stepDur);
    ({ ctx, pulse25, pulse12, noiseBuf, trackGain } = saved);
    return off.startRendering();
  }

  return {
    onUnlock,
    clock,
    chart,
    render,
    get tracks() { return Object.keys(TRACKS); },
    // restart — начать заново даже тот же трек; fromStep — с какого шага (продолжить после паузы).
    play(name, { restart = false, fromStep = 0 } = {}) {
      if (!restart && wanted === name && (current === name || (!ctx && fb && fb.name === name))) return;
      wanted = name;
      if (ctx) start(name, fromStep);
      else if (TRACKS[name]) fb = { name, t0: nowFb() + 0.06 - fromStep * (60 / TRACKS[name].bpm / 4) };
    },
    stop(fade = 0.4) { wanted = null; fb = null; if (ctx) stopNow(fade); },
    get current() { return current; },
    duck(on) { if (trackGain && ctx) trackGain.gain.setTargetAtTime(on ? 0.25 : (TRACKS[current] ? TRACKS[current].vol : 1), ctx.currentTime, 0.1); },
  };
})();
