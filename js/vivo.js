/* ============================================================
   Do Yourself — camada "vivo"
   · A conta do combo: a economia na luz ajuda a pagar internet e celular
   Usa DY.energia.simular e os preços de config.js (nada digitado aqui).
   ============================================================ */
(function () {
  const { brl, centavos, cashbackCentavos } = DY;

  function contaCombo(el) {
    const range = el.querySelector('input[type="range"]');
    const chk = el.querySelector('[data-cc-cel]');
    const q = (s) => el.querySelector(s);
    // cada pedaço cresce na proporção do valor; um espaço vazio completa até a coluna mais alta
    const seg = (cls, rot, valor) => `<div class="cc__seg cc__seg--${cls}" style="flex:${valor} 1 0">${rot} ${brl(valor)}</div>`;
    const vao = (valor) => (valor > 0 ? `<div style="flex:${valor} 1 0"></div>` : '');
    const desenhar = () => {
      const conta = +range.value;
      const sim = DY.energia.simular(conta);
      const casa = DY.catalogo.casa[DY.blocoInternet(DY.uf)];
      const pNet = casa.find((p) => p.id === '600') || casa[0];
      const net = centavos(pNet.opcoes[0].preco);
      const pCel = DY.planosCnpj.find((p) => p.id === '12');
      const cel = chk.checked ? centavos(pCel.preco) : 0;
      const hoje = sim.conta; const dy = sim.comDesconto + net + cel;
      const max = Math.max(hoje, dy);
      q('[data-cc-conta]').textContent = 'R$ ' + conta.toLocaleString('pt-BR');
      q('[data-cc-hoje]').innerHTML = seg('luz', 'Luz', hoje) + vao(max - hoje);
      q('[data-cc-dy]').innerHTML = seg('luz-dy', 'Luz', sim.comDesconto) + seg('net', 'Internet', net) + (cel ? seg('cel', 'Celular', cel) : '')
        + (dy < hoje ? `<div class="cc__seg cc__seg--vazio" style="flex:${hoje - dy} 1 0">sobra ${brl(hoje - dy)}</div>` : vao(max - dy));
      q('[data-cc-hoje-total]').textContent = brl(hoje) + '/mês';
      q('[data-cc-dy-total]').textContent = brl(dy) + '/mês';
      const o = 'Luz + internet de ' + pNet.num + ' Mega' + (cel ? ' + celular' : '');
      q('[data-cc-frase]').innerHTML = dy <= hoje
        ? `${o} por <em>${brl(hoje - dy)} a menos</em> do que você paga hoje só de luz.`
        : `${o} por <em>só ${brl(dy - hoje)} a mais</em> do que você paga hoje só de luz.`;
      q('[data-cc-cb]').textContent = brl(sim.cashback + cashbackCentavos(net, 50) + cashbackCentavos(cel, 100));
      q('[data-cc-nota]').textContent = `Simulação com ${sim.pct}% de desconto na energia, internet de ${pNet.num} Mega (${brl(net)})${cel ? ` e 1 linha de ${pCel.num} GB (${brl(cel)})` : ''}. O desconto real depende da distribuidora e do seu consumo.`;
    };
    range.addEventListener('input', desenhar); chk.addEventListener('change', desenhar);
    document.addEventListener('dy:planos', desenhar);
    desenhar();
  }

  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-conta-combo]').forEach(contaCombo));
})();
