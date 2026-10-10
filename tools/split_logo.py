"""Split the traced logo SVG into its letter pieces (outer contour + any holes it contains) -> motion/logo_pieces.json"""
import re, json, sys
svg = open(sys.argv[1]).read()
vb = list(map(float, re.search(r'viewBox="([^"]+)"', svg).group(1).split()))
d = re.search(r' d="([^"]+)"', svg).group(1)
subs = ['M' + s for s in d.split('M') if s.strip()]
def bbox(s):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', s))); xs, ys = nums[0::2], nums[1::2]
    return [min(xs), min(ys), max(xs), max(ys)]
items = [{'d': s, 'bb': bbox(s)} for s in subs]
area = lambda b: (b[2] - b[0]) * (b[3] - b[1])
inside = lambda a, b: a[0] >= b[0] and a[1] >= b[1] and a[2] <= b[2] and a[3] <= b[3]
pieces = []
for it in sorted(items, key=lambda i: -area(i['bb'])):
    host = next((p for p in pieces if inside(it['bb'], p['bb'])), None)
    if host: host['d'] += ' ' + it['d']
    else: pieces.append(dict(it))
pieces.sort(key=lambda p: (p['bb'][0]))
for p in pieces: p['c'] = [(p['bb'][0] + p['bb'][2]) / 2, (p['bb'][1] + p['bb'][3]) / 2]
json.dump({'w': vb[2], 'h': vb[3], 'pieces': pieces}, open(sys.argv[2], 'w'))
print(len(pieces), 'pieces', [round(p['c'][0]) for p in pieces])
