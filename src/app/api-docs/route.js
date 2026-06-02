export const runtime = "nodejs";

// Swagger UI is loaded from the jsDelivr CDN and pointed at /api/docs. Serving a
// plain HTML document (rather than swagger-ui-react) keeps the dependency tree
// small and avoids React version coupling.
const HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cafe Menu API — Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api/docs",
          dom_id: "#swagger-ui",
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>`;

// GET /api-docs — interactive Swagger UI.
export async function GET() {
  return new Response(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
