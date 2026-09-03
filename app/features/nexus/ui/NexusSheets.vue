<script setup lang="ts">
  import type { Nexus, NexusMember, NexusSheet } from '../model';

  import { CharacterSheetDrawer } from '~character-sheet/drawer';
  import { UiResult } from '~ui/result';

  import {
    NEXUS_SHEET_ADD_LABEL,
    NEXUS_SHEET_OPEN_LABEL,
    NEXUS_SHEET_REMOVE_LABEL,
    NEXUS_SHEET_TRANSFER_HINT,
    NEXUS_SHEET_TRANSFER_LABEL,
    NEXUS_SHEET_TRANSFER_TITLE,
    NEXUS_SHEETS_EMPTY_DESCRIPTION,
    NEXUS_SHEETS_EMPTY_TITLE,
  } from '../model';

  /**
   * Персонажи за столом.
   *
   * Лист открывается тем же дровером, что и в справочнике: свой справочник
   * листов комната не заводит — она лишь показывает, чей персонаж играет.
   */
  const { nexus, sheets, members, currentUserId } = defineProps<{
    nexus: Nexus;
    sheets: ReadonlyArray<NexusSheet>;
    /** Состав комнаты: кому владелец может передать лист. */
    members: ReadonlyArray<NexusMember>;
    currentUserId: string | null;
    /** Отображаемое имя участника; сырой UUID показывать нельзя. */
    getMemberName: (userId: string) => string;
    loading?: boolean;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    add: [];
    remove: [sheetId: string];
    transfer: [sheetId: string, ownerId: string];
  }>();

  const overlay = useOverlay();

  const transferSheetId = ref<string | null>(null);

  const isTransferOpen = computed({
    get: () => !!transferSheetId.value,
    set: (opened: boolean) => {
      if (!opened) {
        transferSheetId.value = null;
      }
    },
  });

  // Передать лист можно любому участнику, кроме нынешнего владельца: это
  // ничего не изменило бы.
  const transferTargets = computed(() => {
    const sheet = sheets.find((item) => item.id === transferSheetId.value);

    return members.filter((member) => member.userId !== sheet?.ownerId);
  });

  /**
   * Открывает лист рядом со столом.
   * @param shareToken Токен общего доступа листа.
   */
  function openSheet(shareToken: string): void {
    const drawer = overlay.create(CharacterSheetDrawer, {
      props: {
        shareToken,
        onClose: () => drawer.close(),
      },
      destroyOnClose: true,
    });

    drawer.open();
  }

  /**
   * Спрашивает, кому передать лист.
   * @param sheetId Идентификатор листа в комнате.
   */
  function askTransfer(sheetId: string): void {
    transferSheetId.value = sheetId;
  }

  /**
   * Передаёт лист выбранному участнику.
   * @param ownerId Кому переходит лист.
   */
  function transfer(ownerId: string): void {
    const sheetId = transferSheetId.value;

    if (sheetId) {
      emit('transfer', sheetId, ownerId);
      transferSheetId.value = null;
    }
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <UButton
      size="sm"
      icon="tabler:user-plus"
      class="self-start"
      :disabled="busy"
      :label="NEXUS_SHEET_ADD_LABEL"
      @click.left.exact.prevent="emit('add')"
    />

    <div
      v-if="loading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 2"
        :key="index"
        class="h-14 w-full rounded-md"
      />
    </div>

    <UiResult
      v-else-if="!sheets.length"
      status="info"
      :title="NEXUS_SHEETS_EMPTY_TITLE"
      :sub-title="NEXUS_SHEETS_EMPTY_DESCRIPTION"
    />

    <div
      v-else
      class="flex flex-col gap-2"
    >
      <div
        v-for="sheet in sheets"
        :key="sheet.id"
        class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-default p-3"
      >
        <span class="flex min-w-0 flex-col">
          <span class="font-medium text-highlighted">
            {{ sheet.characterName }}
          </span>

          <span class="text-sm text-muted">
            {{ getMemberName(sheet.ownerId) }}
          </span>
        </span>

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            size="sm"
            color="neutral"
            variant="subtle"
            icon="tabler:file-text"
            :label="NEXUS_SHEET_OPEN_LABEL"
            @click.left.exact.prevent="openSheet(sheet.shareToken)"
          />

          <!-- Персонажей за столом раздаёт владелец комнаты -->
          <UButton
            v-if="nexus.owner"
            size="sm"
            color="neutral"
            variant="subtle"
            icon="tabler:user-share"
            :disabled="busy"
            :label="NEXUS_SHEET_TRANSFER_LABEL"
            @click.left.exact.prevent="askTransfer(sheet.id)"
          />

          <UButton
            v-if="sheet.canRemove"
            size="sm"
            color="error"
            variant="subtle"
            icon="tabler:x"
            :disabled="busy"
            :label="NEXUS_SHEET_REMOVE_LABEL"
            @click.left.exact.prevent="emit('remove', sheet.id)"
          />
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isTransferOpen"
      :title="NEXUS_SHEET_TRANSFER_TITLE"
      :description="NEXUS_SHEET_TRANSFER_HINT"
    >
      <template #body>
        <div class="flex flex-col gap-2">
          <UButton
            v-for="member in transferTargets"
            :key="member.userId"
            block
            color="neutral"
            variant="subtle"
            icon="tabler:user"
            class="justify-start"
            :disabled="busy"
            :label="
              member.userId === currentUserId
                ? `${getMemberName(member.userId)} (вы)`
                : getMemberName(member.userId)
            "
            @click.left.exact.prevent="transfer(member.userId)"
          />
        </div>
      </template>
    </UModal>
  </section>
</template>
