import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin, hasAnyRole } from '@/lib/auth/current-app-profile';

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasAnyRole(current.profile, ['RESPONSABLE_MATERIEL'])) {
    return NextResponse.json({ error: 'Remplacement des pièces réservé au service matériel.' }, { status: 403 });
  }
  const body = await request.json();
  const oldId = String(body?.ancienne_piece_id || '');
  const input = body?.nouvelle_piece || {};
  const date = new Date(input.date_installation);
  const km = Number(input.kilometrage_installation || 0);
  const hours = Number(input.heures_installation || 0);
  const cost = Number(input.cout_achat_dzd || 0);
  if (!oldId || !input.designation || !input.numero_serie || !input.position ||
      !Number.isFinite(date.getTime()) || ![km,hours,cost].every(Number.isFinite) || km < 0 || hours < 0 || cost < 0) {
    return NextResponse.json({ error: 'Informations de remplacement invalides.' }, { status: 400 });
  }
  const old = await prisma.pieceRemplacableVehicule.findFirst({
    where: { id: oldId, materiel: { entreprise_id: current.profile.entreprise_id } },
  });
  if (!old) return NextResponse.json({ error: 'Pièce à remplacer introuvable.' }, { status: 404 });

  const history = {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    ancien_numero_serie: old.numero_serie,
    kilometrage: km,
    motif: String(body.motif || 'Remplacement de pièce'),
    ...(body.note ? { note: String(body.note) } : {}),
    cout_dzd: cost,
  };

  try {
    const created = await prisma.$transaction(async (tx) => {
      await tx.pieceRemplacableVehicule.update({
        where: { id: old.id },
        data: {
          etat: 'REMPLACE',
          historique_remplacements: [history, ...((old.historique_remplacements as any[]) || [])] as any,
        },
      });
      return tx.pieceRemplacableVehicule.create({
        data: {
          materiel_id: old.materiel_id,
          type: input.type || old.type,
          designation: String(input.designation).trim(),
          marque: input.marque || null,
          dimensions: input.dimensions || null,
          numero_serie: String(input.numero_serie).trim(),
          position: String(input.position),
          date_installation: date,
          kilometrage_installation: km,
          heures_installation: hours,
          etat: input.etat || 'NEUF',
          profondeur_sculpture_mm: input.profondeur_sculpture_mm ?? null,
          cout_achat_dzd: cost,
          fournisseur: input.fournisseur || null,
          historique_permutations: input.historique_permutations ?? undefined,
          historique_remplacements: [history, ...((old.historique_remplacements as any[]) || [])],
        },
        include: { materiel: { select: { id: true, code_parc: true, marque: true, modele: true } } },
      });
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[materiel/pieces/remplacement]', error);
    return NextResponse.json({ error: 'Remplacement non enregistré : vérifiez le numéro de série.' }, { status: 400 });
  }
}
