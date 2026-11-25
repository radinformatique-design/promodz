/**
 * Client Supabase - BatiProm Algérie
 * Connexion via HTTPS (port 443) - Compatible avec tous les environnements réseau
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes dans .env');
}

// Valeurs de repli pendant le build (ex: Docker build sans .env) pour éviter un crash au chargement du module
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co';
const resolvedAnonKey = supabaseAnonKey || 'placeholder-anon-key';

// Client public (côté client React, accès limité par Row Level Security)
export const supabase = createClient(resolvedUrl, resolvedAnonKey);

// Client admin (côté serveur uniquement - API routes Next.js)
// Utilise la service_role key qui bypass le RLS
export const supabaseAdmin = createClient(
  resolvedUrl,
  supabaseServiceKey || resolvedAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;
