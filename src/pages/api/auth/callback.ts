import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies, redirect, locals }) => {
  const authCode = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!authCode) {
    return new Response("No code provided", { status: 400 });
  }

  const { error } = await locals.supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect(next);
};
