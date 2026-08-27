<script setup lang="ts">
  import { z } from '~/utils/zod';

  import {
    getSpellSelectLevelLabel,
    SPELL_SELECT_CONFIG,
  } from './spell-constants';

  interface SpellSelectItem {
    label: string;
    value: string;
    description: string;
    level: number;
  }

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;
      excludeUrls?: string[];
    }>(),
    {
      disabled: false,
      multiple: false,
      excludeUrls: () => [],
    },
  );

  const model = defineModel<string | Array<string>>({ default: '' });

  /**
   * Выбранное заклинание при одиночном выборе. При множественном дозагружать
   * нечего: там поле работает добавлением и своё значение не хранит.
   */
  const selectedSpellUrl = computed<string>(() =>
    typeof model.value === 'string' ? model.value : '',
  );

  const spellSchema = z.object({
    url: z.string(),
    name: z.object({
      rus: z.string().catch(''),
      eng: z.string().catch(''),
    }),
    level: z.coerce.number().catch(0),
    school: z.string().catch(''),
  });

  const spellSearchSchema = z
    .union([z.array(spellSchema), z.object({ value: z.array(spellSchema) })])
    .catch([]);

  const searchTerm = ref('');

  const debouncedSearchTerm = refDebounced(
    searchTerm,
    SPELL_SELECT_CONFIG.searchDebounceMilliseconds,
  );

  const searchSpellItems = ref<SpellSelectItem[]>([]);
  const selectedSpellItem = ref<SpellSelectItem | null>(null);
  const isLoading = ref(false);

  let requestGeneration = 0;

  /** Преобразует проверенный ответ API в опцию выбора заклинания. */
  function toSpellSelectItem(
    spell: z.infer<typeof spellSchema>,
  ): SpellSelectItem {
    return {
      label: spell.name.rus,
      value: spell.url,
      description: spell.name.eng || spell.school,
      level: spell.level,
    };
  }

  const spellItems = computed(() => {
    const excludedUrls = new Set(props.excludeUrls);

    const visibleSpellItems = searchSpellItems.value.filter(
      (spell) =>
        !excludedUrls.has(spell.value)
        || spell.value === selectedSpellUrl.value,
    );

    if (
      selectedSpellItem.value
      && !visibleSpellItems.some(
        (spell) => spell.value === selectedSpellItem.value?.value,
      )
    ) {
      return [selectedSpellItem.value, ...visibleSpellItems];
    }

    return visibleSpellItems;
  });

  /** Загружает первую страницу заклинаний для текущей поисковой строки. */
  async function loadSearchItems(): Promise<void> {
    const generation = ++requestGeneration;

    isLoading.value = true;

    try {
      const response = await $fetch<unknown>(SPELL_SELECT_CONFIG.searchPath, {
        method: 'GET',
        query: {
          search: debouncedSearchTerm.value.trim() || undefined,
          page: SPELL_SELECT_CONFIG.page,
          size: SPELL_SELECT_CONFIG.pageSize,
          sorting: SPELL_SELECT_CONFIG.sorting,
        },
        retry: SPELL_SELECT_CONFIG.retryCount,
      });

      const parsed = spellSearchSchema.parse(response);
      const spells = Array.isArray(parsed) ? parsed : parsed.value;

      if (generation === requestGeneration) {
        searchSpellItems.value = spells.map(toSpellSelectItem);
      }
    } catch {
      if (generation === requestGeneration) {
        searchSpellItems.value = [];
      }
    } finally {
      if (generation === requestGeneration) {
        isLoading.value = false;
      }
    }
  }

  /** Дозагружает выбранное заклинание, если его нет на текущей странице поиска. */
  async function loadSelectedItem(spellUrl: string): Promise<void> {
    if (!spellUrl) {
      selectedSpellItem.value = null;

      return;
    }

    const existingSpellItem = searchSpellItems.value.find(
      (spell) => spell.value === spellUrl,
    );

    if (existingSpellItem) {
      selectedSpellItem.value = existingSpellItem;

      return;
    }

    try {
      const response = await $fetch<unknown>(
        `${SPELL_SELECT_CONFIG.detailBasePath}/${spellUrl}`,
        {
          method: 'GET',
          retry: SPELL_SELECT_CONFIG.retryCount,
        },
      );

      const parsed = spellSchema.safeParse(response);

      selectedSpellItem.value = parsed.success
        ? toSpellSelectItem(parsed.data)
        : null;
    } catch {
      selectedSpellItem.value = null;
    }
  }

  /** Нормализует очистку Nuxt UI в пустое значение вместо `null`. */
  function handleModelValueUpdate(
    value: string | Array<string> | null | undefined,
  ): void {
    model.value = value ?? (props.multiple ? [] : '');
  }

  watch(debouncedSearchTerm, () => void loadSearchItems(), { immediate: true });

  watch(selectedSpellUrl, (spellUrl) => void loadSelectedItem(spellUrl), {
    immediate: true,
  });
</script>

<template>
  <USelectMenu
    v-model:search-term="searchTerm"
    :model-value="model"
    :items="spellItems"
    :loading="isLoading"
    :multiple
    :disabled
    :placeholder="SPELL_SELECT_CONFIG.placeholder"
    label-key="label"
    value-key="value"
    ignore-filter
    searchable
    clearable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:model-value="handleModelValueUpdate"
  >
    <template #item-trailing="{ item: spellItem }">
      <UBadge
        color="neutral"
        variant="subtle"
      >
        {{ getSpellSelectLevelLabel(spellItem.level) }}
      </UBadge>
    </template>
  </USelectMenu>
</template>
