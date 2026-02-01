<script lang="ts" setup>
  import { TransitionPresets, useTransition } from '@vueuse/core';

  interface Props {
    value: number | undefined;
    duration?: number;
    locale?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    duration: 1000,
    locale: 'ru-RU',
  });

  // Начинаем с 0, чтобы всегда была анимация при появлении (даже если данные уже загружены)
  const source = ref(0);

  const output = useTransition(source, {
    duration: props.duration,
    transition: TransitionPresets.easeInOutExpo,
  });

  const formattedValue = computed(() =>
    new Intl.NumberFormat(props.locale).format(Math.round(output.value)),
  );

  // Обновляем значение при изменении пропса
  watch(
    () => props.value,
    (newValue) => {
      source.value = newValue ?? 0;
    },
  );

  // При монтировании запускаем анимацию от 0 до текущего значения
  onMounted(() => {
    source.value = props.value ?? 0;
  });
</script>

<template>
  <span>{{ formattedValue }}</span>
</template>
