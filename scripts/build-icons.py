#!/usr/bin/env python3
"""Собирает облегчённые шрифты иконок Font Awesome: только те иконки, что есть в коде и в базе.

Запуск вручную (нужен Python с fonttools и brotli):  python3 scripts/build-icons.py [файл-со-списком-иконок-из-базы]
Результат: public/legacy/vendor/fa/webfonts/fa-*-sub.woff2 и два файла стилей в public/legacy/vendor/fa/css/:
  fa-lite.css — только используемые иконки (грузится сразу, маленький);
  fa-site.css — все иконки Font Awesome (догружается после показа страницы).

Полные шрифты остаются запасным вариантом: если в админке выбрать иконку, которой нет в облегчённом
наборе, браузер сам догрузит полный файл — иконка покажется, просто чуть позже.
"""
import re, subprocess, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
fa = root / 'public/legacy/vendor/fa'
css = (fa / 'css/all.min.css').read_text()

used = set()
for base, exts in [('src', ('.ts', '.tsx', '.css')), ('public/legacy/js', ('.js',)), ('public/legacy/calculator', ('.js',)), ('public/legacy/css', ('.css',))]:
    for p in (root / base).rglob('*'):
        if p.is_file() and p.suffix in exts and 'vendor' not in p.parts:
            used.update(re.findall(r'\bfa-[a-z0-9-]+', p.read_text(errors='ignore')))
for extra in sys.argv[1:]:
    used.update(re.findall(r'\bfa-[a-z0-9-]+', pathlib.Path(extra).read_text(errors='ignore')))

# имя иконки → код символа
codes = {}
for names, code in re.findall(r'((?:\.fa-[a-z0-9-]+:before,?)+)\{content:"\\([0-9a-f]+)"\}', css):
    for n in re.findall(r'\.(fa-[a-z0-9-]+):before', names):
        codes[n] = code
cps = sorted({codes[n] for n in used if n in codes}, key=lambda c: int(c, 16))
print(f'иконок в проекте: {len(cps)}')

uni = ','.join('U+' + c for c in cps)
faces = []
for fam, weight, file in [('Font Awesome 6 Free', 900, 'fa-solid-900'), ('Font Awesome 6 Free', 400, 'fa-regular-400'), ('Font Awesome 6 Brands', 400, 'fa-brands-400')]:
    out = fa / f'webfonts/{file}-sub.woff2'
    subprocess.run(['pyftsubset', str(fa / f'webfonts/{file}.ttf'), f'--unicodes={uni}', '--flavor=woff2', '--ignore-missing-unicodes', f'--output-file={out}'], check=True)
    from fontTools.ttLib import TTFont
    want = {int(c, 16) for c in cps}
    have = sorted(c for c in TTFont(out).getBestCmap().keys() if c in want)
    rng = ','.join('U+%x' % c for c in have)
    print(file, len(have), 'иконок,', out.stat().st_size // 1024, 'КБ')
    if have:
        faces.append(f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{weight};font-display:swap;src:url(../webfonts/{file}-sub.woff2) format("woff2");unicode-range:{rng}}}')

# более поздние @font-face имеют приоритет для своих символов → берётся облегчённый файл
(fa / 'css/fa-site.css').write_text('/* Сгенерировано scripts/build-icons.py: all.min.css + облегчённые шрифты для используемых иконок */\n' + css + '\n' + '\n'.join(faces) + '\n')

# облегчённые стили: служебные правила + только используемые иконки
rules = re.findall(r'[^{}]+\{[^{}]*\}', re.sub(r'@font-face\{[^}]*\}', '', re.sub(r'/\*.*?\*/', '', css, flags=re.S)))
lite = []
for r in rules:
    m = re.match(r'((?:\.fa-[a-z0-9-]+:before,?)+)\{content:"\\([0-9a-f]+)"\}$', r.strip())
    if m:
        keep = [n for n in re.findall(r'\.(fa-[a-z0-9-]+):before', m.group(1)) if n in used]
        if keep:
            lite.append(','.join('.%s:before' % n for n in keep) + '{content:"\\%s"}' % m.group(2))
    elif not r.strip().startswith('@'):
        lite.append(r.strip())
keyframes = re.findall(r'@keyframes [a-z-]+\{(?:[^{}]*\{[^{}]*\})+\}', css)
(fa / 'css/fa-lite.css').write_text('/* Сгенерировано scripts/build-icons.py: только используемые иконки */\n' + ''.join(lite) + ''.join(dict.fromkeys(keyframes)) + '\n' + '\n'.join(faces) + '\n')
print('fa-lite.css', (fa / 'css/fa-lite.css').stat().st_size // 1024, 'КБ')
