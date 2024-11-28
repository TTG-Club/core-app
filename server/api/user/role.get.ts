export default defineEventHandler(async (event) => {
  const { role } = await getUserFromToken(event);

  return role;
});
