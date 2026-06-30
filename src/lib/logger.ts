/**
 * Sends a client-side action log to the server API so it appears in Vercel logs.
 */
export function logClientAction(action: string, details?: any) {
  // We use fire-and-forget so it doesn't block UI
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'info', action, details }),
  }).catch(() => {
    // silently fail if network is down
  });
}

/**
 * Sends a client-side error log to the server API so it appears in Vercel logs.
 */
export function logClientError(action: string, error: any) {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type: 'error', 
      action, 
      details: error instanceof Error ? error.message : String(error) 
    }),
  }).catch(() => {
    // silently fail
  });
}
