// Предметы, объекты уровня, снаряды и частицы.
GS.ItemArt = (() => {
  const P = GS.PAL;
  const INK = P.ink;

  function coinFrame(p, f) {
    // Портал-монета: вращение — сжатие по ширине.
    const w = [5.5, 4.2, 2.4, 1][f];
    p.ellipse(5.5, 5.5, w, 5.5, '#1f9a3a');
    p.ellipse(5.5, 5.5, Math.max(0.6, w - 1.2), 4.3, '#4fe03c');
    if (f < 2) {
      p.ring(5.5, 5.5, 1.5, 2.4, '#b4ff5a');
      p.px(5, 5, '#ffffff'); p.px(6, 3, '#b4ff5a');
    } else p.rect(5, 2, 1, 7, '#b4ff5a');
  }

  function pizza(p) {
    p.poly([[0, 1], [12, 0], [6, 11]], '#f2b23c');
    p.rect(0, 0, 12, 2, '#c8742a'); p.rect(1, 2, 10, 1, '#e8a03a');
    [[3, 4], [7, 4], [5, 7]].forEach(([x, y]) => { p.rect(x, y, 2, 2, '#c8302a'); p.px(x, y, '#e85a4a'); });
    p.px(6, 9, '#ffd84a'); p.px(9, 3, '#3a9a2a');
  }

  function coffee(p) {
    p.rect(0, 3, 7, 8, '#f2ece0'); p.rect(7, 4, 2, 4, '#f2ece0'); p.px(7, 5, null); p.px(7, 6, null);
    p.rect(0, 3, 7, 1, '#6a3c20');
    p.rect(1, 5, 5, 3, '#2a1a3e'); GS.Font.draw(p, 'C', 2, 5, '#ffd84a');
    p.rim({ '#f2ece0': '#c8bca8' }, -1, 0, 1);
    p.px(2, 1, '#e2e4f0'); p.px(3, 0, '#e2e4f0'); p.px(4, 1, '#e2e4f0');
  }

  function crystal(p) {
    p.poly([[4, 0], [8, 4], [7, 11], [4, 13], [1, 11], [0, 4]], '#9a6aff');
    p.poly([[4, 0], [8, 4], [4, 6]], '#c8a8ff'); p.line(4, 1, 4, 12, '#e8d8ff'); p.poly([[0, 4], [4, 6], [4, 13], [1, 11]], '#6a3cd6');
  }

  function artifact(p) {
    // Код-куб с «мозгом» внутри — как на кадре с рюкзаком.
    p.poly([[8, 0], [16, 4], [16, 12], [8, 16], [0, 12], [0, 4]], '#5634a3');
    p.poly([[8, 0], [16, 4], [8, 8], [0, 4]], '#7d52d6');
    p.poly([[8, 8], [16, 4], [16, 12], [8, 16]], '#3a2370');
    p.line(8, 8, 8, 16, '#b08cff'); p.line(0, 4, 8, 8, '#b08cff'); p.line(8, 8, 16, 4, '#b08cff');
    p.circle(8, 8, 3.2, '#d070ff'); p.circle(8, 8, 2, '#ffb0ff'); p.px(7, 7, '#ffffff');
    [[2, 6], [13, 6], [4, 13], [12, 13], [8, 2]].forEach(([x, y]) => p.px(x, y, '#4fe03c'));
  }

  function cat(p) {
    // «Кошка в сусальном золоте» на пьедестале.
    const g = '#ffd84a', gs = '#d99a1e', gd = '#8a5a10';
    p.rect(1, 13, 12, 3, gd); p.rect(1, 13, 12, 1, gs);
    p.ellipse(7, 9, 4.5, 4.5, g);
    p.ellipse(7, 4.5, 3.5, 3.2, g);
    p.poly([[4, 3], [4.5, -0.5], [6.5, 2]], g); p.poly([[7.5, 2], [9.5, -0.5], [10, 3]], g);
    p.rect(10, 9, 3, 2, g); p.rect(12, 6, 1, 4, g);
    p.rim({ [g]: gs }, -1, 1, 1);
    p.px(5, 4, gd); p.px(9, 4, gd); p.px(7, 6, gd);
    p.px(9, 7, '#fff3a8'); p.px(10, 8, '#fff3a8'); p.px(5, 2, '#fff3a8');
  }

  function terminal(p, on) {
    p.rect(5, 12, 4, 10, '#3a3a52'); p.rect(2, 20, 10, 2, '#2a2a3c');
    p.rect(0, 0, 14, 12, '#2a2a3c'); p.rect(1, 1, 12, 10, on ? '#0d2a14' : '#2a0d14');
    GS.Font.draw(p, 'GIT', 2, 2, on ? '#4fe03c' : '#ff5a4a');
    p.rect(2, 9, on ? 9 : 3, 1, on ? '#b4ff5a' : '#ff5a4a');
  }

  function portal(p, on) {
    const cx = 24, cy = 24;
    for (let r = 23; r > 1; r -= 1) {
      const t = r / 23;
      const c = on ? (r % 3 === 0 ? '#b4ff5a' : r % 3 === 1 ? '#4fe03c' : '#1f9a3a') : (r % 3 === 0 ? '#6a6a88' : '#3a3a52');
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const sw = a + t * 5.5;
        const rr = r + Math.sin(a * 3 + r) * 0.6;
        if (Math.sin(sw * 2) > 0.1) p.px(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.1, c);
      }
    }
    p.circle(cx, cy, 3, on ? '#eaffc0' : '#8a8aa8');
  }

  function crate(p) {
    p.rect(0, 0, 32, 26, '#d9773a'); p.rect(2, 2, 28, 22, '#efe4cc');
    p.rect(0, 0, 32, 2, '#a04e1e'); p.rect(0, 24, 32, 2, '#a04e1e');
    p.line(2, 2, 29, 23, '#e0d0b0'); p.line(29, 2, 2, 23, '#e0d0b0');
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.line(16, 11, 16 + Math.cos(a) * 6, 11 + Math.sin(a) * 6, '#d9773a'); }
    GS.Font.draw(p, 'CLAUDE', 16, 18, '#a04e1e', { align: 'center' });
  }

  function glitch(p, f) {
    const c = ['#4fe03c', '#ff4ad0', '#8cf2ff'];
    p.rect(0, 0, 16, 16, '#2a2a42'); p.rect(1, 1, 14, 14, '#3c3c5c');
    p.rect(0, 0, 16, 2, f === 0 ? c[0] : c[f]);
    if (f > 0) {
      for (let i = 0; i < 4; i++) p.rect((i * 5 + f * 3) % 14, 3 + i * 3, 6, 1, c[(i + f) % 3]);
      p.rect(f * 4, 8, 4, 4, 'rgba(255,255,255,0.4)');
    } else {
      GS.Font.draw(p, '?', 6, 5, '#8cf2ff');
    }
  }

  function gridPlat(p) {
    p.rect(0, 0, 48, 6, 'rgba(176,140,255,0.35)');
    for (let x = 0; x < 48; x += 4) p.rect(x, 0, 1, 6, '#b08cff');
    p.rect(0, 0, 48, 1, '#e8d8ff'); p.rect(0, 5, 48, 1, '#7d52d6');
  }

  function platform(p) {
    p.rect(0, 0, 48, 8, '#3a3a58'); p.rect(0, 0, 48, 2, '#6a6a8c'); p.rect(0, 7, 48, 1, '#1a1a2c');
    for (let x = 4; x < 48; x += 8) p.px(x, 4, '#4fe03c');
  }

  // Снаряды.
  function glyph(p, s, color) { GS.Font.draw(p, s, 0, 0, color); }

  const FX_BITS = { g: '#4fe03c', v: '#b08cff', p: '#ff7ab8', w: '#ffffff', y: '#ffd84a', c: '#8cf2ff', r: '#ff5a4a', o: '#ff8a2a' };

  return {
    FX_BITS,
    generate(scene) {
      const mk = (key, w, h, fn, outline = true) => GS.makeTex(scene, key, w, h, fn, { outline });
      [0, 1, 2, 3].forEach((f) => mk('item/coin' + f, 11, 11, (p) => coinFrame(p, f)));
      mk('item/pizza', 12, 11, pizza);
      mk('item/coffee', 9, 11, coffee);
      mk('item/crystal', 9, 14, crystal);
      mk('item/artifact', 17, 17, artifact);
      mk('item/cat', 14, 16, cat);
      mk('obj/terminal_off', 14, 22, (p) => terminal(p, false));
      mk('obj/terminal_on', 14, 22, (p) => terminal(p, true));
      mk('obj/portal', 48, 50, (p) => portal(p, true), false);
      mk('obj/portal_off', 48, 50, (p) => portal(p, false), false);
      mk('obj/crate', 32, 26, crate);
      [0, 1, 2].forEach((f) => mk('obj/glitch' + f, 16, 16, (p) => glitch(p, f), false));
      mk('obj/gridplat', 48, 6, gridPlat, false);
      mk('obj/platform', 48, 8, platform, false);
      mk('obj/bubble', 34, 34, (p) => { p.ring(17, 17, 14.5, 16, '#b4ff5a'); p.ring(17, 17, 13, 14.5, 'rgba(180,255,90,0.35)'); p.rect(9, 8, 3, 2, '#ffffff'); }, false);
      mk('obj/shield', 30, 40, (p) => { p.ring(15, 20, 13, 14.5, 'rgba(176,140,255,0.9)'); p.ellipse(15, 20, 13, 18, 'rgba(176,140,255,0.18)'); p.ring(15, 20, 13, 14.5, '#c8a8ff'); }, false);

      // Снаряды героев.
      ['</>', '{}', '[]', '<>'].forEach((s, i) => mk('shot/code' + i, GS.Font.width(s), 7, (p) => glyph(p, s, '#8cff3a'), true));
      mk('shot/pixel', 5, 5, (p) => { p.rect(0, 0, 5, 5, '#d08cff'); p.rect(1, 1, 2, 2, '#ffffff'); });
      mk('shot/pixelBig', 11, 11, (p) => { p.rect(0, 0, 11, 11, '#b08cff'); p.rect(2, 2, 7, 7, '#e8d8ff'); p.rect(3, 3, 3, 3, '#ffffff'); for (let i = 0; i < 11; i += 2) { p.px(i, 0, '#7d52d6'); p.px(0, i, '#7d52d6'); } });
      mk('shot/red', 10, 3, (p) => { p.rect(0, 0, 10, 3, '#ff5a4a'); p.rect(3, 1, 7, 1, '#ffe0a0'); }, false);
      mk('shot/mech', 12, 5, (p) => { p.rect(0, 0, 12, 5, '#ff9a3a'); p.rect(3, 1, 9, 3, '#ffe0a0'); }, false);
      // Снаряды врагов.
      mk('shot/slime', 6, 6, (p) => { p.circle(3, 3, 3, '#e8649e'); p.px(2, 2, '#ffd0e8'); });
      mk('shot/slimeG', 6, 6, (p) => { p.circle(3, 3, 3, '#4fe03c'); p.px(2, 2, '#eaffc0'); });
      mk('shot/grenade', 7, 7, (p) => { p.circle(3.5, 3.5, 3.5, '#3a3a52'); p.rect(3, 0, 1, 2, '#ff5a4a'); p.px(2, 3, '#6a6a88'); });
      mk('shot/ok', 15, 9, (p) => { p.rect(0, 0, 15, 9, '#c4c4d8'); p.rect(0, 0, 15, 1, '#ffffff'); GS.Font.draw(p, 'ОК', 3, 1, '#2a1a3e'); });
      mk('shot/cube', 10, 10, (p) => { p.rect(0, 0, 10, 10, '#5634a3'); p.rect(0, 0, 10, 2, '#7d52d6'); GS.Font.draw(p, '<', 1, 2, '#4fe03c'); GS.Font.draw(p, '>', 5, 2, '#4fe03c'); });
      mk('shot/wave', 14, 14, (p) => { p.poly([[0, 14], [3, 4], [7, 0], [11, 4], [14, 14]], '#4fe03c'); p.poly([[3, 14], [5, 7], [7, 4], [9, 7], [11, 14]], '#b4ff5a'); p.rect(6, 6, 2, 8, '#ffffff'); });
      mk('shot/glitch', 8, 8, (p) => { p.rect(0, 0, 8, 8, '#ff4ad0'); p.rect(2, 2, 4, 4, '#8cf2ff'); p.rect(0, 3, 8, 1, '#ffffff'); });

      // Частицы.
      mk('fx/dust', 4, 4, (p) => { p.circle(2, 2, 2, '#e2e4f0'); }, false);
      mk('fx/smoke', 6, 6, (p) => { p.circle(3, 3, 3, '#6a6a88'); p.px(2, 2, '#a8acc4'); }, false);
      mk('fx/spark', 3, 3, (p) => { p.px(1, 0, '#ffffff'); p.px(0, 1, '#ffffff'); p.px(1, 1, '#ffffff'); p.px(2, 1, '#ffffff'); p.px(1, 2, '#ffffff'); }, false);
      Object.entries(FX_BITS).forEach(([k, c]) => mk('fx/bit_' + k, 2, 2, (p) => p.rect(0, 0, 2, 2, c), false));
      mk('fx/goo', 4, 4, (p) => { p.circle(2, 2, 2, '#e8649e'); p.px(1, 1, '#ffd0e8'); }, false);
      mk('fx/gooG', 4, 4, (p) => { p.circle(2, 2, 2, '#4fe03c'); p.px(1, 1, '#eaffc0'); }, false);
      mk('fx/star', 5, 5, (p) => { p.px(2, 0, '#ffd84a'); p.rect(0, 2, 5, 1, '#ffd84a'); p.rect(1, 1, 3, 3, '#ffd84a'); p.px(2, 4, '#ffd84a'); p.px(2, 2, '#ffffff'); }, false);
      mk('fx/heart', 5, 5, (p) => p.map(['##.##', '#####', '#####', '.###.', '..#..'], { '#': '#ff5a8a' }), false);
      mk('fx/z', 5, 5, (p) => p.map(['#####', '...#.', '..#..', '.#...', '#####'], { '#': '#e2e4f0' }), false);
      ['<', '>', '{', '}', ';', '/'].forEach((s, i) => mk('fx/glyph' + i, GS.Font.width(s), 7, (p) => glyph(p, s, '#8cff3a'), false));
      mk('fx/muzzle', 7, 7, (p) => { p.rect(3, 0, 1, 7, '#ffffff'); p.rect(0, 3, 7, 1, '#ffffff'); p.rect(2, 2, 3, 3, '#ffffff'); }, false);
      mk('fx/ring', 33, 33, (p) => p.ring(16.5, 16.5, 15, 16.5, '#ffffff'), false);
      mk('fx/square', 8, 8, (p) => { p.rect(0, 0, 8, 1, '#ffffff'); p.rect(0, 7, 8, 1, '#ffffff'); p.rect(0, 0, 1, 8, '#ffffff'); p.rect(7, 0, 1, 8, '#ffffff'); }, false);
      mk('px', 1, 1, (p) => p.px(0, 0, '#ffffff'), false);
      GS.makeGlow(scene, 'glow/green', 24, '#4fe03c');
      GS.makeGlow(scene, 'glow/violet', 24, '#b08cff');
      GS.makeGlow(scene, 'glow/pink', 24, '#ff4ad0');
      GS.makeGlow(scene, 'glow/gold', 24, '#ffd84a');
      GS.makeGlow(scene, 'glow/red', 24, '#ff5a4a');
      GS.makeGlow(scene, 'glow/orange', 24, '#ff9a3a');
      GS.makeGlow(scene, 'glow/cyan', 24, '#8cf2ff');

      // Иконки HUD.
      mk('ui/coin', 7, 7, (p) => { p.circle(3.5, 3.5, 3.5, '#4fe03c'); p.ring(3.5, 3.5, 1, 2, '#b4ff5a'); });
      mk('ui/cat', 7, 7, (p) => { p.ellipse(3.5, 4.5, 3.5, 2.5, '#ffd84a'); p.px(1, 1, '#ffd84a'); p.px(5, 1, '#ffd84a'); p.rect(1, 2, 5, 2, '#ffd84a'); p.px(2, 3, INK); p.px(4, 3, INK); });
      mk('ui/catOff', 7, 7, (p) => { p.ellipse(3.5, 4.5, 3.5, 2.5, '#3a3a52'); p.px(1, 1, '#3a3a52'); p.px(5, 1, '#3a3a52'); p.rect(1, 2, 5, 2, '#3a3a52'); });
      mk('ui/skull', 7, 7, (p) => { p.ellipse(3.5, 3, 3.5, 3, '#e2e4f0'); p.rect(2, 5, 3, 2, '#e2e4f0'); p.px(2, 3, INK); p.px(4, 3, INK); });
      mk('ui/clock', 7, 7, (p) => { p.circle(3.5, 3.5, 3.5, '#e2e4f0'); p.rect(3, 1, 1, 3, INK); p.rect(3, 3, 2, 1, INK); });
      mk('ui/coffee', 7, 8, (p) => { p.rect(0, 2, 5, 6, '#f2ece0'); p.rect(5, 3, 2, 3, '#f2ece0'); p.px(5, 4, null); p.rect(1, 3, 3, 2, '#6a3c20'); });
      mk('ui/shield', 7, 8, (p) => { p.poly([[0, 0], [7, 0], [7, 4], [3.5, 8], [0, 4]], '#b08cff'); p.px(2, 2, '#e8d8ff'); });
    },
  };
})();
