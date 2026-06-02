// /api/categories 컬렉션 라우트 — 목록 조회(GET)와 생성(POST).
import { listCategories, createCategory } from "@/lib/repository.js";
import { createCategorySchema } from "@/lib/validation.js";
import { ok, created, handleError, parseJsonBody } from "@/lib/apiResponse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/categories — 카테고리 목록(각 카테고리의 메뉴 수 포함)
export async function GET() {
  try {
    return ok(listCategories());
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/categories — 카테고리 생성(중복 이름이면 repository에서 409)
export async function POST(request) {
  try {
    const body = await parseJsonBody(request);
    const { name } = createCategorySchema.parse(body);
    return created(createCategory(name));
  } catch (err) {
    return handleError(err);
  }
}
