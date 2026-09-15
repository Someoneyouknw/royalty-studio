/** @type {import('next').NextConfig} */

// Derive the Supabase hostname so <Image> can serve remote images from Storage.
let supabaseHostname = undefined;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {
  supabaseHostname = undefined;
}

const remotePatterns = [
  // Placeholder / demo imagery used before the studio uploads its own photos.
  { protocol: "https", hostname: "images.unsplash.com" },
];

if (supabaseHostname) {
  remotePatterns.push({ protocol: "https", hostname: supabaseHostname });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hide the Next.js dev-mode indicator badge (it never shows in production;
  // this just keeps it from overlapping the floating buttons during `npm run dev`).
  devIndicators: false,
  // TypeScript type errors still fail the build (our real safety net); ESLint
  // style rules do not block deploys. Run `npm run lint` to see them.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    // Reasonable device sizes for a photography-heavy site.
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920, 2048],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
