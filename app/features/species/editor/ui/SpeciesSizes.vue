<script setup lang="ts">
  import type { SpeciesCreate } from '../../model';

  import { isString } from 'es-toolkit';

  import { DictionaryService } from '~/shared/api';
  import { SelectSize } from '~ui/select';

  import { SPECIES_SIZES_EDITOR } from '../../model';

  type Sizes = SpeciesCreate['properties']['sizes'];

  /**
   * Размеры вида — как в форме системы D&D: набор выбирается одним
   * мультиселектом, а рост задаётся строкой на каждый выбранный размер.
   */
  const sizes = defineModel<Sizes>({
    default: () => [],
  });

  // Тот же ключ, что у SelectSize: словарь грузится один раз на всех
  const { data: sizeOptions } = await useAsyncData(
    'dictionaries-sizes',
    () => DictionaryService.sizes(),
    { dedupe: 'defer' },
  );

  const selectedTypes = computed(() =>
    sizes.value.map((size) => size.type).filter((type) => isString(type)),
  );

  /**
   * Подпись размера из словаря; словарь ещё не пришёл — показывается ключ.
   *
   * @param type ключ размера.
   * @returns подпись для строки роста.
   */
  function getSizeLabel(type: string | undefined): string {
    if (!type) {
      return '';
    }

    return (
      sizeOptions.value?.find((option) => option.value === type)?.label ?? type
    );
  }

  /**
   * Пересобирает строки роста под выбранный набор размеров: уже введённый рост
   * остаётся у своего размера, новому размеру заводится пустая строка.
   *
   * @param value выбранные ключи размеров из мультиселекта.
   */
  function handleTypesUpdate(value: string | Array<string> | undefined): void {
    let types: Array<string> = [];

    if (Array.isArray(value)) {
      types = value;
    } else if (value) {
      types = [value];
    }

    const existing = new Map(
      sizes.value
        .filter((size) => isString(size.type))
        .map((size) => [size.type, size]),
    );

    sizes.value = types.map(
      (type) =>
        existing.get(type) ?? {
          type,
          from: undefined,
          to: undefined,
        },
    );
  }
</script>

<template>
  <UFormField
    :label="SPECIES_SIZES_EDITOR.title"
    :help="SPECIES_SIZES_EDITOR.hint"
    name="properties.sizes"
  >
    <SelectSize
      multiple
      :model-value="selectedTypes"
      @update:model-value="handleTypesUpdate"
    />
  </UFormField>

  <div
    v-if="sizes.length"
    class="flex flex-col gap-2 md:col-span-2"
  >
    <span class="text-xs text-dimmed">
      {{ SPECIES_SIZES_EDITOR.heightsTitle }}
    </span>

    <div
      v-for="(size, index) in sizes"
      :key="size.type ?? index"
      class="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(6rem,1fr)_2fr_2fr]"
    >
      <span class="text-sm text-highlighted md:pb-2">
        {{ getSizeLabel(size.type) }}
      </span>

      <UFormField :label="SPECIES_SIZES_EDITOR.heightFrom">
        <UFieldGroup>
          <UInputNumber
            v-model="size.from"
            :min="0"
          />

          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ SPECIES_SIZES_EDITOR.feet }}
          </UBadge>
        </UFieldGroup>
      </UFormField>

      <UFormField :label="SPECIES_SIZES_EDITOR.heightTo">
        <UFieldGroup>
          <UInputNumber
            v-model="size.to"
            :min="0"
          />

          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ SPECIES_SIZES_EDITOR.feet }}
          </UBadge>
        </UFieldGroup>
      </UFormField>
    </div>

    <p class="text-xs text-dimmed">
      {{ SPECIES_SIZES_EDITOR.heightsHint }}
    </p>
  </div>
</template>
