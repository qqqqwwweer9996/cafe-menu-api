// /api/menus 컬렉션 라우트 — 목록 조회(GET)와 생성(POST).
import { listMenus, createMenu } from "@/lib/repository.js";
import { listQuerySchema, createMenuSchema } from "@/lib/validation.js";
import { ok, created, handleError, parseJsonBody } from "@/lib/apiResponse.js";
import { ValidationError } from "@/lib/errors.js";

// better-sqlite3(네이티브 모듈) 사용 → Node 런타임 강제. DB 조회 결과를 캐싱하지 않도록 동적 처리.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/menus — 필터·정렬·검색·페이지네이션 목록 조회
export async function GET(request) {
  try {
    // 쿼리스트링을 객체로 만들어 스키마로 검증(기본값/형변환 포함)
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // 가격 범위 논리 검증: 최소가가 최대가보다 크면 안 됨
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new ValidationError("minPrice must not be greater than maxPrice");
    }

    const { items, pagination } = listMenus(query);

    // 데이터와 함께 페이지네이션/정렬/적용된 필터 정보를 meta로 반환
    return ok(items, {
      meta: {
        pagination,
        sort: { field: query.sort, order: query.order },
        filters: {
          category: query.category ?? null,
          search: query.search ?? null,
          minPrice: query.minPrice ?? null,
          maxPrice: query.maxPrice ?? null,
          available: query.available ?? null,
        },
      },
    });
  } catch (err) {
    return handleError(err); // ZodError·ValidationError 등을 일관 응답으로 변환
  }
}

// POST /api/menus — 메뉴 생성
export async function POST(request) {
  try {
    const body = await parseJsonBody(request);
    const data = createMenuSchema.parse(body); // 검증 통과한 값만 사용
    const menu = createMenu(data);
    return created(menu); // 201 Created
  } catch (err) {
    return handleError(err);
  }
}
