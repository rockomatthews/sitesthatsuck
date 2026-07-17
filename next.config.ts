import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg"],
  // Ship the ffmpeg binary with the functions that robotize Chappie's voice —
  // without the explicit include the bundler leaves a placeholder path and
  // spawn fails ENOENT (learned the hard way on chappieworks).
  outputFileTracingIncludes: {
    "/api/voice/[id]": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/bark": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
