import { z } from "zod";

// Prices are stored in KRW (won), so they must be non-negative integers.
const priceSchema = z
  .number({ invalid_type_error: "price must be a number" })
  .int("price must be an integer (KRW)")
  .min(0, "price must be 0 or greater");

/** Body schema for creating a menu (POST /api/menus). */
export const createMenuSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(100),
    description: z.string().trim().max(500).optional(),
    price: priceSchema,
    category: z.string().trim().min(1, "category is required").max(50),
    imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict();

/** Body schema for updating a menu (PUT / PATCH). All fields optional, but at least one required. */
export const updateMenuSchema = createMenuSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/** Query schema for listing menus (GET /api/menus). Unknown params are ignored. */
export const listQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["price", "name", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  available: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Body schema for creating a category (POST /api/categories). */
export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(50),
  })
  .strict();

/** Path param schema for a numeric id (menu or category). */
export const idSchema = z.coerce
  .number({ invalid_type_error: "id must be a number" })
  .int("id must be an integer")
  .positive("id must be a positive integer");
