/* ============================================================
   Do Yourself — Widget de consulta de CEP (Hero)
   Estado A: CEP + número · Estado B/C: "Não sei meu CEP"
   (UF → cidade → rua, com a faixa de numeração de cada CEP)
   Lógica: Cerebro/wiki/estrutura-site-novo-isolutions-AGOSTO/pagina-consulta-cep.md
   APIs: BrasilAPI → ViaCEP (fallback) · IBGE (municípios)
   ============================================================ */
(function () {
  const UFS = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']];
  const cache = {};

  const soDigitos = (v) => v.replace(/\D/g, '');
  const mascaraCep = (v) => { const d = soDigitos(v).slice(0, 8); return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; };

  async function buscarCep(cep) {
    if (cache[cep]) return cache[cep];
    try {
      const r = await fetch('https://brasilapi.com.br/api/cep/v1/' + cep);
      if (r.ok) { const d = await r.json(); return (cache[cep] = { logradouro: d.street || '', bairro: d.neighborhood || '', cidade: d.city || '', uf: d.state || '' }); }
    } catch (e) { /* tenta o ViaCEP */ }
    try {
      const r = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
      if (r.ok) { const d = await r.json(); if (!d.erro) return (cache[cep] = { logradouro: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', uf: d.uf || '' }); }
    } catch (e) { /* sem rede */ }
    return null;
  }

  // Faixa de numeração vem no "complemento" do ViaCEP (ex.: "até 1239/1240", "de 1241/1242 a 3519/3520")
  const faixa = (c) => (/^(até|de|lado)\b/i.test(c || '') ? c : '');

  document.addEventListener('DOMContentLoaded', () => {
    const raiz = document.querySelector('[data-cep]');
    if (!raiz) return;
    const form = raiz.querySelector('.cep__form');
    const inCep = raiz.querySelector('[name="cep"]');
    const inNum = raiz.querySelector('[name="numero"]');
    const btn = form.querySelector('.cep__btn');
    const msg = raiz.querySelector('.cep__msg');
    const link = raiz.querySelector('.cep__link');
    const busca = raiz.querySelector('.cep__busca');
    const selUf = busca.querySelector('[name="uf"]');
    const inCidade = busca.querySelector('[name="cidade"]');
    const listaCidades = busca.querySelector('#lista-cidades');
    const inRua = busca.querySelector('[name="rua"]');
    const sugestoes = busca.querySelector('.cep__sugestoes');

    selUf.innerHTML = '<option value="">Escolha</option>' + UFS.map(([s, n]) => `<option value="${s}">${s} — ${n}</option>`).join('');

    const aviso = (texto, tipo = '') => { msg.textContent = texto; msg.className = 'cep__msg ' + tipo; };

    inCep.addEventListener('input', () => { inCep.value = mascaraCep(inCep.value); form.classList.remove('erro'); aviso(''); if (soDigitos(inCep.value).length === 8) inNum.focus(); });
    inNum.addEventListener('input', () => { inNum.value = inNum.value.replace(/[^\dsSnN/]/g, '').slice(0, 6); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cep = soDigitos(inCep.value);
      if (cep.length !== 8) { form.classList.add('erro'); aviso('Digite os 8 números do CEP.', 'erro'); inCep.focus(); return; }
      if (!inNum.value.trim()) { form.classList.add('erro'); aviso('Informe o número do imóvel — é ele que confirma a cobertura na sua rua.', 'erro'); inNum.focus(); return; }
      btn.classList.add('carregando'); btn.disabled = true;
      const end = await buscarCep(cep);
      btn.classList.remove('carregando'); btn.disabled = false;
      if (!end) { form.classList.add('erro'); aviso('Não encontramos esse CEP. Confira os números ou use “Não sei meu CEP”.', 'erro'); return; }
      const linha = [end.logradouro && `${end.logradouro}, ${inNum.value}`, end.bairro, `${end.cidade}/${end.uf}`].filter(Boolean).join(' · ');
      aviso('Encontramos: ' + linha, 'ok');
      // Guarda o endereço para a Área de Conversão (o complemento nunca vai na URL)
      try { sessionStorage.setItem('dy_endereco', JSON.stringify({ cep, numero: inNum.value, ...end, em: new Date().toISOString() })); } catch (err) { /* modo privado */ }
      const q = new URLSearchParams({ origem: 'home', cep, numero: inNum.value, uf: end.uf.toLowerCase(), cidade: end.cidade });
      setTimeout(() => { window.location.href = DY.config.paginaConversao + '?' + q; }, 900);
    });

    /* ---------- Não sei meu CEP ---------- */
    let modoBusca = false;
    link.addEventListener('click', () => {
      modoBusca = !modoBusca;
      busca.hidden = !modoBusca;
      form.hidden = modoBusca;
      link.textContent = modoBusca ? '← Voltar e digitar meu CEP' : '→ Não sei meu CEP.';
      aviso('');
      if (modoBusca) selUf.focus(); else inCep.focus();
    });

    selUf.addEventListener('change', async () => {
      inCidade.value = ''; inRua.value = ''; inRua.disabled = true; sugestoes.innerHTML = ''; sugestoes.hidden = true;
      inCidade.disabled = !selUf.value;
      listaCidades.innerHTML = '';
      if (!selUf.value) return;
      try {
        const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selUf.value}/municipios?orderBy=nome`);
        const cidades = await r.json();
        listaCidades.innerHTML = cidades.map((c) => `<option value="${c.nome}">`).join('');
      } catch (e) { /* sem lista, o campo continua livre */ }
      inCidade.focus();
    });
    inCidade.addEventListener('input', () => { inRua.disabled = inCidade.value.trim().length < 3; });

    let espera;
    inRua.addEventListener('input', () => {
      clearTimeout(espera);
      const rua = inRua.value.trim();
      if (rua.length < 3) { sugestoes.hidden = true; return; }
      espera = setTimeout(async () => {
        try {
          const url = `https://viacep.com.br/ws/${selUf.value}/${encodeURIComponent(inCidade.value.trim())}/${encodeURIComponent(rua)}/json/`;
          const lista = await (await fetch(url)).json();
          if (!Array.isArray(lista) || !lista.length) { sugestoes.innerHTML = '<p style="padding:10px 12px;font-size:13px">Nenhuma rua encontrada com esse nome. Confira a grafia.</p>'; sugestoes.hidden = false; return; }
          sugestoes.innerHTML = lista.slice(0, 30).map((d) => `
            <button type="button" data-cep-sug="${soDigitos(d.cep)}">
              <strong>${d.logradouro}</strong><span class="faixa">${faixa(d.complemento)}</span>
              <span class="local">${d.bairro} — ${d.localidade}/${d.uf} — CEP: ${d.cep}</span>
            </button>`).join('');
          sugestoes.hidden = false;
        } catch (e) { sugestoes.hidden = true; }
      }, 350);
    });
    sugestoes.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cep-sug]');
      if (!b) return;
      inCep.value = mascaraCep(b.dataset.cepSug);
      link.click();
      aviso('CEP preenchido. Agora informe o número do imóvel.', 'ok');
      inNum.focus();
    });
  });
})();
