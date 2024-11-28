export const useUserStore = defineStore('userStore', () => {
  const cookie = useCookie(USER_TOKEN_COOKIE);

  const {
    data: user,
    status,
    execute: fetch,
  } = useFetch<UserProfile>('/api/user/profile');

  const isLoggedIn = computed(() => !!(cookie.value && user.value));
  const isLoading = computed(() => status.value === 'pending');

  return {
    isLoading,
    isLoggedIn,

    cookie,
    user,

    fetch,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
