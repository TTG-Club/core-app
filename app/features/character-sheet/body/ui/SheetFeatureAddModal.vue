<script setup lang="ts">
  import type { FeatureOrigin } from '../../model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import { FEATURE_ORIGIN_OPTIONS, parseStoredMarkupNodes } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, addFeature } = useCharacterSheet();

  const draftName = ref('');

  const draftOrigin = ref<FeatureOrigin>('none');

  const draftDescription = ref('');

  const isApplyDisabled = computed(() => !draftName.value.trim());

  /** Название источника особенности по выбранному происхождению. */
  function getOriginName(): string {
    if (draftOrigin.value === 'species') {
      return character.value.species?.name ?? '';
    }

    if (draftOrigin.value === 'class') {
      return character.value.className ?? '';
    }

    return '';
  }

  function handleApply() {
    const name = draftName.value.trim();

    if (!name) {
      return;
    }

    addFeature({
      name,
      description: parseStoredMarkupNodes(draftDescription.value),
      origin: draftOrigin.value,
      originName: getOriginName(),
      choice: null,
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Новая особенность"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-end gap-3">
          <div class="flex min-w-0 grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Название
            </span>

            <UInput
              v-model="draftName"
              placeholder="Название особенности"
            />
          </div>

          <div class="flex w-40 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Источник
            </span>

            <USelect
              v-model="draftOrigin"
              :items="FEATURE_ORIGIN_OPTIONS"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            Описание
          </span>

          <MarkupEditor
            v-model="draftDescription"
            placeholder="Опиши особенность"
          />
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
          label="Добавить"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
