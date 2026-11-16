/* ============================================================
   Do Yourself — configuração e dados de vitrine
   Preços e textos espelham o Figma (cards 23:2961, 23:3078,
   23:3204, 23:3339 · 23:4396, 23:4526, 23:4657, 23:15915, 23:4932)
   e a wiki (componente-cards-de-plano §5).
   No futuro estes dados vêm do Supabase por praça (CEP).
   ============================================================ */
window.DY = window.DY || {};

DY.config = {
  // [A DEFINIR] Número oficial da Do Yourself. Hoje é o que aparece no Figma.
  whatsapp: '5541995701636',
  whatsappExibicao: '(41) 99570-1636',
  // Página de conversão (passo a passo até o WhatsApp)
  paginaConversao: '/contratar.html',
  // Supabase — URL do projeto + chave PUBLICÁVEL (anon). Nunca a service_role aqui.
  // Vazio = modo demonstração: o fluxo funciona, o pedido fica só no navegador e a fibra aparece "a confirmar".
  supabaseUrl: '',
  supabaseChave: '',
};

/* ---------- Energia: estimativa da simulação (sem citar parceira) ----------
   Faixas internas (modelo-cashback-doyourself): abaixo de R$ 150 não elegível ·
   R$ 150 a R$ 2.999,99 → 18% · R$ 3.000+ → 15%. É ESTIMATIVA: o valor final sai da fatura. */
DY.energia = {
  minimo: 150,
  descontoPct: (conta) => (conta >= 3000 ? 15 : 18),
  // Estados atendidos pela energia por assinatura. Vazio = todos (até a lista real das parceiras ser definida).
  ufsAtendidas: [],
  atende(uf) { return !this.ufsAtendidas.length || this.ufsAtendidas.includes(String(uf || '').toUpperCase()); },
  simular(contaReais) {
    const conta = DY.centavos(contaReais);
    if (contaReais < this.minimo) return { elegivel: false, conta };
    const pct = this.descontoPct(contaReais);
    const comDesconto = conta - Math.floor((conta * pct) / 100);
    return { elegivel: true, conta, pct, comDesconto, economiaMes: conta - comDesconto, cashback: DY.cashbackCentavos(comDesconto, 10) };
  },
};

/* Bancos aceitos no débito automático, em ordem alfabética.
   Só os que cadastram sem erro no sistema da operadora (Caixa e os demais ficam de fora). */
DY.bancosDebito = [
  ['001', 'Banco do Brasil', 'BB'], ['237', 'Bradesco', 'BR'], ['336', 'C6 Bank', 'C6'], ['077', 'Inter', 'IN'],
  ['341', 'Itaú', 'IT'], ['260', 'Nubank', 'NU'], ['033', 'Santander', 'SA'],
]

/* ---------- Rotas do site (Mapa de Páginas do Figma 23:14786) ----------
   pronta: true  → o link vai para a página.
   pronta: false → vai para o "alt" (uma seção da home ou a contratação) ou aparece como "em breve".
   Para publicar uma página nova: criar o arquivo e trocar pronta para true. */
DY.rotas = {
  inicio:            { r: 'Início', href: '/', pronta: true },
  combo:             { r: 'Combo', href: '/combo', pronta: true },
  energia:           { r: 'Energia Solar', href: '/energia', pronta: true },
  'energia-casas':   { r: 'Para Casas e Apartamentos', href: '/energia/casas', pronta: false, alt: '/energia' },
  'energia-cond':    { r: 'Para Condomínios', href: '/energia/condominios', pronta: false, alt: '/energia' },
  'energia-emp':     { r: 'Para Comércios e Empresas', href: '/energia/empresas', pronta: false, alt: '/energia' },
  internet:          { r: 'Internet Fibra', href: '/internet-fibra', pronta: true },
  'internet-casa':   { r: 'Internet para Casa', href: '/internet-fibra/casa', pronta: true },
  'internet-emp':    { r: 'Internet para Empresa', href: '/internet-fibra/empresa', pronta: true },
  'internet-2g':     { r: 'Internet 2 Giga', href: '/internet-fibra/casa/2-giga', pronta: false },
  'internet-wttx':   { r: 'Internet sem fio para empresas', href: '/internet-fibra/empresa/sem-fio', pronta: false, alt: 'whatsapp' },
  'internet-home':   { r: 'Internet para Home Office', href: '/internet-fibra/home-office', pronta: false },
  'internet-gamer':  { r: 'Internet Gamer', href: '/internet-fibra/gamer', pronta: false },
  'internet-stream': { r: 'Internet com Streaming', href: '/internet-fibra/streaming', pronta: false },
  'internet-wifi6':  { r: 'Wi-Fi 6', href: '/internet-fibra/wifi-6', pronta: false },
  celular:           { r: 'Planos de Celular', href: '/celular', pronta: true },
  'celular-cpf':     { r: 'Planos para CPF', href: '/celular/cpf', pronta: true },
  'celular-cnpj':    { r: 'Planos para CNPJ (Empresas)', href: '/celular/cnpj', pronta: true },
  apps:              { r: 'Aplicativos inclusos', href: '/aplicativos', pronta: true },
  'app-entrar':      { r: 'Como entrar nos aplicativos', href: '/aplicativos#como-entrar', pronta: true },
  'app-globoplay':   { r: 'Globoplay', href: '/aplicativos#globoplay', pronta: true },
  'app-hbo':         { r: 'HBO Max', href: '/aplicativos#hbo-max', pronta: true },
  'app-paramount':   { r: 'Paramount+', href: '/aplicativos#paramount', pronta: true },
  'app-youtube':     { r: 'YouTube Premium', href: '/aplicativos#youtube-premium', pronta: true },
  sobre:             { r: 'Sobre a Do Yourself', href: '/sobre', pronta: true },
  contato:           { r: 'Contato', href: '/contato', pronta: false, alt: 'whatsapp' },
  suporte:           { r: 'Suporte', href: '/suporte', pronta: false, alt: 'whatsapp' },
  biometria:         { r: 'Como fazer a Biometria', href: '/biometria', pronta: false },
  parceiros:         { r: 'Seja um parceiro', href: '/parceiros', pronta: false },
  blog:              { r: 'Blog', href: '/blog', pronta: false },
  duvidas:           { r: 'Dúvidas frequentes', href: '/#duvidas', pronta: true },
  privacidade:       { r: 'Política de Privacidade', href: '/politica-de-privacidade', pronta: false },
  etica:             { r: 'Ética e Integridade', href: '/etica-e-integridade', pronta: false },
};
/* Menu principal (wiki componente-menu-responsivo §6). Ordem: Combo → Energia → Internet → Celular */
DY.menu = [
  ['inicio'], ['combo'], ['energia'],
  // [rótulo, subitens, página principal (clique no rótulo leva para ela)]
  ['Internet', ['internet', 'internet-casa', 'internet-emp'], 'internet'],
  ['Celular', ['celular', 'celular-cpf', 'celular-cnpj'], 'celular'],
  ['Aplicativos', ['apps', 'app-entrar', 'app-globoplay', 'app-hbo', 'app-paramount', 'app-youtube'], 'apps'],
  ['Sobre', ['sobre', 'contato', 'suporte', 'biometria', 'parceiros'], 'sobre'],
  ['blog'],
];
/* Endereço de uma rota: a página, o atalho ou null (= em breve) */
DY.linkRota = (k) => {
  const x = DY.rotas[k]; if (!x) return null;
  if (x.pronta) return x.href;
  if (x.alt === 'whatsapp') return DY.linkWhatsApp('Olá! Vim pelo site da Do Yourself e preciso de ajuda.');
  return x.alt || null;
};

DY.img = (p) => '/img/' + p;

/* ============================================================
   PLANOS — outubro 2026 (ULTRABOOK até 03/11 · BOOK TBP até 05/11)
   Fonte: wiki tabela-cashback-outubro-2026 e planos-tim-ultrafibra.
   Os preços de internet mudam por bloco de estados; o celular muda só no PR/SC.
   ============================================================ */
const icNet = (premium) => (n) => (premium ? 'premium-' : '') + n + '.svg';
const detNet = (down, up, wifi, premium) => {
  const i = icNet(premium);
  return [[i('download'), 'Download', down], [i('upload'), 'Upload', up], [i('modem'), 'Modem', `Wi-Fi ${wifi} incluso`], [i('instalacao'), 'Instalação:', 'Gratuita']];
};
const SO = (preco, de, resumo) => ({ nome: 'Somente Internet', preco, de, resumo });
const PARA = (preco, de, resumo, logo = 'paramount') => ({ nome: 'Paramount+', logo, preco, de, resumo });
const GLOBO = (preco, de, resumo) => ({ nome: 'GloboPlay', logo: 'globoplay', preco, de, resumo });
const HBO = (preco, de, resumo) => ({ nome: 'HBO Max', logo: 'hbo-max', preco, de, resumo });

// Peças reaproveitadas entre os blocos de estados
const net800 = { id: '800', variante: 'soft', selo: 'OFERTA DO MÊS', num: '800', unidade: 'MEGA',
  detalhes: detNet('800 Mega', '400 Mega', 5), apps: ['aya-books', 'youtube-premium'], tituloAcao: 'Já vem incluso no seu plano',
  opcoes: [{ nome: 'YouTube Premium', logo: 'youtube-premium', preco: 129.99, de: 169.99, incluso: 'sem custo extra', resumo: '800 Mb + YouTube Premium' }], opcaoPadrao: 0, de: 169.99, tarja: { streaming: ['youtube-premium'] } };
const net1000 = { id: '1000', variante: 'premium', selo: 'PREMIUM', num: '1000', unidade: 'MEGA',
  detalhes: detNet('1000 Mega', '500 Mega', 6, true), apps: ['aya-books', 'aya-bancah', 'paramount-44'], tituloAcao: 'Personalize o seu plano',
  opcoes: [SO(129.99, 189.99, '1000 Mb'), PARA(149.99, 199.99, '1000 Mb + Paramount+', 'paramount-44'), HBO(159.99, 219.99, '1000 Mb + HBO Max')], opcaoPadrao: 0, de: 189.99, tarja: { streaming: ['paramount', 'hbo-max'] } };
const net600 = (preco, selo = 'ESSENCIAL', variante = 'tint', soComStreaming = false) => ({ id: '600', variante, selo, num: '600', unidade: 'MEGA',
  detalhes: detNet('600 Mega', '300 Mega', 5), apps: ['aya-books', 'aya-bancah', 'paramount'], tituloAcao: 'Personalize o seu plano',
  opcoes: [...(soComStreaming ? [] : [SO(preco, 149.99, '600 Mb')]), PARA(109.99, 149.99, '600 Mb + Paramount+'), GLOBO(119.99, 159.99, '600 Mb + GloboPlay')], opcaoPadrao: 0, de: 149.99, tarja: { streaming: ['paramount', 'globoplay'] } });
const netSimples = (id, preco, de, up, wifi, selo, variante, extra) => ({ id, variante, selo, num: id.replace(/^e/, ''), unidade: 'MEGA',
  ...(extra ? { nota: extra } : {}),
  detalhes: detNet(id.replace(/^e/, '') === '1000' ? '1000 Mega' : id.replace(/^e/, '') + ' Mega', up, wifi, variante === 'premium'), apps: ['aya-books', 'aya-bancah'],
  tituloAcao: 'Este plano inclui', opcoes: [SO(preco, de, id.replace(/^e/, '') + ' Mb')], opcaoPadrao: 0, de, tarja: { streaming: null } });

DY.catalogo = {
  // Internet para a sua casa (CPF)
  casa: {
    tbr: [netSimples('500', 89.99, 129.99, '250 Mega', 5, 'BÁSICO', 'branco'), net600(99.99), net800, net1000],
    norte: [net600(79.99, 'OFERTA REGIONAL', 'branco'), net800, { ...net1000, variante: 'tint', detalhes: detNet('1000 Mega', '500 Mega', 6) }],
    sp: [netSimples('400', 79.99, 119.99, '200 Mega', 5, 'BÁSICO', 'branco'), net600(0, 'ESSENCIAL', 'tint', true), net800, net1000],
  },
  // Internet para a sua empresa (CNPJ) — sem streaming
  empresa: {
    tbr: [netSimples('e500', 89.99, 129.99, '250 Mega', 5, 'BÁSICO', 'branco'), netSimples('e600', 99.99, 149.99, '300 Mega', 5, 'ESSENCIAL', 'tint'), netSimples('e1000', 99.99, 189.99, '500 Mega', 6, 'OFERTA DO MÊS', 'premium')],
    norte: [netSimples('e600', 79.99, 149.99, '300 Mega', 5, 'OFERTA REGIONAL', 'branco'), netSimples('e1000', 99.99, 189.99, '500 Mega', 6, 'OFERTA DO MÊS', 'premium')],
    sp: [netSimples('e400', 79.99, 119.99, '200 Mega', 5, 'BÁSICO', 'branco'), netSimples('e500', 99.99, 129.99, '250 Mega', 5, 'ESSENCIAL', 'tint'), netSimples('e700', 109.99, 149.99, '350 Mega', 5, 'MAIS VELOCIDADE', 'soft', '100 Mega de bônus inclusos por 12 meses'), netSimples('e1000', 99.99, 189.99, '500 Mega', 6, 'OFERTA DO MÊS', 'premium')],
  },
};
// Plano que abre em destaque em cada lista (a oferta foco)
/* Página de cada plano de internet para casa (id do catálogo → endereço) */
DY.paginaPlano = { 500: '/internet-fibra/casa/500-mega', 600: '/internet-fibra/casa/600-mega', 800: '/internet-fibra/casa/800-mega', 1000: '/internet-fibra/casa/1-giga' };
DY.padraoInternet = (lista) => Math.max(0, lista.findIndex((p) => p.selo === 'OFERTA DO MÊS'));

/* Bloco de preço de internet pelo estado: CE, RN e SC · SP · demais (inclui PR) */
DY.blocoInternet = (uf) => (['CE', 'RN', 'SC'].includes(uf) ? 'norte' : uf === 'SP' ? 'sp' : 'tbr');
DY.UFS = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };

/* ============================================================
   PLANOS DE CELULAR
   CPF  → planos controle (preço e internet mudam: portabilidade × número novo).
          Preços de referência da Do Yourself (decisão de 06/11/2026).
   CNPJ → planos empresariais (tabela própria no PR e em SC) + ofertas só de portabilidade.
   Fonte: wiki Regras Do Yourself, partes 5 e 6. Cashback = 100% da mensalidade.
   ============================================================ */
const ZERO_BASICO = ['whatsapp', 'messenger', 'waze'];
const ZERO_COMPLETO = ['whatsapp', 'messenger', 'waze', 'facebook', 'instagram'];
const detCel = (p, prem) => {
  const x = prem ? 'premium-' : '';
  return [
    [(prem ? 'premium-dados' : 'dados-moveis') + '.svg', 'Dados móveis', `Até ${p.gb} GB por mês`],
    [x + 'ligacoes.svg', 'Ligações', p.minutos ? `${p.minutos} minutos para todo o Brasil` : 'Ilimitadas para todo o Brasil'],
    [x + 'sms.svg', 'SMS', p.tipo === 'cpf' ? 'Ilimitados' : '800 por mês'],
    [x + 'tecnologias.svg', 'Roaming nacional', 'Use em todo o Brasil sem custo extra'],
    [x + 'portabilidade.svg', 'Portabilidade', 'Traga seu número, sem custo'],
  ];
};
const cel = (o) => { const p = { unidade: 'GB', num: String(o.gb), ...o }; p.detalhes = detCel(p, p.variante === 'premium'); return p; };

// CPF — planos controle. gb/preco = portabilidade · gbNova/precoNova = número novo ou migração
DY.celularCpf = [
  cel({ tipo: 'cpf', id: 'aplus', nome: 'Controle A Plus', slug: 'a-plus', selo: 'ENTRADA', variante: 'branco', gb: 27, gbNova: 19, preco: 46.99, precoNova: 46.99, minutos: 550, apps: ['messenger'],
    extras: ['550 minutos de ligação', 'Roaming no Chile sem custo', 'Messenger sem gastar a internet', 'Cartão de TODOS'] }),
  cel({ tipo: 'cpf', id: 'controle', nome: 'Controle', slug: 'controle', selo: 'OFERTA DO MÊS', variante: 'soft', gb: 45, gbNova: 35, preco: 49.99, precoNova: 58.99, apps: [],
    extras: ['Deezer Premium grátis por 3 meses', 'Ligações e SMS ilimitados', 'Audiolivros, estudos e revistas', 'Cartão de TODOS'] }),
  cel({ tipo: 'cpf', id: 'redes', nome: 'Controle Redes Sociais', slug: 'redes-sociais', selo: 'REDES SOCIAIS', variante: 'tint', gb: 46, gbNova: 26, preco: 59.99, precoNova: 64.99, apps: ['facebook', 'instagram', 'messenger'],
    extras: ['Facebook, Instagram, X e Messenger sem gastar a internet', 'Ligações e SMS ilimitados', 'Jornais e revistas', 'Cartão de TODOS'] }),
  cel({ tipo: 'cpf', id: 'premium', nome: 'Controle Premium', slug: 'premium', selo: 'MAIS INTERNET', variante: 'premium', gb: 55, gbNova: 45, preco: 74.99, precoNova: 84.99, apps: ['facebook', 'instagram', 'messenger'],
    extras: ['5 GB só para redes sociais', 'Roaming no Chile sem custo', 'Ligações e SMS ilimitados', 'Cartão de TODOS'] }),
];
DY.celularCpf.forEach((p) => (p.cashback = 100));

// CNPJ — planos empresariais (preço por linha). prsc = Paraná e Santa Catarina
const EMP = [
  ['6', 1, 5, 39.99, 29.99, 'ENTRADA', 'branco', ZERO_BASICO, ['Backup em nuvem de 30 GB', 'Cursos de idiomas', 'Audiolivros']],
  ['12', 2, 10, 44.99, 39.99, 'BÁSICO', 'branco', ZERO_BASICO, ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros', 'Monitor de uso']],
  ['30', 10, 20, 52.99, 52.99, 'ESSENCIAL', 'tint', ZERO_COMPLETO, ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros', 'Jornais e revistas', 'Monitor de uso']],
  ['40', 20, 20, 64.99, 64.99, 'ESSENCIAL+', 'tint', ZERO_COMPLETO, ['Nuvem para arquivos', 'Jornais e revistas', 'Audiolivros', 'Cursos de idiomas', 'Antivírus', 'Monitor de uso']],
  ['50', 30, 20, 69.99, 69.99, 'OFERTA DO MÊS', 'soft', ZERO_COMPLETO, ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros', 'Jornais e revistas', 'Monitor de uso', 'Clube de Vantagens', 'Proteção contra golpes']],
  ['80', 30, 50, 79.99, 79.99, 'MAIS INTERNET', 'tint', ZERO_COMPLETO, ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros', 'Jornais e revistas', 'Monitor de uso', 'Clube de Vantagens', 'Proteção contra golpes']],
  ['100', 50, 50, 99.99, 99.99, 'PREMIUM', 'premium', ZERO_COMPLETO, ['Nuvem para arquivos', 'Jornais e revistas', 'Audiolivros', 'Cursos de idiomas', 'Antivírus', 'Monitor de uso', 'Clube de Vantagens']],
  ['150', 100, 50, 149.99, 149.99, 'PREMIUM', 'premium', ZERO_COMPLETO, ['Nuvem para arquivos', 'Cursos de idiomas', 'Jornais e revistas', 'Audiolivros', 'Monitor de uso', 'Clube de Vantagens', 'Proteção contra golpes']],
];
const PORTA = [
  ['p21', 21, 1, 20, 39.99, 'SÓ PORTABILIDADE', 'branco', ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros']],
  ['p40', 40, 20, 20, 50.99, 'SÓ PORTABILIDADE', 'tint', ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros', 'Jornais e revistas', 'Monitor de uso', 'Clube de Vantagens', 'Proteção contra golpes']],
  ['p70', 70, 20, 50, 59.99, 'SÓ PORTABILIDADE', 'soft', ['Nuvem para arquivos', 'Cursos de idiomas', 'Audiolivros', 'Jornais e revistas', 'Monitor de uso', 'Clube de Vantagens', 'Proteção contra golpes']],
];
DY.celularCnpj = (prsc) => EMP.map(([id, plano, bonus, a, b, selo, variante, apps, servicos]) => cel({ tipo: 'cnpj', id, nome: `Empresa ${id} GB`, gb: plano + bonus, plano, bonus, preco: prsc ? a : b, selo, variante, apps, servicos, cashback: 100 }));
DY.celularPorta = PORTA.map(([id, gb, plano, bonus, preco, selo, variante, servicos]) => cel({ tipo: 'cnpj', id, nome: `Portabilidade ${gb} GB`, gb, plano, bonus, preco, selo, variante, apps: ZERO_COMPLETO, servicos, soPorta: true, cashback: 100 }));
/* Preço e internet de um plano de celular (CPF: depende de trazer o número ou não) */
DY.celPreco = (p, porta = true) => (!porta && p.precoNova ? p.precoNova : p.preco);
DY.celGB = (p, porta = true) => (!porta && p.gbNova ? p.gbNova : p.gb);
// Vitrine da home (acordeão): 4 planos por tipo
const VITRINE_CNPJ = ['12', '30', '50', '100'];

/* ---------- Estado atual dos planos (muda pelo estado do cliente e pela aba casa/empresa) ----------
   UF: a escolhida pelo cliente > a do CEP > a detectada pela conexão > PR. */
DY.definirPlanos = ({ uf, tipo, celular } = {}) => {
  if (uf && DY.UFS[uf]) DY.uf = uf;
  if (tipo) DY.tipoInternet = tipo === 'empresa' ? 'empresa' : 'casa';
  if (celular) DY.tipoCelular = celular === 'cpf' ? 'cpf' : 'cnpj';
  DY.planosInternet = DY.catalogo[DY.tipoInternet][DY.blocoInternet(DY.uf)];
  DY.internetPadrao = DY.padraoInternet(DY.planosInternet);
  DY.planosCnpj = DY.celularCnpj(['PR', 'SC'].includes(DY.uf));
  // Lista completa (contratação) e vitrine de 4 (acordeão da home)
  DY.planosCelular = DY.tipoCelular === 'cpf' ? DY.celularCpf : [...DY.planosCnpj, ...DY.celularPorta];
  DY.vitrineCelular = DY.tipoCelular === 'cpf' ? DY.celularCpf : VITRINE_CNPJ.map((id) => DY.planosCnpj.find((p) => p.id === id));
  DY.celularPadrao = Math.max(0, DY.vitrineCelular.findIndex((p) => p.selo === 'OFERTA DO MÊS'));
  if (document.readyState !== 'loading') document.dispatchEvent(new CustomEvent('dy:planos'));
};
DY.uf = 'PR'; DY.cidade = ''; DY.tipoInternet = 'casa'; DY.tipoCelular = 'cnpj';
/* Onde o cliente está: 1) o endereço que ele já consultou na contratação; 2) a conexão (/api/uf); 3) Paraná */
try { const l = JSON.parse(localStorage.getItem('dy_local') || 'null'); if (l && DY.UFS[l.uf]) { DY.uf = l.uf; DY.cidade = l.cidade || ''; DY.localDoCep = true; } } catch (e) { /* sem storage */ }
DY.definirPlanos({});
DY.detectarUF = async () => {
  if (DY.localDoCep) return;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('/api/uf', { cache: 'no-store', signal: ctl.signal }); clearTimeout(t);
    const { uf, cidade } = await r.json();
    if (uf && DY.UFS[uf]) { DY.cidade = cidade || ''; DY.definirPlanos({ uf }); }
  } catch (e) { /* fica no Paraná */ }
};
/* Guardado quando o cliente consulta o endereço: a home passa a mostrar as ofertas da cidade dele */
DY.salvarLocal = (uf, cidade) => { try { localStorage.setItem('dy_local', JSON.stringify({ uf, cidade })); } catch (e) { /* */ } };
DY.textoLocal = () => (DY.cidade ? `${DY.cidade} - ${DY.uf}` : DY.UFS[DY.uf]);

/* Logos de aplicativo (pasta img/apps) */
DY.logos = {
  'aya-books': { src: 'apps/aya-books.png', alt: 'AYA Books' },
  'aya-bancah': { src: 'apps/aya-bancah.png', alt: 'AYA Bancah' },
  'paramount': { src: 'apps/paramount-tile.svg', alt: 'Paramount+' },
  'paramount-44': { src: 'apps/paramount-44.svg', alt: 'Paramount+' },
  'globoplay': { src: 'apps/globoplay.png', alt: 'GloboPlay' },
  'hbo-max': { src: 'apps/hbo-max.png', alt: 'HBO Max' },
  'youtube-premium': { src: 'apps/youtube-premium-logo.svg', alt: 'YouTube Premium' },
  'whatsapp': { src: 'apps/whatsapp.svg', alt: 'WhatsApp' },
  'messenger': { src: 'apps/messenger.svg', alt: 'Messenger' },
  'waze': { src: 'apps/waze.svg', alt: 'Waze' },
  'waze-premium': { src: 'apps/waze-premium.svg', alt: 'Waze' },
  'facebook': { src: 'apps/facebook.svg', alt: 'Facebook' },
  'instagram': { src: 'apps/instagram.svg', alt: 'Instagram' },
};

/* ---------- Utilidades de dinheiro ----------
   Tudo em centavos inteiros para não errar no ponto flutuante.
   Cashback TRUNCA no centavo (regras-de-cashback §2.3). */
DY.centavos = (reais) => Math.round(reais * 100);
// Cashback TRUNCADO no centavo (Regras Do Yourself 1.x: 50% de R$ 129,99 = R$ 64,99) — a mesma regra em todo o site
DY.cashbackCentavos = (baseCentavos, pct) => Math.floor((baseCentavos * pct) / 100 + 1e-9);
DY.brl = (centavos) => 'R$ ' + (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Valor em reais, como a pessoa digita: "800" → 800 · "1500" → 1.500 · "1500,5" → 1.500,5 */
DY.formatarReais = (v) => {
  const t = String(v).replace(/[^\d,]/g, ''); const i = t.indexOf(',');
  let int = (i < 0 ? t : t.slice(0, i)).replace(/^0+(?=\d)/, '').slice(0, 6);
  const dec = i < 0 ? null : t.slice(i + 1).replace(/,/g, '').slice(0, 2);
  if (!int && dec === null) return '';
  int = (int || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec === null ? int : int + ',' + dec;
};
DY.lerReais = (v) => Number(String(v || '').replace(/\./g, '').replace(',', '.')) || 0;

DY.linkWhatsApp = (texto) => 'https://wa.me/' + DY.config.whatsapp + (texto ? '?text=' + encodeURIComponent(texto) : '');
