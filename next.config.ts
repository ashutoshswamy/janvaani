import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve Firebase's auth handler from our own domain so signInWithRedirect survives
  // browsers' third-party storage blocking (see lib/firebase.ts authDomain).
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
