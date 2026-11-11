import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin } from '@/lib/auth/current-app-profile';

async function getAdminCompany() {
  const current = await getCurrentAppProfile();
  if (!current) return { response: NextResponse.json({ error: 'Authentification requise.' }, { status: 401 }) };
  if (!isCompanyAdmin(current.profile)) {
    return { response: NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 }) };
  }
  return { current, companyId: current.profile.entreprise_id };
}

export async function GET() {
  const context = await getAdminCompany();
  if (context.response) return context.response;

  const companyId = context.companyId!;
  const [templates, companyRoles, permissions] = await Promise.all([
    prisma.role.findMany({ where: { entreprise_id: null }, orderBy: { code: 'asc' } }),
    prisma.role.findMany({ where: { entreprise_id: companyId }, orderBy: { code: 'asc' } }),
    prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] }),
  ]);

  const companyByCode = new Map(companyRoles.map((role) => [role.code, role]));
  const effectiveRoles = templates.map((template) => {
    const custom = companyByCode.get(template.code);
    return {
      ...(custom || template),
      is_system: !custom,
      template_role_id: template.id,
    };
  });
  const templateCodes = new Set(templates.map((role) => role.code));
  const extraCompanyRoles = companyRoles
    .filter((role) => !templateCodes.has(role.code))
    .map((role) => ({ ...role, is_system: false, template_role_id: null }));
  const roles = [...effectiveRoles, ...extraCompanyRoles];
  const roleIds = roles.map((role) => role.id);
  const rolePermissions = roleIds.length
    ? await prisma.rolePermission.findMany({
        where: { role_id: { in: roleIds } },
        select: { role_id: true, permission_id: true },
      })
    : [];

  return NextResponse.json({ roles, permissions, rolePermissions });
}

/**
 * Crée une copie entreprise d'un rôle système.
 * Le code métier est conservé pour maintenir la compatibilité des contrôles RBAC existants.
 */
export async function POST(request: Request) {
  const context = await getAdminCompany();
  if (context.response) return context.response;

  try {
    const body = await request.json();
    const templateRoleId = String(body?.templateRoleId || '');
    if (!templateRoleId) {
      return NextResponse.json({ error: 'Sélectionnez un modèle de rôle à personnaliser.' }, { status: 400 });
    }

    const template = await prisma.role.findFirst({
      where: { id: templateRoleId, entreprise_id: null },
    });
    if (!template || template.code === 'ADMINISTRATEUR') {
      return NextResponse.json({ error: 'Modèle système introuvable ou non personnalisable.' }, { status: 404 });
    }

    const existing = await prisma.role.findFirst({
      where: { entreprise_id: context.companyId!, code: template.code },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ce rôle possède déjà une version personnalisée dans votre entreprise.' }, { status: 409 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          entreprise_id: context.companyId!,
          code: template.code,
          libelle: String(body?.libelle || template.libelle).trim(),
          description: body?.description === undefined ? template.description : String(body.description).trim(),
          type_acces: template.type_acces,
        },
      });

      const templatePermissions = await tx.rolePermission.findMany({
        where: { role_id: template.id },
        select: { permission_id: true },
      });
      if (templatePermissions.length) {
        await tx.rolePermission.createMany({
          data: templatePermissions.map((item) => ({
            role_id: role.id,
            permission_id: item.permission_id,
          })),
        });
      }

      // Les utilisateurs de cette entreprise basculent ensemble sur la copie locale.
      await tx.utilisateur.updateMany({
        where: { entreprise_id: context.companyId!, role_id: template.id },
        data: { role_id: role.id },
      });

      return role;
    });

    return NextResponse.json({ success: true, role: { ...created, is_system: false } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/rbac]', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Impossible de personnaliser ce rôle.',
    }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const context = await getAdminCompany();
  if (context.response) return context.response;

  try {
    const body = await request.json();
    const id = String(body?.id || '');
    if (!id) return NextResponse.json({ error: 'Identifiant du rôle obligatoire.' }, { status: 400 });

    const role = await prisma.role.findFirst({
      where: { id, entreprise_id: context.companyId! },
    });
    if (!role || role.code === 'ADMINISTRATEUR') {
      return NextResponse.json({ error: 'Rôle personnalisé introuvable ou protégé.' }, { status: 404 });
    }

    const libelle = body?.libelle === undefined ? role.libelle : String(body.libelle).trim();
    const description = body?.description === undefined ? role.description : String(body.description).trim();
    if (!libelle) return NextResponse.json({ error: 'Le libellé du rôle est obligatoire.' }, { status: 400 });

    const updated = await prisma.role.update({
      where: { id: role.id },
      data: { libelle, description },
    });
    return NextResponse.json({ success: true, role: { ...updated, is_system: false } });
  } catch (error) {
    console.error('[PATCH /api/admin/rbac]', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Modification du rôle impossible.',
    }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const context = await getAdminCompany();
  if (context.response) return context.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant du rôle obligatoire.' }, { status: 400 });

  const role = await prisma.role.findFirst({
    where: { id, entreprise_id: context.companyId! },
  });
  if (!role || role.code === 'ADMINISTRATEUR') {
    return NextResponse.json({ error: 'Rôle personnalisé introuvable ou protégé.' }, { status: 404 });
  }

  const template = await prisma.role.findFirst({
    where: { code: role.code, entreprise_id: null },
    select: { id: true },
  });
  if (!template) {
    return NextResponse.json({ error: 'Le modèle système correspondant est introuvable ; suppression refusée pour préserver les affectations.' }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.updateMany({
      where: { entreprise_id: context.companyId!, role_id: role.id },
      data: { role_id: template.id },
    });
    await tx.role.delete({ where: { id: role.id } });
  });

  return NextResponse.json({ success: true, reset_to_template: true });
}

export async function PUT(request: Request) {
  const context = await getAdminCompany();
  if (context.response) return context.response;

  try {
    const body = await request.json();
    if (!Array.isArray(body?.rolePermissions)) {
      return NextResponse.json({ error: 'rolePermissions doit être un tableau.' }, { status: 400 });
    }

    const [companyRoles, globalRoles] = await Promise.all([
      prisma.role.findMany({
        where: { entreprise_id: context.companyId!, code: { not: 'ADMINISTRATEUR' } },
        select: { id: true },
      }),
      prisma.role.findMany({ where: { entreprise_id: null }, select: { id: true } }),
    ]);
    if (!companyRoles.length) {
      return NextResponse.json({ error: 'Personnalisez d’abord un modèle de rôle avant de modifier ses permissions.' }, { status: 409 });
    }

    const companyRoleIds = new Set(companyRoles.map((role) => role.id));
    const globalRoleIds = new Set(globalRoles.map((role) => role.id));
    const normalized = new Map<string, Set<string>>();

    for (const item of body.rolePermissions as Array<{ role_id?: unknown; permission_id?: unknown }>) {
      const roleId = String(item?.role_id || '');
      const permissionId = String(item?.permission_id || '');
      if (!roleId || !permissionId) {
        return NextResponse.json({ error: 'Chaque affectation doit contenir role_id et permission_id.' }, { status: 400 });
      }
      if (globalRoleIds.has(roleId)) continue; // Les modèles système restent en lecture seule.
      if (!companyRoleIds.has(roleId)) {
        return NextResponse.json({ error: 'Une affectation cible un rôle hors de votre entreprise.' }, { status: 403 });
      }
      if (!normalized.has(roleId)) normalized.set(roleId, new Set<string>());
      normalized.get(roleId)!.add(permissionId);
    }

    const permissionIds = [...new Set([...normalized.values()].flatMap((ids) => [...ids]))];
    if (permissionIds.length) {
      const existingPermissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
        select: { id: true },
      });
      if (existingPermissions.length !== permissionIds.length) {
        return NextResponse.json({ error: 'Une ou plusieurs permissions sont inconnues.' }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const role of companyRoles) {
        await tx.rolePermission.deleteMany({ where: { role_id: role.id } });
        const ids = [...(normalized.get(role.id) || new Set<string>())];
        if (ids.length) {
          await tx.rolePermission.createMany({
            data: ids.map((permission_id) => ({ role_id: role.id, permission_id })),
          });
        }
      }
    });

    return NextResponse.json({ success: true, updated_roles: companyRoles.length });
  } catch (error) {
    console.error('[PUT /api/admin/rbac]', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Enregistrement de la matrice RBAC impossible.',
    }, { status: 400 });
  }
}
