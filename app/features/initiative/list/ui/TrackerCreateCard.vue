<script setup lang="ts">
  import {
    DEFAULT_TRACKER_NAME,
    MAX_D20,
    MAX_TRACKER_NAME_LENGTH,
  } from '~initiative/model';
  import { InitiativeDie } from '~initiative/ui-kit';

  const {
    loading = false,
    disabled = false,
    submitLabel = 'Создать трекер',
    heading = 'Новый трекер инициативы',
    description = 'Соберите энкаунтер и одной кнопкой прокиньте инициативу всем участникам.',
    placeholder = DEFAULT_TRACKER_NAME,
    hideName = false,
  } = defineProps<{
    loading?: boolean;
    disabled?: boolean;
    submitLabel?: string;
    heading?: string;
    description?: string;
    placeholder?: string;
    /** Скрыть поле имени (анониму название боя не нужно). */
    hideName?: boolean;
  }>();

  const emit = defineEmits<{
    create: [name: string];
  }>();

  const name = ref('');

  function submit(): void {
    if (disabled || loading) {
      return;
    }

    emit('create', name.value.trim());
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-elevated p-4 ring-1 ring-primary/15 sm:p-6"
  >
    <div class="flex items-center gap-4">
      <div
        class="hidden shrink-0 place-items-center rounded-xl bg-primary/5 p-2.5 sm:grid"
      >
        <InitiativeDie
          :value="MAX_D20"
          size="lg"
        />
      </div>

      <div class="flex min-w-0 flex-col gap-1">
        <h3 class="text-lg font-semibold text-highlighted">
          {{ heading }}
        </h3>

        <p class="text-sm text-secondary">
          {{ description }}
        </p>
      </div>

      <!-- Кнопка сборки — действие в шапке, в одну линию с заголовком. -->
      <UButton
        type="button"
        icon="tabler:swords"
        size="lg"
        class="ml-auto shrink-0 justify-center transition-transform hover:-translate-y-px active:translate-y-0"
        :loading
        :disabled
        @click.left.exact.prevent="submit"
      >
        {{ submitLabel }}
      </UButton>
    </div>

    <!-- Необязательное имя боя отдельной строкой (скрывается через hideName). -->
    <form
      v-if="!hideName"
      @submit.prevent="submit"
    >
      <UInput
        v-model="name"
        :maxlength="MAX_TRACKER_NAME_LENGTH"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        class="w-full"
        size="lg"
      />
    </form>

    <slot name="footer" />
  </div>
</template>
