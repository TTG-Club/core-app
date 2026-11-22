<script setup lang="ts">
  // Сам файл, а не barrel модели: адрес нужен настройкам маршрута, а они
  // у всех страниц лежат в стартовом скрипте сайта — barrel положил бы туда
  // модель подписки и поиска игр целиком
  import { VTTG_SUBSCRIPTION_PATH } from '~vttg/model/navigation';

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
