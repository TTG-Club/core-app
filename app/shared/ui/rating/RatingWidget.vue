<script setup lang="ts">
  import { message } from 'ant-design-vue';
  import { ref, watchEffect } from 'vue';

  import { useAsyncData } from '#app'; // если ты в Nuxt 3

  const props = defineProps<{
    section: string;
    url: string;
  }>();

  const rate = ref<number | undefined>(undefined);
  const submitting = ref(false);

  // Загружаем рейтинг с сервера при изменении props.url или props.section
  watchEffect(async () => {
    const { data } = await useAsyncData(
      `rating-${props.section}-${props.url}`,
      () =>
        $fetch<number>('/api/v2/rating', {
          params: {
            section: props.section,
            url: props.url,
          },
        }),
      { watch: [() => props.url, () => props.section] },
    );

    rate.value = data.value;
  });

  // Отправляем рейтинг
  function submitRating(value: number) {
    submitting.value = true;

    return $fetch('/api/v2/rating', {
      method: 'POST',
      body: {
        section: props.section,
        url: props.url,
        value,
      },
    })
      .then(() => {
        message.success('Спасибо за оценку!');
        rate.value = value;
      })
      .catch(() => {
        message.error('Не удалось сохранить оценку');
      })
      .finally(() => {
        submitting.value = false;
      });
  }
</script>

<template>
  <ARate
    :value="rate"
    :disabled="submitting"
    @change="submitRating"
  />
</template>
