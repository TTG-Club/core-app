<script setup lang="ts">
  import type { FeatureOptionEntry } from '../model';

  import { getNodeText, MarkupRender } from '~ui/markup';

  import { FEATURE_OPTIONS_LABELS } from './constants';

  /** Карточка варианта: вид кнопки выбора зависит от состояния варианта. */
  interface OptionCard extends FeatureOptionEntry {
    searchText: string;
    levelLabel: string;
    isSelected: boolean;
    isDisabled: boolean;
    buttonLabel: string;
    buttonIcon: string;
    buttonColor: 'primary' | 'neutral';
    buttonVariant: 'solid' | 'subtle';
    cardClass: string;
  }

  const {
    options,
    title,
    summary = '',
    selectable = false,
    selectedNames = [],
    disabledNames = [],
  } = defineProps<{
    options: FeatureOptionEntry[];

    title: string;

    /** Строка о выбранном в шапке («Выбрано 1 из 2»); пусто — её нет. */
    summary?: string;

    /** Выбирать вариант можно прямо в дровере, а не только читать описания. */
    selectable?: boolean;

    /** Названия уже выбранных вариантов. */
    selectedNames?: string[];

    /** Названия вариантов, которые выбрать нельзя (набран предел выбора). */
    disabledNames?: string[];
  }>();

  const emit = defineEmits<{
    toggle: [name: string];
  }>();

  const opened = defineModel<boolean>({ required: true });

  const searchQuery = ref('');

  /**
   * Нормализует строку для поиска без учета регистра.
   *
   * @param value исходная строка.
   * @returns строка в нижнем регистре без крайних пробелов.
   */
  function normalizeSearchText(value: string): string {
    return value.trim().toLocaleLowerCase();
  }

  const cards = computed<OptionCard[]>(() =>
    options.map((option) => {
      const isSelected = selectedNames.includes(option.name);
      const isDisabled = !isSelected && disabledNames.includes(option.name);

      return {
        ...option,
        searchText: normalizeSearchText(
          [
            option.name,
            option.nameEng,
            getNodeText(option.additional),
            getNodeText(option.prerequisite),
            getNodeText(option.description),
          ].join(' '),
        ),
        levelLabel: option.requiredClassLevel
          ? `${option.requiredClassLevel}${FEATURE_OPTIONS_LABELS.levelSuffix}`
          : '',
        isSelected,
        isDisabled,
        buttonLabel: isSelected
          ? FEATURE_OPTIONS_LABELS.selected
          : FEATURE_OPTIONS_LABELS.select,
        buttonIcon: isSelected ? 'tabler:check' : 'tabler:plus',
        buttonColor: isSelected ? 'primary' : 'neutral',
        buttonVariant: isSelected ? 'solid' : 'subtle',
        // Выбранный вариант виден в длинном списке описаний только по рамке:
        // кнопка выбора уезжает за край экрана вместе с прокруткой
        cardClass: isSelected
          ? 'rounded-lg border border-primary bg-primary/5 p-4'
          : 'rounded-lg border border-default bg-muted p-4',
      };
    }),
  );

  const filteredCards = computed(() => {
    const normalizedSearchQuery = normalizeSearchText(searchQuery.value);

    if (!normalizedSearchQuery) {
      return cards.value;
    }

    return cards.value.filter((card) =>
      card.searchText.includes(normalizedSearchQuery),
    );
  });

  const shownLabel = computed(
    () =>
      `${FEATURE_OPTIONS_LABELS.shown} ${filteredCards.value.length} / ${cards.value.length}`,
  );

  const description = computed(() =>
    [summary, shownLabel.value].filter(Boolean).join(' · '),
  );

  /**
   * Очищает поисковую строку.
   */
  function clearSearchQuery() {
    searchQuery.value = '';
  }

  /**
   * Переключает выбор варианта; недоступный вариант выбор не меняет.
   *
   * @param card карточка варианта.
   */
  function handleToggle(card: OptionCard) {
    if (card.isDisabled) {
      return;
    }

    emit('toggle', card.name);
  }
</script>

<template>
  <USlideover
    v-model:open="opened"
    :title
    :description
    :ui="{
      content: 'w-full max-w-192 min-w-80',
      body: 'flex flex-col gap-4 p-4 sm:p-6',
    }"
  >
    <template #body>
      <UInput
        v-model="searchQuery"
        :placeholder="FEATURE_OPTIONS_LABELS.search"
        icon="tabler:search"
        :ui="{ trailing: 'pe-0.5' }"
      >
        <template
          v-if="searchQuery"
          #trailing
        >
          <UButton
            icon="tabler:x"
            variant="link"
            color="neutral"
            size="sm"
            :aria-label="FEATURE_OPTIONS_LABELS.clearSearch"
            @click.left.exact.prevent="clearSearchQuery"
          />
        </template>
      </UInput>

      <div
        v-if="filteredCards.length"
        class="flex flex-col gap-3"
      >
        <article
          v-for="card in filteredCards"
          :key="card.key"
          :class="card.cardClass"
        >
          <header class="mb-3 flex flex-wrap items-start gap-2">
            <div class="min-w-0 flex-1">
              <h5 class="text-base font-semibold text-highlighted">
                {{ card.name }}
              </h5>

              <p
                v-if="card.nameEng"
                class="text-sm text-muted"
              >
                {{ card.nameEng }}
              </p>
            </div>

            <!-- Пометка повторяемости объясняет, почему вариант остался в
              списке после того, как его взяли на прошлом уровне -->
            <UBadge
              v-if="card.repeatable"
              color="info"
              variant="subtle"
              size="sm"
            >
              {{ FEATURE_OPTIONS_LABELS.repeatable }}
            </UBadge>

            <UBadge
              v-if="card.levelLabel"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ card.levelLabel }}
            </UBadge>

            <UButton
              v-if="selectable"
              size="sm"
              :label="card.buttonLabel"
              :icon="card.buttonIcon"
              :color="card.buttonColor"
              :variant="card.buttonVariant"
              :disabled="card.isDisabled"
              @click.left.exact.prevent="handleToggle(card)"
            />
          </header>

          <div
            v-if="card.prerequisite"
            class="mb-3 border-l-2 border-default pl-3 text-sm text-muted"
            :class="$style.prerequisite"
          >
            <MarkupRender :render-node="card.prerequisite" />
          </div>

          <div
            v-if="card.additional"
            class="mb-3 text-sm text-muted italic"
          >
            <MarkupRender :render-node="card.additional" />
          </div>

          <MarkupRender :render-node="card.description" />
        </article>
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-default bg-muted p-6 text-center text-sm text-muted"
      >
        {{ FEATURE_OPTIONS_LABELS.empty }}
      </div>
    </template>
  </USlideover>
</template>

<style module lang="scss">
  .prerequisite {
    :deep(p) {
      display: inline;
      margin-bottom: 0;
    }
  }
</style>
