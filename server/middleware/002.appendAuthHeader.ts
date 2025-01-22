import { USER_TOKEN_COOKIE } from '~~/shared/consts';

export default defineEventHandler((event) => {
  const token = getCookie(event, USER_TOKEN_COOKIE);

  if (token) {
    Object.assign(event.node.req.headers, { authorization: `Bearer ${token}` });
  }
});
