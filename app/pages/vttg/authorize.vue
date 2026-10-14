<script setup lang="ts">
  import { FetchError } from 'ofetch';
  import { z } from 'zod';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { AuthModal } from '~user/auth-modal';
  import {
    buildVttgAuthorizeCancelUrl,
    buildVttgAuthorizeReturnUrl,
    describeVttgAuthorizeError,
    parseVttgAuthorizeQuery,
    VTTG_AUTHORIZE_ENDPOINT,
    VTTG_AUTHORIZE_ERRORS,
    VTTG_AUTHORIZE_ICONS,
    VTTG_AUTHORIZE_INVALID,
    VTTG_AUTHORIZE_PAGE,
    VTTG_AUTHORIZE_SEO,
    VTTG_LANDING_PATH,
  } from '~vttg/model';
  import { VttgAuthorizeCard } from '~vttg/ui';

  // Без definePageMeta с `auth`: гостю закрытая страница показала бы ошибку, а
  // сюда человек приходит из мира как раз затем, чтобы войти. Вход — на самой
  // странице, справку выдаёт роут, который сессию проверяет сам.
  useSeoMeta({
    title: VTTG_AUTHORIZE_SEO.title,
    description: VTTG_AUTHORIZE_SEO.description,
    robots: VTTG_AUTHORIZE_SEO.robots,
  });

  /** Ответ роута справки — данные внешние. */
  const authorizeResponseSchema = z.object({
    ticket: z.string().min(1),
  });

  const route = useRoute();

  /** Запрос входа из ссылки мира; `undefined` — ссылка повреждена. */
  const request = computed(() => parseVttgAuthorizeQuery(route.query));

  // Сессию решает кука токена, а не профиль: профиль догружается лениво, и
  // вошедший успевал бы увидеть приглашение войти. Кука известна и на SSR.
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const { user, isLoggedIn, fetch: fetchUser } = useUser();

  const hasSession = computed(() => isLoggedIn.value || Boolean(token.value));

  const isAuthOpen = ref(false);
  const isAllowing = ref(false);
  const errorMessage = ref('');

  // Вход меняет куку, а её значение кэшируется с момента гидрации: без сброса
  // страница и после входа звала бы войти. Цикла нет — вотчер трогает только
  // кэш куки, на свои источники он не влияет.
  watch([isLoggedIn, isAuthOpen], () => {
    refreshCookie(USER_TOKEN_COOKIE);
  });

  // Ник нужен человеку на экране согласия — он подтверждает, под кем войдёт.
  // Профиль грузится лениво и на этой странице может быть ещё не запрошен.
  watch(
    hasSession,
    (sessionExists) => {
      if (sessionExists && !user.value) {
        fetchUser();
      }
    },
    { immediate: true },
  );

  /** Открывает окно входа. */
  function openSignIn() {
    isAuthOpen.value = true;
  }

  /**
   * Просит справку и возвращает человека в мир вместе с ней.
   */
  async function allow() {
    if (!request.value) {
      return;
    }

    isAllowing.value = true;
    errorMessage.value = '';

    try {
      const response = authorizeResponseSchema.safeParse(
        await $fetch<unknown>(VTTG_AUTHORIZE_ENDPOINT, {
          method: 'POST',
          body: { audience: request.value.worldOrigin },
        }),
      );

      if (!response.success) {
        errorMessage.value = VTTG_AUTHORIZE_ERRORS.unavailable;

        return;
      }

      // Справка живёт минуту — уходим сразу. Индикатор не гасим: страница
      // сейчас сменится, а погасший он дал бы нажать «Разрешить» второй раз.
      await navigateTo(
        buildVttgAuthorizeReturnUrl(request.value, response.data.ticket),
        { external: true },
      );
    } catch (error) {
      errorMessage.value = describeVttgAuthorizeError(
        error instanceof FetchError ? error.statusCode : undefined,
      );

      isAllowing.value = false;
    }
  }

  /**
   * Возвращает человека в мир без справки.
   */
  async function cancel() {
    if (!request.value) {
      return;
    }

    await navigateTo(buildVttgAuthorizeCancelUrl(request.value), {
      external: true,
    });
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_AUTHORIZE_PAGE.title"
    :subtitle="VTTG_AUTHORIZE_PAGE.subtitle"
    :back-to="VTTG_LANDING_PATH"
  >
    <template #default>
      <div class="flex min-w-0 flex-col items-center gap-4">
        <VttgAuthorizeCard
          v-if="request"
          :request="request"
          :has-session="hasSession"
          :account-name="user?.username"
          :is-allowing="isAllowing"
          @allow="allow"
          @cancel="cancel"
          @sign-in="openSignIn"
        >
          <UAlert
            v-if="errorMessage"
            :title="VTTG_AUTHORIZE_ERRORS.title"
            :description="errorMessage"
            :icon="VTTG_AUTHORIZE_ICONS.warning"
            color="error"
            variant="subtle"
          />
        </VttgAuthorizeCard>

        <UAlert
          v-else
          class="w-full max-w-xl"
          :title="VTTG_AUTHORIZE_INVALID.title"
          :description="VTTG_AUTHORIZE_INVALID.description"
          :icon="VTTG_AUTHORIZE_ICONS.invalid"
          color="error"
          variant="subtle"
        />
      </div>

      <AuthModal v-model="isAuthOpen" />
    </template>
  </NuxtLayout>
</template>
