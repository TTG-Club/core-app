import { Role } from '~/shared/types';

import type { UserProfile } from '~/shared/types';

export function useUser() {
  const {
    data: user,
    execute: fetch,
    pending,
    clear,
  } = useAsyncData<UserProfile>(
    'user-profile',
    () => $fetch('/api/user/profile'),
    { dedupe: 'defer' },
  );

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout');
      clear();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return {
    user,
    pending,
    isLoggedIn,
    isAdmin,

    fetch,
    logout,
  };
}
