export function getOrigin() {
  if (import.meta.client) {
    return window.location.origin;
  }

  const { origin } = useRequestURL();

  return origin;
}
