#!/usr/bin/env python3
"""Раскладка листа деталей героя под картинку нейросети 2000×1333.

1 пиксель игры = CELL точек (20×20). Лист = 100×66 пикселей игры.
Отсюда же берутся рамки для нарезки в build_assets.py и рисуются шаблоны-подсказки
(`python3 tools/sheet_layout.py` → art_refs/template_<герой>.png).
"""
import os
import subprocess

CELL = 20
SHEET_W, SHEET_H = 2000, 1333

# Деталь: (x, y, ширина, высота) в пикселях игры.
PARTS = {
    'head': (4, 6, 23, 21),
    'torso': (32, 10, 13, 13),
    'gun': (51, 12, 17, 10),
    'mug': (74, 14, 8, 7),
    'pack': (87, 9, 7, 14),
    'armU': (4, 38, 5, 8),
    'armL': (14, 38, 5, 8),
    'glove': (24, 39, 8, 6),
    'thigh': (38, 38, 4, 7),
    'shin': (47, 38, 5, 8),
    'boot': (57, 39, 9, 7),
}

HEROES = {
    'sanyara': {'bg': '#00FF00', 'line': '#00C000', 'parts': ['head', 'torso', 'gun', 'mug', 'armU', 'armL', 'glove', 'thigh', 'shin', 'boot']},
    'gennadich': {'bg': '#FF00FF', 'line': '#C000C0', 'parts': ['head', 'torso', 'gun', 'pack', 'armU', 'armL', 'glove', 'thigh', 'shin', 'boot']},
}

LABELS = {'head': 'ГОЛОВА', 'torso': 'ТОРС', 'gun': 'БЛАСТЕР', 'mug': 'КРУЖКА', 'pack': 'РАНЕЦ',
          'armU': 'ПЛЕЧО', 'armL': 'ПРЕДПЛ.', 'glove': 'ПЕРЧАТКА', 'thigh': 'БЕДРО', 'shin': 'ГОЛЕНЬ', 'boot': 'БОТИНОК'}


def crop_box(part, margin=0):
    """Рамка нарезки в точках листа (с запасом в margin клеток)."""
    x, y, w, h = PARTS[part]
    return f'{(w + 2 * margin) * CELL}x{(h + 2 * margin) * CELL}+{(x - margin) * CELL}+{(y - margin) * CELL}'


def size_str(part):
    _, _, w, h = PARTS[part]
    return f'{w}x{h}'


def template(hero, out):
    cfg = HEROES[hero]
    font = '/System/Library/Fonts/Supplemental/Arial.ttf'
    draw = []
    for x in range(0, SHEET_W + 1, CELL):
        draw.append(f'line {x},0 {x},{SHEET_H}')
    for y in range(0, SHEET_H + 1, CELL):
        draw.append(f'line 0,{y} {SHEET_W},{y}')
    boxes, texts = [], []
    for p in cfg['parts']:
        x, y, w, h = PARTS[p]
        boxes.append(f'rectangle {x * CELL},{y * CELL} {(x + w) * CELL - 1},{(y + h) * CELL - 1}')
        texts.append(f"text {x * CELL},{y * CELL - 12} '{LABELS[p]} {w}x{h}'")
    subprocess.run(['magick', '-size', f'{SHEET_W}x{SHEET_H}', f'xc:{cfg["bg"]}',
                    '-stroke', cfg['line'], '-strokewidth', '1', '-draw', ' '.join(draw),
                    '-fill', 'none', '-stroke', '#FFFFFF', '-strokewidth', '3', '-draw', ' '.join(boxes),
                    '-stroke', 'none', '-fill', '#FFFFFF', '-font', font, '-pointsize', '26', '-draw', ' '.join(texts),
                    out], check=True)


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for hero in HEROES:
        path = os.path.join(root, 'art_refs', f'template_{hero}.png')
        template(hero, path)
        print(path)
