<script setup lang="ts">
  import { useDayjs, useUserRoles } from '~/shared/composables';
  import { useUserStore } from '~/shared/stores';
  import { SidebarPopover } from '~sidebar/popover';
  import { SvgIcon } from '~ui/icon';
  import { AuthModal } from '~user/auth-modal';

  const dayjs = useDayjs();
  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();

  const { href: profileHref, navigate: navigateToProfile } = useLink({
    to: {
      name: 'user-profile',
    },
  });

  const { href: workshopHref, navigate: navigateToWorkshop } = useLink({
    to: {
      name: 'workshop',
    },
  });

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);

  try {
    await userStore.fetch();
  } catch (err) {
    console.error(err);
  }

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

  const logout = () => {
    userStore.logout().finally(() => {
      window.location.reload();
    });
  };
</script>

<template>
  <template v-if="!isLoggedIn">
    <AButton
      :loading="isLoading"
      type="text"
      size="large"
      @click.left.exact.prevent="onClick"
    >
      <template #icon>
        <SvgIcon icon="profile/helmet/outline" />
      </template>
    </AButton>

    <AuthModal v-model="isAuthOpened" />
  </template>

  <SidebarPopover
    v-else
    popover-key="user-helmet"
    bottom
  >
    <template #trigger="{ toggle }">
      <AButton
        type="text"
        size="large"
        @click.left.exact.prevent="toggle"
      >
        <template #icon>
          <SvgIcon icon="profile/helmet/filled" />
        </template>
      </AButton>
    </template>

    <template #default>
      <ATypographyText
        :style="{ padding: '8px 16px' }"
        :content="greetingText"
        ellipsis
        strong
      />

      <ADivider :style="{ margin: '0' }" />

      <AFlex
        :style="{ minWidth: '128px', maxWidth: '256px', padding: '8px' }"
        align="center"
        gap="4"
        vertical
      >
        <AButton
          v-if="isAdmin"
          :style="{ justifyContent: 'start' }"
          :href="workshopHref"
          type="text"
          block
          @click.left.exact.prevent="navigateToWorkshop()"
        >
          Мастерская
        </AButton>

        <AButton
          :style="{ justifyContent: 'start' }"
          :href="profileHref"
          type="text"
          block
          @click.left.exact.prevent="navigateToProfile()"
        >
          Личный кабинет
        </AButton>

        <AButton
          :style="{ justifyContent: 'start' }"
          type="text"
          disabled
          block
        >
          Сменить пароль
        </AButton>

        <AButton
          :style="{ justifyContent: 'start' }"
          type="text"
          danger
          block
          @click.left.exact.prevent="logout"
        >
          <template #icon>
            <SvgIcon icon="logout" />
          </template>

          <span>Выйти</span>
        </AButton>
      </AFlex>
    </template>
  </SidebarPopover>
</template>
