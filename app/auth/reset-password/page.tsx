'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (password.length < 10) {
      setMessage('Le mot de passe doit contenir au moins 10 caractères.');
      return;
    }
    if (password !== confirmation) {
      setMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Lien expiré ou invalide. Demandez un nouveau lien de réinitialisation.');
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Votre mot de passe a été mis à jour. Vous allez être redirigé.');
      window.setTimeout(() => router.replace('/'), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">BatiProm · Sécurité</p>
          <h1 className="mt-3 text-2xl font-bold text-white">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-slate-400">Choisissez un mot de passe long et unique pour votre compte.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-slate-300">
            Nouveau mot de passe
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Confirmer le mot de passe
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
            />
          </label>
          {message && <p role="status" className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </section>
    </main>
  );
}
