<script setup lang="ts">
  import type { GenerationDifficulty } from '../model';

  import { SelectHabitat } from '~ui/select';

  import {
    DEFAULT_GENERATION_DIFFICULTY,
    GENERATION_DIFFICULTY_OPTIONS,
  } from '../model';

  const { loading = false, disabled = false } = defineProps<{
    loading?: boolean;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    generate: [difficulty: GenerationDifficulty, habitat: string | undefined];
  }>();

  const difficulty = ref<GenerationDifficulty>(DEFAULT_GENERATION_DIFFICULTY);
  const habitat = ref<string | Array<string>>();

  const selectedHabitat = computed(() =>
    typeof habitat.value === 'string' && habitat.value
      ? habitat.value
      : undefined,
  );

  function clearHabitat(): void {
    habitat.value = undefined;
  }

  function submit(): void {
    if (loading || disabled) {
      return;
    }

    emit('generate', difficulty.value, selectedHabitat.value);
  }
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="submit"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:dice-5"
        class="size-5 text-primary"
      />
      Генерация

      <span class="ml-auto text-xs font-normal text-muted">
        Добавит существ до выбранной сложности
      </span>
    </div>

    <div class="flex flex-wrap items-end gap-2">
      <UFormField
        label="Сложность"
        class="min-w-36 flex-1"
      >
        <USelect
          v-model="difficulty"
          :items="GENERATION_DIFFICULTY_OPTIONS"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Среда обитания"
        class="min-w-48 flex-2"
      >
        <div class="flex gap-1">
          <SelectHabitat
            v-model="habitat"
            class="w-full"
          />

          <UButton
            v-if="selectedHabitat"
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            aria-label="Любая среда обитания"
            @click.left.exact.prevent="clearHabitat"
          />
        </div>
      </UFormField>

      <UButton
        type="submit"
        icon="tabler:wand"
        class="shrink-0 max-sm:grow max-sm:justify-center"
        :loading
        :disabled
      >
        Сгенерировать
      </UButton>
    </div>
  </form>
</template>
