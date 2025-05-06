/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enables static HTML export
  // Optional: Configure basePath and assetPrefix if deploying to a subdirectory on GitHub Pages
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name/',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // remotePatterns are no longer needed if using local images in /public
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'via.placeholder.com',
    //     port: '',
    //     pathname: '/**',
    //   },
    // ],
    unoptimized: true, // IMPORTANT: Required for static export (`output: 'export'`) when using next/image.
                       // If you want optimized images with static export, you'd need a custom loader or deploy to a platform supporting Next.js image optimization (like Vercel).
  },
};

export default nextConfig;
