<script setup lang="ts">
  import type { FeatSelectOption } from '../../model';

  import { FeatDrawer } from '~feats/drawer';

  import {
    ABILITY_IMPROVEMENT_LABELS,
    SHEET_FEAT_PICK_LABELS,
    SHEET_SEARCH_LABELS,
  } from '../../model';
  import SheetSearchInput from './SheetSearchInput.vue';

  /**
   * Окно выбора черты в мастере: список пула с поиском и описанием каждой.
   *
   * Не общий `CatalogPickerModal` из `shared/ui`: тот сам ходит в раздел
   * каталога и умеет только исключать записи, а пул мастера собран на клиенте —
   * перечнем умения, категориями, источниками профиля и уже взятыми чертами.
   * Показать его тем окном значило бы отдать выбор из списка, которого умение
   * не разрешает.
   */

  /** Строка списка: черта пула с состоянием выбора. */
  interface FeatRow extends FeatSelectOption {
    selected: boolean;
    icon: string;
    iconClass: string;
    rowClass: string;
  }

  const props = defineProps<{
    /** Подпись выбора: она же заголовок окна. */
    title: string;

    /** Пул черт: он уже сужен умением, источниками и взятым на листе. */
    items: FeatSelectOption[];

    /** URL черты, выбранной раньше; '' — выбора не было. */
    selected: string;
  }>();

  const emit = defineEmits<{
    /** Закрытие окна; выбранная черта передаётся только при подтверждении. */
    close: [featUrl?: string];
  }>();

  const overlay = useOverlay();

  // Дровер описания черты с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const featPreviewDrawer = overlay.create(FeatDrawer, {
    props: {
      url: '',
      onClose: () => featPreviewDrawer.close(),
    },
  });

  // Окно правит копию: выбор до подтверждения меняться не должен — игрок может
  // передумать и закрыть окно.
  const draftUrl = ref(props.selected);

  const searchTerm = ref('');

  const filteredFeats = computed<FeatSelectOption[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    if (!query) {
      return props.items;
    }

    return withLayoutFallback(query, (searchQuery) =>
      props.items.filter((feat) =>
        feat.name.toLowerCase().includes(searchQuery),
      ),
    );
  });

  const rows = computed<FeatRow[]>(() =>
    [...filteredFeats.value]
      .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
      .map((feat) => {
        const selected = feat.url === draftUrl.value;

        return {
          ...feat,
          selected,
          icon: selected ? 'tabler:circle-check' : 'tabler:circle',
          iconClass: selected ? 'text-primary' : 'text-dimmed',
          rowClass: selected ? 'bg-elevated' : '',
        };
      }),
  );

  const isEmpty = computed(() => rows.value.length === 0);

  /**
   * Выбирает черту; повторное нажатие по выбранной снимает выбор.
   *
   * @param feat строка списка.
   */
  function toggleFeat(feat: FeatRow) {
    draftUrl.value = feat.selected ? '' : feat.url;
  }

  /**
   * Открывает описание черты с сайта.
   *
   * @param url URL черты.
   */
  function handlePreview(url: string) {
    featPreviewDrawer.open({ url });
  }

  function handleApply() {
    emit('close', draftUrl.value);
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div class="flex h-[60dvh] min-h-80 flex-col gap-3">
        <span class="text-xs text-dimmed">
          {{ SHEET_FEAT_PICK_LABELS.clearHint }}
        </span>

        <SheetSearchInput
          v-model="searchTerm"
          :placeholder="SHEET_SEARCH_LABELS.byNamePlaceholder"
          class="shrink-0"
        />

        <div
          v-if="isEmpty"
          class="flex grow items-center justify-center text-sm text-dimmed"
        >
          {{ SHEET_FEAT_PICK_LABELS.empty }}
        </div>

        <div
          v-else
          class="flex min-h-0 grow flex-col gap-1 overflow-y-auto pr-1"
        >
          <div
            v-for="feat in rows"
            :key="feat.url"
            class="relative flex items-center gap-2 rounded-md pr-2 transition-colors hover:bg-elevated/60"
            :class="feat.rowClass"
          >
            <button
              type="button"
              class="flex min-w-0 grow cursor-pointer items-center gap-2 px-2 py-1.5 text-left after:absolute after:inset-0 after:cursor-pointer"
              :aria-pressed="feat.selected"
              @click.left.exact.prevent="toggleFeat(feat)"
            >
              <UIcon
                :name="feat.icon"
                class="size-5 shrink-0"
                :class="feat.iconClass"
              />

              <span class="min-w-0 grow truncate text-sm text-highlighted">
                {{ feat.name }}
              </span>

              <UBadge
                v-if="feat.sourceLabel"
                size="sm"
                color="neutral"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ feat.sourceLabel }}
              </UBadge>
            </button>

            <UTooltip :text="ABILITY_IMPROVEMENT_LABELS.previewTooltip">
              <UButton
                icon="tabler:layout-sidebar-right-expand"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="relative z-10 shrink-0"
                :aria-label="`${ABILITY_IMPROVEMENT_LABELS.previewAriaLabel}: ${feat.name}`"
                @click.left.exact.prevent="handlePreview(feat.url)"
              />
            </UTooltip>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_FEAT_PICK_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_FEAT_PICK_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
