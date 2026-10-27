<script setup lang="ts">
  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { AuthModal } from '~user/auth-modal';

  import { UserMenu } from './ui';

  const { fetch: fetchUser, pending, isLoggedIn } = useUser();

  const userTokenCookie = useCookie<string | null>(USER_TOKEN_COOKIE);

  const isAuthOpened = ref(false);

  if (userTokenCookie.value) {
    try {
      await fetchUser();
    } catch (err) {
      consola.error(err);
    }
  }

  function openAuth() {
    isAuthOpened.value = true;
  }
</script>

<template>
  <!-- Меню с точками новостей монтируется по факту входа, а не по cookie на
    старте страницы: иначе после входа без перезагрузки сводки не заводились
    и точка на шлеме не зажигалась до F5 -->
  <UserMenu v-if="isLoggedIn" />

  <template v-else>
    <UButton
      :loading="pending"
      icon="ttg:profile-helmet-outline"
      variant="ghost"
      color="neutral"
      size="xl"
      @click.left.exact.prevent.stop="openAuth"
    />

    <AuthModal v-model="isAuthOpened" />
  </template>
</template>
