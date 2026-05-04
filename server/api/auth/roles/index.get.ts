export default defineEventHandler(async (event) => {
  return parseAuthAdminRolesResponse(
    await fetchAuthAdminService<unknown>(event, '/api/admin/roles'),
  );
});
