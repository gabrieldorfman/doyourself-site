/* ============================================================
   Do Yourself — página inicial v2
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos } = DY;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const so = (v) => String(v || '').replace(/\D/g, '');
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHECK = '<svg viewBox="0 0 14 14"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const XIS = '<svg viewBox="0 0 14 14"><path d="M3.5 3.5l7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Exemplos calculados com os preços do config (nunca ficam desatualizados) ---------- */
    const p800 = DY.planosInternet.find((p) => p.id === '800');
    const pInt = centavos(p800.opcoes[0].preco);
    const p30 = DY.planosCelular.find((p) => p.id === '30');
    const pCel = centavos(p30.preco) * 3;
    const en = DY.energia.simular(800);
    const ex = { internet: cashbackCentavos(pInt, 50), celular: cashbackCentavos(pCel, 100), energia: en.cashback };
    ex.total = ex.internet + ex.celular + ex.energia;
    $$('[data-ex="internet"]').forEach((e) => (e.textContent = brl(ex.internet)));
    $$('[data-ex="internet-preco"]').forEach((e) => (e.textContent = brl(pInt)));
    $$('[data-ex="internet-desc"]').forEach((e) => (e.textContent = brl(pInt) + '/mês'));
    $$('[data-ex="celular"]').forEach((e) => (e.textContent = brl(ex.celular)));
    $$('[data-ex="celular-desc"]').forEach((e) => (e.textContent = brl(pCel) + '/mês'));
    $$('[data-ex="energia"]').forEach((e) => (e.textContent = brl(ex.energia)));
    $$('[data-ex="energia-desc"]').forEach((e) => (e.textContent = 'conta de ' + brl(en.conta)));
    $$('[data-ex="total"]').forEach((e) => (e.textContent = brl(ex.total)));

    // Pilha do hero: os cartões entram um a um e o total "conta" até o valor
    const pilha = $('[data-pilha]');
    if (pilha) {
      requestAnimationFrame(() => pilha.classList.add('ativa'));
      const alvo = $('[data-contador]', pilha);
      if (!reduzir) {
        // o total começa a contar depois que o cartão dele aparece (4º da fila: 0,3 s + 3 × 0,5 s)
        const dur = 1600, ini = performance.now() + 2100;
        const passo = (t) => {
          const k = Math.min(1, Math.max(0, (t - ini) / dur)); const e = 1 - Math.pow(1 - k, 3);
          alvo.textContent = brl(Math.round(ex.total * e));
          if (k < 1) requestAnimationFrame(passo);
        };
        alvo.textContent = brl(0); requestAnimationFrame(passo);
      }
    }

    /* ---------- Consulta de CEP do topo → página de contratação ---------- */
    const form = $('[data-hero-cep]');
    const inCep = $('#h-cep'), inNum = $('#h-num'), msg = $('[data-hero-msg]');
    const marcar = (g, ok, erro) => {
      const c = $(`[data-g="${g}"] .campo`); c.classList.toggle('valido', ok); c.classList.toggle('invalido', !!erro);
      c.querySelector('.campo__ico').innerHTML = ok ? CHECK : XIS;
    };
    inCep.addEventListener('input', () => {
      const d = so(inCep.value).slice(0, 8); inCep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
      marcar('cep', d.length === 8, false); msg.textContent = '';
      if (d.length === 8 && !inNum.value) inNum.focus();
    });
    inNum.addEventListener('input', () => { inNum.value = inNum.value.replace(/[^\dsSnN/]/g, '').toUpperCase().slice(0, 6); marcar('num', !!inNum.value.trim(), false); msg.textContent = ''; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cep = so(inCep.value);
      if (cep.length !== 8) { marcar('cep', false, true); msg.textContent = 'Digite os 8 números do CEP. Se não souber, toque em “Não sei o meu CEP”.'; inCep.focus(); return; }
      if (!inNum.value.trim()) { marcar('num', false, true); msg.textContent = 'Agora o número do imóvel — é ele que confirma a fibra na sua rua. Sem número? Escreva S/N.'; inNum.focus(); return; }
      try { sessionStorage.setItem('dy_endereco', JSON.stringify({ cep, numero: inNum.value.trim() })); } catch (er) { /* modo privado */ }
      form.querySelector('.consulta-cep__btn').classList.add('indo');
      location.href = DY.config.paginaConversao + '?origem=home';
    });

    /* ---------- Simulador de energia ---------- */
    const sim = $('[data-simula]');
    if (sim) {
      const input = $('#s-conta', sim);
      const set = (k, v) => ($(`[data-s="${k}"]`, sim).textContent = v);
      const calc = () => {
        const reais = Number(so(input.value)) / 100;
        input.closest('.campo').classList.toggle('preenchido', !!input.value);
        $$('.chip-op', sim).forEach((c) => c.setAttribute('aria-pressed', +c.dataset.v === reais));
        const r = DY.energia.simular(reais);
        sim.classList.toggle('com-res', !!reais && r.elegivel);
        if (!reais) { ['economia', 'ano', 'cb'].forEach((k) => set(k, '—')); set('nota', 'Estimativa de até 18% de desconto. O valor exato depende da cidade, da distribuidora e da sua fatura.'); return; }
        if (!r.elegivel) { ['economia', 'ano', 'cb'].forEach((k) => set(k, '—')); set('nota', 'Para contas abaixo de R$ 150 a assinatura ainda não compensa. Tem outra unidade, como um comércio? Fale com a gente.'); return; }
        set('economia', brl(r.economiaMes)); set('ano', brl(r.economiaMes * 12)); set('cb', brl(r.cashback));
        set('nota', `Estimativa com ${r.pct}% de desconto: a conta passaria de ${brl(r.conta)} para cerca de ${brl(r.comDesconto)}. O valor exato depende da cidade, da distribuidora e da sua fatura.`);
      };
      input.addEventListener('input', () => { const d = so(input.value).slice(0, 8); input.value = d ? (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''; calc(); });
      $$('.chip-op', sim).forEach((c) => c.addEventListener('click', () => { input.value = (+c.dataset.v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); calc(); }));
    }

    /* ---------- Barra fixa "Consultar meu endereço" (celular) ---------- */
    const barra = $('[data-barra-cep]'); const zap = $('.zap-flutuante');
    const io = new IntersectionObserver(([en2]) => {
      const mostrar = !en2.isIntersecting && en2.boundingClientRect.top < 0;
      barra.classList.toggle('on', mostrar); barra.setAttribute('aria-hidden', !mostrar);
      $('[data-ir-cep]', barra).tabIndex = mostrar ? 0 : -1;
      zap.classList.toggle('subir', mostrar && matchMedia('(max-width: 767px)').matches);
    }, { threshold: 0 });
    io.observe(form);
    $('[data-ir-cep]').addEventListener('click', (e) => {
      e.preventDefault();
      form.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
      setTimeout(() => inCep.focus({ preventScroll: true }), reduzir ? 0 : 500);
    });

    /* ---------- Conversa do WhatsApp: mensagens aparecem ao rolar ---------- */
    const chat = $('[data-chat]');
    if (chat) new IntersectionObserver((ents, obs) => ents.forEach((en3) => {
      if (!en3.isIntersecting) return;
      $$('.msg', chat).forEach((m, i) => setTimeout(() => m.classList.add('on'), reduzir ? 0 : 400 + i * 900));
      obs.disconnect();
    }), { threshold: .3 }).observe(chat);
  });
})();
