import { defineEnvVars } from '@sveltejs/kit/env';

// read from the environment when the server starts (.env in dev); all server-only
export const variables = defineEnvVars({
  SUPABASE_URL: { description: 'https://<ref>.supabase.co' },
  SUPABASE_SECRET_KEY: { description: 'sb_secret_... key. Server only, bypasses RLS' },
  APP_PASSWORD: { description: 'password for the login screen' },
  SESSION_SECRET: { description: 'signs the login cookie' }
});
