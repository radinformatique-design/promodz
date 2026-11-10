'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Bell, Plus, RefreshCw,
  CheckCircle2, XCircle, Clock3, AlertTriangle, Building2, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type Movement = {
  id: string;
  type: 'SORTIE' | 'APPROVISIONNEMENT' | 'AJUSTEMENT';
  montant: string | number;
  motif: string;
  reference?: string | null;
  created_at: string;
  auteur?: { nom: string; prenom: string };
};

type CashRequest = {
  id: string;
  montant: string | number;
  motif: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';
  commentaire_traitement?: string | null;
  created_at: string;
  demandeur?: { nom: string; prenom: string };
};

type CashFund = {
  id: string;
  plafond: string | number;
  solde: number;
  devise: string;
  actif: boolean;
  chantier: { id: string; code_chantier: string; nom_projet: string; wilaya: string; commune: string };
  mouvements: Movement[];
  demandes: CashRequest[];
};

const money = (value: number | string) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0)) + ' DZD';

export const CaisseView: React.FC = () => {
  const {
    currentUser, allChantiers, selectedChantierId,
    roles, permissions, rolePermissions
  } = useApp();

  const [funds, setFunds] = useState<CashFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [movementType, setMovementType] = useState<'SORTIE' | 'APPROVISIONNEMENT'>('SORTIE');
  const [ceiling, setCeiling] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [decisionComment, setDecisionComment] = useState<Record<string, string>>({});

  const roleCode = roles.find((role) => role.id === currentUser?.role_id)?.code || '';
  const hasPermission = (action: string) => {
    if (roleCode === 'ADMINISTRATEUR') return true;
    return Boolean(currentUser && rolePermissions.some((rp) =>
      rp.role_id === currentUser.role_id &&
      permissions.some((permission) =>
        permission.id === rp.permission_id &&
        permission.module === 'CAISSE' &&
        permission.action === action
      )
    ));
  };
  const canView = roleCode === 'RESPONSABLE_COMPTABILITE' || hasPermission('CONSULTER');
  const canExit = hasPermission('SORTIR');
  const canAsk = hasPermission('DEMANDER');
  const canSupply = hasPermission('APPROVISIONNER');
  const effectiveMovementType: 'SORTIE' | 'APPROVISIONNEMENT' =
    canExit && canSupply ? movementType : canExit ? 'SORTIE' : 'APPROVISIONNEMENT';
  const canManageCeiling = roleCode === 'RESPONSABLE_COMPTABILITE' || hasPermission('GERER_PLAFOND');
  const canDecide = roleCode === 'RESPONSABLE_COMPTABILITE' || hasPermission('TRAITER_DEMANDE');
  const [cashChantierId, setCashChantierId] = useState('');
  const availableChantiers = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.type === 'CHANTIER'
      ? allChantiers.filter((chantier) => currentUser.chantiers_assignes.includes(chantier.id))
      : allChantiers;
  }, [currentUser, allChantiers]);

  useEffect(() => {
    if (cashChantierId === 'ALL' && currentUser?.type === 'CENTRAL') return;
    if (cashChantierId && availableChantiers.some((chantier) => chantier.id === cashChantierId)) return;
    const initial = selectedChantierId !== 'ALL' && availableChantiers.some((chantier) => chantier.id === selectedChantierId)
      ? selectedChantierId
      : currentUser?.type === 'CENTRAL' ? 'ALL' : availableChantiers[0]?.id || '';
    setCashChantierId(initial);
  }, [cashChantierId, selectedChantierId, availableChantiers, currentUser?.type]);

  const loadFunds = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/caisse', { cache: 'no-store' });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.error || 'Impossible de charger les caisses.');
      setFunds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFunds();
  }, []);

  const visibleFunds = useMemo(() => {
    if (!cashChantierId) return [];
    const allowedIds = new Set(availableChantiers.map((chantier) => chantier.id));
    return cashChantierId === 'ALL'
      ? funds.filter((fund) => allowedIds.has(fund.chantier.id))
      : funds.filter((fund) => fund.chantier.id === cashChantierId);
  }, [funds, cashChantierId, availableChantiers]);

  const selectedFund = cashChantierId === 'ALL' ? null : (visibleFunds[0] || null);
  const totalCeiling = visibleFunds.reduce((sum, fund) => sum + Number(fund.plafond || 0), 0);
  const totalBalance = visibleFunds.reduce((sum, fund) => sum + Number(fund.solde || 0), 0);
  const pendingRequests = visibleFunds.flatMap((fund) =>
    fund.demandes.filter((request) => request.statut === 'EN_ATTENTE').map((request) => ({ ...request, chantier: fund.chantier }))
  );
  const displayedMovements = visibleFunds.flatMap((fund) =>
    fund.mouvements.map((movement) => ({ ...movement, chantierName: fund.chantier.nom_projet }))
  );
  const displayedRequests = visibleFunds.flatMap((fund) =>
    fund.demandes.map((request) => ({ ...request, chantierName: fund.chantier.nom_projet }))
  );

  const submitCeiling = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cashChantierId || cashChantierId === 'ALL' || !Number.isFinite(Number(ceiling)) || Number(ceiling) <= 0) return;
    await send('/api/caisse', 'PUT', { chantier_id: cashChantierId, plafond: Number(ceiling) }, 'Plafond enregistré.');
    setCeiling('');
  };

  const submitMovement = async (event: React.FormEvent, type: 'SORTIE' | 'APPROVISIONNEMENT') => {
    event.preventDefault();
    if (!selectedFund || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !reason.trim()) return;
    await send('/api/caisse', 'POST', {
      chantier_id: selectedFund.chantier.id,
      type,
      montant: Number(amount),
      motif: reason.trim(),
      reference: reference.trim() || undefined,
    }, type === 'SORTIE' ? 'Sortie enregistrée. Le siège a été notifié.' : 'Approvisionnement enregistré.');
    setAmount('');
    setReason('');
    setReference('');
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFund || !Number.isFinite(Number(requestAmount)) || Number(requestAmount) <= 0 || !requestReason.trim()) return;
    await send('/api/caisse/demandes', 'POST', {
      chantier_id: selectedFund.chantier.id,
      montant: Number(requestAmount),
      motif: requestReason.trim(),
    }, 'Demande envoyée au siège.');
    setRequestAmount('');
    setRequestReason('');
  };

  const decideRequest = async (id: string, decision: 'APPROUVEE' | 'REFUSEE') => {
    await send('/api/caisse/demandes', 'PATCH', {
      id,
      decision,
      commentaire: decisionComment[id] || '',
    }, decision === 'APPROUVEE' ? 'Demande approuvée et caisse approvisionnée.' : 'Demande refusée.');
  };

  async function send(url: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown, message: string) {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Opération refusée.');
      setSuccess(message);
      await loadFunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <LockIcon />
        <h2 className="mt-3 font-bold text-slate-900">Accès non autorisé</h2>
        <p className="mt-1 text-sm text-slate-600">Votre rôle ne possède pas la permission de consulter les caisses chantier.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Trésorerie opérationnelle</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Caisse de fonds de roulement</h1>
          <p className="mt-1 text-sm text-slate-500">Suivi des plafonds, sorties, approvisionnements et demandes chantier.</p>
        </div>
        <button onClick={() => void loadFunds()} disabled={loading || saving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <Building2 className="h-4 w-4 text-slate-500" />
        <label className="text-xs font-semibold text-slate-600">Chantier affiché</label>
        <select value={cashChantierId} onChange={(e) => setCashChantierId(e.target.value)} className="min-w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          {currentUser?.type === 'CENTRAL' && <option value="ALL">Tous les chantiers</option>}
          {availableChantiers.map((chantier) => <option key={chantier.id} value={chantier.id}>{chantier.code_chantier} — {chantier.nom_projet}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-500">{visibleFunds.length} caisse(s) configurée(s)</span>
      </div>

      {canManageCeiling && cashChantierId !== 'ALL' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Plafond de la caisse</h2>
          <p className="mt-1 text-xs text-slate-500">Le siège définit le plafond initial ou le modifie. Le nouveau plafond ne peut pas être inférieur au solde actuel.</p>
          <form onSubmit={submitCeiling} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select value={cashChantierId} onChange={(e) => setCashChantierId(e.target.value)} required className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              {availableChantiers.map((chantier) => <option key={chantier.id} value={chantier.id}>{chantier.code_chantier} — {chantier.nom_projet}</option>)}
            </select>
            <input type="number" min="0.01" step="0.01" required value={ceiling} onChange={(e) => setCeiling(e.target.value)} placeholder="Nouveau plafond (DZD)" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button disabled={saving || !cashChantierId} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Enregistrer le plafond</button>
          </form>
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Chargement des caisses…</div>
      ) : visibleFunds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Wallet className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-semibold text-slate-800">Aucune caisse configurée</h2>
          <p className="mt-1 text-sm text-slate-500">Le siège doit définir un plafond pour initialiser la caisse de ce chantier.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric title="Plafond autorisé" value={money(cashChantierId === 'ALL' ? totalCeiling : (selectedFund?.plafond || 0))} icon={<Wallet className="h-5 w-5" />} />
            <Metric title="Solde disponible" value={money(cashChantierId === 'ALL' ? totalBalance : (selectedFund?.solde || 0))} icon={<ArrowDownLeft className="h-5 w-5" />} />
            <Metric title="Montant consommé" value={money(cashChantierId === 'ALL' ? totalCeiling - totalBalance : Number(selectedFund?.plafond || 0) - Number(selectedFund?.solde || 0))} icon={<ArrowUpRight className="h-5 w-5" />} />
          </div>

          {cashChantierId === 'ALL' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Vue consolidée : choisissez un chantier précis dans la liste pour modifier son plafond, enregistrer un mouvement ou demander un réapprovisionnement. Les demandes en attente et les historiques restent consultables sur l’ensemble des chantiers.</div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            {(canExit || canSupply) && selectedFund && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-900">Enregistrer un mouvement</h2>
                <p className="mt-1 text-xs text-slate-500">Chaque sortie est historisée et notifiée automatiquement au siège.</p>
                <form onSubmit={(e) => void submitMovement(e, effectiveMovementType)} className="mt-4 space-y-3">
                  {canExit && canSupply && (
                    <select value={movementType} onChange={(e) => setMovementType(e.target.value as 'SORTIE' | 'APPROVISIONNEMENT')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      <option value="SORTIE">Sortie de caisse</option>
                      <option value="APPROVISIONNEMENT">Approvisionnement</option>
                    </select>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant en DZD" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence (facultatif)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif du mouvement" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <Plus className="h-4 w-4" /> {effectiveMovementType === 'SORTIE' ? 'Enregistrer la sortie' : 'Enregistrer l’approvisionnement'}
                  </button>
                </form>
              </section>
            )}

            {canAsk && selectedFund && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-900">Demander un réapprovisionnement</h2>
                <p className="mt-1 text-xs text-slate-500">La demande est transmise au service central pour décision.</p>
                <form onSubmit={submitRequest} className="mt-4 space-y-3">
                  <input type="number" min="0.01" step="0.01" required value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} placeholder="Montant demandé (DZD)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <textarea required rows={2} value={requestReason} onChange={(e) => setRequestReason(e.target.value)} placeholder="Justification de la demande" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <button disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Envoyer la demande</button>
                </form>
              </section>
            )}

            {canDecide && pendingRequests.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 xl:col-span-2">
                <h2 className="flex items-center gap-2 font-bold text-slate-900"><Bell className="h-4 w-4 text-amber-600" /> Demandes en attente ({pendingRequests.length})</h2>
                <div className="mt-4 space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{request.chantier.nom_projet} — {money(request.montant)}</p>
                          <p className="mt-1 text-xs text-slate-600">{request.motif}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Demandé par {request.demandeur?.prenom} {request.demandeur?.nom} · {new Date(request.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">EN ATTENTE</span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input value={decisionComment[request.id] || ''} onChange={(e) => setDecisionComment((prev) => ({ ...prev, [request.id]: e.target.value }))} placeholder="Commentaire (facultatif)" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                        <button onClick={() => void decideRequest(request.id, 'APPROUVEE')} disabled={saving} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Approuver</button>
                        <button onClick={() => void decideRequest(request.id, 'REFUSEE')} disabled={saving} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><XCircle className="mr-1 inline h-4 w-4" /> Refuser</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><FileText className="h-4 w-4" /> Historique des mouvements</h2>
              <div className="mt-3 divide-y divide-slate-100">
                {displayedMovements.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun mouvement enregistré.</p>}
                {displayedMovements.map((movement) => (
                  <div key={movement.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{movement.motif}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{movement.chantierName} · {movement.auteur?.prenom} {movement.auteur?.nom} · {new Date(movement.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${movement.type === 'SORTIE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {movement.type === 'SORTIE' ? '−' : '+'}{money(movement.montant)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><Clock3 className="h-4 w-4" /> Historique des demandes</h2>
              <div className="mt-3 divide-y divide-slate-100">
                {displayedRequests.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucune demande enregistrée.</p>}
                {displayedRequests.map((request) => (
                  <div key={request.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{request.motif}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{request.chantierName} · {request.demandeur?.prenom} {request.demandeur?.nom} · {new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{money(request.montant)}</p>
                      <span className={`text-[10px] font-bold ${request.statut === 'APPROUVEE' ? 'text-emerald-600' : request.statut === 'REFUSEE' ? 'text-rose-600' : 'text-amber-600'}`}>{request.statut}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

const Metric: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between text-slate-500">
      <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      <span className="text-emerald-600">{icon}</span>
    </div>
    <p className="mt-3 text-xl font-bold text-slate-900">{value}</p>
  </div>
);

const LockIcon = () => <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />;
