<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  /**
   * Пара кнопок в подвале окна: отказ и само действие.
   *
   * Отказ всегда стоит слева и всегда неприметный — от него не должно рябить
   * рядом с действием, ради которого окно и открыли. Пока окно занято
   * запросом, отказ заблокирован, а действие показывает загрузку: закрывать
   * окно на полпути нечестно по отношению к незавершённому запросу.
   */
  const {
    cancelLabel,
    submitLabel,
    submitIcon = undefined,
    submitColor = 'primary',
    loading = false,
    disabled = false,
  } = defineProps<{
    /** Подпись отказа. */
    cancelLabel: string;
    /** Подпись действия. */
    submitLabel: string;
    /** Значок действия. */
    submitIcon?: string;
    /** Цвет действия: у необратимого — `error`. */
    submitColor?: ButtonProps['color'];
    /** Идёт запрос: отказ заблокирован, действие с загрузкой. */
    loading?: boolean;
    /** Действие недоступно: форма ещё не заполнена. */
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    cancel: [];
    submit: [];
  }>();
</script>

<template>
  <div class="flex w-full justify-end gap-2">
    <UButton
      variant="ghost"
      color="neutral"
      :disabled="loading"
      :label="cancelLabel"
      @click.left.exact.prevent="emit('cancel')"
    />

    <UButton
      :color="submitColor"
      :icon="submitIcon"
      :loading="loading"
      :disabled="disabled"
      :label="submitLabel"
      @click.left.exact.prevent="emit('submit')"
    />
  </div>
</template>
