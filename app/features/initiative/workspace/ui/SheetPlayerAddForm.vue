<script setup lang="ts">
  import type { SheetPlayerOption } from '~initiative/model';

  import { useSheetPlayerOptions } from '~initiative/composables';
  import {
    SHEET_PLAYER_FORM_LABELS,
    SHEET_PLAYER_SOURCE_LABEL,
  } from '~initiative/model';

  /** Вариант списка листов: сам лист плюс пометки для его строки. */
  interface SheetPlayerItem {
    /** Идентификатор листа — значение селекта. */
    value: string;
    label: string;

    /** Классы с уровнями либо общий уровень персонажа. */
    hint: string;

    /** Откуда лист: свой или сохранённый чужой. */
    badge: string;

    /** Персонаж этого листа уже стоит в бою. */
    added: boolean;

    /** Аватар персонажа; поля нет — лист без аватара. */
    avatar?: { src: string };
  }

  const {
    disabled = false,
    loading = false,
    linkedSheetIds,
  } = defineProps<{
    /** Лимит игроков исчерпан — форма недоступна. */
    disabled?: boolean;
    loading?: boolean;

    /** Листы, персонажи которых уже добавлены в бой (для пометки в списке). */
    linkedSheetIds: Set<string>;
  }>();

  const emit = defineEmits<{
    add: [option: SheetPlayerOption];
  }>();

  const { options, isLoading, hasError, isAuthorized, load } =
    useSheetPlayerOptions();

  const selectedSheetId = ref<string | undefined>(undefined);

  const items = computed<Array<SheetPlayerItem>>(() =>
    options.value.map((option) => ({
      value: option.sheetId,
      label: option.name,
      hint: option.subtitle,
      badge: SHEET_PLAYER_SOURCE_LABEL[option.source],
      added: linkedSheetIds.has(option.sheetId),
      ...(option.avatarUrl ? { avatar: { src: option.avatarUrl } } : {}),
    })),
  );

  const isEmpty = computed(() => !isLoading.value && !items.value.length);

  const isSelectDisabled = computed(() => disabled || isEmpty.value);

  const selectedOption = computed(() =>
    options.value.find((option) => option.sheetId === selectedSheetId.value),
  );

  const canSubmit = computed(
    () => Boolean(selectedOption.value) && !isSelectDisabled.value,
  );

  // Под полем показываем только то, что объясняет неработающий выбор: отказ
  // загрузки, исчерпанный лимит игроков, пустой список. Рассказ о том, что
  // перенесётся с листа, ушёл в подсказку у заголовка — строкой он занимал
  // место в каждом бою, хотя нужен один раз.
  const notice = computed<{ text: string; toneClass: string } | null>(() => {
    if (hasError.value) {
      return { text: SHEET_PLAYER_FORM_LABELS.error, toneClass: 'text-error' };
    }

    if (disabled) {
      return { text: SHEET_PLAYER_FORM_LABELS.limit, toneClass: 'text-error' };
    }

    return isEmpty.value
      ? { text: SHEET_PLAYER_FORM_LABELS.empty, toneClass: 'text-muted' }
      : null;
  });

  function submit(): void {
    const option = selectedOption.value;

    if (!canSubmit.value || loading || !option) {
      return;
    }

    emit('add', option);

    selectedSheetId.value = undefined;
  }
</script>

<template>
  <form
    v-if="isAuthorized"
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="submit"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:id-badge-2"
        class="size-5 text-primary"
      />
      {{ SHEET_PLAYER_FORM_LABELS.title }}

      <!-- Что перенесётся с листа — подсказкой, а не строкой под полем.
           Кнопкой, а не голой иконкой: на телефоне тултип открывается
           фокусом, а иконку сфокусировать нельзя. -->
      <UTooltip :text="SHEET_PLAYER_FORM_LABELS.hint">
        <UButton
          class="shrink-0"
          icon="tabler:info-circle-filled"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="SHEET_PLAYER_FORM_LABELS.hint"
        />
      </UTooltip>

      <!-- Список тянется один раз при открытии боя: лист, созданный в соседней
           вкладке, приезжает по этой кнопке, а не перезагрузкой страницы. -->
      <UTooltip :text="SHEET_PLAYER_FORM_LABELS.refresh">
        <UButton
          class="ml-auto shrink-0"
          icon="tabler:refresh"
          color="neutral"
          variant="ghost"
          size="xs"
          :loading="isLoading"
          :aria-label="SHEET_PLAYER_FORM_LABELS.refresh"
          @click.left.exact.prevent="load"
        />
      </UTooltip>
    </div>

    <div class="flex flex-wrap items-end gap-2">
      <UFormField
        :label="SHEET_PLAYER_FORM_LABELS.field"
        class="min-w-48 flex-1"
      >
        <USelectMenu
          v-model="selectedSheetId"
          :items="items"
          value-key="value"
          :placeholder="SHEET_PLAYER_FORM_LABELS.placeholder"
          :search-input="{ placeholder: SHEET_PLAYER_FORM_LABELS.search }"
          :loading="isLoading"
          :disabled="isSelectDisabled"
          icon="tabler:id-badge-2"
          class="w-full"
        >
          <template #item-label="{ item }">
            <span class="flex min-w-0 flex-col text-left">
              <span class="truncate">{{ item.label }}</span>

              <span
                v-if="item.hint"
                class="truncate text-xs text-muted"
              >
                {{ item.hint }}
              </span>
            </span>
          </template>

          <template #item-trailing="{ item }">
            <UBadge
              v-if="item.added"
              size="sm"
              color="neutral"
              variant="subtle"
            >
              {{ SHEET_PLAYER_FORM_LABELS.added }}
            </UBadge>

            <UBadge
              size="sm"
              color="neutral"
              variant="outline"
            >
              {{ item.badge }}
            </UBadge>
          </template>
        </USelectMenu>
      </UFormField>

      <UButton
        type="submit"
        icon="tabler:plus"
        class="shrink-0"
        :loading
        :disabled="!canSubmit || loading"
        :aria-label="SHEET_PLAYER_FORM_LABELS.submit"
      />
    </div>

    <p
      v-if="notice"
      class="text-xs"
      :class="notice.toneClass"
    >
      {{ notice.text }}
    </p>
  </form>
</template>
