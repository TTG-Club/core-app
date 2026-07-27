<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { Character, SavedCharacterSheet } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCharacterSheetPdf } from '../../composables';
  import { CharacterSheetDrawer } from '../../drawer';
  import {
    CHARACTER_SHEET_SHARED_ROUTE,
    downloadCharacterJson,
    getClassDisplayName,
    getDisplayLevel,
    getSavedSheetActionMenuItems,
    getSpeciesDisplayName,
    SAVED_SHEETS_LABELS,
    SHARED_DETAIL_QUERY_PREFIX,
    SHEET_EMPTY_LABELS,
  } from '../../model';

  const {
    sheet,
    disabled = false,
    canCopy = false,
  } = defineProps<{
    /** Сохранённая запись: документ есть только у доступных листов. */
    sheet: SavedCharacterSheet;

    /** Заблокировать действия на время мутаций раздела. */
    disabled?: boolean;

    /** В лимите своих активных листов есть место — копия разрешена. */
    canCopy?: boolean;
  }>();

  const emit = defineEmits<{
    copy: [character: Character];
    remove: [id: string];
  }>();

  const overlay = useOverlay();

  const isRemoveOpen = ref(false);

  const to = computed(
    () => `${CHARACTER_SHEET_SHARED_ROUTE}/${sheet.shareToken}`,
  );

  const drawer = overlay.create(CharacterSheetDrawer, {
    props: {
      shareToken: sheet.shareToken,
      onClose: () => drawer.close(),
    },
  });

  // Тот же контракт, что у карточки своего листа: drawer в стандартном режиме,
  // `?detail=` в широком. Значение с префиксом — чтобы панель узнала чужой лист.
  const { isOpened, handleOpen } = useSectionLink(
    `${SHARED_DETAIL_QUERY_PREFIX}${sheet.shareToken}`,
    drawer.id,
    () => drawer.open(),
  );

  const classLabel = computed(() =>
    sheet.data?.characterClass
      ? getClassDisplayName(sheet.data.characterClass)
      : SHEET_EMPTY_LABELS.className,
  );

  const speciesLabel = computed(() =>
    sheet.data?.species
      ? getSpeciesDisplayName(sheet.data.species)
      : SHEET_EMPTY_LABELS.species,
  );

  const cardClass = computed(() =>
    isOpened.value
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-elevated hover:border-accented hover:bg-accented',
  );

  const levelValue = computed(() =>
    sheet.data ? getDisplayLevel(sheet.data) : null,
  );

  const { isExporting, exportToPdf } = useCharacterSheetPdf();

  /** Экспорт в JSON — читает документ карточки, запросов не делает. */
  function handleDownload(): void {
    if (sheet.data) {
      downloadCharacterJson(sheet.data);
    }
  }

  /** Экспорт в PDF — собирается из того же документа карточки. */
  function handleDownloadPdf(): void {
    if (sheet.data) {
      void exportToPdf(sheet.data);
    }
  }

  /** Запрос на копию — создаёт её раздел (у него лимит своих листов). */
  function handleCopy(): void {
    if (sheet.data) {
      emit('copy', sheet.data);
    }
  }

  /** Запрос на удаление записи — подтверждение показывает диалог. */
  function handleRemove(): void {
    isRemoveOpen.value = true;
  }

  /** Подтверждённое удаление записи — событие обрабатывает раздел. */
  function confirmRemove(): void {
    emit('remove', sheet.id);
    isRemoveOpen.value = false;
  }

  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() =>
    getSavedSheetActionMenuItems({
      canCopy,
      isPdfLoading: isExporting.value,
      onDownload: handleDownload,
      onDownloadPdf: handleDownloadPdf,
      onCopy: handleCopy,
      onRemove: handleRemove,
    }),
  );
</script>

<template>
  <!-- Недоступная запись: открывать нечего, остаётся объяснить и убрать -->
  <div
    v-if="!sheet.available"
    class="flex min-h-20 w-full items-center gap-3 rounded-xl border border-dashed border-default bg-elevated/40 p-3"
  >
    <div
      class="grid size-14 shrink-0 place-items-center rounded-lg bg-muted/10"
    >
      <UIcon
        name="tabler:link-off"
        class="size-7 text-muted"
      />
    </div>

    <div class="flex min-w-0 flex-auto flex-col gap-0.5">
      <span class="truncate text-base font-semibold text-muted">
        {{ sheet.name }}
      </span>

      <span class="truncate text-sm text-muted">
        {{ SAVED_SHEETS_LABELS.unavailable }}
      </span>

      <span class="text-xs text-muted">
        {{ SAVED_SHEETS_LABELS.unavailableHint }}
      </span>
    </div>

    <UButton
      icon="tabler:trash"
      color="neutral"
      variant="soft"
      size="sm"
      class="shrink-0"
      :disabled
      @click.left.exact.prevent="handleRemove"
    >
      {{ SAVED_SHEETS_LABELS.remove }}
    </UButton>
  </div>

  <div
    v-else
    class="flex min-h-20 w-full items-center gap-3 rounded-xl border p-3 transition-all"
    :class="cardClass"
  >
    <!-- Клик ведёт на отдельную страницу — как у карточки своего листа -->
    <NuxtLink
      :to
      class="flex min-w-0 flex-auto items-center gap-4"
    >
      <div
        class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/5 ring-1 ring-primary/15"
      >
        <img
          v-if="sheet.data?.avatarUrl"
          :src="sheet.data.avatarUrl"
          :alt="sheet.name"
          class="size-full object-cover"
        />

        <UIcon
          v-else
          name="tabler:user"
          class="size-7 text-primary"
        />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-0.5">
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate text-base font-semibold text-highlighted">
            {{ sheet.name }}
          </span>

          <UBadge
            :label="SAVED_SHEETS_LABELS.readonlyBadge"
            icon="tabler:eye"
            color="neutral"
            variant="subtle"
            size="sm"
            class="shrink-0"
          />
        </span>

        <span
          v-if="sheet.data"
          class="truncate text-sm text-secondary"
        >
          {{ classLabel }} · {{ speciesLabel }}
        </span>

        <span
          v-if="sheet.data"
          class="mt-0.5 flex items-center gap-1 text-xs text-muted"
          title="Хиты: сейчас / всего"
        >
          <UIcon
            name="tabler:heart"
            class="size-3.5 shrink-0 text-error"
          />

          <span class="truncate">
            Хиты: {{ sheet.data.health.current }} /
            {{ sheet.data.health.max }} · Уровень: {{ levelValue }}
          </span>
        </span>
      </div>
    </NuxtLink>

    <!-- Кнопки столбиком — как у карточки своего листа -->
    <div class="flex shrink-0 flex-col gap-1">
      <UTooltip :text="SAVED_SHEETS_LABELS.open">
        <UButton
          icon="tabler:layout-sidebar-right-expand"
          color="neutral"
          variant="soft"
          square
          :aria-label="SAVED_SHEETS_LABELS.open"
          @click.left.exact.prevent="handleOpen"
        />
      </UTooltip>

      <UDropdownMenu :items="menuItems">
        <UButton
          icon="tabler:dots-vertical"
          color="neutral"
          variant="soft"
          square
          :disabled
          aria-label="Действия с сохранённым листом"
        />
      </UDropdownMenu>
    </div>
  </div>

  <!-- Диалог один на обе разметки: убрать можно и доступную запись, и потухшую -->
  <ConfirmDialog
    v-model:open="isRemoveOpen"
    :title="SAVED_SHEETS_LABELS.removeTitle"
    :description="SAVED_SHEETS_LABELS.removeDescription"
    :confirm-label="SAVED_SHEETS_LABELS.remove"
    confirm-color="error"
    confirm-icon="tabler:link-off"
    @confirm="confirmRemove"
  />
</template>
