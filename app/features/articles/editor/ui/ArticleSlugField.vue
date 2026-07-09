<script setup lang="ts">
  import type { SlugAvailability } from '../composables';

  import { useSlugAvailability } from '../composables';

  /** Подсказки под полем по состоянию проверки доступности slug. */
  const SLUG_AVAILABILITY_HINTS: Record<
    SlugAvailability,
    { text: string; icon?: string; class: string } | null
  > = {
    idle: null,
    checking: { text: 'Проверяем доступность…', class: 'text-muted' },
    free: {
      text: 'URL свободен',
      icon: 'tabler:circle-check',
      class: 'text-success',
    },
    own: {
      text: 'Текущий URL записи',
      icon: 'tabler:circle-check',
      class: 'text-muted',
    },
    taken: {
      text: 'URL уже занят',
      icon: 'tabler:alert-circle',
      class: 'text-error',
    },
    error: {
      text: 'Не удалось проверить URL',
      icon: 'tabler:alert-triangle',
      class: 'text-warning',
    },
  };

  const { title, currentUrl = undefined } = defineProps<{
    /** Заголовок записи — источник авто-генерации slug. */
    title: string;
    /** Собственный url записи при редактировании (не считается занятым). */
    currentUrl?: string;
  }>();

  const model = defineModel<string>({ default: '' });

  // Пользователь начал править slug вручную — прекращаем авто-генерацию из заголовка.
  const isManuallyEdited = ref(false);

  // Авто-генерация slug из заголовка (транслитерация в kebab-case) только при
  // СОЗДАНИИ (currentUrl не задан) и пока пользователь не правил поле руками. При
  // редактировании url — идентификатор записи, его нельзя переписывать из заголовка.
  watch(
    () => title,
    (value) => {
      if (isManuallyEdited.value || currentUrl) {
        return;
      }

      model.value = value ? getSlug(value) : '';
    },
  );

  function handleInput(value: string): void {
    isManuallyEdited.value = true;
    model.value = value ? getSlug(value) : '';
  }

  const { availability } = useSlugAvailability(
    toRef(() => model.value),
    toRef(() => currentUrl),
  );

  const hint = computed(() => SLUG_AVAILABILITY_HINTS[availability.value]);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <UInput
      :model-value="model"
      :loading="availability === 'checking'"
      :trailing-icon="hint?.icon"
      placeholder="url-zapisi"
      @update:model-value="handleInput"
    />

    <p
      v-if="hint"
      class="text-xs"
      :class="hint.class"
    >
      {{ hint.text }}
    </p>
  </div>
</template>
