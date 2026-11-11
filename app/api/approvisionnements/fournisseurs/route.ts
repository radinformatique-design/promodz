import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin, hasPermission } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'APPROVISIONNEMENTS', 'CONSULTER')) {
    return NextResponse.json({ error: 'Accès aux coordonnées fournisseurs réservé aux services concernés.' }, { status: 403 });
  }
  const where = { entreprise_id: current.profile.entreprise_id };
  const fournisseurs = current.profile.type === 'CHANTIER'
    ? await prisma.fournisseur.findMany({
        where,
        select: {
          id: true, raison_sociale: true, code_fournisseur: true, categorie: true,
          adresse: true, wilaya: true, telephone: true, email: true,
          actif: true, note_evaluation: true, created_at: true,
        },
        orderBy: { raison_sociale: 'asc' },
      })
    : await prisma.fournisseur.findMany({ where, orderBy: { raison_sociale: 'asc' } });
  return NextResponse.json(fournisseurs);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'APPROVISIONNEMENTS', 'AJOUTER')) return NextResponse.json({ error: 'Gestion des fournisseurs réservée au service approvisionnements.' }, { status: 403 });

  const body = await request.json();
  const required = ['raison_sociale', 'code_fournisseur', 'categorie', 'adresse', 'wilaya', 'telephone', 'email'];
  if (required.some((key) => !String(body?.[key] ?? '').trim())) {
    return NextResponse.json({ error: 'Les champs obligatoires du fournisseur sont incomplets.' }, { status: 400 });
  }
  try {
    const fournisseur = await prisma.fournisseur.create({
      data: {
        entreprise_id: current.profile.entreprise_id,
        raison_sociale: String(body.raison_sociale).trim(),
        code_fournisseur: String(body.code_fournisseur).trim().toUpperCase(),
        categorie: String(body.categorie),
        rc: body.rc || null, nif: body.nif || null, nis: body.nis || null,
        adresse: String(body.adresse), wilaya: String(body.wilaya),
        telephone: String(body.telephone), email: String(body.email).trim().toLowerCase(),
        rib: body.rib || null,
        note_evaluation: body.note_evaluation ?? 4,
        actif: body.actif ?? true,
      },
    });
    return NextResponse.json(fournisseur, { status: 201 });
  } catch (error) {
    console.error('[fournisseurs POST]', error);
    return NextResponse.json({ error: 'Création impossible : code fournisseur déjà utilisé ou données invalides.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'APPROVISIONNEMENTS', 'MODIFIER')) return NextResponse.json({ error: 'Permission de modification des fournisseurs requise.' }, { status: 403 });
  const body = await request.json();
  if (!body?.id) return NextResponse.json({ error: 'Identifiant fournisseur obligatoire.' }, { status: 400 });
  const target = await prisma.fournisseur.findFirst({
    where: { id: body.id, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'Fournisseur introuvable.' }, { status: 404 });

  const data: Record<string, unknown> = {};
  for (const key of ['raison_sociale', 'code_fournisseur', 'categorie', 'rc', 'nif', 'nis', 'adresse', 'wilaya', 'telephone', 'email', 'rib', 'note_evaluation', 'actif']) {
    if (Object.prototype.hasOwnProperty.call(body, key)) data[key] = body[key];
  }
  try {
    const fournisseur = await prisma.fournisseur.update({ where: { id: body.id }, data });
    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('[fournisseurs PATCH]', error);
    return NextResponse.json({ error: 'Modification impossible : vérifiez les données et le code fournisseur.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'APPROVISIONNEMENTS', 'SUPPRIMER')) return NextResponse.json({ error: 'Permission de suppression des fournisseurs requise.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant fournisseur obligatoire.' }, { status: 400 });
  const target = await prisma.fournisseur.findFirst({
    where: { id, entreprise_id: current.profile.entreprise_id },
    include: { bonsCommande: { select: { id: true } }, factures: { select: { id: true } } },
  });
  if (!target) return NextResponse.json({ error: 'Fournisseur introuvable.' }, { status: 404 });
  if (target.bonsCommande.length || target.factures.length) {
    return NextResponse.json({ error: 'Ce fournisseur possède des commandes ou factures. Désactivez-le au lieu de le supprimer.' }, { status: 409 });
  }
  await prisma.fournisseur.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
