/* ============================================================
   Do Yourself — menu e links do rodapé gerados das rotas (DY.rotas / DY.menu)
   Roda antes do main.js, que liga os submenus e o drawer.
   ============================================================ */
(function () {
  const R = DY.rotas;
  const aqui = location.pathname.replace(/\/index\.html$|\/home-nova\.html$/, '/') || '/';
  const ehAqui = (k) => R[k] && R[k].pronta && R[k].href === aqui;
  const externo = (href) => /^https?:/.test(href);
  const a = (k, cls) => {
    const href = DY.linkRota(k); const x = R[k];
    if (!href) return `<span class="${cls} em-breve" aria-disabled="true">${x.r}</span>`;
    return `<a class="${cls}${dentro(k) && x.pronta ? ' ' + cls + '--ativo' : ''}" href="${href}"${externo(href) ? ' target="_blank" rel="noopener"' : ''}${ehAqui(k) ? ' aria-current="page"' : ''}>${x.r}</a>`;
  };
  const curto = { inicio: 'Início', combo: 'Combo', energia: 'Energia', blog: 'Blog' };
  // Item do menu ativo: a própria página ou qualquer página filha (ex.: /internet-fibra/casa → Internet)
  const dentro = (k) => { const x = R[k]; return !!x && x.href !== '/' && !x.href.includes('#') && (aqui === x.href || aqui.startsWith(x.href + '/')); };
  const grupoAtivo = (sub) => sub.some((s) => dentro(s));
  const itemAtivo = (k) => (k === 'inicio' ? aqui === '/' : dentro(k));

  // Desktop
  const nav = document.querySelector('.header .nav');
  if (nav) nav.innerHTML = DY.menu.map(([k, sub], i) => {
    if (!sub) { const href = DY.linkRota(k); if (!href) return ''; return `<li><a class="nav__link${itemAtivo(k) ? ' nav__link--ativo' : ''}" href="${href}"${ehAqui(k) ? ' aria-current="page"' : ''}>${curto[k] || R[k].r}</a></li>`; }
    return `<li><button class="nav__link${grupoAtivo(sub) ? ' nav__link--ativo' : ''}" type="button" aria-expanded="false" aria-controls="sub-${i}">${k} <span class="nav__seta" aria-hidden="true">▾</span></button>
      <div class="submenu" id="sub-${i}">${sub.map((s) => a(s, 'submenu__item')).join('')}</div></li>`;
  }).join('');

  // Drawer (tablet e celular): acordeão
  const lista = document.querySelector('#drawer .drawer__lista');
  if (lista) lista.innerHTML = DY.menu.map(([k, sub], i) => {
    if (!sub) { const href = DY.linkRota(k); if (!href) return ''; return `<li><a class="drawer__item${itemAtivo(k) ? ' drawer__item--ativo' : ''}" href="${href}"${ehAqui(k) ? ' aria-current="page"' : ''}>${k === 'energia' ? 'Energia Solar' : curto[k] || R[k].r}</a></li>`; }
    return `<li><button class="drawer__item${grupoAtivo(sub) ? ' drawer__item--ativo' : ''}" type="button" aria-expanded="false" data-sub="dsub-${i}">${k}<span class="drawer__glifo" aria-hidden="true">+</span></button>
      <div class="drawer__sub" id="dsub-${i}" hidden>${sub.map((s) => a(s, 'drawer__subitem')).join('')}</div></li>`;
  }).join('');

  // Menu lateral da contratação
  const ct = document.querySelector('[data-ct-menu-links]');
  if (ct) ct.innerHTML = DY.menu.map(([k, sub], i) => {
    if (!sub) { const href = DY.linkRota(k); return href ? `<a class="ct-menu__item" href="${href}">${k === 'energia' ? 'Energia Solar' : curto[k] || R[k].r}</a>` : ''; }
    return `<details class="ct-menu__grupo"><summary class="ct-menu__item">${k}<span aria-hidden="true">+</span></summary><div class="ct-menu__sub">${sub.map((s) => a(s, 'ct-menu__subitem')).join('')}</div></details>`;
  }).join('');

  // Qualquer elemento com data-rota="chave" (cards das páginas) segue a mesma regra
  document.querySelectorAll('[data-rota]').forEach((el) => {
    let href = DY.linkRota(el.dataset.rota);
    if (href && href.split('#')[0] === aqui && !href.includes('#')) href = null; // atalho para a própria página = em breve
    if (href) { el.setAttribute('href', href); if (externo(href)) { el.target = '_blank'; el.rel = 'noopener'; } }
    else { el.classList.add('em-breve'); el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); const tag = el.querySelector('[data-rota-tag]'); if (tag) tag.textContent = 'Em breve'; }
  });

  // Rodapé: cada link de rota vai para a página, para o atalho ou vira "em breve"
  const porHref = {}; Object.keys(R).forEach((k) => (porHref[R[k].href] = k));
  document.querySelectorAll('.rodape a[href^="/"], .ct-rodape a[href^="/"], .rodape a[href$="politica-de-privacidade.html"], .ct-rodape a[href$="politica-de-privacidade.html"], a.dy-link[href$="politica-de-privacidade.html"]').forEach((el) => {
    let h = el.getAttribute('href'); if (/politica-de-privacidade\.html$/.test(h)) h = '/politica-de-privacidade';
    const base = h.split('#')[0]; const k = porHref[h] || porHref[base];
    if (!k) { if (base !== '/') { el.classList.add('em-breve'); el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true');  } return; }
    let href = DY.linkRota(k);
    // Link com âncora (#duvidas, #como-funciona) de uma página que ainda não existe → mesma seção na home
    if (!R[k].pronta && h.includes('#')) href = '/#' + h.split('#')[1];
    if (href) { el.href = href; if (externo(href)) { el.target = '_blank'; el.rel = 'noopener'; } }
    else { el.classList.add('em-breve'); el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true');  }
  });
})();
