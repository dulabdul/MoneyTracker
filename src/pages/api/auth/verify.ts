import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json();
    const { session } = body;

    if (!session || !session.access_token || !session.refresh_token) {
      return new Response(JSON.stringify({ error: "Valid session is required" }), { status: 400 });
    }

    // Set the session on the server
    const { data, error } = await locals.supabase.auth.setSession(session);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }

    // Bake production cookies explicitly with 90-day rolling expiration window
    cookies.set("sb-access-token", session.access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7776000, // 90 days
    });

    cookies.set("sb-refresh-token", session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7776000, // 90 days
    });

    return new Response(JSON.stringify({ success: true, user: data.user }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
};
