// API 응답 포맷 + 중앙 에러 처리 헬퍼.
// 모든 라우트가 동일한 envelope 형태로 응답하도록 통일한다.
import { ZodError } from "zod";
import { AppError, ValidationError } from "./errors.js";

/**
 * 성공 응답 형태:
 *   { "success": true, "data": <payload>, "meta"?: <object> }
 */
export function ok(data, { status = 200, meta } = {}) {
  return Response.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status }
  );
}

/** 201 Created 단축 헬퍼(생성 응답용). */
export function created(data, { meta } = {}) {
  return ok(data, { status: 201, meta });
}

/**
 * 실패 응답 형태:
 *   { "success": false, "error": { "code", "message", "details"? } }
 */
export function fail({
  status = 500,
  code = "INTERNAL_ERROR",
  message = "Internal server error",
  details,
} = {}) {
  return Response.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

/**
 * 중앙 에러 핸들러. 알려진 에러 타입을 일관된 응답으로 변환한다.
 * 덕분에 각 라우트는 `catch (err) { return handleError(err); }` 한 줄이면 된다.
 */
export function handleError(err) {
  // zod 검증 실패 → 400 + 필드별 상세 메시지
  if (err instanceof ZodError) {
    return fail({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // 의도적으로 던진 앱 에러(NotFound/Conflict 등) → 해당 status/code 그대로
  if (err instanceof AppError) {
    return fail({
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // 예상치 못한 에러 → 서버 로그에 남기고 클라이언트엔 일반 메시지(500)
  console.error("[cafe-menu-api] Unhandled error:", err);
  return fail({});
}

/** 요청 body를 JSON으로 파싱한다. 잘못된 JSON이면 400 ValidationError를 던진다. */
export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}
