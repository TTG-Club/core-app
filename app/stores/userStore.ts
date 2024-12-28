export const useUserStore = defineStore('userStore', () => {
  const cookie = useCookie(USER_TOKEN_COOKIE);

  const {
    data: user,
    status,
    execute: fetch,
    clear,
  } = useFetch<UserProfile>('/api/user/profile', {
    immediate: false,
  });

  const isLoggedIn = computed(() => !!(cookie.value && user.value));
  const isLoading = computed(() => status.value === 'pending');

  const logout = () => {
    cookie.value = null;

    clear();
  };

  return {
    isLoading,
    isLoggedIn,

    cookie,
    user,

    fetch,
    logout,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
