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
    // casa/empresa e CPF/CNPJ: o cliente escolhe em cada produto (só vem marcado quando a página de origem já disse)
    para: { internet: ['casa', 'empresa'].includes(q.get('para')) ? q.get('para') : (origem === 'internet' && q.get('plano') ? 'casa' : ''), celular: ['cpf', 'cnpj'].includes(q.get('para')) ? q.get('para') : '', energia: '' },
    contato: { nome: '', telefone: '' }, cad: { email: '', cpf: '', cnpj: '', consent: false },
    pag: { tipo: '', banco: '' },
    sel: [],   // serviços marcados na tela "Disponível no seu endereço"
  };
  // Planos de internet: casa ou empresa (o estado é confirmado pelo CEP na consulta)
  const PARA0 = { ...st.para };
  DY.definirPlanos({ tipo: st.para.internet || 'casa' });
  // Plano vindo do card da Home já chega pré-selecionado
  if (origem === 'internet' && q.get('plano')) {
    const p = DY.planosInternet.find((x) => x.id === q.get('plano'));
    if (p) { const oi = Math.max(0, p.opcoes.findIndex((o) => o.nome === q.get('opcao'))); st.rasc.internet = { id: p.id, op: oi }; }
  }
  if (origem === 'celular' && q.get('plano')) {
    const p = DY.planosCelular.find((x) => x.id === q.get('plano'));
    if (p) st.rasc.celular = { id: p.id, linhas: Math.max(1, Math.min(99, +q.get('linhas') || 1)) };
  }

  /* ---------- Pedido em andamento salvo no navegador (sem CPF, CNPJ nem e-mail) ---------- */
  const CHAVE_ANDAMENTO = 'dy_andamento';
  // O pedido sempre recomeça ao atualizar a página (nada do combo fica salvo no navegador)
  const limparAndamento = () => { try { sessionStorage.removeItem(CHAVE_ANDAMENTO); } catch (er) { /* */ } };
  limparAndamento();
  const retomar = null;
  const salvarAndamento = () => {};
  // Voltar até o endereço também zera o combo
  function zerarPedido() {
    Object.assign(st.esc, { internet: undefined, celular: undefined, energia: undefined });
    Object.assign(st.rasc, { internet: null, celular: null, energia: null });
    st.pag = { tipo: '', banco: '' }; st.idx = 0; st.editando = false; st.ordem = ORDENS[origem].slice(); st.sel = []; st.para = { ...PARA0 };
    $$('[data-banco], [data-pag]').forEach((x) => x.setAttribute('aria-checked', 'false'));
  }

  /* ---------- Navegação entre telas (com o botão Voltar do celular funcionando) ---------- */
  const NOMES = { 1: 'Endereço', 2: 'Seu combo', 3: 'Seus dados', 4: 'Pagamento' };
  let telaAtual = 'endereco';
  const gs = !reduzir && window.gsap ? window.gsap : null;
  if (gs) document.documentElement.classList.add('com-gsap');
  function entrar(el, voltando) {
    if (!gs || !el) return;
    gs.fromTo(el, { x: voltando ? -64 : 64, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  }
  function mostrar(nome, { voltando = false, empurrar = true } = {}) {
    if (nome === 'endereco' && voltando) zerarPedido();
    fecharResumo(false);
    $$('.tela').forEach((t) => { t.hidden = t.dataset.tela !== nome; t.classList.toggle('voltando', voltando); });
    const tela = $(`.tela[data-tela="${nome}"]`);
    entrar(tela, voltando);
    telaAtual = nome;
    $('#fluxo').classList.toggle('largo', nome === 'combo');
    $('#fluxo').classList.toggle('largo-disp', nome === 'disponivel');
    document.body.classList.toggle('pg-fim', nome === 'fim');
    $('[data-progresso]').hidden = nome === 'fim';
    atualizarProgresso();
    dock.hidden = ['endereco', 'consulta', 'fim'].includes(nome);
    document.body.classList.toggle('com-dock', !dock.hidden);
    atualizarCarrinho();
    if (nome === 'pagamento') atualizarPagamento();
    syncDock();
    if (empurrar) history.pushState({ tela: nome, idx: st.idx }, '', '#' + nome);
    salvarAndamento();
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
  // "gabriel DORFMAN da silva" → "Gabriel Dorfman da Silva" (de, da, do, das, dos, e ficam minúsculos)
  const MINUSC = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  function nomeProprio(v) {
    let k = 0;
    return v.replace(/\s{2,}/g, ' ').replace(/^\s+/, '').replace(/[^\s]+/g, (w) => { const l = w.toLocaleLowerCase('pt-BR'); const i = k++; return i > 0 && MINUSC.has(l) ? l : l.charAt(0).toLocaleUpperCase('pt-BR') + l.slice(1); });
  }
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
    input.addEventListener('input', () => { if (masc) { const a = input.selectionStart, n0 = input.value.length; input.value = masc(input.value); const d = input.value.length - n0; try { input.setSelectionRange(a + d, a + d); } catch (er) { /* tipos sem seleção */ } } rodar(false); });
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
    revelar(blocoEnd, true); avisoFaixa.hidden = true; if (inNum.value) agendarFaixa();
    setTimeout(() => (r.logradouro ? inNum : inLog).focus(), 260);
    checarEnd();
  }
  inCep.addEventListener('input', () => { inCep.value = mascara.cep(inCep.value); gCep.querySelector('.campo').classList.remove('invalido'); gCep.querySelector('.campo__msg').textContent = ''; consultarCep(); });
  // espera um instante: se a pessoa tocou em "Não sei o meu CEP", o aviso não aparece (e o botão não pula de lugar)
  inCep.addEventListener('blur', () => setTimeout(() => { if (gCep.hidden || !busca.hidden) return; if (inCep.value && so(inCep.value).length < 8) marcar(gCep, validar.cep(inCep.value)); }, 250));
  inLog.addEventListener('input', () => { const c = inLog.closest('.campo'); const ok = inLog.value.trim().length >= 3; c.classList.toggle('valido', ok); c.querySelector('.campo__ico').innerHTML = CHECK; checarEnd(); });

  ligarCampo('numero', { masc: (v) => v.replace(/[^\dsSnN/]/g, '').toUpperCase().slice(0, 6), val: validar.numero, depois: () => { checarEnd(); agendarFaixa(); } });
  /* Número fora da faixa do CEP (ruas com mais de um CEP): avisa e oferece o CEP certo */
  const avisoFaixa = $('[data-aviso-faixa]'); const cacheRua = {}; let tFaixa;
  function agendarFaixa() { clearTimeout(tFaixa); avisoFaixa.hidden = true; tFaixa = setTimeout(checarFaixa, 600); }
  async function checarFaixa() {
    const n = parseInt(so(inNum.value), 10); const e = st.end;
    if (!n || !e.uf || !e.cidade || !inLog.readOnly || !inLog.value) return;
    const chave = [e.uf, e.cidade, inLog.value].join('|');
    try {
      if (!cacheRua[chave]) cacheRua[chave] = await (await fetch(`https://viacep.com.br/ws/${e.uf}/${encodeURIComponent(e.cidade)}/${encodeURIComponent(tirarTipo(inLog.value))}/json/`)).json();
    } catch (er) { return; }
    const lista = (Array.isArray(cacheRua[chave]) ? cacheRua[chave] : []).filter((d) => semAcento(d.logradouro) === semAcento(inLog.value));
    if (lista.length < 2 || so(inNum.value) !== String(n)) return;
    const atual = lista.find((d) => so(d.cep) === so(inCep.value));
    if (!atual || faixaInclui(atual.complemento, n) !== false) return;
    const certo = lista.find((d) => faixaInclui(d.complemento, n) === true); if (!certo) return;
    avisoFaixa.innerHTML = `<span>O número <b>${n}</b> fica em outro CEP dessa rua: <b>${certo.cep}</b> (${certo.bairro}).</span><button type="button" class="ct-link" data-usar-cep="${so(certo.cep)}">Usar este CEP</button>`;
    avisoFaixa.hidden = false;
  }
  avisoFaixa.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-usar-cep]'); if (!b) return;
    const num = inNum.value; avisoFaixa.hidden = true;
    inCep.value = mascara.cep(b.dataset.usarCep);
    consultarCep().then(() => { inNum.value = num; inNum.dispatchEvent(new Event('input', { bubbles: true })); checarEnd(); });
  });
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
  const inRuaNum = $('#f-rua-num');
  const btnNaoSei = $('[data-nao-sei-cep]');
  function abrirBuscaCep(abrir) {
    busca.hidden = !abrir;
    // com a busca aberta, o campo de CEP some (e é limpo) para não misturar as duas formas
    gCep.hidden = abrir;
    if (abrir) { inCep.value = ''; cepBuscado = ''; limpar(gCep); revelar(blocoEnd, false); checarEnd(); }
    btnNaoSei.textContent = abrir ? 'Fechar a busca e digitar o CEP' : 'Não sei o meu CEP';
    if (abrir) selUf.focus(); else inCep.focus();
  }
  btnNaoSei.addEventListener('click', () => abrirBuscaCep(busca.hidden));
  selUf.addEventListener('change', async () => {
    selUf.closest('.campo').classList.add('valido'); selUf.closest('.campo').querySelector('.campo__ico').innerHTML = CHECK;
    inCid.disabled = false; inCid.value = ''; inRua.disabled = true; inRua.value = ''; inRuaNum.disabled = true; inRuaNum.value = ''; sug.innerHTML = ''; ruaEscolhida = null; ultimaLista = [];
    inCid.focus();
    try {
      const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selUf.value}/municipios?orderBy=nome`);
      $('#l-cidades').innerHTML = (await r.json()).map((c) => `<option value="${c.nome}">`).join('');
    } catch (er) { /* sem lista, o campo continua livre */ }
  });
  inCid.addEventListener('input', () => { const ok = inCid.value.trim().length >= 3; inRua.disabled = !ok; inRuaNum.disabled = !ok; inCid.closest('.campo').classList.toggle('valido', ok); inCid.closest('.campo').querySelector('.campo__ico').innerHTML = CHECK; });

  // "Rua Paulo Setúbal, 315" ou "Rua Paulo Setúbal 315": o número vai para o campo Número
  function separarNumero() {
    const m = inRua.value.match(/^(.*?\D)[\s,]+(?:n[º°o.]?\s*)?(\d{1,6})\s*$/i);
    if (m && m[1].trim().length >= 3) { inRua.value = m[1].replace(/[\s,]+$/, ''); inRuaNum.value = m[2]; }
  }
  const tirarTipo = (r) => r.replace(/^(rua|r\.|avenida|av\.?|travessa|tv\.?|alameda|al\.?|rodovia|rod\.?|estrada|praça|pça\.?)\s+/i, '').trim();
  // Faixas do Correios: "até 1239/1240", "de 1241/1242 a 3519/3520", "de 3521/3522 ao fim", "lado par/ímpar"
  function faixaInclui(comp, n) {
    const c = String(comp || '').toLowerCase().trim();
    if (!/^(até|de |lado)/.test(c)) return null; // sem faixa (rua de CEP único)
    const par = /lado par/.test(c), impar = /lado ímpar|lado impar/.test(c);
    if ((par && n % 2) || (impar && !(n % 2))) return false;
    let m;
    if ((m = c.match(/^até\s+(\d+)(?:\/(\d+))?/))) return n <= +(m[2] || m[1]);
    if ((m = c.match(/^de\s+(\d+)(?:\/\d+)?\s+(?:a|à)\s+(\d+)(?:\/(\d+))?/))) return n >= +m[1] && n <= +(m[3] || m[2]);
    if ((m = c.match(/^de\s+(\d+)(?:\/\d+)?\s+ao fim/))) return n >= +m[1];
    return par || impar ? true : null;
  }
  // 1º a pessoa escolhe o nome da rua (sem CEP, sem faixa); 2º digita o número; aí aparece o CEP certo
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  let tRua, ultimaLista = [], pedidoRua = 0, ruaEscolhida = null;
  function nomesDeRua() {
    const m = new Map();
    ultimaLista.forEach((d) => { const k = semAcento(d.logradouro); if (!m.has(k)) m.set(k, { nome: d.logradouro, bairros: new Set() }); m.get(k).bairros.add(d.bairro); });
    return [...m.entries()].map(([k, v]) => ({ k, nome: v.nome, bairros: [...v.bairros].filter(Boolean) }));
  }
  function mostrarSugestoes() {
    if (!ultimaLista.length) return;
    const nomes = nomesDeRua();
    if (!ruaEscolhida && nomes.length === 1 && semAcento(tirarTipo(inRua.value)) && semAcento(nomes[0].nome).includes(semAcento(tirarTipo(inRua.value)))) {
      // uma rua só com esse nome: já vale como escolhida quando houver número
      if (so(inRuaNum.value)) ruaEscolhida = nomes[0].k;
    }
    if (!ruaEscolhida) {
      sug.innerHTML = nomes.slice(0, 20).map((r) => `<button type="button" class="sugestao sugestao--rua" role="option" data-rua="${r.k}"><b>${r.nome}</b><span>${inCid.value.trim()}/${selUf.value}</span></button>`).join('');
      return;
    }
    const daRua = ultimaLista.filter((d) => semAcento(d.logradouro) === ruaEscolhida);
    const n = parseInt(so(inRuaNum.value), 10);
    if (!n) { sug.innerHTML = '<p class="dy-apoio sug-dica">Agora digite o <b>número do imóvel</b> para encontrarmos o seu CEP.</p>'; return; }
    const certos = daRua.filter((d) => faixaInclui(d.complemento, n) === true);
    const melhor = certos.length ? certos : daRua.filter((d) => faixaInclui(d.complemento, n) === null);
    if (!melhor.length) { sug.innerHTML = '<p class="dy-apoio sug-dica">Não encontramos um CEP para esse número nessa rua. Confira o número digitado.</p>'; return; }
    sug.innerHTML = melhor.slice(0, 5).map((d) => `<button type="button" class="sugestao sugestao--certa" role="option" data-cep="${so(d.cep)}"><span class="sugestao__selo">CEP do seu endereço</span><b>${d.logradouro}, ${n}</b><span>${d.bairro} · ${d.localidade}/${d.uf}</span><span class="sugestao__cep">CEP ${d.cep}</span><span class="sugestao__usar">Usar este CEP →</span></button>`).join('');
  }
  async function buscarRua() {
    separarNumero();
    const rua = tirarTipo(inRua.value.trim());
    if (rua.length < 3) { sug.innerHTML = ''; ultimaLista = []; return; }
    const meu = ++pedidoRua;
    try {
      const lista = await (await fetch(`https://viacep.com.br/ws/${selUf.value}/${encodeURIComponent(inCid.value.trim())}/${encodeURIComponent(rua)}/json/`)).json();
      if (meu !== pedidoRua) return;
      ultimaLista = Array.isArray(lista) ? lista : [];
      if (!ultimaLista.length) { sug.innerHTML = '<p class="dy-apoio sug-dica">Não achamos uma rua com esse nome nessa cidade. Confira a grafia.</p>'; return; }
      mostrarSugestoes();
    } catch (er) { if (meu === pedidoRua) sug.innerHTML = '<p class="dy-apoio sug-dica">Não conseguimos buscar agora. Tente de novo em instantes.</p>'; }
  }
  inRua.addEventListener('input', () => { ruaEscolhida = null; clearTimeout(tRua); tRua = setTimeout(buscarRua, 380); });
  inRua.addEventListener('blur', () => { const antes = inRuaNum.value; separarNumero(); if (inRuaNum.value !== antes) mostrarSugestoes(); });
  inRuaNum.addEventListener('input', () => { inRuaNum.value = so(inRuaNum.value).slice(0, 6); const c = inRuaNum.closest('.campo'); c.classList.toggle('valido', !!inRuaNum.value); c.querySelector('.campo__ico').innerHTML = CHECK; mostrarSugestoes(); });
  inRuaNum.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const nomes = nomesDeRua(); if (!ruaEscolhida && nomes.length === 1) { ruaEscolhida = nomes[0].k; mostrarSugestoes(); } const b = $('.sugestao--certa', sug); if (b) b.click(); } });
  sug.addEventListener('click', (e) => {
    const r = e.target.closest('[data-rua]');
    if (r) {
      ruaEscolhida = r.dataset.rua; inRua.value = r.querySelector('b').textContent;
      inRua.closest('.campo').classList.add('valido'); inRua.closest('.campo').querySelector('.campo__ico').innerHTML = CHECK;
      mostrarSugestoes(); if (!so(inRuaNum.value)) inRuaNum.focus();
      return;
    }
    const b = e.target.closest('[data-cep]'); if (!b) return;
    const num = so(inRuaNum.value);
    abrirBuscaCep(false);
    inCep.value = mascara.cep(b.dataset.cep);
    consultarCep().then(() => { if (num) { inNum.value = num; inNum.dispatchEvent(new Event('input', { bubbles: true })); checarEnd(); } });
  });

  // Pré-preenchimento: vindo da Home (sessionStorage) ou pela URL
  (function preencher() {
    if (retomar) return;
    // Veio de "Não sei o meu CEP" (home, combo, energia, internet, celular): abre direto a busca pelo endereço
    if (abrirBusca && !q.get('cep')) { abrirBuscaCep(true); return; }
    let salvo = null; try { salvo = JSON.parse(sessionStorage.getItem('dy_endereco') || 'null'); } catch (er) { /* */ }
    const cep = so(q.get('cep') || (salvo && salvo.cep) || ''); const num = q.get('numero') || (salvo && salvo.numero) || '';
    if (cep.length === 8) { inCep.value = mascara.cep(cep); if (num) { inNum.value = num; } consultarCep().then(() => { if (num) $('[data-grupo="numero"]').validarAgora(); }); }
    else if (abrirBusca) abrirBuscaCep(true);
    else setTimeout(() => inCep.focus(), 300);
  })();

  /* =========================================================
     2 · CONSULTANDO
     ========================================================= */
  async function rodarConsulta() {
    // Preços do estado do endereço (internet muda por bloco de estados; celular no PR/SC)
    DY.definirPlanos({ uf: st.end.uf, tipo: st.para.internet || 'casa' });
    DY.salvarLocal(st.end.uf, st.end.cidade);
    ['internet', 'celular'].forEach((k) => { const lista = k === 'internet' ? DY.planosInternet : DY.planosCelular; if (st.rasc[k] && !lista.some((p) => p.id === st.rasc[k].id)) st.rasc[k] = null; if (st.esc[k] && !lista.some((p) => p.id === st.esc[k].id)) st.esc[k] = undefined; });
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

    // O que existe no endereço: fibra (Supabase), celular (todo o Brasil), energia (regiões atendidas)
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
  const ORDEM_FIXA = ['energia', 'internet', 'celular'];
  function faixa(lista, f) { const v = lista.map(f); return [Math.min(...v), Math.max(...v)]; }
  function infoDisponivel() {
    const net = DY.planosInternet, cel = DY.planosCelular;
    const [vMin, vMax] = faixa(net, (p) => +p.num);
    const precosNet = net.flatMap((p) => p.opcoes.map((o) => centavos(o.preco)));
    const [gMin, gMax] = faixa(cel, (p) => +p.num);
    const [cMin, cMax] = faixa(cel, (p) => centavos(p.preco));
    const ex = DY.energia.simular(350);
    return {
      energia: { tit: 'Desconto de até 20% na Conta de Luz', ico: 'hero-lampada.svg', preco: 'Economize até <b>20%</b> todo mês',
        itens: ['Sem obra e sem placas', 'Sem investimento', 'Continua com a mesma distribuidora'],
        cb: `Volta <b>10% da nova conta</b>. Ex.: conta de R$ 350 → volta <b>${brl(ex.cashback)}</b>` },
      internet: { tit: 'Internet Fibra Óptica', ico: 'hero-wifi.svg', preco: `${vMin} a ${vMax} Mega · a partir de <b>${brl(Math.min(...precosNet))}/mês</b>`,
        itens: ['Wi-Fi incluso', 'Instalação gratuita', 'Streaming em alguns planos'],
        cb: `Volta <b>metade de um mês</b>: de ${brl(cashbackCentavos(Math.min(...precosNet), 50))} a <b>${brl(cashbackCentavos(Math.max(...precosNet), 50))}</b>` },
      celular: { tit: 'Plano de Celular', ico: 'hero-celular-5g.svg', preco: `${gMin} a ${gMax} GB · a partir de <b>${brl(cMin)}/mês</b> por linha`,
        itens: ['Ligações ilimitadas para todo o Brasil', '5G e portabilidade grátis', 'WhatsApp e Waze ilimitados'],
        cb: `Volta <b>um mês inteiro</b> de cada linha: ${brl(cMin)} a <b>${brl(cMax)}</b>` },
    };
  }
  const ICO_OK = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function renderDisponivel() {
    $('[data-disp-end]').innerHTML = `${st.end.logradouro}, ${st.end.numero} — ${st.end.cidade}/${st.end.uf} · <button class="ct-link disp-alterar" type="button" data-voltar>Alterar endereço</button>`;
    // pré-seleção: quem veio da página de um serviço já chega com ele marcado; do Combo, todos
    if (!st.sel.length) st.sel = origem === 'combo' ? ORDEM_FIXA.slice() : ['internet', 'celular', 'energia'].includes(origem) ? [origem] : [];
    st.sel = st.sel.filter((p) => st.disp[p] !== 'nao');
    const info = infoDisponivel();
    $('[data-disp]').innerHTML = ORDEM_FIXA.map((p, k) => {
      const i = info[p]; const d = st.disp[p]; const on = st.sel.includes(p);
      const anim = `animate__animated animate__zoomIn" style="animation-delay:${0.25 + k * 0.22}s`;
      const topo = `<div class="disp-linha"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + i.ico)}" alt=""></span><b class="disp-tit">${i.tit}</b></div>`;
      if (d === 'nao') return `<div class="item-combo disp-item i-${p} disp-item--nao ${anim}">${topo}<p class="disp-nao">${p === 'internet' ? 'Ainda não temos fibra no seu endereço.' : 'Ainda não atende a sua região.'}</p></div>`;
      return `<button class="item-combo disp-item i-${p}${on ? ' disp-item--on' : ''} ${anim}" type="button" role="checkbox" aria-checked="${on}" data-sel="${p}">
        ${topo}
        <p class="disp-preco">${i.preco}</p>
        <ul class="disp-lista">${i.itens.map((t) => `<li>${ICO_OK}${t}</li>`).join('')}</ul>
        <p class="disp-cb">${i.cb}</p>
        ${p === 'internet' && d === 'talvez' ? '<p class="disp-talvez">A fibra no seu número é confirmada no WhatsApp, antes de qualquer contrato.</p>' : ''}
        <span class="disp-quero"><span class="disp-quero__marca" aria-hidden="true">${ICO_OK}</span><span class="disp-quero__txt">${on ? 'Incluído no pedido' : 'Quero este'}</span></span>
      </button>`;
    }).join('');
    atualizarMontar();
  }
  function atualizarMontar() {
    const n = st.sel.length; const b = $('[data-montar]');
    const nenhumDisp = !ORDEM_FIXA.some((p) => st.disp[p] !== 'nao');
    b.disabled = !n && !nenhumDisp;
    b.innerHTML = nenhumDisp ? 'Falar no WhatsApp' : !n ? 'Marque os serviços que você quer' : (n === 1 ? 'Ver os planos deste serviço' : `Montar meu combo com ${n} serviços`) + ' <span class="seta-dir" aria-hidden="true">→</span>';
    $('[data-disp-dica]').textContent = n ? 'Você pode mudar depois, no resumo do pedido.' : 'Toque nos cards para escolher um, dois ou os três.';
  }
  $('[data-disp]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sel]'); if (!b) return;
    const p = b.dataset.sel; const on = !st.sel.includes(p);
    st.sel = on ? [...st.sel, p] : st.sel.filter((x) => x !== p);
    b.classList.toggle('disp-item--on', on); b.setAttribute('aria-checked', on);
    $('.disp-quero__txt', b).textContent = on ? 'Incluído no pedido' : 'Quero este';
    if (gs && on) gs.fromTo($('.disp-quero__marca', b), { scale: 0.4 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' });
    atualizarMontar();
  });
  $('[data-montar]').addEventListener('click', () => {
    if (!ORDEM_FIXA.some((p) => st.disp[p] !== 'nao')) { location.href = DY.linkWhatsApp('Olá! Consultei meu endereço no site da Do Yourself e quero falar sobre as opções.'); return; }
    if (!st.sel.length) return;
    // a ordem das etapas segue a ordem dos cards: Energia, Internet, Celular
    st.ordem = ORDEM_FIXA.filter((p) => st.sel.includes(p));
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
      return `<span class="cp-pilula ${i === st.idx ? 'atual ' : ''}${cls}"><span class="n">${st.esc[p] ? CHECK : i + 1}</span>${ROTULO[p]}</span>`;
    }).join('');
  }

  function cabecalho(prod) {
    const primeiro = st.idx === 0;
    const qtd = st.ordem.length;
    const textos = {
      internet: primeiro
        ? ['Escolha sua internet', 'Fibra óptica com Wi-Fi e instalação grátis. <b>50% da mensalidade volta para você.</b>']
        : ['Quer internet fibra também?', 'Na mesma conversa. <b>50% da mensalidade volta para você.</b>'],
      celular: primeiro
        ? ['Escolha seu plano de celular', 'Ligações ilimitadas, 5G e o seu número. <b>100% das linhas volta para você.</b>']
        : ['Quer incluir celular?', 'Ligações ilimitadas e 5G. <b>100% das linhas volta para você.</b>'],
      energia: primeiro
        ? ['Quanto vem sua conta de luz?', 'Até 20% menos na conta, sem obra e sem placas. <b>10% da nova conta volta para você.</b>']
        : ['E a conta de luz?', 'Até 20% menos na conta, sem obra. <b>10% da nova conta volta para você.</b>'],
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
    if (telaAtual === 'combo') entrar(palco.firstElementChild, voltando);
    ({ internet: ligarInternet, celular: ligarCelular, energia: ligarEnergia }[prod])();
    atualizarBotaoAdd();
    atualizarCarrinho();
  }

  const { dots, ligarDots } = DY.ofertas;
  const { centralizar, trazerParaMeio } = DY.ofertas;
  // Depois de escolher: desce para a personalização (streaming ou linhas)
  const descer = (el) => { if (el) setTimeout(() => trazerParaMeio(el), 120); };

  const PERGUNTA = {
    // CPF mostra os planos residenciais; CNPJ, os empresariais (plano de CPF não vai para CNPJ)
    internet: ['A internet vai ficar no seu CPF ou no CNPJ?', [['casa', 'CPF', 'Casa ou apartamento', 'pessoa'], ['empresa', 'CNPJ', 'Empresa ou comércio', 'predio']]],
    celular: ['As linhas vão ficar no seu CPF ou no CNPJ?', [['cpf', 'CPF', 'Para você e a sua família', 'pessoa'], ['cnpj', 'CNPJ', 'Empresa ou comércio', 'predio']]],
    energia: ['A sua conta de luz hoje está no CPF ou no CNPJ?', [['cpf', 'CPF', 'Casa ou apartamento', 'pessoa'], ['cnpj', 'CNPJ', 'Condomínio, empresa ou comércio', 'predio']]],
  };
  const ICO_QUEM = {
    pessoa: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    predio: '<svg viewBox="0 0 24 24"><path d="M4 21V5.5L12 3v18M12 8.5l8 2.5v10M2.5 21h19M7 8h2M7 11.5h2M7 15h2M15 13.5h2M15 17h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  function htmlQuem(prod) {
    const [tit, ops] = PERGUNTA[prod]; const v = st.para[prod];
    return `<div class="ct-quem${v ? ' ct-quem--ok' : ''}"><p class="ct-quem__tit" id="q-${prod}">${tit}</p>
      <div class="ct-quem__ops" role="radiogroup" aria-labelledby="q-${prod}" data-para="${prod}">${ops.map(([k, a, b, ico]) => `<button type="button" class="ct-quem__op" role="radio" aria-checked="${v === k}" data-v="${k}"><span class="ct-quem__marca" aria-hidden="true"></span><span class="ct-quem__ico" aria-hidden="true">${ICO_QUEM[ico]}</span><b>${a}</b><small>${b}</small></button>`).join('')}</div></div>`;
  }
  const faltaQuem = (prod) => !st.para[prod];
  function beneficios(prod) {
    const B = {
      internet: st.para.internet === 'empresa'
        ? [['instalacao.svg', 'Instalação grátis'], ['lista-wifi.svg', '100% fibra óptica'], ['modem.svg', 'Wi-Fi incluso']]
        : [['instalacao.svg', 'Instalação grátis'], ['dif-tela.svg', 'Streaming incluso'], ['lista-wifi.svg', '100% fibra óptica']],
      celular: [['ligacoes.svg', 'Ligações ilimitadas'], ['portabilidade.svg', 'Portabilidade grátis'], ['dados-moveis.svg', 'Apps ilimitados']],
    }[prod];
    return `<ul class="energia-beneficios beneficios--${prod}">${B.map(([i, t]) => `<li><img src="${img('icones/' + i)}" alt="">${t}</li>`).join('')}</ul>`;
  }

  /* ----- Internet ----- */
  function htmlInternet() {
    if (faltaQuem('internet')) return beneficios('internet') + htmlQuem('internet');
    const sel = st.rasc.internet || (st.esc.internet && { ...st.esc.internet });
    const cards = DY.planosInternet.map((p) => { const on = !!(sel && sel.id === p.id); return DY.ofertas.internet(p, { on, op: on ? sel.op : 0 }); }).join('');
    const pSel = sel && DY.planosInternet.find((x) => x.id === sel.id);
    return `${beneficios('internet')}${htmlQuem('internet')}
      <div><div class="ofertas" data-trilho>${cards}</div>${dots(DY.planosInternet.length)}</div>
      <div data-pers-box>${pSel ? DY.ofertas.personaliza(pSel, sel.op) : ''}</div>
      <p class="dy-apoio" style="text-align:center;margin-top:14px">Preços no débito automático. Pagando no boleto ou PIX, o valor aumenta apenas R$ 10,00.</p>`;
  }
  function ligarInternet() {
    ligarPara('internet'); if (faltaQuem('internet')) return;
    const trilho = $('[data-trilho]', palco); ligarDots(trilho);
    const box = $('[data-pers-box]', palco);
    const pintarCard = (card, p, op) => {
      const o = p.opcoes[op]; const preco = centavos(o.preco);
      card.querySelector('[data-preco]').textContent = brl(preco);
      const de = card.querySelector('[data-de]'); if (de) de.textContent = 'De ' + brl(centavos(o.de || p.de));
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
      if (!mesmo || !box.innerHTML.trim()) box.innerHTML = DY.ofertas.personaliza(p, op);
      atualizarBotaoAdd(); atualizarCarrinho();
      descer($('[data-personaliza]', box));
    };
    // Toque no card só centraliza; o botão "Escolher este plano" é que escolhe
    // Toque no card marca e centraliza; se havia outro plano escolhido, ele é desfeito
    const marcar = (card) => {
      $$('.oferta', trilho).forEach((c) => c.classList.toggle('marcado', c === card));
      const r = st.rasc.internet;
      if (r && r.id !== card.dataset.id) {
        st.rasc.internet = null; box.innerHTML = '';
        $$('.oferta', trilho).forEach((c) => { c.setAttribute('aria-checked', 'false'); c.querySelector('.oferta__escolher').textContent = 'Escolher este plano'; pintarCard(c, DY.planosInternet.find((x) => x.id === c.dataset.id), 0); });
        atualizarBotaoAdd(); atualizarCarrinho();
      }
      centralizar(card);
    };
    trilho.addEventListener('click', (e) => { const card = e.target.closest('.oferta'); if (!card) return; if (e.target.closest('.oferta__escolher')) { $$('.oferta', trilho).forEach((c) => c.classList.toggle('marcado', c === card)); escolher(card); } else marcar(card); });
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
      const antes = st.para[prod]; st.para[prod] = b.dataset.v;
      if (prod === 'internet') {
        // casa e empresa têm planos diferentes: troca a lista e limpa a escolha
        DY.definirPlanos({ tipo: st.para.internet });
        if (st.rasc.internet && !DY.planosInternet.some((p) => p.id === st.rasc.internet.id)) st.rasc.internet = null;
      }
      if (!antes || prod === 'internet') {
        // primeira escolha: mostra os planos (ou o campo da conta) logo abaixo da pergunta
        const y = window.scrollY; renderProduto(); window.scrollTo(0, y);
        const alvo = $(prod === 'energia' ? '[data-grupo="conta"]' : '[data-trilho]', palco);
        if (alvo && !antes) { if (gs) gs.from(alvo.parentElement, { y: 16, autoAlpha: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }); if (prod === 'energia') setTimeout(() => $('#f-conta', palco)?.focus({ preventScroll: true }), 80); }
      } else if (prod === 'celular') atualizarLinhas();
    });
  }

  /* ----- Celular ----- */
  function htmlCelular() {
    if (faltaQuem('celular')) return beneficios('celular') + htmlQuem('celular');
    const sel = st.rasc.celular || (st.esc.celular && { ...st.esc.celular });
    const cards = DY.planosCelular.map((p) => DY.ofertas.celular(p, { on: !!(sel && sel.id === p.id) })).join('');
    const n = sel ? sel.linhas : 1;
    return `${beneficios('celular')}${htmlQuem('celular')}
      <div><div class="ofertas ofertas--cel" data-trilho>${cards}</div>${dots(DY.planosCelular.length)}</div>
      <div class="linhas" data-linhas-box${sel ? '' : ' hidden'}>
        <p class="linhas__titulo" id="lbl-linhas">Quantas linhas você quer?</p>
        <div class="linhas__ctrl"><button type="button" data-l="-1" aria-label="Tirar uma linha">−</button><output aria-live="polite" aria-labelledby="lbl-linhas" data-l-qtd>${n}</output><button type="button" data-l="1" aria-label="Adicionar uma linha">+</button></div>
        <p class="linhas__total" data-l-total>Escolha um plano acima para ver o total.</p>
        <small data-l-nota></small>
        <div class="porta"><img src="${img('icones/portabilidade.svg')}" alt=""><span><b>Portabilidade grátis</b>Traga o número que você já usa, de qualquer operadora, sem pagar nada. A gente cuida do pedido por você.</span></div>
      </div>`;
  }
  function atualizarLinhas() {
    const box = $('[data-linhas-box]', palco); if (!box) return;
    const r = st.rasc.celular; const n = r ? r.linhas : +$('[data-l-qtd]', box).textContent;
    $('[data-l-qtd]', box).textContent = n;
    $('[data-l="-1"]', box).disabled = n <= 1;
    $('[data-l-nota]', box).textContent = st.para.celular === 'cnpj' ? 'Se a sua empresa for MEI, o limite é de 3 linhas por CNPJ. A partir de 10 linhas existem condições especiais — a gente te explica no WhatsApp.' : '';
    if (r) {
      const p = DY.planosCelular.find((x) => x.id === r.id); const total = centavos(p.preco) * n;
      $('[data-l-total]', box).innerHTML = `${n} ${n === 1 ? 'linha' : 'linhas'} de ${p.num} GB = <b>${brl(total)}/mês</b> · você recebe <b style="color:var(--marca-titulo)">${brl(cashbackCentavos(total, 100))}</b>`;
    }
  }
  function ligarCelular() {
    ligarPara('celular'); if (faltaQuem('celular')) return;
    const trilho = $('[data-trilho]', palco); ligarDots(trilho);
    const escolher = (card) => {
      const linhas = st.rasc.celular ? st.rasc.celular.linhas : +$('[data-l-qtd]', palco).textContent || 1;
      st.rasc.celular = { id: card.dataset.id, linhas };
      $$('.oferta', trilho).forEach((c) => { const on = c === card; c.setAttribute('aria-checked', on); c.querySelector('.oferta__escolher').textContent = on ? 'Plano escolhido' : 'Escolher este plano'; });
      const box = $('[data-linhas-box]', palco); box.hidden = false;
      atualizarLinhas(); atualizarBotaoAdd(); atualizarCarrinho();
      descer(box);
    };
    const marcar = (card) => {
      $$('.oferta', trilho).forEach((c) => c.classList.toggle('marcado', c === card));
      const r = st.rasc.celular;
      if (r && r.id !== card.dataset.id) {
        st.rasc.celular = null; $('[data-l-qtd]', palco).textContent = r.linhas;
        $$('.oferta', trilho).forEach((c) => { c.setAttribute('aria-checked', 'false'); c.querySelector('.oferta__escolher').textContent = 'Escolher este plano'; });
        $('[data-linhas-box]', palco).hidden = true; atualizarBotaoAdd(); atualizarCarrinho();
      }
      centralizar(card);
    };
    trilho.addEventListener('click', (e) => { const c = e.target.closest('.oferta'); if (!c) return; if (e.target.closest('.oferta__escolher')) { $$('.oferta', trilho).forEach((x) => x.classList.toggle('marcado', x === c)); escolher(c); } else marcar(c); });
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
    const benef = `<ul class="energia-beneficios"><li><img src="${img('icones/hero-lampada.svg')}" alt="">Sem placas e sem obra</li><li><img src="${img('icones/cofrinho.svg')}" alt="">Sem investimento</li><li><img src="${img('icones/verificado.svg')}" alt="">Mesma distribuidora</li></ul>`;
    if (faltaQuem('energia')) return `<div class="energia-sim">${benef}${htmlQuem('energia')}</div>`;
    return `<div class="energia-sim">
      ${benef}${htmlQuem('energia')}
      <div class="campo-grupo" data-grupo="conta">
        <div class="campo campo--moeda${v ? ' preenchido' : ''}">
          <input id="f-conta" inputmode="numeric" placeholder="0,00" value="${v ? mascara.moeda(String(Math.round(v * 100))) : ''}" aria-describedby="m-conta">
          <label for="f-conta">Valor médio da sua conta de luz</label>
          <span class="campo__ico" aria-hidden="true"></span>
        </div>
        <p class="campo__msg dica" id="m-conta">Use uma conta recente ou a média de gastos dos últimos 3 meses.</p>
      </div>
      <div class="chips" role="group" aria-label="Valores comuns">${[200, 350, 500, 800, 1500].map((x) => `<button type="button" class="chip-op" data-v="${x}" aria-pressed="false">R$ ${x.toLocaleString('pt-BR')}</button>`).join('')}</div>
      <div data-energia-res></div>
    </div>`;
  }
  function ligarEnergia() {
    ligarPara('energia'); if (faltaQuem('energia')) return;
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
          <p class="energia-res__tit"><span>Simulação do seu desconto</span><em>Estimativa</em></p>
          <div class="energia-res__linha"><span>Sua fatura hoje</span><b><s>${brl(s.conta)}</s></b></div>
          <div class="energia-res__linha nova"><span>Com o desconto de ${s.pct}%, cerca de</span><b>${brl(s.comDesconto)}<small class="mes">/mês</small></b></div>
          <div class="energia-res__linha"><span>Economia estimada</span><b>${brl(s.economiaMes)} por mês<small>${brl(s.economiaMes * 12)} em um ano</small></b></div>
          <hr>
          <div class="oferta__cb"><span>Volta para você<br><small>cashback de 10% da nova conta, uma vez</small></span><b>${brl(s.cashback)}</b></div>
          <div class="energia-res__aviso"><img src="${img('icones/aviso-info.svg')}" alt=""><span><b>Isto é uma simulação.</b> O desconto real é calculado com a sua fatura e enviado pelo WhatsApp para você aprovar antes de qualquer contrato. A primeira fatura com desconto pode levar até 90 dias.</span></div>
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
      if (prod === 'energia') st.esc.energia.para = st.para.energia;
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
        const preco = centavos(o.preco); const nome = p.num + ' Mega';
        const extra = o.nome !== 'Somente Internet' ? ' + ' + o.nome : '';
        lista.push({ produto: 'internet', titulo: 'Internet Fibra ' + nome + extra, detalhe: brl(preco) + '/mês · ' + (v.para === 'empresa' ? 'no CNPJ' : 'no CPF'), mensal: preco, cashback: cashbackCentavos(preco, 50), sub: (o.nome !== 'Somente Internet' ? o.nome + ' incluso · ' : '') + ((v.para || st.para.internet) === 'empresa' ? 'No CNPJ' : 'No CPF'), plano: p.id, opcao: o.nome, para: v.para || st.para.internet, titular: (v.para || st.para.internet) === 'empresa' ? 'cnpj' : 'cpf',
          linhaZap: `Internet Fibra ${nome}${extra} no valor de ${brl(preco)}/mês${v.para === 'empresa' ? ' (no CNPJ)' : ''}` });
      }
      if (prod === 'celular') {
        const p = DY.planosCelular.find((x) => x.id === v.id); const unit = centavos(p.preco); const total = unit * v.linhas;
        const para = v.para || st.para.celular;
        lista.push({ produto: 'celular', titulo: `${v.linhas} ${v.linhas === 1 ? 'linha' : 'linhas'} de celular ${p.num} GB`, detalhe: `${brl(unit)} por linha · ${brl(total)}/mês · ${para === 'cnpj' ? 'CNPJ' : 'CPF'}`, mensal: total, cashback: cashbackCentavos(total, 100), sub: `${brl(unit)} por linha · ${para === 'cnpj' ? 'CNPJ' : 'CPF'}`, plano: p.id, linhas: v.linhas, para,
          linhaZap: `${v.linhas} ${v.linhas === 1 ? 'linha' : 'linhas'} de celular de ${p.num} GB (${brl(unit)} cada, total de ${brl(total)}/mês)${para === 'cnpj' ? ' para a minha empresa' : ''}` });
      }
      if (prod === 'energia') {
        const s = DY.energia.simular(v.conta);
        lista.push({ produto: 'energia', titulo: 'Energia Solar por Assinatura', detalhe: `Conta de ${brl(s.conta)} → cerca de ${brl(s.comDesconto)}`, mensal: s.comDesconto, cashback: s.cashback, conta_luz: s.conta, estimativa_desconto_pct: s.pct, titular: v.para || st.para.energia || 'cpf',
          linhaZap: `Energia Solar para uma conta de luz de ${brl(s.conta)}` });
      }
    });
    return lista;
  }
  const somaCb = (l) => l.reduce((a, i) => a + i.cashback, 0);
  const noBoleto = () => st.pag.tipo === 'boleto';
  const precoMes = (i) => i.mensal + (noBoleto() && i.produto !== 'energia' ? 1000 : 0);
  const somaMes = (l) => l.reduce((a, i) => a + precoMes(i), 0);
  function notaTotal(l) {
    const tel = l.filter((i) => i.produto !== 'energia').map((i) => i.produto);
    const nomes = tel.length === 2 ? 'Internet e celular' : tel[0] === 'internet' ? 'Internet' : tel[0] === 'celular' ? 'Celular' : '';
    const forma = noBoleto() ? 'no boleto ou PIX (R$ 10,00 a mais por plano).' : 'no débito automático.';
    return [nomes && `${nomes} ${forma}`, l.some((i) => i.produto === 'energia') && 'A conta de luz é uma estimativa e depende da sua fatura.'].filter(Boolean).join(' ');
  }
  const MES = '<i>/mês</i>';
  // Resumo organizado: energia separada dos serviços de telecom, depois cashback e valor total
  // Um card por serviço (energia laranja, internet azul, celular verde) com Alterar e Remover
  const TIT = { energia: 'Desconto na Energia', internet: 'Internet Fibra', celular: 'Plano de Celular' };
  const ICO = { energia: 'hero-lampada.svg', internet: 'hero-wifi.svg', celular: 'hero-celular-5g.svg' };
  const ICO_LAPIS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.7 3.3a1.6 1.6 0 0 1 2.3 0l1.7 1.7a1.6 1.6 0 0 1 0 2.3L7.5 16.5 3.5 17.5l1-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  const ICO_LIXO = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4.5h4V6M5.5 6l.8 10h7.4l.8-10M8.5 9v4.5M11.5 9v4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const separador = (t) => `<div class="rz-separador" role="separator"><span>${t}</span></div>`;
  const LINK_CB = '<button type="button" class="rz-link-cb" data-como-cb>Como funciona o cashback?</button>';
  function blocosResumo(l, antesDosTotais = '') {
    const chip = (v) => `<span class="rz-chip">Cashback <b>${brl(v)}</b></span>`;
    const cab = (p) => `<div class="rz-sec__cab"><h3><span class="rz-ico"><img src="${img('icones/' + ICO[p])}" alt=""></span>${TIT[p]}</h3>
      <div class="rz-acoes"><button class="rz-btn" type="button" data-editar="${p}" aria-label="Alterar ${TIT[p]}" title="Alterar">${ICO_LAPIS}<span>Alterar</span></button><button class="rz-btn rz-btn--remover" type="button" data-remover="${p}" aria-label="Remover ${TIT[p]}" title="Remover">${ICO_LIXO}<span>Remover</span></button></div></div>`;
    const en = l.find((x) => x.produto === 'energia'); const tel = l.filter((x) => x.produto !== 'energia');
    let h = '';
    if (en) h += separador(`Conta de luz com desconto de ${en.estimativa_desconto_pct}%`) + `<section class="rz-sec rz-sec--energia">${cab('energia')}
        <div class="rz-linha rz-linha--antiga"><span>Fatura atual · no ${en.titular === 'cnpj' ? 'CNPJ' : 'CPF'}</span><s>${brl(en.conta_luz)}</s></div>
        <div class="rz-linha rz-linha--nova"><span>Fatura de luz com desconto<small>Simulação com ${en.estimativa_desconto_pct}% de desconto</small></span><b>${brl(en.mensal)}${MES}</b></div>
        <div class="rz-linha rz-linha--cb"><span></span>${chip(en.cashback)}</div></section>`;
    if (tel.length) h += separador('Serviços de telecom') + tel.map((i) => `<section class="rz-sec rz-sec--${i.produto}">${cab(i.produto)}
        <div class="rz-item"><div class="rz-item__nome"><b>${i.titulo}</b><span>${i.sub}</span></div><div class="rz-item__val"><b>${brl(precoMes(i))}${MES}</b>${chip(i.cashback)}</div></div></section>`).join('');
    h += antesDosTotais;
    h += separador('Cashback e valores por mês');
    h += `<div class="rz-cbtotal"><div><span>Cashback total</span><b>${brl(somaCb(l))}</b></div><small>Volta para você uma única vez, via PIX na sua conta bancária, em até 7 dias depois que o contrato fecha.</small>${LINK_CB}</div>`;
    if (en) h += `<div class="rz-total rz-total--energia"><div><span>Conta de luz estimada</span><b>${brl(en.mensal)}${MES}</b></div><small>Simulação já com o desconto. O valor real vem pelo WhatsApp para você aprovar. A primeira fatura com desconto pode levar até 90 dias.</small></div>`;
    if (tel.length) h += `<div class="rz-total"><div><span>${tel.length === 2 ? 'Internet e celular' : tel[0].produto === 'internet' ? 'Internet' : 'Celular'}</span><b>${brl(tel.reduce((a, i) => a + precoMes(i), 0))}${MES}</b></div><small>${notaTotal(tel)} A primeira cobrança vem em cerca de 30 dias.</small></div>`;
    h += '<p class="rz-agora"><img src="img/icones/verificado.svg" alt="">Você não paga nada agora.</p>';
    return h;
  }


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
    dockRot.textContent = /^Adicionar/.test(t) ? 'Adicionar' : /^Manter/.test(t) ? 'Continuar' : t === 'Criar meu pedido' ? 'Criar pedido' : /^Ver os planos/.test(t) ? 'Ver planos' : /^Montar meu combo/.test(t) ? 'Montar combo' : /^Marque/.test(t) ? 'Escolha acima' : t;
  }
  dockIr.addEventListener('click', () => { const a = alvoDock(); if (a && !a.disabled) a.click(); });
  new MutationObserver(() => requestAnimationFrame(syncDock)).observe($('#fluxo'), { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'class'] });
  function atualizarCarrinho() {
    const l = itens('esc');
    $('[data-carrinho-qtd]').textContent = l.length;
    const telB = l.filter((i) => i.produto !== 'energia'); const enB = l.find((i) => i.produto === 'energia');
    $('[data-carrinho-mensal]').textContent = brl(telB.length ? somaMes(telB) : enB ? enB.mensal : 0);
    $('[data-carrinho-rot]').textContent = telB.length ? 'Valor dos planos' : 'Conta de luz estimada';
    car.setAttribute('aria-label', `Ver resumo do pedido: ${l.length} ${l.length === 1 ? 'serviço' : 'serviços'}, cashback de ${brl(somaCb(l))}`);
    car.hidden = !l.length;
    const corpo = $('[data-rz-corpo]');
    corpo.innerHTML = l.length ? blocosResumo(l) : '<p>Escolha pelo menos um serviço para montar o combo.</p>';
    if (!l.length) fecharResumo(false);
  }
  function pulsar() { const q2 = $('[data-carrinho-qtd]'); q2.classList.remove('pulsar'); void q2.offsetWidth; q2.classList.add('pulsar'); }

  /* ---------- Janela do resumo (fundo desfocado) ---------- */
  const modal = $('[data-rz-modal]'), janela = $('.rz-modal__janela', modal);
  let tlResumo = null;
  function abrirResumo() {
    atualizarCarrinho();
    if (tlResumo) tlResumo.kill();
    modal.hidden = false; document.body.classList.add('rz-aberto');
    car.setAttribute('aria-expanded', 'true');
    if (gs) {
      tlResumo = gs.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.rz-modal__fundo', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 })
        .fromTo(janela, { y: 40, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.4 }, 0)
        .fromTo('.rz-modal__corpo > *', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.06, clearProps: 'transform,opacity,visibility' }, 0.1);
    }
    setTimeout(() => janela.focus(), 30);
  }
  function fecharResumo(devolverFoco = true) {
    if (!modal || modal.hidden) return;
    if (tlResumo) tlResumo.kill();
    const fim = () => { modal.hidden = true; document.body.classList.remove('rz-aberto'); car.setAttribute('aria-expanded', 'false'); gs && gs.set([janela, '.rz-modal__fundo'], { clearProps: 'all' }); if (devolverFoco && !car.hidden) car.focus(); };
    if (gs && devolverFoco) {
      tlResumo = gs.timeline({ defaults: { duration: 0.22, ease: 'power2.in' }, onComplete: fim })
        .to(janela, { y: 30, autoAlpha: 0 })
        .to('.rz-modal__fundo', { autoAlpha: 0 }, 0);
    } else fim();
  }
  $('[data-carrinho-toggle]').addEventListener('click', abrirResumo);
  const comoCb = $('[data-como-cb-modal]');
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-como-cb]')) { comoCb.hidden = false; if (gs) gs.fromTo('.cb-info__caixa', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' }); setTimeout(() => $('[data-como-cb-fechar]').focus(), 30); return; }
    if (e.target.closest('[data-como-cb-fechar]') || e.target === comoCb) comoCb.hidden = true;
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !comoCb.hidden) { e.stopImmediatePropagation(); comoCb.hidden = true; } }, true);
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-rz-fechar]')) fecharResumo(); });
  document.addEventListener('keydown', (e) => {
    if (modal.hidden || !$('[data-rz-confirma]').hidden) return;
    if (e.key === 'Escape') fecharResumo();
    if (e.key === 'Tab') { // foco preso dentro da janela
      const f = $$('button, [href], [tabindex]:not([tabindex="-1"])', janela); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
    }
  });

  /* =========================================================
     4 · RESUMO
     ========================================================= */
  function renderResumo() {
    const l = itens();
    const faltam = ['energia', 'internet', 'celular'].filter((p) => !st.esc[p] && (st.disp || {})[p] !== 'nao');
    const ico = { internet: 'hero-wifi.svg', celular: 'hero-celular-5g.svg', energia: 'hero-lampada.svg' };
    const faltaHtml = faltam.length ? '<p class="rz-falta-tit">Quer incluir mais algum?</p>' + faltam.map((p) => `<div class="item-combo item-combo--vazio"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + ico[p])}" alt=""></span>
        <span class="item-combo__txt"><b>${{ internet: 'Internet Fibra', celular: 'Planos de Celular', energia: 'Desconto na Conta de Luz' }[p]}</b><span>${{ internet: 'Metade de um mês volta para você', celular: 'Um mês inteiro das linhas volta para você', energia: '10% da nova conta volta para você' }[p]}</span></span>
        <button class="item-combo__acao" type="button" data-editar="${p}">+ Adicionar</button></div>`).join('') : '';
    $('[data-resumo]').innerHTML = l.length ? blocosResumo(l, faltaHtml)
      : '<div class="aviso aviso--info"><img src="img/icones/aviso-info.svg" alt=""><span>O seu pedido está vazio. Para seguir, escolha <b>pelo menos um serviço</b> abaixo.</span></div>' + faltaHtml;
    $('[data-ir-dados]').disabled = !l.length;
    atualizarCarrinho();
  }
  /* Alterar / Remover (tela Seu combo e janela do resumo) */
  function editarProduto(p) {
    fecharResumo(false);
    if (!st.ordem.includes(p)) st.ordem.push(p);
    st.idx = st.ordem.indexOf(p); if (st.esc[p]) st.rasc[p] = { ...st.esc[p] };
    // no meio do combo, só pula para o produto; depois do resumo, volta para o resumo ao terminar
    st.editando = telaAtual !== 'combo';
    renderProduto(); if (telaAtual === 'combo') { history.pushState({ tela: 'combo', idx: st.idx }, '', '#combo'); window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' }); atualizarProgresso(); } else mostrar('combo');
  }
  const confirma = $('[data-rz-confirma]');
  let removendo = null;
  function pedirRemocao(p) {
    const i = itens('esc').find((x) => x.produto === p); if (!i) return;
    removendo = p;
    $('[data-confirma-txt]').innerHTML = `Você deseja remover <b>${i.titulo}</b> do seu pedido?`;
    confirma.hidden = false;
    if (gs) gs.fromTo('.rz-confirma__caixa', { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'back.out(1.6)' });
    setTimeout(() => $('[data-confirma-nao]').focus(), 30);
  }
  function fecharConfirma() { confirma.hidden = true; const p = removendo; removendo = null; const b = p && $(`[data-remover="${p}"]`); if (b && b.offsetParent) b.focus(); }
  function remover(p) {
    if (st.esc[p]) st.esc[p] = null; st.rasc[p] = null;
    toast(`${TIT[p]} removido do pedido.`);
    if (telaAtual === 'combo' && st.ordem[st.idx] === p) renderProduto();
    if (telaAtual === 'resumo') renderResumo();
    atualizarCarrinho();
    if (!modal.hidden && !itens('esc').length) fecharResumo();
  }
  $('[data-confirma-nao]').addEventListener('click', fecharConfirma);
  $('[data-confirma-sim]').addEventListener('click', () => { const p = removendo; confirma.hidden = true; removendo = null; if (p) remover(p); });
  confirma.addEventListener('click', (e) => { if (e.target === confirma) fecharConfirma(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !confirma.hidden) { e.stopImmediatePropagation(); fecharConfirma(); } }, true);
  document.addEventListener('click', (e) => {
    const ed = e.target.closest('[data-resumo] [data-editar], [data-rz-modal] [data-editar]'); if (ed) { editarProduto(ed.dataset.editar); return; }
    const rm = e.target.closest('[data-remover]'); if (rm) pedirRemocao(rm.dataset.remover);
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
  const precisaCnpj = () => !!((st.esc.celular && st.esc.celular.para === 'cnpj') || (st.esc.internet && st.esc.internet.para === 'empresa') || (st.esc.energia && st.esc.energia.para === 'cnpj'));
  const okCad = () => !validar.email($('#f-email').value) && !validar.cpf($('#f-cpf').value) && (!precisaCnpj() || !validar.cnpj($('#f-cnpj').value)) && st.cad.consent;
  ligarCampo('nome', { masc: nomeProprio, val: validar.nome, depois: () => (fCont.querySelector('[data-continuar]').disabled = !okCont()) });
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
    st.pag.tipo = b.dataset.pag; revelar(blocoBancos, st.pag.tipo === 'debito'); atualizarCarrinho();
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
    // deixa claro o que entra no valor da forma de pagamento
    const tel = itens().filter((i) => i.produto !== 'energia').map((i) => i.produto); const temEn = itens().some((i) => i.produto === 'energia');
    const oq = $('[data-pag-oque]');
    if (oq) { oq.hidden = !v.planos; oq.innerHTML = `Valor da <b>${tel.length === 2 ? 'internet e do celular' : tel[0] === 'internet' ? 'internet' : 'linha de celular'}</b>.${temEn ? ' O desconto na conta de luz não entra neste valor.' : ''}`; }
    const eco = $('[data-pag-eco]'); if (eco) { eco.hidden = !v.planos; eco.textContent = `Você economiza ${brl(v.boleto - v.debito)} por mês`; }
    const sm = $('[data-pag="boleto"] small');
    if (sm) sm.textContent = v.planos ? (v.planos === 1 ? 'O valor aumenta apenas R$ 10,00.' : 'O valor aumenta apenas R$ 10,00 por plano.') : 'Você paga todo mês, até o vencimento.';
    // Débito automático já vem marcado: é o mais barato e o mais usado
    if (!st.pag.tipo) { const d = $('[data-pag="debito"]'); $$('[data-pag]').forEach((x) => x.setAttribute('aria-checked', x === d)); st.pag.tipo = 'debito'; revelar(blocoBancos, true); chkPag(); atualizarCarrinho(); }
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
    // Cartão da confirmação: energia (estimativa), telecom (cobrança dos planos) e cashback total
    const enF = l.find((i) => i.produto === 'energia'); const telF = l.filter((i) => i.produto !== 'energia');
    let fh = '';
    if (enF) fh += `<div class="fim-bl fim-bl--energia"><p class="fim-bl__tit"><img src="${img('icones/hero-lampada.svg')}" alt="">Sua nova fatura de luz estimada</p>
      <p class="fim-bl__de"><span>De <s>${brl(enF.conta_luz)}</s></span><span>Para <b>${brl(enF.mensal)}/mês</b></span></p>
      <small>Simulação feita com economia aproximada de ${enF.estimativa_desconto_pct}%. O valor exato será confirmado pelo WhatsApp após a análise da sua fatura. A primeira fatura com desconto pode levar até 90 dias.</small></div>`;
    if (telF.length) fh += `<div class="fim-bl"><p class="fim-bl__tit"><img src="${img('icones/hero-wifi.svg')}" alt="">Serviços de telecom</p>
      <ul class="fim-bl__lista">${telF.map((i) => `<li><span>${i.titulo}</span><b>${brl(precoMes(i))}/mês</b></li>`).join('')}</ul>
      <p class="fim-bl__total"><span>Total dos serviços de telecom</span><b>${brl(telF.reduce((a, i) => a + precoMes(i), 0))}/mês</b></p>
      <small>${st.pag.tipo === 'boleto' ? 'No boleto ou PIX.' : 'No débito automático' + (st.pag.banco ? ' (' + st.pag.banco + ')' : '') + '.'} Você não paga nada agora: a primeira cobrança vem em cerca de 30 dias.</small></div>`;
    fh += `<div class="fim-bl fim-bl--cb"><p class="fim-bl__tit">Valor que volta para você em cashback</p><p class="fim-bl__cb">${brl(somaCb(l))}</p>
      <small>Uma única vez, via PIX na sua conta bancária, em até 7 dias depois que o contrato fecha.</small>${LINK_CB}</div>`;
    $('[data-fim-blocos]').innerHTML = fh;
    $('[data-copiar]').onclick = async () => {
      try { await navigator.clipboard.writeText(msg); toast('Mensagem copiada. Cole no WhatsApp.'); }
      catch (er) { toast('Não deu para copiar. Toque em "Enviar no WhatsApp".'); }
    };
    try { sessionStorage.removeItem('dy_endereco'); } catch (er) { /* */ }
    limparAndamento();
    mostrar('fim');
  });

  /* ---------- Resumo do combo: no tablet/desktop fica dentro da página, abaixo do progresso ---------- */
  const mqDock = matchMedia('(min-width: 768px)');
  const posicionarDock = () => { if (mqDock.matches) $('[data-progresso]').after(dock); else document.body.appendChild(dock); };
  posicionarDock(); mqDock.addEventListener('change', posicionarDock);

  /* ---------- Menu lateral ---------- */
  const menuBtn = $('[data-ct-menu]'); const menu = $('[data-ct-menu-painel]');
  const abrirMenu = (abrir) => {
    menu.hidden = !abrir; menuBtn.setAttribute('aria-expanded', abrir); document.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) { salvarAndamento(); setTimeout(() => menu.querySelector('.ct-menu__x').focus(), 50); } else menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => abrirMenu(true));
  menu.addEventListener('click', (e) => { if (e.target.closest('[data-ct-menu-fechar]')) abrirMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) abrirMenu(false); });
  $('[data-reiniciar]').addEventListener('click', () => { limparAndamento(); try { sessionStorage.removeItem('dy_endereco'); } catch (er) { /* */ } location.href = location.pathname + '?novo'; });
  window.addEventListener('pagehide', salvarAndamento);

  /* ---------- Retomar o pedido salvo ---------- */
  if (retomar) {
    const a = retomar.s;
    Object.assign(st, { id: a.id || st.id, end: { ...st.end, ...a.end }, fibra: a.fibra, disp: a.disp, ordem: a.ordem || st.ordem, idx: a.idx || 0, para: { ...st.para, ...a.para }, contato: { ...st.contato, ...a.contato } });
    Object.assign(st.esc, a.esc || {}); Object.assign(st.rasc, a.rasc || {});
    DY.definirPlanos({ uf: st.end.uf, tipo: st.para.internet });
    inCep.value = mascara.cep(st.end.cep || ''); inNum.value = st.end.numero || ''; $('#f-logradouro').value = st.end.logradouro || ''; $('#f-comp').value = st.end.comp || '';
    ['#f-nome', '#f-telefone'].forEach((sel) => { const el = $(sel); const v = sel === '#f-nome' ? st.contato.nome : st.contato.telefone; if (el && v) { el.value = sel === '#f-telefone' ? mascara.telefone(v) : v; el.dispatchEvent(new Event('input', { bubbles: true })); } });
    let tela = retomar.tela; if (['cadastro', 'pagamento'].includes(tela)) tela = st.contato.nome ? 'cadastro' : 'contato';
    if (tela === 'disponivel' && st.disp) renderDisponivel();
    if (tela === 'combo') renderProduto();
    if (tela === 'resumo') renderResumo();
    if (!st.disp && tela !== 'contato') tela = 'endereco';
    mostrar(tela);
    if (tela !== 'endereco') setTimeout(() => toast('Continuando o seu pedido de onde parou.'), 400);
  }

  document.querySelectorAll('[data-ano]').forEach((el) => (el.textContent = new Date().getFullYear()));
  dock.hidden = telaAtual === 'endereco'; document.body.classList.toggle('com-dock', !dock.hidden); atualizarCarrinho(); syncDock(); atualizarProgresso();
})();
