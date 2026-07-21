import { resolveDisplayNamesByLogins } from '#server/utils/displayName';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const rawSearchQuery = query.query;

  const searchQuery =
    typeof rawSearchQuery === 'string' && rawSearchQuery.trim()
      ? rawSearchQuery.trim()
      : undefined;

  const rawRole = query.role;
  const role = typeof rawRole === 'string' && rawRole ? rawRole : undefined;

  const usersPage = parseAuthAdminUsersPageResponse(
    await fetchAuthAdminService<unknown>(event, '/api/admin/users', {
      query: {
        query: searchQuery,
        role,
        page: query.page,
        size: query.size,
      },
    }),
  );

  // Обогащаем страницу отображаемыми именами из core-api (владелец данных).
  // Best-effort: core-api недоступен → displayName = null, в UI покажется прочерк.
  const nameByLogin = await resolveDisplayNamesByLogins(
    usersPage.content.map((user) => user.username),
  );

  return {
    ...usersPage,
    content: usersPage.content.map((user) => ({
      ...user,
      displayName: nameByLogin.get(user.username.toLowerCase()) ?? null,
    })),
  };
});
