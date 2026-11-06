/* ============================================================
   Do Yourself — páginas de Planos de Celular
   (/celular, /celular/cpf, /celular/cnpj e /celular/cpf/<plano>)
   Preços de DY.celularCpf / DY.planosCnpj / DY.celularPorta (config.js).
   A barra de localização e a barra fixa do celular vêm do fibra.js.
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos, img, logos } = DY;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const R = (v) => brl(centavos(v));
  const lista = (tipo) => (tipo === 'cpf' ? DY.celularCpf : tipo === 'porta' ? DY.celularPorta : DY.planosCnpj);
  const achar = (tipo, id) => lista(tipo).find((p) => p.id === id);
  const conversao = (p, { linhas = 1, porta = true } = {}) => DY.config.paginaConversao + '?' + new URLSearchParams({ origem: 'celular', plano: p.id, linhas, para: p.tipo, ...(p.tipo === 'cpf' && !porta ? { numero: 'novo' } : {}) });
  const linkPlano = (p) => (p.tipo === 'cpf' ? '/celular/cpf/' + p.slug : conversao(p));
  const zap = (t) => DY.linkWhatsApp(t);

  /* ---------- Pilhas do topo ---------- */
  function pilhaHub(el) {
    const cpf = achar('cpf', 'controle'); const cnpj = achar('cnpj', '50');
    el.innerHTML = `<a class="fb-pilha__top fb-pilha__top--cel" href="/celular/cpf">
        <span class="fb-pilha__selo">Para você · CPF</span>
        <p class="fb-pilha__vel"><b>${cpf.gb}</b><span>GB</span></p>
        <p class="fb-pilha__spec">Plano ${cpf.nome}: conta fixa, ligações e SMS ilimitados</p>
        <div class="fb-pilha__preco"><div><strong>${R(cpf.preco)}</strong><small>/mês na portabilidade</small></div><span class="fb-pilha__cb">💸 <b>${R(cpf.preco)}</b> de volta no PIX</span></div>
        <span class="fb-pilha__btn">Ver planos para CPF <span aria-hidden="true">→</span></span>
      </a>
      <a class="fb-pilha__top" href="/celular/cnpj">
        <span class="fb-pilha__selo">Para a empresa · CNPJ</span>
        <p class="fb-pilha__vel"><b>${cnpj.gb}</b><span>GB</span></p>
        <p class="fb-pilha__spec">1ª mensalidade grátis + 100% de volta no PIX</p>
        <div class="fb-pilha__preco"><div><strong>${R(cnpj.preco)}</strong><small>/mês por linha</small></div><span class="fb-pilha__cb">💸 <b>${R(cnpj.preco)}</b> por linha no PIX</span></div>
        <span class="fb-pilha__btn">Ver planos para empresa <span aria-hidden="true">→</span></span>
      </a>
      <p class="fb-pilha__pe"><span>Valores no débito automático, para ${esc(DY.textoLocal())}.</span></p>`;
  }
  function pilhaTipo(el) {
    const tipo = el.dataset.pilhaCel;
    const ps = lista(tipo);
    const top = ps.find((p) => p.selo === 'OFERTA DO MÊS') || ps[0];
    const resto = tipo === 'cpf' ? ps.filter((p) => p !== top) : ['30', '100', '12'].map((id) => achar('cnpj', id));
    const sub = (p) => (p.tipo === 'cpf' ? p.nome : (p.apps.includes('facebook') ? 'Redes sociais sem gastar' : 'WhatsApp sem gastar'));
    el.innerHTML = `<a class="fb-pilha__top fb-pilha__top--cel" href="${linkPlano(top)}">
        <span class="fb-pilha__selo">${tipo === 'cpf' ? 'Oferta do mês' : 'Mais vendido para empresas'}</span>
        <p class="fb-pilha__vel"><b>${top.gb}</b><span>GB</span></p>
        <p class="fb-pilha__spec">${tipo === 'cpf' ? `${top.nome} · ligações e SMS ilimitados` : '1ª mensalidade grátis · WhatsApp, redes sociais e Waze sem gastar a internet'}</p>
        <div class="fb-pilha__preco"><div><strong>${R(top.preco)}</strong><small>${tipo === 'cpf' ? '/mês na portabilidade' : '/mês por linha'}</small></div><span class="fb-pilha__cb">💸 <b>${R(top.preco)}</b> de volta no PIX</span></div>
        <span class="fb-pilha__btn">${tipo === 'cpf' ? 'Ver o plano ' + top.nome : 'Quero o plano de ' + top.gb + ' GB'} <span aria-hidden="true">→</span></span>
      </a>
      ${resto.map((p) => `<a class="fb-pilha__linha fb-pilha__linha--cel" href="${linkPlano(p)}"><span class="n"><b>${p.gb}</b>GB</span><span>${sub(p)}</span><span class="p">${R(p.preco)}</span><span class="s" aria-hidden="true">→</span></a>`).join('')}
      <p class="fb-pilha__pe"><span>${tipo === 'cpf' ? 'Na portabilidade, no débito automático.' : 'Por linha, no débito automático, para ' + esc(DY.textoLocal()) + '.'}</span><a href="#comparar">Comparar todos →</a></p>`;
  }

  /* ---------- Preço nas personas e nos cards ---------- */
  function precoPersona(el) {
    const [tipo, id] = el.dataset.celPreco.split(':'); const p = achar(tipo, id); if (!p) return;
    const obs = tipo === 'cpf' ? 'na portabilidade' : 'por linha';
    el.innerHTML = el.dataset.formato === 'curto' ? `<b>${R(p.preco)}</b>/mês ${obs}` : `<b>${R(p.preco)}</b>/mês ${obs} · <span class="cb">${R(p.preco)} de volta no PIX</span>`;
  }

  /* ---------- Tabelas "Comparar" ---------- */
  function comparar(el) {
    const tipo = el.dataset.celComparar;
    if (tipo === 'cpf') {
      el.innerHTML = `<table><thead><tr><th>Plano</th><th>Trazendo o número</th><th>Número novo</th><th>Ligações</th><th>Cashback</th><th></th></tr></thead><tbody>${DY.celularCpf.map((p) => `<tr><th scope="row">${p.nome}</th><td class="p">${p.gb} GB · ${R(p.preco)}</td><td>${p.gbNova} GB · ${R(p.precoNova)}</td><td>${p.minutos ? p.minutos + ' minutos' : 'Ilimitadas'}</td><td class="cb">100% do mês</td><td><a href="${linkPlano(p)}">Ver plano →</a></td></tr>`).join('')}</tbody></table>`;
      return;
    }
    el.innerHTML = `<table><thead><tr><th>Plano</th><th>Internet</th><th>Sem gastar a internet</th><th>Por linha</th><th>Cashback</th><th></th></tr></thead><tbody>${lista(tipo).map((p) => `<tr><th scope="row">${p.gb} GB</th><td>${p.plano} GB + ${p.bonus} GB de bônus</td><td>${p.apps.includes('facebook') ? 'WhatsApp, redes sociais e Waze' : 'WhatsApp, Messenger e Waze'}</td><td class="p">${R(p.preco)}</td><td class="cb">${R(p.preco)}</td><td><a href="${conversao(p)}">Escolher →</a></td></tr>`).join('')}</tbody></table>`;
  }

  /* ---------- Calculadora de cashback (plano × linhas) ---------- */
  function calc(el) {
    const ops = [...DY.celularCpf.map((p) => ({ p, rot: p.nome + ' (CPF)' })), ...DY.planosCnpj.filter((p) => ['12', '30', '50', '100'].includes(p.id)).map((p) => ({ p, rot: `Empresa ${p.gb} GB (CNPJ)` }))];
    let i = Math.max(0, ops.findIndex((x) => x.p.id === '50')); let n = 3;
    const caixa = el.querySelector('[data-calc-ops]'); const res = el.querySelector('[data-calc-res]');
    const desenhar = () => {
      const x = ops[i]; const max = x.p.tipo === 'cpf' ? 5 : 20; n = Math.min(n, max);
      caixa.innerHTML = '<p>Escolha o plano</p>' + ops.map((o, k) => `<button type="button" class="fb-calc__op fb-calc__op--cel" role="radio" aria-checked="${k === i}" data-k="${k}"><b>${o.rot}</b><span>${R(o.p.preco)}/linha</span></button>`).join('');
      const total = centavos(x.p.preco) * n;
      res.innerHTML = `<small>Quantas linhas?</small><div class="fb-linhas"><button type="button" data-n="-1" aria-label="Tirar uma linha"${n <= 1 ? ' disabled' : ''}>−</button><output aria-live="polite">${n}</output><button type="button" data-n="1" aria-label="Adicionar uma linha"${n >= max ? ' disabled' : ''}>+</button></div>
        <small>Você recebe no PIX</small><strong>${brl(cashbackCentavos(total, 100))}</strong>
        <p>100% de um mês de ${n} ${n === 1 ? 'linha' : 'linhas'}, uma única vez, em até 7 dias depois que o chip é ativado.${x.p.tipo === 'cnpj' ? ' E a 1ª mensalidade ainda é grátis.' : ''}</p>`;
    };
    el.onclick = (e) => {
      const b = e.target.closest('[data-k]'); if (b) { i = +b.dataset.k; desenhar(); return; }
      const m = e.target.closest('[data-n]'); if (m) { n = Math.max(1, n + +m.dataset.n); desenhar(); }
    };
    desenhar();
  }

  /* ---------- Página de cada plano controle ---------- */
  const pg = document.querySelector('[data-cel-pg]');
  const est = { porta: new URLSearchParams(location.search).get('numero') !== 'novo', linhas: 1 };
  function cartao() {
    const box = document.querySelector('[data-preco-card]'); if (!box || !pg) return;
    const p = achar('cpf', pg.dataset.celPg); if (!p) return;
    const preco = DY.celPreco(p, est.porta); const gb = DY.celGB(p, est.porta); const total = centavos(preco) * est.linhas;
    const prem = p.variante === 'premium';
    box.className = 'fb-preco fb-preco--cel' + (prem ? ' fb-preco--premium' : '');
    box.innerHTML = `<div class="fb-preco__topo"><span class="fb-preco__selo">${p.selo === 'OFERTA DO MÊS' ? 'Oferta do mês' : p.selo.charAt(0) + p.selo.slice(1).toLowerCase()}</span><span class="fb-preco__wifi">${p.nome}</span></div>
      <p class="fb-preco__vel"><b>${gb}</b><span>GB por mês</span></p>
      <div class="fb-preco__ops" role="radiogroup" aria-label="Número da linha"><p>Você vai trazer o seu número?</p>
        <button type="button" class="fb-op" role="radio" aria-checked="${est.porta}" data-porta="1"><span class="sem"><img src="${img('icones/portabilidade.svg')}" alt=""></span><b>Sim, portabilidade</b><span>${R(p.preco)}</span></button>
        <button type="button" class="fb-op" role="radio" aria-checked="${!est.porta}" data-porta="0"><span class="sem"><img src="${img('icones/chip-celular.svg')}" alt=""></span><b>Quero um número novo</b><span>${R(p.precoNova)}</span></button>
      </div>
      <div class="fb-preco__valor"><strong>${R(preco)}</strong><small>/mês por linha</small><p class="fb-preco__obs">${est.porta ? `${p.gb} GB trazendo o seu número` : `${p.gbNova} GB com número novo`}, no débito automático</p></div>
      <div class="fb-linhas fb-linhas--card"><span>Linhas</span><button type="button" data-n="-1" aria-label="Tirar uma linha"${est.linhas <= 1 ? ' disabled' : ''}>−</button><output aria-live="polite">${est.linhas}</output><button type="button" data-n="1" aria-label="Adicionar uma linha"${est.linhas >= 5 ? ' disabled' : ''}>+</button></div>
      <div class="fb-preco__cb"><span>Volta para você no PIX</span><b>${brl(cashbackCentavos(total, 100))}</b></div>
      <a class="dy-btn dy-btn--primario dy-btn--g" href="${conversao(p, est)}">Quero o ${p.nome} <span class="seta-dir" aria-hidden="true">→</span></a>
      <a class="dy-btn dy-btn--contorno" href="${zap(`Oi! Vim pela página do plano ${p.nome} e quero tirar uma dúvida.`)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
      <p class="fb-preco__rodape">Chip enviado para você · Cashback de 100% · Plano no seu CPF</p>`;
    box.onclick = (e) => {
      const b = e.target.closest('[data-porta]'); if (b) { est.porta = b.dataset.porta === '1'; cartao(); return; }
      const m = e.target.closest('[data-n]'); if (m) { est.linhas = Math.max(1, Math.min(5, est.linhas + +m.dataset.n)); cartao(); }
    };
    $$('[data-plano-preco]').forEach((el) => (el.textContent = R(preco)));
    $$('[data-plano-cb]').forEach((el) => (el.textContent = R(preco)));
    $$('[data-plano-cta]').forEach((el) => (el.href = conversao(p, est)));
    const barra = document.querySelector('[data-fb-barra]');
    if (barra) {
      barra.hidden = false;
      barra.querySelector('[data-barra-txt]').innerHTML = `<b>${R(preco)}/mês</b>${R(preco)} de volta no PIX`;
      const a = barra.querySelector('a'); a.href = conversao(p, est);
    }
  }

  function render() {
    $$('[data-pilha-cel]').forEach((el) => (el.dataset.pilhaCel === 'hub' ? pilhaHub(el) : pilhaTipo(el)));
    $$('[data-cel-preco]').forEach(precoPersona);
    $$('[data-cel-comparar]').forEach(comparar);
    $$('[data-cel-calc]').forEach(calc);
    cartao();
  }
  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('dy:planos', render);
})();
