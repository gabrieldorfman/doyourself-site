/* ============================================================
   Do Yourself — páginas internas (energia, combo, internet, celular)
   ============================================================ */
(function () {
  const { brl } = DY;
  document.addEventListener('DOMContentLoaded', () => {
    // Energia: tabela de economia calculada com as regras do config (sempre atualizada)
    const t = document.querySelector('[data-tabela-energia]');
    if (t) {
      const linhas = [250, 500, 800, 1500, 3000].map((v) => {
        const s = DY.energia.simular(v);
        return `<tr><td>${brl(s.conta)}</td><td>${brl(s.comDesconto)}</td><td><b>${brl(s.economiaMes * 12)}</b></td><td class="cb">${brl(s.cashback)}</td></tr>`;
      }).join('');
      t.innerHTML = `<table><thead><tr><th>Conta hoje</th><th>Com a energia solar</th><th>Economia em 1 ano</th><th>Cashback (uma vez)</th></tr></thead><tbody>${linhas}</tbody></table>
        <p class="tabela-eco__nota">Desconto estimado de até 18% (15% para contas a partir de R$ 3.000). O valor exato depende da cidade, da distribuidora e da sua fatura.</p>`;
    }
  });
})();
