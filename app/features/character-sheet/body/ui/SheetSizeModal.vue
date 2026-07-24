<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';
  import { SelectSize } from '~ui/select';

  import { useCharacterSheet } from '../../composables';

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
  <UModal title="Размер персонажа">
    <template #body>
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm text-toned">Размер</span>

        <SelectSize
          v-model="draftValue"
          class="w-48"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          label="Сбросить"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleReset"
        />

        <div class="flex gap-2">
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
      </div>
    </template>
  </UModal>
</template>
