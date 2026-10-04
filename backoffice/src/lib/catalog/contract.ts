import { z } from "zod";

const timestamp = z.string().min(1);

export const categorySchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  product_category_id: z.uuid().nullable(),
  created_at: timestamp,
  updated_at: timestamp,
});

export const tagSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  created_at: timestamp,
  updated_at: timestamp,
});

export const productSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  cost: z.number(),
  price: z.number(),
  type: z.enum(["digital", "physical"]),
  weight: z.number().nullable(),
  length: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  sku: z.string().nullable(),
  bar_code: z.string().nullable(),
  brand: z.string().nullable(),
  family: z.string().nullable(),
  size_ml: z.number().int().positive().nullable(),
  visibility: z.enum(["visible", "hidden", "not_listed"]),
  discount: z.number().int().nullable(),
  photos: z.array(z.string()),
  photo_urls: z.array(z.string()),
  category_id: z.uuid(),
  tag_ids: z.array(z.uuid()),
  created_at: timestamp,
  updated_at: timestamp,
});

export type Category = z.infer<typeof categorySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Product = z.infer<typeof productSchema>;
