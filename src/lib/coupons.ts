import { supabase } from "@/lib/supabase";

/**
 * Coupon checkout helpers (coupons table, migration 032). Validation goes
 * through the validate_coupon() SECURITY DEFINER function so codes cannot be
 * enumerated; redemption counts once per successful paid checkout.
 */

export interface AppliedCoupon {
  code: string;
  percentOff: number;
}

/** Check a code for a checkout scope ('training' | 'event'). Never throws. */
export async function validateCoupon(
  code: string,
  scope: "training" | "event" | "store",
): Promise<AppliedCoupon | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase.rpc("validate_coupon", {
    p_code: trimmed,
    p_scope: scope,
  });
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const percentOff = Number(data[0]?.percent_off) || 0;
  return percentOff > 0 ? { code: trimmed.toUpperCase(), percentOff } : null;
}

/** Count a redemption after payment succeeds. Best effort — never throws. */
export async function redeemCoupon(code: string): Promise<void> {
  try {
    await supabase.rpc("redeem_coupon", { p_code: code.trim() });
  } catch { /* usage counting must never break a paid checkout */ }
}

/** Apply a discount to an INR amount, kept to 2 decimals, never negative. */
export function discountedInr(amountInr: number, coupon: AppliedCoupon | null): number {
  if (!coupon) return amountInr;
  return Math.max(0, Math.round(amountInr * (100 - coupon.percentOff)) / 100);
}
