/**
 * Admin authentication — backed by Supabase Auth + the `profiles.role` flag.
 * Only users whose profile role is `admin` may sign in here.
 */
import { signInWithPassword, signOut } from "@/lib/auth";

export interface AdminLoginResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  const { user, error } = await signInWithPassword(email, password);
  if (error || !user) {
    return { success: false, error: error || "Invalid credentials" };
  }
  if (user.role !== "admin") {
    await signOut();
    return { success: false, error: "This account does not have admin access." };
  }
  // The real session lives in Supabase; this token just gates the dashboard UI.
  return { success: true, token: user.id || "admin" };
}
