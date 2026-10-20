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
  paginaConversao: 'contratar.html',
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

DY.img = (p) => 'img/' + p;

/* ---------- Internet Fibra · vitrine da Home (4 slots) ---------- */
DY.planosInternet = [
  {
    id: '500', variante: 'branco', selo: 'BÁSICO', num: '500', unidade: 'MEGA',
    nota: 'Oferta padrão — demais UFs',
    detalhes: [['download.svg', 'Download', '500 Mega'], ['upload.svg', 'Upload', '250 Mega'], ['modem.svg', 'Modem', 'Wi-Fi 5 incluso'], ['instalacao.svg', 'Instalação:', 'Gratuita']],
    apps: ['aya-books', 'aya-bancah'],
    tituloAcao: 'Este plano inclui',
    opcoes: [{ nome: 'Somente Internet', preco: 99.99, resumo: '500 Mb' }],
    opcaoPadrao: 0, de: 129.99,
    tarja: { streaming: null },
  },
  {
    id: '600', variante: 'tint', selo: 'ESSENCIAL', num: '600', unidade: 'MEGA',
    detalhes: [['download.svg', 'Download', '600 Mega'], ['upload.svg', 'Upload', '300 Mega'], ['modem.svg', 'Modem', 'Wi-Fi 5 incluso'], ['instalacao.svg', 'Instalação:', 'Gratuita']],
    apps: ['aya-books', 'aya-bancah', 'paramount'],
    tituloAcao: 'Personalize o seu plano',
    opcoes: [
      { nome: 'Somente Internet', preco: 109.99, resumo: '600 Mb' },
      { nome: 'Paramount+', logo: 'paramount', preco: 109.99, resumo: '600 Mb + Paramount+' },
      { nome: 'GloboPlay', logo: 'globoplay', preco: 119.99, resumo: '600 Mb + GloboPlay' },
    ],
    opcaoPadrao: 0, de: 149.99,
    tarja: { streaming: ['paramount', 'globoplay'] },
  },
  {
    id: '800', variante: 'soft', selo: 'OFERTA DO MÊS', num: '800', unidade: 'MEGA',
    detalhes: [['download.svg', 'Download', '800 Mega'], ['upload.svg', 'Upload', '400 Mega'], ['modem.svg', 'Modem', 'Wi-Fi 6 incluso'], ['instalacao.svg', 'Instalação:', 'Gratuita']],
    apps: ['aya-books', 'aya-bancah', 'youtube-premium'],
    tituloAcao: 'Já vem incluso no seu plano',
    opcoes: [{ nome: 'YouTube Premium', logo: 'youtube-premium', preco: 129.99, incluso: 'sem custo extra', resumo: '800 Mb + YouTube Premium' }],
    opcaoPadrao: 0, de: 169.99,
    tarja: { streaming: ['youtube-premium'] },
  },
  {
    id: '1000', variante: 'premium', selo: 'PREMIUM', num: '1', unidade: 'GIGA', extra: '(1.000 Mega)',
    detalhes: [['premium-download.svg', 'Download', '1.000 Mega'], ['premium-upload.svg', 'Upload', '500 Mega'], ['premium-modem.svg', 'Modem', 'Wi-Fi 6 incluso'], ['premium-instalacao.svg', 'Instalação:', 'Gratuita']],
    apps: ['aya-books', 'aya-bancah', 'paramount-44'],
    tituloAcao: 'Personalize o seu plano',
    opcoes: [
      { nome: 'Somente Internet', preco: 129.99, resumo: '1000 Mb' },
      { nome: 'Paramount+', logo: 'paramount-44', preco: 149.99, resumo: '1000 Mb + Paramount+' },
      { nome: 'HBO Max', logo: 'hbo-max', preco: 159.99, resumo: '1000 Mb + HBO Max' },
    ],
    opcaoPadrao: 0, de: 199.99,
    tarja: { streaming: ['paramount', 'hbo-max'] },
  },
];
DY.internetPadrao = 2; // 800 Mb — Oferta do Mês abre em repouso

/* ---------- Planos de Celular · vitrine da Home (5 slots) ---------- */
const detalhesCel = (gb, premium) => {
  const p = premium ? 'premium-' : '';
  return [[p + 'dados.svg', 'Dados móveis', `Até ${gb} GB por mês`], [(premium ? 'premium-ligacoes' : 'ligacoes') + '.svg', 'Ligações', 'Ilimitadas para todo o Brasil'], [(premium ? 'premium-sms' : 'sms') + '.svg', 'SMS', '800 por mês'], [(premium ? 'premium-tecnologias' : 'tecnologias') + '.svg', 'Tecnologias', '4G e 5G'], [(premium ? 'premium-portabilidade' : 'portabilidade') + '.svg', 'Portabilidade', 'Traga seu número, sem custo']];
};
DY.planosCelular = [
  { id: '6', variante: 'branco', selo: 'ENTRADA', num: '6', unidade: 'GB', preco: 39.99, detalhes: detalhesCel(6).map((d, i) => i === 0 ? ['dados-moveis.svg', d[1], d[2]] : d), apps: ['whatsapp', 'messenger', 'waze'] },
  { id: '12', variante: 'tint', selo: 'BÁSICO', num: '12', unidade: 'GB', preco: 44.99, detalhes: detalhesCel(12).map((d, i) => i === 0 ? ['dados-moveis.svg', d[1], d[2]] : d), apps: ['whatsapp', 'messenger', 'waze'] },
  { id: '30', variante: 'soft', selo: 'OFERTA DO MÊS', num: '30', unidade: 'GB', preco: 52.99, detalhes: detalhesCel(30).map((d, i) => i === 0 ? ['dados-moveis.svg', d[1], d[2]] : d), apps: ['whatsapp', 'messenger', 'waze', 'facebook', 'instagram'] },
  { id: '50', variante: 'premium', selo: 'PREMIUM', num: '50', unidade: 'GB', preco: 69.99, detalhes: detalhesCel(50, true), apps: ['whatsapp', 'messenger', 'waze-premium', 'facebook', 'instagram'] },
];
DY.celularPadrao = 2; // 30 GB — Oferta do Mês abre em repouso (desktop)

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
DY.cashbackCentavos = (baseCentavos, pct) => Math.floor((baseCentavos * pct) / 100);
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
