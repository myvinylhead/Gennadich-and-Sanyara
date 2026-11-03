#!/usr/bin/env python3
"""Снятие пиксель-арта с картинки нейросети по сетке — без усреднения и мыла.

Нейросеть рисует «пиксели» квадратами примерно N×N точек, но сетка у неё слегка плывёт.
Здесь размер клетки и сдвиг сетки подбираются автоматически по границам цветов,
затем из центра каждой клетки берётся один цвет (самый частый в центральной области).
Результат — деталь в родном пиксельном размере, 1 клетка = 1 пиксель игры.

Нужен только ImageMagick (пиксели читаются через `magick ... rgba:-`).
"""
import subprocess


def read_rgba(path, box=None):
    args = ['magick', path]
    if box:
        args += ['-crop', box, '+repage']
    w, h = map(int, subprocess.run(args + ['-format', '%w %h', 'info:'], capture_output=True, check=True, text=True).stdout.split())
    raw = subprocess.run(args + ['-depth', '8', 'rgba:-'], capture_output=True, check=True).stdout
    return w, h, raw


def _energy(w, h, raw, axis):
    """Сила перепадов цвета между соседними точками вдоль оси — пики там, где проходят границы клеток."""
    n = w if axis == 0 else h
    e = [0.0] * n
    for y in range(h):
        row = y * w * 4
        for x in range(1, w):
            i = row + x * 4
            j = i - 4
            d = abs(raw[i] - raw[j]) + abs(raw[i + 1] - raw[j + 1]) + abs(raw[i + 2] - raw[j + 2])
            if axis == 0:
                e[x] += d
    if axis == 1:
        for y in range(1, h):
            r0, r1 = (y - 1) * w * 4, y * w * 4
            s = 0
            for x in range(w):
                i, j = r1 + x * 4, r0 + x * 4
                s += abs(raw[i] - raw[j]) + abs(raw[i + 1] - raw[j + 1]) + abs(raw[i + 2] - raw[j + 2])
            e[y] = s
    return e


def _fit(e, guess):
    """Подобрать шаг и сдвиг сетки, при которых границы клеток ложатся на пики перепадов."""
    best = (0, guess, 0.0)
    n = len(e)
    step = guess * 0.85
    while step <= guess * 1.15:
        for k in range(24):
            off = step * k / 24
            score, cnt = 0.0, 0
            p = off
            while p < n - 1:
                i = int(round(p))
                if 0 < i < n:
                    score += max(e[i - 1], e[i], e[i + 1] if i + 1 < n else 0)
                    cnt += 1
                p += step
            if cnt and score / cnt > best[0]:
                best = (score / cnt, step, off)
        step += guess * 0.01
    return best[1], best[2]


def _fit_offset(e, step):
    """Только сдвиг сетки при известном шаге."""
    best = (0, 0.0)
    n = len(e)
    for k in range(24):
        off = step * k / 24
        score, cnt, p = 0.0, 0, off
        while p < n - 1:
            i = int(round(p))
            if 0 < i < n:
                score += max(e[i - 1], e[i], e[i + 1] if i + 1 < n else 0)
                cnt += 1
            p += step
        if cnt and score / cnt > best[0]:
            best = (score / cnt, off)
    return best[1]


def sample(path, box, cell_guess, bg=(0, 255, 0), bg_tol=110, spill=True, square=False, exact=False):
    """Вернуть (w, h, rgba-bytes) детали в родных пикселях.
    square=True — пиксели квадратные: шаг подбирается по ширине и берётся для обеих осей.
    exact=True — шаг ровно cell_guess, подбирается только сдвиг (кадры одного врага выходят в одном масштабе)."""
    w, h, raw = read_rgba(path, box)
    if exact:
        sx, ox = cell_guess, _fit_offset(_energy(w, h, raw, 0), cell_guess)
    else:
        sx, ox = _fit(_energy(w, h, raw, 0), cell_guess)
    if square:
        sy, oy = sx, _fit_offset(_energy(w, h, raw, 1), sx)
    else:
        sy, oy = _fit(_energy(w, h, raw, 1), cell_guess)
    cols = int((w - ox) / sx)
    rows = int((h - oy) / sy)
    out = bytearray(cols * rows * 4)
    for r in range(rows):
        for c in range(cols):
            cx, cy = ox + (c + 0.5) * sx, oy + (r + 0.5) * sy
            rad = max(1, int(min(sx, sy) * 0.22))
            counts = {}
            for yy in range(int(cy) - rad, int(cy) + rad + 1):
                for xx in range(int(cx) - rad, int(cx) + rad + 1):
                    if 0 <= xx < w and 0 <= yy < h:
                        i = (yy * w + xx) * 4
                        # Квантуем до 5 бит, чтобы шум JPEG/WebP не дробил одинаковые цвета.
                        key = (raw[i] >> 3, raw[i + 1] >> 3, raw[i + 2] >> 3)
                        counts.setdefault(key, [0, 0, 0, 0])
                        cc = counts[key]
                        cc[0] += 1; cc[1] += raw[i]; cc[2] += raw[i + 1]; cc[3] += raw[i + 2]
            k = max(counts.values(), key=lambda v: v[0])
            rgb = (k[1] // k[0], k[2] // k[0], k[3] // k[0])
            o = (r * cols + c) * 4
            dist = abs(rgb[0] - bg[0]) + abs(rgb[1] - bg[1]) + abs(rgb[2] - bg[2])
            if bg[1] < 128:  # фон-маджента: кайма — пиксели с преобладанием красного и синего над зелёным
                fringe = spill and rgb[0] > rgb[1] * 1.6 and rgb[2] > rgb[1] * 1.6 and rgb[0] > 140 and rgb[2] > 140
                if dist < bg_tol or fringe:
                    continue
                out[o:o + 4] = bytes((rgb[0], rgb[1], rgb[2], 255))
                continue
            green_spill = rgb[1] > rgb[0] * 1.5 and rgb[1] > rgb[2] * 1.5 and rgb[1] > 80
            # Тёмная зелёная кайма на стыке обводки и фона.
            green_spill = green_spill or (rgb[1] < 110 and rgb[1] > rgb[0] * 1.3 and rgb[1] > rgb[2] * 1.3 and rgb[1] > 25)
            if dist < bg_tol or green_spill:
                continue
            out[o:o + 4] = bytes((rgb[0], rgb[1], rgb[2], 255))
    return cols, rows, bytes(out), (sx, sy)


def save(path, w, h, data):
    subprocess.run(['magick', '-size', f'{w}x{h}', '-depth', '8', 'rgba:-', '-trim', '+repage', 'PNG32:' + path], input=data, check=True)


def mode_resize(w, h, data, tw, th, ink_max=70, ink_share=0.8):
    """Уменьшить пиксель-арт «по большинству»: каждому новому пикселю — самый частый цвет его области.
    Тёмная обводка в приоритете (если занимает ≥ ink_share области), чтобы контур не рвался."""
    out = bytearray(tw * th * 4)
    fx, fy = w / tw, h / th
    for ty in range(th):
        y0, y1 = ty * fy, (ty + 1) * fy
        for tx in range(tw):
            x0, x1 = tx * fx, (tx + 1) * fx
            cov = {}
            total = 0.0
            for y in range(int(y0), min(h, int(y1 + 0.999))):
                wy = min(y + 1, y1) - max(y, y0)
                if wy <= 0:
                    continue
                for x in range(int(x0), min(w, int(x1 + 0.999))):
                    wx = min(x + 1, x1) - max(x, x0)
                    if wx <= 0:
                        continue
                    i = (y * w + x) * 4
                    key = bytes(data[i:i + 4]) if data[i + 3] else b'\x00\x00\x00\x00'
                    cov[key] = cov.get(key, 0.0) + wx * wy
                    total += wx * wy
            if not cov:
                continue
            ink = [(k, v) for k, v in cov.items() if k[3] and k[0] + k[1] + k[2] < ink_max * 3]
            inkv = sum(v for _, v in ink)
            if ink and inkv >= ink_share * total:
                key = max(ink, key=lambda kv: kv[1])[0]
            else:
                key = max(cov.items(), key=lambda kv: kv[1])[0]
            o = (ty * tw + tx) * 4
            out[o:o + 4] = key
    return bytes(out)


def despeckle(w, h, data, passes=2):
    """Убрать «соль»: одиночный пиксель, у которого 3–4 соседа (из 4) одного другого цвета, — в цвет соседей.
    Прозрачность и края не трогаем."""
    d = bytearray(data)
    for _ in range(passes):
        src = bytes(d)
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                i = (y * w + x) * 4
                if not src[i + 3]:
                    continue
                cnt = {}
                for j in ((y - 1) * w + x, (y + 1) * w + x, y * w + x - 1, y * w + x + 1):
                    k = src[j * 4:j * 4 + 4]
                    cnt[k] = cnt.get(k, 0) + 1
                k, n = max(cnt.items(), key=lambda kv: kv[1])
                if n >= 3 and k[3] and k != src[i:i + 4]:
                    d[i:i + 4] = k
    return bytes(d)


def bbox(w, h, data):
    xs = [x for y in range(h) for x in range(w) if data[(y * w + x) * 4 + 3]]
    ys = [y for y in range(h) for x in range(w) if data[(y * w + x) * 4 + 3]]
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def crop(w, h, data, x0, y0, x1, y1):
    out = bytearray()
    for y in range(y0, y1):
        out += data[(y * w + x0) * 4:(y * w + x1) * 4]
    return x1 - x0, y1 - y0, bytes(out)


def part(path, box, cell, size, bg=(0, 255, 0), square=False, spill=True, exact=False):
    """Деталь: снять по сетке клеток cell, обрезать пустоту, уменьшить «по большинству» до size.
    size: 'x21' — по высоте, '23x' — по ширине, '23x21' — точно, '' — родной размер."""
    w, h, d, _ = sample(path, box, cell, bg=bg, square=square, spill=spill, exact=exact)
    w, h, d = crop(w, h, d, *bbox(w, h, d))
    if not size:
        return w, h, d
    if size.startswith('x'):
        th = int(size[1:]); tw = max(1, round(w * th / h))
    elif size.endswith('x'):
        tw = int(size[:-1]); th = max(1, round(h * tw / w))
    else:
        tw, th = map(int, size.split('x'))
    return tw, th, mode_resize(w, h, d, tw, th)
