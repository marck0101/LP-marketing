/* Interacoes da LP: banner de cookies, links de WhatsApp (campanha) e eventos do dataLayer. */
(function () {
  'use strict';

  // URL do catalogo: trocar aqui quando o dominio final (servicos.marck0101.com.br) estiver no ar.
  // Os links com data-catalogo no HTML tem o mesmo valor como fallback sem JS (ver README).
  var CATALOG_URL = 'https://catalog0101.vercel.app';
  var PAGE_TYPE = 'lp_trafego';

  function push(obj) { (window.dataLayer = window.dataLayer || []).push(obj); }

  // ---- Catalogo: reaponta links a partir da constante
  document.querySelectorAll('a[data-catalogo]').forEach(function (a) {
    a.setAttribute('href', CATALOG_URL + (a.getAttribute('data-catalogo') || ''));
  });

  // ---- WhatsApp: anexa a campanha (utm_campaign) e emite whatsapp_click
  var params = new URLSearchParams(window.location.search);
  var campaign = params.get('utm_campaign');
  if (campaign) campaign = campaign.replace(/[^\w.\- ]/g, '').slice(0, 60) || null;

  document.querySelectorAll('a[data-wa]').forEach(function (a) {
    if (campaign) {
      var url = new URL(a.href);
      var text = url.searchParams.get('text') || '';
      url.searchParams.set('text', text + ' (campanha: ' + campaign + ')');
      a.href = url.toString();
    }
    a.addEventListener('click', function () {
      var key = a.getAttribute('data-wa');
      var ev = {
        event: 'whatsapp_click',
        link_location: key.replace(/-/g, '_'),
        page_type: PAGE_TYPE,
        ref: 'lp-' + key
      };
      push(ev);
      if (key === 'pre-diagnostico') {
        push({ event: 'pre_diagnostico_cta', link_location: ev.link_location, page_type: PAGE_TYPE, ref: ev.ref });
      }
    });
  });

  // ---- Catalogo/blog: select_content
  document.querySelectorAll('a[data-select]').forEach(function (a) {
    a.addEventListener('click', function () {
      push({
        event: 'select_content',
        content_type: a.getAttribute('data-select'),
        item_id: a.getAttribute('data-item'),
        link_location: a.getAttribute('data-loc')
      });
    });
  });

  // ---- Banner de cookies
  var banner = document.getElementById('cookies');
  var title = document.getElementById('cookies-titulo');
  function setBanner(open, focus) {
    banner.hidden = !open;
    document.body.toggleAttribute('data-aviso-cookies', open);
    if (open && focus) title.focus();
  }
  function choose(analytics) {
    window.saveConsent(analytics);
    window.applyConsent(analytics);
    setBanner(false);
  }
  document.getElementById('cookies-aceitar').addEventListener('click', function () { choose(true); });
  document.getElementById('cookies-recusar').addEventListener('click', function () { choose(false); });
  var reopen = document.getElementById('cookies-preferencias');
  if (reopen) reopen.addEventListener('click', function () { setBanner(true, true); });
  if (!window.readConsent()) setBanner(true, false);

  // ---- Botao flutuante some enquanto um CTA de WhatsApp da pagina esta visivel
  var fab = document.getElementById('wa-flutuante');
  var targets = document.querySelectorAll('[data-cta-whatsapp]');
  if (fab && targets.length && 'IntersectionObserver' in window) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
      });
      fab.hidden = visible.size > 0;
    });
    targets.forEach(function (t) { io.observe(t); });
  }
})();
