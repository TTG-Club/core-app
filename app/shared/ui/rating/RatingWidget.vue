<script setup lang="ts">
  import { message } from 'ant-design-vue';
  import { ref, watchEffect } from 'vue';

  import { useAsyncData } from '#app';

  const props = defineProps<{
    section: string;
    url: string;
  }>();

  const submitting = ref(false);
  const rate = ref<number>(0);
  const total = ref<number>(0);

  watchEffect(async () => {
    const { data } = await useAsyncData(
      `rating-${props.section}-${props.url}`,
      () =>
        $fetch<{ value: number; total: number }>('/api/v2/rating', {
          params: {
            section: props.section,
            url: props.url,
          },
        }),
      { watch: [() => props.url, () => props.section] },
    );

    if (data.value) {
      rate.value = data.value.value;
      total.value = data.value.total;
    }
  });

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
  <span :class="$style.blockRate">
    <ARate
      :value="rate"
      allow-half
      @change="submitRating"
    />

    <span :class="$style.result">{{ rate }}</span>

    <span :class="$style.info">
      <span :class="$style.text">Оценок:</span>

      <span :class="$style.text">{{ total }}</span>
    </span>
  </span>
</template>

<style module lang="scss">
  .blockRate {
    display: flex;
    gap: 8px;
    align-items: center;

    padding: 2px 12px 6px 12px;
    border-radius: 8px;

    background: var(--color-hover);

    @container (width > 600px) {
      max-width: 320px;
    }
  }

  .result {
    display: flex;
    align-items: flex-end;

    margin-top: 4px;
    margin-left: auto;
    padding: 0 12px;
    border-radius: 8px;

    font-size: 20px;
    font-weight: 500;
    color: var(--color-text-bold);

    background: var(--color-hover);
  }

  .info {
    display: flex;
    flex-direction: column;
    margin-top: 4px;
  }

  .text {
    font-size: 10px;
  }
</style>
