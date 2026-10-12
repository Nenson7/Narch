import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { APP_PASSWORD, SESSION_SECRET } from '$app/env/private';
import type { Cookies } from '@sveltejs/kit';

const NAME = 'sid';
const DAYS = 90;

const mac = (s: string) => createHmac('sha256', SESSION_SECRET).update(s).digest('base64url');

// hash both sides first so lengths match and timing leaks nothing
const eq = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

export const passwordOk = (pw: string) => eq(pw, APP_PASSWORD);

export function start(cookies: Cookies, secure: boolean) {
  const exp = String(Date.now() + DAYS * 864e5);
  cookies.set(NAME, `${exp}.${mac(exp)}`, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: DAYS * 86400
  });
}

export const stop = (cookies: Cookies) => cookies.delete(NAME, { path: '/' });

export function authed(cookies: Cookies): boolean {
  const [exp, sig] = (cookies.get(NAME) ?? '').split('.');
  return Boolean(exp && sig) && eq(sig, mac(exp)) && Number(exp) > Date.now();
}
