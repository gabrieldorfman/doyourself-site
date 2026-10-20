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
    end: { cep: '', logradouro: '', bairro: '', cidade: '', uf: '', numero: '', temComp: null, tipoComp: '', comp: '' },
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
    $('[data-carrinho]').hidden = !['combo', 'resumo', 'contato', 'cadastro', 'pagamento'].includes(nome) || nome === 'combo' && !temItens() && st.idx === 0 && !algumRascunho();
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
  const blocoEnd = $('[data-revela-endereco]'), blocoComp = $('[data-revela-comp]');
  const gCep = $('[data-grupo="cep"]');
  revelar(blocoEnd, false); revelar(blocoComp, false);
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
  ligarCampo('comp', { val: validar.comp, depois: checarEnd });
  $('#f-tipo-comp').addEventListener('change', () => { marcar('tipoComp', ''); checarEnd(); setTimeout(() => $('#f-comp').focus(), 50); });
  $('[data-tem-comp]').addEventListener('click', (e) => {
    const b = e.target.closest('[role="radio"]'); if (!b) return;
    $$('[data-tem-comp] [role="radio"]').forEach((x) => x.setAttribute('aria-checked', x === b));
    st.end.temComp = b.dataset.v === 'sim';
    revelar(blocoComp, st.end.temComp);
    if (st.end.temComp) setTimeout(() => $('#f-tipo-comp').focus(), 250);
    checarEnd();
  });
  function endOk() {
    return so(inCep.value).length === 8 && cepBuscado && inLog.value.trim().length >= 3 && !validar.numero(inNum.value) && st.end.temComp !== null
      && (!st.end.temComp || ($('#f-tipo-comp').value && !validar.comp($('#f-comp').value)));
  }
  function checarEnd() { fEnd.querySelector('[data-continuar]').disabled = !endOk(); }
  fEnd.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!endOk()) return;
    Object.assign(st.end, { logradouro: inLog.value.trim(), numero: inNum.value.trim(), tipoComp: st.end.temComp ? $('#f-tipo-comp').value : '', comp: st.end.temComp ? $('#f-comp').value.trim() : '' });
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
    $('[data-consulta-end]').textContent = `${st.end.logradouro}, ${st.end.numero}${st.end.comp ? ' · ' + st.end.tipoComp + ' ' + st.end.comp : ''} — ${st.end.cidade}/${st.end.uf}`;
    const passos = $$('[data-consulta-passos] li'); passos.forEach((p) => p.className = '');
    passos[0].classList.add('rodando'); await espera(500); passos[0].className = 'feito';
    passos[1].classList.add('rodando');
    const [fibra] = await Promise.all([DY.consultarViabilidade(st.end.cep, st.end.numero), espera(1500)]);
    st.fibra = fibra; passos[1].className = 'feito';
    passos[2].classList.add('rodando'); await espera(700); passos[2].className = 'feito';

    st.ordem = ORDENS[origem].slice();
    if (fibra === 'nao') st.ordem = st.ordem.filter((p) => p !== 'internet');
    st.idx = 0;
    box.classList.add('ok');
    if (fibra === 'sim') {
      titulo.textContent = 'Boa notícia: tem fibra no seu endereço!';
      res.innerHTML = `<div class="aviso aviso--ok">${CHECK.replace('<svg', '<svg style="color:var(--ok)"')}<span>Internet Fibra, Planos de Celular e Energia Solar por Assinatura estão disponíveis para você.</span></div>`;
    } else if (fibra === 'nao') {
      box.classList.add('alerta');
      titulo.textContent = 'Ainda não tem fibra na sua rua';
      res.innerHTML = `<div class="aviso aviso--info"><img src="${img('icones/aviso-info.svg')}" alt=""><span>A internet fibra ainda não chegou no seu número. Mas os <b>planos de celular</b> e a <b>energia solar por assinatura</b> funcionam normalmente aí — e o cashback continua valendo.</span></div>`;
    } else {
      titulo.textContent = 'Endereço confirmado!';
      res.innerHTML = `<div class="aviso aviso--neutro"><img src="${img('icones/aviso-info.svg')}" alt=""><span>Agora é só escolher o que você quer. A disponibilidade da fibra no seu número é confirmada no WhatsApp, antes de qualquer contratação.</span></div>`;
    }
    res.insertAdjacentHTML('beforeend', '<button class="dy-btn dy-btn--primario dy-btn--g dy-btn--bloco" type="button" data-ver-ofertas>Ver as ofertas <span class="seta-dir" aria-hidden="true">→</span></button>');
    res.hidden = false;
    titulo.focus({ preventScroll: true });
    const ir = () => { if (telaAtual === 'consulta') { renderProduto(); history.replaceState({ tela: 'endereco' }, ''); mostrar('combo'); } };
    res.querySelector('[data-ver-ofertas]').addEventListener('click', ir);
  }

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
        ? ['Qual internet combina com você?', 'Todos os planos são de <b>fibra óptica TIM UltraFibra</b>: a fibra vai do poste até o modem dentro de casa, com Wi-Fi incluso e instalação gratuita. Quanto mais Mega, mais aparelhos usando ao mesmo tempo sem travar. E <b>metade da mensalidade volta para você</b>.']
        : ['Quer juntar a internet fibra?', 'Você resolve a internet na <b>mesma conversa</b> do resto — sem ligar para outra empresa. É fibra óptica TIM, com Wi-Fi e instalação gratuita, e <b>50% da mensalidade volta para você</b>, somando ao cashback do combo.'],
      celular: primeiro
        ? ['Quantas linhas e quanto de internet?', 'Planos <b>TIM</b> com ligações ilimitadas para todo o Brasil, 5G e portabilidade do número que você já usa. Escolha a franquia, depois a quantidade de linhas. <b>O valor das linhas volta 100% para você</b>, uma vez, na contratação.']
        : ['Que tal colocar o celular no combo?', 'Planos <b>TIM</b> com ligações ilimitadas, 5G e o seu número de sempre. Fica tudo no mesmo atendimento — e <b>o valor das linhas volta 100% para você</b>.'],
      energia: primeiro
        ? ['Quanto vem a sua conta de luz?', 'Com a energia solar por assinatura você recebe créditos de uma usina solar e <b>paga menos na conta</b> — sem placas, sem obra e sem investimento. A distribuidora continua a mesma. E <b>10% do novo valor volta para você</b>.']
        : ['E a conta de luz? Dá para pagar menos.', 'Sem placas e sem obra: você recebe créditos de uma usina solar e o desconto entra na sua conta todo mês. A distribuidora continua a mesma, e <b>10% do novo valor volta para você</b>, somando ao combo.'],
    };
    const [t, s] = textos[prod];
    const eb = { internet: 'internet', celular: 'celular', energia: 'energia' }[prod];
    return `<header class="produto__cab"><span class="dy-eyebrow dy-eyebrow--${eb}">Passo ${st.idx + 1} de ${qtd} do seu combo</span>
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

  const dots = (n) => `<div class="oferta-dots" aria-hidden="true">${'<span></span>'.repeat(n)}</div>`;
  function ligarDots(trilho) {
    const pts = $$('.oferta-dots span', trilho.parentElement);
    const marcar = () => {
      const cards = [...trilho.children]; const meio = trilho.scrollLeft + trilho.clientWidth / 2;
      let i = 0, menor = Infinity; cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - meio); if (d < menor) { menor = d; i = k; } });
      pts.forEach((p, k) => p.classList.toggle('on', k === i));
    };
    trilho.addEventListener('scroll', () => requestAnimationFrame(marcar), { passive: true });
    requestAnimationFrame(marcar);
  }
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
    const cards = DY.planosInternet.map((p) => {
      const on = sel && sel.id === p.id; const op = on ? sel.op : p.opcaoPadrao;
      const det = p.detalhes.slice(0, 3).map(([ico, r, v]) => `<li><img src="${img('icones/' + ico)}" alt=""><span>${r} <b>${v}</b></span></li>`).join('');
      const apps = p.apps.map((k) => k === 'youtube-premium' ? `<img class="yt" src="${img('apps/youtube-premium-logo.svg')}" alt="YouTube Premium">` : `<img src="${img(logos[k].src)}" alt="${logos[k].alt}">`).join('');
      const opcoes = p.opcoes.length > 1 ? `<div class="oferta__opcoes" role="radiogroup" aria-label="Escolha o streaming"><p>Personalize:</p>${p.opcoes.map((o, i) => `<button type="button" class="op-stream" role="radio" aria-checked="${i === op}" data-op="${i}">${o.logo ? `<img src="${img(logos[o.logo].src)}" alt="">` : ''}<span>${o.nome}</span><span class="op-preco">${brl(centavos(o.preco))}</span></button>`).join('')}</div>` : '';
      const preco = centavos(p.opcoes[op].preco);
      const nome = p.num + ' ' + (p.unidade === 'GIGA' ? 'Giga' : 'Mega');
      return `<div class="oferta${p.variante === 'soft' ? ' destaque' : ''}${p.variante === 'premium' ? ' premium' : ''}" role="radio" tabindex="0" aria-checked="${!!on}" aria-label="Internet ${nome}" data-id="${p.id}">
        <div class="oferta__topo"><span class="oferta__selo">${p.selo}</span><span class="oferta__check" aria-hidden="true">${CHECK}</span></div>
        <p class="oferta__vel"><b>${p.num}</b><span>${p.unidade === 'GIGA' ? 'Giga' : 'Mega'}</span></p>
        <ul class="oferta__lista">${det}</ul>
        <div class="oferta__apps">${apps}</div>
        ${opcoes}
        <div class="oferta__espaco"></div>
        <div class="oferta__preco"><s>De ${brl(centavos(p.de))}</s><div><b data-preco>${brl(preco)}</b><span>/mês</span></div><small>no débito automático</small></div>
        <div class="oferta__cb"><span>Volta para você<br><small>cashback de 50%</small></span><b data-cb>${brl(cashbackCentavos(preco, 50))}</b></div>
        <span class="oferta__escolher" aria-hidden="true">${on ? 'Plano escolhido' : 'Escolher este plano'}</span>
      </div>`;
    }).join('');
    return `<div class="ct-abas"><div class="segmento" role="radiogroup" aria-label="Para onde é a internet" data-para="internet">
        <button type="button" role="radio" aria-checked="${st.para.internet === 'casa'}" data-v="casa">Para a minha casa</button>
        <button type="button" role="radio" aria-checked="${st.para.internet === 'empresa'}" data-v="empresa">Para a minha empresa</button></div></div>
      <div><div class="ofertas" data-trilho>${cards}</div>${dots(DY.planosInternet.length)}</div>
      <p class="dy-apoio" style="text-align:center;margin-top:14px">Valores no débito automático. Wi-Fi e instalação gratuita em todos os planos.</p>`;
  }
  function ligarInternet() {
    const trilho = $('[data-trilho]', palco); ligarDots(trilho);
    ligarPara('internet');
    const escolher = (card, opIdx) => {
      const p = DY.planosInternet.find((x) => x.id === card.dataset.id);
      const op = opIdx ?? (st.rasc.internet && st.rasc.internet.id === p.id ? st.rasc.internet.op : p.opcaoPadrao);
      st.rasc.internet = { id: p.id, op };
      $$('.oferta', trilho).forEach((c) => { const on = c === card; c.setAttribute('aria-checked', on); c.querySelector('.oferta__escolher').textContent = on ? 'Plano escolhido' : 'Escolher este plano'; });
      $$('.op-stream', card).forEach((b) => b.setAttribute('aria-checked', +b.dataset.op === op));
      const preco = centavos(p.opcoes[op].preco);
      card.querySelector('[data-preco]').textContent = brl(preco);
      card.querySelector('[data-cb]').textContent = brl(cashbackCentavos(preco, 50));
      centralizar(card); atualizarBotaoAdd(); atualizarCarrinho();
    };
    trilho.addEventListener('click', (e) => {
      const card = e.target.closest('.oferta'); if (!card) return;
      const op = e.target.closest('.op-stream'); escolher(card, op ? +op.dataset.op : undefined);
    });
    trilho.addEventListener('keydown', (e) => { const card = e.target.closest('.oferta'); if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); escolher(card); } });
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
    const cards = DY.planosCelular.map((p) => {
      const on = sel && sel.id === p.id;
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
        <span class="oferta__escolher" aria-hidden="true">${on ? 'Plano escolhido' : 'Escolher este plano'}</span>
      </div>`;
    }).join('');
    const n = sel ? sel.linhas : 1;
    return `<div class="ct-abas"><div class="segmento" role="radiogroup" aria-label="Para quem são as linhas" data-para="celular">
        <button type="button" role="radio" aria-checked="${st.para.celular === 'cpf'}" data-v="cpf">Para mim (CPF)</button>
        <button type="button" role="radio" aria-checked="${st.para.celular === 'cnpj'}" data-v="cnpj">Para a empresa (CNPJ)</button></div></div>
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
  function atualizarCarrinho() {
    const l = itens(telaAtual === 'combo' ? 'misto' : 'esc');
    $('[data-carrinho-qtd]').textContent = l.length;
    $('[data-carrinho-resumo]').textContent = l.length ? l.map((i) => ROTULO[i.produto]).join(' + ') : 'Nenhum serviço ainda';
    $('[data-carrinho-cb]').textContent = brl(somaCb(l));
    $('[data-carrinho-lista]').innerHTML = l.length ? '<ul style="display:flex;flex-direction:column;gap:10px">' + l.map((i) => `<li><span><b>${i.titulo}</b><br>${i.detalhe}</span><span>${brl(i.cashback)}</span></li>`).join('') + '</ul>' : '<p>Escolha pelo menos um serviço para montar o combo.</p>';
    if (['combo', 'resumo', 'contato', 'cadastro', 'pagamento'].includes(telaAtual)) car.hidden = false;
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
    const faltam = ['internet', 'celular', 'energia'].filter((p) => !st.esc[p] && !(p === 'internet' && st.fibra === 'nao'));
    const ico = { internet: 'hero-wifi.svg', celular: 'hero-celular-5g.svg', energia: 'hero-lampada.svg' };
    const mensal = l.filter((i) => i.produto !== 'energia').reduce((a, i) => a + i.mensal, 0);
    $('[data-resumo]').innerHTML = (l.length ? '' : '<div class="aviso aviso--info"><img src="img/icones/aviso-info.svg" alt=""><span>O seu combo está vazio. Para seguir, escolha <b>pelo menos um serviço</b> abaixo.</span></div>')
      + l.map((i) => `<div class="item-combo"><span class="item-combo__ico i-${i.produto}"><img src="${img('icones/' + ico[i.produto])}" alt=""></span>
        <span class="item-combo__txt"><b>${i.titulo}</b><span>${i.detalhe}</span><em>Cashback: ${brl(i.cashback)}</em></span>
        <button class="item-combo__acao" type="button" data-editar="${i.produto}" aria-label="Alterar ${ROTULO[i.produto]}">Alterar</button></div>`).join('')
      + faltam.map((p) => `<div class="item-combo item-combo--vazio"><span class="item-combo__ico i-${p}"><img src="${img('icones/' + ico[p])}" alt=""></span>
        <span class="item-combo__txt"><b>${{ internet: 'Internet Fibra', celular: 'Planos de Celular', energia: 'Energia Solar por Assinatura' }[p]}</b><span>${{ internet: '50% da mensalidade volta para você', celular: '100% do valor das linhas volta para você', energia: '10% da nova conta volta para você' }[p]}</span></span>
        <button class="item-combo__acao" type="button" data-editar="${p}">+ Adicionar</button></div>`).join('')
      + (l.length ? `<div class="resumo__total"><div><span>Cashback total</span><b>${brl(somaCb(l))}</b></div><small>Pago uma única vez, no seu PIX, quando o contrato fecha.${mensal ? ` Mensalidade de internet e celular: ${brl(mensal)}/mês no débito.` : ''}${st.esc.energia ? ' Na energia, a economia vem todo mês na conta de luz.' : ''}</small></div>` : '')
      + `<div class="resumo__zap"><img src="img/apps/whatsapp.svg" alt=""><span><b>Uma conversa só.</b> Dúvidas, contrato e suporte de todos os serviços no mesmo WhatsApp — em vez de três números diferentes.</span></div>`;
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

  function montarPedido(etapa) {
    const l = itens();
    const utm = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid'].forEach((k) => q.get(k) && (utm[k] = q.get(k)));
    return {
      id: st.id, etapa, origem: st.origem, atualizado_em: new Date().toISOString(),
      endereco: { ...st.end }, fibra_viabilidade: st.fibra,
      itens: l.map(({ linhaZap, ...resto }) => resto), cashback_total_centavos: somaCb(l),
      nome: st.contato.nome, telefone: st.contato.telefone, email: st.cad.email, cpf: st.cad.cpf, cnpj: st.cad.cnpj,
      consentimento: st.cad.consent, pagamento: { ...st.pag }, utm,
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
      .replace('Meu pedido é', `Forma de pagamento: ${st.pag.tipo === 'debito' ? 'Débito automático (' + st.pag.banco + ')' : 'Boleto ou PIX'}\nMeu pedido é`);
    $('[data-zap-pedido]').href = DY.linkWhatsApp(msg);
    $('[data-num-pedido]').textContent = st.id;
    $('[data-fim-cb]').textContent = brl(somaCb(l));
    $('[data-fim-itens]').innerHTML = l.map((i) => `<li><span>${i.titulo}</span><span>${brl(i.cashback)}</span></li>`).join('');
    car.hidden = true;
    try { sessionStorage.removeItem('dy_endereco'); } catch (er) { /* */ }
    mostrar('fim');
  });

  document.querySelectorAll('[data-ano]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
