export type NoteType = 'text' | 'code' | 'image' | 'link';

export interface NoteItem {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  createdAt: number;
}

type NewItem = Omit<NoteItem, 'id' | 'createdAt'> & { createdAt?: number };

const MAX_SIDE = 2200;
const JSON_H = { 'Content-Type': 'application/json' };

/** Thrown on 401 / bad password. Empty message = just not signed in yet. */
export class AuthError extends Error {}

/** Local-time day key, e.g. "2026-10-11". Each day is its own page. */
export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  if (res.status === 401) throw new AuthError('');
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 160)}`);
  return res;
}

/** Downscale + webp so screenshots upload fast. Gif/svg/unknown pass through untouched. */
async function shrink(file: Blob): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const out = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.85));
    return out && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

export const db = {
  async signIn(password: string) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: JSON_H,
      body: JSON.stringify({ password })
    });
    if (res.status === 401) throw new AuthError('wrong password');
    if (!res.ok) throw new Error(`login failed (${res.status})`);
  },

  async signOut() {
    await fetch('/api/login', { method: 'DELETE', headers: JSON_H }).catch(() => {});
  },

  async saveItem(item: NewItem): Promise<NoteItem> {
    const res = await call('/api/notes', {
      method: 'POST',
      headers: JSON_H,
      body: JSON.stringify(item)
    });
    return res.json();
  },

  async deleteItem(item: NoteItem): Promise<void> {
    await call(`/api/notes/${item.id}`, { method: 'DELETE', headers: JSON_H });
  },

  /** Uploads to the server (stored in Postgres) and returns a /img/<id> url. */
  async uploadImage(file: Blob): Promise<string> {
    const blob = await shrink(file);
    const res = await call('/api/img', {
      method: 'POST',
      headers: { 'Content-Type': blob.type },
      body: blob
    });
    return (await res.json()).url;
  }
};
