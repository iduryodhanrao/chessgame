import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pocket Chess',
    short_name: 'Pocket Chess',
    description:
      'A mobile-first chess game with pass-and-play and easy computer mode.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070f',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
