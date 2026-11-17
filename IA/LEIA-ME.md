# Site Do Yourself — notas do projeto
**Atualizado:** 2026-11-07

Site no ar: https://doyourself-site.vercel.app (Vercel, publicado pelo repositório GitHub `gabrieldorfman/doyourself-site`).
Regras de negócio, preços e copy: vault `OBISIDIAN/Do Yourself/wiki` (principal: `empresa/Regras Do Yourself.md`).
Arquitetura das páginas de planos: `wiki/estrutura-site/arquitetura-paginas-planos.md`.

## O que tem nesta pasta
```
home-nova.html            Home (vira index.html na publicação)
contratar.html            Área de contratação ("Gerar meu Pedido" → WhatsApp)
energia.html, combo.html  Páginas de Energia e Combo
internet-fibra.html       Hub de Internet Fibra
internet-fibra/casa.html, empresa.html, casa/{500-mega,600-mega,800-mega,1-giga}.html
celular.html              Hub de Planos de Celular
celular/cpf.html, cnpj.html, cpf/{controle,redes-sociais,premium,a-plus}.html
aplicativos.html, sobre.html
css/   tokens.css (cores claro/escuro), base.css, dy.css, planos.css, ofertas.css, inicio.css, paginas.css,
       fibra.css (Internet, Celular, Aplicativos e Sobre), contratar.css
js/    config.js  ← PREÇOS, planos, rotas do menu, WhatsApp, regra do cashback (truncado no centavo)
       menu.js, main.js, ofertas.js, planos.js, inicio.js, paginas.js, contratar.js, pedido.js
       fibra.js (barra "Ofertas válidas para <cidade>", páginas de Internet), celular.js (páginas de Celular)
api/uf.js                 Detecta o estado/cidade pelo IP (função do Vercel)
img/                      Marca, ícones, apps, ilustrações
tools/                    Geradores das páginas internas e script de publicação
supabase/                 Tabela de pedidos do site
vercel.json               Configuração do Vercel (URLs sem .html)
publicado/                Cópia exata do que está no ar no Vercel (gerada; não editar)
_arquivo/                 Esboços antigos (Home fiel ao Figma e versão Nio)
```

## Como editar e publicar
1. **Preço ou plano:** edite só `js/config.js`. As páginas leem os preços de lá, por região.
2. **Texto das páginas internas:** edite os geradores em `tools/` (`fibra_paginas.py`, `celular_paginas.py`,
   `institucional_paginas.py`; Energia e Combo ficam em `paginas.py`). Não edite os .html gerados.
3. Gere as páginas: `python tools/paginas.py`
4. Monte a publicação: `python tools/publicar.py <pasta do repositório do Vercel>`
5. Commit + push no repositório → o Vercel publica sozinho.

## Rodar local
`python -m http.server 5510` na pasta → http://localhost:5510/home-nova.html
(As URLs limpas, tipo `/internet-fibra/casa`, só funcionam no Vercel; local, use `/internet-fibra/casa.html`.)

## Regras que valem para o site todo
- Nunca citar nome de operadora, empresa de energia ou pessoas: "operadora parceira", "Nossa Fibra".
- Nunca usar a palavra "comissão". Falar em cashback / dinheiro de volta / PIX.
- Suporte: Do Yourself pelo WhatsApp, 24 horas por dia.
- Cashback: energia 10%, internet 50%, celular 100%, truncado no centavo.
- Internet: só IP dinâmico. 800 Mega (Wi-Fi 5 + YouTube Premium) e 1 Giga (Wi-Fi 6) têm o mesmo preço, de propósito.
