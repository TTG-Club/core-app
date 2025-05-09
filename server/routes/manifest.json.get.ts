import { z } from 'zod';

import type { EventHandlerRequest } from 'h3';

const requestSchema = z.object({
  theme: z.string().optional(),
});

interface Request extends EventHandlerRequest {
  query?: z.infer<typeof requestSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  let themeName;

  try {
    const query = await getValidatedQuery(event, requestSchema.parse);

    themeName = query?.theme || 'dark';
  } catch (err) {
    themeName = 'dark';
  }

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

  setHeader(event, 'Content-Type', 'application/manifest+json');

  /* eslint-disable camelcase */
  return {
    name: pwa.name.base,
    short_name: pwa.name.short,
    description: pwa.description,
    id: url,
    start_url: '/',
    theme_color: pwa.themeColor[themeName] || pwa.themeColor.dark,
    background_color: pwa.themeColor[themeName] || pwa.themeColor.dark,
    display: 'standalone',
    orientation: 'portrait-primary',
    icons,
  };
  /* eslint-enable camelcase */
});
