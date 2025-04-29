export default defineEventHandler(() => {
  const {
    app: { pwa },
    site: { url },
  } = useRuntimeConfig();

  const icons = [
    {
      src: '/favicons/favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
    },
    {
      src: '/favicons/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    ...pwa.favicons.flatMap((size: number) => [
      {
        src: `/favicons/${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/favicons/${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'maskable',
      },
    ]),
  ];

  /* eslint-disable camelcase */
  return {
    name: pwa.name.base,
    short_name: pwa.name.short,
    description: pwa.description,
    id: url,
    start_url: '/',
    theme_color: '#131A20',
    background_color: '#131A20',
    display: 'standalone',
    orientation: 'portrait-primary',
    icons,
  };
  /* eslint-enable camelcase */
});
