/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
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
