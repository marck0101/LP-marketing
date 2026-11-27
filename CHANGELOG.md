# Changelog

## 2026-11-27 · llms.txt e Person

- `/llms.txt` (resumo da LP para assistentes de IA), copiado ao `dist/` pelo build e servido como text/plain. CSP intacta.
- JSON-LD: `founder` (Person) com `@id` do portfólio, `url` e `sameAs` padrão (LinkedIn, GitHub, blog, serviços).

## 2026-11-27 · v2.0.0 · LP de tráfego pago (marca marck0101)

- Reescrita completa: visual editorial da marca (papel/tinta/tijolo, Fraunces + IBM Plex), sem Tailwind, sem gradientes.
- Oferta em escada: pré-diagnóstico R$ 0, diagnóstico R$ 1.250 a R$ 2.000, implantação a partir de R$ 3.500, gestão a partir de R$ 4.200/mês (tabela revista pelo dono em 27/11/2026; a primeira versão tinha R$ 900–1.500, 3.000 e 2.500).
- Removidos preços antigos (R$ 250/400/1.200/600/900), "fidelidade de 3 meses" e alegações sem prova.
- WhatsApp corrigido para 5555963370494 (antes 555599923469); botão flutuante e CTAs com ref `lp-*` e `utm_campaign`.
- Consent Mode v2 + banner Aceitar/Recusar; GTM só após aceite; eventos unificados (removido `click_origin`).
- SEO: canonical, OG + imagem, JSON-LD (ProfessionalService com Offers, FAQPage), robots.txt, sitemap.xml.
- Política de privacidade própria em `/privacidade` (antes apontava para a do catálogo): anúncios e UTM, sem pixel de remarketing, GA4/Clarity só com aceite, WhatsApp, prazos, direitos e ANPD. Rodapé e banner viram parcial compartilhado (`scripts/parciais/rodape.html`).
- Texto: "negócios locais" sem qualificar o tamanho ("pequeno" pode incomodar o público); teste garante.
- Netlify publica só `dist/` (gerada no build): testes, scripts e `package.json` deixam de ficar acessíveis pela URL.
- LICENSE do template (Tailwind Toolbox) substituído: nada do template sobrou no código; todos os direitos reservados.
- Sem e-mail de contato na página por enquanto (contato só por WhatsApp).
- `netlify.toml` com HSTS, CSP, Permissions-Policy, cache. Testes Playwright + axe + html-validate. `hero.png` removido.
