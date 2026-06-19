import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, cookies }) => {
  if (locals.supabase) {
    await locals.supabase.auth.signOut();
  }

  // Delete Supabase SSR auth cookies
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
