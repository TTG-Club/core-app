<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';

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
  <UModal title="Имя персонажа">
    <template #body>
      <UFormField label="Имя">
        <UInput
          v-model="draftName"
          placeholder="Введите имя персонажа"
          class="w-full"
        />
      </UFormField>
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
          label="Сохранить"
          color="primary"
          :disabled="isSaveDisabled"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
