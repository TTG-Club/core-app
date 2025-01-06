export default defineEventHandler((event) => {
  const token = getCookie(event, USER_TOKEN_COOKIE);

  const {
    api: { url },
  } = useRuntimeConfig();

  const target = url + event.path;
  const headers = getHeaders(event);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return proxyRequest(event, target, { headers });
});
