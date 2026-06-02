import { listMenus, createMenu } from "@/lib/repository.js";
import { listQuerySchema, createMenuSchema } from "@/lib/validation.js";
import { ok, created, handleError, parseJsonBody } from "@/lib/apiResponse.js";
import { ValidationError } from "@/lib/errors.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/menus — list with filtering, sorting, search and pagination.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new ValidationError("minPrice must not be greater than maxPrice");
    }

    const { items, pagination } = listMenus(query);

    return ok(items, {
      meta: {
        pagination,
        sort: { field: query.sort, order: query.order },
        filters: {
          category: query.category ?? null,
          search: query.search ?? null,
          minPrice: query.minPrice ?? null,
          maxPrice: query.maxPrice ?? null,
          available: query.available ?? null,
        },
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/menus — create a new menu.
export async function POST(request) {
  try {
    const body = await parseJsonBody(request);
    const data = createMenuSchema.parse(body);
    const menu = createMenu(data);
    return created(menu);
  } catch (err) {
    return handleError(err);
  }
}
