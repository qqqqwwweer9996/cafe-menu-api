const linkStyle = {
  color: "#38bdf8",
  textDecoration: "none",
};

const endpoints = [
  { method: "GET", path: "/api/menus", note: "목록 (필터·정렬·검색·페이지네이션)" },
  { method: "POST", path: "/api/menus", note: "메뉴 생성" },
  { method: "GET", path: "/api/menus/{id}", note: "단건 조회" },
  { method: "PUT", path: "/api/menus/{id}", note: "수정" },
  { method: "DELETE", path: "/api/menus/{id}", note: "삭제" },
  { method: "GET", path: "/api/menus/stats", note: "통계" },
  { method: "GET", path: "/api/health", note: "서버 상태 확인" },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>☕ Cafe Menu API</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        Next.js Route Handlers + SQLite 기반 카페 메뉴 관리 REST API
      </p>

      <p style={{ marginTop: 24 }}>
        <a href="/api-docs" style={{ ...linkStyle, fontWeight: 600 }}>
          📘 Swagger 인터랙티브 API 문서 열기 →
        </a>
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Endpoints</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {endpoints.map((e) => (
            <tr key={`${e.method} ${e.path}`} style={{ borderTop: "1px solid #1e293b" }}>
              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#fbbf24" }}>
                {e.method}
              </td>
              <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{e.path}</td>
              <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{e.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
