// Gera dist/ (o que a Netlify publica): index.html e privacidade.html a partir dos templates em scripts/
// (rodapé + banner de cookies compartilhados em scripts/parciais/rodape.html) +
// content/whatsapp.json, mais css/, js/, img/, robots.txt, sitemap.xml e llms.txt. Nada além disso vai ao ar.
// Fonte unica de: links de WhatsApp (com ref), FAQ (HTML + JSON-LD) e ofertas (JSON-LD).
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const wa = JSON.parse(readFileSync(join(raiz, 'content/whatsapp.json'), 'utf8'));
const SITE = 'https://lp.marck0101.com.br/';

export function mensagem(chave) {
  const i = wa.itens[chave];
  return `${wa.prefixo} (ref: ${i.ref}). ${i.pedido}`;
}
const link = (chave) => `https://wa.me/${wa.numero}?text=${encodeURIComponent(mensagem(chave))}`;

const faq = [
  ['A verba dos anúncios está inclusa?', 'Não. A verba é o que você paga às plataformas (Meta, Google, LinkedIn) para os anúncios rodarem, e vai direto para elas, no seu cartão ou conta. O valor da gestão é só o meu trabalho. Assim você vê cada real investido.'],
  ['Tem contrato ou fidelidade?', 'Prazo, forma de pagamento e eventual período mínimo são combinados na proposta, por escrito, antes de começar. Nada é decidido às pressas pelo WhatsApp.'],
  ['Em quanto tempo eu vejo resultado?', 'Depende do ponto de partida, do mercado e da verba, então não prometo prazo. O que posso dizer: nas primeiras semanas o foco é medir direito e aprender o que funciona. Só depois de alguns ciclos de dados dá para tirar conclusões confiáveis.'],
  ['Preciso ter site para anunciar?', 'Não necessariamente. Em alguns casos um perfil bem cuidado no Google ou uma landing page simples bastam. No pré-diagnóstico eu digo o que faz sentido no seu caso, inclusive se vale a pena começar por outra coisa que não anúncio.'],
  ['Como eu acompanho o que está acontecendo?', 'Na gestão mensal você recebe um relatório curto e uma reunião para decidir os próximos passos. Os resultados são medidos com tagueamento próprio, então os números do relatório podem ser conferidos.'],
  ['O que é o pré-diagnóstico gratuito?', 'É uma análise rápida da sua presença no Google, dos seus anúncios (se houver) e do seu site, entregue em PDF. Você pode usar sozinho ou com outra pessoa; não é obrigatório contratar nada depois.']
];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const faqHtml = faq.map(([q, a]) => `      <details>\n        <summary>${esc(q)}</summary>\n        <div class="resp"><p>${esc(a)}</p></div>\n      </details>`).join('\n');

const ldFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
};

const oferta = (name, description, spec) => ({
  '@type': 'Offer',
  priceCurrency: 'BRL',
  itemOffered: { '@type': 'Service', name, description },
  priceSpecification: { priceCurrency: 'BRL', ...spec }
});
const ldServico = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': SITE + '#servico',
  name: 'marck0101 · Gestão de tráfego pago',
  description: 'Gestão de tráfego pago medida para negócios locais (Meta, Google e LinkedIn), com tagueamento e relatório mensal.',
  url: SITE,
  image: SITE + 'img/og.png',
  telephone: '+' + wa.numero,
  slogan: 'O básico, bem feito e medido.',
  address: { '@type': 'PostalAddress', addressLocality: 'Santa Rosa', addressRegion: 'RS', addressCountry: 'BR' },
  areaServed: { '@type': 'Country', name: 'Brasil' },
  founder: {
    '@type': 'Person',
    '@id': 'https://marck0101.com.br/#person',
    name: 'Marcos Henrique Corrêa',
    image: SITE + 'img/marcos-henrique-correa.webp',
    url: 'https://marck0101.com.br',
    sameAs: [
      'https://www.linkedin.com/in/marcos-henrique-corr%C3%AAa-618392209/',
      'https://github.com/marck0101',
      'https://blog.marck0101.com.br',
      'https://servicos.marck0101.com.br'
    ]
  },
  priceRange: 'R$ 0 a partir de R$ 3.500',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Escada de ofertas de tráfego pago',
    itemListElement: [
      oferta('Pré-diagnóstico gratuito', 'Análise rápida da presença no Google, anúncios e site, entregue em PDF.', { '@type': 'PriceSpecification', minPrice: 0, maxPrice: 0 }),
      oferta('Diagnóstico de tráfego e medição', 'Auditoria de contas, tagueamento, funil e plano de ação.', { '@type': 'PriceSpecification', minPrice: 1250, maxPrice: 2000 }),
      oferta('Implantação', 'Tagueamento GA4/GTM/Pixel com consentimento, estrutura de campanhas, landing page e ajustes, painel.', { '@type': 'PriceSpecification', minPrice: 3500 }),
      oferta('Gestão mensal de tráfego', 'Meta, Google e LinkedIn; otimização contínua, relatório mensal e reunião. Verba de anúncios paga direto às plataformas e não inclusa.', { '@type': 'UnitPriceSpecification', minPrice: 4200, unitCode: 'MON', unitText: 'mês' })
    ]
  }
};

const ATUALIZADA = '27/11/2026'; // data da política de privacidade (mudar junto com o texto)
const rodape = readFileSync(join(raiz, 'scripts/parciais/rodape.html'), 'utf8');

function montar(arquivo) {
  let html = readFileSync(join(raiz, 'scripts', arquivo), 'utf8').replace('{{RODAPE}}', rodape);
  html = html.replace(/\{\{wa:([\w-]+)\}\}/g, (_, k) => {
    if (!wa.itens[k]) throw new Error('ref desconhecido: ' + k);
    return link(k).replace(/&/g, '&amp;');
  });
  return html
    .replace('{{FAQ_HTML}}', faqHtml)
    .replace('{{LD_SERVICO}}', JSON.stringify(ldServico, null, 2).replace(/</g, '<'))
    .replace('{{LD_FAQ}}', JSON.stringify(ldFaq, null, 2).replace(/</g, '<'))
    .replaceAll('{{ATUALIZADA}}', ATUALIZADA)
    .replaceAll('{{WA_NUMERO}}', wa.numero);
}

const dist = join(raiz, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
writeFileSync(join(dist, 'index.html'), montar('index.template.html'));
writeFileSync(join(dist, 'privacidade.html'), montar('privacidade.template.html'));
for (const f of ['index.html', 'privacidade.html']) {
  const resto = readFileSync(join(dist, f), 'utf8').match(/\{\{[^}]+\}\}/);
  if (resto) throw new Error(`marcador sem valor em ${f}: ${resto[0]}`);
}
for (const item of ['css', 'js', 'img', 'robots.txt', 'sitemap.xml', 'llms.txt']) {
  cpSync(join(raiz, item), join(dist, item), { recursive: true });
}
console.log('dist/ gerado');
