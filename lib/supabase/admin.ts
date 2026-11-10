import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let adminClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createSupabaseAdminClient() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_AUTH_ADMIN_KEY;
  if (!url || !secret) {
    throw new Error('La clé privée Supabase Auth Admin doit être configurée côté serveur pour envoyer des invitations.');
  }
  adminClient = createSupabaseClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}
