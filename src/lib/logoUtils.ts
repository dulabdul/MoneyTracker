/**
 * logoUtils.ts — Performance-first brand logo resolver.
 *
 * Strategy (in order):
 * 1. Local inline SVG data URI for top 20 most popular brands  → zero network request
 * 2. Google Favicon Service CDN for long-tail known domains     → fast, cached globally
 * 3. Deterministic gradient + initial fallback                  → always works offline
 */

export interface AdaptiveLogo {
  type: "svg" | "img" | "fallback";
  value: string;       // SVG data URI, img URL, or initial letter
  bgGradient?: string; // only for fallback type
}

// ─── Inline SVG icons for top brands ─────────────────────────────────────────
// Using official brand colors as simple SVG for maximum performance (no network request)
const INLINE_SVGS: Record<string, string> = {
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.63 31.63 0 000 12a31.63 31.63 0 00.5 5.81 3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.63 31.63 0 0024 12a31.63 31.63 0 00-.5-5.81zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg>`,

  netflix: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#E50914" d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.549a122.45 122.45 0 005.505.332c-2.978-8.37-5.32-14.99-8.35-23.887a123.052 123.052 0 00-5.503 0zm8.878 0v9.716c.986 2.556 1.457 4.27 2.502 7.228V0h-2.502zm-8.402.049C4.668.413 3.398.799 2.18 1.129v22.83a123.718 123.718 0 004.096-.04V.049z"/></svg>`,

  spotify: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,

  paypal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c1.379 8.883-5.037 11.123-10.056 11.123H8.23l-1.636 10.4h4.063c.457 0 .844-.331.916-.782l.038-.196.727-4.608.047-.253c.07-.45.457-.782.914-.782h.575c3.73 0 6.65-1.516 7.503-5.9.357-1.835.172-3.369-.655-4.46z"/></svg>`,

  grab: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#00B14F"/><text x="12" y="17" font-size="11" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">grab</text></svg>`,

  gojek: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#00AED6"/><text x="12" y="17" font-size="11" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">go</text></svg>`,

  tokopedia: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#42B549"/><text x="12" y="16" font-size="8" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">toko</text></svg>`,

  shopee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#EE4D2D"/><text x="12" y="16" font-size="8" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">shopee</text></svg>`,

  lazada: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0F146D"/><text x="12" y="16" font-size="8" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">LAZADA</text></svg>`,

  apple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`,

  google: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,

  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,

  steam: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1b2838" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/></svg>`,

  upwork: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#6FDA44" d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H8.557v7.094c-.002 1.497-1.216 2.707-2.712 2.707-1.497 0-2.71-1.21-2.712-2.707V3.492H1.124v7.094c0 2.966 2.411 5.373 5.373 5.373 2.962 0 5.37-2.405 5.373-5.367v-1.19c.535 1.12 1.228 2.266 2.112 3.285l-1.798 8.4h2.21l1.303-6.078c1.12.47 2.303.78 3.494.78 3.04 0 5.516-2.482 5.516-5.527 0-3.047-2.475-5.532-5.146-5.532z"/></svg>`,

  bca: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#005BAA"/><text x="12" y="16" font-size="8" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">BCA</text></svg>`,

  mandiri: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#003D82"/><text x="12" y="16" font-size="6" font-family="Arial" font-weight="bold" fill="#F7A800" text-anchor="middle">MANDIRI</text></svg>`,

  bri: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#003087"/><text x="12" y="16" font-size="9" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">BRI</text></svg>`,

  bni: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#F7A800"/><text x="12" y="16" font-size="9" font-family="Arial" font-weight="bold" fill="#003087" text-anchor="middle">BNI</text></svg>`,

  ovo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#4C3494"/><text x="12" y="16" font-size="9" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">OVO</text></svg>`,

  dana: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#108EE9"/><text x="12" y="16" font-size="8" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">DANA</text></svg>`,

  gopay: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#00AED6"/><text x="12" y="16" font-size="7" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">GoPay</text></svg>`,
};

// ─── Known domains for Google Favicon fallback ─────────────────────────────────
const DOMAIN_MAP: Record<string, string> = {
  // streaming
  netflix:   "netflix.com",
  spotify:   "spotify.com",
  youtube:   "youtube.com",
  disney:    "disneyplus.com",
  hbo:       "hbomax.com",
  prime:     "primevideo.com",
  vidio:     "vidio.com",
  // payment & banking
  paypal:    "paypal.com",
  wise:      "wise.com",
  stripe:    "stripe.com",
  // e-commerce
  tokopedia: "tokopedia.com",
  shopee:    "shopee.co.id",
  lazada:    "lazada.co.id",
  bukalapak: "bukalapak.com",
  blibli:    "blibli.com",
  // ride-hailing / delivery
  grab:      "grab.com",
  gojek:     "gojek.com",
  maxim:     "taximaxim.com",
  // tech / services
  google:    "google.com",
  apple:     "apple.com",
  microsoft: "microsoft.com",
  github:    "github.com",
  steam:     "steampowered.com",
  discord:   "discord.com",
  zoom:      "zoom.us",
  // freelance
  upwork:    "upwork.com",
  fiverr:    "fiverr.com",
  freelancer:"freelancer.com",
};

// ─── Gradient fallbacks ────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-teal-600 to-emerald-700",
  "from-indigo-600 to-violet-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-orange-700",
  "from-sky-600 to-blue-700",
  "from-fuchsia-600 to-purple-700",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

// Convert SVG string to data URI (no base64 needed — URL-encode)
function svgToDataUri(svg: string): string {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// ─── Main resolver ─────────────────────────────────────────────────────────────
export function getTransactionLogo(description: string, category: string): AdaptiveLogo {
  const norm = (description + " " + category).toLowerCase().trim();

  // 1. Inline SVG for top brands → zero network, instant
  for (const [key, svg] of Object.entries(INLINE_SVGS)) {
    if (norm.includes(key)) {
      return { type: "svg", value: svgToDataUri(svg) };
    }
  }

  // 2. Google Favicon CDN (sz=64 → 64×64, fast & cached globally)
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (norm.includes(key)) {
      return {
        type: "img",
        value: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    }
  }

  // 3. Try to detect any domain pattern in description
  const domainMatch = description.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,6})/);
  if (domainMatch) {
    return {
      type: "img",
      value: `https://www.google.com/s2/favicons?domain=${domainMatch[0]}&sz=64`,
    };
  }

  // 4. Gradient + initial fallback
  const initial = description.trim().charAt(0).toUpperCase() || "T";
  const gradient = GRADIENTS[hashStr(description) % GRADIENTS.length];
  return { type: "fallback", value: initial, bgGradient: gradient };
}

export function getAccountLogo(name: string): AdaptiveLogo {
  const norm = name.toLowerCase().trim();

  // 1. Match popular brand SVG logos
  for (const [key, svg] of Object.entries(INLINE_SVGS)) {
    if (norm.includes(key)) {
      return { type: "svg", value: svgToDataUri(svg) };
    }
  }

  // 2. Fallback gradient letters
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  const gradient = GRADIENTS[hashStr(name) % GRADIENTS.length];
  return { type: "fallback", value: initial, bgGradient: gradient };
}
