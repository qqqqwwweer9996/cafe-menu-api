// /api/menus/stats — 메뉴 통계(전체 + 카테고리별 집계).
import { getStats } from "@/lib/repository.js";
import { ok, handleError } from "@/lib/apiResponse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/menus/stats
// 참고: 정적 세그먼트 'stats'가 동적 라우트 [id]보다 우선하므로 /menus/stats가 여기로 매칭된다.
export async function GET() {
  try {
    return ok(getStats());
  } catch (err) {
    return handleError(err);
  }
}
