import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore - shared plain-ESM core (no TS declaration); used by Vercel + server.js
import { handleAdminUsers } from './admin-users-lib.mjs';

/**
 * Admin role & credential management (Vercel serverless).
 * Logic lives in admin-users-lib.mjs (shared with the local dev server).
 *
 * Body: { access_token, action: 'create'|'update'|'resetPassword'|'delete', ... }
 * Runs with the service_role key — the browser can never create/reset/delete
 * an Auth user, so these operations must happen here.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAdminUsers(req, res);
}
