<script setup lang="ts">
  import type { ActiveEffect } from '~active-effects/model';

  import { ActiveEffectItem } from '~active-effects/editor';
  import { createEmptyActiveEffect } from '~active-effects/model';

  import { useSheetActiveEffects } from '../../composables';
  import { SHEET_EFFECT_LABELS } from '../../model';

  // Идентификатор правимого эффекта; null — форма заводит новый.
  const { effectId } = defineProps<{
    effectId: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { customEffects, saveEffect } = useSheetActiveEffects();

  // Снимок эффекта на момент открытия: модалка размонтируется при закрытии, и
  // setup выполняется заново на каждое открытие. Правки применяются по кнопке,
  // поэтому реактивность снимку не нужна.
  const editedEffect = effectId
    ? customEffects.value.find((effect) => effect.id === effectId)
    : undefined;

  const draft = ref<ActiveEffect>(
    editedEffect
      ? structuredClone(toRaw(editedEffect))
      : createEmptyActiveEffect('manual'),
  );

  const modalTitle = computed(() =>
    effectId ? SHEET_EFFECT_LABELS.edit : SHEET_EFFECT_LABELS.add,
  );

  function handleApply() {
    saveEffect(draft.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <ActiveEffectItem v-model="draft" />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_EFFECT_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_EFFECT_LABELS.save"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
