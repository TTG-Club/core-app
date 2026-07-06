export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const rawSearchQuery = query.query;

  const searchQuery =
    typeof rawSearchQuery === 'string' && rawSearchQuery.trim()
      ? rawSearchQuery.trim()
      : undefined;

  const rawRole = query.role;
  const role = typeof rawRole === 'string' && rawRole ? rawRole : undefined;

  return parseAuthAdminUsersPageResponse(
    await fetchAuthAdminService<unknown>(event, '/api/admin/users', {
      query: {
        query: searchQuery,
        role,
        page: query.page,
        size: query.size,
      },
    }),
  );
});
