export default defineEventHandler((event) => {
  const query = getQuery(event);

  const target = typeof query.target === 'string' ? query.target : null;

  if (!target) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing target url',
    });
  }

  let url: URL;

  try {
    url = new URL(target);
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid target url',
    });
  }

  if (!url.hostname.includes('polymorpher.ru')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden target',
    });
  }

  url.searchParams.set('ref', '21b987a1-8bbd-4467-8ac3-7cf5be671302');

  return sendRedirect(event, url.toString(), 301);
});
