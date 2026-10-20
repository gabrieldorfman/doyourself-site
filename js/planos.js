/* ============================================================
   Do Yourself — acordeão de planos ("sanfona")
   Desktop: 1 card aberto + tarjas verticais (Figma 23:15723 / 23:15878)
   Tablet/mobile: baralho vertical (wiki componente-cards-de-plano §7)
   ============================================================ */
(function () {
  const { img, logos, brl, centavos, cashbackCentavos, config } = DY;

  const logoTag = (chave, classe = '') => {
    const l = logos[chave];
    return `<img src="${img(l.src)}" alt="${l.alt}" class="${classe}" loading="lazy" width="44" height="44">`;
  };

  /* ---------- Internet ---------- */
  function tarjaInternet(p) {
    let streaming = '';
    if (p.tarja.streaming) {
      const itens = p.tarja.streaming.map((k) =>
        k === 'youtube-premium'
          ? `<img src="${img('apps/youtube-premium-tarja.svg')}" alt="YouTube Premium" width="80" height="20">`
          : `<img src="${img(logos[k].src)}" alt="${logos[k].alt}" class="logo-32" width="32" height="32">`
      ).join('');
      streaming = `<div class="tarja__streaming"><span>Streaming</span><div>${itens}</div></div>`;
    }
    // Na tarja aparece o preço de entrada do plano (Figma: 500 = 99,99 · 600 = 109,99 · 800 = 129,99 · 1000 = 129,99)
    const precoTarja = Math.min(...p.opcoes.map((o) => o.preco));
    return `
      <button type="button" class="tarja" aria-label="Ver o plano de ${p.tarjaNum || p.num} ${p.tarjaUnidade || p.unidade}">
        <span class="selo">${p.selo}</span>
        <span class="velocidade"><b>${p.tarjaNum || p.num}</b><span>${p.tarjaUnidade || p.unidade}</span></span>
        <span class="tarja__espaco"></span>
        ${streaming}
        <span class="tarja__preco">${brl(centavos(precoTarja))}</span>
        <span class="tarja__obs">/mês no débito</span>
      </button>`;
  }

  function cardInternet(p, idx) {
    const radio = (on) => img(`icones/${p.variante === 'premium' ? 'premium-' : ''}radio-${on ? 'on' : 'off'}.svg`);
    const opcoes = p.opcoes.map((o, i) => {
      const sel = i === p.opcaoPadrao;
      const unica = p.opcoes.length === 1;
      const logo = o.logo
        ? (o.logo === 'youtube-premium'
          ? `<img src="${img('apps/youtube-premium-logo-pequeno.svg')}" alt="" class="logo-op yt" width="80" height="20">`
          : `<img src="${img(logos[o.logo].src)}" alt="" class="logo-op" width="44" height="44">`)
        : '';
      const marcador = o.incluso ? '' : `<img src="${radio(sel)}" alt="" class="radio" width="16" height="16">`;
      const direita = o.incluso ? `<span class="incluso">${o.incluso}</span>` : `<span class="preco">${brl(centavos(o.preco))}</span>`;
      return `<button type="button" class="opcao-plano" role="radio" aria-checked="${sel}" data-opcao="${i}" ${unica ? 'tabindex="-1"' : ''}>
          ${marcador}${logo}<span class="nome">${o.nome}</span>${direita}</button>`;
    }).join('');
    const det = p.detalhes.map(([ico, r, v]) => `<li class="detalhe"><img src="${img('icones/' + ico)}" alt=""><span>${r}</span><b>${v}</b></li>`).join('');
    const apps = p.apps.map((k) => k === 'youtube-premium'
      ? `<img src="${img('apps/youtube-premium-logo.svg')}" alt="YouTube Premium" class="yt-premium" width="128" height="32">`
      : logoTag(k)).join('');
    return `
      <article class="card-plano" aria-label="Plano de ${p.num} ${p.unidade}">
        <div class="card-plano__id">
          <span class="selo selo--cheio">${p.selo}</span>
          <p class="velocidade"><b>${p.num}</b><span>${p.unidade}</span>${p.extra ? `<i>${p.extra}</i>` : ''}</p>
          ${p.nota ? `<p class="card-plano__nota">${p.nota}</p>` : ''}
          <hr>
          <ul class="detalhes">${det}</ul>
          <hr>
          <div class="inclusos"><p>Aplicativos inclusos neste plano:</p><div class="inclusos__logos">${apps}</div></div>
          <a class="link-beneficios" href="/aplicativos">Ver todos os benefícios inclusos&nbsp;&nbsp;→</a>
        </div>
        <div class="card-plano__acao">
          <h4>${p.tituloAcao}</h4>
          <div class="opcoes-plano" role="radiogroup" aria-label="${p.tituloAcao}" style="display:flex;flex-direction:column;gap:19px">${opcoes}</div>
          <div class="card-plano__espaco"></div>
          <hr>
          <p class="resumo-plano"><span>O seu plano:</span><b data-resumo></b></p>
          <div class="preco-plano"><s>De ${brl(centavos(p.de))}</s><div><b data-preco></b><span>/mês</span></div></div>
          <p class="obs-plano">no débito automático</p>
          <div class="faixa-cashback"><span>Cashback de 50%</span><b data-cashback></b></div>
          <a class="btn-plano" data-cta href="#">Consultar meu endereço</a>
        </div>
      </article>`;
  }

  function atualizarInternet(el, p) {
    const sel = p.opcoes[p.opcaoAtual];
    const preco = centavos(sel.preco);
    el.querySelector('[data-resumo]').textContent = sel.resumo;
    el.querySelector('[data-preco]').textContent = brl(preco);
    el.querySelector('[data-cashback]').textContent = 'Você recebe ' + brl(cashbackCentavos(preco, 50));
    const tipo = el.closest('[data-acordeao]').dataset.tipo || 'casa';
    const q = new URLSearchParams({ origem: 'internet', plano: p.id, opcao: sel.nome, para: tipo });
    el.querySelector('[data-cta]').href = config.paginaConversao + '?' + q;
  }

  /* ---------- Celular ---------- */
  function tarjaCelular(p) {
    return `
      <button type="button" class="tarja" aria-label="Ver o plano de ${p.num} GB">
        <span class="selo">${p.selo}</span>
        <span class="velocidade"><b>${p.num}</b><span>${p.unidade}</span></span>
        <span class="tarja__espaco"></span>
        <span class="tarja__preco">${brl(centavos(p.preco))}</span>
        <span class="tarja__obs">/mês por linha</span>
      </button>`;
  }

  function cardCelular(p) {
    const det = p.detalhes.map(([ico, r, v]) => `<li class="detalhe"><img src="${img('icones/' + ico)}" alt=""><span>${r}</span><b>${v}</b></li>`).join('');
    const apps = p.apps.map((k) => logoTag(k)).join('');
    return `
      <article class="card-plano" aria-label="Plano de ${p.num} GB">
        <div class="card-plano__id">
          <span class="selo selo--cheio">${p.selo}</span>
          <p class="velocidade"><b>${p.num}</b><span>${p.unidade}</span></p>
          <hr>
          <ul class="detalhes">${det}</ul>
          <hr>
          <div class="inclusos"><p>Use sem gastar sua internet:</p><div class="inclusos__logos">${apps}</div></div>
          <a class="link-beneficios" href="/celular">Ver todos os benefícios inclusos&nbsp;&nbsp;→</a>
        </div>
        <div class="card-plano__acao">
          <h4>Já vem incluso neste plano</h4>
          <div class="incluso-cel"><span>Roaming nacional incluso</span><b>sem custo</b></div>
          <div class="contador">
            <p id="lbl-linhas-${p.id}">Quantas linhas você deseja?</p>
            <div class="contador__ctrl">
              <button type="button" data-linhas="-1" aria-label="Remover uma linha">−</button>
              <output aria-live="polite" aria-labelledby="lbl-linhas-${p.id}" data-qtd>1</output>
              <button type="button" data-linhas="1" aria-label="Adicionar uma linha">+</button>
            </div>
            <small data-mei>MEI: máx 3 linhas · +10 linhas: condições especiais</small>
          </div>
          <div class="card-plano__espaco"></div>
          <hr>
          <p class="resumo-plano"><span>O seu plano:</span><b>${p.num} GB + ligações ilimitadas</b></p>
          <div class="preco-plano"><div><b data-preco></b><span>/mês</span></div></div>
          <p class="obs-plano" data-obs></p>
          <div class="faixa-cashback"><span>Cashback de 100%</span><b data-cashback></b></div>
          <a class="btn-plano" data-cta href="#"></a>
        </div>
      </article>`;
  }

  function atualizarCelular(el, p) {
    const n = p.linhas;
    const unit = centavos(p.preco);
    const total = unit * n;
    el.querySelector('[data-qtd]').textContent = n;
    el.querySelector('[data-preco]').textContent = brl(total);
    el.querySelector('[data-obs]').innerHTML = `${n} ${n === 1 ? 'linha' : 'linhas'} × ${brl(unit)} por mês<br>${brl(total * 12)} no ano`;
    el.querySelector('[data-cashback]').textContent = 'Você recebe ' + brl(cashbackCentavos(total, 100));
    const tipo = el.closest('[data-acordeao]').dataset.tipo || 'cnpj';
    el.querySelector('[data-mei]').hidden = tipo !== 'cnpj';
    const cta = el.querySelector('[data-cta]');
    cta.textContent = tipo === 'cnpj' ? 'Ver oferta para o meu CNPJ' : 'Ver oferta para o meu CPF';
    cta.href = config.paginaConversao + '?' + new URLSearchParams({ origem: 'celular', plano: p.id, linhas: n, para: tipo });
    el.querySelector('[data-linhas="-1"]').disabled = n <= 1;
  }

  /* ---------- Montagem genérica ---------- */
  function montar(raiz, { planos, padrao, vertical, larguraCard, tarja, card, atualizar }) {
    raiz.innerHTML = '';
    raiz.style.setProperty('--larg-card', larguraCard + 'px');
    const els = planos.map((p, i) => {
      p.opcaoAtual = p.opcaoPadrao ?? 0;
      p.linhas = 1;
      const el = document.createElement('div');
      el.className = `plano plano--${vertical} v-${p.variante}`;
      el.dataset.i = i;
      el.innerHTML = tarja(p) + card(p, i);
      raiz.appendChild(el);
      atualizar(el, p);
      return el;
    });

    const secao = raiz.closest('.planos-bloco');
    const pontos = secao.querySelector('.pontos');
    const ant = secao.querySelector('[data-seta="-1"]');
    const prox = secao.querySelector('[data-seta="1"]');
    pontos.innerHTML = planos.map((p, i) => `<button type="button" aria-label="Plano ${p.tarjaNum || p.num} ${p.tarjaUnidade || p.unidade}"></button>`).join('');

    let atual = padrao;
    els.forEach((el, k) => (el.style.viewTransitionName = `${vertical}-plano-${k}`));
    const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // v2: troca suave (View Transitions) + o card aberto vai para o centro da tela
    function abrir(i, foco, doUsuario) {
      const alvo = Math.max(0, Math.min(planos.length - 1, i));
      if (doUsuario && alvo === atual) return;
      if (doUsuario && document.startViewTransition && !semMovimento) {
        raiz.classList.add('trocando');
        const vt = document.startViewTransition(() => aplicar(alvo, foco));
        vt.finished.finally(() => { raiz.classList.remove('trocando'); centralizar(); });
      } else { aplicar(alvo, foco); if (doUsuario) centralizar(); }
    }
    function centralizar() {
      const card = els[atual].querySelector('.card-plano');
      const r = card.getBoundingClientRect();
      const topoFixo = (document.querySelector('.header') || { offsetHeight: 0 }).offsetHeight;
      const livre = innerHeight - topoFixo;
      // Card cabe na tela → centraliza; card mais alto que a tela → alinha o topo logo abaixo do menu
      const destino = r.height <= livre - 24 ? scrollY + r.top - topoFixo - (livre - r.height) / 2 : scrollY + r.top - topoFixo - 12;
      if (Math.abs(destino - scrollY) > 8) window.scrollTo({ top: destino, behavior: semMovimento ? 'auto' : 'smooth' });
    }
    function aplicar(i, foco) {
      atual = i;
      els.forEach((el, k) => {
        el.classList.toggle('aberto', k === atual);
        el.classList.toggle('antes', k < atual);
        el.classList.toggle('depois', k > atual);
        el.style.zIndex = k < atual ? 1 + k : k === atual ? 20 : 10 - k;
        // recuo do baralho (tablet/mobile): cada tarja mais distante fica mais estreita
        const dist = Math.abs(k - atual);
        el.style.setProperty('--recuo-baralho', dist ? Math.min(dist, 3) * 8 + 'px' : '0');
        el.querySelector('.card-plano').setAttribute('aria-hidden', k !== atual);
      });
      [...pontos.children].forEach((b, k) => b.setAttribute('aria-current', k === atual));
      ant.disabled = atual === 0;
      prox.disabled = atual === planos.length - 1;
      if (foco) els[atual].querySelector('.card-plano').focus({ preventScroll: true });
    }

    raiz.addEventListener('click', (e) => {
      const t = e.target.closest('.tarja');
      if (t) { abrir(+t.closest('.plano').dataset.i, false, true); return; }
      const op = e.target.closest('.opcao-plano');
      if (op && op.getAttribute('tabindex') !== '-1') {
        const el = op.closest('.plano'); const p = planos[+el.dataset.i];
        p.opcaoAtual = +op.dataset.opcao;
        const premium = p.variante === 'premium' ? 'premium-' : '';
        el.querySelectorAll('.opcao-plano').forEach((b) => {
          const on = b === op;
          b.setAttribute('aria-checked', on);
          const r = b.querySelector('.radio');
          if (r) r.src = img(`icones/${premium}radio-${on ? 'on' : 'off'}.svg`);
        });
        atualizar(el, p);
        return;
      }
      const st = e.target.closest('[data-linhas]');
      if (st) {
        const el = st.closest('.plano'); const p = planos[+el.dataset.i];
        p.linhas = Math.max(1, Math.min(99, p.linhas + +st.dataset.linhas));
        atualizar(el, p);
      }
    });
    pontos.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) abrir([...pontos.children].indexOf(b), false, true); });
    ant.addEventListener('click', () => abrir(atual - 1, false, true));
    prox.addEventListener('click', () => abrir(atual + 1, false, true));
    raiz.addEventListener('keydown', (e) => {
      if (e.target.closest('.contador, .opcoes-plano')) return;
      if (e.key === 'ArrowRight') { abrir(atual + 1, true, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { abrir(atual - 1, true, true); e.preventDefault(); }
    });
    // Gesto: arrastar para os lados troca de plano
    let x0 = null, y0 = null;
    raiz.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    raiz.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) abrir(atual + (dx < 0 ? 1 : -1), false, true);
      x0 = null;
    });

    raiz.atualizarTodos = () => els.forEach((el, i) => atualizar(el, planos[i]));
    els.forEach((el) => el.querySelector('.card-plano').setAttribute('tabindex', '-1'));
    abrir(padrao);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const ri = document.querySelector('[data-acordeao="internet"]');
    if (ri) montar(ri, { planos: DY.planosInternet, padrao: DY.internetPadrao, vertical: 'internet', larguraCard: 936, tarja: tarjaInternet, card: cardInternet, atualizar: atualizarInternet });
    const rc = document.querySelector('[data-acordeao="celular"]');
    if (rc) montar(rc, { planos: DY.planosCelular, padrao: DY.celularPadrao, vertical: 'celular', larguraCard: 936, tarja: tarjaCelular, card: cardCelular, atualizar: atualizarCelular });

    // Celular e tablet: os mesmos cards compactos da contratação, arrastando para o lado
    document.querySelectorAll('[data-vitrine]').forEach((box) => {
      const tipo = box.dataset.vitrine; const net = tipo === 'internet';
      const lista = net ? DY.planosInternet : DY.planosCelular;
      const destaque = net ? DY.internetPadrao : DY.celularPadrao;
      box.innerHTML = `<div class="ofertas${net ? '' : ' ofertas--cel'}" data-trilho>${lista.map((p) => net ? DY.ofertas.internet(p, { op: 0 }) : DY.ofertas.celular(p)).join('')}</div>${DY.ofertas.dots(lista.length)}`;
      const trilho = box.querySelector('[data-trilho]'); DY.ofertas.ligarDots(trilho);
      const ir = (card) => {
        const para = document.querySelector(`[data-acordeao="${tipo}"]`).dataset.tipo || (net ? 'casa' : 'cnpj');
        const q = net ? { origem: 'internet', plano: card.dataset.id, para } : { origem: 'celular', plano: card.dataset.id, linhas: 1, para };
        location.href = config.paginaConversao + '?' + new URLSearchParams(q);
      };
      trilho.addEventListener('click', (e) => { const c = e.target.closest('.oferta'); if (!c) return; if (e.target.closest('.oferta__escolher')) ir(c); else DY.ofertas.centralizar(c); });
      trilho.addEventListener('keydown', (e) => { const c = e.target.closest('.oferta'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ir(c); } });
      const posicionar = () => { const c = trilho.children[destaque]; if (c && trilho.scrollWidth > trilho.clientWidth + 4) trilho.scrollLeft = c.offsetLeft - (trilho.clientWidth - c.offsetWidth) / 2; };
      requestAnimationFrame(posicionar);
    });

    // Abas "Para a sua casa / empresa" e "Para você / empresa"
    document.querySelectorAll('[data-abas-planos]').forEach((lista) => {
      const alvo = document.querySelector(`[data-acordeao="${lista.dataset.abasPlanos}"]`);
      lista.addEventListener('click', (e) => {
        const aba = e.target.closest('[role="tab"]');
        if (!aba) return;
        lista.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', t === aba));
        alvo.dataset.tipo = aba.dataset.tipo;
        alvo.atualizarTodos();
      });
    });
  });
})();
