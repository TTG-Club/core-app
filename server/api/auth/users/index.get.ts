export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawSearchQuery = query.query;

  const searchQuery =
    typeof rawSearchQuery === 'string' && rawSearchQuery.trim()
      ? rawSearchQuery.trim()
      : undefined;

  return parseAuthAdminUsersResponse(
    await fetchAuthAdminService<unknown>(event, '/api/admin/users', {
      query: {
        query: searchQuery,
      },
    }),
  );
});
