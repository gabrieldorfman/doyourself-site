#!/usr/bin/env python3
"""
Do Yourself — monta a pasta de publicação (repositório do Vercel) a partir do projeto.

    python3 tools/paginas.py          # gera as páginas internas
    python3 tools/publicar.py ../deploy

· home-nova.html vira index.html (e todo link para ela vira "/")
· CSS e JS ganham ?v=<data> para o navegador não usar a versão antiga
· Esboços e arquivos de trabalho ficam de fora (index Figma, versão Nio, css/js só deles)
· vercel.json e .git da pasta de destino não são tocados
"""
import re
import shutil
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = Path(sys.argv[1] if len(sys.argv) > 1 else RAIZ.parent / 'deploy').resolve()
VERSAO = str(int(time.time()))

PAGINAS = ['contratar.html', 'energia.html', 'combo.html', 'internet-fibra.html', 'celular.html', 'aplicativos.html', 'sobre.html']
PASTAS_PAGINAS = ['internet-fibra', 'celular']
ASSETS = ['system.css', 'system.js', 'ui', 'motion', 'layout/layout.css', 'layout/layout.js', 'moments/moments.js', 'moments/lib.js', 'moments/index.json', 'moments/photo-chapters']
FORA = {'css/home.css', 'css/nio.css', 'js/cep.js', 'js/simulador.js', 'js/vitrine.js'}


def tratar(html):
    html = re.sub(r'href="/?home-nova\.html"', 'href="/"', html)
    html = re.sub(r'((?:href|src)="/?(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=\d+)?"', rf'\1?v={VERSAO}"', html)
    return html


def copiar_pasta(nome):
    origem = RAIZ / nome
    for f in origem.rglob('*'):
        if f.is_dir():
            continue
        rel = f.relative_to(RAIZ).as_posix()
        if rel in FORA:
            continue
        alvo = DESTINO / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, alvo)


def main():
    assert (DESTINO / 'vercel.json').exists(), f'{DESTINO} não parece a pasta de publicação (sem vercel.json)'
    for pasta in ['css', 'js', 'img', 'api']:
        copiar_pasta(pasta)
    # kit da Taste Skill (versão 2): só o que as páginas usam
    for item in ASSETS:
        origem = RAIZ / 'assets' / item
        if origem.is_dir():
            for f in origem.rglob('*'):
                if f.is_file() and '_demo' not in f.parts and not f.name.endswith('.html'):
                    alvo = DESTINO / f.relative_to(RAIZ); alvo.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(f, alvo)
        else:
            alvo = DESTINO / 'assets' / item; alvo.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(origem, alvo)
    (DESTINO / 'index.html').write_text(tratar((RAIZ / 'home-nova.html').read_text(encoding='utf-8')), encoding='utf-8')
    for p in PAGINAS:
        (DESTINO / p).write_text(tratar((RAIZ / p).read_text(encoding='utf-8')), encoding='utf-8')
    for pasta in PASTAS_PAGINAS:
        for f in (RAIZ / pasta).rglob('*.html'):
            alvo = DESTINO / f.relative_to(RAIZ)
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(tratar(f.read_text(encoding='utf-8')), encoding='utf-8')
    print('publicação montada em', DESTINO, '· versão', VERSAO)


if __name__ == '__main__':
    main()
