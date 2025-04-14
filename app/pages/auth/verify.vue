<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  import { PageContainer } from '~ui/page';

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
  <PageContainer>
    <AFlex
      :style="{ flex: 1 }"
      :gap="8"
      justify="center"
      vertical
    >
      <ATypographyTitle
        :level="1"
        data-allow-mismatch
      >
        Ваш учетная запись активирована 🥳
      </ATypographyTitle>

      <ATypographyText
        type="secondary"
        data-allow-mismatch
      >
        Теперь вы можете выполнить вход
      </ATypographyText>

      <AFlex :gap="12">
        <AButton
          type="primary"
          href="/"
          @click.left.exact.prevent="navigateTo({ name: 'index' })"
        >
          Вернуться на главную
        </AButton>
      </AFlex>
    </AFlex>
  </PageContainer>
</template>
