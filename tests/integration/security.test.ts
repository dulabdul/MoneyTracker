import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from '../../src/middleware';

// Mock dependencies
vi.mock('astro:middleware', () => ({
  defineMiddleware: vi.fn((fn) => fn),
}));

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: vi.fn().mockImplementation(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    })),
    parseCookieHeader: vi.fn().mockReturnValue({}),
  };
});

describe('Middleware Security & Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('sets context.locals.supabase and context.locals.user properly for authenticated requests', async () => {
    const next = vi.fn().mockResolvedValue(new Response());
    
    const context: any = {
      request: new Request('http://localhost:4321/dashboard'),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
      locals: {},
      redirect: vi.fn(),
    };

    await onRequest(context, next);

    expect(context.locals.supabase).toBeDefined();
    expect(context.locals.user).toBeDefined();
    expect(context.locals.user.id).toBe('user-1');
    expect(next).toHaveBeenCalled();
  });

  it('redirects to login if user is not authenticated and route is private', async () => {
    // Override the mock for this specific test
    const { createServerClient } = await import('@supabase/ssr');
    (createServerClient as any).mockImplementationOnce(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }));

    const next = vi.fn();
    const context: any = {
      request: new Request('http://localhost:4321/dashboard'),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
      locals: {},
      redirect: vi.fn().mockReturnValue(new Response(null, { status: 302, headers: { Location: '/login' } })),
    };

    const response = await onRequest(context, next);

    expect(context.redirect).toHaveBeenCalledWith('/login');
    expect((response as Response).status).toBe(302);
  });
});
