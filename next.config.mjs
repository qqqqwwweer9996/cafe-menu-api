/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module and must not be bundled by the server build.
  // (Renamed from experimental.serverComponentsExternalPackages in Next.js 15+.)
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
