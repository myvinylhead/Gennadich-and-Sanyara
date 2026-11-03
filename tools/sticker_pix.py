#!/usr/bin/env python3
"""Пиксельные листы стикеров (art_refs/stikers_NN.png): убрать фон-маджента, уменьшить лист до 640 точек
по ширине с усреднением (снятие по центрам клеток теряет тонкие линии — нейросеть рисует мельче сетки)
и разрезать на стикеры — каждый стикер это отдельный «остров» на фоне.
Мелкие отдельные кусочки (искры, «?», ломтик пиццы) прилипают к ближайшему стикеру.
Порядок стикеров — по строкам сверху вниз, в строке слева направо.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import subprocess  # noqa: E402
import tempfile  # noqa: E402

import pixel_grid  # noqa: E402

OUT_W = 640
MIN_AREA = 1000
TALL = 172   # выше — значит два стикера срослись
NEAR = 24    # мелкий кусочек ближе этого — часть соседнего стикера
ROW_GAP = 50


def islands(w, h, d):
    lab = [-1] * (w * h)
    comps = []
    for start in range(w * h):
        if lab[start] >= 0 or not d[start * 4 + 3]:
            continue
        n = len(comps)
        stack, pts = [start], []
        lab[start] = n
        while stack:
            i = stack.pop()
            pts.append(i)
            x, y = i % w, i // w
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny * w + nx
                    if lab[j] < 0 and d[j * 4 + 3]:
                        lab[j] = n
                        stack.append(j)
        xs = [p % w for p in pts]
        ys = [p // w for p in pts]
        comps.append({'pts': pts, 'box': [min(xs), min(ys), max(xs) + 1, max(ys) + 1]})
    return comps


def defringe(w, h, buf, depth=2, green=False):
    """Пиксели на кромке с примесью фона (маджента или зелёный) в белой обводке — в белый."""
    for _ in range(depth):
        edge = []
        for y in range(h):
            for x in range(w):
                i = (y * w + x) * 4
                if not buf[i + 3]:
                    continue
                r, g, b = buf[i], buf[i + 1], buf[i + 2]
                tinted = (g > 160 and g > max(r, b) + 25) if green else (r > 160 and b > 160 and g < min(r, b) - 25)
                if not tinted:
                    continue
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if not (0 <= nx < w and 0 <= ny < h) or not buf[(ny * w + nx) * 4 + 3]:
                        edge.append(i)
                        break
        for i in edge:
            buf[i:i + 3] = b'\xff\xff\xff'


def cut(path, bg='#FF00FF', out_w=OUT_W):
    """[(w, h, rgba)] стикеров листа в порядке чтения. bg — цвет фона листа, out_w — ширина листа после уменьшения
    (крупные стикеры, по два в ряд, уменьшают сильнее, чтобы в игре они были того же размера, что остальные)."""
    # Фон убрать в полном размере: тогда при уменьшении фон не подмешивается в края.
    small = os.path.join(tempfile.mkdtemp(prefix='gs-st-'), 'sheet.png')
    subprocess.run(['magick', path, '-alpha', 'set', '-fuzz', '25%', '-transparent', bg,
                    '-filter', 'Box', '-resize', f'{out_w}x', '-channel', 'A', '-threshold', '50%', '+channel',
                    'PNG32:' + small], check=True)
    w, h, d = pixel_grid.read_rgba(small)
    comps = islands(w, h, d)
    big = [c for c in comps if len(c['pts']) >= MIN_AREA]
    for c in comps:
        if len(c['pts']) >= MIN_AREA:
            continue
        x0, y0, x1, y1 = c['box']
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2

        def dist(b):
            bx0, by0, bx1, by1 = b['box']
            return max(bx0 - cx, 0, cx - bx1) + max(by0 - cy, 0, cy - by1)
        best = min(big, key=dist)
        if dist(best) <= NEAR:
            best['pts'] += c['pts']
            b = best['box']
            best['box'] = [min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1)]
    # Сросшиеся по вертикали стикеры (остров выше двух строк) — разрезать по самой узкой перемычке.
    for c in list(big):
        x0, y0, x1, y1 = c['box']
        if y1 - y0 <= TALL:
            continue
        cnt = {}
        for p in c['pts']:
            cnt[p // w] = cnt.get(p // w, 0) + 1
        lo, hi = y0 + (y1 - y0) * 35 // 100, y0 + (y1 - y0) * 65 // 100
        cy = min(range(lo, hi + 1), key=lambda y: cnt.get(y, 0))
        big.remove(c)
        for part in ([p for p in c['pts'] if p // w < cy], [p for p in c['pts'] if p // w >= cy]):
            xs, ys = [p % w for p in part], [p // w for p in part]
            big.append({'pts': part, 'box': [min(xs), min(ys), max(xs) + 1, max(ys) + 1]})
    # Строки: стикеры, чьи центры по Y близки, — одна строка.
    big.sort(key=lambda c: (c['box'][1] + c['box'][3]) / 2)
    rows, cur = [], []
    for c in big:
        cy = (c['box'][1] + c['box'][3]) / 2
        if cur and cy - (cur[0]['box'][1] + cur[0]['box'][3]) / 2 > ROW_GAP:
            rows.append(cur)
            cur = []
        cur.append(c)
    if cur:
        rows.append(cur)
    out = []
    for r in rows:
        for c in sorted(r, key=lambda c: c['box'][0]):
            x0, y0, x1, y1 = c['box']
            sw, sh = x1 - x0, y1 - y0
            buf = bytearray(sw * sh * 4)
            for p in c['pts']:
                x, y = p % w - x0, p // w - y0
                buf[(y * sw + x) * 4:(y * sw + x) * 4 + 4] = d[p * 4:p * 4 + 4]
            defringe(sw, sh, buf, green=bg.upper() == '#00FF00')
            out.append((sw, sh, bytes(buf), (x0, y0)))
    return out


if __name__ == '__main__':
    for f in sys.argv[1:]:
        res = cut(f)
        print(f, len(res), [(s[0], s[1], s[3]) for s in res])
