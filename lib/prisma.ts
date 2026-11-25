/**
 * lib/prisma.ts - Stub de compatibilité
 * L'application utilise maintenant @supabase/supabase-js via HTTPS (port 443)
 * au lieu de Prisma/PostgreSQL direct (bloqué par réseau).
 * 
 * @deprecated Utiliser lib/supabase.ts à la place
 */

// Re-export du client Supabase pour la compatibilité avec les anciens imports
export { supabaseAdmin as prisma, supabaseAdmin, supabase } from './supabase';
export default null;
