<script setup lang="ts">
  import { VTTG_SUBSCRIPTION_PATH } from '~vttg/model';

  // Старый адрес страницы подписки: сохраняем query, чтобы не потерять
  // результат оплаты у тех, кто вернётся сюда по ранее выданной ссылке.
  definePageMeta({
    redirect: (to) => ({
      path: VTTG_SUBSCRIPTION_PATH,
      query: to.query,
      hash: to.hash,
    }),
  });
</script>

<template>
  <span>Redirecting...</span>
</template>
