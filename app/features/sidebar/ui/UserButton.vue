<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import type { NavigationFailure } from 'vue-router';
  import { AuthModal } from '~/features/user';
  import { useUserRoles } from '~/shared/composables';
  import { useUserStore } from '~/shared/stores';

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
  const tooltipOpened = ref(false);

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

  const onNavigate = (
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    callback: (e?: MouseEvent) => Promise<NavigationFailure | void>,
  ) => {
    callback();

    tooltipOpened.value = false;
  };

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
          :style="{ padding: '6px 16px 8px 16px' }"
          :content="greetingText"
        />

        <ADivider :style="{ margin: '0' }" />

        <AButton
          v-if="isAdmin"
          block
          type="text"
          :href="workshopHref"
          :style="{ justifyContent: 'start' }"
          @click.left.exact.prevent="onNavigate(navigateToWorkshop)"
        >
          Мастерская
        </AButton>

        <AButton
          block
          :href="profileHref"
          type="text"
          :style="{ justifyContent: 'start' }"
          @click.left.exact.prevent="onNavigate(navigateToProfile)"
        >
          Личный кабинет
        </AButton>

        <AButton
          block
          disabled
          type="text"
          :style="{ justifyContent: 'start' }"
        >
          Сменить пароль
        </AButton>

        <AButton
          block
          danger
          type="text"
          :style="{ justifyContent: 'start' }"
          @click.left.exact.prevent="logout"
        >
          <template #icon>
            <SvgIcon icon="logout" />
          </template>

          <span>Выйти</span>
        </AButton>
      </AFlex>
    </template>
  </APopover>
</template>

<style lang="scss" module>
  .popup {
    padding: 50px;
    background: var(--color-bg-secondary);
  }
</style>
