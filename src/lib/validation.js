// 입력 검증 스키마 모음(zod).
// 요청 body / 쿼리스트링 / 경로 파라미터를 여기 정의된 스키마로 검증한다.
// 검증 실패 시 던져지는 ZodError는 apiResponse.handleError가 400으로 변환한다.
import { z } from "zod";

// 가격은 KRW(원) 단위로 저장하므로 0 이상의 정수만 허용한다.
const priceSchema = z
  .number({ invalid_type_error: "price must be a number" })
  .int("price must be an integer (KRW)")
  .min(0, "price must be 0 or greater");

/** 메뉴 생성(POST /api/menus) body 스키마. .strict()로 정의되지 않은 필드는 거부한다. */
export const createMenuSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(100),
    description: z.string().trim().max(500).optional(),
    price: priceSchema,
    category: z.string().trim().min(1, "category is required").max(50),
    imageUrl: z.string().url("imageUrl must be a valid URL").optional(), // URL 형식 검증
    isAvailable: z.boolean().optional(),
  })
  .strict();

/** 메뉴 수정(PUT/PATCH) body 스키마. 모든 필드 선택이지만 최소 1개는 있어야 한다. */
export const updateMenuSchema = createMenuSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/** 메뉴 목록(GET /api/menus) 쿼리 스키마. 정의되지 않은 쿼리 파라미터는 무시된다. */
export const listQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["price", "name", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  // 쿼리스트링은 항상 문자열이므로 coerce로 숫자 변환
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  // "true"/"false" 문자열을 불리언으로 변환
  available: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20), // 페이지 크기 상한 100
});

/** 카테고리 생성(POST /api/categories) body 스키마. */
export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(50),
  })
  .strict();

/** 경로 파라미터 id(메뉴/카테고리 공용) 스키마. 양의 정수만 허용. */
export const idSchema = z.coerce
  .number({ invalid_type_error: "id must be a number" })
  .int("id must be an integer")
  .positive("id must be a positive integer");
