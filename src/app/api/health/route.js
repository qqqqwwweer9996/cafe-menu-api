// /api/health — 헬스체크(서버 상태 확인). 모니터링/키프얼라이브 핑 대상.
// DB를 건드리지 않고 즉시 200을 반환하는 가장 가벼운 엔드포인트.
import { ok } from "@/lib/apiResponse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health
export async function GET() {
  return ok({ status: "ok", timestamp: new Date().toISOString() });
}
