import { c as createComponent } from './astro-component_BZpYguPY.mjs';
import 'piccolore';
import { q as createRenderInstruction, k as renderTemplate, o as renderComponent, h as addAttribute, v as renderSlot, w as renderHead, x as defineScriptVars } from './entrypoint_CEi4kyBi.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  function addToast(message, type) {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }
  useEffect(() => {
    function handleEvent(e) {
      const customEvent = e;
      const { message, type = "success" } = customEvent.detail || {};
      if (message) {
        addToast(message, type);
      }
    }
    window.addEventListener("show-toast", handleEvent);
    try {
      const pending = sessionStorage.getItem("toast_message");
      if (pending) {
        addToast(pending, "success");
        sessionStorage.removeItem("toast_message");
      }
    } catch (err) {
      console.warn("sessionStorage access failed:", err);
    }
    return () => {
      window.removeEventListener("show-toast", handleEvent);
    };
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-[9999] flex flex-col gap-2.5 pointer-events-none", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
      ` }),
    toasts.map((toast) => /* @__PURE__ */ jsx(ToastCard, { toast, onClose: () => removeToast(toast.id) }, toast.id))
  ] });
}
function ToastCard({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "w-full pointer-events-auto flex items-center justify-between p-4 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-border/80 dark:border-zinc-800/80 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300 relative overflow-hidden group",
      role: "alert",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400", children: /* @__PURE__ */ jsx("svg", { className: "h-4.5 w-4.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }),
          /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-foreground", children: toast.message })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-muted/40 cursor-pointer",
            "aria-label": "Close",
            children: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute bottom-0 left-0 h-0.5 bg-emerald-500/60 dark:bg-emerald-400/60 transition-all ease-linear",
            style: {
              width: "100%",
              animation: "shrink-width 3.5s linear forwards"
            }
          }
        )
      ]
    }
  );
}

const supabaseUrl = "https://tyalceksiigamnwqtivy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWxjZWtzaWlnYW1ud3F0aXZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE4NzI2NSwiZXhwIjoyMDk2NzYzMjY1fQ.CTnUVMJnX-PU8Xdqd1IE1vJfj_okiQv0BkpEpxegVWc";
const isConfigured = Boolean(supabaseAnonKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
const SEGMENT_COLORS = [
  "oklch(0.65 0.20 150)",
  // emerald green
  "oklch(0.45 0.16 250)",
  // blue
  "oklch(0.35 0.18 310)",
  // purple
  "oklch(0.65 0.25 45)",
  // orange
  "oklch(0.55 0.22 20)",
  // rose
  "oklch(0.60 0.18 200)"
  // teal
];
async function fetchDashboardData(params = {}) {
  if (!isConfigured || !supabase) return null;
  try {
    const defaultYear = 2026;
    const defaultMonth = 6;
    const period = params.period ?? "month";
    const year = params.year ?? defaultYear;
    const month = params.month ?? defaultMonth;
    let startStr = "";
    let endStr = "";
    if (period === "month") {
      const sDate = new Date(year, month - 1, 1);
      const eDate = new Date(year, month, 0, 23, 59, 59, 999);
      startStr = sDate.toISOString();
      endStr = eDate.toISOString();
    } else if (period === "year") {
      const sDate = new Date(year, 0, 1);
      const eDate = new Date(year, 11, 31, 23, 59, 59, 999);
      startStr = sDate.toISOString();
      endStr = eDate.toISOString();
    } else if (period === "date") {
      if (params.startDate && params.endDate) {
        startStr = new Date(params.startDate).toISOString();
        const eDate = new Date(params.endDate);
        eDate.setHours(23, 59, 59, 999);
        endStr = eDate.toISOString();
      } else if (params.startDate) {
        const sDate = new Date(params.startDate);
        sDate.setHours(0, 0, 0, 0);
        const eDate = new Date(params.startDate);
        eDate.setHours(23, 59, 59, 999);
        startStr = sDate.toISOString();
        endStr = eDate.toISOString();
      } else {
        const sDate = new Date(year, month - 1, 1);
        const eDate = new Date(year, month, 0, 23, 59, 59, 999);
        startStr = sDate.toISOString();
        endStr = eDate.toISOString();
      }
    }
    const yearStartStr = new Date(year, 0, 1).toISOString();
    const yearEndStr = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
    let targetDate = /* @__PURE__ */ new Date();
    if (period === "month") {
      const today2 = /* @__PURE__ */ new Date();
      if (year === today2.getFullYear() && month === today2.getMonth() + 1) {
        targetDate = today2;
      } else {
        targetDate = new Date(year, month - 1, 15);
      }
    } else if (period === "date" && params.startDate) {
      targetDate = new Date(params.startDate);
    } else if (period === "year") {
      targetDate = new Date(year, 5, 15);
    }
    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const [walletsRes, recentRes, monthlyRes, ytdRes, weekRes] = await Promise.all([
      supabase.from("wallets").select("id, name, balance"),
      supabase.from("transactions").select("*, wallets(name), categories(name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("transactions").select("amount, type, categories(name)").gte("created_at", startStr).lte("created_at", endStr),
      supabase.from("transactions").select("amount, type, categories(name), created_at").gte("created_at", yearStartStr).lte("created_at", yearEndStr),
      supabase.from("transactions").select("amount, type, created_at").gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString())
    ]);
    const wallets = walletsRes.data ?? [];
    const totalBalance = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
    const recentTransactions = (recentRes.data ?? []).map((row) => ({
      ...row,
      wallet_name: row.wallets?.name ?? "—",
      category_name: row.categories?.name ?? "—"
    }));
    const monthly = monthlyRes.data ?? [];
    const monthlyIncome = monthly.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = monthly.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const incomeTx = monthly.filter((t) => t.type === "INCOME");
    const incomeCatMap = {};
    incomeTx.forEach((t) => {
      const cat = t.categories?.name ?? "Lain-lain";
      incomeCatMap[cat] = (incomeCatMap[cat] ?? 0) + t.amount;
    });
    const totalIncomeMonth = Object.values(incomeCatMap).reduce((s, v) => s + v, 0) || 1;
    const incomeByCategory = Object.entries(incomeCatMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amt], i) => ({
      category: cat,
      amount: amt,
      percentage: Math.round(amt / totalIncomeMonth * 100),
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length]
    }));
    const expenseTx = monthly.filter((t) => t.type === "EXPENSE");
    const expCatMap = {};
    expenseTx.forEach((t) => {
      const cat = t.categories?.name ?? "Lain-lain";
      expCatMap[cat] = (expCatMap[cat] ?? 0) + t.amount;
    });
    const totalExpenseMonth = Object.values(expCatMap).reduce((s, v) => s + v, 0) || 1;
    const expenseByCategory = Object.entries(expCatMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amt], i) => ({
      category: cat,
      amount: amt,
      percentage: Math.round(amt / totalExpenseMonth * 100),
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length]
    }));
    const ytdTx = ytdRes.data ?? [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const incomePerMonth = {};
    ytdTx.filter((t) => t.type === "INCOME").forEach((t) => {
      const m = new Date(t.created_at).getMonth();
      incomePerMonth[m] = (incomePerMonth[m] ?? 0) + t.amount;
    });
    const today = /* @__PURE__ */ new Date();
    const historyMonths = year === today.getFullYear() ? today.getMonth() + 1 : 12;
    const monthlyIncomeHistory = Array.from({ length: historyMonths }, (_, i) => ({
      month: monthNames[i],
      monthIndex: i + 1,
      income: incomePerMonth[i] ?? 0
    }));
    const ytdExpense = ytdTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const ytdIncome = ytdTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const weekTx = weekRes.data ?? [];
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const expPerDay = new Array(7).fill(0);
    weekTx.filter((t) => t.type === "EXPENSE").forEach((t) => {
      const d = new Date(t.created_at);
      let dow = d.getDay() === 0 ? 7 : d.getDay();
      expPerDay[dow - 1] += t.amount;
    });
    const maxDay = Math.max(...expPerDay, 1);
    const weeklyExpenses = dayLabels.map((day, i) => ({
      day,
      amount: expPerDay[i],
      heightPct: Math.max(5, Math.round(expPerDay[i] / maxDay * 100))
    }));
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      recentTransactions,
      wallets,
      incomeByCategory,
      expenseByCategory,
      monthlyIncomeHistory,
      weeklyExpenses,
      ytdExpense,
      ytdIncome
    };
  } catch {
    return null;
  }
}
async function adjustWalletBalance(walletId, delta) {
  if (!isConfigured || !supabase) return null;
  const { data: current, error: fetchErr } = await supabase.from("wallets").select("id, name, balance").eq("id", walletId).single();
  if (fetchErr || !current) return null;
  const newBalance = (current.balance ?? 0) + delta;
  const { data: updated, error: updateErr } = await supabase.from("wallets").update({ balance: newBalance }).eq("id", walletId).select("id, name, balance").single();
  if (updateErr) return null;
  return updated;
}
function getTransactionDelta(amount, type) {
  return type === "INCOME" || type === "INVESTMENT_SELL" ? amount : -amount;
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title = "FinGram — Personal Wealth & Portfolio Tracker",
    description = "Track income, expenses, and asset investments in one serverless personal dashboard."
  } = Astro2.props;
  const pathname = Astro2.url.pathname;
  const isOverview = pathname === "/" || pathname === "/index.html" || pathname === "";
  const isLedger = pathname.startsWith("/ledger");
  const isPortfolio = pathname.startsWith("/portfolio");
  const isBudgets = pathname.startsWith("/budgets");
  const isProd = true;
  let wallets = [];
  let categories = [];
  if (isConfigured && supabase) {
    try {
      const [walletRes, catRes] = await Promise.all([
        supabase.from("wallets").select("id, name, balance"),
        supabase.from("categories").select("id, name, type")
      ]);
      if (walletRes.data) wallets = walletRes.data;
      if (catRes.data) categories = catRes.data;
    } catch (err) {
      console.error("[Layout.astro] Failed to fetch layout data:", err);
    }
  }
  return renderTemplate(_a || (_a = __template(['<html lang="en" class="dark"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><!-- SEO Optimization --><title>', '</title><meta name="description"', '><meta name="robots" content="index, follow"><meta name="theme-color" content="#2f7e79"><!-- PWA Settings & Apple Touch Metadata --><link rel="manifest" href="/manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="FinGram"><link rel="apple-touch-icon" href="/icon.svg"><link rel="apple-touch-startup-image" href="/icon.svg"><!-- Open Graph / Facebook --><meta property="og:type" content="website"><meta property="og:title"', '><meta property="og:description"', '><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:title"', '><meta property="twitter:description"', "><!-- Theme Initialization Script to prevent flashing --><script>\n      const theme = (() => {\n        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {\n          return localStorage.getItem('theme');\n        }\n        return 'dark'; // Default to dark mode\n      })();\n    \n      if (theme === 'light') {\n        document.documentElement.classList.remove('dark');\n      } else {\n        document.documentElement.classList.add('dark');\n      }\n    </script><!-- Service Worker registration for PWA --><script>(function(){", "\n      if ('serviceWorker' in navigator) {\n        if (isProd) {\n          window.addEventListener('load', () => {\n            navigator.serviceWorker.register('/sw.js')\n              .then((reg) => console.log('SW Registered!', reg))\n              .catch((err) => console.error('SW Registration failed', err));\n          });\n        } else {\n          // Explicitly unregister any active dev service workers to avoid caching traps\n          navigator.serviceWorker.getRegistrations().then((registrations) => {\n            for (let registration of registrations) {\n              registration.unregister().then((success) => {\n                if (success) {\n                  console.log('Dev SW successfully unregistered');\n                  window.location.reload();\n                }\n              });\n            }\n          });\n        }\n      }\n    })();</script>", '</head> <body class="bg-background text-foreground antialiased min-h-[100dvh] flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200 transition-colors duration-200 overflow-x-hidden"> <!-- Background subtle mesh gradient --> <div class="fixed inset-0 -z-50 h-full w-full bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div> <div class="fixed inset-0 -z-50 h-full w-full bg-gradient-to-tr from-background via-background to-teal-500/5"></div> <!-- Floating mobile theme toggle at top-right corner --> <div class="fixed top-4 right-4 z-50 md:hidden"> <button id="mobile-theme-toggle" type="button" class="h-9 w-9 rounded-full border border-border bg-card/85 dark:bg-card/75 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shadow-md transition-all active:scale-95" aria-label="Toggle Theme"> <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path> </svg> </button> </div> <!-- App Shell Container --> <div class="flex flex-1 overflow-hidden w-full"> <!-- Desktop Sidebar --> <aside class="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar/40 backdrop-blur-xl shrink-0"> <!-- Logo Header --> <div class="h-16 flex items-center px-6 border-b border-sidebar-border gap-3"> <div class="h-8 w-8 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20"> <span class="font-bold text-white text-base">FG</span> </div> <div> <h1 class="font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">FinGram</h1> <span class="text-[10px] font-semibold tracking-wider text-teal-600 uppercase dark:text-teal-400">Zero Cost PWA</span> </div> </div> <!-- Navigation Links --> <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto"> <a href="/"', '> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path></svg>\nOverview\n</a> <a href="/ledger"', '> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>\nLedger\n</a> <a href="/portfolio"', '> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>\nAsset Portfolio\n</a> <a href="/budgets"', '> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>\nBudgets\n</a> </nav> <!-- User Profile Bottom section --> <div class="p-4 border-t border-sidebar-border bg-sidebar/20"> <div class="flex items-center gap-3 px-2 py-1.5"> <div class="h-9 w-9 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center font-bold text-teal-600 dark:text-teal-400 text-sm shadow-inner">\nFG\n</div> <div class="flex-1 min-w-0"> <p class="text-xs font-semibold text-sidebar-foreground truncate leading-tight">Telegram Admin</p> <p class="text-[10px] text-muted-foreground truncate mt-0.5">naoo@fingram.io</p> </div> </div> </div> </aside> <!-- Main Container (Header + Content) --> <div class="flex-1 flex flex-col min-w-0 overflow-hidden w-full"> <!-- Top Navbar (Only visible on desktop) --> <header class="h-16 border-b border-border bg-background/60 backdrop-blur-md px-6 hidden md:flex items-center justify-between shrink-0"> <div class="flex items-center gap-4"> <h2 class="text-base font-bold tracking-tight text-foreground">', '</h2> </div> <!-- Topbar Actions --> <div class="flex items-center gap-3"> ', ' <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"> <span class="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span> <span class="text-[10px] font-medium text-emerald-600 dark:text-emerald-300 tracking-wide uppercase">Bot Webhook Active</span> </div> <!-- Theme Switcher --> <button id="theme-toggle" type="button" class="h-9 w-9 rounded-lg border border-border flex items-center justify-center bg-card/40 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-card transition-all" aria-label="Toggle Theme"> <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> </button> </div> </header> <!-- Main Content Viewport (Full Bleed on Mobile, No horizontal overflow) --> <main class="flex-1 overflow-y-auto overflow-x-hidden relative pb-32 md:pb-8 w-full"> ', ' </main> </div> </div> <!-- Mobile Navigation Bar (Solid Bottom Dock UI, following Attachment 2) --> <div class="fixed bottom-0 left-0 right-0 h-[calc(5rem+env(safe-area-inset-bottom,0px))] pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-card/95 dark:bg-card/75 backdrop-blur-xl border-t border-border/60 flex items-center justify-around z-40 md:hidden shadow-[0_-4px_20px_rgba(27,92,88,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-all duration-200"> <!-- Overview Tab --> <a href="/"', '> <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"> <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg> </a> <!-- Ledger Tab (Charts/Stats/List) --> <a href="/ledger"', '> <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"> <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"></path> </svg> </a> <!-- Floating Action Add Button --> <div class="flex-1 flex justify-center relative -translate-y-6 h-14 items-center z-20"> <a id="mobile-quick-add-btn" href="/ledger?action=new" class="h-14 w-14 rounded-full bg-gradient-to-tr from-[#2F7E79] to-[#1B5C58] hover:from-[#1B5C58] hover:to-[#2F7E79] text-white flex items-center justify-center shadow-lg shadow-teal-600/35 border-4 border-card active:scale-95 transition-all cursor-pointer focus:outline-none" aria-label="Add Transaction"> <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path> </svg> </a> </div> <!-- Portfolio Tab --> <a href="/portfolio"', '> <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"> <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z"></path> <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path> </svg> </a> <!-- Budgets Tab --> <a href="/budgets"', '> <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </a> </div> <!-- Client-side script for theme toggling (Supports both desktop and mobile buttons) --> ', " ", " ", " </body></html>"])), title, addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), defineScriptVars({ isProd }), renderHead(), addAttribute(`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isOverview ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border"}`, "class"), addAttribute(`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isLedger ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border"}`, "class"), addAttribute(`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isPortfolio ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border"}`, "class"), addAttribute(`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isBudgets ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border"}`, "class"), isLedger ? "Transaction Ledger" : isPortfolio ? "Asset Portfolio" : isBudgets ? "Budgeting Controls" : "Dashboard Overview", isOverview && renderTemplate`<a id="desktop-quick-add-btn" href="/ledger?action=new" class="flex items-center gap-1.5 px-4 py-2 h-9 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/10 transition-all active:scale-95 whitespace-nowrap mr-1 cursor-pointer decoration-none"> <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path> </svg>
Quick Add
</a>`, renderSlot($$result, $$slots["default"]), addAttribute(`flex flex-col items-center justify-center flex-1 h-14 transition-all ${isOverview ? "text-[#2F7E79] dark:text-teal-400" : "text-muted-foreground hover:text-foreground"}`, "class"), addAttribute(`flex flex-col items-center justify-center flex-1 h-14 transition-all ${isLedger ? "text-[#2F7E79] dark:text-teal-400" : "text-muted-foreground hover:text-foreground"}`, "class"), addAttribute(`flex flex-col items-center justify-center flex-1 h-14 transition-all ${isPortfolio ? "text-[#2F7E79] dark:text-teal-400" : "text-muted-foreground hover:text-foreground"}`, "class"), addAttribute(`flex flex-col items-center justify-center flex-1 h-14 transition-all ${isBudgets ? "text-[#2F7E79] dark:text-teal-400" : "text-muted-foreground hover:text-foreground"}`, "class"), renderScript($$result, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"), renderComponent($$result, "QuickAddManager", null, { "client:only": "react", "wallets": wallets, "categories": categories, "client:component-hydration": "only", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/QuickAddManager", "client:component-export": "default" }), renderComponent($$result, "ToastContainer", ToastContainer, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/components/ui/ToastContainer", "client:component-export": "default" }));
}, "/Users/naoo/P.A.R.A/PROJECTS/fingram/src/layouts/Layout.astro", void 0);

export { $$Layout as $, adjustWalletBalance as a, fetchDashboardData as f, getTransactionDelta as g, isConfigured as i, renderScript as r, supabase as s };
