/**
 * Admin authentication — backed by Supabase Auth + the `profiles.role` flag.
 * Only users whose profile role is `admin` may sign in here.
 */
import { signInWithPassword, signOut, fetchMyProfile } from "@/lib/auth";

export interface AdminLoginResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  try {
    const loginPromise = (async () => {
      const { user: signedIn, error } = await signInWithPassword(email, password);
      if (error || !signedIn) {
        return { success: false, error: error || "Invalid credentials" };
      }
      // Role lives on the profile row; fetch it before gating.
      const user = (await fetchMyProfile()) || signedIn;
      if (user.role !== "admin") {
        await signOut();
        return { success: false, error: "This account does not have admin access." };
      }
      // The real session lives in Supabase; this token just gates the dashboard UI.
      return { success: true, token: user.id || "admin" };
    })();

    return await Promise.race([
      loginPromise,
      new Promise<AdminLoginResult>((_, reject) =>
        setTimeout(() => reject(new Error("Login request timed out. Please check your connection and try again.")), 10000)
      )
    ]);
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to sign in. Please try again." };
  }
}
