import { useUserStore } from '~/shared/stores';
import { Role } from '~/shared/types';

export function useUserRoles() {
  const { user } = storeToRefs(useUserStore());

  const isSubscriber = computed(
    () => !!user.value?.roles.includes(Role.SUBSCRIBER),
  );

  const isWriter = computed(() => !!user.value?.roles.includes(Role.WRITER));

  const isModerator = computed(
    () => !!user.value?.roles.includes(Role.MODERATOR),
  );

  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  return {
    isSubscriber,
    isWriter,
    isModerator,
    isAdmin,
  };
}
