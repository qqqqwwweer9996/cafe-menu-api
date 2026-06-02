// /api/menus/:id 단건 라우트 — 조회(GET)·수정(PUT/PATCH)·삭제(DELETE).
import { getMenuById, updateMenu, deleteMenu } from "@/lib/repository.js";
import { idSchema, updateMenuSchema } from "@/lib/validation.js";
import { ok, handleError, parseJsonBody } from "@/lib/apiResponse.js";
import { NotFoundError } from "@/lib/errors.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 404 에러 생성 헬퍼(메시지 통일)
function notFound(id) {
  return new NotFoundError(`Menu with id ${id} was not found`);
}

// GET /api/menus/:id — 단건 조회
export async function GET(request, context) {
  try {
    // Next 15+에서 params는 Promise이므로 await로 푼다.
    const { id: rawId } = await context.params;
    const id = idSchema.parse(rawId);
    const menu = getMenuById(id);
    if (!menu) throw notFound(id);
    return ok(menu);
  } catch (err) {
    return handleError(err);
  }
}

// PUT/PATCH 공통 수정 로직 — 전달된 필드만 갱신
async function update(request, context) {
  const { id: rawId } = await context.params;
  const id = idSchema.parse(rawId);
  const body = await parseJsonBody(request);
  const data = updateMenuSchema.parse(body);
  const menu = updateMenu(id, data);
  if (!menu) throw notFound(id);
  return ok(menu);
}

// PUT /api/menus/:id
export async function PUT(request, context) {
  try {
    return await update(request, context);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/menus/:id — 동작은 PUT과 동일(부분 수정)
export async function PATCH(request, context) {
  try {
    return await update(request, context);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/menus/:id — 삭제
export async function DELETE(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = idSchema.parse(rawId);
    if (!deleteMenu(id)) throw notFound(id); // 삭제된 행이 없으면 404
    return ok({ id, deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
