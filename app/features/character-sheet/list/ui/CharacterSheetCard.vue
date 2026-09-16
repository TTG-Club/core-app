<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { Character } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { ConfirmDialog } from '~initiative/ui-kit';

  import { SheetSettingsModal, SheetShareModal } from '../../body/ui';
  import {
    useCharacterSheetPdf,
    useCharacterSheetShare,
  } from '../../composables';
  import { CharacterSheetDrawer } from '../../drawer';
  import {
    CHARACTER_SHEET_ROUTE,
    downloadCharacterJson,
    getClassesDisplayLabel,
    getDisplayLevel,
    getMaxHitPoints,
    getSheetActionMenuItems,
    getSheetRemoveDescription,
    getSpeciesDisplayName,
    SHEET_CARD_LABELS,
    SHEET_EMPTY_LABELS,
    SHEET_OPEN_IN_PANEL_LABEL,
    SHEET_OPEN_ON_PAGE_LABEL,
    SHEET_REMOVE_CONFIRM_TITLE,
  } from '../../model';

  const {
    character,
    shareToken = null,
    removable = false,
    disabled = false,
    canDuplicate = false,
  } = defineProps<{
    character: Character;

    /** Токен ссылки листа; null — доступ по ссылке выключен. */
    shareToken?: string | null;

    /** Показать пункт удаления листа в меню (список сохранённых). */
    removable?: boolean;

    /** Заблокировать действия на время мутаций списка. */
    disabled?: boolean;

    /** В лимите активных листов есть свободное место — копия разрешена. */
    canDuplicate?: boolean;
  }>();

  const emit = defineEmits<{
    'duplicate': [character: Character];
    'remove': [id: string];
    'share-change': [];
  }>();

  const isDeleteOpen = ref(false);

  /** Подтверждённое удаление листа — событие обрабатывает список. */
  function confirmRemove(): void {
    emit('remove', character.id);
    isDeleteOpen.value = false;
  }

  const overlay = useOverlay();

  const to = computed(() => `${CHARACTER_SHEET_ROUTE}/${character.id}`);

  const drawer = overlay.create(CharacterSheetDrawer, {
    props: {
      characterId: character.id,
      onClose: () => drawer.close(),
    },
  });

  const { isOpened, handleOpen } = useSectionLink(character.id, drawer.id, () =>
    drawer.open(),
  );

  const classLabel = computed(() =>
    character.characterClass
      ? getClassesDisplayLabel(character)
      : SHEET_EMPTY_LABELS.className,
  );

  const speciesLabel = computed(() =>
    character.species
      ? getSpeciesDisplayName(character.species)
      : SHEET_EMPTY_LABELS.species,
  );

  const cardClass = computed(() =>
    isOpened.value
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-elevated hover:border-accented hover:bg-accented',
  );

  const levelValue = computed(() => getDisplayLevel(character));

  // Максимум с прибавками — тот же, что показывает сам лист.
  const maxHitPoints = computed(() => getMaxHitPoints(character));

  const settingsModal = overlay.create(SheetSettingsModal, {
    props: {
      character,
    },
  });

  /** Экспорт листа в JSON — читает документ карточки, запросов не делает. */
  function handleDownload(): void {
    downloadCharacterJson(character);
  }

  const { isExporting, exportToPdf } = useCharacterSheetPdf();

  /** Экспорт листа в PDF — собирается из того же документа карточки. */
  function handleDownloadPdf(): void {
    void exportToPdf(character);
  }

  /** Запрос на копию листа — создаёт её список (у него лимит и обновление). */
  function handleDuplicate(): void {
    emit('duplicate', character);
  }

  /** Настройки листа — модалка сохраняет их сама. */
  function handleSettings(): void {
    settingsModal.open({ character });
  }

  /** Запрос на удаление листа — подтверждение показывает диалог. */
  function handleRemove(): void {
    isDeleteOpen.value = true;
  }

  const { isSheetShared, setShareToken } = useCharacterSheetShare();

  const isShared = computed(() => isSheetShared(character.id));

  const shareModal = overlay.create(SheetShareModal, {
    props: {
      sheetId: character.id,
      onClose: handleShareClose,
    },
  });

  /**
   * Управление доступом по ссылке. Токен листа кладётся в общее состояние перед
   * открытием: модалка читает его оттуда, а карточка знает токен из списка — так
   * состояние доступа не приходится тянуть отдельным запросом.
   */
  function handleShare(): void {
    setShareToken(character.id, shareToken);
    shareModal.open({ sheetId: character.id });
  }

  /** Закрытие модалки: список перечитывается — токен карточки мог смениться. */
  function handleShareClose(): void {
    shareModal.close();
    emit('share-change');
  }

  // Меню действий карточки — то же, что в шапке открытого листа.
  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() =>
    getSheetActionMenuItems({
      canDuplicate,
      canRemove: removable,
      isShared: isShared.value,
      isPdfLoading: isExporting.value,
      onDownload: handleDownload,
      onDownloadPdf: handleDownloadPdf,
      onDuplicate: handleDuplicate,
      onRemove: handleRemove,
      onSettings: handleSettings,
      onShare: handleShare,
    }),
  );
</script>

<template>
  <div
    class="relative flex min-h-20 w-full items-center gap-3 rounded-xl border p-3 transition-all"
    :class="cardClass"
  >
    <!-- Клик открывает лист на отдельной странице: лист — рабочий инструмент, а
      не карточка справочника, поэтому основное действие ведёт в полноэкранный
      режим. Быстрый просмотр рядом остаётся за кнопкой «в панель».

      Ссылка растянута на всю карточку, а не обёрнута вокруг аватара с текстом:
      иначе поля карточки и пустое место справа от текста кликом не ловились.
      Кнопки идут в разметке после неё и позиционированы — они остаются сверху. -->
    <NuxtLink
      :to
      class="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :aria-label="`${SHEET_OPEN_ON_PAGE_LABEL}: ${character.name}`"
    />

    <div class="flex min-w-0 flex-auto items-center gap-4">
      <div
        class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/5 ring-1 ring-primary/15"
      >
        <img
          v-if="character.avatarUrl"
          :src="character.avatarUrl"
          :alt="character.name"
          class="size-full object-cover"
        />

        <UIcon
          v-else
          name="tabler:user"
          class="size-7 text-primary"
        />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-0.5">
        <span class="truncate text-base font-semibold text-highlighted">
          {{ character.name }}
        </span>

        <span class="truncate text-sm text-secondary">
          {{ classLabel }} · {{ speciesLabel }}
        </span>

        <!-- Без нативного title: карточку накрывает ссылка, и подсказка от
          элемента под ней всё равно не всплывёт -->
        <span class="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <UIcon
            name="tabler:heart"
            class="size-3.5 shrink-0 text-error"
          />

          <span class="truncate">
            {{ SHEET_CARD_LABELS.hitPoints }}: {{ character.health.current }} /
            {{ maxHitPoints }} · {{ SHEET_CARD_LABELS.level }}:
            {{ levelValue }}
          </span>
        </span>
      </div>
    </div>

    <!-- Кнопки столбиком: карточка низкая и широкая, в ряд они съедали бы
      ширину у имени персонажа -->
    <div class="relative flex shrink-0 flex-col gap-1">
      <UTooltip :text="SHEET_OPEN_IN_PANEL_LABEL">
        <UButton
          icon="tabler:layout-sidebar-right-expand"
          color="neutral"
          variant="soft"
          square
          :aria-label="SHEET_OPEN_IN_PANEL_LABEL"
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
          :aria-label="SHEET_CARD_LABELS.menuAria"
        />
      </UDropdownMenu>
    </div>

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      :title="SHEET_REMOVE_CONFIRM_TITLE"
      :description="getSheetRemoveDescription(character.name)"
      :confirm-label="ACTION_LABELS.remove"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="confirmRemove"
    />
  </div>
</template>
