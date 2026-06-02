// /api/docs — OpenAPI 3.0 스펙(JSON) 제공. Swagger UI(/api-docs)가 이 JSON을 읽어 문서를 렌더링한다.
import { openapiSpec } from "@/lib/openapi.js";

export const runtime = "nodejs";

// GET /api/docs
export async function GET() {
  return Response.json(openapiSpec);
}
