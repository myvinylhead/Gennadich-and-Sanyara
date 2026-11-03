#!/usr/bin/env python3
"""Листы стикеров для перерисовки в Figma: 2000×1333, сетка 10×10, в рамках — нынешние стикеры
как черновик (уменьшены до 60×44 пикселей игры), над рамками — ключ и подпись.

python3 tools/make_sticker_sheet.py  →  art_refs/stickers_edit_<N>.png
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_assets as B  # noqa: E402
import sticker_layout as L  # noqa: E402

FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'


def build(n):
    C = L.CELL
    out = B.src(os.path.join('art_refs', f'stickers_edit_{n + 1}.png'))
    args = ['magick', '-size', f'{L.SHEET_W}x{L.SHEET_H}', f'xc:{L.BG}']
    frames, texts = [], []
    for key, x, y in L.frames(n):
        full = B.build_sticker_crop(key, B.STICKERS[key])
        small = os.path.join(B.TMP, f'draft_{key}.png')
        # Черновик: вписать в рамку, жёсткая альфа, 32 цвета, затем ×10 «пикселями».
        B.magick(full, '-filter', 'Box', '-resize', f'{L.SW}x{L.SH}', '-channel', 'A', '-threshold', '50%', '+channel',
                 '-background', 'none', '-gravity', 'center', '-extent', f'{L.SW}x{L.SH}',
                 '-dither', 'None', '-colors', '32', '-filter', 'Point', '-resize', f'{L.SW * C}x{L.SH * C}!', 'PNG32:' + small)
        args += [small, '-geometry', f'+{x * C}+{y * C}', '-composite']
        frames.append(f'rectangle {x * C - 3},{y * C - 3} {(x + L.SW) * C + 2},{(y + L.SH) * C + 2}')
        cap = L.all_stickers()[key][1].replace("'", '')
        texts.append(f"text {x * C},{y * C - 14} '{n * 6 + len(texts) + 1}. {cap}'")
    texts.append(f"text 50,{L.SHEET_H - 40} 'Сетка: 1 клетка = 1 пиксель. Рамка 60×44. Надписи НЕ рисовать — их пишет игра.'")
    grid = [f'line {x},0 {x},{L.SHEET_H}' for x in range(0, L.SHEET_W + 1, C)] + \
           [f'line 0,{y} {L.SHEET_W},{y}' for y in range(0, L.SHEET_H + 1, C)]
    args += ['-stroke', 'rgba(0,0,0,0.22)', '-strokewidth', '1', '-draw', ' '.join(grid),
             '-fill', 'none', '-stroke', '#FFFFFF', '-strokewidth', '3', '-draw', ' '.join(frames),
             '-stroke', 'none', '-fill', '#FFFFFF', '-font', FONT, '-pointsize', '28', '-draw', ' '.join(texts), out]
    subprocess.run(args, check=True)
    return out


if __name__ == '__main__':
    for i in range(len(L.SHEETS)):
        print(build(i))
