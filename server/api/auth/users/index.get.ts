import { resolveNamesAndAvatarsByLogins } from '#server/utils/displayName';

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

  // Обогащаем страницу отображаемыми именами и аватарками из core-api
  // (владелец данных). Best-effort: core-api недоступен → null, в UI прочерк.
  const profileByLogin = await resolveNamesAndAvatarsByLogins(
    usersPage.content.map((user) => user.username),
  );

  return {
    ...usersPage,
    content: usersPage.content.map((user) => {
      const profile = profileByLogin.get(user.username.toLowerCase());

      return {
        ...user,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      };
    }),
  };
});
