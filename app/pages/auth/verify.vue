<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  const {
    query: { token },
  } = useRoute();

  if (!token) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  await useFetch('/api/auth/confirm/email', {
    method: 'PUT',
    params: { token },
    onResponseError: () => {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    },
    onRequestError: () => {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    },
  });
</script>

<template>
  <NuxtLayout>
    <div class="flex h-full flex-1 flex-col justify-center gap-4">
      <h1 class="text-xl">
        Ваш учетная запись активирована 🥳
      </h1>

      <span class="text-secondary"> Теперь вы можете выполнить вход </span>

      <div class="gap-3">
        <UButton
          href="/"
          @click.left.exact.prevent="navigateTo({ name: 'index' })"
        >
          Вернуться на главную
        </UButton>
      </div>
    </div>
  </NuxtLayout>
</template>
