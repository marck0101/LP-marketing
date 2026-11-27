/*
 * Consentimento + carregamento do GTM. Carrega SINCRONO no <head>, antes de qualquer outro script.
 * Ordem: dataLayer/gtag -> Consent Mode v2 NEGADO -> funcao que carrega o GTM (so apos aceite).
 * Sem aceite: nenhuma requisicao ao Google/Microsoft.
 */
// TODO: trocar pelo contêiner padrão quando o dono decidir (ver plano-de-medicao.md)
var GTM_ID = 'GTM-MNHZG36Q';

var CONSENT_KEY = 'marck0101:lp:consent:v1';
var CONSENT_TTL_MS = 182 * 24 * 60 * 60 * 1000; // 6 meses

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});

window.loadGtm = function () {
  if (window.__gtmLoaded || !GTM_ID) return;
  window.__gtmLoaded = true;
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
  document.head.appendChild(s);
};

window.readConsent = function () {
  try {
    var c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    if (c && typeof c.analytics === 'boolean' && typeof c.at === 'number' && Date.now() - c.at <= CONSENT_TTL_MS) return c;
  } catch (e) {}
  return null;
};

window.applyConsent = function (analytics) {
  gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  window.dataLayer.push({
    event: 'cookie_consent_update',
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied'
  });
  if (analytics) window.loadGtm();
};

window.saveConsent = function (analytics) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: analytics, at: Date.now() })); } catch (e) {}
};

(function () {
  var c = window.readConsent();
  if (c) window.applyConsent(c.analytics);
})();
