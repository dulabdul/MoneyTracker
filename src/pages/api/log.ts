import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    
    // Attempt to get user info if available
    const user = locals.user;
    const userIdentifier = user ? (user.email || user.id) : 'anonymous';

    // Format the log for Vercel
    const logPrefix = `[CLIENT-ACTION][${userIdentifier}]`;
    
    if (body.type === 'error') {
      console.error(`${logPrefix} ERROR:`, body.action, body.details);
    } else {
      console.log(`${logPrefix} INFO:`, body.action, body.details);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error("[CLIENT-ACTION] Failed to parse log body", e.message);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
};
