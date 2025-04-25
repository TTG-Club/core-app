import { ROLE, type UserProfile } from '~/shared/types';

export const useUserStore = defineStore('userStore', () => {
  const {
    data: user,
    status,
    execute: fetch,
    clear,
  } = useFetch<UserProfile>('/api/user/profile', {
    immediate: false,
  });

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

  const isAdmin = computed(() => !!user.value?.roles.includes(ROLE.ADMIN));

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
