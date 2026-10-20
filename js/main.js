/* ============================================================
   Do Yourself — comportamento geral do site
   ============================================================ */
(function () {
  /* ---------- Tema claro / escuro ---------- */
  const raiz = document.documentElement;
  const salvar = (t) => { try { localStorage.setItem('dy_tema', t); } catch (e) { /* sem storage */ } };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-tema-toggle]')) return;
    const novo = raiz.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    raiz.dataset.tema = novo; salvar(novo);
    document.querySelectorAll('[data-tema-toggle]').forEach((b) => b.setAttribute('aria-label', novo === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'));
  });

  document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Links de WhatsApp ---------- */
    document.querySelectorAll('[data-whatsapp]').forEach((a) => {
      a.href = DY.linkWhatsApp(a.dataset.whatsapp || 'Olá! Vim pelo site da Do Yourself.');
      a.target = '_blank'; a.rel = 'noopener';
    });
    document.querySelectorAll('[data-whatsapp-numero]').forEach((el) => (el.textContent = DY.config.whatsappExibicao));

    /* ---------- Submenus do desktop ---------- */
    const fecharSubmenus = (exceto) => document.querySelectorAll('.nav [aria-expanded="true"]').forEach((b) => {
      if (b === exceto) return;
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).classList.remove('aberto');
    });
    document.querySelectorAll('.nav [aria-controls]').forEach((b) => {
      const sub = document.getElementById(b.getAttribute('aria-controls'));
      const alternar = (abrir) => { fecharSubmenus(b); b.setAttribute('aria-expanded', abrir); sub.classList.toggle('aberto', abrir); };
      b.addEventListener('click', (e) => { e.stopPropagation(); alternar(b.getAttribute('aria-expanded') !== 'true'); });
      const li = b.closest('li');
      li.addEventListener('mouseenter', () => matchMedia('(hover: hover)').matches && alternar(true));
      li.addEventListener('mouseleave', () => matchMedia('(hover: hover)').matches && alternar(false));
    });
    document.addEventListener('click', () => fecharSubmenus());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharSubmenus(); fecharDrawer(); } });

    /* ---------- Drawer (tablet/mobile) ---------- */
    const btnMenu = document.querySelector('.btn-menu');
    const drawer = document.getElementById('drawer');
    const rotuloMenu = btnMenu ? btnMenu.querySelector('.btn-menu__txt') : null;
    function fecharDrawer() {
      if (!drawer || !drawer.classList.contains('aberto')) return;
      drawer.classList.remove('aberto'); btnMenu.setAttribute('aria-expanded', 'false'); rotuloMenu.textContent = 'Menu';
      document.body.classList.remove('menu-aberto');
    }
    if (btnMenu && drawer) btnMenu.addEventListener('click', () => {
      const abrir = !drawer.classList.contains('aberto');
      if (!abrir) return fecharDrawer();
      drawer.classList.add('aberto'); btnMenu.setAttribute('aria-expanded', 'true'); rotuloMenu.textContent = 'Fechar';
      document.body.classList.add('menu-aberto');
    });
    if (drawer) drawer.addEventListener('click', (e) => {
      const item = e.target.closest('[data-sub]');
      if (item) {
        const aberto = item.getAttribute('aria-expanded') === 'true';
        item.setAttribute('aria-expanded', !aberto);
        item.querySelector('.drawer__glifo').textContent = aberto ? '+' : '–';
        document.getElementById(item.dataset.sub).hidden = aberto;
      } else if (e.target.closest('a')) fecharDrawer();
    });
    matchMedia('(min-width: 1200px)').addEventListener('change', (m) => m.matches && fecharDrawer());

    /* ---------- Rodapé: colunas viram acordeão no mobile ---------- */
    document.querySelectorAll('.rodape__col-titulo').forEach((t) => t.addEventListener('click', () => {
      if (!matchMedia('(max-width: 767px)').matches) return;
      const col = t.closest('.rodape__col');
      const aberto = col.classList.toggle('aberto');
      t.setAttribute('aria-expanded', aberto);
      t.querySelector('.glifo').textContent = aberto ? '–' : '+';
    }));
    document.querySelector('.rodape__subir')?.addEventListener('click', () => window.scrollTo({ top: 0 }));

    /* ---------- FAQ: abas + acordeão ---------- */
    const faq = document.querySelector('[data-faq]');
    if (faq) {
      faq.addEventListener('click', (e) => {
        const aba = e.target.closest('[role="tab"]');
        if (aba) {
          faq.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', t === aba));
          faq.querySelectorAll('[role="tabpanel"]').forEach((p) => (p.hidden = p.id !== aba.getAttribute('aria-controls')));
          return;
        }
        const btn = e.target.closest('.pergunta__btn');
        if (!btn) return;
        const p = btn.closest('.pergunta');
        const abrir = !p.classList.contains('aberta');
        p.classList.toggle('aberta', abrir);
        btn.setAttribute('aria-expanded', abrir);
        const ico = btn.querySelector('img'); if (ico) ico.src = 'img/icones/faq-' + (abrir ? 'aberta' : 'fechada') + '.svg';
      });
    }

    /* ---------- Indicador dos trilhos (mobile) ---------- */
    document.querySelectorAll('.trilho-wrap').forEach((w) => {
      const trilho = w.querySelector('.trilho');
      const pontos = w.querySelector('.indicador__pontos');
      const itens = [...trilho.children];
      pontos.innerHTML = itens.map(() => '<span></span>').join('');
      const marcar = () => {
        const passo = itens.length > 1 ? itens[1].offsetLeft - itens[0].offsetLeft : 1;
        const fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
        const i = fim ? itens.length - 1 : Math.round(trilho.scrollLeft / passo);
        [...pontos.children].forEach((p, k) => p.classList.toggle('ativo', k === i));
      };
      trilho.addEventListener('scroll', () => requestAnimationFrame(marcar), { passive: true });
      marcar();
    });

    /* ---------- Revelar ao rolar + conversa do WhatsApp ---------- */
    const io = new IntersectionObserver((entradas) => entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('visivel');
      if (en.target.matches('.chat')) en.target.querySelectorAll('[data-anima]').forEach((b, i) => setTimeout(() => b.classList.add('visivel'), 350 * i));
      io.unobserve(en.target);
    }), { threshold: 0.15 });
    document.querySelectorAll('.revelar, .chat, .surgir').forEach((el) => io.observe(el));

    document.querySelectorAll('[data-ano]').forEach((el) => (el.textContent = new Date().getFullYear()));
  });
})();
