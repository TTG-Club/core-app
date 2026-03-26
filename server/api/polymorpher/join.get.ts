export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const target = typeof query.target === 'string' ? query.target : null

  if (!target)
  {
    throw createError({
      statusCode: 400,
      statusMessage: 'Target is required',
    })
  }

  const config = useRuntimeConfig(event)
  const polymorpherSource = String(config.public.polymorpherSource ?? 'ttg_club')

  const url = new URL(target)

  url.searchParams.set('ref', polymorpherSource)
  url.searchParams.set('utm_source', polymorpherSource)
  url.searchParams.set('utm_medium', 'referral')
  url.searchParams.set('utm_campaign', 'games_catalog')

  return sendRedirect(event, url.toString(), 302)
})