import type { Handle } from '@sveltejs/kit/hooks';
import { authed } from '#lib/server/auth.ts';

// Everything except the page shell and /api/login needs the session cookie.
export const handle: Handle = async ({ event, resolve }) => {
  const p = event.url.pathname;
  const guarded = (p.startsWith('/api/') && p !== '/api/login') || p.startsWith('/img/');
  if (guarded && !authed(event.cookies)) {
    return new Response('unauthorized', { status: 401 });
  }
  return resolve(event);
};
