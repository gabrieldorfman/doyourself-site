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
  // Planos de internet: casa ou empresa (o estado é confirmado pelo CEP na consulta)
  DY.definirPlanos({ tipo: st.para.internet });
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
    st.pag = { tipo: '', banco: '' }; st.idx = 0; st.editando = false; st.ordem = ORDENS[origem].slice();
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
    dock.hidden = ['consulta', 'fim'].includes(nome);
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
  // espera um instante: se a pessoa tocou em "Não sei o meu CEP", o aviso não aparece (e o botão não pula de lugar)
  inCep.addEventListener('blur', () => setTimeout(() => { if (gCep.hidden || !busca.hidden) return; if (inCep.value && so(inCep.value).length < 8) marcar(gCep, validar.cep(inCep.value)); }, 250));
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
    inCid.disabled = false; inCid.value = ''; inRua.disabled = true; inRua.value = ''; inRuaNum.disabled = true; inRuaNum.value = ''; sug.innerHTML = '';
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
  const itemSug = (d, destaque) => `<button type="button" class="sugestao${destaque ? ' sugestao--certa' : ''}" role="option" data-cep="${so(d.cep)}">${destaque ? '<span class="sugestao__selo">CEP do seu número</span>' : ''}<b>${d.logradouro}</b>${/^(até|de|lado)\b/i.test(d.complemento || '') ? `<span class="faixa">Números ${d.complemento}</span>` : ''}<span>${d.bairro} · ${d.localidade}/${d.uf} · CEP ${d.cep}</span></button>`;
  let tRua, ultimaLista = [], pedidoRua = 0;
  function mostrarSugestoes() {
    const n = parseInt(so(inRuaNum.value), 10);
    const lista = ultimaLista;
    if (!lista.length) return;
    if (!n) { sug.innerHTML = (lista.length > 1 ? '<p class="dy-apoio sug-dica">Essa rua tem mais de um CEP. Digite o número para acharmos o seu.</p>' : '') + lista.slice(0, 25).map((d) => itemSug(d)).join(''); return; }
    const certos = lista.filter((d) => faixaInclui(d.complemento, n) === true);
    const unicos = lista.filter((d) => faixaInclui(d.complemento, n) === null);
    const melhor = certos.length ? certos : unicos;
    if (melhor.length) {
      const resto = lista.filter((d) => !melhor.includes(d));
      sug.innerHTML = melhor.slice(0, 5).map((d) => itemSug(d, melhor.length === 1)).join('')
        + (resto.length ? `<details class="sug-outros"><summary>Ver outros CEPs dessa rua (${resto.length})</summary>${resto.slice(0, 25).map((d) => itemSug(d)).join('')}</details>` : '');
    } else sug.innerHTML = '<p class="dy-apoio sug-dica">Nenhum CEP dessa rua cobre esse número. Confira o número ou escolha abaixo.</p>' + lista.slice(0, 25).map((d) => itemSug(d)).join('');
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
  inRua.addEventListener('input', () => { clearTimeout(tRua); tRua = setTimeout(buscarRua, 380); });
  inRua.addEventListener('blur', () => { const antes = inRuaNum.value; separarNumero(); if (inRuaNum.value !== antes) mostrarSugestoes(); });
  inRuaNum.addEventListener('input', () => { inRuaNum.value = so(inRuaNum.value).slice(0, 6); const c = inRuaNum.closest('.campo'); c.classList.toggle('valido', !!inRuaNum.value); c.querySelector('.campo__ico').innerHTML = CHECK; mostrarSugestoes(); });
  inRuaNum.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const b = $('.sugestao--certa', sug); if (b) b.click(); } });
  sug.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cep]'); if (!b) return;
    const num = so(inRuaNum.value);
    abrirBuscaCep(false);
    inCep.value = mascara.cep(b.dataset.cep);
    consultarCep().then(() => { if (num) { inNum.value = num; inNum.dispatchEvent(new Event('input', { bubbles: true })); checarEnd(); } });
  });

  // Pré-preenchimento: vindo da Home (sessionStorage) ou pela URL
  (function preencher() {
    if (retomar) return;
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
    DY.definirPlanos({ uf: st.end.uf, tipo: st.para.internet });
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
  function renderDisponivel() {
    $('[data-disp-end]').textContent = `${st.end.logradouro}, ${st.end.numero} — ${st.end.cidade}/${st.end.uf}`;
    const info = {
      energia: ['Desconto de até 20% na Conta de Luz', 'hero-lampada.svg', 'Cashback de 10% da nova conta'],
      internet: ['Internet Fibra Óptica', 'hero-wifi.svg', 'Cashback de 50% do plano'],
      celular: ['Plano de Celular', 'hero-celular-5g.svg', 'Cashback de 100% das linhas'],
    };
    const ordem = ['energia', 'internet', 'celular'];
    const anim = (k) => `animate__animated animate__zoomIn" style="animation-delay:${0.25 + k * 0.22}s`;
    $('[data-disp]').innerHTML = ordem.map((p, k) => {
      const [nome, ico, cb] = info[p]; const d = st.disp[p];
      const selo = d === 'nao' ? '<span class="disp-selo disp-selo--nao">Indisponível</span>' : d === 'talvez' ? '<span class="disp-selo disp-selo--talvez">Disponível*</span>' : '<span class="disp-selo">Disponível</span>';
      const txt = d === 'nao' ? (p === 'internet' ? 'Ainda não temos fibra no seu endereço.' : 'Ainda não atende a sua região.') : cb;
      const rotBtn = p === 'energia' ? 'Ver desconto' : 'Ver planos';
      const corpo = `<div class="disp-linha"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + ico)}" alt=""></span>
        <span class="item-combo__txt"><span class="disp-topo"><b>${nome}</b>${selo}</span><span>${txt}</span></span></div>`;
      if (d === 'nao') return `<div class="item-combo disp-item i-${p} disp-item--nao ${anim(k)}">${corpo}</div>`;
      return `<button class="item-combo disp-item i-${p} ${anim(k)}" type="button" data-ver="${p}">${corpo}<span class="disp-ver">${rotBtn} <span class="seta-dir" aria-hidden="true">→</span></span></button>`;
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
      <p class="dy-apoio" style="text-align:center;margin-top:14px">Preços no débito automático. Pagando no boleto ou PIX, o valor aumenta apenas R$ 10,00.</p>`;
  }
  function ligarInternet() {
    const trilho = $('[data-trilho]', palco); ligarDots(trilho);
    ligarPara('internet');
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
      st.para[prod] = b.dataset.v;
      if (prod === 'celular') atualizarLinhas();
      if (prod === 'internet') {
        // casa e empresa têm planos diferentes: troca a lista e limpa a escolha
        DY.definirPlanos({ tipo: st.para.internet });
        if (st.rasc.internet && !DY.planosInternet.some((p) => p.id === st.rasc.internet.id)) st.rasc.internet = null;
        renderProduto();
      }
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
    return `<div class="energia-sim">
      <ul class="energia-beneficios"><li><img src="${img('icones/hero-lampada.svg')}" alt="">Sem placas e sem obra</li><li><img src="${img('icones/cofrinho.svg')}" alt="">Sem investimento</li><li><img src="${img('icones/verificado.svg')}" alt="">Mesma distribuidora</li></ul>
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
        const preco = centavos(o.preco); const nome = p.num + ' Mega';
        const extra = o.nome !== 'Somente Internet' ? ' + ' + o.nome : '';
        lista.push({ produto: 'internet', titulo: 'Internet Fibra ' + nome + extra, detalhe: brl(preco) + '/mês · ' + (v.para === 'empresa' ? 'para empresa' : 'para casa'), mensal: preco, cashback: cashbackCentavos(preco, 50), sub: (o.nome !== 'Somente Internet' ? o.nome + ' incluso · ' : '') + ((v.para || st.para.internet) === 'empresa' ? 'Para empresa' : 'Para casa'), plano: p.id, opcao: o.nome, para: v.para || st.para.internet,
          linhaZap: `Internet Fibra ${nome}${extra} no valor de ${brl(preco)}/mês${v.para === 'empresa' ? ' (para empresa)' : ''}` });
      }
      if (prod === 'celular') {
        const p = DY.planosCelular.find((x) => x.id === v.id); const unit = centavos(p.preco); const total = unit * v.linhas;
        const para = v.para || st.para.celular;
        lista.push({ produto: 'celular', titulo: `${v.linhas} ${v.linhas === 1 ? 'linha' : 'linhas'} de celular ${p.num} GB`, detalhe: `${brl(unit)} por linha · ${brl(total)}/mês · ${para === 'cnpj' ? 'CNPJ' : 'CPF'}`, mensal: total, cashback: cashbackCentavos(total, 100), sub: `${brl(unit)} por linha · ${para === 'cnpj' ? 'CNPJ' : 'CPF'}`, plano: p.id, linhas: v.linhas, para,
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
  const somaMes = (l) => l.reduce((a, i) => a + i.mensal, 0);
  const MES = '<i>/mês</i>';
  // Resumo organizado: energia separada dos serviços de telecom, depois cashback e valor total
  // Um card por serviço (energia laranja, internet azul, celular verde) com Alterar e Remover
  const TIT = { energia: 'Desconto na Energia', internet: 'Internet Fibra', celular: 'Plano de Celular' };
  const ICO = { energia: 'hero-lampada.svg', internet: 'hero-wifi.svg', celular: 'hero-celular-5g.svg' };
  const ICO_LAPIS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.7 3.3a1.6 1.6 0 0 1 2.3 0l1.7 1.7a1.6 1.6 0 0 1 0 2.3L7.5 16.5 3.5 17.5l1-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  const ICO_LIXO = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4.5h4V6M5.5 6l.8 10h7.4l.8-10M8.5 9v4.5M11.5 9v4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function blocosResumo(l) {
    const chip = (v) => `<span class="rz-chip">Cashback <b>${brl(v)}</b></span>`;
    const cab = (p) => `<div class="rz-sec__cab"><h3><span class="rz-ico"><img src="${img('icones/' + ICO[p])}" alt=""></span>${TIT[p]}</h3>
      <div class="rz-acoes"><button class="rz-btn" type="button" data-editar="${p}" aria-label="Alterar ${TIT[p]}" title="Alterar">${ICO_LAPIS}<span>Alterar</span></button><button class="rz-btn rz-btn--remover" type="button" data-remover="${p}" aria-label="Remover ${TIT[p]}" title="Remover">${ICO_LIXO}<span>Remover</span></button></div></div>`;
    let h = '';
    ['energia', 'internet', 'celular'].forEach((p) => {
      const i = l.find((x) => x.produto === p); if (!i) return;
      if (p === 'energia') h += `<section class="rz-sec rz-sec--energia">${cab(p)}
        <div class="rz-linha rz-linha--antiga"><span>Fatura antiga</span><s>${brl(i.conta_luz)}</s></div>
        <div class="rz-linha rz-linha--nova"><span>Fatura de luz com desconto<small>Estimativa com ${i.estimativa_desconto_pct}% de desconto</small></span><b>${brl(i.mensal)}${MES}</b></div>
        <div class="rz-linha rz-linha--cb"><span></span>${chip(i.cashback)}</div></section>`;
      else h += `<section class="rz-sec rz-sec--${p}">${cab(p)}
        <div class="rz-item"><div class="rz-item__nome"><b>${i.titulo}</b><span>${i.sub}</span></div><div class="rz-item__val"><b>${brl(i.mensal)}${MES}</b>${chip(i.cashback)}</div></div></section>`;
    });
    const tel = l.filter((i) => i.produto !== 'energia'); const en = l.find((i) => i.produto === 'energia');
    const n = l.length;
    h += '<div class="rz-separador" role="separator"><span>Cashback e valor total</span></div>';
    h += `<div class="rz-cbtotal"><div><span>Cashback total</span><b>${brl(somaCb(l))}</b></div><small>Esse é o valor que você recebe de volta ao finalizar esse pedido. Será enviado via PIX para a sua conta bancária.</small></div>`;
    h += `<div class="rz-total"><div><span>Valor total ${n === 1 ? 'do serviço' : `dos ${n} serviços`}</span><b>${brl(somaMes(l))}${MES}</b></div><small>${tel.length ? 'Internet e celular no débito automático.' : ''}${en ? ' A conta de luz é uma estimativa e depende da sua fatura.' : ''}</small></div>`;
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
    dockRot.textContent = /^Adicionar/.test(t) ? 'Adicionar' : /^Manter/.test(t) ? 'Continuar' : t === 'Criar meu pedido' ? 'Criar pedido' : t;
  }
  dockIr.addEventListener('click', () => { const a = alvoDock(); if (a && !a.disabled) a.click(); });
  new MutationObserver(() => requestAnimationFrame(syncDock)).observe($('#fluxo'), { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'class'] });
  function atualizarCarrinho() {
    const l = itens(telaAtual === 'combo' ? 'misto' : 'esc');
    $('[data-carrinho-qtd]').textContent = l.length;
    $('[data-carrinho-mensal]').textContent = brl(somaMes(l));
    car.setAttribute('aria-label', `Ver resumo do pedido: ${l.length} ${l.length === 1 ? 'serviço' : 'serviços'}, ${brl(somaMes(l))} por mês, cashback de ${brl(somaCb(l))}`);
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
    $('[data-resumo]').innerHTML = (l.length ? '' : '<div class="aviso aviso--info"><img src="img/icones/aviso-info.svg" alt=""><span>O seu combo está vazio. Para seguir, escolha <b>pelo menos um serviço</b> abaixo.</span></div>')
      + (l.length ? blocosResumo(l) : '')
      + faltam.map((p) => `<div class="item-combo item-combo--vazio"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + ico[p])}" alt=""></span>
        <span class="item-combo__txt"><b>${{ internet: 'Internet Fibra', celular: 'Planos de Celular', energia: 'Energia Solar por Assinatura' }[p]}</b><span>${{ internet: '50% da mensalidade volta para você', celular: '100% do valor das linhas volta para você', energia: '10% da nova conta volta para você' }[p]}</span></span>
        <button class="item-combo__acao" type="button" data-editar="${p}">+ Adicionar</button></div>`).join('');
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
    const i = itens(telaAtual === 'combo' ? 'misto' : 'esc').find((x) => x.produto === p); if (!i) return;
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
    if (!modal.hidden && !itens(telaAtual === 'combo' ? 'misto' : 'esc').length) fecharResumo();
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
    const eco = $('[data-pag-eco]'); if (eco) { eco.hidden = !v.planos; eco.textContent = `Você economiza ${brl(v.boleto - v.debito)} por mês`; }
    const sm = $('[data-pag="boleto"] small');
    if (sm) sm.textContent = v.planos ? (v.planos === 1 ? 'O valor aumenta apenas R$ 10,00.' : 'O valor aumenta apenas R$ 10,00 por plano.') : 'Você paga todo mês, até o vencimento.';
    // Débito automático já vem marcado: é o mais barato e o mais usado
    if (!st.pag.tipo) { const d = $('[data-pag="debito"]'); $$('[data-pag]').forEach((x) => x.setAttribute('aria-checked', x === d)); st.pag.tipo = 'debito'; revelar(blocoBancos, true); chkPag(); }
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
    const enFim = l.find((i) => i.produto === 'energia');
    $('[data-fim-mes]').textContent = brl((valoresPagamento()[st.pag.tipo] || 0) + (enFim ? enFim.mensal : 0));
    $('.fim__mes span').textContent = enFim ? 'Você paga por mês (energia estimada)' : 'Você paga por mês';
    $('[data-fim-itens]').innerHTML = l.map((i) => `<li><span>${i.titulo}</span><span>${brl(i.cashback)}</span></li>`).join('');
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
  dock.hidden = false; document.body.classList.add('com-dock'); atualizarCarrinho(); syncDock();
})();
