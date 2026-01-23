import { useUserStore } from '~/shared/stores';

// TODO: Проверить и исправить ошибку.
export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();

  if (!userStore.isLoggedIn) {
    await userStore.fetch();
  }

  if (userStore.isLoading) {
    // Wait for the pending request to complete
    await new Promise((resolve) => {
      const unwatch = watch(
        () => userStore.isLoading,
        (loading) => {
          if (!loading) {
            unwatch();
            resolve(true);
          }
        },
      );
    });
  }

  if (!isAdmin.value) {
    return navigateTo('/');
  }
});
