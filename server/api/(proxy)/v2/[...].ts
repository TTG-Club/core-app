export default defineEventHandler((event) => {
  const {
    api: { url },
  } = useRuntimeConfig();

  const target = url + event.path;

  return proxyRequest(event, target);
});
