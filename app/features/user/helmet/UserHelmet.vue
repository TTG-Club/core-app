<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';
  import { AuthModal } from '~user/auth-modal';

  import type { DropdownMenuItem } from '@nuxt/ui';

  const dayjs = useDayjs();
  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();
  const { greaterOrEqual } = useBreakpoints();

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const isMenuOnLeft = greaterOrEqual(Breakpoint.MD);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  try {
    await userStore.fetch();
  } catch (err) {
    console.error(err);
  }

  const greetingText = computed(() => {
    const hours = dayjs().hour();

    const getString = (prefix: string) =>
      `${prefix}${user.value?.username ? `, ${user.value.username}` : ''}!`;

    if (hours < 6) {
      return getString('Доброй ночи');
    }

    if (hours < 12) {
      return getString('Доброе утро');
    }

    if (hours < 18) {
      return getString('Добрый день');
    }

    return getString('Добрый вечер');
  });

  const items = computed<DropdownMenuItem[][]>(() => [
    [
      {
        label: greetingText.value,
        type: 'label',
      },
    ],
    [
      ...(isAdmin.value
        ? [
            {
              label: 'Мастерская',
              kbds: ['meta', 'shift', 'm'],
              onSelect: () => {
                navigateTo({ name: 'workshop' });
              },
            },
          ]
        : []),
      {
        label: 'Личный кабинет',
        to: {
          name: 'user-profile',
        },
      },
      {
        label: 'Сменить пароль',
        disabled: true,
      },
    ],
    [
      {
        label: 'Выйти',
        icon: 'i-ttg-logout',
        color: 'error',
        onSelect: logout,
      },
    ],
  ]);

  function onClick() {
    isAuthOpened.value = true;
  }

  function logout() {
    userStore.logout().finally(() => {
      window.location.reload();
    });
  }

  defineShortcuts(computed(() => extractShortcuts(items.value)));
</script>

<template>
  <template v-if="!isLoggedIn">
    <UButton
      :loading="isLoading"
      variant="ghost"
      icon="i-fluent-person-16-regular"
      size="xl"
      color="neutral"
      @click.left.exact.prevent="onClick"
    />

    <AuthModal v-model="isAuthOpened" />
  </template>

  <UDropdownMenu
    v-else
    :content="{ side }"
    :items
  >
    <UButton
      :loading="isLoading"
      variant="ghost"
      icon="i-fluent-person-16-filled"
      size="xl"
      color="neutral"
    />
  </UDropdownMenu>
</template>
