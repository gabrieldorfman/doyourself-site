/* ============================================================
   Do Yourself — cards compactos de plano (compartilhados)
   Usados na contratação e na home (celular/tablet).
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos, img, logos } = DY;
  const CHECK = '<svg viewBox="0 0 14 14"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const unid = (p) => (p.unidade === 'GIGA' ? 'Giga' : 'Mega');

  /* Dicas dos detalhes do plano (Download, Upload, Modem, Instalação, Dados móveis) */
  function dica(rotulo, valor) {
    const r = String(rotulo || '').toLowerCase(); const v = String(valor || '');
    if (r.startsWith('download')) return 'Download é a velocidade para <b>assistir</b>, <b>baixar</b> e <b>navegar</b>, mesmo com a família toda conectada.';
    if (r.startsWith('upload')) return 'Upload é a velocidade de <b>envio</b>. Faz diferença em chamadas de vídeo, jogos e para mandar fotos.';
    if (r.startsWith('modem')) {
      if (/wi-?fi 6/i.test(v)) return 'O <b>Wi-Fi 6</b> é a geração mais nova: mais velocidade, mais alcance e estabilidade mesmo com muitos aparelhos conectados ao mesmo tempo.';
      return 'O <b>Wi-Fi 5</b> é rápido e estável para o dia a dia: séries, redes sociais e home office, em casas e apartamentos.';
    }
    if (r.startsWith('instala')) return 'A instalação é <b>gratuita</b>, sem taxas e em até 48 horas.';
    if (r.startsWith('dados')) { const gb = (v.match(/(\d+)\s*GB/i) || [])[1]; return `Franquia de <b>${gb ? gb + ' GB' : 'internet'}</b> de internet <b>móvel</b>, renovada todos os meses.`; }
    return '';
  }
  const attrDica = (r, v) => { const d = dica(r, v); return d ? ` data-dica="${d.replace(/"/g, '&quot;')}" tabindex="0"` : ''; };

  // Card de internet: velocidade, download/upload/modem, apps básicos e preço (sem a personalização)
  function internet(p, { on = false, op = 0, rotulo } = {}) {
    const det = p.detalhes.slice(0, 4).map(([ico, r, v]) => `<li${attrDica(r, v)}><img src="${img('icones/' + ico)}" alt=""><span><i class="dica-rot">${r}</i> <b>${v}</b></span></li>`).join('');
    // Planos com personalização mostram só os apps básicos; o streaming aparece depois de escolher
    const basicos = p.opcoes.length > 1 ? p.apps.filter((k) => !/^(paramount|globoplay|hbo)/.test(k)) : p.apps;
    const apps = basicos.map((k) => k === 'youtube-premium' ? `<img class="yt" src="${img('apps/youtube-premium-logo.svg')}" alt="YouTube Premium">` : `<img src="${img(logos[k].src)}" alt="${logos[k].alt}">`).join('');
    const o = p.opcoes[op] || p.opcoes[0];
    const preco = centavos(o.preco);
    const extra = op > 0 && o.logo ? `<span class="oferta__extra">+ ${o.nome}</span>` : '';
    return `<div class="oferta${p.variante === 'soft' ? ' destaque' : ''}${p.variante === 'premium' ? ' premium' : ''}" role="radio" tabindex="0" aria-checked="${!!on}" aria-label="Internet ${p.num} ${unid(p)}" data-id="${p.id}">
      <div class="oferta__topo"><span class="oferta__selo">${p.selo}</span><span class="oferta__check" aria-hidden="true">${CHECK}</span></div>
      <p class="oferta__vel"><b>${p.num}</b><span>${unid(p)}</span></p>
      <ul class="oferta__lista">${det}</ul>
      <div class="oferta__apps">${apps}</div>
      <div class="oferta__espaco"></div>
      <div class="oferta__preco"><s data-de>De ${brl(centavos(o.de || p.de))}</s><div><b data-preco>${brl(preco)}</b><span>/mês</span></div><small data-preco-obs>${extra || 'no débito automático'}</small></div>
      <div class="oferta__cb"><span>Volta para você<br><small>cashback de 50%</small></span><b data-cb>${brl(cashbackCentavos(preco, 50))}</b></div>
      <span class="oferta__escolher" aria-hidden="true">${rotulo || (on ? 'Plano escolhido' : 'Escolher este plano')}</span>
    </div>`;
  }

  function celular(p, { on = false, rotulo } = {}) {
    const ic = (k) => img('icones/' + p.detalhes[k][0]);
    const det = `<li${attrDica('Dados móveis', p.num + ' GB')}><img src="${ic(0)}" alt=""><span><b>${p.num} GB</b> <i class="dica-rot">de internet por mês</i></span></li><li><img src="${ic(1)}" alt=""><span><b>Ligações ilimitadas</b> para todo o Brasil</span></li><li><img src="${ic(3)}" alt=""><span><b>5G</b> e portabilidade grátis</span></li>`;
    const apps = p.apps.map((k) => `<img src="${img(logos[k].src)}" alt="${logos[k].alt}">`).join('');
    return `<div class="oferta oferta--cel${p.variante === 'soft' ? ' destaque' : ''}${p.variante === 'premium' ? ' premium' : ''}" role="radio" tabindex="0" aria-checked="${!!on}" aria-label="Plano de ${p.num} GB" data-id="${p.id}">
      <div class="oferta__topo"><span class="oferta__selo">${p.selo}</span><span class="oferta__check" aria-hidden="true">${CHECK}</span></div>
      <p class="oferta__vel"><b>${p.num}</b><span>GB</span></p>
      <ul class="oferta__lista">${det}</ul>
      <div class="oferta__apps" title="Apps que não gastam a sua internet">${apps}</div>
      <div class="oferta__espaco"></div>
      <div class="oferta__preco"><div><b>${brl(centavos(p.preco))}</b><span>/mês</span></div><small>por linha, no débito automático</small></div>
      <div class="oferta__cb"><span>Volta para você<br><small>cashback de 100%</small></span><b>${brl(centavos(p.preco))}<small style="font-weight:600">/linha</small></b></div>
      <span class="oferta__escolher" aria-hidden="true">${rotulo || (on ? 'Plano escolhido' : 'Escolher este plano')}</span>
    </div>`;
  }

  // Bloco "Seu plano": o que vem no plano + (quando houver) a escolha do streaming
  function personaliza(p, op) {
    if (!p) return '';
    const [dl, ul, mo] = p.detalhes;
    const tile = (ico, r, v) => `<div class="pz-tile"><img src="${img('icones/' + ico.replace('premium-', ''))}" alt=""><span>${r}</span><b>${v}</b></div>`;
    let tiles = tile(dl[0], 'Download', dl[2]) + tile(ul[0], 'Upload', ul[2]) + tile(mo[0], 'Modem', mo[2].replace(' incluso', ''));
    const yt = p.opcoes.length === 1 && p.opcoes[0].logo === 'youtube-premium';
    if (yt) tiles += `<div class="pz-tile pz-tile--app"><img class="yt" src="${img('apps/youtube-premium-logo.svg')}" alt="YouTube Premium"><span>Assinatura</span><b>Já inclusa</b></div>`;
    let extra = '';
    if (p.opcoes.length > 1) {
      const ops = p.opcoes.map((o, i) => {
        const logo = o.logo ? `<img src="${img(logos[o.logo].src)}" alt="">` : `<span class="p-op__wifi"><img src="${img('icones/hero-wifi.svg')}" alt=""></span>`;
        const tag = o.logo ? '<span class="p-op__tag">Incluso no plano</span>' : '<span class="p-op__tag p-op__tag--neutra">Sem streaming</span>';
        return `<button type="button" class="p-op" role="radio" aria-checked="${i === op}" data-op="${i}"><span class="p-op__logo">${logo}</span><span class="p-op__txt"><b>${o.logo ? o.nome : 'Só internet'}</b>${tag}</span><span class="p-op__preco">${brl(centavos(o.preco))}<small>/mês</small></span></button>`;
      }).join('');
      extra = `<p class="personaliza__titulo personaliza__titulo--2">Quer adicionar um streaming?</p>
        <p class="personaliza__sub">Já vem no preço do plano.</p>
        <div class="personaliza__ops" role="radiogroup" aria-label="Streaming do plano de ${p.num} ${unid(p)}">${ops}</div>`;
    } else if (!yt) {
      extra = '<p class="personaliza__sub">Somente internet, sem streaming.</p>';
    }
    return `<div class="personaliza" data-personaliza>
      <p class="personaliza__titulo">Seu plano de ${p.num} ${unid(p)}</p>
      <div class="pz-tiles${yt ? ' pz-tiles--4' : ''}">${tiles}</div>
      ${extra}
    </div>`;
  }

  const dots = (n) => `<div class="oferta-dots" aria-hidden="true">${'<span></span>'.repeat(n)}</div>`;
  function ligarDots(trilho) {
    const pts = [...trilho.parentElement.querySelectorAll('.oferta-dots span')];
    const marcar = () => {
      const cards = [...trilho.children]; const meio = trilho.scrollLeft + trilho.clientWidth / 2;
      let i = 0, menor = Infinity; cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - meio); if (d < menor) { menor = d; i = k; } });
      pts.forEach((p, k) => p.classList.toggle('on', k === i));
    };
    trilho.addEventListener('scroll', () => requestAnimationFrame(marcar), { passive: true });
    requestAnimationFrame(marcar);
  }

  /* Leva um elemento para o meio da área visível (desconta o menu do topo e a barra fixa de baixo) */
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function areaLivre() {
    const topo = (document.querySelector('.header, .ct-topo') || { offsetHeight: 0 }).offsetHeight;
    const dock = document.querySelector('[data-dock]:not([hidden])');
    const baixo = dock && getComputedStyle(dock).display !== 'none' ? dock.getBoundingClientRect().height : 0;
    return { topo, livre: innerHeight - topo - baixo };
  }
  function trazerParaMeio(el) {
    const r = el.getBoundingClientRect(); const { topo, livre } = areaLivre();
    const destino = r.height <= livre - 16 ? scrollY + r.top - topo - (livre - r.height) / 2 : scrollY + r.top - topo - 12;
    if (Math.abs(destino - scrollY) > 6) window.scrollTo({ top: destino, behavior: reduzir ? 'auto' : 'smooth' });
  }
  // Toque no card: centraliza no trilho (arraste lateral) e na tela
  function centralizar(card) {
    const trilho = card.parentElement;
    if (trilho.scrollWidth > trilho.clientWidth + 4) trilho.scrollTo({ left: card.offsetLeft - (trilho.clientWidth - card.offsetWidth) / 2, behavior: reduzir ? 'auto' : 'smooth' });
    trazerParaMeio(card);
  }

  /* Balão das dicas: 0,5 s com o mouse em cima, ou ao tocar com o dedo */
  let bolha = null, timer = null, atual = null, desde = 0;
  const esconder = () => { clearTimeout(timer); if (bolha) bolha.classList.remove('on'); atual = null; };
  function mostrar(el) {
    if (!bolha) { bolha = document.createElement('div'); bolha.className = 'dica-bolha'; bolha.setAttribute('role', 'tooltip'); document.body.appendChild(bolha); }
    if (atual !== el) desde = Date.now();
    bolha.innerHTML = el.dataset.dica; bolha.classList.add('on'); atual = el;
    const r = el.getBoundingClientRect(); const b = bolha.getBoundingClientRect();
    let x = r.left + Math.min(r.width, 160) / 2 - b.width / 2; x = Math.max(10, Math.min(x, innerWidth - b.width - 10));
    const cima = r.top - b.height - 10 > 70; const y = cima ? r.top - b.height - 10 : r.bottom + 10;
    bolha.style.left = x + 'px'; bolha.style.top = y + 'px'; bolha.classList.toggle('embaixo', !cima);
  }
  const fino = matchMedia('(hover: hover) and (pointer: fine)');
  document.addEventListener('mouseover', (e) => {
    if (!fino.matches) return; const el = e.target.closest('[data-dica]'); if (!el || el === atual) return;
    clearTimeout(timer); timer = setTimeout(() => mostrar(el), 500);
  });
  document.addEventListener('mouseout', (e) => { if (!fino.matches) return; const el = e.target.closest('[data-dica]'); if (el && !el.contains(e.relatedTarget)) esconder(); });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-dica]');
    if (!el) { esconder(); return; }
    // no toque: o foco já pode ter aberto o balão; um segundo toque (depois de um instante) fecha
    if (!fino.matches) { if (atual === el && Date.now() - desde > 400) esconder(); else mostrar(el); }
  });
  document.addEventListener('focusin', (e) => { const el = e.target.closest('[data-dica]'); if (el) mostrar(el); });
  document.addEventListener('focusout', () => { if (fino.matches) esconder(); });
  // ao rolar (ou quando o card centraliza), o balão acompanha o item; some só se o item sair da tela
  window.addEventListener('scroll', () => requestAnimationFrame(() => {
    if (!atual) return; const r = atual.getBoundingClientRect();
    if (r.bottom < 60 || r.top > innerHeight) esconder(); else mostrar(atual);
  }), { passive: true });

  DY.ofertas = { internet, celular, personaliza, dots, ligarDots, centralizar, trazerParaMeio, CHECK, dica, attrDica };
})();
