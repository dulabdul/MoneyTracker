import { c as createComponent } from './astro-component_BZpYguPY.mjs';
import 'piccolore';
import { m as maybeRenderHead, h as addAttribute, k as renderTemplate, o as renderComponent, p as Fragment } from './entrypoint_CEi4kyBi.mjs';
import { r as renderScript, f as fetchDashboardData, i as isConfigured, s as supabase, $ as $$Layout } from './Layout_BthChk5b.mjs';
import { F as FilterControls } from './FilterControls_BOUz61h1.mjs';
import 'clsx';

const INLINE_SVGS = {
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
  gopay: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#00AED6"/><text x="12" y="16" font-size="7" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">GoPay</text></svg>`
};
const DOMAIN_MAP = {
  // streaming
  netflix: "netflix.com",
  spotify: "spotify.com",
  youtube: "youtube.com",
  disney: "disneyplus.com",
  hbo: "hbomax.com",
  prime: "primevideo.com",
  vidio: "vidio.com",
  // payment & banking
  paypal: "paypal.com",
  wise: "wise.com",
  stripe: "stripe.com",
  // e-commerce
  tokopedia: "tokopedia.com",
  shopee: "shopee.co.id",
  lazada: "lazada.co.id",
  bukalapak: "bukalapak.com",
  blibli: "blibli.com",
  // ride-hailing / delivery
  grab: "grab.com",
  gojek: "gojek.com",
  maxim: "taximaxim.com",
  // tech / services
  google: "google.com",
  apple: "apple.com",
  microsoft: "microsoft.com",
  github: "github.com",
  steam: "steampowered.com",
  discord: "discord.com",
  zoom: "zoom.us",
  // freelance
  upwork: "upwork.com",
  fiverr: "fiverr.com",
  freelancer: "freelancer.com"
};
const GRADIENTS = [
  "from-teal-600 to-emerald-700",
  "from-indigo-600 to-violet-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-orange-700",
  "from-sky-600 to-blue-700",
  "from-fuchsia-600 to-purple-700"
];
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}
function svgToDataUri(svg) {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
function getTransactionLogo(description, category) {
  const norm = (description + " " + category).toLowerCase().trim();
  for (const [key, svg] of Object.entries(INLINE_SVGS)) {
    if (norm.includes(key)) {
      return { type: "svg", value: svgToDataUri(svg) };
    }
  }
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (norm.includes(key)) {
      return {
        type: "img",
        value: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      };
    }
  }
  const domainMatch = description.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,6})/);
  if (domainMatch) {
    return {
      type: "img",
      value: `https://www.google.com/s2/favicons?domain=${domainMatch[0]}&sz=64`
    };
  }
  const initial = description.trim().charAt(0).toUpperCase() || "T";
  const gradient = GRADIENTS[hashStr(description) % GRADIENTS.length];
  return { type: "fallback", value: initial, bgGradient: gradient };
}

const $$DonutChart = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DonutChart;
  const {
    title = "Income Distribution",
    centerLabel = "Total",
    centerValue = "Rp 0",
    segments = []
  } = Astro2.props;
  const R = 75;
  const CIRC = 2 * Math.PI * R;
  const TOTAL_PCT = segments.reduce((s, seg) => s + seg.percentage, 0) || 100;
  let currentOffset = 0;
  const segmentData = segments.map((seg) => {
    const pct = seg.percentage / TOTAL_PCT;
    const dashLen = pct * CIRC;
    const dashGap = CIRC - dashLen + 2;
    const offset = CIRC - currentOffset;
    currentOffset += dashLen;
    return { ...seg, dashLen, dashGap, offset };
  });
  function formatIDR(n) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(n);
  }
  const chartId = `donut-${Math.random().toString(36).slice(2, 8)}`;
  return renderTemplate`${maybeRenderHead()}<div class="donut-chart-card flex flex-col p-5 bg-card border border-border/80 rounded-3xl h-full shadow-sm hover:shadow-md transition-all select-none"${addAttribute(chartId, "data-chart-id")}> <div class="flex items-center justify-between mb-3"> <h4 class="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">${title}</h4> </div> <!-- Donut + Center --> <div class="flex-1 flex flex-col items-center justify-center min-h-[160px]"> ${segments.length === 0 ? renderTemplate`<div class="text-center py-8 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2"> <svg class="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z"></path> <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path> </svg> <span>Belum ada data distribusi</span> </div>` : renderTemplate`<div class="relative w-full max-w-[180px] aspect-square flex items-center justify-center"> <svg class="w-full h-full transform -rotate-90" viewBox="0 0 200 200"> <!-- Track ring --> <circle cx="100" cy="100"${addAttribute(R, "r")} fill="none" stroke="var(--color-border)" stroke-width="14" stroke-opacity="0.4"></circle> ${segmentData.map((seg) => renderTemplate`<circle cx="100" cy="100"${addAttribute(R, "r")} fill="none"${addAttribute(seg.color, "stroke")} stroke-width="16"${addAttribute(`${seg.dashLen - 3} ${seg.dashGap + 3}`, "stroke-dasharray")}${addAttribute(seg.offset, "stroke-dashoffset")} stroke-linecap="round"${addAttribute(seg.category, "data-category")}${addAttribute(formatIDR(seg.amount), "data-value")}${addAttribute(`${seg.percentage}%`, "data-percentage")}${addAttribute(seg.color, "data-color")} class="donut-segment transition-all duration-300 cursor-pointer outline-none"></circle>`)} </svg> <!-- Center Labels --> <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"> <span class="donut-center-label text-[9px] font-extrabold uppercase tracking-widest text-[#1B5C58]/80 dark:text-teal-400 transition-all duration-200">${centerLabel}</span> <span class="donut-center-value text-sm font-black tracking-tight text-foreground mt-0.5 transition-all duration-200">${centerValue}</span> <span class="donut-center-sub text-[9px] font-bold text-teal-600 dark:text-teal-400 opacity-0 transition-all duration-200 mt-0.5"></span> </div> </div>`} </div> <!-- Legend --> ${segments.length > 0 && renderTemplate`<div class="w-full mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/40 pt-3"> ${segments.map((seg) => renderTemplate`<div class="flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"${addAttribute(seg.category, "data-legend-cat")}> <span class="h-2.5 w-2.5 rounded-full shrink-0"${addAttribute(`background-color: ${seg.color};`, "style")}></span> <div class="flex-1 min-w-0"> <p class="truncate text-foreground leading-none text-[11px]">${seg.category}</p> <p class="text-[9px] text-muted-foreground font-medium mt-0.5">${seg.percentage}%</p> </div> </div>`)} </div>`} </div> ${renderScript($$result, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/charts/DonutChart.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/charts/DonutChart.astro", void 0);

const $$BarChart = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BarChart;
  const { title = "Weekly Expenses" } = Astro2.props;
  let { weeklyData = [] } = Astro2.props;
  if (!weeklyData || weeklyData.length === 0) {
    weeklyData = [
      { day: "Mon", amount: 0, heightPct: 5 },
      { day: "Tue", amount: 0, heightPct: 5 },
      { day: "Wed", amount: 0, heightPct: 5 },
      { day: "Thu", amount: 0, heightPct: 5 },
      { day: "Fri", amount: 0, heightPct: 5 },
      { day: "Sat", amount: 0, heightPct: 5 },
      { day: "Sun", amount: 0, heightPct: 5 }
    ];
  }
  function formatIDR(n) {
    if (n === 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(n);
  }
  const maxAmount = Math.max(...weeklyData.map((d) => d.amount), 1);
  function yLabel(amount) {
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}jt`;
    if (amount >= 1e3) return `${Math.round(amount / 1e3)}rb`;
    return amount.toString();
  }
  return renderTemplate`${maybeRenderHead()}<div class="flex flex-col p-5 bg-card border border-border/80 rounded-3xl h-full shadow-sm hover:shadow-md transition-all"> <div class="flex items-center justify-between"> <h4 class="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">${title}</h4> <span class="text-[10px] font-semibold text-muted-foreground">This Week</span> </div> <div class="mt-5 flex flex-1 items-end gap-2 min-h-[180px] h-full pb-1"> <!-- Y-Axis --> <div class="flex flex-col justify-between h-[160px] text-[9px] font-semibold text-muted-foreground select-none pr-1 text-right w-10 shrink-0"> <span>${yLabel(maxAmount)}</span> <span>${yLabel(Math.round(maxAmount * 0.75))}</span> <span>${yLabel(Math.round(maxAmount * 0.5))}</span> <span>${yLabel(Math.round(maxAmount * 0.25))}</span> <span>0</span> </div> <!-- Chart area --> <div class="flex-1 flex items-end justify-between h-[160px] border-l border-b border-border/40 pl-2 relative"> <!-- Grid guides --> <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10"> ${[0, 1, 2, 3].map(() => renderTemplate`<div class="border-t border-muted-foreground w-full"></div>`)} </div> ${weeklyData.map((bar) => renderTemplate`<div class="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative px-0.5"> <!-- Tooltip --> <div class="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B5C58] dark:bg-teal-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap pointer-events-none -translate-x-1/2 left-1/2"> ${formatIDR(bar.amount)} </div> <!-- Bar --> <div${addAttribute(`w-full max-w-[12px] rounded-t-full transition-all duration-500 group-hover:brightness-110 ${bar.amount > 0 ? "bg-gradient-to-t from-primary to-primary/70" : "bg-muted/40"}`, "class")}${addAttribute(`height: ${bar.heightPct}%`, "style")}></div> <!-- X label --> <span class="text-[9px] font-medium text-muted-foreground group-hover:text-foreground mt-2 select-none absolute -bottom-5 transition-colors"> ${bar.day} </span> </div>`)} </div> </div> </div>`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/charts/BarChart.astro", void 0);

const $$AreaChart = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$AreaChart;
  let { monthlyData = [] } = Astro2.props;
  function formatIDR(n2) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(n2);
  }
  const peakValue = formatIDR(Math.max(...monthlyData.map((d) => d.income), 1));
  const maxIncome = Math.max(...monthlyData.map((d) => d.income), 1);
  const n = monthlyData.length;
  const xStep = n > 1 ? 280 / (n - 1) : 280;
  const points = monthlyData.map((d, i) => ({
    ...d,
    x: 10 + i * xStep,
    // y inverted: 0 income = 110, maxIncome = 10
    y: 110 - d.income / maxIncome * 100,
    // percent for overlay markers
    leftPct: n > 1 ? i / (n - 1) * 100 : 50,
    topPct: 100 - d.income / maxIncome * 100,
    formatted: formatIDR(d.income)
  }));
  function buildSplinePath(pts) {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) / 3;
      const cp1y = pts[i].y;
      const cp2x = pts[i + 1].x - (pts[i + 1].x - pts[i].x) / 3;
      const cp2y = pts[i + 1].y;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  }
  const splinePath = buildSplinePath(points);
  const areaPath = points.length > 0 ? `${splinePath} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z` : "";
  return renderTemplate`${maybeRenderHead()}<div class="flex flex-col p-5 bg-card border border-border/80 rounded-3xl h-full shadow-sm hover:shadow-md transition-all select-none area-chart-container"> <div class="flex items-center justify-between"> <h4 class="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">Income vs Prev Period</h4> </div> <!-- Chart area --> <div class="mt-5 flex-1 flex flex-col justify-end relative w-full min-h-[140px]"> ${monthlyData.length === 0 ? renderTemplate`<div class="text-center py-12 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 h-full"> <svg class="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path> </svg> <span>Belum ada data history bulanan</span> </div>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <div class="relative w-full h-[140px]"> <!-- Peak value label --> <div class="absolute top-[4px] right-0 bg-muted/60 dark:bg-zinc-800 text-teal-800 dark:text-teal-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-border z-10 shadow-sm select-none"> ${peakValue} </div> <!-- Dashed guide line --> <div class="absolute top-[16px] left-0 right-0 border-t border-dashed border-border/50 z-0"></div> <!-- Floating tooltip --> <div id="area-tooltip" class="absolute bg-white dark:bg-zinc-800 text-foreground text-[10px] font-bold px-3 py-1.5 rounded-full border border-border/80 shadow-lg pointer-events-none opacity-0 scale-95 transition-all duration-200 z-30 flex items-center gap-1.5 -translate-x-1/2" style="left: 50%; top: 0;"> <span id="area-tooltip-month" class="text-[9px] uppercase tracking-wider text-muted-foreground border-r border-border/60 pr-1.5">Jun</span> <span id="area-tooltip-value" class="text-emerald-600 dark:text-emerald-400 font-extrabold">${peakValue}</span> </div> <!-- SVG --> <svg class="w-full h-full z-0 overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none"> <defs> <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.22"></stop> <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"></stop> </linearGradient> </defs> ${areaPath && renderTemplate`<path${addAttribute(areaPath, "d")} fill="url(#areaGrad)"></path>`} ${splinePath && renderTemplate`<path${addAttribute(splinePath, "d")} fill="none" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>`} </svg> <!-- Interactive markers --> <div class="absolute inset-0 z-20 pointer-events-none"> ${points.map((pt) => renderTemplate`<div class="area-marker absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer pointer-events-auto"${addAttribute(`left: ${pt.leftPct.toFixed(2)}%; top: ${Math.max(5, Math.min(95, pt.topPct)).toFixed(2)}%;`, "style")}${addAttribute(pt.month, "data-month")}${addAttribute(pt.formatted, "data-value")}> <span class="w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-400 border-2 border-white dark:border-zinc-900 rounded-full shadow-md transition-all duration-200"></span> </div>`)} </div> </div>  <div class="flex items-center justify-between text-[9px] font-semibold text-muted-foreground mt-3 select-none px-1"> ${monthlyData.map((d) => renderTemplate`<span>${d.month}</span>`)} </div> ` })}`} </div> </div> ${renderScript($$result, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/charts/AreaChart.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/charts/AreaChart.astro", void 0);

const $$BudgetProgress = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BudgetProgress;
  const {
    budgetLimit = 12e7,
    ytdSpent = 0,
    ytdIncome = 0,
    percentage = 0
  } = Astro2.props;
  function formatIDR(n) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(n);
  }
  const remaining = Math.max(0, budgetLimit - ytdSpent);
  const pct = percentage || Math.min(100, Math.round(ytdSpent / budgetLimit * 100));
  const isOverBudget = ytdSpent > budgetLimit;
  const savingsRate = ytdIncome > 0 ? Math.round((ytdIncome - ytdSpent) / ytdIncome * 100) : 0;
  return renderTemplate`${maybeRenderHead()}<div class="flex flex-col p-5 bg-card border border-border/80 rounded-3xl h-full justify-between shadow-sm hover:shadow-md transition-all"> <div> <h4 class="text-xs font-bold text-[#1B5C58] dark:text-teal-400 uppercase tracking-wider">YTD Budget Summary</h4> <p class="text-[11px] text-muted-foreground mt-0.5">Budget allocations and spending for ${(/* @__PURE__ */ new Date()).getFullYear()}.</p> </div> <div class="mt-4 space-y-4 flex-1 flex flex-col justify-center"> <!-- Progress bar --> <div class="space-y-1.5"> <div class="flex items-center justify-between text-xs font-bold text-foreground"> <span>Year to Date Usage</span> <span${addAttribute(isOverBudget ? "text-rose-500" : "text-[#2F7E79] dark:text-teal-400", "class")}>${pct}%</span> </div> <div class="h-3 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden p-[2px] border border-zinc-200/50 dark:border-none shadow-inner"> <div${addAttribute(`h-full rounded-full transition-all duration-700 ${isOverBudget ? "bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "bg-gradient-to-r from-teal-600 to-teal-500 shadow-[0_0_8px_rgba(47,126,121,0.3)]"}`, "class")}${addAttribute(`width: ${Math.min(pct, 100)}%`, "style")}></div> </div> </div> <!-- Stats grid --> <div class="grid grid-cols-2 gap-3 text-xs"> <div class="bg-zinc-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-border/60"> <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Total Budget</span> <span class="font-extrabold text-foreground mt-1 block text-sm">${formatIDR(budgetLimit)}</span> </div> <div class="bg-zinc-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-border/60"> <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">YTD Spent</span> <span${addAttribute(`font-extrabold mt-1 block text-sm ${isOverBudget ? "text-rose-500" : "text-foreground"}`, "class")}>${formatIDR(ytdSpent)}</span> </div> </div> </div> <!-- Footer note --> <div${addAttribute(`mt-4 flex items-center gap-2.5 text-[11px] p-3 rounded-2xl border ${isOverBudget ? "bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-[#2F7E79]/5 dark:bg-teal-500/5 border-[#2F7E79]/10 text-muted-foreground"}`, "class")}> <div${addAttribute(`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${isOverBudget ? "bg-rose-500/10 text-rose-500" : "bg-teal-500/10 text-[#2F7E79] dark:text-teal-400"}`, "class")}> ${isOverBudget ? renderTemplate`<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path> </svg>` : renderTemplate`<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg>`} </div> ${isOverBudget ? renderTemplate`<span>Over budget by <span class="font-bold">${formatIDR(ytdSpent - budgetLimit)}</span>.</span>` : renderTemplate`<span>Remaining: <span class="font-bold text-foreground">${formatIDR(remaining)}</span>${ytdIncome > 0 ? ` · Saving rate ${savingsRate}%` : ""}.</span>`} </div> </div>`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/charts/BudgetProgress.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const url = Astro2.url;
  const period = url.searchParams.get("period") || "month";
  const year = parseInt(url.searchParams.get("year") || "2026", 10);
  const month = parseInt(url.searchParams.get("month") || "6", 10);
  const date = url.searchParams.get("date") || void 0;
  const type = url.searchParams.get("type") || "all";
  const liveData = await fetchDashboardData({
    period,
    year,
    month,
    startDate: date,
    endDate: date
  });
  function formatIDR(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  }
  const totalBalance = liveData?.totalBalance ?? 0;
  const monthlyIncome = liveData?.monthlyIncome ?? 0;
  const monthlyExpense = liveData?.monthlyExpense ?? 0;
  const ytdSpent = liveData?.ytdExpense ?? 0;
  const ytdIncome = liveData?.ytdIncome ?? 0;
  const recentTransactions = liveData?.recentTransactions?.length ? liveData.recentTransactions.map((tx) => ({
    description: tx.description,
    category: tx.category_name,
    type: tx.type === "INCOME" || tx.type === "INVESTMENT_SELL" ? "income" : "expense",
    amount: (tx.type === "INCOME" || tx.type === "INVESTMENT_SELL" ? "+ " : "- ") + formatIDR(tx.amount),
    date: new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(new Date(tx.created_at)) + " WIB"
  })) : [];
  const incomeSegments = liveData?.incomeByCategory ?? [];
  const expenseSegments = liveData?.expenseByCategory ?? [];
  const monthlyHistory = liveData?.monthlyIncomeHistory ?? [];
  const weeklyExpenses = liveData?.weeklyExpenses ?? [];
  const MOCK_WALLETS = [];
  const MOCK_CATEGORIES = [];
  let wallets = liveData?.wallets ?? MOCK_WALLETS;
  let categories = MOCK_CATEGORIES;
  if (isConfigured && supabase) {
    try {
      const { data: catRes } = await supabase.from("categories").select("id, name, type");
      if (catRes) categories = catRes;
    } catch {
    }
  }
  Astro2.response.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "FinGram — Home", "description": "Pantau keuangan pribadi, pemasukan, pengeluaran, dan investasi dalam satu dashboard modern." }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="w-full grid gap-6 md:gap-8 md:grid-cols-5 p-4 md:p-6 max-w-6xl mx-auto items-start pb-28 md:pb-8"> <!-- ── Greeting Banner (col-span-3 desktop) ───────────────────────── --> <div class="w-full md:col-span-3 space-y-6"> <div class="w-auto relative bg-gradient-to-b from-[#2F7E79] to-[#1B5C58] -mx-4 mt-[-16px] px-6 pt-20 pb-40 text-white md:mx-0 md:mt-0 md:w-full md:rounded-3xl md:pt-8 md:pb-16 shadow-[0_4px_30px_rgba(27,92,88,0.15)] dark:shadow-none"> <!-- Header row --> <div class="flex items-center justify-between"> <div> <p id="greeting-text" class="text-xs text-teal-100/70 font-semibold tracking-wide uppercase">Good evening,</p> <script>\n              (() => {\n                const hour = new Date().getHours();\n                let greeting = "Good morning,";\n                if (hour >= 12 && hour < 17) {\n                  greeting = "Good afternoon,";\n                } else if (hour >= 17 && hour < 21) {\n                  greeting = "Good evening,";\n                } else if (hour >= 21 || hour < 5) {\n                  greeting = "Good night,";\n                }\n                const el = document.getElementById("greeting-text");\n                if (el) el.textContent = greeting;\n              })();\n            <\/script> <h2 class="text-xl font-bold tracking-tight mt-0.5">Enjolin Morgeana</h2> </div> <div class="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-all"> <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"> <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path> </svg> </div> </div> <!-- SVG wave/arch bottom mask matching Attachment 3 --> <div class="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none translate-y-[1px] md:hidden"> <svg class="relative block w-full h-[48px] text-background fill-current" viewBox="0 0 100 100" preserveAspectRatio="none"> <path d="M0,100 C30,40 70,40 100,100 L100,120 L0,120 Z"></path> </svg> </div> <!-- Balance card --> <div class="absolute left-4 right-4 bottom-0 translate-y-16 md:relative md:left-auto md:right-auto md:translate-y-0 md:mt-8 bg-gradient-to-tr from-[#1B5C58] to-[#2F7E79] rounded-3xl p-5 md:p-6 shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/10 text-white"> <div class="flex items-center justify-between"> <button class="flex items-center gap-1 text-xs font-semibold text-teal-200 hover:text-teal-100 transition-colors">\nTotal Balance\n<svg class="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path> </svg> </button> <!-- Three-dot menu icon matching mockup --> <svg class="h-5 w-5 text-teal-200 cursor-pointer hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M5 12a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z"></path> </svg> </div> <div class="mt-3"> <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight">', '</h3> </div> <div class="mt-5 grid grid-cols-2 gap-2 border-t border-white/15 pt-4"> <div class="flex items-center gap-2"> <div class="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-teal-200"> <!-- Single arrow down for Income --> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path> </svg> </div> <div class="min-w-0"> <p class="text-[9px] uppercase font-bold text-teal-200/80 tracking-wider">Income</p> <p class="text-xs sm:text-sm font-bold mt-0.5 truncate">', '</p> </div> </div> <div class="flex items-center gap-2"> <div class="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-teal-200"> <!-- Single arrow up for Expenses --> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"></path> </svg> </div> <div class="min-w-0"> <p class="text-[9px] uppercase font-bold text-teal-200/80 tracking-wider">Expenses</p> <p class="text-xs sm:text-sm font-bold mt-0.5 truncate">', '</p> </div> </div> </div> </div> </div> </div> <!-- ── Recent Transactions (col-span-2 desktop) ───────────────────── --> <div class="md:col-span-2 px-0 mt-24 md:mt-0 space-y-3 w-full"> <div class="flex items-center justify-between"> <h3 class="text-base font-bold text-foreground">Transaksi Terbaru</h3> <a href="/ledger" class="text-xs font-semibold text-[#2F7E79] dark:text-teal-400 hover:text-[#1B5C58] transition-colors">Lihat semua →</a> </div> <div class="space-y-2 w-full"> ', ' </div> </div> <!-- ── Analytics & Statistics (full width) ────────────────────────── --> <div class="md:col-span-5 space-y-5 mt-4 md:mt-2 w-full"> <div class="border-b border-border/60 pb-4 flex flex-col gap-1"> <h3 class="text-base font-bold text-foreground">Analytics & Statistics</h3> <p class="text-xs text-muted-foreground">\nRingkasan arus kas jangka panjang, distribusi, dan target anggaran.\n', " </p> </div> <!-- Filters --> ", ' <!-- Charts: 2 columns on desktop, 1 on mobile --> <div class="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 w-full"> <!-- 1. Income Distribution Donut --> ', " <!-- 2. Expense Distribution Donut --> ", " <!-- 3. Income vs Prev Period (Area) --> ", " <!-- 4. YTD Budget Summary --> <div", "> ", " </div> <!-- 5. Weekly Expenses Bar (spans 1 col on md+) --> ", " <!-- 6. Account Balance Summary (spans 1 col on md+ or 2 if Weekly Expenses is hidden) --> <div", "> ", " </div> </div> </div> </div> "])), maybeRenderHead(), formatIDR(totalBalance), formatIDR(monthlyIncome), formatIDR(monthlyExpense), recentTransactions.length === 0 ? renderTemplate`<div class="text-center py-10 px-4 bg-card border border-border/80 rounded-3xl text-xs text-muted-foreground flex flex-col items-center justify-center gap-2"> <svg class="h-8 w-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <span>Belum ada transaksi terbaru</span> </div>` : recentTransactions.map((tx) => {
    const logo = getTransactionLogo(tx.description, tx.category);
    return renderTemplate`<div class="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-border transition-all group"> <div class="flex items-center gap-3 min-w-0"> <!-- Logo --> <div class="h-10 w-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-border bg-muted/30"> ${logo.type === "fallback" ? renderTemplate`<div${addAttribute(`h-full w-full flex items-center justify-center text-white font-extrabold text-sm bg-gradient-to-tr ${logo.bgGradient}`, "class")}> ${logo.value} </div>` : renderTemplate`<img${addAttribute(logo.value, "src")}${addAttribute(tx.description, "alt")} class="h-7 w-7 object-contain" loading="lazy" width="28" height="28" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'h-full w-full flex items-center justify-center bg-gradient-to-tr from-teal-600 to-emerald-700 text-white font-bold text-sm\'>' + this.alt.charAt(0).toUpperCase() + '</div>'">`} </div> <div class="min-w-0"> <h4 class="font-bold text-sm text-foreground truncate max-w-[130px]">${tx.description}</h4> <p class="text-[11px] text-muted-foreground mt-0.5">${tx.date}</p> </div> </div> <div class="text-right shrink-0 pl-2"> <p${addAttribute(`font-bold text-sm whitespace-nowrap ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`, "class")}> ${tx.amount} </p> </div> </div>`;
  }), liveData && renderTemplate`<span class="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">● Data langsung dari database</span>`, renderComponent($$result2, "FilterControls", FilterControls, { "client:load": true, "type": type, "period": period, "year": year, "month": month, "date": date, "client:component-hydration": "load", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/FilterControls", "client:component-export": "default" }), (type === "all" || type === "income") && renderTemplate`${renderComponent($$result2, "DonutChart", $$DonutChart, { "title": "Income Distribution", "centerLabel": "Income", "centerValue": formatIDR(monthlyIncome), "segments": incomeSegments.length > 0 ? incomeSegments : void 0 })}`, (type === "all" || type === "spend") && renderTemplate`${renderComponent($$result2, "DonutChart", $$DonutChart, { "title": "Expense Distribution", "centerLabel": "Expenses", "centerValue": formatIDR(monthlyExpense), "segments": expenseSegments.length > 0 ? expenseSegments : [
    { category: "Makanan", amount: 605e3, percentage: 35, color: "oklch(0.65 0.25 45)" },
    { category: "Tagihan", amount: 875e3, percentage: 51, color: "oklch(0.55 0.22 20)" },
    { category: "Hiburan", amount: 239900, percentage: 14, color: "oklch(0.35 0.18 310)" }
  ] })}`, (type === "all" || type === "income") && renderTemplate`${renderComponent($$result2, "AreaChart", $$AreaChart, { "monthlyData": monthlyHistory.length > 0 ? monthlyHistory : void 0 })}`, addAttribute(type !== "all" ? "md:col-span-2" : "", "class"), renderComponent($$result2, "BudgetProgress", $$BudgetProgress, { "budgetLimit": 12e7, "ytdSpent": ytdSpent, "ytdIncome": ytdIncome, "percentage": Math.min(100, Math.round(ytdSpent / 12e7 * 100)) }), (type === "all" || type === "spend") && renderTemplate`<div class="md:col-span-1"> ${renderComponent($$result2, "BarChart", $$BarChart, { "title": "Weekly Expenses", "weeklyData": weeklyExpenses.length > 0 ? weeklyExpenses : void 0 })} </div>`, addAttribute(type === "all" || type === "spend" ? "md:col-span-1" : "md:col-span-2", "class"), renderComponent($$result2, "AccountManager", null, { "client:only": "react", "initialAccounts": wallets, "client:component-hydration": "only", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/AccountManager", "client:component-export": "default" })) })}`;
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/index.astro", void 0);

const $$file = "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
