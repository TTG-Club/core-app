export function getOrigin() {
  if (import.meta.client) {
    return window.location.origin;
  }

  try {
    const { origin } = useRequestURL();

    return origin;
  } catch (err) {
    return process.env.NUXT_SITE_URL;
  }
}
