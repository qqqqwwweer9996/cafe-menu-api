import { getMenuById, updateMenu, deleteMenu } from "@/lib/repository.js";
import { idSchema, updateMenuSchema } from "@/lib/validation.js";
import { ok, handleError, parseJsonBody } from "@/lib/apiResponse.js";
import { NotFoundError } from "@/lib/errors.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(id) {
  return new NotFoundError(`Menu with id ${id} was not found`);
}

// GET /api/menus/:id
export async function GET(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = idSchema.parse(rawId);
    const menu = getMenuById(id);
    if (!menu) throw notFound(id);
    return ok(menu);
  } catch (err) {
    return handleError(err);
  }
}

// PUT /api/menus/:id — update provided fields.
async function update(request, context) {
  const { id: rawId } = await context.params;
  const id = idSchema.parse(rawId);
  const body = await parseJsonBody(request);
  const data = updateMenuSchema.parse(body);
  const menu = updateMenu(id, data);
  if (!menu) throw notFound(id);
  return ok(menu);
}

export async function PUT(request, context) {
  try {
    return await update(request, context);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH behaves identically to PUT (partial update).
export async function PATCH(request, context) {
  try {
    return await update(request, context);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/menus/:id
export async function DELETE(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = idSchema.parse(rawId);
    if (!deleteMenu(id)) throw notFound(id);
    return ok({ id, deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
