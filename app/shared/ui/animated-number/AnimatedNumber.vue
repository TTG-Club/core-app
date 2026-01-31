<script lang="ts" setup>
  import { useDebounceFn, useRafFn } from '@vueuse/core';
  import { ref, watch } from 'vue';

  // Простая реализация линейной интерполяции
  function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
  }

  interface Props {
    value: number | undefined;
    duration?: number;
    locale?: string;
  }

  const { value, duration = 1000, locale = 'en-US' } = defineProps<Props>();

  if (duration < 0) {
    throw new Error(
      '[AnimatedNumber] Длительность должна быть положительным числом',
    );
  }

  try {
    Intl.NumberFormat(locale);
  } catch (e) {
    throw new Error('[AnimatedNumber] Невалидное значение локали');
  }

  const displayValue = ref(0);

  let startValue = 0;

  let cleanupRAF: (() => void) | null = null;

  function formatNumber(num: number) {
    return new Intl.NumberFormat(locale).format(num);
  }

  function animateNumber(targetValue: number) {
    cleanupRAF?.();

    startValue = displayValue.value;
    let startTime: number | null = null;

    const { pause, resume } = useRafFn(
      ({ timestamp }: { timestamp: number }) => {
        if (!startTime) {
          startTime = timestamp;
        }

        const progress = Math.min((timestamp - startTime) / duration, 1);

        displayValue.value = Math.trunc(
          lerp(startValue, targetValue, progress),
        );

        if (progress >= 1) {
          displayValue.value = targetValue;

          pause();
        }
      },
    );

    cleanupRAF = pause;

    resume();
  }

  const debouncedAnimate = useDebounceFn(animateNumber, 100, { maxWait: 1000 });

  watch(
    () => value,
    (newValue) => {
      debouncedAnimate(newValue === undefined ? 0 : newValue);
    },
    { immediate: true },
  );

  onUnmounted(() => {
    cleanupRAF?.();
  });
</script>

<template>
  <span>{{ formatNumber(displayValue) }}</span>
</template>
