/* ============================================================
   Do Yourself — Simulador de Cashback
   Regras: wiki/estrutura-site/componente-simulador-cashback.md
   · roda só no navegador, sem CEP e sem rede
   · energia: desconto estimado fixo de 20%, cashback 10% sobre a conta nova
   · internet 50% · celular 100% · trunca no centavo
   · aviso amarelo só com Energia marcada
   ============================================================ */
(function () {
  const { brl, cashbackCentavos, config } = DY;

  const INTERNET = {
    500: { preco: 9999, rotulo: '500 Mb', detalhe: '500 Mb de velocidade' },
    600: { preco: 10999, rotulo: '600 Mb + Streaming', detalhe: '600 Mb de velocidade com streaming' },
    1000: { preco: 12999, rotulo: '1000 Mb + Wi-Fi 6', detalhe: '1000 Mb de velocidade com Wi-Fi 6' },
  };
  const CELULAR = { 12: 4499, 30: 5299, 50: 6999 };
  const DESCONTO_ENERGIA = 0.20;

  // Estado inicial = estado 8 do Figma (os três serviços)
  const estado = {
    energia: { on: true, conta: 20176 },
    internet: { on: true, plano: 1000 },
    celular: { on: true, franquia: 30, linhas: 2 },
  };

  function calcular() {
    const linhas = [];
    let servicos = 0, cashback = 0;
    if (estado.energia.on && estado.energia.conta > 0) {
      const nova = estado.energia.conta * (1 - DESCONTO_ENERGIA);        // centavos, pode ter fração
      const cb = cashbackCentavos(nova, 10);
      linhas.push({ id: 'energia', produto: 'Energia', pct: 10, valor: cb, detalhe: `Conta de ${brl(estado.energia.conta)} que ficaria em ${brl(Math.round(nova))} por mês` });
      servicos += nova; cashback += cb;
    }
    if (estado.internet.on) {
      const p = INTERNET[estado.internet.plano];
      const cb = cashbackCentavos(p.preco, 50);
      linhas.push({ id: 'internet', produto: 'Internet Fibra', pct: 50, valor: cb, detalhe: `${p.detalhe}, ${brl(p.preco)} por mês` });
      servicos += p.preco; cashback += cb;
    }
    if (estado.celular.on) {
      const unit = CELULAR[estado.celular.franquia];
      const n = estado.celular.linhas;
      const total = unit * n;
      const cb = cashbackCentavos(total, 100);
      const detalhe = n === 1
        ? `1 linha de ${estado.celular.franquia} GB — ${brl(total)} por mês`
        : `${n} linhas de ${estado.celular.franquia} GB, ${brl(unit)} cada — ${brl(total)} por mês`;
      linhas.push({ id: 'celular', produto: 'Planos de Celular', pct: 100, valor: cb, detalhe });
      servicos += total; cashback += cb;
    }
    return { linhas, servicos: Math.round(servicos), cashback };
  }

  function origem() {
    const on = ['energia', 'internet', 'celular'].filter((k) => estado[k].on);
    return on.length === 1 ? on[0] : 'combo';
  }

  function render(raiz) {
    const vazio = !estado.energia.on && !estado.internet.on && !estado.celular.on;
    const r = calcular();

    ['energia', 'internet', 'celular'].forEach((k) => {
      raiz.querySelector(`[data-servico="${k}"]`).setAttribute('aria-pressed', estado[k].on);
      raiz.querySelector(`[data-config="${k}"]`).hidden = !estado[k].on;
    });
    raiz.querySelector('[data-vazio]').hidden = !vazio;
    raiz.querySelectorAll('[data-com-resultado]').forEach((el) => (el.hidden = vazio));
    document.querySelector('[data-aviso-energia]').hidden = !estado.energia.on;

    // Energia
    const nova = Math.round(estado.energia.conta * (1 - DESCONTO_ENERGIA));
    raiz.querySelector('[data-conta-nova]').textContent = estado.energia.conta > 0 ? `Sua conta ficaria em ${brl(nova)}` : 'Informe o valor da sua conta';

    // Internet
    raiz.querySelectorAll('[data-internet]').forEach((b) => b.setAttribute('aria-checked', +b.dataset.internet === estado.internet.plano));
    // Celular
    raiz.querySelectorAll('[data-franquia]').forEach((b) => b.setAttribute('aria-checked', +b.dataset.franquia === estado.celular.franquia));
    raiz.querySelector('[data-linhas-sim]').textContent = estado.celular.linhas;
    const unit = CELULAR[estado.celular.franquia], n = estado.celular.linhas;
    raiz.querySelector('[data-resumo-cel]').textContent = `${n} ${n === 1 ? 'linha' : 'linhas'} de ${estado.celular.franquia} GB — ${brl(unit * n)} por mês`;

    // Resultado
    raiz.querySelector('[data-total-servicos]').textContent = brl(r.servicos);
    raiz.querySelector('[data-total-cashback]').textContent = brl(r.cashback);
    raiz.querySelector('[data-resultado]').innerHTML = r.linhas.map((l) => `
      <div class="resultado__item">
        <div class="resultado__txt"><h5>${l.produto} - <span>Cashback de ${l.pct}%</span></h5><p>${l.detalhe}</p></div>
        <div class="resultado__valor"><small>Você recebe:</small><b>${brl(l.valor)}</b></div>
      </div>`).join('');

    // CTA leva as escolhas para a Área de Conversão
    const cta = raiz.querySelector('[data-cta-sim]');
    const apoio = raiz.querySelector('[data-cta-apoio]');
    if (vazio) {
      cta.setAttribute('aria-disabled', 'true'); cta.classList.add('desativado'); cta.removeAttribute('href');
      apoio.textContent = 'Selecione um serviço para liberar a simulação.';
    } else {
      const q = new URLSearchParams({ origem: origem() });
      if (estado.energia.on) q.set('conta', (estado.energia.conta / 100).toFixed(2));
      if (estado.internet.on) q.set('internet', estado.internet.plano);
      if (estado.celular.on) { q.set('franquia', estado.celular.franquia); q.set('linhas', estado.celular.linhas); }
      cta.removeAttribute('aria-disabled'); cta.classList.remove('desativado');
      cta.href = config.paginaConversao + '?' + q;
      apoio.textContent = 'Leva 1 minuto, não tem compromisso e você confirma tudo antes de fechar.';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const raiz = document.querySelector('[data-simulador]');
    if (!raiz) return;
    const campo = raiz.querySelector('[data-conta]');

    const formatarCampo = () => { campo.value = (estado.energia.conta / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
    formatarCampo();
    campo.addEventListener('input', () => {
      // Digitação estilo maquininha: os dígitos viram centavos
      const dig = campo.value.replace(/\D/g, '').slice(0, 7);
      estado.energia.conta = +dig || 0;
      formatarCampo();
      render(raiz);
    });

    raiz.addEventListener('click', (e) => {
      const s = e.target.closest('[data-servico]');
      if (s) { const k = s.dataset.servico; estado[k].on = !estado[k].on; render(raiz); return; }
      const i = e.target.closest('[data-internet]');
      if (i) { estado.internet.plano = +i.dataset.internet; render(raiz); return; }
      const f = e.target.closest('[data-franquia]');
      if (f) { estado.celular.franquia = +f.dataset.franquia; render(raiz); return; }
      const l = e.target.closest('[data-linhas-passo]');
      if (l) { estado.celular.linhas = Math.max(1, Math.min(99, estado.celular.linhas + +l.dataset.linhasPasso)); render(raiz); }
    });
    render(raiz);
  });
})();
