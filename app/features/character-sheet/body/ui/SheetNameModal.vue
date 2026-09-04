<script setup lang="ts">
  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import { SHEET_NAME_MODAL_LABELS } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setName } = useCharacterSheet();

  const draftName = ref(character.value.name);

  const isSaveDisabled = computed(() => !draftName.value.trim());

  function handleSave() {
    setName(draftName.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="SHEET_NAME_MODAL_LABELS.title">
    <template #body>
      <UFormField :label="SHEET_NAME_MODAL_LABELS.field">
        <UInput
          v-model="draftName"
          :placeholder="SHEET_NAME_MODAL_LABELS.placeholder"
          class="w-full"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.save"
          color="primary"
          :disabled="isSaveDisabled"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
