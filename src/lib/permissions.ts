import { ADMIN_NAV_GROUPS } from "@/config/admin-nav";

/**
 * Admin role & page-permission model.
 *
 * A privileged user's `admin_users.role` is one of:
 *   super_admin · admin · manager · support · auditor
 * and `permissions` is an array of admin page paths they may open.
 *
 * super_admin and admin are FULL-ACCESS roles (they see every admin page;
 * the difference is enforced server-side — only super_admin can manage other
 * super_admins). manager / support / auditor get a curated default subset that
 * an admin can override per user.
 */

export type AdminRole = "super_admin" | "admin" | "manager" | "support" | "auditor";

export const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "manager", "support", "auditor"];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  support: "Support",
  auditor: "Auditor",
};

/** All admin page paths (leaf items across every nav group) — the permission keys. */
export const ADMIN_PATHS: string[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path));

/** Roles that implicitly see every admin page. */
const FULL_ACCESS_ROLES: AdminRole[] = ["super_admin", "admin"];

/**
 * Default page set per role (excluding full-access roles, which are "all").
 * These are the paths an admin can tweak per user in the role-management UI.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [],
  admin: [],
  manager: [
    "/admin/yatris",
    "/admin/training",
    "/admin/training/review",
    "/admin/training/create",
    "/admin/enrollments",
    "/admin/training/reviews",
    "/admin/providers",
    "/admin/trainers",
    "/admin/events",
    "/admin/attendees",
    "/admin/submissions",
    "/admin/products",
    "/admin/exam-dumps",
    "/admin/udemy",
  ],
  support: [
    "/admin/yatris",
    "/admin/inquiries",
    "/admin/tickets",
    "/admin/reviews",
    "/admin/content-reviews",
    "/admin/resumes",
    "/admin/subscribers",
    "/admin/events",
  ],
  auditor: [
    "/admin/payments",
    "/admin/transactions",
    "/admin/training/review",
    "/admin/reviews",
    "/admin/sitemap",
  ],
};

/** The role-management page itself — only granted explicitly (admin/super_admin). */
export const ADMIN_ROLES_PATH = "/admin/roles";

export function isFullAccessRole(role?: AdminRole | string | null): boolean {
  return !!role && (FULL_ACCESS_ROLES as string[]).includes(role);
}

/**
 * Can this role+permissions open `path`?
 * Full-access roles (super_admin/admin) open everything. Others are allowed a
 * path if it (or a parent section prefix) is in their permissions array.
 */
export function canAccessPath(
  role: AdminRole | string | null | undefined,
  permissions: string[] | null | undefined,
  path: string,
): boolean {
  if (isFullAccessRole(role)) return true;
  const perms = permissions || [];
  return perms.some((p) => path === p || (p && path.startsWith(`${p}/`)));
}

/** Default permissions for a role (used when creating a new admin of that role). */
export function defaultPermissionsForRole(role: AdminRole | string): string[] {
  return ROLE_DEFAULT_PERMISSIONS[role as AdminRole] || [];
}
