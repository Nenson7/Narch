import { error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from '$app/env/private';

// Secret key => bypasses RLS. Only ever imported from server code, and every
// route that uses it sits behind the login cookie.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

export const BUCKET = 'notes';
export const NOTE_COLS = 'id, type, title, content, createdAt:created_at';

/** Unwrap a supabase-js result or turn its error into a 500. */
export function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) error(500, r.error.message);
  return r.data;
}

/** Storage object names we create: <uuid>.<ext> */
export const FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|gif|avif)$/i;
export const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif'
};
