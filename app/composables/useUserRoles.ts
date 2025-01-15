export const useUserRoles = () => {
  const { user } = storeToRefs(useUserStore());

  const isSubscriber = computed(
    () => !!user.value?.roles.includes(ROLE.SUBSCRIBER),
  );

  const isWriter = computed(() => !!user.value?.roles.includes(ROLE.WRITER));

  const isModerator = computed(
    () => !!user.value?.roles.includes(ROLE.MODERATOR),
  );

  const isAdmin = computed(() => !!user.value?.roles.includes(ROLE.ADMIN));

  return {
    isSubscriber,
    isWriter,
    isModerator,
    isAdmin,
  };
};
