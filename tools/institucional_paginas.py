# ruff: noqa
"""
Do Yourself — páginas institucionais: /aplicativos e /sobre.
Executado de dentro de tools/paginas.py depois dos geradores de Internet e Celular.
Fatos: wiki Regras Do Yourself (0.1, 0.2, 1, 4.5, 5.4, 6.5, 6.8). Sem nome de operadora.
"""

def app_card(id_, logo, nome, cat, txt, onde, nota=''):
    return f'''
          <article class="fb-app surgir" id="{id_}">
            <div class="fb-app__topo"><span class="fb-app__logo">{logo}</span><div><small>{cat}</small><h3 class="dy-h3">{nome}</h3></div></div>
            <p>{txt}</p>
            {f'<p class="fb-app__nota">{nota}</p>' if nota else ''}
            <div class="fb-app__onde" aria-label="Onde vem incluso">{''.join(f'<span>{o}</span>' for o in onde)}</div>
          </article>'''

def img_logo(arq, cls=''):
    return f'<img src="img/apps/{arq}" alt=""{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}>'

def letra(t):
    return t

GRUPOS = [
    ('streaming', 'Streaming', 'Filmes, séries e música', [
        app_card('paramount', img_logo('paramount-tile.svg'), 'Paramount+', 'Streaming', 'Filmes, séries e conteúdo infantil, em até 2 telas ao mesmo tempo e com download para ver offline.', ['600 Mega + Paramount+', '1 Giga + Paramount+', '2 Giga']),
        app_card('globoplay', img_logo('globoplay.png'), 'Globoplay', 'Streaming', 'Novelas, séries, realities, jornalismo e 8 canais ao vivo, em até 4K, com 3 perfis e 3 telas ao mesmo tempo.', ['600 Mega + Globoplay', '2 Giga'],
                 'Plano padrão, com anúncios e sem download. Só para planos de CPF. Se você já assina o Globoplay, cancele a assinatura antes de ativar.'),
        app_card('hbo-max', img_logo('hbo-max.png'), 'HBO Max', 'Streaming', 'Séries premiadas, filmes de estúdio e produções originais, em até 2 telas, com 5 perfis e até 30 downloads.', ['1 Giga + HBO Max', '2 Giga'], 'Plano com anúncios.'),
        app_card('youtube-premium', img_logo('youtube.png'), 'YouTube Premium', 'Vídeo e música', 'Vídeos sem anúncios, reprodução com a tela desligada, download para ver offline e o YouTube Music incluso.', ['800 Mega + YouTube Premium']),
        app_card('deezer', 'D', 'Deezer Premium', 'Música', 'Músicas, playlists e podcasts sem anúncios e para ouvir offline.', ['Controle (3 meses grátis)', 'Opcional no Controle Redes Sociais']),
    ]),
    ('leitura', 'Leitura e estudo', 'Livros, revistas, cursos e idiomas', [
        app_card('livros', img_logo('aya-books.png'), 'Audiolivros', 'Leitura', 'Um audiolivro por mês, de vários gêneros, para ouvir no celular.', ['Internet fibra', 'Planos controle', 'Celular empresarial']),
        app_card('revistas', img_logo('aya-bancah.png'), 'Jornais e revistas', 'Leitura', 'Jornais e revistas digitais à vontade, com leitura offline e acervo de edições anteriores.', ['500 Mega', '600 Mega', '1 Giga', 'Planos controle', 'Empresa a partir de 30 GB']),
        app_card('estudos', 'E', 'Plataforma de estudos', 'Estudo', 'Organização dos estudos, preparação para concursos e cursos de capacitação.', ['Internet fibra', 'Planos controle']),
        app_card('idiomas', 'I', 'Cursos de idiomas', 'Estudo', 'Cursos de mais de 14 idiomas, com até 3 ao mesmo tempo.', ['1 Giga', '2 Giga', 'Celular empresarial']),
    ]),
    ('seguranca', 'Segurança, jogos e gestão', 'Proteção, diversão e controle', [
        app_card('antivirus', 'S', 'Antivírus e proteção contra golpes', 'Segurança', 'Antivírus, proteção contra golpes, segurança para apps de banco e privacidade.', ['600 Mega', '800 Mega', '1 Giga', 'Planos controle', 'Empresa a partir de 40 GB']),
        app_card('jogos', 'J', 'Clube de jogos', 'Jogos', 'Centenas de jogos para celular e PC, com download ilimitado e catálogo sempre atualizado.', ['1 Giga', '2 Giga']),
        app_card('gestao-digital', 'G', 'Gestão Digital', 'Família e equipe', 'Localização em tempo real, aviso de chegada e saída de lugares marcados, controle do tempo de uso de apps e bloqueio de sites. Para proteger a família ou acompanhar a equipe.', ['1 Giga para empresa', '2 Giga'], 'Funciona em Android 8 ou superior e iOS 15 ou superior.'),
        app_card('monitor-de-uso', 'M', 'Monitor de uso', 'Empresas', 'Painel para o gestor ver o consumo de internet de cada linha e bloquear apps, sites ou o celular fora do horário de trabalho.', ['Celular empresarial a partir de 12 GB']),
        app_card('nuvem', 'N', 'Nuvem e backup', 'Empresas', 'Espaço na nuvem para arquivos e cópia de segurança dos dados do celular.', ['Celular empresarial']),
        app_card('cartao-de-todos', 'C', 'Cartão de TODOS', 'Saúde', 'Cartão de descontos em consultas, exames e farmácias.', ['Planos controle', 'Celular empresarial']),
    ]),
]

indice = ''.join(f'<a href="#{gid}">{t}</a>' for gid, t, _, _ in GRUPOS) + '<a href="#como-entrar">Como entrar nos aplicativos</a>'
grupos_html = ''
for k, (gid, t, sub, cards) in enumerate(GRUPOS):
    grupos_html += f'''
    <section class="secao{' secao--alt' if k % 2 else ''}" id="{gid}" aria-labelledby="{gid}-titulo">
      <div class="container">
{cab(sub, '', t, id_=gid + '-titulo')}
        <div class="fb-appgrid">{''.join(cards)}
        </div>
      </div>
    </section>
'''

apps = f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="cab" style="margin-bottom:0">
          <span class="dy-eyebrow">Aplicativos inclusos</span>
          <h1 class="dy-display" id="hero-titulo">Streaming, leitura e segurança <span class="realce">já no seu plano.</span></h1>
          <p class="dy-lead">Os planos da Do Yourself vêm com aplicativos inclusos, sem custo a mais. Veja o que cada um oferece, em qual plano ele vem e como entrar.</p>
          <nav class="fb-indice" aria-label="Nesta página">{indice}</nav>
        </div>
      </div>
    </section>
{grupos_html}
    <!-- ============ COMO ENTRAR ============ -->
    <section class="secao" id="como-entrar" aria-labelledby="ce-titulo">
      <div class="container">
{cab('Passo a passo', '', 'Como entrar nos aplicativos', 'Leva poucos minutos. E se travar em qualquer passo, a gente faz junto com você pelo WhatsApp.', id_='ce-titulo')}
        {passos('marca', [
            ('Abra o e-mail de boas-vindas', 'Depois da instalação da internet ou da ativação do chip, você recebe um e-mail com o link para ativar os aplicativos.'),
            ('Ative com o seu CPF', 'Sem o e-mail? Ative pelo app ou pelo site da operadora parceira, com o seu CPF, criando um login e uma senha com o seu e-mail.'),
            ('Baixe o app e entre', 'Instale o aplicativo no celular, abra na Smart TV ou use a versão web, e entre com a conta que você ativou.'),
            ('Travou? Chame a gente', 'O suporte da Do Yourself no WhatsApp funciona 24 horas por dia e faz o passo a passo com você.'),
        ]).replace('passos3 passos3--marca', 'passos3 passos3--4')}
        <div class="fb-centro"><a class="dy-btn dy-btn--whatsapp dy-btn--g" data-whatsapp="Olá! Preciso de ajuda para entrar nos aplicativos do meu plano.">Pedir ajuda no WhatsApp</a></div>
      </div>
    </section>

{faq_itens('Dúvidas sobre os aplicativos', [
    ('Os aplicativos têm custo a mais?', 'Não. Os aplicativos inclusos já estão no preço do plano. Nos planos com streaming à escolha, o valor do streaming já aparece somado em cada opção.'),
    ('Já tenho assinatura de um desses streamings. E agora?', 'Cancele a sua assinatura antes de ativar a do plano, para não pagar duas vezes. No Globoplay, isso é obrigatório para vincular o benefício.'),
    ('Posso assistir na TV?', 'Pode. Os streamings funcionam no app do celular, no app da Smart TV e na versão web.'),
    ('Posso trocar o streaming do meu plano?', 'Pode. Fale com a gente pelo WhatsApp e a gente faz a troca do plano para você.'),
    ('Retirar um aplicativo muda o preço?', 'No Gestão Digital, não: retirar o benefício não muda o valor do plano. Para os outros, a gente confirma o seu caso pelo WhatsApp.'),
])}
{cta_net('Quer um plano com streaming incluso?', 'Veja os planos de internet com Paramount+, Globoplay, HBO Max ou YouTube Premium no preço.', para='casa', botao='Ver planos com streaming').replace('href="contratar.html?origem=internet&amp;para=casa"', 'href="/internet-fibra/casa#perfis"')}'''

pagina('aplicativos', 'Aplicativos inclusos nos planos — Do Yourself',
       'Paramount+, Globoplay, HBO Max, YouTube Premium, audiolivros, revistas, idiomas, antivírus e mais: veja o que vem em cada plano e como entrar nos aplicativos.',
       apps, css_extra='fibra')


# =====================================================================
#  SOBRE — /sobre
# =====================================================================
sobre = f'''
    <!-- ============ HERO ============ -->
    <section class="hero2 hero-pg fb-hero" aria-labelledby="hero-titulo">
      <div class="container">
        <div class="fb-grade2">
          <div class="fb-grade2__copy">
            <span class="dy-eyebrow">Sobre a Do Yourself</span>
            <h1 class="dy-display" id="hero-titulo">Internet, celular e energia num lugar só. E <span class="realce">dinheiro de volta.</span></h1>
            <p class="dy-lead">A Do Yourself é uma marca 100% digital, credenciada pelas empresas que prestam os serviços. A gente reúne tudo num atendimento só, cuida de você do pedido ao pós-venda e devolve parte do valor no PIX.</p>
            <div class="fb-hero__acoes">
              <a class="dy-btn dy-btn--primario dy-btn--g" href="/combo">Conhecer o combo <span class="seta-dir" aria-hidden="true">→</span></a>
              <a class="dy-link" data-whatsapp="Olá! Quero conhecer a Do Yourself.">Falar com a gente</a>
            </div>
          </div>
          <ul class="fb-req fb-req--3 surgir" style="margin:0">
            <li><b style="color:var(--energia-titulo)">10%</b><strong>na energia solar</strong>Da nova conta de luz, uma vez.</li>
            <li><b>50%</b><strong>na internet fibra</strong>De uma mensalidade, uma vez.</li>
            <li><b style="color:var(--celular-titulo)">100%</b><strong>no celular</strong>De um mês das linhas, uma vez.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ============ COMO FUNCIONA O MODELO ============ -->
    <section class="secao secao--alt" aria-labelledby="md-titulo">
      <div class="container">
        <div class="fb-grade2">
          <div class="fb-grade2__copy surgir">
            <span class="dy-eyebrow">Por que devolvemos dinheiro</span>
            <h2 class="dy-h2" id="md-titulo">Em vez de gastar com propaganda, a gente devolve para você.</h2>
            <p class="dy-lead">Somos parceiros credenciados das operadoras e das empresas de energia. Elas remuneram a Do Yourself por cada cliente que chega pela gente, e parte desse valor volta para você em cashback, via PIX na sua conta bancária.</p>
            <p class="dy-lead">O preço do plano é o mesmo. O cashback é um valor extra, pago uma única vez.</p>
          </div>
          <div class="fb-painel fb-painel--zap surgir" style="--atraso:.1s">
            <span class="fb-24h"><b>24h</b><span>por dia, todos os dias</span></span>
            <h3 class="dy-h3">Um WhatsApp para tudo</h3>
            <p class="dy-texto">Você não liga para central nenhuma. Fala com uma pessoa da Do Yourself, a qualquer hora, e a gente resolve com as empresas parceiras por você.</p>
            <a class="dy-btn dy-btn--whatsapp" data-whatsapp="Olá! Vim pela página Sobre a Do Yourself.">Falar no WhatsApp</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ O QUE A GENTE RESOLVE ============ -->
    <section class="secao" aria-labelledby="rs-titulo">
      <div class="container">
{cab('A Do Yourself resolve', '', 'Do começo ao fim, com a gente', id_='rs-titulo')}
        <ul class="fb-dicas fb-dicas--sem-n">
          <li class="surgir"><b>Dúvidas e ofertas</b>Qual plano faz sentido para você e o que chega no seu endereço.</li>
          <li class="surgir"><b>Contratação e cadastro</b>O pedido, a análise e a biometria, passo a passo.</li>
          <li class="surgir"><b>Instalação e chip</b>Agendamento, reagendamento e ativação.</li>
          <li class="surgir"><b>Fatura e pagamento</b>Segunda via e débito automático.</li>
          <li class="surgir"><b>Mudança de endereço</b>A internet vai junto, sem custo.</li>
          <li class="surgir"><b>Aplicativos</b>Ativação do streaming e dos apps inclusos.</li>
          <li class="surgir"><b>Suporte técnico</b>A gente abre e acompanha o chamado por você.</li>
          <li class="surgir"><b>Cancelamento</b>Também pelo mesmo WhatsApp, sem empurra-empurra.</li>
        </ul>
      </div>
    </section>

    <!-- ============ COMPROMISSOS ============ -->
    <section class="secao secao--alt" aria-labelledby="cp-titulo">
      <div class="container">
{cab('Nossos compromissos', '', 'O jeito Do Yourself de atender', id_='cp-titulo')}
        <ul class="fb-faixa">
          <li class="surgir"><img src="img/icones/dif-user.svg" alt=""><span><b>Gente de verdade</b>Atendimento humano no WhatsApp, 24 horas por dia, sem menu de opções.</span></li>
          <li class="surgir" style="--atraso:.08s"><img src="img/icones/verificado.svg" alt=""><span><b>Tudo explicado antes</b>Preço, fidelidade e cashback claros antes de você fechar o pedido.</span></li>
          <li class="surgir" style="--atraso:.16s"><img src="img/icones/cofrinho.svg" alt=""><span><b>Dinheiro de volta de verdade</b>O cashback cai via PIX na sua conta bancária, não em pontos nem em desconto escondido.</span></li>
        </ul>
      </div>
    </section>

    <!-- ============ SERVIÇOS ============ -->
    <section class="secao" aria-labelledby="sv-titulo">
      <div class="container">
{cab('Os serviços', '', 'O que a Do Yourself oferece', id_='sv-titulo')}
        {cards_link([
            ('energia', 'hero-lampada.svg', 'Energia Solar por Assinatura', 'Conta de luz mais barata, sem obra. 10% de cashback.'),
            ('internet', 'hero-wifi.svg', 'Internet Fibra', 'Fibra até dentro de casa, instalação grátis. 50% de cashback.'),
            ('celular', 'hero-celular-5g.svg', 'Planos de Celular', 'Controle para CPF e linhas para empresas. 100% de cashback.'),
        ], 'marca')}
      </div>
    </section>

{cta('combo', 'Quanto volta para você?', 'Leva menos de 3 minutos para montar o seu pedido e ver o cashback de cada serviço.')}'''

pagina('sobre', 'Sobre a Do Yourself — internet, celular e energia com cashback',
       'A Do Yourself reúne internet fibra, planos de celular e energia solar por assinatura num atendimento só, com suporte 24h no WhatsApp e cashback no PIX.',
       sobre, css_extra='fibra')
