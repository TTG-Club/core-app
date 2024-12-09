<script setup lang="ts">
  const dayjs = useDayjs();
  const userStore = useUserStore();

  const { href: profileHref, navigate: navigateToProfile } = useLink({
    to: {
      name: 'user-profile',
    },
  });

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const tooltipOpened = ref(false);

  const onClick = () => {
    isAuthOpened.value = true;
  };

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

  const goToProfile = () => {
    navigateToProfile();

    tooltipOpened.value = false;
  };

  const logout = () => {
    userStore.logout();
    window.location.reload();
  };
</script>

<template>
  <AButton
    v-if="!isLoggedIn"
    :loading="isLoading"
    type="text"
    size="large"
    @click.left.exact.prevent="onClick"
  >
    <template #icon>
      <SvgIcon icon="profile/helmet/outline" />
    </template>
  </AButton>

  <APopover
    v-else
    v-model:open="tooltipOpened"
    :arrow="false"
    :align="{
      offset: [24, 0],
      overflow: {
        adjustX: true,
        adjustY: true,
      },
    }"
    placement="rightBottom"
    trigger="click"
    destroy-tooltip-on-hide
  >
    <template #default>
      <AButton
        type="text"
        size="large"
      >
        <template #icon>
          <SvgIcon icon="profile/helmet/filled" />
        </template>
      </AButton>
    </template>

    <template #content>
      <AFlex
        align="center"
        vertical
        :gap="8"
        :style="{ minWidth: '128px', maxWidth: '256px' }"
      >
        <ATypographyText
          ellipsis
          strong
          :style="{ paddingBottom: '8px' }"
          :content="greetingText"
        />

        <AButton
          block
          :href="profileHref"
          @click.left.exact.prevent="goToProfile"
        >
          Личный кабинет
        </AButton>

        <AButton block> Сменить пароль </AButton>

        <AButton
          block
          danger
          type="primary"
          @click.left.exact.prevent="logout"
        >
          Выйти
          <SvgIcon icon="logout" />
        </AButton>
      </AFlex>
    </template>
  </APopover>

  <AuthModal v-model="isAuthOpened" />
</template>
