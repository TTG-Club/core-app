<script setup lang="ts">
  import { PageGrid } from '~ui/page';

  import {
    useCharacterSheetList,
    useCharacterSheetSaved,
  } from '../composables';
  import { SheetLimitHint } from '../list/ui';
  import {
    getSavedSheetsCountTooltip,
    getSavedSheetsSubscriptionHint,
    SAVED_SHEETS_LABELS,
    SAVED_SHEETS_TITLE,
  } from '../model';
  import { CharacterSheetSavedCard } from './ui';

  const {
    savedSheets,
    limit,
    subscriberLimit,
    canSave,
    canRaiseLimit,
    isLoading,
    isMutating,
    loadErrorMessage,
    load,
    remove,
  } = useCharacterSheetSaved();

  // Копия чужого листа создаёт свой и упирается в его лимит, поэтому за неё
  // отвечает список своих листов — раздел лишь передаёт ему документ.
  const {
    canCreate,
    isMutating: isListMutating,
    ensureLoaded: ensureListLoaded,
    copyShared,
  } = useCharacterSheetList();

  onMounted(() => {
    void load();
    void ensureListLoaded();
  });

  const canCopy = computed(() => canCreate.value && !isListMutating.value);

  // Счётчик краснеет на достигнутом лимите — как у своих листов.
  const countColorClass = computed(() =>
    canSave.value ? 'text-muted' : 'text-error',
  );

  const countTooltip = computed(() =>
    getSavedSheetsCountTooltip(
      savedSheets.value.length,
      limit.value,
      subscriberLimit.value,
    ),
  );

  const isLimitReached = computed(
    () => !canSave.value && limit.value > 0 && !isLoading.value,
  );

  // Подсказка про подписку — только на достигнутом лимите, как у своих листов.
  const subscriptionHint = computed(() =>
    getSavedSheetsSubscriptionHint(subscriberLimit.value),
  );
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span class="text-xs font-medium tracking-wide text-muted uppercase">
        {{ SAVED_SHEETS_TITLE }}
      </span>

      <span
        v-if="!isLoading && !loadErrorMessage"
        class="flex items-center gap-1 text-xs tabular-nums"
      >
        <span :class="countColorClass">
          {{ savedSheets.length }} / {{ limit }}
        </span>

        <UTooltip :text="countTooltip">
          <UIcon
            name="tabler:help-circle-filled"
            class="size-3.5 shrink-0 text-muted"
          />
        </UTooltip>
      </span>
    </div>

    <PageGrid
      v-if="isLoading"
      :columns="2"
    >
      <USkeleton class="h-24 w-full rounded-xl" />
    </PageGrid>

    <!-- Ошибка раздела не заменяет собой страницу: свои листы рядом уже
      загрузились, поэтому здесь только строка с повтором -->
    <div
      v-else-if="loadErrorMessage"
      class="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-elevated p-3 text-sm text-muted"
    >
      <span class="min-w-0 flex-auto truncate">{{ loadErrorMessage }}</span>

      <UButton
        icon="tabler:refresh"
        color="neutral"
        variant="soft"
        size="sm"
        @click.left.exact.prevent="load"
      >
        Обновить
      </UButton>
    </div>

    <template v-else>
      <PageGrid
        v-if="savedSheets.length"
        :columns="2"
      >
        <!-- Ключ по токену, а не по id записи: присланная заново ссылка на тот
          же лист обновляет токен, а drawer и `?detail=` карточка запоминает при
          монтировании — иначе они остались бы со старым токеном -->
        <CharacterSheetSavedCard
          v-for="sheet in savedSheets"
          :key="sheet.shareToken"
          :sheet
          :disabled="isMutating"
          :can-copy="canCopy"
          @copy="copyShared"
          @remove="remove"
        />
      </PageGrid>

      <p
        v-else
        class="text-xs text-muted"
      >
        {{ SAVED_SHEETS_LABELS.empty }}
      </p>

      <template v-if="isLimitReached">
        <p class="text-xs text-muted">
          {{ SAVED_SHEETS_LABELS.limitReached }}
        </p>

        <SheetLimitHint
          v-if="canRaiseLimit"
          :text="subscriptionHint"
        />
      </template>
    </template>
  </section>
</template>
