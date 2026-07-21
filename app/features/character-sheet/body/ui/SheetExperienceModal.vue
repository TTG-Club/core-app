<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import { EXPERIENCE_MAX, LEVEL_MAX, LEVEL_MIN } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setProgress } = useCharacterSheet();

  const draftLevel = ref(character.value.level);

  const draftExperience = ref(character.value.experience.current);

  const draftAdditionalExperience = ref(0);

  const totalExperience = computed(() =>
    Math.max(0, draftExperience.value + draftAdditionalExperience.value),
  );

  function handleApply() {
    setProgress(draftLevel.value, totalExperience.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Опыт и уровень">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Уровень</span>

          <UInputNumber
            v-model="draftLevel"
            :min="LEVEL_MIN"
            :max="LEVEL_MAX"
            class="w-40"
          />
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Текущий опыт</span>

          <UInputNumber
            v-model="draftExperience"
            :min="0"
            :max="EXPERIENCE_MAX"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Добавить опыт</span>

          <UInputNumber
            v-model="draftAdditionalExperience"
            :min="-EXPERIENCE_MAX"
            :max="EXPERIENCE_MAX"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Итого опыта</span>

          <span class="font-bold text-highlighted">{{ totalExperience }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
