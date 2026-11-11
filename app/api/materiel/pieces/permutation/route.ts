import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin, hasPermission } from '@/lib/auth/current-app-profile';

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'MODIFIER')) {
    return NextResponse.json({ error: 'Permutation des pièces réservée au service matériel.' }, { status: 403 });
  }
  const body = await request.json();
  const id1 = String(body?.piece1_id || '');
  const id2 = String(body?.piece2_id || '');
  const km = Number(body?.kilometrage);
  const motif = String(body?.motif || '').trim();
  const operateur = String(body?.operateur || '').trim();
  if (!id1 || !id2 || id1 === id2 || !Number.isFinite(km) || km < 0 || !motif || !operateur) {
    return NextResponse.json({ error: 'Deux pièces distinctes, un kilométrage, un motif et un opérateur sont obligatoires.' }, { status: 400 });
  }
  const [p1,p2] = await Promise.all([
    prisma.pieceRemplacableVehicule.findFirst({ where: { id: id1, materiel: { entreprise_id: current.profile.entreprise_id } } }),
    prisma.pieceRemplacableVehicule.findFirst({ where: { id: id2, materiel: { entreprise_id: current.profile.entreprise_id } } }),
  ]);
  if (!p1 || !p2 || p1.materiel_id !== p2.materiel_id) return NextResponse.json({ error: 'Les deux pièces doivent appartenir au même matériel de votre entreprise.' }, { status: 400 });

  const date = new Date().toISOString().slice(0, 10);
  const history1 = { id: crypto.randomUUID(), date, ancienne_position: p1.position, nouvelle_position: p2.position, kilometrage: km, motif, operateur };
  const history2 = { id: crypto.randomUUID(), date, ancienne_position: p2.position, nouvelle_position: p1.position, kilometrage: km, motif, operateur };
  try {
    const rows = await prisma.$transaction([
      prisma.pieceRemplacableVehicule.update({
        where: { id: p1.id },
        data: { position: p2.position, historique_permutations: [history1, ...((p1.historique_permutations as any[]) || [])] as any },
      }),
      prisma.pieceRemplacableVehicule.update({
        where: { id: p2.id },
        data: { position: p1.position, historique_permutations: [history2, ...((p2.historique_permutations as any[]) || [])] as any },
      }),
    ]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[materiel/pieces/permutation]', error);
    return NextResponse.json({ error: 'Permutation impossible.' }, { status: 400 });
  }
}
