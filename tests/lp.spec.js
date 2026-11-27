// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const wa = require('../content/whatsapp.json');

const TRACKERS = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|clarity\.ms|facebook\.(com|net)|connect\.facebook|doubleclick|bing\.com/;

/** Intercepta fontes, GTM e destinos externos (nenhuma requisição real) e registra tudo que sai da página. */
async function prepare(page) {
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route(/googletagmanager\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* gtm stub */' }));
  await page.route(/wa\.me|catalog0101\.vercel\.app|blog\.marck0101/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  return { requests, errors };
}
const trackerRequests = (reqs) => reqs.filter((u) => TRACKERS.test(u));

test.describe('consentimento e medição', () => {
  test('nenhuma requisição de rastreio antes do consentimento; default negado vem primeiro', async ({ page }) => {
    const { requests } = await prepare(page);
    await page.goto('/');
    await expect(page.locator('#cookies')).toBeVisible();
    await page.waitForTimeout(600);
    expect(trackerRequests(requests)).toEqual([]);
    const first = await page.evaluate(() => Array.from(window.dataLayer[0]));
    expect(first[0]).toBe('consent');
    expect(first[1]).toBe('default');
    expect(first[2]).toMatchObject({ ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    expect(await page.locator('script[src*="googletagmanager"]').count()).toBe(0);
  });

  test('Aceitar carrega o GTM, emite consent update e cookie_consent_update', async ({ page }) => {
    const { requests } = await prepare(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await expect(page.locator('#cookies')).toBeHidden();
    await expect.poll(() => requests.some((u) => /googletagmanager\.com\/gtm\.js\?id=GTM-MNHZG36Q/.test(u))).toBe(true);
    const dl = await page.evaluate(() => window.dataLayer.map((x) => (x && x.event ? x : Array.from(x))));
    expect(dl.some((x) => Array.isArray(x) && x[0] === 'consent' && x[1] === 'update' && x[2].analytics_storage === 'granted')).toBe(true);
    expect(dl.some((x) => x && x.event === 'cookie_consent_update' && x.analytics_storage === 'granted' && x.ad_storage === 'denied')).toBe(true);
    // escolha lembrada: recarregar não reabre o banner e recarrega o GTM
    requests.length = 0;
    await page.reload();
    await expect(page.locator('#cookies')).toBeHidden();
    await expect.poll(() => requests.some((u) => /gtm\.js/.test(u))).toBe(true);
  });

  test('Recusar mantém o GTM desligado, inclusive após recarregar', async ({ page }) => {
    const { requests } = await prepare(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await expect(page.locator('#cookies')).toBeHidden();
    await page.waitForTimeout(500);
    const ev = await page.evaluate(() => window.dataLayer.filter((x) => x && x.event));
    expect(ev.find((x) => x.event === 'cookie_consent_update')).toMatchObject({ analytics_storage: 'denied' });
    await page.reload();
    await page.waitForTimeout(500);
    expect(trackerRequests(requests)).toEqual([]);
    await expect(page.locator('#cookies')).toBeHidden();
    await page.getByRole('button', { name: 'Preferências de cookies' }).click();
    await expect(page.locator('#cookies')).toBeVisible();
  });
});

test.describe('WhatsApp', () => {
  test('todo link wa.me usa o número certo, tem ref e bate com content/whatsapp.json', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    const links = await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => ({ href: a.getAttribute('href'), key: a.getAttribute('data-wa') })));
    expect(links.length).toBeGreaterThanOrEqual(Object.keys(wa.itens).length);
    const refs = new Set();
    for (const l of links) {
      const u = new URL(l.href);
      expect(u.pathname).toBe('/' + wa.numero);
      const text = u.searchParams.get('text');
      const m = /\(ref: (lp-[a-z-]+)\)/.exec(text);
      expect(m, text).not.toBeNull();
      expect(m[1]).toBe(wa.itens[l.key].ref);
      expect(text.startsWith('Olá! Vim pela página de tráfego pago')).toBe(true);
      refs.add(m[1]);
    }
    expect([...refs].sort()).toEqual(Object.values(wa.itens).map((i) => i.ref).sort());
    const html = await page.content();
    expect(html).not.toContain('555599923469');
    expect(html).not.toContain('9 9923-4969');
    expect(html).toContain('(55) 96337-0494');
  });

  test('utm_campaign é anexado à mensagem', async ({ page }) => {
    await prepare(page);
    await page.goto('/?utm_source=meta&utm_campaign=teste-nov');
    const href = await page.locator('a[data-wa="hero"]').first().getAttribute('href');
    const text = new URL(href).searchParams.get('text');
    expect(text).toContain('(ref: lp-hero)');
    expect(text.endsWith('(campanha: teste-nov)')).toBe(true);
  });

  test('cliques emitem whatsapp_click, pre_diagnostico_cta e select_content sem campo antigo', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    const ev = () => page.evaluate(() => window.dataLayer.filter((x) => x && x.event));
    await page.locator('a[data-wa="pre-diagnostico"]').click();
    let e = await ev();
    expect(e).toContainEqual({ event: 'whatsapp_click', link_location: 'pre_diagnostico', page_type: 'lp_trafego', ref: 'lp-pre-diagnostico' });
    expect(e).toContainEqual({ event: 'pre_diagnostico_cta', link_location: 'pre_diagnostico', page_type: 'lp_trafego', ref: 'lp-pre-diagnostico' });
    await page.locator('a[data-wa="gestao"]').click();
    e = await ev();
    expect(e).toContainEqual({ event: 'whatsapp_click', link_location: 'gestao', page_type: 'lp_trafego', ref: 'lp-gestao' });
    await page.locator('.mais a[data-select="catalogo"]').click();
    await page.locator('.mais a[data-select="blog"]').click();
    e = await ev();
    expect(e).toContainEqual({ event: 'select_content', content_type: 'catalogo', item_id: 'catalogo', link_location: 'mais' });
    expect(e).toContainEqual({ event: 'select_content', content_type: 'blog', item_id: 'blog', link_location: 'mais' });
    expect(JSON.stringify(e)).not.toContain('click_origin');
  });

  test('botão flutuante: visível, com nome acessível, não cobre o banner nem o CTA final', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    const fab = page.locator('#wa-flutuante');
    await expect(page.locator('#cookies')).toBeVisible();
    await expect(fab).toBeHidden(); // banner aberto: um não cobre o outro
    await page.getByRole('button', { name: 'Recusar' }).click();
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute('aria-label', 'Falar no WhatsApp');
    const vp = page.viewportSize();
    const box = await fab.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    await page.evaluate(() => document.querySelector('a[data-wa="cta-final"]').scrollIntoView({ block: 'center' }));
    await expect(fab).toBeHidden();
    await expect(page.locator('a[data-wa="cta-final"]')).toBeVisible();
  });
});

test.describe('conteúdo e SEO', () => {
  test('um único h1, landmarks, canonical e imagem com dimensões', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://lp.marck0101.com.br/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /img\/og\.png$/);
    const foto = page.locator('img[alt="Marcos Henrique Corrêa"]');
    await expect(foto).toHaveAttribute('width', /\d+/);
    await expect(foto).toHaveAttribute('height', /\d+/);
  });

  test('JSON-LD é válido e os preços batem com os da página', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    const lds = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent)));
    expect(lds).toHaveLength(2);
    const svc = lds.find((l) => l['@type'] === 'ProfessionalService');
    const faq = lds.find((l) => l['@type'] === 'FAQPage');
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(5);
    const dom = await page.locator('.preco').evaluateAll((els) => els.map((e) => ({ min: Number(e.dataset.min), max: e.dataset.max === undefined ? undefined : Number(e.dataset.max), text: e.textContent.replace(/\s+/g, ' ') })));
    const offers = svc.hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(dom.length);
    offers.forEach((o, i) => {
      expect(o.priceCurrency).toBe('BRL');
      expect(o.priceSpecification.priceCurrency).toBe('BRL');
      expect(o.priceSpecification.minPrice).toBe(dom[i].min);
      expect(o.priceSpecification.maxPrice).toBe(dom[i].max);
    });
    const fmt = (n) => n.toLocaleString('pt-BR');
    expect(dom[0].text).toContain('R$ 0');
    expect(dom[1].text).toContain(`R$ ${fmt(1250)}`);
    expect(dom[1].text).toContain(`R$ ${fmt(2000)}`);
    expect(dom[2].text).toContain(`R$ ${fmt(3500)}`);
    expect(dom[3].text).toContain(`R$ ${fmt(4200)}`);
    const qs = await page.locator('.faq summary').allTextContents();
    expect(qs).toEqual(faq.mainEntity.map((q) => q.name));
    await expect(page.locator('.nota-verba')).toContainText('não está inclusa');
  });

  test('sem claims inventados, Tailwind nem gradientes', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    const html = await page.content();
    expect(html).not.toMatch(/tailwind/i);
    expect(html).not.toMatch(/ROAS|clientes atendidos|depoimento/i);
    const css = await (await page.request.get('/css/style.css')).text();
    expect(css).not.toMatch(/gradient/);
  });

  test('sem erros de console e sem requisição a domínios inesperados', async ({ page }) => {
    const { errors, requests } = await prepare(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
    const externos = requests.filter((u) => !u.startsWith('http://127.0.0.1') && !/fonts\.(googleapis|gstatic)\.com/.test(u));
    expect(externos).toEqual([]);
  });

  test('robots.txt e sitemap.xml existem', async ({ request }) => {
    const r = await request.get('/robots.txt');
    expect(await r.text()).toContain('Sitemap: https://lp.marck0101.com.br/sitemap.xml');
    const s = await request.get('/sitemap.xml');
    expect(await s.text()).toContain('<loc>https://lp.marck0101.com.br/</loc>');
  });

  test('llms.txt é text/plain e aponta catálogo, blog e portfólio', async ({ request }) => {
    const r = await request.get('/llms.txt');
    expect(r.status()).toBe(200);
    const corpo = await r.text();
    for (const u of ['https://servicos.marck0101.com.br', 'https://blog.marck0101.com.br', 'https://marck0101.com.br']) expect(corpo).toContain(u);
    expect(corpo).not.toMatch(/pequen|PME/i);
  });
});

test.describe('acessibilidade (axe)', () => {
  for (const estado of ['banner aberto', 'banner fechado']) {
    test(`sem violações axe com ${estado}`, async ({ page }) => {
      await prepare(page);
      await page.goto('/');
      if (estado === 'banner fechado') await page.getByRole('button', { name: 'Recusar' }).click();
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    });
  }
});

test('só os arquivos do site são publicados', async ({ request }) => {
  for (const p of ['/package.json', '/tests/lp.spec.js', '/scripts/build.mjs', '/netlify.toml', '/README.md', '/LICENSE']) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
  for (const p of ['/', '/privacidade', '/css/style.css', '/js/app.js', '/js/consent.js', '/img/og.png', '/robots.txt', '/sitemap.xml']) {
    expect((await request.get(p)).status(), p).toBe(200);
  }
});

test.describe('política de privacidade própria', () => {
  test('links do rodapé e do banner apontam para /privacidade da LP', async ({ page }) => {
    await prepare(page);
    await page.goto('/');
    for (const sel of ['.rodape a:has-text("Política de privacidade")', '#cookies a:has-text("política de privacidade")']) {
      expect(await page.locator(sel).getAttribute('href')).toBe('/privacidade');
    }
    expect(await page.content()).not.toContain('vercel.app/privacidade');
  });

  test('página carrega com banner, sem rastreio antes do aceite, h1 único e sem violações axe', async ({ page }) => {
    const { requests, errors } = await prepare(page);
    await page.goto('/privacidade');
    await expect(page.locator('h1')).toHaveText('Política de privacidade');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#cookies')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lp.marck0101.com.br/privacidade');
    await expect(page.locator('main')).toContainText('não usa pixel de remarketing');
    await page.waitForTimeout(400);
    expect(trackerRequests(requests)).toEqual([]);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test('não qualifica o negócio do público por tamanho', async ({ page }) => {
  for (const url of ['/', '/privacidade']) {
    await page.goto(url);
    expect(await page.content(), url).not.toMatch(/pequen[oa]s?/i);
  }
});
