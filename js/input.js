// Управление: клавиатура (две раскладки на одной клавиатуре) и геймпады.
// read(i) возвращает состояние игрока i с флагами «нажато в этом кадре».
GS.LAYOUTS = {
  // Один игрок: работают все привычные варианты сразу.
  solo: {
    left: ['LEFT', 'A'], right: ['RIGHT', 'D'], up: ['UP', 'W'], down: ['DOWN', 'S'],
    jump: ['Z', 'SPACE', 'G', 'K'], shoot: ['X', 'F', 'J'], special: ['C', 'H', 'L'], super: ['V', 'R', 'U'],
  },
  p1: {
    left: ['A'], right: ['D'], up: ['W'], down: ['S'],
    jump: ['G', 'SPACE'], shoot: ['F'], special: ['H'], super: ['R'],
  },
  p2: {
    left: ['LEFT'], right: ['RIGHT'], up: ['UP'], down: ['DOWN'],
    jump: ['K'], shoot: ['J'], special: ['L'], super: ['U'],
  },
};

GS.CONTROLS_TEXT = {
  solo: ['← → / A D — БЕГ', '↑ ↓ / W S — ПРИЦЕЛ', 'Z / ПРОБЕЛ — ПРЫЖОК', 'X — ОГОНЬ', 'C — СПЕЦПРИЁМ', 'V — СУПЕРУДАР'],
  p1: ['A D — БЕГ, W S — ПРИЦЕЛ', 'G / ПРОБЕЛ — ПРЫЖОК', 'F — ОГОНЬ, H — СПЕЦ', 'R — СУПЕР'],
  p2: ['← → — БЕГ, ↑ ↓ — ПРИЦЕЛ', 'K — ПРЫЖОК', 'J — ОГОНЬ, L — СПЕЦ', 'U — СУПЕР'],
};

GS.Controls = class Controls {
  // players: 1 или 2.
  constructor(scene, players = 1) {
    this.scene = scene;
    this.players = players;
    const names = new Set(['ENTER', 'ESC', 'P', 'F1', 'F2', 'BACKSPACE', 'M', 'N']);
    Object.values(GS.LAYOUTS).forEach((lay) => Object.values(lay).forEach((arr) => arr.forEach((k) => names.add(k))));
    this.keys = {};
    names.forEach((n) => { this.keys[n] = scene.input.keyboard.addKey(n, true, false); });
    this.prev = [{}, {}];
    this.state = [this.blank(), this.blank()];
    this.prevSys = {};
    this.sys = {};
    this.frame = -1;
  }

  blank() {
    return { left: false, right: false, up: false, down: false, jumpHeld: false, shootHeld: false, specialHeld: false, superHeld: false,
      jump: false, shoot: false, special: false, super: false, any: false };
  }

  layoutFor(i) {
    if (this.players === 1) return GS.LAYOUTS.solo;
    return i === 0 ? GS.LAYOUTS.p1 : GS.LAYOUTS.p2;
  }

  pad(i) {
    const gp = this.scene.input.gamepad;
    if (!gp || !gp.total) return null;
    const pads = gp.gamepads.filter(Boolean);
    if (this.players === 1) return pads[0] || null;
    return pads[i] || null;
  }

  // Вызывать один раз за кадр в начале update сцены.
  update() {
    this.frame++;
    for (let i = 0; i < 2; i++) {
      const lay = this.layoutFor(i);
      const down = (list) => list.some((n) => this.keys[n] && this.keys[n].isDown);
      const cur = {
        left: down(lay.left), right: down(lay.right), up: down(lay.up), down: down(lay.down),
        jumpHeld: down(lay.jump), shootHeld: down(lay.shoot), specialHeld: down(lay.special), superHeld: down(lay.super),
      };
      const pad = this.pad(i);
      if (pad) {
        const b = (n) => !!(pad.buttons[n] && pad.buttons[n].pressed);
        const ax = pad.axes.length ? pad.axes[0].getValue() : 0;
        const ay = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
        cur.left = cur.left || ax < -0.4 || b(14);
        cur.right = cur.right || ax > 0.4 || b(15);
        cur.up = cur.up || ay < -0.5 || b(12);
        cur.down = cur.down || ay > 0.5 || b(13);
        cur.jumpHeld = cur.jumpHeld || b(0);
        cur.shootHeld = cur.shootHeld || b(2) || b(7);
        cur.specialHeld = cur.specialHeld || b(1) || b(6);
        cur.superHeld = cur.superHeld || b(3) || b(5);
        cur.padStart = b(9);
      }
      const p = this.prev[i];
      cur.jump = cur.jumpHeld && !p.jumpHeld;
      cur.shoot = cur.shootHeld && !p.shootHeld;
      cur.special = cur.specialHeld && !p.specialHeld;
      cur.super = cur.superHeld && !p.superHeld;
      cur.any = cur.jump || cur.shoot || cur.special;
      this.prev[i] = cur;
      this.state[i] = cur;
    }
    // Системные клавиши.
    const k = this.keys;
    const s = {
      confirm: k.ENTER.isDown || k.SPACE.isDown || k.Z.isDown || this.state[0].jumpHeld || this.state[1].jumpHeld,
      back: k.ESC.isDown || k.BACKSPACE.isDown,
      pause: k.ESC.isDown || k.P.isDown || !!this.state[0].padStart || !!this.state[1].padStart,
      f1: k.F1.isDown,
      f2: k.F2.isDown,
      up: this.state[0].up || this.state[1].up,
      down: this.state[0].down || this.state[1].down,
      left: this.state[0].left || this.state[1].left,
      right: this.state[0].right || this.state[1].right,
      mute: k.M.isDown,
      skip: k.N.isDown,
    };
    const out = {};
    for (const n in s) out[n] = s[n] && !this.prevSys[n];
    this.prevSys = s;
    this.sys = out;
  }

  read(i) { return this.state[i]; }
};
