#!/usr/bin/env python3
"""
Do Yourself — gerador das páginas internas.

Copia da home (home-nova.html) o <head> comum, o menu, o rodapé, a barra fixa e os
blocos reaproveitados (seções de planos, simulador, FAQ…), e monta cada página com
o conteúdo próprio dela. Rodar sempre que mudar a home ou o texto de uma página:

    python3 tools/paginas.py

Gera: energia.html · combo.html · internet-fibra.html · celular.html
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
HOME = (RAIZ / 'home-nova.html').read_text(encoding='utf-8')


def entre(ini, fim, texto=HOME, incluir_fim=True):
    a = texto.index(ini)
    b = texto.index(fim, a) + (len(fim) if incluir_fim else 0)
    return texto[a:b]


def secao(marcador):
    """Seção inteira da home a partir do comentário <!-- ============ X ============ -->."""
    return entre(f'<!-- ============ {marcador} ============ -->', '</section>')


def faq(painel):
    """Perguntas de uma aba do FAQ da home."""
    bloco = entre(f'<div class="faq2__lista" role="tabpanel" id="{painel}"', '\n        </div>')
    return bloco[bloco.index('>') + 1:]


HEADER = entre('  <!-- ============ HEADER ============ -->', '</header>')
RODAPE = entre('  <!-- ============ RODAPÉ', '</footer>')
FIXOS = entre('  <div class="barra-cep"', '<script src="js/config.js">', incluir_fim=False)
HEAD_TEMA = entre('  <script>\n    (function () {', '</script>')
CSS = entre('  <link rel="preconnect" href="https://fonts.googleapis.com">', '<link rel="stylesheet" href="css/inicio.css">')
HERO_FORM = entre('          <form class="consulta-cep" data-hero-cep', '</form>')
PILHA = entre('        <div class="hero2__visual"', '</p>\n        </div>')
CTA = secao('CTA FINAL')
OG_IMG = 'https://doyourself-site.vercel.app/img/og-doyourself.png'


def cab(eyebrow, cor, titulo, lead='', id_=''):
    lid = f' id="{id_}"' if id_ else ''
    return f'''        <header class="cab surgir">
          <span class="dy-eyebrow{f" dy-eyebrow--{cor}" if cor else ""}">{eyebrow}</span>
          <h2 class="dy-h2"{lid}>{titulo}</h2>
          {f'<p class="dy-lead">{lead}</p>' if lead else ''}
        </header>'''


def hero(nome, cor, eyebrow, h1, lead, origem, visual, provas):
    form = HERO_FORM.replace('<form class="consulta-cep" data-hero-cep', f'<form class="consulta-cep" data-hero-cep data-origem="{origem}"')
    form = form.replace('contratar.html?origem=home#buscar-cep', f'contratar.html?origem={origem}#buscar-cep')
    itens = ''.join(f'<li><img src="img/icones/verificado.svg" alt="">{p}</li>' for p in provas)
    return f'''    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--{cor}" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--{cor}">{eyebrow}</span>
            <h1 class="dy-display" id="hero-titulo">{h1}</h1>
            <p class="dy-lead">{lead}</p>
{form}
            <ul class="hero2__provas" aria-label="Vantagens">{itens}</ul>
          </div>
{visual}
        </div>
      </div>
    </section>
'''


def faq_secao(titulo, painel, id_='duvidas'):
    return f'''    <!-- ============ DÚVIDAS ============ -->
    <section class="secao" id="{id_}" aria-labelledby="faq-titulo">
      <div class="container faq2" data-faq>
{cab('Dúvidas frequentes', '', titulo, id_='faq-titulo')}
        <div class="faq2__lista" role="tabpanel">{faq(painel)}
      </div>
    </section>
'''


def cta(origem, titulo, lead):
    c = CTA.replace('contratar.html?origem=home', f'contratar.html?origem={origem}')
    c = re.sub(r'<h2 class="dy-h2" id="cta-titulo">.*?</h2>', f'<h2 class="dy-h2" id="cta-titulo">{titulo}</h2>', c)
    c = re.sub(r'<p class="dy-lead">.*?</p>', f'<p class="dy-lead">{lead}</p>', c, count=1)
    return '    ' + c + '\n'


def passos(cor, itens):
    lis = ''.join(f'''
          <li class="passo surgir" style="--atraso:{.05 + i * .1:.2f}s">
            <span class="passo__n">{i + 1}</span>
            <h3 class="dy-h3">{t}</h3>
            <p class="dy-texto">{d}</p>
          </li>''' for i, (t, d) in enumerate(itens))
    return f'<ol class="passos3 passos3--{cor}">{lis}\n        </ol>'


def cards_link(itens, cor):
    """Cards que levam a páginas filhas (rota pronta → página; senão atalho ou 'em breve')."""
    cs = ''.join(f'''
          <a class="pg-card pg-card--{cor} surgir" data-rota="{rota}" style="--atraso:{.05 + i * .08:.2f}s">
            <span class="pg-card__ico"><img src="img/icones/{ico}" alt=""></span>
            <b>{t}</b><span>{d}</span>
            <span class="pg-card__ir" data-rota-tag>Ver mais →</span>
          </a>''' for i, (rota, ico, t, d) in enumerate(itens))
    return f'<div class="pg-cards">{cs}\n        </div>'


def absolutos(html):
    """Links e arquivos a partir da raiz do site: as páginas podem morar em pastas (/internet-fibra/casa)."""
    html = re.sub(r'(href|src)="(?!(?:https?:|/|#|mailto:|tel:|data:|javascript:))', r'\1="/', html)
    return html.replace('url(../img/', 'url(/img/')


def pagina(slug, titulo, descricao, corpo, scripts_extra='', css_extra='', body_attrs='', classe=''):
    head = f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{titulo}</title>
  <meta name="description" content="{descricao}">
  <meta name="theme-color" content="#f6f5f1">
  <link rel="icon" href="img/marca/dy-selo-verde.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Do Yourself">
  <meta property="og:title" content="{titulo}">
  <meta property="og:description" content="{descricao}">
  <!-- [AO TROCAR DE DOMÍNIO] atualizar o endereço completo da imagem -->
  <meta property="og:image" content="{OG_IMG}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
{HEAD_TEMA}
{CSS}
  <link rel="stylesheet" href="css/paginas.css">{f'{chr(10)}  <link rel="stylesheet" href="css/{css_extra}.css">' if css_extra else ''}
</head>
<body class="pg-inicio pg-{slug.replace('/', '-')}{(' ' + classe) if classe else ''}"{body_attrs}>
  <!-- Página gerada por tools/paginas.py — edite o gerador, não este arquivo. -->
  <a class="sr-only" href="#conteudo">Pular para o conteúdo</a>

{HEADER}

  <main id="conteudo">

{corpo}
  </main>

{RODAPE}

{FIXOS}<script src="js/config.js"></script>
  <script src="js/menu.js"></script>
  <script src="js/main.js"></script>
  <script src="js/ofertas.js"></script>
  <script src="js/vendor/gsap.min.js"></script>
  <script src="js/planos.js"></script>
  <script src="js/inicio.js"></script>
  <script src="js/paginas.js"></script>{scripts_extra}
</body>
</html>
'''
    # o item ativo no menu é marcado pelo menu.js; aqui só tiramos o "Início" fixo da home
    head = head.replace('<li><a class="nav__link" href="home-nova.html" aria-current="page">Início</a></li>', '<li><a class="nav__link" href="home-nova.html">Início</a></li>')
    destino = RAIZ / f'{slug}.html'
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(absolutos(head), encoding='utf-8')
    print('gerada:', f'{slug}.html')


# =====================================================================
#  ENERGIA SOLAR POR ASSINATURA
# =====================================================================
sim = entre('        <div class="simula surgir"', '</a>\n        </div>')
energia = hero(
    'Energia Solar', 'energia', 'Energia Solar por Assinatura',
    'Conta de luz <span class="realce realce--energia">mais barata</span>, sem placa no telhado.',
    'Pague <strong>até 20% menos</strong> na conta de luz, sem obra e sem investimento. E ainda receba <strong>10% de cashback via PIX na sua conta bancária</strong>.',
    'energia',
    f'        <div class="hero2__visual">\n{sim}\n        </div>',
    ['Até 20% de desconto', 'Mesma distribuidora', 'A partir de R$ 150 de conta'],
)
energia += f'''
    <!-- ============ COMO FUNCIONA ============ -->
    <section class="secao" id="como-funciona" aria-labelledby="cf-titulo">
      <div class="container">
{cab('Como funciona', 'energia', 'Do sol até a sua conta, em três passos', id_='cf-titulo')}
        {passos('energia', [
            ('A usina gera', 'Uma usina solar parceira produz energia limpa e manda para a rede da sua distribuidora.'),
            ('Os créditos abatem a sua conta', 'A energia vira créditos que descontam o valor da sua conta de luz todo mês.'),
            ('Você paga menos e ganha', 'A conta fica mais barata e ainda volta 10% do novo valor, uma vez, via PIX.'),
        ])}
      </div>
    </section>

    <!-- ============ O QUE MUDA ============ -->
    <section class="secao secao--alt" aria-labelledby="muda-titulo">
      <div class="container">
{cab('Sem surpresa', 'energia', 'O que muda e o que continua igual', id_='muda-titulo')}
        <div class="muda2">
          <div class="muda2__col muda2__col--sim surgir"><h3 class="dy-h3">Muda</h3><ul>
            <li>O valor da sua conta de luz, que fica menor</li>
            <li>Você recebe um cashback via PIX na contratação</li>
          </ul></div>
          <div class="muda2__col surgir" style="--atraso:.1s"><h3 class="dy-h3">Continua igual</h3><ul>
            <li>A distribuidora, o fio e o medidor</li>
            <li>Nada é instalado na sua casa ou empresa</li>
            <li>Se faltar luz, você chama a distribuidora como sempre</li>
          </ul></div>
        </div>
      </div>
    </section>

    <!-- ============ EXEMPLOS ============ -->
    <section class="secao" id="exemplos" aria-labelledby="ex-titulo">
      <div class="container">
{cab('Exemplos', 'energia', 'Quanto você economiza', 'Estimativa com os descontos de hoje. O valor exato sai da sua fatura.', id_='ex-titulo')}
        <div class="tabela-eco surgir" data-tabela-energia></div>
      </div>
    </section>

    <!-- ============ PARA QUEM ============ -->
    <section class="secao secao--alt" aria-labelledby="pq-titulo">
      <div class="container">
{cab('Para quem é', 'energia', 'Casas, condomínios e empresas', id_='pq-titulo')}
        {cards_link([
            ('energia-casas', 'hero-lampada.svg', 'Casas e apartamentos', 'Para contas a partir de R$ 150 por mês.'),
            ('energia-cond', 'aba-predio.svg', 'Condomínios', 'Área comum mais barata para todos os moradores.'),
            ('energia-emp', 'aba-predio.svg', 'Comércios e empresas', 'Menos custo fixo todo mês, sem investimento.'),
        ], 'energia')}
      </div>
    </section>

{faq_secao('Dúvidas sobre energia solar por assinatura', 'faq-energia')}
{cta('energia', 'Quanto a sua conta pode baixar?', 'Informe o seu endereço e o valor da conta. Leva menos de 1 minuto.')}'''
pagina('energia', 'Energia Solar por Assinatura — Do Yourself',
       'Pague menos na conta de luz sem obra e sem placas, com a mesma distribuidora. E receba 10% de cashback via PIX na sua conta bancária.',
       energia)

# =====================================================================
#  COMBO
# =====================================================================
combo = hero(
    'Combo', 'marca', 'Combo Do Yourself',
    'Junte os serviços e <span class="realce">ganhe em dobro.</span>',
    'Internet, celular e energia solar num pedido só. O cashback de cada serviço se soma e cai <strong>via PIX na sua conta bancária</strong>.',
    'combo', PILHA.replace('<div class="hero2__visual"', '<div class="hero2__visual"', 1),
    ['Um, dois ou os três serviços', 'Um WhatsApp só para tudo', 'Vale para CPF e CNPJ'],
)
combo_meio = secao('COMO FUNCIONA') + '\n\n' + secao('QUANTO VOLTA') + '\n\n' + secao('UMA CONVERSA SÓ') + '\n\n'
combo += '\n' + combo_meio.replace('href="#internet"', 'href="internet-fibra.html"').replace('href="#celular"', 'href="celular.html"').replace('href="#energia"', 'href="energia.html"')
combo += f'''    <!-- ============ SERVIÇOS ============ -->
    <section class="secao" aria-labelledby="sv-titulo">
      <div class="container">
{cab('Os serviços', '', 'Conheça cada um', id_='sv-titulo')}
        {cards_link([
            ('energia', 'hero-lampada.svg', 'Energia Solar por Assinatura', 'Conta de luz mais barata, sem obra. 10% de cashback.'),
            ('internet', 'hero-wifi.svg', 'Internet Fibra', 'Wi-Fi e instalação grátis. 50% de uma mensalidade de cashback.'),
            ('celular', 'hero-celular-5g.svg', 'Planos de Celular', 'Portabilidade grátis. 100% de um mês das linhas de cashback.'),
        ], 'marca')}
      </div>
    </section>

{faq_secao('Dúvidas sobre o combo e o cashback', 'faq-dy')}
{cta('combo', 'Monte o seu combo agora', 'Leva menos de 3 minutos para ver o que chega no seu endereço e quanto volta para você.')}'''
pagina('combo', 'Combo Do Yourself — Internet, celular e energia com cashback',
       'Junte internet fibra, planos de celular e energia solar num pedido só. O cashback de cada serviço se soma e cai via PIX na sua conta bancária.',
       combo)

# =====================================================================
#  INTERNET FIBRA
# =====================================================================
sec_net = secao('INTERNET FIBRA')
sec_net = re.sub(r'<header class="cab surgir">.*?</header>', cab('Todos os planos', 'internet', 'Compare e escolha a sua internet', 'Wi-Fi e instalação grátis em todos os planos. Toque em um plano para ver os detalhes.'), sec_net, count=1, flags=re.S)
exec((RAIZ / 'tools' / 'fibra_paginas.py').read_text(encoding='utf-8'), globals())

# =====================================================================
#  PLANOS DE CELULAR · APLICATIVOS · SOBRE
# =====================================================================
exec((RAIZ / 'tools' / 'celular_paginas.py').read_text(encoding='utf-8'), globals())
exec((RAIZ / 'tools' / 'institucional_paginas.py').read_text(encoding='utf-8'), globals())
