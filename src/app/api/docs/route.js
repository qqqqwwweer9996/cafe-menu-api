import { openapiSpec } from "@/lib/openapi.js";

export const runtime = "nodejs";

// GET /api/docs — the raw OpenAPI 3.0 specification (consumed by Swagger UI).
export async function GET() {
  return Response.json(openapiSpec);
}
