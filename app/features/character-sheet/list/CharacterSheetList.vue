<script setup lang="ts">
  import type { Character, CharacterSheetListItem } from '../model';

  import { PageGrid } from '~ui/page';
  import { UiResult } from '~ui/result';

  import { useCharacterSheetList } from '../composables';
  import {
    CHARACTER_SHEET_ROUTE,
    getSheetsCountTooltip,
    getSheetsHistoryTooltip,
    getSheetsSubscriptionHint,
  } from '../model';
  import { CharacterSheetSavedList } from '../saved';
  import {
    CharacterSheetCard,
    CharacterSheetCreateCard,
    SheetLimitHint,
  } from './ui';

  const {
    activeSheets,
    deletedSheets,
    limit,
    historyLimit,
    subscriberLimit,
    subscriberHistoryLimit,
    canCreate,
    canRaiseLimit,
    isLoading,
    isMutating,
    loadErrorMessage,
    load,
    create,
    duplicate,
    remove,
    restore,
  } = useCharacterSheetList();

  const { format } = useDayjs();

  const showHistory = ref(false);

  /** Активные листы с гарантированным документом для карточки. */
  const activeCards = computed(() =>
    activeSheets.value.flatMap(
      (
        sheet,
      ): Array<{
        id: string;
        character: Character;
        shareToken: string | null;
      }> =>
        sheet.data
          ? [
              {
                id: sheet.id,
                character: sheet.data,
                shareToken: sheet.shareToken,
              },
            ]
          : [],
    ),
  );

  // Счётчик листов краснеет на достигнутом лимите. Логика вынесена из шаблона.
  const sheetCountColorClass = computed(() =>
    canCreate.value ? 'text-muted' : 'text-error',
  );

  const countTooltip = computed(() =>
    getSheetsCountTooltip(
      activeSheets.value.length,
      limit.value,
      subscriberLimit.value,
    ),
  );

  const isLimitReached = computed(
    () => !canCreate.value && limit.value > 0 && !isLoading.value,
  );

  // Подсказку про подписку показываем там, где пользователь в лимит упёрся:
  // постоянная реклама рядом со счётчиком превратила бы страницу в баннер.
  const subscriptionHint = computed(() =>
    getSheetsSubscriptionHint(subscriberLimit.value),
  );

  // Глубина истории приходит с сервера: без неё (старый бэк) остаётся один
  // счётчик, иначе рядом с ним видно, сколько удалений история ещё вместит.
  const historyCountLabel = computed(() =>
    historyLimit.value > 0
      ? `${deletedSheets.value.length} из ${historyLimit.value}`
      : `${deletedSheets.value.length}`,
  );

  const historyTooltip = computed(() =>
    getSheetsHistoryTooltip(historyLimit.value, subscriberHistoryLimit.value),
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
      v-else-if="loadErrorMessage"
      status="error"
      title="Не удалось загрузить листы персонажей"
      :sub-title="loadErrorMessage"
    >
      <template #extra>
        <UButton @click.left.exact.prevent="load"> Обновить </UButton>
      </template>
    </UiResult>

    <template v-else>
      <section class="flex flex-col gap-2">
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
            :share-token="card.shareToken"
            removable
            :disabled="isMutating"
            :can-duplicate="canCreate"
            @duplicate="duplicate"
            @remove="remove"
            @share-change="load"
          />

          <!-- Плейсхолдер-слот создания — исчезает на достигнутом лимите -->
          <CharacterSheetCreateCard
            v-if="canCreate"
            :loading="isMutating"
            :disabled="isMutating"
            @create="handleCreate"
          />
        </PageGrid>

        <template v-if="isLimitReached">
          <p class="text-xs text-muted">
            Достигнут лимит {{ limit }} листов — удалите один, чтобы создать
            новый.
          </p>

          <SheetLimitHint
            v-if="canRaiseLimit"
            :text="subscriptionHint"
          />
        </template>
      </section>
    </template>

    <!-- Чужие листы, сохранённые по ссылке: свой запрос, свой лимит и своя
      ошибка, поэтому раздел не прячется вместе со своими листами -->
    <CharacterSheetSavedList />

    <template v-if="!isLoading && !loadErrorMessage">
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
            История листов ({{ historyCountLabel }})

            <UTooltip :text="historyTooltip">
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
