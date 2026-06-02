import { listCategories, createCategory } from "@/lib/repository.js";
import { createCategorySchema } from "@/lib/validation.js";
import { ok, created, handleError, parseJsonBody } from "@/lib/apiResponse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/categories — list all categories with menu counts.
export async function GET() {
  try {
    return ok(listCategories());
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/categories — create a new category.
export async function POST(request) {
  try {
    const body = await parseJsonBody(request);
    const { name } = createCategorySchema.parse(body);
    return created(createCategory(name));
  } catch (err) {
    return handleError(err);
  }
}
