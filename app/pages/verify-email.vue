<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  const route = useRoute();
  const tokenQuery = route.query.token;

  const verificationToken =
    typeof tokenQuery === 'string' && tokenQuery ? tokenQuery : '';

  if (!verificationToken) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  await useFetch('/api/auth/confirm/email', {
    method: 'PUT',
    params: {
      token: verificationToken,
    },
    onRequestError: () => {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    },
    onResponseError: () => {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    },
  });

  async function navigateToHome() {
    await navigateTo({ name: 'index' });
  }
</script>

<template>
  <NuxtLayout>
    <div class="flex h-full flex-1 flex-col justify-center gap-4">
      <h1 class="text-xl">Ваша учетная запись активирована</h1>

      <span class="text-secondary"> Теперь вы можете выполнить вход </span>

      <div class="gap-3">
        <UButton
          href="/"
          @click.left.exact.prevent="navigateToHome"
        >
          Вернуться на главную
        </UButton>
      </div>
    </div>
  </NuxtLayout>
</template>
