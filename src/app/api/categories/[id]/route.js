// /api/categories/:id 라우트 — 삭제(DELETE).
import { deleteCategory } from "@/lib/repository.js";
import { idSchema } from "@/lib/validation.js";
import { ok, handleError } from "@/lib/apiResponse.js";
import { NotFoundError } from "@/lib/errors.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/categories/:id
// 참조 중인 메뉴가 있으면 repository에서 ConflictError(409)를 던진다.
export async function DELETE(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = idSchema.parse(rawId);
    if (!deleteCategory(id)) {
      throw new NotFoundError(`Category with id ${id} was not found`);
    }
    return ok({ id, deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
