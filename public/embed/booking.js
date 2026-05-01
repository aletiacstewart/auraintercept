/**
 * Aura Intercept — Drop-in booking widget loader
 *
 * Usage on any website (no build step required):
 *
 *   <div data-aura-booking="<company-slug>"></div>
 *   <script async src="https://auraintercept.ai/embed/booking.js"></script>
 *
 * Optional attributes on the host <div>:
 *   data-aura-booking      (required) company slug
 *   data-aura-host         override origin (default https://auraintercept.ai)
 *   data-aura-min-height   minimum iframe height in px (default 720)
 *   data-aura-max-width    max wrapper width (e.g. "640px", default "100%")
 *   data-aura-theme        "light" | "dark" (passed through as ?theme=)
 *   data-aura-primary      hex color, passed through as ?primary=
 *
 * The loader auto-mounts an iframe pointed at /book/{slug}?embed=1 and
 * resizes itself in response to postMessage events from the booking page.
 */
(function () {
  if (window.__AURA_BOOKING_LOADER__) return;
  window.__AURA_BOOKING_LOADER__ = true;

  var DEFAULT_HOST = 'https://auraintercept.ai';
  var DEFAULT_MIN_HEIGHT = 720;

  function mount(el) {
    if (!el || el.getAttribute('data-aura-mounted') === '1') return;
    var slug = el.getAttribute('data-aura-booking');
    if (!slug) return;

    var host = el.getAttribute('data-aura-host') || DEFAULT_HOST;
    var minHeight = parseInt(el.getAttribute('data-aura-min-height') || '', 10);
    if (isNaN(minHeight) || minHeight <= 0) minHeight = DEFAULT_MIN_HEIGHT;
    var maxWidth = el.getAttribute('data-aura-max-width') || '100%';
    var theme = el.getAttribute('data-aura-theme') || '';
    var primary = el.getAttribute('data-aura-primary') || '';

    var qs = ['embed=1'];
    if (theme) qs.push('theme=' + encodeURIComponent(theme));
    if (primary) qs.push('primary=' + encodeURIComponent(primary));
    var src = host.replace(/\/$/, '') + '/book/' + encodeURIComponent(slug) + '?' + qs.join('&');

    el.style.maxWidth = maxWidth;
    el.style.margin = el.style.margin || '0 auto';

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Book appointment';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.style.width = '100%';
    iframe.style.minHeight = minHeight + 'px';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.background = 'transparent';
    iframe.dataset.auraBookingSlug = slug;
    iframe.dataset.auraExpectedOrigin = new URL(src).origin;

    el.innerHTML = '';
    el.appendChild(iframe);
    el.setAttribute('data-aura-mounted', '1');
  }

  function mountAll() {
    var nodes = document.querySelectorAll('[data-aura-booking]:not([data-aura-mounted="1"])');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  // Listen for height messages from booking iframes.
  window.addEventListener('message', function (ev) {
    var data = ev && ev.data;
    if (!data || typeof data !== 'object') return;
    if (data.source !== 'aura-booking') return;
    if (data.type !== 'resize' || typeof data.height !== 'number') return;

    var iframes = document.querySelectorAll('iframe[data-aura-booking-slug]');
    for (var i = 0; i < iframes.length; i++) {
      var f = iframes[i];
      if (f.dataset.auraExpectedOrigin && ev.origin !== f.dataset.auraExpectedOrigin) continue;
      if (data.slug && f.dataset.auraBookingSlug !== data.slug) continue;
      var h = Math.max(parseInt(f.style.minHeight, 10) || 0, Math.ceil(data.height) + 8);
      f.style.height = h + 'px';
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }

  // Re-scan when new mount points are added dynamically (SPA hosts).
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function () { mountAll(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();