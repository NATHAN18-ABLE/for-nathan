// STATIC_EXPORT=1 builds a static copy for a sub-path host (GitHub Pages);
// NEXT_PUBLIC_BASE_PATH sets that sub-path, e.g. /for-nathan.
const isExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }
    : {
        async headers() {
          return [
            {
              source: "/hero/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
          ];
        },
      }),
};
export default nextConfig;
