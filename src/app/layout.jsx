export const metadata = {
  title: "Cafe Menu API",
  description: "Cafe menu management REST API (Next.js Route Handlers + SQLite)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        {children}
      </body>
    </html>
  );
}
