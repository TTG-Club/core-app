import { Role } from '~/shared/types';
import type { UserProfile } from '~/shared/types';

export const useUserStore = defineStore('userStore', () => {
  const {
    data: user,
    status,
    execute: fetch,
    clear,
  } = useAsyncData(
    'user-profile',
    () => $fetch<UserProfile>('/api/user/profile'),
    { dedupe: 'defer' },
  );

  const isLoggedIn = computed(() => !!user.value);
  const isLoading = computed(() => status.value === 'pending');

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout');

      clear();
    } catch (error) {
      console.error(error);
    }
  };

  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  return {
    isLoading,
    isLoggedIn,

    user,

    isAdmin,

    fetch,
    logout,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
