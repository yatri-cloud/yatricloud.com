import { describe, it, expect } from "vitest";
import { validateProductPatch } from "@/lib/store-products";

// Locks in the store-product validation shared by AdminAddProduct + AdminProducts.
// If these rules regress, the admin edit dialog would let bad data through again.
describe("validateProductPatch", () => {
  it("accepts a valid patch", () => {
    expect(validateProductPatch({ title: "AWS SAA", image: "https://x.com/a.png", originalPrice: 100, discountedPrice: 60 })).toBeNull();
  });

  it("rejects an empty/whitespace title", () => {
    expect(validateProductPatch({ title: "   " })).toMatch(/title/i);
  });

  it("tolerates a blank image (legacy rows) but rejects a non-URL image", () => {
    expect(validateProductPatch({ image: "" })).toBeNull();
    expect(validateProductPatch({ image: "not-a-url" })).toMatch(/url/i);
  });

  it("rejects negative prices", () => {
    expect(validateProductPatch({ originalPrice: -1 })).toMatch(/original price/i);
    expect(validateProductPatch({ discountedPrice: -5 })).toMatch(/discounted price/i);
  });

  it("rejects an offer price above the list price", () => {
    expect(validateProductPatch({ originalPrice: 100, discountedPrice: 150 })).toMatch(/higher than/i);
  });

  it("allows an offer price equal to the list price", () => {
    expect(validateProductPatch({ originalPrice: 100, discountedPrice: 100 })).toBeNull();
  });

  it("only validates fields that are present (partial patch)", () => {
    expect(validateProductPatch({})).toBeNull();
    expect(validateProductPatch({ discountedPrice: 50 })).toBeNull();
  });
});
