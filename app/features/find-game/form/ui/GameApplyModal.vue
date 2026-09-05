<script setup lang="ts">
  import type {
    ApplySource,
    CreateGameRegistrationRequest,
    Game,
  } from '../../model';

  import {
    fetchCharacterSheetList,
    shareCharacterSheet,
  } from '~character-sheet/model';

  import {
    APPLY_CHARACTER_NAME_LABEL,
    APPLY_CHARACTER_NAME_PLACEHOLDER,
    APPLY_CHARACTER_SHEET_LABEL,
    APPLY_CHARACTER_SHEET_PLACEHOLDER,
    APPLY_LABEL,
    APPLY_OWN_SHEET_EMPTY,
    APPLY_OWN_SHEET_HINT,
    APPLY_OWN_SHEET_LABEL,
    APPLY_OWN_SHEET_PLACEHOLDER,
    APPLY_SHARE_FAILED_MESSAGE,
    APPLY_SOURCE_LABELS,
    APPLY_SOURCES,
    APPLY_TITLE,
    CANCEL_LABEL,
    CHARACTER_NAME_MAX_LENGTH,
    CHARACTER_SHEET_URL_MAX_LENGTH,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
  } from '../../model';
  import { getSharedCharacterSheetLink } from '../../ui';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { game, loading = false } = defineProps<{
    /** Игра, в которую подаётся заявка; `null` — окно закрыто. */
    game: Game | null;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreateGameRegistrationRequest];
  }>();

  const toast = useToast();

  const source = ref<ApplySource>('SHEET');
  const sheetId = ref<string | undefined>();
  const characterSheetUrl = ref('');
  const characterName = ref('');
  const isSharing = ref(false);

  const sourceItems = APPLY_SOURCES.map((value) => ({
    value,
    label: APPLY_SOURCE_LABELS[value],
  }));

  // Свои листы нужны только открытому окну и только для выбора, поэтому
  // грузятся на клиенте и без удалённых.
  const { data: sheets } = useAsyncData(
    'find-game-apply-sheets',
    async () => {
      if (!isOpen.value) {
        return [];
      }

      const page = await fetchCharacterSheetList(false).catch(() => null);

      return page?.sheets.filter((sheet) => !sheet.deleted) ?? [];
    },
    { watch: [isOpen], server: false, default: () => [] },
  );

  const sheetItems = computed(() =>
    (sheets.value ?? []).map((sheet) => ({
      value: sheet.id,
      label: sheet.name,
    })),
  );

  const hasSheets = computed(() => sheetItems.value.length > 0);

  const isValid = computed(() => {
    if (source.value === 'SHEET') {
      return !!sheetId.value;
    }

    if (source.value === 'LINK') {
      return !!characterSheetUrl.value.trim();
    }

    return !!characterName.value.trim();
  });

  /** Закрывает окно, не подавая заявку. */
  function cancel(): void {
    isOpen.value = false;
  }

  /**
   * Ссылка на выбранный свой лист. Доступ по ссылке включается на месте:
   * мастеру нужно открыть лист, а у закрытого листа токена ещё нет.
   */
  async function resolveOwnSheetLink(): Promise<string | null> {
    const selected = (sheets.value ?? []).find(
      (sheet) => sheet.id === sheetId.value,
    );

    if (!selected) {
      return null;
    }

    if (selected.shareToken) {
      return getSharedCharacterSheetLink(selected.shareToken);
    }

    isSharing.value = true;

    try {
      return getSharedCharacterSheetLink(
        await shareCharacterSheet(selected.id),
      );
    } catch {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: APPLY_SHARE_FAILED_MESSAGE,
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      return null;
    } finally {
      isSharing.value = false;
    }
  }

  /** Отправляет заявку тем способом, который выбрал игрок. */
  async function submit(): Promise<void> {
    if (!game || !isValid.value) {
      return;
    }

    const request: CreateGameRegistrationRequest = {};

    if (source.value === 'NAME') {
      request.characterName = characterName.value.trim();
    } else if (source.value === 'LINK') {
      request.characterSheetUrl = characterSheetUrl.value.trim();
    } else {
      const link = await resolveOwnSheetLink();

      if (!link) {
        return;
      }

      request.characterSheetUrl = link;
    }

    emit('submit', request);
  }

  // Окно живёт вместе со страницей: чистим его на каждом открытии, иначе в
  // следующую заявку подставится прошлый персонаж.
  watch(isOpen, (opened) => {
    if (opened) {
      source.value = 'SHEET';
      sheetId.value = undefined;
      characterSheetUrl.value = '';
      characterName.value = '';
    }
  });

  // Своих листов нет — предлагать выбор из них незачем.
  watch(hasSheets, (has) => {
    if (!has && source.value === 'SHEET') {
      source.value = 'LINK';
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="APPLY_TITLE"
    :description="game?.title"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UTabs
          v-model="source"
          :items="sourceItems"
          size="sm"
          :content="false"
        />

        <UFormField
          v-if="source === 'SHEET'"
          :label="APPLY_OWN_SHEET_LABEL"
          :hint="APPLY_OWN_SHEET_HINT"
        >
          <USelectMenu
            v-model="sheetId"
            value-key="value"
            :items="sheetItems"
            :disabled="!hasSheets"
            :placeholder="
              hasSheets ? APPLY_OWN_SHEET_PLACEHOLDER : APPLY_OWN_SHEET_EMPTY
            "
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-else-if="source === 'LINK'"
          :label="APPLY_CHARACTER_SHEET_LABEL"
        >
          <UInput
            v-model="characterSheetUrl"
            type="url"
            :maxlength="CHARACTER_SHEET_URL_MAX_LENGTH"
            :placeholder="APPLY_CHARACTER_SHEET_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-else
          :label="APPLY_CHARACTER_NAME_LABEL"
        >
          <UInput
            v-model="characterName"
            :maxlength="CHARACTER_NAME_MAX_LENGTH"
            :placeholder="APPLY_CHARACTER_NAME_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading || isSharing"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          icon="tabler:send"
          :loading="loading || isSharing"
          :disabled="!isValid"
          :label="APPLY_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
