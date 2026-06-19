import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { session } = body;

    if (!session || !session.access_token || !session.refresh_token) {
      return new Response(JSON.stringify({ error: "Valid session is required" }), { status: 400 });
    }

    // Set the session on the server. The Supabase SSR client in middleware
    // will automatically trigger `setAll` and bake the `sb-access-token` 
    // and `sb-refresh-token` into HttpOnly, Secure server cookies!
    const { data, error } = await locals.supabase.auth.setSession(session);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
};
