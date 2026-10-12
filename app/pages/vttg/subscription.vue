<script setup lang="ts">
  // Старый адрес страницы подписки: сохраняем query, чтобы не потерять
  // результат оплаты у тех, кто вернётся сюда по ранее выданной ссылке.
  definePageMeta({
    redirect: (to) => ({
      path: '/subscription',
      query: to.query,
      hash: to.hash,
    }),
  });
</script>

<template>
  <span>Redirecting...</span>
</template>
