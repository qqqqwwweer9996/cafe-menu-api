// 커스텀 에러 클래스 모음.
// 라우트/리포지토리에서 이 에러를 throw하면 apiResponse.handleError가
// 적절한 HTTP status와 code로 변환해 응답한다.

/**
 * 모든 앱 에러의 기반 클래스.
 * HTTP status, 기계가 읽을 수 있는 code, 선택적 상세(details)를 함께 담는다.
 */
export class AppError extends Error {
  constructor(message, { status = 500, code = "INTERNAL_ERROR", details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** 리소스를 찾을 수 없음 → 404 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, { status: 404, code: "NOT_FOUND" });
  }
}

/** 입력 검증 실패 → 400 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details) {
    super(message, { status: 400, code: "VALIDATION_ERROR", details });
  }
}

/** 충돌(중복 생성, 참조 중 삭제 등) → 409 */
export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, { status: 409, code: "CONFLICT" });
  }
}
