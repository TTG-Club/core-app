<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';
  import { ACTION_LABELS } from '~/shared/consts';
  import { SelectSize } from '~ui/select';

  import { useCharacterSheet } from '../../composables';
  import { SHEET_SIZE_MODAL_LABELS } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSize } = useCharacterSheet();

  // Тот же ключ, что и внутри SelectSize: запрос словаря не дублируется,
  // а список нужен здесь для соответствия значение ↔ русская подпись.
  const { data: sizeOptions } = await useAsyncData(
    'dictionaries-sizes',
    () => DictionaryService.sizes(),
    { dedupe: 'defer' },
  );

  const draftValue = ref<string | undefined>(
    sizeOptions.value?.find((option) => option.label === character.value.size)
      ?.value,
  );

  function handleApply() {
    const selectedOption = sizeOptions.value?.find(
      (option) => option.value === draftValue.value,
    );

    setSize(selectedOption?.label ?? null);
    emit('close');
  }

  function handleReset() {
    draftValue.value = undefined;
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="SHEET_SIZE_MODAL_LABELS.title">
    <template #body>
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm text-toned">{{
          SHEET_SIZE_MODAL_LABELS.field
        }}</span>

        <SelectSize
          v-model="draftValue"
          class="w-48"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          :label="ACTION_LABELS.reset"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleReset"
        />

        <div class="flex gap-2">
          <UButton
            :label="ACTION_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            :label="ACTION_LABELS.apply"
            color="primary"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
