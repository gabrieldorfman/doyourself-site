# ruff: noqa
"""
Do Yourself — páginas de Internet Fibra (Hub and Spoke).
Executado de dentro de tools/paginas.py (usa os mesmos ajudantes: cab, passos, secao, pagina…).

Gera:
  internet-fibra.html                      Hub
  internet-fibra/casa.html                 Segmentada CPF
  internet-fibra/empresa.html              Segmentada CNPJ
  internet-fibra/casa/{500-mega,600-mega,800-mega,1-giga}.html   Páginas de plano

Arquitetura e copy: vault wiki/estrutura-site/arquitetura-paginas-planos.md
Preços: sempre do js/config.js (DY.catalogo), por região. Aqui não vai preço digitado.
"""

# ---------------------------------------------------------------------
#  Ícones (traço, 24×24, herdam a cor)
# ---------------------------------------------------------------------
def svg(d, extra=''):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"{extra}>{d}</svg>'

ICO = {
    'casa': svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>'),
    'predio': svg('<rect x="4" y="3" width="11" height="18" rx="1.5"/><path d="M15 9h4.5a.5.5 0 0 1 .5.5V21H15"/><path d="M8 7h3M8 11h3M8 15h3"/>'),
    'pessoa': svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>'),
    'familia': svg('<circle cx="8" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><path d="M14 20a4 4 0 0 1 7.5-1.9"/>'),
    'play': svg('<rect x="2.5" y="4.5" width="19" height="13" rx="2.5"/><path d="m10 8.5 5 2.5-5 2.5z" fill="currentColor"/><path d="M8 21h8"/>'),
    'game': svg('<path d="M6.5 7h11a4 4 0 0 1 3.9 4.8l-.9 4.5a2.6 2.6 0 0 1-4.6 1.1L14.5 16h-5l-1.4 1.4a2.6 2.6 0 0 1-4.6-1.1l-.9-4.5A4 4 0 0 1 6.5 7Z"/><path d="M8 10v3M6.5 11.5h3"/><circle cx="15.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="17" cy="12.5" r=".6" fill="currentColor"/>'),
    'loja': svg('<path d="M3.5 9 5 4h14l1.5 5"/><path d="M3.5 9a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5 11.5V20h14v-8.5"/><path d="M10 20v-5h4v5"/>'),
    'maleta': svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 12.5h18"/>'),
    'antena': svg('<path d="M12 12v9"/><circle cx="12" cy="10" r="1.6"/><path d="M8.5 6.5a5 5 0 0 0 0 7M15.5 6.5a5 5 0 0 1 0 7"/><path d="M5.6 3.6a9 9 0 0 0 0 12.8M18.4 3.6a9 9 0 0 1 0 12.8"/>'),
    'cartao': svg('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>'),
    'video': svg('<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>'),
    'nuvem': svg('<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 10Z"/><path d="M12 11v5M9.8 13.2 12 11l2.2 2.2"/>'),
    'escudo': svg('<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    'relogio': svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    'wifi': svg('<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.6a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>'),
    'raio': svg('<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12Z"/>'),
    'casa-grande': svg('<path d="M2.5 11 12 4l9.5 7"/><path d="M4.5 9.5V20h15V9.5"/><path d="M9 20v-5h6v5"/><path d="M16.5 4.5v3"/>'),
    'fone': svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13.5" width="4.5" height="6.5" rx="1.5"/><rect x="17" y="13.5" width="4.5" height="6.5" rx="1.5"/>'),
    'alerta': svg('<path d="M12 3.5 2.5 20h19Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".7" fill="currentColor"/>'),
    'pin': svg('<path d="M12 21.5s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor" stroke="none"/>'),
}

def verificado(itens):
    return ''.join(f'<li><img src="img/icones/verificado.svg" alt="">{p}</li>' for p in itens)


# ---------------------------------------------------------------------
#  Blocos comuns
# ---------------------------------------------------------------------
LOCAL_BARRA = f'''    <!-- ============ LOCALIZAÇÃO (por IP; troca por CEP ou Estado/Cidade) ============ -->
    <div class="local-barra">
      <div class="container local-barra__in">
        <span class="local-barra__pin">{ICO['pin']}</span>
        <span>Ofertas válidas para <b data-local>Paraná</b>.</span>
        <button type="button" class="local-barra__alterar" data-local-alterar>Não é a sua cidade? <u>Alterar</u></button>
      </div>
    </div>
'''

def faq_itens(titulo, itens, id_='duvidas', eyebrow='Dúvidas frequentes'):
    qs = ''.join(f'''
          <div class="pergunta{' aberta' if i == 0 else ''}"><button class="pergunta__btn" aria-expanded="{'true' if i == 0 else 'false'}">{q}<span class="pergunta__ico" aria-hidden="true"></span></button><div class="pergunta__resp"><div><p>{a}</p></div></div></div>''' for i, (q, a) in enumerate(itens))
    return f'''    <!-- ============ DÚVIDAS ============ -->
    <section class="secao" id="{id_}" aria-labelledby="{id_}-titulo">
      <div class="container faq2" data-faq>
{cab(eyebrow, '', titulo, id_=id_ + '-titulo')}
        <div class="faq2__lista" role="tabpanel">{qs}
        </div>
      </div>
    </section>
'''

def cta_net(origem_titulo, lead, para='casa', botao='Consultar meu endereço', zap_msg='Olá! Quero saber se tem fibra no meu endereço.'):
    return f'''    <!-- ============ CTA FINAL ============ -->
    <section class="secao cta2" aria-labelledby="cta-titulo">
      <div class="container">
        <div class="cta2__painel surgir">
          <h2 class="dy-h2" id="cta-titulo">{origem_titulo}</h2>
          <p class="dy-lead">{lead}</p>
          <div class="cta2__acoes">
            <a class="dy-btn dy-btn--primario dy-btn--g" href="contratar.html?origem=internet&amp;para={para}">{botao} <span class="seta-dir" aria-hidden="true">→</span></a>
            <a class="dy-btn dy-btn--contorno dy-btn--g" data-whatsapp="{zap_msg}">Falar no WhatsApp</a>
          </div>
          <p class="dy-apoio">Suporte 24 horas pelo WhatsApp · <span data-whatsapp-numero></span></p>
        </div>
      </div>
    </section>
'''

def secao_html(conteudo, id_='', alt=False, classe='', rotulo=''):
    i = f' id="{id_}"' if id_ else ''
    a = f' aria-labelledby="{rotulo}"' if rotulo else ''
    return f'''    <section class="secao{' secao--alt' if alt else ''}{(' ' + classe) if classe else ''}"{i}{a}>
      <div class="container">
{conteudo}
      </div>
    </section>
'''

ROTA_CABO = '''<div class="fb-rota surgir">
            <p class="fb-rota__tit">Fibra até o armário + cabo <span>comum no mercado</span></p>
            <svg viewBox="0 0 360 74" role="img" aria-label="A fibra chega até um armário na rua e o resto do caminho até a casa é feito por cabo metálico">
              <path class="fibra" d="M30 34H150" stroke-width="5" stroke-linecap="round"/>
              <path class="cobre" d="M178 34c10-10 16 10 26 0s16 10 26 0 16 10 26 0 16 10 26 0 14 8 20 0" stroke-width="4" fill="none" stroke-linecap="round"/>
              <rect class="no" x="8" y="18" width="24" height="32" rx="6" stroke-width="1.5"/><path class="ico" d="M20 24v20" stroke-width="2"/>
              <rect class="no" x="150" y="18" width="28" height="32" rx="6" stroke-width="1.5"/><path class="ico" d="M157 27h14M157 34h14M157 41h14" stroke-width="2"/>
              <rect class="no" x="318" y="14" width="34" height="38" rx="8" stroke-width="1.5"/><path class="ico" d="M326 34l9-8 9 8M328 32v11h14V32" stroke-width="2" fill="none"/>
              <text class="lbl" x="6" y="68">Rede</text><text class="lbl" x="143" y="68">Armário</text><text class="lbl" x="214" y="68">Cabo metálico</text><text class="lbl" x="318" y="68">Casa</text>
            </svg>
          </div>'''
ROTA_DY = '''<div class="fb-rota fb-rota--dy surgir" style="--atraso:.1s">
            <p class="fb-rota__tit">Nossa fibra <span>de ponta a ponta</span></p>
            <svg viewBox="0 0 360 74" role="img" aria-label="A nossa fibra vai direto da rede até dentro da casa, sem cabo metálico">
              <path class="fibra" d="M30 34H318" stroke-width="5" stroke-linecap="round"/>
              <path class="pulso" d="M30 34H318" stroke-width="3" stroke-linecap="round"/>
              <rect class="no" x="8" y="18" width="24" height="32" rx="6" stroke-width="1.5"/><path class="ico" d="M20 24v20" stroke-width="2"/>
              <rect class="no" x="318" y="14" width="34" height="38" rx="8" stroke-width="1.5"/><path class="ico" d="M326 34l9-8 9 8M328 32v11h14V32" stroke-width="2" fill="none"/>
              <text class="lbl" x="6" y="68">Rede</text><text class="lbl" x="130" y="68">100% fibra óptica</text><text class="lbl" x="318" y="68">Casa</text>
            </svg>
          </div>'''
FIBRA_X_CABO_SVG = f'''<div class="fb-caminho">
          {ROTA_CABO}
          {ROTA_DY}
        </div>'''

TABELA_FIBRA = '''<div class="fb-tabela surgir" style="margin-top:28px">
          <table>
            <thead><tr><th></th><th>Fibra até o armário + cabo</th><th class="dy">Nossa fibra (de ponta a ponta)</th></tr></thead>
            <tbody>
              <tr><th scope="row">Caminho</th><td>Fibra → armário na rua → cabo metálico → casa</td><td class="dy">Fibra direto até dentro da casa</td></tr>
              <tr><th scope="row">Interferência</td><td>Maior</td><td class="dy">Menor</td></tr>
              <tr><th scope="row">Com a distância</th><td>Perde qualidade</td><td class="dy">Mantém a velocidade</td></tr>
              <tr><th scope="row">Upload</th><td>Costuma ficar perto de 20% do download</td><td class="dy">50% do download, em todos os planos</td></tr>
            </tbody>
          </table>
        </div>'''.replace('<th scope="row">Interferência</td>', '<th scope="row">Interferência</th>')


# =====================================================================
#  HUB — /internet-fibra
# =====================================================================
hub = LOCAL_BARRA + f'''
    <!-- ============ HERO (texto à esquerda, planos à direita) ============ -->
    <section class="hero2 hero-pg hero-pg--internet fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--internet">Internet Fibra · Cashback no PIX</span>
            <h1 class="dy-display" id="hero-titulo">Internet fibra com <span class="realce realce--internet">dinheiro de volta.</span></h1>
            <p class="dy-lead">Planos de 500 Mega a 1 Giga, com instalação grátis e a Do Yourself cuidando de tudo, do pedido ao suporte. E <strong>metade de uma mensalidade volta para você no PIX</strong>.</p>
            <nav class="fb-seletor" aria-label="Para quem é a internet">
              <a href="/internet-fibra/casa"><span class="fb-seletor__ico">{ICO['casa']}</span><span><b>Para minha casa</b>Planos no CPF, com streaming</span></a>
              <a href="/internet-fibra/empresa"><span class="fb-seletor__ico">{ICO['predio']}</span><span><b>Para minha empresa</b>Planos no CNPJ ou MEI</span></a>
            </nav>
            <ul class="hero2__provas" aria-label="Vantagens">{verificado(['Instalação em até 48h', 'Wi-Fi 6 no 1 Giga', 'Suporte 24h no WhatsApp'])}</ul>
          </div>
          <div class="hero2__visual">
            <div class="fb-pilha" data-pilha-planos="casa" data-pilha-mais="#internet" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ COMO FUNCIONA ============ -->
    <section class="secao" id="como-funciona" aria-labelledby="cf-titulo">
      <div class="container">
{cab('Como funciona', 'internet', 'Você escolhe. A gente resolve o resto.', 'Do pedido à internet funcionando, sempre com uma pessoa de verdade do seu lado.', id_='cf-titulo')}
        {passos('internet', [
            ('Escolha o plano', 'Pelo site, em poucos cliques. Sem ligação de vendedor.'),
            ('Fale com a gente', 'No WhatsApp, confirmamos a cobertura do seu endereço e cuidamos do cadastro.'),
            ('Instalação em até 48h', 'O técnico instala, configura o Wi-Fi e testa a velocidade na sua frente.'),
            ('Cashback no PIX', 'Metade de uma mensalidade volta para você em até 7 dias depois da instalação.'),
        ]).replace('passos3 passos3--internet', 'passos3 passos3--4 passos3--internet')}
      </div>
    </section>

    <!-- ============ FIBRA x CABO ============ -->
    <section class="secao secao--alt" id="fibra" aria-labelledby="fc-titulo">
      <div class="container">
        <div class="fb-grade2">
          <div class="fb-grade2__copy surgir">
            <span class="dy-eyebrow dy-eyebrow--internet">Fibra de verdade</span>
            <h2 class="dy-h2" id="fc-titulo">Nem toda “fibra” chega até a sua casa.</h2>
            <p class="dy-lead">Muitas operadoras levam a fibra só até um armário na rua e fazem o resto do caminho por <strong>cabo coaxial ou metálico</strong>. É nesse trecho que a internet oscila, cai com chuva e perde velocidade.</p>
            <p class="dy-lead">A nossa fibra vai <strong>de ponta a ponta, até dentro do imóvel</strong>: menos interferência, mais estabilidade e upload de verdade.</p>
          </div>
          {FIBRA_X_CABO_SVG}
        </div>
        {TABELA_FIBRA}
      </div>
    </section>

{sec_net}
    <!-- ============ CASHBACK ============ -->
    <section class="secao" id="cashback" aria-labelledby="cb-titulo">
      <div class="container">
{cab('Cashback', '', 'Contratou, recebeu de volta.', 'Na internet fibra, <strong>50% de uma mensalidade</strong> volta para você, uma única vez, via PIX na sua conta bancária. Sem desconto escondido e sem pagar mais caro por isso.', id_='cb-titulo')}
        <div class="fb-calc surgir" data-calc>
          <div class="fb-calc__ops" data-calc-ops role="radiogroup" aria-label="Plano para calcular o cashback"></div>
          <div class="fb-calc__res" data-calc-res aria-live="polite"></div>
        </div>
      </div>
    </section>

    <!-- ============ INSTALAÇÃO + SUPORTE 24H ============ -->
    <section class="secao secao--alt" aria-labelledby="is-titulo">
      <div class="container">
{cab('Sem custo para começar', 'internet', 'Instalação por nossa conta. Suporte a qualquer hora.', id_='is-titulo')}
        <div class="fb-duo">
          <div class="fb-painel surgir">
            <span class="fb-painel__ico"><img src="img/icones/instalacao.svg" alt=""></span>
            <h3 class="dy-h3">Instalação e roteador grátis</h3>
            <p class="dy-texto">O técnico instala a fibra, configura o Wi-Fi e testa a velocidade contratada pelo cabo antes de ir embora. Sem taxa de instalação nos planos com fidelidade.</p>
            <ul class="fb-mini">
              <li><img src="img/icones/modem.svg" alt=""><span><b>Roteador incluso</b>Wi-Fi 5 nos planos até 800 Mega e Wi-Fi 6 no 1 Giga.</span></li>
              <li><img src="img/icones/download.svg" alt=""><span><b>Velocidade testada na hora</b>Você vê o resultado do teste junto com o técnico.</span></li>
              <li><img src="img/icones/map-marker.svg" alt=""><span><b>Mudou de casa?</b>A mudança de endereço é grátis.</span></li>
            </ul>
          </div>
          <div class="fb-painel fb-painel--zap surgir" style="--atraso:.1s">
            <span class="fb-24h"><b>24h</b><span>por dia, todos os dias</span></span>
            <h3 class="dy-h3">Um WhatsApp para tudo</h3>
            <p class="dy-texto">Dúvida no plano, reagendamento, segunda via, débito automático, ativação do streaming. Você não liga para central nenhuma: fala com a Do Yourself, a qualquer hora, e a gente resolve.</p>
            <ul class="fb-mini">
              <li><img src="img/icones/whatsapp-branco.svg" alt=""><span><b>Gente de verdade</b>Atendimento humano, sem menu de opções.</span></li>
              <li><img src="img/icones/verificado.svg" alt=""><span><b>Do pedido ao pós-venda</b>A mesma equipe acompanha você em todas as etapas.</span></li>
            </ul>
            <a class="dy-btn dy-btn--whatsapp" data-whatsapp="Olá! Vim pela página de Internet Fibra e tenho uma dúvida.">Falar no WhatsApp</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ ESCOLHA SEU CAMINHO ============ -->
    <section class="secao" aria-labelledby="cm-titulo">
      <div class="container">
{cab('Para quem é', 'internet', 'Escolha o seu caminho', id_='cm-titulo')}
        <div class="fb-caminhos">
          <a class="fb-caminho-card surgir" href="/internet-fibra/casa">
            <span class="fb-caminho-card__ico">{ICO['casa']}</span>
            <h3 class="dy-h3">Internet para Casa</h3>
            <p>Para quem mora sozinho, famílias, gamers e casas grandes. Streaming incluso e Wi-Fi 6 no 1 Giga.</p>
            <div class="fb-caminho-card__tags"><span>Contrato no CPF</span><span>Streaming</span><span>Fidelidade de 12 meses</span></div>
            <span class="fb-caminho-card__ir">Ver planos para casa →</span>
          </a>
          <a class="fb-caminho-card fb-caminho-card--emp surgir" style="--atraso:.1s" href="/internet-fibra/empresa">
            <span class="fb-caminho-card__ico">{ICO['predio']}</span>
            <h3 class="dy-h3">Internet para Empresa</h3>
            <p>Para MEI, lojas, escritórios e quem não pode ficar offline. Contrato no CNPJ, instalação onde você precisar.</p>
            <div class="fb-caminho-card__tags"><span>Contrato no CNPJ ou MEI</span><span>Upload de 50%</span><span>Pode instalar em casa</span></div>
            <span class="fb-caminho-card__ir">Ver planos para empresa →</span>
          </a>
        </div>
      </div>
    </section>

{faq_itens('Dúvidas sobre a internet fibra', [
    ('O que é a Do Yourself e como ela devolve dinheiro?', 'A Do Yourself é uma marca digital que reúne internet fibra, planos de celular e energia solar por assinatura. Somos parceiros oficiais das empresas que prestam o serviço: em vez de gastar com propaganda, devolvemos parte do que recebemos em cada contratação direto para você, em cashback no PIX.'),
    ('Quanto de cashback eu recebo e quando cai no PIX?', '<b>50% de uma mensalidade</b> do plano, uma única vez, via PIX na sua conta bancária, em até 7 dias depois da instalação. No 1 Giga de R$ 129,99, por exemplo, você recebe R$ 64,99.'),
    ('A Do Yourself é a operadora?', 'Não. A fibra é de uma operadora parceira, com rede própria em todo o país. A Do Yourself cuida de todo o seu atendimento: contratação, instalação, fatura e suporte, pelo WhatsApp, 24 horas por dia.'),
    ('Qual a diferença entre fibra de ponta a ponta e cabo?', 'Na fibra de ponta a ponta, o sinal vai por fibra óptica até dentro do imóvel. Em muitas redes, a fibra para num armário na rua e o resto do caminho é feito por cabo metálico, que sofre mais interferência e perde qualidade com a distância.'),
    ('Quanto tempo leva a instalação?', 'Em até 48 horas depois que o cadastro é aprovado, conforme a agenda do técnico na sua região. A gente agenda pelo WhatsApp no horário que for melhor para você.'),
    ('Tem fidelidade? E se eu precisar cancelar?', 'Sim: 12 meses nos planos para casa (CPF) e 24 meses nos planos para empresa (CNPJ). É a fidelidade que deixa a instalação gratuita. Se cancelar antes, a multa é proporcional e diminui a cada mês completo de uso. Se você mudar para um endereço sem cobertura, o cancelamento sai sem multa.'),
    ('O roteador é Wi-Fi 6?', 'No 1 Giga, sim. Os planos de 500, 600 e 800 Mega vêm com Wi-Fi 5, rápido e estável para o dia a dia. Em todos, o roteador vem incluso, sem custo.'),
    ('Posso contratar no CNPJ e usar em casa?', 'Pode. Com CNPJ ou MEI, você contrata os planos para empresa e instala onde quiser, inclusive em casa. O contrato fica no nome da empresa.'),
    ('E se a fibra não chegar no meu endereço?', 'A gente avisa na hora. Para empresas (CNPJ ou MEI) existe a internet sem fio, que chega pelo sinal 4G até um roteador, sem obra. E para todo mundo dá para economizar na conta de luz com a energia solar por assinatura.'),
    ('Como consulto a cobertura no meu endereço?', 'Clique em “Consultar meu endereço” e informe o CEP e o número do imóvel. A cobertura da fibra muda de rua para rua, e às vezes de um número para o outro, por isso pedimos o número.'),
])}
{cta_net('Pronto para pagar menos e navegar melhor?', 'Informe o CEP e o número. Em segundos você vê os planos disponíveis no seu endereço e quanto volta para você.', para='casa', botao='Descobrir as ofertas no meu endereço')}'''

pagina('internet-fibra', 'Internet Fibra com cashback no PIX — Do Yourself',
       'Internet fibra de 500 Mega a 1 Giga, com fibra até dentro de casa, instalação grátis, suporte 24h no WhatsApp e metade de uma mensalidade de volta no PIX.',
       hub, css_extra='fibra', scripts_extra='\n  <script src="js/fibra.js"></script>', body_attrs=' data-tipo-net="casa"')


# =====================================================================
#  PERSONAS
# =====================================================================
def persona(d, i, tipo):
    prem = d.get('premium')
    stream = d.get('stream', '')
    preco = f'<p class="fb-persona__preco" data-preco-plano="{d["plano"]}" data-tipo="{tipo}"></p>' if d.get('plano') else (f'<p class="fb-persona__preco">{d["preco_txt"]}</p>' if d.get('preco_txt') else '')
    acoes = d['acoes']
    return f'''
          <article class="fb-persona" id="{d['id']}">
            <div class="fb-persona__copy surgir">
              <span class="fb-persona__quem">{ICO[d['ico']]}{d['quem']}</span>
              <h3 class="dy-h2">{d['titulo']}</h3>
              <p class="dy-lead">{d['texto']}</p>
              <ul class="fb-ganchos">{''.join(f'<li>{g}</li>' for g in d['ganchos'])}</ul>
              {preco}
              <div class="fb-persona__acoes">{acoes}</div>
            </div>
            <div class="fb-persona__vis{' fb-persona__vis--premium' if prem else ''} surgir" style="--atraso:.1s" aria-hidden="true">
              <span class="fb-persona__ilu">{ICO[d['ico']]}</span>
              <p class="fb-persona__big"><b>{d['big']}</b><span>{d['big_u']}</span></p>
              <div>
                {stream}
                <div class="fb-persona__specs">{''.join(f'<span>{s}</span>' for s in d['specs'])}</div>
              </div>
            </div>
          </article>'''

def acoes_casa(pid, slug, nome):
    return (f'<a class="dy-btn dy-btn--primario" href="/internet-fibra/casa/{slug}">Ver todos os benefícios <span class="seta-dir" aria-hidden="true">→</span></a>'
            f'<a class="dy-link" href="contratar.html?origem=internet&amp;plano={pid}&amp;para=casa">Quero o {nome}</a>')

LOGO = {
    'paramount': '<img src="img/apps/paramount-tile.svg" alt="Paramount+">',
    'globoplay': '<img src="img/apps/globoplay.png" alt="Globoplay">',
    'hbo': '<img src="img/apps/hbo-max.png" alt="HBO Max">',
    'yt': '<img class="yt" src="img/apps/youtube-premium-logo.svg" alt="YouTube Premium">',
}

PERSONAS_CASA = [
    dict(id='sozinho', ico='pessoa', quem='Para quem mora sozinho(a)', plano='500', big='500', big_u='Mega',
         titulo='Chegar em casa e simplesmente funcionar.',
         texto='Você passa o dia fora e, quando chega, só quer abrir o celular e escolher a série sem ver a rodinha girando. Fibra até dentro de casa, estável de manhã, à noite e em dia de chuva, sem pagar por velocidade que você não usa.',
         ganchos=['500 Mega', '250 Mega de upload', 'Livros, revistas e cursos inclusos'], specs=['Wi-Fi 5', 'Upload de 250 Mega', 'Instalação grátis'],
         acoes=acoes_casa('500', '500-mega', '500 Mega')),
    dict(id='familia', ico='familia', quem='Para famílias que dividem a tela', plano='600', big='600', big_u='Mega',
         titulo='Um assiste à série, outro joga, outro está na chamada. E ninguém reclama.',
         texto='Quando a casa divide a internet, a briga é pela velocidade. O 600 Mega dá conta de todo mundo ao mesmo tempo e pode vir com Paramount+ ou Globoplay incluso. A TV da sala e o celular de cada um funcionando juntos, numa conta só.',
         ganchos=['Paramount+ ou Globoplay', '300 Mega de upload', 'Antivírus incluso'], specs=['Wi-Fi 5', 'Upload de 300 Mega', 'Streaming opcional'],
         stream=f'<div class="fb-persona__stream">{LOGO["paramount"]}{LOGO["globoplay"]}</div>',
         acoes=acoes_casa('600', '600-mega', '600 Mega')),
    dict(id='video', ico='play', quem='Para quem vive de vídeo e música', plano='800', big='800', big_u='Mega',
         titulo='Pular anúncio nunca mais vai ser parte do seu dia.',
         texto='O vídeo começa na hora, a música toca com a tela desligada e nada interrompe no meio. Com 800 Mega e YouTube Premium incluso, com o YouTube Music junto, dá para assistir em vários aparelhos e baixar para ver offline.',
         ganchos=['YouTube Premium incluso', 'YouTube Music', 'Vídeos para ver offline'], specs=['Wi-Fi 5', 'Upload de 400 Mega', 'Sem anúncios'],
         stream=f'<div class="fb-persona__stream">{LOGO["yt"]}</div>',
         acoes=acoes_casa('800', '800-mega', '800 Mega')),
    dict(id='gamer', ico='game', quem='Para gamers e casas grandes', plano='1000', big='1', big_u='Giga', premium=True,
         titulo='A internet mais rápida da casa. E a última que você vai precisar trocar.',
         texto='1 Giga de download, 500 Mega de upload e roteador Wi-Fi 6, que organiza dezenas de aparelhos ao mesmo tempo sem engasgar. Menos atraso no jogo, menos travada na reunião e sinal chegando mais longe. E dá para somar Paramount+ ou HBO Max.',
         ganchos=['Wi-Fi 6', '500 Mega de upload', 'Clube de jogos incluso'], specs=['Wi-Fi 6', 'Upload de 500 Mega', 'Paramount+ ou HBO Max opcional'],
         acoes=acoes_casa('1000', '1-giga', '1 Giga')),
]

PERSONAS_EMP = [
    dict(id='mei', ico='casa', quem='Para MEI e quem trabalha de casa', plano='500', big='500', big_u='Mega',
         titulo='Seu negócio cabe em casa. A internet também precisa caber no orçamento.',
         texto='Para quem atende clientes pelo WhatsApp, emite nota, faz reunião de vez em quando e não pode ficar sem conexão. Contrato no seu CNPJ ou MEI, instalação na sua casa e uma conta que não pesa no caixa.',
         ganchos=['Contrato no MEI', 'Instalação em casa', 'Cashback no PIX'], specs=['Wi-Fi 5', 'Upload de 250 Mega', 'Fibra até o imóvel'],
         acoes='<a class="dy-btn dy-btn--primario" href="contratar.html?origem=internet&amp;plano=e500&amp;para=empresa">Quero o 500 Mega <span class="seta-dir" aria-hidden="true">→</span></a><a class="dy-link" data-whatsapp="Olá! Tenho MEI e quero saber da internet para empresa.">Tirar dúvida no WhatsApp</a>'),
    dict(id='loja', ico='loja', quem='Para lojas e atendimento ao público', plano='600', big='600', big_u='Mega',
         titulo='Maquininha passando, Wi-Fi para o cliente e o sistema no ar.',
         texto='Na loja, internet lenta vira fila e venda perdida. O 600 Mega dá conta do caixa, da maquininha, das câmeras e do Wi-Fi dos clientes ao mesmo tempo, com antivírus incluso para proteger o computador do balcão.',
         ganchos=['300 Mega de upload', 'Proteção digital inclusa', 'Vários aparelhos ao mesmo tempo'], specs=['Wi-Fi 5', 'Upload de 300 Mega', 'Antivírus incluso'],
         acoes='<a class="dy-btn dy-btn--primario" href="contratar.html?origem=internet&amp;plano=e600&amp;para=empresa">Quero o 600 Mega <span class="seta-dir" aria-hidden="true">→</span></a><a class="dy-link" data-whatsapp="Olá! Quero internet para a minha loja.">Tirar dúvida no WhatsApp</a>'),
    dict(id='escritorio', ico='maleta', quem='Para escritórios e equipes', plano='1000', big='1', big_u='Giga', premium=True,
         titulo='A equipe inteira em reunião, na nuvem e no sistema. Sem disputa por internet.',
         texto='Escritório com várias pessoas precisa de upload para videochamadas, arquivos na nuvem e sistemas de gestão. O 1 Giga entrega 500 Mega de upload e roteador Wi-Fi 6, e inclui o Gestão Digital, app para acompanhar a localização e o uso de apps da equipe.',
         ganchos=['500 Mega de upload', 'Wi-Fi 6', 'Gestão Digital incluso'], specs=['Wi-Fi 6', 'Upload de 500 Mega', 'Fidelidade de 24 meses'],
         acoes='<a class="dy-btn dy-btn--primario" href="contratar.html?origem=internet&amp;plano=e1000&amp;para=empresa">Quero o 1 Giga <span class="seta-dir" aria-hidden="true">→</span></a><a class="dy-link" data-whatsapp="Olá! Quero internet para o meu escritório.">Tirar dúvida no WhatsApp</a>'),
    dict(id='sem-fibra', ico='antena', quem='Para empresas onde a fibra não chega', big='4G', big_u='sem fio',
         titulo='Sem fibra na rua? Sua empresa conectada mesmo assim.',
         texto='Galpão afastado, sala comercial nova, zona rural. A internet sem fio para empresas chega pelo sinal 4G até um roteador, sem técnico e sem obra: é só ligar na tomada. E você testa por 7 dias. Se a cobertura não agradar, devolve sem multa.',
         ganchos=['Sem instalação', 'Teste de 7 dias', 'Franquias de 40 GB a 500 GB'], specs=['2 a 5 Mbps', 'Roteador emprestado', 'Só para CNPJ e MEI'],
         preco_txt='Indicado para navegação, maquininha, sistema e WhatsApp. Não serve para streaming em 4K nem para muitas pessoas ao mesmo tempo.',
         acoes='<a class="dy-btn dy-btn--primario" data-whatsapp="Olá! O meu endereço não tem fibra. Quero saber da internet sem fio para empresas.">Consultar pelo WhatsApp <span class="seta-dir" aria-hidden="true">→</span></a>'),
]


# =====================================================================
#  INTERNET PARA CASA — /internet-fibra/casa
# =====================================================================
chips = ''.join(f'<a href="#{d["id"]}">{t}</a>' for d, t in zip(PERSONAS_CASA, ['Moro sozinho(a)', 'Família', 'Vídeo e música', 'Jogos e casa grande']))
casa = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--internet fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--internet">Internet para Casa · Planos no CPF</span>
            <h1 class="dy-display" id="hero-titulo">A internet certa para o jeito que a sua casa <span class="realce realce--internet">vive.</span></h1>
            <p class="dy-lead">Escolha pelo seu dia a dia, não pela tabela de Mega. Todos os planos com fibra até dentro de casa, instalação grátis e <strong>metade de uma mensalidade de volta no PIX</strong>.</p>
            <div><p class="dy-apoio" style="margin-bottom:10px">Qual é a sua casa?</p><nav class="fb-chips" aria-label="Perfis">{chips}</nav></div>
            <ul class="hero2__provas" aria-label="Vantagens">{verificado(['Streaming incluso', 'Wi-Fi 6 no 1 Giga', 'Suporte 24h no WhatsApp'])}</ul>
          </div>
          <div class="hero2__visual">
            <div class="fb-pilha" data-pilha-planos="casa" data-pilha-mais="#comparar" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PERSONAS ============ -->
    <section class="secao" id="perfis" aria-labelledby="pf-titulo">
      <div class="container">
{cab('Para cada casa', 'internet', 'Qual delas é a sua casa?', 'Quatro jeitos de usar a internet, quatro planos. Escolha o que parece com a sua rotina.', id_='pf-titulo')}
        <div class="fb-personas">{''.join(persona(d, i, 'casa') for i, d in enumerate(PERSONAS_CASA))}
        </div>
        <div class="fb-nicho surgir">
          <div><b>Precisa de ainda mais?</b><p>2 Giga com Wi-Fi 7, 1 Giga de upload e quatro streamings inclusos. Para criadores de conteúdo e casas superconectadas.</p></div>
          <a class="dy-btn" data-whatsapp="Olá! Quero saber do plano de 2 Giga.">Conhecer o 2 Giga →</a>
        </div>
      </div>
    </section>

    <!-- ============ STREAMING ============ -->
    <section class="secao secao--alt" aria-labelledby="st-titulo">
      <div class="container">
{cab('Streaming incluso', 'internet', 'O streaming já vem no preço do plano', 'Você ativa pelo app ou pela TV, e a gente ajuda no passo a passo pelo WhatsApp.', id_='st-titulo')}
        <div class="stream3">
          <div class="stream surgir"><b>600 Mega</b><div class="stream__logos"><img src="img/apps/paramount-tile.svg" alt="Paramount+"><img src="img/apps/globoplay.png" alt="Globoplay"></div><span>Paramount+ ou Globoplay, à sua escolha</span></div>
          <div class="stream surgir" style="--atraso:.08s"><b>800 Mega</b><div class="stream__logos"><img class="yt" src="img/apps/youtube-premium-logo.svg" alt="YouTube Premium"></div><span>YouTube Premium já incluso</span></div>
          <div class="stream surgir" style="--atraso:.16s"><b>1 Giga</b><div class="stream__logos"><img src="img/apps/paramount-44.svg" alt="Paramount+"><img src="img/apps/hbo-max.png" alt="HBO Max"></div><span>Paramount+ ou HBO Max, à sua escolha</span></div>
        </div>
      </div>
    </section>

    <!-- ============ WI-FI 5 x WI-FI 6 ============ -->
    <section class="secao" aria-labelledby="wf-titulo">
      <div class="container">
{cab('Wi-Fi', 'internet', 'Wi-Fi 5 ou Wi-Fi 6: qual vem no seu plano?', 'O roteador vem incluso em todos os planos. O que muda é a tecnologia.', id_='wf-titulo')}
        <div class="fb-tabela surgir">
          <table>
            <thead><tr><th></th><th>Wi-Fi 5</th><th class="dy">Wi-Fi 6</th></tr></thead>
            <tbody>
              <tr><th scope="row">Vem nos planos</th><td>500, 600 e 800 Mega</td><td class="dy">1 Giga</td></tr>
              <tr><th scope="row">Ideal para</th><td>Séries em HD, redes sociais, videochamada e home office</td><td class="dy">Muitos aparelhos, streaming em 4K, jogos online e casa inteligente</td></tr>
              <tr><th scope="row">Alcance</th><td>Casas e apartamentos médios</td><td class="dy">Maior, e lida melhor com paredes</td></tr>
              <tr><th scope="row">Atraso (latência)</th><td>Bom para chamadas e navegação</td><td class="dy">Menor, melhor para jogos</td></tr>
              <tr><th scope="row">Segurança</th><td>WPA2</td><td class="dy">WPA3, a mais nova</td></tr>
            </tbody>
          </table>
        </div>
        <p class="fb-nota">Para aproveitar o Wi-Fi 6, o celular, a TV ou o notebook também precisam ser compatíveis.</p>
      </div>
    </section>

    <!-- ============ DICAS DE WI-FI ============ -->
    <section class="secao secao--alt" aria-labelledby="dc-titulo">
      <div class="container">
{cab('Dicas', 'internet', 'Sete coisas que mudam o seu Wi-Fi', id_='dc-titulo')}
        <ol class="fb-dicas">
          <li class="surgir"><b>Posição do roteador</b>No centro da casa, em lugar aberto e alto. Nada de escondido ou no chão.</li>
          <li class="surgir"><b>Faixa de frequência</b>2,4 GHz alcança mais longe. 5 GHz é mais rápida perto do roteador.</li>
          <li class="surgir"><b>Obstáculos</b>Paredes, portas, espelhos, móveis e eletrodomésticos enfraquecem o sinal.</li>
          <li class="surgir"><b>Distância</b>Quanto mais longe do roteador, mais fraco o sinal.</li>
          <li class="surgir"><b>Tecnologia do roteador</b>Wi-Fi 6 lida melhor com muitos aparelhos e paredes.</li>
          <li class="surgir"><b>Aparelho compatível</b>O celular ou a TV precisam ter a mesma tecnologia do roteador.</li>
          <li class="surgir"><b>Aparelhos conectados</b>Quanto mais aparelhos ao mesmo tempo, mais a internet é dividida.</li>
        </ol>
      </div>
    </section>

    <!-- ============ COMPARAR ============ -->
    <section class="secao" id="comparar" aria-labelledby="cp-titulo">
      <div class="container">
{cab('Todos os planos', 'internet', 'Quer ver lado a lado?', id_='cp-titulo')}
        <ul class="fb-faixa" style="margin-bottom:24px">
          <li class="surgir"><img src="img/icones/cofrinho.svg" alt=""><span><b>Cashback no PIX</b>50% de uma mensalidade, em até 7 dias depois da instalação.</span></li>
          <li class="surgir"><img src="img/icones/instalacao.svg" alt=""><span><b>Instalação grátis</b>Em até 48 horas, com teste de velocidade na hora.</span></li>
          <li class="surgir"><img src="img/icones/map-marker.svg" alt=""><span><b>Mudança grátis</b>Mudou de casa? A internet vai junto, sem custo.</span></li>
        </ul>
        <details class="fb-comparar surgir">
          <summary><span>Comparar os planos para <span data-local>Paraná</span></span></summary>
          <div class="fb-tabela" data-comparar="casa"></div>
        </details>
        <p class="fb-nota">Valores no débito automático. No boleto ou PIX, R$ 10 a mais por mês.</p>
      </div>
    </section>

{faq_itens('Dúvidas sobre a internet para casa', [
    ('Quantos Mega eu preciso?', 'Para uma ou duas pessoas, 500 Mega dá conta do dia a dia. Com a família toda conectada e várias TVs, vá de 600 ou 800 Mega. Para jogos online, muitos aparelhos e casas grandes, o 1 Giga com Wi-Fi 6.'),
    ('O 800 Mega e o 1 Giga custam o mesmo. Qual escolher?', 'Escolha pelo que você mais usa. O <b>800 Mega</b> é o plano do YouTube Premium: vídeos e música sem anúncios. O <b>1 Giga</b> é o mais rápido, com Wi-Fi 6 e 500 Mega de upload, e você ainda pode somar Paramount+ ou HBO Max.'),
    ('O streaming aumenta o preço?', 'O valor do streaming já aparece somado no preço de cada opção. No 800 Mega, o YouTube Premium já está incluso no valor do plano.'),
    ('Como ativo o streaming e os apps inclusos?', 'Depois da instalação, você recebe um e-mail com o link para ativar. Se preferir, a gente faz o passo a passo junto com você pelo WhatsApp.'),
    ('Tem fidelidade?', 'Sim, de 12 meses. É ela que deixa a instalação e o roteador gratuitos. Se precisar cancelar antes, a multa é proporcional e diminui a cada mês completo.'),
    ('E se eu me mudar?', 'A mudança de endereço é grátis. Se o novo endereço não tiver cobertura, o cancelamento sai sem multa.'),
    ('Já tenho internet de outra operadora. Como faço?', 'Não existe portabilidade de internet. A dica é instalar a nossa fibra primeiro e só depois cancelar a antiga, para não ficar nenhum dia sem internet.'),
    ('E se eu pagar no boleto ou PIX?', 'O valor fica R$ 10 maior por mês. No débito automático você paga o menor preço e não precisa lembrar do vencimento.'),
])}
{cta_net('Descubra o que chega no seu endereço', 'Informe o CEP e o número. Em segundos você vê os planos disponíveis e quanto volta para você no PIX.', para='casa')}'''

pagina('internet-fibra/casa', 'Internet para Casa com streaming e cashback — Do Yourself',
       'Planos de internet fibra para casa de 500 Mega a 1 Giga, com streaming incluso, Wi-Fi 6 no 1 Giga, instalação grátis e metade de uma mensalidade de volta no PIX.',
       casa, css_extra='fibra', scripts_extra='\n  <script src="js/fibra.js"></script>', body_attrs=' data-tipo-net="casa"')


# =====================================================================
#  INTERNET PARA EMPRESA — /internet-fibra/empresa
# =====================================================================
empresa = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--internet fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--internet">Internet para Empresa · CNPJ e MEI</span>
            <h1 class="dy-display" id="hero-titulo">Internet que não para o seu <span class="realce realce--internet">negócio.</span></h1>
            <p class="dy-lead">Fibra de ponta a ponta para CNPJ e MEI, com upload de verdade, roteador incluso e a Do Yourself cuidando do suporte <strong>24 horas por dia</strong> pelo WhatsApp.</p>
            <p class="fb-faixa-cnpj">{ICO['predio']}Contrato no CNPJ. Pode instalar no escritório, na loja ou em casa.</p>
            <div class="fb-hero__acoes">
              <a class="dy-btn dy-btn--primario dy-btn--g" href="#perfis">Ver o plano ideal <span class="seta-dir" aria-hidden="true">→</span></a>
              <a class="dy-link" data-whatsapp="Olá! Quero internet fibra para a minha empresa.">Falar com um especialista</a>
            </div>
          </div>
          <div class="hero2__visual">
            <div class="fb-pilha" data-pilha-planos="empresa" data-pilha-mais="#comparar" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ QUANTO CUSTA FICAR OFFLINE ============ -->
    <section class="secao" aria-labelledby="pj-titulo">
      <div class="container">
{cab('Ficar sem internet é prejuízo', 'internet', 'Quanto custa uma hora offline na sua empresa?', id_='pj-titulo')}
        <ul class="fb-prejuizo">
          <li class="surgir"><span>{ICO['cartao']}</span><b>Venda que não passa</b>A maquininha trava, o PIX não confirma e o cliente vai embora.</li>
          <li class="surgir" style="--atraso:.08s"><span>{ICO['video']}</span><b>Reunião que cai</b>A chamada com o cliente congela no meio da proposta.</li>
          <li class="surgir" style="--atraso:.16s"><span>{ICO['nuvem']}</span><b>Sistema fora do ar</b>Nota fiscal, estoque e agenda param junto com a internet.</li>
        </ul>
        <p class="fb-frase surgir">Uma hora sem internet pode custar mais que um mês de plano.</p>
      </div>
    </section>

    <!-- ============ PERSONAS ============ -->
    <section class="secao secao--alt" id="perfis" aria-labelledby="pf-titulo">
      <div class="container">
{cab('Para cada negócio', 'internet', 'Qual é o tamanho da sua operação?', 'Quatro perfis de empresa, quatro soluções. Todas com contrato no CNPJ ou MEI.', id_='pf-titulo')}
        <div class="fb-personas">{''.join(persona(d, i, 'empresa') for i, d in enumerate(PERSONAS_EMP))}
        </div>
      </div>
    </section>

    <!-- ============ UPLOAD NA PRÁTICA ============ -->
    <section class="secao" aria-labelledby="up-titulo">
      <div class="container">
        <div class="fb-grade2">
          <div class="fb-grade2__copy surgir">
            <span class="dy-eyebrow dy-eyebrow--internet">Upload de 50%</span>
            <h2 class="dy-h2" id="up-titulo">Sua empresa também envia. E envio precisa de upload.</h2>
            <p class="dy-lead">Videochamada, backup na nuvem, nota fiscal, câmeras e arquivos para o cliente: tudo isso usa <strong>upload</strong>. Garantimos <strong>metade da velocidade de download</strong> no envio, em todos os planos. A média do mercado fica perto de 20%.</p>
          </div>
          <div class="fb-tabela surgir" style="--atraso:.1s">
            <table>
              <thead><tr><th>Plano</th><th>Upload</th><th>Enviar 1 GB*</th></tr></thead>
              <tbody>
                <tr><th scope="row">500 Mega</th><td>250 Mega</td><td>cerca de 32 segundos</td></tr>
                <tr><th scope="row">600 Mega</th><td>300 Mega</td><td>cerca de 27 segundos</td></tr>
                <tr><th scope="row">1 Giga</th><td class="dy">500 Mega</td><td class="dy">cerca de 16 segundos</td></tr>
                <tr><th scope="row">1 Giga com 20% de upload</th><td>200 Mega</td><td>cerca de 40 segundos</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="fb-nota">* Tempo teórico, com o computador ligado no cabo e a velocidade total disponível.</p>
      </div>
    </section>

    <!-- ============ IP FIXO x DINÂMICO ============ -->
    <section class="secao secao--alt" id="ip" aria-labelledby="ip-titulo">
      <div class="container">
        <div class="fb-escuro surgir">
          <div class="fb-grade2__copy">
            <span class="dy-eyebrow">Nota técnica</span>
            <h2 class="dy-h2" id="ip-titulo">IP fixo ou dinâmico: qual a sua empresa precisa?</h2>
            <p>O <b style="color:#fff">IP dinâmico</b> muda de tempos em tempos e é o padrão da maioria das empresas: mais simples de gerenciar e mais protegido contra ataques direcionados. O <b style="color:#fff">IP fixo</b> só é necessário para quem tem servidor próprio ou câmeras e sistemas acessados de fora pelo endereço.</p>
            <ul class="fb-lista">
              <li><span><b>Nossos planos usam IP dinâmico</b>, em todos os planos para empresa.</span></li>
              <li><span><b>Câmeras e sistemas com app ou acesso pela nuvem</b> funcionam normalmente.</span></li>
              <li><span><b>Precisa acessar algo de fora pelo endereço?</b> Na maioria dos casos, um serviço de DNS dinâmico resolve.</span></li>
            </ul>
          </div>
          <div class="fb-escuro__aviso">
            <p><b>Seu sistema pede IP fixo?</b></p>
            <p>Fale com a gente antes de contratar. A gente olha o seu caso e diz com sinceridade se a nossa fibra atende.</p>
            <div class="fb-escuro__acoes" style="margin-top:14px"><a class="dy-btn dy-btn--contorno" data-whatsapp="Olá! O meu sistema usa IP fixo. A internet para empresa atende?">Perguntar no WhatsApp</a></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ ESTABILIDADE + SUPORTE ============ -->
    <section class="secao" aria-labelledby="es-titulo">
      <div class="container">
{cab('Continuidade', 'internet', 'Feita para quem não pode parar', id_='es-titulo')}
        <ul class="fb-faixa">
          <li class="surgir"><img src="img/icones/lista-wifi.svg" alt=""><span><b>Fibra até dentro do imóvel</b>Sem trecho de cabo metálico no caminho: menos interferência e mais estabilidade.</span></li>
          <li class="surgir" style="--atraso:.08s"><img src="img/icones/download.svg" alt=""><span><b>Velocidade testada na instalação</b>O técnico mede a velocidade contratada pelo cabo, na sua frente.</span></li>
          <li class="surgir" style="--atraso:.16s"><img src="img/icones/telefone.svg" alt=""><span><b>Suporte 24h pelo WhatsApp</b>A Do Yourself abre e acompanha o chamado com a operadora por você.</span></li>
        </ul>
      </div>
    </section>

    <!-- ============ REQUISITOS ============ -->
    <section class="secao secao--alt" aria-labelledby="rq-titulo">
      <div class="container">
{cab('Antes de contratar', 'internet', 'O que a sua empresa precisa ter', id_='rq-titulo')}
        <ul class="fb-req">
          <li class="surgir"><b>180 dias</b><strong>de MEI aberto</strong>Tempo mínimo de abertura para MEI.</li>
          <li class="surgir"><b>120 dias</b><strong>para os demais CNPJs</strong>Empresas com mais tempo de abertura.</li>
          <li class="surgir"><b>2 endereços</b><strong>por CNPJ</strong>Matriz e filial, ou empresa e casa.</li>
          <li class="surgir"><b>24 meses</b><strong>de fidelidade</strong>É ela que deixa a instalação grátis.</li>
        </ul>
        <p class="fb-nota">A análise de crédito é feita sobre o CNPJ, e a biometria pelo sócio ou representante legal. Não atendemos órgãos públicos.</p>
      </div>
    </section>

    <!-- ============ COMPARAR ============ -->
    <section class="secao" id="comparar" aria-labelledby="cp-titulo">
      <div class="container">
{cab('Todos os planos', 'internet', 'Planos para empresa lado a lado', id_='cp-titulo')}
        <details class="fb-comparar surgir" open>
          <summary><span>Planos para empresa em <span data-local>Paraná</span></span></summary>
          <div class="fb-tabela" data-comparar="empresa"></div>
        </details>
        <p class="fb-nota">Valores no débito automático. Os planos para empresa não incluem streaming.</p>
      </div>
    </section>

    <!-- ============ CROSS-SELL ============ -->
    <section class="secao secao--alt" aria-labelledby="cs-titulo">
      <div class="container">
{cab('Mais para a sua empresa', '', 'Junte os serviços no mesmo atendimento', id_='cs-titulo')}
        <div class="fb-ups">
          <a class="fb-ups__card fb-ups__card--celular surgir" href="/celular"><small>Planos de celular</small><h3 class="dy-h3">Linhas da empresa na mesma fatura</h3><p>Ligações ilimitadas, 5G e portabilidade grátis. O valor de um mês das linhas volta para você no PIX.</p><span class="ir">Ver planos de celular →</span></a>
          <a class="fb-ups__card fb-ups__card--energia surgir" style="--atraso:.08s" href="/energia"><small>Energia solar por assinatura</small><h3 class="dy-h3">Menos custo fixo todo mês</h3><p>Conta de luz mais barata, sem obra e sem investimento. A distribuidora continua a mesma.</p><span class="ir">Ver energia solar →</span></a>
        </div>
      </div>
    </section>

{faq_itens('Dúvidas sobre a internet para empresa', [
    ('Posso contratar no CNPJ e instalar em casa?', 'Pode. O contrato fica no nome da empresa, mas a instalação pode ser em qualquer endereço com cobertura: escritório, loja ou a sua casa.'),
    ('MEI pode contratar?', 'Pode, desde que o MEI tenha pelo menos 180 dias de abertura. Para os demais CNPJs, o mínimo é de 120 dias.'),
    ('Vocês oferecem IP fixo?', 'Não. Todos os nossos planos usam IP dinâmico. Se o seu sistema precisa de IP fixo, fale com a gente antes: na maioria dos casos, acesso pela nuvem ou DNS dinâmico resolve.'),
    ('Qual a fidelidade e a multa?', 'A fidelidade dos planos para empresa é de 24 meses, e é ela que deixa a instalação gratuita. Se cancelar antes, a multa é proporcional e diminui a cada mês completo de uso.'),
    ('Os planos para empresa têm streaming?', 'Não. Os streamings são exclusivos dos planos para casa (CPF). O 1 Giga para empresa inclui o Gestão Digital, para acompanhar a equipe.'),
    ('Quantos endereços posso ter no mesmo CNPJ?', 'Até dois contratos de fibra por CNPJ, em endereços diferentes.'),
    ('E se a fibra não chegar no endereço da empresa?', 'Existe a internet sem fio para empresas, que chega pelo sinal 4G até um roteador, sem obra. Você testa por 7 dias e, se a cobertura não agradar, devolve sem multa.'),
    ('Como funciona o suporte?', 'Pelo WhatsApp da Do Yourself, 24 horas por dia. A gente abre o chamado técnico, acompanha o atendimento e avisa você em cada etapa.'),
])}
{cta_net('Consulte a disponibilidade para a sua empresa', 'Informe o CEP e o número do endereço onde a internet vai ser instalada.', para='empresa', botao='Consultar disponibilidade', zap_msg='Olá! Quero internet fibra para a minha empresa.')}'''

pagina('internet-fibra/empresa', 'Internet para Empresa: fibra para CNPJ e MEI — Do Yourself',
       'Internet fibra para CNPJ e MEI com upload de 50%, roteador incluso, suporte 24h no WhatsApp e cashback no PIX. Contrato no CNPJ, instalação onde você precisar.',
       empresa, css_extra='fibra', scripts_extra='\n  <script src="js/fibra.js"></script>', body_attrs=' data-tipo-net="empresa"')


# =====================================================================
#  PÁGINAS DE PLANO — /internet-fibra/casa/<plano>
# =====================================================================
def benef(itens):
    out = ''
    for t, txt, vis in itens:
        out += f'''
          <div class="fb-benef__item">
            <div class="fb-benef__copy surgir"><h3 class="dy-h2">{t}</h3><p class="dy-lead">{txt}</p></div>
            <div class="fb-benef__vis{' fb-benef__vis--escuro' if vis.startswith('!') else ''} surgir" style="--atraso:.1s">{vis.lstrip('!')}</div>
          </div>'''
    return f'<div class="fb-benef">{out}\n        </div>'

def vis_num(n, legenda):
    return f'<div><p class="fb-benef__grande">{n}</p><p class="fb-benef__legenda">{legenda}</p></div>'

def vis_upload(down, up):
    pct = lambda v: f'{max(8, round(v / down * 100))}%'
    merc = round(down * .2)
    return f'''<div class="fb-barras" aria-label="Comparação de upload">
              <div>Download · {down} Mega<i style="width:100%"></i></div>
              <div>Nosso upload · {up} Mega<i style="width:{pct(up)}"></i></div>
              <div>Upload comum no mercado · cerca de {merc} Mega<i class="mercado" style="width:{pct(merc)}"></i></div>
            </div>'''

def vis_apps(apps):
    return '<div class="fb-apps">' + ''.join(f'<span>{a}</span>' for a in apps) + '</div>'

VIS_FIBRA = '<div class="fb-caminho">' + ROTA_CABO.replace(' surgir', '') + ROTA_DY.replace(' surgir', '').replace(' style="--atraso:.1s"', '') + '</div>'

UPSELL_PADRAO = {
    'energia': '<a class="fb-ups__card fb-ups__card--energia surgir" href="/energia"><small>Energia solar por assinatura</small><h3 class="dy-h3">E a conta de luz?</h3><p>Economize todo mês com energia solar por assinatura, sem obra e sem placa no telhado. E receba 10% de cashback.</p><span class="ir">Ver energia solar →</span></a>',
    'celular': '<a class="fb-ups__card fb-ups__card--celular surgir" style="--atraso:.08s" href="/celular"><small>Planos de celular</small><h3 class="dy-h3">Junte o celular no mesmo atendimento</h3><p>Portabilidade grátis e o valor de um mês das linhas de volta no PIX. Tudo pelo mesmo WhatsApp.</p><span class="ir">Ver planos de celular →</span></a>',
}

def card_plano(href, pequeno, titulo, texto, plano=None, opcao=None, escuro=False, logo=''):
    preco = f'<p class="preco" data-preco-plano="{plano}" data-tipo="casa" data-formato="curto"{f" data-opcao={chr(34)}{opcao}{chr(34)}" if opcao else ""}></p>' if plano else ''
    return f'<a class="fb-ups__card{" fb-ups__card--escuro" if escuro else ""} surgir" href="{href}">{logo}<small>{pequeno}</small><h3 class="dy-h3">{titulo}</h3><p>{texto}</p>{preco}<span class="ir">Ver este plano →</span></a>'

def card_zap(pequeno, titulo, texto, msg):
    return f'<a class="fb-ups__card fb-ups__card--escuro surgir" data-whatsapp="{msg}"><small>{pequeno}</small><h3 class="dy-h3">{titulo}</h3><p>{texto}</p><span class="ir">Falar no WhatsApp →</span></a>'

PLANOS_PG = [
    dict(slug='1-giga', id='1000', nome='1 Giga', selo='O mais rápido', premium=True,
         titulo='Internet 1 Giga com Wi-Fi 6 e cashback — Do Yourself',
         desc='Internet fibra de 1 Giga com 500 Mega de upload, roteador Wi-Fi 6, opção de Paramount+ ou HBO Max, instalação grátis e R$ 64,99 de volta no PIX.',
         eyebrow='Internet 1 Giga · Wi-Fi 6',
         h1='1 Giga com Wi-Fi 6. Internet que acompanha tudo o que a sua casa <span class="realce realce--internet">faz.</span>',
         lead='1.000 Mega de download, 500 de upload e o roteador mais moderno da linha. Para gamers, famílias conectadas e casas grandes.',
         specs=[('premium-download.svg', '1 Giga', 'de download'), ('premium-upload.svg', '500 Mega', 'de upload'), ('premium-modem.svg', 'Wi-Fi 6', 'roteador incluso'), ('premium-instalacao.svg', 'Até 48h', 'instalação grátis')],
         quem=[('game', 'Gamers', 'Menos atraso entre o comando e a resposta, e upload para jogar e transmitir ao mesmo tempo.'),
               ('familia', 'Famílias conectadas', 'TVs em 4K, celulares, notebooks e câmeras funcionando juntos, sem disputa.'),
               ('casa-grande', 'Casas grandes', 'O Wi-Fi 6 leva o sinal mais longe e lida melhor com paredes e muitos cômodos.')],
         benef=[('Wi-Fi 6: muitos aparelhos, nenhum congestionamento', 'O Wi-Fi 6 divide a internet entre todos os aparelhos ao mesmo tempo, em vez de fazer cada um esperar a vez. TVs, consoles, celulares, relógios e assistentes de voz funcionando juntos, com menos atraso e a segurança do WPA3.', '!' + vis_num('Wi-Fi 6', 'OFDMA · MU-MIMO · WPA3')),
                ('Upload de 500 Mega: para quem também envia', 'Videochamada em alta qualidade, live, backup na nuvem, fotos e vídeos subindo em segundos. Garantimos upload de metade do download, enquanto o comum no mercado é bem menos.', vis_upload(1000, 500)),
                ('Fibra até dentro da sua casa', 'Sem trecho de cabo metálico no caminho. Menos interferência e mais estabilidade de dia, de noite e em dia de chuva. O técnico testa a velocidade contratada na instalação.', VIS_FIBRA),
                ('Apps inclusos, sem custo a mais', 'Clube de jogos com centenas de títulos para celular e PC, cursos de mais de 14 idiomas, plataforma de estudos, audiolivros, jornais e revistas, e antivírus com proteção contra golpes.', vis_apps(['Clube de jogos', 'Idiomas', 'Estudos', 'Audiolivros', 'Jornais e revistas', 'Antivírus']))],
         spec_extra=[('Tecnologia Wi-Fi', 'Wi-Fi 6 (OFDMA, MU-MIMO, TWT, Beamforming)'), ('Segurança do Wi-Fi', 'WPA3')],
         ups_titulo='Quer streaming no mesmo plano?',
         ups=[card_plano('/internet-fibra/casa/1-giga?opcao=Paramount%2B#plano', 'Mais pedido', '1 Giga + Paramount+', 'Filmes, séries e infantil, com download para ver offline.', '1000', 'Paramount+', logo='<img class="logo" src="img/apps/paramount-tile.svg" alt="">'),
              card_plano('/internet-fibra/casa/1-giga?opcao=HBO%20Max#plano', 'Séries premiadas', '1 Giga + HBO Max', 'Séries, filmes de estúdio e originais, com até 30 downloads.', '1000', 'HBO Max', logo='<img class="logo" src="img/apps/hbo-max.png" alt="">'),
              card_zap('Página especial', 'Precisa de ainda mais? 2 Giga', 'Wi-Fi 7, 1 Giga de upload e quatro streamings inclusos.', 'Olá! Vim pela página do 1 Giga e quero saber do 2 Giga.')],
         faq=[('O roteador Wi-Fi 6 já vem incluso?', 'Sim. O roteador vem incluso no plano, sem custo, e o técnico deixa o Wi-Fi configurado na instalação.'),
              ('Meu celular precisa ser Wi-Fi 6?', 'Para aproveitar tudo do Wi-Fi 6, sim. Aparelhos mais antigos funcionam normalmente, só que no padrão deles.'),
              ('1 Giga vale para quantas pessoas?', 'Para casas com muita gente e muitos aparelhos ao mesmo tempo: várias TVs em 4K, jogos online, videochamadas e downloads, tudo junto.'),
              ('Por que o teste no Wi-Fi dá menos que 1 Giga?', 'O Wi-Fi sofre com distância, paredes e com o limite do próprio aparelho. A velocidade contratada é medida com o computador ligado no cabo, e o técnico faz esse teste na instalação.'),
              ('O 800 Mega custa o mesmo. Por que escolher o 1 Giga?', 'O 1 Giga tem Wi-Fi 6, mais 100 Mega de upload e é o mais rápido da linha. O 800 Mega é o plano do YouTube Premium. Escolha pelo que você mais usa.'),
              ('Posso adicionar Paramount+ ou HBO Max depois?', 'Pode. Fale com a gente pelo WhatsApp e a gente faz a troca do plano para você.'),
              ('Tem fidelidade? Quanto é a multa?', 'A fidelidade é de 12 meses. Se cancelar antes, a multa é proporcional e diminui a cada mês completo de uso.'),
              ('Quando recebo o cashback?', 'Em até 7 dias depois da instalação, via PIX na sua conta bancária, uma única vez.')]),
    dict(slug='800-mega', id='800', nome='800 Mega', selo='YouTube Premium incluso',
         titulo='Internet 800 Mega com YouTube Premium e cashback — Do Yourself',
         desc='Internet fibra de 800 Mega com YouTube Premium e YouTube Music inclusos, 400 Mega de upload, instalação grátis e cashback no PIX.',
         eyebrow='Internet 800 Mega · YouTube Premium',
         h1='800 Mega com YouTube Premium. Sem anúncio, sem <span class="realce realce--internet">interrupção.</span>',
         lead='Vídeos sem anúncios, música com a tela desligada e downloads para ver offline, já incluso no preço do plano.',
         specs=[('download.svg', '800 Mega', 'de download'), ('upload.svg', '400 Mega', 'de upload'), ('modem.svg', 'Wi-Fi 5', 'roteador incluso'), ('instalacao.svg', 'Até 48h', 'instalação grátis')],
         quem=[('play', 'Quem vive de vídeo', 'Tutorial, podcast, série e música, o dia todo, sem anúncio no meio.'),
               ('fone', 'Quem ouve música o dia todo', 'YouTube Music incluso: playlists, rádio e música em segundo plano.'),
               ('familia', 'Casas com várias telas', '800 Mega para TV, celulares e notebooks ao mesmo tempo.')],
         benef=[('YouTube Premium e YouTube Music inclusos', 'Vídeos sem anúncios, reprodução com a tela desligada e downloads para assistir offline. O YouTube Music vem junto, com músicas e playlists sem interrupção.', vis_num('Sem anúncios', 'YouTube Premium + YouTube Music')),
                ('Upload de 400 Mega', 'Para mandar vídeos, fazer videochamadas e subir arquivos para a nuvem sem esperar. Metade da velocidade de download, enquanto o comum no mercado é bem menos.', vis_upload(800, 400)),
                ('Fibra até dentro da sua casa', 'Sem trecho de cabo metálico no caminho. Menos interferência e mais estabilidade de dia, de noite e em dia de chuva.', VIS_FIBRA),
                ('Apps inclusos', 'Plataforma de estudos, audiolivros e antivírus com proteção contra golpes, sem custo a mais.', vis_apps(['YouTube Premium', 'YouTube Music', 'Estudos', 'Audiolivros', 'Antivírus']))],
         spec_extra=[('Streaming', 'YouTube Premium (inclui YouTube Music)'), ('Tecnologia Wi-Fi', 'Wi-Fi 5 (Beamforming, MU-MIMO, Band Steering)')],
         ups_titulo='Pelo mesmo valor, mais velocidade',
         ups=[card_plano('/internet-fibra/casa/1-giga', 'Mesmo preço', 'Conheça o 1 Giga', 'Pelo mesmo valor, o 1 Giga traz Wi-Fi 6 e upload de 500 Mega. Sem o YouTube Premium, com opção de Paramount+ ou HBO Max.', '1000', escuro=True)],
         faq=[('O YouTube Premium já vem incluso no preço?', 'Sim. O valor do YouTube Premium já está no preço do plano. Você ativa depois da instalação, e a gente ajuda pelo WhatsApp.'),
              ('Posso usar a conta do YouTube que eu já tenho?', 'Pode. A ativação é feita na sua conta Google. Se você já paga o YouTube Premium, cancele a assinatura antiga para não pagar duas vezes.'),
              ('O 1 Giga custa o mesmo. Qual escolher?', 'Se você usa muito YouTube, fique com o 800 Mega. Se o que pesa é velocidade, jogos e muitos aparelhos, o 1 Giga com Wi-Fi 6 é a melhor escolha.'),
              ('Tem fidelidade?', 'Sim, de 12 meses. Se cancelar antes, a multa é proporcional e diminui a cada mês completo de uso.'),
              ('Quando recebo o cashback?', 'Em até 7 dias depois da instalação, via PIX na sua conta bancária, uma única vez.')]),
    dict(slug='600-mega', id='600', nome='600 Mega', selo='Para a família',
         titulo='Internet 600 Mega com Paramount+ ou Globoplay — Do Yourself',
         desc='Internet fibra de 600 Mega com opção de Paramount+ ou Globoplay, 300 Mega de upload, instalação grátis e cashback no PIX.',
         eyebrow='Internet 600 Mega · Streaming à escolha',
         h1='600 Mega para a família toda, com streaming à sua <span class="realce realce--internet">escolha.</span>',
         lead='Internet para todo mundo ao mesmo tempo e a opção de somar Paramount+ ou Globoplay, numa conta só.',
         specs=[('download.svg', '600 Mega', 'de download'), ('upload.svg', '300 Mega', 'de upload'), ('modem.svg', 'Wi-Fi 5', 'roteador incluso'), ('instalacao.svg', 'Até 48h', 'instalação grátis')],
         quem=[('familia', 'Famílias', 'Série na sala, jogo no quarto e chamada no escritório, ao mesmo tempo.'),
               ('play', 'Quem quer streaming incluso', 'Paramount+ ou Globoplay no mesmo boleto da internet.'),
               ('maleta', 'Home office', 'Upload de 300 Mega para reuniões e arquivos na nuvem.')],
         benef=[('Streaming à sua escolha', 'Some Paramount+ (filmes, séries e infantil, com download) ou Globoplay (novelas, séries, realities e canais ao vivo) no preço do plano.', '<div class="fb-persona__stream" style="justify-content:center"><img src="/img/apps/paramount-tile.svg" alt="Paramount+"><img src="/img/apps/globoplay.png" alt="Globoplay"></div>'),
                ('Upload de 300 Mega', 'Videochamada, fotos e arquivos subindo rápido. Metade do download, enquanto o comum no mercado é bem menos.', vis_upload(600, 300)),
                ('Fibra até dentro da sua casa', 'Sem trecho de cabo metálico no caminho. Menos interferência e mais estabilidade de dia, de noite e em dia de chuva.', VIS_FIBRA),
                ('Apps inclusos', 'Plataforma de estudos, audiolivros, jornais e revistas, e antivírus com proteção contra golpes.', vis_apps(['Estudos', 'Audiolivros', 'Jornais e revistas', 'Antivírus']))],
         spec_extra=[('Streaming', 'Opcional: Paramount+ ou Globoplay'), ('Tecnologia Wi-Fi', 'Wi-Fi 5 (Beamforming, MU-MIMO, Band Steering)')],
         ups_titulo='Confira também',
         ups=[card_plano('/internet-fibra/casa/800-mega', 'Odeia anúncios?', '800 Mega + YouTube Premium', 'Vídeos e música sem anúncios, com 800 Mega.', '800'),
              card_plano('/internet-fibra/casa/1-giga', 'Quer Wi-Fi 6?', 'Conheça o 1 Giga', 'O mais rápido da linha, com Wi-Fi 6 e 500 Mega de upload.', '1000', escuro=True)],
         faq=[('O streaming aumenta o preço?', 'O valor já aparece somado em cada opção: só internet, com Paramount+ ou com Globoplay.'),
              ('Posso trocar de streaming depois?', 'Pode. Fale com a gente pelo WhatsApp e a gente faz a troca do plano para você.'),
              ('O Globoplay tem anúncios?', 'O Globoplay incluso é o plano padrão, com anúncios. Para o Premium, a assinatura é feita direto com o Globoplay.'),
              ('Tem fidelidade?', 'Sim, de 12 meses. Se cancelar antes, a multa é proporcional e diminui a cada mês completo de uso.'),
              ('Quando recebo o cashback?', 'Em até 7 dias depois da instalação, via PIX na sua conta bancária, uma única vez.')]),
    dict(slug='500-mega', id='500', nome='500 Mega', selo='Para o dia a dia',
         titulo='Internet 500 Mega com fibra e cashback — Do Yourself',
         desc='Internet fibra de 500 Mega com 250 Mega de upload, roteador Wi-Fi incluso, instalação grátis e metade de uma mensalidade de volta no PIX.',
         eyebrow='Internet 500 Mega',
         h1='500 Mega de fibra. Rápida, estável e do tamanho da sua <span class="realce realce--internet">rotina.</span>',
         lead='Para quem mora sozinho ou a dois: séries, redes sociais, home office e chamadas de vídeo, sem pagar por velocidade que não usa.',
         specs=[('download.svg', '500 Mega', 'de download'), ('upload.svg', '250 Mega', 'de upload'), ('modem.svg', 'Wi-Fi 5', 'roteador incluso'), ('instalacao.svg', 'Até 48h', 'instalação grátis')],
         quem=[('pessoa', 'Quem mora sozinho(a)', 'Séries, redes sociais e música, sem travar.'),
               ('familia', 'Casais', 'Duas pessoas conectadas ao mesmo tempo, com folga.'),
               ('maleta', 'Home office leve', 'Reuniões e e-mails com upload de 250 Mega.')],
         benef=[('Fibra até dentro da sua casa', 'Sem trecho de cabo metálico no caminho. Menos interferência e mais estabilidade de dia, de noite e em dia de chuva.', VIS_FIBRA),
                ('Upload de 250 Mega', 'Para chamadas de vídeo, fotos e arquivos. Metade do download, enquanto o comum no mercado é bem menos.', vis_upload(500, 250)),
                ('Apps inclusos', 'Plataforma de estudos, audiolivros, jornais e revistas, sem custo a mais.', vis_apps(['Estudos', 'Audiolivros', 'Jornais e revistas']))],
         spec_extra=[('Tecnologia Wi-Fi', 'Wi-Fi 5 (Beamforming, MU-MIMO, Band Steering)')],
         ups_titulo='Mora com mais gente?',
         ups=[card_plano('/internet-fibra/casa/600-mega', 'Para a família', 'Conheça o 600 Mega', 'Mais velocidade para todo mundo e a opção de Paramount+ ou Globoplay.', '600')],
         faq=[('500 Mega é suficiente?', 'Para uma ou duas pessoas, sim: séries em HD, redes sociais, home office e chamadas de vídeo ao mesmo tempo.'),
              ('Tem streaming?', 'O 500 Mega não tem opção de streaming. Para isso, veja o 600 Mega (Paramount+ ou Globoplay) ou o 800 Mega (YouTube Premium).'),
              ('Tem fidelidade?', 'Sim, de 12 meses. Se cancelar antes, a multa é proporcional e diminui a cada mês completo de uso.'),
              ('Quando recebo o cashback?', 'Em até 7 dias depois da instalação, via PIX na sua conta bancária, uma única vez.')]),
]

for d in PLANOS_PG:
    specs = ''.join(f'<li><img src="img/icones/{ic}" alt=""><span><b>{a}</b>{b}</span></li>' for ic, a, b in d['specs'])
    quem = ''.join(f'<li class="surgir" style="--atraso:{.05 + i * .08:.2f}s"><span>{ICO[ic]}</span><b>{t}</b>{tx}</li>' for i, (ic, t, tx) in enumerate(d['quem']))
    tabela_spec = ''.join(f'<tr><th scope="row">{a}</th><td>{b}</td></tr>' for a, b in [
        ('Download', d['specs'][0][1]), ('Upload', d['specs'][1][1]), *d['spec_extra'], ('Tipo de IP', 'Dinâmico'),
        ('Instalação', 'Grátis, em até 48 horas'), ('Fidelidade', '12 meses'), ('Mensalidade', '<span data-plano-preco></span> no débito automático (R$ 10 a mais no boleto ou PIX)')])
    ups = ''.join(d['ups'])
    corpo = LOCAL_BARRA + f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg hero-pg--internet fb-hero fb-plano-hero" id="plano" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="hero2__grade">
          <div class="hero2__copy">
            <span class="dy-eyebrow dy-eyebrow--internet">{d['eyebrow']}</span>
            <h1 class="dy-display" id="hero-titulo">{d['h1']}</h1>
            <p class="dy-lead">{d['lead']}</p>
            <ul class="fb-specs" aria-label="O que vem no plano">{specs}</ul>
            <ul class="hero2__provas" aria-label="Vantagens">{verificado(['Cashback no PIX', 'Fibra até dentro de casa', 'Suporte 24h no WhatsApp'])}</ul>
          </div>
          <div class="hero2__visual">
            <div class="fb-preco" data-preco-card aria-live="polite" style="min-height:420px"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PARA QUEM É ============ -->
    <section class="secao fb-secao-curta" aria-labelledby="pq-titulo">
      <div class="container">
{cab('Para quem é', 'internet', 'Feito para casas como a sua', id_='pq-titulo')}
        <ul class="fb-quem">{quem}</ul>
      </div>
    </section>

    <!-- ============ BENEFÍCIOS ============ -->
    <section class="secao secao--alt" aria-labelledby="bn-titulo">
      <div class="container">
{cab('O que vem no plano', 'internet', f'Tudo o que o {d["nome"]} entrega', id_='bn-titulo')}
        {benef(d['benef'])}
        <details class="fb-comparar fb-spec-det surgir">
          <summary>Ver as especificações</summary>
          <div class="fb-tabela"><table><tbody>{tabela_spec}</tbody></table></div>
        </details>
      </div>
    </section>

    <!-- ============ CUSTO REAL ============ -->
    <section class="secao" aria-labelledby="cr-titulo">
      <div class="container">
{cab('Cashback', '', 'Quanto você paga, de verdade', 'Na prática, o primeiro mês sai pela metade.', id_='cr-titulo')}
        <ul class="fb-req fb-req--3">
          <li class="surgir"><b data-plano-preco>—</b><strong>Mensalidade</strong>No débito automático.</li>
          <li class="surgir" style="--atraso:.08s"><b data-plano-cb style="color:var(--marca-titulo)">—</b><strong>Volta no PIX</strong>Uma vez, em até 7 dias depois da instalação.</li>
          <li class="surgir" style="--atraso:.16s"><b>R$ 0</b><strong>Instalação e roteador</strong>Com a fidelidade de 12 meses.</li>
        </ul>
      </div>
    </section>

    <!-- ============ COMO CONTRATAR ============ -->
    <section class="secao secao--alt" aria-labelledby="cc-titulo">
      <div class="container">
{cab('Como contratar', 'internet', 'Do clique à internet funcionando', id_='cc-titulo')}
        {passos('internet', [
            (f'Clique em “Quero o {d["nome"]}”', 'Informe o CEP e o número do imóvel para ver a cobertura.'),
            ('Fale com a gente', 'No WhatsApp, conferimos o endereço e fazemos o cadastro com você.'),
            ('Biometria e agenda', 'Você confirma a identidade pelo link e escolhe o dia da instalação.'),
            ('Internet e cashback', 'Instalação em até 48h e o cashback no PIX em até 7 dias.'),
        ]).replace('passos3 passos3--internet', 'passos3 passos3--4 passos3--internet')}
      </div>
    </section>

    <!-- ============ UPSELL E CROSS-SELL ============ -->
    <section class="secao" aria-labelledby="up-titulo">
      <div class="container">
{cab('Confira também', 'internet', d['ups_titulo'], id_='up-titulo')}
        <div class="fb-ups">{ups}</div>
        <p class="fb-sub">E mais para a sua casa</p>
        <div class="fb-ups">{UPSELL_PADRAO['celular']}{UPSELL_PADRAO['energia']}</div>
      </div>
    </section>

{faq_itens(f'Dúvidas sobre o {d["nome"]}', d['faq'])}
    <!-- ============ CTA FINAL ============ -->
    <section class="secao cta2" aria-labelledby="cta-titulo" data-cta-final>
      <div class="container">
        <div class="fb-cta-final surgir">
          <h2 class="dy-h2" id="cta-titulo">Seu {d['nome']} está a um clique.</h2>
          <p class="dy-lead">Informe o CEP, fale com a gente no WhatsApp e receba <b data-plano-cb style="color:#fff">metade de uma mensalidade</b> de volta depois da instalação.</p>
          <div class="cta2__acoes">
            <a class="dy-btn dy-btn--primario dy-btn--g" data-plano-cta href="contratar.html?origem=internet&amp;plano={d['id']}&amp;para=casa">Quero o {d['nome']} <span class="seta-dir" aria-hidden="true">→</span></a>
            <a class="dy-btn dy-btn--contorno dy-btn--g" data-plano-zap target="_blank" rel="noopener" data-whatsapp="Oi! Vim pela página do {d['nome']} e quero saber se tem no meu endereço.">Falar no WhatsApp</a>
          </div>
          <ul class="fb-cta-final__selos"><li>Instalação grátis</li><li>Atendimento humano 24h</li><li>Cashback no PIX</li></ul>
        </div>
      </div>
    </section>
    <div class="fb-barra" data-fb-barra hidden><p class="fb-barra__txt" data-barra-txt></p><a class="dy-btn dy-btn--primario" href="contratar.html?origem=internet&amp;plano={d['id']}&amp;para=casa">Quero o {d['nome']}</a></div>
'''
    pagina(f'internet-fibra/casa/{d["slug"]}', d['titulo'], d['desc'], corpo, css_extra='fibra',
           scripts_extra='\n  <script src="js/fibra.js"></script>',
           body_attrs=f' data-tipo-net="casa" data-plano-pg="{d["id"]}" data-nome="{d["nome"]}" data-selo="{d["selo"]}"', classe='pg-plano')
