import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: [
      'jiizgebxoqzyvxxwmlel.supabase.co',
      'example.com',
      'api.dicebear.com',
      // Ajoutez d'autres domaines si nécessaire
    ],
    // Ou utilisez remotePatterns pour plus de contrôle (recommandé)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jiizgebxoqzyvxxwmlel.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/photo_freelance/**',
      },
      // Autoriser des images d'exemple (dev) provenant de example.com
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      // Vous pouvez ajouter d'autres patterns pour d'autres buckets
      {
        protocol: 'https',
        hostname: 'jiizgebxoqzyvxxwmlel.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Placeholder images via.placeholder.com pour les images par défaut
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // Images Unsplash pour les fallbacks
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;