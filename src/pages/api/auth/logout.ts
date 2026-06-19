import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, cookies }) => {
  if (locals.supabase) {
    await locals.supabase.auth.signOut();
  }

  // Delete Supabase SSR auth cookies with strict options
  cookies.delete("sb-access-token", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  cookies.delete("sb-refresh-token", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
