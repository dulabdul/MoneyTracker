import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, isRegister } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }

    // For login, if we want strict login-only, we can set shouldCreateUser: false
    // But to avoid silent failures for users who mistype, unified flow is often better.
    // We will use shouldCreateUser to dictate the exact intent.
    const { error } = await locals.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Always true to prevent silent email drops, we handle logic in verify
        emailRedirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status || 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
};
