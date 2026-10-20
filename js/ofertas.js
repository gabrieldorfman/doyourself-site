/* ============================================================
   Do Yourself — cards compactos de plano (compartilhados)
   Usados na contratação e na home (celular/tablet).
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos, img, logos } = DY;
  const CHECK = '<svg viewBox="0 0 14 14"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const unid = (p) => (p.unidade === 'GIGA' ? 'Giga' : 'Mega');

  // Card de internet: velocidade, download/upload/modem, apps básicos e preço (sem a personalização)
  function internet(p, { on = false, op = 0, rotulo } = {}) {
    const det = p.detalhes.slice(0, 3).map(([ico, r, v]) => `<li><img src="${img('icones/' + ico)}" alt=""><span>${r} <b>${v}</b></span></li>`).join('');
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
      <div class="oferta__preco"><s>De ${brl(centavos(p.de))}</s><div><b data-preco>${brl(preco)}</b><span>/mês</span></div><small data-preco-obs>${extra || 'no débito automático'}</small></div>
      <div class="oferta__cb"><span>Volta para você<br><small>cashback de 50%</small></span><b data-cb>${brl(cashbackCentavos(preco, 50))}</b></div>
      <span class="oferta__escolher" aria-hidden="true">${rotulo || (on ? 'Plano escolhido' : 'Escolher este plano')}</span>
    </div>`;
  }

  function celular(p, { on = false, rotulo } = {}) {
    const ic = (k) => img('icones/' + p.detalhes[k][0]);
    const det = `<li><img src="${ic(0)}" alt=""><span><b>${p.num} GB</b> de internet por mês</span></li><li><img src="${ic(1)}" alt=""><span><b>Ligações ilimitadas</b> para todo o Brasil</span></li><li><img src="${ic(3)}" alt=""><span><b>5G</b> e portabilidade grátis</span></li>`;
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

  // Bloco "Quer personalizar sua internet?" — só para planos com mais de uma opção
  function personaliza(p, op) {
    if (!p || p.opcoes.length < 2) return '';
    const ops = p.opcoes.map((o, i) => {
      const logo = o.logo ? `<img src="${img(logos[o.logo].src)}" alt="">` : `<span class="p-op__wifi"><img src="${img('icones/hero-wifi.svg')}" alt=""></span>`;
      const tag = o.logo ? '<span class="p-op__tag">Incluso no plano</span>' : '<span class="p-op__tag p-op__tag--neutra">Sem streaming</span>';
      return `<button type="button" class="p-op" role="radio" aria-checked="${i === op}" data-op="${i}"><span class="p-op__logo">${logo}</span><span class="p-op__txt"><b>${o.logo ? o.nome : 'Só internet'}</b>${tag}</span><span class="p-op__preco">${brl(centavos(o.preco))}<small>/mês</small></span></button>`;
    }).join('');
    return `<div class="personaliza" data-personaliza>
      <p class="personaliza__titulo">Quer personalizar sua internet?</p>
      <p class="personaliza__sub">O streaming já vem no preço do plano.</p>
      <div class="personaliza__ops" role="radiogroup" aria-label="Personalize o plano de ${p.num} ${unid(p)}">${ops}</div>
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

  DY.ofertas = { internet, celular, personaliza, dots, ligarDots, CHECK };
})();
