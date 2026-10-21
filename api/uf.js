// Do Yourself — devolve o estado (UF) aproximado de quem acessa, pela conexão.
// Roda no Vercel (cabeçalhos x-vercel-ip-*). Não guarda nada e não chama serviço de terceiros.
// Na Hostinger esta função não existe: o site simplesmente fica no Paraná até o cliente escolher o estado.
module.exports = (req, res) => {
  const pais = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const uf = (req.headers['x-vercel-ip-country-region'] || '').toUpperCase();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ uf: pais === 'BR' && /^[A-Z]{2}$/.test(uf) ? uf : null });
};
