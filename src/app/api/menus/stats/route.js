import { getStats } from "@/lib/repository.js";
import { ok, handleError } from "@/lib/apiResponse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/menus/stats — aggregate menu statistics.
// Note: this static segment takes precedence over the dynamic [id] route.
export async function GET() {
  try {
    return ok(getStats());
  } catch (err) {
    return handleError(err);
  }
}
