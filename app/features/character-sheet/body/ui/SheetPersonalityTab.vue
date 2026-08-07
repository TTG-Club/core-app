<script setup lang="ts">
  import type { PersonalityFieldKey } from '../../model';

  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_ORDER,
    CUSTOM_BACKGROUND_URL_PREFIX,
    getPersonalityRows,
    parseStoredMarkupNodes,
    SHEET_EMPTY_LABELS,
    SHEET_PERSONALITY_LABELS,
    SHEET_TITLE_ACTION_CLASS,
    SHEET_TITLE_ACTION_REVEAL_CLASS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const emit = defineEmits<{
    /** Правка примет; поле — то, с которого начали, у него и будет курсор. */
    'edit-appearance': [field: PersonalityFieldKey | null];
    'edit-description': [];
    'edit-background': [];
  }>();

  // Правки открываются модалками из тела листа: без прав карандаши прячутся,
  // а сами плитки остаются на местах — читать личность можно и с чужого листа.
  const { character, editControlClass } = useCharacterSheet();

  const overlay = useOverlay();

  // Дровер описания предыстории; без destroyOnClose — повторный open() после
  // закрытия иначе падает («Overlay not found»).
  const backgroundPreviewDrawer = overlay.create(BackgroundDrawer, {
    props: {
      url: '',
      onClose: () => backgroundPreviewDrawer.close(),
    },
  });

  const personality = computed(() => character.value.personality);

  /**
   * Плитки примет: заполненное значение читается как основное, прочерк —
   * приглушённым, иначе ряд пустых полей забивает собой всю вкладку.
   */
  const appearanceTiles = computed(() =>
    getPersonalityRows(personality.value).map((row) => ({
      ...row,
      valueClass: row.filled ? 'text-highlighted' : 'text-dimmed',
    })),
  );

  const descriptionNodes = computed(() =>
    parseStoredMarkupNodes(personality.value.description),
  );

  const hasDescription = computed(() => descriptionNodes.value.length > 0);

  // Предыстория на вкладке не хранится и не правится своим полем: она берётся
  // с листа и меняется тем же мастером, что и в шапке.
  const background = computed(() => character.value.characterBackground);

  /** Своя предыстория: страницы в справочнике у неё нет — открывать нечего. */
  const hasBackgroundPreview = computed(
    () =>
      Boolean(background.value)
      && !background.value?.url.startsWith(CUSTOM_BACKGROUND_URL_PREFIX),
  );

  const backgroundHint = computed(() =>
    hasBackgroundPreview.value
      ? SHEET_PERSONALITY_LABELS.backgroundHint
      : SHEET_PERSONALITY_LABELS.backgroundCustomHint,
  );

  /** Прибавки характеристик от предыстории — чипами рядом с её названием. */
  const backgroundBonusChips = computed(() => {
    const bonuses = background.value?.abilityBonuses ?? {};

    return ABILITY_ORDER.filter((ability) => (bonuses[ability] ?? 0) > 0).map(
      (ability) => ({
        ability,
        label: `${ABILITY_LABELS[ability]} +${bonuses[ability]}`,
      }),
    );
  });

  /** Правка примет с плитки: курсор встаёт в то поле, по которому нажали. */
  function handleFieldEdit(field: PersonalityFieldKey) {
    emit('edit-appearance', field);
  }

  /** Правка примет карандашом на рамке — без выделенного поля. */
  function handleAppearanceEdit() {
    emit('edit-appearance', null);
  }

  function handleDescriptionEdit() {
    emit('edit-description');
  }

  function handleBackgroundEdit() {
    emit('edit-background');
  }

  function handleBackgroundPreview() {
    if (!background.value) {
      return;
    }

    backgroundPreviewDrawer.open({ url: background.value.url });
  }
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <SheetPanel :title="SHEET_PERSONALITY_LABELS.appearanceTitle">
      <template #title-actions>
        <button
          type="button"
          :class="[
            SHEET_TITLE_ACTION_CLASS,
            SHEET_TITLE_ACTION_REVEAL_CLASS,
            editControlClass,
          ]"
          :aria-label="SHEET_PERSONALITY_LABELS.editAppearance"
          @click.left.exact.prevent="handleAppearanceEdit"
        >
          <UIcon
            name="tabler:pencil"
            class="size-3.5"
          />
        </button>
      </template>

      <!-- Ряд плиток считает колонки по своей ширине, а не по ширине листа: в
        широкой раскладке вкладки занимают лишь половину сетки, и порог по листу
        разложил бы четыре плитки в колонку вдвое уже. Подписи полные —
        сокращать «Мировоззрение» нечем, поэтому пороги взяты с запасом под
        самую длинную из них -->
      <div class="@container pt-1">
        <div class="grid grid-cols-2 gap-2 @md:grid-cols-3 @xl:grid-cols-4">
          <button
            v-for="tile in appearanceTiles"
            :key="tile.key"
            type="button"
            class="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2 text-left transition-colors hover:border-primary/60 hover:bg-elevated/40"
            :aria-label="`Изменить: ${tile.label}`"
            @click.left.exact.prevent="handleFieldEdit(tile.key)"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ tile.label }}
            </span>

            <!-- Значение переносится, а не обрезается: мировоззрения и приметы
              вроде «Серо-зелёные» на узкой плитке иначе читались бы огрызком -->
            <span
              class="text-sm font-medium wrap-break-word"
              :class="tile.valueClass"
            >
              {{ tile.value }}
            </span>
          </button>
        </div>
      </div>
    </SheetPanel>

    <SheetPanel :title="SHEET_PERSONALITY_LABELS.backgroundTitle">
      <template #title-actions>
        <button
          type="button"
          :class="[
            SHEET_TITLE_ACTION_CLASS,
            SHEET_TITLE_ACTION_REVEAL_CLASS,
            editControlClass,
          ]"
          :aria-label="SHEET_PERSONALITY_LABELS.backgroundChange"
          @click.left.exact.prevent="handleBackgroundEdit"
        >
          <UIcon
            name="tabler:pencil"
            class="size-3.5"
          />
        </button>
      </template>

      <div
        v-if="background"
        class="flex flex-col gap-2 pt-1"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UIcon
            name="tabler:book"
            class="size-4 shrink-0 text-primary"
          />

          <span class="text-sm font-medium text-highlighted">
            {{ background.name }}
          </span>

          <UTooltip
            v-if="hasBackgroundPreview"
            :text="SHEET_PERSONALITY_LABELS.backgroundPreview"
          >
            <UButton
              icon="tabler:layout-sidebar-right-expand"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              :aria-label="`${SHEET_PERSONALITY_LABELS.backgroundPreview}: ${background.name}`"
              @click.left.exact.prevent="handleBackgroundPreview"
            />
          </UTooltip>
        </div>

        <div
          v-if="backgroundBonusChips.length"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="chip in backgroundBonusChips"
            :key="chip.ability"
            class="rounded border border-default bg-default/40 px-2.5 py-1 text-[11px] text-toned"
          >
            {{ chip.label }}
          </span>
        </div>

        <span class="text-xs text-dimmed italic">{{ backgroundHint }}</span>
      </div>

      <!-- Предыстории нет — вкладка сама предлагает её выбрать: это тот же
        мастер, что и в шапке листа -->
      <div
        v-else
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default px-3 py-6"
      >
        <span class="text-sm text-dimmed">
          {{ SHEET_EMPTY_LABELS.background }}
        </span>

        <UButton
          icon="tabler:plus"
          :label="SHEET_PERSONALITY_LABELS.backgroundSelect"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
          @click.left.exact.prevent="handleBackgroundEdit"
        />
      </div>
    </SheetPanel>

    <SheetPanel :title="SHEET_PERSONALITY_LABELS.descriptionTitle">
      <template #title-actions>
        <button
          type="button"
          :class="[
            SHEET_TITLE_ACTION_CLASS,
            SHEET_TITLE_ACTION_REVEAL_CLASS,
            editControlClass,
          ]"
          :aria-label="SHEET_PERSONALITY_LABELS.editDescription"
          @click.left.exact.prevent="handleDescriptionEdit"
        >
          <UIcon
            name="tabler:pencil"
            class="size-3.5"
          />
        </button>
      </template>

      <MarkupRender
        v-if="hasDescription"
        :render-node="descriptionNodes"
        class="pt-1 text-sm"
      />

      <div
        v-else
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default px-3 py-6 text-center"
      >
        <span class="text-sm text-dimmed">
          {{ SHEET_PERSONALITY_LABELS.descriptionEmpty }}
        </span>

        <UButton
          icon="tabler:plus"
          :label="SHEET_PERSONALITY_LABELS.addDescription"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
          @click.left.exact.prevent="handleDescriptionEdit"
        />
      </div>
    </SheetPanel>
  </div>
</template>
