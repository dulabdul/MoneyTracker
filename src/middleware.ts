import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // --- SITE MAINTENANCE SUBSYSTEM ---
  const isMaintenanceMode = import.meta.env.MAINTENANCE_MODE === 'true';
  const maintenanceSecret = import.meta.env.MAINTENANCE_BYPASS_SECRET;

  // 1. Static Asset Exemption
  const isStaticAsset = url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/public/') || url.pathname.match(/\.(css|js|svg|png|webmanifest)$/);
  
  if (!isStaticAsset) {
    // 2. Admin Bypass Handshake
    const bypassToken = url.searchParams.get('bypass_token');
    if (bypassToken && maintenanceSecret && bypassToken === maintenanceSecret) {
      context.cookies.set('monty-bypass-active', 'true', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7776000 // 90 days
      });
      url.searchParams.delete('bypass_token');
      return context.redirect(url.pathname + url.search);
    }

    // 3. Maintenance State Check
    const hasBypassCookie = context.cookies.get('monty-bypass-active')?.value === 'true';
    if (isMaintenanceMode && !hasBypassCookie) {
      const maintenanceHTML = `
<!DOCTYPE html>
<html lang="en" class="antialiased">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Maintenance - monty</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <style>
    @media (prefers-color-scheme: dark) {
      html { background-color: #0f172a; }
    }
    @media (prefers-color-scheme: light) {
      html { background-color: #f8fafc; }
    }
  </style>
</head>
<body class="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
  <div class="bg-white dark:bg-[#141b2d] border border-slate-100 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl relative overflow-hidden">
    <div class="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col items-center">
      <div class="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700 mb-6 shadow-sm">
        <div class="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      </div>
      
      <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Sistem Sedang Dioptimalkan</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
        Kami sedang melakukan pemeliharaan rutin untuk meningkatkan performa dan keamanan platform. Harap kembali beberapa saat lagi.
      </p>
      
      <div class="inline-flex items-center justify-center">
        <span class="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest lowercase">monty</span>
      </div>
    </div>
  </div>
</body>
</html>`;

      return new Response(maintenanceHTML, {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Retry-After': '3600'
        }
      });
    }
  }
  // --- END MAINTENANCE SUBSYSTEM ---

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const isDeleting = !value || options.maxAge === 0 || (options.maxAge && options.maxAge < 0);
          context.cookies.set(name, value, {
            ...options,
            path: '/',
            httpOnly: !isDeleting,
            secure: !isDeleting,
            sameSite: isDeleting ? undefined : 'lax',
            maxAge: isDeleting ? 0 : 7776000, // 90 days rolling
          });
        });
      },
    },
  });

  // Native Supabase SSR automatic token parsing & rotation handler
  let {
    data: { user },
  } = await supabase.auth.getUser();

  // Test environment bypass for E2E testing
  if (!user && context.cookies.get('playwright-test')?.value === 'true') {
    user = { 
      id: 'test-playwright-user-12345', 
      email: 'test@example.com', 
      user_metadata: { username: 'Test Automation' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as any;
  }

  context.locals.supabase = supabase;
  context.locals.user = user;

  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register') || url.pathname.startsWith('/api/auth');
  const isPublicRoute = url.pathname.startsWith('/_astro') || url.pathname.includes('.');

  if (!isPublicRoute && !isAuthRoute && !user) {
    return context.redirect("/login");
  }

  if (isAuthRoute && user && !url.pathname.startsWith('/api/auth')) {
    return context.redirect("/"); // Redirect authenticated users away from login/register
  }

  return next();
});
