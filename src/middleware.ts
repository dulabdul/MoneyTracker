import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

export const onRequest = defineMiddleware(async (context, next) => {
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
            sameSite: isDeleting ? undefined : 'strict',
            maxAge: isDeleting ? 0 : 7776000, // 90 days rolling
          });
        });
      },
    },
  });

  // Native Supabase SSR automatic token parsing & rotation handler
  const {
    data: { user },
  } = await supabase.auth.getUser();

  context.locals.supabase = supabase;
  context.locals.user = user;

  const url = new URL(context.request.url);
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
