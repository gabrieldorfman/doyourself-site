# ruff: noqa
"""
Do Yourself — páginas de Planos de Celular (Hub and Spoke, mesmo modelo da Internet Fibra).
Executado de dentro de tools/paginas.py depois do fibra_paginas.py (usa ICO, LOCAL_BARRA, faq_itens…).

Gera:
  celular.html                         Hub
  celular/cpf.html                     Planos controle (CPF)
  celular/cnpj.html                    Planos empresariais (CNPJ e MEI)
  celular/cpf/{controle,redes-sociais,premium,a-plus}.html

Regras e preços: wiki Regras Do Yourself (partes 5 e 6). Preços sempre do js/config.js.
"""

ICO.update({
    'chip': svg('<rect x="5" y="3" width="14" height="18" rx="2.5"/><rect x="8.5" y="9" width="7" height="7" rx="1"/><path d="M12 9v7M8.5 12.5h7"/>'),
    'social': svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".8" fill="currentColor"/>'),
    'cofre': svg('<rect x="3" y="6" width="18" height="13" rx="3"/><circle cx="12" cy="12.5" r="3"/><path d="M7 19v2M17 19v2M7 6V4.5"/>'),
    'aviao': svg('<path d="M3 13.5 21 6l-4.5 15-4-6.5Z"/><path d="m12.5 14.5 8.5-8.5"/>'),
    'caminhao': svg('<path d="M2.5 6h11v10h-11z"/><path d="M13.5 9.5h4l3.5 3.5V16h-7.5"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    'vendedor': svg('<circle cx="9" cy="7" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><rect x="15.5" y="9.5" width="6" height="10" rx="1.5"/>'),
    'grafico': svg('<path d="M3 20h18"/><path d="M6 16v-5M11 16V7M16 16v-8M21 16V4"/>'),
    'mundo': svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
})

CEL_JS = '\n  <script src="js/fibra.js"></script>\n  <script src="js/celular.js"></script>'


def persona_cel(d):
    preco = f'<p class="fb-persona__preco" data-cel-preco="{d["preco"]}"></p>' if d.get('preco') else ''
    return f'''
          <article class="fb-persona" id="{d['id']}">
            <div class="fb-persona__copy surgir">
              <span class="fb-persona__quem">{ICO[d['ico']]}{d['quem']}</span>
              <h3 class="dy-h2">{d['titulo']}</h3>
              <p class="dy-lead">{d['texto']}</p>
              <ul class="fb-ganchos">{''.join(f'<li>{g}</li>' for g in d['ganchos'])}</ul>
              {preco}
              <div class="fb-persona__acoes">{d['acoes']}</div>
            </div>
            <div class="fb-persona__vis{' fb-persona__vis--premium' if d.get('premium') else ''} surgir" style="--atraso:.1s" aria-hidden="true">
              <span class="fb-persona__ilu">{ICO[d['ico']]}</span>
              <p class="fb-persona__big"><b>{d['big']}</b><span>{d.get('big_u', 'GB')}</span></p>
              <div>
                {d.get('extra_vis', '')}
                <div class="fb-persona__specs">{''.join(f'<span>{s}</span>' for s in d['specs'])}</div>
              </div>
            </div>
          </article>'''


def cta_cel(titulo, lead, para='', botao='Montar o meu pedido', zap_msg='Olá! Quero saber dos planos de celular.'):
    q = f'&amp;para={para}' if para else ''
    return f'''    <!-- ============ CTA FINAL ============ -->
    <section class="secao cta2" aria-labelledby="cta-titulo">
      <div class="container">
        <div class="cta2__painel surgir">
          <h2 class="dy-h2" id="cta-titulo">{titulo}</h2>
          <p class="dy-lead">{lead}</p>
          <div class="cta2__acoes">
            <a class="dy-btn dy-btn--primario dy-btn--g" href="contratar.html?origem=celular{q}">{botao} <span class="seta-dir" aria-hidden="true">→</span></a>
            <a class="dy-btn dy-btn--contorno dy-btn--g" data-whatsapp="{zap_msg}">Falar no WhatsApp</a>
          </div>
          <p class="dy-apoio">Suporte 24 horas pelo WhatsApp · <span data-whatsapp-numero></span></p>
        </div>
      </div>
    </section>
'''

LOGO_APPS = {k: f'<img src="img/apps/{v}" alt="{a}">' for k, (v, a) in {
    'whatsapp': ('whatsapp.svg', 'WhatsApp'), 'facebook': ('facebook.svg', 'Facebook'), 'instagram': ('instagram.svg', 'Instagram'),
    'messenger': ('messenger.svg', 'Messenger'), 'waze': ('waze.svg', 'Waze')}.items()}

def logos_apps(ks):
    return '<div class="fb-persona__stream">' + ''.join(LOGO_APPS[k] for k in ks) + '</div>'

PORTABILIDADE_PASSOS = [
    ('Escolha o plano e informe o número', 'Monte o pedido no site. O número precisa estar ativo e no mesmo titular.'),
    ('Responda “SIM” ao SMS', 'Você recebe um SMS de confirmação e responde “SIM” em até 24 horas.'),
    ('Pronto, mesmo número', 'Em cerca de 3 dias úteis o seu número já está no plano novo.'),
]


# =====================================================================
#  HUB — /celular
# =====================================================================
cel_hub = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--celular fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--celular">Planos de Celular · Cashback de 100%</span>
            <h1 class="dy-display" id="hero-titulo">Seu número de sempre, com <span class="realce realce--celular">100% de volta.</span></h1>
            <p class="dy-lead">Planos controle para você e planos empresariais para a sua empresa, com portabilidade grátis. E <strong>o valor de um mês das linhas volta para você no PIX</strong>.</p>
            <nav class="fb-seletor" aria-label="Para quem é o plano">
              <a href="/celular/cpf"><span class="fb-seletor__ico">{ICO['pessoa']}</span><span><b>Para mim</b>Planos controle no CPF</span></a>
              <a href="/celular/cnpj"><span class="fb-seletor__ico">{ICO['predio']}</span><span><b>Para minha empresa</b>Linhas no CNPJ ou MEI</span></a>
            </nav>
            <ul class="hero2__provas" aria-label="Vantagens">{verificado(['Portabilidade grátis', 'Ligações ilimitadas', 'Suporte 24h no WhatsApp'])}</ul>
          </div>
          <div class="hero2__visual">
            <div class="fb-pilha" data-pilha-cel="hub" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ COMO FUNCIONA ============ -->
    <section class="secao" id="como-funciona" aria-labelledby="cf-titulo">
      <div class="container">
{cab('Como funciona', 'celular', 'Do pedido ao chip funcionando, sem fila de loja', id_='cf-titulo')}
        {passos('celular', [
            ('Escolha o plano', 'Para você (CPF) ou para a sua empresa (CNPJ), quantas linhas quiser.'),
            ('Fale com a gente', 'No WhatsApp, confirmamos o pedido e cuidamos do cadastro e da portabilidade.'),
            ('Chip na sua casa', 'Você recebe o chip, ativa e já sai usando, com o seu número ou um novo.'),
            ('100% de volta', 'O valor de um mês das linhas volta no PIX em até 7 dias depois da ativação.'),
        ]).replace('passos3 passos3--celular', 'passos3 passos3--4 passos3--celular')}
      </div>
    </section>

    <!-- ============ PORTABILIDADE ============ -->
    <section class="secao secao--alt" id="portabilidade" aria-labelledby="pt-titulo">
      <div class="container">
{cab('Portabilidade grátis', 'celular', 'Troque de plano sem trocar de número', 'Seus contatos continuam falando com você no mesmo número. A gente cuida do pedido.', id_='pt-titulo')}
        {passos('celular', PORTABILIDADE_PASSOS)}
        <p class="fb-nota">Na portabilidade, os planos controle têm mais internet e preço menor. Nos planos para empresa existem ofertas só para quem traz o número.</p>
      </div>
    </section>

    <!-- ============ CASHBACK ============ -->
    <section class="secao" id="cashback" aria-labelledby="cb-titulo">
      <div class="container">
{cab('Cashback', '', 'O valor de um mês volta inteiro', 'No celular, o cashback é de <strong>100% da mensalidade</strong> de cada linha, uma única vez, via PIX. Nos planos para empresa, a 1ª mensalidade ainda é grátis: na prática, <strong>dois meses sem custo</strong> por linha.', id_='cb-titulo')}
        <div class="fb-calc surgir" data-cel-calc>
          <div class="fb-calc__ops" data-calc-ops role="radiogroup" aria-label="Plano para calcular o cashback"></div>
          <div class="fb-calc__res" data-calc-res aria-live="polite"></div>
        </div>
      </div>
    </section>

    <!-- ============ APPS SEM GASTAR ============ -->
    <section class="secao secao--alt" aria-labelledby="ap-titulo">
      <div class="container">
{cab('Sem gastar a internet', 'celular', 'Apps que não descontam da sua internet', id_='ap-titulo')}
        <div class="fb-duo">
          <div class="fb-painel surgir">
            <small class="dy-eyebrow dy-eyebrow--celular">Planos para empresa</small>
            <h3 class="dy-h3">WhatsApp e Waze em todos. Redes sociais a partir de 30 GB.</h3>
            {logos_apps(['whatsapp', 'messenger', 'waze', 'facebook', 'instagram'])}
            <p class="dy-texto">Mensagens, fotos, áudios e vídeos no WhatsApp e no WhatsApp Business não gastam a internet. Chamadas de voz e de vídeo pelo app, sim.</p>
          </div>
          <div class="fb-painel surgir" style="--atraso:.1s">
            <small class="dy-eyebrow dy-eyebrow--celular">Planos controle</small>
            <h3 class="dy-h3">Redes sociais liberadas nos planos Redes Sociais e Premium.</h3>
            {logos_apps(['facebook', 'instagram', 'messenger'])}
            <p class="dy-texto">Facebook, Instagram, X e Messenger sem descontar da internet. Lives e chamadas de vídeo descontam normalmente.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ CAMINHOS ============ -->
    <section class="secao" aria-labelledby="cm-titulo">
      <div class="container">
{cab('Para quem é', 'celular', 'Escolha o seu caminho', id_='cm-titulo')}
        <div class="fb-caminhos">
          <a class="fb-caminho-card surgir" href="/celular/cpf">
            <span class="fb-caminho-card__ico">{ICO['pessoa']}</span>
            <h3 class="dy-h3">Celular para CPF</h3>
            <p>Planos controle: conta fixa todo mês, ligações e SMS ilimitados e redes sociais liberadas em alguns planos.</p>
            <div class="fb-caminho-card__tags"><span>Conta sem surpresa</span><span>Até 55 GB</span><span>Bônus para quem tem a nossa fibra</span></div>
            <span class="fb-caminho-card__ir">Ver planos para CPF →</span>
          </a>
          <a class="fb-caminho-card fb-caminho-card--emp surgir" style="--atraso:.1s" href="/celular/cnpj">
            <span class="fb-caminho-card__ico">{ICO['predio']}</span>
            <h3 class="dy-h3">Celular para CNPJ</h3>
            <p>Linhas da empresa na mesma fatura, de 6 GB a 150 GB, com 1ª mensalidade grátis. Contrato no CNPJ, uso no celular de sempre.</p>
            <div class="fb-caminho-card__tags"><span>CNPJ e MEI</span><span>1ª mensalidade grátis</span><span>Monitor de uso</span></div>
            <span class="fb-caminho-card__ir">Ver planos para empresa →</span>
          </a>
        </div>
      </div>
    </section>

{faq_itens('Dúvidas sobre os planos de celular', [
    ('Posso manter o meu número?', 'Pode. A portabilidade é gratuita: o número precisa estar ativo e no mesmo titular. Você responde “SIM” ao SMS de confirmação e, em cerca de 3 dias úteis, o número já está no plano novo.'),
    ('Quanto volta de cashback?', '100% da mensalidade de cada linha, uma única vez, via PIX, em até 7 dias depois que o chip é ativado.'),
    ('Qual a diferença entre o plano controle e o plano para empresa?', 'O controle é no CPF, com valor fixo todo mês e ligações e SMS ilimitados. O plano para empresa é no CNPJ ou MEI, cobrado por linha, com 1ª mensalidade grátis e fidelidade de 24 meses.'),
    ('Tenho CNPJ. Posso usar a linha no meu celular pessoal?', 'Pode. O contrato fica no nome da empresa, mas a linha funciona normalmente no seu celular de sempre.'),
    ('A Do Yourself é a operadora?', 'Não. As linhas são de uma operadora parceira, com cobertura em todo o país. A Do Yourself cuida do pedido, da portabilidade, da ativação e do suporte, pelo WhatsApp, 24 horas por dia.'),
    ('O WhatsApp gasta a minha internet?', 'Nos planos para empresa, mensagens, fotos, áudios e vídeos do WhatsApp não gastam. Chamadas de voz e de vídeo pelo app gastam. Nos planos controle, quem tem redes sociais liberadas são o Redes Sociais e o Premium.'),
    ('Quanto tempo leva para o chip chegar?', 'A gente combina a entrega pelo WhatsApp quando o pedido é aprovado. Com o chip em mãos, a ativação é feita na hora.'),
])}
{cta_cel('Quanto volta nas suas linhas?', 'Escolha o plano e a quantidade de linhas. O valor de um mês volta inteiro para você no PIX.')}'''

pagina('celular', 'Planos de Celular com 100% de cashback — Do Yourself',
       'Planos controle para CPF e planos empresariais para CNPJ, com portabilidade grátis, ligações ilimitadas e o valor de um mês das linhas de volta no PIX.',
       cel_hub, css_extra='fibra', scripts_extra=CEL_JS, classe='tema-cel')


# =====================================================================
#  CELULAR PARA CPF — /celular/cpf
# =====================================================================
def acoes_cpf(pid, slug, nome):
    return (f'<a class="dy-btn dy-btn--primario" href="/celular/cpf/{slug}">Ver todos os benefícios <span class="seta-dir" aria-hidden="true">→</span></a>'
            f'<a class="dy-link" href="contratar.html?origem=celular&amp;plano={pid}&amp;para=cpf&amp;linhas=1">Quero o {nome}</a>')

PERSONAS_CPF = [
    dict(id='redes', ico='social', quem='Para quem vive nas redes sociais', preco='cpf:redes', big='46',
         titulo='Rolar o feed o dia inteiro sem ver a internet acabar.',
         texto='Stories, reels, grupos e mensagens sem descontar da sua internet. No Controle Redes Sociais, Facebook, Instagram, X e Messenger ficam liberados, e a internet do plano sobra para o resto.',
         ganchos=['Redes sociais liberadas', 'Até 46 GB', 'Ligações ilimitadas'], specs=['Facebook', 'Instagram', 'X', 'Messenger'],
         extra_vis=logos_apps(['facebook', 'instagram', 'messenger']), acoes=acoes_cpf('redes', 'redes-sociais', 'Controle Redes Sociais')),
    dict(id='custo', ico='cofre', quem='Para quem quer o melhor custo', preco='cpf:controle', big='45',
         titulo='Muita internet, conta fixa e nenhuma surpresa no fim do mês.',
         texto='O Controle é o plano mais escolhido: até 45 GB trazendo o seu número, ligações e SMS ilimitados para todo o Brasil e Deezer Premium grátis nos 3 primeiros meses. Você sabe quanto vai pagar antes de a fatura chegar.',
         ganchos=['Oferta do mês', 'Deezer Premium por 3 meses', 'Conta fixa'], specs=['Até 45 GB', 'Ligações e SMS ilimitados', 'Roaming nacional'],
         acoes=acoes_cpf('controle', 'controle', 'Controle')),
    dict(id='viaja', ico='aviao', quem='Para quem usa muita internet e viaja', preco='cpf:premium', big='55', premium=True,
         titulo='Internet de sobra aqui e no Chile, sem pagar nada a mais.',
         texto='O Controle Premium tem até 55 GB, com 5 GB só para redes sociais, Facebook, Instagram, X e Messenger liberados e roaming no Chile sem custo, com internet extra e ligações ilimitadas por lá.',
         ganchos=['Até 55 GB', 'Chile sem custo', 'Redes sociais liberadas'], specs=['Até 55 GB', 'Roaming no Chile', 'Ligações e SMS ilimitados'],
         acoes=acoes_cpf('premium', 'premium', 'Controle Premium')),
    dict(id='basico', ico='chip', quem='Para quem quer o básico mais barato', preco='cpf:aplus', big='27',
         titulo='O essencial para ligar, mandar mensagem e navegar, pelo menor preço.',
         texto='O Controle A Plus é o plano de entrada: até 27 GB trazendo o seu número, 550 minutos de ligação para todo o Brasil, Messenger sem gastar a internet e roaming no Chile sem custo.',
         ganchos=['Menor preço', '550 minutos', 'Chile sem custo'], specs=['Até 27 GB', '550 minutos', 'Messenger liberado'],
         acoes=acoes_cpf('aplus', 'a-plus', 'Controle A Plus')),
]

chips_cpf = ''.join(f'<a href="#{d["id"]}">{t}</a>' for d, t in zip(PERSONAS_CPF, ['Redes sociais', 'Melhor custo', 'Muita internet', 'O mais barato']))
cel_cpf = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--celular fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--celular">Celular para CPF · Planos controle</span>
            <h1 class="dy-display" id="hero-titulo">Conta fixa, internet de sobra e <span class="realce realce--celular">100% de volta.</span></h1>
            <p class="dy-lead">Planos controle com ligações e SMS ilimitados, redes sociais liberadas em alguns planos e o valor de um mês <strong>de volta no PIX</strong>. Você sabe quanto vai pagar antes de a fatura chegar.</p>
            <div><p class="dy-apoio" style="margin-bottom:10px">O que mais pesa no seu celular?</p><nav class="fb-chips" aria-label="Perfis">{chips_cpf}</nav></div>
            <ul class="hero2__provas" aria-label="Vantagens">{verificado(['Portabilidade grátis', 'Conta sem surpresa', 'Suporte 24h no WhatsApp'])}</ul>
          </div>
          <div class="hero2__visual">
            <div class="fb-pilha" data-pilha-cel="cpf" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PERSONAS ============ -->
    <section class="secao" id="perfis" aria-labelledby="pf-titulo">
      <div class="container">
{cab('Para cada rotina', 'celular', 'Qual é o seu jeito de usar o celular?', 'Quatro planos controle, quatro perfis. Escolha o que parece com o seu dia.', id_='pf-titulo')}
        <div class="fb-personas">{''.join(persona_cel(d) for d in PERSONAS_CPF)}
        </div>
      </div>
    </section>

    <!-- ============ TODO PLANO CONTROLE ============ -->
    <section class="secao secao--alt" aria-labelledby="td-titulo">
      <div class="container">
{cab('Em todos os planos', 'celular', 'O que todo plano controle tem', id_='td-titulo')}
        <ul class="fb-faixa">
          <li class="surgir"><img src="img/icones/ligacoes.svg" alt=""><span><b>Ligações ilimitadas</b>Para qualquer operadora, em todo o Brasil (no A Plus, 550 minutos).</span></li>
          <li class="surgir" style="--atraso:.06s"><img src="img/icones/sms.svg" alt=""><span><b>SMS ilimitado</b>Mande quantas mensagens quiser.</span></li>
          <li class="surgir" style="--atraso:.12s"><img src="img/icones/tecnologias.svg" alt=""><span><b>Roaming nacional</b>Internet e ligações em outros estados sem custo extra.</span></li>
          <li class="surgir"><img src="img/icones/verificado.svg" alt=""><span><b>Cartão de TODOS</b>Descontos em consultas, exames e farmácias.</span></li>
          <li class="surgir" style="--atraso:.06s"><img src="img/icones/dif-tela.svg" alt=""><span><b>Apps de leitura, estudo e segurança</b>Audiolivros, plataforma de estudos, revistas e antivírus, conforme o plano.</span></li>
          <li class="surgir" style="--atraso:.12s"><img src="img/icones/cofrinho.svg" alt=""><span><b>Conta sem surpresa</b>Valor fixo todo mês, no débito automático.</span></li>
        </ul>
      </div>
    </section>

    <!-- ============ BÔNUS DA FIBRA ============ -->
    <section class="secao fb-secao-curta" aria-labelledby="bf-titulo">
      <div class="container">
        <div class="fb-escuro surgir">
          <div class="fb-grade2__copy">
            <span class="dy-eyebrow">Bônus para quem tem a nossa fibra</span>
            <h2 class="dy-h2" id="bf-titulo">Tem a nossa internet fibra? Ganhe 20 GB a mais no celular.</h2>
            <p>Quem tem um plano controle e a nossa fibra em casa ganha <b style="color:#fff">20 GB de bônus</b> no celular. Os dois são contratados separados, cada um com o seu cashback.</p>
          </div>
          <div class="fb-escuro__aviso">
            <p><b>Ainda não tem a fibra?</b></p>
            <p>Planos de 500 Mega a 1 Giga, com instalação grátis e metade de uma mensalidade de volta no PIX.</p>
            <div class="fb-escuro__acoes" style="margin-top:14px"><a class="dy-btn dy-btn--contorno" href="/internet-fibra/casa">Ver a internet para casa →</a></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PORTABILIDADE x NÚMERO NOVO ============ -->
    <section class="secao secao--alt" id="portabilidade" aria-labelledby="pt-titulo">
      <div class="container">
{cab('Portabilidade', 'celular', 'Trazendo o seu número, você ganha mais internet e paga menos', 'Nos planos controle, quem faz a portabilidade tem bônus de internet e um preço menor do que no número novo.', id_='pt-titulo')}
        {passos('celular', PORTABILIDADE_PASSOS)}
      </div>
    </section>

    <!-- ============ COMPARAR ============ -->
    <section class="secao" id="comparar" aria-labelledby="cp-titulo">
      <div class="container">
{cab('Todos os planos', 'celular', 'Planos controle lado a lado', id_='cp-titulo')}
        <details class="fb-comparar surgir" open>
          <summary><span>Portabilidade e número novo</span></summary>
          <div class="fb-tabela" data-cel-comparar="cpf"></div>
        </details>
        <p class="fb-nota">Valores mensais no débito automático, com fidelidade. A internet inclui bônus da oferta vigente.</p>
      </div>
    </section>

{faq_itens('Dúvidas sobre os planos controle', [
    ('O que é um plano controle?', 'É um plano com valor fixo todo mês: a internet, as ligações e os apps já estão no preço. Não existe conta surpresa no fim do mês.'),
    ('Por que a portabilidade sai mais barata?', 'Para quem traz o número de outra operadora, os planos controle têm bônus de internet e um preço menor. Com um número novo, o plano tem menos internet e custa um pouco mais.'),
    ('Quem tem a fibra ganha alguma coisa?', 'Sim. Quem tem um plano controle e a nossa internet fibra ganha 20 GB de bônus no celular.'),
    ('Quanto volta de cashback?', '100% da mensalidade do plano, uma única vez, via PIX, em até 7 dias depois que o chip é ativado.'),
    ('Tenho CNPJ. Qual plano é melhor?', 'Com CNPJ ou MEI, veja também os planos para empresa: são cobrados por linha, têm a 1ª mensalidade grátis e podem ser usados no seu celular pessoal.'),
])}
{cta_cel('Escolha o seu plano controle', 'Monte o pedido em poucos cliques. O valor de um mês volta inteiro para você no PIX.', para='cpf')}'''

pagina('celular/cpf', 'Planos controle para CPF com 100% de cashback — Do Yourself',
       'Planos controle de até 55 GB com ligações e SMS ilimitados, redes sociais liberadas, portabilidade grátis e o valor de um mês de volta no PIX.',
       cel_cpf, css_extra='fibra', scripts_extra=CEL_JS, classe='tema-cel')


# =====================================================================
#  CELULAR PARA CNPJ — /celular/cnpj
# =====================================================================
def acoes_cnpj(pid, gb, msg):
    return (f'<a class="dy-btn dy-btn--primario" href="contratar.html?origem=celular&amp;plano={pid}&amp;para=cnpj&amp;linhas=1">Quero o plano de {gb} GB <span class="seta-dir" aria-hidden="true">→</span></a>'
            f'<a class="dy-link" data-whatsapp="{msg}">Tirar dúvida no WhatsApp</a>')

PERSONAS_CNPJ = [
    dict(id='equipe', ico='vendedor', quem='Para equipes externas e vendedores', preco='cnpj:50', big='50', premium=True,
         titulo='Sua equipe na rua, conectada o dia inteiro.',
         texto='Quem vende e atende fora do escritório vive no WhatsApp, no mapa e no sistema. O plano de 50 GB tem WhatsApp, redes sociais e Waze sem gastar a internet, e o Monitor de uso para você acompanhar o consumo de cada linha.',
         ganchos=['Oferta do mês', 'WhatsApp e Waze sem gastar', 'Monitor de uso'], specs=['50 GB por linha', 'Ligações ilimitadas', '1ª mensalidade grátis'],
         extra_vis=logos_apps(['whatsapp', 'waze', 'instagram']), acoes=acoes_cnpj('50', 50, 'Olá! Quero linhas para a minha equipe externa.')),
    dict(id='logistica', ico='caminhao', quem='Para transporte e logística', preco='cnpj:100', big='100',
         titulo='Rota, entrega e comprovante sem perder o sinal da operação.',
         texto='Motoristas e entregadores usam o mapa, mandam foto de comprovante e falam com a base o dia todo. Com 100 GB por linha e o Waze sem gastar a internet, ninguém fica sem dados no meio da rota.',
         ganchos=['100 GB por linha', 'Waze sem gastar', 'Antivírus incluso'], specs=['100 GB por linha', 'Roaming nacional', 'Ligações ilimitadas'],
         acoes=acoes_cnpj('100', 100, 'Olá! Quero linhas para a minha frota.')),
    dict(id='escritorio', ico='maleta', quem='Para escritórios e pequenos negócios', preco='cnpj:30', big='30',
         titulo='Toda a equipe na mesma fatura, cada um com a sua linha.',
         texto='Para quem atende cliente pelo WhatsApp, responde e-mail e faz ligação o dia inteiro. O plano de 30 GB tem as redes sociais liberadas, nuvem para arquivos e o Monitor de uso para o gestor.',
         ganchos=['Redes sociais liberadas', 'Nuvem para arquivos', 'Uma fatura só'], specs=['30 GB por linha', 'Ligações ilimitadas', '800 SMS'],
         acoes=acoes_cnpj('30', 30, 'Olá! Quero linhas para o meu escritório.')),
    dict(id='mei', ico='pessoa', quem='Para MEI', preco='cnpj:12', big='12',
         titulo='Linha do negócio separada da pessoal, pagando pouco.',
         texto='MEI pode ter até 3 linhas, de até R$ 100 cada. O plano de 12 GB tem WhatsApp e WhatsApp Business sem gastar a internet, para atender os clientes sem misturar com o número pessoal.',
         ganchos=['Até 3 linhas no MEI', 'WhatsApp Business sem gastar', 'Cashback no PIX'], specs=['12 GB por linha', 'Ligações ilimitadas', '1ª mensalidade grátis'],
         extra_vis=logos_apps(['whatsapp', 'messenger', 'waze']), acoes=acoes_cnpj('12', 12, 'Olá! Tenho MEI e quero uma linha para o meu negócio.')),
]

porta3 = ''.join(f'''
          <div class="surgir{' on' if pid == 'p70' else ''}" style="--atraso:{i * .08:.2f}s">
            <small class="dy-eyebrow dy-eyebrow--celular">{tag}</small>
            <b class="gb">{gb}<span>GB</span></b>
            <p>{txt}</p>
            <p class="preco" data-cel-preco="porta:{pid}" data-formato="curto"></p>
            <a class="dy-btn {'dy-btn--primario' if pid == 'p70' else 'dy-btn--contorno'}" href="contratar.html?origem=celular&amp;plano={pid}&amp;para=cnpj&amp;linhas=1">Quero trazer meu número</a>
          </div>''' for i, (pid, gb, tag, txt) in enumerate([
    ('p21', 21, 'Para começar', '1 GB do plano + 20 GB de bônus. Nuvem, idiomas e audiolivros.'),
    ('p40', 40, 'Equilibrado', '20 GB + 20 GB de bônus, com Monitor de uso e proteção contra golpes.'),
    ('p70', 70, 'Melhor custo por GB', '20 GB + 50 GB de bônus. Com pouco mais que o de 40 GB, 30 GB a mais por mês.'),
]))

cel_cnpj = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--celular fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--celular">Celular para CNPJ · Empresas e MEI</span>
            <h1 class="dy-display" id="hero-titulo">Linhas da empresa com dois meses <span class="realce realce--celular">sem custo.</span></h1>
            <p class="dy-lead">A 1ª mensalidade é grátis, e o valor de outro mês volta para você no PIX. Planos de 6 GB a 150 GB por linha, todas na mesma fatura, com a Do Yourself cuidando do suporte <strong>24 horas por dia</strong>.</p>
            <p class="fb-faixa-cnpj">{ICO['predio']}Contrato no CNPJ. A linha funciona no celular de sempre.</p>
            <div class="fb-hero__acoes">
              <a class="dy-btn dy-btn--primario dy-btn--g" href="#perfis">Ver o plano ideal <span class="seta-dir" aria-hidden="true">→</span></a>
              <a class="dy-link" data-whatsapp="Olá! Quero linhas de celular para a minha empresa.">Falar com um especialista</a>
            </div>
          </div>
          <div class="hero2__visual">
            <div class="fb-pilha" data-pilha-cel="cnpj" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ DOIS MESES ============ -->
    <section class="secao" aria-labelledby="dm-titulo">
      <div class="container">
{cab('A conta da sua empresa', 'celular', 'Como uma linha fica dois meses sem custo', id_='dm-titulo')}
        <ul class="fb-req fb-req--3">
          <li class="surgir"><b>1º mês</b><strong>Grátis</strong>Benefício da operadora parceira para linhas empresariais.</li>
          <li class="surgir" style="--atraso:.08s"><b>100%</b><strong>de um mês de volta</strong>Cashback da Do Yourself no PIX, em até 7 dias depois da ativação.</li>
          <li class="surgir" style="--atraso:.16s"><b>= 2 meses</b><strong>sem custo por linha</strong>Na prática, para cada linha que a empresa contrata.</li>
        </ul>
      </div>
    </section>

    <!-- ============ PERSONAS ============ -->
    <section class="secao secao--alt" id="perfis" aria-labelledby="pf-titulo">
      <div class="container">
{cab('Para cada operação', 'celular', 'Qual é o perfil da sua equipe?', 'Quatro perfis de empresa, quatro planos. Todos com contrato no CNPJ ou MEI.', id_='pf-titulo')}
        <div class="fb-personas">{''.join(persona_cel(d) for d in PERSONAS_CNPJ)}
        </div>
      </div>
    </section>

    <!-- ============ PORTABILIDADE ============ -->
    <section class="secao" id="portabilidade" aria-labelledby="pt-titulo">
      <div class="container">
{cab('Só para quem traz o número', 'celular', 'Ofertas exclusivas de portabilidade', 'Trazendo os números de outra operadora, a sua empresa ganha muito mais internet pelo mesmo valor.', id_='pt-titulo')}
        <div class="fb-porta3">{porta3}
        </div>
        <p class="fb-nota">Válidas em todos os estados. Com WhatsApp, redes sociais e Waze sem gastar a internet, 1ª mensalidade grátis e Cartão de TODOS.</p>
      </div>
    </section>

    <!-- ============ COMPARAR ============ -->
    <section class="secao secao--alt" id="comparar" aria-labelledby="cp-titulo">
      <div class="container">
{cab('Todos os planos', 'celular', 'Planos empresariais lado a lado', id_='cp-titulo')}
        <details class="fb-comparar surgir" open>
          <summary><span>Planos para empresa em <span data-local>Paraná</span></span></summary>
          <div class="fb-tabela" data-cel-comparar="cnpj"></div>
        </details>
        <p class="fb-nota">Valores mensais por linha, no débito automático, com fidelidade de 24 meses. A partir de 10 linhas existem condições especiais: fale com a gente.</p>
      </div>
    </section>

    <!-- ============ APPS ============ -->
    <section class="secao" aria-labelledby="ap-titulo">
      <div class="container">
{cab('Sem gastar a internet', 'celular', 'O que não desconta da internet da linha', id_='ap-titulo')}
        <div class="fb-tabela surgir">
          <table>
            <thead><tr><th>App</th><th class="dy">Não desconta</th><th>Desconta</th></tr></thead>
            <tbody>
              <tr><th scope="row">WhatsApp e WhatsApp Business</th><td class="dy">Mensagens, fotos, vídeos e áudios</td><td>Chamadas de voz e de vídeo pelo app</td></tr>
              <tr><th scope="row">Facebook</th><td class="dy">Feed, posts e fotos</td><td>Transmissão ao vivo</td></tr>
              <tr><th scope="row">Instagram</th><td class="dy">Feed, stories e fotos</td><td>Lives e chamadas de vídeo</td></tr>
              <tr><th scope="row">X</th><td class="dy">Uso normal</td><td>—</td></tr>
              <tr><th scope="row">Messenger</th><td class="dy">Mensagens</td><td>Chamadas</td></tr>
              <tr><th scope="row">Waze</th><td class="dy">Navegação</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
        <p class="fb-nota">WhatsApp, Messenger e Waze em todos os planos; Facebook, Instagram e X a partir de 30 GB. Links abertos fora do app descontam normalmente.</p>
      </div>
    </section>

    <!-- ============ GESTÃO ============ -->
    <section class="secao secao--alt" aria-labelledby="gs-titulo">
      <div class="container">
{cab('Gestão das linhas', 'celular', 'Controle do consumo de cada colaborador', id_='gs-titulo')}
        <ul class="fb-faixa">
          <li class="surgir"><span class="fb-painel__ico" style="width:44px;height:44px;flex:none">{ICO['grafico']}</span><span><b>Monitor de uso</b>Veja o consumo de internet de cada linha e bloqueie apps, sites ou o celular fora do horário de trabalho.</span></li>
          <li class="surgir" style="--atraso:.08s"><span class="fb-painel__ico" style="width:44px;height:44px;flex:none">{ICO['nuvem']}</span><span><b>Nuvem e backup</b>Espaço em nuvem para arquivos e cópia de segurança dos dados do celular.</span></li>
          <li class="surgir" style="--atraso:.16s"><span class="fb-painel__ico" style="width:44px;height:44px;flex:none">{ICO['escudo']}</span><span><b>Segurança</b>Antivírus e proteção contra golpes nos planos maiores.</span></li>
        </ul>
      </div>
    </section>

    <!-- ============ ROAMING ============ -->
    <section class="secao" id="roaming" aria-labelledby="rm-titulo">
      <div class="container">
        <div class="fb-escuro surgir">
          <div class="fb-grade2__copy">
            <span class="dy-eyebrow">Roaming internacional</span>
            <h2 class="dy-h2" id="rm-titulo">A equipe viaja e a linha vai junto.</h2>
            <p>Pacotes mensais com internet e ligações e SMS ilimitados para o Brasil ou dentro do país visitado.</p>
            <ul class="fb-lista">
              <li><span><b>Américas</b>: Estados Unidos, Canadá, México e a América do Sul.</span></li>
              <li><span><b>Europa</b>: cerca de 45 países.</span></li>
              <li><span><b>Mundo</b>: Américas, Europa, Ásia, Oceania e mais.</span></li>
            </ul>
          </div>
          <div class="fb-escuro__aviso">
            <p><b>Chile sem custo adicional</b></p>
            <p>Linhas empresariais usam o celular no Chile sem pagar nada a mais, com internet extra e ligações e SMS ilimitados.</p>
            <p style="margin-top:10px">O roaming é ativado pelo administrador do contrato, e a Do Yourself orienta e acompanha o pedido.</p>
            <div class="fb-escuro__acoes" style="margin-top:14px"><a class="dy-btn dy-btn--contorno" data-whatsapp="Olá! Quero saber do roaming internacional para a minha empresa.">Consultar pacotes no WhatsApp</a></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ REQUISITOS ============ -->
    <section class="secao secao--alt" aria-labelledby="rq-titulo">
      <div class="container">
{cab('Antes de contratar', 'celular', 'O que a sua empresa precisa saber', id_='rq-titulo')}
        <ul class="fb-req">
          <li class="surgir"><b>24 meses</b><strong>de fidelidade</strong>Em todos os planos empresariais.</li>
          <li class="surgir"><b>3 linhas</b><strong>no MEI</strong>De até R$ 100 cada. MEI com pelo menos 180 dias.</li>
          <li class="surgir"><b>120 dias</b><strong>para os demais CNPJs</strong>Tempo mínimo de abertura.</li>
          <li class="surgir"><b>1 ligação</b><strong>de confirmação</strong>Uma confirmação rápida do pedido, por ligação ou WhatsApp.</li>
        </ul>
        <p class="fb-nota">A análise de crédito é feita sobre o CNPJ. Não atendemos órgãos públicos.</p>
      </div>
    </section>

    <!-- ============ OUTRAS SOLUÇÕES ============ -->
    <section class="secao" aria-labelledby="os-titulo">
      <div class="container">
{cab('Mais para a sua empresa', '', 'Outras soluções no mesmo atendimento', id_='os-titulo')}
        <div class="fb-ups">
          {card_zap('Chip só de dados', 'Internet para tablet e notebook', 'Para vendedores que mostram catálogo no tablet e para quem trabalha na rua com o notebook.', 'Olá! Quero saber do chip de dados para tablet ou notebook.').replace(' fb-ups__card--escuro', '')}
          {card_zap('Chip para máquinas', 'Maquininhas, rastreadores e alarmes', 'Linhas para máquinas de cartão, rastreamento de veículos, câmeras e alarmes.', 'Olá! Quero saber do chip para máquinas da minha empresa.').replace(' fb-ups__card--escuro', '')}
          <a class="fb-ups__card surgir" href="/internet-fibra/empresa"><small>Internet fibra</small><h3 class="dy-h3">Internet para empresa</h3><p>Fibra até dentro do imóvel, upload de 50% e cashback no PIX.</p><span class="ir">Ver internet para empresa →</span></a>
          <a class="fb-ups__card fb-ups__card--energia surgir" href="/energia"><small>Energia solar por assinatura</small><h3 class="dy-h3">Menos custo fixo todo mês</h3><p>Conta de luz mais barata, sem obra e sem investimento.</p><span class="ir">Ver energia solar →</span></a>
        </div>
      </div>
    </section>

{faq_itens('Dúvidas sobre os planos para empresa', [
    ('Posso usar a linha da empresa no meu celular pessoal?', 'Pode. O contrato fica no CNPJ, mas a linha funciona normalmente no celular de sempre.'),
    ('Como a 1ª mensalidade é grátis?', 'É um benefício da operadora parceira para as linhas empresariais. Somado ao cashback de 100% da Do Yourself, cada linha fica dois meses sem custo.'),
    ('MEI pode contratar?', 'Pode: até 3 linhas por CNPJ, de até R$ 100 cada, com o MEI aberto há pelo menos 180 dias.'),
    ('Qual a fidelidade?', 'Os planos empresariais têm fidelidade de 24 meses.'),
    ('As ligações por WhatsApp entram no ilimitado?', 'Não. O ilimitado vale para as ligações telefônicas normais. Chamadas de voz e de vídeo pelo WhatsApp descontam da internet.'),
    ('Tenho mais de 10 linhas. Tem condição especial?', 'Tem. Fale com a gente pelo WhatsApp e a gente monta a proposta para a sua empresa.'),
    ('A empresa já tem linhas. Dá para trocar de plano?', 'Dá. A gente analisa o que a empresa usa hoje e indica o melhor plano. Toda troca de plano gera uma nova fidelidade de 24 meses, e a gente avisa antes.'),
])}
{cta_cel('Monte o pedido das linhas da sua empresa', 'Escolha o plano e a quantidade de linhas. O valor de um mês volta inteiro, e o primeiro mês já é grátis.', para='cnpj', zap_msg='Olá! Quero linhas de celular para a minha empresa.')}'''

pagina('celular/cnpj', 'Planos de celular para empresas (CNPJ e MEI) — Do Yourself',
       'Linhas empresariais de 6 GB a 150 GB com 1ª mensalidade grátis, WhatsApp e Waze sem gastar a internet, Monitor de uso e 100% de cashback no PIX.',
       cel_cnpj, css_extra='fibra', scripts_extra=CEL_JS, classe='tema-cel')


# =====================================================================
#  PÁGINAS DOS PLANOS CONTROLE — /celular/cpf/<plano>
# =====================================================================
UPS_CEL = {
    'fibra': '<a class="fb-ups__card surgir" href="/internet-fibra/casa"><small>Internet fibra</small><h3 class="dy-h3">Com a nossa fibra, 20 GB a mais</h3><p>Quem tem plano controle e a nossa internet fibra ganha 20 GB de bônus no celular.</p><span class="ir">Ver internet para casa →</span></a>',
    'energia': '<a class="fb-ups__card fb-ups__card--energia surgir" style="--atraso:.08s" href="/energia"><small>Energia solar por assinatura</small><h3 class="dy-h3">E a conta de luz?</h3><p>Economize todo mês com energia solar por assinatura, sem obra. E receba 10% de cashback.</p><span class="ir">Ver energia solar →</span></a>',
}

def card_cel(slug, pequeno, titulo, texto, pid, escuro=False):
    return f'<a class="fb-ups__card{" fb-ups__card--escuro" if escuro else ""} surgir" href="/celular/cpf/{slug}"><small>{pequeno}</small><h3 class="dy-h3">{titulo}</h3><p>{texto}</p><p class="preco" data-cel-preco="cpf:{pid}" data-formato="curto"></p><span class="ir">Ver este plano →</span></a>'

FAQ_CTL = [
    ('Quanto volta de cashback?', '100% da mensalidade do plano, uma única vez, via PIX, em até 7 dias depois que o chip é ativado.'),
    ('Como funciona a portabilidade?', 'O número precisa estar ativo e no seu CPF. Você responde “SIM” ao SMS de confirmação em até 24 horas e, em cerca de 3 dias úteis, o número já está no plano novo.'),
    ('Tem fidelidade?', 'Sim. Os preços desta página são com fidelidade. A gente explica as condições no WhatsApp antes de fechar o pedido.'),
]

PLANOS_CEL = [
    dict(id='controle', slug='controle', nome='Controle', eyebrow='Plano Controle · Oferta do mês',
         titulo='Plano Controle até 45 GB com cashback de 100% — Do Yourself',
         desc='Plano Controle com até 45 GB na portabilidade, ligações e SMS ilimitados, Deezer Premium grátis por 3 meses e o valor de um mês de volta no PIX.',
         h1='Controle: até 45 GB, conta fixa e <span class="realce realce--celular">100% de volta.</span>',
         lead='O plano mais escolhido: internet de sobra, ligações e SMS ilimitados para todo o Brasil e Deezer Premium grátis nos 3 primeiros meses.',
         specs=[('dados-moveis.svg', 'Até 45 GB', 'na portabilidade'), ('ligacoes.svg', 'Ilimitadas', 'ligações para todo o Brasil'), ('sms.svg', 'SMS', 'ilimitado'), ('portabilidade.svg', 'Grátis', 'portabilidade')],
         quem=[('cofre', 'Quem quer o melhor custo', 'Muita internet por um valor fixo, sem surpresa na fatura.'),
               ('fone', 'Quem ouve música', 'Deezer Premium grátis nos 3 primeiros meses.'),
               ('pessoa', 'Quem liga muito', 'Ligações ilimitadas para qualquer operadora.')],
         benef=[('Até 45 GB trazendo o seu número', '15 GB do plano, 20 GB de bônus da oferta e mais 10 GB de bônus na portabilidade. Com número novo, são 35 GB.', vis_num('45 GB', 'na portabilidade')),
                ('Deezer Premium por 3 meses', 'Músicas, playlists e podcasts sem anúncios e para ouvir offline, grátis nos 3 primeiros meses.', vis_num('3 meses', 'de Deezer Premium grátis')),
                ('Leitura, estudo e segurança', 'Audiolivros, plataforma de estudos, revistas digitais e antivírus com proteção contra golpes, já no preço do plano.', vis_apps(['Audiolivros', 'Estudos', 'Revistas', 'Antivírus', 'Cartão de TODOS']))],
         ups_titulo='Outros planos controle',
         ups=[card_cel('redes-sociais', 'Vive nas redes?', 'Controle Redes Sociais', 'Facebook, Instagram, X e Messenger sem gastar a internet.', 'redes'),
              card_cel('premium', 'Quer mais internet?', 'Controle Premium', 'Até 55 GB e roaming no Chile sem custo.', 'premium', escuro=True)],
         faq=[('Por que tem dois preços?', 'Trazendo o seu número de outra operadora, o plano tem mais internet (45 GB) e custa menos. Com um número novo, são 35 GB, por um valor um pouco maior.'),
              ('Como ativo o Deezer Premium?', 'Depois da ativação do chip, você recebe as instruções. Se precisar, a gente faz o passo a passo junto com você no WhatsApp.')] + FAQ_CTL),
    dict(id='redes', slug='redes-sociais', nome='Controle Redes Sociais', eyebrow='Plano Controle Redes Sociais',
         titulo='Controle Redes Sociais: redes liberadas e 100% de cashback — Do Yourself',
         desc='Plano Controle Redes Sociais com Facebook, Instagram, X e Messenger sem gastar a internet, até 46 GB na portabilidade e o valor de um mês de volta no PIX.',
         h1='Redes sociais liberadas. A internet fica para o <span class="realce realce--celular">resto.</span>',
         lead='Facebook, Instagram, X e Messenger sem descontar da internet, até 46 GB trazendo o seu número e ligações ilimitadas.',
         specs=[('dados-moveis.svg', 'Até 46 GB', 'na portabilidade'), ('dif-tela.svg', 'Redes', 'sem gastar a internet'), ('ligacoes.svg', 'Ilimitadas', 'ligações para todo o Brasil'), ('sms.svg', 'SMS', 'ilimitado')],
         quem=[('social', 'Quem vive nas redes', 'Feed, stories e mensagens sem olhar para o consumo.'),
               ('vendedor', 'Quem vende pelas redes', 'Atenda clientes no Instagram e no Messenger o dia todo.'),
               ('pessoa', 'Quem quer a internet livre', 'A franquia sobra para vídeo, mapa e o que mais precisar.')],
         benef=[('Facebook, Instagram, X e Messenger liberados', 'O uso normal das redes não desconta da internet do plano. Lives, chamadas de vídeo e links abertos fora do app descontam normalmente.', '<div class="fb-persona__stream" style="justify-content:center"><img src="/img/apps/facebook.svg" alt="Facebook"><img src="/img/apps/instagram.svg" alt="Instagram"><img src="/img/apps/messenger.svg" alt="Messenger"></div>'),
                ('Até 46 GB trazendo o seu número', '6 GB do plano, 20 GB de bônus da oferta e mais 20 GB de bônus na portabilidade. Com número novo, são 26 GB.', vis_num('46 GB', 'na portabilidade')),
                ('Jornais, revistas e mais', 'Jornais e revistas digitais, audiolivros, plataforma de estudos e antivírus no preço do plano. Deezer Premium opcional por mais R$ 5.', vis_apps(['Jornais e revistas', 'Audiolivros', 'Estudos', 'Antivírus']))],
         ups_titulo='Quer ainda mais internet?',
         ups=[card_cel('premium', 'Mais internet', 'Controle Premium', 'Até 55 GB, redes liberadas e roaming no Chile sem custo.', 'premium', escuro=True),
              card_cel('controle', 'Oferta do mês', 'Controle', 'Até 45 GB e Deezer Premium grátis por 3 meses.', 'controle')],
         faq=[('Usar o Instagram gasta a internet?', 'O uso normal (feed, stories e fotos) não gasta. Lives e chamadas de vídeo gastam.'),
              ('O WhatsApp está liberado?', 'Neste plano, os apps liberados são Facebook, Instagram, X e Messenger. O WhatsApp usa a internet do plano.')] + FAQ_CTL),
    dict(id='premium', slug='premium', nome='Controle Premium', eyebrow='Plano Controle Premium',
         titulo='Controle Premium até 55 GB e Chile sem custo — Do Yourself',
         desc='Plano Controle Premium com até 55 GB, 5 GB só para redes sociais, roaming no Chile sem custo e o valor de um mês de volta no PIX.',
         h1='Até 55 GB, redes liberadas e o Chile <span class="realce realce--celular">sem custo.</span>',
         lead='O plano controle com mais internet: 5 GB só para redes sociais, Facebook, Instagram, X e Messenger liberados e roaming no Chile incluso.',
         specs=[('premium-dados.svg', 'Até 55 GB', 'na portabilidade'), ('premium-tecnologias.svg', 'Chile', 'roaming sem custo'), ('premium-ligacoes.svg', 'Ilimitadas', 'ligações para todo o Brasil'), ('premium-sms.svg', 'SMS', 'ilimitado')],
         quem=[('aviao', 'Quem viaja', 'Use o celular no Chile sem pagar nada a mais.'),
               ('play', 'Quem usa muita internet', 'Vídeo, mapa e música o dia inteiro, com folga.'),
               ('social', 'Quem vive nas redes', 'Redes liberadas e ainda 5 GB só para elas.')],
         benef=[('Até 55 GB trazendo o seu número', '30 GB do plano, 10 GB de bônus da oferta, 10 GB de bônus na portabilidade e 5 GB só para redes sociais. Com número novo, são 45 GB.', '!' + vis_num('55 GB', 'na portabilidade')),
                ('Chile sem custo adicional', 'Internet extra, ligações ilimitadas para o Brasil e dentro do Chile e SMS ilimitados, sem pagar nada a mais.', vis_num('Chile', 'roaming incluso')),
                ('Redes sociais liberadas', 'Facebook, Instagram, X e Messenger sem descontar da internet, com jornais e revistas, jogos, estudos e antivírus no plano.', vis_apps(['Facebook', 'Instagram', 'X', 'Messenger', 'Jornais e revistas', 'Antivírus']))],
         ups_titulo='Outros planos controle',
         ups=[card_cel('redes-sociais', 'Redes liberadas', 'Controle Redes Sociais', 'As mesmas redes liberadas, com até 46 GB.', 'redes'),
              card_cel('controle', 'Oferta do mês', 'Controle', 'Até 45 GB e Deezer Premium grátis por 3 meses.', 'controle')],
         faq=[('Como funciona o Chile sem custo?', 'Viajando para o Chile, você usa a internet extra do roaming e faz ligações e SMS ilimitados, sem cobrança adicional. A gente confirma a ativação com você antes da viagem.'),
              ('O que são os 5 GB só para redes sociais?', 'É uma internet separada, usada só nos apps de redes sociais. O resto da franquia fica livre para tudo.')] + FAQ_CTL),
    dict(id='aplus', slug='a-plus', nome='Controle A Plus', eyebrow='Plano Controle A Plus · O mais barato',
         titulo='Controle A Plus: o plano controle mais barato — Do Yourself',
         desc='Plano Controle A Plus com até 27 GB na portabilidade, 550 minutos de ligação, Messenger sem gastar a internet, roaming no Chile e 100% de cashback.',
         h1='O essencial do celular pelo menor <span class="realce realce--celular">preço.</span>',
         lead='Até 27 GB trazendo o seu número, 550 minutos de ligação para todo o Brasil e o mesmo valor com número novo.',
         specs=[('dados-moveis.svg', 'Até 27 GB', 'na portabilidade'), ('ligacoes.svg', '550 min', 'para todo o Brasil'), ('tecnologias.svg', 'Chile', 'roaming sem custo'), ('portabilidade.svg', 'Grátis', 'portabilidade')],
         quem=[('pessoa', 'Quem usa o básico', 'Mensagens, redes e mapa, sem exagero.'),
               ('cofre', 'Quem quer pagar pouco', 'O menor valor entre os planos controle.'),
               ('familia', 'Linha para a família', 'Ótimo para filhos, pais e avós.')],
         benef=[('Até 27 GB trazendo o seu número', '3 GB do plano, 20 GB de bônus da oferta e 4 GB de bônus especial. Com número novo, são 19 GB, pelo mesmo preço.', vis_num('27 GB', 'na portabilidade')),
                ('550 minutos de ligação', 'Para qualquer operadora, em todo o Brasil. Para quem fala mais ao telefone, os outros planos controle têm ligações ilimitadas.', vis_num('550', 'minutos por mês')),
                ('Chile sem custo e apps inclusos', 'Roaming no Chile sem pagar nada a mais, Messenger sem gastar a internet, plataforma de estudos, revistas, audiolivros e antivírus.', vis_apps(['Chile', 'Messenger', 'Estudos', 'Revistas', 'Audiolivros', 'Antivírus']))],
         ups_titulo='Quer ligações ilimitadas?',
         ups=[card_cel('controle', 'Oferta do mês', 'Controle', 'Ligações e SMS ilimitados, até 45 GB e Deezer Premium por 3 meses.', 'controle', escuro=True)],
         faq=[('550 minutos são suficientes para mim?', 'Para quem fala pouco ao telefone e usa mais mensagens, sim. Se você liga muito, o Controle tem ligações ilimitadas para todo o Brasil.')] + FAQ_CTL),
]

for d in PLANOS_CEL:
    specs = ''.join(f'<li><img src="img/icones/{ic}" alt=""><span><b>{a}</b>{b}</span></li>' for ic, a, b in d['specs'])
    quem = ''.join(f'<li class="surgir" style="--atraso:{.05 + i * .08:.2f}s"><span>{ICO[ic]}</span><b>{t}</b>{tx}</li>' for i, (ic, t, tx) in enumerate(d['quem']))
    corpo = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--celular fb-hero fb-plano-hero" id="plano" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--celular">{d['eyebrow']}</span>
            <h1 class="dy-display" id="hero-titulo">{d['h1']}</h1>
            <p class="dy-lead">{d['lead']}</p>
            <ul class="fb-specs" aria-label="O que vem no plano">{specs}</ul>
            <ul class="hero2__provas" aria-label="Vantagens">{verificado(['Cashback de 100%', 'Portabilidade grátis', 'Suporte 24h no WhatsApp'])}</ul>
          </div>
          <div class="hero2__visual">
            <div class="fb-preco" data-preco-card aria-live="polite" style="min-height:460px"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PARA QUEM É ============ -->
    <section class="secao fb-secao-curta" aria-labelledby="pq-titulo">
      <div class="container">
{cab('Para quem é', 'celular', 'Feito para quem usa o celular assim', id_='pq-titulo')}
        <ul class="fb-quem">{quem}</ul>
      </div>
    </section>

    <!-- ============ BENEFÍCIOS ============ -->
    <section class="secao secao--alt" aria-labelledby="bn-titulo">
      <div class="container">
{cab('O que vem no plano', 'celular', f'Tudo o que o {d["nome"]} entrega', id_='bn-titulo')}
        {benef(d['benef'])}
      </div>
    </section>

    <!-- ============ TODO CONTROLE ============ -->
    <section class="secao fb-secao-curta" aria-labelledby="tc-titulo">
      <div class="container">
{cab('E ainda', 'celular', 'O que todo plano controle tem', id_='tc-titulo')}
        <ul class="fb-faixa">
          <li class="surgir"><img src="img/icones/tecnologias.svg" alt=""><span><b>Roaming nacional</b>Internet e ligações em outros estados sem custo extra.</span></li>
          <li class="surgir" style="--atraso:.06s"><img src="img/icones/verificado.svg" alt=""><span><b>Cartão de TODOS</b>Descontos em consultas, exames e farmácias.</span></li>
          <li class="surgir" style="--atraso:.12s"><img src="img/icones/cofrinho.svg" alt=""><span><b>Conta sem surpresa</b>Valor fixo todo mês, no débito automático.</span></li>
        </ul>
      </div>
    </section>

    <!-- ============ COMO CONTRATAR ============ -->
    <section class="secao secao--alt" aria-labelledby="cc-titulo">
      <div class="container">
{cab('Como contratar', 'celular', 'Do clique ao chip funcionando', id_='cc-titulo')}
        {passos('celular', [
            (f'Clique em “Quero o {d["nome"]}”', 'Escolha se vai trazer o seu número e quantas linhas quer.'),
            ('Fale com a gente', 'No WhatsApp, confirmamos o pedido e fazemos o cadastro com você.'),
            ('Chip e ativação', 'Você recebe o chip, ativa e, na portabilidade, responde “SIM” ao SMS.'),
            ('100% de volta', 'O valor de um mês volta no PIX em até 7 dias depois da ativação.'),
        ]).replace('passos3 passos3--celular', 'passos3 passos3--4 passos3--celular')}
      </div>
    </section>

    <!-- ============ UPSELL E CROSS-SELL ============ -->
    <section class="secao" aria-labelledby="up-titulo">
      <div class="container">
{cab('Confira também', 'celular', d['ups_titulo'], id_='up-titulo')}
        <div class="fb-ups">{''.join(d['ups'])}</div>
        <p class="fb-sub">E mais para a sua casa</p>
        <div class="fb-ups">{UPS_CEL['fibra']}{UPS_CEL['energia']}</div>
      </div>
    </section>

{faq_itens(f'Dúvidas sobre o {d["nome"]}', d['faq'])}
    <!-- ============ CTA FINAL ============ -->
    <section class="secao cta2" aria-labelledby="cta-titulo" data-cta-final>
      <div class="container">
        <div class="fb-cta-final surgir">
          <h2 class="dy-h2" id="cta-titulo">Seu {d['nome']} está a um clique.</h2>
          <p class="dy-lead">Monte o pedido, fale com a gente no WhatsApp e receba <b data-plano-cb style="color:#fff">o valor de um mês</b> de volta depois da ativação do chip.</p>
          <div class="cta2__acoes">
            <a class="dy-btn dy-btn--primario dy-btn--g" data-plano-cta href="contratar.html?origem=celular&amp;plano={d['id']}&amp;para=cpf&amp;linhas=1">Quero o {d['nome']} <span class="seta-dir" aria-hidden="true">→</span></a>
            <a class="dy-btn dy-btn--contorno dy-btn--g" data-whatsapp="Oi! Vim pela página do plano {d['nome']} e quero tirar uma dúvida.">Falar no WhatsApp</a>
          </div>
          <ul class="fb-cta-final__selos"><li>Portabilidade grátis</li><li>Atendimento humano 24h</li><li>Cashback de 100%</li></ul>
        </div>
      </div>
    </section>
    <div class="fb-barra" data-fb-barra hidden><p class="fb-barra__txt" data-barra-txt></p><a class="dy-btn dy-btn--primario" href="contratar.html?origem=celular&amp;plano={d['id']}&amp;para=cpf&amp;linhas=1">Quero este plano</a></div>
'''
    pagina(f'celular/cpf/{d["slug"]}', d['titulo'], d['desc'], corpo, css_extra='fibra', scripts_extra=CEL_JS,
           body_attrs=f' data-cel-pg="{d["id"]}"', classe='tema-cel pg-plano')
