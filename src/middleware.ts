import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return next();
  }

  // Get current tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

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

  let user = null;

  // Try to authenticate using current access token
  if (accessToken) {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser(accessToken);
      if (!error && currentUser) {
        user = currentUser;
      }
    } catch {
      // Ignore error and fall back to refresh token rotation
    }
  }

  // Silent Refresh Rotation: if access token validation fails/expired but refresh token exists
  if (!user && refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data.user && data.session) {
        user = data.user;
        
        // Rebake rolling cookies explicitly for the response pipeline
        context.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 7776000,
        });
        context.cookies.set("sb-refresh-token", data.session.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 7776000,
        });
      }
    } catch {
      // Ignore refresh errors, unauthenticated state is handled below
    }
  }

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
