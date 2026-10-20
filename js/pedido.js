/* ============================================================
   Do Yourself — pedido: máscaras, validações, APIs e Supabase
   Usado pela página de contratação (contratar.html).
   ============================================================ */
(function () {
  const DY = window.DY;
  const so = (v) => String(v || '').replace(/\D/g, '');

  /* ---------- Máscaras ---------- */
  DY.mascara = {
    cep: (v) => { const d = so(v).slice(0, 8); return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; },
    telefone: (v) => {
      const d = so(v).slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    },
    cpf: (v) => { const d = so(v).slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2'); },
    cnpj: (v) => { const d = so(v).slice(0, 14); return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2'); },
    reais: (v) => DY.formatarReais(v),
    moeda: (v) => { const d = so(v).slice(0, 8); if (!d) return ''; return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); },
  };

  /* ---------- Validações (mensagens escritas para qualquer idade) ---------- */
  const DDDS = new Set('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' '));
  function cpfOk(v) {
    const d = so(v); if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (let t = 9; t < 11; t++) { let s = 0; for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i); if (((s * 10) % 11) % 10 !== +d[t]) return false; }
    return true;
  }
  function cnpjOk(v) {
    const d = so(v); if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const calc = (n) => { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += +d[i] * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return calc(12) === +d[12] && calc(13) === +d[13];
  }
  DY.validar = {
    cep: (v) => (so(v).length === 8 ? '' : 'Digite os 8 números do CEP.'),
    numero: (v) => (String(v).trim() ? '' : 'Informe o número do imóvel. Se não tiver, escreva S/N.'),
    comp: (v) => (String(v).trim().length >= 1 ? '' : 'Escreva o número ou o detalhe. Ex.: 302, Bloco B.'),
    nome: (v) => {
      const p = String(v).trim().split(/\s+/).filter((x) => x.length >= 2);
      if (!String(v).trim()) return 'Precisamos do seu nome completo.';
      if (p.length < 2) return 'Escreva o nome e o sobrenome, como no documento.';
      if (/\d/.test(v)) return 'O nome não pode ter números.';
      return '';
    },
    telefone: (v) => {
      const d = so(v);
      if (d.length < 10) return 'Confira se o número está completo, com o DDD.';
      if (!DDDS.has(d.slice(0, 2))) return 'Esse DDD não existe. Confira os 2 primeiros números.';
      if (d.length !== 11 || d[2] !== '9') return 'Precisa ser um celular com WhatsApp (começa com 9 depois do DDD).';
      return '';
    },
    email: (v) => (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()) ? '' : 'Esse e-mail parece incompleto. Ex.: seunome@gmail.com'),
    cpf: (v) => (so(v).length < 11 ? 'O CPF tem 11 números.' : cpfOk(v) ? '' : 'Esse CPF não é válido. Confira os números.'),
    cnpj: (v) => (so(v).length < 14 ? 'O CNPJ tem 14 números.' : cnpjOk(v) ? '' : 'Esse CNPJ não é válido. Confira os números.'),
  };
  DY.so = so;

  /* ---------- CEP: BrasilAPI → ViaCEP ---------- */
  const cacheCep = {};
  DY.buscarCep = async function (cep) {
    cep = so(cep);
    if (cacheCep[cep]) return cacheCep[cep];
    const tentar = async (url, mapa) => {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
      try { const r = await fetch(url, { signal: ctrl.signal }); if (!r.ok) return null; const d = await r.json(); return mapa(d); } catch (e) { return null; } finally { clearTimeout(t); }
    };
    const r = await tentar('https://brasilapi.com.br/api/cep/v1/' + cep, (d) => ({ logradouro: d.street || '', bairro: d.neighborhood || '', cidade: d.city || '', uf: d.state || '' }))
      || await tentar('https://viacep.com.br/ws/' + cep + '/json/', (d) => (d.erro ? null : { logradouro: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', uf: d.uf || '' }));
    if (r) cacheCep[cep] = r;
    return r;
  };

  /* ---------- Supabase (REST/RPC com a chave publicável) ---------- */
  const sb = async (rota, corpo) => {
    const { supabaseUrl: url, supabaseChave: chave } = DY.config;
    if (!url || !chave) throw new Error('sem-supabase');
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/' + rota, {
        method: 'POST', signal: ctrl.signal,
        headers: { apikey: chave, Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (!r.ok) throw new Error('http-' + r.status);
      const txt = await r.text(); return txt ? JSON.parse(txt) : null;
    } finally { clearTimeout(t); }
  };

  /* Viabilidade de fibra: RPC consultar_viabilidade_fibra(p_cep, p_numero) → 'sim' | 'nao' | 'talvez' */
  DY.consultarViabilidade = async function (cep, numero) {
    try {
      const r = await sb('rpc/consultar_viabilidade_fibra', { p_cep: so(cep), p_numero: String(numero) });
      return r === 'sim' || r === 'nao' ? r : 'talvez';
    } catch (e) { return 'talvez'; } // sem banco ou fora do ar: a fibra fica "a confirmar" no WhatsApp
  };

  /* Pedido: RPC registrar_pedido_site(p_pedido jsonb) — grava e atualiza pelo id (upsert) */
  DY.salvarPedido = async function (pedido) {
    try { await sb('rpc/registrar_pedido_site', { p_pedido: pedido }); return true; }
    catch (e) {
      // Modo demonstração: guarda só no navegador para conferência (sem banco configurado)
      try { localStorage.setItem('dy_ultimo_pedido_demo', JSON.stringify({ ...pedido, cpf: pedido.cpf ? '***' : '', cnpj: pedido.cnpj ? '***' : '' })); } catch (er) { /* sem storage */ }
      if (window.console) console.info('[Do Yourself] Pedido em modo demonstração (Supabase não configurado):', pedido.id, pedido.etapa);
      return false;
    }
  };

  /* ---------- Número do pedido: DY + data + 4 caracteres ---------- */
  DY.novoIdPedido = function () {
    const d = new Date();
    const data = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rnd = crypto.getRandomValues(new Uint8Array(4));
    return 'DY-' + data + '-' + [...rnd].map((n) => alfabeto[n % alfabeto.length]).join('');
  };

  /* ---------- Mensagem do WhatsApp (sem dado pessoal: só produtos e nº do pedido) ---------- */
  DY.mensagemPedido = function (pedido) {
    const linhas = pedido.itens.map((it) => '- ' + it.linhaZap);
    return ['Olá, Do Yourself!', 'Eu gostaria de contratar os seguintes produtos:', '', ...linhas, '', 'Meu pedido é o ' + pedido.id + '.'].join('\n');
  };
})();
