import type { UserProfile } from '~/shared/types';

import { Role } from '~/shared/types';

export function useUser() {
  const requestFetch = useRequestFetch();

  const {
    data: user,
    execute,
    pending,
    clear,
  } = useAsyncData<UserProfile | null>(
    'user-profile',
    () => requestFetch('/api/auth/me'),
    { dedupe: 'defer', lazy: true, immediate: false },
  );

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  async function fetchProfile(force = false) {
    if (!isLoggedIn.value && !force) {
      return Promise.resolve();
    }

    return await execute();
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout');

      clear();
      redirectIfNeeded();
    } catch (error) {
      consola.error('Ошибка при выходе:', error);
    }
  }

  function redirectIfNeeded() {
    const { currentRoute, push } = useRouter();
    const route = currentRoute.value;

    if (route.meta.auth?.roles?.length) {
      push({ path: '/' });
    }
  }

  return {
    user,
    roles: computed(() => user.value?.roles),

    isLoggedIn,
    isAdmin,

    pending,
    fetch: () => fetchProfile(true),
    logout,
  };
}
