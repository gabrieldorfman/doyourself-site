/* ============================================================
   Do Yourself — fluxo de contratação
   Endereço → Consulta → Seu combo (produto a produto) → Resumo →
   Contato → Cadastro → Pagamento → Pedido criado (WhatsApp)
   Regras do Gabriel (out/2026):
   · origem=internet → Internet primeiro · origem=celular → Celular primeiro
   · origem=energia → Energia primeiro · home/combo → Internet → Celular → Energia
   · pelo menos 1 produto para seguir · dados vão para o banco; no WhatsApp só os produtos + nº do pedido
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos, img, logos, mascara, validar, so } = DY;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CHECK = '<svg viewBox="0 0 14 14"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const XIS = '<svg viewBox="0 0 14 14"><path d="M3.5 3.5l7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const espera = (ms) => new Promise((r) => setTimeout(r, reduzir ? Math.min(ms, 150) : ms));

  /* ---------- Estado ---------- */
  const q = new URLSearchParams(location.search);
  const origem = ['internet', 'celular', 'energia', 'combo', 'home'].includes(q.get('origem')) ? q.get('origem') : 'home';
  const ORDENS = { internet: ['internet', 'celular', 'energia'], celular: ['celular', 'internet', 'energia'], energia: ['energia', 'internet', 'celular'], home: ['internet', 'celular', 'energia'], combo: ['internet', 'celular', 'energia'] };
  const st = {
    id: DY.novoIdPedido(), origem,
    end: { cep: '', logradouro: '', bairro: '', cidade: '', uf: '', numero: '', comp: '' },
    fibra: 'talvez', ordem: ORDENS[origem].slice(), idx: 0,
    // undefined = ainda não decidiu · null = pulou · objeto = adicionou
    esc: { internet: undefined, celular: undefined, energia: undefined },
    rasc: { internet: null, celular: null, energia: null },   // seleção em andamento na tela do produto
    para: { internet: q.get('para') === 'empresa' ? 'empresa' : 'casa', celular: q.get('para') === 'cpf' ? 'cpf' : 'cnpj' },
    contato: { nome: '', telefone: '' }, cad: { email: '', cpf: '', cnpj: '', consent: false },
    pag: { tipo: '', banco: '' },
  };
  // Plano vindo do card da Home já chega pré-selecionado
  if (origem === 'internet' && q.get('plano')) {
    const p = DY.planosInternet.find((x) => x.id === q.get('plano'));
    if (p) { const oi = Math.max(0, p.opcoes.findIndex((o) => o.nome === q.get('opcao'))); st.rasc.internet = { id: p.id, op: oi }; }
  }
  if (origem === 'celular' && q.get('plano')) {
    const p = DY.planosCelular.find((x) => x.id === q.get('plano'));
    if (p) st.rasc.celular = { id: p.id, linhas: Math.max(1, Math.min(99, +q.get('linhas') || 1)) };
  }

  /* ---------- Navegação entre telas (com o botão Voltar do celular funcionando) ---------- */
  const NOMES = { 1: 'Endereço', 2: 'Seu combo', 3: 'Seus dados', 4: 'Pagamento' };
  let telaAtual = 'endereco';
  function mostrar(nome, { voltando = false, empurrar = true } = {}) {
    $$('.tela').forEach((t) => { t.hidden = t.dataset.tela !== nome; t.classList.toggle('voltando', voltando); });
    const tela = $(`.tela[data-tela="${nome}"]`);
    telaAtual = nome;
    $('#fluxo').classList.toggle('largo', nome === 'combo');
    document.body.classList.toggle('pg-fim', nome === 'fim');
    $('[data-progresso]').hidden = nome === 'fim';
    atualizarProgresso();
    dock.hidden = ['consulta', 'fim'].includes(nome);
    document.body.classList.toggle('com-dock', !dock.hidden);
    atualizarCarrinho();
    if (nome === 'pagamento') atualizarPagamento();
    syncDock();
    if (empurrar) history.pushState({ tela: nome, idx: st.idx }, '', '#' + nome);
    window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' });
    const foco = tela.querySelector('[tabindex="-1"]');
    if (foco) setTimeout(() => foco.focus({ preventScroll: true }), 60);
  }
  function atualizarProgresso() {
    const tela = $(`.tela[data-tela="${telaAtual}"]`);
    const etapa = +tela.dataset.etapa || 4;
    let parcial = 50;
    if (telaAtual === 'endereco') parcial = 40; if (telaAtual === 'consulta') parcial = 85;
    if (telaAtual === 'disponivel') parcial = 10;
    if (telaAtual === 'combo') parcial = 20 + (st.idx / st.ordem.length) * 60; if (telaAtual === 'resumo') parcial = 90;
    if (telaAtual === 'contato') parcial = 45; if (telaAtual === 'cadastro') parcial = 85;
    if (telaAtual === 'pagamento') parcial = st.pag.tipo ? 85 : 45;
    $$('.progresso__barras li').forEach((li) => {
      const n = +li.dataset.etapa;
      li.classList.toggle('feita', n < etapa); li.classList.toggle('atual', n === etapa);
      li.style.setProperty('--parcial', parcial + '%');
    });
    $('[data-progresso-nome]').textContent = NOMES[etapa];
    $('[data-progresso-num]').textContent = etapa + ' de 4';
  }
  window.addEventListener('popstate', (e) => {
    const s = e.state;
    if (!s) return mostrar('endereco', { voltando: true, empurrar: false });
    if (s.tela === 'consulta') { history.back(); return; } // não repete a animação de consulta
    if (s.tela === 'fim' || telaAtual === 'fim') { history.forward(); return; }
    if (s.tela === 'combo') { st.idx = s.idx || 0; renderProduto(true); }
    mostrar(s.tela, { voltando: true, empurrar: false });
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-voltar]')) history.back(); });
  const abrirBusca = location.hash === '#buscar-cep';
  history.replaceState({ tela: 'endereco' }, '', location.pathname + location.search);

  /* ---------- Helpers de campo ---------- */
  function marcar(grupo, erro, mostrarErro = true) {
    const g = typeof grupo === 'string' ? $(`[data-grupo="${grupo}"]`) : grupo;
    const c = g.querySelector('.campo'); const ico = c.querySelector('.campo__ico'); const msg = g.querySelector('.campo__msg:not(.dica)');
    c.classList.toggle('valido', !erro);
    c.classList.toggle('invalido', !!erro && mostrarErro);
    ico.innerHTML = erro ? XIS : CHECK;
    if (msg) msg.textContent = erro && mostrarErro ? erro : '';
    const input = c.querySelector('input,select'); if (input) input.setAttribute('aria-invalid', !!erro && mostrarErro);
    return !erro;
  }
  function limpar(grupo) {
    const g = typeof grupo === 'string' ? $(`[data-grupo="${grupo}"]`) : grupo;
    const c = g.querySelector('.campo'); c.classList.remove('valido', 'invalido');
    const msg = g.querySelector('.campo__msg:not(.dica)'); if (msg) msg.textContent = '';
  }
  // Campo com máscara + validação: mostra erro ao sair do campo; mostra ✓ assim que fica certo
  function ligarCampo(nome, { masc, val, depois }) {
    const g = $(`[data-grupo="${nome}"]`); const input = g.querySelector('input');
    let tocado = false;
    const rodar = (forcar) => {
      const erro = val(input.value);
      if (!erro) marcar(g, '');
      else if (tocado || forcar) marcar(g, erro);
      else limpar(g);
      depois && depois(!erro);
      return !erro;
    };
    input.addEventListener('input', () => { if (masc) input.value = masc(input.value); rodar(false); });
    input.addEventListener('blur', () => { if (input.value) tocado = true; rodar(false); });
    g.validarAgora = () => { tocado = true; return rodar(true); };
    return g;
  }
  function revelar(el, abrir) {
    if (!el.querySelector(':scope > .revela__in')) {
      const w = document.createElement('div'); w.className = 'revela__in';
      if (el.classList.contains('form__linha')) { w.classList.add('form__linha'); el.classList.remove('form__linha'); }
      while (el.firstChild) w.appendChild(el.firstChild);
      el.appendChild(w);
    }
    el.classList.toggle('aberto', abrir);
    $$('input:not([readonly]),select,button', el).forEach((i) => (abrir ? i.removeAttribute('tabindex') : i.setAttribute('tabindex', '-1')));
    el.setAttribute('aria-hidden', !abrir);
  }
  const toast = (() => { const t = $('[data-toast]'); let h; return (msg) => { t.textContent = msg; t.classList.add('on'); clearTimeout(h); h = setTimeout(() => t.classList.remove('on'), 3200); }; })();

  /* =========================================================
     1 · ENDEREÇO
     ========================================================= */
  const fEnd = $('[data-form="endereco"]');
  const inCep = $('#f-cep'), inLog = $('#f-logradouro'), inNum = $('#f-numero');
  const blocoEnd = $('[data-revela-endereco]');
  const gCep = $('[data-grupo="cep"]');
  revelar(blocoEnd, false);
  let cepBuscado = '';

  async function consultarCep() {
    const cep = so(inCep.value);
    if (cep.length !== 8) { cepBuscado = ''; revelar(blocoEnd, false); limpar(gCep); checarEnd(); return; }
    if (cep === cepBuscado) return;
    cepBuscado = cep;
    gCep.querySelector('.campo').classList.add('carregando');
    const r = await DY.buscarCep(cep);
    gCep.querySelector('.campo').classList.remove('carregando');
    if (so(inCep.value) !== cep) return;
    if (!r) { cepBuscado = ''; marcar(gCep, 'Não encontramos esse CEP. Confira os números ou toque em “Não sei o meu CEP”.'); revelar(blocoEnd, false); checarEnd(); return; }
    marcar(gCep, '');
    Object.assign(st.end, { cep, ...r });
    const campoLog = inLog.closest('.campo');
    if (r.logradouro) {
      inLog.value = r.logradouro; inLog.readOnly = true; inLog.tabIndex = -1; campoLog.classList.add('travado', 'valido'); campoLog.querySelector('.campo__ico').innerHTML = CHECK;
      campoLog.querySelector('label').textContent = 'Endereço';
    } else { // CEP geral da cidade: a pessoa digita a rua
      inLog.value = ''; inLog.readOnly = false; inLog.removeAttribute('tabindex'); campoLog.classList.remove('travado', 'valido');
      campoLog.querySelector('label').textContent = 'Rua ou avenida';
    }
    $('[data-bairro]').textContent = [r.bairro, r.cidade && `${r.cidade}/${r.uf}`].filter(Boolean).join(' · ');
    revelar(blocoEnd, true);
    setTimeout(() => (r.logradouro ? inNum : inLog).focus(), 260);
    checarEnd();
  }
  inCep.addEventListener('input', () => { inCep.value = mascara.cep(inCep.value); gCep.querySelector('.campo').classList.remove('invalido'); gCep.querySelector('.campo__msg').textContent = ''; consultarCep(); });
  inCep.addEventListener('blur', () => { if (inCep.value && so(inCep.value).length < 8) marcar(gCep, validar.cep(inCep.value)); });
  inLog.addEventListener('input', () => { const c = inLog.closest('.campo'); const ok = inLog.value.trim().length >= 3; c.classList.toggle('valido', ok); c.querySelector('.campo__ico').innerHTML = CHECK; checarEnd(); });

  ligarCampo('numero', { masc: (v) => v.replace(/[^\dsSnN/]/g, '').toUpperCase().slice(0, 6), val: validar.numero, depois: checarEnd });
  $('#f-comp').addEventListener('input', () => { const c = $('#f-comp').closest('.campo'); const ok = !!$('#f-comp').value.trim(); c.classList.toggle('valido', ok); c.querySelector('.campo__ico').innerHTML = CHECK; });
  function endOk() {
    return so(inCep.value).length === 8 && cepBuscado && inLog.value.trim().length >= 3 && !validar.numero(inNum.value);
  }
  function checarEnd() { fEnd.querySelector('[data-continuar]').disabled = !endOk(); }
  fEnd.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!endOk()) return;
    Object.assign(st.end, { logradouro: inLog.value.trim(), numero: inNum.value.trim(), comp: $('#f-comp').value.trim() });
    try { sessionStorage.setItem('dy_endereco', JSON.stringify({ cep: st.end.cep, numero: st.end.numero, logradouro: st.end.logradouro, bairro: st.end.bairro, cidade: st.end.cidade, uf: st.end.uf })); } catch (er) { /* modo privado */ }
    rodarConsulta();
  });
  // Ativa o botão mesmo sem precisar sair do campo
  fEnd.addEventListener('input', checarEnd);

  /* Não sei o meu CEP */
  const UFS = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']];
  const busca = $('[data-busca-cep]'), selUf = $('#f-uf'), inCid = $('#f-cidade'), inRua = $('#f-rua'), sug = $('[data-sugestoes]');
  selUf.innerHTML = '<option value="" disabled selected hidden></option>' + UFS.map(([s, n]) => `<option value="${s}">${n}</option>`).join('');
  $('[data-nao-sei-cep]').addEventListener('click', (e) => {
    busca.hidden = !busca.hidden;
    e.currentTarget.textContent = busca.hidden ? 'Não sei o meu CEP' : 'Fechar a busca e digitar o CEP';
    if (!busca.hidden) selUf.focus();
  });
  selUf.addEventListener('change', async () => {
    selUf.closest('.campo').classList.add('valido'); selUf.closest('.campo').querySelector('.campo__ico').innerHTML = CHECK;
    inCid.disabled = false; inCid.value = ''; inRua.disabled = true; inRua.value = ''; sug.innerHTML = '';
    inCid.focus();
    try {
      const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selUf.value}/municipios?orderBy=nome`);
      $('#l-cidades').innerHTML = (await r.json()).map((c) => `<option value="${c.nome}">`).join('');
    } catch (er) { /* sem lista, o campo continua livre */ }
  });
  inCid.addEventListener('input', () => { const ok = inCid.value.trim().length >= 3; inRua.disabled = !ok; inCid.closest('.campo').classList.toggle('valido', ok); inCid.closest('.campo').querySelector('.campo__ico').innerHTML = CHECK; });
  let tRua;
  inRua.addEventListener('input', () => {
    clearTimeout(tRua);
    const rua = inRua.value.trim();
    if (rua.length < 3) { sug.innerHTML = ''; return; }
    tRua = setTimeout(async () => {
      try {
        const lista = await (await fetch(`https://viacep.com.br/ws/${selUf.value}/${encodeURIComponent(inCid.value.trim())}/${encodeURIComponent(rua)}/json/`)).json();
        if (!Array.isArray(lista) || !lista.length) { sug.innerHTML = '<p class="dy-apoio" style="padding:4px 6px">Não achamos uma rua com esse nome nessa cidade. Confira a grafia — sem “Rua” ou “Av.” no começo costuma funcionar melhor.</p>'; return; }
        sug.innerHTML = lista.slice(0, 25).map((d) => `<button type="button" class="sugestao" role="option" data-cep="${so(d.cep)}"><b>${d.logradouro}</b>${/^(até|de|lado)\b/i.test(d.complemento || '') ? `<span class="faixa">${d.complemento}</span>` : ''}<span>${d.bairro} · ${d.localidade}/${d.uf} · CEP ${d.cep}</span></button>`).join('');
      } catch (er) { sug.innerHTML = '<p class="dy-apoio">Não conseguimos buscar agora. Tente de novo em instantes.</p>'; }
    }, 380);
  });
  sug.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cep]'); if (!b) return;
    inCep.value = mascara.cep(b.dataset.cep); busca.hidden = true; $('[data-nao-sei-cep]').textContent = 'Não sei o meu CEP';
    consultarCep();
  });

  // Pré-preenchimento: vindo da Home (sessionStorage) ou pela URL
  (function preencher() {
    let salvo = null; try { salvo = JSON.parse(sessionStorage.getItem('dy_endereco') || 'null'); } catch (er) { /* */ }
    const cep = so(q.get('cep') || (salvo && salvo.cep) || ''); const num = q.get('numero') || (salvo && salvo.numero) || '';
    if (cep.length === 8) { inCep.value = mascara.cep(cep); if (num) { inNum.value = num; } consultarCep().then(() => { if (num) $('[data-grupo="numero"]').validarAgora(); }); }
    else if (abrirBusca) $('[data-nao-sei-cep]').click();
    else setTimeout(() => inCep.focus(), 300);
  })();

  /* =========================================================
     2 · CONSULTANDO
     ========================================================= */
  async function rodarConsulta() {
    mostrar('consulta');
    const box = $('.consulta'); box.classList.remove('ok', 'alerta');
    const titulo = $('[data-consulta-titulo]'); const res = $('[data-consulta-resultado]');
    titulo.textContent = 'Consultando o seu endereço…'; res.hidden = true; res.innerHTML = '';
    $('[data-consulta-end]').textContent = `${st.end.logradouro}, ${st.end.numero}${st.end.comp ? ' · ' + st.end.comp : ''} — ${st.end.cidade}/${st.end.uf}`;
    const passos = $$('[data-consulta-passos] li'); passos.forEach((p) => p.className = '');
    passos[0].classList.add('rodando'); await espera(500); passos[0].className = 'feito';
    passos[1].classList.add('rodando');
    const [fibra] = await Promise.all([DY.consultarViabilidade(st.end.cep, st.end.numero), espera(1500)]);
    st.fibra = fibra; passos[1].className = 'feito';
    passos[2].classList.add('rodando'); await espera(700); passos[2].className = 'feito';

    // O que existe no endereço: fibra (Supabase), celular (TIM, todo o Brasil), energia (regiões atendidas)
    st.disp = { internet: fibra, celular: 'sim', energia: DY.energia.atende(st.end.uf) ? 'sim' : 'nao' };
    st.ordem = ORDENS[origem].filter((p) => st.disp[p] !== 'nao');
    st.idx = 0;
    box.classList.add('ok');
    titulo.textContent = 'Endereço verificado!';
    res.innerHTML = '<p class="consulta__indo"><span class="pt-indo" aria-hidden="true"></span>Vendo o que chega aí…</p>';
    res.hidden = false;
    titulo.focus({ preventScroll: true });
    await espera(1100);
    if (telaAtual !== 'consulta') return;
    renderDisponivel();
    history.replaceState({ tela: 'endereco' }, '');
    mostrar('disponivel');
  }

  /* =========================================================
     2b · DISPONÍVEL NO ENDEREÇO
     ========================================================= */
  function renderDisponivel() {
    $('[data-disp-end]').textContent = `${st.end.logradouro}, ${st.end.numero} — ${st.end.cidade}/${st.end.uf}`;
    const info = {
      internet: ['Internet Fibra', 'hero-wifi.svg', 'Cashback de 50% do plano'],
      celular: ['Celular', 'hero-celular-5g.svg', 'Cashback de 100% das linhas'],
      energia: ['Energia Solar', 'hero-lampada.svg', 'Cashback de 10% da nova conta'],
    };
    const ordem = ORDENS[origem];
    $('[data-disp]').innerHTML = ordem.map((p, k) => {
      const [nome, ico, cb] = info[p]; const d = st.disp[p];
      const selo = d === 'nao' ? '<span class="disp-selo disp-selo--nao">Indisponível</span>' : d === 'talvez' ? '<span class="disp-selo disp-selo--talvez">Disponível*</span>' : '<span class="disp-selo">Disponível</span>';
      const txt = d === 'nao' ? (p === 'internet' ? 'Ainda não temos fibra no seu endereço.' : 'Ainda não atende a sua região.') : cb;
      const rotBtn = p === 'energia' ? 'Ver desconto' : 'Ver planos';
      const corpo = `<div class="disp-linha"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + ico)}" alt=""></span>
        <span class="item-combo__txt"><span class="disp-topo"><b>${nome}</b>${selo}</span><span>${txt}</span></span></div>`;
      if (d === 'nao') return `<div class="item-combo disp-item i-${p} disp-item--nao" style="animation-delay:${k * 0.12}s">${corpo}</div>`;
      return `<button class="item-combo disp-item i-${p}" type="button" data-ver="${p}" style="animation-delay:${k * 0.12}s">${corpo}<span class="disp-ver">${rotBtn} <span class="seta-dir" aria-hidden="true">→</span></span></button>`;
    }).join('');
    if (st.disp.internet === 'talvez') $('[data-disp]').insertAdjacentHTML('beforeend', '<p class="dy-apoio" style="text-align:center">* A fibra no seu endereço é confirmada no WhatsApp.</p>');
    const algum = st.ordem.length > 0;
    const b = $('[data-montar]');
    b.innerHTML = algum ? (st.ordem.length === 1 ? 'Escolher meu plano' : 'Montar meu combo') + ' <span class="seta-dir" aria-hidden="true">→</span>' : 'Falar no WhatsApp';
  }
  $('[data-montar]').addEventListener('click', () => {
    if (!st.ordem.length) { location.href = DY.linkWhatsApp('Olá! Consultei meu endereço no site da Do Yourself e quero falar sobre as opções.'); return; }
    st.idx = 0; renderProduto(); mostrar('combo');
  });
  /* "Ver planos" / "Ver desconto": começa o combo por esse produto, os outros vêm depois */
  $('[data-disp]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver]'); if (!b) return;
    const p = b.dataset.ver;
    st.ordem = ORDENS[p].filter((x) => st.disp[x] !== 'nao');
    st.idx = 0; renderProduto(); mostrar('combo');
  });

  /* =========================================================
     3 · SEU COMBO — um produto por vez
     ========================================================= */
  const ROTULO = { internet: 'Internet Fibra', celular: 'Celular', energia: 'Energia Solar' };
  const ICONE = { internet: 'icones/lista-wifi.svg', celular: 'icones/lista-celular.svg', energia: 'icones/lista-lampada.svg' };
  const palco = $('[data-produto-palco]');
  const temItens = () => Object.values(st.esc).some((v) => v);
  const algumRascunho = () => Object.values(st.rasc).some((v) => v);

  function renderPassos() {
    $('[data-combo-passos]').innerHTML = st.ordem.map((p, i) => {
      const cls = st.esc[p] ? 'adicionado' : st.esc[p] === null ? 'pulado' : i === st.idx ? 'atual' : '';
      return `<span class="cp-pilula ${i === st.idx ? 'atual ' : ''}${cls}"><span class="n">${i + 1}</span>${ROTULO[p]}</span>`;
    }).join('');
  }

  function cabecalho(prod) {
    const primeiro = st.idx === 0;
    const qtd = st.ordem.length;
    const textos = {
      internet: primeiro
        ? ['Escolha sua internet', 'Fibra TIM com Wi-Fi e instalação grátis. <b>50% da mensalidade volta para você.</b>']
        : ['Quer internet fibra também?', 'Na mesma conversa. <b>50% da mensalidade volta para você.</b>'],
      celular: primeiro
        ? ['Escolha seu plano de celular', 'Ligações ilimitadas, 5G e o seu número. <b>100% das linhas volta para você.</b>']
        : ['Quer incluir celular?', 'Ligações ilimitadas e 5G. <b>100% das linhas volta para você.</b>'],
      energia: primeiro
        ? ['Quanto vem sua conta de luz?', 'Sem obra e sem placas. <b>10% da nova conta volta para você.</b>']
        : ['E a conta de luz?', 'Pague menos, sem obra. <b>10% da nova conta volta para você.</b>'],
    };
    const [t, s] = textos[prod];
    return `<header class="produto__cab">
      <h1 class="tela__titulo" id="h-combo" tabindex="-1">${t}</h1><p class="tela__sub">${s}</p></header>`;
  }

  function acoes(prod) {
    const ultimo = st.idx === st.ordem.length - 1;
    const rot = st.esc[prod] ? (ultimo ? 'Manter e ver o meu combo' : 'Manter e continuar') : (ultimo ? 'Adicionar e ver meu combo' : 'Adicionar e continuar');
    return `<div class="produto__acoes">
      <button class="dy-btn dy-btn--primario dy-btn--g dy-btn--bloco" type="button" data-add disabled>${rot} <span class="seta-dir" aria-hidden="true">→</span></button>
      <button class="dy-btn dy-btn--fantasma" type="button" data-pular>${st.esc[prod] ? 'Tirar do combo' : 'Agora não, pular ' + (prod === 'energia' ? 'a energia' : prod === 'celular' ? 'o celular' : 'a internet')}</button>
    </div>`;
  }

  function renderProduto(voltando) {
    const prod = st.ordem[st.idx];
    renderPassos();
    const fn = { internet: htmlInternet, celular: htmlCelular, energia: htmlEnergia }[prod];
    palco.innerHTML = `<div class="produto${voltando ? ' voltando' : ''}" data-prod="${prod}">${cabecalho(prod)}${fn()}${acoes(prod)}</div>`;
    ({ internet: ligarInternet, celular: ligarCelular, energia: ligarEnergia }[prod])();
    atualizarBotaoAdd();
    atualizarCarrinho();
  }

  const { dots, ligarDots } = DY.ofertas;
  // No celular, o card escolhido desliza para o centro da tela
  function centralizar(card) {
    const trilho = card.parentElement;
    if (trilho.scrollWidth > trilho.clientWidth + 4) trilho.scrollTo({ left: card.offsetLeft - (trilho.clientWidth - card.offsetWidth) / 2, behavior: reduzir ? 'auto' : 'smooth' });
    const r = card.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 90) card.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
  }

  /* ----- Internet ----- */
  function htmlInternet() {
    const sel = st.rasc.internet || (st.esc.internet && { ...st.esc.internet });
    const cards = DY.planosInternet.map((p) => { const on = !!(sel && sel.id === p.id); return DY.ofertas.internet(p, { on, op: on ? sel.op : 0 }); }).join('');
    const pSel = sel && DY.planosInternet.find((x) => x.id === sel.id);
    return `<div class="ct-abas"><div class="segmento" role="radiogroup" aria-label="Para onde é a internet" data-para="internet">
        <button type="button" role="radio" aria-checked="${st.para.internet === 'casa'}" data-v="casa">Casa</button>
        <button type="button" role="radio" aria-checked="${st.para.internet === 'empresa'}" data-v="empresa">Empresa</button></div></div>
      <div><div class="ofertas" data-trilho>${cards}</div>${dots(DY.planosInternet.length)}</div>
      <div data-pers-box>${pSel ? DY.ofertas.personaliza(pSel, sel.op) : ''}</div>
      <p class="dy-apoio" style="text-align:center;margin-top:14px">Preços no débito automático. No boleto, + R$ 10.</p>`;
  }
  function ligarInternet() {
    const trilho = $('[data-trilho]', palco); ligarDots(trilho);
    ligarPara('internet');
    const box = $('[data-pers-box]', palco);
    const pintarCard = (card, p, op) => {
      const o = p.opcoes[op]; const preco = centavos(o.preco);
      card.querySelector('[data-preco]').textContent = brl(preco);
      card.querySelector('[data-cb]').textContent = brl(cashbackCentavos(preco, 50));
      card.querySelector('[data-preco-obs]').innerHTML = op > 0 && o.logo ? `<span class="oferta__extra">+ ${o.nome}</span>` : 'no débito automático';
    };
    const escolher = (card) => {
      const p = DY.planosInternet.find((x) => x.id === card.dataset.id);
      const mesmo = st.rasc.internet && st.rasc.internet.id === p.id;
      const op = mesmo ? st.rasc.internet.op : 0;
      st.rasc.internet = { id: p.id, op };
      $$('.oferta', trilho).forEach((c) => {
        const on = c === card; c.setAttribute('aria-checked', on); c.querySelector('.oferta__escolher').textContent = on ? 'Plano escolhido' : 'Escolher este plano';
        if (!on) pintarCard(c, DY.planosInternet.find((x) => x.id === c.dataset.id), 0);
      });
      pintarCard(card, p, op);
      if (!mesmo) {
        box.innerHTML = DY.ofertas.personaliza(p, op);
        const pers = $('[data-personaliza]', box);
        if (pers) setTimeout(() => { const r = pers.getBoundingClientRect(); if (r.bottom > innerHeight - 100) window.scrollBy({ top: r.bottom - innerHeight + 110, behavior: reduzir ? 'auto' : 'smooth' }); }, 350);
      }
      centralizar(card); atualizarBotaoAdd(); atualizarCarrinho();
    };
    trilho.addEventListener('click', (e) => { const card = e.target.closest('.oferta'); if (card) escolher(card); });
    trilho.addEventListener('keydown', (e) => { const card = e.target.closest('.oferta'); if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); escolher(card); } });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.p-op'); if (!b || !st.rasc.internet) return;
      const op = +b.dataset.op; st.rasc.internet.op = op;
      $$('.p-op', box).forEach((x) => x.setAttribute('aria-checked', x === b));
      const p = DY.planosInternet.find((x) => x.id === st.rasc.internet.id);
      pintarCard($(`.oferta[data-id="${p.id}"]`, trilho), p, op);
      atualizarBotaoAdd(); atualizarCarrinho();
    });
    const sel = trilho.querySelector('[aria-checked="true"].oferta') || trilho.querySelector('.destaque');
    if (sel) requestAnimationFrame(() => { if (trilho.scrollWidth > trilho.clientWidth + 4) trilho.scrollLeft = sel.offsetLeft - (trilho.clientWidth - sel.offsetWidth) / 2; });
  }
  function ligarPara(prod) {
    const seg = $(`[data-para="${prod}"]`, palco); if (!seg) return;
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('[role="radio"]'); if (!b) return;
      $$('[role="radio"]', seg).forEach((x) => x.setAttribute('aria-checked', x === b));
      st.para[prod] = b.dataset.v;
      if (prod === 'celular') atualizarLinhas();
    });
  }

  /* ----- Celular ----- */
  function htmlCelular() {
    const sel = st.rasc.celular || (st.esc.celular && { ...st.esc.celular });
    const cards = DY.planosCelular.map((p) => DY.ofertas.celular(p, { on: !!(sel && sel.id === p.id) })).join('');
    const n = sel ? sel.linhas : 1;
    return `<div class="ct-abas"><div class="segmento" role="radiogroup" aria-label="Para quem são as linhas" data-para="celular">
        <button type="button" role="radio" aria-checked="${st.para.celular === 'cpf'}" data-v="cpf">Para mim · CPF</button>
        <button type="button" role="radio" aria-checked="${st.para.celular === 'cnpj'}" data-v="cnpj">Empresa · CNPJ</button></div></div>
      <div><div class="ofertas ofertas--cel" data-trilho>${cards}</div>${dots(DY.planosCelular.length)}</div>
      <div class="linhas" data-linhas-box>
        <p class="linhas__titulo" id="lbl-linhas">Quantas linhas você quer?</p>
        <div class="linhas__ctrl"><button type="button" data-l="-1" aria-label="Tirar uma linha">−</button><output aria-live="polite" aria-labelledby="lbl-linhas" data-l-qtd>${n}</output><button type="button" data-l="1" aria-label="Adicionar uma linha">+</button></div>
        <p class="linhas__total" data-l-total>Escolha um plano acima para ver o total.</p>
        <small data-l-nota></small>
      </div>`;
  }
  function atualizarLinhas() {
    const box = $('[data-linhas-box]', palco); if (!box) return;
    const r = st.rasc.celular; const n = r ? r.linhas : +$('[data-l-qtd]', box).textContent;
    $('[data-l-qtd]', box).textContent = n;
    $('[data-l="-1"]', box).disabled = n <= 1;
    $('[data-l-nota]', box).textContent = st.para.celular === 'cnpj' ? 'MEI: até 3 linhas. A partir de 10 linhas existem condições especiais — a gente te explica no WhatsApp.' : 'Cada linha pode ter um número diferente — inclusive os que você já usa, pela portabilidade.';
    if (r) {
      const p = DY.planosCelular.find((x) => x.id === r.id); const total = centavos(p.preco) * n;
      $('[data-l-total]', box).innerHTML = `${n} ${n === 1 ? 'linha' : 'linhas'} de ${p.num} GB = <b>${brl(total)}/mês</b> · você recebe <b style="color:var(--marca-titulo)">${brl(cashbackCentavos(total, 100))}</b>`;
    }
  }
  function ligarCelular() {
    const trilho = $('[data-trilho]', palco); ligarDots(trilho); ligarPara('celular');
    const escolher = (card) => {
      const linhas = st.rasc.celular ? st.rasc.celular.linhas : +$('[data-l-qtd]', palco).textContent || 1;
      st.rasc.celular = { id: card.dataset.id, linhas };
      $$('.oferta', trilho).forEach((c) => { const on = c === card; c.setAttribute('aria-checked', on); c.querySelector('.oferta__escolher').textContent = on ? 'Plano escolhido' : 'Escolher este plano'; });
      centralizar(card); atualizarLinhas(); atualizarBotaoAdd(); atualizarCarrinho();
    };
    trilho.addEventListener('click', (e) => { const c = e.target.closest('.oferta'); if (c) escolher(c); });
    trilho.addEventListener('keydown', (e) => { const c = e.target.closest('.oferta'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); escolher(c); } });
    $('[data-linhas-box]', palco).addEventListener('click', (e) => {
      const b = e.target.closest('[data-l]'); if (!b) return;
      const atual = st.rasc.celular ? st.rasc.celular.linhas : +$('[data-l-qtd]', palco).textContent;
      const n = Math.max(1, Math.min(99, atual + +b.dataset.l));
      if (st.rasc.celular) st.rasc.celular.linhas = n; else $('[data-l-qtd]', palco).textContent = n;
      atualizarLinhas(); atualizarCarrinho();
    });
    atualizarLinhas();
    const sel = trilho.querySelector('[aria-checked="true"].oferta') || trilho.querySelector('.destaque');
    if (sel) requestAnimationFrame(() => { if (trilho.scrollWidth > trilho.clientWidth + 4) trilho.scrollLeft = sel.offsetLeft - (trilho.clientWidth - sel.offsetWidth) / 2; });
  }

  /* ----- Energia ----- */
  function htmlEnergia() {
    const v = (st.rasc.energia || st.esc.energia || {}).conta;
    return `<div class="energia-sim">
      <ul class="energia-beneficios"><li><img src="${img('icones/hero-lampada.svg')}" alt="">Sem placas e sem obra</li><li><img src="${img('icones/cofrinho.svg')}" alt="">Sem investimento</li><li><img src="${img('icones/verificado.svg')}" alt="">Mesma distribuidora</li></ul>
      <div class="campo-grupo" data-grupo="conta">
        <div class="campo campo--moeda${v ? ' preenchido' : ''}">
          <input id="f-conta" inputmode="numeric" placeholder="0,00" value="${v ? mascara.moeda(String(Math.round(v * 100))) : ''}" aria-describedby="m-conta">
          <label for="f-conta">Valor médio da sua conta de luz</label>
          <span class="campo__ico" aria-hidden="true"></span>
        </div>
        <p class="campo__msg dica" id="m-conta">Olhe uma conta recente. Se o valor muda muito, use a média dos últimos meses.</p>
      </div>
      <div class="chips" role="group" aria-label="Valores comuns">${[200, 350, 500, 800, 1500].map((x) => `<button type="button" class="chip-op" data-v="${x}" aria-pressed="false">R$ ${x.toLocaleString('pt-BR')}</button>`).join('')}</div>
      <div data-energia-res></div>
    </div>`;
  }
  function ligarEnergia() {
    const input = $('#f-conta', palco); const res = $('[data-energia-res]', palco); const g = $('[data-grupo="conta"]', palco);
    const calc = () => {
      const reais = Number(so(input.value)) / 100;
      input.closest('.campo').classList.toggle('preenchido', !!input.value);
      $$('.chip-op', palco).forEach((c) => c.setAttribute('aria-pressed', +c.dataset.v === reais));
      if (!reais) { st.rasc.energia = null; res.innerHTML = ''; limpar(g); atualizarBotaoAdd(); atualizarCarrinho(); return; }
      const s = DY.energia.simular(reais);
      if (!s.elegivel) {
        st.rasc.energia = null; marcar(g, 'Para contas abaixo de R$ 150 a energia por assinatura ainda não compensa.', true);
        res.innerHTML = `<div class="aviso aviso--neutro"><img src="${img('icones/aviso-info.svg')}" alt=""><span>Com uma conta abaixo de R$ 150 o desconto fica pequeno e a assinatura não vale a pena. Se você tiver outra unidade (comércio, casa de praia), conte para a gente no WhatsApp.</span></div>`;
      } else {
        marcar(g, '');
        st.rasc.energia = { conta: reais };
        res.innerHTML = `<div class="energia-res">
          <div class="energia-res__linha"><span>Hoje você paga</span><b><s>${brl(s.conta)}</s></b></div>
          <div class="energia-res__linha nova"><span>Com a energia solar, cerca de</span><b>${brl(s.comDesconto)}</b></div>
          <div class="energia-res__linha"><span>Economia estimada</span><b>${brl(s.economiaMes)} por mês<small>${brl(s.economiaMes * 12)} em um ano</small></b></div>
          <hr>
          <div class="oferta__cb"><span>Volta para você<br><small>cashback de 10%, uma vez</small></span><b>${brl(s.cashback)}</b></div>
          <p class="energia-res__nota">É uma estimativa de até ${s.pct}% de desconto. O valor exato depende da sua cidade, da distribuidora e da sua fatura — a gente confirma tudo no WhatsApp antes de você assinar.</p>
        </div>`;
      }
      atualizarBotaoAdd(); atualizarCarrinho();
    };
    input.addEventListener('input', () => { input.value = mascara.moeda(input.value); calc(); });
    $$('.chip-op', palco).forEach((c) => c.addEventListener('click', () => { input.value = mascara.moeda(String(c.dataset.v * 100)); calc(); }));
    if (input.value) calc();
  }

  function atualizarBotaoAdd() {
    const prod = st.ordem[st.idx]; const b = $('[data-add]', palco); if (!b) return;
    b.disabled = !st.rasc[prod];
  }

  palco.addEventListener('click', (e) => {
    const prod = st.ordem[st.idx];
    if (e.target.closest('[data-add]')) {
      if (!st.rasc[prod]) return;
      st.esc[prod] = { ...st.rasc[prod] };
      if (prod === 'celular') st.esc.celular.para = st.para.celular;
      if (prod === 'internet') st.esc.internet.para = st.para.internet;
      pulsar(); avancarProduto();
    } else if (e.target.closest('[data-pular]')) {
      st.esc[prod] = null; st.rasc[prod] = null; avancarProduto();
    }
  });
  function avancarProduto() {
    atualizarCarrinho();
    if (st.editando) { st.editando = false; renderResumo(); mostrar('resumo'); return; }
    if (st.idx < st.ordem.length - 1) { st.idx++; renderProduto(); history.pushState({ tela: 'combo', idx: st.idx }, '', '#combo'); window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' }); atualizarProgresso(); setTimeout(() => $('#h-combo').focus({ preventScroll: true }), 60); }
    else { renderResumo(); mostrar('resumo'); }
  }

  /* ---------- Itens do combo (para resumo, carrinho, banco e WhatsApp) ---------- */
  function itens(fonte = 'esc') {
    const lista = [];
    const ordem = ['internet', 'celular', 'energia'];
    ordem.forEach((prod) => {
      const v = fonte === 'misto' ? (st.esc[prod] === undefined ? st.rasc[prod] : st.esc[prod]) : st.esc[prod];
      if (!v) return;
      if (prod === 'internet') {
        const p = DY.planosInternet.find((x) => x.id === v.id); const o = p.opcoes[v.op];
        const preco = centavos(o.preco); const nome = p.unidade === 'GIGA' ? '1 Giga' : p.num + ' Mega';
        const extra = o.nome !== 'Somente Internet' ? ' + ' + o.nome : '';
        lista.push({ produto: 'internet', titulo: 'Internet Fibra ' + nome + extra, detalhe: brl(preco) + '/mês · ' + (v.para === 'empresa' ? 'para empresa' : 'para casa'), mensal: preco, cashback: cashbackCentavos(preco, 50), plano: p.id, opcao: o.nome, para: v.para || st.para.internet,
          linhaZap: `Internet Fibra ${nome}${extra} no valor de ${brl(preco)}/mês${v.para === 'empresa' ? ' (para empresa)' : ''}` });
      }
      if (prod === 'celular') {
        const p = DY.planosCelular.find((x) => x.id === v.id); const unit = centavos(p.preco); const total = unit * v.linhas;
        const para = v.para || st.para.celular;
        lista.push({ produto: 'celular', titulo: `${v.linhas} ${v.linhas === 1 ? 'linha' : 'linhas'} de celular ${p.num} GB`, detalhe: `${brl(unit)} por linha · ${brl(total)}/mês · ${para === 'cnpj' ? 'CNPJ' : 'CPF'}`, mensal: total, cashback: cashbackCentavos(total, 100), plano: p.id, linhas: v.linhas, para,
          linhaZap: `${v.linhas} ${v.linhas === 1 ? 'linha' : 'linhas'} de celular de ${p.num} GB (${brl(unit)} cada, total de ${brl(total)}/mês)${para === 'cnpj' ? ' para a minha empresa' : ''}` });
      }
      if (prod === 'energia') {
        const s = DY.energia.simular(v.conta);
        lista.push({ produto: 'energia', titulo: 'Energia Solar por Assinatura', detalhe: `Conta de ${brl(s.conta)} → cerca de ${brl(s.comDesconto)}`, mensal: s.comDesconto, cashback: s.cashback, conta_luz: s.conta, estimativa_desconto_pct: s.pct,
          linhaZap: `Energia Solar para uma conta de luz de ${brl(s.conta)}` });
      }
    });
    return lista;
  }
  const somaCb = (l) => l.reduce((a, i) => a + i.cashback, 0);

  /* ---------- Barra do combo ---------- */
  const car = $('[data-carrinho]');
  const dock = $('[data-dock]'), dockIr = $('[data-dock-ir]'), dockRot = $('[data-dock-rot]');
  const PRIM = '[data-continuar], [data-montar], [data-add], [data-ir-dados], [data-finalizar]';
  // O botão fixo espelha (rótulo, ativo/inativo, carregando) o botão principal da tela visível
  function alvoDock() { const t = $('.tela:not([hidden])'); return t ? $$(PRIM, t)[0] : null; }
  function syncDock() {
    const a = alvoDock();
    dockIr.hidden = !a;
    if (!a) return;
    dockIr.disabled = a.disabled;
    dockIr.classList.toggle('carregando', a.classList.contains('carregando'));
    const t = a.textContent.replace('→', '').trim();
    dockRot.textContent = /^Adicionar/.test(t) ? 'Adicionar' : /^Manter/.test(t) ? 'Continuar' : t === 'Criar meu pedido' ? 'Criar pedido' : t;
  }
  dockIr.addEventListener('click', () => { const a = alvoDock(); if (a && !a.disabled) a.click(); });
  new MutationObserver(() => requestAnimationFrame(syncDock)).observe($('#fluxo'), { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'class'] });
  function atualizarCarrinho() {
    const l = itens(telaAtual === 'combo' ? 'misto' : 'esc');
    $('[data-carrinho-qtd]').textContent = l.length;
    $('[data-carrinho-cb]').textContent = brl(somaCb(l));
    $('[data-carrinho-lista]').innerHTML = l.length ? '<ul style="display:flex;flex-direction:column;gap:10px">' + l.map((i) => `<li><span><b>${i.titulo}</b><br>${i.detalhe}</span><span>${brl(i.cashback)}</span></li>`).join('') + '</ul>' : '<p>Escolha pelo menos um serviço para montar o combo.</p>';
    car.hidden = !l.length;
    if (!l.length) { $('[data-carrinho-lista]').hidden = true; car.setAttribute('aria-expanded', 'false'); }
  }
  function pulsar() { const q2 = $('[data-carrinho-qtd]'); q2.classList.remove('pulsar'); void q2.offsetWidth; q2.classList.add('pulsar'); }
  $('[data-carrinho-toggle]').addEventListener('click', (e) => {
    const b = e.currentTarget; const abrir = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', abrir); $('[data-carrinho-lista]').hidden = !abrir;
  });

  /* =========================================================
     4 · RESUMO
     ========================================================= */
  function renderResumo() {
    const l = itens();
    const faltam = ['internet', 'celular', 'energia'].filter((p) => !st.esc[p] && (st.disp || {})[p] !== 'nao');
    const ico = { internet: 'hero-wifi.svg', celular: 'hero-celular-5g.svg', energia: 'hero-lampada.svg' };
    const mensal = l.filter((i) => i.produto !== 'energia').reduce((a, i) => a + i.mensal, 0);
    $('[data-resumo]').innerHTML = (l.length ? '' : '<div class="aviso aviso--info"><img src="img/icones/aviso-info.svg" alt=""><span>O seu combo está vazio. Para seguir, escolha <b>pelo menos um serviço</b> abaixo.</span></div>')
      + l.map((i) => `<div class="item-combo"><span class="item-combo__ico i-${i.produto}"><img src="${img('icones/' + ico[i.produto])}" alt=""></span>
        <span class="item-combo__txt"><b>${i.titulo}</b><span>${i.detalhe}</span><em>Cashback: ${brl(i.cashback)}</em></span>
        <button class="item-combo__acao" type="button" data-editar="${i.produto}" aria-label="Alterar ${ROTULO[i.produto]}">Alterar</button></div>`).join('')
      + faltam.map((p) => `<div class="item-combo item-combo--vazio"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + ico[p])}" alt=""></span>
        <span class="item-combo__txt"><b>${{ internet: 'Internet Fibra', celular: 'Planos de Celular', energia: 'Energia Solar por Assinatura' }[p]}</b><span>${{ internet: '50% da mensalidade volta para você', celular: '100% do valor das linhas volta para você', energia: '10% da nova conta volta para você' }[p]}</span></span>
        <button class="item-combo__acao" type="button" data-editar="${p}">+ Adicionar</button></div>`).join('')
      + (l.length ? `<div class="resumo__total"><div><span>Cashback total</span><b>${brl(somaCb(l))}</b></div><small>Uma vez, via PIX na sua conta bancária, quando o contrato fecha.</small></div>` : '');
    $('[data-ir-dados]').disabled = !l.length;
    atualizarCarrinho();
  }
  $('[data-resumo]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-editar]'); if (!b) return;
    const p = b.dataset.editar;
    if (!st.ordem.includes(p)) st.ordem.push(p);
    st.idx = st.ordem.indexOf(p); if (st.esc[p]) st.rasc[p] = { ...st.esc[p] };
    st.editando = true;
    renderProduto(); mostrar('combo');
  });
  $('[data-ir-dados]').addEventListener('click', () => {
    if (!temItens()) { toast('Escolha pelo menos um serviço para continuar.'); return; }
    mostrar('contato');
  });

  /* =========================================================
     5 · CONTATO   6 · CADASTRO
     ========================================================= */
  const fCont = $('[data-form="contato"]'), fCad = $('[data-form="cadastro"]');
  const okCont = () => !validar.nome($('#f-nome').value) && !validar.telefone($('#f-telefone').value);
  const precisaCnpj = () => st.esc.celular && st.esc.celular.para === 'cnpj';
  const okCad = () => !validar.email($('#f-email').value) && !validar.cpf($('#f-cpf').value) && (!precisaCnpj() || !validar.cnpj($('#f-cnpj').value)) && st.cad.consent;
  ligarCampo('nome', { val: validar.nome, depois: () => (fCont.querySelector('[data-continuar]').disabled = !okCont()) });
  ligarCampo('telefone', { masc: mascara.telefone, val: validar.telefone, depois: () => (fCont.querySelector('[data-continuar]').disabled = !okCont()) });
  const chkCad = () => (fCad.querySelector('[data-continuar]').disabled = !okCad());
  ligarCampo('email', { val: validar.email, depois: chkCad });
  ligarCampo('cpf', { masc: mascara.cpf, val: validar.cpf, depois: chkCad });
  ligarCampo('cnpj', { masc: mascara.cnpj, val: validar.cnpj, depois: chkCad });
  $('[data-consentimento]').addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    st.cad.consent = !st.cad.consent; e.currentTarget.setAttribute('aria-checked', st.cad.consent); chkCad();
  });
  const blocoCnpj = $('[data-revela-cnpj]'); revelar(blocoCnpj, false);

  fCont.addEventListener('submit', (e) => {
    e.preventDefault();
    const a = $('[data-grupo="nome"]').validarAgora(), b = $('[data-grupo="telefone"]').validarAgora();
    if (!a || !b) return;
    st.contato = { nome: $('#f-nome').value.trim().replace(/\s+/g, ' '), telefone: so($('#f-telefone').value) };
    DY.salvarPedido(montarPedido('contato')); // já guarda o contato, mesmo que a pessoa pare aqui
    revelar(blocoCnpj, precisaCnpj());
    chkCad();
    mostrar('cadastro');
  });
  fCad.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = [$('[data-grupo="email"]').validarAgora(), $('[data-grupo="cpf"]').validarAgora(), !precisaCnpj() || $('[data-grupo="cnpj"]').validarAgora()].every(Boolean);
    if (!ok || !st.cad.consent) { if (!st.cad.consent) toast('Para seguir, marque a autorização de uso dos dados.'); return; }
    st.cad = { ...st.cad, email: $('#f-email').value.trim().toLowerCase(), cpf: so($('#f-cpf').value), cnpj: precisaCnpj() ? so($('#f-cnpj').value) : '' };
    DY.salvarPedido(montarPedido('cadastro'));
    mostrar('pagamento');
  });

  /* =========================================================
     7 · PAGAMENTO
     ========================================================= */
  const blocoBancos = $('[data-revela-bancos]'); revelar(blocoBancos, false);
  const grade = $('[data-bancos]');
  grade.innerHTML = DY.bancosDebito.map(([c, n, s]) => `<button type="button" class="banco" role="radio" aria-checked="false" data-banco="${n}"><span class="banco__sigla" aria-hidden="true">${s}</span>${n}</button>`).join('');
  const chkPag = () => { $('[data-finalizar]').disabled = !(st.pag.tipo === 'boleto' || (st.pag.tipo === 'debito' && st.pag.banco)); atualizarProgresso(); };
  $('[data-pagamentos]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pag]'); if (!b) return;
    $$('[data-pag]').forEach((x) => x.setAttribute('aria-checked', x === b));
    st.pag.tipo = b.dataset.pag; revelar(blocoBancos, st.pag.tipo === 'debito');
    if (st.pag.tipo === 'debito') setTimeout(() => blocoBancos.scrollIntoView({ block: 'nearest', behavior: reduzir ? 'auto' : 'smooth' }), 200);
    chkPag();
  });
  grade.addEventListener('click', (e) => {
    const b = e.target.closest('[data-banco]'); if (!b) return;
    $$('[data-banco]', grade).forEach((x) => x.setAttribute('aria-checked', x === b));
    st.pag.banco = b.dataset.banco; chkPag();
    $('[data-finalizar]').scrollIntoView({ block: 'nearest', behavior: reduzir ? 'auto' : 'smooth' });
  });

  function valoresPagamento() {
    const l = itens().filter((i) => i.produto !== 'energia');
    const debito = l.reduce((a, i) => a + i.mensal, 0);
    return { debito, boleto: debito + l.length * 1000, planos: l.length };
  }
  function atualizarPagamento() {
    const v = valoresPagamento();
    $$('[data-pag-valor]').forEach((e) => { e.hidden = !v.planos; e.textContent = brl(v[e.dataset.pagValor]) + '/mês'; });
    const sm = $('[data-pag="boleto"] small'); if (sm) sm.textContent = v.planos ? 'R$ 10 a mais por plano.' : 'Você paga todo mês, até o vencimento.';
  }
  function montarPedido(etapa) {
    const l = itens();
    const utm = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid'].forEach((k) => q.get(k) && (utm[k] = q.get(k)));
    return {
      id: st.id, etapa, origem: st.origem, atualizado_em: new Date().toISOString(),
      endereco: { ...st.end }, fibra_viabilidade: st.fibra,
      itens: l.map(({ linhaZap, ...resto }) => resto), cashback_total_centavos: somaCb(l),
      nome: st.contato.nome, telefone: st.contato.telefone, email: st.cad.email, cpf: st.cad.cpf, cnpj: st.cad.cnpj,
      consentimento: st.cad.consent, pagamento: { ...st.pag, mensal_centavos: st.pag.tipo ? valoresPagamento()[st.pag.tipo] : null }, utm,
    };
  }

  $('[data-finalizar]').addEventListener('click', async (e) => {
    const b = e.currentTarget; if (b.disabled) return;
    b.classList.add('carregando'); b.disabled = true;
    const pedido = montarPedido('pedido_criado');
    await Promise.all([DY.salvarPedido(pedido), espera(700)]);
    b.classList.remove('carregando');
    const l = itens();
    const msg = DY.mensagemPedido({ id: st.id, itens: l })
      .replace('Meu pedido é', `Forma de pagamento: ${st.pag.tipo === 'debito' ? 'Débito automático (' + st.pag.banco + ')' : 'Boleto ou PIX'}${valoresPagamento().planos ? ' — total de ' + brl(valoresPagamento()[st.pag.tipo]) + '/mês' : ''}\nMeu pedido é`);
    $('[data-zap-pedido]').href = DY.linkWhatsApp(msg);
    $('[data-num-pedido]').textContent = st.id;
    $('[data-fim-cb]').textContent = brl(somaCb(l));
    $('[data-fim-itens]').innerHTML = l.map((i) => `<li><span>${i.titulo}</span><span>${brl(i.cashback)}</span></li>`).join('');
    $('[data-copiar]').onclick = async () => {
      try { await navigator.clipboard.writeText(msg); toast('Mensagem copiada. Cole no WhatsApp.'); }
      catch (er) { toast('Não deu para copiar. Toque em "Enviar no WhatsApp".'); }
    };
    try { sessionStorage.removeItem('dy_endereco'); } catch (er) { /* */ }
    mostrar('fim');
  });

  document.querySelectorAll('[data-ano]').forEach((el) => (el.textContent = new Date().getFullYear()));
  dock.hidden = false; document.body.classList.add('com-dock'); atualizarCarrinho(); syncDock();
})();
