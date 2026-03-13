import { Role } from '~/shared/types';

export function useUserRoles() {
  const { user, roles } = useUser();

  const isSubscriber = computed(
    () => !!user.value?.roles.includes(Role.SUBSCRIBER),
  );

  const isWriter = computed(() => !!user.value?.roles.includes(Role.WRITER));

  const isModerator = computed(
    () => !!user.value?.roles.includes(Role.MODERATOR),
  );

  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  return {
    roles,

    isSubscriber,
    isWriter,
    isModerator,
    isAdmin,
  };
}
