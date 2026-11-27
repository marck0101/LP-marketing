# LP tráfego pago · lp.marck0101.com.br

Landing page de destino das campanhas pagas (Meta, Google, LinkedIn) de **Gestão de tráfego pago medida**,
para negócios locais. Estática (HTML + CSS + JS puro), publicada pelo Netlify a partir da `main`.
Assinatura: "O básico, bem feito e medido."

## Estrutura

- `dist/`: **gerada** por `npm run build` (não versionada). Contém só o que vai ao ar: `index.html` (montado de `scripts/index.template.html` + `content/whatsapp.json`), `css/`, `js/`, `img/`, `robots.txt`, `sitemap.xml`, `llms.txt` (resumo para IAs; editar na raiz). Edite os templates (`scripts/index.template.html`, `scripts/privacidade.template.html`, rodapé + banner em `scripts/parciais/rodape.html`), nunca `dist/`. Ao mudar a política, atualize `ATUALIZADA` em `scripts/build.mjs`.
- Netlify: `command = "npm run build"`, `publish = "dist"` (`netlify.toml`). Testes, scripts e `package.json` não ficam acessíveis pela URL.
- `scripts/build.mjs`: fonte única de links de WhatsApp (com ref), FAQ (HTML + JSON-LD) e ofertas (JSON-LD).
- `content/whatsapp.json`: número, prefixo e pedido de cada CTA (espelha `content/whatsapp.json` do catálogo).
- `js/consent.js`: Consent Mode v2 (tudo negado) + carga do GTM só após aceite. `js/app.js`: banner, WhatsApp, eventos.
- `netlify.toml`: cabeçalhos de segurança (HSTS sem preload, CSP, etc.) e cache.

## Rodar e testar

```bash
npm install
npx playwright install chromium   # uma vez
npm test                           # build + html-validate + Playwright (desktop e mobile)
npm run serve                      # http://localhost:4173
```

Os testes cobrem: nenhum pedido a GTM/GA/Clarity antes do aceite, GTM após Aceitar, Recusar mantém desligado,
links `wa.me` (número e ref), UTM, eventos do dataLayer, botão flutuante, h1 único, JSON-LD x preços, console sem erros e axe.

## Trocar o contêiner GTM

`js/consent.js`, constante `GTM_ID` (no topo). Hoje `GTM-MNHZG36Q`; ver `plano-de-medicao.md` para o contêiner padrão.
Não há `<noscript>` do GTM de propósito (carregaria sem consentimento).

## Trocar o domínio do catálogo

Desde 27/11/2026: `https://servicos.marck0101.com.br` (o subdomínio diz ao Google o que há lá dentro; `catalog0101.vercel.app` redireciona para ele). Constante `CATALOG_URL` em `js/app.js`
(reaponta os links `data-catalogo` em tempo de execução). Fallback sem JS e JSON-LD/CSP: rode
`grep -rn catalog0101.vercel.app --exclude-dir=node_modules .` e troque também em `scripts/index.template.html`, depois `npm run build`.

## Códigos de origem (ref)

Mensagem: `Olá! Vim pela página de tráfego pago (ref: <ref>). <pedido>` e, se a URL tiver `utm_campaign`, `(campanha: <valor>)` no fim.

| CTA | ref | link_location (dataLayer) |
| --- | --- | --- |
| Botão flutuante | `lp-flutuante` | `flutuante` |
| Hero | `lp-hero` | `hero` |
| Pré-diagnóstico | `lp-pre-diagnostico` | `pre_diagnostico` |
| Diagnóstico | `lp-diagnostico` | `diagnostico` |
| Implantação | `lp-implantacao` | `implantacao` |
| Gestão mensal | `lp-gestao` | `gestao` |
| CTA final | `lp-cta-final` | `cta_final` |
| Rodapé | `lp-rodape` | `rodape` |

Eventos: `whatsapp_click {link_location, page_type:'lp_trafego', ref}`, `pre_diagnostico_cta` (no CTA do pré-diagnóstico),
`select_content {content_type, item_id, link_location}` (catálogo e blog), `cookie_consent_update`.

## Preços

Fonte: plano de receita (escada de ofertas). Pré-diagnóstico R$ 0; Diagnóstico R$ 1.250 a R$ 2.000; Implantação a partir de R$ 3.500;
Gestão mensal a partir de R$ 4.200/mês (atualizado em 27/11/2026; verba de anúncios não inclusa). Para mudar: `scripts/index.template.html` (texto + `data-min`/`data-max`)
e `scripts/build.mjs` (JSON-LD); o teste confere os dois lados.
