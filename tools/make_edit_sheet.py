#!/usr/bin/env python3
"""Единый лист для редактирования в Figma/ChatGPT: 2000×1333, сетка 20×20,
в каждой рамке — нынешняя деталь героя в точном размере, справа внизу — референс персонажа.

python3 tools/make_edit_sheet.py  →  art_refs/edit_sheet_<герой>.png
"""
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel_grid  # noqa: E402
import sheet_layout as L  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = tempfile.mkdtemp(prefix='gs-edit-')
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'

# Откуда брать нынешние детали: (лист, рамка, клетка нейросети).
SOURCES = {
    'sanyara': ('art_refs/sanyara_parts_v2.png', 13.5, {
        'head': '560x515+25+190', 'torso': '410x400+605+305', 'gun': '560x350+1088+345', 'mug': '285x260+1700+425',
        'armU': '205x320+52+840', 'armL': '200x305+345+855', 'glove': '280x200+622+920', 'thigh': '180x315+985+840',
        'shin': '245x325+1268+845', 'boot': '315x245+1592+918',
    }),
}
# Готовые детали из игры (по одному PNG на деталь) — ставятся в рамку без масштабирования, по центру.
FILES = {
    'gennadich': 'art_refs/gennadich_game_parts',
}
# Референс персонажа во весь рост (кадр из видео): (файл, рамка).
REFS = {
    'sanyara': ('image 25.png', '500x941+1160+0'),
    'gennadich': ('image 25.png', '500x941+20+0'),
}


def p(*a):
    return os.path.join(ROOT, *a)


def build(hero):
    cfg = L.HEROES[hero]
    C = L.CELL
    out = p('art_refs', f'edit_sheet_{hero}.png')
    args = ['magick', '-size', f'{L.SHEET_W}x{L.SHEET_H}', f'xc:{cfg["bg"]}']
    # Нынешние детали — в рамки, ровно по клеткам.
    src = SOURCES.get(hero)
    if src:
        sheet, cell, boxes = src
        for part in cfg['parts']:
            if part not in boxes:
                continue
            x, y, w, h = L.PARTS[part]
            pw, ph, data = pixel_grid.part(p(sheet), boxes[part], cell, f'{w}x{h}')
            f = os.path.join(TMP, f'{part}.png')
            pixel_grid.save(f, pw, ph, data)
            big = os.path.join(TMP, f'{part}_big.png')
            subprocess.run(['magick', f, '-background', 'none', '-gravity', 'center', '-extent', f'{w}x{h}',
                            '-filter', 'Point', '-resize', f'{w * C}x{h * C}!', big], check=True)
            args += [big, '-geometry', f'+{x * C}+{y * C}', '-composite']
    fdir = FILES.get(hero)
    if fdir and not src:
        for part in cfg['parts']:
            f = p(fdir, f'{part}.png')
            if not os.path.exists(f):
                continue
            x, y, w, h = L.PARTS[part]
            big = os.path.join(TMP, f'{part}_big.png')
            subprocess.run(['magick', f, '-background', 'none', '-gravity', 'center', '-extent', f'{w}x{h}',
                            '-filter', 'Point', '-resize', f'{w * C}x{h * C}!', big], check=True)
            args += [big, '-geometry', f'+{x * C}+{y * C}', '-composite']
    # Референс справа внизу.
    rf, rbox = REFS[hero]
    ref = os.path.join(TMP, 'ref.png')
    subprocess.run(['magick', p(rf), '-crop', rbox, '+repage', '-resize', 'x430', ref], check=True)
    args += [ref, '-geometry', '+1740+880', '-composite']
    # Сетка поверх всего и рамки чуть снаружи деталей.
    grid = [f'line {x},0 {x},{L.SHEET_H}' for x in range(0, L.SHEET_W + 1, C)] + \
           [f'line 0,{y} {L.SHEET_W},{y}' for y in range(0, L.SHEET_H + 1, C)]
    frames, texts = [], []
    for part in cfg['parts']:
        x, y, w, h = L.PARTS[part]
        frames.append(f'rectangle {x * C - 3},{y * C - 3} {(x + w) * C + 2},{(y + h) * C + 2}')
        texts.append(f"text {x * C},{y * C - 12} '{L.LABELS[part]} {w}x{h}'")
    texts.append("text 1560,868 'РЕФЕРЕНС — не рисовать'")
    args += ['-stroke', 'rgba(0,0,0,0.28)', '-strokewidth', '1', '-draw', ' '.join(grid),
             '-fill', 'none', '-stroke', '#FFFFFF', '-strokewidth', '3', '-draw', ' '.join(frames),
             '-stroke', 'none', '-fill', '#FFFFFF', '-font', FONT, '-pointsize', '26', '-draw', ' '.join(texts), out]
    subprocess.run(args, check=True)
    return out


if __name__ == '__main__':
    for h in (sys.argv[1:] or list(L.HEROES)):
        print(build(h))
