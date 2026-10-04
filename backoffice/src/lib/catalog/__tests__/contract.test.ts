import { describe, expect, it } from "vitest";

import { categorySchema, productSchema, tagSchema } from "@/lib/catalog/contract";

const stamp = "2026-09-28T12:00:00Z";
const categoryId = "11111111-1111-4111-8111-111111111111";

const category = {
  id: categoryId,
  name: "Floral",
  product_category_id: null,
  created_at: stamp,
  updated_at: stamp,
};

const tag = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "rosa",
  created_at: stamp,
  updated_at: stamp,
};

const product = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Rosa",
  description: "Una rosa",
  cost: 10.5,
  price: 20,
  type: "physical",
  weight: null,
  length: null,
  width: null,
  height: null,
  sku: null,
  bar_code: null,
  brand: null,
  visibility: "visible",
  discount: null,
  family: null,
  size_ml: null,
  photos: ["products/rosa.png"],
  photo_urls: ["https://signed.example/rosa.png"],
  category_id: categoryId,
  tag_ids: [tag.id],
  created_at: stamp,
  updated_at: stamp,
};

describe("catalog contract", () => {
  it("accepts a product, a category and a tag", () => {
    expect(productSchema.parse(product)).toMatchObject({ name: "Rosa", cost: 10.5, price: 20 });
    expect(categorySchema.parse(category).name).toBe("Floral");
    expect(tagSchema.parse(tag).name).toBe("rosa");
  });

  it("rejects an extra key", () => {
    expect(productSchema.safeParse({ ...product, stock: 3 }).success).toBe(false);
    expect(categorySchema.safeParse({ ...category, family: "Floral" }).success).toBe(false);
    expect(tagSchema.safeParse({ ...tag, color: "gold" }).success).toBe(false);
  });
});
