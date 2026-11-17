/* ============================================================
   Do Yourself — vitrine de planos em carrossel (versão "Nio")
   Mesmos dados da outra Home (js/config.js); só muda a apresentação.
   ============================================================ */
(function () {
  const { img, logos, brl, centavos, cashbackCentavos, config } = DY;

  const ICONE = { internet: 'icones/pill-wifi.svg', celular: 'icones/pill-celular.svg' };
  const NOME = { internet: 'Internet Fibra', celular: 'Plano de Celular' };

  function card(p, tipo) {
    const premium = p.variante === 'premium';
    const destaque = p.selo === 'OFERTA DO MÊS';
    let preco, rotuloPreco, pct, cbTexto;
    if (tipo === 'internet') {
      preco = Math.min(...p.opcoes.map((o) => centavos(o.preco)));
      rotuloPreco = p.opcoes.length > 1 && p.opcoes.some((o) => centavos(o.preco) !== preco) ? 'a partir de' : '';
      pct = 50;
      cbTexto = `Você recebe ${brl(cashbackCentavos(preco, pct))} de volta`;
    } else {
      preco = centavos(p.preco);
      rotuloPreco = '';
      pct = 100;
      cbTexto = `Você recebe ${brl(cashbackCentavos(preco, pct))} por linha`;
    }
    const num = tipo === 'internet' ? (p.tarjaNum || p.num) : p.num;
    const uni = tipo === 'internet' ? (p.tarjaNum ? 'Mega' : p.unidade === 'MEGA' ? 'Mega' : p.unidade) : 'GB';
    const itens = p.detalhes.map(([, r, v]) => {
      const txt = tipo === 'internet'
        ? (r === 'Modem' ? v : r === 'Instalação:' ? 'Instalação gratuita' : `${r} de ${v}`)
        : (r === 'Dados móveis' ? v : r === 'Portabilidade' ? v : `${r}: ${v}`);
      return `<li><span class="n-check" aria-hidden="true"></span>${txt}</li>`;
    }).join('');
    const apps = (p.apps || []).filter((k) => k !== 'youtube-premium').map((k) => `<img src="${img(logos[k].src)}" alt="${logos[k].alt}" width="28" height="28">`).join('')
      + ((p.apps || []).includes('youtube-premium') ? `<img class="yt" src="${img('apps/youtube-premium-logo.svg')}" alt="YouTube Premium" width="84" height="21">` : '');
    const q = new URLSearchParams({ origem: tipo, plano: p.id });
    return `
      <article class="n-plano n-plano--${tipo}${premium ? ' n-plano--premium' : ''}${destaque ? ' n-plano--destaque' : ''}">
        ${destaque ? '<span class="n-plano__badge">Oferta do mês</span>' : ''}
        <header class="n-plano__topo"><span>${NOME[tipo]} · ${p.selo === 'OFERTA DO MÊS' ? 'Oferta' : p.selo.charAt(0) + p.selo.slice(1).toLowerCase()}</span><img src="${img(ICONE[tipo])}" alt=""></header>
        <div class="n-plano__corpo">
          <p class="n-plano__vel"><b>${num}</b> ${uni}</p>
          <ul class="n-plano__itens">${itens}</ul>
          ${apps ? `<div class="n-plano__apps"><small>${tipo === 'internet' ? 'Apps inclusos' : 'Sem gastar sua internet'}</small><div>${apps}</div></div>` : ''}
          <div class="n-plano__preco">
            ${rotuloPreco ? `<small>${rotuloPreco}</small>` : ''}
            <p><span>R$</span><b>${(preco / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b><span>/mês${tipo === 'celular' ? ' por linha' : ''}</span></p>
            <small>no débito automático</small>
          </div>
          <p class="n-plano__cb"><span>Cashback de ${pct}%</span><b>${cbTexto}</b></p>
          <a class="n-pill n-pill--escuro n-plano__btn" href="${config.paginaConversao}?${q}">Escolher plano</a>
          <a class="n-plano__link" href="${tipo === 'internet' ? '/internet-fibra' : '/celular'}">Detalhes da oferta</a>
        </div>
      </article>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const trilho = document.querySelector('[data-vitrine]');
    if (!trilho) return;
    const pontos = document.querySelector('[data-vitrine-pontos]');
    const abas = document.querySelector('[data-vitrine-abas]');
    const setas = document.querySelectorAll('[data-vitrine-seta]');

    function render(tipo) {
      const lista = tipo === 'internet' ? DY.planosInternet : DY.planosCelular;
      trilho.innerHTML = lista.map((p) => card(p, tipo)).join('');
      trilho.style.scrollBehavior = 'auto';
      trilho.scrollLeft = 0;
      trilho.style.scrollBehavior = '';
      atualizarPontos();
    }
    const passo = () => { const c = trilho.firstElementChild; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(trilho).columnGap || 20) : 300; };
    function atualizarPontos() {
      const paginas = Math.max(1, Math.ceil((trilho.scrollWidth - trilho.clientWidth) / passo()) + 1);
      const atual = Math.round(trilho.scrollLeft / passo());
      pontos.innerHTML = Array.from({ length: paginas }, (_, i) => `<span class="${i === Math.min(atual, paginas - 1) ? 'ativo' : ''}"></span>`).join('');
      pontos.hidden = paginas < 2;
      // tolerância: o scroll-snap pode deixar alguns pixels de folga nas pontas
      setas[0].disabled = trilho.scrollLeft <= 12;
      setas[1].disabled = trilho.scrollLeft >= trilho.scrollWidth - trilho.clientWidth - 12;
    }
    trilho.addEventListener('scroll', () => requestAnimationFrame(atualizarPontos), { passive: true });
    window.addEventListener('resize', atualizarPontos);
    setas.forEach((s) => s.addEventListener('click', () => trilho.scrollBy({ left: passo() * +s.dataset.vitrineSeta, behavior: 'smooth' })));

    function trocar(tipo) {
      abas.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', t.dataset.aba === tipo));
      render(tipo);
    }
    abas.addEventListener('click', (e) => { const t = e.target.closest('[data-aba]'); if (t) trocar(t.dataset.aba); });
    document.querySelectorAll('[data-ir-aba]').forEach((a) => a.addEventListener('click', () => trocar(a.dataset.irAba)));
    render('internet');

    /* Barra fixa de consulta: aparece quando o CEP do topo sai da tela */
    const barra = document.querySelector('[data-barra]');
    const cep = document.getElementById('consulta');
    if (barra && cep) {
      new IntersectionObserver(([en]) => { barra.hidden = en.isIntersecting; }, { threshold: 0 }).observe(cep);
      barra.querySelector('[data-barra-cta]').addEventListener('click', (e) => {
        e.preventDefault();
        cep.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => cep.querySelector('[name="cep"]').focus({ preventScroll: true }), 500);
      });
    }
  });
})();
