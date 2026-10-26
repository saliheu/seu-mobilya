"""Kazınan ürün verisini (products.json) kendi şemamıza çevirir.

Kullanım: python tools/convert.py <products.json> <props.json> <çıktı klasörü>
Çıktı: products.json (tasarımlar), rules.json (sınıf başına kurallar), ral.json
"""
import json
import os
import sys

SRC, PROPS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
raw = json.load(open(SRC, encoding='utf-8'))
props = json.load(open(PROPS, encoding='utf-8'))

FAMILY = {
    'StandardUnitI': 'cabinet', 'StandardUnitC': 'cabinet', 'StandardUnitF': 'cabinet',
    'StandardUnitG': 'cabinet', 'StandardUnitH': 'cabinet', 'MultiSideA': 'cabinet',
    'WallMountedC': 'cabinet', 'WallMountedD': 'cabinet', 'WallMountedF': 'cabinet',
    'SimpleShapeA': 'cabinet', 'DeskA': 'desk',
    'CornerA': 'corner', 'CornerB': 'corner', 'CornerC': 'corner',
    'TableD': 'table', 'TableE': 'table', 'BedB': 'bed',
    'SimpleBench': 'bench', 'BenchC': 'bench',
    'LShapedA': 'sofa', 'SofaC': 'sofa', 'SofaD': 'sofa',
    'AccessoryA': 'mirror', 'SimpleShapeB': 'shape', 'SimpleShapeC': 'shape',
    'SimpleShapeD': 'shape', 'SimpleShapeE': 'shape',
}
WALL = {'WallMountedC', 'WallMountedD', 'WallMountedF', 'CornerB'}
KNOWN_MATERIALS = {93, 259, 1, 5, 6, 4, 2, 3, 7, 8, 9, 10, 157, 21, 20, 18, 17, 16, 15, 13, 12, 167, 166, 164, 163}
WOODS = {167, 166, 164, 163, 16, 15, 13, 12, 21, 20, 18, 17}
LEG_KINDS = {1, 5, 6, 11, 16, 20}

NAMES = ['Çınar', 'Ladin', 'Ihlamur', 'Sedir', 'Akasya', 'Gürgen', 'Kestane', 'Ardıç', 'Söğüt', 'Defne',
         'Zeytin', 'Lale', 'Papatya', 'Manolya', 'Fesleğen', 'Lavanta', 'Mersin', 'Erguvan', 'Nilüfer', 'Begonya',
         'Ada', 'Liman', 'Kumsal', 'Rüzgar', 'Bulut', 'Yakamoz', 'Gökkuşağı', 'Pusula', 'Mavi', 'Toprak']

ROOM_TITLES = {
    'living-room': 'Oturma Odası', 'dining-room': 'Yemek Odası', 'entryway': 'Antre', 'bedroom': 'Yatak Odası',
    'bathroom': 'Banyo', 'kitchen': 'Mutfak', 'teen-room': 'Genç Odası', 'office': 'Ofis',
    'decor': 'Dekoratif Raf', 'simple-shapes': 'Basit Şekiller',
}


def cls_of(i):
    return (i.get('cls') or '').replace('\\', '/').split('/')[-1]


def num(v, d=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def finish(part, fallback=6):
    if not isinstance(part, dict):
        return {'material': fallback, 'color': None}
    ral = part.get('ral')
    mat = part.get('material')
    if isinstance(ral, str) and ral.startswith('#'):
        return {'material': 157, 'color': ral.upper()}
    if mat in KNOWN_MATERIALS:
        return {'material': mat, 'color': '#E8E4DA' if mat == 157 else None}
    return {'material': fallback, 'color': None}


def fabric(features):
    fab = (features or {}).get('fabrics') or {}
    for v in fab.values():
        if isinstance(v, dict) and v.get('material') is not None:
            return {'material': 1001 + int(v['material']) % 8, 'color': None}
    return {'material': 1002, 'color': None}


def door_kind(t):
    if t in (8, 9, 10):
        return 'glass'
    if t == 6:
        return 'flapDown'
    if t == 7:
        return 'flapUp'
    return 'door'


def hinge(t):
    return {3: 'left', 9: 'left', 4: 'right', 10: 'right'}.get(t, 'double')


def sides_for(type_slug):
    if type_slug.startswith('quadruple'):
        return 4
    if type_slug.startswith('triple'):
        return 3
    if type_slug.startswith('double'):
        return 2
    return 1


def handle_kind(parts):
    for key in ('door', 'drawer'):
        for it in (parts.get(key) or {}).get('items', []):
            t = it.get('handle_type')
            if t == 4:
                return 'knob'
            if t == 5:
                return 'bar'
            if t == 3:
                return 'none'
    return 'none'


def base_of(parts):
    feet = parts.get('feet') or {}
    base = parts.get('base') or {}
    kind = feet.get('kind')
    h = num(feet.get('height'))
    if kind == 4 or (kind in (None, 17) and num(base.get('height')) > 0):
        return {'kind': 'plinth', 'height': num(base.get('height')) or h or 100}
    if kind == 0:
        return {'kind': 'glides', 'height': 4}
    if kind in (8, 10):
        return {'kind': 'wheels', 'height': h or 90}
    if kind in LEG_KINDS:
        return {'kind': 'legs', 'height': h or 100}
    return {'kind': 'none', 'height': 0}


def top_of(parts):
    ceil = parts.get('ceil') or {}
    lips = ceil.get('lips') or {}
    curve = ceil.get('curve') or {}
    return {
        'thickness': num(ceil.get('thickness'), 18) or 18,
        'overhang': {'left': num(lips.get('left')), 'right': num(lips.get('right')),
                     'front': num(lips.get('front')), 'back': num(lips.get('behind'))},
        'radius': 60 if curve.get('active') else 0,
    }


def sections_of(p, parts):
    backs = {(b.get('section_index'), b.get('compartment_index')) for b in (parts.get('backboard') or {}).get('items', [])}
    front_default = None
    out = []
    for si, s in enumerate(p.get('sections') or []):
        comps = []
        for ci, c in enumerate(s.get('compartments') or []):
            add = c.get('addons') or {}
            hang = add.get('dress_hanger') or []
            vd = add.get('vertical_divider') or {}
            pct = num(vd.get('percentage'))
            comps.append({
                'height': num(c.get('height')),
                'back': (si, ci) in backs,
                'divider': round(pct / 100, 3) if vd.get('active') and 0 < pct < 100 else None,
                'hanger': any(isinstance(h, dict) and h.get('active') for h in hang) if isinstance(hang, list) else False,
            })
        out.append({'width': num(s.get('width')), 'compartments': comps, 'fronts': [], 'knee': len(comps) == 0})
    k = len(out)

    def add_front(si, f, it):
        nonlocal front_default
        fin = finish(it, None)
        if fin['material'] is not None:
            f['finish'] = fin
            front_default = front_default or fin
        out[si]['fronts'].append(f)

    for it in (parts.get('door') or {}).get('items', []):
        si = it.get('section_index')
        if si is None or si >= k or not out[si]['compartments']:
            continue
        n = len(out[si]['compartments'])
        start = int(it.get('compartment_start', 0))
        end = int(it.get('compartment_end', start))
        if start >= n:
            continue
        add_front(si, {'start': start, 'end': min(end, n - 1), 'kind': door_kind(it.get('door_type')),
                       'hinge': hinge(it.get('door_type')), 'mirror': bool(it.get('door_mirror')),
                       'side': 'front' if it.get('side', 1) == 1 else 'back'}, it)
    for it in (parts.get('drawer') or {}).get('items', []):
        si, ci = it.get('section_index'), it.get('compartment_index')
        if si is None or ci is None or si >= k or ci >= len(out[si]['compartments']):
            continue
        add_front(si, {'start': ci, 'end': ci, 'kind': 'drawer', 'hinge': 'left', 'mirror': False,
                       'side': 'front' if it.get('side', 1) == 1 else 'back'}, it)
    # Çakışan ön yüzleri ayıkla (ilk gelen kalır).
    for s in out:
        used, keep = set(), []
        for f in s['fronts']:
            span = {(f['side'], c) for c in range(f['start'], f['end'] + 1)}
            if span & used:
                continue
            used |= span
            keep.append(f)
        s['fronts'] = keep
    return out, front_default


def elevation_for(c, h, fam):
    if c in WALL:
        return 1400 if c == 'CornerB' else max(150, min(750, 2200 - h))
    if fam in ('mirror', 'shape') and c != 'SimpleShapeE':
        return max(50, 1500 - h / 2)
    return 0


def convert(i):
    c = cls_of(i)
    fam = FAMILY[c]
    p = i.get('product') or {}
    parts = p.get('parts') or {}
    feats = p.get('features') or {}
    ov = p.get('overall') or {}
    w, h, d = num(ov.get('width')), num(ov.get('height')), num(ov.get('depth'))
    if c == 'SimpleShapeC':
        w = h = num(ov.get('diameter'))
        d = 18
    if c == 'SimpleShapeD':
        w, h, d = num(ov.get('diameter')), num(ov.get('small_diameter')), 18
    if c == 'SimpleShapeE':
        cube = parts.get('cube') or {}
        w, d = num(cube.get('width'), 350), num(cube.get('depth'), 350)
        h = num(cube.get('height'), 350) * num(cube.get('count'), 3)
    if fam in ('mirror',) or c in ('SimpleShapeB',):
        d = 18

    carcass = finish(parts.get('pillar') or parts.get('rectangle') or parts.get('circle') or parts.get('ellipse')
                     or parts.get('seat_frame') or parts.get('cover_left') or parts.get('ceil') or parts.get('cube'))
    top = finish(parts.get('ceil') or parts.get('cover_ceil'), carcass['material'])
    sections, front = sections_of(p, parts)
    feet_mat = (parts.get('feet') or {}).get('material')
    accent = {'material': feet_mat if feet_mat in WOODS else 167, 'color': None}
    if fam == 'table' and (parts.get('feet') or {}).get('kind') not in LEG_KINDS:
        accent = finish(parts.get('feet_board') or parts.get('rocker'), 167)

    design = {
        'family': fam,
        'overall': {'width': w, 'height': h, 'depth': d},
        'thickness': num((parts.get('pillar') or {}).get('thickness'), 18) or 18,
        'top': top_of(parts),
        'base': base_of(parts),
        'elevation': elevation_for(c, h, fam),
        'sides': sides_for(i['type']),
        'handle': handle_kind(parts),
        'sections': sections,
        'finish': {'carcass': carcass, 'front': front or carcass, 'top': top, 'accent': accent, 'fabric': fabric(feats)},
    }
    if fam == 'corner':
        design['corner'] = {'wingX': num(ov.get('width_p'), w * 0.45), 'wingZ': num(ov.get('depth_p'), d * 0.4)}
        if not sections:
            design['sections'] = [{'width': 0, 'compartments': [{'height': 0, 'back': True, 'divider': None, 'hanger': False}],
                                   'fronts': [], 'knee': False}]
    if fam == 'sofa':
        chaise = {'width': num(ov.get('width_p')), 'depth': num(ov.get('depth_p'))} if c == 'SofaC' else None
        design['sofa'] = {'armrests': 'arm_rest' in parts or 'arm' in parts, 'backrest': 'back_rest' in parts, 'chaise': chaise}
        design['base'] = {'kind': 'legs', 'height': num((parts.get('feet') or {}).get('height'), 150) or 150}
    if fam == 'bed':
        cl, cr = parts.get('cover_left') or {}, parts.get('cover_right') or {}
        hb = max(num(cl.get('height')) if cl.get('active') else 0, num(cr.get('height')) if cr.get('active') else 0)
        bd = parts.get('bed_drawer') or {}
        design['bed'] = {'headboard': hb or 350, 'footboard': 0, 'drawers': bool((bd.get('front') or {}).get('active')),
                         'mattress': True, 'rail': num((parts.get('rocker') or {}).get('height'), 240)}
        design['base'] = {'kind': 'none', 'height': 0}
    if fam == 'bench':
        design['bench'] = {'cushion': bool((parts.get('mattress') or {}).get('active')), 'boxed': c == 'BenchC',
                           'stretcher': num((parts.get('rocker') or {}).get('height'), 96)}
    if fam == 'table':
        legs = 'square' if (parts.get('feet') or {}).get('kind') in LEG_KINDS else 'panel'
        design['table'] = {'legs': legs, 'apron': num((parts.get('rocker') or {}).get('height')) if 'rocker' in parts else 0}
        design['base'] = {'kind': 'none', 'height': 0}
    if fam == 'shape':
        kind = {'SimpleShapeB': 'rect', 'SimpleShapeC': 'circle', 'SimpleShapeD': 'ellipse', 'SimpleShapeE': 'cubes'}[c]
        count = int(num((parts.get('cube') or {}).get('count'), 3)) if kind == 'cubes' else 1
        design['shape'] = {'kind': kind, 'count': count}
    if fam == 'mirror':
        pos = (feats.get('mirror') or {}).get('position') or {}
        design['mirror'] = {'frame': num(pos.get('top'), 80) or 80}
    return design


def rules_of(c, r):
    o = r.get('overall') or {}

    def rng(key, lo, hi):
        v = o.get(key)
        v = v if isinstance(v, dict) else {}
        return {'min': num(v.get('min'), lo) or lo, 'max': num(v.get('max'), hi) or hi}

    width, height, depth = rng('width', 200, 3600), rng('height', 200, 3600), rng('depth', 150, 1800)
    if c in ('SimpleShapeC', 'SimpleShapeD'):
        width = height = rng('diameter', 500, 1800)
    cube = r.get('cube') or {}
    if c == 'SimpleShapeE':
        width = {'min': num((cube.get('width') or {}).get('min'), 300), 'max': num((cube.get('width') or {}).get('max'), 1200)}
        depth = {'min': num((cube.get('depth') or {}).get('min'), 200), 'max': num((cube.get('depth') or {}).get('max'), 1000)}
        height = {'min': 500, 'max': 7000}
    if FAMILY.get(c) == 'mirror' or c in ('SimpleShapeB', 'SimpleShapeC', 'SimpleShapeD'):
        depth = {'min': 18, 'max': 18}
    sec = r.get('section') or {}
    feet = r.get('feet') or {}
    door = r.get('door') or {}
    lips = (r.get('ceil') or {}).get('lips') or {}
    matt = r.get('mattress') or {}
    back = r.get('back_rest') or {}
    arm = r.get('arm_rest') or {}

    def steps(lst, default):
        return [{'max': num(x.get('max'), 9999), 'count': int(x.get('count'))} for x in lst] if lst else default

    margin = num(feet.get('margin'), 50)
    return {
        'overall': {'width': width, 'height': height, 'depth': depth},
        'elevation': {'min': 0, 'max': 2400},
        'section': {'min': num(sec.get('min_width'), 200), 'max': num(sec.get('max_width'), 2100)},
        'compartment': {'minHeight': num((r.get('compartment') or {}).get('min_height'), 100)},
        'base': {'min': num(feet.get('min'), 50), 'max': num(feet.get('max'), 200)},
        'overhangMax': num(lips.get('max'), 500),
        'thicknesses': [18],
        'topThicknesses': [18, 36],
        'back': {'thickness': 8},
        'front': {'gapX': num(door.get('margin_left_right'), 2.6), 'gapY': num(door.get('margin_top_bottom'), 2.7),
                  'drawerGap': num((r.get('drawer') or {}).get('margin'), 4)},
        'door': {'maxWidth': 600},
        'drawer': {'min': 100, 'max': 700},
        'legs': {'small': num(feet.get('small_side'), 45.5), 'large': num(feet.get('large_side'), 75.5),
                 'inset': margin if margin > 10 else 50},
        'sofa': {'seatHeight': num(matt.get('height'), 250), 'cushionGap': num(matt.get('gap'), 10),
                 'backDepth': num(matt.get('behind_depth'), 120), 'armExtra': num(arm.get('extra_height'), 300),
                 'backExtra': num(back.get('extra_height'), 270),
                 'seats': steps(matt.get('count'), [{'max': 1200, 'count': 1}, {'max': 1800, 'count': 2},
                                                    {'max': 2700, 'count': 3}, {'max': 9999, 'count': 4}]),
                 'legs': steps(feet.get('count'), [{'max': 1000, 'count': 2}, {'max': 2000, 'count': 3},
                                                   {'max': 9999, 'count': 4}])},
        'bed': {'mattress': num(matt.get('height'), 250), 'railMin': num((r.get('rocker') or {}).get('min_height'), 150)},
        'cubes': {'count': {'min': num((cube.get('count') or {}).get('min'), 2), 'max': num((cube.get('count') or {}).get('max'), 7)}},
    }


products, rules, types, seen, counter = [], {}, {}, {}, {}
for idx, i in enumerate(raw['items']):
    c = cls_of(i)
    if c not in FAMILY or not i.get('product'):
        continue
    if i['id'] in seen:
        if i['room'] not in seen[i['id']]['rooms']:
            seen[i['id']]['rooms'].append(i['room'])
        continue
    rules.setdefault(c, rules_of(c, i['product'].get('rules') or {}))
    t = types.setdefault(i['type'], {'slug': i['type'], 'title': i['typeTitle'][0].upper() + i['typeTitle'][1:],
                                     'family': FAMILY[c], 'ruleSet': c, 'rooms': []})
    if i['room'] not in t['rooms']:
        t['rooms'].append(i['room'])
    counter[i['type']] = counter.get(i['type'], 0) + 1
    name = f"{NAMES[(idx * 7 + counter[i['type']]) % len(NAMES)]} {t['title']}"
    prod = {'id': f"seu-{1000 + len(products)}", 'name': name, 'type': i['type'], 'ruleSet': c,
            'rooms': [i['room']], 'premium': bool(i.get('premium')), 'design': convert(i)}
    seen[i['id']] = prod
    products.append(prod)

os.makedirs(OUT, exist_ok=True)
json.dump({'rooms': [{'slug': k, 'title': v} for k, v in ROOM_TITLES.items()], 'types': list(types.values()),
           'products': products},
          open(os.path.join(OUT, 'products.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(rules, open(os.path.join(OUT, 'rules.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
rals = [{'code': r['code'], 'hex': r['hex'].upper()} for cat in props['props']['json']['data'][0]['ralCategories']
        for r in cat['rals']]
json.dump(rals, open(os.path.join(OUT, 'ral.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('products', len(products), 'types', len(types), 'rule sets', len(rules), 'rals', len(rals))
