<script setup lang="ts">
  import type { FilterGroups } from '~infrastructure/filter';

  import { FilterDrawer } from '~infrastructure/filter';

  import { useSourceDictionary } from '../../composables';
  import {
    GAME_FIELD_SOURCES_LABEL,
    GAME_SOURCES_EMPTY_LABEL,
    GAME_SOURCES_PICK_LABEL,
    GAME_SOURCES_TITLE,
  } from '../../model';

  /**
   * Допустимые книги игры. Набор тот же, что в фильтрах остальных разделов
   * сайта, и панель выбора та же самая: мастеру не нужно заново привыкать к
   * другому способу отмечать источники.
   */
  const selected = defineModel<Array<string>>({ required: true });

  const { isLoading, sourceGroups } = useSourceDictionary();

  const isOpen = ref(false);

  const groups = computed<FilterGroups>(() =>
    sourceGroups.value.map((group) => ({
      key: group.key,
      name: group.name,
      type: 'filter' as const,
      values: group.sources.map((source) => ({
        id: source,
        value: source,
        name: source,
        selected: selected.value.includes(source) ? true : null,
      })),
    })),
  );

  /** Открывает панель выбора источников. */
  function open(): void {
    isOpen.value = true;
  }

  /**
   * Сохраняет отмеченные книги. Порядок — как в справочнике, а не как их
   * отмечали: так список под кнопкой не перетасовывается при каждой правке.
   * @param saved Группы с отметками из панели.
   */
  function save(saved: FilterGroups): void {
    selected.value = saved.flatMap((group) =>
      (group.values ?? [])
        .filter((item) => item.selected)
        .map((item) => String(item.id)),
    );

    isOpen.value = false;
  }

  /** Снимает все отметки. */
  function reset(): void {
    selected.value = [];
  }

  /**
   * Убирает одну книгу из выбранных — по крестику на её значке.
   * @param source Название книги.
   */
  function remove(source: string): void {
    selected.value = selected.value.filter((item) => item !== source);
  }
</script>

<template>
  <UFormField :label="GAME_FIELD_SOURCES_LABEL">
    <div class="flex flex-col items-start gap-2">
      <UButton
        color="neutral"
        variant="subtle"
        icon="tabler:books"
        :loading="isLoading"
        :label="GAME_SOURCES_PICK_LABEL"
        @click.left.exact.prevent="open"
      >
        <template
          v-if="selected.length"
          #trailing
        >
          <UBadge
            color="primary"
            variant="solid"
            size="sm"
            :label="String(selected.length)"
          />
        </template>
      </UButton>

      <span
        v-if="!selected.length"
        class="text-sm text-muted"
      >
        {{ GAME_SOURCES_EMPTY_LABEL }}
      </span>

      <div
        v-else
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="source in selected"
          :key="source"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ source }}

          <UButton
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="-mr-1"
            :aria-label="source"
            @click.left.exact.stop.prevent="remove(source)"
          />
        </UBadge>
      </div>

      <FilterDrawer
        v-model="isOpen"
        :groups="groups"
        :title="GAME_SOURCES_TITLE"
        @save="save"
        @reset="reset"
      />
    </div>
  </UFormField>
</template>
