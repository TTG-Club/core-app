export default defineEventHandler((event) => {
  const { apiUrl } = useRuntimeConfig();
  const target = apiUrl + event.path;

  return proxyRequest(event, target);
});
