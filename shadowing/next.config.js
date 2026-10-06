/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: '/AddAudioSample',
        destination: '/add-audio-sample',
        permanent: true,
      },
      {
        source: '/addaudiosample',
        destination: '/add-audio-sample',
        permanent: true,
      },
    ]
  }
}

export default nextConfig
