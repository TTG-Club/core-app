<script setup lang="ts">
  import {
    useCharacterSheetList,
    useCharacterSheetSaved,
  } from '~character-sheet/composables';
  import { shareCharacterSheet } from '~character-sheet/model';
  import { getFindGameErrorMessage } from '~find-game/model';
  import { UiResult } from '~ui/result';

  import {
    NEXUS_SHEET_ADD_TITLE,
    NEXUS_SHEET_EMPTY_TITLE,
    NEXUS_SHEET_OTHERS_TAB,
    NEXUS_SHEET_OWN_TAB,
    NEXUS_SHEET_SHARE_HINT,
    NEXUS_SHEET_UNAVAILABLE_HINT,
    NEXUS_UNKNOWN_ERROR_MESSAGE,
  } from '../model';

  /**
   * Выбор листа, который выкладывают в комнату.
   *
   * Свои листы доступны каждому участнику. Сохранённые чужие — только
   * владельцу комнаты: за столом он раздаёт персонажей, а игрок выкладывает
   * своего.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { canPickOthers, busy = false } = defineProps<{
    /** Показывать ли сохранённые чужие листы. */
    canPickOthers: boolean;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [shareToken: string, characterName: string];
  }>();

  const toast = useToast();

  const {
    activeSheets,
    isLoading: areOwnLoading,
    ensureLoaded: ensureOwnLoaded,
  } = useCharacterSheetList();

  const {
    savedSheets,
    isLoading: areOthersLoading,
    ensureLoaded: ensureOthersLoaded,
  } = useCharacterSheetSaved();

  const activeTab = ref('own');

  const tabItems = computed(() =>
    canPickOthers
      ? [
          { value: 'own', label: NEXUS_SHEET_OWN_TAB },
          { value: 'others', label: NEXUS_SHEET_OTHERS_TAB },
        ]
      : [{ value: 'own', label: NEXUS_SHEET_OWN_TAB }],
  );

  // Листы подтягиваются на открытие: держать их загруженными ради кнопки,
  // которую могут и не нажать, незачем.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    activeTab.value = 'own';
    void ensureOwnLoaded();

    if (canPickOthers) {
      void ensureOthersLoaded();
    }
  });

  /**
   * Выкладывает свой лист.
   *
   * У листа без ссылки её сначала нужно включить: без неё лист виден только
   * владельцу, и в комнате открыть его будет нечем.
   *
   * @param sheetId Идентификатор листа.
   * @param name Название листа.
   * @param shareToken Токен, если ссылка уже включена.
   */
  async function pickOwn(
    sheetId: string,
    name: string,
    shareToken: string | null,
  ): Promise<void> {
    try {
      const token = shareToken ?? (await shareCharacterSheet(sheetId));

      emit('submit', token, name);
    } catch (error) {
      toast.add({
        title: NEXUS_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="NEXUS_SHEET_ADD_TITLE"
    :description="NEXUS_SHEET_SHARE_HINT"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UTabs
          v-if="canPickOthers"
          v-model="activeTab"
          :items="tabItems"
          :content="false"
          size="sm"
        />

        <div
          v-if="activeTab === 'own'"
          class="flex flex-col gap-2"
        >
          <template v-if="areOwnLoading">
            <USkeleton
              v-for="index in 3"
              :key="index"
              class="h-12 w-full rounded-md"
            />
          </template>

          <UiResult
            v-else-if="!activeSheets.length"
            status="info"
            :title="NEXUS_SHEET_EMPTY_TITLE"
          />

          <template v-else>
            <UButton
              v-for="sheet in activeSheets"
              :key="sheet.id"
              block
              color="neutral"
              variant="subtle"
              icon="tabler:user"
              class="justify-start"
              :disabled="busy"
              :label="sheet.name"
              @click.left.exact.prevent="
                pickOwn(sheet.id, sheet.name, sheet.shareToken)
              "
            />
          </template>
        </div>

        <div
          v-else
          class="flex flex-col gap-2"
        >
          <template v-if="areOthersLoading">
            <USkeleton
              v-for="index in 3"
              :key="index"
              class="h-12 w-full rounded-md"
            />
          </template>

          <UiResult
            v-else-if="!savedSheets.length"
            status="info"
            :title="NEXUS_SHEET_EMPTY_TITLE"
          />

          <template v-else>
            <!-- Лист с отозванной ссылкой оставляем видимым, но недоступным:
              иначе непонятно, куда он делся из списка -->
            <UTooltip
              v-for="sheet in savedSheets"
              :key="sheet.id"
              :text="sheet.available ? '' : NEXUS_SHEET_UNAVAILABLE_HINT"
            >
              <UButton
                block
                color="neutral"
                variant="subtle"
                icon="tabler:user-share"
                class="justify-start"
                :disabled="busy || !sheet.available"
                :label="sheet.name"
                @click.left.exact.prevent="
                  emit('submit', sheet.shareToken, sheet.name)
                "
              />
            </UTooltip>
          </template>
        </div>
      </div>
    </template>
  </UModal>
</template>
