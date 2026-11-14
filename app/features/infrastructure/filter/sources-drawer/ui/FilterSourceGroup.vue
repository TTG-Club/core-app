<script setup lang="ts">
  import type { FilterGroup, FilterItem, SourceEntry } from '../../types';

  import {
    FILTER_SELECT_ALL_LABEL,
    FILTER_SOURCES_GROUP_TOGGLE_ICON,
    FILTER_SOURCES_SUMMARY_SEPARATOR,
  } from '../../model';
  import { getGroupItems, setSourcesSelected } from '../../utils';
  import FilterSourceCover from './FilterSourceCover.vue';

  /**
   * Группа источников в панели выбора: сворачиваемая шапка со счётчиком и
   * «Выбрать все», под ней источники строками — русское название, английское
   * и акроним. Строки без рамок: список читают глазами сверху вниз, и рамка
   * вокруг каждой книги только мешала бы.
   */
  const {
    entries,
    defaultOpen = true,
    expanded = false,
  } = defineProps<{
    /** Показанные источники группы: под поиском их меньше, чем в группе. */
    entries: Array<SourceEntry>;

    /** Раскрыта ли группа при появлении; дальше ею управляет пользователь. */
    defaultOpen?: boolean;

    /** Держит группу раскрытой — пока идёт поиск, найденное должно быть видно. */
    expanded?: boolean;
  }>();

  const group = defineModel<FilterGroup>({
    required: true,
  });

  const isOpenedByUser = ref(defaultOpen);

  const isOpened = computed(() => expanded || isOpenedByUser.value);

  const chevronClass = computed(() =>
    isOpened.value ? 'rotate-90' : undefined,
  );

  /** Сворачивает или раскрывает группу. */
  function toggleOpened(): void {
    isOpenedByUser.value = !isOpened.value;
  }

  /**
   * Счётчик шапки. Считается вся группа, а не показанное: он говорит о том,
   * что влияет на выдачу, и под поиском врать не должен.
   */
  const counter = computed(() => {
    const items = getGroupItems(group.value);
    const selected = items.filter((filterItem) => filterItem.selected).length;

    return `${selected} ${FILTER_SOURCES_SUMMARY_SEPARATOR} ${items.length}`;
  });

  const visibleSelectedCount = computed(
    () => entries.filter((entry) => entry.selected).length,
  );

  const counterColor = computed(() =>
    getGroupItems(group.value).some((filterItem) => filterItem.selected)
      ? 'primary'
      : 'neutral',
  );

  /** Состояние «Выбрать все»: часть отмеченных даёт третье. */
  const selectAllState = computed<boolean | 'indeterminate'>(() => {
    if (visibleSelectedCount.value === 0) {
      return false;
    }

    return visibleSelectedCount.value === entries.length
      ? true
      : 'indeterminate';
  });

  /**
   * Отмечает или снимает разом все показанные источники группы — именно
   * показанные: под поиском переключатель работает по тому, что видно.
   */
  function handleSelectAll(state: boolean | 'indeterminate'): void {
    group.value = setSourcesSelected(
      group.value,
      new Set(entries.map((entry) => entry.item.id)),
      state === true,
    );
  }

  /** Отмечает или снимает один источник. */
  function handleSelect(
    itemId: FilterItem['id'],
    state: boolean | 'indeterminate',
  ): void {
    group.value = setSourcesSelected(
      group.value,
      new Set([itemId]),
      state === true,
    );
  }

  /**
   * Цвет акронима в строке: у отмеченного источника он подсвечен — вместе с
   * рамкой обложки и яркостью названия это и есть отметка выбора.
   *
   * @param entry строка источника
   */
  function getAcronymColor(entry: SourceEntry): 'primary' | 'neutral' {
    return entry.selected ? 'primary' : 'neutral';
  }
</script>

<template>
  <section class="flex flex-col gap-1">
    <div class="flex items-center gap-3">
      <UButton
        color="neutral"
        variant="link"
        :icon="FILTER_SOURCES_GROUP_TOGGLE_ICON"
        class="min-w-0 grow px-0 text-default hover:text-highlighted"
        :ui="{
          leadingIcon: ['transition-transform duration-200', chevronClass],
        }"
        :aria-expanded="isOpened"
        @click.left.exact.prevent="toggleOpened"
      >
        <span class="min-w-0 truncate text-left font-semibold">
          {{ group.name }}
        </span>

        <UBadge
          :label="counter"
          :color="counterColor"
          variant="subtle"
          size="sm"
          class="shrink-0"
        />

        <span class="min-w-3 grow border-t border-default" />
      </UButton>

      <UCheckbox
        :model-value="selectAllState"
        :label="FILTER_SELECT_ALL_LABEL"
        size="md"
        class="shrink-0"
        @update:model-value="handleSelectAll"
      />
    </div>

    <div
      v-if="isOpened"
      class="flex flex-col gap-0.5"
    >
      <!-- Строка — та же галочка, только без квадратика: с обложкой он -->
      <!-- лишний. Выбор показывают рамка обложки и яркость названия, а -->
      <!-- сама галочка скрыта от глаз, но остаётся для клавиатуры и -->
      <!-- скринридеров. Вариант card делает подписью всю строку целиком. -->
      <UCheckbox
        v-for="entry in entries"
        :key="`${entry.item.id}-${entry.item.name}`"
        :model-value="entry.selected"
        variant="card"
        indicator="hidden"
        size="md"
        :ui="{
          root: 'group items-start rounded-md border-0 px-2 py-1.5 hover:bg-accented/50 has-focus-visible:ring has-focus-visible:ring-accented has-data-[state=checked]:bg-transparent has-data-[state=checked]:hover:bg-accented/50',
          wrapper: 'block min-w-0 grow text-left',
          label: 'block',
        }"
        @update:model-value="handleSelect(entry.item.id, $event)"
      >
        <template #label>
          <span class="flex items-start gap-3">
            <FilterSourceCover
              :image="entry.image"
              :selected="entry.selected"
            />

            <span class="flex min-w-0 grow flex-col">
              <span
                class="min-w-0 wrap-break-word text-muted group-has-data-[state=checked]:text-highlighted"
              >
                {{ entry.item.name }}
              </span>

              <span
                v-if="entry.english"
                class="min-w-0 text-sm font-normal wrap-break-word text-dimmed group-has-data-[state=checked]:text-muted"
              >
                {{ entry.english }}
              </span>
            </span>

            <UBadge
              v-if="entry.acronym"
              :label="entry.acronym"
              :color="getAcronymColor(entry)"
              variant="subtle"
              size="sm"
              class="min-w-14 shrink-0 justify-center font-mono"
            />
          </span>
        </template>
      </UCheckbox>
    </div>
  </section>
</template>
