#!/usr/bin/env python3
"""Сборка картинок из кадров видео в js/data/images.js (base64 data-URI).

Зачем: Chrome не даёт загружать file://-картинки в WebGL, а игра должна открываться двойным
кликом по index.html. Поэтому картинки уменьшаются, «пикселизуются» (ограниченная палитра)
и встраиваются прямо в JS.

Нужен ImageMagick (`magick`). Запуск из корня проекта:  python3 tools/build_assets.py
"""
import base64
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'data', 'images.js')
TMP = tempfile.mkdtemp(prefix='gs-assets-')


def src(name):
    return os.path.join(ROOT, name)


def magick(*args):
    subprocess.run(['magick', *args], check=True)


def b64(path):
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()


# Комикс-панели: 320×180 (в игре показываются ×2), 48 цветов без дизеринга — «16-бит».
PANELS = {
    'story/code': ('image 13.png', 'center'),
    'story/portal': ('image 24.png', 'center'),
    'story/opossum': ('image 12.png', 'north'),
    'story/cockpit': ('image 11.png', 'center'),
    'story/artifact': ('image 18.png', 'center'),
    'story/popups': ('image 15.png', 'center'),
    'story/battle': ('image 20.png', 'center'),
    'story/mech': ('image 22.png', 'center'),
    'story/slingshot': ('image 14.png', 'center'),
    'story/concert': ('image 16.png', 'center'),
    'story/diztehi': ('image 19.png', 'center'),
    'story/title': ('image 25.png', 'center'),
    'story/hangar': ('image 21.png', 'center'),
    'story/pizza1': ('image 13.png', 'center'),
    'story/pizza2': ('image 13.png', 'center'),
    'story/church1': ('image 13.png', 'center'),
    'story/church2': ('image 13.png', 'north'),  # сверху митра босса — её не обрезать
}

# Стикеры: (лист, x0, y0, x1, y1). Координаты в пикселях исходного листа 1448×1086.
def grid(sheet, cols, rows, col, row, inset=4):
    w, h = 1448 / cols, 1086 / rows
    return (sheet, int(col * w) + inset, int(row * h) + inset, int((col + 1) * w) - inset, int((row + 1) * h) - inset)

STICKERS = {
    # Лист Саняры 4×4.
    'ny_eto_ya_tak': grid('image 8.png', 4, 4, 0, 0),
    'petushnya': grid('image 8.png', 4, 4, 1, 0),
    'podmyshka': grid('image 8.png', 4, 4, 2, 0),
    'horosho_ili_ploho': grid('image 8.png', 4, 4, 3, 0),
    'koshka': grid('image 8.png', 4, 4, 0, 1),
    'samson': grid('image 8.png', 4, 4, 1, 1),
    'setka': grid('image 8.png', 4, 4, 2, 1),
    'potom': grid('image 8.png', 4, 4, 3, 1),
    'ne_bag': grid('image 8.png', 4, 4, 0, 2),
    'artefakt_s': grid('image 8.png', 4, 4, 1, 2),
    'v_portal_s': grid('image 8.png', 4, 4, 2, 2),
    'diztehi_s': grid('image 8.png', 4, 4, 3, 2),
    'slishkom_neiro': grid('image 8.png', 4, 4, 0, 3),
    'prompt_syrovat': grid('image 8.png', 4, 4, 1, 3),
    'shcha_peredelaem': grid('image 8.png', 4, 4, 2, 3),
    'neirohryuchevo': grid('image 8.png', 4, 4, 3, 3),
    # Лист 5×4.
    'gen_na_dich': grid('image 10.png', 5, 4, 0, 0),
    'hryuk_da_kod': grid('image 10.png', 5, 4, 0, 1),
    'bit_da_svet': grid('image 10.png', 5, 4, 1, 1),
    'letyat': grid('image 10.png', 5, 4, 2, 1),
    'gde_artefakt': grid('image 10.png', 5, 4, 4, 1),
    'kod_toplivo': grid('image 10.png', 5, 4, 0, 2),
    'pizza_2': grid('image 10.png', 5, 4, 1, 2),
    'oshibka_2': grid('image 10.png', 5, 4, 2, 2),
    'mech_2': grid('image 10.png', 5, 4, 3, 2),
    'ne_budi': grid('image 10.png', 5, 4, 0, 3),
    'dedlainy': grid('image 10.png', 5, 4, 1, 3),
    'dva_mozga_2': grid('image 10.png', 5, 4, 2, 3),
    'soobshchenie': grid('image 10.png', 5, 4, 3, 3),
    'svyaz_kod_kofe': grid('image 10.png', 5, 4, 4, 3),
    # Мемпак (неровная раскладка).
    'pognali_v_prod': ('image 9.png', 20, 75, 365, 360),
    'pofiksim': ('image 9.png', 370, 95, 620, 360),
    'peredelat': ('image 9.png', 618, 95, 885, 360),
    'pizza_break': ('image 9.png', 880, 95, 1165, 370),
    'hryuk_hryuk': ('image 9.png', 1160, 85, 1435, 360),
    'ne_bag_pig': ('image 9.png', 15, 355, 250, 610),
    'oshibka': ('image 9.png', 240, 350, 530, 610),
    'kto_prompt': ('image 9.png', 525, 355, 845, 610),
    'artefakt_g': ('image 9.png', 850, 370, 1105, 615),
    'ya_pomog': ('image 9.png', 285, 605, 485, 805),
    'mech': ('image 9.png', 480, 595, 805, 805),
    'doklad': ('image 9.png', 810, 605, 1170, 805),
    'pod_kontrolem': ('image 9.png', 225, 805, 445, 1045),
    'neiroplaneta': ('image 9.png', 450, 795, 840, 1045),
    'toplivo': ('image 9.png', 850, 800, 1105, 1045),
    'dva_mozga': ('image 9.png', 1105, 805, 1440, 1045),
}


# Перерисованные пиксель-артом кадры (art_refs/Cutscenes): собираются в полном разрешении игры 640×360,
# с усреднением и ограниченной палитрой; в игре показываются 1:1 (масштаб = 640 / ширина текстуры).
CUTSCENES = {
    'story/cockpit': 'image 53.png', 'story/opossum': 'image 54.png', 'story/code': 'image 55.png',
    'story/slingshot': 'image 56.png', 'story/popups': 'image 57.png', 'story/concert': 'image 58.png',
    'story/artifact': 'image 59.png', 'story/diztehi': 'image 60.png', 'story/battle': 'image 61.png',
    'story/hangar': 'image 62.png', 'story/mech': 'image 63.png', 'story/portal': 'image 64.png', 'story/title': 'image 65.png',
    'story/pizza1': 'pizza_1.png', 'story/pizza2': 'pizza_2.png',
    'story/church1': 'church_1.png', 'story/church2': 'church_2.png',
}


def build_panel(key, name, gravity):
    out = os.path.join(TMP, key.replace('/', '_') + '.png')
    cut = os.path.join('art_refs', 'Cutscenes', CUTSCENES.get(key, '-'))
    if os.path.exists(src(cut)):
        magick(src(cut), '-filter', 'Box', '-resize', '640x360^', '-gravity', gravity, '-extent', '640x360',
               '-dither', 'None', '-colors', '96', 'PNG8:' + out)
        return out
    magick(src(name), '-filter', 'Box', '-resize', '320x180^', '-gravity', gravity, '-extent', '320x180',
           '-dither', 'None', '-colors', '48', 'PNG8:' + out)
    return out


# Пиксельные листы стикеров (перерисовка мемпаков в Figma, надписи на самих стикерах).
# Ключи — по порядку чтения листа: строки сверху вниз, в строке слева направо (см. tools/sticker_pix.py).
PIX_STICKERS = [
    ('art_refs/stikers_01.png', ['ny_eto_ya_tak', 'petushnya', 'podmyshka', 'horosho_ili_ploho',
                                 'koshka', 'samson', 'setka', 'potom',
                                 'ne_bag', 'artefakt_s', 'v_portal_s', 'diztehi_s',
                                 'slishkom_neiro', 'prompt_syrovat', 'shcha_peredelaem', 'neirohryuchevo']),
    ('art_refs/stikers_02.png', ['pognali_v_prod', 'pofiksim', 'peredelat', 'pizza_break', 'hryuk_hryuk',
                                 'ne_bag_pig', 'oshibka', 'kto_prompt', 'artefakt_g', 'setka_g',
                                 'spasaem', 'ya_pomog', 'mech', 'doklad', 'ne_budi_cup',
                                 'potom_2', 'pod_kontrolem', 'neiroplaneta', 'toplivo', 'dva_mozga']),
    ('art_refs/stikers_03.png', ['gen_na_dich', 'sa_nya_ra', 'neirokosmos', 'v_portal_2', 'zhara',
                                 'hryuk_da_kod', 'bit_da_svet', 'letyat', 'diztehi_g', 'gde_artefakt',
                                 'kod_toplivo', 'pizza_2', 'oshibka_2', 'mech_2', 'seedance',
                                 'ne_budi', 'dedlainy', 'dva_mozga_2', 'soobshchenie', 'svyaz_kod_kofe']),
    ('art_refs/stikers_04.png', ['ogon', 'laik', 'bred', 'peredelat_s',
                                 'lyubov', 'nu_takoe', 'v_prod', 'potom_3',
                                 'setka_3', 'artefakt_3', 'horosho_3', 'neiro_3']),
    # Саняра: крупные, по два в ряд, на зелёном фоне.
    ('art_refs/stikers_05.png', ['pognali_mech', 'vstupai_church', 'ya_vernulsya', 'nasobachilsya'],
     {'bg': '#00FF00', 'w': 320}),
]


STICKER_DIR = 'art_refs/stickers'   # готовые стикеры по одному: <ключ>.png — важнее автонарезки листов


def build_pix_stickers(data, caps):
    import pixel_grid
    import sticker_pix
    # Нарезанные вручную: берутся как есть (лишняя прозрачность по краям обрезается).
    if os.path.isdir(src(STICKER_DIR)):
        for f in sorted(os.listdir(src(STICKER_DIR))):
            key, ext = os.path.splitext(f)
            if ext.lower() != '.png' or key.startswith('_'):
                continue
            out = os.path.join(TMP, 'stm_' + key + '.png')
            magick(src(os.path.join(STICKER_DIR, f)), '-trim', '+repage', 'PNG32:' + out)
            data['st/' + key] = b64(out)
            caps[key] = ['', '']
    for sheet, keys, *opt in PIX_STICKERS:
        if not os.path.exists(src(sheet)):
            continue
        o = opt[0] if opt else {}
        found = sticker_pix.cut(src(sheet), o.get('bg', '#FF00FF'), o.get('w', sticker_pix.OUT_W))
        if len(found) != len(keys):
            print(f'!! {sheet}: найдено {len(found)} стикеров, ждали {len(keys)} — лист пропущен')
            continue
        for key, (w, h, d, _) in zip(keys, found):
            if key in caps:
                continue
            out = os.path.join(TMP, 'stp_' + key + '.png')
            pixel_grid.save(out, w, h, d)
            # Ограниченная палитра без дизеринга — чистые пиксельные плашки цвета, без шума усреднения.
            magick(out, '-dither', 'None', '-colors', '48', 'PNG32:' + out)
            data['st/' + key] = b64(out)
            caps[key] = ['', '']  # надпись нарисована на самом стикере


def build_sticker_crop(key, spec):
    """Вырезать стикер из мемпака в полном размере, без звёздного фона."""
    sheet, x0, y0, x1, y1 = spec
    w, h = x1 - x0, y1 - y0
    crop = os.path.join(TMP, 'crop_' + key + '.png')
    # Вырезать, убрать тёмный звёздный фон заливкой от углов (белая обводка стикера её останавливает).
    magick(src(sheet), '-crop', f'{w}x{h}+{x0}+{y0}', '+repage', '-alpha', 'set', '-fuzz', '11%', '-fill', 'none',
           '-draw', 'color 0,0 floodfill', '-draw', f'color {w - 1},0 floodfill',
           '-draw', f'color 0,{h - 1} floodfill', '-draw', f'color {w - 1},{h - 1} floodfill',
           '-draw', f'color {w // 2},1 floodfill', '-draw', f'color {w // 2},{h - 2} floodfill',
           '-draw', f'color 1,{h // 2} floodfill', '-draw', f'color {w - 2},{h // 2} floodfill', crop)
    return crop


def build_sticker(key, spec):
    crop = build_sticker_crop(key, spec)
    out = os.path.join(TMP, 'st_' + key + '.png')
    sheet, x0, y0, x1, y1 = spec
    w, h = x1 - x0, y1 - y0
    scale = min(132 / w, 100 / h)
    tw, th = max(1, round(w * scale)), max(1, round(h * scale))
    magick(crop, '-filter', 'Box', '-resize', f'{tw}x{th}!', '-channel', 'A', '-threshold', '50%', '+channel',
           '-dither', 'None', '-colors', '64', 'PNG8:' + out)
    return out


# Нарисованные детали героев (листы из ChatGPT): (лист, рамка WxH+X+Y, размер, заплатки).
# Размер: 'x25' / '9x' — уменьшить (мыльно), 'grid:16' — снять по сетке клеток ≈16 точек (чётко).
# Заплатки — прямоугольники «x0,y0 x1,y1» цветом кожи: стирают нарисованные глаза и рот,
# чтобы в игре поверх работали сменные эмоции.
SKIN_S = '#FDB97A'
SKIN_G = '#FDB46D'
SKIN_Y = '#FDAD57'
HERO_SPRITES = {
    'sanyara': ('art_refs/sanyara_parts_v2.png', {
        'head': ('560x515+25+190', 'grid:13.5:x21', [('12,11 15,14', SKIN_S), ('18,11 19,13', SKIN_S), ('13,16 17,17', SKIN_S)]),
        'torso': ('410x400+605+305', 'grid:13.5:x13', []),
        'armU': ('205x320+52+840', 'grid:13.5:x8', []),
        'armL': ('200x305+345+855', 'grid:13.5:x8', []),
        'glove': ('280x200+622+920', 'grid:13.5:8x', []),
        'thigh': ('180x315+985+840', 'grid:13.5:x7', []),
        'shin': ('245x325+1268+845', 'grid:13.5:x8', []),
        'boot': ('315x245+1592+918', 'grid:13.5:9x', []),
        'gun': ('560x350+1088+345', 'grid:13.5:17x', []),
        'mug': ('285x260+1700+425', 'grid:13.5:8x', []),
    }),
    # Листы без шаблона (2000×1333, фон-маджента, клетка ≈17): рамки найдены по островам на фоне.
    'gennadich': ('art_refs/gennadich_parts_v5.png', {
        'head': ('420x492+100+184', 'grid:17:x22', [('8,16 13,19', SKIN_G)]),  # рот — под сменные рты
        'torso': ('520x436+620+256', 'grid:17:x14', []),
        'gun': ('580x344+1308+316', 'grid:17:17x', []),
        'armU': ('208x340+72+812', 'grid:17:x8', []),
        'armL': ('216x328+360+828', 'grid:17:x8', []),
        'glove': ('268x200+632+900', 'grid:17:8x', []),
        'thigh': ('172x336+996+812', 'grid:17:x7', []),
        'shin': ('244x356+1280+800', 'grid:17:x8', []),
        'boot': ('320x256+1596+900', 'grid:17:9x', []),
    }, '#D2219B'),
    'yurich': ('art_refs/yurich_parts_v1.png', {
        'head': ('492x516+88+176', 'grid:17:x22', [('11,16 15,17', SKIN_Y)]),
        'torso': ('528x468+612+240', 'grid:17:x14', []),
        'gun': ('644x400+1252+304', 'grid:17:18x', []),
        'armU': ('212x324+68+820', 'grid:17:x8', []),
        'armL': ('220x312+360+848', 'grid:17:x8', []),
        'glove': ('284x200+640+916', 'grid:17:8x', []),
        'thigh': ('168x312+996+828', 'grid:17:x7', []),
        'shin': ('232x324+1272+828', 'grid:17:x8', []),
        'boot': ('328x264+1600+884', 'grid:17:9x', []),
    }, '#D42199'),
}


def layout_sprites(hero, sheet, patches=None):
    """Лист по шаблону tools/sheet_layout.py (2000×1333, клетка 20): рамки известны, размер родной."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import sheet_layout as L
    patches = patches or {}
    return (sheet, {p: (L.crop_box(p), f'grid:{L.CELL}', patches.get(p, [])) for p in L.HEROES[hero]['parts']},
            L.HEROES[hero]['bg'])


BG = '#00FF00'


# Заплатки (стереть глаза и рот) для листов v3 — заполнить после генерации по реальной голове.
V3_PATCHES = {}


def build_hero_part(hero, part, sheet, box, size, patches):
    out = os.path.join(TMP, f'hs_{hero}_{part}.png')
    # Режим «по сетке»: size = 'grid:16' — нейросеть рисовала клетками ≈16 точек,
    # снимаем по одному пикселю с клетки, без масштабирования и мыла.
    if size.startswith('grid:'):
        # 'grid:13.5' — родной размер; 'grid:13.5:x21' — потом уменьшить «по большинству» (без смешивания цветов).
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import pixel_grid
        _, cell, *rest = size.split(':')
        bgc = tuple(int(BG.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
        w, h, data = pixel_grid.part(src(sheet), box, float(cell), rest[0] if rest else '', bg=bgc)
        pixel_grid.save(out, w, h, data)
        if patches:
            args = [out]
            for rect, color in patches:
                args += ['-fill', color, '-draw', f'rectangle {rect}']
            magick(*args, 'PNG32:' + out)
        return out
    args = [src(sheet), '-crop', box, '+repage', '-fuzz', '22%', '-transparent', '#00ff00', '-trim', '+repage',
            # Зелёная кайма от хромакея: пиксели с преобладающим зелёным — прозрачные.
            '-channel', 'A', '-fx', '(g>r*1.5 && g>b*1.5 && g>0.3) ? 0 : a', '+channel',
            '-filter', 'Box', '-resize', size, '-channel', 'A', '-threshold', '50%', '+channel',
            # Чистая палитра без дизеринга — пиксели становятся «нарисованными», а не мыльными.
            '-dither', 'None', '-colors', '20']
    for rect, color in patches:
        args += ['-fill', color, '-draw', f'rectangle {rect}']
    magick(*args, 'PNG32:' + out)
    return out


def build_sticker_v2(sheet, x, y, key):
    """Пиксельный стикер с листа art_refs/stickers_v2_<N>.png: снять по центрам клеток 10×10, убрать фон-маджента."""
    import sticker_layout as SL
    C = SL.CELL
    out = os.path.join(TMP, 'st2_' + key + '.png')
    magick(src(sheet), '-crop', f'{SL.SW * C}x{SL.SH * C}+{x * C}+{y * C}', '+repage', '-filter', 'Point',
           '-sample', f'{SL.SW}x{SL.SH}!', '-alpha', 'set', '-fuzz', '22%', '-transparent', SL.BG,
           '-channel', 'A', '-threshold', '50%', '+channel', '-trim', '+repage', 'PNG32:' + out)
    return out


def build_logo():
    """Логотип титула (art_refs/logo.png, белый фон): вырезать заливкой от углов, убрать курсор мыши
    из исходника, уменьшить с усреднением до высоты 150 и свести к ограниченной палитре."""
    out = os.path.join(TMP, 'logo.png')
    magick(src('art_refs/logo.png'), '-region', '58x50+577+693', '-fuzz', '32%', '-fill', '#045C1A', '-opaque', 'white',
           '+region', '-alpha', 'set', '-fuzz', '14%', '-fill', 'none',
           '-draw', 'color 0,0 floodfill', '-draw', 'color 1671,0 floodfill',
           '-draw', 'color 0,940 floodfill', '-draw', 'color 1671,940 floodfill', '-trim', '+repage',
           '-filter', 'Box', '-resize', 'x150', '-channel', 'A', '-threshold', '50%', '+channel',
           '-dither', 'None', '-colors', '48', 'PNG32:' + out)
    return out


# Шмап: листы кораблей (art_refs/ship_<герой>.png, фон-маджента, клетка ≈11) — одинаковая раскладка:
# сверху ракурсы корабля (берём вид сверху), ниже 6 кадров выхлопа и два ряда выстрелов
# (пушка, вспышка, пули). Детали находятся сами — как острова на фоне.
SHIP_CELL = 11
SHIP_SHOT_ROW = {'yurich': 1, 'sanyara': 0, 'gennadich': 0}   # какой ряд выстрелов у героя


def _ship_boxes(path):
    import pixel_grid
    import sticker_pix
    r = pixel_grid.read_rgba(path, '4x4+10+10')[2][:3]
    bg = '#%02X%02X%02X' % tuple(r)
    small = os.path.join(TMP, 'ship_mask.png')
    magick(path, '-alpha', 'set', '-fuzz', '22%', '-transparent', bg, '-sample', '25%', 'PNG32:' + small)
    w, h, d = pixel_grid.read_rgba(small)
    boxes = []
    for c in sticker_pix.islands(w, h, d):
        if len(c['pts']) < 100:
            continue  # подписи и искры
        if c['box'][0] <= 0 or c['box'][1] <= 0 or c['box'][2] >= w - 1 or c['box'][3] >= h - 1:
            continue  # обрезки по краю листа
        x0, y0, x1, y1 = [v * 4 for v in c['box']]
        boxes.append((x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8))
    rows = {'ship': [], 'flame': [], 'shot0': [], 'shot1': []}
    for b in boxes:
        cy = b[1] + b[3] / 2
        rows['ship' if cy < 1100 else 'flame' if cy < 1450 else 'shot0' if cy < 1720 else 'shot1'].append(b)
    for k in rows:
        rows[k].sort(key=lambda b: (b[1] // 300, b[0]) if k == 'ship' else b[0])
    return tuple(r), rows


def build_ship_assets(data):
    import pixel_grid
    for hero in ('yurich', 'sanyara', 'gennadich'):
        sheet = src(f'art_refs/ship_{hero}.png')
        if not os.path.exists(sheet):
            continue
        bg, rows = _ship_boxes(sheet)
        shots = rows['shot%d' % SHIP_SHOT_ROW[hero]]
        parts = {f'ship/{hero}': (rows['ship'][0], 0, '')}
        for i, b in enumerate(rows['flame'][:6]):
            parts[f'ship/{hero}_flame{i}'] = (b, 90, 'x%d' % [8, 8, 7, 6, 5, 4][i])
        parts[f'shot/{hero}_flash'] = (shots[1], 270, 'x12')
        parts[f'shot/{hero}0'] = (shots[2], 90, '')
        parts[f'shot/{hero}1'] = (shots[3], 90, '')
        for key, ((x, y, w, h), rot, size) in parts.items():
            # Кайму-маджента не чистим у корпуса (у него чёрная обводка) и у фиолетовых эффектов Саняры —
            # иначе вместе с каймой пропадают светло-фиолетовые панели.
            spill = key != f'ship/{hero}' and hero != 'sanyara'
            pw, ph, d = pixel_grid.part(sheet, f'{w}x{h}+{x}+{y}', SHIP_CELL, size, bg=bg, square=True, spill=spill)
            if key == f'ship/{hero}':
                # Близкие оттенки — в один цвет (палитра 20), затем убрать одиночные пиксели-«соль».
                q = os.path.join(TMP, 'shipq.png')
                pixel_grid.save(q, pw, ph, d)
                magick(q, '-dither', 'None', '-colors', '20', 'PNG32:' + q)
                pw, ph, d = pixel_grid.read_rgba(q)
                d = pixel_grid.despeckle(pw, ph, d)
            out = os.path.join(TMP, key.replace('/', '_') + '.png')
            pixel_grid.save(out, pw, ph, d)
            if rot:
                magick(out, '-rotate', str(rot), '+repage', 'PNG32:' + out)
            data[key] = b64(out)


# Нарисованные листы из ChatGPT на маджента-фоне: студия SUNO (art_refs/suno_*.png) и Пицца-вселенная
# (art_refs/pizza_*.png). Рамки найдены по «островам» и уточнены вручную — эффекты, прилипшие к предметам
# (лучи, звуковые волны, выстрел), обрезаны: их рисует игра.
# Размер — в пикселях игры: 'x20' — по высоте, '28x' — по ширине, '16x16' — точно.
DRAWN_SHEETS = {
    'art_refs/suno_props.png': {
        'suno/guitar_g': ('524x372+56+180', '34x'),
        'suno/guitar_r': ('524x368+548+188', '34x'),
        'suno/mic': ('260x112+1028+408', '12x'),
        'suno/drums': ('624x440+1336+144', 'x34'),
        'suno/sub0': ('288x284+52+684', 'x20'),
        'suno/sub1': ('288x284+376+684', 'x20'),
        'suno/metro': ('180x165+752+708', 'x10'),
        'suno/eq': ('456x132+1060+760', '32x'),
        'suno/note': ('140x184+1592+736', 'x11'),
        'shot/strike': ('168x168+1788+764', 'x9'),
    },
    'art_refs/suno_enemies.png': {
        'suno/bot0': ('124x156+556+36', 'x24'),
        'suno/bot1': ('124x160+744+32', 'x24'),
        'suno/bot_shoot': ('160x156+932+36', 'x24'),
        'suno/bot_hurt': ('156x168+1212+32', 'x24'),
        'suno/botbig0': ('364x328+392+228', 'x48'),
        'suno/botbig_hit': ('372x320+812+236', 'x48'),
        'suno/botbig_dead': ('324x312+1240+248', 'x48'),
        'suno/fnote0': ('108x132+72+628', 'x14'),
        'suno/fnote1': ('112x136+216+624', 'x14'),
        'suno/ghost0': ('144x168+416+600', 'x18'),
        'suno/ghost1': ('156x164+584+600', 'x18'),
        'suno/autotune0': ('256x176+828+604', 'x22'),
        'suno/autotune1': ('260x176+1116+604', 'x22'),
        'suno/autotune2': ('252x176+1424+564', 'x22'),
        'suno/autotune3': ('236x176+1712+604', 'x22'),
        'suno/drummer0': ('388x284+324+804', 'x34'),
        'suno/drummer1': ('388x272+796+816', 'x33'),
        'suno/drummer2': ('392x264+1280+824', 'x32'),
    },
    'art_refs/suno_tiles.png': {
        'suno/tile_top': ('304x300+80+224', '16x16'),
        'suno/tile_fillA': ('308x300+464+224', '16x16'),
        'suno/tile_fillB': ('308x300+848+224', '16x16'),
        'suno/tile_cab': ('308x304+1228+220', '16x16'),
        'suno/tile_foam': ('308x300+1616+224', '16x16'),
        'suno/tile_owL': ('264x152+44+668', '16x'),
        'suno/tile_owM': ('260x148+368+668', '16x'),
        'suno/tile_owR': ('256x152+680+668', '16x'),
        'suno/tile_gooTop': ('268x256+1008+668', '16x16'),
        'suno/tile_goo': ('264x256+1352+668', '16x16'),
        'suno/tile_spike': ('268x256+1692+668', '16x16'),
    },
    # Пицца-вселенная.
    # Собор Святого Покока. Шаг 'gN' — ровно N точек листа на пиксель игры (один масштаб у кадров одного врага).
    'art_refs/church_enemies.png': {
        'church/fanatic0': ('288x460+100+52', 'g11'),
        'church/fanatic1': ('336x496+500+16', 'g11'),
        'church/acolyte0': ('420x484+984+28', 'g12'),
        'church/acolyte1': ('424x484+1480+28', 'g12'),
        'church/tokenizer0': ('456x476+64+616', 'g12'),
        'church/tokenizer1': ('472x452+532+640', 'g12'),
        'church/inquisitor0': ('340x580+1020+512', 'g12'),
        'church/inquisitor1': ('560x580+1412+512', 'g12'),
        'church/choir0': ('532x348+60+1184', 'g11'),
        'church/choir1': ('532x408+640+1124', 'g11'),
        'shot/question': ('132x208+1824+1228', 'g12'),
        'shot/scroll': ('200x124+1244+1296', 'g12'),
        'shot/scrollTail': ('196x132+1456+1304', 'g12'),
        'shot/token': ('104x96+1680+1312', 'g12'),
    },
    'art_refs/church_props.png': {
        'church/pillar0': ('324x780+72+100', 'g13'),
        'church/pillar1': ('356x792+488+100', 'g13'),
        'church/booth0': ('396x744+896+128', 'g13'),
        'church/booth1': ('416x824+1348+56', 'g13'),
        'church/candle': ('124x368+1828+524', 'g17'),
        'church/relic_tdd': ('508x532+168+936', 'g17'),
        'church/relic_caveman': ('500x532+752+936', 'g17'),
        'church/relic_diagnose': ('504x544+1324+924', 'g17'),
    },
    'art_refs/church_bg.png': {
        'church/bg_rose': ('636x660+20+32', 'g6.5'),
        'church/bg_win0': ('200x576+672+104', 'g8'),
        'church/bg_win1': ('196x576+896+104', 'g8'),
        'church/bg_win2': ('200x576+1112+104', 'g8'),
        'church/bg_organ': ('628x684+1340+28', 'g8'),
        'church/bg_statue': ('284x628+884+784', 'g8'),
        'church/bg_arch': ('392x800+1580+736', 'g8'),
        'church/bg_chandelier': ('352x436+28+808', 'g8'),
        'church/bg_banner0': ('212x448+408+908', 'g8'),
        'church/bg_banner1': ('212x448+620+908', 'g8'),
        'church/bg_shelf': ('316x420+1212+1000', 'g8'),
    },
    # Архиепископ из деталей: игра собирает его сама (голова, риза, низ-свиток, руки летают отдельно, скрижали кружат).
    'art_refs/church_boss.png': {
        'arch/head0': ('432x488+84+4', 'g8'),
        'arch/head1': ('500x512+572+4', 'g8'),
        'arch/head2': ('460x484+1080+20', 'g8'),
        'arch/torso0': ('688x392+64+500', 'g8'),
        'arch/torso1': ('630x390+790+504', 'g8'),
        'arch/hem': ('556x212+1424+636', 'g8'),
        'arch/handOpen': ('332x268+60+904', 'g8'),
        'arch/handFist': ('260x268+524+912', 'g8'),
        'arch/handPoint': ('284x260+916+912', 'g8'),
        'arch/handQuill': ('476x332+1280+872', 'g8'),
        'arch/scroll': ('740x196+76+1188', 'g8'),
        'arch/scrollEnd': ('812x132+32+1392', 'g8'),
        'arch/tab0': ('248x304+876+1212', 'g8'),
        'arch/tab1': ('256x308+1144+1212', 'g8'),
        'arch/tab2': ('248x308+1416+1212', 'g8'),
        'arch/core': ('256x276+1712+1228', 'g8'),
    },
    'art_refs/church_tiles.png': {
        'church/tile_top': ('336x340+52+396', '16x16'),
        'church/tile_fillA': ('344x344+436+392', '16x16'),
        'church/tile_fillB': ('344x344+828+392', '16x16'),
        'church/tile_cab': ('356x344+1220+392', '16x16'),
        'church/tile_foam': ('328x344+1624+392', '16x16'),
        # Края балкона на 16 точках выходят кривыми (ножки, шишки) — все три клетки из средней части.
        'church/tile_owL': ('280x188+384+816', '16x'),
        'church/tile_owM': ('280x188+384+816', '16x'),
        'church/tile_owR': ('280x188+384+816', '16x'),
        'church/tile_gooTop': ('288x284+1024+800', '16x16'),
        'church/tile_goo': ('284x280+1352+800', '16x16'),
        'church/tile_spike': ('284x280+1668+800', '16x16'),
        # У свечей нарисован тёмный фон — срезать его заливкой от верхнего края.
        '_clearTop': {'church/tile_spike'},
    },
    'art_refs/pizza_enemies.png': {
        # Враги — в родной сетке листа (шаг 'gN' — ровно N точек на пиксель, одинаковый для кадров одного врага):
        # при уменьшении до мелкого размера пропадали глаза и узор. Оливки-дроны — кодовые, мелкие (так задумано).
        'pizza/pineapple0': ('240x296+364+32', 'g7.4'),
        'pizza/pineapple1': ('284x296+680+32', 'g7.4'),
        'pizza/slime0': ('308x148+384+404', 'g7.4'),
        'pizza/slime1': ('300x216+708+344', 'g7.4'),
        'pizza/slimeS0': ('208x100+1124+452', 'g8.6'),
        'pizza/slimeS1': ('180x172+1380+380', 'g8.6'),
        'pizza/courier0': ('432x328+452+588', 'g7.8'),
        'pizza/courier1': ('428x328+1052+588', 'g7.8'),
        'shot/pineapple': ('124x136+680+944', 'x8'),
        # 'shot/olive' — кодовая: нарисованная тёмная оливка терялась на ночном небе в потоке пуль босса.
        'shot/cheese': ('84x136+1196+944', 'x8'),
    },
    'art_refs/pizza_boss.png': {
        '_spill': True,  # розового нет — кромку-мадженту у бровей и обводки можно чистить
        # Лица — в одном масштабе (клетка ≈7.45 точки), чтобы глаза и рот не прыгали между выражениями.
        'pizza/face0': ('328x296+120+140', '44x40'),
        'pizza/face1': ('308x380+600+148', '41x51'),
        'pizza/face2': ('296x280+1092+144', '40x38'),
        'pizza/face3': ('356x316+1552+160', '48x42'),
        'pizza/pep': ('216x216+308+720', '11x11'),
        'pizza/slice': ('500x532+740+556', '26x'),
    },
    'art_refs/pizza_props.png': {
        '_spill': True,
        'pizza/slicePlat': ('556x172+96+120', '28x'),
        'pizza/hub': ('304x304+752+36', '24x24'),
        'pizza/cheese0': ('320x116+1144+104', '16x'),
        'pizza/cheese1': ('328x188+1556+104', '16x'),
        'bg/pizza_planet': ('820x816+1064+260', '120x120'),
        'pizza/saw': ('280x276+120+516', '14x14'),
        'pizza/vent': ('408x176+528+564', '20x'),
    },
    'art_refs/pizza_tiles.png': {
        '_spill': True,
        'pizza/tile_top': ('320x316+88+224', '16x16'),
        'pizza/tile_fillA': ('320x316+464+224', '16x16'),
        'pizza/tile_fillB': ('324x316+840+224', '16x16'),
        'pizza/tile_cab': ('324x316+1216+224', '16x16'),
        'pizza/tile_foam': ('320x316+1600+224', '16x16'),
        'pizza/tile_owL': ('252x160+88+712', '16x'),
        'pizza/tile_owM': ('256x84+400+712', '16x'),
        'pizza/tile_owR': ('264x160+712+712', '16x'),
        'pizza/tile_gooTop': ('260x212+1032+700', '16x'),
        'pizza/tile_goo': ('260x204+1348+708', '16x'),
        'pizza/tile_spike': ('256x212+1664+700', '16x'),
    },
}


def clear_from_top(w, h, d, tol=70):
    """Сделать прозрачным тёмный фон, нарисованный внутри детали: заливка от тёмных точек верхнего края."""
    d = bytearray(d)
    px = lambda x, y: d[(y * w + x) * 4:(y * w + x) * 4 + 3]
    seeds = [(x, 0) for x in range(w) if d[x * 4 + 3] and sum(px(x, 0)) < 240]
    if not seeds:
        return bytes(d)
    ref = px(*seeds[0])
    seen, stack = set(seeds), list(seeds)
    while stack:
        x, y = stack.pop()
        d[(y * w + x) * 4 + 3] = 0
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and d[(ny * w + nx) * 4 + 3]:
                c = px(nx, ny)
                if sum(abs(c[i] - ref[i]) for i in range(3)) < tol:
                    seen.add((nx, ny)); stack.append((nx, ny))
    return bytes(d)


def build_drawn_assets(data):
    import pixel_grid
    for sheet_name, parts in DRAWN_SHEETS.items():
        sheet = src(sheet_name)
        if not os.path.exists(sheet):
            continue
        bg = tuple(pixel_grid.read_rgba(sheet, '4x4+10+10')[2][:3])
        spill = parts.get('_spill', False)
        for key, spec in parts.items():
            if key.startswith('_'):
                continue
            box, size = spec
            bw, bh = [int(v) for v in box.split('+')[0].split('x')]
            exact = size.startswith('g')
            if exact:
                cell, size = float(size[1:]), ''
            elif size.startswith('x'):
                cell = bh / int(size[1:])
            elif size.endswith('x'):
                cell = bw / int(size[:-1])
            else:
                tw, th = map(int, size.split('x'))
                cell = min(bw / tw, bh / th)
            # Кайму по умолчанию не чистим: у листов тёмная обводка, а розовое (хрючево, ноты, шипы) иначе дырявится
            # как «маджента». Листы без розового включают чистку ключом '_spill'.
            pw, ph, d = pixel_grid.part(sheet, box, cell, size, bg=bg, square=True, spill=spill or exact, exact=exact)
            out = os.path.join(TMP, key.replace('/', '_') + '.png')
            pixel_grid.save(out, pw, ph, d)
            # Близкие оттенки — в один цвет, одиночные пиксели-«соль» — убрать.
            magick(out, '-dither', 'None', '-colors', '24', 'PNG32:' + out)
            pw, ph, d = pixel_grid.read_rgba(out)
            d = pixel_grid.despeckle(pw, ph, d)
            if key in parts.get('_clearTop', ()):
                d = clear_from_top(pw, ph, d)
            pixel_grid.save(out, pw, ph, d)
            data[key] = b64(out)


def build_planet():
    out = os.path.join(TMP, 'planet.png')
    magick(src('neuro-planet-01.png'), '-filter', 'Box', '-resize', '900x360!', '-dither', 'None', '-colors', '64', 'PNG8:' + out)
    return out


def main():
    only = set(sys.argv[1:])
    data = {}
    data['bg/planet'] = b64(build_planet())
    build_ship_assets(data)
    build_drawn_assets(data)
    if os.path.exists(src('art_refs/logo.png')):
        data['ui/logo_art'] = b64(build_logo())
    for key, (name, gravity) in PANELS.items():
        data[key] = b64(build_panel(key, name, gravity))
    global BG
    for hero, spec in HERO_SPRITES.items():
        # Новый лист по шаблону (art_refs/<герой>_parts_v3.png) важнее старого.
        v3 = f'art_refs/{hero}_parts_v3.png'
        if os.path.exists(src(v3)):
            sheet, parts, BG = layout_sprites(hero, v3, V3_PATCHES.get(hero))
        else:
            sheet, parts = spec[:2]
            BG = spec[2] if len(spec) > 2 else '#00FF00'
        if not os.path.exists(src(sheet)):
            continue
        for part, (box, size, patches) in parts.items():
            data[f'hs/{hero}/{part}'] = b64(build_hero_part(hero, part, sheet, box, size, patches))
    # Пиксельные стикеры с листов из Figma (art_refs/stickers_v2_<N>.png) заменяют вырезанные из мемпаков.
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import sticker_layout as SL
    caps = {}
    for n in range(len(SL.SHEETS)):
        sheet = f'art_refs/stickers_v2_{n + 1}.png'
        if not os.path.exists(src(sheet)):
            continue
        for key, x, y in SL.frames(n):
            _, cap, color, _ = SL.all_stickers()[key]
            data['st/' + key] = b64(build_sticker_v2(sheet, x, y, key))
            caps[key] = [cap, color]
    build_pix_stickers(data, caps)
    for key, spec in STICKERS.items():
        if (only and key not in only) or key in caps:
            continue
        data['st/' + key] = b64(build_sticker(key, spec))
    with open(OUT, 'w') as f:
        f.write('// Сгенерировано tools/build_assets.py — не редактировать вручную.\n')
        f.write('GS.IMAGE_DATA = ')
        f.write(json.dumps(data, indent=0, ensure_ascii=False))
        f.write(';\n')
        f.write('GS.STICKER_CAPS = ' + json.dumps(caps, ensure_ascii=False) + ';\n')
    total = os.path.getsize(OUT)
    print(f'{len(data)} images, {total // 1024} KB -> {OUT}')
    print('tmp:', TMP)


if __name__ == '__main__':
    main()
