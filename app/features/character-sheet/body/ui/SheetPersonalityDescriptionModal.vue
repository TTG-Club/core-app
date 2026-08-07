<script setup lang="ts">
  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import { SHEET_PERSONALITY_LABELS } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setPersonality } = useCharacterSheet();

  // Снимок личности на момент открытия: модалка размонтируется при закрытии, и
  // setup выполняется заново на каждое открытие — черновик всегда свежий.
  const personality = character.value.personality;

  const draftDescription = ref(personality.description);

  function handleApply() {
    setPersonality({ ...personality, description: draftDescription.value });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SHEET_PERSONALITY_LABELS.descriptionModalTitle"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <MarkupEditor
        v-model="draftDescription"
        :placeholder="SHEET_PERSONALITY_LABELS.descriptionPlaceholder"
      />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_PERSONALITY_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_PERSONALITY_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
