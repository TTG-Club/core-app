<script setup lang="ts">
  import type { Character, CharacterSheetListItem } from '../model';

  import { PageGrid } from '~ui/page';
  import { UiResult } from '~ui/result';

  import { useCharacterSheetList } from '../composables';
  import { CHARACTER_SHEET_ROUTE, getSheetErrorMessage } from '../model';
  import { CharacterSheetCard } from './ui';

  const {
    activeSheets,
    deletedSheets,
    limit,
    canCreate,
    isLoading,
    isMutating,
    loadError,
    load,
    create,
    remove,
    restore,
  } = useCharacterSheetList();

  const { format } = useDayjs();

  const showHistory = ref(false);

  /** Активные листы с гарантированным документом для карточки. */
  const activeCards = computed(() =>
    activeSheets.value.flatMap(
      (sheet): Array<{ id: string; character: Character }> =>
        sheet.data ? [{ id: sheet.id, character: sheet.data }] : [],
    ),
  );

  const listErrorSubTitle = computed(() =>
    getSheetErrorMessage(loadError.value),
  );

  // Счётчик листов краснеет на достигнутом лимите. Логика вынесена из шаблона.
  const sheetCountColorClass = computed(() =>
    canCreate.value ? 'text-muted' : 'text-error',
  );

  const countTooltip = computed(
    () =>
      `Активных листов — ${activeSheets.value.length} из ${limit.value} возможных`,
  );

  // Пока список не загружен, серверный лимит неизвестен — создание недоступно.
  const isCreateDisabled = computed(
    () => isLoading.value || Boolean(loadError.value) || !canCreate.value,
  );

  const isLimitReached = computed(
    () => !canCreate.value && limit.value > 0 && !isLoading.value,
  );

  onMounted(() => {
    load();
  });

  /** Создаёт пустой лист и открывает его на отдельной странице. */
  async function handleCreate(): Promise<void> {
    const created = await create();

    if (created) {
      navigateTo(`${CHARACTER_SHEET_ROUTE}/${created.id}`);
    }
  }

  /**
   * Подпись даты удаления в истории (мягкое удаление обновляет updatedAt).
   *
   * @param sheet удалённый лист из истории.
   */
  function getDeletedAtLabel(sheet: CharacterSheetListItem): string {
    return sheet.updatedAt
      ? `Удалён ${format(sheet.updatedAt, 'LLL')}`
      : 'Удалён';
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Герой: создание нового листа — не ждёт загрузки списка -->
    <div
      class="flex flex-col gap-3 rounded-xl border border-default bg-elevated p-4 ring-1 ring-primary/15 sm:p-6"
    >
      <div class="flex items-center gap-4">
        <div
          class="hidden shrink-0 place-items-center rounded-xl bg-primary/5 p-2.5 sm:grid"
        >
          <UIcon
            name="tabler:user-plus"
            class="size-8 text-primary"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-1">
          <h3 class="text-lg font-semibold text-highlighted">
            Создать персонажа
          </h3>

          <p class="text-sm text-secondary">
            Пустой лист сохранится в вашем списке — изменения улетают на сервер
            автоматически.
          </p>
        </div>

        <UButton
          type="button"
          icon="tabler:user-plus"
          size="lg"
          class="ml-auto shrink-0 justify-center transition-transform hover:-translate-y-px active:translate-y-0"
          :loading="isMutating"
          :disabled="isCreateDisabled"
          @click.left.exact.prevent="handleCreate"
        >
          Создать лист
        </UButton>
      </div>

      <p
        v-if="isLimitReached"
        class="text-xs text-error"
      >
        Достигнут лимит {{ limit }} листов — удалите один, чтобы создать новый.
      </p>
    </div>

    <!-- Второй план: список листов -->
    <div
      v-if="isLoading"
      class="flex flex-col gap-2"
    >
      <span class="text-xs font-medium tracking-wide text-muted uppercase">
        Ваши персонажи
      </span>

      <PageGrid :columns="2">
        <USkeleton
          v-for="index in 2"
          :key="index"
          class="h-24 w-full rounded-xl"
        />
      </PageGrid>
    </div>

    <UiResult
      v-else-if="loadError"
      status="error"
      title="Не удалось загрузить листы персонажей"
      :sub-title="listErrorSubTitle"
    >
      <template #extra>
        <UButton @click.left.exact.prevent="load"> Обновить </UButton>
      </template>
    </UiResult>

    <template v-else>
      <section
        v-if="activeCards.length"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium tracking-wide text-muted uppercase">
            Ваши персонажи
          </span>

          <span class="flex items-center gap-1 text-xs tabular-nums">
            <span :class="sheetCountColorClass">
              {{ activeSheets.length }} / {{ limit }}
            </span>

            <UTooltip :text="countTooltip">
              <UIcon
                name="tabler:help-circle-filled"
                class="size-3.5 shrink-0 text-muted"
              />
            </UTooltip>
          </span>
        </div>

        <PageGrid :columns="2">
          <CharacterSheetCard
            v-for="card in activeCards"
            :key="card.id"
            :character="card.character"
            removable
            :disabled="isMutating"
            @remove="remove"
          />
        </PageGrid>
      </section>

      <p
        v-else
        class="text-sm text-muted"
      >
        Здесь появятся ваши персонажи.
      </p>

      <!-- История удалённых листов — свёрнута, во втором плане -->
      <UCollapsible
        v-if="deletedSheets.length"
        v-model:open="showHistory"
      >
        <UButton
          icon="tabler:history"
          :trailing-icon="
            showHistory ? 'tabler:chevron-up' : 'tabler:chevron-down'
          "
          color="neutral"
          variant="ghost"
          block
          class="justify-between text-muted"
        >
          <span class="flex items-center gap-1.5">
            История листов ({{ deletedSheets.length }})

            <UTooltip
              text="Удалённые листы можно восстановить, пока в лимите есть свободное место"
            >
              <UIcon
                name="tabler:help-circle-filled"
                class="size-4 shrink-0"
              />
            </UTooltip>
          </span>
        </UButton>

        <template #content>
          <div class="flex flex-col gap-1.5 pt-2">
            <div
              v-for="sheet in deletedSheets"
              :key="sheet.id"
              class="flex items-center gap-3 rounded-lg border border-default bg-default p-2.5 opacity-80"
            >
              <UIcon
                name="tabler:user-off"
                class="size-5 shrink-0 text-muted"
              />

              <div class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm font-semibold text-highlighted">
                  {{ sheet.name }}
                </span>

                <span class="truncate text-xs text-secondary">
                  {{ getDeletedAtLabel(sheet) }}
                </span>
              </div>

              <UButton
                icon="tabler:restore"
                color="neutral"
                variant="soft"
                size="sm"
                :loading="isMutating"
                @click.left.exact.prevent="restore(sheet.id)"
              >
                Восстановить
              </UButton>
            </div>
          </div>
        </template>
      </UCollapsible>
    </template>
  </div>
</template>
