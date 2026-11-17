// Do Yourself — devolve o estado (UF) e a cidade aproximados de quem acessa, pela conexão.
// Roda no Vercel (cabeçalhos x-vercel-ip-*). Não guarda nada e não chama serviço de terceiros.
// Na Hostinger esta função não existe: o site mostra o Paraná até o cliente consultar o endereço.
module.exports = (req, res) => {
  const pais = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const uf = (req.headers['x-vercel-ip-country-region'] || '').toUpperCase();
  let cidade = '';
  try { cidade = decodeURIComponent(req.headers['x-vercel-ip-city'] || ''); } catch (e) { cidade = ''; }
  const br = pais === 'BR' && /^[A-Z]{2}$/.test(uf);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ uf: br ? uf : null, cidade: br ? cidade.slice(0, 60) : null });
};
