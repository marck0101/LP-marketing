# Changelog

## 2026-11-27 · v2.0.0 · LP de tráfego pago (marca marck0101)

- Reescrita completa: visual editorial da marca (papel/tinta/tijolo, Fraunces + IBM Plex), sem Tailwind, sem gradientes.
- Oferta em escada: pré-diagnóstico R$ 0, diagnóstico R$ 900 a R$ 1.500, implantação a partir de R$ 3.000, gestão a partir de R$ 2.500/mês.
- Removidos preços antigos (R$ 250/400/1.200/600/900), "fidelidade de 3 meses" e alegações sem prova.
- WhatsApp corrigido para 5555963370494 (antes 555599923469); botão flutuante e CTAs com ref `lp-*` e `utm_campaign`.
- Consent Mode v2 + banner Aceitar/Recusar; GTM só após aceite; eventos unificados (removido `click_origin`).
- SEO: canonical, OG + imagem, JSON-LD (ProfessionalService com Offers, FAQPage), robots.txt, sitemap.xml.
- Netlify publica só `dist/` (gerada no build): testes, scripts e `package.json` deixam de ficar acessíveis pela URL.
- LICENSE do template (Tailwind Toolbox) substituído: nada do template sobrou no código; todos os direitos reservados.
- Sem e-mail de contato na página por enquanto (contato só por WhatsApp).
- `netlify.toml` com HSTS, CSP, Permissions-Policy, cache. Testes Playwright + axe + html-validate. `hero.png` removido.
