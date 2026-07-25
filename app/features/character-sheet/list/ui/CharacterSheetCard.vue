<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { Character } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { SheetSettingsModal } from '../../body/ui';
  import { useCharacterSheetPdf } from '../../composables';
  import { CharacterSheetDrawer } from '../../drawer';
  import {
    CHARACTER_SHEET_ROUTE,
    downloadCharacterJson,
    getClassDisplayName,
    getSheetActionMenuItems,
    getSpeciesDisplayName,
    SHEET_EMPTY_LABELS,
  } from '../../model';

  const {
    character,
    removable = false,
    disabled = false,
    canDuplicate = false,
  } = defineProps<{
    character: Character;

    /** Показать пункт удаления листа в меню (список сохранённых). */
    removable?: boolean;

    /** Заблокировать действия на время мутаций списка. */
    disabled?: boolean;

    /** В лимите активных листов есть свободное место — копия разрешена. */
    canDuplicate?: boolean;
  }>();

  const emit = defineEmits<{
    duplicate: [character: Character];
    remove: [id: string];
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
      ? getClassDisplayName(character.characterClass)
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

  /** Открывает лист на отдельной странице (в обход drawer). */
  function openOnPage(): void {
    navigateTo(to.value);
  }

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

  // Меню действий карточки — то же, что в шапке открытого листа.
  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() =>
    getSheetActionMenuItems({
      canDuplicate,
      canRemove: removable,
      isPdfLoading: isExporting.value,
      onDownload: handleDownload,
      onDownloadPdf: handleDownloadPdf,
      onDuplicate: handleDuplicate,
      onRemove: handleRemove,
      onSettings: handleSettings,
    }),
  );
</script>

<template>
  <div
    class="flex min-h-20 w-full items-center gap-3 rounded-xl border p-3 transition-all"
    :class="cardClass"
  >
    <NuxtLink
      v-slot="{ href }"
      custom
      :to
    >
      <!-- Клик открывает лист рядом: drawer в стандартном режиме, правая панель
        в широком — как во всех остальных разделах. Отдельная страница остаётся
        за кнопкой «↗» и за обычным переходом по ссылке (новая вкладка). -->
      <a
        :href="href ?? undefined"
        class="flex min-w-0 flex-auto items-center gap-4"
        @click.left.exact.prevent="handleOpen"
      >
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
            {{ classLabel }} ({{ character.level }} уровень) ·
            {{ speciesLabel }}
          </span>

          <span
            class="mt-0.5 flex items-center gap-1 text-xs text-muted"
            title="Хиты: сейчас / всего"
          >
            <UIcon
              name="tabler:heart"
              class="size-3.5 shrink-0 text-error"
            />

            <span class="truncate">
              Хиты: {{ character.health.current }} /
              {{ character.health.max }} · Уровень: {{ character.level }}
            </span>
          </span>
        </div>
      </a>
    </NuxtLink>

    <UTooltip text="Открыть на отдельной странице">
      <UButton
        icon="tabler:arrow-up-right"
        color="neutral"
        variant="soft"
        square
        class="shrink-0"
        aria-label="Открыть на отдельной странице"
        @click.left.exact.prevent="openOnPage"
      />
    </UTooltip>

    <UDropdownMenu :items="menuItems">
      <UButton
        icon="tabler:dots-vertical"
        color="neutral"
        variant="soft"
        square
        class="shrink-0"
        :disabled
        aria-label="Действия с листом"
      />
    </UDropdownMenu>

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      title="Удалить лист персонажа?"
      :description="`Лист «${character.name}» переедет в историю — его можно будет восстановить.`"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="confirmRemove"
    />
  </div>
</template>
