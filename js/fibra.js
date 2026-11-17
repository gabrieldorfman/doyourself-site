/* ============================================================
   Do Yourself — páginas de Internet Fibra
   · Barra "Ofertas válidas para <cidade>" + painel para trocar (CEP ou Estado/Cidade)
   · Pilha de planos do topo, calculadora de cashback, preços das personas,
     tabela "Comparar planos" e o cartão de preço da página de cada plano.
   Tudo lê os preços de DY.catalogo (config.js), pela região do cliente.
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos, img, logos } = DY;
  const corpo = document.body;

  // Página de empresa mostra os planos do CNPJ; o resto, os de casa
  if (corpo.dataset.tipoNet) DY.definirPlanos({ tipo: corpo.dataset.tipoNet });

  /* ---------- Utilidades ---------- */
  const lista = (tipo) => DY.catalogo[tipo][DY.blocoInternet(DY.uf)];
  const achar = (tipo, id) => lista(tipo).find((p) => p.id === id || p.id === 'e' + id);
  const num = (p) => p.id.replace(/^e/, '');
  const nomePlano = (p) => (num(p) === '1000' ? '1 Giga' : num(p) + ' Mega');
  const wifi = (p) => ((p.detalhes.find(([, r]) => r === 'Modem') || [])[2] || '').replace(' incluso', '');
  const upload = (p) => (p.detalhes.find(([, r]) => r === 'Upload') || [])[2] || '';
  const cb = (preco) => brl(cashbackCentavos(centavos(preco), 50));
  const conversao = (p, tipo, opcao) => DY.config.paginaConversao + '?' + new URLSearchParams({ origem: 'internet', plano: p.id, para: tipo, ...(opcao && opcao !== 'Somente Internet' ? { opcao } : {}) });
  const linkPlano = (p, tipo) => (tipo === 'casa' && DY.paginaPlano[num(p)]) || conversao(p, tipo);
  const streaming = (p) => p.opcoes.filter((o) => o.logo).map((o) => o.nome);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const zap = (t) => DY.linkWhatsApp(t);

  /* ---------- Barra de localização + painel ---------- */
  let modal = null;
  function montarModal() {
    if (modal) return modal;
    const ufs = Object.entries(DY.UFS).sort((x, y) => x[1].localeCompare(y[1], 'pt-BR')).map(([s, n]) => `<option value="${s}">${n}</option>`).join('');
    modal = document.createElement('dialog');
    modal.className = 'local-modal';
    modal.setAttribute('aria-labelledby', 'lm-titulo');
    modal.innerHTML = `<div class="local-modal__in">
      <div class="local-modal__topo"><h2 class="dy-h3" id="lm-titulo">Onde você quer a internet?</h2><button type="button" class="local-modal__fechar" data-lm-fechar aria-label="Fechar">×</button></div>
      <p class="local-modal__sub">Os preços mudam de uma região para outra. Escolha onde vai ser a instalação.</p>
      <form data-lm-cep novalidate>
        <label for="lm-cep">CEP</label>
        <div class="local-modal__linha"><input class="lm-campo" id="lm-cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9"><button class="lm-btn" type="submit">Ver ofertas</button></div>
        <a class="local-modal__link" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener">Não sei meu CEP</a>
      </form>
      <div class="local-modal__ou">ou ache pela cidade</div>
      <form data-lm-cidade novalidate>
        <div class="local-modal__linha">
          <div class="lm-uf"><label for="lm-uf">Estado</label><select class="lm-campo" id="lm-uf"><option value="">Escolha</option>${ufs}</select></div>
          <div style="flex:1"><label for="lm-cid">Cidade</label><input class="lm-campo" id="lm-cid" list="lm-cidades" autocomplete="address-level2" placeholder="Digite a cidade"><datalist id="lm-cidades"></datalist></div>
        </div>
        <button class="lm-btn lm-btn--bloco" type="submit">Ver ofertas da cidade</button>
      </form>
      <p class="local-modal__msg" data-lm-msg role="status"></p>
      <p class="local-modal__nota">Usamos a sua localização aproximada só para mostrar os preços da região. A cobertura da fibra é confirmada pelo CEP e pelo número do imóvel, na hora do pedido.</p>
    </div>`;
    document.body.appendChild(modal);
    const msg = modal.querySelector('[data-lm-msg]');
    const fechar = () => modal.close();
    modal.querySelector('[data-lm-fechar]').addEventListener('click', fechar);
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

    const cep = modal.querySelector('#lm-cep');
    cep.addEventListener('input', () => { const d = cep.value.replace(/\D/g, '').slice(0, 8); cep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; });
    modal.querySelector('[data-lm-cep]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = cep.value.replace(/\D/g, '');
      if (d.length !== 8) { msg.className = 'local-modal__msg'; msg.textContent = 'Digite os 8 números do CEP.'; cep.focus(); return; }
      const btn = e.submitter || e.target.querySelector('button'); btn.disabled = true; msg.className = 'local-modal__msg ok'; msg.textContent = 'Buscando o CEP…';
      const r = await buscarCep(d); btn.disabled = false;
      if (!r) { msg.className = 'local-modal__msg'; msg.textContent = 'Não encontramos esse CEP. Confira os números ou escolha pela cidade.'; return; }
      aplicar(r.uf, r.cidade);
    });

    const uf = modal.querySelector('#lm-uf'); const cid = modal.querySelector('#lm-cid');
    uf.addEventListener('change', () => carregarCidades(uf.value));
    modal.querySelector('[data-lm-cidade]').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!uf.value) { msg.className = 'local-modal__msg'; msg.textContent = 'Escolha o estado.'; uf.focus(); return; }
      const nomes = cidades[uf.value] || [];
      const digitado = cid.value.trim();
      const certo = nomes.find((n) => n.localeCompare(digitado, 'pt-BR', { sensitivity: 'base' }) === 0);
      if (!digitado) { msg.className = 'local-modal__msg'; msg.textContent = 'Digite a cidade.'; cid.focus(); return; }
      if (nomes.length && !certo) { msg.className = 'local-modal__msg'; msg.textContent = 'Não achamos essa cidade em ' + DY.UFS[uf.value] + '. Escolha uma da lista.'; cid.focus(); return; }
      aplicar(uf.value, certo || digitado);
    });
    return modal;
  }
  const cidades = {};
  async function carregarCidades(uf) {
    const dl = modal.querySelector('#lm-cidades'); dl.innerHTML = '';
    if (!uf) return;
    if (!cidades[uf]) {
      try {
        const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        cidades[uf] = (await r.json()).map((m) => m.nome);
      } catch (e) { cidades[uf] = []; }
    }
    dl.innerHTML = cidades[uf].map((n) => `<option value="${esc(n)}">`).join('');
  }
  async function buscarCep(cep) {
    const tentar = async (url, mapa) => { try { const r = await fetch(url); if (!r.ok) return null; return mapa(await r.json()); } catch (e) { return null; } };
    return (await tentar('https://brasilapi.com.br/api/cep/v1/' + cep, (d) => (d.state ? { uf: d.state, cidade: d.city } : null)))
      || tentar('https://viacep.com.br/ws/' + cep + '/json/', (d) => (d.erro ? null : { uf: d.uf, cidade: d.localidade }));
  }
  function aplicar(uf, cidade) {
    DY.cidade = cidade || ''; DY.localDoCep = true;
    DY.salvarLocal(uf, DY.cidade);
    DY.definirPlanos({ uf });
    modal.close();
  }
  function abrirModal() {
    montarModal();
    const uf = modal.querySelector('#lm-uf'); uf.value = DY.uf; carregarCidades(DY.uf);
    modal.querySelector('#lm-cid').value = DY.cidade || '';
    modal.querySelector('[data-lm-msg]').textContent = '';
    modal.showModal();
    modal.querySelector('#lm-cep').focus();
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-local-alterar]')) abrirModal(); });

  /* ---------- Pilha de planos do topo ---------- */
  function pilha(el) {
    const tipo = el.dataset.pilhaPlanos;
    const ps = lista(tipo).slice().sort((a, b) => +num(b) - +num(a));
    const [top, ...resto] = ps;
    const o = top.opcoes[0];
    const extra = (p) => (streaming(p).length === 1 && p.opcoes.length === 1 ? '+ ' + streaming(p)[0] : streaming(p).length ? 'Streaming opcional' : wifi(p));
    el.innerHTML = `<a class="fb-pilha__top" href="${linkPlano(top, tipo)}">
        <span class="fb-pilha__selo">${tipo === 'casa' ? 'O mais rápido' : 'Mais vendido para empresas'}</span>
        <p class="fb-pilha__vel"><b>${num(top)}</b><span>Mega</span></p>
        <p class="fb-pilha__spec">${wifi(top)} · ${upload(top)} de upload${tipo === 'casa' && streaming(top).length ? ' · ' + streaming(top).join(' ou ') + ' opcional' : ''}</p>
        <div class="fb-pilha__preco"><div><s>De ${brl(centavos(o.de || top.de))}</s><strong>${brl(centavos(o.preco))}</strong><small>/mês</small></div><span class="fb-pilha__cb">💸 <b>${cb(o.preco)}</b> de volta no PIX</span></div>
        <span class="fb-pilha__btn">Ver o plano de ${nomePlano(top)} <span aria-hidden="true">→</span></span>
      </a>
      ${resto.map((p) => `<a class="fb-pilha__linha" href="${linkPlano(p, tipo)}"><span class="n"><b>${num(p)}</b>Mega</span><span>${extra(p)}</span><span class="p">${brl(centavos(p.opcoes[0].preco))}</span><span class="s" aria-hidden="true">→</span></a>`).join('')}
      <p class="fb-pilha__pe"><span>Valores no débito automático, para ${DY.textoLocal()}.</span>${el.dataset.pilhaMais ? `<a href="${el.dataset.pilhaMais}">Comparar todos →</a>` : ''}</p>`;
  }

  /* ---------- Calculadora de cashback ---------- */
  function calc(el) {
    const ops = []; lista('casa').forEach((p) => p.opcoes.forEach((o) => ops.push({ p, o })));
    ops.sort((a, b) => a.o.preco - b.o.preco);
    let i = Math.max(0, ops.findIndex((x) => num(x.p) === '1000' && !x.o.logo));
    const caixa = el.querySelector('[data-calc-ops]'); const res = el.querySelector('[data-calc-res]');
    const desenhar = () => {
      caixa.innerHTML = '<p>Escolha um plano</p>' + ops.map((x, k) => `<button type="button" class="fb-calc__op" role="radio" aria-checked="${k === i}" data-k="${k}"><b>${nomePlano(x.p)}${x.o.logo ? ' + ' + x.o.nome : ''}</b><span>${brl(centavos(x.o.preco))}/mês</span></button>`).join('');
      const x = ops[i];
      res.innerHTML = `<small>Você recebe no PIX</small><strong>${cb(x.o.preco)}</strong><p>50% de uma mensalidade de ${brl(centavos(x.o.preco))}, uma única vez, em até 7 dias depois da instalação.</p>`;
    };
    caixa.onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) { i = +b.dataset.k; desenhar(); } };
    desenhar();
  }

  /* ---------- Preço nas personas e nos cards de upsell ---------- */
  function precoPersona(el) {
    const tipo = el.dataset.tipo || 'casa';
    const p = achar(tipo, el.dataset.precoPlano);
    if (!p) { el.innerHTML = `Este plano não está disponível em ${esc(DY.textoLocal())}. <a class="dy-link" href="#comparar">Ver os planos da sua região</a>`; return; }
    const o = el.dataset.opcao ? p.opcoes.find((x) => x.nome === el.dataset.opcao) || p.opcoes[0] : p.opcoes[0];
    el.innerHTML = el.dataset.formato === 'curto'
      ? `<b>${brl(centavos(o.preco))}</b>/mês`
      : `<b>${brl(centavos(o.preco))}</b>/mês · <span class="cb">${cb(o.preco)} de volta no PIX</span>`;
  }

  /* ---------- Comparar planos ---------- */
  function comparar(el) {
    const tipo = el.dataset.comparar;
    const linhas = lista(tipo).map((p) => {
      const st = streaming(p);
      const o = p.opcoes[0];
      return `<tr><th scope="row">${nomePlano(p)}</th><td>${upload(p)}</td><td>${wifi(p)}</td>${tipo === 'casa' ? `<td>${st.length ? (p.opcoes.length === 1 ? st[0] + ' incluso' : st.join(' ou ') + ' (opcional)') : '—'}</td>` : ''}<td class="p">${p.opcoes.length > 1 && tipo === 'casa' && !o.logo ? 'a partir de ' : ''}${brl(centavos(o.preco))}</td><td class="cb">${cb(o.preco)}</td><td><a href="${linkPlano(p, tipo)}">${tipo === 'casa' && DY.paginaPlano[num(p)] ? 'Ver plano' : 'Escolher'} →</a></td></tr>`;
    }).join('');
    el.innerHTML = `<table><thead><tr><th>Plano</th><th>Upload</th><th>Wi-Fi</th>${tipo === 'casa' ? '<th>Streaming</th>' : ''}<th>Mensal</th><th>Cashback</th><th></th></tr></thead><tbody>${linhas}</tbody></table>`;
  }

  /* ---------- Página do plano ---------- */
  const pg = document.querySelector('[data-plano-pg]');
  let opAtual = null;
  function cartaoPlano() {
    const box = document.querySelector('[data-preco-card]'); if (!box) return;
    const id = pg.dataset.planoPg; const p = achar('casa', id);
    const nome = pg.dataset.nome;
    if (!p) {
      box.className = 'fb-preco';
      box.innerHTML = `<p class="fb-preco__vel"><b>${id}</b><span>Mega</span></p><p class="fb-preco__fora">O plano de ${nome} não está disponível em <b>${esc(DY.textoLocal())}</b>. <a href="/internet-fibra/casa#comparar">Ver os planos da sua região</a> ou <button type="button" class="dy-link" data-local-alterar>trocar a cidade</button>.</p>`;
      atualizarBarra(null); return;
    }
    const q = new URLSearchParams(location.search).get('opcao');
    if (opAtual === null) opAtual = Math.max(0, p.opcoes.findIndex((o) => o.nome === q));
    if (opAtual >= p.opcoes.length) opAtual = 0;
    const o = p.opcoes[opAtual];
    const prem = p.variante === 'premium';
    box.className = 'fb-preco' + (prem ? ' fb-preco--premium' : '');
    const ops = p.opcoes.length > 1 ? `<div class="fb-preco__ops" role="radiogroup" aria-label="Streaming do plano"><p>Quer streaming no mesmo plano?</p>${p.opcoes.map((x, k) => `<button type="button" class="fb-op" role="radio" aria-checked="${k === opAtual}" data-op="${k}">${x.logo ? `<img src="${img(logos[x.logo].src)}" alt="">` : `<span class="sem"><img src="${img('icones/hero-wifi.svg')}" alt=""></span>`}<b>${x.logo ? '+ ' + x.nome : 'Só internet'}</b><span>${brl(centavos(x.preco))}</span></button>`).join('')}</div>` : '';
    box.innerHTML = `<div class="fb-preco__topo"><span class="fb-preco__selo">${pg.dataset.selo}</span><span class="fb-preco__wifi">${wifi(p)}</span></div>
      <p class="fb-preco__vel"><b>${num(p)}</b><span>Mega</span></p>
      ${ops}
      <div class="fb-preco__valor"><s>De ${brl(centavos(o.de || p.de))}</s><strong>${brl(centavos(o.preco))}</strong><small>/mês</small><p class="fb-preco__obs">no débito automático${o.logo ? ', com ' + o.nome + ' incluso' : ''}</p></div>
      <div class="fb-preco__cb"><span>Volta para você no PIX</span><b>${cb(o.preco)}</b></div>
      <a class="dy-btn dy-btn--primario dy-btn--g" href="${conversao(p, 'casa', o.nome)}">Quero o ${nome} <span class="seta-dir" aria-hidden="true">→</span></a>
      <a class="dy-btn dy-btn--contorno" href="${zap(`Oi! Vim pela página do ${nome}${o.logo ? ' + ' + o.nome : ''} e quero saber se tem no meu endereço.`)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
      <p class="fb-preco__rodape">Instalação grátis · Fidelidade de 12 meses · Valores para ${esc(DY.textoLocal())}</p>`;
    box.onclick = (e) => { const b = e.target.closest('[data-op]'); if (b) { opAtual = +b.dataset.op; cartaoPlano(); } };
    // os outros pontos da página que mostram o preço e o cashback
    document.querySelectorAll('[data-plano-preco]').forEach((el) => (el.textContent = brl(centavos(o.preco))));
    document.querySelectorAll('[data-plano-cb]').forEach((el) => (el.textContent = cb(o.preco)));
    document.querySelectorAll('[data-plano-cta]').forEach((el) => (el.href = conversao(p, 'casa', o.nome)));
    document.querySelectorAll('[data-plano-zap]').forEach((el) => (el.href = zap(`Oi! Vim pela página do ${nome}${o.logo ? ' + ' + o.nome : ''} e quero saber se tem no meu endereço.`)));
    atualizarBarra(p, o, nome);
  }
  function atualizarBarra(p, o, nome) {
    const barra = document.querySelector('[data-fb-barra]'); if (!barra) return;
    if (!p) { barra.hidden = true; return; }
    barra.hidden = false;
    barra.querySelector('[data-barra-txt]').innerHTML = `<b>${brl(centavos(o.preco))}/mês</b>${cb(o.preco)} de volta no PIX`;
    const a = barra.querySelector('a'); a.href = conversao(p, 'casa', o.nome); a.textContent = 'Quero o ' + nome;
  }
  function ligarBarra() {
    const barra = document.querySelector('[data-fb-barra]'); const card = document.querySelector('[data-preco-card]'); const fim = document.querySelector('[data-cta-final]');
    if (!barra || !card || !('IntersectionObserver' in window)) return;
    const vis = { card: true, fim: false };
    const mostrar = () => barra.classList.toggle('on', !vis.card && !vis.fim);
    new IntersectionObserver(([e]) => { vis.card = e.isIntersecting; mostrar(); }).observe(card);
    if (fim) new IntersectionObserver(([e]) => { vis.fim = e.isIntersecting; mostrar(); }).observe(fim);
  }

  /* ---------- Desenha tudo (de novo, quando a região muda) ---------- */
  function render() {
    document.querySelectorAll('[data-pilha-planos]').forEach(pilha);
    document.querySelectorAll('[data-calc]').forEach(calc);
    document.querySelectorAll('[data-preco-plano]').forEach(precoPersona);
    document.querySelectorAll('[data-comparar]').forEach(comparar);
    document.querySelectorAll('[data-local]').forEach((el) => (el.textContent = DY.textoLocal()));
    if (pg) cartaoPlano();
  }
  document.addEventListener('DOMContentLoaded', () => { render(); ligarBarra(); });
  document.addEventListener('dy:planos', render);
})();
