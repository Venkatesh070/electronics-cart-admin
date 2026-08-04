/**
 * Force-replace browser tab icons. Chrome caches favicons hard, so we remove
 * existing icon links and re-insert with a cache-busting query string.
 */
export function applyBrandIcons({ logoUrl, fallback = "/favicon.svg", appleFallback = "/apple-touch-icon.svg" } = {}) {
  const bust = `v=${Date.now()}`;
  const withBust = (href) => {
    if (!href) return href;
    if (/^(data:|blob:)/i.test(href)) return href;
    return href.includes("?") ? `${href}&${bust}` : `${href}?${bust}`;
  };

  const iconHref = withBust(logoUrl || fallback);
  const appleHref = withBust(logoUrl || appleFallback || fallback);

  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((node) => node.remove());

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = iconHref;
  if (!logoUrl && /\.svg($|\?)/i.test(fallback)) icon.type = "image/svg+xml";
  document.head.appendChild(icon);

  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  shortcut.href = iconHref;
  document.head.appendChild(shortcut);

  const apple = document.createElement("link");
  apple.rel = "apple-touch-icon";
  apple.href = appleHref;
  document.head.appendChild(apple);
}
