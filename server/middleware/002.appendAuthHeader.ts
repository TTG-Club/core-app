export default defineEventHandler((event) => {
  if (getRequestHeader(event, 'authorization')) {
    return;
  }

  const token = getCookie(event, USER_TOKEN_COOKIE);

  if (token) {
    appendHeader(event, 'Authorization', `Bearer ${token}`);
  }
});
